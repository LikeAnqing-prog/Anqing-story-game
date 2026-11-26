/* All visible skins, maps, characters and icons use generated raster assets. */
(()=>{'use strict';
const G=window.GameCore, STORE='meow-ink-demo-v2';
const $=s=>document.querySelector(s),screen=$('#screen'),game=$('#game'),modalRoot=$('#modal-root');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const loaded=MeowSave.load();let state=loaded.state,storageOK=loaded.available,loadNotice=loaded.notice;
G.migrate(state);
let page=state.pendingReveal?'reveal':'home',parents=[...state.breedingParents],familyId=state.pendingReveal||state.cats.at(-1).id,filter='all',stage=Math.min(10,(state.cleared.at(-1)||0)+1),battle=null,battleTimer=null,birthTimer=null,speed=1,toastTimer=null;
let navHistory=[],exitNavigation=null,modalHistory=[],modalView=null,modalRoute=null,restoringModal=false,renderedView=null;
const PAGE_NAMES={home:'猫村',academy:'猫咪养成',breed:'繁育小屋',preview:'繁育预览',team:'战前布阵',battle:'自动战斗',book:'图鉴',family:'家族谱系',roster:'猫咪小屋',wishes:'目标册',training:'猫咪学堂',growth:'伙伴修习','long-goals':'长期目标',challenges:'小队挑战',birthing:'等待新生',reveal:'新猫揭晓'};
function pageBackName(){if(page==='breed'&&parentSlot!==null)return '繁育小屋';const prev=navHistory.at(-1);return prev?.overlay?.current?.title||PAGE_NAMES[prev?.page]||'猫村';}
const ASSET=n=>window.__MEOW_ASSETS__?.[n]||('assets/'+n+'.webp');
function rect(name,r,cls=''){const [x,y,w,h]=r;return `<span class="art ${cls}" aria-hidden="true"><img src="${ASSET(name)}" alt="" draggable="false" style="width:${100/w}%;height:${100/h}%;left:${-x/w*100}%;top:${-y/h*100}%"></span>`;}
function skin(kind='panel',index=0) {
  if(kind==='panel') {
    return index===3 ? rect('v2-panels',[.49,.445,.51,.54],'card-art') :
      '<span class="art thin-panel" aria-hidden="true"></span>';
  }
  if(index>=0 && index<6) return `<span class="art paper-skin tone-${index}" aria-hidden="true"></span>`;
  return rect('v2-buttons',[(index%2)*.5,Math.floor(index/2)*.25,.5,.25]);
}
function icon(i,cls=''){return `<span class="icon ${cls}" aria-hidden="true" style="background-position:${i%4/3*100}% ${Math.floor(i/4)/3*100}%"></span>`;}
function mutantAtlas(c){return Number.isInteger(c.mutation)&&c.mutation>=3&&c.mutation<G.MUTATIONS.length?{sheet:c.mutation<7?'v12-mutants-a':'v12-mutants-b',row:(c.mutation-3)%4}:null;}
function mutantSprite(c,cls=''){const a=mutantAtlas(c);return `<span class="sprite mutant-sprite ${cls}" role="img" aria-label="${G.MUTATIONS[c.mutation].name}" style="background-image:url('${ASSET(a.sheet)}');background-size:400% 400%;background-position:0% ${a.row/3*100}%"></span>`;}
function sprite(c,cls=''){if(mutantAtlas(c)&&!G.rare(c))return mutantSprite(c,cls);if(G.rare(c))return `<span class="sprite rare-sprite ${cls}" role="img" aria-label="${G.RARES[c.rareGene].name}" style="background-image:url('${ASSET('v6-rare-cats-clean')}');background-size:300% 200%;background-position:${c.rareGene%3*50}% ${Math.floor(c.rareGene/3)*100}%"></span>`;return `<span class="sprite ${cls}" role="img" aria-label="${G.COLORS[c.color]}${G.PATTERNS[c.pattern]}${G.EARS[c.ears]}猫" style="background-image:url('${ASSET(c.ears?'v2-cats-round':'v2-cats')}');background-position:${c.pattern*50}% ${c.color*50}%">${c.mutation!==null&&c.mutation!==undefined?`<span class="mutation">${icon(G.MUTATIONS[c.mutation].icon)}</span>`:''}</span>`;}
function discoverySprite(c,unlocked){return sprite(c,unlocked?'':'locked-silhouette');}
function rememberParents(){state.breedingParents=[...parents];return save();}
function btn(text,action,opts={}){return `<button type="button" class="skin btn ${opts.cls||''}" data-action="${action}" ${opts.id!==undefined?`data-id="${esc(opts.id)}"`:''} ${opts.disabled?'disabled':''} ${opts.pressed===undefined?'':`aria-pressed="${opts.pressed}"`} ${opts.label?`aria-label="${esc(opts.label)}"`:''}>${opts.cls==='back'||text===''&&opts.icon===13?rect('v8-square-back',[0,0,1,1],'square-back'):skin('button',opts.disabled?4:opts.tone??0)}${opts.icon!==undefined?icon(opts.icon):''}<span>${text}</span></button>`;}
const panel=(content,cls='',type=0)=>`<section class="skin panel ${cls}">${skin('panel',type)}${content}</section>`;
const cat=id=>state.cats.find(c=>c.id===Number(id));
function receiveState(next){clearTimeout(battleTimer);clearTimeout(birthTimer);clearTimeout(levelTimer);battle=null;battlePending=null;battleCue=null;rewardPending=null;levelShowing=null;welcomeShowing=null;growthSession=null;state=G.migrate(next);navHistory=[];parentSlot=null;battleMode='story';challengeId=null;parents=[...state.breedingParents];familyId=state.cats.at(-1).id;stage=Math.min(10,state.cleared.length+1);breedFocus=null;mutationPlan=null;rareDew=0;page=state.pendingReveal?'reveal':'home';closeModal();render();toast('已同步另一窗口的新进度。未结算的挑战可免费重试。');}
function syncSave(){const fresh=MeowSave.latest();if(!fresh)return false;receiveState(fresh);return true;}
function save(){try{const result=MeowSave.commit(state);if(result.conflict){receiveState(result.conflict);return false;}return true;}catch(e){storageOK=false;toast(e.message||'暂时无法保存，请导出手记后再关闭。');return false;}}

function toast(t,html=false){clearTimeout(toastTimer);$('#toast').innerHTML=skin()+`<span>${html?t:esc(t)}</span>`;$('#toast').classList.add('show');toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2600);}
function header(title,sub,back=true){return `<header class="headline">${back?btn(esc(pageBackName()), 'back',{tone:2,cls:'back',icon:13,label:'返回'+pageBackName()}):''}<div class="skin title-box">${skin('button',2)}<p>${sub}</p><h1>${title}</h1></div><div class="skin wallet" aria-label="铜钱 ${state.coins}">${skin('button',1)}${resourceIcon(0)}<span id="coins">${state.coins}</span></div></header>`;}
function nav(active){return `<nav class="nav" aria-label="主要玩法">${[['home',8,'猫村'],['breed',9,'繁育'],['team',10,'出战'],['academy',15,'养成'],['book',11,'图鉴']].map(([a,i,l])=>`<button class="skin ${active===a?'current':''}" data-action="${a}" ${active===a?'aria-current="page"':''}>${skin('button',active===a?1:2)}${icon(i)}<span>${l}</span></button>`).join('')}</nav>`;}
function shell(title,sub,content,active){return header(title,sub)+`<div class="skin scroll-shell">${skin('panel',0)}<main class="scroll-content">${content}</main></div>`+nav(active);}
function card(c,action='detail',selected=false,tag=''){G.Growth.migrate(c);return `<button class="skin cat-card ${selected?'active':''}" data-action="${action}" data-id="${c.id}" aria-label="${esc(c.name)}${selected?'，已选择':''}">${skin('panel',1)}${sprite(c)}<strong>${c.favorite?icon(15,'favorite-star'):''}${esc(c.name)}</strong>${G.rare(c)?'<span class="rare-tag">'+G.RARES[c.rareGene].name+'</span>':''}<span class="small">${G.COLORS[c.color]} · ${G.EARS[c.ears]} · ${c.gen}代</span><span class="small">Lv.${G.levelInfo(c).level} · ${pathName(c)}</span><span class="skill">${skillIcon(c.skill)}${G.SKILLS[c.skill].name}</span>${tag?`<span class="skin selected-mark">${skin('button',1)}<b>${tag}</b></span>`:''}</button>`;}
const TEAM_RECTS=[[0.05263157894736842,0.08452950558213716,0.42025518341307816,0.37719298245614036],[0.5207336523125997,0.0861244019138756,0.42025518341307816,0.3763955342902711],[0.03508771929824561,0.5845295055821371,0.43221690590111644,0.3309409888357257],[0.5223285486443381,0.5845295055821371,0.45454545454545453,0.3309409888357257]];
let trainingId=state.team[0]||state.cats[0].id;
function skillArt(i,cls=''){return `<span class="skill-art ${cls}" aria-hidden="true" style="background-position:${i%4/3*100}% ${Math.floor(i/4)*100}%"></span>`;}
function skillIcon(i){return visualIcon(i);}
function visualIcon(i,cls=''){return `<span class="visual-icon ${cls}" aria-hidden="true" style="background-position:${i%4/3*100}% ${Math.floor(i/4)/3*100}%"></span>`;}
function teamFlag(side,cls=''){return `<span class="team-flag ${cls}" aria-hidden="true">${rect('v7-hearts-teams',TEAM_RECTS[side+2])}</span>`;}
function heartMeter(u){const ratio=Math.max(0,Math.min(1,u.life/u.maxHp)),oldRatio=battleCue?.phase==='impact'&&battleCue.beforeLife?Math.max(0,Math.min(1,battleCue.beforeLife[u.uid]/u.maxHp)):ratio;return `<span class="hp-heart ${u.side?'enemy-heart':'ally-heart'}" role="meter" aria-label="${u.side?'敌方':'我方'}${esc(u.name)}生命" aria-valuemin="0" aria-valuemax="${u.maxHp}" aria-valuenow="${u.life}" title="${u.life} / ${u.maxHp}"><span class="heart-empty">${rect('v7-hearts-teams',TEAM_RECTS[u.side])}</span><span class="heart-fill ${oldRatio!==ratio?'changing':''}" style="clip-path:inset(${(1-ratio)*100}% 0 0);--heart-before:${(1-oldRatio)*100}%;--heart-now:${(1-ratio)*100}%">${rect('v7-hearts-teams',TEAM_RECTS[u.side])}</span></span>`;}
function statusBadges(u){const marks=[];if(u.shield)marks.push([icon(2),'盾'+u.shield]);if(u.poison)marks.push([icon(5),'毒'+u.poison]);if(u.frozen)marks.push([skillArt(1),'冻'+u.frozen]);if(u.rooted)marks.push([skillArt(5),'缚'+u.rooted]);if(u.taunt)marks.push([skillArt(0),'引'+u.taunt]);if(u.regen)marks.push([skillArt(2),'春'+u.regen]);if(u.fury)marks.push([skillArt(3),'鼓'+u.fury]);return `<span class="status-stack">${marks.map(([art,text])=>`<span title="${text}">${art}<small>${text}</small></span>`).join('')}</span>`;}
const RANGE_TILE_RECTS=[[.075,.074,.411,.409],[.5,.074,.413,.409],[.075,.494,.411,.409],[.498,.495,.413,.407]];
function rangeKind(attack, move) {
  if (attack && move) return 'both';
  return attack ? 'attack' : move ? 'move' : '';
}
const rangeLabels = {attack:'攻击', move:'移动', both:'攻移重叠'};
function rangePaint(kind, base=0) {
  const tileIndex = kind === 'move' ? 2 : kind ? 3 : base;
  const paint = index => rect('v141-range-tiles', RANGE_TILE_RECTS[index], 'range-paint');
  return paint(tileIndex) + (kind === 'both' ? '<span class="move-half">'+paint(2)+'</span>' : '');
}
function rangeBadges(kind) {
  return (kind !== 'move' ? visualIcon(14,'board-badge attack-badge') : '') +
    (kind !== 'attack' ? visualIcon(13,'board-badge move-badge') : '');
}
function rangeLegend() {
  return '<span class="merged-legend">'+Object.entries(rangeLabels).map(([kind,label]) =>
    `<span><i>${rangePaint(kind)}</i>${label}</span>`).join('')+'</span>';
}
function rangeDiagram(c,large=false) {
  const radius=Math.max(G.combatProfile(c).range,G.moveRange(c)), size=2*radius+1;
  const unit={...c,x:radius,y:radius,life:1}, empty={blocks:[],units:[unit]};
  const squares=Array.from({length:size*size},(_,index)=>{
    const x=index%size,y=Math.floor(index/size),distance=Math.abs(x-radius)+Math.abs(y-radius);
    const kind=rangeKind(G.canAttack(empty,unit,{x,y}),distance>0 && distance<=G.moveRange(c));
    return `<span class="range-square" data-kind="${kind}">${rangePaint(kind,distance===0?1:0)}${distance===0?visualIcon(12,'range-symbol'):''}</span>`;
  });
  return `<span class="range-diagram ${large?'range-large':''}" style="--range-size:${size}" role="img" aria-label="以猫为中心的攻击和移动范围">${squares.join('')}</span>`;
}
function rangeCards(c,unit=false) {
  const key=unit?'unit~'+c.uid:c.id;
  return `<button class="merged-example" data-action="range-show" data-id="${key}" aria-label="放大攻移范围">${rangeDiagram(c)}<span><strong>攻移范围 ›</strong><small>占地 1 格 · 移动 ${G.moveRange(c)} 格</small><small>${G.combatProfile(c).attack}</small>${rangeLegend()}</span></button>`;
}
function rangeDetail(key) {
  const c=String(key).startsWith('unit~')?battle?.units.find(u=>u.uid===String(key).slice(5)):cat(key);
  if(!c)return;
  const profile=G.combatProfile(c);
  modal(esc(c.name)+' · 攻移范围',rangeDiagram(c,true)+rangeLegend()+`<p>${profile.attack} · 每次移动 ${G.moveRange(c)} 格</p><p class="small">空地示意。布阵棋盘会按障碍和站位更新。</p>${profile.support?'<p>'+profile.support+'</p>':''}`,btn('返回','modal-back',{tone:2}));
  modalRoot.querySelector('.modal').classList.add('range-detail-modal');
}
function effectFlow(items,cls=''){return `<div class="effect-flow ${cls}">${items.map(([i,label],n)=>(n?visualIcon(15,'effect-arrow'):'')+`<span class="effect-step">${Array.isArray(i)?'<span class="effect-pair">'+i.map(x=>visualIcon(x)).join('')+'</span>':visualIcon(i)}<span>${label}</span></span>`).join('')}</div>`;}
function skillEffect(c){const flows=[[[0,'挥爪两次'],[14,'每次 65% 伤害']],[[12,'虚弱伙伴'],[1,'获得护盾']],[[12,'虚弱伙伴'],[2,'恢复生命']],[[14,'攻击命中'],[3,'毒伤持续两次']],[[4,'速度 +5'],[0,'25% 追加攻击']],[[14,'受到直接攻击'],[5,'反击 45%']],[[6,'吸引敌人'],[1,'给自己添盾']],[[14,'半伤攻击'],[7,'冻结一次行动']],[[8,'清除异常'],[2,'治疗与回春']],[[9,'鼓舞全队'],[14,'后两次攻击 +25%']],[[10,'推远一格'],[14,'受阻额外 +8']],[[11,'命中后定身'],[13,'两次不能移动']]];return effectFlow(flows[c.skill]||flows[0],'skill-effect');}
function lessonEffect(path,level){const flows={guardian:{3:[[12,'另一位伙伴'],[1,'开场 +12 盾']],6:[[2,'伙伴生命 ≤40%'],[1,'救援 +30 盾'],[6,'吸引敌人']],10:[[[12,12],'两位不同伙伴'],[1,'每次 +45 盾']]},hunter:{3:[[[7,11],'目标已冻结/定身'],[14,'直伤 +20%']],6:[[14,'击败目标'],[4,'再行动一次']],10:[[14,'击败目标'],[4,'每场最多追击两次']]},healer:{3:[[2,'直接治疗'],[8,'清除中毒']],6:[[2,'溢出治疗'],[1,'转盾，上限 20']],10:[[2,'直接治疗'],[[2,2],'另一位恢复 40%']]}};return effectFlow(flows[path]?.[level]||[],'lesson-effect');}
const lessonGroups = [
  {label:'攻击', skills:[0,3,4,5]},
  {label:'守护与恢复', skills:[1,2,6,8,9]},
  {label:'控制', skills:[7,10,11]}
];

function lessonCost(c, skill) {
  return c.learnedSkills.includes(skill) || !c.lessonUsed ? 0 : 2;
}

let schoolPreview = null;

function beneathCard(card, action = '') {
  return `<div class="actionable-card">${card}${action}</div>`;
}

function cardAction(text, action, id, label, disabled=false) {
  return btn(text,action,{id,label,tone:disabled?2:1,cls:'under-card',disabled});
}

function schoolCard(c,i,selected) {
  const active=c.skill===i, known=c.learnedSkills.includes(i), cost=lessonCost(c,i);
  const name=G.SKILLS[i].name, missing=Math.max(0,cost-state.geneNotes);
  const card=`<button class="skin lesson-choice" data-action="lesson-peek" data-id="${i}" aria-pressed="${selected}">
    ${skin('button',selected?1:2)}${skillIcon(i)}<strong>${name}</strong><small>${active?'携带中':known?'已学会':cost?'待研习':'可免费学'}</small></button>`;
  if(!selected||active)return beneathCard(card);
  const label=missing?'差 '+missing+' 灵感':known?'换上':cost?'学习 '+resource(1,cost):'免费学习';
  return beneathCard(card,cardAction(label,'learn-skill',i,(known?'换上':'学习并换上')+name+(cost?'，消耗 2 灵感':''),missing>0));
}

function training() {
  const c = cat(trainingId) || cat(state.team[0]) || state.cats[0];
  trainingId = c.id;
  const header = `<div class="training-current">${sprite(c)}<div>${catNameStrip(c,state.cats.map(x=>x.id))}
    <p>${skillIcon(c.skill)}携带 · ${G.SKILLS[c.skill].name}</p>${btn('换一只','school-picker',{tone:2,cls:'compact'})}</div></div>`;
  const selected=schoolPreview?.catId===c.id?schoolPreview.skill:c.skill;
  const groups=lessonGroups.map(({label,skills})=>`<section><h3>${label}</h3>
    <div class="lesson-palette">${skills.map(i=>schoolCard(c,i,i===selected)).join('')}</div>
    ${skills.includes(selected)?`<div class="school-preview">${skillEffect({skill:selected})}<p>${G.SKILLS[selected].desc}</p>${selected!==c.skill?'<small>确认后换上「'+G.SKILLS[selected].name+'」</small>':''}</div>`:''}</section>`).join('');
  return shell('猫咪学堂','选择本领',header + '<div class="school-lessons">'+groups+'</div>' +
    btn('带'+esc(c.name)+'去历练','growth-trial',{id:c.id,icon:10}), 'academy');
}

function schoolPicker() {
  modal('为哪只猫调整本领？', '<div class="growth-picker-grid">'+state.cats.map(c =>
    `<button class="skin growth-picker-cat" data-action="training-cat" data-id="${c.id}">${skin()}${sprite(c)}<strong>${esc(c.name)} Lv.${G.levelInfo(c).level}</strong><small>${G.SKILLS[c.skill].name}</small></button>`
  ).join('')+'</div>',btn('返回学堂','modal-back',{tone:2}));
}

function startCatTrial(c, outgoingId) {
  if (!c) return;
  if (!state.team.includes(c.id)) {
    if (state.team.length < 3) state.team.push(c.id);
    else if (outgoingId && state.team.includes(outgoingId)) G.replaceTeamCat(state,outgoingId,c.id);
    else {
      modal('让谁休息一场？', '<p>'+esc(c.name)+'将接替所选伙伴的站位。</p><div class="growth-picker-grid">'+state.team.map(id => {
        const member = cat(id);
        return `<button class="skin growth-picker-cat" data-action="trial-replace" data-id="${c.id}:${id}">${skin()}${sprite(member)}<strong>${esc(member.name)}</strong><small>${G.SKILLS[member.skill].name} · Lv.${G.levelInfo(member).level}</small></button>`;
      }).join('')+'</div>',btn('保留当前阵容','modal-back',{tone:2}));
      return;
    }
  }
  stage=Array.from({length:Math.min(10,state.cleared.length+1)},(_,i)=>i+1).find(n=>!c.trialWins.includes(n))||1;
  battleMode='story';
  if(!save())return;
  closeModal(false);
  go('team');
}
let levelTimer=null,levelShowing=null,growthSession=null,rewardPending=null;
function syncGrowthReminder(){document.querySelector('.growth-reminder')?.remove();if(!levelShowing&&!welcomeShowing&&(state.pendingGrowth.length||state.pendingWelcomes.length)){const el=document.createElement('div');el.className='growth-reminder';el.innerHTML=btn(state.pendingWelcomes.length?'新伙伴 '+state.pendingWelcomes.length:'成长 '+state.pendingGrowth.length,'growth-resume',{tone:1,cls:'compact',icon:state.pendingWelcomes.length?8:15,label:state.pendingWelcomes.length?'迎接新伙伴':'继续观看 '+state.pendingGrowth.length+' 只猫的升级'});screen.append(el);}}
function showGrowth(){clearTimeout(levelTimer);const g=state.pendingGrowth[0];if(!g){levelShowing=null;growthSession=null;showNextCelebration();return;}if(!growthSession)growthSession={total:state.pendingGrowth.length,done:0};levelShowing=g.key;const c=cat(g.id);modal(esc(c.name)+'长大啦！',`<div class="growth-scene" data-growth-cat="${c.id}">${skillArt(6,'growth-halo')}${sprite(c,'growing-cat')}${skillArt(7,'growth-emblem')}</div><p class="growth-level"><span>Lv.${g.from}</span><b>→</b><strong>Lv.${g.to}</strong></p><div class="growth-stats">${[['hp','生命',1],['atk','攻击',0],['speed','速度',4]].map(([key,label,idx])=>`<div>${icon(idx)}<span>${label}</span><b>${g.before[key]} → ${g.after[key]}</b><em>+${g.after[key]-g.before[key]}</em></div>`).join('')}</div><p class="small center green">${[3,6,10].filter(n=>g.from<n&&g.to>=n).map(n=>({3:'可选专长，学第一项被动',6:'可挑战突破，解锁第二项能力',10:'可完成结业，学会第三项能力'})[n]).join(' · ')}</p><p class="small center">第 ${growthSession.done+1} / ${growthSession.total} 只 · 成长已保存</p><p class="small center">轻点空白可暂时收起，稍后继续观看。</p>`,btn(state.pendingGrowth.length>1?'下一只小猫':'收下这份成长','growth-next',{tone:1})+btn('安排它的养成','growth-open',{id:c.id,tone:2,cls:'compact'}),15);modalRoot.querySelector('.modal').classList.add('growth-modal');syncGrowthReminder();const key=g.key;levelTimer=setTimeout(()=>{if(levelShowing===key)completeGrowth();},3600);}
function completeGrowth(){return MeowSave.exclusive(()=>{if(syncSave())return;if(!levelShowing||state.pendingGrowth[0]?.key!==levelShowing)return;clearTimeout(levelTimer);state.pendingGrowth.shift();if(!save())return;if(growthSession)growthSession.done++;levelShowing=null;showGrowth();});}

let welcomeShowing=null,parentSlot=null;
function welcomeArt(i,cls=''){return `<span class="welcome-art ${cls}" aria-hidden="true" style="background-position:${i%2*100}% ${Math.floor(i/2)*100}%"></span>`;}
function showNextCelebration(){if(state.pendingWelcomes.length){showWelcome();return;}if(state.pendingGrowth.length){showGrowth();return;}closeModal();if(rewardPending&&page==='battle'&&battle===rewardPending.battle)showBattleReward(rewardPending.battle,rewardPending.reward);}
function showWelcome(){clearTimeout(levelTimer);levelShowing=null;const c=cat(state.pendingWelcomes[0]);if(!c)return showNextCelebration();welcomeShowing=c.id;modal('新伙伴，欢迎回家！',`<div class="welcome-scene" data-welcome-cat="${c.id}">${welcomeArt(1,'welcome-rays')}${welcomeArt(0,'welcome-wreath')}${sprite(c,'arriving-cat')}${[0,1,2,3,4].map(i=>`<span class="welcome-confetti" style="--i:${i}">${welcomeArt(i%2?2:3)}</span>`).join('')}</div><h2>${esc(c.name)}</h2><p class="center">${G.COLORS[c.color]} · ${G.PATTERNS[c.pattern]} · ${G.EARS[c.ears]}</p><p class="welcome-skill">${skillIcon(c.skill)}<b>${G.SKILLS[c.skill].name}</b></p><p class="note center">${G.SKILLS[c.skill].desc}</p><p class="small center">已入住小院，记入图鉴与家族谱系。</p>`,btn('欢迎回家','welcome-done',{tone:1})+btn('安排它加入小队','welcome-team',{tone:2}),8);modalRoot.querySelector('.modal').classList.add('welcome-modal');syncGrowthReminder();}
function completeWelcome(){if(!welcomeShowing)return;state.pendingWelcomes=state.pendingWelcomes.filter(id=>id!==welcomeShowing);welcomeShowing=null;if(!save())return;render();showNextCelebration();}
function welcomeTeam(){const c=cat(welcomeShowing);if(!c)return;if(state.team.includes(c.id)){completeWelcome();return;}if(state.team.length<3){state.team.push(c.id);completeWelcome();return;}modal('让谁回小院休息？',`<p class="note center">${esc(c.name)}会接替所选位置；换下的小猫仍留在小院。</p><div class="roster welcome-team-pick">${state.team.map((id,i)=>card(cat(id),'welcome-replace',false,['前排','后左','后右'][i])).join('')}</div>`,btn('先不换队伍','welcome-back',{tone:2}),10);modalRoot.querySelector('.modal').classList.add('welcome-replacement');}
let deployCatId=null,deployInspect=null;
function deploymentBattle(){const places=G.deployment(state),rule=G.encounter(state,stage,battleMode);return {blocks:[{x:2,y:2}],units:[...places.map(p=>({...G.trained(cat(p.id)),...p,life:1,side:0,uid:'a'+p.id})),...rule.skills.map((skill,i)=>({id:-i-1,uid:'e'+i,side:1,name:['竹团','灰灰','阿斑'][i],skill,color:(i+stage)%3,pattern:i,ears:i%2,mutation:null,rareGene:null,x:i*2,y:0,life:1}))]};}
function formationPreview(){G.syncDeployment(state);if(!state.team.includes(deployCatId))deployCatId=state.team[0]||null;const b=deploymentBattle();if(!b.units.some(u=>u.uid===deployInspect))deployInspect='a'+deployCatId;const u=b.units.find(u=>u.uid===deployInspect),profile=u?G.combatProfile(u):null,reachable=new Set(u?G.moveCells(b,u).map(p=>p.x+','+p.y):[]);return `<section class="deployment-studio"><div class="deployment-heading"><h3>你来摆阵，小猫自动出战</h3>${btn('重摆','deploy-reset',{tone:2,cls:'compact'})}</div><p class="small">猫牌换队友 · 棋盘点猫看范围，拖猫换站位。</p><div class="deployment-cats" aria-label="点击猫牌更换出战伙伴">${state.team.map(id=>{const c=cat(id);return `<button class="skin deploy-pick" data-action="deploy-select" data-id="${id}" aria-pressed="${deployInspect==='a'+id}">${skin('button',deployInspect==='a'+id?1:2)}${sprite(c)}<span>${esc(c.name)}</span><small>点击换猫</small></button>`;}).join('')}</div><div class="deployment-board-tools">${profile?`<div class="deployment-inspector" aria-live="polite"><strong>${u.side?'敌方':'我方'} · ${esc(u.name)} · ${profile.name}</strong><p>${profile.attack} · 移动 ${profile.move} 格</p></div>`:''}${rangeLegend()}</div><div class="deployment-board" role="group" aria-label="五乘五布阵棋盘，上方为敌人，下方两排可布阵">${Array.from({length:25},(_,i)=>{const x=i%5,y=Math.floor(i/5),c=b.units.find(u=>u.x===x&&u.y===y),rock=x===2&&y===2,selected=c?.uid===deployInspect,kind=rangeKind(u&&G.canAttack(b,u,{x,y}),reachable.has(x+','+y));return `<button class="deploy-cell ${y>=3?'deploy-zone':''}  ${selected?'deploy-selected':''}" data-kind="${kind}" data-action="deploy-cell" data-id="${x}:${y}" ${c?.side===0?'data-cat-id="'+c.id+'"':''} aria-label="第${y+1}行第${x+1}列，${rock?'岩石不可站立':c?(c.side?'敌方':'我方')+c.name:y>=3?'可放置':'不可布阵'}">${tile(0)}${kind?rangePaint(kind):''}${kind&&!c?rangeBadges(kind):''}${rock?tile(1):''}${selected?tile(2,'deploy-ring'):''}${c?sprite(c)+`<span class="deploy-label ${c.side?'red':'green'}">${teamFlag(c.side)}${c.side?'敌':'我'}·${esc(c.name)}</span>`:y>=3?'<span class="deploy-empty">＋</span>':''}</button>`;}).join('')}</div><p class="small deployment-note">双色格可移动，也在当前攻击范围内。</p>${profile?`<section class="direct-info"><h3>${profile.name}</h3><p class="small">${profile.detail}${profile.support?' '+profile.support:''}</p></section>`:''}<div class="formation-foot"><p class="small">${state.team.length?'前排：'+esc(cat(state.team[0]).name)+' · 最靠前优先，同排靠中间优先，获得基础 20 护盾。':''}</p><button class="coach-icon" data-action="squad-coach" aria-label="这关怎么选猫？" title="选猫建议">${icon(7)}</button></div></section>`;}
function deploymentPicker(oldId,filter='reserve'){const old=cat(oldId);if(!old||!state.team.includes(oldId))return;const list=state.cats.filter(c=>filter==='all'||filter==='reserve'&&!state.team.includes(c.id)||filter==='favorite'&&c.favorite||filter==='attack'&&![1,2,6,8,9].includes(c.skill)||filter==='support'&&[1,2,6,8,9].includes(c.skill));list.sort((a,b)=>Number(state.team.includes(a.id))-Number(state.team.includes(b.id))||G.levelInfo(b).level-G.levelInfo(a).level||b.id-a.id);
 modal('替换'+esc(old.name),`<p class="small center">选择新伙伴接替它的位置，其他猫的站位不变。</p><div class="deploy-picker-filters">${[['reserve','候补'],['all','全部'],['favorite','收藏'],['attack','输出'],['support','辅助']].map(([key,name])=>btn(name,'deploy-picker-filter',{id:oldId+':'+key,tone:filter===key?1:2,cls:'compact'})).join('')}</div><div class="deploy-picker-list">${list.map(c=>{const inTeam=state.team.includes(c.id);return `<button class="skin deploy-replacement ${inTeam?'on-team':''}" data-action="deploy-replace" data-id="${oldId}:${c.id}" ${inTeam?'disabled':''}>${skin()}${sprite(c)}<strong>${esc(c.name)}</strong><span>Lv.${G.levelInfo(c).level} · ${catJob(c)[0]}</span><span class="small">${c.growthPath?pathName(c)+' · '+G.Growth.lessons(c).filter(x=>x.unlocked).at(-1).name:catJob(c)[2]}</span><small>${c.id===oldId?'当前伙伴':inTeam?'已在其他位置':'点选接替'}</small></button>`;}).join('')||'<p class="empty-message">这里还没有可选伙伴。<br>试试其他筛选，或繁育一只新猫。</p>'}</div>`,btn('只调整它的站位','deploy-keep',{id:oldId,tone:2}));modalRoot.querySelector('.modal').classList.add('deploy-picker-modal');}
function placeDeployment(id,x,y){G.placeCat(state,id,x,y);deployCatId=id;deployInspect='a'+id;if(!save())return;render();}

function nurseryParents(){return `<div class="nursery-pair-scene">${[0,1].map(i=>`<button class="nursery-parent ${parentSlot===i?'choosing':''}" data-action="nursery-slot" data-id="${i}" aria-label="更换双亲${i?'乙':'甲'}">${parents[i]?sprite(cat(parents[i])):icon(9)}<span class="skin nursery-name">${skin('button',2)}<span>${i?'乙':'甲'} · ${parents[i]?esc(cat(parents[i]).name):'选择小猫'}</span></span></button>`).join('')}${welcomeArt(3,'nursery-love')}</div>`;}
function nurseryAmbience(){return `<div class="nursery-ambience" aria-hidden="true">${[0,1,2].map(i=>`<span style="--i:${i}">${welcomeArt(2)}</span>`).join('')}</div>`;}
function nurseryFooter(content){return `<div class="nursery-footer">${content}</div>`;}
function treeHit(e){if(e.detail===0)return false;const world=$('#village-world');if(!world)return false;const r=world.getBoundingClientRect(),x=((e.clientX-r.left)/camera.z-TREE.x)/TREE.w,y=((e.clientY-r.top)/camera.z-TREE.y)/TREE.h;if(x<0||x>=1||y<0||y>=1)return false;const row=TREE_MASK[Math.floor(y*TREE_MASK.length)];if(!row||!(parseInt(row[Math.floor(x*64/4)],16)&(8>>Math.floor(x*64)%4)))return false;const target=e.target.closest('[data-action]');if(target&&!target.classList.contains('village-cat'))return false;if(target&&y>=TREE.canopyFraction&&Number(target.style.zIndex)>TREE.depth)return false;return true;}

function stats(c){return `<div class="stats">${[[1,'生命',c.hp],[0,'攻击',c.atk],[4,'速度',c.speed]].map(([i,n,v])=>`<div class="skin stat">${skin('button',2)}${icon(i)}<span><small>${n}</small> ${v}</span></div>`).join('')}</div>`;}
// Village camera is transient UI state; cats and progress stay in the original save.
let camera={x:0,y:0,z:.68,ready:false},useBlessing=false,mapSuppressUntil=0;
const WORLD={w:1440,h:960};
// Every scene object sorts at its ground contact, not its image's top edge.
const TREE={x:360,y:365,w:500,h:418,depth:755,canopyFraction:.60,canopyDepth:1900};
const TREE_MASK=["0000000000000000","0000000000000000","0000000000000000","0000000000000000","0000007e00000000","000001ff80000000","000003ffc0000000","00003bfffc000000","0001ffffff000000","0003ffffff800000","0007ffffff800000","0007ffffff800000","000fffffff0fc000","0037ffffffbff000","01fffffffffff800","03fffffffffff800","07fffffffffff800","0fffffffffffff80","0fffffffffffffc0","1ffffffdfffffff0","3ffffffbbffffff8","3fffff3f84fffff8","3fffff9e1ffcfffc","3ffbffbe7fff9ffc","3ff9e1fefffffffe","0fe7f3ffffdefffe","0fbfffffffbffffc","001e3ffffffffff0","0003fcfffbfff9e0","0003fffff8fff800","0001fe3ffe707000","0000381fff000000","0000001fff000000","0000003fff000000","0000007fff000000","000000fffe000000","000003fffe000000","000007ffff800000","00000fffffef0000","00000fffffff8000","00001fffffffc000","0003ffffffffc000","0007fffffffffe00","0007ffffffc3fe00","000f83ffe701ff00","003e07f9f7e007c0","00fc0ff8f0f001e0","00801f00f0000000","0000fe00fe000000","000084000e000000","0000000000000000","0000000000000000","0000000000000000","0000000000000000"]; // Generated alpha hit mask is inserted from the tree PNG.
let villageFrame=0,villageTime=0;
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
function villagePosition(i,time){return VillageMotion.position(state.cats[i].id,time,i,state.cats.length);}
// All three generated walking atlases face left in their unmirrored artwork.
const WALK_ART_FACING=-1;
function walkingSprite(c){const mutant=mutantAtlas(c);if(mutant&&!G.rare(c))return `<span class="sprite walking-sprite mutant-walking" role="img" aria-label="${esc(c.name)}散步中" data-col="0" data-row="${mutant.row}" data-rows="4" data-cols="4" style="background-image:url('${ASSET(mutant.sheet)}');background-size:400% 400%"></span>`;const rare=G.rare(c),col=rare?0:c.pattern*2,row=rare?c.rareGene:c.color*2,rows=6,cols=rare?4:6;
 return `<span class="sprite walking-sprite" role="img" aria-label="${esc(c.name)}散步中" data-col="${col}" data-row="${row}" data-rows="${rows}" data-cols="${cols}" style="background-image:url('${ASSET(rare?'v9-walk-rare':c.ears?'v9-walk-round':'v9-walk-pointed')}');background-size:${cols*100}% ${rows*100}%">${!rare&&c.mutation!==null&&c.mutation!==undefined?`<span class="mutation">${icon(G.MUTATIONS[c.mutation].icon)}</span>`:''}</span>`;
}
function positionVillageCat(el,i){const p=villagePosition(i,villageTime),art=el.querySelector('.walking-sprite');el.style.left=p.x+'px';el.style.top=p.y+'px';el.style.zIndex=Math.round(p.y);el.dataset.footY=p.y.toFixed(2);el.dataset.moving=String(p.moving);el.dataset.frame=String(p.frame);if(art){art.style.backgroundPosition=`${(Number(art.dataset.col)+(Number(art.dataset.cols)===4?p.frame:p.frame%2))*100/(Number(art.dataset.cols)-1)}% ${(Number(art.dataset.row)+(Number(art.dataset.cols)===4?0:Math.floor(p.frame/2)))*100/(Number(art.dataset.rows)-1)}%`;art.style.transform=`scaleX(${p.face*WALK_ART_FACING})`;}}
function villageGate(){return VillageMotion.gate.map(p=>`<img class="village-gate gate-${p.name}" src="${ASSET('v4-ground')}" draggable="false" alt="" aria-hidden="true" style="z-index:${p.depth};clip-path:polygon(${p.points.map(([x,y])=>`${x/1440*100}% ${y/960*100}%`).join(',')})">`).join('');}
function gateCoversClick(e,el){if(e.detail===0)return false;const r=$('#village-world').getBoundingClientRect();return VillageMotion.covered((e.clientX-r.left)/camera.z,(e.clientY-r.top)/camera.z,Number(el.style.zIndex));}
function animateVillage(){
 cancelAnimationFrame(villageFrame);const cats=[...document.querySelectorAll('.village-cat')];let previous=performance.now();
 const frame=now=>{if(page!=='home'||!cats[0]?.isConnected)return;const dt=Math.min(100,now-previous);previous=now;
  if(!document.hidden&&!modalRoot.children.length&&!reducedMotion.matches){villageTime+=dt/1000;cats.forEach(positionVillageCat);}
  villageFrame=requestAnimationFrame(frame);
 };cats.forEach(positionVillageCat);villageFrame=requestAnimationFrame(frame);
}
function treeCoversClick(e,el){
 if(e.detail===0)return false;
 const r=$('#village-world').getBoundingClientRect(),x=((e.clientX-r.left)/camera.z-TREE.x)/TREE.w,y=((e.clientY-r.top)/camera.z-TREE.y)/TREE.h;
 if(x<0||x>=1||y<0||y>=1)return false;
 if(y>=TREE.canopyFraction&&Number(el.style.zIndex)>TREE.depth)return false;
 const row=TREE_MASK[Math.floor(y*TREE_MASK.length)];return row?Boolean(parseInt(row[Math.floor(x*64/4)],16)&(8>>Math.floor(x*64)%4)):false;
}
function villageTree(){
 const image=`src="${ASSET('v4-foreground-tree')}" draggable="false" style="left:${TREE.x}px;top:${TREE.y}px;width:${TREE.w}px;height:${TREE.h}px;`;
 return `<img class="village-tree village-trunk" alt="家族古树" ${image}z-index:${TREE.depth};clip-path:inset(${TREE.canopyFraction*100}% 0 0 0)"><img class="village-tree village-canopy" alt="" aria-hidden="true" ${image}z-index:${TREE.canopyDepth};clip-path:inset(0 0 ${(1-TREE.canopyFraction)*100}% 0)">`;
}
function goalRewards(g){return [g.coins?resource(0,g.coins):'',g.notes?resource(1,g.notes):'',g.dew?resource(3,g.dew):'',g.leaves?resource(4,g.leaves):''].filter(Boolean).join(' ');}
function wishBanner(){const g=G.Objectives.home(state);if(!g)return `<h3>这一路，已经写满收获</h3><p class="small">换一支小队，继续挑战远行纪录。</p>${btn('继续远行','objective-route',{id:'trail',tone:1,cls:'compact'})}`;const p=G.Objectives.progress(state,g);return `<div class="objective-banner"><div><p class="small">${g.chapter?'成长目标 · '+g.chapter:'长期目标'}</p><h3>${g.name} <small>${p.current}/${p.target}</small></h3><p class="small">${g.desc}</p><p class="sub">奖励 ${goalRewards(g)}</p></div><div class="objective-banner-actions">${btn(p.done?'领赏':'去完成',p.done?'objective-claim':'objective-go',{id:g.id,tone:1,cls:'compact'})}${btn('目标册','wishes',{tone:2,cls:'compact',icon:7})}</div></div>`;}
function wishes(){const active=G.Objectives.active(state),done=state.objectives.claims.length;return shell('成长目标','一次学会一件小事',`<h2>已完成 ${done} / ${G.Objectives.journey.length}</h2><p class="sub">按自己的节奏来；已经做过的事情会自动计入。奖励只领一次。</p>${active?goalPanel(active,true):panel('<h3>成长主线已完成</h3><p class="note">从小队挑战、家族培养和图鉴收藏中，选择自己的下一段目标。</p>')}<div class="inline-actions">${btn('小队挑战','challenges',{tone:1,cls:'compact',icon:10})}${btn('长期目标','long-goals',{tone:2,cls:'compact',icon:11})}</div>${state.objectives.pinned?btn('首页继续追踪成长主线','objective-unpin',{tone:2,cls:'compact'}):''}${referenceEntry('成长路线',`${G.Objectives.journey.map((g,i)=>`<div class="goal-road-row"><b>${i+1}. ${g.name}</b><span>${state.objectives.claims.includes(g.id)?'已完成':g.id===active?.id?'当前目标':'后续目标'}</span><p class="small">${g.desc}</p></div>`).join('')}`,11)}`,'home');}
function goalPanel(g,main=false){const p=G.Objectives.progress(state,g),claimed=(main?state.objectives.claims:state.objectives.longClaims).includes(g.id);return panel(`<div class="flex between"><h3>${g.name}</h3><span class="small">${claimed?'已领取':p.current+' / '+p.target}</span></div><p class="note">${g.desc}</p><p class="goal-teaching">${g.why}</p><p class="small">奖励 ${goalRewards(g)}</p>${claimed?'':btn(p.done?'领取目标奖励':'去完成',p.done?'objective-claim':'objective-go',{id:g.id,tone:p.done?1:0,cls:'compact'})}${!main&&!claimed?btn(state.objectives.pinned===g.id?'首页正在追踪':'在首页追踪','objective-pin',{id:g.id,tone:2,cls:'compact'}):''}`,'goal-card');}
function longGoals(){return shell('长期目标','选择自己想留下的故事',`<p class="sub">这些目标可以同时推进，没有倒计时、不因断签重置。首页一次只追踪一个。</p>${btn('去小队挑战','challenges',{tone:1,cls:'compact',icon:10})}${G.Objectives.longGoals.map(g=>goalPanel(g)).join('')}${btn('回成长路线','wishes',{tone:2})}`,'home');}
function challenges(){return shell('小队挑战','同一群猫，也能配出新办法',`<h2>试炼印记 ${state.objectives.challengeWins.length} / 9</h2><p class="sub">先通关对应关卡，再带符合条件的小队来。各项首次达成才有奖励；复习不重复领奖。</p>${G.Objectives.challengeTypes.map(t=>panel(`<h3>${icon(t.id==='guard'?2:t.id==='swift'?4:7)}${t.name}路线</h3><p class="note">${t.desc}</p>${G.Objectives.challenges.filter(d=>d.kind===t.id).map(d=>{const cleared=state.objectives.challengeWins.includes(d.id),open=state.cleared.includes(d.level);return `<div class="challenge-tier"><p class="small">${d.tier} 阶 · 第 ${d.level} 关${cleared?' · 印记已获得':''}</p><p class="small">首次 ${goalRewards(d)} · 每只未满级猫 ${resource(2,d.xp)}</p>${btn(!open?'先通关第 '+d.level+' 关':cleared?'复习 · 无重复奖励':'配置挑战小队','challenge-select',{id:d.id,tone:cleared?2:1,cls:'compact',disabled:!open})}</div>`;}).join('')}`,'goal-card')).join('')}${btn('继续山林试炼','objective-route',{id:'latest',tone:2})}${btn('看看长期目标','long-goals',{tone:2})}`,'team');}
function goalRoute(route){if(route==='challenges'&&!state.cleared.includes(3)){battleMode='story';stage=Math.min(3,state.cleared.length+1);go('team');toast('先通关第 3 关，就能开启第一阶小队挑战。');return;}const sorted=[...state.cats].sort((a,b)=>G.levelInfo(b).level-G.levelInfo(a).level),best=sorted[0];rosterFilter='all';if(['growth','path','breakthrough','master','mentor'].includes(route)){growthPicker(route);return;}
 if(route==='lesson'){trainingId=(state.cats.find(c=>state.team.includes(c.id)&&!c.lessonUsed)||best).id;go('training');return;}
 if(route==='generation'){const a=[...state.cats].sort((a,b)=>b.gen-a.gen||b.id-a.id)[0];parents=[a.id,state.cats.find(c=>c.id!==a.id).id];if(!rememberParents())return;go('breed');return;}
 if(['preview','directed','mutation','rare'].includes(route)){if(route==='directed'){breedFocus='skill';toast('已选只锁定本领，确认繁育时才扣费。');}if(route==='mutation'){mutationPlan=null;useBlessing=state.blessings>0;if(!useBlessing&&state.geneNotes>=6)mutationPlan=0;}if(route==='rare')rareMode='explore';go(route==='preview'?'preview':'breed');if(route==='directed'&&page==='breed')nurserySettings();return;}
 if(route==='stage1'||route==='stage2'||route==='latest'||route==='stars'||route==='trail'){battleMode=route==='trail'&&state.cleared.includes(10)?'trail':'story';stage=route==='stage1'?1:route==='stage2'?Math.min(2,state.cleared.length+1):route==='stars'?Array.from({length:10},(_,i)=>i+1).find(n=>(state.stageStars[n]||0)<3)||10:Math.min(10,state.cleared.length+1);go('team');return;}
 if(route==='book')filter='all';go(route==='challenges'?'challenges':['breed','book','team'].includes(route)?route:'wishes');}

function villageCat(c,i){
 const size=Math.max(28,Math.min(66,66*Math.sqrt(24/state.cats.length)));
 const p=villagePosition(i,villageTime);
 return `<button class="village-cat ${state.cats.length>24?'crowded':''}" data-action="detail" data-id="${c.id}" aria-label="看看${esc(c.name)}" style="--cat-size:${size}px;width:${size}px;height:${size}px;left:${p.x}px;top:${p.y}px;z-index:${Math.round(p.y)}">${walkingSprite(c)}<span class="village-cat-name">${esc(c.name)}</span></button>`;
}
function villageHome(){G.migrate(state);return `<div class="map-viewport" id="village-view" aria-label="猫村地图，拖动平移，双指缩放"><div class="village-world" id="village-world"><img class="village-map" src="${ASSET('v4-ground')}" alt="水墨猫村地面" draggable="false">${villageTree()}${villageGate()}<button class="tree-access" data-action="family" aria-label="家族古树，查看谱系" style="left:${TREE.x}px;top:${TREE.y}px;width:${TREE.w}px;height:${TREE.h}px"></button>${btn('猫咪小屋','roster',{cls:'village-sign sign-house',tone:2,icon:8})}${btn('育猫小窝','breed',{cls:'village-sign sign-nursery',tone:1,icon:9})}${btn('家族古树','family',{cls:'village-sign sign-tree',tone:2,icon:12})}${btn('竹林试炼','team',{cls:'village-sign sign-battle',tone:0,icon:10})}${state.cats.map(villageCat).join('')}</div></div>${header('喵喵基因屋','一屋小猫 · 代代相逢',false)}<div class="map-tools">${btn('−','map-out',{tone:2,cls:'compact',label:'缩小地图'})}${btn('＋','map-in',{tone:2,cls:'compact',label:'放大地图'})}${btn('归位','map-fit',{tone:2,cls:'compact'})}<span class="skin map-count">${skin('button',2)}<span>全院 ${state.cats.length} 猫</span></span></div><button class="skin resource-dock" data-action="resource-info" aria-label="资源用途">${skin('button',2)}${resource(1,state.geneNotes)}${resource(3,state.starDew)}</button><div class="map-hint">树影小院 · 拖动逛院 · 双指缩放</div>${wishOpen?panel(wishBanner(),'home-dialogue wish-banner'):'<div class="wish-reopen">'+btn('目标','wish-toggle',{tone:2,cls:'compact',icon:7})+'</div>'}<div class="growth-dock">${btn('养成','academy',{tone:2,cls:'compact',icon:15})}${btn('巡游','patrol',{tone:2,cls:'compact',icon:7})}</div>${btn('？','help',{tone:2,cls:'help-link',label:'玩法与存档'})}${nav('home')}`;}
function mapBounds(){const v=$('#village-view');return v?{w:v.clientWidth,h:v.clientHeight}:null;}
function minMapZoom(b){return Math.max(b.w/WORLD.w,b.h/WORLD.h);}
function maxMapZoom(b){return Math.max(1.35,minMapZoom(b)*1.8);}
function applyCamera(){const b=mapBounds(),world=$('#village-world');if(!b||!world)return;camera.z=Math.max(minMapZoom(b),Math.min(maxMapZoom(b),camera.z));const sw=WORLD.w*camera.z,sh=WORLD.h*camera.z;camera.x=sw<=b.w?(b.w-sw)/2:Math.max(b.w-sw,Math.min(0,camera.x));camera.y=sh<=b.h?(b.h-sh)/2:Math.max(b.h-sh,Math.min(0,camera.y));world.style.transform=`translate(${camera.x}px,${camera.y}px) scale(${camera.z})`;world.dataset.zoom=camera.z.toFixed(3);}
function zoomMap(factor){const b=mapBounds();if(!b)return;const z=Math.max(minMapZoom(b),Math.min(maxMapZoom(b),camera.z*factor)),ratio=z/camera.z;camera.x=b.w/2-(b.w/2-camera.x)*ratio;camera.y=b.h/2-(b.h/2-camera.y)*ratio;camera.z=z;applyCamera();}
function fitMap(){const b=mapBounds();if(!b)return;camera.z=minMapZoom(b);camera.x=b.w/2-700*camera.z;camera.y=b.h/2-610*camera.z;camera.ready=true;applyCamera();}
function initVillage(){const v=$('#village-view');if(!v)return;const b=mapBounds();if(!camera.ready){fitMap();}applyCamera();const points=new Map();let moved=false;
 const local=e=>{const r=v.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};};
 const metrics=()=>{const ps=[...points.values()];return ps.length>1?{x:(ps[0].x+ps[1].x)/2,y:(ps[0].y+ps[1].y)/2,d:Math.hypot(ps[0].x-ps[1].x,ps[0].y-ps[1].y)}:{...ps[0],d:0};};
 v.addEventListener('pointerdown',e=>{if(e.button>0)return;points.set(e.pointerId,{...local(e),startX:e.clientX,startY:e.clientY});if(points.size===1)moved=false;else{moved=true;mapSuppressUntil=Date.now()+500;} });
 v.addEventListener('pointermove',e=>{if(!points.has(e.pointerId))return;const before=metrics(),old=points.get(e.pointerId),now=local(e);points.set(e.pointerId,{...old,...now});const after=metrics();if(!moved&&points.size===1&&Math.hypot(e.clientX-old.startX,e.clientY-old.startY)<6)return;moved=true;mapSuppressUntil=Date.now()+400;if(!v.hasPointerCapture(e.pointerId))v.setPointerCapture(e.pointerId);if(points.size>1&&before.d>0){const z=Math.max(minMapZoom(mapBounds()),Math.min(maxMapZoom(mapBounds()),camera.z*after.d/before.d)),ratio=z/camera.z;camera.x=after.x-(before.x-camera.x)*ratio;camera.y=after.y-(before.y-camera.y)*ratio;camera.z=z;}else{camera.x+=after.x-before.x;camera.y+=after.y-before.y;}applyCamera();e.preventDefault();});
 const up=e=>{if(!points.has(e.pointerId))return;points.delete(e.pointerId);if(moved)mapSuppressUntil=Date.now()+400;if(v.hasPointerCapture(e.pointerId))v.releasePointerCapture(e.pointerId);};
 v.addEventListener('pointerup',up);v.addEventListener('pointercancel',up);v.addEventListener('lostpointercapture',e=>points.delete(e.pointerId));
 v.addEventListener('pointerleave',e=>{if(!v.hasPointerCapture(e.pointerId))points.delete(e.pointerId);});
 v.addEventListener('wheel',e=>{e.preventDefault();zoomMap(Math.exp(-e.deltaY*.002));},{passive:false});
 v.addEventListener('click',e=>{if(Date.now()<mapSuppressUntil){e.preventDefault();e.stopPropagation();return;}if(treeHit(e)){e.preventDefault();e.stopPropagation();MeowSound.action('family');go('family');}},true);
}
window.addEventListener('resize',()=>{if(page==='home')applyCamera();});
function showBattleReward(current,r){rewardPending=null;if(r.challenge){const c=r.challenge;modal(c.passed?(c.first?'获得一枚试炼印记！':'这项挑战已经完成过啦'):'还差一点，试试新的搭配',`<h3 class="center">${c.definition.name} · ${c.definition.tier} 阶</h3><p class="note">${c.reason}</p><div class="reward-resources">${resource(0,'+'+r.reward)}${resource(1,'+'+r.notes)}${resource(3,'+'+r.dew)}</div><p class="small">${c.first?'印记永久保留；继续尝试另一条路线。':'未重复发放奖励，可以调整阵容再来。'}</p>`,btn('调整挑战小队','challenge-retry',{tone:1})+btn('查看试炼印记','challenges',{tone:2}),15);return;}modal(r.win?'小队，带着收获回来啦！':r.practice?'休整一下，再出发':'这次也有成长',`<h2 class="red">${r.trail?'远行第 '+r.floor+' 段':stars(r.stars)}</h2><div class="reward-resources">${resource(0,'+'+r.reward)}${resource(1,'+'+r.notes)}${resource(3,'+'+r.dew)}</div><p class="center">${r.xpByCat.map(x=>esc(x.name)+' '+resource(2,'+'+x.xp)).join(' · ')}</p>${r.newStars?'<p class="note center">比纪录多 '+r.newStars+' 颗星！新星奖励已计入。</p>':''}${r.newcomer?`${sprite(r.newcomer)}<p class="center">${esc(r.newcomer.name)}加入小院！<br>${G.COLORS[r.newcomer.color]} · ${G.PATTERNS[r.newcomer.pattern]} · ${G.SKILLS[r.newcomer.skill].name}</p>`:''}${r.practice?'<p class="note center">这次是自由练习，没有重复奖励。带新伙伴完成个人历练、刷新星级，或领取巡游所得。</p>':''}<p class="note center">${r.win?(r.trail?'下段会遇到新的敌情，继续挑战个人纪录。':r.stars<3?'试试新阵型，争取全员存活与八回合内获胜。':current.level===10?'无尽远行已经开启，去看看下一段风景。':'灵感能指定突变，新的伙伴也许适合下一关。'):'看一眼敌情，调整前排猫与战术，或培养新的技能搭配。'}</p>`,btn('调整小队 · 继续挑战','result-team',{tone:1,icon:10})+btn('回猫村','result-home',{tone:2,icon:8}),r.win?15:1);}
function finishBattle(){return MeowSave.exclusive(()=>{if(syncSave())return;const current=battle;if(!current?.result)return;clearTimeout(battleTimer);const r=G.settle(state,current);if(!r)return;rewardPending={battle:current,reward:r};if(!save())return;render();setTimeout(()=>{if(page!=='battle'||battle!==current)return;showNextCelebration();},200);});}


