"use strict";

const shelfRows = [
  ["w", "窗沿", [20.8, 27.5, 34.9, 44.1], 54.75, .68],
  ["u", "花架上层", [55.5, 63.5, 72.1], 27.6, .67],
  ["m", "花架中层", [55.5, 63.5, 72.1], 42.15, .67],
  ["l", "花架下层", [55.5, 63.5, 72.1], 55.9, .72],
  ["t", "桌面后排", [21.3, 35.15, 48.9, 62.6, 76.35], 68.5, 1],
  ["f", "桌面前排", [18.6, 33.75, 48.9, 64.1, 79.25], 81.8, 1.09]
];

const places = shelfRows.flatMap(([row, label, columns, y, scale]) => columns.map((x, column) => ({
  id: row + column, row, label, column, x, y, scale
})));
const placeIds = new Map(places.map(({ id }, index) => [id, index]));
const spot = id => placeIds.get(id);

const plantTypes = {
  sun: { name: "向日葵", wishes: ["sun"], width: 11.2, tone: "#e9b94d", tall: true },
  hydrangea: { name: "绣球", wishes: ["water", "shadow"], width: 10.5, tone: "#a5b9d4" },
  daisy: { name: "小雏菊", wishes: ["front"], width: 9.6, tone: "#efd183" },
  orchid: { name: "蝴蝶兰", wishes: ["wind"], width: 10.6, tone: "#dfa7b4" },
  violet: { name: "紫罗兰", wishes: ["sill", "sheltered"], width: 9.0, tone: "#ab96c4" },
  tulip: { name: "郁金香", wishes: ["lamp"], width: 9.8, tone: "#de9b99" },
  vine: { name: "牵牛花", wishes: ["trellis"], width: 9.5, tone: "#baa0cc" },
  tray: { name: "浅水盘", wishes: [], width: 11.9, tone: "#8eb6ad" }
};

const wishText = {
  sun: ["☀", "站在阳光里"],
  water: ["💧", "同一排紧挨水盘"],
  shadow: ["◒", "待在高花盆的影子里"],
  front: ["▤", "摆在桌面最前排"],
  wind: ["≋", "去窗沿左端吹风"],
  sill: ["▣", "留在窗沿上"],
  sheltered: ["◐", "避开窗沿的风"],
  lamp: ["✦", "站在补光灯下"],
  trellis: ["▥", "同一层紧挨藤架"]
};

const sunSpots = ["w0", "w1", "w2", "w3", "t0", "t1", "t2", "t3", "f0", "f1", "f2", "f3"].map(spot);
const windSpots = ["w0", "w1"].map(spot);
const lampSpot = spot("u2");
const trellisSpot = spot("m2");
const tableShuttles = Array.from({ length: 5 }, (_, column) => ["t" + column, "f" + column]);
const windowsShuttles = [["t0", "w0"], ["t2", "w3"]];
const shelfShuttles = [
  ["t4", "l2"], ["l0", "m0"], ["l1", "m1"], ["m0", "u0"], ["m1", "u1"]
];

