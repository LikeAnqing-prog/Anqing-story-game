'use strict';
const displayTiers=[
  {name:'礼盒柜',value:100,goods:{
    bunnyGift:{name:'绒兔礼盒',wool:48,seconds:14,price:100},
    winterGift:{name:'冬日暖手礼盒',wool:64,seconds:18,price:120}
  }},
  {name:'织艺柜',value:400,goods:{
    toyTheatre:{name:'森林玩偶剧场',wool:192,seconds:22,price:400},
    wallHanging:{name:'山野织锦挂毯',wool:256,seconds:26,price:480}
  }},
  {name:'典藏柜',value:1600,goods:{
    festivalFloat:{name:'庆典绒羊花车',wool:768,seconds:32,price:1600},
    starTent:{name:'星夜羊毛帐篷',wool:1024,seconds:36,price:1920}
  }}
];
function makeDisplayProduct(id){
  const g=new THREE.Group(),cream=0xffe5b8,teal=0x75a79a,rose=0xc47e83,honey=0xd8af67;
  function toy(type,x,y,z,scale){
    const m=makeProduct(type);m.position.set(x,y,z);m.scale.setScalar(scale);g.add(m);
  }
  if(id==='bunnyGift'||id==='winterGift'){
    const rabbit=id==='bunnyGift',color=rabbit?rose:teal;
    box(g,color,0,.21,0,1.05,.42,.72);
    box(g,cream,0,.42,0,1.09,.06,.75);
    box(g,honey,0,.21,.368,.12,.42,.024);
    const lid=group(0,.69,-.29,g);lid.rotation.x=-.26;
    box(lid,color,0,0,0,1.06,.61,.07);box(lid,cream,0,0,.046,.13,.60,.014);
    toy(rabbit?'rabbit':'mitten',0,.40,.07,.66);
  }else if(id==='toyTheatre'){
    box(g,honey,0,.12,0,1.55,.24,.75);box(g,teal,0,.62,-.3,1.48,1,.08);
    for(const side of [-1,1]){
      box(g,rose,side*.64,.66,.13,.23,.98,.19);
      oval(g,cream,side*.64,.55,.22,.13,.04,.04);
    }
    box(g,honey,0,1.16,.1,1.58,.16,.26);
    toy('rabbit',-.25,.23,.06,.58);toy('lamb',.23,.23,.08,.61);
  }else if(id==='wallHanging'){
    box(g,honey,0,1.29,0,1.46,.075,.10);box(g,teal,0,.75,.01,1.19,.99,.07);
    oval(g,honey,.31,.99,.061,.12,.12,.017);
    for(const [x,y,w,color] of [[-.22,.57,.41,0x527c71],[.22,.52,.34,0x9abb8f]]){
      const ridge=box(g,color,x,y,.062,w,.33,.03);ridge.rotation.z=.57;
    }
    for(let i=-4;i<=4;i++)box(g,cream,i*.132,.22,.02,.066,.16,.055);
  }else if(id==='festivalFloat'){
    box(g,teal,0,.36,0,1.49,.29,.79);box(g,cream,0,.51,0,1.54,.07,.82);
    for(const x of [-.48,.48])for(const z of [-.34,.34])oval(g,honey,x,.21,z,.20,.20,.10);
    toy('lamb',0,.54,0,.85);
    for(const x of [-.62,.62]){
      box(g,honey,x,.94,-.22,.035,.91,.035);box(g,rose,x+.105,1.31,-.22,.22,.15,.026);
    }
  }else{
    for(const side of [-1,1]){
      const roof=box(g,side===1?teal:0x668999,side*.33,.66,0,.10,1.48,1.10);roof.rotation.z=side*.50;
      const trim=box(g,cream,side*.33,.66,.56,.065,1.48,.055);trim.rotation.z=side*.50;
    }
    box(g,rose,0,.07,0,1.38,.10,1.16);oval(g,honey,0,1.33,.55,.09,.09,.065);
    toy('lamb',0,.12,.19,.46);
    for(let i=0;i<3;i++)oval(g,cream,.19+i*.12,.99-i*.22,.04+i%2*.26,.045,.049,.045);
  }
  return g;
}
function makeVisitor(kind){
  const person=new THREE.Group();
  const rabbit=kind==='post',mouse=kind==='granny',bear=kind==='inn';
  const fur=rabbit?0xffefdb:mouse?0xaf9caa:bear?0xba8c68:0xd99467;
  const coat=rabbit?0x76969a:mouse?0xbb8993:bear?0x869a74:0xcfac6d;
  oval(person,coat,0,.40,0,.33,.33,.26);
  oval(person,fur,0,.84,.025,.36,.325,.30);
  for(const s of [-1,1]){
    const ear=oval(person,fur,s*(rabbit?.16:.275),rabbit?1.25:1.075,0,rabbit?.084:.139,rabbit?.258:.142,.075);
    ear.rotation.z=-s*.17;
    oval(person,0xe6afa1,ear.position.x,ear.position.y,.049,rabbit?.044:.082,rabbit?.18:.087,.041).rotation.z=ear.rotation.z;
    oval(person,0x423b39,s*.124,.87,.302,.028,.038,.017).name='eye'+s;
    oval(person,0xffead4,s*.085,.762,.289,.105,.081,.047);
    const arm=oval(person,fur,s*.29,.42,.07,.09,.17,.092);arm.rotation.z=s*.25;arm.name='arm'+s;
    oval(person,0x816c5e,s*.143,.09,.055,.112,.089,.145);
  }
  oval(person,0x634b46,0,.79,.35,.048,.03,.023);
  if(rabbit){oval(person,0x607e80,0,1.08,.17,.27,.087,.21);box(person,0xb18563,.22,.35,.22,.24,.21,.11)}
  if(mouse){for(const s of [-1,1])part(person,new THREE.TorusGeometry(.084,.012,7,22),0x916d51,s*.12,.86,.32,1,1,1);oval(person,0xffdec8,0,.51,.24,.10,.062,.03)}
  if(bear){box(person,0xffecd2,0,.35,.23,.32,.33,.033);oval(person,0xf4dfbd,0,1.13,.02,.25,.115,.21)}
  if(kind==='guest'){oval(person,0x7e9270,0,1.10,0,.40,.054,.26);oval(person,0x9dab83,0,1.16,0,.25,.13,.21)}
  return person;
}
function makeProduct(id){
  if(displayTiers.some(t=>Object.hasOwn(t.goods,id)))return makeDisplayProduct(id);
  const g=new THREE.Group();
  if(id==='rabbit'||id==='lamb'){
    const lamb=id==='lamb',plush=lamb?0xffe9ca:0xe5b9a6;
    oval(g,plush,0,.42,0,.325,.34,.25);
    oval(g,lamb?0xae8573:plush,0,.83,.025,.34,.285,.27);
    for(const side of [-1,1]){
      const ear=oval(g,plush,side*(lamb?.32:.15),lamb?.89:1.15,.04,lamb?.17:.085,lamb?.075:.215,.076);ear.rotation.z=side*(lamb?-.3:-.16);
      oval(g,0x423732,side*.12,.85,.276,.028,.036,.018);
      oval(g,plush,side*.19,.16,.08,.13,.11,.16);
      oval(g,plush,side*.27,.46,.075,.11,.16,.10);
    }
    oval(g,0x714f47,0,.77,.30,.04,.03,.022);
    if(lamb){
      for(let i=0;i<7;i++){const a=i*.90;oval(g,plush,.25*Math.cos(a),1.00,.17*Math.sin(a),.14,.13,.13)}
    }else{
      part(g,new THREE.TorusGeometry(.086,.018,8,28),0xb3874e,0,1.18,0,1,1,1);
      oval(g,0x8ea99b,0,.59,.20,.23,.049,.09);
    }
  }else if(id==='glove'||id==='mitten'){
    const hue=id==='glove'?0x9bbeb1:0xbe8491;
    for(const s of [-1,1]){
      const hand=group(s*.22,.60,0,g);hand.rotation.z=-s*.23;
      oval(hand,hue,0,0,0,.18,.31,.13);
      oval(hand,hue,-s*.155,-.02,.025,.091,.15,.09).rotation.z=-s*.37;
      box(hand,0xf7e2bc,0,-.24,0,.33,.12,.24);
      for(let i=-1;i<=1;i++)oval(hand,0xffecd4,i*.076,.05,.123,.023,.045,.012);
    }
  }else if(id==='socks'){
    for(const s of [-1,1]){
      box(g,0x91aabc,s*.20,.55,0,.26,.43,.22);
      oval(g,0x91aabc,s*.20,.34,.075,.145,.13,.21);
      box(g,0xf6dfb0,s*.20,.76,0,.27,.10,.23);
    }
  }else{
    for(let i=0;i<3;i++)box(g,i===1?0xe1bfa5:0xd39479,0,.32+i*.115,0,.88,.145,.61);
    for(let i=-2;i<=2;i++)box(g,0xffe5be,i*.13,.627,0,.031,.013,.59);
    for(const s of [-1,1])box(g,0xeac79a,0,.635,s*.155,.87,.013,.036);
  }
  return g;
}
function makeCraftTable(){
  const table=new T.Group();
  for(const x of [-.58,.58])for(const z of [-.31,.31])box(table,0x966849,x,.33,z,.105,.66,.12);
  box(table,0xb5835b,0,.58,.01,1.42,.17,.85);
  box(table,0xcd9c70,0,.70,0,1.59,.13,1.04);
  for(const s of [-1,1]){
    box(table,0xb98560,s*.33,.565,.449,.62,.145,.064);
    oval(table,0xe6c381,s*.33,.564,.494,.047,.032,.032);
  }
  box(table,0x9b7051,0,.19,.22,1.26,.067,.49);
  for(let i=0;i<3;i++)box(table,[0x9fbab0,0xf3d6a5,0xc78f7c][i],-.36,.23+i*.046,.23,.32,.042,.29);
  box(table,0x89b09b,0,.78,.095,.82,.026,.56);
  for(let i=-3;i<=3;i++)box(table,0xb9d0b5,i*.096,.797,.095,.004,.003,.49);
  for(let i=-2;i<=2;i++)box(table,0xb9d0b5,0,.797,.095+i*.095,.74,.003,.004);
  for(let i=0;i<3;i++){
    const x=.54-i*.115,z=-.32+(i%2)*.14,h=.13+i*.024;
    part(table,pole,0xd5ae7a,x,.772,z,.108,.018,.108);
    part(table,pole,[0xca887c,0xe8c480,0x87a993][i],x,.782+h/2,z,.092,h,.092);
    part(table,pole,0xe2c497,x,.79+h,z,.109,.018,.109);
  }
  const cup=group(-.60,.77,-.27,table);
  part(cup,pole,0xa7bab0,0,.092,0,.155,.18,.155);
  for(let j=0;j<3;j++){const rod=part(cup,pole,0xb38963,(j-1)*.024,.20,0,.014,.28,.014);rod.rotation.z=(j-1)*.18}
  const scissors=group(.58,.79,.22,table);scissors.rotation.y=-.44;
  for(const side of [-1,1]){
    const loop=part(scissors,new T.TorusGeometry(.044,.009,6,20),0xaf795c,side*.045,0,.058,1,1,1);loop.rotation.x=Math.PI/2;
    const blade=box(scissors,0x98a6a3,-side*.014,0,-.045,.018,.013,.17);blade.rotation.y=side*.22;
  }
  return table;
}
function buildWoolShop(){
  const {x,z}=woolShopSite,shop=group(x,0,z,scene);
  shop.scale.setScalar(1.32);
  box(shop,0xf3dfb7,0,1.02,-.93,3.95,2.04,2.45);
  for(const side of [-1,1]){
    const roof=group(side*1.05,2.43,-.93,shop);roof.rotation.z=-side*.38;
    box(roof,0xa6604d,0,0,0,2.40,.17,2.9);
    for(let i=0;i<4;i++)for(let j=0;j<7;j++)
      box(roof,(j+i)%3?0xc17b63:0xca896c,side*(.89-i*.57),.11+i*.013,-1.18+j*.393,.63,.065,.38);
    box(shop,0x906851,side*1.90,1.05,.30,.14,2.1,.14);
  }
  const face=new T.Shape();face.moveTo(-2,0);face.lineTo(0,.79);face.lineTo(2,0);face.closePath();
  part(shop,new T.ExtrudeGeometry(face,{depth:2.48,bevelEnabled:false}),0xf2d8ac,0,2.04,-2.17,1,1,1);
  box(shop,0x946e54,0,1.14,.305,3.45,1.17,.12);
  box(shop,0x647d72,0,1.15,.376,3.23,.98,.04);
  box(shop,0xc3956e,0,.62,.64,3.75,.15,.80);
  const facade=batchScenery(shop);shop.clear();shop.add(facade);
  const awning=group(0,0,0,shop);
  for(let i=0;i<9;i++){
    const a=box(awning,i%2?0xf5e7be:0x709b8a,(i-4)*.422,1.89,.73,.43,.085,1.02);a.rotation.x=.24;
    box(awning,i%2?0xf5e7be:0x709b8a,(i-4)*.422,1.73,1.21,.43,.23,.10);
  }
  const stripes=batchScenery(awning);awning.clear();awning.add(stripes);
  const starterGoods=group(0,0,0,shop);
  for(let i=0;i<5;i++)oval(starterGoods,[0xe2bf8c,0xffdfb7,0xbcccaf][i%3],-1.30+i*.26,.80,.66,.17,.14,.15);
  box(starterGoods,0xb9966f,1.17,.80,.66,.55,.22,.35);
  const table=makeCraftTable();scene.add(table);table.position.set(x+2.55,0,z+1.68);
  streetModel(shop);streetModel(table);
  const guests=new THREE.Group();scene.add(guests);
  const cabinet=group(0,.695,1.03,shop);
  return {x,z,guests,table,cabinet,building:shop,starterGoods,awning};
}
