'use strict';
const T=THREE, canvas=document.querySelector('canvas'), renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
const scene=new T.Scene(), camera=new T.OrthographicCamera(), world=new T.Group();
scene.add(world);camera.position.set(10.65,16,25);camera.lookAt(2.65,0.5,0);
scene.add(new T.HemisphereLight(0xfffbf5,0xc1c4ad,1.94));
const sun=new T.DirectionalLight(0xfff1dd,1.74);sun.position.set(-10,18,8);sun.castShadow=true;Object.assign(sun.shadow.camera,{left:-17,right:17,top:17,bottom:-17,far:60});sun.shadow.mapSize.set(2048,2048);sun.shadow.normalBias=.025;scene.add(sun);
// A small bevel catches light on the timber, tiles and joinery.
const cube=new T.BoxGeometry(1,1,1,6,6,6);
const boxVerts=cube.attributes.position,boxNormals=cube.attributes.normal;
for(let i=0;i<boxVerts.count;i++){
  const p=new T.Vector3().fromBufferAttribute(boxVerts,i);
  const core=p.clone().clampScalar(-.41,.41),n=p.sub(core).normalize();
  core.addScaledVector(n,.09);boxVerts.setXYZ(i,core.x,core.y,core.z);boxNormals.setXYZ(i,n.x,n.y,n.z);
}
const ball=new T.SphereGeometry(1,28,19), rock=new T.IcosahedronGeometry(1,0), pole=new T.CylinderGeometry(.48,.52,1,24),cone=new T.ConeGeometry(1,1,32), mats=new Map();
function part(parent,geo,color,x,y,z,w,h,d){if(!mats.has(color))mats.set(color,new T.MeshStandardMaterial({color,roughness:1}));const m=new T.Mesh(geo,mats.get(color));m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=m.receiveShadow=true;parent.add(m);return m}
function group(x,y,z,p=world){const g=new T.Group();g.position.set(x,y,z);p.add(g);return g}
const box=(...a)=>part(a[0],cube,...a.slice(1)),oval=(...a)=>part(a[0],ball,...a.slice(1));
let seed=72;function rand(){seed=seed*16807%2147483647;return seed/2147483647}
function canvasMap(n,paint){
  const c=document.createElement('canvas');c.width=c.height=n;
  paint(c.getContext('2d'),n);
  const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;
  tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return tex;
}
function meadowSlab(width,depth,radius,thickness,color,y){
  const w=width/2,d=depth/2,r=radius,s=new T.Shape();
  s.moveTo(-w+r,-d);s.lineTo(w-r,-d);s.quadraticCurveTo(w,-d,w,-d+r);
  s.lineTo(w,d-r);s.quadraticCurveTo(w,d,w-r,d);s.lineTo(-w+r,d);
  s.quadraticCurveTo(-w,d,-w,d-r);s.lineTo(-w,-d+r);s.quadraticCurveTo(-w,-d,-w+r,-d);
  const geo=new T.ExtrudeGeometry(s,{depth:thickness,bevelEnabled:true,bevelSegments:4,bevelThickness:.07,bevelSize:.075,curveSegments:12});
  geo.rotateX(-Math.PI/2);
  const uv=geo.attributes.uv,v=geo.attributes.position;
  for(let i=0;i<uv.count;i++)uv.setXY(i,v.getX(i)/width+.5,v.getZ(i)/depth+.5);
  return part(world,geo,color,0,y,0,1,1,1);
}
meadowSlab(18.1,11.85,.55,.95,0xc79870,-1.1);
meadowSlab(18.23,11.96,.58,.12,0xb6a26e,-.27);
const meadow=meadowSlab(18.31,12.03,.6,.15,0xffffff,-.16);
meadow.material=mats.get(0xffffff).clone();
meadow.material.map=canvasMap(1024,(ctx,n)=>{
  ctx.fillStyle='#a5bf80';ctx.fillRect(0,0,n,n);
  for(let i=0;i<180;i++){
    const x=rand()*n,y=rand()*n,r=24+rand()*120,g=ctx.createRadialGradient(x,y,0,x,y,r);
    g.addColorStop(0,i%3?'rgba(99,153,102,.17)':'rgba(230,222,149,.44)');g.addColorStop(1,'rgba(174,193,134,0)');
    ctx.fillStyle=g;ctx.fillRect(x-r,y-r,2*r,2*r);
  }
  for(let i=0;i<18000;i++){ctx.fillStyle=i%2?'rgba(72,125,79,.09)':'rgba(249,241,173,.26)';ctx.fillRect(rand()*n,rand()*n,1.1,2.5)}
});
for(let i=0;i<80;i++){const x=rand()*17.3-8.65,y=-.4-rand()*.59;part(world,rock,i%3?0xd3ab83:0xb68c6e,x,y,5.93,.045+rand()*.12,.044,.042)}
const ground=new T.Mesh(new T.PlaneGeometry(200,200),new T.ShadowMaterial({opacity:.14}));ground.rotation.x=-Math.PI/2;ground.position.y=-1.18;scene.add(ground);ground.receiveShadow=true;
function fence(x,z,n,angle){
  const g=group(x,.07,z);g.rotation.y=angle;
  for(let i=0;i<=n;i++){
    const px=i*1.45;
    box(g,0xc39973,px,.54,0,.20,1.10,.21);
    box(g,0xdfb991,px,1.1,0,.25,.12,.25);
    for(const h of [.38,.78])oval(g,0x8d7765,px,h,.116,.032,.032,.015);
    box(g,0xe2c19b,px-.052,.46,.11,.013,.55,.009);
  }
  for(let i=0;i<n;i++)for(const h of [.38,.78]){
    box(g,0xe7c9a3,(i+.5)*1.45,h,-.035,1.46,.145,.12);
    box(g,0xcda782,(i+.62)*1.45,h-.022,.028,.49,.012,.01);
  }
}
fence(-8.72,-5.65,12,0);fence(-8.72,-5.65,7,-Math.PI/2);fence(8.68,-5.65,7,-Math.PI/2);fence(-8.72,5.65,3,0);fence(4.33,5.65,3,0);
const barn=group(-5.55,.06,-3.72);
box(barn,0xbb7261,0,.91,0,3,1.82,2.1);
const gable=new T.Shape();gable.moveTo(-1.5,0);gable.lineTo(0,1.1);gable.lineTo(1.5,0);gable.closePath();
part(barn,new T.ExtrudeGeometry(gable,{depth:2.1,bevelEnabled:false}),0xc9826d,0,1.82,-1.05,1,1,1);
for(let i=-6;i<=6;i++)box(barn,i%2?0xc6826c:0xcf8972,i*.235,.92,1.063,.224,1.79,.048);
for(let i=0;i<9;i++)box(barn,i%2?0xb97664:0xc1836a,1.508,.92,-.92+i*.23,.04,1.8,.217);
const tiles=[0x759495,0x698e91,0x819c99,0x74989a,0x678b8d];
for(const side of [-1,1]){
  const roof=group(side*.82,2.33,0,barn);roof.rotation.z=-side*.63;
  box(roof,0x516f73,0,0,0,2.1,.14,2.65);
  for(let row=0;row<5;row++)for(let col=0;col<7;col++){
    const shingle=box(roof,tiles[Math.floor(rand()*tiles.length)],side*(.84-row*.407),.09+row*.012,-1.12+col*.374,.47,.073,.368);
    shingle.rotation.z=-side*.045;
  }
  box(roof,0xf5ddad,0,-.008,1.34,2.17,.15,.09);
  box(barn,0xf4dbb4,side*1.44,.92,1.103,.12,1.84,.10);
  box(barn,0x80564d,side*.32,.73,1.13,.62,1.44,.09);
  for(let k=0;k<3;k++)box(barn,0x986652,side*(.1+k*.205),.73,1.18,.19,1.39,.035);
  const brace=box(barn,0xe6c79e,side*.31,.7,1.21,.083,1.4,.054);brace.rotation.z=side*.42;
  box(barn,0xfae6c2,side*.68,.75,1.17,.105,1.5,.10);
  oval(barn,0x5d5750,side*.10,.76,1.225,.04,.04,.022);
}
box(barn,0xf5dfb6,0,1.53,1.16,1.50,.14,.11);
oval(barn,0xf2d5a5,0,2.11,1.07,.265,.265,.055);oval(barn,0x587679,0,2.11,1.13,.20,.20,.025);
box(barn,0xf5deb3,0,2.11,1.16,.37,.034,.025);box(barn,0xf5deb3,0,2.11,1.16,.034,.37,.025);
box(barn,0xe6c394,1.54,1.05,0,.10,.79,.95);box(barn,0x658b87,1.60,1.05,0,.04,.63,.77);
box(barn,0xf2d7b3,1.63,1.05,0,.03,.66,.055);box(barn,0xf2d7b3,1.63,1.05,0,.03,.05,.78);
function branch(parent,start,end,r){
  const a=new T.Vector3(...start),b=new T.Vector3(...end),delta=b.clone().sub(a);
  const m=part(parent,pole,0xa58061,...a.clone().lerp(b,.5).toArray(),r,delta.length(),r);
  m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());
}
const canopy=new T.SphereGeometry(1,32,22),cp=canopy.attributes.position;
for(let i=0;i<cp.count;i++){
  const v=new T.Vector3().fromBufferAttribute(cp,i);
  v.multiplyScalar(1+.045*Math.sin(v.x*9+v.y*5)*Math.cos(v.z*8-v.y*5));cp.setXYZ(i,v.x,v.y,v.z);
}
canopy.computeVertexNormals();
for(const [x,z,h] of [[-7.9,-3,2.4],[-7.7,-4.9,3.25],[6.9,-4.9,3.35],[8,-3.25,2.55],[4.95,-5.05,2.4]]){
  const tree=group(x,.06,z),greens=[0x75a185,0x88ae85,0x9aba89,0xabc58e];
  part(tree,pole,0xab8667,0,h*.28,0,.32,h*.56,.34);
  for(let i=0;i<6;i++){
    const a=i*2.4,dx=Math.cos(a)*h*.17,dz=Math.sin(a)*h*.17,dy=h*(.58+.04*(i%3));
    branch(tree,[0,h*.32,0],[dx,dy,dz],.15);
    part(tree,canopy,greens[i%4],dx,dy,dz,h*.228,h*.228,h*.23);
  }
  part(tree,canopy,0xabc796,-.07,h*.86,0,h*.24,h*.24,h*.25);
}
const hayCore=new T.CylinderGeometry(.49,.49,1,36),hayRing=new T.TorusGeometry(.49,.024,6,48);
for(const [x,z] of [[-3.5,-3.9],[-2.6,-4.55],[7.7,3.9]]){
  const bale=group(x,.57,z);bale.rotation.y=rand()*.6;
  part(bale,hayCore,0xe9c57c,0,0,0,1,1,.96).rotation.z=Math.PI/2;
  for(const side of [-1,1]){
    part(bale,hayRing,0xae935d,side*.31,0,0,1,1,1).rotation.y=Math.PI/2;
    for(let i=1;i<=4;i++)part(bale,hayRing,0xd5af6e,side*.508,0,0,i*.205,i*.205,i*.205).rotation.y=Math.PI/2;
  }
}
const bladeGeo=new T.ConeGeometry(1,1,5),petalGeo=new T.SphereGeometry(1,10,7);
for(let i=0;i<300;i++){
  const x=rand()*17.6-8.8,z=rand()*11.45-5.72;
  for(let j=0;j<3;j++){
    const blade=part(world,bladeGeo,j===1?0x83a36c:0x96b176,x+j*.058,.14,z,.028,.14+rand()*.14,.024);blade.rotation.z=.54-j*.45;
  }
  if(i%7===0){
    const tone=[0xfff6d9,0xffdeb5,0xf3c4b8][i%3];
    for(let k=0;k<5;k++){const a=k*1.257;part(world,petalGeo,tone,x+.074*Math.cos(a),.188,z+.074*Math.sin(a),.071,.031,.065)}
    part(world,petalGeo,0xe9b45c,x,.208,z,.047,.035,.047);
  }
}
const shopSite=buildWoolShop();
// Instance fixed pieces in their parent's local space so movable buildings retain their transforms.
function batchScenery(root){
  root.updateWorldMatrix(true,true);
  const local=new T.Matrix4().copy(root.matrixWorld).invert();
  const batches=new Map(),result=new T.Group();
  root.traverse(o=>{
    if(!o.isMesh)return;
    const key=o.geometry.uuid+o.material.uuid;
    if(!batches.has(key))batches.set(key,[]);
    batches.get(key).push(o);
  });
  const matrix=new T.Matrix4();
  for(const pieces of batches.values()){
    const first=pieces[0],mesh=new T.InstancedMesh(first.geometry,first.material,pieces.length);
    pieces.forEach((piece,i)=>mesh.setMatrixAt(i,matrix.multiplyMatrices(local,piece.matrixWorld)));
    mesh.castShadow=mesh.receiveShadow=true;result.add(mesh);
  }
  return result;
}
scene.add(batchScenery(world));scene.remove(world);
const flock=[], effects=[];
const breeds=[
  {name:'奶油团团', wool:0xfff3de, collar:0x94b8a6},
  {name:'草莓花花', wool:0xf49bb0, collar:0xc87883},
  {name:'薄荷芽芽', wool:0x9dd7bf, collar:0x709e86},
  {name:'焦糖卷卷', wool:0xe6ad70, collar:0xb77d59},
  {name:'晚安星星', wool:0xb7a5e0, collar:0x9a85bc},
  {name:'潮汐珍珠羊', wool:0x8fcfdf, collar:0x628fa9},
  {name:'桃霞羽羊', wool:0xf3b6a5, collar:0xb47d85},
  {name:'日冕金绒羊', wool:0xf2cd73, collar:0x997746}
];
let merges=0,drag=null,target=null,join=null,time=0;
const pastureAnimalScale=.85;
function size(s){return pastureAnimalScale*(1.13+.105*s.level)}
function woolYield(level){return 2**(level+1)-1}
function compatible(a,b){return a!==b && a.level===b.level && a.level<breeds.length-1}

