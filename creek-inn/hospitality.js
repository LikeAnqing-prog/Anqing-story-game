"use strict";

const furnishings = {
  flowers: { name: "野花盆", icon: "flower", cost: 6, flowers: true, pollen: true, detail: "蜜蜂入住时长花芽。2 颗花芽可扎花束，在小屋卖给来访的朋友。橘蝶首晚多付 2 叶币。小白鹭每晚少付 1。" },
  curtain: { name: "遮光帘", icon: "curtain", cost: 8, quiet: true, detail: "灰兔住满两晚，退房多付 2 叶币。提灯萤住这里会早睡，不能送客。" },
  water: { name: "清水盆", icon: "water", cost: 6, water: true, detail: "小青鸭入住时再多付 2 叶币。" },
  flowerBox: { name: "窗外花箱", icon: "window", flowers: true, detail: "橘蝶首晚多付 2 叶币。花在窗外，小白鹭住着不受影响。" },
  seeds: { name: "花种盒", icon: "flower", flowers: true, pollen: true, sale: 4, detail: "当野花盆使用。每累计两次授粉，多长 1 颗花芽。" },
  paintedWindow: { name: "手绘花窗", icon: "window", flowers: true, sale: 5, detail: "橘蝶首晚多付 2 叶币。能接花友单，小白鹭也可以安心住。" },
  cushion: { name: "绒布坐垫", icon: "cushion", quiet: true, sale: 4, detail: "灰兔住满两晚，退房多付 2 叶币。提灯萤可以照常送客。" },
  map: { name: "溪湾地图", icon: "map", lobby: true, sale: 5, detail: "陈列后，每周多一张能提前预约的水路双人单。" },
  stone: { name: "溪石摆件", icon: "water", water: true, sale: 4, detail: "小青鸭入住时多付 2 叶币。放进观景房，水獭每晚再多付 1。" },
  painting: { name: "候鸟画", icon: "window", lobby: true, sale: 5, detail: "陈列后，每周第一张完成的观鸟委托额外多收 4 叶币。" },
  lamp: { name: "门廊小灯", icon: "lamp", lobby: true, sale: 5, detail: "当晚有至少两位客人退房，多收 1 叶币。" }
};

const ownerFurnishings = {
  flowers: { name: "窗边花架", icon: "flower", cost: 8 },
  quiet: { name: "安静茶座", icon: "cushion", cost: 8 },
  water: { name: "睡莲水缸", icon: "water", cost: 8 }
};

const oldFriends = {
  bee: { favorite: "flowers", gift: "seeds", likes: "花景" },
  butterfly: { favorite: "flowers", gift: "paintedWindow", likes: "花景" },
  hare: { favorite: "quiet", gift: "cushion", likes: "安静的茶座" },
  duck: { favorite: "water", gift: "map", likes: "水景摆件" },
  otter: { favorite: "water", gift: "stone", likes: "水景摆件" },
  heron: { favorite: "flowers", gift: "painting", likes: "窗外的花" },
  firefly: { favorite: "quiet", gift: "lamp", likes: "安静的茶座" }
};

function newHospitality() {
  return { decor: {}, inventory: {}, gifts: {}, owner: null, ownerOwned: [], showcase: null,
    buds: 0, pollinations: 0, paintingWeek: -1, memories: {}, visit: null, visited: [], visitsPerWeek: {}, todayVisit: null, keepsake: null };
}

function continueHospitality(previous) {
  const next = newHospitality();
  next.memories = { ...previous.memories };
  next.ownerOwned = previous.ownerOwned.slice();
  next.owner = previous.owner;
  const key = previous.keepsake;
  if (key && previous.gifts[key] === "kept") next.gifts[key] = "kept";
  else if (key && previous.inventory[key] > 0) next.inventory[key] = 1;
  return next;
}

function roomFurnishing(hospitality, slot) {
  return furnishings[hospitality?.decor[slot]];
}

