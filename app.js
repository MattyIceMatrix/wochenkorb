"use strict";
(function(){
/* =========================================================================
   Wochenkorb: static app. No server, no accounts, no third-party scripts.
   All text rendered from data or user input goes through esc()/textContent.
   ========================================================================= */
const RAW = window.__WK_DATA__;
delete window.__WK_DATA__;

/* ---------------- tiny in-page database with a query builder ------------- */
const DB = (function(){
  const tables = {};
  const byId = new Map();
  function load(name, rows){
    const frozen = rows.map(r => Object.freeze(Object.assign({}, r)));
    tables[name] = Object.freeze(frozen);
    frozen.forEach(r => byId.set(r.id, Object.freeze({table:name,row:r})));
  }
  const fold = s => String(s == null ? "" : s).toLowerCase()
      .replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/ß/g,"ss")
      .normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();
  function textOf(r){ return fold([r.name, r.de, r.category, r.store, r.chain, r.town, r.street].concat(r.tags||[]).join(" ")); }
  class Query{
    constructor(t){ this.rows = (tables[t]||[]).slice(); }
    where(fn){ this.rows = this.rows.filter(fn); return this; }
    eq(k,v){ if(v!=null && v!=="All") this.rows = this.rows.filter(r => r[k]===v); return this; }
    search(q){
      const terms = fold(q).split(/\s+/).filter(Boolean);
      if(terms.length) this.rows = this.rows.filter(r => { const t = textOf(r); return terms.every(x => t.includes(x)); });
      return this;
    }
    orderBy(key, dir){ const m = dir==="desc"?-1:1;
      this.rows.sort((a,b)=>{ const x=typeof key==="function"?key(a):a[key], y=typeof key==="function"?key(b):b[key];
        return (x>y?1:x<y?-1:0)*m; }); return this; }
    limit(n){ this.rows = this.rows.slice(0,n); return this; }
    all(){ return this.rows; }
    first(){ return this.rows[0] || null; }
    count(){ return this.rows.length; }
  }
  return Object.freeze({
    load, fold,
    from: t => new Query(t),
    get: id => { const h = byId.get(id); return h ? h.row : null; },
    tableOf: id => { const h = byId.get(id); return h ? h.table : null; },
    /* best match for a free-text grocery name, returns {row,score} */
    match(term){
      const f = fold(term); if(f.length<2) return null;
      let best=null;
      for(const t of ["offers","staples"]){
        for(const r of tables[t]){
          let s=0;
          for(const tag of r.tags||[]){ const g=fold(tag);
            if(g===f){s=Math.max(s,3);break;}
            if(f.length>=3 && (g.split(/[\s-]+/).includes(f)||f.split(/[\s-]+/).includes(g))) s=Math.max(s,2);
            else if(f.length>=4 && (g.includes(f)||(f.includes(g)&&g.length>=4))) s=Math.max(s,1);
          }
          if(fold(r.name)===f) s=4;
          if(!s && f.length>=4 && fold(r.name).includes(f)) s=1;
          if(!s) continue;
          const bonus = t==="offers"?0.5:0;
          const price = t==="offers"?r.price:Math.min(r.priceAldi,r.priceLidl);
          const score = s+bonus;
          if(!best || score>best.score || (score===best.score && price<best.price)) best={row:r,score,price};
        }
      }
      return best;
    }
  });
})();
DB.load("offers", RAW.offers);
DB.load("staples", RAW.staples);
DB.load("stores", RAW.stores);
DB.load("recipes", RAW.recipes);
DB.load("homes", RAW.homes);
const META = Object.freeze(RAW.meta);

/* ---------------- helpers ---------------- */
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? "" : s).replace(/[&<>"'`]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;","`":"&#96;"}[c]));
const eur = n => (Math.round((+n||0)*100)/100).toFixed(2).replace(".",",")+" €";
const clamp = (n,a,b) => Math.min(b,Math.max(a,n));
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const HOLIDAYS = {"2026-10-03":"Tag der Deutschen Einheit","2026-11-01":"Allerheiligen","2026-12-25":"1. Weihnachtstag","2026-12-26":"2. Weihnachtstag","2027-01-01":"Neujahr","2027-03-26":"Karfreitag","2027-03-29":"Ostermontag","2027-05-01":"Tag der Arbeit","2027-05-06":"Christi Himmelfahrt","2027-05-17":"Pfingstmontag","2027-05-27":"Fronleichnam"};
const fmtD = iso => { const [y,m,d]=iso.split("-"); return d+"."+m+"."; };
function addDays(iso,n){ const d=new Date(iso+"T12:00:00Z"); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0,10); }
const WEEK_DATES = DAYS.map((_,i)=>addDays(META.validFrom,i));
function berlinNow(){
  const p = new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Berlin",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",weekday:"short",hour12:false}).formatToParts(new Date());
  const g = t => (p.find(x=>x.type===t)||{}).value;
  return {date:g("year")+"-"+g("month")+"-"+g("day"), wd:g("weekday"), mins:(+g("hour")%24)*60+(+g("minute"))};
}

/* icons (24px stroke) */
const I = {
  home:'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  tag:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
  list:'<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',
  pot:'<path d="M4 10h16v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M2 10h20"/><path d="M9 6c0-1 1-1 1-2M14 6c0-1 1-1 1-2"/>',
  pin:'<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', check:'<path d="M5 12l5 5L20 7"/>', x:'<path d="M6 6l12 12M18 6L6 18"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>', chev:'<path d="M6 9l6 6 6-6"/>',
  copy:'<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h9"/>',
  alert:'<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>', clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  play:'<path d="M7 4l13 8-13 8z"/>', pause:'<path d="M7 4v16M17 4v16"/>', reset:'<path d="M4 4v6h6"/><path d="M5 10a8 8 0 1 1 2 6"/>',
  nav:'<path d="M3 11l18-8-8 18-2-8z"/>', cart:'<path d="M3 4h2l2 12h11l2-8H6.5"/><circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/>',
  Meat:'<path d="M14.5 3.5a6 6 0 0 1 6 6c0 3.5-3.5 6-7 6l-3 3"/><path d="M14.5 3.5c-3 0-6 3-6 7l-3 3"/><circle cx="5" cy="19" r="2"/><path d="M5.5 13.5l5 5"/>',
  Fish:'<path d="M2 12c4-5 9-7 13-5 3 1 5 3 7 5-2 2-4 4-7 5-4 2-9 0-13-5z"/><path d="M2 12l-0 0"/><circle cx="16.5" cy="11" r="1"/>',
  Dairy:'<path d="M8 2h8v3l2 4v13H6V9l2-4z"/><path d="M6 10h12"/>',
  Cheese:'<path d="M3 17l17-8v10H3z"/><path d="M3 17l7-9 10 1"/><circle cx="9" cy="15" r="1"/><circle cx="15" cy="15.5" r="1.3"/>',
  Produce:'<path d="M12 8c-3-2-8-1-8 5 0 5 4 8 6 8 1 0 1-.5 2-.5s1 .5 2 .5c2 0 6-3 6-8 0-6-5-7-8-5z"/><path d="M12 8c0-2 1-4 3-5"/>',
  Bakery:'<path d="M5 11a4 4 0 0 1 2-7h10a4 4 0 0 1 2 7v9H5z"/><path d="M9 8v3M13 8v3"/>',
  Pantry:'<rect x="6" y="3" width="12" height="4" rx="1"/><path d="M6 7h12v14H6z"/><path d="M6 12h12"/>',
  Frozen:'<path d="M12 2v20M3.5 7l17 10M20.5 7l-17 10"/><path d="M9 3l3 2 3-2M9 21l3-2 3 2"/>',
  Drinks:'<path d="M10 2h4v4l2 3v13H8V9l2-3z"/><path d="M8 13h8"/>',
  Snacks:'<circle cx="12" cy="9" r="6"/><path d="M12 15v7"/><path d="M8 9a4 4 0 0 1 4-4"/>',
  "Coffee & tea":'<path d="M4 9h13v4a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6z"/><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3v3M12 3v3"/>',
  Breakfast:'<path d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M8 7c0-2 2-2 2-4M14 7c0-2 2-2 2-4"/>',
  Household:'<rect x="4" y="4" width="11" height="16" rx="2"/><circle cx="9.5" cy="12" r="2.5"/><path d="M15 8h5v8h-5"/>',
  Added:'<path d="M12 5v14M5 12h14"/>',
  swap:'<path d="M7 7h13l-3-3M17 17H4l3 3"/>',
  send:'<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>',
  chat:'<path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.7-5.2A8.5 8.5 0 1 1 21 12z"/>'
};
const svg = (k,extra) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"'+(extra||"")+'>'+(I[k]||I.Pantry)+'</svg>';
const CATCOL = {Meat:"tomato",Fish:"sky",Dairy:"sky",Cheese:"mango",Produce:"basil",Bakery:"mango",Pantry:"plum",Frozen:"sky",Drinks:"basil",Snacks:"tomato","Coffee & tea":"plum",Breakfast:"mango",Household:"plum",Added:"plum"};
const HERO_COL = {tomato:["#F2482B","#FFB020","#8E1F0E"],mango:["#F59E0B","#F2482B","#8A4B00"],basil:["#12A061","#FFB020","#0A5E39"],sky:["#2F7BE8","#12A061","#173E7A"]};

/* ---------------- state: per-device, validated on load ---------------- */
const KEY = "wochenkorb.v2";
const DEFAULT_FAVS = ["chicken","Hackfleisch","pasta","rice","potatoes","eggs","milk","cheese","bread","broccoli","bananas","apples","yogurt","coffee"];
const DEFAULT_LANG = (()=>{ try{ return /^de/i.test(navigator.language||"") ? "de" : "en"; }catch(e){ return "en"; } })();
function freshState(){ return {v:2, lang:DEFAULT_LANG, week:META.validFrom, favorites:DEFAULT_FAVS.slice(), budget:160, big:true, home:"Bolanden",
  items:{}, custom:[], checked:[], storePick:{}, menu:{}, favIds:{}, tab:"home", seeded:false}; }
function isListable(id){ const tb=typeof id==="string"?DB.tableOf(id):null; return tb==="offers"||tb==="staples"; }
function sanitize(s){
  const d = freshState(); if(!s || typeof s!=="object") return d;
  const str = (x,n) => typeof x==="string" ? x.slice(0,n) : null;
  if(Array.isArray(s.favorites)) d.favorites = s.favorites.map(x=>str(x,60)).filter(Boolean).slice(0,60);
  if(s.favIds && typeof s.favIds==="object") for(const [k,v] of Object.entries(s.favIds)) if(typeof k==="string"&&k.length<=80&&isListable(v)) d.favIds[k]=v;
  if(typeof s.budget==="number" && isFinite(s.budget)) d.budget = clamp(Math.round(s.budget),0,2000);
  d.big = !!s.big;
  if(s.lang==="de"||s.lang==="en") d.lang = s.lang;
  if(s.home==="Kaiserslautern"||s.home==="Bolanden") d.home = s.home;
  if(["home","deals","list","recipes","stores"].includes(s.tab)) d.tab = s.tab;
  d.seeded = !!s.seeded;
  const sameWeek = s.week===META.validFrom;
  if(s.items && typeof s.items==="object") for(const [k,v] of Object.entries(s.items)){
    if(isListable(k) && Number.isInteger(v) && v>0) d.items[k]=clamp(v,1,99);
  }
  if(Array.isArray(s.custom)) d.custom = s.custom.slice(0,100).map(c=>({
      id: typeof c.id==="string" && /^c-[a-z0-9]{1,16}$/.test(c.id) ? c.id : null,
      name: str(c.name,60), price: clamp(+c.price||0,0,500), store: c.store==="LIDL"?"LIDL":"ALDI", qty: clamp(parseInt(c.qty)||1,1,99)
    })).filter(c=>c.id&&c.name);
  if(sameWeek && Array.isArray(s.checked)) d.checked = s.checked.filter(x=>typeof x==="string").slice(0,300);
  if(s.storePick && typeof s.storePick==="object") for(const [k,v] of Object.entries(s.storePick)) if(DB.tableOf(k)==="staples"&&(v==="ALDI"||v==="LIDL")) d.storePick[k]=v;
  if(sameWeek && s.menu && typeof s.menu==="object") for(const [k,v] of Object.entries(s.menu)) if(/^[0-6]$/.test(k) && DB.tableOf(v)==="recipes") d.menu[k]=v;
  return d;
}
let S;
try{ S = sanitize(JSON.parse(localStorage.getItem(KEY)||"null")); }catch(e){ S = freshState(); }
let saveT=null;
function save(){ clearTimeout(saveT); saveT=setTimeout(()=>{ try{ S.week=META.validFrom; localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){} },120); }

