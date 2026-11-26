"use strict";

const roomsPerFloor = 4;
const maxFloors = 3;
const weekLength = 7;
const baseRent = [100, 120, 140];
const floorNightlyRates = [0, 15, 15];
const buildCosts = [46, 50];
const openingWallet = 8;
const lookOutCost = 12;
const restRoomCost = 12;
const restRoomBonus = 5;
const partnerNames = { short: "溪畔旅伴", view: "观鸟协会", flower: "花友会" };
const animals = {
  bee: { name: "圆蜜蜂", rate: 3, hook: "认识许多短途旅客", rules: [
    { trigger: "退房时", text: "次晚增加 1 张短住订单", booking: true },
    { trigger: "每日上限", text: "多只蜜蜂也只推荐 1 位" }
  ] },
  butterfly: { name: "橘蝶", rate: 3, hook: "行程可以往后挪一天", rules: [
    { trigger: "留单", text: "今天没接，订单自动保留到次晚", booking: true }
  ] },
  firefly: { name: "提灯萤", rate: 3, hook: "给退房客人送行", rules: [
    { trigger: "提灯萤在店", text: "每有 1 位别的客人退房", amount: "+2" },
    { trigger: "多只同住", text: "同一位退房客只算 1 次" }
  ] },
  hare: { name: "灰兔", rate: 3, hook: "习惯入住时先付清房费" },
  duck: { name: "小青鸭", rate: 2, hook: "想画溪湾地图", rules: [
    { trigger: "入住首晚", text: "付一笔小费", amount: "+4" },
    { trigger: "来意", text: "第一次到溪湾，想画一张水路地图" }
  ] },
  otter: { name: "团尾水獭", rate: 4, hook: "熟悉溪湾水路", rules: [
    { trigger: "住观景房", text: "每晚多付", amount: "+2" },
    { trigger: "来意", text: "熟悉溪湾的水路，知道哪里适合划船" }
  ] },
  heron: { name: "小白鹭", rate: 4, hook: "爱结识新朋友", rules: [
    { trigger: "入住首晚", text: "每遇见 1 种其他动物", amount: "+2", limit: "最多 6" }
  ] }
};

const orderCalendar = [
  [["bee", 1], ["butterfly", 1], ["firefly", 3], ["hare", 2], ["duck", 1], ["heron", 2]],
  [["otter", 1], ["duck", 1], ["heron", 2], ["bee", 2], ["hare", 3]],
  [["butterfly", 1], ["duck", 2], ["otter", 3], ["bee", 1], ["firefly", 2]],
  [["hare", 3], ["firefly", 2], ["heron", 1], ["otter", 1], ["bee", 2]],
  [["bee", 1], ["butterfly", 2], ["duck", 1], ["hare", 2], ["heron", 2]],
  [["otter", 1], ["duck", 2], ["butterfly", 1], ["firefly", 3], ["heron", 1]],
  [["bee", 1], ["duck", 1], ["butterfly", 1], ["hare", 2], ["heron", 1], ["otter", 2]],
  [["bee", 2], ["hare", 3], ["firefly", 3], ["butterfly", 2], ["duck", 1], ["otter", 1]],
  [["otter", 2], ["duck", 2], ["heron", 1], ["bee", 1], ["butterfly", 1]],
  [["hare", 3], ["firefly", 3], ["butterfly", 1], ["duck", 1], ["bee", 2]],
  [["butterfly", 1], ["bee", 1], ["duck", 1], ["hare", 2], ["heron", 3], ["otter", 1]],
  [["otter", 2], ["firefly", 3], ["heron", 1], ["hare", 1], ["butterfly", 3]],
  [["heron", 2], ["duck", 1], ["bee", 1], ["butterfly", 1], ["otter", 2]],
  [["bee", 1], ["butterfly", 1], ["otter", 1], ["firefly", 2], ["duck", 1], ["hare", 3]],
  [["hare", 3], ["heron", 3], ["firefly", 2], ["duck", 1], ["bee", 2], ["butterfly", 1]],
  [["otter", 2], ["bee", 1], ["heron", 1], ["butterfly", 1], ["duck", 2], ["hare", 2]],
  [["butterfly", 2], ["firefly", 2], ["duck", 1], ["bee", 1], ["hare", 3]],
  [["bee", 1], ["heron", 1], ["duck", 1], ["otter", 2], ["butterfly", 1], ["firefly", 3]],
  [["butterfly", 2], ["hare", 2], ["otter", 1], ["bee", 1], ["heron", 3]],
  [["otter", 2], ["duck", 1], ["firefly", 1], ["bee", 1], ["butterfly", 1], ["heron", 2]],
  [["heron", 1], ["duck", 1], ["butterfly", 1], ["otter", 1], ["bee", 1], ["hare", 1]]
];
const coachNights = [15, 18, 20];
const coachFee = 18;
const referralGuests = ["otter", "hare", "heron", "duck", "firefly"];
const commissions = [
  { id: "creek", night: 2, name: "溪游双人单", guests: ["bee", "otter"], nights: 1, bonus: 8 },
  { id: "market", night: 9, name: "赶集双人单", guests: ["butterfly", "hare"], nights: 1, bonus: 8 },
  { id: "season-trip", night: 16, name: "溪湾周末双人单", guests: ["bee", "butterfly"], nights: 1, bonus: 8 },
  { id: "short-festival", night: 16, name: "溪畔旅伴 · 溪湾集会", guests: ["bee", "butterfly"], nights: 1, bonus: 14, partner: "short" },
  { id: "view-festival", night: 16, name: "观鸟协会 · 候鸟小团", guests: ["heron", "otter"], nights: 2, bonus: 18, partner: "view", view: true },
  { id: "flower-festival", night: 16, name: "花友双人单", guests: ["butterfly", "butterfly"], nights: 1, bonus: 16, flowerRooms: 2 },
  ...[4, 11].map(night => ({ id: `flower-${night}`, night, name: "窗边赏花双人单", guests: ["butterfly", "bee"], nights: 1, bonus: 9, flowerRooms: 1 })),
  ...[4, 11, 18].map(night => ({ id: `map-${night}`, night, name: "溪湾地图 · 水路双人单", guests: ["duck", "otter"], nights: 1, bonus: 8, map: true }))
];
const commissionById = new Map(commissions.map(commission => [commission.id, commission]));

function dateFor(night) {
  return { week: Math.floor(night / weekLength), date: night % weekLength + 1 };
}

function emptyTrail() {
  return { met: false, returnFrom: null, returnBooked: false, returned: false, birdFrom: null, birdBooked: false, birdDone: false, sachet: false, gifted: false };
}

function newBusiness(channels = [], season = 1) {
  return { restRoom: null, restStreak: 0, viewNights: 0, channels: channels.slice(), reservations: {}, season };
}

function upcomingCommissions(night, business, hospitality) {
  return commissions.filter(commission => {
    if (commission.night <= night || commission.night > night + 2) return false;
    if (business.reservations[commission.id] === "reserved") return true;
    if (commission.map) return hospitality?.showcase === "map";
    if (commission.flowerRooms) return business.channels.includes("flower")
      || Object.values(hospitality?.decor ?? {}).some(key => furnishings[key].flowers);
    if (commission.partner) return business.channels.includes(commission.partner);
    return commission.id !== "season-trip" || !business.channels.length;
  });
}

function commissionOrder(commission) {
  const order = themedOrder(commission.night, commission.id, commission.name,
    `两位客人都退房时，另付 ${commission.bonus} 叶币。`, commission.guests, commission.nights,
    { view: Boolean(commission.view), commission: true });
  if (commission.flowerRooms) for (const guest of order.guests.slice(0, commission.flowerRooms)) guest.needsFlower = true;
  return order;
}

function outstandingCommission(business, night) {
  return commissions.filter(commission => commission.night >= night && business.reservations[commission.id] === "reserved")
    .sort((left, right) => left.night - right.night)[0];
}

function stayUntil(rooms, nightsAhead) {
  return rooms.map(guest => guest?.nights > nightsAhead ? guest : null);
}

function canDressRoom(state) {
  return dressingOpen(state) && state.viewRoom === null && state.wallet >= lookOutCost;
}

function canBuildRestRoom(state) {
  return dressingOpen(state) && state.paid > 0 && state.business.restRoom === null && state.wallet >= restRoomCost;
}

function dressingOpen(state) {
  return state.night < orderCalendar.length - 1 && (roomActionsOpen(state) ||
    (state.phase === "receipt" && (!state.result.due || state.result.paid)));
}

function roomActionsOpen(state) {
  return ["planning", "arrivals", "day"].includes(state.phase);
}

function rentFor(week, floorOpen, rates = floorNightlyRates) {
  const start = week * weekLength;
  const end = start + weekLength - 1;
  return floorOpen.reduce((rent, firstNight, floor) => {
    const nights = Math.max(0, end - Math.max(start, firstNight) + 1);
    return rent + nights * (rates[floor] ?? floorNightlyRates[floor]);
  }, baseRent[week]);
}

function applicants(night) {
  return (orderCalendar[night] ?? []).map(([kind, nights], index) => ({
    kind, nights, id: `${night}-${index}`, arrived: night, renewed: false
  }));
}

function themedOrder(night, key, name, description, kinds, nights, { view = true, commission = false } = {}) {
  const id = `${night}-${key}`;
  const type = commission ? { commission: key } : { trip: key };
  return { id, name, description, themed: true, ...type,
    guests: kinds.map((kind, index) => ({
      id: `${id}-${index}`, kind, nights, arrived: night, renewed: false, ...type, needsView: view && index === 0
    }))
  };
}