// One continuous fleece, gently scalloped around overlapping tufts.
const fleece=new T.SphereGeometry(1,96,64);
const bumps=Array.from({length:48},(_,i)=>{
  const y=1-(i+.5)*2/48, r=Math.sqrt(1-y*y), a=i*2.39996;
  return new T.Vector3(r*Math.cos(a),y,r*Math.sin(a));
});
const positions=fleece.attributes.position;
for(let i=0;i<positions.count;i++){
  const v=new T.Vector3().fromBufferAttribute(positions,i);
  let relief=0;
  for(const b of bumps) relief+=Math.exp((v.dot(b)-1)*37);
  v.multiplyScalar(.94+.155*relief+.008*Math.sin(27*v.x+5*v.z)*Math.cos(26*v.y));positions.setXYZ(i,v.x,v.y,v.z);
}
fleece.computeVertexNormals();
const fiberMap=canvasMap(256,(ctx,n)=>{
  ctx.fillStyle='#a0a0a0';ctx.fillRect(0,0,n,n);
  for(let i=0;i<11000;i++){
    const x=rand()*n,y=rand()*n;ctx.strokeStyle=i%2?'#bcbcbc':'#858585';ctx.lineWidth=.75;
    ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+2,y-2,x+3,y+1);ctx.stroke();
  }
});
fiberMap.colorSpace=T.NoColorSpace;fiberMap.wrapS= fiberMap.wrapT=T.RepeatWrapping;fiberMap.repeat.set(2,1.3);
const hornShape=new T.CatmullRomCurve3(Array.from({length:28},(_,i)=>{
  const a=i/27*5.2,r=.27-.15*i/27;
  return new T.Vector3(Math.cos(a)*r,Math.sin(a)*r,.006*i);
}));
const horn=new T.TubeGeometry(hornShape,34,.075,10,false);
const starShape=new T.Shape();
for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?.48:1;starShape[i?'lineTo':'moveTo'](Math.cos(a)*r,Math.sin(a)*r)}
starShape.closePath();
const star=new T.ExtrudeGeometry(starShape,{depth:.24,bevelEnabled:true,bevelThickness:.08,bevelSize:.06,bevelSegments:2});
const haloGeo=new T.RingGeometry(.91,.96,60);
const haloMat=new T.MeshBasicMaterial({color:0xfff4b8,side:T.DoubleSide,transparent:true,opacity:.92});
const sunWheel=new T.TorusGeometry(.47,.037,12,64);
function styleMantle(body,level){
  if(level===5){
    const fan=group(0,1.09,-.43,body);
    for(let i=-3;i<=3;i++){
      const rib=group(0,0,0,fan);
      rib.rotation.z=i*.235;
      oval(rib,Math.abs(i)%2?0xa6dbe2:0xbbe9e6,0,.34,0,.14,.39,.11);
      oval(rib,0xe1f7ea,0,.42,.092,.018,.22,.017);
    }
    oval(fan,0xfff5e7,0,.13,.14,.15,.15,.14);
  }
  if(level===6){
    for(const side of [-1,1]){
      const wing=group(side*.46,.96,-.10,body);
      wing.rotation.x=-.48;
      for(let i=0;i<4;i++){
        const feather=oval(wing,i%2?0xffe6cc:0xfff4db,side*(.24+i*.07),.18+i*.065,-.19+i*.10,.112,.34+i*.032,.10);
        feather.rotation.z=-side*(.88-i*.13);
      }
      oval(wing,0xe5a093,side*.12,.12,.08,.20,.18,.19);
    }
  }
}
function styleHead(head,level){
  if(level===1){
    for(let i=0;i<5;i++){const a=i*Math.PI*.4;const petal=oval(head,0xfff2db,-.34+.12*Math.cos(a),.38+.12*Math.sin(a),.29,.11,.077,.057);petal.rotation.z=a}
    oval(head,0xf3b542,-.34,.38,.34,.075,.075,.045);
  }
  if(level===2){
    for(const side of [-1,1]){const leaf=oval(head,side===1?0x629e64:0x82b676,side*.11,.56,.02,.099,.20,.055);leaf.rotation.z=-side*.65}
  }
  if(level===3){
    for(const side of [-1,1]){const g=group(side*.50,.22,-.03,head);g.rotation.y=side*.68;part(g,horn,0xb9804c,0,0,0,side,1,1)}
  }
  if(level===4){
    const hat=part(head,cone,0x7770ad,.09,.60,-.02,.35,.64,.33);hat.rotation.z=-.32;
    oval(head,0xdfd3f5,.02,.36,.015,.40,.095,.36);
    part(head,star,0xffcf6d,.20,.93,.02,.14,.14,.14);
    part(head,star,0xffdea0,.05,.55,.23,.086,.086,.08);
  }
  if(level===5){
    for(let i=-2;i<=2;i++)oval(head,0xfff2db,i*.145,.43-Math.abs(i)*.045,.24,.077,.075,.073);
  }
  if(level===7){
    const crown=group(0,.49,-.15,head);
    part(crown,sunWheel,0xd89b40,0,.19,0,1,1,1);
    for(let i=-4;i<=4;i++){
      const a=i*Math.PI/9, ray=group(Math.sin(a)*.48,.19+Math.cos(a)*.48,0,crown);
      ray.rotation.z=-a;
      part(ray,cone,i%2?0xe3ab52:0xffdf88,0,.096,0,.055,.21,.055);
    }
    for(const side of [-1,1]){
      const g=group(side*.52,.22,.01,head);g.rotation.y=side*.47;
      part(g,horn,0xca904d,0,0,0,side*1.22,1.22,1.2);
    }
    part(head,star,0xffecb5,0,.34,.54,.105,.105,.08);
  }
}
function spawn(x,z,level=0){
  const wool=breeds[level].wool,root=group(x,.07,z,scene),body=group(0,0,0,root);
  const head=group(0,.98,.48,body),legs=[];
  const coat=part(body,fleece,wool,0,.77,-.085,.69,.62,.77);
  coat.material.bumpMap=fiberMap;coat.material.bumpScale=.014;
  styleMantle(body,level);
  const collar=breeds[level].collar;
  oval(body,collar,0,.78,.38,.52,.095,.44);
  oval(body,0xe9bf71,0,.62,.77,.108,.116,.085);
  oval(body,0x966f4d,0,.585,.846,.056,.012,.012);
  oval(body,wool,0,.74,-.86,.18,.18,.18);
  const skin=0xffdec1, ink=0x453631;
  oval(head,wool,0,.07,.015,.60,.50,.44);
  oval(head,skin,0,-.002,.25,.503,.411,.355);
  for(const side of [-1,1]){
    const ear=group(side*.49,.16,.05,head);
    ear.rotation.z=-side*.32;
    oval(ear,skin,side*.14,0,0,.27,.13,.106);
    oval(ear,0xeeb2aa,side*.175,-.002,.077,.158,.069,.037);
    const eye=group(side*.205,.055,.567,head);eye.rotation.y=side*.24;
    const iris=oval(eye,ink,0,0,0,.061,.082,.036);iris.material.roughness=.28;
    oval(eye,0xa98668,.007,-.037,.028,.027,.017,.008);
    for(let i=0;i<3;i++)oval(head,0xe7a68b,side*(.27+i*.034),-.075+(i%2)*.025,.53-i*.018,.009,.008,.008);
    oval(eye,0xfffcf0,-.013,.029,.028,.016,.018,.009);
    const blush=oval(head,0xefaaa0,side*.33,-.046,.51,.089,.044,.026);blush.rotation.y=side*.42;
  }
  oval(head,0x8d685c,0,-.055,.609,.055,.032,.022);
  for(const side of [-1,1]){
    const smile=oval(head,0xb38570,side*.023,-.105,.595,.033,.009,.009);smile.rotation.z=side*.38;
  }
  for(const [cx,cy,cz,r] of [[-.26,.305,.31,.19],[.20,.345,.29,.20],[-.035,.365,.34,.22]]){
    oval(head,wool,cx,cy,cz,r,r*.85,r*.85);
  }
  styleHead(head,level);
  for(const x of [-.37,.37])for(const z of [-.37,.38]){
    const g=group(x,.45,z,body);oval(g,skin,0,-.17,0,.115,.20,.12);
    oval(g,0xb68e77,0,-.34,.015,.115,.095,.125);legs.push(g);
  }
  head.rotation.x=-.24;
  const halo=new T.Mesh(haloGeo,haloMat);halo.rotation.x=-Math.PI/2;halo.visible=false;scene.add(halo);
  const s={root,body,head,legs,level,halo,nextHarvest:performance.now()+woolPeriod,angle:(rand()-.4)*1.8,turn:0,step:rand()*6,timer:0,speed:0,bounce:0,lift:0};
  root.rotation.y=s.angle;root.scale.setScalar(size(s));flock.push(s);stats();return s;
}
const coinIcon='<img class="coin-icon" src="art/coin.png" alt="金币">';
function coinAmount(value){return '<span class="coin-amount">'+coinIcon+value+'</span>'}
const cloudCost=4, cloudLabel='买小羊 · '+coinAmount(cloudCost);let woolPeriod=5000;
let wool=6, cloudPulse=0, hintUntil=0;
const cloudButton=document.querySelector('#cloud'), price=document.querySelector('#price');
const cloud=group(1,5.1,-2.4,scene), cloudScreen=new T.Vector3();
// Blend overlapping ellipsoids into a single continuous cloud silhouette.
const clouds=[[0,0,0,1.06,.50,.62],[-.82,.04,-.03,.57,.41,.49],[-.37,.28,-.03,.61,.61,.56],[.39,.22,-.06,.63,.51,.57],[.87,-.02,0,.49,.36,.46]];
const cloudMesh=new T.SphereGeometry(1,100,64),cv=cloudMesh.attributes.position;
for(let i=0;i<cv.count;i++){
  const dir=new T.Vector3().fromBufferAttribute(cv,i);
  let lo=0,hi=1.7;
  for(let step=0;step<16;step++){
    const r=(lo+hi)/2;
    let distance=Infinity;
    for(const [x,y,z,w,h,d] of clouds){
      const sd=(Math.hypot((dir.x*r-x)/w,(dir.y*r-y)/h,(dir.z*r-z)/d)-1)*Math.min(w,h,d);
      const blend=Math.max(.115-Math.abs(distance-sd),0);
      distance=Math.min(distance,sd)-blend*blend/.46;
    }
    if(distance<0)lo=r;else hi=r;
  }
  cv.setXYZ(i,dir.x*lo,dir.y*lo,dir.z*lo);
}
cloudMesh.computeVertexNormals();
const puff=part(cloud,cloudMesh,0xfffefa,0,0,0,1,1,1);
puff.material.emissive.setHex(0xe4eaff);puff.material.emissiveIntensity=.16;
for(const side of [-1,1])oval(cloud,0x373c4a,side*.19,.04,.621,.036,.051,.026);
const woolDrops=[];
const looseFleece=new T.SphereGeometry(1,38,26);
const locks=[
  [-.53,-.11,.02,.50],[-.22,.32,.02,.54],[.25,.26,-.04,.51],[.55,-.08,0,.44],
  [-.14,-.16,.34,.52],[.32,-.10,.30,.42],[-.08,-.06,-.39,.52],[.39,-.1,-.26,.41]
];
// Smoothly join the irregular locks into a squat tuft with an uneven outline.
const tuftVerts=looseFleece.attributes.position;
for(let i=0;i<tuftVerts.count;i++){
  const v=new T.Vector3().fromBufferAttribute(tuftVerts,i);
  let low=0,high=1.4;
  for(let step=0;step<12;step++){
    const r=(low+high)/2;
    let sdf=Infinity;
    for(const [x,y,z,radius] of locks){
      const d=Math.hypot(v.x*r-x,v.y*r-y,v.z*r-z)-radius;
      const blend=Math.max(.13-Math.abs(sdf-d),0);
      sdf=Math.min(d,sdf)-blend*blend/.52;
    }
    if(sdf<0)low=r;else high=r;
  }
  v.multiplyScalar(low+.011*Math.sin(v.x*22+v.y*9)*Math.cos(v.z*15));
  tuftVerts.setXYZ(i,v.x,v.y,v.z);
}
looseFleece.computeVertexNormals();
const woolDropLimit=32;
function shedWool(source,amount,angle){
  const p=source.root.position;
  const x=T.MathUtils.clamp(p.x+Math.cos(angle)*1.32,-7.9,7.9);
  const z=T.MathUtils.clamp(p.z+Math.sin(angle)*1.13,-2.55,5.0);
  // Cluster a long unattended harvest into existing balls without losing its value.
  if(woolDrops.length>=woolDropLimit){
    const nearest=woolDrops.reduce((a,b)=>Math.hypot(a.root.position.x-x,a.root.position.z-z)<Math.hypot(b.root.position.x-x,b.root.position.z-z)?a:b);
    nearest.amount+=amount;return;
  }
  const root=group(p.x,.9,p.z,scene), tuft=group(0,0,0,root);
  const k=.85*(.42+Math.min(.16,Math.log2(amount)*.028));
  const fibers=part(tuft,looseFleece,0xfff6e7,0,0,0,k,k*.87,k);
  fibers.material.bumpMap=fiberMap;fibers.material.bumpScale=.015;
  tuft.rotation.y=angle;
  const sparkle=part(root,star,0xffe6a1,.30,.42,0,.072,.089,.04);
  sparkle.castShadow=false;
  woolDrops.push({root,tuft,sparkle,amount,x,z,startX:p.x,startZ:p.z,phase:0,groundY:.07+k*.57});
}
function updateHarvest(dt,now){
  for(const sheep of flock){
    if(now<sheep.nextHarvest)continue;
    const cycles=1+Math.floor((now-sheep.nextHarvest)/woolPeriod);
    sheep.nextHarvest+=cycles*woolPeriod;
    const amount=cycles*woolYield(sheep.level);
    const bundles=Math.min(sheep.level+1,4);
    const angle=rand()*Math.PI*2;
    for(let i=0;i<bundles;i++){
      const share=Math.floor(amount/bundles)+(i<amount%bundles?1:0);
      shedWool(sheep,share,angle+i*Math.PI*2/bundles);
    }
  }
  for(const drop of woolDrops){
    drop.phase+=dt;
    const t=Math.min(1,drop.phase/.72);
    drop.root.position.set(T.MathUtils.lerp(drop.startX,drop.x,t),drop.groundY+.58*(1-t)+.56*Math.sin(t*Math.PI),T.MathUtils.lerp(drop.startZ,drop.z,t));
    drop.tuft.rotation.z=.24*Math.sin(t*Math.PI*2)*(1-t);
    drop.sparkle.position.y=.47+.065*Math.sin(drop.phase*3.2);
  }
}
function pickWool(e){
  // Keep the loose tufts tappable even when the whole pasture fits on a phone.
  const margin=e.pointerType==='touch'?15:4;
  const pixels=innerHeight*camera.zoom/(camera.top-camera.bottom);
  let best=null,dist=Infinity;
  for(const d of woolDrops){
    if(d.phase<.72)continue;
    const v=d.root.position.clone().project(camera);
    const gap=Math.hypot((v.x+1)*innerWidth/2-e.clientX,(1-v.y)*innerHeight/2-e.clientY);
    if(gap<.37*pixels+margin&&gap<dist){best=d;dist=gap}
  }
  return best;
}
function collect(d,e){
  scene.remove(d.root);woolDrops.splice(woolDrops.indexOf(d),1);
  wool+=d.amount;updateWool();
  const badge=document.createElement('span');badge.className='harvest';badge.textContent='羊毛 +'+d.amount;
  badge.style.left=e.clientX+'px';badge.style.top=e.clientY+'px';document.body.append(badge);
  badge.addEventListener('animationend',()=>badge.remove(),{once:true});
}
function updateWool(){
  document.querySelector('#wool').textContent=wool;
}
function dropLamb(){
  price.innerHTML=cloudLabel;hintUntil=0;
  cloudPulse=1;
  const s=spawn(cloud.position.x,cloud.position.z);
  s.fall={elapsed:0,height:cloud.position.y-.5,startX:cloud.position.x,startZ:cloud.position.z,dx:(rand()-.5)*2.6,dz:.3+rand()*.95};
  s.root.position.y=s.fall.height;
  s.root.scale.setScalar(.45*size(s));
  s.angle=.28;s.turn=.28;s.timer=.55;
}