function lodgingMemory(guest, slot, state, sentGuests) {
  const key = state.hospitality?.decor[slot];
  const item = furnishings[key];
  if (guest.kind === "heron" && item?.pollen) return { mood: "poor", detail: "上次花房的花粉让我一直打喷嚏。" };
  if (guest.kind === "firefly" && key === "curtain") return { mood: "poor", detail: "上次遮光帘拉得太严，没来得及送别其他客人。" };
  const liked = {
    bee: item?.pollen && "上次花盆里的花，闻起来真香。",
    butterfly: item?.flowers && "我还记得上次住的那间花房。",
    hare: item?.quiet && "那间房很安静，我上次睡得特别好。",
    duck: item?.water && "上次房里的小水盆，我玩了好久。",
    otter: slot === state.viewRoom && "上次在窗边就能看见溪水。",
    heron: slot === state.viewRoom && "上次在无花粉的观景房看见了溪湾。",
    firefly: sentGuests > 0 && "上次有好几位旅客，让我陪他们走到了门口。"
  }[guest.kind];
  return liked ? { mood: "good", detail: liked } : { mood: "fine", detail: "上次住得还行，有空想看看你的小屋。" };
}

function lodgingScore(guest, slot, state) {
  const review = lodgingMemory(guest, slot, state, 0);
  return review.mood === "poor" ? -8 : review.mood === "good" ? 2 : 0;
}

function hospitalityEffects(state, departed, sentGuests, hasBirdCommission) {
  const current = state.hospitality ?? newHospitality();
  const next = { ...current, memories: { ...current.memories } };
  const effects = [];
  const add = (kind, slot, label, coins = 0, buds = 0) => effects.push({ kind, slot, label, coins, buds });
  const recorded = new Set();
  for (const [slot, guest] of state.rooms.entries()) {
    if (!guest) continue;
    const item = roomFurnishing(current, slot);
    const key = current.decor[slot];
    const firstNight = guest.arrived === state.night;
    const lastNight = departed.has(guest.id);
    if (guest.kind === "bee" && item?.pollen && firstNight) {
      let buds = 1;
      if (key === "seeds" && ++next.pollinations % 2 === 0) buds++;
      next.buds += buds;
      add("bee", slot, "蜜蜂给花授粉", 0, buds);
    }
    if (guest.kind === "butterfly" && item?.flowers && firstNight) add("butterfly", slot, "橘蝶的花景小费", 2);
    if (guest.kind === "heron" && item?.pollen) add("heron", slot, "小白鹭 · 花粉过敏", -1);
    if (guest.kind === "duck" && item?.water && firstNight) add("duck", slot, "小青鸭的玩水小费", 2);
    if (guest.kind === "hare" && item?.quiet && lastNight && state.night - guest.arrived >= 1) add("hare", slot, "灰兔的安睡小费", 2);
    if (guest.kind === "firefly" && key === "curtain") add("firefly", slot, "拉上遮光帘 · 提灯萤提前休息");
    if (guest.kind === "otter" && key === "stone" && slot === state.viewRoom) add("otter", slot, "水獭的溪石小费", 1);
    if (lastNight && !recorded.has(guest.kind)) {
      recorded.add(guest.kind);
      next.memories[guest.kind] = lodgingMemory(guest, slot, state, sentGuests);
    }
  }
  if (current.showcase === "lamp" && departed.size >= 2) add("", null, "门廊小灯 · 两位以上客人退房", 1);
  const { week } = dateFor(state.night);
  if (current.showcase === "painting" && hasBirdCommission && current.paintingWeek !== week) {
    add("heron", null, "候鸟画 · 本周首次观鸟委托", 4);
    next.paintingWeek = week;
  }
  return { hospitality: next, effects };
}

function invitationStatus(state, kind) {
  const h = state.hospitality;
  const target = state.night + 1;
  const { week } = dateFor(target);
  const memory = h.memories[kind];
  if (h.visit?.kind === kind) return { scheduled: true, reason: "明晚来做客" };
  if (target >= orderCalendar.length) return { reason: "本季拜访已结束" };
  if (h.visited.includes(kind)) return { reason: "这季已经来过" };
  if ((h.visitsPerWeek[week] ?? 0) >= 2) return { reason: "下次拜访在下周" };
  if (h.visit) return { reason: "明晚已约另一位朋友" };
  if (memory?.mood === "poor") return { reason: "想先再住一次舒服的客房" };
  if (memory?.mood === "good" || (memory && h.owner === oldFriends[kind].favorite)) return { ready: true, reason: "愿意来做客" };
  return { reason: `小屋里想看看${oldFriends[kind].likes}` };
}