function ordersFor(night, trail, { referral = false, heldButterfly = null, business = newBusiness(), floors = 1 } = {}) {
  const offers = applicants(night).map(guest => ({ id: guest.id, name: animals[guest.kind].name, guests: [guest] }));
  if (night < orderCalendar.length) {
    if (heldButterfly !== null) offers.unshift(extraOrder(night, "butterfly", heldButterfly, "橘蝶留单"));
    if (referral) offers.unshift(extraOrder(night, referralGuests[night % referralGuests.length], 1, "蜜蜂推荐"));
    if (night % 3 === 0 && business.channels.includes("short")) {
      offers.unshift(extraOrder(night, night % 2 === 0 ? "butterfly" : "bee", 1, partnerNames.short));
    }
    if (night % 4 === 0 && night < orderCalendar.length - 1 && business.channels.includes("view")) {
      const viewOrder = extraOrder(night, "otter", 2, partnerNames.view);
      viewOrder.guests[0].needsView = true;
      offers.unshift(viewOrder);
    }
    if (night % 4 === 0 && business.channels.includes("flower")) {
      const order = extraOrder(night, "butterfly", 1, partnerNames.flower);
      order.guests[0].needsFlower = true;
      offers.unshift(order);
    }
  }
  if (trail.returnFrom !== null && night >= trail.returnFrom && night <= orderCalendar.length - 2 && !trail.returnBooked) {
    offers.unshift(themedOrder(night, "return", "小青鸭的双人回访", "小青鸭带水獭朋友走一遍地图，想一起住两晚。", ["duck", "otter"], 2));
  }
  if (trail.birdFrom !== null && night >= trail.birdFrom && night < orderCalendar.length && !trail.birdBooked) {
    offers.unshift(themedOrder(night, "bird", "候鸟周 · 清晨观鸟", "小白鹭想在观景房等天亮。可以准备一份迎宾香包。", ["heron"], 1));
  }
  if (floors === maxFloors && coachNights.includes(night)) {
    offers.unshift(themedOrder(night, "coach", "溪湾旅行团", `三位客人同住一晚，退房再付 ${coachFee} 叶币包团费。`,
      ["duck", "bee", "butterfly"], 1, { view:false }));
  }
  const scheduled = outstandingCommission(business, night);
  if (scheduled?.night === night) offers.unshift(commissionOrder(scheduled));
  return offers;
}

function extraOrder(night, kind, nights, source) {
  const id = `${night}-${source}`;
  return { id, name: animals[kind].name, source, guests: [{ id, kind, nights, arrived: night, renewed: false }] };
}

function reservedGuests(orders, picks) {
  return orders.filter(order => picks.includes(order.id)).flatMap(order => order.guests);
}

function bookingRestriction(order, rooms, viewRoom, selected = [], hospitality) {
  const view = order.guests.some(guest => guest.needsView);
  if (view && viewRoom === null) return "先布置观景房";
  if (view && (rooms[viewRoom] || selected.some(guest => guest.needsView))) return "观景房已占用";
  if (order.guests.length + selected.length > rooms.filter(room => !room).length) return `需要 ${order.guests.length} 间空房`;
  const all = [...order.guests, ...selected];
  const flowerGuests = all.filter(guest => guest.needsFlower).length;
  if (flowerGuests) {
    const needsView = all.some(guest => guest.needsView);
    const freeFlowers = rooms.filter((guest,slot) => !guest && roomFurnishing(hospitality,slot)?.flowers && (!needsView || slot!==viewRoom)).length;
    if (freeFlowers < flowerGuests) return `需 ${flowerGuests} 间空花房`;
  }
  return "";
}

function allocation(rooms, arrivals, viewRoom = null, restRoom = null, hospitality, override) {
  const waiting = arrivals.slice();
  const next = rooms.slice();
  const reservedIndex = waiting.findIndex(guest => guest.needsView);
  if (reservedIndex >= 0 && viewRoom !== null && next[viewRoom] === null) {
    [next[viewRoom]] = waiting.splice(reservedIndex, 1);
  }
  while (waiting.some(guest => guest.needsFlower)) {
    const guestIndex = waiting.findIndex(guest => guest.needsFlower);
    const slot = next.findIndex((guest,index) => !guest && roomFurnishing(hospitality,index)?.flowers);
    if (slot < 0) break;
    [next[slot]] = waiting.splice(guestIndex, 1);
  }
  if (override && next[override.slot] === null) {
    const index = waiting.findIndex(guest => guest.id === override.id && !guest.needsView && !guest.needsFlower);
    if (index >= 0) [next[override.slot]] = waiting.splice(index,1);
  }
  if (viewRoom !== null && next[viewRoom] === null) {
    const otterIndex = waiting.findIndex(guest => guest.kind === "otter");
    if (otterIndex >= 0) [next[viewRoom]] = waiting.splice(otterIndex, 1);
  }
  if (restRoom !== null && next[restRoom] === null) {
    const short = waiting.filter(guest=>guest.nights===1);
    const score = guest=>lodgingScore(guest,restRoom,{hospitality,viewRoom});
    const candidate = short.find(guest=>score(guest)>0) ?? short.find(guest=>score(guest)>=0);
    const shortIndex = waiting.indexOf(candidate);
    if (shortIndex >= 0) [next[restRoom]] = waiting.splice(shortIndex, 1);
  }
  if (hospitality && Object.keys(hospitality.decor).length) {
    const state = { hospitality, viewRoom };
    waiting.sort((left,right) => Number(["heron","firefly"].includes(right.kind))-Number(["heron","firefly"].includes(left.kind)));
    for (const [index,guest] of waiting.entries()) {
      let bestSlot = -1;
      let bestScore = -Infinity;
      for (const [slot, occupant] of next.entries()) {
        if (occupant) continue;
        const neededByOthers = waiting.slice(index+1).some(person=>lodgingScore(person,slot,state)>0);
        const score = lodgingScore(guest,slot,state)*2 - Number(neededByOthers);
        if (score>bestScore) { bestSlot = slot; bestScore = score; }
      }
      if (bestSlot>=0) next[bestSlot]=guest;
    }
    return next;
  }
  return next.map(guest => guest ?? waiting.shift() ?? null);
}

function planNight(state, renewal = state.renewal) {
  const guests = state.rooms.filter(Boolean);
  const leaving = guests.filter(guest => guest.nights === 1 && guest.id !== renewal);
  const departed = new Set(leaving.map(guest => guest.id));
  const checkedIn = guests.filter(guest => guest.arrived === state.night);
  const kinds = new Set(guests.map(guest => guest.kind));
  const trail = { ...state.trail };
  const previous = state.business ?? newBusiness();
  const business = { ...previous, reservations: { ...previous.reservations }, channels: previous.channels.slice() };
  const highlights = [];
  const stories = [];
  const lines = [];
  const prepayments = checkedIn.filter(guest => guest.kind === "hare" && guest.nights > 1)
    .map(guest => {
      const nights = guest.nights - 1;
      return { kind: "hare", label: `灰兔预付后 ${nights} 晚房费`, coins: nights * animals.hare.rate };
    });
  const advanceCoins = prepayments.reduce((sum, payment) => sum + payment.coins, 0);
  const roomCoins = guests.reduce((sum, guest) => sum + (guest.prepaidNights > 0 ? 0 : animals[guest.kind].rate), advanceCoins);
  let coins = roomCoins;
  const award = (kind, label, amount) => {
    if (!amount) return;
    coins += amount;
    lines.push({ kind, label, amount: `${amount>0?"+":""}${amount} 叶币` });
  };
  const unlock = key => {
    if (business.channels.includes(key)) return;
    business.channels.push(key);
    highlights.push({ label: `${partnerNames[key]}开始合作` });
  };
  for (const guest of checkedIn) {
    if (guest.kind === "duck") award("duck", "小青鸭的入住小费", 4);
    if (guest.kind === "heron") award("heron", `小白鹭遇见 ${kinds.size - 1} 种其他动物`, Math.min(6, (kinds.size - 1) * 2));
  }
  if (state.rooms[state.viewRoom]?.kind === "otter") award("otter", "团尾水獭的观景房费", 2);
  const porters = state.rooms.filter((guest,slot) => guest?.kind === "firefly" && state.hospitality?.decor[slot] !== "curtain");
  let eligibleDepartures = 0;
  if (porters.length) {
    eligibleDepartures = leaving.filter(guest => porters.length > 1 || guest.id !== porters[0].id).length;
    award("firefly", `提灯萤的退房小费（${eligibleDepartures} 位）`, eligibleDepartures * 2);
  }
  if (leaving.filter(guest => guest.trip === "coach").length === 3) award("", "溪湾旅行团包团费", coachFee);
  const restGuest = state.rooms[business.restRoom];
  const shortStay = restGuest && restGuest.arrived === state.night && departed.has(restGuest.id);
  business.restStreak = shortStay ? business.restStreak + 1 : 0;
  if (business.restStreak === 2) {
    business.restStreak = 0;
    award("", "歇脚房 · 连续两晚接待短住客", restRoomBonus);
    highlights.push({ label: "歇脚房周转奖励", amount: restRoomBonus });
    unlock("short");
  }
  const viewGuest = state.rooms[state.viewRoom];
  if (viewGuest?.kind === "otter" || viewGuest?.kind === "heron") {
    business.viewNights = Math.min(2, business.viewNights + 1);
    if (business.viewNights === 2) unlock("view");
  }
  const completed = commissionById.get(leaving.find(guest => guest.commission)?.commission);
  const contractState = completed && business.reservations[completed.id];
  let finishedBirdCommission = false;
  if ((contractState === "reserved" || contractState === "staying")
      && leaving.filter(guest => guest.commission === completed.id).length === completed.guests.length) {
    business.reservations[completed.id] = "done";
    award(completed.guests[0], `${completed.name} · 委托谢礼`, completed.bonus);
    highlights.push({ label: `${completed.name}完成`, amount: completed.bonus });
    if (completed.flowerRooms) unlock("flower");
    else if (!completed.view) unlock("short");
    finishedBirdCommission = Boolean(completed.view);
  }

  const mapMakers = new Set(guests.filter(guest => guest.kind === "duck" && !guest.trip && (guest.hasMap || kinds.has("otter"))).map(guest => guest.id));
  if (mapMakers.size && !trail.met) {
    trail.met = true;
    stories.push({ kind: "duck", title: "地图画好了", detail: "水獭指了几条沿溪的小路，小青鸭把它们画进了地图。" });
  }
  if (trail.returnFrom === null && leaving.some(guest => mapMakers.has(guest.id))) {
    trail.returnFrom = Math.max(weekLength, state.night + 1);
    const inSeason = trail.returnFrom <= orderCalendar.length - 2;
    stories.push({ kind: "duck", title: "收到一张双人回访单", detail: inSeason
      ? `${nightText(trail.returnFrom)}起可接，入住需要 2 间空房，其中 1 间是观景房。`
      : "小青鸭约了朋友下季再来。" });
  }
  if (!trail.returned && leaving.some(guest => guest.trip === "return")
      && !guests.some(guest => guest.trip === "return" && !departed.has(guest.id))) {
    trail.returned = true;
    trail.birdFrom = Math.max(2 * weekLength, state.night + 1);
    award("duck", "双人回访谢礼", 12);
    stories.push({ kind: "otter", title: "沿着地图回到旅馆", detail: trail.birdFrom < orderCalendar.length
      ? `${nightText(trail.birdFrom)}起，小白鹭会在手机发来候鸟周委托。` : "旅客手账记下了两位熟客的回访。" });
  }
  if (!trail.birdDone && leaving.some(guest => guest.trip === "bird")) {
    finishedBirdCommission = true;
    trail.birdDone = true;
    trail.gifted = trail.sachet;
    award("heron", "候鸟周委托酬谢", 10);
    if (trail.gifted) award("heron", "小白鹭的香包回礼", 4);
    stories.push({ kind: "heron", title: "小白鹭的清晨", detail: trail.gifted
      ? "小白鹭带着香包离开，给旅馆留下一张亲手画的候鸟明信片。"
      : "小白鹭看见了第一只候鸟，给旅馆留下一张明信片。" });
  }
  const { hospitality, effects } = hospitalityEffects(state, departed, eligibleDepartures, finishedBirdCommission);
  for (const effect of effects) {
    if (effect.coins) award(effect.kind, effect.label, effect.coins);
    else if (effect.buds) lines.push({ kind:effect.kind, label:effect.label, amount:`+${effect.buds} 花芽`, resource:"bud" });
    else lines.push({ kind:effect.kind, label:effect.label });
  }
  const nextRooms = state.rooms.map(guest => {
    if (!guest || departed.has(guest.id)) return null;
    const staying = { ...guest, hasMap: guest.hasMap || mapMakers.has(guest.id),
      nights: guest.id === renewal ? guest.nights : guest.nights - 1,
      renewed: guest.renewed || guest.id === renewal };
    if (guest.kind === "hare") {
      staying.prepaidNights = guest.arrived === state.night ? guest.nights - 1 : Math.max(0, (guest.prepaidNights ?? 0) - 1);
    }
    return staying;
  });
  const referral = state.night < orderCalendar.length - 1 && leaving.some(guest => guest.kind === "bee");
  return { roomCoins, coins, lines, leaving, nextRooms, trail, business, hospitality, effects, highlights, stories, referral, prepayments };
}

