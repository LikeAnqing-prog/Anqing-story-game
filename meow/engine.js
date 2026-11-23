(function(root){
  'use strict';
  const Objectives=typeof module!=='undefined'&&module.exports?require('./objectives'):root.MeowObjectives;
  const Growth=typeof module!=='undefined'&&module.exports?require('./growth'):root.MeowGrowth;
  const COLORS=['橘黄','奶白','青灰'], PATTERNS=['素色','虎纹','花斑'], EARS=['立耳','圆耳'];
  const SKILLS=[{name:'连击',icon:0,desc:'每次攻击挥爪两次，每次造成 65% 攻击伤害。'},{name:'护盾',icon:2,desc:'每三回合为我方最虚弱的猫添上护盾。'},{name:'治愈',icon:1,desc:'每三回合治疗生命比例最低的伙伴；全员满血时正常攻击。'},{name:'毒爪',icon:5,desc:'攻击附加两次毒伤，每次 6 点。'},{name:'迅捷',icon:4,desc:'速度增加 5，有 25% 概率追加一次攻击。'},{name:'反击',icon:10,desc:'受到直接攻击后，反击造成 45% 攻击伤害。'}];
  SKILLS.push(
    {name:'挑衅',icon:2,type:'保护',desc:'就绪时吸引敌人优先攻击自己，并获得 30 护盾，持续到自身再行动两次；施放后冷却两次自身行动。'},
    {name:'冰铃',icon:4,type:'控制',desc:'攻击射程 2 格；就绪时造成 50% 攻击伤害并冻结敌人一次行动。解冻后下一次行动免疫再冻结；冷却两次自身行动。'},
    {name:'春风',icon:3,type:'净化',desc:'就绪时清除一位伙伴的毒、冰冻与定身，立即恢复 8 生命，并在其接下来两次行动前各恢复 8；冷却两次自身行动。'},
    {name:'鼓舞',icon:15,type:'辅助',desc:'就绪时全队下两次攻击行动伤害提高 25%，移动和施放辅助不消耗次数，不叠加；冷却两次自身行动。'},
    {name:'推掌',icon:10,type:'位移',desc:'就绪时出爪后将相邻敌人推远一格；落点被挡时额外造成 8 点伤害，护盾可吸收。冷却两次自身行动。'},
    {name:'藤缚',icon:5,type:'限制',desc:'攻击射程 3 格；就绪时造成 60% 攻击伤害并禁止敌人移动两次行动，仍可攻击与施法；冷却两次自身行动。'}
  );
  ['连击','护盾','治愈','毒爪','迅捷','反击'].forEach((_,i)=>SKILLS[i].type=['输出','保护','治疗','持续','机动','反制'][i]);
  const MUTATIONS=[{name:'叶芽尾',icon:3,desc:'生命额外增加 15'},{name:'星星印',icon:15,desc:'攻击额外增加 3'},{name:'风铃尾',icon:4,desc:'速度额外增加 3'}];
  MUTATIONS.push(
    {name:'弹簧腿',icon:4,desc:'移动后的下一次攻击行动伤害 +35%；出战生命 -10%。',joke:'本来只想走两步，结果弹到了前排。'},
    {name:'饭团身',icon:2,desc:'开场给除自己外生命上限最低的伙伴添 18 护盾；速度 -2。',joke:'看起来能吃，其实负责打包队友。'},
    {name:'拖把尾',icon:3,desc:'移动时清除自身剩余中毒；速度 -2。',joke:'别人在走位，它在保洁。'},
    {name:'长耳绊脚',icon:1,desc:'每场第一次受到冰冻时用耳朵挡下；速度 -1。',joke:'耳朵先到了，猫还在后面。'},
    {name:'方脑壳',icon:2,desc:'免疫推掌的击退与撞墙附伤，仍承受攻击伤害；攻击 -2。',joke:'道理听不进去，推也推不动。'},
    {name:'叠叠肚',icon:1,desc:'自身行动开始时，若生命低于一半则恢复 6；攻击 -2。',joke:'这不是三层肉，是三层应急储备。'},
    {name:'尾巴有嘴',icon:0,desc:'近身攻击后，尾巴追加 30% 攻击的伤害，也会触发反击；出战生命 -10%。',joke:'它闭嘴了，但尾巴还有意见。'},
    {name:'独眼大聪明',icon:15,desc:'攻击射程 +1；出战生命 -12%。',joke:'看得挺远，挨打也挺疼。'}
  );
  const STAGES=['竹林小径','石桥听雨','苔阶深处','荷塘夜话','松风渡口','青瓦山门','云间茶亭','桃林古道','月下庭院','山顶见晴'];
  const FORMATION=[{x:2,y:3},{x:0,y:4},{x:4,y:4}];
  const key=c=>`${c.color}-${c.pattern}-${c.ears}`;
  function initial(){return {version:2,coins:300,nextId:3,cats:[{id:1,name:'橘团',color:0,pattern:1,ears:0,hp:116,atk:26,speed:12,skill:0,gen:1,parents:[],mutation:null},{id:2,name:'云朵',color:1,pattern:2,ears:1,hp:140,atk:22,speed:10,skill:1,gen:1,parents:[],mutation:null}],team:[1,2],cleared:[],battles:0,pendingReveal:null,bred:0,seen:['0-1-0','1-2-1']};}
  function validate(s){
    if(!s||s.version!==2||!Number.isInteger(s.coins)||s.coins<0||!Array.isArray(s.cats)||s.cats.length<2||s.cats.length>10000||!Array.isArray(s.team)||!Array.isArray(s.cleared)||!Array.isArray(s.seen))return false;
    if(!Objectives.valid(s))return false;
    if(s.wishClaims!==undefined&&(!Array.isArray(s.wishClaims)||new Set(s.wishClaims).size!==s.wishClaims.length||s.wishClaims.some((id,i)=>WISHES[i]?.id!==id)))return false;
    if(s.blessings!==undefined&&(!Number.isInteger(s.blessings)||s.blessings<0))return false;
    if(s.dryStreak!==undefined&&(!Number.isInteger(s.dryStreak)||s.dryStreak<0||s.dryStreak>7))return false;
    if(s.geneNotes!==undefined&&(!Number.isInteger(s.geneNotes)||s.geneNotes<0))return false;
    if(s.trailBest!==undefined&&(!Number.isInteger(s.trailBest)||s.trailBest<0||s.trailBest>10000))return false;
    if(s.tactic!==undefined&&!TACTICS.some(t=>t.id===s.tactic))return false;
    if(s.targetLook!==undefined&&s.targetLook!==null&&!/^[0-2]-[0-2]-[0-1]$/.test(s.targetLook))return false;
    if(s.geneGuestClaimed!==undefined&&typeof s.geneGuestClaimed!=='boolean')return false;
    if(s.stageStars!==undefined&&(!s.stageStars||Array.isArray(s.stageStars)||typeof s.stageStars!=='object'||Object.entries(s.stageStars).some(([k,v])=>!/^([1-9]|10)$/.test(k)||!Number.isInteger(v)||v<0||v>3)))return false;
    if(s.cats.some(c=>c.xp!==undefined&&(!Number.isInteger(c.xp)||c.xp<0||c.xp>10000)))return false;
    if(s.starDew!==undefined&&(!Number.isInteger(s.starDew)||s.starDew<0))return false;
    if(s.rareDryStreak!==undefined&&(!Number.isInteger(s.rareDryStreak)||s.rareDryStreak<0||s.rareDryStreak>19))return false;
    if(s.mutationSeen!==undefined&&(!Array.isArray(s.mutationSeen)||new Set(s.mutationSeen).size!==s.mutationSeen.length||s.mutationSeen.some(i=>!Number.isInteger(i)||i<0||i>=MUTATIONS.length)))return false;
    if(s.rareSeen!==undefined&&(!Array.isArray(s.rareSeen)||new Set(s.rareSeen).size!==s.rareSeen.length||s.rareSeen.some(i=>!Number.isInteger(i)||i<0||i>5)))return false;
    if(s.cats.some(c=>c.rareGene!==undefined&&c.rareGene!==null&&(!Number.isInteger(c.rareGene)||c.rareGene<0||c.rareGene>5)))return false;
    if(s.cats.some(c=>c.learnedSkills!==undefined&&(!Array.isArray(c.learnedSkills)||new Set(c.learnedSkills).size!==c.learnedSkills.length||!c.learnedSkills.includes(c.skill)||c.learnedSkills.some(i=>!Number.isInteger(i)||i<0||i>=SKILLS.length))))return false;
    if(s.cats.some(c=>c.lessonUsed!==undefined&&typeof c.lessonUsed!=='boolean'))return false;
    if(s.pendingGrowth!==undefined&&(!Array.isArray(s.pendingGrowth)||s.pendingGrowth.some(g=>!g||typeof g.key!=='string'||!s.cats.some(c=>c.id===g.id)||!Number.isInteger(g.from)||!Number.isInteger(g.to)||g.from<1||g.to>10||g.to<=g.from||![g.before,g.after].every(v=>v&&['hp','atk','speed'].every(k=>Number.isFinite(v[k])&&v[k]>0)))))return false;
    if(s.pendingWelcomes!==undefined&&(!Array.isArray(s.pendingWelcomes)||new Set(s.pendingWelcomes).size!==s.pendingWelcomes.length||s.pendingWelcomes.some(id=>!s.cats.some(c=>c.id===id))))return false;
    if(s.studyXP!==undefined&&(!Number.isInteger(s.studyXP)||s.studyXP<0||s.studyXP>10000))return false;
    if(s.patrolAt!==undefined&&(!Number.isFinite(s.patrolAt)||s.patrolAt<0))return false;
    if(s.failureGrants!==undefined&&(!s.failureGrants||typeof s.failureGrants!=='object'||Array.isArray(s.failureGrants)||Object.entries(s.failureGrants).some(([k,v])=>!/^([1-9]|10)$/.test(k)||!Number.isInteger(v)||v<0||v>2)))return false;
    const ids=new Set();
    for(const c of s.cats){if(!Number.isSafeInteger(c.id)||c.id<=0||!Growth.valid(c)||ids.has(c.id)||typeof c.name!=='string'||c.name.length>16||![0,1,2].includes(c.color)||![0,1,2].includes(c.pattern)||![0,1].includes(c.ears)||!Number.isInteger(c.skill)||c.skill<0||c.skill>=SKILLS.length||![c.hp,c.atk,c.speed,c.gen].every(v=>Number.isFinite(v)&&v>0)||!Array.isArray(c.parents)||c.parents.length>2||!(c.mutation===null||Number.isInteger(c.mutation)&&c.mutation>=0&&c.mutation<MUTATIONS.length))return false;ids.add(c.id);}
    if(s.breedingParents!==undefined&&(!Array.isArray(s.breedingParents)||s.breedingParents.length!==2||new Set(s.breedingParents).size!==2||!s.breedingParents.every(id=>ids.has(id))))return false;
    return s.cats.every(c=>c.parents.every(id=>ids.has(id)&&id<c.id))&&Number.isSafeInteger(s.nextId)&&s.nextId>Math.max(...ids)&&s.team.length<=3&&new Set(s.team).size===s.team.length&&s.team.every(id=>ids.has(id))&&s.cleared.every((n,i)=>Number.isInteger(n)&&n===i+1)&&s.seen.every(k=>/^([0-2])-([0-2])-([0-1])$/.test(k))&&Number.isInteger(s.bred)&&s.bred>=0&&Number.isInteger(s.battles)&&s.battles>=0&&(s.pendingReveal===null||ids.has(s.pendingReveal));
  }
  const choose=(a,b,rng)=>rng()<.5?a:b;
  const GENE_CAP={hp:180,atk:36,speed:18};
  function geneRange(a,b,field){const cap=GENE_CAP[field];return range(Math.min(cap,a),Math.min(cap,b)).map(v=>Math.min(cap,v));}
  function geneRoll(a,b,field,rng){const [lo,hi]=geneRange(a,b,field);return lo+Math.floor(rng()*(hi-lo+1));}
  function range(a,b){return [Math.max(1,Math.floor(Math.min(a,b)*.95)),Math.ceil(Math.max(a,b)*1.1)];}
  function rollRange(a,b,rng){const [lo,hi]=range(a,b);return lo+Math.floor(rng()*(hi-lo+1));}
  function preview(a,b){const fields=['hp','atk','speed'],raw=Object.fromEntries(fields.map(f=>[f,geneRange(a[f],b[f],f)])),limits={};for(const f of fields){limits[f]=[0,1].map((bound)=>{const v=raw[f][bound],total=fields.reduce((sum,k)=>sum+(k===f?v:raw[k][1-bound])/GENE_CAP[k],0);return Math.round(v*Math.min(1,2.65/total));});}return{color:[...new Set([a.color,b.color])],pattern:[...new Set([a.pattern,b.pattern])],ears:[...new Set([a.ears,b.ears])],skill:[...new Set([a.skill,b.skill])],...limits};}
  function breed(s,aId,bId,rng=Math.random,blessed=false,plan={}){
    migrate(s);
    if(s.pendingReveal)throw Error('先迎接上一只小猫吧。');
    if(aId===bId)throw Error('要选择两只不同的小猫。');
    const a=s.cats.find(c=>c.id===aId),b=s.cats.find(c=>c.id===bId);
    if(!a||!b)throw Error('还没有选好双亲。');const settings=breedPlan(s,plan);if(s.coins<settings.cost)throw Error('还差一些铜钱，去竹林挑战吧。');if(s.geneNotes<settings.notesCost)throw Error('指定突变需要 6 点灵感。');if(s.starDew<settings.dew)throw Error('星露不足，可用 3 点灵感凝成一滴。');
    const c={id:s.nextId++,name:'小团'+s.bred,color:choose(a.color,b.color,rng),pattern:choose(a.pattern,b.pattern,rng),ears:choose(a.ears,b.ears,rng),hp:geneRoll(a.hp,b.hp,'hp',rng),atk:geneRoll(a.atk,b.atk,'atk',rng),speed:geneRoll(a.speed,b.speed,'speed',rng),skill:choose(a.skill,b.skill,rng),gen:Math.max(a.gen,b.gen)+1,parents:[a.id,b.id],mutation:null};
    const budget=c.hp/180+c.atk/36+c.speed/18;if(budget>2.65){const f=2.65/budget;c.hp=Math.round(c.hp*f);c.atk=Math.round(c.atk*f);c.speed=Math.round(c.speed*f);}
    if(settings.focus)c[settings.focus]=a[settings.focus];c.xp=0;const newLook=!s.seen.includes(key(c));
    const directed=settings.mutation!==null,guaranteed=!directed&&blessed&&s.blessings>0;
    if(directed||guaranteed||s.dryStreak>=7||rng()<.08){const unseen=MUTATIONS.map((_,i)=>i).filter(i=>!s.mutationSeen.includes(i)),pool=unseen.length?unseen:MUTATIONS.map((_,i)=>i);c.mutation=directed?settings.mutation:pool[Math.min(pool.length-1,Math.floor(rng()*pool.length))];if(!s.mutationSeen.includes(c.mutation))s.mutationSeen.push(c.mutation);if(c.mutation===0)c.hp+=15;if(c.mutation===1)c.atk+=3;if(c.mutation===2)c.speed+=3;}
    const rareRoll=rarityInfo(s,a,b,settings.dew);c.rareGene=null;
    if(rng()<rareRoll.chance){const heritage=[...new Set([a,b].filter(rare).map(c=>c.rareGene))];const unseen=RARES.map((_,i)=>i).filter(i=>!s.rareSeen.includes(i));c.rareGene=settings.rareMode==='explore'&&unseen.length?unseen[Math.floor(rng()*unseen.length)]:settings.rareMode==='inherit'&&heritage.length&&rng()<.6?heritage[Math.floor(rng()*heritage.length)]:Math.floor(rng()*RARES.length);const bonus=RARES[c.rareGene];c.hp+=bonus.hp;c.atk+=bonus.atk;c.speed+=bonus.speed;if(!s.rareSeen.includes(c.rareGene))s.rareSeen.push(c.rareGene);}
    s.starDew-=settings.dew;s.rareDryStreak=rare(c)?0:s.rareDryStreak+1;
    if(guaranteed)s.blessings--;
    s.dryStreak=c.mutation===null?s.dryStreak+1:0;
    const names=['芽芽','糯米','阿栗','小满','青团','麦芽','小雨','豆包','桂圆','花卷'];c.name=names[s.bred%names.length]+(s.bred>=10?Math.floor(s.bred/10)+1:'');
    s.geneNotes-=settings.notesCost;const notesEarned=(newLook?1:2)+(rare(c)?3:0);s.geneNotes+=notesEarned;c.birthReport={newLook,notesEarned,targetHit:s.targetLook===key(c),focused:settings.focus,rareGene:c.rareGene,rareChance:rareRoll.chance,dewSpent:settings.dew,rareMode:settings.rareMode};
    s.breedingParents=[aId,bId];s.coins-=settings.cost;s.bred++;s.cats.push(c);s.pendingReveal=c.id;if(!s.seen.includes(key(c)))s.seen.push(key(c));return c;
  }
  function adopt(s,rng=Math.random){const id=s.nextId++;const c={id,name:['苔团','竹露','岩岩','风铃','月芽'][s.cleared.length/2-1],color:[2,1,0,2,1][s.cleared.length/2-1],pattern:[0,1,2,2,0][s.cleared.length/2-1],ears:[0,0,1,1,1][s.cleared.length/2-1],hp:130+Math.floor(rng()*30),atk:24+Math.floor(rng()*8),speed:10+Math.floor(rng()*8),skill:2+(s.cleared.length/2-1)%4,gen:1,parents:[],mutation:null};s.cats.push(c);s.pendingWelcomes.push(c.id);if(!s.seen.includes(key(c)))s.seen.push(key(c));return c;}
  function createBattle(s,level,mode='story',challengeId=null){
    migrate(s);if(!['story','trail','challenge'].includes(mode))throw Error('试炼类型不正确。');if(mode==='trail'&&!s.cleared.includes(10))throw Error('通关第 10 关后开启远行。');if(mode==='trail')level=10;const challenge=mode==='challenge'?Objectives.challenges.find(c=>c.id===challengeId):null;if(mode==='challenge'){if(!challenge||!s.cleared.includes(challenge.level))throw Error('先通关对应关卡，再进行这项挑战。');level=challenge.level;const missing=Objectives.challengeSetup(s,challenge.id);if(missing.length)throw Error(missing.join('；'));}
    const team=s.team.map(id=>s.cats.find(c=>c.id===id)).filter(Boolean);if(team.length!==3)throw Error('请选择三只猫出战。');
    const max=Math.min(10,(s.cleared.length?Math.max(...s.cleared):0)+1);if(!Number.isInteger(level)||level<1||level>max)throw Error('先完成前面的试炼。');
    const units=team.map((base,i)=>{const c=trained(base);return {...c,uid:'p'+i,side:0,life:c.hp,maxHp:c.hp,shield:(i===0?20:0)+Growth.shield(c),poison:0,isVanguard:i===0,...FORMATION[i]};});
    const rule=encounter(s,level,mode),floor=mode==='trail'?rule.floor:0;
    if(s.tactic==='guard')units[0].shield+=15;
    for(let i=0;i<3;i++){let hp=74+level*12+floor*7;units.push({id:-i-1,uid:'e'+i,side:1,name:['竹团','灰灰','阿斑'][i],color:(i+level)%3,pattern:i,ears:i%2,skill:rule.skills[i],hp,life:hp,maxHp:hp,atk:11+level*3+Math.floor(floor/2),speed:6+level+i+Math.floor(floor/5),shield:rule.shield||0,poison:0,mutation:null,rareGene:null,x:i*2,y:0});}
    for(const u of units.filter(u=>u.side===0)){if(u.mutation===4){const friend=units.filter(a=>a.side===u.side&&a.uid!==u.uid).sort((a,z)=>a.maxHp-z.maxHp)[0];if(friend)friend.shield+=Math.round(18*Growth.support(u));}if(u.rareGene===0)for(const ally of units.filter(a=>a.side===0))ally.shield+=Math.round(10*Growth.support(u));if(u.rareGene===4)for(const ally of units.filter(a=>a.side===0))ally.speed+=2;}
    return {blocks:[{x:2,y:2}],challengeId:challenge?.id||null,level,mode,floor,tactic:s.tactic,rule:challenge?challenge.name+' · '+challenge.tier+'阶':rule.name,units,round:1,queue:[],log:[],result:null,settled:false,last:null,turn:0};
  }
  function step(b,rng=Math.random){
    if(b.result)return b.last;
    const alive=side=>b.units.filter(u=>u.side===side&&u.life>0),check=()=>{if(!alive(1).length)b.result='win';else if(!alive(0).length||b.round>40)b.result='lose';};
    if(!b.queue.length){b.queue=b.units.filter(u=>u.life>0).sort((a,z)=>(z.speed+(z.skill===4?5:0))-(a.speed+(a.skill===4?5:0))).map(u=>u.uid);if(b.turn)b.round++;}if(b.round>40){b.result='lose';return null;}
    const uid=b.queue.shift(),actor=b.units.find(u=>u.uid===uid);b.turn++;if(!actor||actor.life<=0){check();b.last=null;return null;}
    const events=[],effects=[],log=t=>{b.log.unshift(t);events.push(t);},from={x:actor.x,y:actor.y};let path=[],castName='';actor.actions=(actor.actions||0)+1;const ready=!(actor.cooldown>0);if(actor.cooldown>0)actor.cooldown--;if(actor.taunt>0)actor.taunt--;const cast=()=>{actor.cooldown=2;castName=SKILLS[actor.skill].name;};
    const record=(target,amount,kind)=>{if(actor.rooted>0)actor.rooted--;if(actor.freezeWard>0)actor.freezeWard--;b.last={actor:uid,target:target.uid,amount,kind,events,effects,path,skillName:castName||(kind==='attack'&&[1,2,6,7,8,9,10,11].includes(actor.skill)?'普攻':SKILLS[actor.skill].name),from,to:{x:actor.x,y:actor.y}};b.log=b.log.slice(0,18);check();return b.last;};
    if(actor.poison){const loss=Math.min(actor.life,6);actor.life-=loss;actor.poison--;effects.push({uid,kind:'poison',amount:loss});log(actor.name+'受到 '+loss+' 点毒伤');}
    if(actor.life<=0)return record(actor,6,'poison');
    if(actor.regen>0){const amount=Math.min(actor.regenPower||8,actor.maxHp-actor.life);actor.life+=amount;actor.regen--;if(amount){effects.push({uid,kind:'heal',amount});log(actor.name+'回春恢复 '+amount+' 生命');}}
    if(actor.mutation===8&&actor.life<actor.maxHp/2){const amount=Math.min(6,actor.maxHp-actor.life);actor.life+=amount;effects.push({uid,kind:'heal',amount});log(actor.name+'动用肚肚储备，恢复 '+amount+' 生命');}
    if(actor.frozen>0){actor.frozen--;actor.freezeWard=2;log(actor.name+'被冻结，暂停一次行动');return record(actor,0,'frozen');}
    if(actor.rareGene===2){const friend=alive(actor.side).sort((a,z)=>a.life/a.maxHp-z.life/z.maxHp)[0],amount=Math.min(Math.round(8*Growth.support(actor)),friend.maxHp-friend.life);if(amount){friend.life+=amount;effects.push({uid:friend.uid,kind:'heal',amount});log(actor.name+'的莲息恢复 '+amount+' 生命');}}
    const enemies=alive(1-actor.side);if(!enemies.length){check();return null;}
    const tactic=b.tactic||'balanced',closest=enemies.filter(u=>distance(u,actor)===Math.min(...enemies.map(v=>distance(v,actor))));
    const provoking=enemies.filter(u=>u.taunt>0).sort((a,z)=>distance(a,actor)-distance(z,actor));
    const target=provoking[0]||(actor.side===0&&tactic==='focus'?[...enemies].sort((a,z)=>a.life-z.life||distance(a,actor)-distance(z,actor))[0]:actor.side===1&&tactic==='guard'&&rng()<.35?enemies[0]:closest[Math.floor(rng()*closest.length)]);
    let amount=0,kind='attack',hitTarget=target;
    if(actor.skill===6&&ready){cast();actor.taunt=2;const shield=Math.round(30*Growth.support(actor));actor.shield+=shield;effects.push({uid,kind:'shield',amount:shield});log(actor.name+'摇铃挑衅，吸引敌人并获得 '+shield+' 护盾');return record(actor,shield,'taunt');}
    if(actor.skill===8&&ready){const friend=alive(actor.side).sort((a,z)=>Number(!!(z.poison||z.frozen||z.rooted))-Number(!!(a.poison||a.frozen||a.rooted))||a.life/a.maxHp-z.life/z.maxHp)[0];if(friend.poison||friend.frozen||friend.rooted||friend.life<friend.maxHp){cast();friend.poison=0;friend.frozen=0;friend.rooted=0;friend.regen=2;friend.regenPower=Math.round(8*Growth.support(actor));const healing=Math.min(Math.round(8*Growth.support(actor)),friend.maxHp-friend.life);friend.life+=healing;effects.push({uid:friend.uid,kind:'heal',amount:healing},{uid:friend.uid,kind:'cleanse',amount:0});log(actor.name+'净化'+friend.name+'，回春持续两次行动');return record(friend,healing,'cleanse');}}
    if(actor.skill===9&&ready){cast();for(const ally of alive(actor.side)){ally.fury=2;effects.push({uid:ally.uid,kind:'rally',amount:0});}log(actor.name+'鼓舞全队，下两次攻击行动伤害增加 25%');return record(actor,0,'rally');}
    if((actor.skill===1||actor.skill===2)&&b.round%3===1&&(actor.skill===1||alive(actor.side).some(u=>u.life<u.maxHp))){const friend=alive(actor.side).sort((a,z)=>a.life/a.maxHp-z.life/z.maxHp)[0];hitTarget=friend;const bonus=(actor.side===0&&tactic==='balanced'?1.15:1)*Growth.support(actor);if(actor.skill===1){amount=Math.round(actor.atk*1.3*bonus);friend.shield+=amount;kind='shield';log(actor.name+'为'+friend.name+'添上 '+amount+' 护盾');}else{amount=Math.min(friend.maxHp-friend.life,Math.round((actor.atk*1.3+12)*bonus));friend.life+=amount;kind='heal';log(actor.name+'为'+friend.name+'恢复 '+amount+' 生命');}}
    else{
      path=approach(b,actor,target);if(path.length){Object.assign(actor,path.at(-1));if(actor.mutation===3){actor.springReady=true;log(actor.name+'的弹簧腿蓄好劲了');}if(actor.mutation===5&&actor.poison){actor.poison=0;effects.push({uid,kind:'cleanse',amount:0});log(actor.name+'拖尾一走，扫掉剩余毒伤');}}
      if(Number.isInteger(actor.x)&&(distance(actor,target)>attackRange(actor)||!lineClear(b,actor,target))){log(actor.name+(path.length?'接近敌人':'等待通路'));return record(target,0,'move');}
      const special=ready&&[7,10,11].includes(actor.skill),mult=special&&actor.skill===7?.5:special&&actor.skill===11?.6:1;if(special)cast();const furyBonus=actor.fury>0?1.25:1;if(actor.fury>0)actor.fury--;
      const springBonus=actor.springReady?1.35:1;actor.springReady=false;
      const count=actor.skill===0?2:actor.skill===4&&rng()<.25?2:1,starBonus=actor.rareGene===1&&!actor.starUsed?1.25:1;
      for(let i=0;i<count&&target.life>0&&actor.life>0;i++){let d=Math.max(1,Math.round(actor.atk*(actor.skill===0?.65:1)*(actor.side===0&&tactic==='guard'?.95:actor.side===0&&tactic==='focus'?1.08:1)*(actor.side===1&&tactic==='guard'&&target.isVanguard?.9:1)*starBonus*(actor.firstStrikeUsed?1:Growth.firstStrike(actor))*mult*furyBonus*springBonus));const absorb=Math.min(target.shield,d);target.shield-=absorb;d-=absorb;d=Math.min(target.life,d);target.life-=d;amount+=d;if(target.skill===5&&target.life>0){let counter=Math.round(target.atk*.45*(actor.side===0&&tactic==='guard'&&actor.isVanguard?.9:1));const blocked=Math.min(actor.shield,counter);actor.shield-=blocked;counter=Math.min(actor.life,counter-blocked);actor.life-=counter;effects.push({uid:actor.uid,kind:'counter',amount:counter});log(target.name+'反击 '+counter);}}
      if(actor.life>0&&target.life>0&&special){if(actor.skill===7){if(target.mutation===6&&!target.earGuardUsed){target.earGuardUsed=true;effects.push({uid:target.uid,kind:'cleanse',amount:0});log(target.name+'抖开长耳，挡下这次冰冻');}else if(!target.freezeWard){target.frozen=1;effects.push({uid:target.uid,kind:'freeze',amount:0});log(target.name+'被冰铃冻结');}else log(target.name+'刚刚解冻，抵抗了再冻结');}if(actor.skill===11){target.rooted=2;effects.push({uid:target.uid,kind:'root',amount:0});log(target.name+'被藤蔓定身两次行动');}if(actor.skill===10){const dx=target.x-actor.x,dy=target.y-actor.y,p={x:target.x+Math.sign(dx),y:target.y+Math.sign(dy)};if(target.mutation===7){log(target.name+'的方脑壳稳稳顶住，没有被推走');}else if(freeCell(b,p)){effects.push({uid:target.uid,kind:'push',amount:0,from:{x:target.x,y:target.y},to:p});Object.assign(target,p);log(target.name+'被推远一格');}else{const absorb=Math.min(target.shield,8);target.shield-=absorb;const d=Math.min(target.life,8-absorb);target.life-=d;amount+=d;log(target.name+'退路受阻，额外受到 '+d+' 伤害');}}}
      if(actor.mutation===9&&actor.life>0&&target.life>0&&distance(actor,target)<=1){let bite=Math.max(1,Math.round(actor.atk*.3)),blocked=Math.min(target.shield,bite);target.shield-=blocked;bite=Math.min(target.life,bite-blocked);target.life-=bite;amount+=bite;log(actor.name+'的尾巴补了一嘴，造成 '+bite+' 伤害');if(target.skill===5&&target.life>0){let counter=Math.round(target.atk*.45*(actor.side===0&&tactic==='guard'&&actor.isVanguard?.9:1));const absorb=Math.min(actor.shield,counter);actor.shield-=absorb;counter=Math.min(actor.life,counter-absorb);actor.life-=counter;effects.push({uid,kind:'counter',amount:counter});log(target.name+'反击尾巴 '+counter);}}
      actor.starUsed=true;actor.firstStrikeUsed=true;if(actor.skill===3&&target.life>0)target.poison=2;
      if(actor.life>0&&actor.rareGene===3){const other=alive(1-actor.side).find(u=>u.uid!==target.uid);if(other){const absorb=Math.min(other.shield,6);other.shield-=absorb;const damage=Math.min(other.life,6-absorb);other.life-=damage;effects.push({uid:other.uid,kind:'splash',amount:damage});log(actor.name+'的余雷造成 '+damage+' 伤害');}}
      if(actor.life>0&&actor.rareGene===5&&amount>0){const heal=Math.min(actor.maxHp-actor.life,Math.round(amount*.25*Growth.support(actor)));actor.life+=heal;if(heal)effects.push({uid:actor.uid,kind:'heal',amount:heal});}
      log(actor.name+(count===2?'连挥两爪':'出爪')+'，'+target.name+'受到 '+amount+' 伤害');
    }
    effects.push({uid:hitTarget.uid,kind,amount});return record(hitTarget,amount,kind);
  }
  function addXP(s,c,amount,source='历练'){
    const before=levelInfo(c).level,oldStats=trained(c);c.xp=Math.min(10000,(c.xp||0)+amount);const after=levelInfo(c).level;
    if(after<=before)return null;const next=trained(c),g={key:source+'-'+s.battles+'-'+c.id+'-'+after+'-'+c.xp,id:c.id,name:c.name,level:after,from:before,to:after,before:{hp:oldStats.hp,atk:oldStats.atk,speed:oldStats.speed},after:{hp:next.hp,atk:next.atk,speed:next.speed}};s.pendingGrowth.push(g);return g;
  }
  function settle(s,b,rng=Math.random){
    if(!b.result||b.settled)return null;migrate(s);b.settled=true;s.battles++;if(b.mode==='challenge')return settleChallenge(s,b);
    const win=b.result==='win',trail=b.mode==='trail',first=win&&!trail&&!s.cleared.includes(b.level),stars=battleStars(b),oldStars=s.stageStars[b.level]||0,newStars=!trail&&win?Math.max(0,stars-oldStars):0;
    const members=b.units.filter(u=>u.side===0).map(u=>s.cats.find(c=>c.id===u.id)).filter(Boolean),debut=win&&!trail?members.filter(c=>!c.trialWins.includes(b.level)):[];
    const consolation=!win&&(s.failureGrants[b.level]||0)<2;if(consolation)s.failureGrants[b.level]=(s.failureGrants[b.level]||0)+1;
    const reward=win?(trail?180+b.floor*5:(first?150+b.level*10:0)+newStars*40+(!first?debut.length*20:0)):consolation?20:0;
    s.coins+=reward;let newcomer=null;if(first){s.cleared.push(b.level);s.cleared.sort((a,z)=>a-z);if(b.level%2===0)newcomer=adopt(s,rng);}
    if(!trail&&win)s.stageStars[b.level]=Math.max(oldStars,stars);for(const c of debut)c.trialWins.push(b.level);
    const notes=win?(trail?2:newStars>0||debut.length>0?1:0):0;s.geneNotes+=notes;const dew=win&&(trail||newStars>0)?1:0;s.starDew+=dew;if(trail&&win)s.trailBest=Math.max(s.trailBest,b.floor);
    const levelUps=[],xpByCat=[];for(const c of members){const xp=levelInfo(c).level>=10?0:win?(trail?40:debut.includes(c)?20+b.level*5:newStars>0?10:0):consolation?8:0;const g=addXP(s,c,xp);if(g)levelUps.push(g);xpByCat.push({id:c.id,name:c.name,xp});}
    return{reward,first,newcomer,win,stars,newStars,notes,dew,xp:Math.max(0,...xpByCat.map(x=>x.xp)),xpByCat,levelUps,trail,floor:b.floor||0,debuts:debut.map(c=>c.id),practice:!reward&&!notes&&!dew&&xpByCat.every(x=>!x.xp)};
  }
  function settleChallenge(s,b){const check=Objectives.checkChallenge(b);if(!check)throw Error('挑战规则不存在。');const d=check.definition,first=check.passed&&!s.objectives.challengeWins.includes(d.id);if(first)s.objectives.challengeWins.push(d.id);const reward=first?d.coins:0,notes=first?d.notes:0,dew=first?d.dew:0;s.coins+=reward;s.geneNotes+=notes;s.starDew+=dew;const levelUps=[],xpByCat=[];for(const u of b.units.filter(u=>u.side===0)){const c=s.cats.find(c=>c.id===u.id),xp=first&&levelInfo(c).level<10?d.xp:0,g=addXP(s,c,xp,'挑战');if(g)levelUps.push(g);xpByCat.push({id:c.id,name:c.name,xp});}return{reward,notes,dew,first,win:b.result==='win',newcomer:null,stars:0,newStars:0,xp:Math.max(0,...xpByCat.map(c=>c.xp)),xpByCat,levelUps,trail:false,debuts:[],practice:!first,challenge:{...check,first}};}
  function patrolInfo(s,now=Date.now()){const minutes=Math.max(0,Math.min(480,Math.floor((now-s.patrolAt)/60000))),level=s.cleared.length;return{minutes,coins:level?Math.floor(minutes*(1+level*.2)):0,xp:level?Math.floor(minutes*(.15+level*.05)):0,capHours:8};}
  function claimPatrol(s,now=Date.now()){migrate(s);const p=patrolInfo(s,now);if(!p.coins&&!p.xp)throw Error('通关后小队会在离线时巡游；稍后再来领取。');s.coins+=p.coins;s.studyXP=Math.min(10000,s.studyXP+p.xp);s.patrolAt=now;return p;}
  function train(s,id){migrate(s);const c=s.cats.find(c=>c.id===Number(id));if(!c||levelInfo(c).level>=10)throw Error('请选择还未满级的小猫。');if(s.coins<80)throw Error('陪伴特训需要 80 铜钱。');s.coins-=80;addXP(s,c,40,'特训');return 40;}
  function study(s,id){migrate(s);const c=s.cats.find(c=>c.id===Number(id));if(!c||levelInfo(c).level>=10)throw Error('请选择还未满级的小猫。');const amount=Math.min(40,s.studyXP);if(!amount)throw Error('巡游会积累心得，可用来帮助新伙伴追赶。');s.studyXP-=amount;addXP(s,c,amount,'心得');return amount;}
  function mentor(s,teacherId,studentId){migrate(s);const a=s.cats.find(c=>c.id===Number(teacherId)),b=s.cats.find(c=>c.id===Number(studentId));if(!a||!b||a.id===b.id||a.growthRank!==2||b.mentored||levelInfo(b).level>=3)throw Error('结业的猫可指导一只尚未 Lv.3、且未受过指导的伙伴。');if(s.coins<100||s.geneNotes<1)throw Error('指导需要 100 铜钱和 1 点灵感。');s.coins-=100;s.geneNotes--;b.mentored=true;addXP(s,b,Math.max(0,64-b.xp),'传习');return b;}
  const WISHES=[
    {id:'first',name:'初次相逢',desc:'亲手迎接一只第二代小猫',hint:'橘团和云朵都可以作为双亲。',coins:120,leaves:0,target:1},
    {id:'colors',name:'四种小模样',desc:'发现 4 种不同的基础外观组合',hint:'毛色、花纹或耳型不同，都算一种新模样。',coins:180,leaves:1,target:4},
    {id:'round',name:'圆耳小老虎',desc:'培育一只圆耳、虎纹的后代',hint:'选一只有虎纹的猫，搭配一只圆耳猫；毛色不限。',coins:200,leaves:1,target:2},
    {id:'guard',name:'小院守护者',desc:'培育天生生命至少 150、拥有护盾的后代',hint:'保留护盾本领，搭配生命更高的双亲。叶芽尾也能增加生命。',coins:250,leaves:1,target:2},
    {id:'family',name:'代代有回声',desc:'家族延续到第三代',hint:'让第二代小猫参与繁育，故事就能继续。',coins:280,leaves:1,target:3},
    {id:'wonder',name:'林间小奇迹',desc:'收集任意一种特殊突变',hint:'心愿叶能让下一次繁育必出突变；第 8 次连续未出突变的繁育也必出。',coins:300,leaves:1,target:1},
    {id:'album',name:'满院十八样',desc:'点亮 18 种基础外观图鉴',hint:'挑战试炼迎接山客，引入新的毛色、花纹与耳型。',coins:800,leaves:3,target:18}
  ];
  function migrate(s){
    if(!s||s.version!==2)return s;
    Objectives.migrate(s);
    if(!Array.isArray(s.breedingParents)){const last=[...s.cats].reverse().find(c=>c.parents?.length===2);s.breedingParents=last?[...last.parents]:s.cats.slice(0,2).map(c=>c.id);}
    if(!Array.isArray(s.pendingWelcomes))s.pendingWelcomes=[];
    if(!Array.isArray(s.pendingGrowth))s.pendingGrowth=[];
    if(!s.failureGrants)s.failureGrants={};if(!Number.isInteger(s.studyXP))s.studyXP=0;if(!Number.isFinite(s.patrolAt))s.patrolAt=Date.now();
    for(const c of s.cats){Growth.migrate(c);if(!Array.isArray(c.learnedSkills))c.learnedSkills=[c.skill];if(typeof c.lessonUsed!=='boolean')c.lessonUsed=false;}
    if(!Array.isArray(s.wishClaims))s.wishClaims=[];
    if(!Number.isInteger(s.geneNotes))s.geneNotes=0;
    if(!s.stageStars)s.stageStars={};
    if(!Number.isInteger(s.starDew))s.starDew=3;
    if(!Number.isInteger(s.rareDryStreak))s.rareDryStreak=0;
    if(!Array.isArray(s.mutationSeen))s.mutationSeen=[];for(const c of s.cats)if(Number.isInteger(c.mutation)&&c.mutation>=0&&c.mutation<MUTATIONS.length&&!s.mutationSeen.includes(c.mutation))s.mutationSeen.push(c.mutation);
    if(!Array.isArray(s.rareSeen))s.rareSeen=[...new Set(s.cats.filter(rare).map(c=>c.rareGene))];
    for(const c of s.cats)if(c.rareGene===undefined)c.rareGene=null;
    if(!Number.isInteger(s.trailBest))s.trailBest=0;
    if(!TACTICS.some(t=>t.id===s.tactic))s.tactic='balanced';
    if(s.targetLook===undefined)s.targetLook=null;
    if(s.geneGuestClaimed===undefined)s.geneGuestClaimed=false;
    for(const c of s.cats)if(!Number.isInteger(c.xp))c.xp=0;
    if(!Number.isInteger(s.blessings)||s.blessings<0)s.blessings=0;
    if(!Number.isInteger(s.dryStreak)||s.dryStreak<0){s.dryStreak=0;for(const c of [...s.cats].reverse()){if(!c.parents.length)continue;if(c.mutation!==null)break;s.dryStreak++;}s.dryStreak=Math.min(7,s.dryStreak);}
    return s;
  }
  function wishProgress(s,w){
    const born=s.cats.filter(c=>c.parents.length===2);let current=0;
    if(w.id==='first')current=Math.min(1,born.length);
    if(w.id==='colors'||w.id==='album')current=s.seen.length;
    if(w.id==='round')current=Math.max(0,...born.map(c=>Number(c.ears===1)+Number(c.pattern===1)));
    if(w.id==='guard')current=Math.max(0,...born.map(c=>Number(c.hp>=150)+Number(c.skill===1)));
    if(w.id==='family')current=Math.max(...s.cats.map(c=>c.gen));
    if(w.id==='wonder')current=s.cats.some(c=>c.mutation!==null)?1:0;
    current=Math.min(w.target,current);return {current,target:w.target,done:current>=w.target};
  }
  function activeWish(s){migrate(s);return WISHES.find(w=>!s.wishClaims.includes(w.id))||null;}
  function claimWish(s,id){const w=activeWish(s);if(!w||w.id!==id||!wishProgress(s,w).done)return null;s.wishClaims.push(id);s.coins+=w.coins;s.blessings+=w.leaves;return w;}
  function canSkip(){return true;}
  function fastForward(s,b,rng=Math.random){let guard=0;while(!b.result&&guard++<1000)step(b,rng);if(!b.result)throw Error('战斗还未完成，请继续观战。');return b.result;}
  const TACTICS=[
    {id:'balanced',name:'均衡照应',desc:'优先接近最近的敌人；治疗与护盾效果增加 15%。'},
    {id:'focus',name:'集中火力',desc:'优先攻击剩余生命最少的敌人，出爪伤害增加 8%；注意绕路与被挑衅。'},
    {id:'guard',name:'守护阵型',desc:'敌人有 35% 概率优先攻击前排；前排额外获 15 护盾（合计 35）、受直伤减 10%，全队出爪伤害减 5%。'}
  ];
  const ENCOUNTERS=[
    {name:'初入竹林',skills:[4,4,4],tip:'先组成三猫小队。护盾能替伙伴挡下第一轮攻击。'},
    {name:'山客的考验',skills:[1,2,0],tip:'敌人会治疗。集中火力能尽早减少敌方人数；通关迎来青灰素色山客。'},
    {name:'青甲守卫',skills:[6,1,0],shield:12,tip:'敌人带盾入场。连续攻击能破盾，毒伤可以绕过护盾。'},
    {name:'毒爪巡游',skills:[3,0,3],tip:'毒伤会持续消耗生命。带上治愈猫，或集火快速减少敌人。'},
    {name:'回春小队',skills:[8,1,2],tip:'春风能清除毒与控制，还会持续回血。集中火力突破治疗组合。'},
    {name:'疾风追逐',skills:[4,7,0],tip:'冰铃会冻结一次行动。春风能净化控制，迅捷适合尽早接敌。'},
    {name:'荆棘山路',skills:[5,1,5],tip:'直接攻击会触发反击。毒爪、护盾与治愈能减轻消耗。'},
    {name:'长路相伴',skills:[11,8,1],tip:'藤蔓限制移动，但不阻止攻击。远程本领或春风净化能帮助接敌。'},
    {name:'月下突袭',skills:[10,0,5],tip:'推掌会改变站位，撞上障碍还有额外伤害。用控制或远程保持距离。'},
    {name:'山顶守望',skills:[6,9,2],shield:22,tip:'挑衅保护鼓舞与治疗。利用毒爪消耗守卫，再以净化和控制维持节奏。'}
  ];
  function levelInfo(c){return Growth.info(c);}
  function trained(c){const v=Growth.stats(c);if([3,9].includes(c.mutation))v.hp=Math.max(1,Math.round(v.hp*.9));if(c.mutation===10)v.hp=Math.max(1,Math.round(v.hp*.88));if([4,5].includes(c.mutation))v.speed=Math.max(1,v.speed-2);if(c.mutation===6)v.speed=Math.max(1,v.speed-1);if([7,8].includes(c.mutation))v.atk=Math.max(1,v.atk-2);return v;}
  function lookName(k){if(!k)return '';const [color,pattern,ears]=k.split('-').map(Number);return COLORS[color]+PATTERNS[pattern]+EARS[ears];}
  function breedPlan(s,plan={}){const focus=plan.focus||null,mutation=plan.mutation??null;if(focus&&!['color','pattern','ears','skill'].includes(focus))throw Error('遗传方向不正确。');if(mutation!==null&&(!Number.isInteger(mutation)||mutation<0||mutation>=MUTATIONS.length))throw Error('突变方向不正确。');if(mutation>=3&&!s.mutationSeen?.includes(mutation))throw Error('先自然发现这类突变，再指定培养。');const dew=plan.dew??0;if(!Number.isInteger(dew)||dew<0||dew>3)throw Error('每次可投入 0 至 3 滴星露。');const rareMode=plan.rareMode||'explore';if(!['explore','inherit'].includes(rareMode))throw Error('稀有方向不正确。');return {focus,mutation,dew,rareMode,cost:100+(focus?20:0),notesCost:mutation===null?0:6};}
  function possibilities(s,a,b,focus=null){const choices=f=>focus===f?[a[f]]:[...new Set([a[f],b[f]])],out=[];for(const color of choices('color'))for(const pattern of choices('pattern'))for(const ears of choices('ears'))out.push({color,pattern,ears,mutation:null});const chance=1/out.length;return {outcomes:out.map(c=>({...c,chance,newLook:!s.seen.includes(key(c))})),novelChance:out.filter(c=>!s.seen.includes(key(c))).length*chance,targetChance:s.targetLook&&out.some(c=>key(c)===s.targetLook)?chance:0};}
  function recommendPair(s){const groups=new Map(),power=c=>c.hp+c.atk*3+c.speed*2;for(const c of s.cats){const k=key(c),group=groups.get(k)||[];group.push(c);group.sort((a,b)=>power(b)-power(a));groups.set(k,group.slice(0,2));}const pool=[...groups.values()].flat();let best=null;for(let i=0;i<pool.length;i++)for(let j=i+1;j<pool.length;j++){const a=pool[i],b=pool[j],p=possibilities(s,a,b),chance=s.targetLook?p.targetChance:p.novelChance,total=power(a)+power(b);if(!best||chance>best.chance||chance===best.chance&&total>best.power)best={ids:[a.id,b.id],chance,power:total};}return best;}
  function missingGenes(s){return ['color','pattern','ears'].some((f)=>new Set(s.cats.map(c=>c[f])).size<(f==='ears'?2:3));}
  function canWelcome(s){return s.cleared.includes(2)&&!s.geneGuestClaimed&&missingGenes(s);}
  function welcomeGuest(s){migrate(s);if(!canWelcome(s))return null;const missing=(f,n)=>Array.from({length:n},(_,i)=>i).find(i=>!s.cats.some(c=>c[f]===i))??0;const c={id:s.nextId++,name:'拾叶',color:missing('color',3),pattern:missing('pattern',3),ears:missing('ears',2),hp:145,atk:27,speed:13,skill:2,gen:1,parents:[],mutation:null,xp:0};s.geneGuestClaimed=true;s.cats.push(c);s.pendingWelcomes.push(c.id);if(!s.seen.includes(key(c)))s.seen.push(key(c));return c;}
  function encounter(s,level,mode='story'){if(mode==='trail'){const floor=s.trailBest+1,kind=(floor-1)%3;return {name:['毒雾远行','青甲远行','疾风远行'][kind],skills:[[3,8,11],[6,5,10],[4,9,7]][kind],shield:kind===1?25+floor:0,tip:['毒爪持续消耗，带治疗猫或尽快集火。','护盾与反击相伴，毒爪能绕过护盾。','敌方行动很快，先保护前排猫。'][kind],floor};}return ENCOUNTERS[level-1];}
  function battleStars(b){if(b.result!=='win')return 0;return 1+Number(b.units.filter(u=>u.side===0).every(u=>u.life>0))+Number(b.round<=8);}

  const RARES=[
    {name:'月角猫',desc:'月角守望：入场时为全队增加 10 护盾。',hp:20,atk:0,speed:0},
    {name:'星尾猫',desc:'彗星初击：第一次出爪伤害增加 25%。',hp:0,atk:4,speed:0},
    {name:'莲耳猫',desc:'莲息：每次行动前为最虚弱的伙伴恢复 8 生命。',hp:12,atk:0,speed:0},
    {name:'雷纹猫',desc:'余雷：出爪后对另一名敌人造成 6 点直接伤害。',hp:0,atk:2,speed:1},
    {name:'云翼猫',desc:'云行：入场时全队速度 +2，自身每次可移动两格。',hp:0,atk:0,speed:3},
    {name:'墨影猫',desc:'墨饮：出爪后恢复实际伤害 25% 的生命。',hp:8,atk:2,speed:0}
  ];
  const rare=c=>Number.isInteger(c?.rareGene)&&c.rareGene>=0&&c.rareGene<RARES.length;
  function rarityInfo(s,a,b,dew=0){const blood=Number(rare(a))+Number(rare(b)),base=2+blood*3+dew*4,pity=s.rareDryStreak>=19;return {chance:pity?1:Math.min(20,base)/100,bloodBonus:blood*3,dewBonus:dew*4,pity,remaining:Math.max(1,20-(s.rareDryStreak||0))};}
  function craftDew(s){migrate(s);if(s.geneNotes<3)throw Error('凝成一滴星露需要 3 点灵感。');s.geneNotes-=3;s.starDew++;return s.starDew;}
  const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
  function lineClear(b,a,z){if(a.x!==z.x&&a.y!==z.y)return true;return !(b.blocks||[]).some(p=>a.x===z.x?p.x===a.x&&p.y>Math.min(a.y,z.y)&&p.y<Math.max(a.y,z.y):p.y===a.y&&p.x>Math.min(a.x,z.x)&&p.x<Math.max(a.x,z.x));}
  function attackRange(u){return (u.skill===11?3:[2,3,7].includes(u.skill)?2:1)+(u.mutation===10?1:0);}
  function approach(b,u,target){if(!Number.isInteger(u.x)||u.rooted)return [];const range=attackRange(u),valid=p=>distance(p,target)<=range&&lineClear(b,p,target);if(valid(u))return [];
    const blocked=new Set([...(b.blocks||[]),...b.units.filter(c=>c.life>0&&c.uid!==u.uid)].map(c=>c.x+','+c.y)),seen=new Set([u.x+','+u.y]),queue=[{x:u.x,y:u.y,path:[]}];let path=[];
    while(queue.length){const p=queue.shift();if(valid(p)){path=p.path;break;}const adjacent=[[p.x+1,p.y],[p.x-1,p.y],[p.x,p.y+1],[p.x,p.y-1]].map(([x,y])=>({x,y})).sort((a,z)=>distance(a,target)-distance(z,target));for(const n of adjacent){const k=n.x+','+n.y;if(n.x<0||n.y<0||n.x>=5||n.y>=5||blocked.has(k)||seen.has(k))continue;seen.add(k);queue.push({...n,path:[...p.path,n]});}}
    const movement=u.skill===4||u.rareGene===4?2:1;return path.slice(0,movement);
  }

  function learnSkill(s,id,skill){migrate(s);const c=s.cats.find(c=>c.id===Number(id));if(!c||!Number.isInteger(skill)||skill<0||skill>=SKILLS.length)throw Error('请选择猫咪与本领。');if(c.skill===skill)return {cost:0,changed:false};const known=c.learnedSkills.includes(skill),cost=known||!c.lessonUsed?0:2;if(s.geneNotes<cost)throw Error('再攒 2 点灵感，就能研习新本领。');s.geneNotes-=cost;if(!known){c.learnedSkills.push(skill);c.lessonUsed=true;}c.skill=skill;return {cost,changed:true};}
  function freeCell(b,p){return p.x>=0&&p.x<5&&p.y>=0&&p.y<5&&!(b.blocks||[]).some(q=>q.x===p.x&&q.y===p.y)&&!b.units.some(q=>q.life>0&&q.x===p.x&&q.y===p.y);}

  const api={Objectives,Growth,GENE_CAP,addXP,patrolInfo,claimPatrol,study,train,mentor,FORMATION,learnSkill,RARES,rare,rarityInfo,craftDew,attackRange,approach,TACTICS,ENCOUNTERS,levelInfo,trained,lookName,breedPlan,possibilities,recommendPair,canWelcome,welcomeGuest,encounter,battleStars,COLORS,PATTERNS,EARS,SKILLS,MUTATIONS,STAGES,key,initial,validate,preview,breed,createBattle,step,settle,WISHES,migrate,wishProgress,activeWish,claimWish,canSkip,fastForward};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;root.GameCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