function receiveVisit(state) {
  const h = state.hospitality;
  h.todayVisit = null;
  if (h.visit?.night !== state.night) return;
  const { kind } = h.visit;
  const gift = oldFriends[kind].gift;
  const { week } = dateFor(state.night);
  const delivered = h.gifts[gift] !== "kept";
  h.visit = null;
  h.visited.push(kind);
  h.visitsPerWeek[week] = (h.visitsPerWeek[week] ?? 0) + 1;
  if (delivered) h.gifts[gift] = "kept";
  h.todayVisit = { kind, gift: delivered ? gift : null, detail: h.memories[kind].detail };
}

function availableFurnishing(hospitality, key) {
  const count = furnishings[key].sale ? Number(hospitality.gifts[key] === "kept") : hospitality.inventory[key] ?? 0;
  return count - Object.values(hospitality.decor).filter(value => value === key).length - Number(hospitality.showcase === key);
}

let hospitalityTab = "rooms";
let furnishingSlot = null;

function furnishableRooms() {
  if (roomActionsOpen(game)) return game.queue.length ? [] : game.rooms.flatMap((guest, slot) => guest ? [] : [slot]);
  if (game.phase === "bookings" || (game.phase === "receipt" && (!game.result.due || game.result.paid))) {
    return game.result.nextRooms.flatMap((guest, slot) => guest ? [] : [slot]);
  }
  return [];
}

function furnitureIcon(key) {
  return create("i", `furniture-icon furniture-${key}`);
}

function hospitalityButton(label, action, disabled = false) {
  const button = create("button", "wood", label);
  button.type = "button";
  button.disabled = disabled;
  button.addEventListener("click", action);
  return button;
}

function hospitalityCard(title, detail, icon) {
  const card = create("article", "hospitality-card");
  const copy = create("div", "hospitality-copy");
  copy.append(create("strong", "", title), create("p", "", detail));
  card.append(typeof icon === "string" ? furnitureIcon(icon) : icon, copy);
  return { card, copy, actions: card.appendChild(create("div", "hospitality-actions")) };
}

function roomChooser(panel, slots) {
  if (!slots.includes(furnishingSlot)) furnishingSlot = slots[0] ?? null;
  const label = create("label", "hospitality-picker", "选择空房");
  const picker = create("select");
  for (const slot of slots) {
    const item = roomFurnishing(game.hospitality, slot);
    const option = create("option", "", `${roomName(slot)} · ${item?.name ?? "还没装扮"}`);
    option.value = slot;
    picker.append(option);
  }
  if (!slots.length) picker.append(create("option", "", "等客人退房后再布置"));
  picker.disabled = !slots.length;
  if (!picker.disabled) picker.value = furnishingSlot;
  picker.addEventListener("change", () => { furnishingSlot = Number(picker.value); renderHospitality(); });
  label.append(picker);
  panel.append(label);
}

function refreshHospitality(message = "") {
  byId("hospitalityStatus").textContent = message;
  if (game.phase === "planning" || game.phase === "bookings") {
    const context = getPhoneContext();
    const picked = [];
    for (const order of context.offers.filter(order => game.picks.includes(order.id))) {
      if (!bookingRestriction(order, context.rooms, game.viewRoom, reservedGuests(context.offers, picked), game.hospitality)) picked.push(order.id);
    }
    if (picked.length < game.picks.length) byId("hospitalityStatus").textContent += " 有订单因房间条件变化取消了选中。";
    game.picks = picked;
  }
  save();
  render();
  renderHospitality();
  if (dialog("cottage").open) renderCottage();
  if (dialog("build").open) openBuild();
  if (dialog("phone").open) renderPhone();
  if (dialog("receipt").open) renderReceipt();
}

function placeFurnishing(key, buy = false) {
  if (!furnishableRooms().includes(furnishingSlot)) return;
  const h = game.hospitality;
  const item = furnishings[key];
  if (buy) {
    if (!item.cost || game.wallet < item.cost) return;
    game.wallet -= item.cost;
    h.inventory[key] = (h.inventory[key] ?? 0) + 1;
  } else if (availableFurnishing(h, key) < 1) return;
  h.decor[furnishingSlot] = key;
  refreshHospitality(`${roomName(furnishingSlot)}已摆上${item.name}`);
}

function takeDown(key) {
  const h = game.hospitality;
  const slot = Object.keys(h.decor).find(slot => h.decor[slot] === key);
  if (slot !== undefined) {
    if (!furnishableRooms().includes(Number(slot))) return false;
    delete h.decor[slot];
  }
  if (h.showcase === key) h.showcase = null;
  return true;
}