const chapters = [
  {
    id: "first-lesson",
    name: "花房第一课",
    brief: "帮窗沿上的绣球下到桌面，放到浅水盘旁。",
    rows: ["w", "t"],
    places: ["w0", "w1", "w2", "t0", "t1", "t2"],
    tutorial: true,
    pieces: [["hydrangea", "w1", ["water"]]],
    fixtures: [["tray", "t2"]],
    par: 3, limit: 7
  },
  {
    id: "shade",
    name: "给绣球借一片阴凉",
    brief: "高个向日葵在阳光里时，会把影子投到它右手边的一格。让绣球同时躲进影子、挨着水盘。",
    rows: ["t", "f"],
    pieces: [["sun", "t0"], ["hydrangea", "f4"], ["daisy", "t2"]],
    fixtures: [["tray", "t3"]],
    par: 5, limit: 9
  },
  {
    id: "breeze",
    name: "半开的窗扇",
    brief: "左侧窗扇开着。蝴蝶兰想吹风，紫罗兰想留在背风的窗沿。金边花垫之间可以换台面。",
    rows: ["w", "t", "f"],
    wind: true,
    pieces: [["orchid", "w3"], ["violet", "w1"], ["daisy", "w0"], ["sun", "f4"]],
    fixtures: [],
    par: 7, limit: 12
  },
  {
    id: "lamp",
    name: "花架开灯啦",
    brief: "补光灯只照到上层最右边。把郁金香送进光圈，给牵牛花找藤架，再把小雏菊摆到前排。",
    rows: ["u", "m", "l", "t", "f"],
    dusk: true,
    pieces: [["tulip", "t3"], ["vine", "l0"], ["daisy", "m1"]],
    fixtures: [],
    par: 12, limit: 16
  },
  {
    id: "shared-water",
    name: "把水盘搬过来",
    brief: "这次水盘也能滑动。让绣球在阴影里挨水，并让郁金香在桌前一排挨着同一个水盘。",
    rows: ["t", "f"],
    pieces: [["sun", "t3"], ["hydrangea", "f3"], ["tray", "f1"], ["tulip", "t1", ["front", "water"]], ["daisy", "f0"]],
    fixtures: [],
    par: 9, limit: 14
  },
  {
    id: "windowsill-water",
    name: "窗沿的两口水",
    brief: "让蝴蝶兰迎风、紫罗兰背风，再把浅水盘挪到它们中间。两盆花要在窗沿上紧挨同一个水盘。",
    rows: ["w", "t"],
    wind: true,
    pieces: [["orchid", "w3", ["wind", "water"]], ["violet", "w1", ["sill", "sheltered", "water"]], ["tray", "t4"]],
    fixtures: [],
    par: 7, limit: 12
  },
  {
    id: "two-sunflowers",
    name: "给影子留个座",
    brief: "两盆向日葵都要在前排晒太阳，错开摆才不会互相遮光。绣球还要在影子里挨着固定的水盘。",
    rows: ["t", "f"],
    pieces: [["sun", "t4", ["sun", "front"]], ["sun", "t3", ["sun", "front"]], ["hydrangea", "f0"], ["daisy", "f2"]],
    fixtures: [["tray", "f4"]],
    par: 8, limit: 13
  },
  {
    id: "trellis-detour",
    name: "花架上的错车",
    brief: "郁金香要上楼，牵牛花要下楼，两盆小雏菊要去桌前。先找一格空位给它们错身。",
    rows: ["u", "m", "l", "t", "f"],
    dusk: true,
    pieces: [["tulip", "l1"], ["vine", "u1"], ["daisy", "u0"], ["daisy", "l2"]],
    fixtures: [],
    par: 13, limit: 19
  },
  {
    id: "evening-breeze",
    name: "晚风里的补光灯",
    brief: "窗还开着，灯也亮了。把蝴蝶兰从灯下送到风口，再把窗沿的郁金香换到灯下。",
    rows: ["w", "t", "u", "m", "l"],
    dusk: true,
    wind: true,
    pieces: [["orchid", "u2"], ["tulip", "w0"], ["violet", "w1"], ["vine", "l0"]],
    fixtures: [],
    par: 17, limit: 23
  },
  {
    id: "morning-arrangement",
    name: "晨光大换位",
    brief: "窗沿只剩右侧端口可用。先想好谁下桌、谁上窗，再用向日葵的影子和水盘照顾绣球。",
    rows: ["w", "t", "f"],
    places: ["w0", "w1", "w2", "w3", "t1", "t2", "t3", "t4", "f0", "f1", "f2", "f3", "f4"],
    wind: true,
    pieces: [["orchid", "f4"], ["violet", "f0"], ["sun", "w0", ["sun", "front"]], ["hydrangea", "w1"], ["tray", "w2"]],
    fixtures: [],
    par: 19, limit: 26
  }
];

function compileChapter(chapter) {
  const usable = new Set(chapter.places ? chapter.places.map(spot)
    : places.flatMap((p, i) => chapter.rows.includes(p.row) && i !== trellisSpot ? [i] : []));
  const fixtures = new Map(chapter.fixtures.map(([kind, id]) => [spot(id), kind]));
  const actors = chapter.pieces.map(([kind, id, wishes]) => ({
    ...plantTypes[kind], kind, start: spot(id), wishes: wishes ?? plantTypes[kind].wishes
  }));
  const passable = cell => usable.has(cell) && !fixtures.has(cell);
  const joined = [
    ...tableShuttles,
    ...(chapter.rows.includes("w") ? windowsShuttles : []),
    ...(chapter.rows.includes("l") ? shelfShuttles : [])
  ].map(pair => pair.map(spot)).filter(pair => pair.every(passable));
  const transferLinks = joined.filter(pair => {
    const [a, b] = pair.map(i => places[i]);
    return !(a.row === "t" && b.row === "f");
  });
  const transfers = new Set(transferLinks.flat());
  const rays = places.map(({ row, column }, index) => {
    const left = [];
    const right = [];
    for (let i = column - 1; passable(spot(row + i)); i--) left.push(spot(row + i));
    for (let i = column + 1; passable(spot(row + i)); i++) right.push(spot(row + i));
    const hops = joined.filter(pair => pair.includes(index)).map(pair => pair.find(cell => cell !== index));
    return [left, right, ...hops.map(cell => [cell])];
  });
  return { ...chapter, usable, fixtures, actors, transfers, transferLinks, rays, start: actors.map(actor => actor.start) };
}