/* ---------------- domain logic ---------------- */
const isOffer = r => DB.tableOf(r.id)==="offers";
function storeOf(r){
  if(isOffer(r)) return r.store;
  if(S.storePick[r.id]) return S.storePick[r.id];
  return r.priceLidl<r.priceAldi ? "LIDL" : "ALDI";
}
function priceOf(r){ if(isOffer(r)) return r.price; return storeOf(r)==="LIDL"?r.priceLidl:r.priceAldi; }
function favQtyFor(r,big){ const b=r.weeklyQty||1; return b>=2 ? Math.ceil(b*(big?1.25:1)-0.001) : b; }
function favQty(r){ return favQtyFor(r,S.big); }
function favMatches(){ return S.favorites.map(f=>{ const pin=S.favIds[DB.fold(f)]; return {fav:f, m: pin&&DB.get(pin) ? {row:DB.get(pin)} : DB.match(f)}; }); }
function seedFromFavorites(merge){
  if(!merge) S.items={};
  for(const {m} of favMatches()) if(m && !S.items[m.row.id]) S.items[m.row.id]=favQty(m.row);
  S.seeded=true;
}
function lines(){
  const out=[];
  for(const [id,q] of Object.entries(S.items)){ const r=DB.get(id); if(!r) continue;
    out.push({id, name:r.name, size:r.size, cat:r.category, store:storeOf(r), price:priceOf(r), qty:q, sale:isOffer(r), swap:!isOffer(r), row:r}); }
  for(const c of S.custom) out.push({id:c.id, name:c.name, size:"", cat:"Added", store:c.store, price:c.price, qty:c.qty, sale:false, custom:true});
  return out;
}
function totals(L){
  const total=L.reduce((a,l)=>a+l.price*l.qty,0);
  const sale=L.filter(l=>l.sale).reduce((a,l)=>a+l.price*l.qty,0);
  const b=S.budget||0; const state=!b?"ok":total>b?"bad":total>b*.9?"warn":"ok";
  return {total,sale,b,state,left:b-total,count:L.reduce((a,l)=>a+l.qty,0)};
}
function recipeCost(r){
  let cost=0, deals=0;
  for(const [ref,, ,frac] of r.ing){ if(!ref) continue; const it=DB.get(ref); if(!it) continue;
    cost += priceOf(it)*frac; if(isOffer(it)) deals++; }
  return {cost, per:cost/4, deals};
}
function addRecipeToList(r){
  let n=0;
  for(const [ref,, ,frac] of r.ing){ if(!ref||!frac) continue; const need=Math.max(1,Math.ceil(frac-0.001));
    const cur=S.items[ref]||0; if(cur<need){ S.items[ref]=need; n++; } }
  return n;
}
function addMenuToList(){
  const need={};
  for(const rid of Object.values(S.menu)){ const r=DB.get(rid); if(!r) continue;
    for(const [ref,, ,frac] of r.ing) if(ref&&frac) need[ref]=(need[ref]||0)+frac; }
  let n=0; for(const [ref,f] of Object.entries(need)){ const q=Math.max(1,Math.ceil(f-0.001)); if((S.items[ref]||0)<q){S.items[ref]=q;n++;} }
  return n;
}
function haversine(a,b){ const R=6371, t=x=>x*Math.PI/180; const dLa=t(b.lat-a.lat), dLo=t(b.lng-a.lng);
  const h=Math.sin(dLa/2)**2+Math.cos(t(a.lat))*Math.cos(t(b.lat))*Math.sin(dLo/2)**2; return 2*R*Math.asin(Math.sqrt(h)); }
function home(){ return DB.get(S.home); }
const wdIdx = iso => (new Date(iso+"T12:00:00Z").getUTCDay()+6)%7;
function nextOpenDay(fromIso){ for(let k=1;k<=8;k++){ const d=addDays(fromIso,k); if(wdIdx(d)!==6 && !HOLIDAYS[d]) return wdIdx(d); } return 0; }
function storeStatus(st){
  const n=berlinNow(); const toM=s=>{const [h,m]=s.split(":");return +h*60+ +m;};
  const o=toM(st.open), c=toM(st.close);
  if(HOLIDAYS[n.date]) return {open:false,code:"st_holiday_next",day:nextOpenDay(n.date),time:st.open};
  if(n.wd==="Sun") return {open:false,code:"st_closed_next",day:nextOpenDay(n.date),time:st.open};
  if(n.mins<o) return {open:false,code:"st_opens",time:st.open};
  if(n.mins>=c) return {open:false,code:"st_closed_next",day:nextOpenDay(n.date),time:st.open};
  if(c-n.mins<=45) return {open:true,soon:true,code:"st_closes",time:st.close};
  return {open:true,code:"st_open",time:st.close};
}
function storesNear(){ const h=home();
  return DB.from("stores").all().map(s=>({s,km:haversine(h,s)})).sort((a,b)=>a.km-b.km); }
