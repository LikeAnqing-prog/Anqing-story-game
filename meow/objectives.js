/* Guided progression and permanent, optional challenges. No daily streak or expiring rewards. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./growth'):root.MeowGrowth);if(typeof module==='object'&&module.exports)module.exports=api;else root.MeowObjectives=api;})(typeof window==='object'?window:globalThis,G=>{
'use strict';
const maxLevel=s=>Math.max(...s.cats.map(c=>G.info(c).level)),born=s=>s.cats.filter(c=>c.parents.length===2),masters=s=>s.cats.filter(c=>c.growthRank===2),stars=s=>Object.values(s.stageStars||{}).reduce((a,b)=>a+b,0);
const journey=[
{id:'preview',chapter:'相识',name:'先看看，会遇见谁',desc:'打开一次双亲的遗传预览',why:'毛色、花纹、耳型和本领分别遗传；先看机会，再决定。',route:'preview',coins:20,target:1,value:s=>Number(s.objectives.preview||s.bred>0)},
{id:'first-birth',chapter:'相识',name:'迎接第三位伙伴',desc:'完成第一次繁育',why:'双亲会留下来，新猫从自己的 Lv.1 开始成长。',route:'breed',coins:120,target:1,value:s=>Number(s.bred>0)},
{id:'first-team',chapter:'出发',name:'三只猫，一支小队',desc:'选好 3 位出战伙伴',why:'前排更早接敌；护盾、治疗与输出可以互相补位。',route:'team',coins:60,target:3,value:s=>s.team.length},
{id:'first-win',chapter:'出发',name:'赢下竹林第一战',desc:'通关第 1 关',why:'试炼免费；可以观看配合，也可以一键跳过。',route:'stage1',coins:80,notes:1,target:1,value:s=>Number(s.cleared.includes(1))},
{id:'lesson',chapter:'养成',name:'试试另一种本领',desc:'让任意一只猫研习新本领',why:'每只猫第一次研习免费；学过的本领可免费切换。',route:'lesson',coins:80,notes:2,target:1,value:s=>Number(s.cats.some(c=>c.lessonUsed))},
{id:'level3',chapter:'养成',name:'陪它长到 Lv.3',desc:'培养一只 Lv.3 的猫',why:'首次个人历练、巡游心得或陪伴特训都能积累经验。',route:'growth',coins:100,notes:1,target:3,value:maxLevel},
{id:'path',chapter:'养成',name:'找到擅长的事情',desc:'为任意一只猫选择专长',why:'护院、追风、妙手强化不同分工；可以免费重选。',route:'path',coins:100,notes:1,target:1,value:s=>Number(s.cats.some(c=>c.growthPath))},
{id:'new-genes',chapter:'遗传',name:'迎来山里的新朋友',desc:'通关第 2 关',why:'山客带来新基因，双亲组合的可能性也会增加。',route:'stage2',coins:100,dew:1,target:1,value:s=>Number(s.cleared.includes(2))},
{id:'generation3',chapter:'遗传',name:'家族的第三代',desc:'让一只后代参与繁育，延续到第 3 代',why:'本领与外观可以传下去；等级与专长要由后代自己成长。',route:'generation',coins:120,leaves:1,target:3,value:s=>Math.max(...s.cats.map(c=>c.gen))},
{id:'directed',chapter:'遗传',name:'只留下一个特点',desc:'进行一次单项定向繁育',why:'只锁毛色或本领中的一项，其余照常分别遗传。额外花费 20 铜钱。',route:'directed',coins:100,notes:2,target:1,value:s=>Number(born(s).some(c=>c.birthReport?.focused))},
{id:'mutation',chapter:'遗传',name:'发现一点小不同',desc:'遇见一只普通突变猫',why:'可用上一目标线赠送的心愿叶保证突变；自然基础 8%，第 8 次未出保底。',route:'mutation',coins:100,dew:1,target:1,value:s=>Number(s.cats.some(c=>c.mutation!==null))},
{id:'breakthrough',chapter:'历练',name:'练成一门真本事',desc:'完成一次 Lv.6 专长突破',why:'需要 Lv.6、赢过 2 个不同关卡、150 铜钱和 2 灵感。',route:'breakthrough',coins:150,notes:2,target:1,value:s=>Number(s.cats.some(c=>c.growthRank>=1))},
{id:'challenge',chapter:'历练',name:'换一种办法获胜',desc:'首次完成任意一项小队挑战',why:'挑战有独立条件，胜利之外，还要让阵容完成自己的任务。',route:'challenges',coins:120,notes:2,target:1,value:s=>Number(s.objectives.challengeWins.length)},
{id:'three-stars',chapter:'历练',name:'让配合更漂亮',desc:'任意关卡获得三星',why:'胜利、全员存活、8 回合内获胜，各是一颗星。',route:'stage1',coins:150,dew:1,target:3,value:s=>Math.max(0,...Object.values(s.stageStars||{}))},
{id:'summit',chapter:'传承',name:'一起看山顶的风景',desc:'通关第 10 关',why:'走完山林试炼后，还能挑战远行纪录与不同小队规则。',route:'latest',coins:400,notes:4,target:10,value:s=>s.cleared.length},
{id:'master',chapter:'传承',name:'它也能独当一面',desc:'让一只猫完成 Lv.10 结业',why:'需要专长突破、4 个不同关卡的胜利和结业资源；老猫会获得称号。',route:'master',coins:300,notes:2,target:1,value:s=>masters(s).length},
{id:'mentor',chapter:'传承',name:'把本事教给新伙伴',desc:'完成一次师徒传习',why:'结业猫可用 100 铜钱和 1 灵感，指导未满 Lv.3 的新猫直接到 Lv.3。',route:'mentor',coins:100,dew:2,target:1,value:s=>s.cats.filter(c=>c.mentored).length}
];
const longGoals=[
{id:'looks',name:'满院十八样',desc:'发现全部 18 种基础外观',why:'引入山客基因，再从不同双亲组合中补齐图鉴。',route:'book',coins:500,dew:3,target:18,value:s=>new Set(s.seen).size},
{id:'rares',name:'六种林间奇迹',desc:'遇见全部 6 种超稀有猫',why:'探索新品种会优先揭晓未收录稀有；保底进度不随离线重置。',route:'rare',coins:800,notes:6,target:6,value:s=>s.rareSeen.length},
{id:'masters',name:'三门都有传人',desc:'同时拥有护院、追风、妙手各一位结业猫',why:'把不同伙伴养成不同分工，而不只重养同一只猫。',route:'master',coins:600,notes:6,target:3,value:s=>new Set(masters(s).map(c=>c.growthPath)).size},
{id:'stars',name:'山林三十星',desc:'十关全部三星',why:'针对关卡调整本领和站位，改善存活与获胜回合数。',route:'stars',coins:600,dew:3,target:30,value:stars},
{id:'students',name:'家族里的小先生',desc:'指导 3 位不同的新伙伴',why:'让老猫帮助新阵容起步；每位新猫只能受指导一次。',route:'mentor',coins:300,notes:3,target:3,value:s=>s.cats.filter(c=>c.mentored).length},
{id:'trials',name:'九枚试炼印记',desc:'完成三条路线的全部 9 项挑战',why:'守望、疾行、传习各有三阶；各项首次达成才领取奖励。',route:'challenges',coins:600,dew:4,target:9,value:s=>s.objectives.challengeWins.length},
{id:'trail20',name:'山外还有山',desc:'远行纪录达到第 20 段',why:'每段敌情与难度继续变化，保留永久最高纪录。',route:'trail',coins:900,dew:4,target:20,value:s=>s.trailBest||0}
];
const challengeTypes=[
{id:'guard',name:'守望',desc:'前排选择护院专长；队中有护盾或挑衅本领；全员存活获胜。'},
{id:'swift',name:'疾行',desc:'队伍不携带治愈、春风；在 12 回合内获胜。'},
{id:'mentor',name:'传习',desc:'带一位结业猫和一位入场未满 Lv.6 的伙伴；获胜且至少一位这类新人存活。'}
];
const challenges=challengeTypes.flatMap(t=>[3,6,10].map((level,i)=>({...t,id:t.id+'-'+(i+1),kind:t.id,tier:i+1,level,coins:120+(i+1)*80,notes:2,dew:1,xp:30+(i+1)*10})));
function migrate(s){if(!s.objectives){const mapped={first:'first-birth',family:'generation3',wonder:'mutation'};s.objectives={claims:(s.wishClaims||[]).map(x=>mapped[x]).filter(Boolean),longClaims:(s.wishClaims||[]).includes('album')?['looks']:[],challengeWins:[],preview:s.bred>0,pinned:null};}return s;}
const uniqueIds=(v,defs)=>Array.isArray(v)&&new Set(v).size===v.length&&v.every(id=>defs.some(d=>d.id===id));
function valid(s){const o=s.objectives;if(o===undefined)return true;return !!o&&typeof o==='object'&&!Array.isArray(o)&&uniqueIds(o.claims,journey)&&uniqueIds(o.longClaims,longGoals)&&uniqueIds(o.challengeWins,challenges)&&typeof o.preview==='boolean'&&(o.pinned===null||longGoals.some(g=>g.id===o.pinned));}
function progress(s,g){migrate(s);const current=Math.min(g.target,Math.max(0,g.value(s)));return{current,target:g.target,done:current>=g.target};}
function active(s){migrate(s);return journey.find(g=>!s.objectives.claims.includes(g.id))||null;}
function home(s){migrate(s);return longGoals.find(g=>g.id===s.objectives.pinned&&!s.objectives.longClaims.includes(g.id))||active(s)||longGoals.find(g=>!s.objectives.longClaims.includes(g.id))||null;}
function claim(s,id){migrate(s);const main=journey.find(g=>g.id===id),g=main||longGoals.find(g=>g.id===id),claims=main?s.objectives.claims:s.objectives.longClaims;if(!g||claims.includes(id)||main&&active(s)?.id!==id||!progress(s,g).done)return null;claims.push(id);s.coins+=g.coins||0;s.geneNotes+=g.notes||0;s.starDew+=g.dew||0;s.blessings+=g.leaves||0;if(s.objectives.pinned===id)s.objectives.pinned=null;return g;}
function challengeSetup(s,id){const d=challenges.find(c=>c.id===id),cats=s.team.map(id=>s.cats.find(c=>c.id===id)).filter(Boolean),missing=[];if(!d)return ['请选择一项小队挑战'];if(cats.length!==3)missing.push('先选满三位伙伴');if(d.kind==='guard'){if(cats[0]?.growthPath!=='guardian')missing.push('前排需要护院专长');if(!cats.some(c=>[1,6].includes(c.skill)))missing.push('队中需要护盾或挑衅本领');}if(d.kind==='swift'&&cats.some(c=>[2,8].includes(c.skill)))missing.push('请换下治愈、春风本领');if(d.kind==='mentor'){if(!cats.some(c=>c.growthRank===2))missing.push('需要一位已结业的猫');if(!cats.some(c=>G.info(c).level<6&&c.growthRank!==2))missing.push('需要一位未满 Lv.6 的伙伴');}return missing;}
function checkChallenge(b){const d=challenges.find(c=>c.id===b.challengeId);if(!d)return null;const cats=b.units.filter(u=>u.side===0),alive=cats.filter(u=>u.life>0),win=b.result==='win',missing=[];if(!win)missing.push('这次尚未获胜');if(d.kind==='guard'){if(cats[0]?.growthPath!=='guardian')missing.push('前排需要选择护院专长');if(!cats.some(c=>[1,6].includes(c.skill)))missing.push('队中需要护盾或挑衅本领');if(alive.length!==3)missing.push('需要三位伙伴全员存活');}if(d.kind==='swift'){if(cats.some(c=>[2,8].includes(c.skill)))missing.push('队伍不能携带治愈或春风');if(b.round>12)missing.push('本次用了 '+b.round+' 回合，需要不超过 12 回合');}if(d.kind==='mentor'){if(!cats.some(c=>c.growthRank===2))missing.push('需要一位已结业的猫带队');if(!cats.some(c=>G.info(c).level<6&&c.growthRank!==2))missing.push('需要带一位入场未满 Lv.6 的伙伴');else if(!alive.some(c=>G.info(c).level<6&&c.growthRank!==2))missing.push('至少一位入场未满 Lv.6 的伙伴需要存活');}return{definition:d,passed:missing.length===0,reason:missing.length?missing.join('；'):'挑战条件全部达成'};}

return{journey,longGoals,challenges,challengeTypes,migrate,valid,progress,active,home,claim,challengeSetup,checkChallenge};
});