function renderFurnishingShop(panel) {
  const slots = furnishableRooms();
  const h = game.hospitality;
  roomChooser(panel, slots);
  if (h.decor[furnishingSlot]) panel.append(hospitalityButton("收起这间房的装扮", () => {
    if (!furnishableRooms().includes(furnishingSlot)) return;
    delete h.decor[furnishingSlot];
    refreshHospitality("装扮已收回柜子");
  }));
  for (const [key, item] of Object.entries(furnishings).filter(([, item]) => item.cost)) {
    const { card, actions } = hospitalityCard(item.name, item.detail, item.icon);
    if (availableFurnishing(h, key)>0) actions.append(hospitalityButton("从柜子摆上", () => placeFurnishing(key), !slots.length));
    actions.append(hospitalityButton(`买来摆上 · ${item.cost} 叶币`, () => placeFurnishing(key, true), !slots.length || game.wallet<item.cost));
    panel.append(card);
  }
  const craft = hospitalityCard("窗外花箱", "用 3 颗花芽和一个野花盆改造。能保留花景，屋里没有花粉。", "window");
  const potInRoom = h.decor[furnishingSlot] === "flowers";
  const canCraft = h.buds>=3 && (potInRoom || availableFurnishing(h, "flowers")>0);
  craft.actions.append(hospitalityButton("改造 · 3 花芽", () => {
    if (!furnishableRooms().includes(furnishingSlot) || !canCraft) return;
    h.buds -= 3;
    h.inventory.flowers--;
    h.inventory.flowerBox = (h.inventory.flowerBox ?? 0)+1;
    h.decor[furnishingSlot] = "flowerBox";
    refreshHospitality("窗外花箱已经装好");
  }, !slots.length || !canCraft));
  if (availableFurnishing(h, "flowerBox")>0) craft.actions.append(hospitalityButton("摆上窗外花箱", () => placeFurnishing("flowerBox"), !slots.length));
  panel.append(craft.card);
}

const bouquetBuds = 2;
const bouquetPrice = 7;
let drawerOpen = false;
let previewFurniture = null;
let showMemory = true;

function sellVisitBouquet(state) {
  const h = state.hospitality;
  const visit = h.todayVisit;
  if (state.phase !== "day" || !visit || visit.boughtBouquet || h.buds < bouquetBuds) return false;
  h.buds -= bouquetBuds;
  state.wallet += bouquetPrice;
  visit.boughtBouquet = true;
  return true;
}

function cottageArt(key, label = "") {
  const image = create("img");
  image.src = `./assets/cottage/${key}.webp`;
  image.alt = label;
  image.draggable = false;
  return image;
}

function openCottage() {
  drawerOpen = false;
  previewFurniture = game.hospitality.owner;
  showMemory = true;
  byId("cottageStatus").textContent = "";
  renderCottage();
  show("cottage");
}

function commitFurniture(key) {
  const item = ownerFurnishings[key];
  const h = game.hospitality;
  if (!item || h.owner === key) return;
  if (!h.ownerOwned.includes(key)) {
    if (game.wallet < item.cost || ["won","failed"].includes(game.phase) || (game.result?.due && !game.result.paid)) return;
    game.wallet -= item.cost;
    h.ownerOwned.push(key);
  }
  h.owner = key;
  drawerOpen = false;
  byId("cottageStatus").textContent = `已摆好${item.name}`;
  save();
  render();
  renderCottage();
}

