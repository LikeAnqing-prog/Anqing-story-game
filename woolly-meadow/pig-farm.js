'use strict';
const pigCenterX=-16.4;
const pigPlots=[
 {capacity:6,period:12000,price:100},
 {capacity:8,period:10000,price:200},
 {capacity:10,period:8000,price:0}
];
const pigBreeds=[
 {name:'蜜桃小猪',skin:0xf3b6a4},{name:'花背栗栗猪',skin:0xd7ac89},
 {name:'松露芽芽猪',skin:0xccb2d5},{name:'金穗王冠猪',skin:0xe6c178}
];
function pigSize(level){return pastureAnimalScale*(1+.23*level)}
function newPiglet(i,level=0){
 return {level,x:-3.2+(i%4)*1.95,z:-.5+Math.floor(i/4)*1.15,heading:.16+i*.35};
}
function createPigFarm({state,collectTruffle,onMerge}){
 const pen=group(pigCenterX,0,0,scene),animals=[],buttons=new Map();
 pen.name="松露坡";
 const soil=0xb0876c,cream=0xf8dfb7,wood=0xaf8460;
 pen.add(meadowSlab(13.55,8.51,.45,.93,soil,-1.1));
 const grass=meadowSlab(13.65,8.64,.48,.15,0xffffff,-.16);grass.material=meadow.material;pen.add(grass);
 for(const side of [-1,1]){
   for(let i=-4;i<=4;i++)box(pen,wood,i*1.48,.55,side*3.98,.19,1.03,.18);
   for(let i=-2;i<=2;i++)box(pen,wood,side*6.23,.55,i*1.60,.19,1.03,.18);
   for(const y of [.43,.85]){
     box(pen,cream,0,y,side*3.98,12.7,.12,.11);
     box(pen,cream,side*6.23,y,0,.13,.12,7.9);
   }
 }
 const hut=group(-4.4,.08,-2.52,pen);
 box(hut,0xd6ac84,0,.77,0,2.55,1.50,1.73);box(hut,0x896452,0,.56,.88,1.06,1.08,.07);
 for(let i=-5;i<=5;i++)box(hut,0xbe9576,i*.22,.79,.87,.019,1.46,.026);
 box(hut,cream,0,1.18,.94,1.21,.096,.078);
 for(const side of [-1,1]){
   box(hut,cream,side*.58,.61,.94,.078,1.07,.08);
   const roof=box(hut,0xa45f4e,side*.67,1.74,0,1.59,.17,2.14);roof.rotation.z=-side*.32;
   for(let i=0;i<5;i++){const tile=box(hut,i%2?0xbe8067:0xc88b70,side*.67,1.85,-.85+i*.42,1.59,.078,.39);tile.rotation.z=-side*.32}
 }
 for(const [x,z,s] of [[2.6,-1.7,1.45],[3.9,-1.5,1.1],[2.5,-.9,.8]])oval(pen,0xa7886c,x,.075,z,s,.044,s*.67);
 for(let i=0;i<46;i++){
  const x=Math.sin(i*6.73)*5.86,z=Math.cos(i*9.11)*3.6;
  for(let j=0;j<2;j++)part(pen,cone,0x8fa36b,x+.06*j,.15,z,.046,.23,.043).rotation.z=j*.6-.3;
 }
 for(const [x,z] of [[5.3,-2.9],[4.3,-3.05],[-5.5,2.2]]){
  part(pen,pole,wood,x,.62,z,.30,1.1,.31);for(let k=0;k<5;k++){const a=k*2.39;part(pen,canopy,k%2?0x90b58a:0x81a77d,x+.32*Math.cos(a),1.42+k*.10,z+.27*Math.sin(a),.56,.67,.54)}
  for(let i=0;i<3;i++)oval(pen,0xc98461,x+.39*Math.sin(i*2.1),1.5+i*.14,z+.58,.09,.10,.087);
 }
 const trough=group(2.9,.11,-3.16,pen),annex=group(-1.8,.10,-2.9,pen);
 box(trough,0x9d795b,0,.15,0,2.25,.24,.66);
 for(const side of [-1,1]){
  box(trough,wood,0,.33,side*.32,2.29,.23,.09);
  box(trough,wood,side*1.10,.32,0,.10,.23,.68);
  box(annex,wood,side*.78,.63,.55,.10,1.26,.12);
 }
 for(let i=0;i<10;i++)oval(trough,0xe4bf71,-.88+i*.188,.31,.05*Math.sin(i),.16,.11,.16);
 box(annex,0xc8a07a,0,.57,-.60,1.85,1.14,.14);
 const leanRoof=box(annex,0x81a099,0,1.31,0,2.12,.14,1.74);leanRoof.rotation.x=-.09;
 for(let i=0;i<3;i++)oval(annex,0xe4c68b,(i-1)*.48,.15,0,.31,.10,.39);
 const tailGeo=new T.TubeGeometry(new T.CatmullRomCurve3(Array.from({length:30},(_,i)=>new T.Vector3(.087*Math.cos(i*.30),.10*Math.sin(i*.30)+i*.003,-i*.009))),28,.022,8,false);
 function makePig(data){
  const level=data.level;
  const root=group(0,.07,0,pen),body=group(0,0,0,root),skin=pigBreeds[level].skin;root.position.set(data.x,.07,data.z);root.rotation.y=data.heading;root.name=pigBreeds[level].name;root.scale.setScalar(pigSize(level));
  oval(body,skin,0,.64,0,.55,.47,.73);oval(body,skin,0,.78,.52,.49,.43,.43);
  for(const side of [-1,1]){
   const ear=part(body,cone,skin,side*.32,1.15,.44,.184,.32,.11);ear.rotation.z=-side*.38;
   oval(body,0xb76f6a,side*.34,1.13,.53,.064,.081,.029).rotation.z=-side*.38;
   oval(body,0x3e342d,side*.18,.85,.894,.044,.056,.023);
   oval(body,0xfff5de,side*.18-.011,.869,.912,.013,.014,.007);
   oval(body,0xe79b8d,side*.31,.724,.827,.078,.042,.025);
  }
  oval(body,0xe29a93,0,.699,.945,.21,.14,.103);
  for(const side of [-1,1])oval(body,0x9d6761,side*.082,.707,1.039,.028,.046,.014);
  const legs=[];for(const dx of [-.29,.29])for(const dz of [-.34,.34]){
    const leg=group(dx,.4,dz,body);oval(leg,skin,0,-.13,0,.103,.20,.109);oval(leg,0xa67b69,0,-.30,.018,.10,.067,.11);legs.push(leg);
  }
  part(body,tailGeo,skin,.06,.77,-.69,1,1,1);
  if(level===1){
   for(const side of [-1,1])oval(body,0x9f795e,side*.43,.82,-.17,.15,.21,.25);
   oval(body,0xc08665,.15,1.005,.73,.13,.12,.08);
  }else if(level===2){
   for(const side of [-1,1])oval(body,0x8da873,side*.09,1.26,.43,.087,.22,.080).rotation.z=-side*.63;
  }else if(level===3){
   part(body,pole,0xe4ad4c,0,1.22,.49,.48,.13,.40);
   for(let i=0;i<5;i++){const a=i*1.257;part(body,cone,0xf4ca64,.19*Math.sin(a),1.36,.49+.17*Math.cos(a),.08,.23,.08)}
  }
  const halo=new T.Mesh(haloGeo,haloMat);halo.rotation.x=-Math.PI/2;halo.visible=false;pen.add(halo);
  return {data,root,body,legs,halo,turn:0,bounce:0};

 }
 function truffle(t){
  const m=group(t.x,.08,t.z,pen);part(m,rock,0x725247,0,.19,0,.29,.235,.26);part(m,rock,0x90705d,.15,.17,.09,.17,.16,.16);
  for(let i=0;i<4;i++)oval(m,0xae8b6e,.16*Math.sin(i*2),.31,.13*Math.cos(i*2),.047,.027,.052);
  const btn=document.createElement('button');btn.className='truffle-hit';document.body.append(btn);
  btn.onclick=()=>{const index=state().truffles.indexOf(t);if(index<0)return;state().truffles.splice(index,1);collectTruffle(t.amount||1)};
  part(m,star,0xf6d281,.15,.49,.02,.065,.08,.036);
  buttons.set(t,{m,btn});
 }
 const projected=new T.Vector3();
 function sync(){
  const herd=state().herd,s=state();
  trough.visible=herd.length>0&&s.pigLevel>=2;annex.visible=herd.length>0&&s.pigLevel>=3;
  for(let i=animals.length-1;i>=0;i--){
   const a=animals[i];if(herd.includes(a.data))continue;
   pen.remove(a.root,a.halo);animals.splice(i,1);
  }
  for(const pig of herd)if(!animals.some(a=>a.data===pig))animals.push(makePig(pig));
  for(const [t,item] of buttons)if(!s.truffles.includes(t)){pen.remove(item.m);item.btn.remove();buttons.delete(t)}
  for(const t of s.truffles){
   if(!buttons.has(t))truffle(t);
   buttons.get(t).btn.setAttribute('aria-label',s.town.keepTruffles?'收松露入库 ×'+(t.amount||1):'收松露，卖 '+(t.amount||1)*5+' 金币');
  }
 }
 function tick(now){
  const s=state();if(!s.herd.length||now<s.digDue)return false;
  const period=pigPlots[s.pigLevel-1].period,batches=1+Math.floor((now-s.digDue)/period);s.digDue+=batches*period;
  const count=Math.min(batches*s.herd.length,3*s.herd.length-s.truffles.length);
  for(let i=0;i<count;i++){
   const pig=animals[i%animals.length],angle=pig.root.rotation.y;
   s.truffles.push({amount:2**(pig.data.level+1)-1,x:pig.root.position.x+Math.sin(angle)*1.05+(Math.random()-.5)*.4,z:pig.root.position.z+Math.cos(angle)*1.05+(Math.random()-.5)*.4});
  }
  sync();return true;
 }
 let held=null,over=null,ghost=null,lastFrame=performance.now();
 const surface=new T.Plane(new T.Vector3(0,1,0),-.07);
 const floorPoint=new T.Vector3();
 function hit(exclude){
  const hit=ray.intersectObjects(animals.filter(a=>a!==exclude).map(a=>a.body),true)[0];if(!hit)return null;
  let o=hit.object;while(o.parent!==pen)o=o.parent;return animals.find(a=>a.root===o);
 }
 function start(e){
  if(held||ghost)return false;
  aim(e);const a=hit();if(!a)return false;
  ray.ray.intersectPlane(surface,floorPoint);
  held={a,id:e.pointerId,x:a.data.x,z:a.data.z,dx:a.data.x-(floorPoint.x-pen.position.x),dz:a.data.z-floorPoint.z};
  canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';return true;
 }
 function move(e){
  if(!held||held.id!==e.pointerId)return false;
  aim(e);const a=held.a,d=a.data;
  ray.ray.intersectPlane(surface,floorPoint);
  d.x=T.MathUtils.clamp(floorPoint.x-pen.position.x+held.dx,-5.25,5.25);
  d.z=T.MathUtils.clamp(floorPoint.z+held.dz,-2.1,3.1);
  over=hit(a)||animals.find(b=>b!==a&&Math.hypot(b.data.x-d.x,b.data.z-d.z)<.9);
  return true;
 }
 function cancel(){
  if(!held)return;held.a.data.x=held.x;held.a.data.z=held.z;
  if(canvas.hasPointerCapture(held.id))canvas.releasePointerCapture(held.id);
  held=over=null;canvas.style.cursor='';
 }
 function finish(e){
  if(!move(e))return false;
  const a=held.a,target=over,d=a.data;
  if(target&&d.level===target.data.level&&d.level<pigBreeds.length-1){
   const herd=state().herd,next={...target.data,level:d.level+1,heading:.22};
   const from=a.root.position.clone();herd.splice(herd.indexOf(d),1);herd[herd.indexOf(target.data)]=next;
   sync();pen.add(a.root);ghost={root:a.root,scale:a.root.scale.x,from,to:target.root.position.clone(),started:performance.now()};
   animals.find(animal=>animal.data===next).bounce=1;onMerge(next.level);
  }else if(target){
   d.x=held.x;d.z=held.z;
   tell(target.data.level===d.level?'已经是最高阶啦':'要找同款小猪哦');
  }
  if(canvas.hasPointerCapture(held.id))canvas.releasePointerCapture(held.id);
  held=over=null;canvas.style.cursor='';return true;
 }
 function tell(text){
  const tip=document.createElement('span');tip.className='harvest receipt';tip.textContent=text;document.body.append(tip);
  tip.addEventListener('animationend',()=>tip.remove(),{once:true});
 }
 function animate(now){
  const dt=Math.min(.07,(now-lastFrame)/1000);lastFrame=now;
  if(ghost){
   const f=T.MathUtils.clamp((now-ghost.started)/250,0,1);
   ghost.root.position.lerpVectors(ghost.from,ghost.to,f);ghost.root.scale.setScalar(ghost.scale*Math.max(.02,1-f));
   if(f===1){pen.remove(ghost.root);ghost=null}
  }
  const t=now*.001;
  animals.forEach((a,i)=>{
   const {data:d,root,body,legs}=a,isHeld=held?.a===a;
   if(!isHeld&&over!==a){
    a.turn-=dt;if(a.turn<=0){d.heading+=(Math.random()-.5)*1.25;a.turn=2+Math.random()*3}
    const nx=d.x+.42*Math.sin(d.heading)*dt,nz=d.z+.42*Math.cos(d.heading)*dt;
    if(nx<-4.85||nx>4.95||nz<-1.95||nz>2.85){d.heading=Math.atan2(-d.x,-d.z);d.x=T.MathUtils.clamp(d.x,-4.85,4.95);d.z=T.MathUtils.clamp(d.z,-1.95,2.85)}
    else{d.x=nx;d.z=nz}
   }
   const k=pigSize(d.level);a.bounce=Math.max(0,a.bounce-dt*1.35);
   const q=Math.cos((1-a.bounce)*16)*a.bounce*.26;
   root.position.set(d.x,.078+(isHeld?.8:0),d.z);root.rotation.y=d.heading;root.scale.set(k*(1+q),k*(1-q),k*(1+q));
   body.rotation.x=.055*Math.sin(t*3+i)+.13*Math.max(0,Math.sin(t*.52+i));
   legs.forEach((leg,j)=>leg.rotation.x=.27*Math.sin(t*5+i+(j===0||j===3?0:Math.PI)));
   a.halo.visible=!!held&&!isHeld&&held.a.data.level===d.level&&d.level<pigBreeds.length-1;
   a.halo.position.set(d.x,.088,d.z);a.halo.scale.setScalar(k*(a===over?1.22:1));
  });
  const px=innerHeight*camera.zoom/(camera.top-camera.bottom);
  for(const [t,item] of buttons){
   projected.set(t.x+pigCenterX,.29,t.z).project(camera);
   item.btn.style.left=(1+projected.x)*innerWidth/2+'px';item.btn.style.top=(1-projected.y)*innerHeight/2+'px';
   item.btn.style.width=item.btn.style.height=Math.max(26,.65*px)+'px';
  }
 }
 return {sync,tick,animate,start,move,finish,cancel,tell};
}
