/* ---------------- sheets: recipe detail, day picker, share, import, cook mode ---------- */
let lastFocus=null;
function openLayer(html){ lastFocus=document.activeElement; $("#layer").innerHTML=html; document.body.style.overflow="hidden";
  const f=$("#layer").querySelector("[data-autofocus]")||$("#layer").querySelector("button"); if(f) f.focus(); paintArt($("#layer")); }
function closeLayer(){ stopTimer(); releaseWake(); cook=null; $("#layer").innerHTML=""; document.body.style.overflow=""; if(lastFocus&&lastFocus.focus) lastFocus.focus(); }
const sheet = (label, inner) => '<div class="sheet-wrap" data-act="close-bg"><div class="sheet" role="dialog" aria-modal="true" aria-label="'+esc(label)+'">'+inner+'</div></div>';
function recipeSheet(id){
  const r=DB.get(id); if(!r||DB.tableOf(id)!=="recipes") return; const c=recipeCost(r); const inWeek=Object.values(S.menu).includes(r.id);
  const ing=r.ing.map(([ref,,amt],i)=>{ const it=ref&&DB.get(ref); const deal=it&&isOffer(it);
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
    '<button type="button" class="btn'+(inWeek?' inweek':'')+'" data-act="toggle-week" data-id="'+esc(r.id)+'">'+(inWeek?svg("check")+esc(t("in_menu")):esc(t("add_menu")))+'</button>'+
    '</div>'));
}
function dayPicker(day){
  const d=+day; if(!(d>=0&&d<=6)) return;
  const rows=DB.from("recipes").where(r=>r.meal==="Dinner").orderBy(r=>recipeCost(r).cost).all();
  openLayer(sheet(t("pick_dinner"),
    '<div class="sheetbody"><div class="sechead"><div><span class="eyebrow">'+esc(dayN(d))+' '+fmtD(WEEK_DATES[d])+'</span><h2 style="font-size:24px">'+esc(t("pick_dinner"))+'</h2></div><button type="button" class="btn sm" data-act="close" data-autofocus>'+esc(t("close"))+'</button></div>'+
    (S.menu[d]?'<button type="button" class="btn" data-act="clear-day" data-day="'+d+'">'+esc(t("clear_day",{d:dayN(d)}))+'</button>':'')+
    rows.map(r=>{const c=recipeCost(r);return '<button type="button" class="card pickrow" data-act="set-day" data-day="'+d+'" data-id="'+esc(r.id)+'"><span class="ico c-'+esc(r.color)+'">'+svg("pot")+'</span><span style="flex:1"><b style="display:block">'+esc(rName(r))+'</b><span class="muted small">'+r.mins+' '+esc(t("min"))+' · '+esc(c.deals===1?t("deal_1"):t("deals_n",{n:c.deals}))+'</span></span><span class="num">'+eur(c.cost)+'</span></button>';}).join("")+
    '</div>'));
}

