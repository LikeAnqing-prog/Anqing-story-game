'use strict';
const pigCenterX=-16.4;
const pigPlots=[
 {capacity:6,period:5000,price:100},
 {capacity:8,period:4000,price:200},
 {capacity:10,period:3000,price:0}
];
const pigBreeds=[
 {name:'芝麻汤圆香猪',patch:0x403b42},{name:'栗子铃铛香猪',patch:0x865f4e},
 {name:'松露芽芽香猪',patch:0x66664f},{name:'蜂蜜皇冠香猪',patch:0xb27c4b},
 {name:'晚安月牙香猪',patch:0x695978},{name:'海盐珍珠香猪',patch:0x5a8490},
 {name:'桃花蝴蝶香猪',patch:0xb47779},{name:'日冕金桂香猪',patch:0x9a7344}
];
function pigSize(level){return size({level})}
function newPiglet(i,level=0){
 return {level,x:-3.2+(i%4)*1.95,z:-.5+Math.floor(i/4)*1.15,heading:.16+i*.35};
}
function createPigFarm({state,collectTruffle,onMerge,buyPig}){
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
 const pile=group(-3.85,.075,2.05,pen);
 pile.name='便便堆';
 // A single tapered spiral keeps the soft-serve silhouette continuous up to its curled tip.
 const coilPath=new T.CatmullRomCurve3(Array.from({length:91},(_,i)=>{
  const t=i/90,angle=t*Math.PI*4.8-1.5,r=.56*(1-t)**.83;
  return new T.Vector3(r*Math.cos(angle)+.18*t**6,.22+.91*t+.16*t**8,r*Math.sin(angle));
 }));
 const coil=new T.TubeGeometry(coilPath,96,1,18,false),cp=coil.attributes.position;
 for(let i=0;i<=96;i++){
  const t=i/96,center=coilPath.getPointAt(t),radius=(.32-.10*t)*(1-T.MathUtils.smoothstep(t,.79,1))+.008;
  for(let j=0;j<=18;j++){
   const k=i*19+j,v=new T.Vector3().fromBufferAttribute(cp,k).sub(center).multiplyScalar(radius).add(center);
   cp.setXYZ(k,v.x,v.y,v.z);
  }
 }
 coil.computeVertexNormals();
 oval(pile,0x986347,0,.21,0,.83,.25,.72);
 part(pile,coil,0xa46e50,0,0,0,1,1,1);
 for(const side of [-1,1]){
  oval(pile,0x49352e,side*.20,.34,.704,.046,.063,.038);
  oval(pile,0xf4ccab,side*.20-.012,.366,.735,.014,.016,.011);
 }
 const buyButton=document.createElement('button');
 buyButton.id='pigSource';buyButton.hidden=true;buyButton.innerHTML='<span></span>';
 document.body.append(buyButton);buyButton.onclick=buyPig;
 let pulse=0;
 const basketButton=document.createElement('button');basketButton.className='person-hit';basketButton.hidden=true;
 basketButton.setAttribute('aria-label','查看松露收集篮速率');document.body.append(basketButton);
 basketButton.onclick=()=>tell('每 3 秒收 '+[0,2,5][state().pigCollector]+' 堆松露');
 const basket=group(-5.15,.09,-1.12,pen);
 part(basket,pole,0xaa7951,0,.24,0,.88,.51,.88);
 for(const y of [.14,.37,.49])part(basket,pole,0xe0b681,0,y,0,.93,.06,.93);
 for(const x of [-.19,.05,.23])oval(basket,0x665047,x,.51,.06*Math.sin(x*21),.16,.13,.16);
 const coatCache=new Map();
 function spotted(parent,level,face,x,y,z,w,h,d){
  const key=level+'-'+face;
  if(!coatCache.has(key)){
   const geo=new T.SphereGeometry(1,72,48),v=geo.attributes.position,colors=[];
   const base=new T.Color(0xffe8dc),ink=new T.Color(pigBreeds[level].patch),c=new T.Color();
   for(let i=0;i<v.count;i++){
    const x=v.getX(i),y=v.getY(i),z=v.getZ(i);
    const border=face?Math.max(x+.32*y-.52-.09*z,-x+.13*y-.86):Math.max(-z-.40+.11*Math.sin(4*x+y),z+.17*x-.65);
    c.copy(base).lerp(ink,T.MathUtils.smoothstep(border,-.024,.024));colors.push(c.r,c.g,c.b);
   }
   geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));coatCache.set(key,geo);
  }
  const mesh=new T.Mesh(coatCache.get(key),spottedMaterial);
  mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);
 }
 const spottedMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.9});
 const earGeo=ball.clone(),ep=earGeo.attributes.position;
 for(let i=0;i<ep.count;i++){
  const x=ep.getX(i),y=ep.getY(i),z=ep.getZ(i);
  ep.setXYZ(i,x*(1-.55*y),y,z+.24*y*y);
 }
 earGeo.computeVertexNormals();
 function makePig(data){
  const level=data.level,breed=pigBreeds[level],patch=breed.patch;
  const root=group(data.x,.07,data.z,pen),body=group(0,0,0,root),head=group(0,.73,.43,body);
  root.rotation.y=data.heading;root.name=breed.name;root.scale.setScalar(pigSize(level));
  spotted(body,level,false,0,.56,-.13,.49,.41,.65);
  spotted(head,level,true,0,0,0,.50,.44,.42);
  const ears=[],eyes=[];
  for(const side of [-1,1]){
   const ear=group(side*.315,.30,-.04,head);ears.push(ear);
   ear.rotation.z=-side*.53;ear.rotation.x=-.17;
   part(ear,earGeo,patch,0,.095,0,.157,.22,.087);
   part(ear,earGeo,0xf0aca5,0,.095,.065,.091,.152,.037);
   const eye=group(side*.215,.07,.351,head);eye.rotation.y=side*.34;eyes.push(eye);
   oval(eye,0x302829,0,0,0,.055,.069,.041);
   oval(eye,0xfff5e8,-.014,.027,.032,.018,.021,.012);
   oval(head,0xf0a59c,side*.32,-.06,.30,.078,.04,.023).rotation.y=side*.62;
  }
  oval(head,0xdf8d89,0,-.078,.413,.205,.132,.103);
  oval(head,0xffb5ad,0,-.056,.476,.188,.109,.067);
  for(const side of [-1,1])oval(head,0xa15f61,side*.072,-.049,.538,.027,.041,.009);
  const legs=[];for(const dx of [-.27,.27])for(const dz of [-.39,.25]){
   const leg=group(dx,.32,dz,body);oval(leg,0xf6d2c4,0,-.09,0,.11,.144,.112);
   oval(leg,0x986e67,0,-.218,.018,.098,.053,.107);legs.push(leg);
  }
  part(body,tailGeo,0xe7a69b,.05,.64,-.78,1,1,1);
  if(level===1){
   oval(body,0x8aaa9c,0,.68,.30,.41,.37,.11);
   oval(head,0xd9a347,0,-.37,.23,.085,.09,.073);
  }else if(level===2){
   for(const side of [-1,1])oval(head,0x85a36d,side*.09,.49,.015,.075,.18,.055).rotation.z=-side*.69;
  }else if(level===3||level===7){
   part(head,pole,0xe5b053,0,.40,0,.43,.13,.40);
   for(let i=0;i<(level===7?9:5);i++){
    const a=i*Math.PI*2/(level===7?9:5);
    part(head,cone,0xffd773,.16*Math.sin(a),.52,.16*Math.cos(a),.065,level===7?.26:.15,.06);
   }
   if(level===7)for(const side of [-1,1])for(let i=0;i<3;i++)
    oval(body,0xf1c462,side*(.37+i*.05),.78+i*.10,-.25-i*.09,.08,.18,.09).rotation.z=-side*.6;
  }else if(level===4){
   const cap=part(head,cone,0x81759c,.04,.54,-.03,.25,.49,.24);cap.rotation.z=-.31;
   part(head,star,0xffdd8b,.12,.77,-.02,.055,.055,.06);
  }else if(level===5){
   for(let i=0;i<9;i++){const a=(i-4)*.29;oval(head,0xd4f2e7,.39*Math.sin(a),-.27,.32*Math.cos(a),.062,.062,.062)}
   oval(head,0x82bdc1,0,.44,0,.102,.105,.10);
  }else if(level===6){
   for(const side of [-1,1])for(let i=0;i<2;i++)
    oval(body,i?0xe69eac:0xf5b6c7,side*(.39+i*.06),.91-i*.12,-.18+i*.22,.16,.24,.083).rotation.z=-side*.54;
  }
  const halo=new T.Mesh(haloGeo,haloMat);halo.rotation.x=-Math.PI/2;halo.visible=false;pen.add(halo);
  return {data,root,body,head,ears,eyes,legs,halo,turn:0,bounce:0,speed:.35};

 }
 function truffle(t,from){
  const m=group(t.x,.08,t.z,pen);part(m,rock,0x725247,0,.19,0,.29,.235,.26);part(m,rock,0x90705d,.15,.17,.09,.17,.16,.16);
  for(let i=0;i<4;i++)oval(m,0xae8b6e,.16*Math.sin(i*2),.31,.13*Math.cos(i*2),.047,.027,.052);
  const btn=document.createElement('button');btn.className='truffle-hit';document.body.append(btn);
  btn.onclick=()=>{const index=state().truffles.indexOf(t);if(index<0||buttons.get(t)?.from)return;state().truffles.splice(index,1);collectTruffle(t.amount||1)};
  part(m,star,0xf6d281,.15,.49,.02,.065,.08,.036);
  buttons.set(t,{m,btn,from,born:performance.now()});
 }
 const projected=new T.Vector3();
 function sync(){
  const herd=state().herd,s=state();
  pile.visible=herd.length>0;basket.visible=herd.length>0&&s.pigCollector>0;
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
 const flights=[];
 let nextPickup=0;
 function tick(now){
  const s=state();if(!s.herd.length)return false;
  const period=pigPlots[s.pigLevel-1].period;
  let changed=false;
  for(const a of animals){
   const pig=a.data;
   if(!Number.isFinite(pig.digDue))pig.digDue=now+period;
   if(now<pig.digDue||a.launch)continue;
   const cycles=1+Math.floor((now-pig.digDue)/period);
   pig.digDue+=cycles*period;
   const amount=cycles*woolYield(pig.level),count=Math.min(4,pig.level+1),angle=Math.random()*Math.PI*2;
   for(let j=0;j<count;j++){
    const dir=angle+j*Math.PI*2/count,r=.65+Math.random()*.45;
    const t={x:T.MathUtils.clamp(pig.x+Math.sin(dir)*r,-5.7,5.7),z:T.MathUtils.clamp(pig.z+Math.cos(dir)*r,-2.9,3.45),
     amount:Math.floor(amount/count)+(j<amount%count?1:0)};
    if(s.truffles.length>=woolDropLimit){
     const nearest=s.truffles.reduce((best,v)=>Math.hypot(v.x-t.x,v.z-t.z)<Math.hypot(best.x-t.x,best.z-t.z)?v:best);
     nearest.amount+=t.amount;
    }else{s.truffles.push(t);truffle(t,a.root.position.clone())}
   }
   changed=true;
  }
  if(s.pigCollector&&now>=nextPickup){
   nextPickup=now+3000;
   const take=s.truffles.filter(t=>!buttons.get(t)?.from).slice(0,[0,2,5][s.pigCollector]);
   let total=0;
   for(const t of take){
    const item=buttons.get(t);if(!item)continue;
    flights.push({m:item.m,from:item.m.position.clone(),start:performance.now()});
    item.btn.remove();buttons.delete(t);s.truffles.splice(s.truffles.indexOf(t),1);total+=t.amount;
   }
   if(total){collectTruffle(total,true);changed=true}
  }
  if(changed)sync();return changed;
 }
 function pop(data){
  pulse=1;sync();
  const a=animals.find(v=>v.data===data);
  a.launch={start:performance.now()};a.root.position.copy(pile.position);a.root.scale.setScalar(.05);
 }
 let held=null,over=null,ghost=null,lastFrame=performance.now();
 const surface=new T.Plane(new T.Vector3(0,1,0),-.07);
 const floorPoint=new T.Vector3();
 function hit(exclude){
  const hit=ray.intersectObjects(animals.filter(a=>a!==exclude&&!a.launch).map(a=>a.body),true)[0];if(!hit)return null;
  let o=hit.object;while(o.parent!==pen)o=o.parent;return animals.find(a=>a.root===o);
 }
 function start(e){
  if(held||ghost)return true;
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
  over=hit(a)||animals.find(b=>b!==a&&!b.launch&&Math.hypot(b.data.x-d.x,b.data.z-d.z)<.9);
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
  if(target&&compatible(d,target.data)){
   const herd=state().herd,next={...target.data,level:d.level+1,heading:.22,digDue:Date.now()+pigPlots[state().pigLevel-1].period};
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
  const tip=document.createElement('span');tip.className='harvest receipt pig-feedback';tip.textContent=text;document.body.append(tip);
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
   if(a.launch){
    const f=Math.min(1,(now-a.launch.start)/650),ease=f*f*(3-2*f),k=pigSize(d.level)*(.18+.82*ease);
    root.position.set(T.MathUtils.lerp(pile.position.x,d.x,ease),.08+.33*(1-f)+1.65*Math.sin(Math.PI*f),T.MathUtils.lerp(pile.position.z,d.z,ease));
    root.scale.set(k,k*(1+.22*Math.sin(Math.PI*f)),k);root.rotation.x=-.19*Math.sin(Math.PI*2*f);
    if(f===1){a.launch=null;a.bounce=1}
    return;
   }
   if(!isHeld&&over!==a){
    a.turn-=dt;if(a.turn<=0){d.heading+=(Math.random()-.5)*1.25;a.turn=1.4+Math.random()*2.9;a.speed=Math.random()<.24?0:.32+Math.random()*.38}
    const nx=d.x+a.speed*Math.sin(d.heading)*dt,nz=d.z+a.speed*Math.cos(d.heading)*dt;
    if(nx<-4.85||nx>4.95||nz<-1.95||nz>2.85){d.heading=Math.atan2(-d.x,-d.z);d.x=T.MathUtils.clamp(d.x,-4.85,4.95);d.z=T.MathUtils.clamp(d.z,-1.95,2.85)}
    else{d.x=nx;d.z=nz}
   }
   const k=pigSize(d.level);a.bounce=Math.max(0,a.bounce-dt*1.35);
   const q=Math.cos((1-a.bounce)*16)*a.bounce*.26;
   root.position.set(d.x,.078+(isHeld?.8:0),d.z);root.rotation.y=d.heading;root.scale.set(k*(1+q),k*(1-q),k*(1+q));
   a.head.rotation.z=.043*Math.sin(t*2.3+i);
   a.eyes.forEach(eye=>eye.scale.y=1-.92*Math.max(0,1-Math.abs((t+i)%3.4-.12)/.105));
   a.ears.forEach((ear,j)=>ear.rotation.x=-.17+.11*Math.sin(t*4.2+i+j));
   body.rotation.x=.055*Math.sin(t*3+i)+.13*Math.max(0,Math.sin(t*.52+i));
   legs.forEach((leg,j)=>leg.rotation.x=a.speed*.53*Math.sin(t*5+i+(j===0||j===3?0:Math.PI)));
   a.halo.visible=!!held&&!isHeld&&held.a.data.level===d.level&&d.level<pigBreeds.length-1;
   a.halo.position.set(d.x,.088,d.z);a.halo.scale.setScalar(k*(a===over?1.22:1));
  });
  pulse=Math.max(0,pulse-dt*1.7);const wobble=pulse*.22*Math.cos((1-pulse)*12);
  pile.scale.set(1+wobble,1-wobble,1+wobble);
  for(let i=flights.length-1;i>=0;i--){
   const f=Math.min(1,(now-flights[i].start)/790),{m,from}=flights[i];
   m.position.lerpVectors(from,basket.position,f);m.position.y+=1.4*Math.sin(Math.PI*f)+.42*f;
   m.scale.setScalar(1-.78*f);if(f===1){pen.remove(m);flights.splice(i,1)}
  }
  const px=innerHeight*camera.zoom/(camera.top-camera.bottom);
  for(const [t,item] of buttons){
   if(item.from){
    const f=Math.min(1,(now-item.born)/650);
    item.m.position.set(T.MathUtils.lerp(item.from.x,t.x,f),.08+.34*(1-f)+.43*Math.sin(Math.PI*f),T.MathUtils.lerp(item.from.z,t.z,f));
    if(f===1)item.from=null;
   }
   projected.set(t.x+pigCenterX,.29,t.z).project(camera);
   item.btn.style.left=(1+projected.x)*innerWidth/2+'px';item.btn.style.top=(1-projected.y)*innerHeight/2+'px';
   item.btn.style.width=item.btn.style.height=Math.max(26,.65*px)+'px';
  }
 }
 function showSource(visible,place,px){
  basketButton.hidden=!visible||!basket.visible;
  if(!basketButton.hidden){
   projected.set(pigCenterX+basket.position.x,.4,basket.position.z);
   place(basketButton,projected,px,n=>Math.max(28,n*.98),n=>Math.max(28,n*.91));
  }
  buyButton.hidden=!visible||!pile.visible;if(buyButton.hidden)return;
  projected.set(pigCenterX+pile.position.x,.52,pile.position.z);
  place(buyButton,projected,px,n=>Math.max(48,n*1.65),n=>Math.max(42,n*1.35));
 }
 return {sync,tick,animate,start,move,finish,cancel,tell,pop,buyButton,showSource};
}