function newNight(previous, night) {
  const floorOpen = previous?.floorOpen ?? [0];
  const { week } = dateFor(night);
  return {
    night, floorOpen, floorRates: previous?.floorRates ?? [0], floors: floorOpen.length, rent: rentFor(week, floorOpen, previous?.floorRates), paid: previous?.paid ?? 0,
    wallet: previous?.wallet ?? openingWallet, trail: previous?.trail ?? emptyTrail(), viewRoom: previous?.viewRoom ?? null,
    business: previous?.business ?? newBusiness(),
    hospitality: previous?.hospitality ?? newHospitality(), roomChoice: previous?.roomChoice ?? null,
    rooms: previous?.result?.nextRooms ?? Array(floorOpen.length * roomsPerFloor).fill(null),
    referral: previous?.result?.referral ?? false, heldButterfly: previous?.carryButterfly ?? null,
    carryButterfly: null, queue: [], renewal: null, picks: [], phase: "planning", result: null
  };
}

function canRenew(guest, state) {
  return state.night < orderCalendar.length - 1 && state.phase === "day" && !guest.renewed && !guest.commission && guest.trip !== "coach" && guest.nights === 1;
}

function nightText(night) {
  const { week, date } = dateFor(night);
  return `第 ${week + 1} 周 · 第 ${date} 晚`;
}

const byId = id => document.getElementById(id);
const storageKey = "creek-inn-return-season-v2";
const floorNames = ["一楼", "二楼", "三楼"];
const art = name => `./assets/cutaway/${name}`;
const dialog = id => byId(id);
const create = (tag, className = "", label = "") => {
  const element = document.createElement(tag);
  element.className = className;
  if (label) element.textContent = label;
  return element;
};
const resourceIcons = {
  coin: { className: "leaf-coin", label: "叶币" },
  bud: { className: "flower-bud", label: "花芽" }
};
function valueWithIcon(amount, type = "coin", withLabel = true) {
  const { className, label } = resourceIcons[type];
  const value = create("span", `resource-value ${type}`);
  const icon = create("i", className);
  icon.setAttribute("aria-hidden", "true");
  value.append(icon, document.createTextNode(amount + (withLabel ? ` ${label}` : "")));
  return value;
}

function fillRules(list, rules) {
  const rows = rules.map(({ trigger, text, amount, limit }) => {
    const row = create("li", amount ? "paid-rule" : "");
    row.append(create("b", "rule-trigger", trigger), create("span", "rule-text", text));
    if (amount) {
      const value = create("span", "rule-payout");
      value.append(valueWithIcon(amount, "coin", false));
      if (limit) value.append(create("small", "", limit));
      row.append(value);
    }
    return row;
  });
  list.replaceChildren(...rows);
}

const show = id => { if (!dialog(id).open) dialog(id).showModal(); };
const floorViews = [];
let activeGuest = null;
let orderContext = "";
let orderViews = [];
let toastTimer;
let game;
let checkpoint;
let pendingBuildScroll = false;

function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ game, checkpoint }));
  } catch {
    // Gameplay remains available when local storage is disabled.
  }
}

function restore() {
  try {
    const data = JSON.parse(localStorage.getItem(storageKey));
    if (data?.game?.rooms?.length && data?.checkpoint?.rooms?.length && orderCalendar[data.game.night]) return data;
  } catch {
    // Start a new game if the saved game cannot be read.
  }
  return null;
}

function start(channels = [], season = 1, hospitality = newHospitality()) {
  game = newNight(null, 0);
  game.business = newBusiness(channels, season);
  game.hospitality = hospitality;
  checkpoint = structuredClone(game);
  activeGuest = null;
  pendingBuildScroll = false;
  save();
  render();
  window.scrollTo(0, 0);
}

function notify(message) {
  clearTimeout(toastTimer);
  const toast = byId("toast");
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, 2200);
}

function makeSprite(kind, className = "animal") {
  const sprite = create("img", className);
  sprite.src = art(`${kind}.png`);
  sprite.alt = "";
  sprite.draggable = false;
  return sprite;
}

function animatedGuest(kind) {
  const stage = create("span", "animal-stage");
  stage.dataset.kind = kind;
  stage.setAttribute("aria-hidden", "true");
  stage.classList.toggle("flyer", kind === "bee" || kind === "butterfly");
  const track = create("span", "pet-track");
  const turn = create("span", "pet-turn");
  const idle = create("span", "pet-idle");
  idle.append(makeSprite(kind, "pet-pose"));
  turn.append(idle, kind === "duck" || kind === "heron" ? birdGait(kind) : walkingFrames(kind));
  track.append(create("span", "pet-shadow"), turn);
  stage.append(track);
  wanderRoom(stage, track, turn);
  return stage;
}

function walkingFrames(kind) {
  const walk = create("span", "pet-walk");
  for (const frame of ["a", "b"]) {
    const drawing = makeSprite(kind, `pet-pose pose-${frame}`);
    drawing.src = art(`${kind}-walk-${frame}.png`);
    walk.append(drawing);
  }
  return walk;
}

function birdGait(kind) {
  const walk = create("span", `pet-walk bird-gait ${kind}-gait`);
  const torso = create("img", "bird-torso");
  torso.src = art(`${kind}-torso.png`);
  torso.alt = "";
  torso.draggable = false;
  const legs = ["far", "near"].map(side => {
    const leg = create("span", `bird-leg ${side}`);
    leg.append(create("span", "bird-shin"), create("span", "bird-foot"));
    return leg;
  });
  walk.append(...legs, torso);
  return walk;
}

function wanderRoom(stage, track, turn) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduced.matches || !track.animate) return;
  let x = 9 + Math.random() * 22;
  const position = horizontal => `translateX(${horizontal}%)`;
  track.style.transform = position(x);
  function move() {
    if (!stage.isConnected) return;
    if (reduced.matches) {
      window.setTimeout(move, 1600);
      return;
    }
    const target = x < 20 ? 24 + Math.random() * 16 : Math.random() * 16;
    const facing = target > x ? "east" : "west";
    turn.dataset.facing = facing;
    stage.classList.add("walking");
    const animation = track.animate([
      { transform: position(x) }, { transform: position(target) }
    ], { duration: 520 + Math.abs(target - x) * 34, easing: "ease-in-out", fill: "forwards" });
    animation.finished.then(() => {
      x = target;
      track.style.transform = position(x);
      animation.cancel();
      stage.classList.remove("walking");
      if (stage.isConnected) window.setTimeout(move, 900 + Math.random() * 2000);
    }).catch(() => stage.classList.remove("walking"));
  }
  window.setTimeout(move, 350 + Math.random() * 1900);
}