function updateCloud(dt,now){
  updateHarvest(dt,now);
  cloud.position.set(.95+Math.sin(time*.31)*1.5,5.22+.15*Math.sin(time*1.8),-2.45);
  cloudPulse=Math.max(0,cloudPulse-dt*2);
  const q=cloudPulse*.16*Math.cos((1-cloudPulse)*12);
  cloud.scale.set(1+q,1-q,1+q);
  cloudScreen.copy(cloud.position);cloudScreen.y+=.15;cloudScreen.project(camera);
  const pixels=innerHeight*camera.zoom/(camera.top-camera.bottom);
  cloudButton.style.left=(cloudScreen.x+1)*innerWidth/2+'px';
  cloudButton.style.top=(1-cloudScreen.y)*innerHeight/2+'px';
  cloudButton.style.width=Math.max(48,2.8*pixels)+'px';
  cloudButton.style.height=Math.max(32,1.34*pixels)+'px';
  if(hintUntil && time>=hintUntil){price.innerHTML=cloudLabel;hintUntil=0}
}
function fall(s,dt){
  const f=s.fall;
  f.elapsed+=dt;
  const t=Math.min(1,f.elapsed/.78);
  s.root.position.set(f.startX+f.dx*t,.07+(f.height-.07)*(1-t*t),f.startZ+f.dz*t);
  const k=size(s)*(.45+.55*t);
  s.root.scale.set(k*(1-.12*t),k*(1+.20*t),k);
  if(t===1){s.fall=null;s.bounce=1.15}
}
function stats(){document.querySelector('#count').textContent=flock.length;document.querySelector('#merges').textContent=merges}
const ring=new T.Mesh(new T.RingGeometry(.78,.85,48),new T.MeshBasicMaterial({color:0xffee83,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;scene.add(ring);ring.visible=false;
function remove(s){scene.remove(s.root,s.halo);flock.splice(flock.indexOf(s),1)}
function reset(){for(const d of woolDrops)scene.remove(d.root);woolDrops.length=0;document.querySelectorAll('.harvest').forEach(el=>el.remove());wool=6;updateWool();cloudPulse=hintUntil=0;price.innerHTML=cloudLabel;drag=target=join=null;ring.visible=false;canvas.style.cursor='';for(const s of [...flock])remove(s);effects.forEach(p=>scene.remove(p.m));effects.length=0;document.querySelector('#note').style.opacity=0;merges=0;for(const [x,z,level] of [[-5,1,0],[-2.7,-1.35,1],[.25,-2.7,0],[3.7,-1.7,2],[6,1,1],[-2.6,3.45,2],[.65,1.4,0],[3.5,3.7,0]])spawn(x,z,level)}
document.querySelector('#reset').onclick=reset;
const ray=new T.Raycaster(),pointer=new T.Vector2(),floor=new T.Plane(new T.Vector3(0,1,0),-.07);
function aim(e){ray.layers.mask=camera.layers.mask;pointer.set(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2);ray.setFromCamera(pointer,camera)}
function pick(exclude){const choices=flock.filter(s=>s!==exclude&&!s.fall);const hits=ray.intersectObjects(choices.map(s=>s.body),true);if(hits.length){let o=hits[0].object;while(o.parent!==scene)o=o.parent;return choices.find(s=>s.root===o)}return null}
function place(e){aim(e);const p=ray.ray.intersectPlane(floor,new T.Vector3());const s=drag.s;s.root.position.x=T.MathUtils.clamp(p.x+drag.dx,-7.6,7.6);s.root.position.z=T.MathUtils.clamp(p.z+drag.dz,-2.65,4.65);target=pick(s)||flock.filter(t=>t!==s&&!t.fall).sort((a,b)=>a.root.position.distanceToSquared(s.root.position)-b.root.position.distanceToSquared(s.root.position))[0];if(target&&Math.hypot(target.root.position.x-s.root.position.x,target.root.position.z-s.root.position.z)>(size(s)+size(target))*.59&&!pick(s))target=null;ring.visible=!!target&&compatible(s,target);if(ring.visible){ring.position.copy(target.root.position);ring.position.y=.095;ring.scale.setScalar(size(target)*1.14)}}
canvas.onpointerdown=e=>{if(drag)return;const d=pickWool(e);if(d){collect(d,e);return}if(join)return;aim(e);const s=pick();if(!s)return;let p=ray.ray.intersectPlane(floor,new T.Vector3());drag={s,id:e.pointerId,dx:s.root.position.x-p.x,dz:s.root.position.z-p.z,origin:s.root.position.clone()};canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing'};
canvas.onpointermove=e=>{if(drag){if(drag.id===e.pointerId)place(e)}else{aim(e);canvas.style.cursor=pickWool(e)?'pointer':pick()?'grab':'default'}};
function release(e,cancel){if(!drag||e.pointerId!==drag.id)return;const s=drag.s;if(!cancel){place(e);if(target&&compatible(s,target))join={a:s,b:target,start:s.root.position.clone(),t:0};
else if(target){showNote(target,s.level===target.level?'已经是最终形态啦':'要找同款小羊哦');s.root.position.copy(drag.origin)}}s.bounce=.55;drag=target=null;ring.visible=false;canvas.style.cursor='default';if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId)}
canvas.onpointerup=e=>release(e,false);canvas.onpointercancel=e=>release(e,true);
function fuse(a,b){const p=b.root.position.clone(),level=a.level+1;remove(a);remove(b);merges++;const s=spawn(p.x,p.z,level);s.angle=.24;s.turn=.24;s.timer=1.1;s.bounce=1.15;
for(let i=0;i<15;i++){let an=rand()*Math.PI*2;let m=part(scene,i%2?rock:ball,i%3?0xffdc7d:0xfff6e8,p.x,1.1,p.z,.105,.105,.105);effects.push({m,v:new T.Vector3(Math.cos(an)*2,1+rand()*2.8,Math.sin(an)*2),t:0})}
showNote(s,'第 '+(s.level+1)+' 阶 · '+breeds[s.level].name+' · 每轮 '+woolYield(s.level)+' 毛')}
function showNote(s,message){const n=document.querySelector('#note'),p=s.root.position,v=new T.Vector3(p.x,1.94*size(s),p.z).project(camera);n.textContent=message;n.style.left=(v.x+1)*innerWidth/2+'px';n.style.top=(1-v.y)*innerHeight/2+'px';n.style.opacity=1;n.dataset.until=time+1.6}
function resize(){let aspect=innerWidth/innerHeight,h=Math.max(17,28.2/aspect);Object.assign(camera,{left:-h*aspect/2,right:h*aspect/2,top:h/2,bottom:-h/2,near:.1,far:100});camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight,false)}
window.addEventListener('resize',resize);resize();reset();let prev=performance.now();
let updateSceneView=null;
function frame(now){requestAnimationFrame(frame);let dt=Math.min(.05,(now-prev)/1000);prev=now;time+=dt;if(updateSceneView)updateSceneView(now);updateCloud(dt,now);
for(const s of flock){if(s.fall){fall(s,dt);continue}const held=drag?.s===s,joining=join&&(join.a===s||join.b===s);let walk=0;if(!held&&!joining&&target!==s){s.timer-=dt;if(s.timer<=0){s.turn=s.angle+(rand()-.5)*2.3;s.speed=rand()<.23?0:.35+rand()*.38;s.timer=1.1+rand()*3.4}
const p=s.root.position,nx=p.x+Math.sin(s.angle)*s.speed*dt,nz=p.z+Math.cos(s.angle)*s.speed*dt;
if((nx<-7.4&&nx<p.x)||(nx>7.4&&nx>p.x)||(nz<-2.7&&nz<p.z)||(nz>4.55&&nz>p.z)){s.turn=Math.atan2(-p.x,-p.z);s.timer=1.8}else{p.x=nx;p.z=nz;walk=s.speed}
s.angle+=Math.atan2(Math.sin(s.turn-s.angle),Math.cos(s.turn-s.angle))*Math.min(1,dt*2.9)}
s.root.rotation.y=s.angle;s.step+=dt*(walk?6:2);s.legs.forEach((g,i)=>g.rotation.x=walk*Math.sin(s.step+(i===0||i===3?0:Math.PI))*.68);
s.lift+=((held?.95:0)-s.lift)*Math.min(1,dt*13);s.root.position.y=.07+s.lift+Math.abs(Math.sin(s.step))*walk*.12;
s.bounce=Math.max(0,s.bounce-dt*1.12);const q=s.bounce*.3*Math.cos((1.15-s.bounce)*19),k=size(s);s.root.scale.set(k*(1+q-held*.07),k*(1-q+held*.12),k*(1+q));s.head.rotation.x=-.24+Math.sin(s.step*.8)*.055; s.halo.visible=!!drag&&compatible(drag.s,s)&&s!==target;if(s.halo.visible){s.halo.position.set(s.root.position.x,.085,s.root.position.z);s.halo.scale.setScalar(k)}}
if(join){const j=join;j.t+=dt;const t=Math.min(1,j.t/.25);j.a.root.position.lerpVectors(j.start,j.b.root.position,t*t);j.a.root.scale.multiplyScalar(1-.45*t);j.b.body.scale.set(1+.19*t,1-.21*t,1+.14*t);if(t===1){join=null;fuse(j.a,j.b)}}
for(let i=effects.length-1;i>=0;i--){const p=effects[i];p.t+=dt;p.v.y-=dt*8;p.m.position.addScaledVector(p.v,dt);p.m.scale.setScalar(.1*Math.max(0,1-p.t/.7));if(p.t>.7){scene.remove(p.m);effects.splice(i,1)}}
const note=document.querySelector('#note');if(time>Number(note.dataset.until))note.style.opacity=0;renderer.render(scene,camera)}
requestAnimationFrame(frame);
