'use strict';
const townZ=39;
const townSites={
 cow:{name:'风铃奶牛场',x:-14.6,z:-9.2,farm:true},horse:{name:'栗风马场',x:-2.5,z:-10.2,farm:true},
 dairy:{name:'黄油街乳品铺',x:-1.1,z:0},inn:{name:'松露小馆',x:3.0,z:0},market:{name:'山间货栈',x:7.0,z:0}
};
const woolShopSite={x:-6.85,z:townZ-.45};
function streetModel(object){object.traverse(o=>o.layers.set(1));return object}
function townAnimal(horse,i){
 const root=new T.Group(),body=new T.Group();root.add(body);
 const coat=horse?[0xab714f,0xd6ad77,0x95705c][i%3]:0xf4e6cd;
 const dark=horse?0x604537:0x69574c;
 oval(body,coat,0,.83,0,.44,.43,.73);
 const head=group(0,horse?1.40:1.11,.57,body);
 if(horse){
  oval(body,coat,0,1.17,.39,.30,.49,.31).rotation.x=.29;
  for(let k=0;k<4;k++)oval(body,dark,0,1.1+k*.11,.11+k*.065,.12,.15,.15);
  oval(head,coat,0,.02,.16,.245,.27,.39);
  oval(head,0xd9ab89,0,-.10,.42,.20,.15,.21);
  oval(head,0xffdfb6,0,.10,.45,.06,.13,.04);
  oval(body,0x507e77,0,1.16,-.07,.43,.13,.37);
  oval(body,0x896449,0,1.25,-.08,.30,.12,.26);
 }else{
  for(const side of [-1,1]){
   oval(body,dark,side*.36,.96,-.18,.108,.23,.29);
   oval(body,dark,side*.35,.81,.32,.095,.14,.17);
   part(head,cone,0xcfaf75,side*.21,.30,0,.078,.24,.07).rotation.z=-side*.24;
  }
  oval(head,coat,0,.01,.11,.34,.31,.32);oval(head,0xdeab99,0,-.11,.34,.28,.16,.15);
  part(body,pole,0xd4a94f,0,.76,.64,.15,.18,.11);
 }
 for(const side of [-1,1]){
  oval(head,coat,side*(horse?.16:.33),horse?.31:.15,0,horse?.079:.15,horse?.18:.085,.073).rotation.z=-side*.30;
  oval(head,0x3c3431,side*(horse?.186:.18),.085,horse?.34:.355,.034,.045,.023);
  oval(head,0x805949,side*.09,-.095,horse?.605:.475,.027,.02,.018);
 }
 const tail=oval(body,dark,0,.68,-.72,.108,horse?.38:.22,.115);tail.rotation.x=.23;
 const legs=[];
 for(const x of [-.25,.25])for(const z of [-.41,.41]){
  const leg=group(x,.66,z,body);oval(leg,coat,0,-.24,0,.105,.26,.115);oval(leg,dark,0,-.49,.02,.104,.085,.12);legs.push(leg);
 }
 root.scale.setScalar(.90);return {root,legs,head};
}
function createTownWorld(){
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
 for(const [id,site] of Object.entries(townSites)){
  const base=group(site.x,0,site.z,site.farm?farms:village),live=group(site.x,0,site.z,site.farm?farms:root);
  working[id]=live;
  if(site.farm){
   const barn=group(-2.48,0,-1.23,live);barn.scale.setScalar(.80);cottage(barn,id==='cow'?0xf0dfbd:0xd8b28d,id==='cow'?green:0xa27560);
   if(id==='horse'){
    for(let j=0;j<20;j++){
     const angle=j*Math.PI/10;
     oval(base,0xc8b389,.35+2.53*Math.sin(angle),.041,.32+1.3*Math.cos(angle),.57,.024,.29).rotation.y=angle;
    }
    for(const x of [.90,2.03])box(live,cream,x,.45,-1.55,.11,.86,.12);
    box(live,0xbc795d,1.46,.65,-1.55,1.25,.10,.10);
   }else{
    for(const x of [-1.67,-1.17]){
     part(live,pole,0xbacbc4,x,.33,-.18,.34,.47,.34);
     part(live,pole,0xe2d4af,x,.58,-.18,.29,.07,.29);
    }
    part(live,pole,wood,-3.16,1.22,.03,.10,2.40,.10);
    box(live,wood,-2.85,2.38,.03,.70,.08,.09);
    for(let j=0;j<3;j++)part(live,pole,0xd5b766,-3.01+j*.18,2.13-j*.042,.03,.047,.27+j*.05,.047);
   }
   box(live,wood,2.60,.25,-1.55,1.09,.44,.62);oval(live,id==='horse'?0xdcbc71:0xa4bfba,2.60,.49,-1.55,.49,.065,.23);
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
 let trip=null;
 function sync(state){
  racks.forEach((rack,i)=>rack.visible=i<state.depot);
  trip=state.shipment;cart.visible=state.horse>0;
  cartHorse.root.visible=!!trip&&!trip.arrived;
  for(const id of Object.keys(working)){
   const count=id==='market'?1:state[id];
   working[id].visible=count>0;if(covers[id])covers[id].visible=!count;
   if(!animals[id])continue;
   while(animals[id].length<count){const a=townAnimal(id==='horse',animals[id].length);farms.add(a.root);animals[id].push(a)}
   animals[id].forEach((a,i)=>{
    const hauling=id==='horse'&&i===count-1&&trip&&!trip.arrived;
    a.root.visible=i<count&&!hauling;
   });
  }
 }
 function animate(ms){
  const t=ms*.001;
  const moving=trip&&!trip.arrived;
  const f=moving?T.MathUtils.clamp((Date.now()-trip.start)/(trip.due-trip.start),0,1):0;
  cart.position.set(moving?7.9-16*f:7.9,.09+(moving?.023*Math.abs(Math.sin(t*5)):0),2.35);cart.rotation.y=-Math.PI/2;
  cartHorse.legs.forEach((leg,j)=>leg.rotation.x=.25*Math.sin(t*5+(j===0||j===3?0:Math.PI)));
  for(const [id,herd] of Object.entries(animals))herd.forEach((a,i)=>{
   if(!a.root.visible)return;
   const horse=id==='horse',phase=t*(horse?.075:.052)+i*2.09;
   const x=(horse?-5.5:-10.6)+Math.sin(phase)*(horse?10.2:8.4);
   const z=-1.65+Math.sin(phase*2+(horse?.5:1.3))*2.2;
   a.root.position.set(x,.09,z);
   a.root.rotation.y=Math.atan2((horse?10.2:8.4)*Math.cos(phase),4.4*Math.cos(phase*2+(horse?.5:1.3)));
   a.head.rotation.x=.10*Math.sin(t*1.7+i)+(id==='cow'?.20:0);
   a.legs.forEach((leg,j)=>leg.rotation.x=.21*Math.sin(t*3.3+i+(j===0||j===3?0:Math.PI)));
  });
 }
 return {root,farms,sync,animate};
}