function select(guest) {
  activeGuest = activeGuest === guest.id ? null : guest.id;
  render();
}

function venueFloor(index) {
  const section = create("section", "floor");
  if (index === 0) section.classList.add("ground-floor");
  section.setAttribute("aria-label", floorNames[index]);
  const artLayer = create("img", "floor-art");
  artLayer.src = art(index === 0 ? "lower.jpg" : "upper.jpg");
  artLayer.alt = "";
  artLayer.draggable = false;
  const tag = create("span", "floor-tag");
  const count = create("b", "", "");
  tag.append(document.createTextNode(floorNames[index]), count);
  const rooms = create("div", "floor-rooms");
  const views = Array.from({ length: roomsPerFloor }, (_, column) => {
    const slot = index * roomsPerFloor + column;
    const button = create("button", "room");
    button.type = "button";
    button.addEventListener("click", () => {
      const guest = game.rooms[slot];
      if (guest) select(guest);
    });
    const badge = create("span", "badge");
    const wish = create("span", "wish");
    const windowView = create("span", "room-window");
    windowView.setAttribute("aria-hidden", "true");
    const viewTag = create("span", "view-tag", "观景");
    const restTag = create("span", "rest-tag", "歇脚");
    const decor = create("i", "room-decoration");
    const reward = create("span", "room-reward");
    reward.setAttribute("aria-hidden", "true");
    windowView.hidden = viewTag.hidden = restTag.hidden = badge.hidden = wish.hidden = decor.hidden = reward.hidden = true;
    button.append(windowView, viewTag, restTag, badge, wish, decor, reward);
    rooms.append(button);
    return { slot, button, badge, wish, viewTag, restTag, windowView, decor, reward, image: null, guestId: null };
  });
  section.append(artLayer, tag, rooms);
  byId("floors").prepend(section);
  return { count, views, section };
}

function renderRooms() {
  while (floorViews.length > game.floors) floorViews.pop().section.remove();
  while (floorViews.length < game.floors) floorViews.push(venueFloor(floorViews.length));
  for (const [floor, view] of floorViews.entries()) {
    let leaves = 0;
    for (const room of view.views) {
      const { slot, button, badge, wish, viewTag, restTag, windowView, decor } = room;
      const guest = game.rooms[slot];
      const chosen = guest && guest.id === activeGuest;
      const renewed = guest && guest.id === game.renewal;
      const leaving = guest?.nights === 1 && !renewed && (game.phase === "day" || game.phase === "arrivals");
      if (leaving) leaves += 1;
      button.disabled = !guest;
      button.setAttribute("aria-pressed", String(Boolean(chosen)));
      windowView.hidden = viewTag.hidden = game.viewRoom !== slot;
      restTag.hidden = game.business.restRoom !== slot;
      restTag.textContent = game.business.restStreak && game.business.restRoom === slot ? "歇脚 1/2" : "歇脚";
      button.classList.toggle("view-room", !viewTag.hidden);
      button.classList.toggle("rest-room", !restTag.hidden);
      const item = roomFurnishing(game.hospitality,slot);
      decor.hidden = !item;
      decor.className = item ? `room-decoration furniture-icon furniture-${item.icon}` : "room-decoration";
      const label = roomName(slot) + (!viewTag.hidden ? "观景房" : !restTag.hidden ? "歇脚房" : "") + (item ? ` · ${item.name}` : "");
      button.setAttribute("aria-label", guest ? `${animals[guest.kind].name}，${label}，${renewed ? "已续住" : `剩 ${guest.nights} 晚`}` : `${label}，空房`);
      if ((guest?.id ?? null) !== room.guestId) {
        room.image?.remove();
        room.image = guest ? animatedGuest(guest.kind) : null;
        room.guestId = guest?.id ?? null;
        if (room.image) button.prepend(room.image);
      }
      badge.hidden = !guest;
      badge.classList.toggle("leaving", Boolean(leaving));
      badge.classList.toggle("renewed", Boolean(renewed));
      badge.textContent = renewed ? "已续住" : leaving ? "今晚退房" : guest ? `${guest.nights} 晚` : "";
      const hook = guest && guestHook(guest);
      wish.hidden = !chosen || !hook;
      wish.textContent = chosen && hook ? hook : "";
    }
    view.count.textContent = leaves ? `退房 ${leaves}` : "";
    view.count.hidden = !leaves;
  }
}

function renderQueue() {
  const visibleQueue = game.queue.map(guest => {
    const button = create("button", "waiter");
    button.type = "button";
    button.setAttribute("aria-label", `${animals[guest.kind].name}，等候入住`);
    button.setAttribute("aria-pressed", String(guest.id === activeGuest));
    const hook = guestHook(guest);
    const wish = create("span", "wish", hook);
    wish.hidden = guest.id !== activeGuest || !hook;
    button.append(makeSprite(guest.kind), create("span", "queue-name", animals[guest.kind].name), wish);
    button.addEventListener("click", () => select(guest));
    return button;
  });
  byId("queue").replaceChildren(...visibleQueue);
}

function roomName(slot) {
  return `${floorNames[Math.floor(slot / roomsPerFloor)]}第 ${slot % roomsPerFloor + 1} 间`;
}

function guestHook(guest) {
  return guest.trip === "return" ? "沿地图回访" : guest.trip === "bird" ? "来等清晨的候鸟"
    : guest.hasMap ? "地图已经画好" : animals[guest.kind].hook;
}

function guestRules(guest) {
  if (guest.kind === "hare") {
    if (guest.prepaidNights > 0) return [{ trigger: "已预付", text: `剩下 ${guest.prepaidNights} 晚房费已付清` }];
    return [{ trigger: "入住时", text: `一次付清 ${guest.nights} 晚房费`, amount: String(guest.nights * animals.hare.rate) }];
  }
  const rules = animals[guest.kind].rules ?? [];
  if (guest.trip === "return") return [
    { trigger: "双人退房", text: "两位都退房时给一份谢礼", amount: "+12" },
    ...rules.filter(rule => rule.amount)
  ];
  if (guest.trip === "bird") return [
    { trigger: "退房时", text: "观鸟委托酬谢", amount: "+10" },
    { trigger: "退房时", text: "送一份迎宾香包，额外回礼", amount: "+4" },
    ...rules
  ];
  return rules;
}

function guestNames(rooms) {
  const names = rooms.filter(Boolean).map(guest => animals[guest.kind].name);
  return names.length > 4 ? `${names.slice(0, 4).join("、")} 等 ${names.length} 位` : names.join("、");
}

function renderRenewForecast(guest) {
  const release = planNight(game, null);
  const keep = planNight(game, guest.id);
  const difference = keep.coins - release.coins;
  const effect = byId("renewEffect");
  effect.textContent = difference === 0 ? "两种安排今晚收入相同。"
    : `续住后今晚${difference > 0 ? "多收" : "少收"} `;
  if (difference) effect.append(valueWithIcon(Math.abs(difference)), document.createTextNode("。"));
  const tomorrow = game.night + 1;
  const forecast = byId("renewForecast");
  forecast.replaceChildren(...[["按时退房", release], ["留住一晚", keep]].map(([label, plan]) => {
    const row = create("section", "renew-choice");
    const free = plan.nextRooms.filter(room => !room).length;
    const remaining = guestNames(plan.nextRooms);
    row.append(create("strong", "", `${label} · 明晚空 ${free} 间`),
      create("p", "", remaining ? `留宿 ${remaining}` : "明晚无人留宿"));
    return row;
  }));
  const blocked = ordersFor(tomorrow, game.trail, game).find(order =>
    order.themed && !bookingRestriction(order, release.nextRooms, game.viewRoom, [], game.hospitality)
      && bookingRestriction(order, keep.nextRooms, game.viewRoom, [], game.hospitality));
  if (blocked) forecast.append(create("p", "forecast-warn", `续住会让「${blocked.name}」明晚接不下。`));
  const upcoming = outstandingCommission(game.business, tomorrow);
  if (upcoming?.night > tomorrow) {
    const ahead = upcoming.night - tomorrow;
    const order = commissionOrder(upcoming);
    if (!bookingRestriction(order, stayUntil(release.nextRooms, ahead), game.viewRoom, [], game.hospitality)
        && bookingRestriction(order, stayUntil(keep.nextRooms, ahead), game.viewRoom, [], game.hospitality)) {
      forecast.append(create("p", "forecast-warn", `续住会占用「${upcoming.name}」需要的客房。`));
    }
  }
  if (release.referral && !keep.referral) {
    forecast.append(create("p", "forecast-warn", "蜜蜂续住，明晚会少一张推荐订单。"));
  }
}