let breedFocus=null,mutationPlan=null,rareDew=0,battleMode='story',challengeId=null,wishOpen=true;
const pct=n=>(Math.round(n*1000)/10)+'%';
const stars=n=>`<span class="star-rating" aria-label="${n}颗星">${Array.from({length:3},(_,i)=>icon(15,i<n?'star-earned':'star-empty')).join('')}</span>`;
function progression(c){const l=G.levelInfo(c);return `<p class="small center">历练 Lv.${l.level} ${l.next?resource(2,l.current+'/'+l.next):'等级已满'}<br>${c.growthRank===2?'已结业 · 可传习':!c.growthPath?'Lv.3 可选专长':c.growthRank===0?'下一站 Lv.6 专长突破':'下一站 Lv.10 结业觉醒'}</p>`;}
const resourceNames=['铜钱','灵感','历练经验','星露','心愿叶'];
function resourceIcon(i){if(i===4)return '<span class="leaf-currency">'+icon(3)+'</span>';return `<span class="resource-icon" aria-hidden="true" style="background-position:${i%2*100}% ${Math.floor(i/2)*100}%"></span>`;}
function resource(i,value){return `<span class="resource-chip" title="${resourceNames[i]} ${esc(value)}" aria-label="${resourceNames[i]} ${esc(value)}">${resourceIcon(i)}<span>${esc(value)}</span></span>`;}
function rareNote(c){return G.rare(c)?panel(`<h3 class="red">超稀有 · ${G.RARES[c.rareGene].name}</h3><p class="note">${G.RARES[c.rareGene].desc}</p><p class="small">保留双亲的基础基因与本领，额外拥有稀有外观和天赋。</p>`,'rare-note'):'';}
function birthOption(label, action, id, active, disabled=false) {
  return btn(label,action,{id,tone:active?1:2,cls:'compact',pressed:active,disabled});
}