function renderFurnitureChoices() {
  const h = game.hospitality;
  const selected = previewFurniture;
  const choices = byId("cottageChoices");
  choices.replaceChildren(...Object.entries(ownerFurnishings).map(([key, item]) => {
    const button = create("button", "cottage-choice");
    button.type = "button";
    button.setAttribute("aria-pressed", String(key === selected));
    button.append(cottageArt(key), create("strong", "", item.name));
    if (h.owner === key) button.append(create("small", "", "已摆上"));
    else if (h.ownerOwned.includes(key)) button.append(create("small", "", "已拥有"));
    else button.append(valueWithIcon(item.cost, "coin", false));
    button.addEventListener("click", () => {
      previewFurniture = key;
      byId("cottageStatus").textContent = "";
      renderCottage();
      byId("cottageChoices").children[Object.keys(ownerFurnishings).indexOf(key)].focus({preventScroll:true});
    });
    return button;
  }));
  const offer = byId("cottageOffer");
  offer.replaceChildren();
  if (!selected) return;
  const item = ownerFurnishings[selected];
  const owned = h.ownerOwned.includes(selected);
  const favorite = Object.keys(oldFriends).filter(kind => oldFriends[kind].favorite === selected);
  const fans = create("div", "cottage-fans");
  fans.append(create("span", "", "喜欢这件"));
  for (const kind of favorite) {
    const portrait = makeSprite(kind, "cottage-fan");
    portrait.alt = animals[kind].name;
    portrait.title = animals[kind].name;
    fans.append(portrait);
  }
  const locked = !owned && (game.wallet < item.cost || ["won","failed"].includes(game.phase) || (game.result?.due && !game.result.paid));
  const label = h.owner === selected ? "已摆好" : owned ? "换上家具" : game.wallet < item.cost ? `还差 ${item.cost-game.wallet} 叶币` : "买下并摆上";
  const button = hospitalityButton(label, () => commitFurniture(selected), h.owner === selected || locked);
  if (!owned && !locked) button.append(valueWithIcon(item.cost, "coin", false));
  offer.append(fans, button);
}

function renderCottage() {
  const h = game.hospitality;
  const visitor = h.todayVisit;
  const chosen = drawerOpen ? previewFurniture : h.owner;
  byId("cottageDate").textContent = nightText(game.night);
  byId("cottageWallet").replaceChildren(valueWithIcon(game.wallet, "coin", false));
  const furniture = byId("cottageFurniture");
  furniture.hidden = !chosen;
  if (chosen) {
    furniture.src = `./assets/cottage/${chosen}.webp`;
    furniture.alt = ownerFurnishings[chosen].name;
  } else furniture.removeAttribute("src");
  byId("cottagePreview").hidden = !drawerOpen || !chosen || chosen === h.owner;
  const guest = byId("cottageGuest");
  guest.hidden = !visitor;
  guest.replaceChildren();
  const speech = byId("cottageSpeech");
  speech.hidden = !visitor || !showMemory || drawerOpen;
  const summary = byId("cottageVisit");
  summary.hidden = drawerOpen;
  summary.replaceChildren();
  if (visitor) {
    const name = animals[visitor.kind].name;
    const portrait = create("button", "cottage-pet");
    portrait.type = "button";
    portrait.setAttribute("aria-label", `和${name}聊聊`);
    portrait.addEventListener("click", () => { showMemory = !showMemory; renderCottage(); });
    portrait.append(makeSprite(visitor.kind,"visiting-animal"));
    guest.append(portrait);
    const greetings = { flowers:"你说的窗边花景，今天终于看到了。", quiet:"我想在这把椅子旁，再陪你坐一会儿。", water:"水缸里的小鱼刚才游到我这边啦！" };
    speech.textContent = visitor.detail;
    if (h.memories[visitor.kind]?.mood === "fine") {
      speech.textContent = h.owner === oldFriends[visitor.kind].favorite ? greetings[h.owner] : "今天轮到我来找你啦！";
    }
    const text = create("div", "cottage-appointment");
    text.append(create("strong","",`${name}在小屋做客`));
    if (visitor.gift) text.append(create("small","",`带来的礼物 · ${furnishings[visitor.gift].name}`));
    summary.append(text);
    if (game.phase === "day" && (h.buds >= bouquetBuds || visitor.boughtBouquet)) {
      const sale = hospitalityButton(visitor.boughtBouquet ? "已买走花束" : "卖一束花", () => {
        if (!sellVisitBouquet(game)) return;
        save();
        render();
        byId("cottageStatus").textContent = `${name}带走了花束，收到 ${bouquetPrice} 叶币`;
        renderCottage();
      }, visitor.boughtBouquet);
      if (!visitor.boughtBouquet) sale.append(create("small", "", `${bouquetBuds} 花芽换 ${bouquetPrice} 叶币`));
      summary.append(sale);
    }
  } else {
    const visit = h.visit;
    const date = visit ? "明晚赴约" : "访客簿";
    const text = create("div", "cottage-appointment");
    text.append(create("strong", "", visit ? `${animals[visit.kind].name}会来小屋` : "今天还没约朋友"));
    const count = Object.keys(h.memories).length;
    text.append(create("small","", visit ? `${nightText(visit.night)} · ${date}` : count ? `已结识 ${count} 位旅客` : "有旅客退房后，可以邀请它来坐坐"));
    summary.append(text);
    if (visit) summary.append(makeSprite(visit.kind,"cottage-next"));
  }
  byId("cottageDrawer").hidden = !drawerOpen;
  byId("cottageDress").setAttribute("aria-expanded", String(drawerOpen));
  if (drawerOpen) renderFurnitureChoices();
}