function nearest(chain){ return storesNear().find(x=>x.s.chain===chain&&x.s.area===S.home) || storesNear().find(x=>x.s.chain===chain); }
function mapsUrl(st){ return "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(st.chain+" "+st.street+", "+st.zip+" "+st.town)+"&query_place_id="+encodeURIComponent(st.placeId); }


/* ---------------- language ---------------- */
const STR = {
  en:{
    tab_home:"Home", tab_deals:"Deals", tab_list:"List", tab_recipes:"Recipes", tab_stores:"Stores",
    lang_btn:"DE", lang_aria:"Auf Deutsch umschalten", loc_aria:"Change your location",
    toast_added:"Added to your list", toast_loc:"Location: {x}",
    hero_deals:"{n} deals", hero_rest:"this week at ALDI & LIDL",
    hero_list:"Your list is {total} for {n} items.", hero_left:"{left} left in your {b} budget.", hero_over:"That is {over} over budget.",
    open_list:"Open my list", deal_recipes:"Deal recipes", of_budget:"of budget", budget_used:"{p}% of budget used",
    deals_for_you:"Deals for you", see_all:"See all {n}",
    dinners_title:"This week's dinners", dinners_sub:"{n} of 7 planned. Tap a day to choose a recipe.",
    shop_menu:"Shop for this menu", fill_week:"Fill the week for me", today:"today", plan_dinner:"+ Plan dinner", tap_plan:"tap to plan",
    nearest:"Nearest stores", all_stores:"All stores",
    hol_is:"{day} {date} is {name}", hol_tail:"Stores are closed that day, so plan your shopping around it.",
    stale:"These deals ended on {date} New deals arrive Monday morning; your list still works with shelf prices.",
    offline:"You're offline. Showing the deals saved on this phone.",
    valid:"valid Mon {from} – Sat {to}", weekly_deals:"Weekly deals", search_ph:"Search: cheese, Käse, pasta, Kaffee…", search_lbl:"Search deals",
    all:"All", sort_price:"Cheapest first", sort_aisle:"By aisle", sort_name:"A–Z", n_deals:"{n} deals", store:"Store", category:"Category",
    no_deals:"No deals match. Try another word or clear the filters.",
    one_less:"One less", one_more:"One more", add_x:"Add {x} to list",
    household:"Household of 4", list_title:"Shopping list", copy:"Copy", share_list:"Send list", remove_ticked:"Remove {n} ticked",
    total:"Total", on_budget:"On budget", near_budget:"Close to budget", over_budget:"Over budget", budget:"Budget", left:"Left", over_by:"Over by", on_sale:"On sale", packs:"packs",
    fav_budget:"Favorites & budget", fav_label:"Favorite groceries", fav_ph:"Add, then Enter (English or German)",
    no_price_for:"No price for: {x}. Add it below with the price you see.", all_priced:"Every favorite has a price this week.",
    rebuild:"Rebuild list from favorites", merge:"Add missing favorites", weekly_budget:"Weekly budget",
    big:"Big appetites", big_sub:"Four near-grown adults, +25% on bulk items",
    items_n:"{n} items", nothing_here:"Nothing to buy here yet.", got_x:"Got {x}",
    angebot:"ANGEBOT", your_price:"your price", shelf:"shelf price", other_store:"Buy at the other store", subtotal:"Subtotal",
    add_else:"Add something else", add_name_ph:"Item, e.g. Avocados", add_price_ph:"Price €", add:"Add",
    rec_eyebrow:"Built from {w} deals · serves 4", rec_title:"Deal recipes",
    f_all:"All", f_dinner:"Dinner", f_breakfast:"Breakfast", f_quick:"Under 30 min", f_deals:"Most deals",
    deals_n:"{n} deals", deal_1:"1 deal", per_person:"{x} per person", in_week:"In week", add_week:"+ Week", recipe:"Recipe",
    meal_Dinner:"Dinner", meal_Breakfast:"Breakfast", lvl_Easy:"Easy", lvl_Medium:"Medium", min:"min",
    stores_eyebrow:"Hours Mon–Sat · Sundays and holidays closed", stores_title:"Stores near you", your_loc:"Your location",
    km_from:"km from {x}", directions:"Directions", map_aria:"Map of stores around Bolanden and Kaiserslautern",
    stores_note:"Weekly Prospekt deals are the same across ALDI SÜD and LIDL stores in the region, but stock varies by branch. Bolanden has no discounter of its own; the nearest are in Kirchheimbolanden.",
    st_holiday:"Closed today (holiday)", st_sunday:"Closed Sunday · opens Mon {t}", st_opens:"Opens {t}", st_closed:"Closed · opens {t}", st_closes:"Closes {t}", st_open:"Open until {t}",
    foot1:"Deal prices from the {w} ALDI SÜD and LIDL Prospekte (updated {d}). \"Shelf price\" items use typical everyday discounter prices and are estimates. Fresh meat and produce deals are published on Monday.",
    foot2:"Check the originals:", foot3:"Your list stays on this phone. Nothing is sent anywhere unless you send it.",
    close:"Close", start_cooking:"Start cooking", ing_to_list:"Add ingredients to list", ingredients:"Ingredients", method:"Method",
    ing_note:"Red dot = on sale this week. Cost counts only the share of each pack the recipe uses.", pantry:"from your pantry",
    serves4:"Serves 4", total_x:"{x} total", per_x:"{x} / person", in_menu:"In this week's menu", add_menu:"+ Add to this week's menu",
    pick_dinner:"Pick a dinner", clear_day:"Clear {d}",
    cook_mode:"Cook mode", leave_cook:"Leave cook mode", step_of:"Step {i} of {n}", start_timer:"Start timer", pause:"Pause", reset_timer:"Reset timer",
    back:"Back", next:"Next step", done:"Done, enjoy!",
    t_moved:"Moved to {x}", t_ticked:"Ticked items removed", t_rebuilt:"List rebuilt from favorites", t_favs:"Favorites added",
    t_day:"{d}: {x}", t_menu_n:"{n} ingredients added for the menu", t_menu_0:"Everything for the menu is already on your list",
    t_rec_n:"{n} ingredients added", t_rec_0:"All ingredients already on your list", t_week_rm:"Removed from the week", t_week_full:"The week is full. Clear a day on Home first.",
    t_planned:"Planned for {d}", t_auto:"7 dinners planned. Tap a day to change it.", t_copied:"List copied. Paste it into WhatsApp or Notes.", t_copy_fail:"Copy was blocked on this device",
    t_more:"Quantities increased", t_normal:"Normal quantities", t_added:"Added {x}", t_noprice:"No price found for {x}", t_price_range:"Enter a price between 0 and 500 €", t_full:"Your list is full",
    t_link:"Link copied. Paste it into WhatsApp.",
    share_title:"Send your list", share_sub:"Send it as a link: it opens in Wochenkorb on the other phone with every item, amount and the week's dinners.",
    share_native:"Share…", share_wa:"Send with WhatsApp", share_copy_link:"Copy link", share_copy_text:"Copy as plain text",
    share_msg:"Our shopping list for this week ({n} items, {total}). Open it in Wochenkorb:",
    imp_title:"A shopping list was shared with you", imp_sub:"{n} items · {total}{menu}", imp_menu:" · {n} dinners planned",
    imp_replace:"Use this list", imp_merge:"Add to my list", imp_ignore:"Ignore", imp_old:"This list is from an older week. Items that are no longer on sale were added with the price from that week; its dinners were not copied.",
    t_imported:"List loaded", t_merged:"Items added to your list",
    copy_head:"Shopping list", copy_total:"Total",
    add_item:"Add to list", add_search_ph:"Type a product: Milch, chicken, Käse…", add_own:"Add with this price", sug_none:"Not in this week's data. Enter the price you see and tap add.",
    on_list:"on list", buy_at:"Buy at {x} instead",
    planned_now:"Planned now", or_pick:"Or pick another dinner:", sort:"Sort", sections:"Sections", mon_sat:"Mon–Sat", no_budget:"No budget set",
    st_holiday_next:"Closed today (holiday) · opens {d} {t}", st_closed_next:"Closed · opens {d} {t}"
  },
  de:{
    tab_home:"Start", tab_deals:"Angebote", tab_list:"Liste", tab_recipes:"Rezepte", tab_stores:"Märkte",
    lang_btn:"EN", lang_aria:"Switch to English", loc_aria:"Standort wechseln",
    toast_added:"Zur Liste hinzugefügt", toast_loc:"Standort: {x}",
    hero_deals:"{n} Angebote", hero_rest:"diese Woche bei ALDI & LIDL",
    hero_list:"Deine Liste kostet {total} für {n} Artikel.", hero_left:"Noch {left} von {b} Budget übrig.", hero_over:"Das sind {over} über Budget.",
    open_list:"Meine Liste", deal_recipes:"Angebots-Rezepte", of_budget:"vom Budget", budget_used:"{p} % des Budgets verbraucht",
    deals_for_you:"Angebote für dich", see_all:"Alle {n} ansehen",
    dinners_title:"Abendessen dieser Woche", dinners_sub:"{n} von 7 geplant. Tippe auf einen Tag, um ein Rezept zu wählen.",
    shop_menu:"Für dieses Menü einkaufen", fill_week:"Woche für mich planen", today:"heute", plan_dinner:"+ Abendessen planen", tap_plan:"zum Planen tippen",
    nearest:"Nächste Märkte", all_stores:"Alle Märkte",
    hol_is:"{day} {date} ist {name}", hol_tail:"Die Märkte sind an diesem Tag geschlossen, also Einkauf entsprechend planen.",
    stale:"Diese Angebote endeten am {date} Neue Angebote kommen Montagfrüh; deine Liste funktioniert weiter mit Regalpreisen.",
    offline:"Du bist offline. Es werden die auf diesem Handy gespeicherten Angebote angezeigt.",
    valid:"gültig Mo {from} – Sa {to}", weekly_deals:"Wochenangebote", search_ph:"Suchen: Käse, Nudeln, Kaffee…", search_lbl:"Angebote suchen",
    all:"Alle", sort_price:"Günstigste zuerst", sort_aisle:"Nach Regal", sort_name:"A–Z", n_deals:"{n} Angebote", store:"Markt", category:"Kategorie",
    no_deals:"Keine Treffer. Anderes Wort versuchen oder Filter zurücksetzen.",
    one_less:"Eins weniger", one_more:"Eins mehr", add_x:"{x} zur Liste hinzufügen",
    household:"4-Personen-Haushalt", list_title:"Einkaufsliste", copy:"Kopieren", share_list:"Liste senden", remove_ticked:"{n} abgehakte entfernen",
    total:"Gesamt", on_budget:"Im Budget", near_budget:"Fast am Budget", over_budget:"Über Budget", budget:"Budget", left:"Übrig", over_by:"Drüber", on_sale:"Im Angebot", packs:"Packungen",
    fav_budget:"Favoriten & Budget", fav_label:"Lieblingsprodukte", fav_ph:"Eingeben, dann Enter (Deutsch oder Englisch)",
    no_price_for:"Kein Preis für: {x}. Unten mit dem Preis aus dem Markt hinzufügen.", all_priced:"Alle Favoriten haben diese Woche einen Preis.",
    rebuild:"Liste aus Favoriten neu erstellen", merge:"Fehlende Favoriten hinzufügen", weekly_budget:"Wochenbudget",
    big:"Großer Hunger", big_sub:"Vier fast erwachsene Esser, +25 % bei Grundnahrungsmitteln",
    items_n:"{n} Artikel", nothing_here:"Hier noch nichts zu kaufen.", got_x:"{x} erledigt",
    angebot:"ANGEBOT", your_price:"dein Preis", shelf:"Regalpreis", other_store:"Im anderen Markt kaufen", subtotal:"Zwischensumme",
    add_else:"Etwas anderes hinzufügen", add_name_ph:"Artikel, z. B. Avocados", add_price_ph:"Preis €", add:"Hinzufügen",
    rec_eyebrow:"Aus den Angeboten {w} · für 4 Personen", rec_title:"Angebots-Rezepte",
    f_all:"Alle", f_dinner:"Abendessen", f_breakfast:"Frühstück", f_quick:"Unter 30 Min.", f_deals:"Meiste Angebote",
    deals_n:"{n} Angebote", deal_1:"1 Angebot", per_person:"{x} pro Person", in_week:"In der Woche", add_week:"+ Woche", recipe:"Rezept",
    meal_Dinner:"Abendessen", meal_Breakfast:"Frühstück", lvl_Easy:"Einfach", lvl_Medium:"Mittel", min:"Min.",
    stores_eyebrow:"Mo–Sa geöffnet · Sonn- und Feiertage geschlossen", stores_title:"Märkte in deiner Nähe", your_loc:"Dein Standort",
    km_from:"km von {x}", directions:"Route", map_aria:"Karte der Märkte um Bolanden und Kaiserslautern",
    stores_note:"Die Prospekt-Angebote gelten in allen ALDI-SÜD- und LIDL-Filialen der Region, der Bestand kann aber je Filiale abweichen. Bolanden hat keinen eigenen Discounter; die nächsten sind in Kirchheimbolanden.",
    st_holiday:"Heute geschlossen (Feiertag)", st_sunday:"Sonntag geschlossen · Mo ab {t}", st_opens:"Öffnet {t}", st_closed:"Geschlossen · öffnet {t}", st_closes:"Schließt {t}", st_open:"Geöffnet bis {t}",
    foot1:"Angebotspreise aus den Prospekten {w} von ALDI SÜD und LIDL (Stand {d}). Artikel mit „Regalpreis“ nutzen übliche Discounter-Preise und sind Schätzungen. Frische Fleisch- und Obst-Angebote erscheinen montags.",
    foot2:"Originale ansehen:", foot3:"Deine Liste bleibt auf diesem Handy. Nichts wird verschickt, außer du sendest sie.",
    close:"Schließen", start_cooking:"Kochen starten", ing_to_list:"Zutaten auf die Liste", ingredients:"Zutaten", method:"Zubereitung",
    ing_note:"Roter Punkt = diese Woche im Angebot. Die Kosten zählen nur den Anteil jeder Packung, den das Rezept braucht.", pantry:"aus dem Vorrat",
    serves4:"Für 4", total_x:"{x} gesamt", per_x:"{x} / Person", in_menu:"Im Wochenmenü", add_menu:"+ Zum Wochenmenü",
    pick_dinner:"Abendessen wählen", clear_day:"{d} leeren",
    cook_mode:"Kochmodus", leave_cook:"Kochmodus beenden", step_of:"Schritt {i} von {n}", start_timer:"Timer starten", pause:"Pause", reset_timer:"Timer zurücksetzen",
    back:"Zurück", next:"Nächster Schritt", done:"Fertig, guten Appetit!",
    t_moved:"Verschoben zu {x}", t_ticked:"Abgehakte Artikel entfernt", t_rebuilt:"Liste aus Favoriten neu erstellt", t_favs:"Favoriten hinzugefügt",
    t_day:"{d}: {x}", t_menu_n:"{n} Zutaten für das Menü hinzugefügt", t_menu_0:"Alles für das Menü steht schon auf der Liste",
    t_rec_n:"{n} Zutaten hinzugefügt", t_rec_0:"Alle Zutaten stehen schon auf der Liste", t_week_rm:"Aus der Woche entfernt", t_week_full:"Die Woche ist voll. Leere zuerst einen Tag auf der Startseite.",
    t_planned:"Geplant für {d}", t_auto:"7 Abendessen geplant. Tippe auf einen Tag, um es zu ändern.", t_copied:"Liste kopiert. In WhatsApp oder Notizen einfügen.", t_copy_fail:"Kopieren ist auf diesem Gerät blockiert",
    t_more:"Mengen erhöht", t_normal:"Normale Mengen", t_added:"{x} hinzugefügt", t_noprice:"Kein Preis gefunden für {x}", t_price_range:"Preis zwischen 0 und 500 € eingeben", t_full:"Deine Liste ist voll",
    t_link:"Link kopiert. In WhatsApp einfügen.",
    share_title:"Liste senden", share_sub:"Als Link senden: Er öffnet sich in Wochenkorb auf dem anderen Handy, mit allen Artikeln, Mengen und den Abendessen der Woche.",
    share_native:"Teilen…", share_wa:"Mit WhatsApp senden", share_copy_link:"Link kopieren", share_copy_text:"Als Text kopieren",
    share_msg:"Unsere Einkaufsliste für diese Woche ({n} Artikel, {total}). In Wochenkorb öffnen:",
    imp_title:"Dir wurde eine Einkaufsliste geschickt", imp_sub:"{n} Artikel · {total}{menu}", imp_menu:" · {n} Abendessen geplant",
    imp_replace:"Diese Liste nutzen", imp_merge:"Zu meiner Liste hinzufügen", imp_ignore:"Ignorieren", imp_old:"Diese Liste ist aus einer älteren Woche. Artikel, die nicht mehr im Angebot sind, wurden mit dem damaligen Preis übernommen; die Abendessen wurden nicht übernommen.",
    t_imported:"Liste geladen", t_merged:"Artikel zu deiner Liste hinzugefügt",
    copy_head:"Einkaufsliste", copy_total:"Gesamt",
    add_item:"Zur Liste hinzufügen", add_search_ph:"Produkt eingeben: Milch, Hähnchen, Käse…", add_own:"Mit diesem Preis hinzufügen", sug_none:"Nicht in den Daten dieser Woche. Preis aus dem Markt eingeben und hinzufügen.",
    on_list:"auf der Liste", buy_at:"Stattdessen bei {x} kaufen",
    planned_now:"Aktuell geplant", or_pick:"Oder ein anderes Abendessen wählen:", sort:"Sortieren", sections:"Bereiche", mon_sat:"Mo–Sa", no_budget:"Kein Budget gesetzt",
    st_holiday_next:"Heute geschlossen (Feiertag) · öffnet {d} {t}", st_closed_next:"Geschlossen · öffnet {d} {t}"
  }
};
const CAT_DE = {Meat:"Fleisch",Fish:"Fisch",Dairy:"Molkerei",Cheese:"Käse",Produce:"Obst & Gemüse",Bakery:"Backwaren",Pantry:"Vorrat",Frozen:"Tiefkühl",Drinks:"Getränke",Snacks:"Süßes & Snacks","Coffee & tea":"Kaffee & Tee",Breakfast:"Frühstück",Household:"Haushalt",Added:"Selbst hinzugefügt"};
const DAYS_DE = ["Mo","Di","Mi","Do","Fr","Sa","So"];
const DAYS_EN = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const HOL_EN = {"Tag der Deutschen Einheit":"German Unity Day","Allerheiligen":"All Saints' Day","1. Weihnachtstag":"Christmas Day","2. Weihnachtstag":"Boxing Day","Neujahr":"New Year's Day","Karfreitag":"Good Friday","Ostermontag":"Easter Monday","Tag der Arbeit":"Labour Day","Christi Himmelfahrt":"Ascension Day","Pfingstmontag":"Whit Monday","Fronleichnam":"Corpus Christi"};
const de = () => S.lang==="de";
function t(k, v){ let s=(STR[S.lang]||STR.en)[k]; if(s==null) s=STR.en[k]; if(s==null) return k;
  if(v) s=s.replace(/\{(\w+)\}/g,(m,x)=>v[x]!=null?String(v[x]):m); return s; }
const cat = c => de() ? (CAT_DE[c]||c) : c;
const dayN = i => (de()?DAYS_DE:DAYS_EN)[i];
const holN = n => de() ? n : (HOL_EN[n]||n);
const rName = r => de() ? (r.de||r.name) : r.name;
const rAlt = r => de() ? r.name : (r.de||"");
const rBlurb = r => de() && r.deBlurb ? r.deBlurb : r.blurb;
const rIngLabel = (r,i) => de() && r.deIng && r.deIng[i] ? r.deIng[i] : r.ing[i][1];
const rAmt = (r,i) => de() && r.deAmt && r.deAmt[i]!=null ? r.deAmt[i] : r.ing[i][2];
const rStep = (r,i) => de() && r.deSteps && r.deSteps[i] ? [r.deSteps[i][0], r.deSteps[i][1], r.steps[i][2]] : r.steps[i];
const km = x => de() ? x.toFixed(1).replace(".",",") : x.toFixed(1);

/* ---------------- UI plumbing ---------------- */
const TABS=[["home","tab_home","home"],["deals","tab_deals","tag"],["list","tab_list","list"],["recipes","tab_recipes","pot"],["stores","tab_stores","pin"]];
function renderNav(){
  const L=lines(); const cnt=L.filter(l=>!S.checked.includes(l.id)).length;
  $("#tabsMob").innerHTML = TABS.map(([id,lab,ic])=>'<button type="button" data-tab="'+id+'"'+(S.tab===id?' aria-current="page"':'')+'>'+svg(ic)+esc(t(lab))+(id==="list"&&cnt?'<span class="badge">'+cnt+'</span>':'')+'</button>').join("");
  $("#tabsDesk").innerHTML = TABS.map(([id,lab])=>'<button type="button" data-tab="'+id+'"'+(S.tab===id?' aria-current="page"':'')+'>'+esc(t(lab))+(id==="list"&&cnt?' · '+cnt:'')+'</button>').join("");
  $("#locName").textContent = S.home;
  $("#locBtn").setAttribute("aria-label", t("loc_aria"));
  document.querySelectorAll("nav[aria-label]").forEach(n=>n.setAttribute("aria-label",t("sections")));
  const lb=$("#langBtn"); if(lb){ lb.textContent=t("lang_btn"); lb.setAttribute("aria-label",t("lang_aria")); }
  document.documentElement.lang = S.lang;
}
let toastT=null;
function toast(msg){ const el=$("#toast"); el.textContent=msg; el.classList.add("show"); clearTimeout(toastT); toastT=setTimeout(()=>el.classList.remove("show"),2100); }
function go(tab){ if(!TABS.some(x=>x[0]===tab)) return; S.tab=tab; save(); render(); window.scrollTo(0,0); }

/* ---------------- views ---------------- */
let dealQ="", dealStore="All", dealCat="All", dealSort="price", recFilter="f_all";

function notices(){
  let out="";
  if(typeof navigator!=="undefined" && navigator.onLine===false) out+='<div class="notice info" role="status">'+svg("alert")+'<div>'+esc(t("offline"))+'</div></div>';
  const today=berlinNow().date;
  if(today>META.validTo) out+='<div class="notice" role="note">'+svg("clock")+'<div>'+esc(t("stale",{date:fmtD(META.validTo)}))+'</div></div>';
  const days = Object.entries(HOLIDAYS).filter(([d])=>d>=META.validFrom && d<=META.validTo);
  if(days.length) out+='<div class="notice" role="note">'+svg("alert")+'<div><b>'+esc(days.map(([d,n])=>t("hol_is",{day:dayN((new Date(d+"T12:00:00Z").getUTCDay()+6)%7),date:fmtD(d),name:holN(n)})).join(", "))+'.</b> '+esc(t("hol_tail"))+'</div></div>';
  return out;
}
function dealCard(o){
  const inList=!!S.items[o.id]; const col=CATCOL[o.category]||"plum";
  return '<article class="card deal'+(inList?' in':'')+'">'+
    '<div class="dtop"><span class="ico c-'+col+'" title="'+esc(cat(o.category))+'">'+svg(o.category)+'</span><span class="store-tag '+esc(o.store)+'">'+esc(o.store)+'</span></div>'+
    '<span class="price">'+eur(o.price)+'</span><span class="nm">'+esc(o.name)+'</span>'+
    '<div class="dfoot"><span class="sz">'+esc(o.size)+'</span>'+
    (inList?'<span class="step"><button type="button" data-act="dec" data-id="'+esc(o.id)+'" aria-label="'+esc(t("one_less"))+'">−</button><span>'+S.items[o.id]+'</span><button type="button" data-act="inc" data-id="'+esc(o.id)+'" aria-label="'+esc(t("one_more"))+'">+</button></span>'
           :'<button type="button" class="addbtn" data-act="add" data-id="'+esc(o.id)+'" aria-label="'+esc(t("add_x",{x:o.name}))+'">'+svg("plus")+'</button>')+
    '</div></article>';
}
function viewHome(){
  const L=lines(), T=totals(L);
  const pct = T.b? clamp(T.total/T.b,0,1):0; const C=2*Math.PI*52;
  const ringCol = T.state==="bad"?"#FF6A4F":T.state==="warn"?"#FFB020":"#35C77F";
  const picks = favMatches().filter(x=>x.m&&isOffer(x.m.row)).map(x=>x.m.row);
  const extra = DB.from("offers").where(o=>!picks.includes(o)&&["Meat","Fish","Dairy","Cheese","Pantry","Frozen","Produce"].includes(o.category)).orderBy("price").limit(10-Math.min(picks.length,6)).all();
  const top=[...new Set(picks)].slice(0,6).concat(extra);
  const n=berlinNow(); const nOff=DB.from("offers").count();
  const week = DAYS.map((d,i)=>{ const date=WEEK_DATES[i]; const rid=S.menu[i]; const r=rid&&DB.get(rid); const hol=HOLIDAYS[date];
    return '<button type="button" class="day'+(r?'':' empty-day')+(hol?' holiday':'')+'" data-act="pick-day" data-day="'+i+'">'+
      '<span class="dn">'+esc(dayN(i))+' '+fmtD(date)+(date===n.date?' · '+esc(t("today")):'')+'</span>'+(r?'<h4>'+esc(rName(r))+'</h4>':'<span>'+(hol?esc(holN(hol))+' · '+esc(t("tap_plan")):esc(t("plan_dinner")))+'</span>')+'</button>'; }).join("");
  const nA=nearest("ALDI"), nL=nearest("LIDL");
  const menuCount=Object.keys(S.menu).length;
  return '<section class="view">'+
    '<div class="hero">'+
      '<div><span class="wk"><b>'+esc(META.weekLabel)+'</b>'+esc(dayN(0))+' '+fmtD(META.validFrom)+' – '+esc(dayN(5))+' '+fmtD(META.validTo)+'</span>'+
      '<h1><em>'+esc(t("hero_deals",{n:nOff}))+'</em> '+esc(t("hero_rest"))+'</h1>'+
      '<p>'+esc(t("hero_list",{total:eur(T.total),n:T.count}))+' '+(T.b?esc(T.left>=0?t("hero_left",{left:eur(T.left),b:eur(T.b)}):t("hero_over",{over:eur(-T.left)})):'')+'</p>'+
      '<div class="acts"><button type="button" class="btn" data-tab="list">'+svg("cart")+esc(t("open_list"))+'</button><button type="button" class="btn ghost" data-tab="recipes">'+svg("pot")+esc(t("deal_recipes"))+'</button></div></div>'+
      '<div class="ring" role="img" aria-label="'+esc(t("budget_used",{p:Math.round(pct*100)}))+'"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="12"/><circle cx="60" cy="60" r="52" fill="none" stroke="'+ringCol+'" stroke-width="12" stroke-linecap="round" stroke-dasharray="'+(C*pct).toFixed(1)+' '+C.toFixed(1)+'"/></svg><div class="lbl2"><b>'+Math.round(pct*100)+'%</b><span>'+esc(t("of_budget"))+'</span></div></div>'+
    '</div>'+
    notices()+
    '<section class="sec"><div class="sechead"><h2>'+esc(t("deals_for_you"))+'</h2><button type="button" class="link" data-tab="deals">'+esc(t("see_all",{n:nOff}))+'</button></div>'+
      '<div class="hscroll">'+top.map(dealCard).join("")+'</div></section>'+
    '<section class="sec"><div class="sechead"><div><h2>'+esc(t("dinners_title"))+'</h2><p class="muted small">'+esc(t("dinners_sub",{n:menuCount}))+'</p></div>'+
      (menuCount?'<button type="button" class="btn sm primary" data-act="shop-menu">'+svg("cart")+esc(t("shop_menu"))+'</button>':'<button type="button" class="btn sm" data-act="auto-menu">'+esc(t("fill_week"))+'</button>')+'</div>'+
      '<div class="week">'+week+'</div></section>'+
    '<section class="sec"><div class="sechead"><h2>'+esc(t("nearest"))+'</h2><button type="button" class="link" data-tab="stores">'+esc(t("all_stores"))+'</button></div>'+
      '<div class="duo">'+[nA,nL].filter(Boolean).map(storeCard).join("")+'</div></section>'+
    footer()+
  '</section>';
}
function dealRows(){
  let q=DB.from("offers").search(dealQ).eq("store",dealStore==="All"?null:dealStore).eq("category",dealCat==="All"?null:dealCat);
  q = dealSort==="price"?q.orderBy("price"):dealSort==="name"?q.orderBy(r=>DB.fold(r.name)):q.orderBy(r=>cat(r.category)+DB.fold(r.name));
  return q.all();
}
const dealResultsHTML = rows => rows.length?'<div class="grid">'+rows.map(dealCard).join("")+'</div>':'<div class="empty">'+esc(t("no_deals"))+'</div>';
function refreshDeals(){ const rows=dealRows(); const box=$("#dealResults"); if(box) box.innerHTML=dealResultsHTML(rows); const c=$("#dealCount"); if(c) c.textContent=t("n_deals",{n:rows.length}); }
function viewDeals(){
  const cats=["All",...new Set(DB.from("offers").all().map(o=>o.category))].sort((a,b)=>a==="All"?-1:b==="All"?1:cat(a).localeCompare(cat(b)));
  const rows=dealRows();
  return '<section class="view">'+
    '<div class="sechead"><div><span class="eyebrow">'+esc(META.weekLabel)+' · '+esc(t("valid",{from:fmtD(META.validFrom),to:fmtD(META.validTo)}))+'</span><h2 style="font-size:30px;margin-top:4px">'+esc(t("weekly_deals"))+'</h2></div></div>'+
    notices()+
    '<div class="tools">'+
      '<label class="searchbox"><span class="sr">'+esc(t("search_lbl"))+'</span>'+svg("search")+'<input class="input" id="dealSearch" type="search" maxlength="40" autocomplete="off" placeholder="'+esc(t("search_ph"))+'" value="'+esc(dealQ)+'"></label>'+
      '<div class="tooln"><div class="seg" role="group" aria-label="'+esc(t("store"))+'">'+["All","ALDI","LIDL"].map(s=>'<button type="button" data-act="dstore" data-v="'+s+'" aria-pressed="'+(dealStore===s)+'">'+esc(s==="All"?t("all"):s)+'</button>').join("")+'</div>'+
      '<label class="sr" for="dealSort">'+esc(t("sort"))+'</label><select class="input" id="dealSort"><option value="price"'+(dealSort==="price"?" selected":"")+'>'+esc(t("sort_price"))+'</option><option value="cat"'+(dealSort==="cat"?" selected":"")+'>'+esc(t("sort_aisle"))+'</option><option value="name"'+(dealSort==="name"?" selected":"")+'>'+esc(t("sort_name"))+'</option></select>'+
      '<span class="count" id="dealCount" aria-live="polite">'+esc(t("n_deals",{n:rows.length}))+'</span></div>'+
      '<div class="chiprow" role="group" aria-label="'+esc(t("category"))+'">'+cats.map(c=>'<button type="button" class="chip" data-act="dcat" data-v="'+esc(c)+'" aria-pressed="'+(dealCat===c)+'">'+(c==="All"?"":svg(c))+esc(c==="All"?t("all"):cat(c))+'</button>').join("")+'</div>'+
    '</div>'+
    '<div id="dealResults">'+dealResultsHTML(rows)+'</div>'+
    footer()+
  '</section>';
}
function summaryHTML(){
  const L=lines(), T=totals(L);
  const pct=T.b?clamp(T.total/T.b*100,0,100):0;
  const lab={ok:t("on_budget"),warn:t("near_budget"),bad:t("over_budget")}[T.state];
  return '<div class="card summary" id="sumCard"><div><span class="eyebrow">'+esc(t("total"))+'</span><div class="big">'+eur(T.total)+'</div></div>'+
    '<div><div class="bar '+T.state+'"><i style="width:'+pct.toFixed(1)+'%"></i></div>'+
    '<div class="stats">'+(T.b?'<span class="pill '+T.state+'">'+esc(lab)+'</span><span>'+esc(t("budget"))+' <b>'+eur(T.b)+'</b></span><span>'+esc(T.left>=0?t("left"):t("over_by"))+' <b>'+eur(Math.abs(T.left))+'</b></span>':'<span class="pill info">'+esc(t("no_budget"))+'</span>')+'<span>'+esc(t("on_sale"))+' <b>'+eur(T.sale)+'</b></span><span><b>'+T.count+'</b> '+esc(t("packs"))+'</span></div></div></div>';
}
/* product suggestions while typing: searches this week's deals first, then everyday items */
function suggestRows(q, limit){
  const f=DB.fold(q); if(f.length<2) return [];
  const score=r=>{ const n=DB.fold(r.name); const tags=(r.tags||[]).map(DB.fold);
    if(tags.includes(f)) return 0; if(n.startsWith(f)) return 1; if(tags.some(x=>x.startsWith(f))) return 2; return 3; };
  const offers=DB.from("offers").search(q).all().map(r=>({r,s:score(r),o:0}));
  const staples=DB.from("staples").search(q).all().map(r=>({r,s:score(r),o:1}));
  return offers.concat(staples).sort((a,b)=>a.s-b.s||a.o-b.o||priceOf(a.r)-priceOf(b.r)).slice(0,limit||6).map(x=>x.r);
}
function suggestHTML(q, act){
  const rows=suggestRows(q,6);
  if(!rows.length) return q.trim().length>=2?'<p class="sugnone">'+esc(t("sug_none"))+'</p>':'';
  return rows.map(r=>{ const st=storeOf(r); const inL=!!S.items[r.id];
    return '<button type="button" class="sug" data-act="'+act+'" data-id="'+esc(r.id)+'"><span class="ico c-'+(CATCOL[r.category]||"plum")+'">'+svg(r.category)+'</span>'+
      '<span class="sugtxt"><b>'+esc(r.name)+'</b><span class="muted small">'+esc(r.size||"")+' · '+(isOffer(r)?'<span class="sale">'+esc(t("angebot"))+'</span>':esc(t("shelf")))+'</span></span>'+
      '<span class="sugr"><span class="store-tag '+st+'">'+st+'</span><b class="num">'+eur(priceOf(r))+'</b>'+(inL?'<span class="muted small">'+esc(t("on_list"))+'</span>':'')+'</span></button>'; }).join("");
}
function listLine(l){
  const done=S.checked.includes(l.id); const other=l.store==="ALDI"?"LIDL":"ALDI";
  return '<div class="li'+(done?' done':'')+'"><button type="button" class="check" data-act="check" data-id="'+esc(l.id)+'" role="checkbox" aria-checked="'+done+'" aria-label="'+esc(t("got_x",{x:l.name}))+'">'+svg("check")+'</button>'+
    '<div><div class="lnm">'+esc(l.name)+'</div><div class="lmeta">'+(l.sale?'<span class="sale">'+esc(t("angebot"))+'</span>':l.custom?'<span>'+esc(t("your_price"))+'</span>':'<span>'+esc(t("shelf"))+'</span>')+
    (l.size?'<span>'+esc(l.size)+'</span>':'')+'<span class="num">'+eur(l.price)+'</span></div>'+
    (l.swap?'<button type="button" class="swapbtn" data-act="swap" data-id="'+esc(l.id)+'">'+svg("swap")+esc(t("buy_at",{x:other}))+'</button>':'')+'</div>'+
    '<div class="lright"><span class="lprice">'+eur(l.price*l.qty)+'</span><span class="step"><button type="button" data-act="dec" data-id="'+esc(l.id)+'" aria-label="'+esc(t("one_less"))+'">−</button><span>'+l.qty+'</span><button type="button" data-act="inc" data-id="'+esc(l.id)+'" aria-label="'+esc(t("one_more"))+'">+</button></span></div></div>';
}
let favOpen=null;
function viewList(){
  const L=lines(), fm=favMatches();
  const miss=fm.filter(x=>!x.m).map(x=>x.fav);
  if(favOpen===null) favOpen=!S.seeded;
  const cols=["ALDI","LIDL"].map(st=>{
    const ls=L.filter(l=>l.store===st); const sub=ls.reduce((a,l)=>a+l.price*l.qty,0); const nb=nearest(st);
    const cats=[...new Set(ls.map(l=>l.cat))].sort((a,b)=>cat(a).localeCompare(cat(b)));
    return '<div class="card shop shop-'+st+'"><div class="shophead"><div><span class="store-tag '+st+'">'+(st==="ALDI"?"ALDI SÜD":"LIDL")+'</span>'+
      (nb?'<div class="where">'+esc(nb.s.street)+', '+esc(nb.s.town)+' · '+km(nb.km)+' km</div>':'')+'</div><span class="muted small">'+esc(t("items_n",{n:ls.length}))+'</span></div>'+
      (ls.length?cats.map(c=>'<div class="cat">'+svg(c)+esc(cat(c))+'</div>'+ls.filter(l=>l.cat===c).sort((a,b)=>a.name.localeCompare(b.name)).map(listLine).join("")).join("")
                :'<div class="empty" style="margin:14px;border-radius:14px">'+esc(t("nothing_here"))+'</div>')+
      '<div class="shopfoot"><span>'+esc(t("subtotal"))+' '+(st==="ALDI"?"ALDI SÜD":"LIDL")+'</span><span class="num">'+eur(sub)+'</span></div></div>';
  }).join("");
  const doneN=L.filter(l=>S.checked.includes(l.id)).length;
  return '<section class="view">'+
    '<div class="sechead"><div><span class="eyebrow">'+esc(t("household"))+' · '+esc(META.weekLabel)+'</span><h2 style="font-size:30px;margin-top:4px">'+esc(t("list_title"))+'</h2></div>'+
      '<div class="row"><button type="button" class="btn sm primary" data-act="share-open">'+svg("send")+esc(t("share_list"))+'</button><button type="button" class="btn sm" data-act="copy">'+svg("copy")+esc(t("copy"))+'</button>'+(doneN?'<button type="button" class="btn sm" data-act="clear-done">'+esc(t("remove_ticked",{n:doneN}))+'</button>':'')+'</div></div>'+
    summaryHTML()+
    '<div class="card addcard"><label class="lbl" for="addName">'+esc(t("add_item"))+'</label>'+
      '<div class="searchbox">'+svg("search")+'<input class="input" id="addName" type="search" maxlength="60" autocomplete="off" enterkeyhint="search" placeholder="'+esc(t("add_search_ph"))+'"></div>'+
      '<div class="suggest" id="addSug" aria-live="polite"></div>'+
      '<form class="addform" id="addForm" autocomplete="off" hidden><input class="input" id="addPrice" inputmode="decimal" maxlength="7" placeholder="'+esc(t("add_price_ph"))+'">'+
      '<select class="input" id="addStore"><option>ALDI</option><option>LIDL</option></select><button class="btn primary" type="submit">'+esc(t("add_own"))+'</button></form></div>'+
    notices()+
    '<div class="storecol">'+cols+'</div>'+
    '<details class="card" id="favDetails"'+(favOpen?' open':'')+'><summary>'+esc(t("fav_budget"))+' '+svg("chev")+'</summary><div class="setbody">'+
      '<div class="field"><label for="favIn">'+esc(t("fav_label"))+'</label><div class="favs">'+
        S.favorites.map((f,i)=>'<span class="fav'+(miss.includes(f)?' miss':'')+'">'+esc(f)+'<button type="button" data-act="unfav" data-i="'+i+'" aria-label="× '+esc(f)+'">×</button></span>').join("")+
        '<input id="favIn" type="search" maxlength="40" autocomplete="off" enterkeyhint="done" placeholder="'+esc(t("fav_ph"))+'"></div>'+
        '<div class="suggest" id="favSug" aria-live="polite"></div>'+
        '<p class="muted small">'+esc(miss.length?t("no_price_for",{x:miss.join(", ")}):t("all_priced"))+'</p>'+
        '<div class="row"><button type="button" class="btn sm primary" data-act="rebuild">'+esc(t("rebuild"))+'</button><button type="button" class="btn sm" data-act="merge">'+esc(t("merge"))+'</button></div></div>'+
      '<div class="field" style="gap:14px"><div class="field"><label for="budgetIn">'+esc(t("weekly_budget"))+'</label><div class="money"><input id="budgetIn" type="number" inputmode="numeric" min="0" max="2000" step="5" value="'+esc(S.budget)+'"><span>€</span></div></div>'+
        '<label class="switch" for="bigIn"><input type="checkbox" id="bigIn"'+(S.big?' checked':'')+'><span><b>'+esc(t("big"))+'</b><br><span class="muted small">'+esc(t("big_sub"))+'</span></span></label></div>'+
    '</div></details>'+
    footer()+
  '</section>';
}
function recipeCard(r){
  const c=recipeCost(r); const inWeek=Object.values(S.menu).includes(r.id);
  return '<article class="card rcard">'+
    '<div class="rband" data-art="'+esc(r.color)+'" data-seed="'+esc(r.id)+'"><canvas aria-hidden="true"></canvas><span class="meal">'+esc(t("meal_"+r.meal))+' · '+r.mins+' '+esc(t("min"))+'</span></div>'+
    '<div class="rbody"><h3>'+esc(rName(r))+'</h3>'+(rAlt(r)?'<span class="de">'+esc(rAlt(r))+'</span>':'')+'<p>'+esc(rBlurb(r))+'</p>'+
    '<div class="row"><span class="pill bad">'+esc(c.deals===1?t("deal_1"):t("deals_n",{n:c.deals}))+'</span><span class="pill info">'+esc(t("lvl_"+r.level))+'</span></div>'+
    '<div class="rfoot"><div class="rcost"><b class="num">'+eur(c.cost)+'</b><span>'+esc(t("per_person",{x:eur(c.per)}))+'</span></div>'+
    '<div class="row">'+(r.meal==="Dinner"?'<button type="button" class="btn sm'+(inWeek?' inweek':'')+'" data-act="toggle-week" data-id="'+esc(r.id)+'">'+(inWeek?svg("check")+esc(t("in_week")):esc(t("add_week")))+'</button>':'')+'<button type="button" class="btn sm primary" data-act="open-recipe" data-id="'+esc(r.id)+'">'+esc(t("recipe"))+'</button></div></div></div></article>';
}
const RFILTERS={f_all:()=>true,f_dinner:r=>r.meal==="Dinner",f_breakfast:r=>r.meal==="Breakfast",f_quick:r=>r.mins<=30,f_deals:()=>true};
function viewRecipes(){
  let q=DB.from("recipes").where(RFILTERS[recFilter]||RFILTERS.f_all);
  q = recFilter==="f_deals"?q.orderBy(r=>-recipeCost(r).deals):q.orderBy(r=>recipeCost(r).cost);
  return '<section class="view">'+
    '<div class="sechead"><div><span class="eyebrow">'+esc(t("rec_eyebrow",{w:META.weekLabel}))+'</span><h2 style="font-size:30px;margin-top:4px">'+esc(t("rec_title"))+'</h2></div></div>'+
    '<div class="chiprow" role="group">'+Object.keys(RFILTERS).map(k=>'<button type="button" class="chip" data-act="rfilter" data-v="'+k+'" aria-pressed="'+(recFilter===k)+'">'+esc(t(k))+'</button>').join("")+'</div>'+
    '<div class="rgrid">'+q.all().map(recipeCard).join("")+'</div>'+
    footer()+
  '</section>';
}
function storeCard(x){
  const {s}=x; const st=storeStatus(s);
  return '<article class="card scard"><div class="st"><span class="store-tag '+esc(s.chain)+'">'+(s.chain==="ALDI"?"ALDI SÜD":"LIDL")+'</span>'+
    '<span class="pill '+(st.open?(st.soon?'warn':'ok'):'bad')+'">'+svg("clock",' width="13" height="13"')+esc(t(st.code,{t:st.time,d:st.day!=null?dayN(st.day):""}))+'</span></div>'+
    '<div><h3>'+esc(s.street)+'</h3><p class="addr">'+esc(s.zip)+' '+esc(s.town)+' · '+esc(t("mon_sat"))+' '+esc(s.open)+'–'+esc(s.close)+'</p></div>'+
    '<div class="sfoot"><span class="dist">'+km(x.km)+' <small>'+esc(t("km_from",{x:S.home}))+'</small></span>'+
    '<a class="btn sm primary" href="'+esc(mapsUrl(s))+'" target="_blank" rel="noopener noreferrer">'+svg("nav")+esc(t("directions"))+'</a></div></article>';
}
function viewStores(){
  const all=storesNear().filter(x=>x.s.area===S.home);
  return '<section class="view">'+
    '<div class="sechead"><div><span class="eyebrow">'+esc(t("stores_eyebrow"))+'</span><h2 style="font-size:30px;margin-top:4px">'+esc(t("stores_title"))+'</h2></div>'+
      '<div class="seg" role="group" aria-label="'+esc(t("your_loc"))+'">'+DB.from("homes").all().map(h=>'<button type="button" data-act="home" data-v="'+esc(h.id)+'" aria-pressed="'+(S.home===h.id)+'">'+esc(h.label)+'</button>').join("")+'</div></div>'+
    notices()+
    '<div class="mapbox"><canvas id="map" aria-label="'+esc(t("map_aria"))+'" role="img"></canvas></div>'+
    '<div class="legend"><span><i style="background:var(--sky)"></i>ALDI SÜD</span><span><i style="background:var(--mango)"></i>LIDL</span><span><i style="background:var(--tomato)"></i>'+esc(S.home)+'</span></div>'+
    '<div class="sgrid">'+all.map(storeCard).join("")+'</div>'+
    '<p class="muted small">'+esc(t("stores_note"))+'</p>'+
    footer()+
  '</section>';
}
function footer(){
  return '<footer class="foot"><p>'+esc(t("foot1",{w:META.weekLabel,d:fmtD(META.updated)}))+'</p>'+
    '<p>'+esc(t("foot2"))+' <a href="https://www.aldi-sued.de/angebote" target="_blank" rel="noopener noreferrer">ALDI SÜD</a> · <a href="https://www.lidl.de/c/online-prospekte/s10005610" target="_blank" rel="noopener noreferrer">LIDL</a></p>'+
    '<p>'+esc(t("foot3"))+'</p></footer>';
}


/* ---------------- canvas art: produce confetti for recipe bands ---------- */
function seedRand(str){ let h=2166136261; for(const ch of str){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);} return ()=>{h^=h<<13;h^=h>>>17;h^=h<<5;return ((h>>>0)%10000)/10000;}; }
function paintBand(cv,color,seed){
  const rect=cv.getBoundingClientRect(); const dpr=Math.min(2,window.devicePixelRatio||1);
  const w=Math.max(1,rect.width), h=Math.max(1,rect.height); cv.width=w*dpr; cv.height=h*dpr;
  const g=cv.getContext("2d"); g.scale(dpr,dpr); const [a,b,deep]=HERO_COL[color]||HERO_COL.tomato; const rnd=seedRand(seed);
  const grd=g.createLinearGradient(0,0,w,h); grd.addColorStop(0,a); grd.addColorStop(1,deep); g.fillStyle=grd; g.fillRect(0,0,w,h);
  for(let i=0;i<14;i++){ const x=rnd()*w, y=rnd()*h, r=6+rnd()*26; g.globalAlpha=.18+rnd()*.35;
    g.fillStyle=[b,"#FFFFFF",a][i%3]; g.beginPath();
    if(i%4===0){ g.ellipse(x,y,r,r*.55,rnd()*3,0,Math.PI*2); } else { g.arc(x,y,r*.6,0,Math.PI*2); }
    g.fill(); }
  g.globalAlpha=1;
}
function paintArt(root){ (root||document).querySelectorAll("[data-art]").forEach(el=>{ const cv=el.querySelector("canvas"); if(cv) paintBand(cv,el.dataset.art,el.dataset.seed||"x"); }); }