function rarePreference() {
  return `<section class="birth-controls">
    <div class="birth-control-heading"><h3>抽中超稀有后</h3></div>
    <div class="birth-choices two" role="group" aria-label="抽中后的品种偏好">
      ${birthOption('探索新品种','rare-mode','explore',rareMode==='explore')}
      ${birthOption('传承亲本','rare-mode','inherit',rareMode==='inherit')}
    </div><p class="birth-hint">${rareMode==='explore'?'优先未收录品种，集齐后随机。':'有稀有亲本时，60% 沿袭亲本，其余随机。'}</p>
    <div class="birth-minor-actions">${btn('3 灵感换 1 星露','craft-dew',{tone:2,cls:'compact',disabled:state.geneNotes<3})}
      ${btn('看稀有图鉴','rare-book',{tone:2,cls:'compact'})}</div>
  </section>`;
}
function rareBook(){return shell('稀有猫手记','下一次相逢，会是谁',`${bookTop()}<p class="note center">已遇见 ${state.rareSeen.length} / 6 · 点卡片看天赋</p><div class="rare-catalog">${G.RARES.map((r,i)=>`<button class="skin cat-card ${state.rareSeen.includes(i)?'':'undiscovered'}" data-action="rare-detail" data-id="${i}">${skin()}${discoverySprite({rareGene:i,color:0,pattern:0,ears:0,mutation:null},state.rareSeen.includes(i))}<strong>${r.name}</strong><span class="small">${state.rareSeen.includes(i)?'已点亮':'尚未遇见'}</span><span class="small">${r.desc.split('：')[0]}</span></button>`).join('')}</div>${btn('带着期待去繁育','breed',{icon:9})}`,'book');}
function resourceInfo(){modal('小院里的四样宝贝',`<div class="resource-legend"><p>${resource(0,state.coins)} 铜钱：新纪录、个人历练、心愿与巡游获得；用于繁育、特训、突破和传习。</p><p>${resource(1,state.geneNotes)} 灵感：新猫、重复模样与新星纪录获得；6 点指定普通突变，或 3 点凝成星露。</p><p>${resource(2,'+')} 历练经验：首次历练、特训和巡游心得获得；Lv.3 选专长、Lv.6 突破、Lv.10 结业。</p><p>${resource(3,state.starDew)} 星露：提升超稀有概率；新星纪录或远行胜利可得 1 滴。</p></div>`,btn('去繁育','breed',{icon:9}));}

