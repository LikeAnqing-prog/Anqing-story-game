'use strict';
const townBusinesses={
 cow:{prices:[320,640,1440],yield:[0,1,2,4],capacity:[0,8,16,32]},
 dairy:{prices:[220,520,1280],input:{milk:3},output:'cheese',seconds:10},
 inn:{prices:[580,1160,2560],input:{cheese:1,truffle:2},output:'fondue',seconds:14},
 horse:{prices:[1200,2400,5400],seconds:[0,24,18,12]}
};
const depotPrices=[2400,6200,15800];
const townGoods={
 milk:{name:'鲜奶',icon:'🥛',price:8},cheese:{name:'熟成奶酪',icon:'🧀',price:36},
 truffle:{name:'松露',icon:'🍄',price:5},fondue:{name:'松露芝士锅',icon:'🥘',price:72}
};
const townOrders=[
 {id:'post',name:'邮局制服补货',items:{rabbit:1,glove:2}},
 {id:'breakfast',name:'旅店早餐客房',items:{quilt:1,cheese:2}},
 {id:'dinner',name:'山间晚宴',items:{bunnyGift:1,fondue:3}},
 {id:'festival',name:'冬日市集包场',items:{starTent:1,wallHanging:1,fondue:8}}
];
const townTools={
 milkCan:{animal:'cow',name:'扩容奶桶',prices:[120,240]},
 milkBrush:{animal:'cow',name:'按摩乳刷',prices:[160,320]},
 saddlebags:{animal:'horse',name:'双侧驮袋',prices:[360,720]},
 horseshoes:{animal:'horse',name:'轻便蹄铁',prices:[400,800]}
};
function milkInterval(t){return [10000,8000,6000][t.milkBrush||0]}
function vatCapacity(t,tier=t.cow){return townBusinesses.cow.capacity[tier]+4*(t.milkCan||0)}
function loadCapacity(t,tier=t.horse){return tier?2**(tier-1+t.depot)+(t.saddlebags||0):0}
function tripDuration(t,tier=t.horse){return Math.round(townBusinesses.horse.seconds[tier]*[1,.85,.7][t.horseshoes||0]*1000)}
function initialTown(){
 return {cow:0,horse:0,dairy:0,inn:0,depot:0,vat:0,milkDue:0,stock:{milk:0,truffle:0,cheese:0,fondue:0},
  keepTruffles:false,jobs:{},shipment:null};
}
function createTown({visitMarket,state,recipes,productImage,commit}){
 const panel=document.createElement('dialog');panel.id='townPanel';panel.className='farm-dialog';
 panel.setAttribute('aria-labelledby','townTitle');
 panel.innerHTML='<div class="awning"></div><div class="shop-head"><h2 id="townTitle"></h2><button data-close>回街上</button></div><div class="town-content"></div>';
 document.body.append(panel);
 const world=createTownWorld();world.root.visible=false;
 let focus=null,batch=1,feedback='',signature='';
 const markers={},anchor=new T.Vector3();
 for(const [id,site] of Object.entries(townSites)){
  const button=document.createElement('button');button.className='world-label town-place';button.dataset.site=id;
  button.textContent=site.name;button.hidden=true;document.body.append(button);markers[id]=button;
  button.onclick=()=>open(id);
 }
 function open(id){
  focus=id;feedback='';batch=1;
  if(tick(Date.now()))commit();
  panel.showModal();render();
 }
 function show(value){
  camera.layers.set(value?1:0);focus=null;feedback='';
  world.root.visible=value;world.farms.visible=!value;world.sync(state().town);
  Object.values(markers).forEach(b=>b.hidden=true);
 }
 function frame(now,place,px,mode){
  world.animate(now);
  for(const [id,button] of Object.entries(markers)){
   const site=townSites[id],farm=!!site.farm;
   button.hidden=mode!==(farm?'ranches':'town')||!!focus&&id!==focus;
   if(!button.hidden){
    anchor.set(site.x+(farm?-1.9:0),farm?1.75:1.95,site.z+(farm?-.35:1.12)+(farm?0:townZ));
    place(button,anchor,px);
   }
  }
 }
 function refresh(){
  world.sync(state().town);
  if(panel.open){
   const s=state(),next=JSON.stringify([s.town,s.stock,s.coins,batch,focus,feedback]);
   if(signature!==next){render();signature=next}
  }
 }
 function tick(now){
  const t=state().town;let changed=false;
  if(t.cow&&now>=t.milkDue){
   const period=milkInterval(t),cycles=1+Math.floor((now-t.milkDue)/period);
   t.vat=Math.min(vatCapacity(t),t.vat+cycles*townBusinesses.cow.yield[t.cow]);
   t.milkDue+=cycles*period;changed=true;
  }
  for(const [id,job] of Object.entries(t.jobs)){
   if(now<job.due)continue;
   t.stock[townBusinesses[id].output]+=job.qty;delete t.jobs[id];changed=true;
  }
  if(t.shipment&&!t.shipment.arrived&&now>=t.shipment.due){t.shipment.arrived=true;changed=true}
  if(panel.open)panel.querySelectorAll('[data-town-due]').forEach(el=>el.textContent=Math.ceil(Math.max(0,+el.dataset.townDue-now)/1000)+' 秒');
  return changed;
 }
 function stockFor(id){return townGoods[id]?state().town.stock:state().stock}
 function quantity(id){return stockFor(id)[id]||0}
 function goods(id){
  if(townGoods[id])return '<span class="town-good">'+townGoods[id].icon+' '+townGoods[id].name+'</span>';
  return '<span class="town-good">'+productImage(id)+recipes[id].name+'</span>';
 }
 function enough(items,n){return Object.entries(items).every(([id,qty])=>quantity(id)>=qty*n)}
 function consume(items,n){for(const [id,qty] of Object.entries(items))stockFor(id)[id]-=qty*n}
 function requirements(items,n){
  return Object.entries(items).map(([id,qty])=>'<span class="town-ingredient'+(quantity(id)<qty*n?' short':'')+'">'+goods(id)+' '+quantity(id)+' / '+qty*n+'</span>').join('');
 }
 function button(action,label,enabled=true){
  return '<button data-town="'+action+'" '+(enabled?'':'disabled')+'>'+label+'</button>';
 }
 function row(name,detail,actions){
  return '<article><div><strong>'+name+'</strong><p>'+detail+'</p></div><aside>'+actions+'</aside></article>';
 }
 function clock(due){return '<time data-town-due="'+due+'">'+Math.ceil(Math.max(0,due-Date.now())/1000)+' 秒</time>'}
 function investment(id){
  const level=state().town[id],cfg=townBusinesses[id],price=cfg.prices[level];
  if(price===undefined)return '';
  const tier=level+1,lot=2**level;
  let desc='';
  if(id==='cow')desc='每 '+milkInterval(state().town)/1000+' 秒产 '+cfg.yield[tier]+' 桶鲜奶，储奶槽可存 '+vatCapacity(state().town,tier)+' 桶。';
  if(id==='horse')desc='每趟最多运 '+loadCapacity(state().town,tier)+' 份订单，用时 '+tripDuration(state().town,tier)/1000+' 秒，送达价比自提高 35%。';
  if(id==='dairy'||id==='inn')desc='每批最多做 '+lot+' 份'+goods(cfg.output)+'，用时 '+cfg.seconds+' 秒。';
  return row(level?'扩建至 '+tier+' 级':'开设'+townSites[id].name,desc,button('invest',(level?'扩建':'开设')+' · '+coinAmount(price),state().coins>=price));
 }
 function convoyCapacity(){return loadCapacity(state().town)}
 function payout(order,n,delivery){
  const value=Object.entries(order.items).reduce((sum,[id,q])=>sum+q*(townGoods[id]||recipes[id]).price,0);
  const pickup=Math.round(value*(1.10+Math.max(0,Math.log2(n)-2)*.04)*n);
  return delivery?Math.round(pickup*1.35):pickup;
 }
 function sellRow(id){
  const q=quantity(id);
  return row(goods(id)+' ×'+q,'可留作供货，或以 '+coinAmount(townGoods[id].price)+' 的单价现卖。',button('sell','卖 1 份',q>0));
 }
 function lotControl(max,additional=[]){
  const lots=[...new Set([1,2,4,8,16,32,...additional])].filter(n=>n>=1&&n<=max).sort((a,b)=>a-b);
  return '<div class="town-lots">每批份数 '+lots.map(n=>'<button data-lot="'+n+'" aria-pressed="'+(n===batch)+'">'+n+'</button>').join('')+'</div>';
 }
 function render(){
  const s=state(),t=s.town,id=focus,cfg=townBusinesses[id];
  if(!id)return;
  panel.querySelector('h2').textContent=townSites[id].name;panel.querySelector('[data-close]').textContent=townSites[id].farm?'回牧场':'回街上';
  let html='<div class="town-wallet">'+coinAmount(s.coins)+(cfg?' · '+(t[id]?'设施 '+t[id]+' 级':'待开设'):'')+'</div>';
  if(cfg)html+=investment(id);
  if(id==='cow'&&t.cow){
   html+=row('储奶槽 · '+t.vat+' / '+vatCapacity(t),t.vat>=vatCapacity(t)?'已盛满，收奶后继续产出。':'下次产奶 '+clock(t.milkDue),button('collect','收鲜奶',t.vat>0))+sellRow('milk');
  }
  if((id==='dairy'||id==='inn')&&t[id]){
   const job=t.jobs[id];html+=lotControl(2**(t[id]-1));
   html+=row(goods(cfg.output),requirements(cfg.input,batch),job?'制作中 ×'+job.qty+' · '+clock(job.due):button('cook','制作 '+batch+' 份',enough(cfg.input,batch)))+sellRow(cfg.output);
   if(id==='inn')html+=row('猪场松露','每次拾取时按选定方式处理。',button('reserve',t.keepTruffles?'当前：留作食材':'当前：直接出售'));
  }
  if(id==='horse'&&t.horse)html+=row('车队调度','到山间货栈选货发车，整批送达后领取货款。',button('market','去货栈'));
  if(id==='market'){
   const price=depotPrices[t.depot];
   if(price)html+=row('扩建货栈 · '+(4*2**t.depot)+' → '+(8*2**t.depot)+' 份','扩大自提单和马车装载量。8 / 16 / 32 份大单分别加价 14% / 18% / 22%。',button('depot','扩建 · '+coinAmount(price),s.coins>=price));
   html+=lotControl(4*2**t.depot,t.horse?Array.from({length:t.saddlebags||0},(_,i)=>2**(t.horse-1+t.depot)+i+1):[]);
   const trip=t.shipment;
   if(trip){const contract=townOrders.find(o=>o.id===trip.order);
    html+=row(contract.name+' ×'+trip.qty,trip.arrived?'马车已抵达，货款 '+coinAmount(trip.pay):'马车运输中 · '+clock(trip.due),button('claim','领取货款',trip.arrived));
   }
   for(const order of townOrders){
    const ready=enough(order.items,batch),fits=batch<=convoyCapacity();
    html+=row(order.name,requirements(order.items,batch),button('pickup-'+order.id,'自提 '+coinAmount(payout(order,batch,false)),ready)+button('ship-'+order.id,'马车 '+coinAmount(payout(order,batch,true)),ready&&fits&&!trip));
   }
   html+='<p class="town-help">'+(t.horse?'马场每趟可运 '+convoyCapacity()+' 份。':'自提可直接结款。开设马场后可接送货价。')+'</p>';
  }
  if(feedback)html+='<p class="town-receipt" role="status">'+feedback+'</p>';
  panel.querySelector('.town-content').innerHTML=html;
 }
 panel.addEventListener('close',()=>{focus=null;feedback=''});
 panel.addEventListener('click',e=>{
  const btn=e.target.closest('button');if(!btn||btn.disabled)return;
  if(btn.hasAttribute('data-close')){panel.close();return}
  if(tick(Date.now()))commit();
  if(btn.dataset.lot){batch=Number(btn.dataset.lot);feedback='';render();return}
  const action=btn.dataset.town,id=focus,s=state(),t=s.town,cfg=townBusinesses[id],now=Date.now();
  if(action==='invest'){
   const price=cfg.prices[t[id]];if(!price||s.coins<price)return;
   s.coins-=price;t[id]++;if(id==='cow'&&t.cow===1)t.milkDue=now+milkInterval(t);
   feedback=townSites[id].name+(t[id]===1?'已开业':'扩建完成');
  }else if(action==='depot'){
   const price=depotPrices[t.depot];if(!price||s.coins<price)return;
   s.coins-=price;t.depot++;feedback='新货棚已启用，大宗供货额度提高';
  }else if(action==='collect'&&t.vat){feedback='鲜奶入库 ×'+t.vat;t.stock.milk+=t.vat;t.vat=0;
  }else if(action==='sell'){
   const item=id==='cow'?'milk':cfg.output;if(!quantity(item))return;
   t.stock[item]--;s.coins+=townGoods[item].price;feedback='现卖收入 '+coinAmount(townGoods[item].price);
  }else if(action==='cook'){
   if(!t[id]||batch>2**(t[id]-1)||t.jobs[id]||!enough(cfg.input,batch))return;
   consume(cfg.input,batch);t.jobs[id]={qty:batch,due:now+cfg.seconds*1000};feedback='';
  }else if(action==='reserve'){t.keepTruffles=!t.keepTruffles;
  }else if(action==='market'){visitMarket();focus='market';batch=1;feedback='';
  }else if(action==='claim'&&t.shipment?.arrived){feedback='送货到账 '+coinAmount(t.shipment.pay);s.coins+=t.shipment.pay;t.shipment=null;
  }else if(action?.startsWith('pickup-')||action?.startsWith('ship-')){
   const [method,orderId]=action.split('-'),order=townOrders.find(o=>o.id===orderId),ship=method==='ship';
   if(!order||batch>4*2**t.depot||!enough(order.items,batch)||(ship&&(t.shipment||batch>convoyCapacity())))return;
   const pay=payout(order,batch,ship);consume(order.items,batch);
   if(ship){t.shipment={order:orderId,qty:batch,pay,start:now,due:now+tripDuration(t),arrived:false};feedback='已装车发往'+order.name}
   else{s.coins+=pay;feedback='自提到账 '+coinAmount(pay)}
  }else return;
  commit();
 });
 return {show,frame,refresh,tick,get focus(){return focus},overview(){focus=null}};
}