const levels = chapters.map(compileChapter);
const bit = cell => 1 << cell;
function beside(a, b) {
  return places[a].row === places[b].row && Math.abs(places[a].column - places[b].column) === 1;
}

function environment(level, positions) {
  const daylight = level.dusk ? 0 : sunSpots.reduce((mask, cell) => mask | bit(cell), 0);
  let shadeMask = 0;
  let water = -1;
  const shadows = [];
  for (const [cell, kind] of level.fixtures) {
    if (kind === "tray") water = cell;
  }
  // Direct sunlight enters from the left. Evaluate each row from left to right.
  const tall = [];
  for (let index = 0; index < positions.length; index++) {
    const actor = level.actors[index];
    if (actor.kind === "tray") water = positions[index];
    if (actor.tall) tall.push(positions[index]);
  }
  tall.sort((a, b) => a - b);
  for (const cell of tall) {
    const source = places[cell];
    if (!["t", "f"].includes(source.row) || !(daylight & bit(cell)) || shadeMask & bit(cell)) continue;
    const next = spot(source.row + (source.column + 1));
    if (!level.usable.has(next)) continue;
    shadeMask |= bit(next);
    shadows.push([cell, next]);
  }
  return { sun: daylight & ~shadeMask, shade: shadeMask, water, shadows };
}

function meets(level, env, cell, rule) {
  switch (rule) {
    case "sun": return Boolean(env.sun & bit(cell));
    case "water": return env.water >= 0 && beside(cell, env.water);
    case "shadow": return Boolean(env.shade & bit(cell));
    case "front": return places[cell].row === "f";
    case "wind": return Boolean(level.wind && windSpots.includes(cell));
    case "sill": return places[cell].row === "w";
    case "sheltered": return !level.wind || !windSpots.includes(cell);
    case "lamp": return Boolean(level.dusk && cell === lampSpot);
    case "trellis": return beside(cell, trellisSpot);
    default: return false;
  }
}

function destinations(level, positions, actor) {
  if (actor < 0) return [];
  const occupied = positions.reduce((mask, cell) => mask | bit(cell), 0);
  const result = [];
  for (const ray of level.rays[positions[actor]]) {
    for (const target of ray) {
      if (occupied & bit(target)) break;
      result.push(target);
    }
  }
  return result;
}

function solve(level, start, budget = Infinity) {
  const count = level.actors.length;
  let origin = 0;
  for (let index = 0; index < count; index++) origin |= start[index] << (index * 5);
  const queue = [origin];
  const first = [-1];
  const seen = new Set(queue);
  const positions = new Array(count);
  let distance = 0;
  let layerEnd = 1;
  for (let head = 0; head < queue.length; head++) {
    if (head === layerEnd) {
      layerEnd = queue.length;
      distance++;
    }
    let occupied = 0;
    const state = queue[head];
    for (let actor = 0; actor < count; actor++) {
      const cell = positions[actor] = (state >>> (actor * 5)) & 31;
      occupied |= bit(cell);
    }
    const env = environment(level, positions);
    const solved = level.actors.every((actor, i) =>
      actor.wishes.every(rule => meets(level, env, positions[i], rule)));
    if (solved) return distance ? { actor: first[head] >>> 5, target: first[head] & 31, distance } : null;
    if (distance === budget) continue;
    for (let actor = 0; actor < count; actor++) {
      const from = positions[actor];
      for (const ray of level.rays[from]) {
        for (const target of ray) {
          if (occupied & bit(target)) break;
          const next = state ^ ((from ^ target) << (actor * 5));
          if (seen.has(next)) continue;
          seen.add(next);
          queue.push(next);
          first.push(head === 0 ? (actor << 5) | target : first[head]);
        }
      }
    }
  }
  return null;
}
