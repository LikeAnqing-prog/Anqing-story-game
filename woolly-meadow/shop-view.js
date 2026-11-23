'use strict';
function installShopView({town,door,portraits,openGuest,openBench,openDisplay,leaveGuest,order,animatePeople,pigFarm,machine,collectorInfo,openBarn,openLand,landUnlocked}){
  scene.add(sun.target);
  const home=new T.Vector3(0,.5,0),homeOffset=new T.Vector3(8,15.5,25);
  const homeAim=home.clone(),aimPoint=home.clone(),offset=homeOffset.clone();
  let homeZoom=1,mode='ranches',kind=null,previousTime=performance.now(),lastMode='home',shopZoom=1;
  const clamp=T.MathUtils.clamp,scratch=new T.Vector3();
  const nav=document.createElement('div');nav.className='scene-nav';
  nav.innerHTML='<button type="button" data-minus aria-label="缩小">−</button><button type="button" data-plus aria-label="放大">＋</button><button type="button" data-home>全景</button>';
  document.body.append(nav);
  const bench=document.createElement('button');bench.id='benchSpot';bench.className='world-label';bench.textContent='工作台';document.body.append(bench);
  const barnBtn=document.createElement('button');barnBtn.id='barnTools';barnBtn.className='world-label';barnBtn.textContent='羊仓库';document.body.append(barnBtn);barnBtn.onclick=openBarn;
  const collectorBtn=document.createElement('button'),rateTip=document.createElement('div');
  collectorBtn.id='collectorHit';collectorBtn.className='person-hit';collectorBtn.hidden=true;collectorBtn.setAttribute('aria-label','查看毛团收集器速率');
  rateTip.className='collector-rate';rateTip.hidden=true;rateTip.setAttribute('role','status');
  document.body.append(collectorBtn,rateTip);
  let rateUntil=0;
  collectorBtn.onclick=()=>{rateTip.textContent=collectorInfo();rateUntil=performance.now()+3400;rateTip.hidden=false};
  const displayBtn=document.createElement('button');displayBtn.className='world-label';displayBtn.id='cabinetSpot';displayBtn.textContent='陈列柜 · 铺货扩建';displayBtn.onclick=openDisplay;document.body.append(displayBtn);
  const farmCenter=new T.Vector3(-6.9,.55,-4.0),farmOffset=new T.Vector3(2,21,26);
  const farmHeight=()=>Math.max(23,37/(innerWidth/innerHeight));
  aimPoint.copy(farmCenter);offset.copy(farmOffset);
  const landBtn=document.createElement('button');landBtn.id='landAccess';landBtn.className='world-label';landBtn.textContent='松露小猪牧场';document.body.append(landBtn);landBtn.onclick=pigView;
  const sheepBtn=document.createElement('button');sheepBtn.id='sheepAccess';sheepBtn.className='world-label';sheepBtn.textContent='绵绵羊场';document.body.append(sheepBtn);sheepBtn.onclick=overview;
  const townBtn=document.createElement('button');townBtn.id='townAccess';nav.append(townBtn);townBtn.onclick=street;
  function street(){
    leave();mode='town';town.show(true);shopZoom=1;
    aimPoint.copy(townCenter);offset.copy(townOffset);
    camera.zoom=(camera.top-camera.bottom)/Math.max(12.7,26.4/(innerWidth/innerHeight));
  }
  function ranches(){
    leave();town.show(false);mode='ranches';shopZoom=1;
    aimPoint.copy(farmCenter);offset.copy(farmOffset);camera.zoom=(camera.top-camera.bottom)/farmHeight();
  }
  function pigView(){town.show(false);leave();mode='pig';shopZoom=1}
  const actors=Object.entries(portraits).map(([id,model])=>{
    const btn=document.createElement('button');btn.className='person-hit';btn.dataset.guest=id;btn.setAttribute('aria-label',model.name+'的订单');
    document.body.append(btn);btn.onclick=()=>{if(!drag){lastMode=mode;mode='guest';kind=id;openGuest(id)}};
    return {btn,model};
  });
  function leave(){if(mode==='guest'){mode=lastMode;kind=null;leaveGuest()}}
  function overview(){if(mode==='town'){aimPoint.copy(home);offset.copy(homeOffset);camera.zoom=1}town.show(false);leave();mode='home';homeAim.copy(home);homeZoom=1;shopZoom=1}
  function store(){leave();mode='shop';shopZoom=1}
  door.onclick=()=>{if(!drag)store()};
  bench.onclick=()=>{if(mode!=='guest'&&!drag)openBench()};
  nav.querySelector('[data-home]').onclick=()=>mode==='ranches'&&!town.focus?overview():ranches();
  function zoomBy(factor,x=innerWidth/2,y=innerHeight/2){
    if(mode==='guest'||document.querySelector('dialog[open]'))return;
    if(mode==='shop'||mode==='pig'||mode==='town'||mode==='ranches'){shopZoom=clamp(shopZoom*factor,.75,1.9);return}
    const old=homeZoom;homeZoom=clamp(old*factor,1,3.5);
    const delta=new T.Vector3((x/innerWidth-.5)*(camera.right-camera.left),(.5-y/innerHeight)*(camera.top-camera.bottom),0);
    delta.applyQuaternion(camera.quaternion).multiplyScalar(1/old-1/homeZoom);
    homeAim.add(delta);if(homeZoom===1)homeAim.copy(home);
  }
  nav.querySelector('[data-minus]').onclick=()=>zoomBy(1/1.3);
  nav.querySelector('[data-plus]').onclick=()=>zoomBy(1.3);
  let wheelSwipe=0,lastWheel=0;
  document.addEventListener('wheel',e=>{
    if((mode==='shop'||mode==='guest')&&sceneSurface(e.target)&&Math.abs(e.deltaX)>Math.abs(e.deltaY)){
      e.preventDefault();
      const now=performance.now();
      if(now-lastWheel>220)wheelSwipe=0;
      lastWheel=now;wheelSwipe+=e.deltaX*(e.deltaMode===1?16:1);
      if(Math.abs(wheelSwipe)>65){street();wheelSwipe=0}
      return;
    }
    if(mode==='guest'||e.target.closest('dialog,.scene-nav'))return;
    e.preventDefault();zoomBy(Math.exp(-clamp(e.deltaY,-140,140)*.0025),e.clientX,e.clientY)
  },{passive:false});
  let pinch=0,pan=null,travel=null,swipe=null,skipClick=false;
  function sceneSurface(el){return el===canvas||!!el.closest('.person-hit,.world-label')}
  function endSwipe(commit){
    if(!swipe)return;
    const {id,progress,moved}=swipe;swipe=null;
    if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);
    canvas.style.cursor='';order.style.visibility='';
    if(commit&&moved){skipClick=true;if(progress>=.22){if(mode==='shop'||mode==='guest'||mode==='town'&&town.focus)street();else ranches()}}
  }
  document.addEventListener('pointerdown',e=>{
    skipClick=false;
    if((mode!=='shop'&&mode!=='guest'&&mode!=='town'&&mode!=='ranches')||pinch||!e.isPrimary||e.button!==0||!sceneSurface(e.target))return;
    swipe={id:e.pointerId,x:e.clientX,y:e.clientY,progress:0,moved:false};
  },true);
  document.addEventListener('pointermove',e=>{
    if(swipe?.id!==e.pointerId)return;
    const distance=Math.hypot(e.clientX-swipe.x,e.clientY-swipe.y);
    if(!swipe.moved&&distance<8)return;
    swipe.moved=true;swipe.progress=Math.min(1,distance/Math.min(innerWidth*.57,380));
    if(!canvas.hasPointerCapture(e.pointerId))canvas.setPointerCapture(e.pointerId);
    order.style.visibility='hidden';canvas.style.cursor='grabbing';e.stopImmediatePropagation();
  },true);
  document.addEventListener('pointerup',e=>{
    if(swipe?.id!==e.pointerId)return;
    const tapTable=!swipe.moved&&mode==='shop'&&e.target===canvas;
    endSwipe(true);
    if(tapTable){aim(e);if(ray.intersectObject(shopSite.table,true).length)openBench()}
  },true);
  document.addEventListener('pointercancel',e=>{if(swipe?.id===e.pointerId)endSwipe(false)},true);
  document.addEventListener('click',e=>{
    if(skipClick&&e.detail){skipClick=false;e.preventDefault();e.stopImmediatePropagation()}
  },true);
 function startTravel(e){
  pan=null;travel={id:e.pointerId,x:e.clientX,start:mode==='pig'?1:0,progress:mode==='pig'?1:0};
  canvas.setPointerCapture(e.pointerId);canvas.style.cursor='grabbing';
 }
 function stopTravel(commit){
  if(!travel)return;
  const {id,start,progress}=travel;travel=null;
  if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);
  canvas.style.cursor='';
  const next=commit&&Math.abs(progress-start)>.22?1-start:start;
  if(next===1)pigView();else overview();
 }
  const distance=touches=>Math.hypot(touches[0].clientX-touches[1].clientX,touches[0].clientY-touches[1].clientY);
  document.addEventListener('touchstart',e=>{
    if(e.touches.length!==2||document.querySelector('dialog[open]'))return;
    endSwipe(false);
    if(mode==='guest')return;
    if(drag)release({pointerId:drag.id},true);
    stopTravel(false);pigFarm.cancel();pan=null;pinch=distance(e.touches);e.preventDefault();
  },{passive:false,capture:true});
  document.addEventListener('touchmove',e=>{
    if(!pinch||e.touches.length!==2)return;
    const d=distance(e.touches);zoomBy(d/pinch,(e.touches[0].clientX+e.touches[1].clientX)/2,(e.touches[0].clientY+e.touches[1].clientY)/2);pinch=d;e.preventDefault();
  },{passive:false});
  document.addEventListener('touchend',()=>{pinch=0});document.addEventListener('touchcancel',()=>{pinch=0});
  canvas.addEventListener('pointerdown',e=>{
    if(mode==='guest'||mode==='shop'||mode==='town'||mode==='ranches'||pinch){e.stopImmediatePropagation();return}
    aim(e);
    if(mode==='pig'){
     e.stopImmediatePropagation();if(!pigFarm.start(e))startTravel(e);return;
    }
    if(mode==='home'&&!drag&&ray.intersectObject(barn,true).length){e.stopImmediatePropagation();openBarn();return}
    if(mode==='home'&&!drag&&!pick()&&!pickWool(e)){
     if(homeZoom<=1.01)startTravel(e);
     else{pan={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)}
     e.stopImmediatePropagation();
    }
  },true);
  canvas.addEventListener('pointermove',e=>{
    if(travel?.id===e.pointerId){
      travel.progress=clamp(travel.start+(e.clientX-travel.x)/Math.min(innerWidth*.72,620),0,1);
      return;
    }
    if(mode==='pig'&&pigFarm.move(e))return;
    if(!pan||e.pointerId!==pan.id)return;
    const units=(camera.top-camera.bottom)/(innerHeight*camera.zoom);
    scratch.set((pan.x-e.clientX)*units,(e.clientY-pan.y)*units,0).applyQuaternion(camera.quaternion);
    homeAim.add(scratch);homeAim.x=clamp(homeAim.x,-9,15);homeAim.y=clamp(homeAim.y,-2,6);homeAim.z=clamp(homeAim.z,-7,7);
    pan.x=e.clientX;pan.y=e.clientY;
  });
  canvas.addEventListener('pointerup',e=>{
    if(travel?.id===e.pointerId)stopTravel(true);
    else if(mode==='pig')pigFarm.finish(e);
    pan=null;
  });
  canvas.addEventListener('pointercancel',()=>{stopTravel(false);pigFarm.cancel();pan=null});

  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.querySelector('dialog[open]')){if(mode==='guest')leave();else if(mode==='shop'||mode==='town'&&town.focus)street();else ranches()}});
  function place(el,point,px,w,h){
    scratch.copy(point).project(camera);
    el.style.left=(1+scratch.x)*innerWidth/2+'px';el.style.top=(1-scratch.y)*innerHeight/2+'px';
    if(w)el.style.width=w(px)+'px';if(h)el.style.height=h(px)+'px';
  }
  const shopAim=new T.Vector3(shopSite.x+.18,1.94,shopSite.z+.49),shopOffset=new T.Vector3(4,6.2,15);
  const closeOffset=new T.Vector3(1.9,3,15),targetAim=new T.Vector3(),guestPoint=new T.Vector3(),benchPoint=shopSite.table.position.clone().add(new T.Vector3(0,.86,0));
  const barnPoint=new T.Vector3(-5.55,1.47,-2.55),pigAim=new T.Vector3(pigCenterX,.55,0);
  const townCenter=new T.Vector3(0,1.05,townZ+.45),townOffset=new T.Vector3(2,16,23);
  const doorPoint=new T.Vector3(shopSite.x,2.42,shopSite.z+.26);
  const swipeOffset=new T.Vector3(),collectorPoint=machine.position.clone().add(new T.Vector3(0,.62,0));
  updateSceneView=now=>{
    animatePeople(now);
    const dt=Math.min(.12,(now-previousTime)/1000);previousTime=now;
    const ease=1-Math.exp(-dt*8),height=camera.top-camera.bottom,aspect=innerWidth/innerHeight,narrow=innerWidth<650;
    let zoom=homeZoom,viewOffset=homeOffset;targetAim.copy(homeAim);
    const growth=shopSite.building.scale.y/1.32;
    if(mode==='shop'){
      targetAim.copy(shopAim);targetAim.y*=growth;viewOffset=shopOffset;
      zoom=height/(Math.max(6.12,8.65/aspect)*(1+(growth-1)*.65))*shopZoom;
    }
    if(mode==='pig'){targetAim.copy(pigAim);zoom=height/Math.max(10.8,16.7/aspect)*shopZoom}
    const townHeight=Math.max(12.7,26.4/aspect);
    if(mode==='ranches'){
      const site=townSites[town.focus];targetAim.copy(farmCenter);viewOffset=farmOffset;
      if(site)targetAim.set(site.x,.8,site.z);
      zoom=height/(site?Math.max(7.5,12/aspect):farmHeight())*shopZoom;
    }
    if(mode==='town'){
      const site=townSites[town.focus];targetAim.copy(townCenter);viewOffset=townOffset;
      if(site){targetAim.x+=site.x;targetAim.z+=site.z;targetAim.y=1.00}
      zoom=height/(site?Math.max(7.4,10.6/aspect):townHeight)*shopZoom;
    }
    if(travel){
      const f=travel.progress;
      targetAim.lerpVectors(home,pigAim,f);
      zoom=T.MathUtils.lerp(1,height/Math.max(10.8,16.7/aspect),f);
    }
    if(mode==='guest'){
      guestPoint.copy(portraits[kind].position);guestPoint.y+=.82;
      const span=narrow?3.7:Math.max(2.85,5.55/aspect);
      targetAim.copy(guestPoint);targetAim.x+=narrow?0:span*aspect*.17;targetAim.y-=narrow?.65:0;
      viewOffset=closeOffset;zoom=height/span;
    }
    if(swipe?.moved){
      const f=swipe.progress;
      const toStreet=mode==='shop'||mode==='guest'||mode==='town'&&town.focus;
      targetAim.lerp(toStreet?townCenter:farmCenter,f);viewOffset=swipeOffset.lerpVectors(viewOffset,toStreet?townOffset:farmOffset,f);zoom=T.MathUtils.lerp(zoom,height/(toStreet?townHeight:farmHeight()),f);
    }
    const zDiff=zoom-camera.zoom;camera.zoom=Math.abs(zDiff)<.0004?zoom:camera.zoom+zDiff*ease;
    aimPoint.lerp(targetAim,ease);offset.lerp(viewOffset,ease);
    camera.position.copy(aimPoint).add(offset);camera.lookAt(aimPoint);camera.updateProjectionMatrix();camera.updateMatrixWorld();
    const px=innerHeight*camera.zoom/height;
    const hint=document.querySelector('footer .tip');
    const inTown=mode==='town',commercial=inTown||mode==='shop'||mode==='guest',farmMap=mode==='ranches';town.frame(now,place,px,mode);
    const area=mode==='pig'&&!landUnlocked()?'locked':mode;
    if(hint.dataset.mode!==area){
      document.querySelector('.brand h1').textContent=mode==='pig'?'松露小猪牧场':commercial?'牧场商业街':farmMap?'牧场全景':'绵绵牧场';
      document.querySelector('.brand .eng').textContent=mode==='pig'?'TRUFFLE MEADOW':commercial?'MEADOW MARKET':'WOOLLY MEADOW';
      sun.target.position.x=mode==='pig'?pigCenterX:0;sun.position.x=sun.target.position.x-10;sun.target.position.z=commercial?townZ:0;sun.position.z=sun.target.position.z+8;
      hint.dataset.mode=area;hint.textContent=area==='locked'?'待开垦 · 向左拖空地返回羊场':mode==='pig'?'点便便堆买香猪 · 拖同款合成 · 点松露收集':inTown?'点店铺经营 · 点羊毛铺看顾客':farmMap?'点牧场进入 · 点商业街去经营':mode==='shop'?'点客人看订单 · 滑动返回商业街':'拖同款羊合成 · 向右拖空地看猪场';
    }
    document.body.classList.toggle('guest-view',mode==='guest');
    document.body.classList.toggle('pig-view',mode==='pig');
    document.body.classList.toggle('town-view',inTown||farmMap);
    cloudButton.hidden=mode!=='home';pigFarm.showSource(mode==='pig',place,px);
    townBtn.hidden=mode==='guest'||inTown&&!town.focus;townBtn.textContent=commercial?'商业街全景':'商业街';
    landBtn.hidden=sheepBtn.hidden=!farmMap||!!town.focus;
    if(!landBtn.hidden){place(landBtn,pigAim,px);place(sheepBtn,home,px)}
    nav.querySelector('[data-home]').textContent=farmMap&&!town.focus?'进入羊场':'牧场全景';
    barnBtn.hidden=mode!=='home';if(!barnBtn.hidden)place(barnBtn,barnPoint,px);
    collectorBtn.hidden=mode!=='home'||!machine.visible;
    if(collectorBtn.hidden)rateUntil=0;
    else place(collectorBtn,collectorPoint,px,n=>Math.max(26,n*.98),n=>Math.max(28,n*1.22));
    rateTip.hidden=now>=rateUntil;
    if(!rateTip.hidden){
      rateTip.style.left=clamp(parseFloat(collectorBtn.style.left),rateTip.offsetWidth/2+5,innerWidth-rateTip.offsetWidth/2-5)+'px';
      rateTip.style.top=(parseFloat(collectorBtn.style.top)-collectorBtn.offsetHeight/2-5)+'px';
    }
    door.hidden=!inTown||!!town.focus;bench.hidden=mode!=='shop';nav.hidden=mode==='guest';
    doorPoint.y=2.42*growth;
    displayBtn.hidden=mode!=='shop';if(!displayBtn.hidden)place(displayBtn,doorPoint,px);
    if(!door.hidden)place(door,doorPoint,px,n=>Math.max(55,n*4.25),n=>Math.max(34,n*2.64));
    if(!bench.hidden){
      place(bench,benchPoint,px);bench.classList.toggle('overview',mode==='home');
      if(bench.classList.contains('has-cards')&&Math.abs(scratch.x)<=1){
        const half=bench.offsetWidth/2+4;
        bench.style.left=clamp((1+scratch.x)*innerWidth/2,half,innerWidth-half)+'px';
      }
    }
    for(const {btn,model} of actors){
      btn.hidden=!model.visible||mode!=='shop';if(btn.hidden)continue;
      guestPoint.copy(model.position);guestPoint.y+=.72;
      place(btn,guestPoint,px,n=>Math.max(17,n*.80),n=>Math.max(22,n*1.43));
    }
    if(mode==='guest'){
      guestPoint.copy(portraits[kind].position);guestPoint.y+=narrow?.12:.85;guestPoint.project(camera);
      const w=order.offsetWidth,h=order.offsetHeight,x=(1+guestPoint.x)*innerWidth/2,y=(1-guestPoint.y)*innerHeight/2;
      order.style.left=clamp(narrow?(innerWidth-w)/2:x+px*.53,8,innerWidth-w-8)+'px';
      order.style.top=clamp(narrow?y+px*.10:y-h*.48,8,Math.max(8,innerHeight-h-8))+'px';
    }
  };
  return {leave,store,overview:ranches,bench,pigView,street};
}
