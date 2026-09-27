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
    stale:"These deals ended on {date}. New deals arrive Monday morning; your list still works with shelf prices.",
    offline:"You're offline. Showing the deals saved on this phone.",
    valid:"valid Mo {from} – Sa {to}", weekly_deals:"Weekly deals", search_ph:"Search: cheese, Käse, pasta, Kaffee…", search_lbl:"Search deals",
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
    stores_eyebrow:"Hours Mo–Sa · Sundays and holidays closed", stores_title:"Stores near you", your_loc:"Your location",
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
    imp_replace:"Use this list", imp_merge:"Add to my list", imp_ignore:"Ignore", imp_old:"This list is from an older week. Items that are no longer on sale use shelf prices.",
    t_imported:"List loaded", t_merged:"Items added to your list",
    copy_head:"Shopping list", copy_total:"Total"
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
    stale:"Diese Angebote endeten am {date}. Neue Angebote kommen Montagfrüh; deine Liste funktioniert weiter mit Regalpreisen.",
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
    imp_replace:"Diese Liste nutzen", imp_merge:"Zu meiner Liste hinzufügen", imp_ignore:"Ignorieren", imp_old:"Diese Liste ist aus einer älteren Woche. Artikel, die nicht mehr im Angebot sind, nutzen Regalpreise.",
    t_imported:"Liste geladen", t_merged:"Artikel zu deiner Liste hinzugefügt",
    copy_head:"Einkaufsliste", copy_total:"Gesamt"
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
    return '<button type="button" class="day'+(r?'':' empty-day')+(hol?' holiday':'')+'" data-act="'+(r?'open-recipe':'pick-day')+'" data-id="'+esc(r?r.id:"")+'" data-day="'+i+'">'+
      '<span class="dn">'+esc(dayN(i))+' '+fmtD(date)+(date===n.date?' · '+esc(t("today")):'')+'</span>'+(r?'<h4>'+esc(rName(r))+'</h4>':'<span>'+(hol?esc(holN(hol))+' · '+esc(t("tap_plan")):esc(t("plan_dinner")))+'</span>')+'</button>'; }).join("");
  const nA=nearest("ALDI"), nL=nearest("LIDL");
  const menuCount=Object.keys(S.menu).length;
  return '<section class="view">'+
    '<div class="hero">'+
      '<div><span class="wk"><b>'+esc(META.weekLabel)+'</b>Mo '+fmtD(META.validFrom)+' – Sa '+fmtD(META.validTo)+'</span>'+
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
function viewDeals(){
  const cats=["All",...new Set(DB.from("offers").all().map(o=>o.category))].sort((a,b)=>a==="All"?-1:b==="All"?1:cat(a).localeCompare(cat(b)));
  let q=DB.from("offers").search(dealQ).eq("store",dealStore==="All"?null:dealStore).eq("category",dealCat==="All"?null:dealCat);
  q = dealSort==="price"?q.orderBy("price"):dealSort==="name"?q.orderBy(r=>DB.fold(r.name)):q.orderBy(r=>cat(r.category)+DB.fold(r.name));
  const rows=q.all();
  return '<section class="view">'+
    '<div class="sechead"><div><span class="eyebrow">'+esc(META.weekLabel)+' · '+esc(t("valid",{from:fmtD(META.validFrom),to:fmtD(META.validTo)}))+'</span><h2 style="font-size:30px;margin-top:4px">'+esc(t("weekly_deals"))+'</h2></div></div>'+
    notices()+
    '<div class="tools">'+
      '<label class="searchbox"><span class="sr">'+esc(t("search_lbl"))+'</span>'+svg("search")+'<input class="input" id="dealSearch" type="search" maxlength="40" autocomplete="off" placeholder="'+esc(t("search_ph"))+'" value="'+esc(dealQ)+'"></label>'+
      '<div class="tooln"><div class="seg" role="group" aria-label="'+esc(t("store"))+'">'+["All","ALDI","LIDL"].map(s=>'<button type="button" data-act="dstore" data-v="'+s+'" aria-pressed="'+(dealStore===s)+'">'+esc(s==="All"?t("all"):s)+'</button>').join("")+'</div>'+
      '<label class="sr" for="dealSort">Sort</label><select class="input" id="dealSort"><option value="price"'+(dealSort==="price"?" selected":"")+'>'+esc(t("sort_price"))+'</option><option value="cat"'+(dealSort==="cat"?" selected":"")+'>'+esc(t("sort_aisle"))+'</option><option value="name"'+(dealSort==="name"?" selected":"")+'>'+esc(t("sort_name"))+'</option></select>'+
      '<span class="count" aria-live="polite">'+esc(t("n_deals",{n:rows.length}))+'</span></div>'+
      '<div class="chiprow" role="group" aria-label="'+esc(t("category"))+'">'+cats.map(c=>'<button type="button" class="chip" data-act="dcat" data-v="'+esc(c)+'" aria-pressed="'+(dealCat===c)+'">'+(c==="All"?"":svg(c))+esc(c==="All"?t("all"):cat(c))+'</button>').join("")+'</div>'+
    '</div>'+
    (rows.length?'<div class="grid">'+rows.map(dealCard).join("")+'</div>':'<div class="empty">'+esc(t("no_deals"))+'</div>')+
    footer()+
  '</section>';
}
function viewList(){
  const L=lines(), T=totals(L), fm=favMatches();
  const miss=fm.filter(x=>!x.m).map(x=>x.fav);
  const pct=T.b?clamp(T.total/T.b*100,0,100):0;
  const lab={ok:t("on_budget"),warn:t("near_budget"),bad:t("over_budget")}[T.state];
  const cols=["ALDI","LIDL"].map(st=>{
    const ls=L.filter(l=>l.store===st); const sub=ls.reduce((a,l)=>a+l.price*l.qty,0); const nb=nearest(st);
    const cats=[...new Set(ls.map(l=>l.cat))].sort((a,b)=>cat(a).localeCompare(cat(b)));
    return '<div class="card shop"><div class="shophead"><div><span class="store-tag '+st+'">'+(st==="ALDI"?"ALDI SÜD":"LIDL")+'</span>'+
      (nb?'<div class="where">'+esc(nb.s.street)+', '+esc(nb.s.town)+' · '+km(nb.km)+' km</div>':'')+'</div><span class="muted small">'+esc(t("items_n",{n:ls.length}))+'</span></div>'+
      (ls.length?cats.map(c=>'<div class="cat">'+svg(c)+esc(cat(c))+'</div>'+ls.filter(l=>l.cat===c).sort((a,b)=>a.name.localeCompare(b.name)).map(l=>{
        const done=S.checked.includes(l.id); const other=st==="ALDI"?"LIDL":"ALDI";
        return '<div class="li'+(done?' done':'')+'"><button type="button" class="check" data-act="check" data-id="'+esc(l.id)+'" role="checkbox" aria-checked="'+done+'" aria-label="'+esc(t("got_x",{x:l.name}))+'">'+svg("check")+'</button>'+
          '<div><div class="lnm">'+esc(l.name)+'</div><div class="lmeta">'+(l.sale?'<span class="sale">'+esc(t("angebot"))+'</span>':l.custom?'<span>'+esc(t("your_price"))+'</span>':'<span>'+esc(t("shelf"))+'</span>')+
          (l.size?'<span>'+esc(l.size)+'</span>':'')+'<span class="num">'+eur(l.price)+'</span>'+
          (l.swap?'<button type="button" class="store-tag '+other+'" data-act="swap" data-id="'+esc(l.id)+'" title="'+esc(t("other_store"))+'">→ '+other+'</button>':'')+'</div></div>'+
          '<div class="lright"><span class="lprice">'+eur(l.price*l.qty)+'</span><span class="step"><button type="button" data-act="dec" data-id="'+esc(l.id)+'" aria-label="'+esc(t("one_less"))+'">−</button><span>'+l.qty+'</span><button type="button" data-act="inc" data-id="'+esc(l.id)+'" aria-label="'+esc(t("one_more"))+'">+</button></span></div></div>';
      }).join("")).join(""):'<div class="empty" style="margin:14px;border-radius:14px">'+esc(t("nothing_here"))+'</div>')+
      '<div class="shopfoot"><span>'+esc(t("subtotal"))+'</span><span class="num">'+eur(sub)+'</span></div></div>';
  }).join("");
  const doneN=L.filter(l=>S.checked.includes(l.id)).length;
  return '<section class="view">'+
    '<div class="sechead"><div><span class="eyebrow">'+esc(t("household"))+' · '+esc(META.weekLabel)+'</span><h2 style="font-size:30px;margin-top:4px">'+esc(t("list_title"))+'</h2></div>'+
      '<div class="row"><button type="button" class="btn sm primary" data-act="share-open">'+svg("send")+esc(t("share_list"))+'</button><button type="button" class="btn sm" data-act="copy">'+svg("copy")+esc(t("copy"))+'</button>'+(doneN?'<button type="button" class="btn sm" data-act="clear-done">'+esc(t("remove_ticked",{n:doneN}))+'</button>':'')+'</div></div>'+
    '<div class="card summary"><div><span class="eyebrow">'+esc(t("total"))+'</span><div class="big">'+eur(T.total)+'</div></div>'+
      '<div><div class="bar '+T.state+'"><i style="width:'+pct.toFixed(1)+'%"></i></div>'+
      '<div class="stats"><span class="pill '+T.state+'">'+esc(lab)+'</span><span>'+esc(t("budget"))+' <b>'+eur(T.b)+'</b></span><span>'+esc(T.left>=0?t("left"):t("over_by"))+' <b>'+eur(Math.abs(T.left))+'</b></span><span>'+esc(t("on_sale"))+' <b>'+eur(T.sale)+'</b></span><span><b>'+T.count+'</b> '+esc(t("packs"))+'</span></div></div></div>'+
    notices()+
    '<details class="card"'+(S.seeded?'':' open')+'><summary>'+esc(t("fav_budget"))+' '+svg("chev")+'</summary><div class="setbody">'+
      '<div class="field"><label for="favIn">'+esc(t("fav_label"))+'</label><div class="favs">'+
        S.favorites.map((f,i)=>'<span class="fav'+(miss.includes(f)?' miss':'')+'">'+esc(f)+'<button type="button" data-act="unfav" data-i="'+i+'" aria-label="× '+esc(f)+'">×</button></span>').join("")+
        '<input id="favIn" maxlength="40" autocomplete="off" placeholder="'+esc(t("fav_ph"))+'"></div>'+
        '<p class="muted small">'+esc(miss.length?t("no_price_for",{x:miss.join(", ")}):t("all_priced"))+'</p>'+
        '<div class="row"><button type="button" class="btn sm primary" data-act="rebuild">'+esc(t("rebuild"))+'</button><button type="button" class="btn sm" data-act="merge">'+esc(t("merge"))+'</button></div></div>'+
      '<div class="field" style="gap:14px"><div class="field"><label for="budgetIn">'+esc(t("weekly_budget"))+'</label><div class="money"><input id="budgetIn" type="number" inputmode="numeric" min="0" max="2000" step="5" value="'+esc(S.budget)+'"><span>€</span></div></div>'+
        '<label class="switch" for="bigIn"><input type="checkbox" id="bigIn"'+(S.big?' checked':'')+'><span><b>'+esc(t("big"))+'</b><br><span class="muted small">'+esc(t("big_sub"))+'</span></span></label></div>'+
    '</div></details>'+
    '<div class="storecol">'+cols+'</div>'+
    '<div class="card" style="padding:16px 18px;display:flex;flex-direction:column;gap:10px"><h3 style="font-size:17px">'+esc(t("add_else"))+'</h3>'+
      '<form class="addform" id="addForm" autocomplete="off"><input class="input" id="addName" maxlength="60" placeholder="'+esc(t("add_name_ph"))+'" required><input class="input" id="addPrice" inputmode="decimal" maxlength="7" placeholder="'+esc(t("add_price_ph"))+'" required>'+
      '<select class="input" id="addStore"><option>ALDI</option><option>LIDL</option></select><button class="btn primary" type="submit">'+esc(t("add"))+'</button></form></div>'+
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
    '<div class="row"><button type="button" class="btn sm'+(inWeek?' inweek':'')+'" data-act="toggle-week" data-id="'+esc(r.id)+'">'+(inWeek?svg("check")+esc(t("in_week")):esc(t("add_week")))+'</button><button type="button" class="btn sm primary" data-act="open-recipe" data-id="'+esc(r.id)+'">'+esc(t("recipe"))+'</button></div></div></div></article>';
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
    '<span class="pill '+(st.open?(st.soon?'warn':'ok'):'bad')+'">'+svg("clock",' width="13" height="13"')+esc(t(st.code,{t:st.time}))+'</span></div>'+
    '<div><h3>'+esc(s.street)+'</h3><p class="addr">'+esc(s.zip)+' '+esc(s.town)+' · Mo–Sa '+esc(s.open)+'–'+esc(s.close)+'</p></div>'+
    '<div class="sfoot"><span class="dist">'+km(x.km)+' <small>'+esc(t("km_from",{x:S.home}))+'</small></span>'+
    '<a class="btn sm primary" href="'+esc(mapsUrl(s))+'" target="_blank" rel="noopener noreferrer">'+svg("nav")+esc(t("directions"))+'</a></div></article>';
}
function viewStores(){
  const all=storesNear();
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