function renderGuestCard() {
  const guest = game.rooms.find(guest => guest?.id === activeGuest) ?? game.queue.find(guest => guest.id === activeGuest);
  byId("guestCard").hidden = !guest;
  if (!guest) return;
  const species = animals[guest.kind];
  const waiting = game.queue.some(waiter => waiter.id === activeGuest);
  byId("guestName").textContent = species.name;
  byId("guestStay").replaceChildren(valueWithIcon(species.rate), document.createTextNode(` / 晚 · ${waiting ? "预订" : "还住"} ${guest.nights} 晚`));
  const rules = guestRules(guest);
  byId("guestRules").hidden = !rules.length;
  fillRules(byId("guestRules"), rules);
  const currentEffects = byId("guestLodging");
  const slot = game.rooms.indexOf(guest);
  const item = roomFurnishing(game.hospitality,slot);
  currentEffects.hidden = !item;
  if (item) {
    const review = lodgingMemory(guest,slot,game,0);
    currentEffects.textContent = `${item.name} · ${review.mood==="fine" ? "适合普通入住" : review.detail.replace("上次","")}`;
  }
  const renewed = game.renewal === guest.id;
  const eligible = !waiting && canRenew(guest, game);
  byId("renew").hidden = !eligible;
  byId("renew").textContent = renewed ? "取消续住" : "续住一晚";
  byId("renewEffect").hidden = !eligible && !guest.renewed && !guest.commission;
  byId("renewForecast").hidden = !eligible;
  if (eligible) renderRenewForecast(guest);
  else if (guest.renewed) byId("renewEffect").textContent = "这位客人已经续过住。";
  else if (guest.commission) byId("renewEffect").textContent = "这张双人单的退房日期已提前约好。";
}

function render() {
  const { week, date } = dateFor(game.night);
  const preview = game.result ?? planNight(game);
  const facingRent = game.paid > week;
  byId("day").textContent = nightText(game.night);
  byId("wallet").textContent = game.wallet;
  const rentLabel = byId("rent");
  rentLabel.replaceChildren(document.createTextNode(facingRent ? "本周已付 " : date === weekLength ? "今晚收租 " : "欠租 "),
    valueWithIcon(game.rent, "coin", false));
  if (!facingRent && date !== weekLength) rentLabel.append(document.createTextNode(` · 还剩 ${weekLength + 1 - date} 晚`));
  byId("rent").classList.toggle("urgent", !facingRent && date === weekLength);
  const guests = game.rooms.filter(Boolean).length;
  byId("guests").textContent = `${guests} / ${game.rooms.length} 间入住`;
  const projections = game.wallet + (game.result ? 0 : preview.coins);
  const progress = byId("rentProgress");
  const percent = facingRent ? 100 : Math.min(100, Math.trunc(projections / game.rent * 100));
  progress.setAttribute("aria-valuenow", percent);
  progress.firstElementChild.style.width = `${percent}%`;
  progress.classList.toggle("met", percent === 100);
  byId("leaving").textContent = game.phase === "planning" ? "手机开始接单" : game.phase === "arrivals" ? `门口等候 ${game.queue.length} 位`
    : game.night === orderCalendar.length - 1 ? "开店季最后一晚" : `明晚空出 ${preview.nextRooms.filter(room => !room).length} 间`;
  const trailPrompt = byId("trailPrompt");
  trailPrompt.textContent = journalPrompt(game.trail);
  trailPrompt.hidden = !trailPrompt.textContent;
  const appointment = outstandingCommission(game.business, game.night + 1);
  const appointmentPrompt = byId("appointmentPrompt");
  appointmentPrompt.hidden = !appointment || ["failed", "won"].includes(game.phase);
  if (!appointmentPrompt.hidden) {
    const future = stayUntil(preview.nextRooms, appointment.night - game.night - 1);
    const free = future.filter(room => !room).length;
    appointmentPrompt.textContent = `双人预约 · 需 2 间 / 预计空 ${free} 间`;
  }
  const visitor = game.hospitality.todayVisit;
  const visitToday = byId("visitToday");
  visitToday.hidden = !visitor || !roomActionsOpen(game);
  if (visitor) visitToday.textContent = `${animals[visitor.kind].name}来小屋做客`;
  const lobby = byId("lobbyDisplay");
  const display = furnishings[game.hospitality.showcase];
  lobby.hidden = !display;
  if (display) lobby.replaceChildren(furnitureIcon(display.icon),create("span","",display.name));
  byId("settleText").textContent = ({ planning: "接今晚的单", arrivals: "客人入住中", receipt: "查看今晚账单", bookings: "查看明晚订单", failed: "查看欠租账单", won: "查看通关账单" })[game.phase] ?? "结算今晚";
  const expected = byId("expected");
  expected.hidden = game.phase !== "day";
  expected.replaceChildren(document.createTextNode("预计 "), valueWithIcon(`+${preview.coins}`));
  byId("expandButton").hidden = game.floors === maxFloors || game.paid < game.floors || game.night >= orderCalendar.length - 1 || ["failed", "won"].includes(game.phase);
  byId("expandButton").textContent = `加盖${floorNames[game.floors] ?? ""}`;
  renderRooms();
  renderQueue();
  renderGuestCard();
}

function storyCard({ kind, title, detail, status }) {
  const card = create("li", `journal-page${status === "已记录" ? " recorded" : ""}`);
  const content = create("div");
  content.append(create("strong", "", title), create("p", "", detail));
  card.append(kind ? makeSprite(kind, "journal-avatar") : create("span", "view-icon"), content);
  if (status) card.append(create("small", "journal-status", status));
  return card;
}

function journalPrompt(trail) {
  if (trail.birdDone) return "候鸟明信片已收录";
  if (trail.birdBooked) return "候鸟周客人已预约";
  if (trail.returned) return "候鸟周观鸟委托";
  if (trail.returnBooked) return "双人回访进行中";
  if (trail.returnFrom !== null) return "收到双人回访单";
  return trail.met ? "溪湾地图画好了" : "";
}

function canMakeSachet(state) {
  return roomActionsOpen(state) && state.trail.birdFrom !== null && state.night >= state.trail.birdFrom
    && !state.trail.sachet && !state.trail.birdDone;
}

function renderJournal() {
  const trail = game.trail;
  const room = game.viewRoom;
  const entries = [];
  const { channels, reservations, viewNights, restStreak, season } = game.business;
  const total = Object.values(reservations).filter(status => status === "done").length;
  const missed = Object.values(reservations).filter(status => status === "missed").length;
  byId("commissionRecord").textContent = `第 ${season} 季 · 完成 ${total} 张双人委托${missed ? ` · 错过 ${missed} 张` : ""}`;
  byId("partnerList").replaceChildren(...Object.entries(partnerNames).map(([key, name]) => {
    const row = create("li", channels.includes(key) ? "partner-active" : "");
    const descriptions = key === "short"
      ? ["会带来额外短住单，并邀请你接待溪湾集会。", `完成溪游或赶集双人单，或在歇脚房连续接待两晚短住客（${restStreak}/2）。`]
      : key === "view" ? ["会带来需要观景房的长住单，以及候鸟小团。", `让水獭或小白鹭住进观景房两晚（${viewNights}/2）。`]
        : ["会持续带来喜欢花房的短住客。", "摆一间花房，接待赏花双人单。第三周的花友聚会需要两间花房。"];
    row.append(create("strong", "", name), create("span", "", channels.includes(key) ? "合作中" : "待合作"),
      create("p", "", descriptions[channels.includes(key) ? 0 : 1]));
    return row;
  }));
  if (trail.met) entries.push({ kind: "duck", title: "一起画溪湾地图", status: "已记录",
    detail: "水獭把清晨最好走的水路指给了小青鸭。" });
  if (room !== null) entries.push({ kind: "", title: "窗边的观景房", status: "已记录",
    detail: `${roomName(room)}已布置，打开窗就能看到溪湾。` });
  if (trail.returnFrom !== null) {
    entries.push({ kind: "otter", title: "带朋友再走一遍", status: trail.returned ? "已记录" : trail.returnBooked ? "入住中" : "待接单",
      detail: trail.returned ? "两位客人沿着画好的地图回来，一起住进了旅馆。" :
        trail.returnFrom <= orderCalendar.length - 2
          ? `${nightText(trail.returnFrom)}起，手机可接双人回访。需两间空房，其中一间是观景房。`
          : "小青鸭想把双人回访约在下一季。" });
  }
  if (trail.birdFrom !== null) {
    entries.push({ kind: "heron", title: "候鸟周的清晨", status: trail.birdDone ? "已记录" : trail.birdBooked ? "已预约" : "待接单",
      detail: trail.birdDone ? (trail.gifted ? "小白鹭带着香包离开，给旅馆留下一张亲手画的候鸟明信片。" : "小白鹭给旅馆留下一张清晨观鸟的明信片。")
        : trail.birdFrom < orderCalendar.length
          ? `${nightText(trail.birdFrom)}起可接小白鹭的观鸟委托。需要一间空的观景房。`
          : "小白鹭打算下季再来观鸟。" });
  }
  const pages = byId("journalPages");
  pages.replaceChildren(...entries.map(storyCard));
  pages.hidden = !entries.length;
  byId("journalEmpty").hidden = entries.length > 0;
  const themed = trail.birdFrom !== null && trail.birdFrom < orderCalendar.length && game.night >= trail.birdFrom;
  byId("birdGift").hidden = !themed;
  byId("birdGiftNote").textContent = trail.gifted ? "香包已经送给了小白鹭。" :
    trail.birdDone ? "候鸟周委托已完成。" : trail.sachet ? "香包已备好，小白鹭退房时会收到。" : "候鸟周送来一枝香草，可以给小白鹭缝一份迎宾香包。";
  byId("makeSachet").hidden = trail.sachet || trail.birdDone;
  byId("makeSachet").disabled = !canMakeSachet(game);
}

function openJournal() {
  renderJournal();
  show("journal");
}

function makeSachet() {
  if (!canMakeSachet(game)) return;
  game.trail = { ...game.trail, sachet: true };
  save();
  renderJournal();
}

function greet() {
  if (game.phase !== "arrivals") return;
  const count = game.queue.length;
  game.rooms = allocation(game.rooms, game.queue, game.viewRoom, game.business.restRoom, game.hospitality, game.roomChoice);
  game.roomChoice = null;
  game.queue = [];
  game.phase = "day";
  save();
  render();
  notify(`${count} 位客人入住。`);
}