/* ---------------- store map (canvas, no external tiles) ---------------- */
function paintMap(){
  const cv=$("#map"); if(!cv) return; const rect=cv.getBoundingClientRect(); const dpr=Math.min(2,window.devicePixelRatio||1);
  cv.width=rect.width*dpr; cv.height=rect.height*dpr; const g=cv.getContext("2d"); g.scale(dpr,dpr);
  const css=getComputedStyle(document.documentElement); const v=n=>css.getPropertyValue(n).trim();
  const pts=DB.from("stores").all(); const hs=DB.from("homes").all();
  const focus = S.home==="Bolanden" ? pts.filter(p=>p.area==="Bolanden").concat([home()]) : pts.filter(p=>p.area==="Kaiserslautern").concat([home()]);
  let la=[Infinity,-Infinity], lo=[Infinity,-Infinity];
  for(const p of focus){ la=[Math.min(la[0],p.lat),Math.max(la[1],p.lat)]; lo=[Math.min(lo[0],p.lng),Math.max(lo[1],p.lng)]; }
  const padLa=Math.max(.004,(la[1]-la[0])*.25), padLo=Math.max(.006,(lo[1]-lo[0])*.25);
  la=[la[0]-padLa,la[1]+padLa]; lo=[lo[0]-padLo,lo[1]+padLo];
  const W=rect.width,H=rect.height; const k=Math.cos(49.5*Math.PI/180);
  const sx=W/((lo[1]-lo[0])*k), sy=H/(la[1]-la[0]); const s=Math.min(sx,sy);
  const cx=(lo[0]+lo[1])/2, cy=(la[0]+la[1])/2;
  const P=p=>[W/2+(p.lng-cx)*k*s, H/2-(p.lat-cy)*s];
  g.fillStyle=v("--surface-2"); g.fillRect(0,0,W,H);
  g.strokeStyle=v("--line"); g.lineWidth=1;
  for(let x=0;x<W;x+=28){g.beginPath();g.moveTo(x,0);g.lineTo(x,H);g.stroke();}
  for(let y=0;y<H;y+=28){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke();}
  const hp=P(home());
  g.setLineDash([4,5]); g.strokeStyle=v("--muted"); g.globalAlpha=.5;
  for(const p of pts){ const q=P(p); if(q[0]<-20||q[0]>W+20||q[1]<-20||q[1]>H+20) continue; g.beginPath(); g.moveTo(hp[0],hp[1]); g.lineTo(q[0],q[1]); g.stroke(); }
  g.setLineDash([]); g.globalAlpha=1;
  g.font="700 11px Nunito, system-ui, sans-serif"; g.textBaseline="middle";
  for(const p of pts){ const q=P(p); if(q[0]<-20||q[0]>W+20||q[1]<-20||q[1]>H+20) continue;
    g.fillStyle=p.chain==="ALDI"?v("--sky"):v("--mango"); g.beginPath(); g.arc(q[0],q[1],8,0,Math.PI*2); g.fill();
    g.strokeStyle=v("--surface"); g.lineWidth=2.5; g.stroke();
    const label=p.street.replace(/straße/,"str.").replace(/Straße/,"Str."); const tw=g.measureText(label).width;
    const lx = q[0]+12+tw > W-4 ? q[0]-12-tw : q[0]+12;
    g.fillStyle=v("--ink"); g.fillText(label,lx,q[1]); }
  g.fillStyle=v("--tomato"); g.beginPath(); g.arc(hp[0],hp[1],10,0,Math.PI*2); g.fill(); g.strokeStyle=v("--surface"); g.lineWidth=3; g.stroke();
  g.font="800 13px Nunito, system-ui, sans-serif"; g.fillStyle=v("--ink"); const hl=home().label; const hw=g.measureText(hl).width;
  g.fillText(hl, hp[0]+14+hw>W-4?hp[0]-14-hw:hp[0]+14, hp[1]-14);
}


