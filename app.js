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
      .normalize("NFD").replace(/[̀-ͯ]/g,"").trim();
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
  Added:'<path d="M12 5v14M5 12h14"/>'
};
const svg = (k,extra) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"'+(extra||"")+'>'+(I[k]||I.Pantry)+'</svg>';
const CATCOL = {Meat:"tomato",Fish:"sky",Dairy:"sky",Cheese:"mango",Produce:"basil",Bakery:"mango",Pantry:"plum",Frozen:"sky",Drinks:"basil",Snacks:"tomato","Coffee & tea":"plum",Breakfast:"mango",Household:"plum",Added:"plum"};
const HERO_COL = {tomato:["#F2482B","#FFB020","#8E1F0E"],mango:["#F59E0B","#F2482B","#8A4B00"],basil:["#12A061","#FFB020","#0A5E39"],sky:["#2F7BE8","#12A061","#173E7A"]};

/* ---------------- state: per-device, validated on load ---------------- */
const KEY = "wochenkorb.v2";
const DEFAULT_FAVS = ["chicken","Hackfleisch","pasta","rice","potatoes","eggs","milk","cheese","bread","broccoli","bananas","apples","yogurt","coffee"];
function freshState(){ return {v:2, week:META.validFrom, favorites:DEFAULT_FAVS.slice(), budget:160, big:true, home:"Bolanden",
  items:{}, custom:[], checked:[], storePick:{}, menu:{}, tab:"home", seeded:false}; }