function scheduleArrival() {
  if (game.phase !== "arrivals") return;
  const arrival = game;
  window.setTimeout(() => { if (game === arrival) greet(); }, 420);
}

function toggleRenewal() {
  const guest = game.rooms.find(guest => guest?.id === activeGuest);
  if (!guest || !canRenew(guest, game)) return;
  game.renewal = game.renewal === guest.id ? null : guest.id;
  save();
  render();
}

function buildStatus() {
  const { week } = dateFor(game.night);
  const firstNight = game.phase === "planning" ? game.night : game.night + 1;
  const cost = buildCosts[game.floors - 1];
  const maxed = game.floors >= maxFloors;
  const unlocked = game.paid >= game.floors;
  const halted = firstNight >= orderCalendar.length || !(roomActionsOpen(game) || (game.phase === "receipt" && game.result.paid));
  const floorOpen = [...game.floorOpen, firstNight];
  return { firstNight, cost, maxed, halted, unlocked, floorOpen,
    weeklyIncrease: rentFor(week, floorOpen, game.floorRates) - game.rent,
    ready: !maxed && !halted && unlocked && game.wallet >= cost };
}

function roomThumbnail(slot, guest) {
  const frame = create("span", "room-thumb");
  frame.setAttribute("aria-hidden", "true");
  frame.style.backgroundPosition = `${(slot % roomsPerFloor) * 100 / (roomsPerFloor - 1)}% ${slot < roomsPerFloor ? 0 : 100}%`;
  const special = slot === game.viewRoom ? "观景" : slot === game.business.restRoom ? "歇脚" : "";
  if (special) frame.append(create("span", "room-thumb-type", special));
  const item = roomFurnishing(game.hospitality, slot);
  if (item) frame.append(furnitureIcon(item.icon));
  if (guest) {
    const sprite = makeSprite(guest.kind, "room-thumb-guest");
    if (guest.kind === "bee" || guest.kind === "butterfly") sprite.classList.add("airborne");
    frame.append(sprite);
  }
  return frame;
}

function drawRoomChoices(host, rooms, slots, selected, period, onChoose) {
  const groups = [];
  for (let floor = Math.ceil(rooms.length / roomsPerFloor) - 1; floor >= 0; floor--) {
    const group = create("div", "room-choice-floor");
    const heading = create("div", "room-choice-head");
    heading.append(create("strong", "", floorNames[floor]), create("small", "", period));
    const row = create("div", "room-choice-row");
    for (let slot = floor * roomsPerFloor; slot < Math.min(rooms.length, (floor + 1) * roomsPerFloor); slot++) {
      const guest = rooms[slot];
      const occupant = guest ? animals[guest.kind].name : "空房";
      const special = slot === game.viewRoom ? "观景房" : slot === game.business.restRoom ? "歇脚房" : "";
      const item = roomFurnishing(game.hospitality, slot);
      const card = create("label", "room-choice");
      const input = create("input");
      input.type = "radio";
      input.name = host.id;
      input.value = slot;
      input.checked = slot === selected;
      input.disabled = !slots.includes(slot);
      const name = [roomName(slot), period, occupant, special, item?.name].filter(Boolean).join(" · ");
      input.setAttribute("aria-label", name);
      card.title = input.disabled ? `${name} · 此处不可选` : name;
      input.addEventListener("change", () => onChoose?.(slot));
      const image = roomThumbnail(slot, guest);
      image.append(create("span", "room-thumb-number", String(slot % roomsPerFloor + 1)));
      card.append(input, image, create("span", "room-choice-caption", occupant));
      row.append(card);
    }
    group.append(heading, row);
    groups.push(group);
  }
  host.replaceChildren(...groups);
}

function fillRoomPicker(id, excluded) {
  const picker = byId(id);
  const rooms = game.result?.nextRooms ?? game.rooms;
  const slots = rooms.flatMap((_, slot) => slot === excluded ? [] : [slot]);
  const previous = dialog("build").open ? picker.querySelector("input:checked") : null;
  const selected = previous && slots.includes(Number(previous.value)) ? Number(previous.value)
    : slots.find(slot => !rooms[slot]) ?? slots[0];
  drawRoomChoices(picker, rooms, slots, selected, game.result ? "明晚" : "今晚");
}

function openBuild() {
  const { firstNight, cost, maxed, halted, unlocked, ready, weeklyIncrease } = buildStatus();
  const { week } = dateFor(game.night);
  const existing = game.viewRoom;
  byId("viewRoomStatus").textContent = existing === null
    ? "给客房添一扇窗。让水獭或小白鹭在这里住两晚，可获得观鸟协会的客源。" : `${roomName(existing)}已经布置成观景房。`;
  byId("viewRoomPicker").hidden = existing !== null;
  if (existing === null) fillRoomPicker("viewRoomSelect", game.business.restRoom);
  byId("viewRoomConfirm").hidden = existing !== null;
  byId("viewRoomConfirm").disabled = !canDressRoom(game);
  byId("viewRoomConfirm").textContent = game.wallet < lookOutCost
    ? `还差 ${lookOutCost - game.wallet} 叶币` : `花 ${lookOutCost} 叶币布置`;

  const { restRoom } = game.business;
  byId("restRoomStatus").textContent = restRoom === null
    ? `优先接待只住一晚的客人。连续两晚做到入住当晚退房，奖励 ${restRoomBonus} 叶币。`
    : `${roomName(restRoom)}已布置 · 连续短住 ${game.business.restStreak}/2 晚`;
  byId("restRoomPicker").hidden = restRoom !== null || !game.paid;
  if (!byId("restRoomPicker").hidden) fillRoomPicker("restRoomSelect", existing);
  byId("restRoomConfirm").hidden = restRoom !== null;
  byId("restRoomConfirm").disabled = !canBuildRestRoom(game);
  byId("restRoomConfirm").textContent = !game.paid ? "付清第一周房租后解锁"
    : game.wallet < restRoomCost ? `还差 ${restRoomCost - game.wallet} 叶币` : `花 ${restRoomCost} 叶币布置歇脚房`;

  byId("buildFloors").textContent = maxed ? `三层 · 共 ${game.rooms.length} 间客房` : `加盖${floorNames[game.floors]} · +4 间客房`;
  const rule = byId("buildRule");
  rule.textContent = maxed ? "本季开放到三楼。" : halted ? "本季已结束扩建。" :
    unlocked ? "扩建费 " : "交清一周房租后可以加盖下一层。";
  if (!maxed && !halted && unlocked) rule.append(valueWithIcon(cost));
  const rent = byId("buildRent");
  rent.hidden = maxed || halted;
  if (!rent.hidden) {
    const increaseNext = firstNight >= (week + 1) * weekLength;
    rent.textContent = `${nightText(firstNight)}可接客 · ${increaseNext ? "下周多交" : "本周多交"} `;
    rent.append(valueWithIcon(increaseNext ? weekLength * floorNightlyRates[game.floors] : weeklyIncrease));
    rent.append(`（新楼每晚 ${floorNightlyRates[game.floors]} 叶币）`);
    if (game.floors === 2) {
      const dates = coachNights.filter(night => night >= firstNight).map(night => dateFor(night).date);
      rent.append(dates.length ? `。三层旅栈可接旅行团，第三周第 ${dates.join("、")} 晚到店，每团占 3 间。` : "。本季旅行团已结束。");
    }
  }
  byId("buildConfirm").hidden = maxed || halted;
  byId("buildConfirm").disabled = !ready;
  byId("buildConfirm").textContent = !unlocked ? "支付周租后解锁"
    : game.wallet < cost ? `还差 ${cost - game.wallet} 叶币` : `支付 ${cost} 叶币扩建`;
  show("build");
}

function dressRoom(rest = false) {
  if (!(rest ? canBuildRestRoom(game) : canDressRoom(game))) return;
  const slot = Number(byId(rest ? "restRoomSelect" : "viewRoomSelect").querySelector("input:checked")?.value);
  const excluded = rest ? game.viewRoom : game.business.restRoom;
  if (!Number.isInteger(slot) || slot < 0 || slot >= game.rooms.length || slot === excluded) return;
  game.wallet -= rest ? restRoomCost : lookOutCost;
  if (rest) game.business.restRoom = slot;
  else game.viewRoom = slot;
  save();
  dialog("build").close();
  render();
  if (dialog("receipt").open) renderReceipt();
  notify(`${roomName(slot)}已布置成${rest ? "歇脚房" : "观景房"}`);
}

function buildFloor() {
  const { cost, ready, floorOpen } = buildStatus();
  if (!ready) return;
  game.wallet -= cost;
  game.floorOpen = floorOpen;
  game.floors = floorOpen.length;
  game.floorRates = [...game.floorRates, floorNightlyRates[game.floors - 1]];
  game.rent = rentFor(dateFor(game.night).week, floorOpen, game.floorRates);
  const rooms = Array(roomsPerFloor).fill(null);
  game.rooms.push(...rooms);
  if (game.result) game.result.nextRooms.push(...rooms);
  pendingBuildScroll = true;
  dialog("build").close();
  save();
  render();
  const latest = floorViews.at(-1).section;
  latest.classList.add("new");
  if (dialog("receipt").open) renderReceipt();
  else scrollToExpansion();
}

function scrollToExpansion() {
  if (!pendingBuildScroll) return;
  pendingBuildScroll = false;
  floorViews.at(-1).section.scrollIntoView({ block: "start", behavior: "smooth" });
  notify(`${floorNames[game.floors - 1]}已加盖 · +4 间客房`);
}

