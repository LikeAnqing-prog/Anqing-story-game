/* Cat growth is earned by experience and distinct adventures; it is never inherited as base genes. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MeowGrowth=api;})(typeof window==='object'?window:globalThis,()=>{
'use strict';
const PATHS=[{id:'guardian',name:'护院',title:'小院守望',icon:2,desc:'生命提高，开场为自己添盾，适合守护与挑衅。'},{id:'hunter',name:'追风',title:'逐风游侠',icon:0,desc:'攻击提高，突破后第一次出爪更有力，适合输出。'},{id:'healer',name:'妙手',title:'春风医者',icon:1,desc:'生命与治疗、护盾效果提高，适合照顾伙伴。'}];
// Combat lessons are tied to confirmed milestones, not level alone.
const LESSONS={
 guardian:[{name:'照看',icon:2,desc:'开场为另一位生命上限最低的伙伴添 12 护盾。'}, {name:'挺身救援',icon:2,desc:'自己行动开始时，若有伙伴生命不高于 40%，为其添 30 护盾，并挑衅到自己再行动两次；每场一次。'}, {name:'护住大家',icon:2,desc:'救援改为每场两次，须保护不同伙伴；每次护盾提高到 45。'}],
 hunter:[{name:'抓住破绽',icon:0,desc:'直接攻击已经冻结或定身的敌人，伤害增加 20%。'}, {name:'乘胜追击',icon:4,desc:'击败直接攻击的目标后，若还有敌人且自己存活，立即追加一次行动；每场一次。'}, {name:'连胜追击',icon:4,desc:'乘胜追击改为每场最多两次；每次仍须击败目标。'}],
 healer:[{name:'清露解毒',icon:1,desc:'治愈、春风或莲息的直接治疗，同时清除目标剩余中毒。'}, {name:'余温成盾',icon:2,desc:'上述直接治疗的溢出量转成护盾，每次最多 20；满血也可施放治愈。'}, {name:'春意相传',icon:3,desc:'上述直接治疗后，再为另一位最虚弱的伙伴恢复本次治疗量的 40%；不会再次触发治疗被动。'}]
};
function lessons(c,path=c.growthPath){return (LESSONS[path]||[]).map((v,i)=>({...v,level:[3,6,10][i],rank:i,unlocked:c.growthPath===path&&(i===0||c.growthRank>=i)}));}
function pathSkill(c,path,rank=0){return c.growthPath===path&&((c.growthRank||0)>=rank);}
function info(c){let remaining=c.xp||0,level=1;while(level<10&&remaining>=20+level*8){remaining-=20+level*8;level++;}return{level,current:level===10?0:remaining,next:level===10?0:20+level*8};}
function migrate(c){if(!Array.isArray(c.trialWins))c.trialWins=[];if(c.growthPath===undefined)c.growthPath=null;if(!Number.isInteger(c.growthRank))c.growthRank=0;if(c.mentored===undefined)c.mentored=false;if(c.favorite===undefined)c.favorite=false;return c;}
function valid(c){if(c.growthRank>0&&(!c.growthPath||info(c).level<(c.growthRank===1?6:10)||!Array.isArray(c.trialWins)||c.trialWins.length<(c.growthRank===1?2:4)))return false;if(c.growthPath&&info(c).level<3)return false;return (c.growthPath===undefined||c.growthPath===null||PATHS.some(p=>p.id===c.growthPath))&&(c.growthRank===undefined||Number.isInteger(c.growthRank)&&c.growthRank>=0&&c.growthRank<=2)&&(c.trialWins===undefined||Array.isArray(c.trialWins)&&new Set(c.trialWins).size===c.trialWins.length&&c.trialWins.every(n=>Number.isInteger(n)&&n>=1&&n<=10))&&(c.mentored===undefined||typeof c.mentored==='boolean')&&(c.favorite===undefined||typeof c.favorite==='boolean');}
function stats(c){const n=info(c).level-1,rank=c.growthRank||0,path=c.growthPath,hp=path==='guardian'?.08+rank*.04:path==='healer'?.06:0,atk=path==='hunter'?.06+rank*.03:0;return{...c,hp:Math.round(c.hp*(1+n*.06)*(1+hp)),atk:Math.round(c.atk*(1+n*.04)*(1+atk)),speed:c.speed+Math.floor(n/3)};}
function support(c){return c.growthPath==='healer'?1.12+(c.growthRank||0)*.06:1;}
function shield(c){return c.growthPath==='guardian'?8+(c.growthRank||0)*8:0;}
function firstStrike(c){return c.growthPath==='hunter'&&c.growthRank>0?1+(c.growthRank===2?.25:.15):1;}
function milestone(c){migrate(c);if(!c.growthPath)return{step:'path',level:3,wins:0,coins:0,notes:0,label:'选择专长',ready:info(c).level>=3};const rank=c.growthRank;if(rank>=2)return{step:'complete',label:PATHS.find(p=>p.id===c.growthPath).title,ready:false};const level=rank===0?6:10,wins=rank===0?2:4,coins=rank===0?150:300,notes=rank===0?2:4;return{step:'advance',level,wins,coins,notes,label:rank===0?'专长突破':'结业觉醒',ready:info(c).level>=level&&c.trialWins.length>=wins};}
function choose(s,id,path){const c=s.cats.find(c=>c.id===Number(id));if(!c||!PATHS.some(p=>p.id===path))throw Error('请选择一条专长。');migrate(c);if(info(c).level<3)throw Error('达到 Lv.3 后可以选择专长。');c.growthPath=path;return c;}
function advance(s,id){const c=s.cats.find(c=>c.id===Number(id));if(!c)throw Error('没有找到这位伙伴。');const m=milestone(c);if(m.step!=='advance'||!m.ready)throw Error('先达到所需等级，并赢得不同关卡的历练。');if(s.coins<m.coins||s.geneNotes<m.notes)throw Error('铜钱或灵感还不够，所需资源已标在按钮上。');s.coins-=m.coins;s.geneNotes-=m.notes;c.growthRank++;return c;}
return{PATHS,LESSONS,lessons,pathSkill,info,migrate,valid,stats,support,shield,firstStrike,milestone,choose,advance};
});