function sanitize(s){
  const d = freshState(); if(!s || typeof s!=="object") return d;
  const str = (x,n) => typeof x==="string" ? x.slice(0,n) : null;
  if(Array.isArray(s.favorites)) d.favorites = s.favorites.map(x=>str(x,40)).filter(Boolean).slice(0,60);
  if(typeof s.budget==="number" && isFinite(s.budget)) d.budget = clamp(Math.round(s.budget),0,2000);
  d.big = !!s.big;
  if(s.home==="Kaiserslautern"||s.home==="Bolanden") d.home = s.home;
  if(["home","deals","list","recipes","stores"].includes(s.tab)) d.tab = s.tab;
  d.seeded = !!s.seeded;
  const sameWeek = s.week===META.validFrom;
  if(s.items && typeof s.items==="object") for(const [k,v] of Object.entries(s.items)){
    if(DB.get(k) && Number.isInteger(v) && v>0) d.items[k]=clamp(v,1,99);
  }
  if(Array.isArray(s.custom)) d.custom = s.custom.slice(0,100).map(c=>({
      id: typeof c.id==="string" && /^c-[a-z0-9]{1,16}$/.test(c.id) ? c.id : null,
      name: str(c.name,60), price: clamp(+c.price||0,0,500), store: c.store==="LIDL"?"LIDL":"ALDI", qty: clamp(parseInt(c.qty)||1,1,99)
    })).filter(c=>c.id&&c.name);
  if(sameWeek && Array.isArray(s.checked)) d.checked = s.checked.filter(x=>typeof x==="string").slice(0,300);
  if(s.storePick && typeof s.storePick==="object") for(const [k,v] of Object.entries(s.storePick)) if(DB.get(k)&&(v==="ALDI"||v==="LIDL")) d.storePick[k]=v;
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
function favQty(r){ const b=r.weeklyQty||1; return b>=2 ? Math.ceil(b*(S.big?1.25:1)-0.001) : b; }
function favMatches(){ return S.favorites.map(f=>({fav:f, m:DB.match(f)})); }
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
function storeStatus(st){
  const n=berlinNow(); const toM=s=>{const [h,m]=s.split(":");return +h*60+ +m;};
  if(HOLIDAYS[n.date]) return {open:false,txt:"Closed today (holiday)"};
  if(n.wd==="Sun") return {open:false,txt:"Closed Sunday · opens Mon "+st.open};
  const o=toM(st.open), c=toM(st.close);
  if(n.mins<o) return {open:false,txt:"Opens "+st.open};
  if(n.mins>=c) return {open:false,txt:"Closed · opens "+st.open};
  if(c-n.mins<=45) return {open:true,soon:true,txt:"Closes "+st.close};
  return {open:true,txt:"Open until "+st.close};
}
function storesNear(){ const h=home();
  return DB.from("stores").all().map(s=>({s,km:haversine(h,s)})).sort((a,b)=>a.km-b.km); }
function nearest(chain){ return storesNear().find(x=>x.s.chain===chain); }
function mapsUrl(st){ return "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(st.chain+" "+st.street+", "+st.zip+" "+st.town)+"&query_place_id="+encodeURIComponent(st.placeId); }

/* ---------------- UI plumbing ---------------- */
const TABS=[["home","Home","home"],["deals","Deals","tag"],["list","List","list"],["recipes","Recipes","pot"],["stores","Stores","pin"]];
function renderNav(){
  const L=lines(); const cnt=L.filter(l=>!S.checked.includes(l.id)).length;
  $("#tabsMob").innerHTML = TABS.map(([id,lab,ic])=>'<button type="button" data-tab="'+id+'"'+(S.tab===id?' aria-current="page"':'')+'>'+svg(ic)+esc(lab)+(id==="list"&&cnt?'<span class="badge">'+cnt+'</span>':'')+'</button>').join("");
  $("#tabsDesk").innerHTML = TABS.map(([id,lab])=>'<button type="button" data-tab="'+id+'"'+(S.tab===id?' aria-current="page"':'')+'>'+esc(lab)+(id==="list"&&cnt?' · '+cnt:'')+'</button>').join("");
  $("#locName").textContent = S.home;
}
let toastT=null;
function toast(msg){ const t=$("#toast"); t.textContent=msg; t.classList.add("show"); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove("show"),1900); }
function go(tab){ if(!TABS.some(t=>t[0]===tab)) return; S.tab=tab; save(); render(); window.scrollTo({top:0,behavior:"instant"in window?"instant":"auto"}); }

/* ---------------- views ---------------- */
let dealQ="", dealStore="All", dealCat="All", dealSort="price", recFilter="All";

function holidayNotice(){
  const days = Object.entries(HOLIDAYS).filter(([d])=>d>=META.validFrom && d<=META.validTo);
  if(!days.length) return "";
  return '<div class="notice" role="note">'+svg("alert")+'<div><b>'+esc(days.map(([d,n])=>DAYS[(new Date(d+"T12:00:00Z").getUTCDay()+6)%7]+" "+fmtD(d)+" is "+n).join(", "))+'.</b> Stores are closed that day, so plan your shopping around it.</div></div>';
}
function dealCard(o){
  const inList=!!S.items[o.id]; const col=CATCOL[o.category]||"plum";
  return '<article class="card deal'+(inList?' in':'')+'">'+
    '<div class="dtop"><span class="ico c-'+col+'">'+svg(o.category)+'</span><span class="store-tag '+esc(o.store)+'">'+esc(o.store)+'</span></div>'+
    '<span class="price">'+eur(o.price)+'</span><span class="nm">'+esc(o.name)+'</span>'+
    '<div class="dfoot"><span class="sz">'+esc(o.size)+'</span>'+
    (inList?'<span class="step"><button type="button" data-act="dec" data-id="'+esc(o.id)+'" aria-label="One less">−</button><span>'+S.items[o.id]+'</span><button type="button" data-act="inc" data-id="'+esc(o.id)+'" aria-label="One more">+</button></span>'
           :'<button type="button" class="addbtn" data-act="add" data-id="'+esc(o.id)+'" aria-label="Add '+esc(o.name)+' to list">'+svg("plus")+'</button>')+
    '</div></article>';
}
function viewHome(){
  const L=lines(), T=totals(L);
  const pct = T.b? clamp(T.total/T.b,0,1):0; const C=2*Math.PI*52;
  const ringCol = T.state==="bad"?"#FF6A4F":T.state==="warn"?"#FFB020":"#35C77F";
  const picks = favMatches().filter(x=>x.m&&isOffer(x.m.row)).map(x=>x.m.row);
  const extra = DB.from("offers").where(o=>!picks.includes(o)&&["Meat","Fish","Dairy","Cheese","Pantry","Frozen"].includes(o.category)).orderBy("price").limit(10-Math.min(picks.length,6)).all();
  const top=[...new Set(picks)].slice(0,6).concat(extra);
  const n=berlinNow();
  const week = DAYS.map((d,i)=>{ const date=WEEK_DATES[i]; const rid=S.menu[i]; const r=rid&&DB.get(rid); const hol=HOLIDAYS[date];
    return '<button type="button" class="day'+(r?'':' empty-day')+(hol?' holiday':'')+'" data-act="'+(r?'open-recipe':'pick-day')+'" data-id="'+esc(r?r.id:"")+'" data-day="'+i+'">'+
      '<span class="dn">'+d+' '+fmtD(date)+(date===n.date?' · today':'')+'</span>'+(r?'<h4>'+esc(r.name)+'</h4>':'<span>'+(hol?esc(hol)+' · tap to plan':'+ Plan dinner')+'</span>')+'</button>'; }).join("");
  const nA=nearest("ALDI"), nL=nearest("LIDL");
  const menuCount=Object.keys(S.menu).length;
  return '<section class="view">'+
    '<div class="hero">'+
      '<div><span class="wk"><b>'+esc(META.weekLabel)+'</b>Mo '+fmtD(META.validFrom)+' – Sa '+fmtD(META.validTo)+'</span>'+
      '<h1><em>'+DB.from("offers").count()+' deals</em> this week at ALDI & LIDL</h1>'+
      '<p>Your list is '+eur(T.total)+' for '+T.count+' items. '+(T.b?(T.left>=0?eur(T.left)+' left in your '+eur(T.b)+' budget.':'That is '+eur(-T.left)+' over budget.'):'')+'</p>'+
      '<div class="acts"><button type="button" class="btn" data-tab="list">'+svg("cart")+'Open my list</button><button type="button" class="btn ghost" data-tab="recipes">'+svg("pot")+'Deal recipes</button></div></div>'+
      '<div class="ring" role="img" aria-label="'+Math.round(pct*100)+'% of budget used"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="12"/><circle cx="60" cy="60" r="52" fill="none" stroke="'+ringCol+'" stroke-width="12" stroke-linecap="round" stroke-dasharray="'+(C*pct).toFixed(1)+' '+C.toFixed(1)+'"/></svg><div class="lbl2"><b>'+Math.round(pct*100)+'%</b><span>of budget</span></div></div>'+
    '</div>'+
    holidayNotice()+
    '<section class="sec"><div class="sechead"><h2>Deals for you</h2><button type="button" class="link" data-tab="deals">See all '+DB.from("offers").count()+'</button></div>'+
      '<div class="hscroll">'+top.map(dealCard).join("")+'</div></section>'+
    '<section class="sec"><div class="sechead"><div><h2>This week\'s dinners</h2><p class="muted small">'+menuCount+' of 7 planned. Tap a day to choose a recipe.</p></div>'+
      (menuCount?'<button type="button" class="btn sm primary" data-act="shop-menu">'+svg("cart")+'Shop for this menu</button>':'<button type="button" class="btn sm" data-act="auto-menu">Fill the week for me</button>')+'</div>'+
      '<div class="week">'+week+'</div></section>'+
    '<section class="sec"><div class="sechead"><h2>Nearest stores</h2><button type="button" class="link" data-tab="stores">All stores</button></div>'+
      '<div class="duo">'+[nA,nL].filter(Boolean).map(storeCard).join("")+'</div></section>'+
    footer()+
  '</section>';
}
function viewDeals(){
  const cats=["All",...new Set(DB.from("offers").all().map(o=>o.category))].sort((a,b)=>a==="All"?-1:b==="All"?1:a.localeCompare(b));
  let q=DB.from("offers").search(dealQ).eq("store",dealStore==="All"?null:dealStore).eq("category",dealCat==="All"?null:dealCat);
  q = dealSort==="price"?q.orderBy("price"):dealSort==="name"?q.orderBy(r=>DB.fold(r.name)):q.orderBy(r=>r.category+DB.fold(r.name));
  const rows=q.all();
  return '<section class="view">'+
    '<div class="sechead"><div><span class="eyebrow">'+esc(META.weekLabel)+' · valid Mo '+fmtD(META.validFrom)+' – Sa '+fmtD(META.validTo)+'</span><h2 style="font-size:30px;margin-top:4px">Weekly deals</h2></div></div>'+
    '<div class="tools">'+
      '<label class="searchbox"><span class="sr">Search deals</span>'+svg("search")+'<input class="input" id="dealSearch" type="search" maxlength="40" autocomplete="off" placeholder="Search: Käse, pasta, Kaffee…" value="'+esc(dealQ)+'"></label>'+
      '<div class="tooln"><div class="seg" role="group" aria-label="Store">'+["All","ALDI","LIDL"].map(s=>'<button type="button" data-act="dstore" data-v="'+s+'" aria-pressed="'+(dealStore===s)+'">'+s+'</button>').join("")+'</div>'+
      '<label class="sr" for="dealSort">Sort</label><select class="input" id="dealSort"><option value="price"'+(dealSort==="price"?" selected":"")+'>Cheapest first</option><option value="cat"'+(dealSort==="cat"?" selected":"")+'>By aisle</option><option value="name"'+(dealSort==="name"?" selected":"")+'>A–Z</option></select>'+
      '<span class="count" aria-live="polite">'+rows.length+' deals</span></div>'+
      '<div class="chiprow" role="group" aria-label="Category">'+cats.map(c=>'<button type="button" class="chip" data-act="dcat" data-v="'+esc(c)+'" aria-pressed="'+(dealCat===c)+'">'+(c==="All"?"":svg(c))+esc(c)+'</button>').join("")+'</div>'+
    '</div>'+
    (rows.length?'<div class="grid">'+rows.map(dealCard).join("")+'</div>':'<div class="empty">No deals match. Try another word or clear the filters.</div>')+
    footer()+
  '</section>';
}
function viewList(){
  const L=lines(), T=totals(L), fm=favMatches();
  const miss=fm.filter(x=>!x.m).map(x=>x.fav);
  const pct=T.b?clamp(T.total/T.b*100,0,100):0;
  const lab={ok:"On budget",warn:"Close to budget",bad:"Over budget"}[T.state];
  const cols=["ALDI","LIDL"].map(st=>{
    const ls=L.filter(l=>l.store===st); const sub=ls.reduce((a,l)=>a+l.price*l.qty,0); const nb=nearest(st);
    const cats=[...new Set(ls.map(l=>l.cat))].sort();
    return '<div class="card shop"><div class="shophead"><div><span class="store-tag '+st+'">'+(st==="ALDI"?"ALDI SÜD":"LIDL")+'</span>'+
      (nb?'<div class="where">'+esc(nb.s.street)+', '+esc(nb.s.town)+' · '+nb.km.toFixed(1).replace(".",",")+' km</div>':'')+'</div><span class="muted small">'+ls.length+' items</span></div>'+
      (ls.length?cats.map(c=>'<div class="cat">'+svg(c)+esc(c)+'</div>'+ls.filter(l=>l.cat===c).sort((a,b)=>a.name.localeCompare(b.name)).map(l=>{
        const done=S.checked.includes(l.id);
        return '<div class="li'+(done?' done':'')+'"><button type="button" class="check" data-act="check" data-id="'+esc(l.id)+'" role="checkbox" aria-checked="'+done+'" aria-label="Got '+esc(l.name)+'">'+svg("check")+'</button>'+
          '<div><div class="lnm">'+esc(l.name)+'</div><div class="lmeta">'+(l.sale?'<span class="sale">ANGEBOT</span>':l.custom?'<span>your price</span>':'<span>shelf price</span>')+
          (l.size?'<span>'+esc(l.size)+'</span>':'')+'<span class="num">'+eur(l.price)+'</span>'+
          (l.swap?'<button type="button" class="store-tag '+(st==="ALDI"?"LIDL":"ALDI")+'" data-act="swap" data-id="'+esc(l.id)+'" title="Buy at the other store">→ '+(st==="ALDI"?"LIDL":"ALDI")+'</button>':'')+'</div></div>'+
          '<div class="lright"><span class="lprice">'+eur(l.price*l.qty)+'</span><span class="step"><button type="button" data-act="dec" data-id="'+esc(l.id)+'" aria-label="One less">−</button><span>'+l.qty+'</span><button type="button" data-act="inc" data-id="'+esc(l.id)+'" aria-label="One more">+</button></span></div></div>';
      }).join("")).join(""):'<div class="empty" style="margin:14px;border-radius:14px">Nothing to buy here yet.</div>')+
      '<div class="shopfoot"><span>Subtotal</span><span class="num">'+eur(sub)+'</span></div></div>';
  }).join("");
  const doneN=L.filter(l=>S.checked.includes(l.id)).length;
  return '<section class="view">'+
    '<div class="sechead"><div><span class="eyebrow">Household of 4 · '+esc(META.weekLabel)+'</span><h2 style="font-size:30px;margin-top:4px">Shopping list</h2></div>'+
      '<div class="row"><button type="button" class="btn sm" data-act="copy">'+svg("copy")+'Copy</button>'+(doneN?'<button type="button" class="btn sm" data-act="clear-done">Remove '+doneN+' ticked</button>':'')+'</div></div>'+
    '<div class="card summary"><div><span class="eyebrow">Total</span><div class="big">'+eur(T.total)+'</div></div>'+
      '<div><div class="bar '+T.state+'"><i style="width:'+pct.toFixed(1)+'%"></i></div>'+
      '<div class="stats"><span class="pill '+T.state+'">'+lab+'</span><span>Budget <b>'+eur(T.b)+'</b></span><span>'+(T.left>=0?'Left':'Over by')+' <b>'+eur(Math.abs(T.left))+'</b></span><span>On sale <b>'+eur(T.sale)+'</b></span><span><b>'+T.count+'</b> packs</span></div></div></div>'+
    holidayNotice()+
    '<details class="card"'+(S.seeded?'':' open')+'><summary>Favorites & budget '+svg("chev")+'</summary><div class="setbody">'+
      '<div class="field"><label for="favIn">Favorite groceries</label><div class="favs">'+
        S.favorites.map((f,i)=>'<span class="fav'+(miss.includes(f)?' miss':'')+'">'+esc(f)+'<button type="button" data-act="unfav" data-i="'+i+'" aria-label="Remove '+esc(f)+'">×</button></span>').join("")+
        '<input id="favIn" maxlength="40" autocomplete="off" placeholder="Add, then Enter (English or German)"></div>'+
        '<p class="muted small">'+(miss.length?'No price for: '+esc(miss.join(", "))+'. Add it below with the price you see.':'Every favorite has a price this week.')+'</p>'+
        '<div class="row"><button type="button" class="btn sm primary" data-act="rebuild">Rebuild list from favorites</button><button type="button" class="btn sm" data-act="merge">Add missing favorites</button></div></div>'+
      '<div class="field" style="gap:14px"><div class="field"><label for="budgetIn">Weekly budget</label><div class="money"><input id="budgetIn" type="number" inputmode="numeric" min="0" max="2000" step="5" value="'+esc(S.budget)+'"><span>€</span></div></div>'+
        '<label class="switch" for="bigIn"><input type="checkbox" id="bigIn"'+(S.big?' checked':'')+'><span><b>Big appetites</b><br><span class="muted small">Four near-grown adults, +25% on bulk items</span></span></label></div>'+
    '</div></details>'+
    '<div class="storecol">'+cols+'</div>'+
    '<div class="card" style="padding:16px 18px;display:flex;flex-direction:column;gap:10px"><h3 style="font-size:17px">Add something else</h3>'+
      '<form class="addform" id="addForm" autocomplete="off"><input class="input" id="addName" maxlength="60" placeholder="Item, e.g. Avocados" required><input class="input" id="addPrice" inputmode="decimal" maxlength="7" placeholder="Price €" required>'+
      '<select class="input" id="addStore"><option>ALDI</option><option>LIDL</option></select><button class="btn primary" type="submit">Add</button></form></div>'+
    footer()+
  '</section>';
}
function recipeCard(r){
  const c=recipeCost(r); const inWeek=Object.values(S.menu).includes(r.id);
  return '<article class="card rcard">'+
    '<div class="rband" data-art="'+esc(r.color)+'" data-seed="'+esc(r.id)+'"><canvas aria-hidden="true"></canvas><span class="meal">'+esc(r.meal)+' · '+r.mins+' min</span></div>'+
    '<div class="rbody"><h3>'+esc(r.name)+'</h3><span class="de">'+esc(r.de)+'</span><p>'+esc(r.blurb)+'</p>'+
    '<div class="row"><span class="pill bad">'+c.deals+' deal'+(c.deals===1?'':'s')+'</span><span class="pill info">'+esc(r.level)+'</span></div>'+
    '<div class="rfoot"><div class="rcost"><b class="num">'+eur(c.cost)+'</b><span>'+eur(c.per)+' per person</span></div>'+
    '<div class="row"><button type="button" class="btn sm'+(inWeek?' inweek':'')+'" data-act="toggle-week" data-id="'+esc(r.id)+'">'+(inWeek?svg("check")+'In week':'+ Week')+'</button><button type="button" class="btn sm primary" data-act="open-recipe" data-id="'+esc(r.id)+'">Recipe</button></div></div></div></article>';
}
function viewRecipes(){
  const f={All:()=>true,Dinner:r=>r.meal==="Dinner",Breakfast:r=>r.meal==="Breakfast","Under 30 min":r=>r.mins<=30,"Most deals":()=>true};
  let q=DB.from("recipes").where(f[recFilter]||f.All);
  q = recFilter==="Most deals"?q.orderBy(r=>-recipeCost(r).deals):q.orderBy(r=>recipeCost(r).cost);
  return '<section class="view">'+
    '<div class="sechead"><div><span class="eyebrow">Built from '+esc(META.weekLabel)+' deals · serves 4</span><h2 style="font-size:30px;margin-top:4px">Deal recipes</h2></div></div>'+
    '<div class="chiprow" role="group" aria-label="Filter recipes">'+Object.keys(f).map(k=>'<button type="button" class="chip" data-act="rfilter" data-v="'+esc(k)+'" aria-pressed="'+(recFilter===k)+'">'+esc(k)+'</button>').join("")+'</div>'+
    '<div class="rgrid">'+q.all().map(recipeCard).join("")+'</div>'+
    footer()+
  '</section>';
}
function storeCard(x){
  const {s,km}=x; const st=storeStatus(s);
  return '<article class="card scard"><div class="st"><span class="store-tag '+esc(s.chain)+'">'+(s.chain==="ALDI"?"ALDI SÜD":"LIDL")+'</span>'+
    '<span class="pill '+(st.open?(st.soon?'warn':'ok'):'bad')+'">'+svg("clock",' width="13" height="13"')+esc(st.txt)+'</span></div>'+
    '<div><h3>'+esc(s.street)+'</h3><p class="addr">'+esc(s.zip)+' '+esc(s.town)+' · Mo–Sa '+esc(s.open)+'–'+esc(s.close)+'</p></div>'+
    '<div class="sfoot"><span class="dist">'+km.toFixed(1).replace(".",",")+' <small>km from '+esc(S.home)+'</small></span>'+
    '<a class="btn sm primary" href="'+esc(mapsUrl(s))+'" target="_blank" rel="noopener noreferrer">'+svg("nav")+'Directions</a></div></article>';
}
function viewStores(){
  const all=storesNear();
  return '<section class="view">'+
    '<div class="sechead"><div><span class="eyebrow">Hours Mo–Sa · Sundays and holidays closed</span><h2 style="font-size:30px;margin-top:4px">Stores near you</h2></div>'+
      '<div class="seg" role="group" aria-label="Your location">'+DB.from("homes").all().map(h=>'<button type="button" data-act="home" data-v="'+esc(h.id)+'" aria-pressed="'+(S.home===h.id)+'">'+esc(h.label)+'</button>').join("")+'</div></div>'+
    holidayNotice()+
    '<div class="mapbox"><canvas id="map" aria-label="Map of stores around Bolanden and Kaiserslautern" role="img"></canvas></div>'+
    '<div class="legend"><span><i style="background:var(--sky)"></i>ALDI SÜD</span><span><i style="background:var(--mango)"></i>LIDL</span><span><i style="background:var(--tomato)"></i>'+esc(S.home)+'</span></div>'+
    '<div class="sgrid">'+all.map(storeCard).join("")+'</div>'+
    '<p class="muted small">Weekly Prospekt deals are the same across ALDI SÜD and LIDL stores in the region, but stock varies by branch. Bolanden has no discounter of its own; the nearest are in Kirchheimbolanden.</p>'+
    footer()+
  '</section>';
}
function footer(){
  return '<footer class="foot"><p>Deal prices from the '+esc(META.weekLabel)+' ALDI SÜD and LIDL Prospekte (updated '+esc(fmtD(META.updated))+'). "Shelf price" items use typical everyday discounter prices and are estimates. Fresh meat and produce deals are published on Monday.</p>'+
    '<p>Check the originals: <a href="https://www.aldi-sued.de/angebote" target="_blank" rel="noopener noreferrer">ALDI SÜD Angebote</a> · <a href="https://www.lidl.de/c/online-prospekte/s10005610" target="_blank" rel="noopener noreferrer">LIDL Prospekte</a></p>'+
    '<p>Your list stays on this phone. Nothing is sent anywhere.</p></footer>';
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

/* ---------------- sheets: recipe detail, day picker, cook mode ---------- */
let lastFocus=null;
function openLayer(html){ lastFocus=document.activeElement; $("#layer").innerHTML=html; document.body.style.overflow="hidden";
  const f=$("#layer").querySelector("[data-autofocus]")||$("#layer").querySelector("button"); if(f) f.focus(); paintArt($("#layer")); }
function closeLayer(){ stopTimer(); releaseWake(); $("#layer").innerHTML=""; document.body.style.overflow=""; if(lastFocus&&lastFocus.focus) lastFocus.focus(); }
function recipeSheet(id){
  const r=DB.get(id); if(!r||DB.tableOf(id)!=="recipes") return; const c=recipeCost(r); const inWeek=Object.values(S.menu).includes(r.id);
  const ing=r.ing.map(([ref,label,amt])=>{ const it=ref&&DB.get(ref); const deal=it&&isOffer(it);
    return '<div class="ing"><span class="dot'+(deal?' deal':'')+'"></span><div><div class="lnm">'+esc(label)+'</div><div class="lmeta">'+(amt?'<span>'+esc(amt)+'</span>':'')+
      (it?'<span class="store-tag '+storeOf(it)+'">'+storeOf(it)+'</span><span>'+esc(it.name)+'</span>':'<span>from your pantry</span>')+'</div></div>'+
      (it?'<span class="lprice">'+(deal?'<span class="sale">ANGEBOT</span> ':'')+eur(priceOf(it))+'</span>':'<span></span>')+'</div>'; }).join("");
  const steps=r.steps.map(([t,txt,sec])=>'<li><div><b>'+esc(t)+'</b>'+esc(txt)+(sec?'<div class="t">'+svg("clock",' width="12" height="12" style="vertical-align:-2px"')+' '+Math.round(sec/60)+' min</div>':'')+'</div></li>').join("");
  openLayer('<div class="sheet-wrap" data-act="close-bg"><div class="sheet" role="dialog" aria-modal="true" aria-label="'+esc(r.name)+'">'+
    '<div class="sheethead" data-art="'+esc(r.color)+'" data-seed="'+esc(r.id)+'"><canvas aria-hidden="true"></canvas><button type="button" class="close" data-act="close" aria-label="Close" data-autofocus>'+svg("x")+'</button>'+
    '<h2>'+esc(r.name)+'</h2><div class="de">'+esc(r.de)+'</div><div class="facts"><span>Serves 4</span><span>'+r.mins+' min</span><span>'+eur(c.cost)+' total</span><span>'+eur(c.per)+' / person</span><span>'+c.deals+' deals</span></div></div>'+
    '<div class="sheetbody"><p class="muted">'+esc(r.blurb)+'</p>'+
    '<div class="sheetacts"><button type="button" class="btn hot" data-act="cook" data-id="'+esc(r.id)+'">'+svg("play")+'Start cooking</button><button type="button" class="btn primary" data-act="recipe-to-list" data-id="'+esc(r.id)+'">'+svg("cart")+'Add ingredients to list</button></div>'+
    '<section class="sec"><h3 style="font-size:19px">Ingredients</h3><div class="card" style="padding:4px 16px">'+ing+'</div><p class="muted small">Red dot = on sale this week. Cost counts only the share of each pack the recipe uses.</p></section>'+
    '<section class="sec"><h3 style="font-size:19px">Method</h3><ol class="steps">'+steps+'</ol></section>'+
    '<button type="button" class="btn'+(inWeek?' inweek':'')+'" data-act="toggle-week" data-id="'+esc(r.id)+'">'+(inWeek?svg("check")+'In this week\'s menu':'+ Add to this week\'s menu')+'</button>'+
    '</div></div></div>');
}
function dayPicker(day){
  const d=+day; if(!(d>=0&&d<=6)) return;
  const rows=DB.from("recipes").where(r=>r.meal==="Dinner").orderBy(r=>recipeCost(r).cost).all();
  openLayer('<div class="sheet-wrap" data-act="close-bg"><div class="sheet" role="dialog" aria-modal="true" aria-label="Choose dinner">'+
    '<div class="sheetbody"><div class="sechead"><div><span class="eyebrow">'+DAYS[d]+' '+fmtD(WEEK_DATES[d])+'</span><h2 style="font-size:24px">Pick a dinner</h2></div><button type="button" class="btn sm" data-act="close" data-autofocus>Close</button></div>'+
    (S.menu[d]?'<button type="button" class="btn" data-act="clear-day" data-day="'+d+'">Clear '+DAYS[d]+'</button>':'')+
    rows.map(r=>{const c=recipeCost(r);return '<button type="button" class="card" style="display:flex;gap:12px;align-items:center;padding:12px;text-align:left" data-act="set-day" data-day="'+d+'" data-id="'+esc(r.id)+'"><span class="ico c-'+esc(r.color==="sky"?"sky":r.color)+'">'+svg("pot")+'</span><span style="flex:1"><b style="display:block">'+esc(r.name)+'</b><span class="muted small">'+r.mins+' min · '+c.deals+' deals</span></span><span class="num">'+eur(c.cost)+'</span></button>';}).join("")+
    '</div></div></div>');
}
/* cook mode */
let cook=null, timerI=null, wake=null;
function stopTimer(){ clearInterval(timerI); timerI=null; }
function releaseWake(){ try{ if(wake) wake.release(); }catch(e){} wake=null; }
async function grabWake(){ try{ if(navigator.wakeLock) wake=await navigator.wakeLock.request("screen"); }catch(e){ wake=null; } }
function startCook(id){ const r=DB.get(id); if(!r||DB.tableOf(id)!=="recipes") return; stopTimer(); cook={r,i:0,left:r.steps[0][2],run:false}; grabWake(); drawCook(); }
function fmtT(s){ s=Math.max(0,s|0); return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0"); }
function drawCook(){
  const {r,i}=cook; const [t,txt,sec]=r.steps[i]; const last=i===r.steps.length-1;
  $("#layer").innerHTML='<div class="cook" role="dialog" aria-modal="true" aria-label="Cooking '+esc(r.name)+'">'+
    '<div class="cooktop"><div><span class="eyebrow" style="color:#D9C9F2">Cook mode</span><div style="font-family:var(--display);font-weight:800;font-size:18px">'+esc(r.name)+'</div></div><button type="button" class="close" data-act="close" aria-label="Leave cook mode">'+svg("x")+'</button></div>'+
    '<div class="prog">'+r.steps.map((_,k)=>'<i class="'+(k<=i?'on':'')+'"></i>').join("")+'</div>'+
    '<div class="cookmain"><span class="sn">Step '+(i+1)+' of '+r.steps.length+'</span><h2>'+esc(t)+'</h2><p>'+esc(txt)+'</p>'+
    (sec?'<div class="timer'+(cook.left<=0&&cook.started?' done':'')+'" id="timer"><span class="tv" id="tv">'+fmtT(cook.left)+'</span>'+
      '<button type="button" class="btn" data-act="t-toggle">'+svg(cook.run?"pause":"play")+(cook.run?'Pause':'Start timer')+'</button><button type="button" class="btn ghost" data-act="t-reset" aria-label="Reset timer">'+svg("reset")+'</button></div>':'')+
    '</div><div class="cooknav"><button type="button" class="btn ghost" data-act="c-prev"'+(i===0?' disabled':'')+'>Back</button><button type="button" class="btn go" data-act="'+(last?'close':'c-next')+'" data-autofocus>'+(last?'Done, enjoy!':'Next step')+'</button></div></div>';
  const f=$("#layer").querySelector("[data-autofocus]"); if(f) f.focus();
}
function tick(){ if(!cook) return stopTimer(); cook.left--; const tv=$("#tv"); if(tv) tv.textContent=fmtT(cook.left);
  if(cook.left<=0){ stopTimer(); cook.run=false; drawCook(); try{ navigator.vibrate&&navigator.vibrate([300,150,300]); }catch(e){} } }

/* ---------------- render + events ---------------- */
function render(){
  renderNav();
  const v={home:viewHome,deals:viewDeals,list:viewList,recipes:viewRecipes,stores:viewStores}[S.tab]||viewHome;
  $("#app").innerHTML=v();
  paintArt($("#app")); if(S.tab==="stores") paintMap();
}
function rerenderKeepFocus(id){ const pos=document.getElementById(id)?.selectionStart; render(); const el=document.getElementById(id); if(el){ el.focus(); try{ if(pos!=null) el.setSelectionRange(pos,pos);}catch(e){} } }

document.addEventListener("click",e=>{
  const tabB=e.target.closest("[data-tab]"); if(tabB){ go(tabB.dataset.tab); return; }
  const b=e.target.closest("[data-act]"); if(!b) return;
  const act=b.dataset.act, id=b.dataset.id;
  if(act==="close-bg"){ if(e.target===b) closeLayer(); return; }
  switch(act){
    case "add": if(DB.get(id)){ S.items[id]=(S.items[id]||0)+1; save(); render(); toast("Added to your list"); } break;
    case "inc": if(S.items[id]!=null){ S.items[id]=clamp(S.items[id]+1,1,99); } else { const c=S.custom.find(x=>x.id===id); if(c) c.qty=clamp(c.qty+1,1,99); } save(); render(); break;
    case "dec": if(S.items[id]!=null){ if(S.items[id]<=1) delete S.items[id]; else S.items[id]--; } else { const i=S.custom.findIndex(x=>x.id===id); if(i>=0){ if(S.custom[i].qty<=1) S.custom.splice(i,1); else S.custom[i].qty--; } } save(); render(); break;
    case "check": { const i=S.checked.indexOf(id); if(i>=0) S.checked.splice(i,1); else S.checked.push(id); save(); render(); break; }
    case "swap": { const r=DB.get(id); if(r&&!isOffer(r)){ S.storePick[id]=storeOf(r)==="ALDI"?"LIDL":"ALDI"; save(); render(); toast("Moved to "+S.storePick[id]); } break; }
    case "clear-done": for(const cid of S.checked){ delete S.items[cid]; S.custom=S.custom.filter(c=>c.id!==cid); } S.checked=[]; save(); render(); toast("Ticked items removed"); break;
    case "unfav": { const i=+b.dataset.i; if(i>=0&&i<S.favorites.length){ S.favorites.splice(i,1); save(); render(); } break; }
    case "rebuild": seedFromFavorites(false); S.checked=[]; save(); render(); toast("List rebuilt from favorites"); break;
    case "merge": seedFromFavorites(true); save(); render(); toast("Favorites added"); break;
    case "copy": copyList(b); break;
    case "dstore": dealStore=b.dataset.v; render(); break;
    case "dcat": dealCat=b.dataset.v; render(); break;
    case "rfilter": recFilter=b.dataset.v; render(); break;
    case "home": if(DB.get(b.dataset.v)){ S.home=b.dataset.v; save(); render(); } break;
    case "open-recipe": recipeSheet(id); break;
    case "pick-day": dayPicker(b.dataset.day); break;
    case "set-day": if(DB.tableOf(id)==="recipes"){ S.menu[b.dataset.day]=id; save(); closeLayer(); render(); toast(DAYS[+b.dataset.day]+": "+DB.get(id).name); } break;
    case "clear-day": delete S.menu[b.dataset.day]; save(); closeLayer(); render(); break;
    case "toggle-week": toggleWeek(id); break;
    case "auto-menu": autoMenu(); break;
    case "shop-menu": { const n=addMenuToList(); save(); render(); toast(n?n+" ingredients added for the menu":"Everything for the menu is already on your list"); break; }
    case "recipe-to-list": { const r=DB.get(id); if(r){ const n=addRecipeToList(r); save(); renderNav(); if(S.tab==="list"||S.tab==="home") render(); toast(n?n+" ingredients added":"All ingredients already on your list"); } break; }
    case "cook": startCook(id); break;
    case "close": closeLayer(); render(); break;
    case "c-next": if(cook&&cook.i<cook.r.steps.length-1){ stopTimer(); cook.i++; cook.left=cook.r.steps[cook.i][2]; cook.run=false; cook.started=false; drawCook(); } break;
    case "c-prev": if(cook&&cook.i>0){ stopTimer(); cook.i--; cook.left=cook.r.steps[cook.i][2]; cook.run=false; cook.started=false; drawCook(); } break;
    case "t-toggle": if(cook){ if(cook.run){ stopTimer(); cook.run=false; } else { if(cook.left<=0) cook.left=cook.r.steps[cook.i][2]; cook.run=true; cook.started=true; timerI=setInterval(tick,1000); } drawCook(); } break;
    case "t-reset": if(cook){ stopTimer(); cook.run=false; cook.started=false; cook.left=cook.r.steps[cook.i][2]; drawCook(); } break;
  }
});
function toggleWeek(id){
  if(DB.tableOf(id)!=="recipes") return;
  const k=Object.keys(S.menu).find(d=>S.menu[d]===id);
  if(k!=null){ delete S.menu[k]; toast("Removed from the week"); }
  else { const free=[0,1,2,3,4,5,6].find(d=>!S.menu[d] && !HOLIDAYS[WEEK_DATES[d]]) ?? [0,1,2,3,4,5,6].find(d=>!S.menu[d]);
    if(free==null){ toast("The week is full. Clear a day on Home first."); return; }
    S.menu[free]=id; toast("Planned for "+DAYS[free]); }
  save();
  if($("#layer").innerHTML && DB.get(id)) recipeSheet(id);
  render();
}
function autoMenu(){
  const dinners=DB.from("recipes").where(r=>r.meal==="Dinner").orderBy(r=>-(recipeCost(r).deals*3 - recipeCost(r).cost/5)).all();
  let k=0; for(let d=0; d<7 && k<dinners.length; d++){ if(!S.menu[d]) S.menu[d]=dinners[k++].id; }
  save(); render(); toast("7 dinners planned. Tap a day to change it.");
}
async function copyList(b){
  const L=lines(); const T=totals(L);
  const txt=["ALDI","LIDL"].map(st=>{const ls=L.filter(l=>l.store===st); if(!ls.length) return "";
    return (st==="ALDI"?"ALDI SÜD":"LIDL")+"\n"+ls.map(l=>(S.checked.includes(l.id)?"☑ ":"☐ ")+l.qty+"× "+l.name+(l.size?" ("+l.size+")":"")+" – "+eur(l.price*l.qty)).join("\n");}).filter(Boolean).join("\n\n")+"\n\nTotal "+eur(T.total);
  try{ await navigator.clipboard.writeText(txt); toast("List copied. Paste it into WhatsApp or Notes."); }
  catch(e){ toast("Copy was blocked on this device"); }
}
document.addEventListener("input",e=>{
  const t=e.target;
  if(t.id==="dealSearch"){ dealQ=t.value.slice(0,40); rerenderKeepFocus("dealSearch"); }
  if(t.id==="budgetIn"){ const v=parseFloat(t.value); S.budget=isFinite(v)?clamp(Math.round(v),0,2000):0; save(); rerenderKeepFocus("budgetIn"); }
});
document.addEventListener("change",e=>{
  const t=e.target;
  if(t.id==="dealSort"){ dealSort=["price","cat","name"].includes(t.value)?t.value:"price"; render(); }
  if(t.id==="bigIn"){ S.big=t.checked; seedFromFavorites(false); save(); render(); toast(S.big?"Quantities increased":"Normal quantities"); }
});
document.addEventListener("keydown",e=>{
  if(e.target.id==="favIn" && (e.key==="Enter"||e.key===",")){
    e.preventDefault(); const v=e.target.value.replace(/[<>]/g,"").trim().slice(0,40);
    if(v && !S.favorites.some(f=>DB.fold(f)===DB.fold(v)) && S.favorites.length<60){
      S.favorites.push(v); const m=DB.match(v); if(m && !S.items[m.row.id]) S.items[m.row.id]=favQty(m.row);
      save(); rerenderKeepFocus("favIn"); toast(m?"Added "+m.row.name:"No price found for "+v);
    }
  }
  if(e.key==="Escape" && $("#layer").innerHTML){ closeLayer(); render(); }
});
document.addEventListener("submit",e=>{
  if(e.target.id!=="addForm") return; e.preventDefault();
  const name=$("#addName").value.replace(/[<>]/g,"").trim().slice(0,60); const price=parseFloat($("#addPrice").value.replace(",","."));
  if(!name){ $("#addName").focus(); return; }
  if(!isFinite(price)||price<0||price>500){ $("#addPrice").focus(); toast("Enter a price between 0 and 500 €"); return; }
  if(S.custom.length>=100){ toast("Your list is full"); return; }
  const id="c-"+Math.random().toString(36).slice(2,10);
  S.custom.push({id,name,price:Math.round(price*100)/100,store:$("#addStore").value==="LIDL"?"LIDL":"ALDI",qty:1});
  save(); render(); toast("Added "+name);
});
$("#locBtn").addEventListener("click",()=>{ S.home=S.home==="Bolanden"?"Kaiserslautern":"Bolanden"; save(); render(); toast("Location: "+S.home); });
let rz=null; window.addEventListener("resize",()=>{ clearTimeout(rz); rz=setTimeout(()=>{ paintArt(document); if(S.tab==="stores") paintMap(); },150); });
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible" && cook) grabWake(); });
if(window.matchMedia) window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change",()=>{ if(S.tab==="stores") paintMap(); });

/* first run: build the list from the example favorites */
if(!S.seeded){ seedFromFavorites(false); save(); }
render();
})();
