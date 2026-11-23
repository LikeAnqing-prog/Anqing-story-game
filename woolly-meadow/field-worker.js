'use strict';
function makeFieldWorker(){
 const root=new T.Group(),body=group(0,0,0,root),skin=0xf2bf99,hair=0x493c39,shirt=0xa6c8c0,ink=0x39525a;
 const legs=[],arms=[];
 for(const side of [-1,1]){
  const leg=group(side*.15,.64,0,body);legs.push(leg);
  box(leg,ink,0,-.23,0,.225,.49,.235);
  oval(leg,0x4f443d,0,-.49,.065,.145,.083,.205);
  oval(leg,0xc9bd9e,0,-.546,.075,.145,.027,.203);
 }
 oval(body,shirt,0,.95,0,.40,.435,.255);
 oval(body,ink,0,.64,0,.32,.12,.22);
 const head=group(0,1.62,0,body);
 oval(head,skin,0,0,0,.378,.385,.33);
 oval(head,hair,0,.175,-.037,.389,.265,.339);
 for(const side of [-1,1]){
  oval(head,skin,side*.367,-.018,0,.075,.11,.079);
  oval(head,hair,side*.317,.075,.098,.064,.155,.107);
  oval(head,hair,side*.144,.064,.315,.058,.017,.012).rotation.z=side*.11;
  oval(head,0x383635,side*.144,-.009,.315,.034,.044,.018);
  oval(head,0xfff3da,side*.144-.008,.005,.332,.010,.012,.007);
  oval(head,0xe8a592,side*.22,-.08,.259,.065,.035,.015).rotation.y=side*.47;
  const arm=group(side*.325,1.13,0,body);arms.push(arm);
  oval(arm,shirt,side*.024,-.095,0,.122,.175,.132);
  oval(arm,skin,side*.038,-.286,.035,.083,.155,.089);
  const strap=box(body,ink,side*.083,1.025,.224,.032,.355,.025);strap.rotation.z=-side*.36;
  const collar=box(body,0xe6ebd8,side*.081,1.23,.191,.122,.085,.049);collar.rotation.z=side*.52;
 }
 oval(head,hair,-.121,.188,.256,.211,.088,.104).rotation.z=.25;
 oval(head,skin,0,-.057,.335,.059,.052,.07);
 oval(head,0x9d6962,.024,-.157,.294,.056,.012,.018).rotation.z=.10;
 const badge=group(.012,.835,.267,body);badge.rotation.z=-.10;badge.name='工牌';
 box(badge,0x39786f,0,0,0,.291,.32,.044);
 box(badge,0xfff1cc,0,-.018,.032,.248,.235,.023);
 oval(badge,0x9c806a,-.055,.009,.052,.043,.047,.010);
 box(badge,0x8caea3,-.055,-.065,.052,.09,.061,.012);
 for(const y of [.006,-.042])box(badge,ink,.064,y,.053,.080,.013,.008);
 box(badge,0xd9ae59,0,.153,.027,.056,.056,.021);
 const mug=group(.03,-.39,.105,arms[1]);part(mug,pole,0xc78054,0,0,0,.15,.19,.15);
 part(mug,pole,0xf7ead3,0,.100,0,.175,.034,.175);
 root.name='牛马打工人';return {root,body,head,legs,arms};
}