let growthChoice=null,growthTab='skills',academyFilter='all',lessonChoice=null;
let growthGoalRoute=null;
let growthId=state.team[0]||state.cats[0].id,rosterFilter='all',rosterSort='recent',rareMode='explore';
function pathName(c){return G.Growth.PATHS.find(p=>p.id===c.growthPath)?.name||'未选专长';}
function filteredCats(){let list=state.cats.filter(c=>(rosterFilter==='all'||rosterFilter==='favorite'&&c.favorite||rosterFilter==='rare'&&G.rare(c)||rosterFilter==='support'&&[1,2,6,8,9].includes(c.skill)||rosterFilter==='attack'&&![1,2,6,8,9].includes(c.skill)));return list.sort((a,b)=>rosterSort==='level'?G.levelInfo(b).level-G.levelInfo(a).level||b.id-a.id:rosterSort==='skill'?a.skill-b.skill||b.id-a.id:b.id-a.id);}
function referenceEntry(title, contents, iconId, hint = '') {
  return `<div class="reference-entry">
    <button type="button" class="reference-link skin" data-action="read-reference" aria-haspopup="dialog">
      ${skin('button',2)}${icon(iconId)}<strong>${title}</strong>${hint ? '<small>'+hint+'</small>' : ''}<span aria-hidden="true">›</span>
    </button><template>${contents}</template></div>`;
}

function collectionCards(action){return filteredCats().map(c=>card(c,action,action==='select'?parents.includes(c.id):action==='team-select'?state.team.includes(c.id):false,action==='select'&&parents.includes(c.id)?(parents.indexOf(c.id)===0?'甲':'乙'):action==='team-select'&&state.team.includes(c.id)?(state.team.indexOf(c.id)===0?'前排 +20盾':'已出战'):'')).join('')||'<p class="empty-message">没有符合条件的猫，试试清除筛选。</p>';}
function collection(action){return `<div class="collection-tools"><div class="filter-row">${[['all','全部'],['favorite','收藏'],['rare','稀有'],['attack','输出'],['support','辅助']].map(([id,name])=>btn(name,'cat-filter',{id,tone:rosterFilter===id?1:2,cls:'compact'})).join('')}</div><div class="filter-row">${[['recent','最近加入'],['level','等级优先'],['skill','按本领']].map(([id,name])=>btn(name,'cat-sort',{id,tone:rosterSort===id?1:2,cls:'compact'})).join('')}${btn('重置','cat-clear',{tone:2,cls:'compact'})}</div></div><div class="roster" id="cat-list" data-card-action="${action}">${collectionCards(action)}</div>`;}
function pathEffect(p,c){const r=c.growthRank||0;return p.id==='guardian'?'生命 +'+(8+r*4)+'%，开场为自己添 '+(8+r*8)+' 护盾。':p.id==='hunter'?'攻击 +'+(6+r*3)+'%'+(r?'，首次攻击额外 +'+(r===2?25:15)+'%。':'；突破后强化首次攻击。'):'生命 +6%，治疗与护盾效果 +'+(12+r*6)+'%。';}
function favoriteStar(c){return `<button class="favorite-toggle ${c.favorite?'is-favorite':''}" data-action="favorite" data-id="${c.id}" aria-label="${c.favorite?'取消收藏':'收藏'}${esc(c.name)}" aria-pressed="${!!c.favorite}" title="${c.favorite?'取消收藏':'收藏'}">${icon(15)}</button>`;}
function growthPicker(route=growthGoalRoute){growthGoalRoute=route;const labels={growth:'想陪哪只猫成长？',path:'为哪只猫选择专长？',breakthrough:'让哪只猫突破？',master:'让哪只猫结业？',mentor:'请哪位老师指导？'};
 const status=c=>{const l=G.levelInfo(c).level,m=G.Growth.milestone(c);if(route==='path')return {ready:l>=3&&!c.growthPath,text:c.growthPath?'已有专长 · 可以更换':l>=3?'可以选择专长':'Lv.3 开启专长'};if(route==='breakthrough'||route==='master'){const rank=route==='breakthrough'?0:1,level=rank?10:6;return {ready:c.growthRank===rank&&m.ready,text:c.growthRank>rank?'这一阶段已完成':c.growthRank===rank&&m.ready?'已满足成长条件':'需要 Lv.'+level+' 与关卡历练'};}if(route==='mentor')return {ready:c.growthRank===2,text:c.growthRank===2?'已结业 · 可以指导':'结业后可指导伙伴'};return {ready:true,text:pathName(c)};};
 const list=[...state.cats].sort((a,b)=>Number(status(b).ready)-Number(status(a).ready)||G.levelInfo(b).level-G.levelInfo(a).level);
 modal(labels[route]||'换一位成长伙伴',`<p class="small center">先选小猫，再安排它的成长。暂未达标的伙伴也能继续培养。</p><div class="growth-picker-grid">${list.map(c=>{const t=status(c);return `<button class="skin growth-picker-cat" data-action="growth-select" data-id="${c.id}">${skin()}${sprite(c)}<strong>${esc(c.name)}</strong><span>Lv.${G.levelInfo(c).level}</span><small class="${t.ready?'green':''}">${t.text}</small></button>`;}).join('')}</div>`,btn('暂时返回','modal-close',{tone:2}));modalRoot.querySelector('.modal').classList.add('growth-picker-modal');}
function growthJourney(c){const l=G.levelInfo(c),value=Math.min(10,l.level+(l.next?l.current/l.next:0)),percent=(value-1)/9*100;return `<section class="growth-journey" aria-label="成长路线"><div class="journey-heading"><strong>成长路线</strong><span>Lv.${l.level} / 10${l.next?' · '+l.current+'/'+l.next+' 经验':' · 等级已满'}</span></div><div class="journey-track-area"><div class="journey-meter" role="progressbar" aria-label="等级成长进度" aria-valuemin="1" aria-valuemax="10" aria-valuenow="${value.toFixed(2)}" aria-valuetext="当前等级 ${l.level}，${l.next?'本级经验 '+l.current+'/'+l.next:'等级已满'}；阶段完成状态请查看节点"><span class="journey-ink journey-base">${skin('button',2)}</span><span class="journey-ink journey-fill" style="clip-path:inset(0 ${100-percent}% 0 0)">${skin('button',1)}</span></div><span class="journey-start">Lv.1</span>${[[3,'选专长'],[6,'专长突破'],[10,'结业觉醒']].map(([level,name],index)=>{const done=index===0?!!c.growthPath:c.growthRank>=index,available=!done&&l.level>=level,status=done?'已完成':available?index===0?'可选择':'待'+(index===1?'突破':'结业'):'未开启';return `<button class="journey-node ${done?'complete':available?'available':'locked'}" data-action="growth-node" data-id="${level}" style="left:${(level-1)/9*100}%" aria-label="Lv.${level} ${name}，${status}，点击查看要求">${icon(15,'journey-star')}<b>Lv.${level}</b><span>${name}</span><small>${status}</small></button>`;}).join('')}</div></section>`;}
function growthNode(level){const c=cat(growthId)||state.cats[0],l=G.levelInfo(c),index=[3,6,10].indexOf(level);if(index<0)return;const done=index===0?!!c.growthPath:c.growthRank>=index,wins=index===1?2:4,name=['选专长','专长突破','结业觉醒'][index];modal('Lv.'+level+' · '+name,`<p>${done?'这一站已经完成。':'当前 Lv.'+l.level+'，'+(l.level>=level?'等级已达成。':'还需达到 Lv.'+level+'。')}</p>${index===0?'<p class="note">达到 Lv.3 后，免费选择护院、追风或妙手，并学会对应第一项被动。以后也能免费更换。</p>':'<p class="note">不同关卡历练 '+Math.min(c.trialWins.length,wins)+' / '+wins+' · '+(c.trialWins.length>=wins?'已达成':'带它赢过更多不同关卡')+'</p><p class="small">'+(index===1?'需先选择专长。':'需先完成 Lv.6 专长突破。')+'等级达标后，还需满足历练条件并确认'+(index===1?'突破':'结业')+'。</p><p class="note">'+(done?'已完成，本阶段不会重复扣费。':'确认时消耗 '+resource(0,index===1?150:300)+' '+resource(1,index===1?2:4))+'</p>'}${c.growthPath?'<p class="note">新能力：'+G.Growth.lessons(c)[index].name+' · '+G.Growth.lessons(c)[index].desc+'</p>':''}${index===2?'<p class="small">结业后可以指导新伙伴直接成长到 Lv.3。</p>':''}`,btn('知道了','modal-close',{tone:2}),15);}
function growthSelection(c){return G.Growth.PATHS.find(p=>p.id===(growthChoice?.cat===c.id?growthChoice.path:c.growthPath))||G.Growth.PATHS.find(p=>p.id===catJob(c)[1])||G.Growth.PATHS[0];}
function pathCard(c, path, preview) {
  const active=c.growthPath===path.id, selected=preview.id===path.id;
  const role={guardian:'保护与救援',hunter:'控制与追击',healer:'解毒与转盾'};
  const card=`<button class="skin growth-option" data-action="growth-preview" data-id="${path.id}" aria-pressed="${selected}">
    ${skin('button',selected?1:2)}${icon(path.icon)}<strong>${path.name}</strong><small>${active?'已生效':role[path.id]}</small></button>`;
  if(!selected||active)return beneathCard(card);
  const locked=G.levelInfo(c).level<3;
  return beneathCard(card,cardAction(locked?'Lv.3 开启':'学习','growth-path',path.id,'学习'+path.name,locked));
}

function milestoneAction(c, path, lesson) {
  const m=G.Growth.milestone(c);
  if(c.growthPath!==path || m.step!=='advance' || lesson.level!==m.level)return '';
  if(!m.ready)return cardAction('去历练','growth-trial',c.id,'带'+c.name+'去历练');
  const cost=resource(0,m.coins)+' '+resource(1,m.notes);
  return cardAction(lesson.level===6?'突破':'结业','growth-advance',c.id,m.label+'，消耗 '+m.coins+' 铜钱和 '+m.notes+' 灵感',state.coins<m.coins||state.geneNotes<m.notes)+
    `<small class="card-cost">${cost}</small>`;
}
const JOBS=[
 ['连击输出','hunter','两次挥爪，适合集中火力','搭配冰铃或藤缚，追风专长可利用控制破绽。','遇到反击敌人，两次出爪也会吃两次反击。'],
 ['添盾保护','guardian','提前给最虚弱的伙伴添盾','搭配高输出、低生命的队友；护院突破还能救急。','护盾不能阻止中毒的持续掉血。'],
 ['治疗续航','healer','照顾生命比例最低的伙伴','妙手解锁解毒；突破后满血治疗也能转成盾。','没有治疗射程限制，但会占用这次行动。'],
 ['毒伤消耗','hunter','让敌人在自己的行动前掉血','适合消耗带盾敌人，搭配护院拖住战线。','春风和妙手直接治疗能清除中毒。'],
 ['机动输出','hunter','更快行动，偶尔追加挥爪','适合先接敌；追风突破后击杀还能追加行动。','25% 追加攻击不是必定触发。'],
 ['受击反制','guardian','挨直接攻击时反击','适合与挑衅、护盾搭配；护院照看另一位伙伴。','毒伤不触发反击，倒下后也不能反击。'],
 ['挑衅保护','guardian','吸引敌人并给自己加盾','让脆弱队友安心输出，护院进一步提供救援。','挑衅有冷却，不保证全程吸引攻击。'],
 ['冻结控制','hunter','射程两格，冻结一次行动','与追风伙伴搭配，让它攻击受控目标。','刚解冻的敌人会短暂抵抗再次冻结。'],
 ['净化回春','healer','清除毒、冻结、定身','遇到毒爪和藤缚队伍时优先考虑。','持续回春不重复触发妙手的直接治疗被动。'],
 ['全队鼓舞','guardian','强化全队后续攻击','搭配两位输出猫；护院给辅助增加保护用途。','移动与辅助不消耗鼓舞，效果不重复叠加。'],
 ['推掌位移','hunter','推开相邻目标，堵住退路可撞伤','靠墙和岩石作战，利用站位制造额外伤害。','方脑壳免疫击退与撞墙附伤。'],
 ['直线牵制','hunter','同排同列三格攻击并定身','限制近战接近，给追风队友制造攻击窗口。','斜线无法攻击；岩石和单位会阻挡射线。']
];
function catJob(c){return JOBS[c.skill]||JOBS[0];}
function buildBrief(c){const j=catJob(c);return '<span class="build-job">'+skillIcon(c.skill)+j[0]+'</span><span class="small">'+(c.growthPath?pathName(c)+' · '+G.Growth.lessons(c).filter(x=>x.unlocked).map(x=>x.name).join(' / '):j[2])+'</span>';}
function growthNext(c){const m=G.Growth.milestone(c),l=G.levelInfo(c).level;if(!c.growthPath)return l>=3?'可领悟：选择专长，学第一项被动':'下一站 Lv.3：选择专长，学第一项被动';if(c.growthRank<2){const n=G.Growth.lessons(c)[c.growthRank+1];return (m.ready?(state.coins>=m.coins&&state.geneNotes>=m.notes?'可领悟：':'待攒资源：'):'下一站 Lv.'+n.level+'：')+n.name;}return '已结业：三项专长能力已解锁，可指导新猫';}
function canStudyPath(c) {
  const next = G.Growth.milestone(c);
  return next.ready && (next.step !== 'advance' || state.coins >= next.coins && state.geneNotes >= next.notes);
}

function academyList() {
  const support = c => [1,2,6,8,9].includes(c.skill);
  const filters = {all:()=>true, ready:canStudyPath, team:c=>state.team.includes(c.id), support, attack:c=>!support(c)};
  return state.cats.filter(filters[academyFilter]).sort((a,b)=>
    Number(canStudyPath(b))-Number(canStudyPath(a)) ||
    Number(state.team.includes(b.id))-Number(state.team.includes(a.id)) || b.id-a.id);
}

function academy() {
  const list = academyList();
  const filters = [['all','全部'],['ready','可领悟'],['team','出战'],['support','辅助'],['attack','输出']];
  const cards = list.map(c => `<button class="skin academy-cat" data-action="growth-open" data-id="${c.id}">
    ${skin()}${sprite(c)}<strong title="${esc(c.name)}"><span>${esc(c.name)}</span><small>Lv.${G.levelInfo(c).level}</small></strong>
    <span class="mini-skill">${skillIcon(c.skill)}${G.SKILLS[c.skill].name}</span></button>`).join('');
  const tools = btn('猫咪学堂','training-open',{id:cat(trainingId)?.id||state.cats[0].id,tone:2,icon:11,cls:'compact'}) +
    (G.canWelcome(state)?btn('迎接山客','gene-guest',{tone:1,cls:'compact',icon:8}):'');
  return shell('猫咪养成','伙伴名册',`<div class="album-tools"><h2>伙伴 <small>${list.length} 只</small></h2>${tools}</div>
    <div class="academy-filters">${filters.map(([id,label])=>btn(label,'academy-filter',{id,tone:academyFilter===id?1:2,cls:'compact'})).join('')}</div>
    <div class="academy-cats">${cards||'<p class="album-empty">这里暂时没有伙伴，试试其他筛选。</p>'}</div>`, 'academy');
}

let browsingCats = [];
function turnCatArrow(step, count) {
  const name = step<0?'上一只猫':'下一只猫';
  return `<button class="turn-cat" data-action="turn-cat" data-id="${step}" aria-label="${name}" title="${name}" ${count<2?'disabled':''}>${icon(13)}</button>`;
}
function catNameStrip(c, ids) {
  return `<div class="cat-name-strip">${turnCatArrow(-1,ids.length)}<h2 class="growth-cat-name"><span>${esc(c.name)}</span><small>Lv.${G.levelInfo(c).level}</small></h2>${turnCatArrow(1,ids.length)}</div>`;
}
function growthKindTab(tab) {
  const skills=tab==='skills', selected=growthTab===tab;
  const title=skills?'本领':'专长';
  const art=skills
    ? visualIcon(0)+visualIcon(15,'kind-arrow')+visualIcon(14)
    : [1,2,3].map(n=>icon(15,'kind-step step-'+n)).join('');
  return `<div class="kind-choice kind-${tab}">
    <button class="skin portrait-slot" data-action="growth-tab" data-id="${tab}" aria-pressed="${selected}" aria-describedby="kind-${tab}-hint">
      ${skin('button',selected?(skills?3:1):2)}
      <span class="kind-art" aria-hidden="true">${art}</span><strong>${title}</strong>
    </button>
    <small id="kind-${tab}-hint">${skills?'上阵用的招式':'成长解锁的被动'}</small>
  </div>`;
}