/* ---------------- sheets: recipe detail, day picker, share, import, cook mode ---------- */
let lastFocus=null;
function openLayer(html){ lastFocus=document.activeElement; $("#layer").innerHTML=html; document.body.style.overflow="hidden";
  const f=$("#layer").querySelector("[data-autofocus]")||$("#layer").querySelector("button"); if(f) f.focus(); paintArt($("#layer")); }
function closeLayer(){ stopTimer(); releaseWake(); cook=null; $("#layer").innerHTML=""; document.body.style.overflow=""; if(lastFocus&&lastFocus.focus) lastFocus.focus(); }
const sheet = (label, inner) => '<div class="sheet-wrap" data-act="close-bg"><div class="sheet" role="dialog" aria-modal="true" aria-label="'+esc(label)+'">'+inner+'</div></div>';
function recipeSheet(id){
  const r=DB.get(id); if(!r||DB.tableOf(id)!=="recipes") return; const c=recipeCost(r); const inWeek=Object.values(S.menu).includes(r.id);
  const ing=r.ing.map(([ref],i)=>{ const amt=rAmt(r,i); const it=ref&&DB.get(ref); const deal=it&&isOffer(it);
    return '<div class="ing"><span class="dot'+(deal?' deal':'')+'"></span><div><div class="lnm">'+esc(rIngLabel(r,i))+'</div><div class="lmeta">'+(amt?'<span>'+esc(amt)+'</span>':'')+
      (it?'<span class="store-tag '+storeOf(it)+'">'+storeOf(it)+'</span><span>'+esc(it.name)+'</span>':'<span>'+esc(t("pantry"))+'</span>')+'</div></div>'+
      (it?'<span class="lprice">'+(deal?'<span class="sale">'+esc(t("angebot"))+'</span> ':'')+eur(priceOf(it))+'</span>':'<span></span>')+'</div>'; }).join("");
  const steps=r.steps.map((_,i)=>{ const [ti,txt,sec]=rStep(r,i); return '<li><div><b>'+esc(ti)+'</b>'+esc(txt)+(sec?'<div class="t">'+svg("clock",' width="12" height="12" style="vertical-align:-2px"')+' '+Math.round(sec/60)+' '+esc(t("min"))+'</div>':'')+'</div></li>'; }).join("");
  openLayer(sheet(rName(r),
    '<div class="sheethead" data-art="'+esc(r.color)+'" data-seed="'+esc(r.id)+'"><canvas aria-hidden="true"></canvas><button type="button" class="close" data-act="close" aria-label="'+esc(t("close"))+'" data-autofocus>'+svg("x")+'</button>'+
    '<h2>'+esc(rName(r))+'</h2>'+(rAlt(r)?'<div class="de">'+esc(rAlt(r))+'</div>':'')+'<div class="facts"><span>'+esc(t("serves4"))+'</span><span>'+r.mins+' '+esc(t("min"))+'</span><span>'+esc(t("total_x",{x:eur(c.cost)}))+'</span><span>'+esc(t("per_x",{x:eur(c.per)}))+'</span><span>'+esc(c.deals===1?t("deal_1"):t("deals_n",{n:c.deals}))+'</span></div></div>'+
    '<div class="sheetbody"><p class="muted">'+esc(rBlurb(r))+'</p>'+
    '<div class="sheetacts"><button type="button" class="btn hot" data-act="cook" data-id="'+esc(r.id)+'">'+svg("play")+esc(t("start_cooking"))+'</button><button type="button" class="btn primary" data-act="recipe-to-list" data-id="'+esc(r.id)+'">'+svg("cart")+esc(t("ing_to_list"))+'</button></div>'+
    '<section class="sec"><h3 style="font-size:19px">'+esc(t("ingredients"))+'</h3><div class="card" style="padding:4px 16px">'+ing+'</div><p class="muted small">'+esc(t("ing_note"))+'</p></section>'+
    '<section class="sec"><h3 style="font-size:19px">'+esc(t("method"))+'</h3><ol class="steps">'+steps+'</ol></section>'+
    (r.meal==="Dinner"?'<button type="button" class="btn'+(inWeek?' inweek':'')+'" data-act="toggle-week" data-id="'+esc(r.id)+'">'+(inWeek?svg("check")+esc(t("in_menu")):esc(t("add_menu")))+'</button>':'')+
    '</div>'));
}
function dayPicker(day){
  const d=+day; if(!(d>=0&&d<=6)) return;
  const rows=DB.from("recipes").where(r=>r.meal==="Dinner").orderBy(r=>recipeCost(r).cost).all();
  openLayer(sheet(t("pick_dinner"),
    '<div class="sheetbody"><div class="sechead"><div><span class="eyebrow">'+esc(dayN(d))+' '+fmtD(WEEK_DATES[d])+'</span><h2 style="font-size:24px">'+esc(t("pick_dinner"))+'</h2></div><button type="button" class="btn sm" data-act="close" data-autofocus>'+esc(t("close"))+'</button></div>'+
    (S.menu[d]&&DB.get(S.menu[d])?'<div class="card planned"><span class="eyebrow">'+esc(t("planned_now"))+'</span><b>'+esc(rName(DB.get(S.menu[d])))+'</b><div class="row"><button type="button" class="btn sm primary" data-act="open-recipe" data-id="'+esc(S.menu[d])+'">'+esc(t("recipe"))+'</button><button type="button" class="btn sm" data-act="clear-day" data-day="'+d+'">'+esc(t("clear_day",{d:dayN(d)}))+'</button></div></div><p class="muted small">'+esc(t("or_pick"))+'</p>':'')+
    rows.map(r=>{const c=recipeCost(r);return '<button type="button" class="card pickrow" data-act="set-day" data-day="'+d+'" data-id="'+esc(r.id)+'"><span class="ico c-'+esc(r.color)+'">'+svg("pot")+'</span><span style="flex:1"><b style="display:block">'+esc(rName(r))+'</b><span class="muted small">'+r.mins+' '+esc(t("min"))+' · '+esc(c.deals===1?t("deal_1"):t("deals_n",{n:c.deals}))+'</span></span><span class="num">'+eur(c.cost)+'</span></button>';}).join("")+
    '</div>'));
}