function createFieldWorkers(farm,animals,getTown,commit){
 const people=new Map(),projections=new T.Vector3(),groundPoint=new T.Vector3();
 const halo=new T.Mesh(haloGeo,haloMat);halo.rotation.x=-Math.PI/2;halo.visible=false;farm.add(halo);
 const tag=document.createElement('div');tag.className='worker-reveal';tag.setAttribute('role','status');tag.hidden=true;document.body.append(tag);
 const card=document.createElement('dialog');card.className='employee-card';card.setAttribute('aria-label','牧场员工证');
 card.innerHTML='<div class="card-slot"></div><small>绵绵牧场 · 员工证</small><h2>牛马</h2><p>岗位　牧场打工人</p><p>特长　挤奶、跑腿、准时打卡</p><div><button data-dismiss>收好工牌</button><button data-off-duty>下班，变回牛和马</button></div>';
 document.body.append(card);
 let held=null,viewing=null,reveal=null,ghosts=[];
 function cancel(){
  if(!held)return;
  const {actor,origin,id}=held;actor.root.position.copy(origin);actor.route=null;held=null;
  if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);
  halo.visible=false;canvas.style.cursor='';
 }
 function sync(t,hauler){
  const pairs=t.workers||[];
  for(const [p,a] of people)if(!pairs.includes(p)){farm.remove(a.root);people.delete(p)}
  for(const p of pairs){
   if(!people.has(p)){const a=makeFieldWorker();a.root.position.set(p.x,.09,p.z);a.root.rotation.y=.20;farm.add(a.root);people.set(p,a)}
   people.get(p).root.visible=p.horse!==hauler;
  }
  if(held&&!held.actor.root.visible)cancel();
 }
 function pick(list){
  const roots=list.filter(a=>a.root.visible).map(a=>a.root),hit=ray.intersectObjects(roots,true)[0];if(!hit)return null;
  let obj=hit.object;while(obj.parent!==farm)obj=obj.parent;
  return list.find(a=>a.root===obj);
 }
 function start(e){
  if(held)return true;
  if(!e.isPrimary||e.button!==0)return false;
  const actor=pick([...animals.cow,...animals.horse,...people.values()]);if(!actor)return false;
  if(!ray.ray.intersectPlane(floor,groundPoint))return false;
  held={id:e.pointerId,actor,x:e.clientX,y:e.clientY,origin:actor.root.position.clone(),offset:actor.root.position.clone().sub(groundPoint),moved:false,target:null};
  canvas.setPointerCapture(e.pointerId);return true;
 }
 function move(e){
  if(!held||held.id!==e.pointerId)return false;
  if(!held.moved&&Math.hypot(e.clientX-held.x,e.clientY-held.y)<6)return true;
  held.moved=true;
  const {actor,offset}=held;if(actor.root.name==='牛马打工人')return true;
  aim(e);if(!ray.ray.intersectPlane(floor,groundPoint))return true;
  const pos=actor.root.position;
  pos.set(T.MathUtils.clamp(groundPoint.x+offset.x,grazing.left,grazing.right),.65,T.MathUtils.clamp(groundPoint.z+offset.z,grazing.back,grazing.front));
  actor.route=null;canvas.style.cursor='grabbing';
  const mates=actor.root.name==='cow'?animals.horse:animals.cow;
  held.target=pick(mates)||mates.find(a=>a.root.visible&&Math.hypot(a.root.position.x-pos.x,a.root.position.z-pos.z)<.84);
  halo.visible=!!held.target;
  if(held.target){halo.position.copy(held.target.root.position);halo.position.y=.085}
  return true;
 }
 function finish(e){
  if(!held||e.pointerId!==held.id)return false;
  move(e);const {actor,target,moved}=held,pos=actor.root.position.clone();
  cancel();
  if(actor.root.name==='牛马打工人'){
   if(!moved){viewing=[...people].find(([,a])=>a===actor)?.[0];if(viewing)card.showModal()}
   return true;
  }
  actor.root.position.set(pos.x,.09,pos.z);
  if(!moved||!target?.root.visible)return true;
  const cow=actor.root.name==='cow'?actor:target,horse=cow===actor?target:actor;
  const t=getTown(),p={cow:animals.cow.indexOf(cow),horse:animals.horse.indexOf(horse),x:target.root.position.x,z:target.root.position.z};
  const stamp=performance.now();
  for(const a of [actor,target]){
   const ghost=a.root.clone(true);farm.add(ghost);ghosts.push({ghost,from:ghost.position.clone(),p,start:stamp});
  }
  (t.workers??=[]).push(p);t.workerMerges=(t.workerMerges||0)+1;
  commit();const person=people.get(p);person.born=stamp;person.rest=1.8;
  reveal={p,until:stamp+4300};tag.textContent='隐藏合成 · 牛马上班了！';return true;
 }
 card.addEventListener('click',e=>{
  if(e.target.closest('[data-dismiss]')){card.close();return}
  if(!e.target.closest('[data-off-duty]'))return;
  const t=getTown(),i=t.workers?.indexOf(viewing)??-1;if(i<0){card.close();return}
  const p=viewing,pos=people.get(p).root.position;
  [animals.cow[p.cow],animals.horse[p.horse]].forEach((a,j)=>{
   a.root.position.set(T.MathUtils.clamp(pos.x+(j?.66:-.66),grazing.left,grazing.right),.09,pos.z);a.route=null;a.rest=1.0;
  });
  t.workers.splice(i,1);card.close();commit();
 });
 card.addEventListener('close',()=>{viewing=null});
 function animate(ms,dt){
  for(let i=ghosts.length-1;i>=0;i--){
   const {ghost,from,p,start}=ghosts[i],f=Math.min(1,(ms-start)/275);
   ghost.position.set(from.x+(p.x-from.x)*f,.09+.26*Math.sin(Math.PI*f),from.z+(p.z-from.z)*f);
   ghost.scale.setScalar(.90*(1-f));if(f===1){farm.remove(ghost);ghosts.splice(i,1)}
  }
  for(const [p,a] of people){
   if(!a.root.visible)continue;
   const age=ms-(a.born??-Infinity),f=T.MathUtils.clamp((age-120)/550,0,1);
   const q=f===1?1:Math.max(.02,1-Math.exp(-5*f)*Math.cos(9*f));
   a.root.scale.set(q,q*(1+.13*Math.sin(f*Math.PI*2)),q);
   const speed=age<680||held?.actor===a?0:graze(a,a.root.position,dt,.90);
   p.x=a.root.position.x;p.z=a.root.position.z;
   const step=Math.sin(a.gait?.stride||0)*speed;
   a.legs.forEach((leg,j)=>leg.rotation.x=(j?-1:1)*.39*step);
   a.arms[0].rotation.x=-.28*step;a.arms[1].rotation.x=-.43+.12*step;
   a.head.rotation.z=.036*Math.sin(ms*.0017+p.cow);
  }
  tag.hidden=!(reveal&&ms<reveal.until&&farm.visible&&people.get(reveal.p)?.root.visible);
  if(!tag.hidden){
   projections.copy(people.get(reveal.p).root.position);projections.y+=2.35;projections.project(camera);
   tag.style.left=(1+projections.x)*innerWidth/2+'px';tag.style.top=(1-projections.y)*innerHeight/2+'px';
  }
 }
 return {start,move,finish,cancel,sync,animate,busy:a=>held?.actor===a||held?.target===a};
}