function catShowcase(c) {
  const path=G.Growth.PATHS.find(p=>p.id===c.growthPath), level=G.levelInfo(c);
  return `<section class="cat-showcase">${catNameStrip(c,browsingCats)}
    <div class="path-status ${path?'chosen':'pending'}" aria-live="polite">
      ${icon(path?.icon??15)}<strong>${path?'已选专长 · '+path.name:'尚未选择专长'}</strong>
      ${path?'':`<small>${level.level<3?'Lv.3 解锁':growthTab==='path'?'请选择并确认路线':'点专长选择路线'}</small>`}</div>
    <div class="portrait-slots">${growthKindTab('skills')}
      <div class="portrait-subject">${sprite(c)}<button class="growth-switch" data-action="growth-picker">换一只 ›</button></div>
      ${growthKindTab('path')}</div>
    <div class="cat-xp"><small>${level.next?'经验 '+level.current+' / '+level.next:'等级已满'}</small><progress aria-label="本级经验" value="${level.next?level.current:1}" max="${level.next||1}"></progress></div>
    ${stats(G.trained(c))}</section>`;
}
function lessonPanel(c,path) {
  const lessons=G.Growth.lessons(c,path);
  const selected=lessons.find(x=>x.level===lessonChoice)||lessons.find(x=>!x.unlocked)||lessons.at(-1);
  const preview=path!==c.growthPath;
  const cards=lessons.map(lesson=>{
    const focused=lesson.level===selected.level;
    const status=preview?'预览':lesson.unlocked?'已生效':'待解锁';
    const card=`<button class="skin lesson-tab ${lesson.unlocked?'learned':''}"
      data-action="lesson-preview" data-id="${lesson.level}" aria-pressed="${focused}">
      ${skin('button',focused?1:2)}${icon(lesson.icon)}<b>Lv.${lesson.level}</b>
      <small>${lesson.name}</small><span class="lesson-state">${status}</span></button>`;
    return beneathCard(card,milestoneAction(c,path,lesson));
  }).join('');
  const status=selected.unlocked?'被动 · 已生效':preview?'被动预览 · Lv.'+selected.level+' 成长节点':'被动 · 完成成长节点后生效';
  return `<div class="lesson-panel"><div class="lesson-tabs">${cards}</div>
    <div class="lesson-description" aria-live="polite"><p class="small">${status}</p><h3>${selected.name}</h3>
    ${lessonEffect(path,selected.level)}<p>${selected.desc}</p></div></div>`;
}
function growthCare(c){const l=G.levelInfo(c);return `<section class="direct-info"><h3>培养与心得</h3><div class="training-wallet">${resource(0,state.coins)}${resource(2,state.studyXP+' 心得')}</div><p class="small">首次历练、新纪录与巡游都能积累经验。</p>${btn('带它去历练','growth-trial',{id:c.id,tone:2,cls:'compact'})}<div class="inline-actions">${btn('特训 '+resource(0,80),'growth-train',{id:c.id,tone:2,cls:'compact',disabled:l.level>=10||state.coins<80})}${btn('使用心得','study',{id:c.id,tone:2,cls:'compact',disabled:l.level>=10||!state.studyXP})}</div><p class="small">特训 +40 经验 · 心得每次最多 +40</p>${c.growthRank===2?state.cats.filter(x=>x.id!==c.id&&!x.mentored&&G.levelInfo(x).level<3).map(x=>btn('指导'+esc(x.name)+' '+resource(0,100)+' '+resource(1,1),'mentor',{id:x.id,tone:2,cls:'compact',disabled:state.coins<100||state.geneNotes<1})).join(''):''}</section>`;}
function growth(){const c=cat(growthId)||state.cats[0];growthId=c.id;G.Growth.migrate(c);const l=G.levelInfo(c),m=G.Growth.milestone(c),p=growthSelection(c),job=catJob(c),recommended=G.Growth.PATHS.find(x=>x.id===job[1]);let content='';
 if(growthTab==='skills')content=`<section class="growth-main-skill"><p class="small">出战招式 · 当前携带</p><h3>${skillIcon(c.skill)}${G.SKILLS[c.skill].name}</h3><div class="skill-local-action">${btn('调整本领','training-open',{id:c.id,tone:2,cls:'compact'})}</div>${skillEffect(c)}<div class="skill-notes"><p><b>效果</b>${G.SKILLS[c.skill].desc}</p>${G.combatProfile(c).support?`<p><b>作用范围</b>${G.combatProfile(c).support}</p>`:''}<p><b>搭配</b>${job[3]}</p><p class="red"><b>留意</b>${job[4]}</p></div>${rangeCards(c)}</section>${c.mutation!==null?panel(`<h3>${icon(G.MUTATIONS[c.mutation].icon)}${G.MUTATIONS[c.mutation].name}</h3><p class="small">${G.MUTATIONS[c.mutation].desc}</p>`,'panel-tight'):''}${rareNote(c)}`;
 if(growthTab==='path')content=`${growthJourney(c)}<p class="growth-recommend">${skillIcon(c.skill)}${job[0]} · 可以试试${recommended.name}</p><div class="growth-options" role="group" aria-label="预览专长方向">${G.Growth.PATHS.map(q=>pathCard(c,q,p)).join('')}</div><section class="growth-preview"><h3>${c.growthPath===p.id?'专长被动 · ':'被动预览 · '}${p.name}</h3>${lessonPanel(c,p.id)}</section>${p.id==='healer'&&![2,8].includes(c.skill)&&c.rareGene!==2?'<p class="note red">当前本领没有直接治疗。学堂切换治愈或春风，才能触发这条路线的治疗被动。</p>':''}<section class="direct-info"><h3>基础属性加成</h3><p class="small">${pathEffect(p,c)}</p></section><p class="small">同一时间修习一条路线；可免费重选，已完成的突破与结业保留。Lv.6 / Lv.10 还需完成历练并确认解锁。</p>${growthCare(c)}`;
 return shell('伙伴修习','本领与专长，练出自己的打法',`<div class="growth-studio">${catShowcase(c)}${content}<div class="growth-secondary">${favoriteStar(c)}<span class="small">${c.favorite?'已收藏伙伴':'收藏这位伙伴'}</span></div></div>`,'academy');}

function compareCat(id){const c=cat(id);if(!c)return;const n=G.trained(c);modal('谁更适合这次出战？',`<div class="compare-candidate">${sprite(c)}<div><h3>${esc(c.name)}</h3><p class="small">${G.SKILLS[c.skill].name} · Lv.${G.levelInfo(c).level}</p></div></div><p class="small center">${catJob(c)[3]}</p><p class="small center">由队友换成${esc(c.name)}后的变化</p>${state.team.map(oldId=>{const old=cat(oldId),o=G.trained(old);return panel(`<div class="compare-member">${sprite(old)}<div><h3>${esc(old.name)}</h3><p class="small">${G.SKILLS[old.skill].name} · Lv.${G.levelInfo(old).level}</p></div></div><p class="small">${catJob(old)[0]} → ${catJob(c)[0]}<br>${pathName(old)} → ${pathName(c)}</p><div class="compare-stats">${[['hp','生命'],['atk','攻击'],['speed','速度']].map(([k,label])=>{const d=n[k]-o[k];return `<div><span>${label}</span><span>${o[k]} → ${n[k]}</span><b class="stat-delta ${d>0?'green':d<0?'red':'muted'}">${d>0?'+':''}${d===0?'不变':d}</b></div>`;}).join('')}</div>${btn(oldId===c.id?'已在队伍':state.team.includes(c.id)?'已在其他位置':'接替'+esc(old.name),'compare-replace',{id:c.id+':'+oldId,tone:2,cls:'compact',disabled:state.team.includes(c.id)})}`,'panel-tight compare-card');}).join('')}`,btn('先保留现有小队','modal-close',{tone:2}));modalRoot.querySelector('.modal').classList.add('compare-modal');}

function birthHighlights(c){const unique=!state.team.some(id=>cat(id).skill===c.skill);return panel(`<h3>${unique?'小队里还没有的本领':'它带来了新的成长机会'}</h3><p class="note">${esc(c.name)}继承「${G.SKILLS[c.skill].name}」。${unique?'可以补上新的队伍分工。':'可以选择不同专长，培养成另一种队伍角色。'}</p><p class="small">锁定本领不会锁定外观；毛色、花纹和耳型分别遗传。</p>${btn('与小队伙伴比较','compare-cat',{id:c.id,tone:1,cls:'compact'})}`,'birth-highlights');}
function patrol(){const p=G.patrolInfo(state);modal('小队巡游',`<p>通关后，即使离开小院，也会积累铜钱与成长心得，最多保存 8 小时。</p><div class="reward-resources">${resource(0,p.coins)}${resource(2,p.xp)}</div><p class="small">已积累 ${p.minutes} 分钟 · 心得可在猫咪的成长手记中分配。</p><p class="small">重复挑战旧纪录不再无限产币。带新猫首次赢得不同关卡，仍有个人历练奖励。</p>`,btn('收下巡游所得','patrol-claim',{disabled:!p.coins&&!p.xp})+btn('去培养伙伴','roster',{tone:2}));}
function battleUnitDetail(uid){if(battlePending){battle=battlePending;battlePending=null;battleCue=null;render();}const u=battle?.units.find(x=>x.uid===uid);if(!u)return;clearTimeout(battleTimer);modal(`${u.side?'敌方':'我方'} · ${esc(u.name)}`,`${sprite(u)}<p>生命 ${u.life} / ${u.maxHp} · 护盾 ${u.shield}</p><p>${G.SKILLS[u.skill].name}：${G.SKILLS[u.skill].desc}</p>${skillEffect(u)}${rangeCards(u,true)}<p class="small">${G.Growth.lessons(u).filter(x=>x.unlocked).map(x=>x.name+'：'+x.desc).join('<br>')}</p><p class="note">${[['poison','毒伤'],['frozen','冰冻'],['rooted','定身'],['taunt','挑衅'],['regen','回春'],['fury','鼓舞']].filter(([k])=>u[k]>0).map(([k,n])=>n+' '+u[k]).join(' · ')||'目前没有持续状态'}</p>`,btn('继续观战','unit-resume',{tone:1}));modalRoot.querySelector('.modal').classList.add('unit-detail-modal');}


function planControls(a,b) {
  const directed=!!breedFocus;
  const labels={color:'毛色',pattern:'花纹',ears:'耳型',skill:'本领'};
  return `<section class="birth-controls genetics-controls">
    <div class="birth-control-heading"><h3>遗传设置</h3></div>
    <div class="birth-choices two" role="group" aria-label="遗传方式">
      ${birthOption('自然遗传','breed-mode','natural',!directed)}
      ${birthOption('指定一项 · +20 铜钱','breed-mode','directed',directed)}
    </div>
    ${directed?`<p class="birth-hint">选择从哪只亲本继承哪一项。</p>
      <div class="birth-choices two" role="group" aria-label="选择遗传来源">${[a,b].sort((x,y)=>x.id-y.id).map(c=>
        birthOption(esc(c.name),'breed-source',c.id,c.id===a.id)).join('')}</div>
      <div class="birth-choices four" role="group" aria-label="指定遗传特征">${Object.entries(labels).map(([id,name])=>
        birthOption(name,'breed-focus',id,breedFocus===id)).join('')}</div>
      ${a[breedFocus]===b[breedFocus]?'<p class="birth-hint red">双亲这项相同，用自然遗传可省 20 铜钱。</p>':''}`:''}
  </section>`;
}

function offspringPreview(a,b) {
  const p=G.possibilities(state,a,b,breedFocus);
  return `${referenceEntry('后代模样',`<p class="small">基础外观的新图鉴概率；未发现的猫只显示剪影。</p><div class="outcome-list">${p.outcomes.map(c=>`<div class="outcome">${discoverySprite(c,state.seen.includes(G.key(c)))}<span>${G.COLORS[c.color]}·${G.PATTERNS[c.pattern]}<br>${G.EARS[c.ears]} · ${pct(c.chance)}${c.newLook?' · 新':''}</span></div>`).join('')}</div><p class="small">${['color','pattern','ears'].every(k=>a[k]===b[k])?'双亲基础外观相同，普通后代会相似，仍有突变机会。':'基础外观按各项独立遗传，超稀有外观另行判定。'}</p>`,9,'新图鉴 '+pct(p.novelChance))}`;
}

function mutationPortrait(i){const owned=state.cats.find(c=>c.mutation===i&&!G.rare(c)),sample=owned||{color:0,pattern:0,ears:0,mutation:i};return discoverySprite(sample,state.mutationSeen.includes(i));}
function mutationGallery(action){return `<div class="catalog-grid mutation-gallery">${G.MUTATIONS.map((m,i)=>`<button class="skin cat-card" data-action="${action}" data-id="${i}">${skin()}${mutationPortrait(i)}<strong>${m.name}</strong><span class="small">${state.mutationSeen.includes(i)?'已发现':'未发现'}</span></button>`).join('')}</div>`;}
function mutationPicker(){modal('想留下哪种小毛病？',`<p class="small">指定花费 ${resource(1,6)}；先自然发现新突变，才能定向培养。点卡片看作用。</p>${mutationGallery('mutation-preview')}`,btn('自然随机','mutation-plan',{id:'',tone:2}));modalRoot.querySelector('.modal').classList.add('mutation-picker-modal');}
function mutationDetail(i,picking=false){const m=G.MUTATIONS[i];if(!m)return;const seen=state.mutationSeen.includes(i),owned=state.cats.find(c=>c.mutation===i),canPick=(i<3||seen)&&state.geneNotes>=6;modal(m.name,`<div class="mutation-portrait">${mutationPortrait(i)}</div>${picking?btn('指定这只 '+resource(1,6),'mutation-plan',{id:i,tone:1,disabled:!canPick})+(!canPick?'<p class="small">'+(!seen&&i>=3?'先自然发现这类突变。':'还需积攒灵感。')+'</p>':''):''}<p class="center mutation-joke">${seen?(m.joke||'小小变化，也是它的拿手好戏。'):'先留一点悬念，等它来到小院。'}</p><p class="note">${m.desc}</p><p class="small">${seen?'已收录；突变不改变基础遗传项，出战效果另外生效。':'自然繁育可遇见：普通突变基础 8%，连续 7 次未出后下一次保证突变；优先未收录种类。'}</p>`,picking?btn('返回挑选','mutation-picker',{tone:2}):owned?btn('看看它','detail',{id:owned.id}):btn('去繁育','breed',{tone:1}));}
function ordinaryOutcome() {
  const name=G.MUTATIONS[mutationPlan]?.name;
  if(name) return {chance:1,status:'指定 · '+name};
  if(useBlessing&&state.blessings>0) return {chance:1,status:'心愿叶保底'};
  if(state.dryStreak>=7) return {chance:1,status:'本次保底'};
  return {chance:.08,status:'最多再 '+(8-state.dryStreak)+' 次必出'};
}

function birthOdds(ordinary,rare) {
  return `<section class="birth-odds" aria-label="本次出生概率">
    <div class="birth-odds-grid" aria-live="polite">
      <div class="birth-outcome ordinary"><h3>${icon(3)} 普通突变</h3>
        <strong>${pct(ordinary.chance)}</strong><p>额外特征 · 如叶芽尾</p><small>${ordinary.status}</small></div>
      <div class="birth-outcome rare"><h3>${resourceIcon(3)} 超稀有品种</h3>
        <strong>${pct(rare.chance)}</strong><p>稀有外形＋专属天赋</p><small>${rare.pity?'本次保底':'最多再 '+rare.remaining+' 次必出'}</small></div>
    </div>
    <p class="birth-hint center">两项分别抽，同一只小猫可以同时拥有。</p>
  </section>`;
}

function nurserySettings() {
  const [a,b]=parents.map(cat);
  if(!a||!b)return;
  const m=G.MUTATIONS[mutationPlan];
  modal('繁育设置',planControls(a,b)+`<section class="birth-controls">
    <div class="birth-control-heading"><h3>指定普通突变</h3></div>
    <p class="birth-hint">${m?'本次指定 '+m.name+' · 消耗 6 灵感':'花费 6 灵感，可指定一种普通突变。'}</p>
    <div class="birth-minor-actions">${btn(m?'换一种':'挑一种','mutation-picker',{tone:2,cls:'compact'})}
      ${m?btn('取消指定','mutation-plan',{id:'',tone:2,cls:'compact'}):''}</div>
    </section>`+rarePreference(),btn('返回小屋','modal-back',{tone:2}),9);
  modalRoot.querySelector('.modal').classList.add('nursery-settings-modal');
}

function refreshNurserySettings() {
  const settings=modalRoot.querySelector('.nursery-settings-modal');
  const scroll=settings?.querySelector('.modal-scroll').scrollTop||0;
  render();
  if(settings) {
    nurserySettings();
    modalRoot.querySelector('.modal-scroll').scrollTop=scroll;
  }
}

const nurseryMaterials = {
  leaf:{name:'心愿叶',effect:'投入 1 片，必出一种随机普通突变。每次最多 1 片。'},
  dew:{name:'星露',effect:'每滴让超稀有概率增加 4 个百分点。每次最多 3 滴。'}
};
function materialCount(kind) { return kind==='leaf'?Number(useBlessing&&state.blessings>0):rareDew; }
function nurserySupplies() {
  return `<section class="nursery-supplies" aria-label="繁育道具">
    <p class="nursery-material-hint skin" hidden role="status">${skin('button',2)}<span></span></p>
    ${Object.entries(nurseryMaterials).map(([kind,{name}])=>`<div class="material-box ${kind}" data-material="${kind}">
      <button class="material-tap" data-action="breed-material" data-id="${kind}" type="button" aria-description="${nurseryMaterials[kind].effect}">
        <span class="material-art" aria-hidden="true"></span><span class="material-label">${name}</span><span class="material-count"></span>
      </button><button class="material-minus" type="button" data-action="breed-remove-material" data-id="${kind}" aria-label="取回一个${name}" hidden>−</button>
    </div>`).join('')}
    <button class="nursery-settings-link skin" data-action="nursery-settings">${skin('button',2)}<span>繁育设置</span></button>
  </section>`;
}
function refreshNurseryMaterials() {
  for(const box of screen.querySelectorAll('.material-box')){
    const kind=box.dataset.material, balance=kind==='leaf'?state.blessings:state.starDew, count=materialCount(kind);
    const button=box.querySelector('.material-tap');
    box.classList.toggle('has-material',count>0);
    box.querySelector('.material-count').textContent='已投 '+count+' / 持有 '+balance;
    box.querySelector('.material-minus').hidden=count===0;
    button.setAttribute('aria-label',nurseryMaterials[kind].name+'，已投 '+count+'，持有 '+balance);
  }
}
function changeNurseryMaterial(kind,step) {
  if(page!=='breed'||!nurseryMaterials[kind])return false;
  const before=materialCount(kind);
  if(kind==='leaf'){
    useBlessing=step>0&&state.blessings>0;
    if(useBlessing)mutationPlan=null;
  }else{
    const limit=G.rarityInfo(state,...parents.map(cat)).pity?0:Math.min(3,state.starDew);
    rareDew=Math.max(0,Math.min(limit,rareDew+step));
  }
  if(before===materialCount(kind))return false;
  refreshNurseryMaterials();
  const footer=screen.querySelector('.nursery-footer');
  if(footer)footer.innerHTML=nurseryActions();
  return true;
}
function showMaterialHint(kind) {
  const hint=screen.querySelector('.nursery-material-hint');
  if(!hint)return;
  const data=nurseryMaterials[kind];
  const extra=kind==='dew'&&G.rarityInfo(state,...parents.map(cat)).pity?' 本次保底，星露无需投入。':'';
  hint.querySelector(':scope>span:last-child').textContent=data.name+' · '+data.effect+extra;
  hint.hidden=false;
  clearTimeout(materialHintTimer);
  materialHintTimer=setTimeout(()=>{hint.hidden=true;},4300);
}
let materialHintTimer;
function comboDetail(id){const [color,pattern,ears]=id.split('-').map(Number),c={color,pattern,ears,mutation:null},seen=state.seen.includes(id);modal(seen?G.lookName(id):'尚未发现的模样',`${discoverySprite(c,seen)}<p class="center">${seen?'已经点亮这页图鉴':'遇见后，才会揭晓它真正的模样。'}</p><p class="note">通过繁育或迎接新伙伴，发现更多毛色、花纹与耳型组合。</p>`,btn('去繁育','breed',{icon:9})+btn('关闭','modal-close',{tone:2}),11);}
function squadCoach(){const members=state.team.map(cat),rule=G.encounter(state,stage,battleMode),poison=rule.skills.includes(3),control=rule.skills.some(i=>[7,11].includes(i)),counter=rule.skills.includes(5),hasCleanse=members.some(c=>c.skill===8||c.skill===2&&c.growthPath==='healer'),hasControl=members.some(c=>[7,11].includes(c.skill)),hasHunter=members.some(c=>c.growthPath==='hunter'),need=poison?'敌方会持续施毒':control?'敌方会限制行动或移动':counter?'敌方受击会反击':rule.skills.includes(2)?'敌方有治疗，要尽早减员':'先让输出有时间发挥';const idea=poison?(hasCleanse?'队伍已有解毒手段，留意治疗猫能否及时行动。':'带上会春风或清露解毒的伙伴。'):control?'春风可以解控；远程猫被定身后仍能攻击范围内目标。':counter?'多次直伤也会多次触发反击；毒爪消耗、添盾与治疗能减少损失。':rule.skills.includes(2)?'让输出猫靠同一侧站位，或用冰铃打断治疗。':'保护、输出与续航各有用途；也可以用控制争取速攻。';modal('这次怎么选猫？',`<p class="small">本关重点</p><h3>${need}</h3><p class="note">${idea}</p>${hasControl&&hasHunter?'<p class="green small">已形成配合：控制敌人 → 追风伙伴抓住破绽。</p>':''}<div class="coach-team">${members.map(c=>`<div>${sprite(c)}<strong>${esc(c.name)}</strong>${buildBrief(c)}<p class="small">${catJob(c)[3]}</p></div>`).join('')}</div><p class="small">相同外观不代表相同打法；先看本领、专长与突变，再比较等级。</p>`,btn('回棋盘换队友','modal-close',{tone:2}),10);}
function scouting(){if(battleMode==='challenge'){const d=G.Objectives.challenges.find(x=>x.id===challengeId),missing=G.Objectives.challengeSetup(state,challengeId);return panel('<h3>'+d.name+' · '+d.tier+'阶挑战</h3><p class="note">'+d.desc+'</p>'+(missing.length?'<p class="note red">还需调整：'+missing.join('；')+'</p>':'<p class="note green">阵容条件已满足，出发试试！</p>')+'<p class="small">'+(state.objectives.challengeWins.includes(d.id)?'印记已获得，本次是自由练习。':'首次达成奖励 '+goalRewards(d)+' '+resource(2,d.xp))+'</p>','scout-panel');}const rule=G.encounter(state,stage,battleMode),record=state.stageStars[stage]||0;return panel(`<div class="flex between"><h3>${battleMode==='trail'?'远行第 '+rule.floor+' 段':G.STAGES[stage-1]}</h3><b class="red">${battleMode==='trail'?'纪录 '+state.trailBest+' 段':stars(record)}</b></div><h3 class="choice-header">敌情 · ${rule.name}</h3><p class="small">${rule.skills.map(i=>G.SKILLS[i].name).join(' / ')}${rule.shield?' · 入场护盾 '+rule.shield:''}</p><p class="note">${rule.tip}</p><p class="small">${battleMode==='trail'?'胜利获得 '+resource(1,2)+' '+resource(3,1)+' 与铜钱，下一段敌情轮换。':'三星条件：胜利 / 全员存活 / 8 回合内获胜。每颗新星 '+resource(0,'+40')+'，刷新星级再得 '+resource(1,1)+' '+resource(3,1)}</p>`,'scout-panel');}