/* ---- list sharing: the whole list travels inside the link (#l=…), nothing is uploaded ---- */
const SITE_URL = "https://mattyicematrix.github.io/wochenkorb/";
function b64urlEncode(str){ const bytes=new TextEncoder().encode(str); let bin=""; bytes.forEach(b=>bin+=String.fromCharCode(b)); return btoa(bin).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,""); }
function b64urlDecode(s){ s=s.replace(/-/g,"+").replace(/_/g,"/"); while(s.length%4) s+="="; const bin=atob(s); const bytes=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i); return new TextDecoder().decode(bytes); }
function shareLink(){
  const sp={}, nm={}; for(const id of Object.keys(S.items)){ if(S.storePick[id]) sp[id]=S.storePick[id]; const r=DB.get(id); if(r&&isOffer(r)) nm[id]=[r.name,r.price,r.store]; }
  const p={v:1,w:META.validFrom,i:S.items,c:S.custom.map(c=>[c.name,c.price,c.store,c.qty]),m:S.menu,s:sp,n:nm};
  return SITE_URL+"#l="+b64urlEncode(JSON.stringify(p));
}
function listText(){
  const L=lines(); const T=totals(L);
  return t("copy_head")+" "+META.weekLabel+"\n\n"+["ALDI","LIDL"].map(st=>{const ls=L.filter(l=>l.store===st); if(!ls.length) return "";
    return (st==="ALDI"?"ALDI SÜD":"LIDL")+"\n"+ls.map(l=>(S.checked.includes(l.id)?"☑ ":"☐ ")+l.qty+"× "+l.name+(l.size?" ("+l.size+")":"")+" – "+eur(l.price*l.qty)).join("\n");}).filter(Boolean).join("\n\n")+"\n\n"+t("copy_total")+" "+eur(T.total);
}
function shareSheet(){
  const L=lines(), T=totals(L); const url=shareLink(); const msg=t("share_msg",{n:L.length,total:eur(T.total)});
  const wa="https://wa.me/?text="+encodeURIComponent(msg+"\n"+url);
  openLayer(sheet(t("share_title"),
    '<div class="sheetbody"><div class="sechead"><h2 style="font-size:24px">'+esc(t("share_title"))+'</h2><button type="button" class="btn sm" data-act="close" data-autofocus>'+esc(t("close"))+'</button></div>'+
    '<p class="muted">'+esc(t("share_sub"))+'</p>'+
    (navigator.share?'<button type="button" class="btn primary" data-act="share-native">'+svg("send")+esc(t("share_native"))+'</button>':'')+
    '<a class="btn wa" href="'+esc(wa)+'" target="_blank" rel="noopener noreferrer">'+svg("chat")+esc(t("share_wa"))+'</a>'+
    '<div class="sheetacts"><button type="button" class="btn" data-act="copy-link">'+svg("copy")+esc(t("share_copy_link"))+'</button><button type="button" class="btn" data-act="copy">'+svg("list")+esc(t("share_copy_text"))+'</button></div>'+
    '</div>'));
}
let pendingImport=null;
function readImport(){
  let h=""; try{ h=location.hash||""; }catch(e){ return null; }
  if(!h.startsWith("#l=") || h.length>16000) return null;
  let p; try{ p=JSON.parse(b64urlDecode(h.slice(3))); }catch(e){ return null; }
  if(!p||typeof p!=="object"||p.v!==1) return null;
  const items={}, carried=[];
  if(p.i&&typeof p.i==="object") for(const [k,v] of Object.entries(p.i).slice(0,200)){ if(!Number.isInteger(v)||v<1) continue;
    if(isListable(k)) items[k]=clamp(v,1,99);
    else if(p.n&&Array.isArray(p.n[k])&&typeof p.n[k][0]==="string") carried.push([p.n[k][0],p.n[k][1],p.n[k][2],v]); }
  const storePick={}; if(p.s&&typeof p.s==="object") for(const [k,v] of Object.entries(p.s)) if(DB.tableOf(k)==="staples"&&items[k]&&(v==="ALDI"||v==="LIDL")) storePick[k]=v;
  const custom=(Array.isArray(p.c)?p.c:[]).concat(carried).slice(0,100).map(c=>Array.isArray(c)&&typeof c[0]==="string"&&c[0].trim()?{id:"c-"+Math.random().toString(36).slice(2,10),name:c[0].replace(/[<>]/g,"").slice(0,60),price:clamp(+c[1]||0,0,500),store:c[2]==="LIDL"?"LIDL":"ALDI",qty:clamp(parseInt(c[3])||1,1,99)}:null).filter(Boolean);
  const menu={}; if(p.m&&typeof p.m==="object") for(const [k,v] of Object.entries(p.m)) if(/^[0-6]$/.test(k)&&DB.tableOf(v)==="recipes") menu[k]=v;
  return {items,custom,menu,storePick,old:p.w!==META.validFrom};
}
function clearHash(){ try{ history.replaceState(null,"",location.pathname+location.search); }catch(e){} }
function importSheet(imp){
  pendingImport=imp;
  const n=Object.keys(imp.items).length+imp.custom.length;
  const total=Object.entries(imp.items).reduce((a,[k,q])=>a+priceOf(DB.get(k))*q,0)+imp.custom.reduce((a,c)=>a+c.price*c.qty,0);
  const mn=Object.keys(imp.menu).length;
  openLayer(sheet(t("imp_title"),
    '<div class="sheetbody"><span class="ico c-basil">'+svg("list")+'</span><h2 style="font-size:24px">'+esc(t("imp_title"))+'</h2>'+
    '<p class="big" style="font-size:30px">'+esc(t("imp_sub",{n,total:eur(total),menu:mn?t("imp_menu",{n:mn}):""}))+'</p>'+
    (imp.old?'<div class="notice" role="note">'+svg("clock")+'<div>'+esc(t("imp_old"))+'</div></div>':'')+
    '<button type="button" class="btn primary" data-act="imp-replace" data-autofocus>'+esc(t("imp_replace"))+'</button>'+
    '<button type="button" class="btn" data-act="imp-merge">'+esc(t("imp_merge"))+'</button>'+
    '<button type="button" class="btn" data-act="imp-ignore">'+esc(t("imp_ignore"))+'</button></div>'));
}

