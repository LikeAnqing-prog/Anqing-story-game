/* One sound per accepted UI click, with no network or autoplay dependency. */
(()=>{'use strict';
 const KEY='meow-ink-sound-v1';
 let enabled=true,ctx=null,master=null,played=0,lastKind=null;
 try{enabled=localStorage.getItem(KEY)!=='off';}catch(_){}
 const buffers=new Map(),voices=new Set();
 const back=new Set(['back','modal-close','welcome-back','reveal-home','battle-exit']);
 const confirm=new Set(['breed-start','battle-start','battle-instant','learn-skill','import-confirm','reset','preview','blessing','track-look','team-lead','welcome-replace','growth-path','growth-train','study']);
 const reward=new Set(['wish-claim','welcome-done','growth-next','open-basket','craft-dew','growth-advance','patrol-claim','mentor','objective-claim']);
 function kind(action){return back.has(action)?'back':confirm.has(action)?'confirm':reward.has(action)?'reward':'tap';}
 function setup(){
  if(ctx)return true;
  const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return false;
  ctx=new Context();master=ctx.createGain();master.gain.value=.3;master.connect(ctx.destination);
  // The bundled files are canonical mono PCM WAV; synchronous decoding keeps first-click latency low.
  for(const [name,base64] of Object.entries(window.MeowSoundBank)){
   const raw=atob(base64),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0)),view=new DataView(bytes.buffer);
   const samples=view.getUint32(40,true)/2,buffer=ctx.createBuffer(1,samples,view.getUint32(24,true)),out=buffer.getChannelData(0);
   for(let i=0;i<samples;i++)out[i]=view.getInt16(44+i*2,true)/32768;
   buffers.set(name,buffer);
  }
  return true;
 }
 function stop(){for(const v of voices){try{v.source.stop();}catch(_){}v.source.disconnect();v.gain.disconnect();}voices.clear();}
 function play(type='tap'){
  if(!enabled||document.hidden)return;
  try{
   if(!setup())return;
   if(ctx.state!=='running')ctx.resume().catch(()=>{});
   // Queue immediately within the user gesture, so even the first mobile tap sounds once.
   const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffers.get(type)||buffers.get('tap');source.connect(gain);gain.connect(master);
   if(voices.size>=4){const oldest=voices.values().next().value;oldest.gain.gain.setTargetAtTime(0,ctx.currentTime,.005);oldest.source.stop(ctx.currentTime+.02);voices.delete(oldest);}
   const voice={source,gain};voices.add(voice);source.onended=()=>{voices.delete(voice);source.disconnect();gain.disconnect();};source.start();played++;lastKind=type;
  }catch(_){/* Sound must never prevent a game action. */}
 }
 function toggle(){enabled=!enabled;try{localStorage.setItem(KEY,enabled?'on':'off');}catch(_){}if(!enabled)stop();else play('confirm');return enabled;}
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();if(ctx?.state==='running')ctx.suspend().catch(()=>{});}});
 window.MeowSound={play,action:action=>play(kind(action)),toggle,isEnabled:()=>enabled,status:()=>({enabled,played,lastKind,context:ctx?.state||'unstarted',voices:voices.size})};
})();