let backdropStart=null;
screen.addEventListener('pointerdown',e=>{backdropStart={x:e.clientX,y:e.clientY,page,blank:!e.target.closest('.scroll-shell,.nursery-sheet,.nursery-footer,.team-footer,.nursery-birth-caption,.headline,.nav,.battle-stage,.battle-log,[data-action]')};});
screen.addEventListener('click',e=>{const p=backdropStart;backdropStart=null;if(!p||!p.blank||p.page!==page||Math.hypot(e.clientX-p.x,e.clientY-p.y)>6||modalRoot.children.length)return;if(e.target.closest('.scroll-shell,.nursery-sheet,.nursery-footer,.team-footer,.nursery-birth-caption,.headline,.nav,.battle-stage,.battle-log,[data-action]'))return;if(page==='home'){if(Date.now()<mapSuppressUntil)return;if(wishOpen){MeowSound.play('back');wishOpen=false;$('.wish-banner')?.remove();const reopen=document.createElement('div');reopen.className='wish-reopen';reopen.innerHTML=btn('目标','wish-toggle',{tone:2,cls:'compact',icon:7});screen.append(reopen);}return;}MeowSound.play('back');goBack();});

function home(){return villageHome();}
function pairSlots(){return `<div class="row-pair">${[0,1].map((n)=>`${n===1?`<div class="pair-mid">${icon(1)}</div>`:''}${parents[n]?card(cat(parents[n]),'select',true,n===0?'甲':'乙'):`<div class="skin cat-card">${skin('panel',1)}<div class="empty-cat">？</div><strong>选择双亲${n?'乙':'甲'}</strong></div>`}`).join('')}</div>`;}
function inherited(a,b,field,names){if(breedFocus===field)return `${names[a[field]]} <span class="sub">指定继承${esc(a.name)}</span>`;return a[field]===b[field]?`${names[a[field]]} <span class="sub">必定继承</span>`:`${names[a[field]]} / ${names[b[field]]} <span class="sub">各 50%</span>`;}
function nurseryCost() {
  const plan=G.breedPlan(state,{focus:breedFocus,mutation:mutationPlan,dew:rareDew,rareMode});
  const cost=[[0,plan.cost],[1,plan.notesCost],[3,rareDew],[4,materialCount('leaf')]].filter(([,n])=>n>0);
  const balance=[state.coins,state.geneNotes,0,state.starDew,state.blessings];
  return {cost,missing:cost.find(([i,n])=>n>balance[i])};
}
function nurseryActions() {
  const complete=parents.every(Boolean), {cost,missing}=nurseryCost();
  return `<p class="preview-cost${missing?' red':''}">${missing?resourceNames[missing[0]]+'不足':'本次花费'}
    ${cost.map(([i,n])=>`<span>${resourceIcon(i)}${n} ${resourceNames[i]}</span>`).join('')}</p>
    <div class="nursery-cta">${btn('预览','preview',{tone:2,icon:11,disabled:!complete})}
    ${btn('开始繁育','breed-start',{tone:1,icon:9,disabled:!complete||!!missing})}</div>`;
}
function breeding() {
  const picker=parentSlot!==null?`<section class="skin nursery-sheet nursery-picker" aria-label="替换双亲${parentSlot?'乙':'甲'}">
    ${skin()}<main class="nursery-list"><div class="flex between"><h3>替换${esc(cat(parents[parentSlot]).name)}</h3>
    ${btn('收起','nursery-close',{tone:2,cls:'compact'})}</div><p class="small">筛选后点一只猫替换，选好会自动收起。</p>
    ${collection('select')}</main></section>`:'';
  return header('育猫小屋','灯暖花开，等一次相逢')+nurseryAmbience()+nurseryParents()+
    (picker||nurserySupplies())+nurseryFooter(nurseryActions())+nav('breed');
}
function inheritanceSummary(a,b) {
  const p=G.preview(a,b);
  const fields=[['毛色','color',G.COLORS],['花纹','pattern',G.PATTERNS],
    ['耳型','ears',G.EARS],['本领','skill',G.SKILLS.map(s=>s.name)]];
  return `<section class="inherit-summary"><h3>遗传范围与本领</h3>
    <dl>${fields.map(([label,field,names])=>`<div><dt>${label}</dt><dd>${inherited(a,b,field,names)}</dd></div>`).join('')}</dl>
    <p class="inherit-attributes">${[[1,'生命',p.hp],[0,'攻击',p.atk],[4,'速度',p.speed]].map(([i,label,range])=>
      `<span>${icon(i)}${label} ${range.join('–')}</span>`).join('')}</p></section>`;
}
function preview() {
  const [a,b]=parents.map(cat);
  if(!a||!b){page='breed';return breeding();}
  const rare=G.rarityInfo(state,a,b,rareDew);
  const pair=[a,b].map(c=>`<span class="preview-cat">${sprite(c)}<b>${esc(c.name)}</b></span>`).join('<span class="pair-cross" aria-hidden="true">×</span>');
  const modifiers=[rare.bloodBonus?'稀有亲本 +'+rare.bloodBonus+'%':'',rare.dewBonus?'星露 +'+rare.dewBonus+'%':''].filter(Boolean);
  const details=rare.pity?'超稀有本次保底。':['超稀有基础 2%',...modifiers].join(' · ');
  const content=`<main class="scroll-content">
    <div class="preview-pair" aria-label="双亲">${pair}</div>
    ${birthOdds(ordinaryOutcome(),rare)}
    <p class="birth-hint center">${details}</p>
    ${inheritanceSummary(a,b)}
    ${offspringPreview(a,b)}
  </main>`;
  return header('繁育预览','')+`<div class="skin scroll-shell preview-sheet">${skin()}${content}</div>`+nav('breed');
}

function birthing(){return header('育猫小屋','新的相逢正在发生')+nurseryAmbience()+`<div class="nursery-birth-scene">${welcomeArt(0,'basket-wreath')}<button data-action="open-basket" class="nursery-basket" aria-label="打开猫篮">${icon(9)}</button>${welcomeArt(3,'basket-spark')}</div>`+panel('<h2>听，小窝里有动静了……</h2><p>双亲已经回到院子。轻点猫篮，迎接小家伙。</p>','nursery-birth-caption')+nav('breed');}
function reveal(){const c=cat(state.pendingReveal);if(!c){page='home';return home();}const [a,b]=c.parents.map(cat);return shell('新猫来啦','四 · 你好，小家伙',`<div class="birth-title">${icon(c.mutation===null?1:15)}<h2>${G.rare(c)?'超稀有！'+G.RARES[c.rareGene].name:c.mutation===null?'一只独一无二的小猫':`发现${G.MUTATIONS[c.mutation].name}！`}</h2></div><div class="reveal-portrait"><div class="seal">${skin('panel',3)}</div>${sprite(c)}</div><label class="name-edit skin" aria-label="给小猫起名字">${skin('button',2)}<input id="cat-name" aria-label="小猫名字" maxlength="10" value="${esc(c.name)}"></label><p class="sub center">点名字就能改 · 第 ${c.gen} 代</p>${stats(c)}${birthHighlights(c)}${rareNote(c)}${c.birthReport?panel(`<h3>${c.birthReport.newLook?'图鉴点亮一页！':'新的伙伴，新的可能'}</h3><p class="small">${resource(1,'+'+c.birthReport.notesEarned)} · 当前 ${resource(1,state.geneNotes)}${!c.birthReport.newLook?'。同模样也会积累灵感，可以指定下一次突变。':''}</p>`,'panel-tight'):''}${panel(`<h3 class="flex">${skillIcon(c.skill)}继承本领：${G.SKILLS[c.skill].name}</h3><p class="note">${G.SKILLS[c.skill].desc}</p>`,'panel-tight')}<p class="reveal-text">${G.COLORS[c.color]}毛色来自${esc(c.color===a.color?a.name:b.name)}<br>${G.PATTERNS[c.pattern]}、${G.EARS[c.ears]}，都是家族的印记。${c.mutation!==null?`<br><b class="red">${G.MUTATIONS[c.mutation].name}：${G.MUTATIONS[c.mutation].desc}</b>`:''}</p>${btn('加入队伍 · 试试身手','reveal-team',{icon:10,cls:'sticky-action'})}${btn('先回猫屋','reveal-home',{tone:2,cls:'compact'})}`,'breed');}
function team(){G.syncDeployment(state);const max=Math.min(10,(state.cleared.at(-1)||0)+1);stage=Math.min(stage,max);if(battleMode==='trail'&&!state.cleared.includes(10))battleMode='story';return shell('战前布阵','摆好位置，再自动出战',`<h2 class="team-mode-title">这次去哪里？</h2><div class="inline-actions">${btn('山林试炼','battle-mode',{id:'story',tone:battleMode==='story'?1:2,cls:'compact'})}${btn('无尽远行','battle-mode',{id:'trail',tone:battleMode==='trail'?1:2,cls:'compact',disabled:!state.cleared.includes(10)})}${btn('小队挑战','challenges',{tone:battleMode==='challenge'?1:2,cls:'compact'})}</div>${battleMode==='story'?`<div class="skin stage-selector">${skin('button',2)}${btn('','stage-prev',{tone:2,icon:13,disabled:stage===1,label:'上一关'})}<div class="stage-name"><h3>第 ${stage} 关 · ${G.STAGES[stage-1]}</h3><p class="small">${state.cleared.includes(stage)?'重游':'首次通关'} ${resource(0,state.cleared.includes(stage)?0:150+stage*10)} + 新星奖励</p></div>${btn('','stage-next',{tone:2,icon:13,cls:'next',disabled:stage===max,label:'下一关'})}</div>`:''}${formationPreview()}${scouting()}<h3 class="choice-header">小队 · 已选 ${state.team.length}/3</h3>${collection('team-select')}${state.cats.length<3?'<p class="small">出战需要三位伙伴，育猫小屋可迎来新成员。</p>':''}<p class="level-cue">随时一键跳过，按真实战况结算经验与奖励。通关第 10 关开启远行。</p>`,'team');}
function book(){if(filter==='rare')return rareBook();let combos=[];for(let ears=0;ears<2;ears++)for(let color=0;color<3;color++)for(let pattern=0;pattern<3;pattern++)combos.push({id:`${color}-${pattern}-${ears}`,color,pattern,ears,mutation:null});if(filter==='seen')combos=combos.filter(c=>state.seen.includes(G.key(c)));if(filter==='mutant')return shell('突变手记','每一点小毛病，都有用武之地',`${bookTop()}${mutationGallery('mutation-detail')}<p class="small center">普通繁育也能遇见 · 新种类优先发现</p>`,'book');return shell('猫咪图鉴','每一种不同，都值得记下',`${bookTop()}<div class="catalog-grid">${combos.map(c=>{const seen=state.seen.includes(G.key(c));return `<button class="skin cat-card ${seen?'':'unknown'}" data-action="combo" data-id="${c.id}" aria-label="${seen?G.COLORS[c.color]+G.PATTERNS[c.pattern]+G.EARS[c.ears]:'未发现组合'}">${skin('panel',1)}${discoverySprite(c,seen)}<strong>${seen?G.COLORS[c.color]+G.PATTERNS[c.pattern]:'未发现'}</strong><span class="small">${G.EARS[c.ears]}</span></button>`;}).join('')}</div><p class="note center">未发现的小猫只展示剪影 · 遇见后点亮模样</p>`,'book');}
function bookTop(){return `${panel(`<div class="flex between"><h2>${state.seen.length} <small class="sub">/ 18 种模样</small></h2><span>突变 ${state.mutationSeen.length} / ${G.MUTATIONS.length}</span></div>`,'collection-summary')}<div class="tabs">${[['all','全部'],['seen','已发现'],['mutant','突变'],['rare','稀有']].map(([a,n])=>btn(n,'filter',{id:a,tone:filter===a?1:2,cls:'compact'})).join('')}</div>`;}
function family(){const c=cat(familyId)||state.cats.at(-1),ps=c.parents.map(cat),children=state.cats.filter(x=>x.parents.includes(c.id));return shell('家族古树','记得来处，也期待下一代',`<h2>${esc(c.name)}的家族</h2><div class="family-picker">${state.cats.map(x=>btn(esc(x.name),'family-select',{id:x.id,tone:x.id===c.id?1:2,cls:'compact'})).join('')}</div>${ps.length?`<p class="family-caption">双亲 · 第 ${ps[0].gen} / ${ps[1].gen} 代</p><div class="row-pair">${ps.map(x=>card(x,'family-select')).join('')}</div><div class="family-arrow">${icon(13)}</div>`:`<p class="family-caption">这是一只初代猫，家族故事从这里开始。</p>`}<div class="family-child">${card(c)}</div>${panel(`<p class="center">${G.COLORS[c.color]} · ${G.PATTERNS[c.pattern]} · ${G.EARS[c.ears]}<br>第 ${c.gen} 代 · ${G.SKILLS[c.skill].name}${c.mutation!==null?' · '+G.MUTATIONS[c.mutation].name:''}</p>`,'panel-tight')}<h3 class="choice-header">它的后代 ${children.length?`· ${children.length} 只`:''}</h3>${children.length?`<div class="family-arrow">${icon(13)}</div><div class="family-children">${children.map(x=>card(x,'family-select')).join('')}</div>`:`<p class="sub center">还没有后代，去试一次新的组合吧。</p>`}${btn('带它去繁育','family-breed',{id:c.id,icon:9})}`,'family');}
function roster(){return shell('猫咪小屋','都在这里，慢慢长大',`<h2>院里的 ${state.cats.length} 只小伙伴</h2><p class="sub">点猫咪查看属性、本领和家族。</p>${collection('detail')}${btn('去育猫小窝','breed',{icon:9})}`,'home');}
let lastRenderedPage=null;
function render(){const same=lastRenderedPage===page,scrollTop=same?($('.scroll-content')||$('.nursery-list'))?.scrollTop||0:0,opened=same?[...document.querySelectorAll('details[open][data-fold]')].map(el=>el.dataset.fold):[];game.className=(page==='home'?'':page==='battle'?'battle':'inner')+(page==='team'?' team-page':page==='growth'?' growth-page':page==='academy'?' academy-page':page==='book'?' book-page':page==='challenges'?' challenges-page':'')+(['breed','preview','birthing','reveal'].includes(page)?' nursery-room nursery-'+page:'');const views={home,breed:breeding,preview,birthing,reveal,team,battle:battlefield,book,family,roster,wishes,training,growth,academy,'long-goals':longGoals,challenges};screen.innerHTML=views[page]()+ (page==='team'?teamActions():'');for(const key of opened){const el=document.querySelector('details[data-fold="'+key+'"]');if(el)el.open=true;}const scrollEl=$('.scroll-content')||$('.nursery-list');if(scrollEl)scrollEl.scrollTop=scrollTop;if(page==='breed')refreshNurseryMaterials();lastRenderedPage=page;renderedView=viewState();syncGrowthReminder();cancelAnimationFrame(villageFrame);if(page==='home'){initVillage();animateVillage();}}
function viewState(){return {page,filter,familyId,trainingId,growthId,browsingCats,growthGoalRoute,growthChoice,growthTab,academyFilter,lessonChoice,stage,battleMode,challengeId,rosterFilter,rosterSort,deployCatId,deployInspect,parentSlot};}
function captureModal(){if(!modalView||!modalRoot.children.length)return null;return {...modalView,html:modalRoot.innerHTML,scroll:modalRoot.querySelector('.modal-scroll')?.scrollTop||0};}
function navigationSnapshot(){const current=captureModal();return {...(renderedView||viewState()),scroll:($('.scroll-content')||$('.nursery-list'))?.scrollTop||0,opened:[...screen.querySelectorAll('details[open][data-fold]')].map(e=>e.dataset.fold),overlay:current&&!current.transient?{current,history:[...modalHistory]}:null};}
function restoreView(v){if(!v)return;({filter=filter,familyId=familyId,trainingId=trainingId,growthId=growthId,browsingCats=browsingCats,growthGoalRoute=growthGoalRoute,growthChoice=growthChoice,growthTab=growthTab,academyFilter=academyFilter,lessonChoice=lessonChoice,stage=stage,battleMode=battleMode,challengeId=challengeId,rosterFilter=rosterFilter,rosterSort=rosterSort,deployCatId=deployCatId,deployInspect=deployInspect,parentSlot=parentSlot}=v);}
function restoreModal(v){if(!v)return;restoringModal=true;try{if(v.replay)v.replay();else{modalView=v;modalRoot.innerHTML=v.html;}}finally{restoringModal=false;}const sc=modalRoot.querySelector('.modal-scroll');if(sc)sc.scrollTop=v.scroll||0;modalRoot.querySelector('.modal-back')?.focus({preventScroll:true});}
function go(p,options={}){if(page==='battle'&&battle&&!battle.result&&p!=='battle'){exitNavigation={page:p,options};modal('离开本次试炼？','退出不会领取奖励，猫咪也不会受伤。',btn('继续挑战','modal-close')+btn('返回'+(PAGE_NAMES[p]||'猫村'),'battle-exit',{tone:2}));return;}if(p==='breed'&&state.pendingReveal)p='reveal';if(p==='home'||options.root)navHistory=p==='home'?[]:[{page:'home'}];else if(options.back)navHistory.pop();else if(['battle','birthing','reveal'].includes(page)&&navHistory.at(-1)?.page===p)navHistory.pop();else if(page!==p&&!['battle','birthing','reveal'].includes(page))navHistory.push(navigationSnapshot());clearTimeout(birthTimer);parentSlot=null;if(p==='growth'&&page!=='growth')growthChoice=null;closeModal(false);page=p;restoreView(options.restore);if(p==='preview'&&!state.objectives.preview){state.objectives.preview=true;if(!save())return;}render();if(options.restore){const el=$('.scroll-content')||$('.nursery-list');if(el)el.scrollTop=options.restore.scroll||0;for(const key of options.restore.opened||[]){const d=[...screen.querySelectorAll('details[data-fold]')].find(e=>e.dataset.fold===key);if(d)d.open=true;}if(options.restore.overlay){modalHistory=[...options.restore.overlay.history];restoreModal(options.restore.overlay.current);}}}
function goBack(){if(modalRoot.children.length){modalBack();return;}if(page==='breed'&&parentSlot!==null){parentSlot=null;render();return;}if(['birthing','reveal'].includes(page)){finishReveal('breed',{root:true});return;}const previous=navHistory.at(-1)||{page:({preview:'breed',training:'academy',growth:'academy',battle:'team'})[page]||'home'};go(previous.page,{back:true,restore:previous});}
function modalBack(){const previous=modalHistory.pop();if(previous){clearTimeout(levelTimer);restoreModal(previous);}else closeModal();}
function modal(title,text,actions,artIcon=7){const route=modalRoute||{key:title},current=captureModal();if(!restoringModal){if(route.transient)modalHistory=[];else if(current&&current.key!==route.key){const ancestor=modalHistory.findIndex(v=>v.key===route.key);if(ancestor>=0)modalHistory=modalHistory.slice(0,ancestor);else modalHistory.push(current);}}modalView={...route,title};const backName=modalHistory.at(-1)?.title||PAGE_NAMES[page]||'猫村';if(!current)modalRoot._oldFocus=document.activeElement;modalRoot.innerHTML=`<div class="modal-shade"><section class="skin modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">${skin('panel',0)}<button class="modal-back" data-action="modal-back" aria-label="返回${esc(backName)}">${icon(13)}<span>返回${backName}</span></button><div class="modal-scroll">${icon(artIcon,'modal-icon')}<h2 id="modal-title">${title}</h2><div class="modal-body">${text}</div><div class="modal-footer">${actions||btn('知道啦','modal-close')}</div></div></section></div>`;modalRoot.querySelector('button')?.focus({preventScroll:true});}
function closeModal(resume=true){const resumeUnit=!!modalRoot.querySelector('.unit-detail-modal');welcomeShowing=null;clearTimeout(levelTimer);if(levelShowing){levelShowing=null;growthSession=null;}modalRoot.innerHTML='';modalView=null;modalHistory=[];syncGrowthReminder();if(modalRoot._oldFocus?.isConnected)modalRoot._oldFocus.focus({preventScroll:true});if(resume&&resumeUnit&&page==='battle'&&battle){if(battle.result)finishBattle();else battleTimer=setTimeout(tick,100);}}
// Replay named screens from live game data when returning; snapshots retain only view context.
function bindModal(fn,key,transient=false){const wrapped=(...args)=>{const prior=modalRoute;modalRoute={key:key+':'+(key==='deploymentPicker'?args[0]:JSON.stringify(args)),replay:()=>wrapped(...args),transient};try{return fn(...args);}finally{modalRoute=prior;}};return wrapped;}
function detail(id){const c=cat(id);if(!c)return;modal(esc(c.name),`${sprite(c)}<div class="detail-build">${buildBrief(c)}</div>${stats(G.trained(c))}${progression(c)}${rareNote(c)}<p class="note center">天生资质：生命 ${c.hp} / 攻击 ${c.atk} / 速度 ${c.speed}</p><p class="center">${G.COLORS[c.color]} · ${G.PATTERNS[c.pattern]} · ${G.EARS[c.ears]} · 第 ${c.gen} 代</p><p class="note"><b>${skillIcon(c.skill)}${G.SKILLS[c.skill].name}</b></p>${skillEffect(c)}${rangeCards(c)}<section class="direct-info"><h3>完整技能说明</h3><p>${G.SKILLS[c.skill].desc}</p></section>${c.mutation!==null?`<p class="note red">${G.MUTATIONS[c.mutation].name}：${G.MUTATIONS[c.mutation].desc}</p>`:''}`,btn('成长手记','growth-open',{id:c.id,tone:1})+btn('与小队比较','compare-cat',{id:c.id,tone:2})+btn('看看它的家族','detail-family',{id:c.id,icon:12})+btn('一起去繁育','detail-breed',{id:c.id,tone:2,icon:9}),G.SKILLS[c.skill].icon);const dialog=modalRoot.querySelector('.modal');dialog.classList.add('cat-detail-modal');dialog.insertAdjacentHTML('beforeend',favoriteStar(c));}
function finishReveal(next,options={}){const c=cat(state.pendingReveal);if(!c)return;const n=$('#cat-name')?.value.trim();c.name=(n||c.name).slice(0,10);state.pendingReveal=null;if(next==='team'&&!state.team.includes(c.id)){if(state.team.length===3)state.team[2]=c.id;else state.team.push(c.id);}familyId=c.id;if(!save())return;go(next,options);}
let battleCue=null,battlePending=null;
function tile(i,cls=''){return `<span class="battle-art ${cls}" aria-hidden="true" style="background-position:${i%2*100}% ${Math.floor(i/2)*100}%"></span>`;}
function teamActions(){const missing=battleMode==='challenge'?G.Objectives.challengeSetup(state,challengeId):[],disabled=state.team.length!==3||missing.length>0;return '<div class="team-footer"><div class="inline-actions">'+btn('按此布局开战','battle-start',{icon:10,disabled})+btn('按此布局跳过','battle-instant',{tone:1,disabled})+'</div><p class="small center">'+(state.team.length!==3?'还需选择 '+(3-state.team.length)+' 位伙伴':missing.length?'请先按挑战提示调整阵容':battleMode==='challenge'?'免费挑战 · 各项仅首次达成有奖':'免费出战 · 新纪录与每只猫的首次历练有奖')+'</p></div>';}

