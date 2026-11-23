'use strict';
(()=>{
const recipes={
 rabbit:{name:'毛毡兔挂件',wool:4,seconds:4,price:14},
 lamb:{name:'绵羊玩偶',wool:12,seconds:20,price:50},
 glove:{name:'露指手套',wool:3,seconds:3,price:10},
 mitten:{name:'厚绒手套',wool:8,seconds:10,price:32},
 socks:{name:'厚羊毛袜',wool:3,seconds:4,price:11},
 quilt:{name:'格纹羊毛毯',wool:10,seconds:13,price:40},
 ...Object.assign({},...displayTiers.map(t=>t.goods))
};
const buyers={
 granny:{name:'鼠奶奶',line:'孙女过生日，想给她挑一只软乎乎的小动物。',goods:['rabbit','lamb'],budget:50,qty:1},
 post:{name:'兔邮差',line:'山口今天起风了，我把要买的东西写好了。',goods:['glove','mitten'],budget:32,qty:1},
 inn:{name:'熊掌柜',line:'客栈新收拾了两间房。每间放一份暖和的东西，要同款。',goods:['socks','quilt'],budget:80,qty:2},
 guest:{name:'旅人阿栗',line:'我想带点牧场的手作回家，今天要这些。',goods:['rabbit','socks'],budget:16,qty:1}
};
const qtyZero=()=>Object.fromEntries(Object.keys(recipes).map(k=>[k,0]));
function writeOrder(kind,double=Math.random()<.48,level=0){
 const buyer=buyers[kind];
 let id=buyer.goods[Math.floor(Math.random()*buyer.goods.length)];
 if(level&&Math.random()<.70){
  const tier=Math.random()<.75?level-1:Math.floor(Math.random()*level);
  id=Object.keys(displayTiers[tier].goods)[kind==='granny'||kind==='guest'?0:1];
 }
 const lines=[{id,qty:buyer.qty}];
 if(double){
  const extra={granny:'socks',post:'rabbit',inn:'mitten',guest:'glove'}[kind];
  lines.push({id:extra,qty:1});
 }
 return lines;
}
const initialShop=()=>({coins:0,town:initialTown(),stock:qtyZero(),displays:[],jobs:[],tools:{collector:0,shears:0},herd:[],pigCollector:0,pigBell:0,pigMerges:0,pigLevel:1,truffles:[],slots:['granny','post','inn'].map(kind=>({kind,lines:writeOrder(kind,kind==='post')})),visits:{granny:0,post:0,inn:0,guest:0},bench:1});
let shop=initialShop(), selected=0, message='';
let finished=[];
const key='woolly-meadow-shop-v1',door=document.querySelector('#shopDoor');
const modal=document.createElement('dialog');modal.id='shopDialog';modal.setAttribute('aria-labelledby','shopTitle');
modal.innerHTML=`<div class="awning"></div><div class="shop-head"><h2 id="shopTitle">手作工作台</h2><div class="resources"><span><img class="wool-icon" src="art/wool.png" alt="羊毛"> <b id="shopWool"></b></span><span>${coinIcon} <b id="shopCoin"></b></span></div><button id="leaveShop" autofocus>离开工作台</button></div>
<section class="bench-stage"><span class="bench-occupancy"></span><div class="bench-scene"><img class="table-art" src="art/bench.png" alt="木制手作台"><div class="on-table"></div></div><div class="work-tags" role="status"></div><div class="bench-notice" role="status"></div></section>
<section class="recipe-picker"><div class="picker-head"><h3>制作选择</h3><div><button data-scroll="-1" aria-label="向左滑动配方">‹</button><button data-scroll="1" aria-label="向右滑动配方">›</button></div></div><div class="products" tabindex="0" aria-label="可横向滑动的制作配方"></div></section>
<div class="shop-foot"><div><span>已成交 <b id="saleCount"></b> 单</span> <button id="displayLink">陈列柜 · 铺货扩建</button></div><div class="bench-upgrade"><span id="capacityChange"></span><button id="upgrade"></button></div></div>`;
document.body.append(modal);
const $=sel=>modal.querySelector(sel);
function save(){
 try{
 const state={shop,wool,merges,sheep:flock.map(s=>[s.level,s.root.position.x,s.root.position.z]),drops:woolDrops.map(d=>[d.amount,d.x,d.z])};
 localStorage.setItem(key,JSON.stringify(state));
 }catch(e){/* Some browsers disable storage for local files. */}
}
function restore(){
 try{
 const raw=localStorage.getItem(key);if(!raw)return;
 const data=JSON.parse(raw);if(!Array.isArray(data.sheep)||!data.sheep.length||!data.shop?.slots)return;
 for(const s of [...flock])remove(s);
 for(const [level,x,z] of data.sheep)spawn(x,z,level);
 wool=data.wool;merges=data.merges;shop=data.shop;
 for(const [amount,x,z] of data.drops){
   shedWool({root:{position:{x,z}}},amount,0);
   const d=woolDrops.at(-1);d.x=x;d.z=z;d.phase=1;
 }
 stats();updateWool();
 }catch(e){shop=initialShop();reset()}
}
restore();
function migrate(){
 shop.town??=initialTown();
 shop.stock={...qtyZero(),...shop.stock};shop.displays??=[];
 if(!shop.jobs){shop.jobs=shop.job?[shop.job]:[];shop.oldSpeed=shop.bench===2?2:1;delete shop.job}
 shop.tools??={collector:0,shears:0};shop.herd??=Array.from({length:shop.pigs||0},(_,i)=>newPiglet(i));delete shop.pigs;shop.pigLevel??=1;shop.truffles??=[];
 shop.pigCollector??=0;shop.pigBell??=0;shop.pigMerges??=0;
 const digPeriod=pigDigPeriod(shop.pigLevel,shop.pigBell),now=Date.now();
 for(const pig of shop.herd){
  // Older saves used one farm-wide clock. Resume each pig without replaying the entire offline interval.
  pig.digDue=Math.max(now,Math.min(now+digPeriod,pig.digDue??shop.digDue??now+digPeriod));
 }
 delete shop.digDue;
 for(const slot of shop.slots){
  if(!slot.kind)continue;
  slot.lines=slot.lines?slot.lines.map(line=>({id:line.id||line.choice,qty:line.qty})):writeOrder(slot.kind,false);
 }
}
migrate();
otherHerdStats=()=>({animals:shop.herd.length+shop.town.cow+shop.town.horse-2*(shop.town.workers?.length||0),merges:shop.pigMerges+(shop.town.workerMerges||0)});
const portraits=Object.fromEntries(Object.keys(buyers).map(kind=>[kind,makeVisitor(kind)]));
for(const [kind,person] of Object.entries(portraits)){person.name=buyers[kind].name;shopSite.guests.add(streetModel(person))}
const walkIns=new Map();
function arrangeVisitors(){
 Object.values(portraits).forEach(person=>person.visible=false);
 shop.slots.forEach((slot,i)=>{
  if(!slot.kind)return;const m=portraits[slot.kind];m.visible=true;
  m.position.set(shopSite.x-1.72+i*1.52,.07,shopSite.z+2.72+(i%2)*.33);m.rotation.y=-.22+i*.13;m.scale.setScalar(1.05);
 });
}
function productImage(id){return `<img class="item-art" src="art/${id}.png" alt="">`}
function goodsValue(items){return Object.entries(items).reduce((sum,[id,n])=>sum+recipes[id].price*n,0)}
function displayLevel(){return displayTiers.filter((t,i)=>goodsValue(shop.displays[i]||{})>=t.value).length}
function unlocked(id){const tier=displayTiers.findIndex(t=>Object.hasOwn(t.goods,id));return tier<displayLevel()}
function woolIcon(){return '<img class="wool-icon" src="art/wool.png" alt="羊毛" title="羊毛">'}
function workSeconds(id){return Math.max(1,Math.ceil(recipes[id].seconds/(shop.oldSpeed||1)))}
const order=document.createElement('section');order.id='guestOrder';order.hidden=true;order.setAttribute('aria-label','客人订单');document.body.append(order);
const busyHint='有其他的订单正在制作中哦';
const busyToast=document.createElement('div');
busyToast.className='busy-toast';busyToast.hidden=true;busyToast.setAttribute('role','status');
document.body.append(busyToast);
let busyTimer;
function showBusyHint(){
 clearTimeout(busyTimer);busyToast.hidden=false;busyToast.textContent=busyHint;
 busyTimer=setTimeout(()=>{busyToast.hidden=true},3200);
}
function regularJobs(){return shop.jobs.filter(job=>!job.temporary).length}
function benchFull(){return regularJobs()>=shop.bench}
function tempBusy(){return shop.jobs.some(job=>job.temporary)}
const adButtonText='▶ 看广告加工位';
function missing(line){return Math.max(0,line.qty-shop.stock[line.id])}
function productWork(id){
 const jobs=shop.jobs.filter(job=>job.id===id);
 const making=jobs.reduce((sum,job)=>sum+(job.qty||1),0);
 return {making,nextDue:making?Math.min(...jobs.map(job=>job.due)):0,temporary:making>0&&jobs.every(job=>job.temporary)};
}
function lineWork(line){
 const work=productWork(line.id);
 return {...work,toStart:Math.max(0,missing(line)-work.making)};
}
function workStatus(work){
 if(!work.making)return '';
 const seconds=Math.max(0,Math.ceil((work.nextDue-Date.now())/1000));
 return `<small class="order-making">${work.temporary?'临时工位 · ':''}${work.making} 件制作中 · <time data-due="${work.nextDue}">${seconds} 秒</time></small>`;
}
function blockedByOtherJobs(slot){
 return benchFull()&&slot.lines.some(line=>{
  const work=lineWork(line);return work.toStart>0&&!work.making;
 });
}
function totalPrice(slot){return slot.lines.reduce((sum,l)=>sum+l.qty*recipes[l.id].price,0)}
function paintOrder(){
 if(order.hidden)return;
 const slot=shop.slots[selected],b=buyers[slot?.kind];if(!b)return;
 const ready=slot.lines.every(l=>!missing(l)),full=benchFull();
 const blocked=blockedByOtherJobs(slot);
 if(!blocked)busyToast.hidden=true;
 order.innerHTML=`<div class="awning"></div><div class="order-inner"><div class="order-head"><strong>${b.name}</strong><button data-exit>退出 ×</button></div><small>${shop.visits[slot.kind]?'回头客':'初次来访'} · ${slot.lines.length} 项需求，备齐后交货</small><p>“${b.line}”</p>${blocked?`<p class="busy-hint" role="status">${busyHint}</p>`:''}<div class="order-lines">${slot.lines.map((l,i)=>{
 const r=recipes[l.id],work=lineWork(l),{making,toStart}=work,short=Math.max(0,r.wool-wool);
 let action='';
 if(toStart){
  const label=short?'还差 '+toStart+' 件':full?(tempBusy()?'临时工位使用中':adButtonText):making?'再做一件':'制作一件';
  action=`<button data-plan="${i}" ${short||(full&&tempBusy())?'disabled':''}>${label}</button>`;
 }else if(!missing(l)){action='<span class="ready-mark">✓ 齐备</span>'}
 return `<article class="order-product">${productImage(l.id)}<b>${r.name}</b>${workStatus(work)}<small>库存 ${Math.min(shop.stock[l.id],l.qty)} / ${l.qty} 件</small><small>${short&&toStart?'做一件还差 '+short+' 团羊毛':coinAmount(r.price*l.qty)}</small>${action}</article>`;
 }).join('')}</div><button class="all-deliver" data-deliver ${ready?'':'disabled'}>整单交付 · ${coinAmount(totalPrice(slot))}</button></div>`;
}
const tray=$('.products');
function renderRecipes(){
 tray.innerHTML=Object.entries(recipes).filter(([id])=>unlocked(id)).map(([id,r])=>`<article class="product" data-recipe="${id}">${productImage(id)}<span class="stock"></span><b>${r.name}</b><div class="recipe-work"></div><small class="cost">${woolIcon()}${r.wool}<i>·</i><span class="duration"></span></small><small>售价 ${coinAmount(r.price)}</small><button data-make="${id}">制作一件</button></article>`).join('');
}
renderRecipes();
let slide=null,suppressClick=false;
tray.addEventListener('pointerdown',e=>{
 if(e.pointerType!=='mouse'||e.button!==0)return;
 slide={id:e.pointerId,x:e.clientX,scroll:tray.scrollLeft};suppressClick=false;
});
tray.addEventListener('pointermove',e=>{
 if(!slide||slide.id!==e.pointerId||!e.buttons)return;
 const dx=e.clientX-slide.x;
 if(Math.abs(dx)>5){tray.setPointerCapture(e.pointerId);suppressClick=true;tray.scrollLeft=slide.scroll-dx}
});
window.addEventListener('pointerup',()=>{slide=null});
tray.addEventListener('click',e=>{if(suppressClick){e.stopPropagation();suppressClick=false}},true);
tray.addEventListener('wheel',e=>{if(Math.abs(e.deltaY)>Math.abs(e.deltaX)&&tray.scrollWidth>tray.clientWidth){e.preventDefault();tray.scrollLeft+=e.deltaY}},{passive:false});
for(const btn of modal.querySelectorAll('[data-scroll]'))btn.onclick=()=>tray.scrollBy({left:Number(btn.dataset.scroll)*tray.clientWidth*.72,behavior:'smooth'});
const activeModels=new T.Group();scene.add(activeModels);activeModels.position.copy(shopSite.table.position);
let viewSignature='';
function updateWorldJobs(){
 const signature=shop.jobs.map(job=>job.id).join(',');
 if(signature===viewSignature)return;viewSignature=signature;
 activeModels.clear();
 shop.jobs.forEach((job,i)=>{const m=makeProduct(job.id);m.position.set((i-(shop.jobs.length-1)/2)*.28,.805,.06);m.scale.setScalar(.32);activeModels.add(streetModel(m))});
}
function jobCard(job,index){
 return `<span class="job-tag" data-job="${index}">${productImage(job.id)}<span><b>${job.temporary?'临时 · ':''}${recipes[job.id].name}制作中</b><progress max="1" value="0"></progress></span><time></time></span>`;
}
function paint(){
 stats();
 pigFarm.buyButton.firstElementChild.innerHTML='买香猪 · '+coinAmount(pigCost);
 pigFarm.buyButton.setAttribute('aria-label','点便便堆，花 '+pigCost+' 金币买小香猪');
 document.querySelector('#coinTotal').textContent=shop.coins;
 cloudButton.dataset.poor=String(shop.coins<cloudCost);
 display.refresh();town.refresh();
 arrangeVisitors();paintOrder();
 updateWorldJobs();
 const activeCards=shop.jobs.map(jobCard).join('');
 view.bench.innerHTML=activeCards||'工作台';
 view.bench.classList.toggle('has-cards',!!activeCards);
 if(!modal.open){paintTimer();return}
 $('#shopWool').textContent=wool;$('#shopCoin').textContent=shop.coins;
 $('#saleCount').textContent=Object.values(shop.visits).reduce((a,b)=>a+b,0);
 for(const el of tray.children){
  const id=el.dataset.recipe,r=recipes[id],btn=el.querySelector('button'),full=benchFull();
  const work=productWork(id);
  el.querySelector('.recipe-work').innerHTML=workStatus(work);
  el.querySelector('.stock').textContent='库存 '+shop.stock[id];el.querySelector('.duration').textContent=workSeconds(id)+' 秒';
  btn.disabled=(full&&tempBusy())||wool<r.wool;
  btn.innerHTML=wool<r.wool?'还差 '+woolIcon()+(r.wool-wool):full?(tempBusy()?'临时工位使用中':adButtonText):work.making?'再做一件':'制作一件';
  el.classList.toggle('working',work.making>0);
 }
 $('.bench-occupancy').textContent='工位 '+regularJobs()+' / '+shop.bench+(tempBusy()?' · 临时 +1':'');
 $('.on-table').innerHTML=shop.jobs.map(j=>productImage(j.id)).join('');
 $('.work-tags').innerHTML=activeCards;
 const price=shop.bench===1?70:140,u=$('#upgrade'),maxed=shop.bench>=3;
 $('#capacityChange').textContent=maxed?'可同时制作 3 件':'并行制作 '+shop.bench+' → '+(shop.bench+1)+' 件';
 u.disabled=maxed||shop.coins<price;
 u.innerHTML=maxed?'工作台已满级':'升级工作台 · '+coinAmount(price);
 u.title=maxed?'':'增加 1 个工位';
 if(!maxed&&shop.coins<price)$('#capacityChange').innerHTML+=' · 还差 '+coinAmount(price-shop.coins);
 const done=finished.map(id=>`<span>${productImage(id)}${recipes[id].name}已上架</span>`).join('');
 $('.bench-notice').innerHTML=done||message||(shop.jobs.length?'':'工作台空闲');
 paintTimer();
}
function paintTimer(){
 const now=Date.now();
 const statusPanel=modal.open?tray:order;
 if(modal.open||!order.hidden)for(const clock of statusPanel.querySelectorAll('time[data-due]')){
  clock.textContent=Math.max(0,Math.ceil((Number(clock.dataset.due)-now)/1000))+' 秒';
 }
 const cards=(modal.open?modal:view.bench).querySelectorAll('[data-job]');
 cards.forEach(el=>{
  const j=shop.jobs[Number(el.dataset.job)];if(!j)return;
  const left=Math.max(0,j.due-now),duration=j.duration||workSeconds(j.id)*(j.qty||1)*1000;
  el.querySelector('progress').value=Math.max(0,1-left/duration);
  el.querySelector('time').textContent=Math.ceil(left/1000)+' 秒';
 });
}
function begin(id,temporary=false){
 if(!recipes[id]||!unlocked(id)||(temporary?tempBusy():benchFull())||wool<recipes[id].wool)return false;
 wool-=recipes[id].wool;updateWool();const duration=workSeconds(id)*1000;shop.jobs.push({id,duration,due:Date.now()+duration,temporary});finished=[];return true;
}
const ad=document.createElement('dialog');
ad.id='workAd';ad.setAttribute('aria-labelledby','workAdTitle');
ad.innerHTML='<div class="awning"></div><div class="ad-content"><small>模拟广告</small><h2 id="workAdTitle">借一个临时工位</h2><div class="ad-product"></div><p>看完即开工，本件做完后归还工位。</p><progress max="3000" value="0"></progress><div class="ad-actions"><span role="status"></span><button type="button">取消观看</button></div></div>';
document.body.append(ad);
let adTimer;
ad.querySelector('button').onclick=()=>ad.close();
ad.addEventListener('close',()=>{if(!ad.open)clearInterval(adTimer)});
function watchForSlot(id){
 if(ad.open||tempBusy()||!benchFull()||wool<recipes[id].wool)return;
 ad.querySelector('.ad-product').innerHTML=productImage(id)+'<b>'+recipes[id].name+'</b>';
 const progress=ad.querySelector('progress'),status=ad.querySelector('[role=status]');
 const start=performance.now();progress.value=0;status.textContent='剩余 3 秒';
 busyToast.hidden=true;ad.showModal();
 adTimer=setInterval(()=>{
   if(!ad.open)return;
   const elapsed=performance.now()-start;
   progress.value=elapsed;
   if(elapsed<progress.max){status.textContent='剩余 '+Math.ceil((progress.max-elapsed)/1000)+' 秒';return}
   clearInterval(adTimer);ad.close();tick();
   if(!begin(id,true))return;
   message='';paint();save();
 },100);
}
function openBench(){
 if(drag||!order.hidden||modal.open)return;
 tick();
 message='';
 modal.showModal();paint();save();
}
order.addEventListener('click',e=>{
 const btn=e.target.closest('button');if(!btn||btn.disabled)return;
 if(btn.hasAttribute('data-exit')){view.leave();return}
 const slot=shop.slots[selected],kind=slot?.kind;if(!kind)return;
 if(btn.hasAttribute('data-plan')){
  const line=slot.lines[Number(btn.dataset.plan)];
  if(!line||!lineWork(line).toStart)return;
  if(benchFull()){watchForSlot(line.id);return}
  if(!begin(line.id))return;
  view.store();paint();save();
 }else if(btn.hasAttribute('data-deliver')&&slot.lines.every(l=>!missing(l))){
  const pay=totalPrice(slot);
  for(const l of slot.lines)shop.stock[l.id]-=l.qty;
  shop.coins+=pay;shop.visits[kind]++;
  shop.slots[selected]={kind:null,due:Date.now()+5500};
  view.store();const receipt=document.createElement('span');receipt.className='harvest receipt';receipt.innerHTML=buyers[kind].name+' · '+coinAmount('+'+pay);document.body.append(receipt);receipt.addEventListener('animationend',()=>receipt.remove(),{once:true});
  paint();save();
 }
});
function tick(){
 const now=Date.now();let changed=pigFarm.tick(now);if(town.tick(now))changed=true;if(sweep(now))changed=true;
 const done=shop.jobs.filter(job=>now>=job.due);
 if(done.length){
  for(const j of done)shop.stock[j.id]+=j.qty||1;
  shop.jobs=shop.jobs.filter(job=>now<job.due);finished=done.map(j=>j.id);message='';changed=true;
 }
 for(const slot of shop.slots){
   if(slot.kind||now<slot.due)continue;
   const available=Object.keys(buyers).filter(k=>!shop.slots.some(s=>s.kind===k));
   // New faces get a turn, and satisfied regulars visit more often.
   const pool=available.flatMap(k=>Array(2+Math.min(3,shop.visits[k])).fill(k));
   slot.kind=pool[Math.floor(Math.random()*pool.length)];slot.lines=writeOrder(slot.kind,undefined,displayLevel());walkIns.set(slot.kind,now);delete slot.due;changed=true;
 }
 if(changed){paint();if(farmDialog.open)renderFarm();save()}else paintTimer();
}
$('#leaveShop').onclick=()=>modal.close();
modal.addEventListener('close',()=>{save();view.bench.focus({preventScroll:true})});
modal.addEventListener('click',e=>{
 const btn=e.target.closest('button');if(!btn||btn.disabled)return;
 const {make}=btn.dataset;
 if(make){
   if(benchFull()){watchForSlot(make);return}
   if(!begin(make))return;
   message='';
 }else if(btn.id==='upgrade'&&shop.bench<3&&shop.coins>=(shop.bench===1?70:140)){
   shop.coins-=shop.bench===1?70:140;shop.bench++;message='已增加一个可同时开工的工位。';
 }else return;
 paint();save();
});
const farmDialog=document.createElement('dialog');farmDialog.className='farm-dialog';farmDialog.setAttribute('aria-label','牧场经营');
farmDialog.innerHTML='<div class="awning"></div><div class="shop-head"><h2></h2><button data-close>返回</button></div><div class="farm-content"></div>';
document.body.append(farmDialog);
let farmTab='tools',nextSweep=0;
const pigCost=40;
const pigFarm=createPigFarm({state:()=>shop,buyPig(){
 if(!shop.herd.length)return;
 if(shop.herd.length>=pigPlots[shop.pigLevel-1].capacity){pigFarm.tell('猪舍已满，合成或扩建后再来哦');return}
 if(shop.coins<pigCost){pigFarm.tell('还差 '+(pigCost-shop.coins)+' 枚金币');return}
 const pig=newPiglet(shop.herd.length);
 pig.x=-2.25+Math.random()*1.7;pig.z=.45+Math.random()*1.35;pig.heading=(Math.random()-.5)*1.1;
 pig.digDue=Date.now()+pigDigPeriod(shop.pigLevel,shop.pigBell);
 shop.coins-=pigCost;shop.herd.push(pig);pigFarm.pop(pig);paint();save();
},collectTruffle(amount,automatic){
 if(shop.town.keepTruffles)shop.town.stock.truffle+=amount;
 else shop.coins+=amount*5;
 if(!automatic){
  pigFarm.tell(shop.town.keepTruffles?'松露入库 ×'+amount:'卖出松露 ×'+amount+' · 收入 '+amount*5);
  pigFarm.sync();paint();save();
 }
},onMerge(level){shop.pigMerges++;pigFarm.tell('第 '+(level+1)+' 阶 · '+pigBreeds[level].name+' · 每轮 '+woolYield(level)+' 份松露');paint();save()}});
const machine=group(-3.28,.09,-2.21,scene);
machine.name='woolCollector';
const collectorRate={interval:3000,piles:[0,2,5]};
const flyingWool=[],intake=machine.position.clone().add(new T.Vector3(0,1,0));
let lastIntake=-Infinity;
part(machine,pole,0x95754d,0,.39,0,.82,.72,.82);
for(let i=0;i<10;i++){
 const a=i*.628;box(machine,0xc99d68,.35*Math.cos(a),.39,.35*Math.sin(a),.115,.65,.115);
}
part(machine,pole,0x769b8c,0,.79,0,.93,.12,.93);
const rotor=group(0,.99,0,machine);
for(let i=0;i<4;i++){
 const hub=group(0,0,0,rotor);hub.rotation.y=i*Math.PI/2;
 oval(hub,0xa0bc9e,.18,0,0,.23,.055,.09);
}
const costs={collector:[48,96],shears:[60,100]};
function syncTools(){
 machine.visible=shop.tools.collector>0;
 const old=woolPeriod;
 woolPeriod=[5000,4000,3000][shop.tools.shears];
 const now=performance.now();
 if(woolPeriod!==old)for(const s of flock)s.nextHarvest=now+Math.max(0,s.nextHarvest-now)*woolPeriod/old;
 document.querySelector('#wool').parentElement.title='每只羊每 '+woolPeriod/1000+' 秒产毛';
}
function sweep(now){
 if(!shop.tools.collector||now<nextSweep)return false;
 nextSweep=now+collectorRate.interval;
 const take=woolDrops.filter(d=>d.phase>=.72).slice(0,collectorRate.piles[shop.tools.collector]);
 if(!take.length)return false;
 const start=performance.now();
 take.forEach((d,i)=>{
  woolDrops.splice(woolDrops.indexOf(d),1);wool+=d.amount;
  d.root.position.set(d.x,d.groundY,d.z);
  flyingWool.push({root:d.root,from:d.root.position.clone(),start:start+i*90});
 });
 updateWool();return true;
}
function animateCollector(now){
 if(!machine.visible)return;
 for(let i=flyingWool.length-1;i>=0;i--){
  const flight=flyingWool[i],t=T.MathUtils.clamp((now-flight.start)/950,0,1);
  const ease=t*t*(3-2*t),arc=Math.sin(Math.PI*t);
  flight.root.position.lerpVectors(flight.from,intake,ease);
  flight.root.position.y+=arc*1.65;
  flight.root.rotation.z=arc*.48;
  flight.root.scale.setScalar((1+.24*arc)*(1-ease*.82));
  if(t===1){scene.remove(flight.root);flyingWool.splice(i,1);lastIntake=now}
 }
 const beat=1-Math.min(1,(now-lastIntake)/320);
 machine.scale.set(1+.12*beat,1-.12*beat,1+.12*beat);
 rotor.rotation.y=now*.004;
}
function toolRow(key,title,description,level=shop.tools[key],prices=costs[key]){
 const cost=prices[level];
 return `<article><div><b>${title} · ${level} / 2 级</b><p>${description}</p></div><button data-tool="${key}" ${!cost||shop.coins<cost?'disabled':''}>${!cost?'已满级':(level?'升级':'购买')+' · '+coinAmount(cost)}</button></article>`;
}
const warehouseTabs={tools:'羊',pigTools:'猪',cow:'牛',horse:'马'};
function livestockTools(animal){
 const t=shop.town;
 const descriptions={
  milkCan:'每级增加 4 桶储奶容量，满级多存 8 桶。',
  milkBrush:'产奶间隔依次缩至 8 秒、6 秒。',
  saddlebags:'每级让一趟马车多装 1 份订单。',
  horseshoes:'一级缩短 15% 运送时间，二级缩短 30%。'
 };
 return Object.entries(townTools).filter(([,item])=>item.animal===animal)
  .map(([key,item])=>toolRow(key,item.name,descriptions[key],t[key]||0,item.prices)).join('');
}
function renderFarm(){
 if(!farmDialog.open)return;
 const tools=farmTab==='tools',pigTools=farmTab==='pigTools',owned=shop.herd.length>0,plot=pigPlots[shop.pigLevel-1],next=pigPlots[shop.pigLevel];
 const period=pigDigPeriod(shop.pigLevel,shop.pigBell),seconds=period/1000;
 const warehouse=Object.hasOwn(warehouseTabs,farmTab),t=shop.town;
 const available=tools||(pigTools?owned:!!t[farmTab]);
 const tabs=warehouse?'<div class="warehouse-tabs" role="group" aria-label="动物工具">'+Object.entries(warehouseTabs).map(([tab,name])=>'<button data-warehouse-tab="'+tab+'" aria-pressed="'+(tab===farmTab)+'">'+name+'</button>').join('')+'</div>':'';
 farmDialog.querySelector('h2').textContent=warehouse?'牧场仓库':owned?'照料香猪':'解锁香猪';
 const body=tools?toolRow('collector','毛团收集器','每 3 秒自动拾取地面毛团。一级收 2 堆，二级收 5 堆。')+
  toolRow('shears','梳毛刷','永久缩短全场产毛间隔。一级每 4 秒一轮，二级每 3 秒一轮。'):
  pigTools?toolRow('pigCollector','松露收集篮',shop.pigCollector?'每 3 秒自动收 '+collectorRate.piles[shop.pigCollector]+' 堆松露。'+(shop.pigCollector===1?'升级后每次收 5 堆。':'已达到最高收集速率。'):'自动拾取地上的松露。购买后每 3 秒收 2 堆，升到二级每次收 5 堆。',shop.pigCollector,costs.collector)+
  toolRow('pigBell','寻香铃','全场香猪每 '+seconds+' 秒挖一轮松露。'+(shop.pigBell<2?'升至 '+(shop.pigBell+1)+' 级后每 '+pigDigPeriod(shop.pigLevel,shop.pigBell+1)/1000+' 秒一轮。':'已达到最高寻香加成。'),shop.pigBell,costs.shears):
  warehouse?livestockTools(farmTab):
  owned?`<article><div><b>猪舍 · ${shop.herd.length} / ${plot.capacity} 只</b><p>点地上的便便堆领香猪，每只 ${coinAmount(pigCost)}。两只同款合成下一阶，共八阶。每 ${seconds} 秒拱一次松露，每只每轮产 1 至 255 份。已合成 ${shop.pigMerges} 次。</p></div></article>
 <article><div><b>牧场仓库 · 香猪工具</b><p>松露收集篮 ${shop.pigCollector} 级 · 寻香铃 ${shop.pigBell} 级</p></div><button data-open-pig-tools>购买工具</button></article>
 <article><div><b>松露去向</b><p>仓库中有 ${shop.town.stock.truffle} 份食材。</p></div><button data-truffles>${shop.town.keepTruffles?'留作食材 · 切换':'直接出售 · 切换'}</button></article>
 <article><div><b>牧场等级 · ${shop.pigLevel} / 3</b><p>${next?'加建'+(shop.pigLevel===1?'饲料槽':'休息棚')+'，可养 '+next.capacity+' 只猪，每 '+next.period/1000+' 秒挖一轮松露。':'饲料槽和休息棚已建成。'}</p></div><button data-pig-upgrade ${!next||shop.coins<plot.price?'disabled':''}>${next?'升级牧场 · '+coinAmount(plot.price):'牧场已满级'}</button></article>`:
  `<article><div><b>香猪 · 首次饲养</b><p>领回两只小香猪，一起在大牧场里寻找松露。之后点便便堆可以购买更多香猪。</p></div><button data-expand ${shop.coins<120?'disabled':''}>解锁 · ${coinAmount(120)}</button></article>`;
 const locked=warehouse&&!available;
 const care=pigTools?'香猪':farmTab==='cow'?'奶牛':'马匹';
 const manage=warehouse&&!tools?'<button class="warehouse-care" data-manage-animal>'+ (locked?'解锁'+care:('照料'+care))+'</button>':'';
 const lockText='解锁'+care+'后可购买专属工具';
 farmDialog.querySelector('.farm-content').innerHTML=tabs+'<div class="funds">可用 '+coinIcon+' <b>'+shop.coins+'</b></div>'+
  manage+(locked?'<p class="warehouse-lock">'+lockText+'</p>':'')+(warehouse?'<fieldset class="warehouse-goods" '+(locked?'disabled':'')+'>'+body+'</fieldset>':body);
}
function upgradeDigRate(field){
 const now=Date.now(),oldPeriod=pigDigPeriod(shop.pigLevel,shop.pigBell);
 pigFarm.tick(now);shop[field]++;
 const ratio=pigDigPeriod(shop.pigLevel,shop.pigBell)/oldPeriod;
 for(const pig of shop.herd)pig.digDue=now+Math.max(0,pig.digDue-now)*ratio;
}
function openFarm(tab){if(drag||modal.open||farmDialog.open)return;farmTab=tab;farmDialog.showModal();renderFarm()}
farmDialog.addEventListener('click',e=>{
 const btn=e.target.closest('button');if(!btn||btn.disabled)return;
 if(btn.hasAttribute('data-close')){farmDialog.close();return}
 if(btn.hasAttribute('data-manage-animal')){
  if(farmTab==='pigTools'){farmTab='land';renderFarm()}
  else if(farmTab==='cow'||farmTab==='horse'){farmDialog.close();town.open(farmTab)}
  return;
 }
 if(btn.hasAttribute('data-open-pig-tools')&&shop.herd.length){farmTab='pigTools';renderFarm();return}
 if(Object.hasOwn(warehouseTabs,btn.dataset.warehouseTab)){farmTab=btn.dataset.warehouseTab;renderFarm();return}
 const tool=btn.dataset.tool;
 if(farmTab==='pigTools'&&shop.herd.length&&(tool==='pigCollector'||tool==='pigBell')){
  const prices=tool==='pigCollector'?costs.collector:costs.shears,cost=prices[shop[tool]];
  if(!cost||shop.coins<cost)return;
  if(tool==='pigBell')upgradeDigRate(tool);
  else shop.pigCollector++;
  shop.coins-=cost;pigFarm.sync();
 }else if(Object.hasOwn(townTools,tool)){
  const item=townTools[tool],t=shop.town,level=t[tool]||0,cost=item.prices[level];
  if(farmTab!==item.animal||!t[item.animal]||!cost||shop.coins<cost)return;
  const now=Date.now();town.tick(now);
  const oldMilk=milkInterval(t),oldTrip=tripDuration(t);
  t[tool]=level+1;shop.coins-=cost;
  if(tool==='milkBrush')t.milkDue=now+(t.milkDue-now)*milkInterval(t)/oldMilk;
  if(tool==='horseshoes'&&t.shipment&&!t.shipment.arrived){
   const ratio=tripDuration(t)/oldTrip;
   t.shipment.start=now+(t.shipment.start-now)*ratio;t.shipment.due=now+(t.shipment.due-now)*ratio;
  }
 }else if(farmTab==='tools'&&tool&&Object.hasOwn(costs,tool)){
  const key=btn.dataset.tool,price=costs[key][shop.tools[key]];
  if(price===undefined||shop.coins<price)return;
  shop.coins-=price;shop.tools[key]++;syncTools();
 }else if(btn.hasAttribute('data-truffles')){shop.town.keepTruffles=!shop.town.keepTruffles;pigFarm.sync();
 }else if(btn.hasAttribute('data-expand')&&!shop.herd.length&&shop.coins>=120){
  shop.coins-=120;shop.herd=[newPiglet(0),newPiglet(1)];for(const pig of shop.herd)pigFarm.pop(pig);farmDialog.close();
 }else if(btn.hasAttribute('data-pig-upgrade')&&shop.herd.length){
  const old=pigPlots[shop.pigLevel-1],next=pigPlots[shop.pigLevel];
  if(!next||shop.coins<old.price)return;
  upgradeDigRate('pigLevel');shop.coins-=old.price;
  pigFarm.sync();
 }else return;
 paint();renderFarm();save();
});

const actors=Object.fromEntries(Object.entries(portraits).map(([k,m])=>[k,{
  eyes:[m.getObjectByName('eye1'),m.getObjectByName('eye-1')],arm:m.getObjectByName('arm1')
}]));
function animatePeople(now){
 pigFarm.animate(now);animateCollector(now);
 const wall=Date.now();
 shop.slots.forEach(({kind},i)=>{
  if(!kind)return;
  const person=portraits[kind],rig=actors[kind],phase=now*.001+i*1.72;
  const fraction=walkIns.has(kind)?Math.min(1,(wall-walkIns.get(kind))/1600):1;
  if(fraction>=1)walkIns.delete(kind);
  person.position.set(shopSite.x-1.72+i*1.52+(1-fraction)*1.1,.07+.065*Math.abs(Math.sin(fraction*Math.PI*6))*(1-fraction),shopSite.z+2.72+(i%2)*.33+(1-fraction)*1.16);
  person.scale.set(1.05,1.05+.014*Math.sin(phase*2.4),1.05);
  person.rotation.y=.18*Math.sin(phase*.94)-.12+i*.08;person.rotation.z=.032*Math.sin(phase*1.85);
  const blink=phase%3.7;
  for(const eye of rig.eyes)eye.scale.y=.038*(blink<.18?1-.90*Math.sin(Math.PI*blink/.18):1);
  rig.arm.rotation.z=.25+(kind==='post'?.76:.30)*Math.pow(.5+.5*Math.sin(phase*1.44),5);
 });
}
const display=createDisplayCabinet({state:()=>shop,recipes,productImage,woolIcon,goodsValue,displayLevel,unlocked,onChange(){renderRecipes();paint();save()}});
$('#displayLink').onclick=display.open;
cloudButton.onclick=()=>{
 if(shop.coins<cloudCost){price.innerHTML='还差 '+coinAmount(cloudCost-shop.coins)+' · 去羊毛铺接单';hintUntil=time+2.5;return}
 shop.coins-=cloudCost;dropLamb();paint();save();
};
const town=createTown({visitMarket:()=>view.street(),state:()=>shop,recipes,productImage,commit(){pigFarm.sync();paint();save()}});
const view=installShopView({town,door,portraits,order,openBench,openDisplay:display.open,animatePeople,pigFarm,machine,collectorInfo:()=>'每 '+collectorRate.interval/1000+' 秒最多收 '+collectorRate.piles[shop.tools.collector]+' 堆毛团',openBarn:()=>openFarm('tools'),
 openGuest(kind){selected=shop.slots.findIndex(s=>s.kind===kind);order.hidden=false;paintOrder();if(blockedByOtherJobs(shop.slots[selected]))showBusyHint()},
 leaveGuest(){order.hidden=true;busyToast.hidden=true;clearTimeout(busyTimer)}
});
document.querySelector('#reset').onclick=()=>{
 if(!window.confirm('重新开始会清空牧场、库存和钱包余额。确定重来吗？'))return;
 for(const f of flyingWool)scene.remove(f.root);
 flyingWool.length=0;nextSweep=0;lastIntake=-Infinity;
 view.overview();finished=[];reset();shop=initialShop();selected=0;message='';renderRecipes();pigFarm.sync();syncTools();paint();save();
};
window.addEventListener('pagehide',save);
document.addEventListener('visibilitychange',()=>{if(document.hidden)save()});
pigFarm.sync();syncTools();setInterval(tick,350);setInterval(save,5000);paint();tick();
})();
