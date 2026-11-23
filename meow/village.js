/* Scene geometry and deterministic walks. Coordinates use the 1440 × 960 village. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.VillageMotion=api;})(typeof window==='object'?window:globalThis,()=>{
 'use strict';
 const routes=[
  [[510,490],[730,475],[880,530],[825,690],[735,820],[500,820],[430,655]],
  [[850,470],[1030,480],[1120,570],[1050,690],[880,760],[795,630]],
  [[1095,570],[1227,600],[1225,686],[1225,752],[1135,812],[1000,840],[1135,812],[1225,752],[1225,686],[1105,650]]
 ];
 // Trace the generated map itself, preserving its exact painted edges and registration.
 // Each gate piece repeats the same raster through a mask; the door opening stays empty.
 const gate=[
  {name:'roof',depth:1902,points:[[1173,685],[1196,665],[1205,649],[1195,642],[1199,630],[1210,624],[1224,636],[1354,628],[1368,616],[1383,623],[1388,641],[1373,645],[1398,663],[1408,681],[1393,697],[1380,696],[1367,704],[1354,698],[1334,703],[1315,697],[1295,703],[1277,698],[1252,710],[1230,705],[1210,698],[1186,700]]},
  {name:'left-post',depth:752,points:[[1228,696],[1251,697],[1255,720],[1250,738],[1255,750],[1250,772],[1254,791],[1245,804],[1234,797],[1231,780],[1234,760],[1228,738]]},
  {name:'right-post',depth:741,points:[[1353,689],[1379,687],[1382,706],[1377,728],[1379,743],[1374,758],[1377,779],[1367,794],[1355,787],[1357,771],[1353,754],[1357,733],[1353,715]]}
 ].map(p=>({...p,points:p.points.map(([x,y])=>[x*.9375,y*.9375])}));
 function inside(x,y,points){let hit=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const [a,b]=points[i],[c,d]=points[j];if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)hit=!hit;}return hit;}
 function covered(x,y,depth){return gate.some(p=>depth<=p.depth&&inside(x,y,p.points));}
 const gardens=[];
 for(let y=405,row=0;y<=860;y+=32,row++)for(let x=330+(row%2)*16;x<=1260;x+=32){
  if((y<600&&x<1170||y>=600&&y<680&&x>=450&&x<1140||y>=680&&x>=450&&x<930||x>1180&&x<1255&&y>570&&y<810)&&Math.hypot(x-640,y-745)>73)gardens.push({x,y});
 }
 // A stable shuffle distributes quiet walking patches across the whole court rather than three queues.
 gardens.sort((a,b)=>((Math.sin(a.x*12.9898+a.y*78.233)*43758.5453)%1)-((Math.sin(b.x*12.9898+b.y*78.233)*43758.5453)%1));
 function gardenPosition(id,time,index,count){const base=gardens[index%gardens.length],phase=(id*.61803398875%1)*24,cycle=(time+phase)%24,moving=cycle<18,t=Math.min(18,cycle)/18*Math.PI*2,rx=6+id%5,ry=5+id%4,dx=-rx*Math.sin(t);return{x:base.x+Math.cos(t)*rx,y:base.y+Math.sin(t)*ry,moving,face:dx<0?-1:1,frame:moving?Math.floor((time+id*.17)*6)%4:1};}
 function position(id,time,index=0,count=0){
  if(count>24)return gardenPosition(id,time,index,count);
  const route=routes[(id-1)%routes.length],speed=18+(id*7%10),pause=1.2+(id%4)*.4;
  const segments=route.map((a,i)=>{const b=route[(i+1)%route.length],dx=b[0]-a[0],dy=b[1]-a[1];return{a,b,dx,dy,duration:Math.hypot(dx,dy)/speed};});
  const total=segments.reduce((s,p)=>s+p.duration+pause,0);
  let t=((time+(id*.61803398875%1)*total)%total+total)%total;
  for(const p of segments){if(t<=p.duration+pause){const moving=t<p.duration,q=Math.min(1,t/p.duration);return{x:p.a[0]+p.dx*q,y:p.a[1]+p.dy*q,moving,face:p.dx<-.1?-1:1,frame:moving?Math.floor((time*speed/22+id*.17)*7)%4:1};}t-=p.duration+pause;}
 }
 return{routes,gate,covered,position,gardens};
});