function unit(u){const cue=battleCue,last=cue?.last,active=last?.actor===u.uid,impact=cue?.phase==='impact',travel=cue?.phase==='action'&&active,position=travel?last.to:u;const effects=impact?(last?.effects||[]).filter(e=>e.uid===u.uid):[];const dx=travel?(last.from.x-last.to.x)*100/0.82:0,dy=travel?(last.from.y-last.to.y)*100/1.12:0,mid=travel&&last.path.length===2?last.path[0]:travel?{x:(last.from.x+last.to.x)/2,y:(last.from.y+last.to.y)/2}:u,mx=travel?(mid.x-last.to.x)*100/.82:0,my=travel?(mid.y-last.to.y)*100/1.12:0;return `<div class="arena-unit ${u.side?'foe':'friend'} ${u.life<=0?'dead':''} ${active?'active-unit':''} ${active&&cue?.phase==='windup'?'windup':''} ${travel?'travelling':''}" data-unit="${u.uid}" data-action="unit-detail" data-id="${u.uid}" role="button" tabindex="0" aria-label="查看${esc(u.name)}的血量与状态" style="left:${(position.x+.5)*20}%;top:${(position.y+.5)*20}%;--dx:${dx}%;--dy:${dy}%;--mid-x:${mx}%;--mid-y:${my}%;--phase-time:${320/speed}ms;z-index:${position.y+2}">${active?tile(2,'active-ring'):''}${heartMeter(u)}${sprite(u)}<span class="arena-name">${teamFlag(u.side)}<span>${u.side?'敌':u.isVanguard?'我前':'我'}·${esc(u.name)}</span></span><span class="arena-hp">${u.life} / ${u.maxHp}</span>${statusBadges(u)}${effects.length?`<span class="arena-effects">${effects.filter(e=>e.amount>0).map(e=>`<b class="${e.kind==='heal'||e.kind==='shield'?'green':'red'}">${e.kind==='heal'||e.kind==='shield'?'+':'−'}${e.amount}</b>`).join('')}</span>`:''}${impact&&last?.target===u.uid&&last.kind==='attack'?tile(3,'hit-art'):''}${impact?effects.filter(e=>['freeze','cleanse','rally','root'].includes(e.kind)).map(e=>skillArt({freeze:1,cleanse:2,rally:3,root:5}[e.kind],'status-burst')).join(''):''}</div>`;}
function battlefield(){const pending=battlePending||battle,ordered=pending.queue.length?pending.queue:battle.units.filter(u=>u.life>0).sort((a,b)=>(b.speed+(b.skill===4?5:0))-(a.speed+(a.skill===4?5:0))).map(u=>u.uid),last=battleCue?.last,actor=battle.units.find(u=>u.uid===last?.actor);const caption=battle.result?(battle.result==='win'?'试炼完成':'带着经验归来'):actor?`${actor.name} · ${last.kind==='move'?'接近目标':last.kind==='poison'?'毒伤结算':(last.kind==='frozen'?'冻结中':last.skillName||G.SKILLS[actor.skill].name)} · ${{windup:'准备',action:last.path.length?'走位':'出招',impact:['attack','poison'].includes(last.kind)?'命中':last.kind==='move'?'到位':'生效'}[battleCue.phase]}`:'自动出战 · 各就各位';return header(battle.mode==='challenge'?'小队挑战':battle.mode==='trail'?'远行第 '+battle.floor+' 段':G.STAGES[battle.level-1],battle.rule)+`<main class="battle-stage tactical-stage"><div class="battle-top"><div class="skin wallet">${skin('button',2)}<span>第 ${battle.round} 回合</span></div>${btn(speed===1?'加速 ×2':'速度 ×1','speed',{tone:2,cls:'compact'})}${btn('一键跳过','battle-skip',{tone:1,cls:'compact',disabled:!!battle.result})}</div><div class="turn-strip"><span>接下来</span>${ordered.slice(0,6).map(uid=>battle.units.find(u=>u.uid===uid)).filter(u=>u&&u.life>0).map(u=>`<div class="turn-portrait ${u.side?'enemy-turn':''}" title="${esc(u.name)}">${sprite(u)}<span class="turn-side">${teamFlag(u.side)}${u.side?'敌':'我'}</span></div>`).join('')}</div><div class="arena" aria-label="五乘五战术场地">${Array.from({length:25},(_,i)=>`<div class="ground-cell" style="left:${i%5*20}%;top:${Math.floor(i/5)*20}%">${tile(0)}</div>`).join('')}${battle.blocks.map(p=>`<div class="ground-cell rock-cell" style="left:${p.x*20}%;top:${p.y*20}%;z-index:${p.y+2}">${tile(1)}</div>`).join('')}${battle.units.map(unit).join('')}</div>${panel(`<p>${esc(caption)}</p>`,'action-caption')}<p class="arena-guide">${teamFlag(0)}青叶·我方　${teamFlag(1)}朱爪·敌方　爱心填充＝血量</p></main>${panel((battle.log.length?battle.log.slice(0,2):['小队入场，按速度先后出手。']).map(l=>`<p>${esc(l)}</p>`).join(''),'battle-log')}`;}
function tick(){if(modalRoot.querySelector('.unit-detail-modal'))return;if(page!=='battle'||!battle||battle.result)return;const original=battle,next=JSON.parse(JSON.stringify(battle));G.step(next);battlePending=next;if(!next.last){battle=next;battlePending=null;if(battle.result){battleCue=null;finishBattle();}else battleTimer=setTimeout(tick,80/speed);return;}battleCue={phase:'windup',last:next.last,beforeLife:Object.fromEntries(battle.units.map(u=>[u.uid,u.life]))};render();battleTimer=setTimeout(()=>{if(page!=='battle'||battle!==original)return;battleCue.phase='action';render();battleTimer=setTimeout(()=>{if(page!=='battle'||battle!==original)return;battle=next;battlePending=null;battleCue.phase='impact';render();battleTimer=setTimeout(()=>{if(page!=='battle'||battle!==next)return;battleCue=null;if(battle.result)finishBattle();else tick();},260/speed);},320/speed);},220/speed);}
function skipBattle(){if(page!=='battle'||!battle||battle.settled)return;clearTimeout(battleTimer);if(battlePending)battle=battlePending;battlePending=null;battleCue=null;G.fastForward(state,battle);finishBattle();}