function settle() {
  if (game.phase !== "day") return;
  unlockBell();
  activeGuest = null;
  const { date } = dateFor(game.night);
  const result = planNight(game);
  game.wallet += result.coins;
  game.trail = result.trail;
  game.business = result.business;
  game.hospitality = result.hospitality;
  const due = date === weekLength ? game.rent : 0;
  game.result = { ...result, due, paid: false };
  if (game.wallet < due) game.phase = "failed";
  else if (due || result.stories.length) game.phase = "receipt";
  else enterBookingPhase();
  save();
  render();
  showTurn(true, result, () => {
    if (game.phase === "bookings") openPhone();
    else { renderReceipt(); show("receipt"); }
  });
}

function renderReceipt() {
  const { coins, leaving, due, paid, stories } = game.result;
  const failed = game.phase === "failed";
  const won = game.phase === "won";
  const collecting = due > 0 && !paid && !failed;
  byId("receiptTitle").textContent = failed ? "房租没付上" : won ? "开店季通关"
    : collecting ? "房东来收租" : paid ? "本周房租已付清" : "今晚已结算";
  byId("receiptIntro").textContent = leaving.length ? `${leaving.length} 位退房` : "今晚无人退房";
  byId("receiptTotal").replaceChildren(valueWithIcon(`+${coins}`));
  byId("receiptWallet").replaceChildren(valueWithIcon(game.wallet));
  byId("entries").replaceChildren(...payoutRows(game.result));
  byId("receiptStories").hidden = !stories.length;
  byId("storyEntries").replaceChildren(...stories.map(storyCard));
  const memento = game.trail.birdDone ? " · 候鸟明信片已收录" : game.trail.returned ? " · 已接待双人回访" : "";
  const partners = game.business.channels.map(key => partnerNames[key]).join("、");
  byId("receiptNote").textContent = failed ? `还差 ${due - game.wallet} 叶币。可以从本周开始重新接单。` : won
    ? `已交清三周租金 · 经营 ${game.floors} 层${memento}${partners ? `。下季继续合作：${partners}。` : ""}`
    : collecting ? `这一周的房租是 ${due} 叶币。` : `明晚有 ${game.result.nextRooms.filter(room => !room).length} 间空房。`;
  const expansion = paid && !won && game.paid >= game.floors && game.floors < maxFloors;
  const dress = game.viewRoom === null && game.trail.returnFrom !== null && dressingOpen(game);
  const rest = paid && !won && canBuildRestRoom(game);
  byId("receiptExpand").hidden = !expansion && !dress && !rest;
  byId("receiptExpand").textContent = expansion && (dress || rest) ? "布置与扩建"
    : rest ? "布置客房" : dress ? "布置观景房" : `扩建${floorNames[game.floors] ?? ""}`;
  byId("receiptJournal").hidden = !won && !stories.length;
  byId("receiptNext").textContent = failed ? "重试本周" : won ? "开下一季" : collecting ? `交 ${due} 叶币房租` : "查看明晚订单";
}

function payoutRows({ roomCoins, lines, prepayments = [] }) {
  const regular = roomCoins - prepayments.reduce((sum, payment) => sum + payment.coins, 0);
  const payments = [{ label: "本晚房费", amount: `+${regular} 叶币` }, ...prepayments.map(payment => ({
    kind: payment.kind, label: payment.label, amount: `+${payment.coins} 叶币`
  })), ...lines];
  return payments.map(receiptEntry);
}

function receiptEntry({ kind, label, amount, resource = "coin" }) {
  const row = create("li", "payout");
  if (kind) row.append(makeSprite(kind, "receipt-avatar"));
  else {
    const room = create("span", "receipt-room-icon");
    room.append(create("i", "house-icon"));
    room.setAttribute("aria-hidden", "true");
    row.append(room);
  }
  row.append(create("span", "entry-name", label));
  if (amount) {
    const worth = valueWithIcon(amount.split(" ")[0],resource);
    worth.classList.toggle("negative",amount.startsWith("-"));
    row.append(worth);
  }
  return row;
}

function payRent() {
  game.wallet -= game.result.due;
  game.result.paid = true;
  game.paid += 1;
  if (game.night === orderCalendar.length - 1) game.phase = "won";
  save();
  render();
  renderReceipt();
}

function receiptNext() {
  if (game.phase === "failed") {
    dialog("receipt").close();
    game = structuredClone(checkpoint);
    activeGuest = null;
    save();
    render();
    openPhone();
    return;
  }
  if (game.phase === "won") {
    openKeepsakes();
    return;
  }
  if (game.result.due > 0 && !game.result.paid) {
    payRent();
    return;
  }
  dialog("receipt").close();
  enterBookingPhase();
  save();
  render();
  openPhone();
}

function getPhoneContext() {
  if (game.phase === "planning") return { mode: "opening", night: game.night, rooms: game.rooms,
    offers: ordersFor(game.night, game.trail, game) };
  const night = game.night + 1;
  const mode = game.phase === "bookings" ? "confirm" : "preview";
  const result = game.result ?? planNight({ ...game, rooms: allocation(game.rooms, game.queue, game.viewRoom, game.business.restRoom, game.hospitality, game.roomChoice) });
  const offers = ordersFor(night, game.trail, { referral: result.referral, heldButterfly: game.carryButterfly, business: game.business, floors: game.floors });
  return { mode, night, rooms: result.nextRooms, offers };
}

function enterBookingPhase() {
  game.phase = "bookings";
  const { rooms, offers } = getPhoneContext();
  const arrival = offers.find(order => order.commission);
  game.picks = arrival && !bookingRestriction(arrival, rooms, game.viewRoom, [], game.hospitality) ? [arrival.id] : [];
}

function buildOrderCards(offers) {
  orderViews = offers.map(order => {
    const first = order.guests[0];
    const row = create("div", order.themed ? "order themed-order" : "order");
    if (order.trip === "coach") row.classList.add("coach-order");
    const details = create("div");
    const bookingPrice = create("p");
    const rate = order.guests.reduce((sum, guest) => sum + animals[guest.kind].rate, 0);
    bookingPrice.append(document.createTextNode(`${order.themed ? `${order.guests.length} 位 · ` : ""}住 ${first.nights} 晚 · `),
      valueWithIcon(rate), document.createTextNode(" / 晚"));
    details.append(create("strong", "", order.name), bookingPrice);
    if (order.source) {
      const source = order.source === "橘蝶留单" ? "留单 · 今晚截止" : order.source;
      details.append(create("span", "order-source", source));
    }
    const button = create("button", "wood order-action", "接单");
    button.type = "button";
    button.addEventListener("click", () => toggleOrder(order.id));
    const portraits = create("span", "order-portraits");
    portraits.append(...order.guests.map(guest => makeSprite(guest.kind, "")));
    row.append(portraits, details, button);
    const rules = guestRules(first).filter(rule => rule.amount ||
      (rule.booking && order.source !== "橘蝶留单" && first.arrived < orderCalendar.length - 1));
    if (rules.length) {
      const list = create("ul", "guest-rules order-rules");
      list.setAttribute("aria-label", "旅客能力");
      fillRules(list, rules);
      row.append(list);
    }
    if (order.themed) {
      row.append(create("p", "themed-description", order.description));
      return { order, row, button, restriction: row.appendChild(create("p", "booking-restriction")) };
    }
    const restriction = first.needsView || first.needsFlower ? row.appendChild(create("p", "booking-restriction")) : null;
    return { order, row, button, restriction };
  });
  byId("orderList").replaceChildren(...orderViews.map(({ row }) => row));
}

function renderCommissionCards(night, rooms) {
  const list = byId("phoneCommissions");
  const offers = upcomingCommissions(night, game.business, game.hospitality);
  list.hidden = !offers.length;
  list.replaceChildren(...offers.map(commission => {
    const reserved = game.business.reservations[commission.id] === "reserved";
    const future = stayUntil(rooms, commission.night - night);
    const free = future.filter(room => !room).length;
    const reason = bookingRestriction(commissionOrder(commission), future, game.viewRoom, [], game.hospitality);
    const card = create("article", `commission-card${reserved ? " reserved" : ""}`);
    const heading = create("div", "commission-head");
    const reward = create("span", "commission-reward", "谢礼 ");
    reward.append(valueWithIcon(`+${commission.bonus}`, "coin", false));
    heading.append(create("strong", "", commission.name), reward);
    const dates = create("p", "commission-date",
      `${nightText(commission.night)} 到店 · 各住 ${commission.nights} 晚`);
    const party = create("p", "commission-date", commission.guests.map(kind => animals[kind].name).join("、"));
    const space = create("p", `commission-space${reason ? " blocked" : ""}`,
      `需要 2 间 / 预计空 ${free} 间${commission.view ? " · 含观景房" : commission.flowerRooms ? ` · ${commission.flowerRooms} 间要有花景` : ""}`);
    if (reason) space.append(document.createTextNode(`（${free < 2 ? "空房不足" : reason}）`));
    const switching = offers.some(other => other.night === commission.night && game.business.reservations[other.id] === "reserved");
    const action = create("button", "wood", reserved ? "已预约 · 可取消" : switching ? "同晚改约这单" : "提前预约");
    action.type = "button";
    action.id = `commission-${commission.id}`;
    action.setAttribute("aria-pressed", String(reserved));
    action.setAttribute("aria-label", `${reserved ? "取消预约" : switching ? "同晚改约" : "提前预约"}：${commission.name}`);
    action.addEventListener("click", () => toggleCommission(commission.id));
    card.append(heading, dates, party, space, action);
    return card;
  }));
}