function initCottage() {
  const toggle = () => {
    drawerOpen = !drawerOpen;
    previewFurniture = game.hospitality.owner ?? "flowers";
    byId("cottageStatus").textContent = "";
    renderCottage();
  };
  byId("cottageDress").addEventListener("click", toggle);
  byId("cottageFold").addEventListener("click", () => { toggle(); byId("cottageDress").focus(); });
  byId("cottageInvite").addEventListener("click", () => openHospitality("friends"));
  byId("cottageGifts").addEventListener("click", () => openHospitality("gifts"));
}

function renderFriendList(panel) {
  const h = game.hospitality;
  const { week } = dateFor(game.night+1);
  panel.append(create("p", "friend-summary", `下次拜访 · ${nightText(game.night+1)} · 本周 ${h.visitsPerWeek[week] ?? 0}/2 次`));
  if (h.todayVisit) {
    const visitor = h.todayVisit;
    panel.append(create("p", "visit-note", `${animals[visitor.kind].name}今天来过小屋${visitor.gift ? `，送来${furnishings[visitor.gift].name}` : ""}。`));
  }
  if (!Object.keys(h.memories).length) panel.append(create("p", "visit-note", "接待过的客人退房后，会把上一次的住宿回忆留在这里。"));
  const moods = {good:"住得开心", fine:"住得还行", poor:"住得不舒服"};
  for (const [kind, memory] of Object.entries(h.memories)) {
    const status = invitationStatus(game, kind);
    const { card, actions, copy } = hospitalityCard(animals[kind].name, memory.detail, makeSprite(kind, "friend-avatar"));
    copy.append(create("span", `friend-mood ${memory.mood}`, moods[memory.mood]));
    actions.append(create("span", "friend-reason", status.reason));
    if (status.ready || status.scheduled) actions.append(hospitalityButton(status.scheduled ? `取消邀请${animals[kind].name}` : `邀请${animals[kind].name}`, () => {
      const current = invitationStatus(game, kind);
      if (current.scheduled) h.visit = null;
      else if (current.ready) h.visit = {kind, night:game.night+1};
      refreshHospitality(current.scheduled ? "已取消拜访" : `${animals[kind].name}明晚来做客`);
    }));
    panel.append(card);
  }
}

function renderGiftCabinet(panel) {
  const h = game.hospitality;
  const slots = furnishableRooms();
  roomChooser(panel, slots);
  panel.append(create("p", "friend-summary", h.showcase ? `大厅陈列 · ${furnishings[h.showcase].name}` : "大厅有一个空陈列位"));
  const keys = Object.keys(h.gifts).filter(key => h.gifts[key] === "kept");
  if (!keys.length) panel.append(create("p", "visit-note", "有朋友来小屋做客时，礼物会收在这里。"));
  for (const key of keys) {
    const item = furnishings[key];
    const placed = h.showcase === key || availableFurnishing(h, key)<1;
    const slot = Object.keys(h.decor).find(slot => h.decor[slot] === key);
    const locked = slot !== undefined && !slots.includes(Number(slot));
    const {card, actions, copy} = hospitalityCard(item.name, item.detail, item.icon);
    if (placed) copy.append(create("span", "friend-mood good", item.lobby ? "大厅陈列中" : roomName(Number(slot))));
    actions.append(hospitalityButton(placed ? "收进柜子" : item.lobby ? "摆在大厅" : "摆进客房", () => {
      if (placed && takeDown(key)) refreshHospitality(`${item.name}已收回柜子`);
      else if (!placed && item.lobby) {
        h.showcase = key;
        refreshHospitality(`大厅已摆上${item.name}`);
      } else if (!placed) placeFurnishing(key);
    }, locked || (!placed && !item.lobby && !slots.length)));
    actions.append(hospitalityButton(`卖出 · ${item.sale} 叶币`, () => {
      if (h.gifts[key] !== "kept" || !takeDown(key)) return;
      h.gifts[key] = "sold";
      game.wallet += item.sale;
      refreshHospitality(`已卖出${item.name}，收到 ${item.sale} 叶币`);
    }, locked));
    panel.append(card);
  }
}