/* ---- list sharing: the whole list travels inside the link (#l=…), nothing is uploaded ---- */
const SITE_URL = "https://mattyicematrix.github.io/wochenkorb/";
function b64urlEncode(str){ const bytes=new TextEncoder().encode(str); let bin=""; bytes.forEach(b=>bin+=String.fromCharCode(b)); return btoa(bin).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,""); }
function b64urlDecode(s){ s=s.replace(/-/g,"+").replace(/_/g,"/"); while(s.length%4) s+="="; const bin=atob(s); const bytes=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i); return new TextDecoder().decode(bytes); }
function shareLink(){
  const p={v:1,w:META.validFrom,i:S.items,c:S.custom.map(c=>[c.name,c.price,c.store,c.qty]),m:S.menu};
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
  const items={}; if(p.i&&typeof p.i==="object") for(const [k,v] of Object.entries(p.i).slice(0,200)) if(DB.get(k)&&DB.tableOf(k)!=="recipes"&&DB.tableOf(k)!=="stores"&&Number.isInteger(v)&&v>0) items[k]=clamp(v,1,99);
  const custom=Array.isArray(p.c)?p.c.slice(0,100).map(c=>Array.isArray(c)&&typeof c[0]==="string"&&c[0].trim()?{id:"c-"+Math.random().toString(36).slice(2,10),name:c[0].replace(/[<>]/g,"").slice(0,60),price:clamp(+c[1]||0,0,500),store:c[2]==="LIDL"?"LIDL":"ALDI",qty:clamp(parseInt(c[3])||1,1,99)}:null).filter(Boolean):[];
  const menu={}; if(p.m&&typeof p.m==="object") for(const [k,v] of Object.entries(p.m)) if(/^[0-6]$/.test(k)&&DB.tableOf(v)==="recipes") menu[k]=v;
  return {items,custom,menu,old:p.w!==META.validFrom};
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
function tick(){ if(!cook) return stopTimer(); cook.left--; const tv=$("#tv"); if(tv) tv.textContent=fmtT(cook.left);
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
    case "dec": if(S.items[id]!=null){ if(S.items[id]<=1) delete S.items[id]; else S.items[id]--; } else { const i=S.custom.findIndex(x=>x.id===id); if(i>=0){ if(S.custom[i].qty<=1) S.custom.splice(i,1); else S.custom[i].qty--; } } save(); render(); break;
    case "check": { const i=S.checked.indexOf(id); if(i>=0) S.checked.splice(i,1); else S.checked.push(id); save(); render(); break; }
    case "swap": { const r=DB.get(id); if(r&&!isOffer(r)){ S.storePick[id]=storeOf(r)==="ALDI"?"LIDL":"ALDI"; save(); render(); toast(t("t_moved",{x:S.storePick[id]})); } break; }
    case "clear-done": for(const cid of S.checked){ delete S.items[cid]; S.custom=S.custom.filter(c=>c.id!==cid); } S.checked=[]; save(); render(); toast(t("t_ticked")); break;
    case "unfav": { const i=+b.dataset.i; if(i>=0&&i<S.favorites.length){ S.favorites.splice(i,1); save(); render(); } break; }
    case "rebuild": seedFromFavorites(false); S.checked=[]; save(); render(); toast(t("t_rebuilt")); break;
    case "merge": seedFromFavorites(true); save(); render(); toast(t("t_favs")); break;
    case "copy": copyText(listText(), t("t_copied")); break;
    case "copy-link": copyText(shareLink(), t("t_link")); break;
    case "share-open": shareSheet(); break;
    case "share-native": { const L=lines(), T=totals(L); try{ navigator.share({title:"Wochenkorb", text:t("share_msg",{n:L.length,total:eur(T.total)}), url:shareLink()}).catch(()=>{}); }catch(err){} break; }
    case "imp-replace": if(pendingImport){ S.items=pendingImport.items; S.custom=pendingImport.custom; S.menu=pendingImport.menu; S.checked=[]; S.seeded=true; pendingImport=null; clearHash(); save(); closeLayer(); S.tab="list"; render(); toast(t("t_imported")); } break;
    case "imp-merge": if(pendingImport){ for(const [k,q] of Object.entries(pendingImport.items)) S.items[k]=Math.max(S.items[k]||0,q); for(const c of pendingImport.custom) if(!S.custom.some(x=>DB.fold(x.name)===DB.fold(c.name))&&S.custom.length<100) S.custom.push(c); for(const [d,r] of Object.entries(pendingImport.menu)) if(!S.menu[d]) S.menu[d]=r; S.seeded=true; pendingImport=null; clearHash(); save(); closeLayer(); S.tab="list"; render(); toast(t("t_merged")); } break;
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
    case "t-toggle": if(cook){ if(cook.run){ stopTimer(); cook.run=false; } else { if(cook.left<=0) cook.left=cook.r.steps[cook.i][2]; cook.run=true; cook.started=true; timerI=setInterval(tick,1000); } drawCook(); } break;
    case "t-reset": if(cook){ stopTimer(); cook.run=false; cook.started=false; cook.left=cook.r.steps[cook.i][2]; drawCook(); } break;
  }
});
function toggleWeek(id){
  if(DB.tableOf(id)!=="recipes") return;
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
document.addEventListener("input",e=>{
  const el=e.target;
  if(el.id==="dealSearch"){ dealQ=el.value.slice(0,40); rerenderKeepFocus("dealSearch"); }
  if(el.id==="budgetIn"){ const v=parseFloat(el.value); S.budget=isFinite(v)?clamp(Math.round(v),0,2000):0; save(); rerenderKeepFocus("budgetIn"); }
});
document.addEventListener("change",e=>{
  const el=e.target;
  if(el.id==="dealSort"){ dealSort=["price","cat","name"].includes(el.value)?el.value:"price"; render(); }
  if(el.id==="bigIn"){ S.big=el.checked; seedFromFavorites(false); save(); render(); toast(S.big?t("t_more"):t("t_normal")); }
});
document.addEventListener("keydown",e=>{
  if(e.target.id==="favIn" && (e.key==="Enter"||e.key===",")){
    e.preventDefault(); const v=e.target.value.replace(/[<>]/g,"").trim().slice(0,40);
    if(v && !S.favorites.some(f=>DB.fold(f)===DB.fold(v)) && S.favorites.length<60){
      S.favorites.push(v); const m=DB.match(v); if(m && !S.items[m.row.id]) S.items[m.row.id]=favQty(m.row);
      save(); rerenderKeepFocus("favIn"); toast(m?t("t_added",{x:m.row.name}):t("t_noprice",{x:v}));
    }
  }
  if(e.key==="Escape" && $("#layer").innerHTML){ closeLayer(); render(); }
});
document.addEventListener("submit",e=>{
  if(e.target.id!=="addForm") return; e.preventDefault();
  const name=$("#addName").value.replace(/[<>]/g,"").trim().slice(0,60); const price=parseFloat($("#addPrice").value.replace(",","."));
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
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="visible" && cook) grabWake(); });
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