function soundButton(){return btn('按钮音效：'+(MeowSound.isEnabled()?'开':'关'),'sound-toggle',{tone:MeowSound.isEnabled()?1:2,cls:'compact',label:MeowSound.isEnabled()?'关闭按钮音效':'开启按钮音效'}).replace('<button ','<button aria-pressed="'+MeowSound.isEnabled()+'" ');}
function help(){modal('小院手记',`<p>选择双亲 → 预览机会 → 调整战术 → 争取三星 → 积攒灵感指定突变。</p><p class="note">点左上返回或面板外的空白，都退回上一级，并保留选择与阅读位置。猫村点空白可收起目标。出战获得历练经验，通关十关后可以挑战远行纪录。</p><p class="note">地图可拖动与双指缩放。从第一场起即可一键跳过，奖励按实际胜负结算。成长目标会逐步介绍出战、繁育、突破与传习；长期目标可自由追踪。最多连续 8 次繁育必出普通突变。</p><p class="note">双亲始终保留。自然繁育消耗 100 铜钱；试炼免费，每关前两次失败有成长补助。新纪录、新伙伴首次历练和离线巡游提供资源。每两关会有新猫带着新本领加入。</p><p class="note">${storageOK?'手记会自动保存在这台浏览器中。':'本次无法自动保存，请保持页面打开。'}可导出备份，换设备后导入继续。</p>`,soundButton()+btn('继续逛逛','modal-close')+`<div class="settings-row">${btn('导出手记','export',{tone:2,cls:'compact'})}${btn('导入手记','import',{tone:2,cls:'compact'})}</div>`+(MeowSave.damaged()?btn('导出待修复手记','export-damaged',{tone:2,cls:'compact'}):'')+btn('重新开始','reset-confirm',{tone:4,cls:'compact'}),7);}
rangeDetail=bindModal(rangeDetail,'rangeDetail');
squadCoach=bindModal(squadCoach,'squadCoach');
detail=bindModal(detail,'detail');
compareCat=bindModal(compareCat,'compareCat');
growthPicker=bindModal(growthPicker,'growthPicker');
growthNode=bindModal(growthNode,'growthNode');
deploymentPicker=bindModal(deploymentPicker,'deploymentPicker');
mutationPicker=bindModal(mutationPicker,'mutationPicker');
nurserySettings=bindModal(nurserySettings,'nurserySettings');
mutationDetail=bindModal(mutationDetail,'mutationDetail');
comboDetail=bindModal(comboDetail,'comboDetail');
help=bindModal(help,'help');
resourceInfo=bindModal(resourceInfo,'resourceInfo');
patrol=bindModal(patrol,'patrol');
battleUnitDetail=bindModal(battleUnitDetail,'battleUnitDetail');
showGrowth=bindModal(showGrowth,'showGrowth',true);
showWelcome=bindModal(showWelcome,'showWelcome',true);
welcomeTeam=bindModal(welcomeTeam,'welcomeTeam');
showBattleReward=bindModal(showBattleReward,'showBattleReward',true);
document.addEventListener('click',e=>{const el=e.target.closest('[data-action]');if(!el||el.disabled)return;if(el.classList.contains('village-cat')&&(treeCoversClick(e,el)||gateCoversClick(e,el)))return;const action=el.dataset.action,id=el.dataset.id;if(action!=='sound-toggle')MeowSound.action(action);MeowSave.exclusive(()=>{if(syncSave())return;try{
 if(['home','breed','team','book','family','roster','academy','wishes','long-goals','challenges'].includes(action)){go(action,{root:!!el.closest('.nav')});return;}
 switch(action){

 case 'objective-go':{const g=[...G.Objectives.journey,...G.Objectives.longGoals].find(x=>x.id===id);if(g)goalRoute(g.route);break;}
 case 'objective-route':goalRoute(id);break;
 case 'objective-claim':{const g=G.Objectives.claim(state,id);if(g){if(!save())return;render();toast('目标完成！ '+goalRewards(g),true);}break;}
 case 'objective-pin':if(G.Objectives.longGoals.some(g=>g.id===id)){state.objectives.pinned=id;if(!save())return;render();toast('首页已追踪这项目标。');}break;
 case 'objective-unpin':state.objectives.pinned=null;if(!save())return;render();break;
 case 'challenge-select':{const d=G.Objectives.challenges.find(x=>x.id===id);if(!d||!state.cleared.includes(d.level))break;challengeId=d.id;battleMode='challenge';stage=d.level;go('team');break;}
 case 'challenge-retry':battle=null;go('team');break;
 case 'cat-filter':rosterFilter=id;render();break;
 case 'cat-sort':rosterSort=id;render();break;
 case 'cat-clear':rosterFilter='all';rosterSort='recent';render();break;
 case 'favorite':{const c=cat(id);if(!c)break;c.favorite=!c.favorite;if(!save())return;if(page==='growth')render();else{const button=modalRoot.querySelector('.favorite-toggle');if(button){button.outerHTML=favoriteStar(c);modalRoot.querySelector('.favorite-toggle')?.focus({preventScroll:true});}else detail(id);}break;}
 case 'range-show':{rangeDetail(id);break;}
 case 'squad-coach':squadCoach();break;
 case 'academy-filter':academyFilter=id;render();break;
 case 'growth-tab':if(['skills','path'].includes(id)){growthTab=id;lessonChoice=null;render();if($('.scroll-content'))$('.scroll-content').scrollTop=0;}break;
 case 'lesson-preview':lessonChoice=Number(id);render();break;
 case 'turn-cat':{
   const inSchool=page==='training';
   if(!inSchool && page!=='growth')break;
   const ids=inSchool?state.cats.map(c=>c.id):browsingCats;
   if(ids.length<2)break;
   const index=ids.indexOf(inSchool?trainingId:growthId);
   const next=ids[(index+Number(id)+ids.length)%ids.length];
   if(inSchool)trainingId=next;
   else {growthId=next;growthChoice=null;lessonChoice=null;}
   render();break;
 }
 case 'growth-picker':growthPicker();break;
 case 'growth-select':if(cat(id)){if(!browsingCats.includes(Number(id))||page!=='growth')browsingCats=state.cats.map(c=>c.id);growthId=Number(id);growthChoice=null;growthTab=['path','breakthrough','master'].includes(growthGoalRoute)?'path':'skills';lessonChoice=null;go('growth');}break;
 case 'growth-open':if(page!=='growth'||!browsingCats.includes(Number(id)))browsingCats=(page==='academy'?academyList():state.cats).map(c=>c.id);growthGoalRoute=null;growthId=Number(id);growthChoice=null;growthTab='skills';lessonChoice=null;go('growth');break;
 case 'growth-node':growthNode(Number(id));break;
 case 'growth-preview':if(G.Growth.PATHS.some(p=>p.id===id)){growthChoice={cat:growthId,path:id};lessonChoice=null;render();screen.querySelector('[data-action="growth-preview"][data-id="'+id+'"]')?.focus({preventScroll:true});}break;
 case 'growth-path':G.Growth.choose(state,growthId,id);if(!save())return;render();toast('已选专长 · '+pathName(cat(growthId)));break;
 case 'growth-advance':G.Growth.advance(state,id);if(!save())return;render();toast(cat(id).growthRank===2?'结业啦，已经可以指导新伙伴！':'专长突破，新的战斗能力已学会！');break;
 case 'growth-trial':startCatTrial(cat(id));break;
 case 'trial-replace':{const [next,old]=id.split(':').map(Number);startCatTrial(cat(next),old);break;}
 case 'growth-train':G.train(state,id);if(!save())return;render();showNextCelebration();break;
 case 'study':G.study(state,id);if(!save())return;render();showNextCelebration();break;
 case 'mentor':G.mentor(state,growthId,id);if(!save())return;render();showNextCelebration();break;
 case 'compare-cat':compareCat(id);break;
 case 'compare-replace':{const [next,old]=id.split(':').map(Number),i=state.team.indexOf(old);if(i<0||state.team.includes(next))break;G.replaceTeamCat(state,old,next);if(state.pendingReveal===next)finishReveal('team');else{if(!save())return;go('team');}break;}
 case 'rare-mode':rareMode=id==='inherit'?'inherit':'explore';refreshNurserySettings();break;
 case 'patrol':patrol();break;
 case 'patrol-claim':{const p=G.claimPatrol(state);if(!save())return;closeModal();render();toast('巡游收获已保存：铜钱 '+p.coins+'，心得 '+p.xp);break;}
 case 'unit-detail':battleUnitDetail(id);break;
 case 'unit-resume':closeModal();break;
 case 'sound-toggle':MeowSound.toggle();help();break;
 case 'growth-resume':showNextCelebration();break;
 case 'welcome-done':completeWelcome();break;
 case 'welcome-team':welcomeTeam();break;
 case 'welcome-back':showWelcome();break;
 case 'welcome-replace':{const n=state.team.indexOf(Number(id));if(welcomeShowing&&n>=0){state.team[n]=welcomeShowing;completeWelcome();}break;}
 case 'nursery-slot':parentSlot=Number(id);rosterFilter='all';render();if($('.nursery-list'))$('.nursery-list').scrollTop=0;break;
 case 'nursery-settings':nurserySettings();break;
 case 'breed-material':if(!changeNurseryMaterial(id,1))showMaterialHint(id);break;
 case 'breed-remove-material':changeNurseryMaterial(id,-1);break;
 case 'nursery-close':parentSlot=null;render();break;
 case 'back':goBack();break;
 case 'growth-next':completeGrowth();break;
 case 'training-open':trainingId=Number(id);go('training');break;
 case 'read-reference':{
   const entry=el.closest('.reference-entry');
   const title=entry.querySelector('strong').textContent;
   modal(esc(title),entry.querySelector('template').innerHTML,btn('返回','modal-back',{tone:2}));
   modalRoot.querySelector('.modal').classList.add('reading-note');
   break;
 }
 case 'school-picker':schoolPicker();break;
 case 'lesson-peek':schoolPreview={catId:trainingId,skill:Number(id)};render();break;
 case 'training-cat':trainingId=Number(id);closeModal(false);render();break;
 case 'learn-skill':{
   const result=G.learnSkill(state,trainingId,Number(id));
   if(!save())return;
   closeModal(false);render();
   if(result.changed)toast(cat(trainingId).name+'已携带「'+G.SKILLS[Number(id)].name+'」');
   break;
 }
 case 'resource-info':resourceInfo();break;
 case 'craft-dew':G.craftDew(state);if(!save())return;refreshNurserySettings();toast('凝成一滴星露。');break;
 case 'rare-book':filter='rare';go('book');break;
 case 'rare-detail':{const i=Number(id),r=G.RARES[i],owned=state.cats.find(c=>c.rareGene===i);modal(r.name,discoverySprite({rareGene:i},state.rareSeen.includes(i))+'<p class="note">'+r.desc+'</p><p class="small">'+(owned?'已在家族里留下足迹：'+esc(owned.name):'繁育时有机会出现；星露可提高概率。')+'</p>',owned?btn('看看它','detail',{id:owned.id}):btn('去繁育','breed'));break;}
 case 'wish-toggle':wishOpen=!wishOpen;render();break;
 case 'track-look':state.targetLook=id;if(!save())return;go('breed');break;
 case 'recommend':{const r=G.recommendPair(state);if(!r||r.chance===0){toast(state.targetLook?'目前双亲还缺少目标基因；通关第 2 关迎接山客。':'所有可组合模样都已发现，去试炼迎接新本领。');break;}parents=r.ids;if(!rememberParents())return;breedFocus=null;mutationPlan=null;go('preview');break;}
 case 'gene-guest':{const c=G.welcomeGuest(state);if(c){if(!save())return;render();showNextCelebration();}break;}
 case 'breed-mode':breedFocus=id==='directed'?(breedFocus||['color','pattern','ears','skill'].find(k=>cat(parents[0])[k]!==cat(parents[1])[k])||'color'):null;refreshNurserySettings();break;
 case 'breed-source':if(breedFocus&&parents.includes(Number(id))&&parents[0]!==Number(id)){parents.reverse();if(!rememberParents())return;refreshNurserySettings();}break;
 case 'breed-focus':if(!id||['color','pattern','ears','skill'].includes(id)){breedFocus=id||null;refreshNurserySettings();}break;
 case 'mutation-picker':mutationPicker();break;
 case 'mutation-preview':mutationDetail(Number(id),true);break;
 case 'mutation-detail':mutationDetail(Number(id));break;
 case 'mutation-plan':{const next=id===''?null:Number(id);if(next!==null&&(!G.MUTATIONS[next]||next>=3&&!state.mutationSeen.includes(next)||state.geneNotes<6)){toast('先发现这类突变，并攒够 6 点灵感。');break;}mutationPlan=next;useBlessing=false;closeModal();render();break;}
 case 'swap-parents':parents.reverse();if(!rememberParents())return;refreshNurserySettings();break;
 case 'battle-mode':if(id==='trail'&&!state.cleared.includes(10))break;battleMode=id;render();break;
 case 'map-in':zoomMap(1.2);break;case 'map-out':zoomMap(1/1.2);break;case 'map-fit':fitMap();break;case 'wish-claim':{const reward=G.claimWish(state,id);if(reward){if(!save())return;render();toast('心愿完成！ '+resource(0,'+'+reward.coins)+(reward.leaves?' '+resource(4,'+'+reward.leaves):''),true);}break;}case 'battle-skip':skipBattle();break;case 'help':help();break;case 'modal-close':case 'modal-back':modalBack();break;
 case 'select':{if(parentSlot===null)break;const n=Number(id);if(!cat(n))break;breedFocus=null;mutationPlan=null;const other=1-parentSlot;if(parents[other]===n)parents[other]=parents[parentSlot];parents[parentSlot]=n;parentSlot=null;if(!rememberParents())return;render();break;}
 case 'preview':if(parents.every(Boolean))go('preview');break;
 case 'breed-start':if(page!=='breed'||!parents.every(Boolean)||nurseryCost().missing)break;G.breed(state,...parents,Math.random,useBlessing,{focus:breedFocus,mutation:mutationPlan,dew:rareDew,rareMode});useBlessing=false;breedFocus=null;mutationPlan=null;rareDew=0;if(!save())return;parentSlot=null;page='birthing';render();birthTimer=setTimeout(()=>{if(page==='birthing'){page='reveal';render();}},2400);break;
 case 'open-basket':clearTimeout(birthTimer);page='reveal';render();break;
 case 'reveal-team':finishReveal('team');break;case 'reveal-home':finishReveal('home');break;
 case 'deploy-select':if(state.team.includes(Number(id))){deployCatId=Number(id);deployInspect='a'+id;render();deploymentPicker(Number(id));}break;
 case 'deploy-picker-filter':{const [oldId,filter]=id.split(':');deploymentPicker(Number(oldId),filter);break;}
 case 'deploy-keep':if(state.team.includes(Number(id))){deployCatId=Number(id);deployInspect='a'+id;}closeModal();render();break;
 case 'deploy-replace':{const [oldId,nextId]=id.split(':').map(Number);G.replaceTeamCat(state,oldId,nextId);deployCatId=nextId;deployInspect='a'+nextId;if(!save())return;closeModal();render();toast('已由'+cat(nextId).name+'接替，站位保留。');break;}
 case 'deploy-reset':delete state.deployment;deployCatId=state.team[0]||null;deployInspect='a'+deployCatId;if(!save())return;render();break;
 case 'deploy-cell':{const [x,y]=id.split(':').map(Number),u=deploymentBattle().units.find(u=>u.x===x&&u.y===y);if(u){deployInspect=u.uid;if(u.side===0)deployCatId=u.id;render();}else if(y>=3&&deployCatId){placeDeployment(deployCatId,x,y);}else toast('在下方两排布阵；点敌猫可以查看范围。');break;}
 case 'team-lead':{const n=Number(id);if(state.team.includes(n)){state.team=[n,...state.team.filter(x=>x!==n)];if(!save())return;render();}break;}
 case 'team-select':{const n=Number(id),at=state.team.indexOf(n);if(at>=0)state.team.splice(at,1);else if(state.team.length<3)state.team.push(n);else{toast('先点一位出战猫，让它回去休息。');break;}if(!save())return;render();break;}
 case 'stage-prev':stage=Math.max(1,stage-1);render();break;case 'stage-next':stage++;render();break;
 case 'battle-instant':case 'battle-start':if(page!=='team')break;clearTimeout(toastTimer);$('#toast').classList.remove('show');battlePending=null;battleCue=null;battle=G.createBattle(state,battleMode==='trail'?10:stage,battleMode,challengeId);speed=1;navHistory.push(navigationSnapshot());page='battle';render();clearTimeout(battleTimer);if(action==='battle-instant')skipBattle();else battleTimer=setTimeout(tick,700);break;
 case 'speed':speed=speed===1?2:1;render();break;
 case 'battle-exit':{const target=exitNavigation||{page:'home',options:{root:true}};exitNavigation=null;rewardPending=null;clearTimeout(battleTimer);battlePending=null;battleCue=null;battle=null;go(target.page,target.options);break;}
 case 'result-team':battle=null;stage=Math.min(10,(state.cleared.at(-1)||0)+1);go('team');break;
 case 'result-home':battle=null;go('home');break;
 case 'detail':detail(id);break;
 case 'family-select':familyId=Number(id);render();break;
 case 'detail-family':familyId=Number(id);go('family');break;
 case 'family-breed':case 'detail-breed':parents=[Number(id),state.cats.find(c=>c.id!==Number(id)).id];if(!rememberParents())return;go('breed');break;
 case 'filter':filter=id;render();break;
 case 'combo':comboDetail(id);break;
 case 'reset-confirm':modal('重新开始这段故事？','这会清空本浏览器的猫咪、铜钱和家族手记。可以先取消并导出备份。',btn('保留我的小院','modal-close')+btn('确认重新开始','reset',{tone:5}),7);break;
 case 'reset':welcomeShowing=null;parentSlot=null;clearTimeout(levelTimer);levelShowing=null;rewardPending=null;growthSession=null;clearTimeout(battleTimer);clearTimeout(birthTimer);battle=null;state=G.migrate(G.initial());navHistory=[];useBlessing=false;breedFocus=null;mutationPlan=null;rareDew=0;battleCue=null;battlePending=null;battleMode='story';wishOpen=true;camera.ready=false;parents=[...state.breedingParents];familyId=2;stage=1;filter='all';if(!save())return;page='home';closeModal();render();toast('新的小院，等你来写。');break;
 case 'export-damaged':{const raw=MeowSave.damaged();if(raw){const u=URL.createObjectURL(new Blob([raw],{type:'text/plain'})),a=document.createElement('a');a.href=u;a.download='喵喵待修复手记.txt';a.click();setTimeout(()=>URL.revokeObjectURL(u),2000);}break;}
 case 'export':{const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='喵喵小院手记.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);toast('手记已导出。');break;}
 case 'import':{const inp=document.createElement('input');inp.type='file';inp.accept='.json,application/json';inp.addEventListener('change',async()=>{try{const file=inp.files[0];if(!file||file.size>2e6)throw Error('请选择小于 2 MB 的手记文件。');const next=JSON.parse(await file.text());if(!G.validate(next)||!G.validate(G.migrate(JSON.parse(JSON.stringify(next)))))throw Error('这份手记格式不完整，没有改动当前小院。');modal('接着这份手记继续？',`即将载入 ${next.cats.length} 只猫、${resource(0,next.coins)}，替换当前小院。`,btn('取消','modal-close',{tone:2})+btn('载入手记','import-confirm'));window.__pendingImport=next;}catch(err){toast(err.message||'无法读入手记。');}});inp.click();break;}
 case 'import-confirm':if(window.__pendingImport){welcomeShowing=null;parentSlot=null;clearTimeout(levelTimer);levelShowing=null;rewardPending=null;growthSession=null;clearTimeout(battleTimer);battle=null;state=G.migrate(window.__pendingImport);navHistory=[];useBlessing=false;breedFocus=null;mutationPlan=null;rareDew=0;battleCue=null;battlePending=null;battleMode='story';wishOpen=true;camera.ready=false;delete window.__pendingImport;parents=[...state.breedingParents];familyId=state.cats.at(-1).id;stage=Math.min(10,(state.cleared.at(-1)||0)+1);if(!save())return;page=state.pendingReveal?'reveal':'home';closeModal();render();toast('手记接上了。');}break;
 }
 }catch(err){toast(err.message||'小猫打了个盹，请再试一次。');}});});
let materialPress=null, heldMaterialClick=null;
screen.addEventListener('pointerdown',e=>{
  const button=e.target.closest('[data-action="breed-material"]');
  heldMaterialClick=null;
  if(!button||e.button!==0||!e.isPrimary)return;
  const press={button,pointer:e.pointerId,kind:button.dataset.id,timer:null,held:false,x:e.clientX,y:e.clientY};
  materialPress=press;
  button.setPointerCapture?.(e.pointerId);
  const repeat=()=>{
    if(materialPress!==press||!button.isConnected||page!=='breed'||modalRoot.children.length)return;
    if(!press.held)showMaterialHint(press.kind);
    press.held=true;
    if(changeNurseryMaterial(press.kind,1)){
      MeowSound.play('tap');
      press.timer=setTimeout(repeat,230);
    }
  };
  press.timer=setTimeout(repeat,450);
});
function endMaterialPress(e,dragged=false) {
  const press=materialPress;
  if(!press||press.pointer!==e.pointerId)return;
  clearTimeout(press.timer);
  materialPress=null;
  if(press.held||dragged)heldMaterialClick=press.button;
}
screen.addEventListener('pointermove',e=>{
  const p=materialPress;
  if(p&&Math.hypot(e.clientX-p.x,e.clientY-p.y)>13)endMaterialPress(e,true);
});
for(const type of ['pointerup','pointercancel','lostpointercapture'])screen.addEventListener(type,e=>endMaterialPress(e));
screen.addEventListener('contextmenu',e=>{if(e.target.closest('.material-tap'))e.preventDefault();});
screen.addEventListener('click',e=>{
  const button=e.target.closest('.material-tap');
  if(button&&button===heldMaterialClick&&e.detail>0){
    heldMaterialClick=null;
    e.preventDefault();
    e.stopImmediatePropagation();
  }
},true);
let deployDrag=null,deployIgnoreUntil=0;
screen.addEventListener('click',e=>{if(e.isTrusted&&performance.now()<deployIgnoreUntil&&e.target.closest('.deployment-board')){e.preventDefault();e.stopImmediatePropagation();}},true);
screen.addEventListener('pointerdown',e=>{const cell=e.target.closest('.deploy-cell[data-cat-id]');if(page!=='team'||!cell||e.button!==0)return;deployDrag={id:Number(cell.dataset.catId),pointer:e.pointerId,x:e.clientX,y:e.clientY,cell,moved:false,ghost:null};cell.setPointerCapture?.(e.pointerId);});
document.addEventListener('pointermove',e=>{const d=deployDrag;if(!d||e.pointerId!==d.pointer)return;if(!d.moved&&Math.hypot(e.clientX-d.x,e.clientY-d.y)>8){d.moved=true;d.ghost=d.cell.querySelector('.sprite').cloneNode(true);d.ghost.classList.add('deployment-drag-ghost');document.body.append(d.ghost);d.cell.classList.add('deploy-dragging');}if(d.moved){e.preventDefault();d.ghost.style.left=e.clientX+'px';d.ghost.style.top=e.clientY+'px';}},{passive:false});
function finishDeployDrag(e,cancel=false){const d=deployDrag;if(!d||e.pointerId!==d.pointer)return;deployDrag=null;d.ghost?.remove();d.cell.classList.remove('deploy-dragging');if(d.moved){deployIgnoreUntil=performance.now()+400;if(!cancel&&page==='team'){const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.deploy-cell'),parts=target?.dataset.id.split(':').map(Number);if(parts&&parts[1]>=3){MeowSave.exclusive(()=>{if(syncSave())return;try{placeDeployment(d.id,...parts);}catch(err){toast(err.message);}});}else toast('请放在我方下方两排。');}}}
document.addEventListener('pointerup',e=>finishDeployDrag(e));document.addEventListener('pointercancel',e=>finishDeployDrag(e,true));
let shadePress = null;
modalRoot.addEventListener('pointerdown',e=>{
  shadePress=e.button===0&&e.target.classList.contains('modal-shade')
    ? {target:e.target,x:e.clientX,y:e.clientY} : null;
});
modalRoot.addEventListener('pointercancel',()=>{shadePress=null;});
modalRoot.addEventListener('click',e=>{
  const press=shadePress;
  shadePress=null;
  if(!press||e.target!==press.target||Math.hypot(e.clientX-press.x,e.clientY-press.y)>6)return;
  MeowSound.play('back');
  goBack();
});
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.arena-unit')){e.preventDefault();e.target.click();}if(e.key==='Escape'){if(modalRoot.children.length||page!=='home'||wishOpen)MeowSound.play('back');if(modalRoot.children.length)modalBack();else if(page!=='home')goBack();else if(wishOpen){wishOpen=false;render();}}if(e.key==='Tab'&&modalRoot.children.length){const a=[...modalRoot.querySelectorAll('button,input')].filter(n=>!n.disabled);if(e.shiftKey&&document.activeElement===a[0]){e.preventDefault();a.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===a.at(-1)){e.preventDefault();a[0].focus();}}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)clearTimeout(levelTimer);else if(levelShowing)showGrowth();});
window.addEventListener('storage',e=>{if(e.key===STORE)MeowSave.exclusive(()=>syncSave());});
window.addEventListener('focus',()=>MeowSave.exclusive(()=>syncSave()));
const assets=['v155-leaf-box','v155-dew-box','v141-skill-icons','v141-range-tiles','v12-mutants-a','v12-mutants-b','v9-walk-pointed','v9-walk-round','v9-walk-rare','v8-nursery-room','v8-square-back','v8-welcome','v7-hearts-teams','v7-skills-growth','v6-rare-cats-clean','v6-panel-thin','v6-resources','v6-battle-tiles','v4-ground','v4-foreground-tree','v3-map-village','v2-map-home','v2-map-battle','v2-cats','v2-cats-round','v2-panels','v2-buttons','v2-icons'];
let imagesReady=0;const loadedImage=ok=>{imagesReady++;const label=document.querySelector('#loading p');if(label)label.textContent='小院正在醒来…… '+Math.round(imagesReady/assets.length*100)+'%';return ok;};
Promise.all(assets.map(n=>new Promise(resolve=>{const i=new Image();i.onload=()=>i.decode().catch(()=>{}).then(()=>resolve(loadedImage(true)));i.onerror=()=>resolve(loadedImage(false));i.src=ASSET(n);}))).then(results=>{render();$('#loading').remove();if(results.some(x=>!x))modal('有几张画还没送到','网络有些慢，部分画面还未加载完成。请重新载入。',btn('重新载入','reload'));if(state.pendingWelcomes.length||state.pendingGrowth.length)showNextCelebration();if(loadNotice)toast(loadNotice);});
document.addEventListener('click',e=>{if(e.target.closest('[data-action="reload"]'))location.reload();const el=e.target.closest('summary,button');if(el&&!el.disabled&&!el.closest('[data-action]')&&!e.defaultPrevented)MeowSound.play('tap');});
window.MeowDemo={build:'15.5-nursery-boxes',getWelcomeShowing:()=>welcomeShowing,getGrowthShowing:()=>levelShowing,getBattlePhase:()=>battleCue?.phase||null,getCamera:()=>({...camera}),getVillageScene:()=>({time:villageTime,tree:{...TREE},gate:VillageMotion.gate,cats:[...document.querySelectorAll('.village-cat')].map(el=>({id:Number(el.dataset.id),x:parseFloat(el.style.left),y:parseFloat(el.style.top),depth:Number(el.style.zIndex),moving:el.dataset.moving,frame:Number(el.dataset.frame)}))}),getState:()=>JSON.parse(JSON.stringify(state)),getPage:()=>page,getBattle:()=>battle?JSON.parse(JSON.stringify(battle)):null};
})();