function renderHospitality() {
  const h = game.hospitality;
  const panel = byId("hospitalityContents");
  panel.replaceChildren();
  byId("hospitalityWallet").replaceChildren(valueWithIcon(game.wallet), valueWithIcon(h.buds, "bud"));
  byId("hospitalityTitle").textContent = { rooms: "客房装扮", friends: "老朋友", gifts: "礼物柜" }[hospitalityTab];
  for (const button of byId("hospitalityNav").querySelectorAll("button")) {
    button.setAttribute("aria-pressed", String(button.dataset.page===hospitalityTab));
  }
  ({ rooms:renderFurnishingShop, friends:renderFriendList, gifts:renderGiftCabinet })[hospitalityTab](panel);
}

function openHospitality(page = "rooms") {
  hospitalityTab = page;
  byId("hospitalityStatus").textContent = "";
  renderHospitality();
  show("hospitality");
}

function renderRoomPlan(rooms, selected, assigned, effects) {
  const panel = byId("phoneRoomPlans");
  panel.hidden = !selected.length && !effects.length;
  byId("phoneLodgingForecast").hidden = !effects.length;
  byId("phoneLodgingForecast").replaceChildren(...effects.map(effect => {
    const row = create("p", effect.coins < 0 ? "negative" : "", effect.label);
    if (effect.coins || effect.buds) {
      const amount = effect.coins || effect.buds;
      row.append(valueWithIcon(`${amount>0?"+":""}${amount}`, effect.buds ? "bud" : "coin", false));
    }
    return row;
  }));
  const rows = selected.map(guest => {
    const slot = assigned.findIndex(person => person?.id === guest.id);
    const item = roomFurnishing(game.hospitality,slot);
    return create("li", "", `${animals[guest.kind].name} → ${roomName(slot)}${item ? ` · ${item.name}` : ""}`);
  });
  byId("phoneAssigned").replaceChildren(...rows);
  const movers = selected.filter(guest => !guest.needsFlower && !guest.needsView);
  const free = rooms.flatMap((guest,slot) => guest || assigned[slot]?.needsView || assigned[slot]?.needsFlower ? [] : [slot]);
  byId("phoneMove").hidden = !movers.length || free.length<2;
  const guestPicker = byId("moveGuest");
  const roomPicker = byId("moveRoom");
  guestPicker.replaceChildren(...movers.map(guest => {
    const option = create("option", "", `${animals[guest.kind].name} · ${roomName(assigned.findIndex(person=>person?.id===guest.id))}`);
    option.value = guest.id;
    return option;
  }));
  if (movers.some(guest=>guest.id===game.roomChoice?.id)) guestPicker.value=game.roomChoice.id;
  roomPicker.replaceChildren(...free.map(slot => {
    const option = create("option", "", roomName(slot));
    option.value=slot;
    return option;
  }));
  const current = assigned.findIndex(person=>person?.id===guestPicker.value);
  if (free.includes(current)) roomPicker.value=current;
}

function openKeepsakes() {
  const h = game.hospitality;
  const picker = byId("keepsakeSelect");
  const options = [["", "空手开张"]];
  for (const [key, count] of Object.entries(h.inventory)) if (count>0) options.push([key, furnishings[key].name]);
  for (const [key, status] of Object.entries(h.gifts)) if (status==="kept") options.push([key, furnishings[key].name]);
  picker.replaceChildren(...options.map(([key, label]) => {
    const option = create("option", "", label);
    option.value = key;
    return option;
  }));
  show("keepsake");
}

let bellAudio;
let soundOn = true;
let finishTurn;

function unlockBell() {
  if (!soundOn) return;
  try {
    const AudioEngine = window.AudioContext || window.webkitAudioContext;
    if (AudioEngine && !bellAudio) bellAudio = new AudioEngine();
    if (bellAudio?.state === "suspended") bellAudio.resume().catch(() => {});
  } catch { /* The visual cue is available without audio. */ }
}

function ringBell(closing) {
  if (!soundOn || bellAudio?.state !== "running") return;
  const tones = closing ? [523.25, 392] : [659.25, 880];
  tones.forEach((note, i) => {
    const at = bellAudio.currentTime + i * 0.115;
    for (const [ratio, strength] of [[1, 0.047], [2.01, 0.019], [2.73, 0.011], [4.14, 0.006]]) {
      const osc = bellAudio.createOscillator();
      const gain = bellAudio.createGain();
      osc.frequency.value = note * ratio;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(strength, at + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.49);
      osc.connect(gain).connect(bellAudio.destination);
      osc.start(at);
      osc.stop(at + 0.50);
    }
  });
}

