'use strict';
function createDisplayCabinet({state,recipes,productImage,woolIcon,goodsValue,displayLevel,unlocked,onChange}){
  const panel=document.createElement('dialog');
  panel.id='displayDialog';panel.className='farm-dialog';panel.setAttribute('aria-labelledby','displayTitle');
  panel.innerHTML='<div class="awning"></div><div class="shop-head"><h2 id="displayTitle">羊毛铺陈列柜</h2><button data-close>返回</button></div><div class="display-body"></div>';
  document.body.append(panel);
  const body=panel.querySelector('.display-body');
  let draft={},notice='',worldKey='',panelKey='';
  const windowModels=new Map();
  const tags=[];
  function quantityTag(parent,quantity,x,y,z){
    const label=document.createElement('canvas');label.width=128;label.height=56;
    const ctx=label.getContext('2d');
    ctx.fillStyle='#fff1cf';ctx.strokeStyle='#916a44';ctx.lineWidth=4;
    ctx.beginPath();ctx.roundRect(2,2,124,52,18);ctx.fill();ctx.stroke();
    ctx.fillStyle='#533d2c';ctx.font='bold 37px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('×'+quantity,64,28,116);
    const map=new T.CanvasTexture(label);map.colorSpace=T.SRGBColorSpace;
    const material=new T.SpriteMaterial({map,transparent:true,depthWrite:false});
    const tag=new T.Sprite(material);tag.position.set(x,y,z);tag.scale.set(.26,.114,1);parent.add(tag);
    tags.push(material);
  }
  function syncCabinet(displays){
    const signature=JSON.stringify(displays);
    if(signature===worldKey)return;
    worldKey=signature;
    const shelf=shopSite.cabinet;shelf.clear();
    for(const tag of tags){tag.map.dispose();tag.dispose()}tags.length=0;
    shopSite.building.scale.setScalar(1.32*(1+.06*displayLevel()));
    const counts=new Map();
    for(const stock of displays)for(const [id,n] of Object.entries(stock)){
      if(n>0)counts.set(id,(counts.get(id)||0)+n);
    }
    shopSite.starterGoods.visible=counts.size===0;
    const doubleShelf=counts.size>5;
    shopSite.awning.scale.z=doubleShelf ? .72 : 1;
    shopSite.awning.position.set(0,doubleShelf ? .36 : 0,doubleShelf ? .49 : 0);
    if(!counts.size)return;
    // Reserve a place for every design before filling spare room with identical pieces.
    const pieces=[];
    let spare=Math.max(0,5-counts.size);
    for(const [id,n] of counts){
      const copies=1+Math.min(spare,n-1,2);spare-=copies-1;
      for(let i=1;i<=copies;i++)pieces.push({id,quantity:i===copies?n-copies+1:1});
    }
    const rows=Math.ceil(pieces.length/5),columns=Math.ceil(pieces.length/rows);
    if(doubleShelf){
      for(const side of [-1,1])box(shelf,0xb58960,side*1.71,.28,-.28,.08,.52,.09);
    }
    for(let row=0;row<rows;row++){
      const items=pieces.slice(row*columns,(row+1)*columns);
      const y=row*.51,z=row===0?.17:-.13;
      box(shelf,0xb58960,0,y+.035,z,3.57,.07,.64);
      box(shelf,0xecd7ae,0,y+.075,z,3.57,.022,.64);
      const spacing=Math.min(1.03,3.4/items.length);
      items.forEach(({id,quantity},j)=>{
        if(!windowModels.has(id)){
          const model=makeProduct(id),bounds=new T.Box3().setFromObject(model);
          windowModels.set(id,{model,center:bounds.getCenter(new T.Vector3()),size:bounds.getSize(new T.Vector3()),base:bounds.min.y});
        }
        const {model,center,size,base}=windowModels.get(id);
        const scale=Math.min((rows===1?.80:.42)/size.y,spacing*.92/size.x,.61/size.z);
        const x=(j-(items.length-1)/2)*spacing;
        const piece=model.clone();piece.name=id;piece.userData.quantity=quantity;piece.scale.setScalar(scale);
        piece.position.set(x-center.x*scale,y+.088-base*scale,z-center.z*scale);
        shelf.add(piece);
        if(quantity>1)quantityTag(shelf,quantity,x+spacing*.22,y+.085,z+.35);
      });
    }
    streetModel(shelf);
  }
  function shelfPreview(level,placed){
    const items={...placed};
    for(const [id,n] of Object.entries(draft))items[id]=(items[id]||0)+n;
    const example=!Object.keys(items).length;
    if(example){
      const id=['lamb','bunnyGift','toyTheatre'][level];
      items[id]=Math.ceil(displayTiers[level].value/recipes[id].price);
    }
    const entries=Object.entries(items),pieces=[];
    for(const [id,n] of entries){
      const count=entries.length===1?Math.min(3,n):1;
      for(let i=0;i<count;i++)pieces.push({id,quantity:i===count-1?n-count+1:1});
    }
    const figures=pieces.slice(0,4).map(({id,quantity})=>
      `<span>${productImage(id)}${quantity>1?'<i>×'+quantity+'</i>':''}</span>`).join('');
    const caption=example?'铺货示例':Object.keys(draft).length?'本次陈列预览':'柜中陈列';
    const description=entries.map(([id,n])=>recipes[id].name+' ×'+n).join('、');
    return `<figure class="shelf-preview"><div class="shelf-stage" role="img" aria-label="${caption}，${description}"><img class="shelf-art" src="art/display-shelf.png" alt=""><div class="shelf-goods">${figures}</div></div><figcaption>${caption}${example?' · '+description:''}</figcaption></figure>`;
  }
  function render(){
    const shop=state(),level=displayLevel(),tier=displayTiers[level];
    const archive=shop.displays.slice(0,level).map((items,i)=>
      '<div class="stocked-case"><strong>'+displayTiers[i].name+'</strong>'+Object.entries(items).map(([id,n])=>
        '<span>'+productImage(id)+recipes[id].name+' ×'+n+'</span>').join('')+'</div>').join('');
    let content='';
    if(tier){
      const value=goodsValue(shop.displays[level]||{}),chosen=goodsValue(draft),total=value+chosen;
      const preview=Object.entries(tier.goods).map(([id,r])=>'<span>'+productImage(id)+'<b>'+r.name+'</b><small>'+woolIcon()+' ×'+r.wool+' · '+coinAmount(r.price)+'</small></span>').join('');
      const cards=Object.entries(recipes).filter(([id])=>unlocked(id)).map(([id,r])=>{
        const n=draft[id]||0,stock=shop.stock[id];
        return '<div class="display-item">'+productImage(id)+'<div><b>'+r.name+'</b><small>货值 '+coinAmount(r.price)+' · 库存 '+stock+'</small></div><div class="stepper"><button data-less="'+id+'" aria-label="减少'+r.name+'" '+(n?'':'disabled')+'>−</button><output>'+n+'</output><button data-more="'+id+'" aria-label="添加'+r.name+'" '+(n<stock&&total<tier.value?'':'disabled')+'>＋</button></div></div>';
      }).join('');
      const balance=total>tier.value?'超出 '+(total-tier.value)+' 计入本柜':total===tier.value?'刚好可以开柜':'还差 '+(tier.value-total);
      const placed=Object.entries(shop.displays[level]||{}).map(([id,n])=>'<span>'+productImage(id)+recipes[id].name+' ×'+n+'</span>').join('');
      content=`<section class="display-goal">
        ${shelfPreview(level,shop.displays[level])}
        <div class="shelf-progress"><h3>筹备${tier.name}</h3><b>已铺货 ${coinAmount(value+' / '+tier.value)}</b>
        <progress aria-label="陈列柜筹备进度" max="${tier.value}" value="${Math.min(total,tier.value)}"></progress>
        <small>任选成品，按售价铺满货值即可开柜。</small></div>
        ${placed?'<div class="stocked-case">'+placed+'</div>':''}</section>
        <h4>开柜后可制作</h4><div class="display-preview">${preview}</div>
        <h4>从库存选货</h4><div class="display-grid">${cards}</div>
        <div class="display-checkout"><span>本次货值 <b>${coinAmount(chosen)}</b> · ${balance}</span><button data-place ${chosen?'':'disabled'}>${total>=tier.value?'铺货并开柜':'放入陈列柜'}</button></div>`;
    }
    body.innerHTML=(notice?'<p class="cabinet-notice" role="status">'+notice+'</p>':'')+content+(archive?'<h4>已开陈列柜</h4>'+archive:'');
  }
  function refresh(){
    const shop=state();syncCabinet(shop.displays);
    if(!panel.open)return;
    const key=JSON.stringify([shop.stock,shop.displays,draft,notice]);
    if(key!==panelKey){panelKey=key;render()}
  }
  function open(){draft={};notice='';panelKey='';panel.showModal();refresh()}
  panel.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button||button.disabled)return;
    if(button.hasAttribute('data-close')){panel.close();return}
    const shop=state(),level=displayLevel(),tier=displayTiers[level];if(!tier)return;
    const items=shop.displays[level]||{},id=button.dataset.more||button.dataset.less;
    if(id){
      const n=draft[id]||0;
      if(button.dataset.more&&n<shop.stock[id]&&goodsValue(items)+goodsValue(draft)<tier.value)draft[id]=n+1;
      if(button.dataset.less&&n>0){if(n===1)delete draft[id];else draft[id]=n-1}
      notice='';refresh();return;
    }
    if(!button.hasAttribute('data-place')||!goodsValue(draft))return;
    for(const [id,n] of Object.entries(draft))if(n>shop.stock[id]||!unlocked(id))return;
    for(const [id,n] of Object.entries(draft)){shop.stock[id]-=n;items[id]=(items[id]||0)+n}
    shop.displays[level]=items;draft={};
    notice=displayLevel()>level?tier.name+'已开柜，新配方已放上工作台，新来的客人可以订购。':'成品已摆好，可以下次再来铺货。';
    onChange();
  });
  return {open,refresh};
}