function toggleCommission(id) {
  const { night } = getPhoneContext();
  const available = upcomingCommissions(night, game.business, game.hospitality);
  if (!available.some(commission => commission.id === id)) return;
  const reservations = game.business.reservations;
  if (reservations[id] === "reserved") delete reservations[id];
  else {
    for (const commission of available.filter(commission=>commission.night===commissionById.get(id).night)) {
      if (reservations[commission.id] === "reserved") delete reservations[commission.id];
    }
    reservations[id] = "reserved";
  }
  save();
  render();
  renderPhone();
  byId(`commission-${id}`)?.focus({ preventScroll: true });
}

function renderPhone() {
  const { mode, night, rooms, offers } = getPhoneContext();
  const available = rooms.filter(room => !room).length;
  const preview = mode === "preview";
  const final = night >= orderCalendar.length;
  const key = `${mode}-${night}-${offers.map(order => order.id).join(",")}`;
  if (orderContext !== key) {
    orderContext = key;
    buildOrderCards(offers);
    const earnings = byId("phoneEarnings");
    earnings.open = false;
    earnings.hidden = mode !== "confirm";
    if (!earnings.hidden) {
      byId("phoneEarned").replaceChildren(valueWithIcon(`+${game.result.coins}`));
      byId("phonePayouts").replaceChildren(...payoutRows(game.result));
    }
    const highlights = mode === "confirm" ? game.result.highlights ?? [] : [];
    const panel = byId("phoneHighlights");
    panel.hidden = !highlights.length;
    panel.replaceChildren(...highlights.map(({ label, amount }) => {
      const row = create("p", "", label);
      if (amount) row.append(valueWithIcon(`+${amount}`, "coin", false));
      return row;
    }));
  }
  byId("phoneTitle").textContent = final ? "预约已结束" : mode === "opening" ? "今晚预约" : preview ? "明晚订单预览" : "明晚接单";
  byId("phoneClose").setAttribute("aria-label", mode === "confirm" ? "关闭手机并开始下一天" : "关闭手机");
  const selected = preview ? [] : reservedGuests(offers, game.picks);
  const picks = selected.length;
  const projectedRooms = allocation(rooms, selected, game.viewRoom, game.business.restRoom, game.hospitality, game.roomChoice);
  renderCommissionCards(night, projectedRooms);
  const estimateLabel = byId("phoneEstimate");
  estimateLabel.hidden = preview || (!picks && !rooms.some(Boolean));
  if (!estimateLabel.hidden) {
    const { coins, roomCoins, effects } = planNight({ ...game, night, rooms: projectedRooms }, null);
    estimateLabel.replaceChildren(document.createTextNode(mode === "opening" ? "今晚预计 " : "明晚预计 "), valueWithIcon(`+${coins}`));
    const bonus = coins - roomCoins;
    if (bonus) {
      const tag = create("span", "estimate-bonus", bonus>0 ? "含加成 " : "含扣减 ");
      tag.append(valueWithIcon(`${bonus>0?"+":""}${bonus}`, "coin", false));
      estimateLabel.append(tag);
    }
    renderRoomPlan(rooms, selected, projectedRooms, effects);
  } else {
    byId("phoneRoomPlans").hidden = true;
    byId("phoneLodgingForecast").hidden = true;
  }
  byId("phoneForecast").textContent = final ? "今晚是开店季最后一晚。" : `${nightText(night)} · ${preview ? `预计空房 ${available} 间` : `已接 ${picks} / ${available} 位`}`;
  const staying = guestNames(rooms);
  const stayLine = byId("phoneStay");
  stayLine.hidden = final || !staying;
  stayLine.textContent = `留宿 ${staying}`;
  byId("phoneNote").hidden = !preview;
  byId("phoneNote").textContent = "结算后可以接单。";
  byId("phoneDone").textContent = preview ? "回到旅栈" : mode === "opening" ? picks ? `接待 ${picks} 位` : "直接开门"
    : picks ? `接待 ${picks} 位 · 开始下一天` : "不接新客 · 开始下一天";
  for (const { order, row, button, restriction } of orderViews) {
    const picked = game.picks.includes(order.id) && !preview;
    const reason = picked ? "" : bookingRestriction(order, rooms, game.viewRoom, selected, game.hospitality);
    row.classList.toggle("accepted", picked);
    button.hidden = preview;
    button.disabled = preview || Boolean(reason);
    button.textContent = picked ? (order.commission ? "已预约" : "已接") : reason ? "待安排" : "接单";
    button.setAttribute("aria-pressed", String(picked));
    const label = order.source ? `${order.name}（${order.source}）` : order.name;
    button.setAttribute("aria-label", picked ? `取消${label}的订单` : `接单：${label}`);
    if (restriction) {
      const view = order.guests.some(guest => guest.needsView);
      const flowers = order.guests.filter(guest => guest.needsFlower).length;
      const needs = flowers ? `需要 ${order.guests.length} 间空房，其中 ${flowers} 间有花景` : order.guests.length === 1 ? "需要 1 间观景房" : `需要 ${order.guests.length} 间空房${view ? "，含 1 间观景房" : ""}`;
      restriction.textContent = [needs, reason].filter(Boolean).join(" · ");
      restriction.classList.toggle("blocked", Boolean(reason));
    }
  }
}

function openPhone() {
  renderPhone();
  show("phone");
}

function toggleOrder(id) {
  const { mode, rooms, offers } = getPhoneContext();
  if (mode === "preview") return;
  if (game.picks.includes(id)) game.picks = game.picks.filter(pick => pick !== id);
  else {
    const order = offers.find(offer => offer.id === id);
    if (!order || bookingRestriction(order, rooms, game.viewRoom, reservedGuests(offers, game.picks), game.hospitality)) return;
    game.picks.push(id);
  }
  save();
  renderPhone();
}

function beginArrivals(picks) {
  const offers = ordersFor(game.night, game.trail, game);
  const skippedButterfly = applicants(game.night).find(guest => guest.kind === "butterfly" && !picks.includes(guest.id));
  game.carryButterfly = skippedButterfly?.nights ?? null;
  game.queue = [];
  for (const order of offers.filter(offer => picks.includes(offer.id))) {
    if (!bookingRestriction(order, game.rooms, game.viewRoom, game.queue, game.hospitality)) game.queue.push(...order.guests);
  }
  const appointment = offers.find(order => order.commission);
  if (appointment) {
    game.business.reservations[appointment.commission] = game.queue.some(guest => guest.commission === appointment.commission)
      ? "staying" : "missed";
  }
  if (game.queue.some(guest => guest.trip)) game.trail = { ...game.trail,
    returnBooked: game.trail.returnBooked || game.queue.some(guest => guest.trip === "return"),
    birdBooked: game.trail.birdBooked || game.queue.some(guest => guest.trip === "bird") };
  game.picks = [];
  if (!game.queue.length) game.roomChoice = null;
  game.phase = game.queue.length ? "arrivals" : "day";
  receiveVisit(game);
  activeGuest = null;
  save();
  render();
  showTurn(false, null, () => { if (game.phase === "arrivals") greet(); });
}

function advance() {
  const picks = game.picks;
  game = newNight(game, game.night + 1);
  if (dateFor(game.night).date === 1) checkpoint = structuredClone(game);
  beginArrivals(picks);
  if (pendingBuildScroll) scrollToExpansion();
}

function mainAction() {
  switch (game.phase) {
    case "planning": case "bookings": openPhone(); break;
    case "arrivals": greet(); break;
    case "day": settle(); break;
    default: renderReceipt(); show("receipt"); break;
  }
}

byId("settle").addEventListener("click", mainAction);
byId("renew").addEventListener("click", toggleRenewal);
byId("guestClose").addEventListener("click", () => { activeGuest = null; render(); });
byId("expandButton").addEventListener("click", openBuild);
byId("buildingButton").addEventListener("click", openBuild);
byId("journalButton").addEventListener("click", openJournal);
byId("appointmentPrompt").addEventListener("click", openPhone);
byId("trailPrompt").addEventListener("click", openJournal);
byId("receiptJournal").addEventListener("click", openJournal);
byId("makeSachet").addEventListener("click", makeSachet);
byId("viewRoomConfirm").addEventListener("click", () => dressRoom());
byId("restRoomConfirm").addEventListener("click", () => dressRoom(true));
byId("receiptExpand").addEventListener("click", openBuild);
byId("buildConfirm").addEventListener("click", buildFloor);
byId("receiptNext").addEventListener("click", receiptNext);
byId("receipt").addEventListener("cancel", event => event.preventDefault());
byId("phoneButton").addEventListener("click", openPhone);
byId("phoneClose").addEventListener("click", () => { unlockBell(); dialog("phone").close(); });
byId("phoneDone").addEventListener("click", () => {
  unlockBell();
  const opening = game.phase === "planning";
  dialog("phone").close();
  if (opening) beginArrivals(game.picks);
});
byId("phone").addEventListener("close", () => {
  if (game.phase === "bookings") advance();
});
byId("helpButton").addEventListener("click", () => show("help"));
byId("restartButton").addEventListener("click", () => show("restart"));
byId("restartConfirm").addEventListener("click", () => {
  dialog("restart").close();
  dialog("receipt").close();
  start();
});
initHospitality();
const saved = restore();
if (saved) {
  ({ game, checkpoint } = saved);
  for (const state of [game, checkpoint]) {
    state.floorRates ??= state.floorOpen.map((_, floor) => floor ? 5 : 0);
  }
  game.business ??= newBusiness();
  checkpoint.business ??= newBusiness();
  game.hospitality ??= newHospitality();
  checkpoint.hospitality ??= newHospitality();
  save();
  render();
  scheduleArrival();
  if (["receipt", "failed", "won"].includes(game.phase)) {
    renderReceipt();
    show("receipt");
  }
  if (game.phase === "bookings") openPhone();
} else {
  start();
}