function showTurn(closing, result, complete) {
  if (finishTurn) return;
  const visual = dialog("turn");
  visual.classList.toggle("closing", closing);
  byId("turnTitle").textContent = closing ? "今晚打烊" : "开始营业啦";
  byId("turnDate").textContent = nightText(game.night);
  const note = byId("turnNote");
  const visitor = game.hospitality.todayVisit;
  const visitArt = byId("turnVisitor");
  visitArt.hidden = closing || !visitor;
  if (!visitArt.hidden) {
    visitArt.replaceChildren(makeSprite(visitor.kind,"friend-avatar"));
    if (visitor.gift) visitArt.append(furnitureIcon(furnishings[visitor.gift].icon));
  }
  note.replaceChildren();
  if (closing) {
    note.append("今晚到账 ", valueWithIcon(`+${result.coins}`));
    const buds = result.effects.reduce((sum,effect)=>sum+effect.buds,0);
    if (buds) note.append(" · ",valueWithIcon(`+${buds}`,"bud"));
  }
  else if (visitor) note.append(`${animals[visitor.kind].name}来做客${visitor.gift ? ` · 送来${furnishings[visitor.gift].name}` : ""}`);
  note.hidden = !note.childNodes.length;
  for (const effect of result?.effects ?? []) {
    if (effect.slot === null) continue;
    const view = floorViews[Math.floor(effect.slot/roomsPerFloor)]?.views[effect.slot%roomsPerFloor];
    if (!view) continue;
    view.reward.textContent = effect.buds ? `花芽 +${effect.buds}` : effect.coins ? `${effect.coins>0?"+":""}${effect.coins} 叶币` : "提前休息";
    view.reward.classList.toggle("negative", effect.coins<0 || (!effect.coins && !effect.buds));
    view.reward.hidden = false;
  }
  ringBell(closing);
  let timer;
  finishTurn = () => {
    clearTimeout(timer);
    finishTurn = null;
    visual.close();
    for (const floor of floorViews) for (const view of floor.views) view.reward.hidden = true;
    complete();
  };
  show("turn");
  timer = setTimeout(finishTurn, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 350 : closing ? 900 : 790);
}

function initHospitality() {
  try { soundOn = localStorage.getItem("creek-inn-bell") !== "off"; } catch { /* Default on. */ }
  const sound = byId("bellToggle");
  const updateSound = () => {
    sound.textContent = soundOn ? "♫" : "×";
    sound.setAttribute("aria-label", soundOn ? "关闭铃声" : "开启铃声");
  };
  updateSound();
  sound.addEventListener("click", () => {
    soundOn = !soundOn;
    try { localStorage.setItem("creek-inn-bell", soundOn ? "on" : "off"); } catch { /* Session setting. */ }
    updateSound();
    unlockBell();
  });
  byId("hospitalityButton").addEventListener("click", openCottage);
  byId("buildFurnish").addEventListener("click", () => openHospitality("rooms"));
  initCottage();
  byId("phoneFriends").addEventListener("click", () => openHospitality("friends"));
  byId("phoneFurnish").addEventListener("click", () => openHospitality("rooms"));
  byId("hospitalityNav").addEventListener("click", event => {
    const page = event.target.closest("button")?.dataset.page;
    if (page) openHospitality(page);
  });
  byId("visitToday").addEventListener("click", openCottage);
  byId("lobbyDisplay").addEventListener("click", () => openHospitality("gifts"));
  byId("moveApply").addEventListener("click", () => {
    const id = byId("moveGuest").value;
    const slot = Number(byId("moveRoom").value);
    if (!id || !Number.isInteger(slot)) return;
    game.roomChoice = {id,slot};
    save();
    renderPhone();
  });
  byId("turnSkip").addEventListener("click", () => finishTurn?.());
  dialog("turn").addEventListener("cancel", event => { event.preventDefault(); finishTurn?.(); });
  byId("keepsakeConfirm").addEventListener("click", () => {
    const h = game.hospitality;
    h.keepsake = byId("keepsakeSelect").value || null;
    dialog("keepsake").close();
    dialog("receipt").close();
    start(game.business.channels, game.business.season+1, continueHospitality(h));
  });
}
