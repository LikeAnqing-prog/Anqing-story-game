/* Versioned local save, last-good backup, and a shared action lock for multiple tabs. */
(()=>{'use strict';
const KEY='meow-ink-demo-v2',BACKUP=KEY+'-backup',DAMAGED=KEY+'-damaged';let base=null,locked=false;
const validate=s=>window.GameCore.validate(s);
function read(raw){if(!raw)return null;try{const s=JSON.parse(raw);return validate(s)?s:null;}catch(_){return null;}}
function load(){try{base=localStorage.getItem(KEY);let state=read(base),notice='';if(base&&!state){localStorage.setItem(DAMAGED,base);state=read(localStorage.getItem(BACKUP));notice=state?'已恢复最近一份有效手记，损坏原文也已保留。':'手记未能读入，原文已保留，可在「？」中导出交给修复。';}return{state:state||GameCore.initial(),notice,available:true};}catch(_){return{state:GameCore.initial(),notice:'当前浏览器不能保存，请及时导出手记。',available:false};}}
function latest(){try{const raw=localStorage.getItem(KEY);if(raw===base)return null;const state=read(raw);if(!state)return null;base=raw;return state;}catch(_){return null;}}
function commit(state){const current=localStorage.getItem(KEY);if(current!==base){const fresh=read(current);if(fresh){base=current;return{conflict:fresh};}}if(!validate(state))throw Error('这次手记没有通过完整检查，已保留之前的进度。');if(read(current))localStorage.setItem(BACKUP,current);state._saveRevision=(read(current)?._saveRevision||0)+1;const raw=JSON.stringify(state);localStorage.setItem(KEY,raw);base=raw;return{ok:true};}
function exclusive(fn){if(locked)return fn();const run=()=>{locked=true;try{return fn();}finally{locked=false;}};return navigator.locks?.request?navigator.locks.request(KEY+'-writer',run):Promise.resolve().then(run);}
function damaged(){try{return localStorage.getItem(DAMAGED);}catch(_){return null;}}
window.MeowSave={KEY,load,latest,commit,exclusive,damaged};
})();