/* cook mode */
let cook=null, timerI=null, wake=null;
function stopTimer(){ clearInterval(timerI); timerI=null; }
function releaseWake(){ try{ if(wake) wake.release(); }catch(e){} wake=null; }
async function grabWake(){ try{ if(navigator.wakeLock) wake=await navigator.wakeLock.request("screen"); }catch(e){ wake=null; } }
function startCook(id){ const r=DB.get(id); if(!r||DB.tableOf(id)!=="recipes") return; stopTimer(); cook={r,i:0,left:r.steps[0][2],run:false}; grabWake(); drawCook(); }
function fmtT(s){ s=Math.max(0,s|0); return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0"); }
function drawCook(){
  const {r,i}=cook; const [ti,txt,sec]=rStep(r,i); const last=i===r.steps.length-1;
  $("#layer").innerHTML='<div class="cook" role="dialog" aria-modal="true" aria-label="'+esc(rName(r))+'">'+
    '<div class="cooktop"><div><span class="eyebrow" style="color:#D9C9F2">'+esc(t("cook_mode"))+'</span><div style="font-family:var(--display);font-weight:800;font-size:18px">'+esc(rName(r))+'</div></div><button type="button" class="close" data-act="close" aria-label="'+esc(t("leave_cook"))+'">'+svg("x")+'</button></div>'+
    '<div class="prog">'+r.steps.map((_,k)=>'<i class="'+(k<=i?'on':'')+'"></i>').join("")+'</div>'+
    '<div class="cookmain"><span class="sn">'+esc(t("step_of",{i:i+1,n:r.steps.length}))+'</span><h2>'+esc(ti)+'</h2><p>'+esc(txt)+'</p>'+
    (sec?'<div class="timer'+(cook.left<=0&&cook.started?' done':'')+'" id="timer"><span class="tv" id="tv">'+fmtT(cook.left)+'</span>'+
      '<button type="button" class="btn" data-act="t-toggle">'+svg(cook.run?"pause":"play")+esc(cook.run?t("pause"):t("start_timer"))+'</button><button type="button" class="btn ghost" data-act="t-reset" aria-label="'+esc(t("reset_timer"))+'">'+svg("reset")+'</button></div>':'')+
    '</div><div class="cooknav"><button type="button" class="btn ghost" data-act="c-prev"'+(i===0?' disabled':'')+'>'+esc(t("back"))+'</button><button type="button" class="btn go" data-act="'+(last?'close':'c-next')+'" data-autofocus>'+esc(last?t("done"):t("next"))+'</button></div></div>';
  const f=$("#layer").querySelector("[data-autofocus]"); if(f) f.focus();
}
function tick(){ if(!cook) return stopTimer(); if(cook.run&&cook.end) cook.left=Math.max(0,Math.ceil((cook.end-Date.now())/1000)); const tv=$("#tv"); if(tv) tv.textContent=fmtT(cook.left);
  if(cook.left<=0){ stopTimer(); cook.run=false; drawCook(); try{ navigator.vibrate&&navigator.vibrate([300,150,300]); }catch(e){} } }

/* ---------------- render + events ---------------- */
function render(){
  renderNav();
  const v={home:viewHome,deals:viewDeals,list:viewList,recipes:viewRecipes,stores:viewStores}[S.tab]||viewHome;
  $("#app").innerHTML=v();
  paintArt($("#app")); if(S.tab==="stores") paintMap();
}
function rerenderKeepFocus(id){ const el0=document.getElementById(id); const pos=el0?el0.selectionStart:null; render(); const el=document.getElementById(id); if(el){ el.focus(); try{ if(pos!=null) el.setSelectionRange(pos,pos);}catch(e){} } }
async function copyText(txt, okMsg){ try{ await navigator.clipboard.writeText(txt); toast(okMsg); }catch(e){ toast(t("t_copy_fail")); } }

document.addEventListener("click",e=>{
  const tabB=e.target.closest("[data-tab]"); if(tabB){ if($("#layer").innerHTML) closeLayer(); go(tabB.dataset.tab); return; }
  const b=e.target.closest("[data-act]"); if(!b) return;
  const act=b.dataset.act, id=b.dataset.id;
  if(act==="close-bg"){ if(e.target===b){ closeLayer(); if(pendingImport){ pendingImport=null; clearHash(); } } return; }
  switch(act){
    case "add": if(DB.get(id)){ S.items[id]=(S.items[id]||0)+1; save(); render(); toast(t("toast_added")); } break;
    case "inc": if(S.items[id]!=null){ S.items[id]=clamp(S.items[id]+1,1,99); } else { const c=S.custom.find(x=>x.id===id); if(c) c.qty=clamp(c.qty+1,1,99); } save(); render(); break;
    case "dec": { let gone=false; if(S.items[id]!=null){ if(S.items[id]<=1){ delete S.items[id]; gone=true; } else S.items[id]--; } else { const i=S.custom.findIndex(x=>x.id===id); if(i>=0){ if(S.custom[i].qty<=1){ S.custom.splice(i,1); gone=true; } else S.custom[i].qty--; } } if(gone) S.checked=S.checked.filter(x=>x!==id); save(); render(); break; }
    case "check": { const i=S.checked.indexOf(id); if(i>=0) S.checked.splice(i,1); else S.checked.push(id); save(); render(); break; }
    case "swap": { const r=DB.get(id); if(r&&!isOffer(r)){ S.storePick[id]=storeOf(r)==="ALDI"?"LIDL":"ALDI"; save(); render(); toast(t("t_moved",{x:S.storePick[id]})); } break; }
    case "clear-done": for(const cid of S.checked){ delete S.items[cid]; S.custom=S.custom.filter(c=>c.id!==cid); } S.checked=[]; save(); render(); toast(t("t_ticked")); break;
    case "unfav": { const i=+b.dataset.i; if(i>=0&&i<S.favorites.length){ delete S.favIds[DB.fold(S.favorites[i])]; S.favorites.splice(i,1); save(); render(); } break; }
    case "rebuild": seedFromFavorites(false); S.checked=[]; save(); render(); toast(t("t_rebuilt")); break;
    case "merge": seedFromFavorites(true); save(); render(); toast(t("t_favs")); break;
    case "copy": copyText(listText(), t("t_copied")); break;
    case "add-pick": { const r=DB.get(id); if(r&&(DB.tableOf(id)==="offers"||DB.tableOf(id)==="staples")){ S.items[id]=(S.items[id]||0)+1; save(); render(); toast(t("t_added",{x:r.name})+" · "+storeOf(r)); const inp=$("#addName"); if(inp) inp.focus(); } break; }
    case "fav-pick": { const r=DB.get(id); if(r&&(DB.tableOf(id)==="offers"||DB.tableOf(id)==="staples")){ if(!S.favorites.some(f=>DB.fold(f)===DB.fold(r.name))&&S.favorites.length<60) S.favorites.push(r.name); S.favIds[DB.fold(r.name)]=id; if(!S.items[id]) S.items[id]=favQty(r); save(); render(); toast(t("t_added",{x:r.name})); const inp=$("#favIn"); if(inp) inp.focus(); } break; }
    case "copy-link": copyText(shareLink(), t("t_link")); break;
    case "share-open": shareSheet(); break;
    case "share-native": { const L=lines(), T=totals(L); try{ navigator.share({title:"Wochenkorb", text:t("share_msg",{n:L.length,total:eur(T.total)}), url:shareLink()}).catch(()=>{}); }catch(err){} break; }
    case "imp-replace": if(pendingImport){ S.items=pendingImport.items; S.custom=pendingImport.custom; S.menu=pendingImport.menu; S.storePick=Object.assign({},S.storePick,pendingImport.storePick); S.checked=[]; S.seeded=true; pendingImport=null; clearHash(); save(); closeLayer(); S.tab="list"; render(); toast(t("t_imported")); } break;
    case "imp-merge": if(pendingImport){ for(const [k,q] of Object.entries(pendingImport.items)){ S.items[k]=Math.max(S.items[k]||0,q); S.checked=S.checked.filter(x=>x!==k); } Object.assign(S.storePick,pendingImport.storePick); for(const c of pendingImport.custom) if(!S.custom.some(x=>DB.fold(x.name)===DB.fold(c.name))&&S.custom.length<100) S.custom.push(c); for(const [d,r] of Object.entries(pendingImport.menu)) if(!S.menu[d]) S.menu[d]=r; S.seeded=true; pendingImport=null; clearHash(); save(); closeLayer(); S.tab="list"; render(); toast(t("t_merged")); } break;
    case "imp-ignore": pendingImport=null; clearHash(); closeLayer(); break;
    case "dstore": dealStore=b.dataset.v; render(); break;
    case "dcat": dealCat=b.dataset.v; render(); break;
    case "rfilter": if(RFILTERS[b.dataset.v]){ recFilter=b.dataset.v; render(); } break;
    case "home": if(DB.get(b.dataset.v)){ S.home=b.dataset.v; save(); render(); } break;
    case "open-recipe": recipeSheet(id); break;
    case "pick-day": dayPicker(b.dataset.day); break;
    case "set-day": if(DB.tableOf(id)==="recipes"){ S.menu[b.dataset.day]=id; save(); closeLayer(); render(); toast(t("t_day",{d:dayN(+b.dataset.day),x:rName(DB.get(id))})); } break;
    case "clear-day": delete S.menu[b.dataset.day]; save(); closeLayer(); render(); break;
    case "toggle-week": toggleWeek(id); break;
    case "auto-menu": autoMenu(); break;
    case "shop-menu": { const n=addMenuToList(); save(); render(); toast(n?t("t_menu_n",{n}):t("t_menu_0")); break; }
    case "recipe-to-list": { const r=DB.get(id); if(r){ const n=addRecipeToList(r); save(); renderNav(); if(S.tab==="list"||S.tab==="home") render(); toast(n?t("t_rec_n",{n}):t("t_rec_0")); } break; }
    case "cook": startCook(id); break;
    case "close": closeLayer(); render(); break;
    case "c-next": if(cook&&cook.i<cook.r.steps.length-1){ stopTimer(); cook.i++; cook.left=cook.r.steps[cook.i][2]; cook.run=false; cook.started=false; drawCook(); } break;
    case "c-prev": if(cook&&cook.i>0){ stopTimer(); cook.i--; cook.left=cook.r.steps[cook.i][2]; cook.run=false; cook.started=false; drawCook(); } break;
    case "t-toggle": if(cook){ if(cook.run){ tick(); stopTimer(); cook.run=false; cook.end=null; } else { if(cook.left<=0) cook.left=cook.r.steps[cook.i][2]; cook.run=true; cook.started=true; cook.end=Date.now()+cook.left*1000; timerI=setInterval(tick,500); } drawCook(); } break;
    case "t-reset": if(cook){ stopTimer(); cook.run=false; cook.started=false; cook.left=cook.r.steps[cook.i][2]; drawCook(); } break;
  }
});
function toggleWeek(id){
  if(DB.tableOf(id)!=="recipes" || DB.get(id).meal!=="Dinner") return;
  const k=Object.keys(S.menu).find(d=>S.menu[d]===id);
  if(k!=null){ delete S.menu[k]; toast(t("t_week_rm")); }
  else { const free=[0,1,2,3,4,5,6].find(d=>!S.menu[d] && !HOLIDAYS[WEEK_DATES[d]]) ?? [0,1,2,3,4,5,6].find(d=>!S.menu[d]);
    if(free==null){ toast(t("t_week_full")); return; }
    S.menu[free]=id; toast(t("t_planned",{d:dayN(free)})); }
  save();
  if($("#layer").innerHTML && DB.get(id)) recipeSheet(id);
  render();
}
function autoMenu(){
  const dinners=DB.from("recipes").where(r=>r.meal==="Dinner").orderBy(r=>-(recipeCost(r).deals*3 - recipeCost(r).cost/5)).all();
  let k=0; for(let d=0; d<7 && k<dinners.length; d++){ if(!S.menu[d]) S.menu[d]=dinners[k++].id; }
  save(); render(); toast(t("t_auto"));
}
let typeT=null;
document.addEventListener("toggle",e=>{ if(e.target&&e.target.id==="favDetails") favOpen=e.target.open; },true);
document.addEventListener("input",e=>{
  const el=e.target;
  if(el.id==="dealSearch"){ dealQ=el.value.slice(0,40); clearTimeout(typeT); typeT=setTimeout(refreshDeals,120); }
  if(el.id==="budgetIn"){ const v=parseFloat(el.value); S.budget=isFinite(v)?clamp(Math.round(v),0,2000):0; save(); const c=$("#sumCard"); if(c) c.outerHTML=summaryHTML(); }
  if(el.id==="favIn"){ const box=$("#favSug"); if(box) box.innerHTML=suggestHTML(el.value,"fav-pick"); }
  if(el.id==="addName"){ const box=$("#addSug"); if(box) box.innerHTML=suggestHTML(el.value,"add-pick"); const f=$("#addForm"); if(f) f.hidden=el.value.trim().length<2; }
});
document.addEventListener("change",e=>{
  const el=e.target;
  if(el.id==="dealSort"){ dealSort=["price","cat","name"].includes(el.value)?el.value:"price"; render(); }
  if(el.id==="bigIn"){ const was=S.big; S.big=el.checked; for(const {m} of favMatches()) if(m && S.items[m.row.id]===favQtyFor(m.row,was)) S.items[m.row.id]=favQtyFor(m.row,S.big); save(); render(); toast(S.big?t("t_more"):t("t_normal")); }
});
document.addEventListener("keydown",e=>{
  if(e.target.id==="favIn" && e.key==="Enter"){
    e.preventDefault(); const v=e.target.value.replace(/[<>]/g,"").trim().slice(0,60);
    if(v && !S.favorites.some(f=>DB.fold(f)===DB.fold(v)) && S.favorites.length<60){
      S.favorites.push(v); const m=DB.match(v); if(m && !S.items[m.row.id]) S.items[m.row.id]=favQty(m.row);
      save(); rerenderKeepFocus("favIn"); toast(m?t("t_added",{x:m.row.name}):t("t_noprice",{x:v}));
    }
  }
  if(e.target.id==="addName" && e.key==="Enter"){ e.preventDefault(); const top=suggestRows(e.target.value,1)[0]; if(top){ S.items[top.id]=(S.items[top.id]||0)+1; save(); render(); toast(t("t_added",{x:top.name})+" · "+storeOf(top)); const inp=$("#addName"); if(inp) inp.focus(); } else { const p=$("#addPrice"); if(p) p.focus(); } }
  if(e.key==="Escape" && $("#layer").innerHTML){ if(pendingImport){ pendingImport=null; clearHash(); } closeLayer(); render(); }
});
document.addEventListener("submit",e=>{
  if(e.target.id!=="addForm") return; e.preventDefault();
  const name=($("#addName").value||"").replace(/[<>]/g,"").trim().slice(0,60); const price=parseFloat(($("#addPrice").value||"").replace(",","."));
  if(!name){ $("#addName").focus(); return; }
  if(!isFinite(price)||price<0||price>500){ $("#addPrice").focus(); toast(t("t_price_range")); return; }
  if(S.custom.length>=100){ toast(t("t_full")); return; }
  const cid="c-"+Math.random().toString(36).slice(2,10);
  S.custom.push({id:cid,name,price:Math.round(price*100)/100,store:$("#addStore").value==="LIDL"?"LIDL":"ALDI",qty:1});
  save(); render(); toast(t("t_added",{x:name}));
});
$("#locBtn").addEventListener("click",()=>{ S.home=S.home==="Bolanden"?"Kaiserslautern":"Bolanden"; save(); render(); toast(t("toast_loc",{x:S.home})); });
const langBtn=$("#langBtn"); if(langBtn) langBtn.addEventListener("click",()=>{ S.lang=de()?"en":"de"; save(); if(cook) drawCook(); else if($("#layer").innerHTML) closeLayer(); render(); });
let rz=null; window.addEventListener("resize",()=>{ clearTimeout(rz); rz=setTimeout(()=>{ paintArt(document); if(S.tab==="stores") paintMap(); },150); });
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible" && cook){ grabWake(); if(cook.run) tick(); } });
window.addEventListener("online",()=>render()); window.addEventListener("offline",()=>render());
window.addEventListener("hashchange",()=>{ const imp=readImport(); if(imp) importSheet(imp); });
if(window.matchMedia){ const mq=window.matchMedia("(prefers-color-scheme: dark)"); if(mq.addEventListener) mq.addEventListener("change",()=>{ if(S.tab==="stores") paintMap(); }); }

/* offline support on the real site (not inside the Claude preview) */
try{ if("serviceWorker" in navigator && /\.github\.io$/.test(location.hostname)) navigator.serviceWorker.register("sw.js").catch(()=>{}); }catch(e){}

/* first run: build the list from the example favorites */
if(!S.seeded){ seedFromFavorites(false); save(); }
render();
const firstImport=readImport(); if(firstImport) importSheet(firstImport);
})();
