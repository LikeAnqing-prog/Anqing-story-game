'use strict';
const townZ=39;
const townSites={
 cow:{name:'奶牛饲养',x:-14.6,z:-9.2,farm:true},horse:{name:'马匹运输',x:-2.5,z:-10.2,farm:true},
 dairy:{name:'黄油街乳品铺',x:-1.1,z:0},inn:{name:'松露小馆',x:3.0,z:0},market:{name:'山间货栈',x:7.0,z:0}
};
const woolShopSite={x:-6.85,z:townZ-.45};
function streetModel(object){object.traverse(o=>o.layers.set(1));return object}
const calfCoats=new Map();
function calfCoat(parent,i,face,x,y,z,w,h,d){
 const key=(face?'face':'back')+i;
 if(!calfCoats.has(key)){
  const skin=document.createElement('canvas');skin.width=512;skin.height=256;
  const ctx=skin.getContext('2d'),pixels=ctx.createImageData(skin.width,skin.height);
  const ivory=[255,239,216],ink=[[65,61,64],[87,68,62],[63,68,68]][i%3];
  for(let row=0;row<skin.height;row++){
   const theta=Math.PI*(row+.5)/skin.height,b=Math.cos(theta),radius=Math.sin(theta);
   for(let col=0;col<skin.width;col++){
    const phi=2*Math.PI*(col+.5)/skin.width;
    const a=-Math.cos(phi)*radius*(i%2?-1:1),c=Math.sin(phi)*radius;
    const wave=.07*Math.sin(5*b+3*c+i)+.055*Math.cos(6*a-3*b);
    const patch=face?Math.max(a+.3*b-.67,-a+.44*b-.95):
     Math.max(-c+.31*a-.43,c+.53*a+.18*b-.68,b-.32*a-.77);
    const t=T.MathUtils.smoothstep(patch+wave,-.012,.012),idx=(row*skin.width+col)*4;
    for(let k=0;k<3;k++)pixels.data[idx+k]=ivory[k]+(ink[k]-ivory[k])*t;
    pixels.data[idx+3]=255;
   }
  }
  ctx.putImageData(pixels,0,0);
  const tex=new T.CanvasTexture(skin);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=T.RepeatWrapping;
  calfCoats.set(key,new T.MeshStandardMaterial({map:tex,roughness:.89}));
 }
 const m=new T.Mesh(ball,calfCoats.get(key));m.position.set(x,y,z);m.scale.set(w,h,d);
 m.castShadow=m.receiveShadow=true;parent.add(m);
}
function makeCalf(i){
 const root=new T.Group(),body=group(0,0,0,root),head=group(0,1.07,.49,body),legs=[],eyes=[],ears=[];
 const cream=0xffebd1,hoof=0x776458,rose=0xe6a49b;
 calfCoat(body,i,false,0,.74,-.10,.49,.475,.74);
 calfCoat(head,i,true,0,.016,.04,.45,.422,.363);
 const tail=group(0,.83,-.74,body);
 oval(tail,cream,.015,-.19,-.055,.048,.25,.051).rotation.x=.22;
 oval(tail,0x514547,.018,-.398,-.095,.084,.117,.078);
 for(const side of [-1,1]){
  const horn=group(side*.235,.339,-.005,head);horn.rotation.z=-side*.38;
  oval(horn,0xb49369,0,.048,0,.090,.125,.082);
  oval(horn,0xefcf93,side*.016,.118,-.016,.075,.104,.066);
  const ear=group(side*.354,.16,-.038,head);ear.rotation.z=side*.22;ears.push(ear);
  oval(ear,side===1?0x504447:cream,side*.104,0,0,.20,.116,.095);
  oval(ear,rose,side*.118,-.013,.066,.139,.068,.034);
  const eye=group(side*.236,.06,.327,head);eye.rotation.y=side*.5;eyes.push(eye);
  oval(eye,0x332d30,0,0,0,.063,.084,.044);
  oval(eye,0xfffaf0,-.016,.030,.036,.021,.022,.012);
  oval(eye,0xb09c84,.022,-.026,.036,.010,.014,.008);
  oval(head,0xe8b0a4,side*.307,-.064,.284,.071,.035,.024).rotation.y=side*.55;
 }
 oval(head,0xf1b9ad,0,-.115,.348,.283,.148,.129);
 for(const side of [-1,1])oval(head,0xae756b,side*.112,-.098,.463,.035,.021,.015).rotation.z=side*.26;
 for(let j=0;j<3;j++)oval(head,0xffecd0,-.062+j*.065,.365-.018*j,.175+(j%2)*.027,.091,.127,.072).rotation.z=.48;
 oval(body,0x649e90,0,.84,.40,.393,.093,.264);
 part(body,pole,0xdbab55,0,.744,.655,.18,.153,.155);oval(body,0xa47b43,0,.659,.658,.037,.037,.035);
 for(const x of [-.287,.287])for(const z of [-.44,.282]){
  const leg=group(x,.425,z,body);
  oval(leg,cream,0,-.115,0,.118,.211,.124);oval(leg,hoof,0,-.305,.019,.111,.084,.125);legs.push(leg);
 }
 root.scale.setScalar(.94);return {root,body,head,legs,eyes,ears,tail};
}
function townAnimal(horse,i){
 if(!horse)return makeCalf(i);
 const root=new T.Group(),body=new T.Group();root.add(body);
 const coat=[0xab714f,0xd6ad77,0x95705c][i%3];
 const dark=0x604537;
 oval(body,coat,0,.83,0,.44,.43,.73);
 const head=group(0,1.40,.57,body);
  oval(body,coat,0,1.17,.39,.30,.49,.31).rotation.x=.29;
  for(let k=0;k<4;k++)oval(body,dark,0,1.1+k*.11,.11+k*.065,.12,.15,.15);
  oval(head,coat,0,.02,.16,.245,.27,.39);
  oval(head,0xd9ab89,0,-.10,.42,.20,.15,.21);
  oval(head,0xffdfb6,0,.10,.45,.06,.13,.04);
  oval(body,0x507e77,0,1.16,-.07,.43,.13,.37);
  oval(body,0x896449,0,1.25,-.08,.30,.12,.26);
 for(const side of [-1,1]){
  oval(head,coat,side*.16,.31,0,.079,.18,.073).rotation.z=-side*.30;
  oval(head,0x3c3431,side*.186,.085,.34,.034,.045,.023);
  oval(head,0x805949,side*.09,-.095,.605,.027,.02,.018);
 }
 const tail=oval(body,dark,0,.68,-.72,.108,.38,.115);tail.rotation.x=.23;
 const legs=[];
 for(const x of [-.25,.25])for(const z of [-.41,.41]){
  const leg=group(x,.66,z,body);oval(leg,coat,0,-.24,0,.105,.26,.115);oval(leg,dark,0,-.49,.02,.104,.085,.12);legs.push(leg);
 }
 root.scale.setScalar(.90);return {root,legs,head};
}
function createTownWorld(getTown,commit){
 const root=group(0,0,townZ,scene),farms=group(0,0,0,scene),village=new T.Group();root.add(village);
 const wood=0xb78c63,cream=0xf2dcb4,green=0x699786;
 function batch(g){const mesh=batchScenery(g);g.clear();g.add(mesh)}
 village.add(meadowSlab(24.8,10.3,.65,.84,0xbb9674,-1));
 village.add(meadowSlab(24.83,10.34,.65,.15,0xb1c797,-.16));
 box(village,0xe4ceaa,0,.035,2.15,23.9,.07,1.44);
 box(village,0xe4ceaa,0,.045,2.8,23.9,.08,3.3);
 for(let i=-8;i<=8;i++)box(village,i%2?0xceb897:0xd5c4a7,i*1.17,.094,4.22,.96,.035,.36);
 function tree(x,z){
  part(village,pole,wood,x,.7,z,.25,1.3,.25);
  for(let j=0;j<4;j++){let a=j*2.4;oval(village,j%2?0x88aa7c:0x9db892,x+.38*Math.cos(a),1.65+.17*j,z+.31*Math.sin(a),.67,.82,.59)}
 }
 for(const x of [-10,-7.5,-2,2,8,10])tree(x,-4.45);
 for(const x of [-11.3,-2.9,.95,5.05,11.3]){
  part(village,pole,wood,x,.86,3.75,.10,1.64,.10);
  box(village,0xf7d691,x,1.74,3.75,.24,.34,.24);part(village,cone,0x718779,x,1.99,3.75,.26,.20,.26);
 }
 function cottage(g,color,roofColor){
  box(g,color,0,.85,0,2.72,1.65,1.82);
  for(const side of [-1,1]){
   const roof=box(g,roofColor,side*.72,1.94,0,1.66,.16,2.16);roof.rotation.z=-side*.34;
   for(let j=0;j<6;j++){
    const tile=box(g,roofColor,side*.72,2.04,-.90+j*.35,1.66,.045,.31);tile.rotation.z=-side*.34;
   }
  }
  box(g,wood,0,1,.94,2.13,.87,.10);box(g,0x54736d,0,1,.995,1.94,.71,.04);
  box(g,cream,0,.56,1.14,2.32,.13,.57);
 }
 const working={},animals={cow:[],horse:[]},covers={};
 const staff=createFieldWorkers(farms,animals,getTown,commit);
 for(const [id,site] of Object.entries(townSites)){
  const base=group(site.x,0,site.z,site.farm?farms:village),live=group(site.x,0,site.z,site.farm?farms:root);
  working[id]=live;
  if(site.farm){
   // Milk cans and tack belong to the common barn. The animals roam independently.
   live.position.set(-5.55,0,-3.72);
   if(id==='cow'){
    for(const x of [1.8,2.24]){part(live,pole,0xbacbc4,x,.34,.84,.34,.52,.34);part(live,pole,cream,x,.61,.84,.30,.06,.30)}
   }else{
    for(const x of [-2.45,-1.72])box(live,wood,x,.42,.35,.11,.8,.11);
    box(live,wood,-2.08,.74,.35,.94,.1,.11);oval(live,0x8e654c,-2.1,.79,.35,.2,.11,.24);
   }
  }else{
   cottage(live,id==='inn'?0xf1c7a6:cream,id==='dairy'?green:id==='inn'?0xb57660:0x718595);
   if(id==='dairy'){
    part(live,pole,0xfff3d5,0,2.42,0,.62,.79,.62);
    part(live,pole,0xc8dfd2,0,2.87,0,.38,.19,.38);
    part(live,pole,0x87aca2,0,3.01,0,.42,.08,.42);
    box(live,0x80a599,0,2.44,.29,.32,.22,.04);
   }else if(id==='inn'){
    box(live,0xae8066,.82,2.08,-.48,.39,.94,.42);
    box(live,cream,.82,2.54,-.48,.48,.13,.48);
    oval(live,0x8e6861,0,2.25,.37,.50,.27,.35);
    part(live,pole,0xdab783,0,2.46,.37,.83,.06,.65);
    for(const side of [-1,1])oval(live,0x77584e,side*.46,2.37,.37,.12,.06,.06);
    oval(live,0xb67d5c,0,2.54,.37,.085,.067,.085);
   }else{
    box(live,0x96775e,0,2.30,.24,1.13,.64,.12);box(live,cream,0,2.30,.32,1,.50,.065);
    for(const side of [-1,1])box(live,0x81968d,side*.20,2.28,.37,.28,.23,.04);
    for(let k=0;k<3;k++)box(live,wood,-1.38+(k%2)*.30,.22+.33*Math.floor(k/2),.85,.40,.35,.40);
   }
   for(let j=-3;j<=3;j++){
    const tile=box(live,j%2?cream:id==='inn'?0xc38265:id==='dairy'?green:0x8395a0,j*.34,1.54,1.15,.35,.09,.67);tile.rotation.x=.15;
   }
   for(let j=-1;j<=1;j++){
    if(id==='dairy')part(live,pole,0xf2ce7f,j*.48,.73,1.18,.36,.20,.33);
    else if(id==='inn')oval(live,0xb27958,j*.48,.71,1.18,.19,.13,.16);
    else box(live,0xc69c71,j*.48,.78,1.19,.34,.28,.29);
   }
   const tarp=group(site.x,0,site.z,root);covers[id]=tarp;
   box(tarp,wood,0,.18,0,2.62,.28,1.55);
   for(const side of [-1,1]){box(tarp,wood,side*1.0,.73,0,.12,1.19,.15);box(tarp,cream,side*.61,.49,.47,.98,.16,.09)}
   const roll=box(tarp,0xb7c3a7,0,.96,0,2.30,.12,.90);roll.rotation.z=.065;batch(tarp);
  }
  batch(live);if(site.farm)batch(base);
 }
 batch(village);
 const racks=[];
 for(let i=0;i<3;i++){
  const rack=group(8.85+i*.8,0,.2,root);
  box(rack,wood,0,.15,0,.82,.25,.85);
  for(let j=0;j<=i;j++){
   box(rack,j%2?0xc39970:0xc9b083,0,.39+j*.24,0,.72,.22,.69);
   box(rack,cream,0,.39+j*.24,.355,.12,.21,.015);
  }
  batch(rack);racks.push(rack);
 }
 const cart=group(0,.1,0,root),cartHorse=townAnimal(true,0);cart.add(cartHorse.root);
 cartHorse.root.position.z=1.24;cartHorse.root.scale.setScalar(.73);
 const courier=makeFieldWorker();cart.add(courier.root);courier.root.scale.setScalar(.79);courier.root.position.z=1.24;
 const deck=group(0,0,0,cart);
 box(deck,wood,0,.52,0,.91,.24,1.16);box(deck,0x8fa698,0,.77,0,.72,.36,.88);
 for(const side of [-1,1]){
  for(const z of [-.33,.33])oval(deck,0x826446,side*.48,.32,z,.095,.28,.28);
  box(deck,wood,side*.33,.52,.79,.055,.06,1.04);
 }
 batch(deck);
 // The street has its own camera layer so distant home pastures stay out of portrait views.
 streetModel(root);
 for(const light of scene.children)if(light.isLight)light.layers.enable(1);
 let trip=null,lastFrame=performance.now();
 function sync(state){
  racks.forEach((rack,i)=>rack.visible=i<state.depot);
  trip=state.shipment;cart.visible=state.horse>0;
  const pairs=state.workers||[],onRoad=!!trip&&!trip.arrived;
  let hauler=onRoad?state.horse-1:-1;
  if(onRoad){for(let i=hauler;i>=0;i--)if(!pairs.some(p=>p.horse===i)){hauler=i;break}}
  courier.root.visible=onRoad&&pairs.some(p=>p.horse===hauler);
  cartHorse.root.visible=onRoad&&!courier.root.visible;
  for(const id of Object.keys(working)){
   const count=id==='market'?1:state[id];
   working[id].visible=count>0;if(covers[id])covers[id].visible=!count;
   if(!animals[id])continue;
   while(animals[id].length<count){const a=townAnimal(id==='horse',animals[id].length);const patch=grazingPatches[Math.floor(Math.random()*grazingPatches.length)];a.root.position.set(patch.x+Math.random()*.6,.09,patch.z+Math.random()*.6);a.root.name=id;farms.add(a.root);animals[id].push(a)}
   animals[id].forEach((a,i)=>{
    const hauling=id==='horse'&&i===hauler;
    a.root.visible=i<count&&!hauling&&!pairs.some(p=>p[id]===i);
   });
  }
  staff.sync(state,hauler);
 }
 function animate(ms){
  const t=ms*.001,dt=Math.min(.12,(ms-lastFrame)/1000);lastFrame=ms;
  const moving=trip&&!trip.arrived;
  const f=moving?T.MathUtils.clamp((Date.now()-trip.start)/(trip.due-trip.start),0,1):0;
  cart.position.set(moving?7.9-16*f:7.9,.09+(moving?.023*Math.abs(Math.sin(t*5)):0),2.35);cart.rotation.y=-Math.PI/2;
  cartHorse.legs.forEach((leg,j)=>leg.rotation.x=.25*Math.sin(t*5+(j===0||j===3?0:Math.PI)));
  for(const [id,herd] of Object.entries(animals))herd.forEach((a,i)=>{
   if(!a.root.visible||staff.busy(a))return;
   const pace=graze(a,a.root.position,dt,(id==='horse'?1.32:.9)+i*.07);
   if(id==='cow'){
    const stride=a.gait.stride,rest=pace<.05;
    a.body.rotation.z=.040*Math.sin(stride)*pace;
    a.head.rotation.x=rest?.14+.22*Math.sin(t*1.25+i):.06+.055*Math.sin(stride*2);
    a.tail.rotation.z=.19+.19*Math.sin(t*1.8+i);
    a.eyes.forEach(eye=>eye.scale.y=1-.91*Math.max(0,1-Math.abs((t+i)%3.6-.11)/.11));
    a.ears.forEach((ear,j)=>ear.rotation.x=-.06+.1*Math.sin(t*3+i+j));
   }else a.head.rotation.x=.10*Math.sin(t*1.7+i);
   a.legs.forEach((leg,j)=>leg.rotation.x=pace*.21*Math.sin(a.gait.stride+(j===0||j===3?0:Math.PI)));
  });
  staff.animate(ms,dt);
  if(courier.root.visible)courier.legs.forEach((leg,j)=>leg.rotation.x=.31*Math.sin(t*5+j*Math.PI));
 }
 return {root,farms,sync,animate,staff,fieldHorse:()=>animals.horse.find(a=>a.root.visible)?.root};
}
