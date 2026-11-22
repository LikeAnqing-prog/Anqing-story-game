"use strict";

const byId = id => document.getElementById(id);
const world = byId("world");
const journal = byId("journal");
const legacyScoreKey = "window-greenhouse.room.v1";
const scoreKey = "window-greenhouse.room.v2";
const audioKey = legacyScoreKey + ".audio";
const baseHelp = "点花盆，再点亮起的花垫。拖动也可以，每挪一次算一步。";
const sceneScale = .88;

// Bounding rectangles of the eight transparent panels in the 1536 × 1024 sprite sheet.
const crops = {
  sun: [31, 15, 331, 479],
  hydrangea: [396, 173, 358, 320],
  daisy: [786, 151, 321, 341],
  orchid: [1156, 103, 350, 389],
  violet: [26, 654, 346, 332],
  tulip: [422, 596, 309, 391],
  vine: [784, 620, 328, 364],
  tray: [1152, 793, 352, 175]
};

let stored;
let audioEnabled = true;
try {
  stored = JSON.parse(localStorage.getItem(scoreKey) ?? "null");
  if (!stored) {
    const legacy = JSON.parse(localStorage.getItem(legacyScoreKey) ?? "null");
    if (Array.isArray(legacy)) stored = Object.fromEntries(levels.slice(1).map((level, index) => [level.id, legacy[index]]));
  }
  audioEnabled = localStorage.getItem(audioKey) !== "off";
} catch {}
const scores = levels.map(level => {
  const steps = stored?.[level.id];
  return Number.isInteger(steps) && steps >= level.par && steps <= level.limit ? steps : null;
});

const notes = {
  choose: [[494, 0, .065, .045]], slide: [[315, 0, .1, .06]], bump: [[175, 0, .083, .031]],
  undo: [[387, 0, .087, .048]], win: [[523, 0, .19, .068], [659, .073, .21, .063], [784, .165, .26, .053]],
  fail: [[294, 0, .13, .041], [233, .09, .16, .038]]
};
let audioContext;
let mainGain;
function audioButton() {
  byId("soundToggle").textContent = audioEnabled ? "音效开" : "音效关";
  byId("soundToggle").setAttribute("aria-pressed", String(audioEnabled));
  if (mainGain) mainGain.gain.setValueAtTime(audioEnabled ? 1 : 0, audioContext.currentTime);
}
function playSound(name) {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!audioEnabled || !Audio) return;
  try {
    if (!audioContext) {
      audioContext = new Audio();
      mainGain = audioContext.createGain();
      mainGain.connect(audioContext.destination);
    }
    const play = () => {
      if (!audioEnabled || audioContext.state !== "running") return;
      const now = audioContext.currentTime + .013;
      for (const [pitch, delay, length, volume] of notes[name]) {
        const tone = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const time = now + delay;
        tone.frequency.value = pitch;
        tone.type = name === "bump" ? "triangle" : "sine";
        gain.gain.setValueAtTime(.0001, time);
        gain.gain.exponentialRampToValueAtTime(volume, time + .012);
        gain.gain.exponentialRampToValueAtTime(.0001, time + length);
        tone.connect(gain);
        gain.connect(mainGain);
        tone.start(time);
        tone.stop(time + length);
      }
    };
    if (audioContext.state === "running") play();
    else audioContext.resume().then(play).catch(() => {});
  } catch {}
}

let current = 0;
let level = levels[0];
let positions = [];
let history = [];
let selected = -1;
let hinted = -1;
let result = "playing";
let slots = [];
let pieces = [];
let wishes = [];
let gesture;
let ignoreClick = false;

function sprite(kind, icon = false) {
  const [x, y, width, height] = crops[kind];
  const slice = document.createElement("span");
  slice.className = "cutout";
  slice.setAttribute("aria-hidden", "true");
  slice.style.aspectRatio = `${width} / ${height}`;
  slice.style.backgroundSize = `${1536 / width * 100}% ${1024 / height * 100}%`;
  slice.style.backgroundPosition = `${x / (1536 - width) * 100}% ${y / (1024 - height) * 100}%`;
  if (!icon) return slice;
  const portrait = document.createElement("span");
  portrait.className = "portrait";
  slice.style.width = Math.min(84, 88 * width / height) + "%";
  portrait.append(slice);
  return portrait;
}

function moveObject(node, cell, width) {
  const place = places[cell];
  node.style.setProperty("--x", place.x + "%");
  node.style.setProperty("--y", place.y + "%");
  node.style.setProperty("--piece-width", (width * place.scale * sceneScale).toFixed(2) + "%");
  node.style.setProperty("--depth", Math.round(5 + place.y / 10));
}
function slotName(cell) {
  const place = places[cell];
  return `${place.label}第 ${place.column + 1} 格`;
}
const levelButtons = levels.map((entry, index) => {
  const button = document.createElement("button");
  button.className = "level";
  button.type = "button";
  const rank = document.createElement("span");
  rank.className = "level-rank";
  const number = document.createElement("span");
  number.className = "level-number";
  number.textContent = String(index + 1).padStart(2, "0");
  const label = document.createElement("span");
  label.className = "level-name";
  label.textContent = entry.name;
  const detail = document.createElement("small");
  detail.className = "level-record";
  button.append(rank, number, label, detail);
  button.addEventListener("click", () => {
    journal.close();
    if (current !== index || result !== "playing") loadLevel(index);
    focusWorld();
    playSound("choose");
  });
  byId("levelList").append(button);
  return { button, rank, detail };
});

function starsFor(entry, steps) {
  if (!steps) return 0;
  if (steps <= entry.par) return 3;
  return steps < entry.limit ? 2 : 1;
}
function starsBadge(count) {
  const stars = [1, 2, 3].map(star => star <= count
    ? '<span class="star-mark gold" aria-hidden="true">★</span>'
    : '<span class="star-mark" aria-hidden="true">☆</span>').join("");
  return `<span class="stars" role="img" aria-label="${count} 星">${stars}</span>`;
}
function progress() {
  let total = 0;
  let cleared = 0;
  for (const [index, { button, rank, detail }] of levelButtons.entries()) {
    const score = starsFor(levels[index], scores[index]);
    total += score;
    cleared += Number(score > 0);
    rank.innerHTML = starsBadge(score);
    detail.textContent = score ? `已通关 · 最佳 ${scores[index]} 步` : "待挑战";
    button.setAttribute("aria-label", `${levels[index].name}，第 ${index + 1} 关，${score} 星，${detail.textContent}`);
    button.classList.toggle("completed", score > 0);
    if (index === current) button.setAttribute("aria-current", "step");
    else button.removeAttribute("aria-current");
  }
  byId("total").textContent = `${total} / ${levels.length * 3}`;
  byId("journalSummary").textContent = `已通关 ${cleared} / ${levels.length} · 收获 ${total} / ${levels.length * 3} 颗星`;
}
function message(text, alert = false) {
  byId("status").textContent = text;
  byId("status").classList.toggle("alert", alert);
}
function nextLabel() {
  if (result === "failed") return "再试一次";
  return current === levels.length - 1 ? "翻开手账" : "下一关";
}
function curtain(open) {
  byId("result").hidden = !open;
  for (const id of ["slots", "plants", "controls", "wishPanel"]) byId(id).inert = open;
}
function focusWorld() {
  pieces[0]?.button.focus({ preventScroll: true });
  if (world.getBoundingClientRect().top < 0 || world.getBoundingClientRect().top > window.innerHeight - 180) {
    byId("levelTitle").scrollIntoView({ block: "start" });
  }
}

function loadLevel(index) {
  current = index;
  level = levels[index];
  positions = level.start.slice();
  history = [];
  result = "playing";
  selected = hinted = -1;
  gesture = undefined;
  ignoreClick = false;
  curtain(false);
  byId("number").textContent = `第 ${index + 1} 关`;
  byId("levelTitle").textContent = level.name;
  byId("brief").textContent = level.brief;
  const weather = level.dusk ? (level.wind ? "≋ 晚风 · 亮灯" : "✦ 傍晚亮灯") : (level.wind ? "≋ 左窗开着" : "☀ 晨光");
  byId("weatherLabel").textContent = weather;
  byId("wind").hidden = !level.wind;
  byId("openWindow").hidden = !level.wind;
  byId("sunlight").hidden = Boolean(level.dusk);
  byId("lesson").hidden = !level.tutorial;
  byId("twilight").hidden = byId("lamp").hidden = !level.dusk;
  byId("goals").textContent = `三星 ${level.par} 步 · 两星 ${level.par + 1}–${level.limit - 1} 步 · 一星 ${level.limit} 步`;
  for (const id of ["slots", "fixtures", "plants", "wishes", "shadows"]) byId(id).replaceChildren();

  slots = places.map((place, cell) => {
    if (!level.usable.has(cell)) return null;
    const fixed = level.fixtures.has(cell);
    const node = document.createElement(fixed ? "span" : "button");
    node.className = "slot";
    if (fixed) {
      node.classList.add("fixed");
      node.setAttribute("aria-hidden", "true");
    } else {
      node.type = "button";
      node.dataset.slot = String(cell);
    }
    node.classList.toggle("transit", level.transfers.has(cell));
    if (level.tutorial && level.transfers.has(cell)) {
      const mark = document.createElement("span");
      mark.className = "port-mark";
      mark.textContent = "端口";
      mark.setAttribute("aria-hidden", "true");
      node.append(mark);
    }
    node.style.setProperty("--x", place.x + "%");
    node.style.setProperty("--y", place.y + "%");
    node.style.setProperty("--slot-width", (10.35 * place.scale * sceneScale).toFixed(2) + "%");
    byId("slots").append(node);
    return node;
  });

  const accents = [["violet", "w0"], ["orchid", "u0"], ["vine", "l0"]]
    .flatMap(([kind, id]) => level.rows.includes(places[spot(id)].row) ? [] : [[spot(id), kind]]);
  for (const [cell, kind] of [...level.fixtures, ...accents]) {
    const fixture = document.createElement("div");
    fixture.className = "fixture";
    moveObject(fixture, cell, plantTypes[kind].width);
    fixture.append(sprite(kind));
    byId("fixtures").append(fixture);
  }

  pieces = level.actors.map((actor, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "piece";
    button.dataset.piece = String(index);
    const bubble = document.createElement("span");
    bubble.className = "bubble";
    bubble.hidden = actor.wishes.length === 0;
    bubble.setAttribute("aria-hidden", "true");
    const badges = actor.wishes.length > 1 ? actor.wishes.map(rule => {
      const badge = document.createElement("span");
      badge.className = "need-badge";
      badge.textContent = wishText[rule][0];
      bubble.append(badge);
      return badge;
    }) : [];
    bubble.classList.toggle("multi", badges.length > 0);
    const illustration = document.createElement("span");
    illustration.className = "piece-art";
    illustration.append(sprite(actor.kind), bubble);
    button.append(illustration);
    moveObject(button, positions[index], actor.width);
    byId("plants").append(button);
    return { button, bubble, badges };
  });

  wishes = level.actors.map((actor, index) => {
    const item = document.createElement("li");
    item.className = "wish";
    const copy = document.createElement("span");
    const title = document.createElement("strong");
    title.textContent = actor.name;
    const items = document.createElement("span");
    items.className = "wish-items";
    const checks = actor.wishes.map(rule => {
      const line = document.createElement("span");
      line.className = "wish-detail";
      const icon = document.createElement("b");
      icon.textContent = wishText[rule][0];
      icon.setAttribute("aria-hidden", "true");
      const text = document.createElement("span");
      text.textContent = wishText[rule][1];
      line.append(icon, text);
      items.append(line);
      return { line, icon, rule };
    });
    if (!checks.length) {
      const item = document.createElement("span");
      item.className = "wish-detail";
      item.textContent = "可以移动的水源";
      items.append(item);
    }
    copy.append(title, items);
    item.append(sprite(actor.kind, true), copy);
    byId("wishes").append(item);
    return { item, checks };
  });
  progress();
  message(baseHelp);
  render();
}

let shadowSignature = "";
function drawShadows(shadows) {
  const layer = byId("shadows");
  const signature = shadows.map(pair => pair.join("-")).join(",");
  if (signature === shadowSignature && layer.children.length === shadows.length) return;
  shadowSignature = signature;
  layer.replaceChildren();
  for (const [from, to] of shadows) {
    const source = places[from];
    const target = places[to];
    const node = document.createElement("div");
    node.className = "cast-shadow";
    node.style.left = (source.x - 1.2) + "%";
    node.style.top = (target.y + .32) + "%";
    node.style.width = (target.x - source.x + 8.1) + "%";
    layer.append(node);
  }
}

function tutorialStep() {
  if (!level.tutorial || result !== "playing") return null;
  const cell = positions[0];
  if (cell === spot("w0")) return {
    number: 2,
    target: spot("t0"),
    text: "选中绣球，点桌面上亮起的金边端口。只有这一对端口能从窗沿下到桌面。"
  };
  if (places[cell].row === "w") return {
    number: 1,
    target: spot("w0"),
    text: "先点窗沿上的绣球，再挪到最左边的金边花垫。普通花垫不能下桌。"
  };
  return {
    number: 3,
    target: spot("t1"),
    text: "蓝色浅水盘就是水源。把绣球挪到它左边，隔一格就不算挨着。"
  };
}

function drawGuide(step, targets, water) {
  const lesson = byId("lesson");
  lesson.hidden = !level.tutorial;
  if (level.tutorial) {
    byId("lessonStep").textContent = step ? `第 ${step.number} / 3 步` : result === "won" ? "学会啦" : "再试试";
    const copy = byId("lessonText");
    const text = step?.text ?? (result === "won" ? "以后遇到金边花垫，也可以沿虚线在两个台面之间换位。" : "要先到金边端口，再下到桌面。可以撤回一步，或重新来过。");
    if (copy.textContent !== text) copy.textContent = text;
  }
  const route = byId("route");
  const path = step ? level.transferLinks[0] : level.transferLinks.find(pair =>
    selected >= 0 && pair.includes(positions[selected]) && pair.some(cell => targets.has(cell))
  );
  route.hidden = !path;
  if (path) {
    const [a, b] = path.map(cell => places[cell]);
    const dx = b.x - a.x;
    const dy = (b.y - a.y) * 9 / 16;
    route.style.left = a.x + "%";
    route.style.top = a.y + "%";
    route.style.width = Math.hypot(dx, dy) + "%";
    route.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
  }
  const label = byId("waterLabel");
  label.hidden = water < 0;
  if (water >= 0) {
    label.style.left = places[water].x + "%";
    label.style.top = (places[water].y + 2) + "%";
  }
}

function render() {
  const playing = result === "playing";
  const env = environment(level, positions);
  const targets = new Set(playing ? destinations(level, positions, selected) : []);
  const step = tutorialStep();
  let ready = 0;
  let count = 0;
  for (const [index, actor] of level.actors.entries()) {
    const cell = positions[index];
    const { button, bubble, badges } = pieces[index];
    const { item: wish, checks } = wishes[index];
    const satisfied = checks.map(({ rule }) => meets(level, env, cell, rule));
    const plant = checks.length > 0;
    const happy = plant && satisfied.every(Boolean);
    if (plant) count++;
    if (happy) ready++;
    const isSelected = playing && selected === index;
    const parts = checks.map(({ rule }, i) => `${wishText[rule][1]}${satisfied[i] ? "已满足" : "未满足"}`);
    button.setAttribute("aria-label", [actor.name, slotName(cell), ...parts].join("，"));
    button.setAttribute("aria-pressed", String(isSelected));
    button.classList.toggle("ready", happy);
    button.classList.toggle("selected", isSelected);
    button.classList.toggle("shaded", Boolean(env.shade & bit(cell)));
    if (badges.length) badges.forEach((badge, i) => badge.classList.toggle("met", satisfied[i]));
    else bubble.textContent = happy ? "✓" : "·";
    moveObject(button, cell, actor.width);
    wish.setAttribute("aria-label", [actor.name, ...parts].join("，"));
    wish.classList.toggle("current", isSelected);
    wish.classList.toggle("complete", happy);
    for (const [i, { line, icon, rule }] of checks.entries()) {
      line.classList.toggle("met", satisfied[i]);
      icon.textContent = satisfied[i] ? "✓" : wishText[rule][0];
    }
  }
  for (const [cell, node] of slots.entries()) {
    if (!node) continue;
    const occupant = positions.indexOf(cell);
    node.classList.toggle("shaded", Boolean(env.shade & bit(cell)));
    node.classList.toggle("sunlit", Boolean(env.sun & bit(cell)));
    node.classList.toggle("target", targets.has(cell));
    node.classList.toggle("coached", step?.target === cell);
    node.classList.toggle("hinted", hinted === cell);
    node.classList.toggle("selected", playing && occupant >= 0 && occupant === selected);
    if (!level.fixtures.has(cell)) {
      node.tabIndex = occupant >= 0 ? -1 : 0;
      node.setAttribute("aria-label", [
        slotName(cell), occupant >= 0 && level.actors[occupant].name,
        level.transfers.has(cell) && "金边端口，可换台面", targets.has(cell) && "可以移动到这里"
      ].filter(Boolean).join("，"));
    }
  }
  drawGuide(step, targets, env.water);
  drawShadows(env.shadows);
  const left = level.limit - history.length;
  byId("ready").textContent = `${ready} / ${count}`;
  byId("ready").setAttribute("aria-label", `已满足 ${ready} 盆，共 ${count} 盆`);
  byId("remaining").textContent = left;
  byId("meter").classList.toggle("low", left < 3 && result !== "won");
  byId("undo").disabled = history.length === 0;
  byId("hint").disabled = !playing;
  byId("next").hidden = playing;
  byId("next").textContent = nextLabel();
  return ready === count;
}

function pick(actor, audible = true) {
  if (result !== "playing") return;
  selected = actor;
  hinted = -1;
  if (actor >= 0 && audible) playSound("choose");
  if (actor < 0) message(baseHelp);
  else {
    const name = level.actors[actor].name;
    const options = destinations(level, positions, actor);
    message(options.length ? `${name}可以挪到亮起的花垫。` : `${name}的路被挡住了，先挪开旁边的花盆。`);
  }
  render();
}
function blocked(from, to) {
  const a = places[from]?.row;
  const b = places[to]?.row;
  const crossedSurface = a && b && a !== b && !(["t", "f"].includes(a) && ["t", "f"].includes(b));
  message(crossedSurface
    ? "这里不能直接换台面。先挪到金边端口，再点另一头亮起的金边花垫。"
    : "同一排可以直线挪动，前后排要对齐。花盆和水盘会挡住路。", true);
  playSound("bump");
}
function move(actor, target) {
  if (result !== "playing" || actor < 0 || target === positions[actor]) return;
  if (!destinations(level, positions, actor).includes(target)) {
    blocked(positions[actor], target);
    return;
  }
  history.push({ actor, from: positions[actor] });
  positions[actor] = target;
  selected = actor;
  hinted = -1;
  message(baseHelp);
  if (render()) finish(true);
  else if (history.length === level.limit) finish(false);
  else {
    playSound("slide");
    pieces[actor].button.focus({ preventScroll: true });
  }
}

function hint() {
  if (result !== "playing") return;
  const answer = solve(level, positions, level.limit - history.length);
  if (!answer) {
    hinted = -1;
    render();
    message("剩下的步数已经走不到目标，可以先撤回或重开。", true);
    return;
  }
  selected = answer.actor;
  hinted = answer.target;
  render();
  message(`把${level.actors[answer.actor].name}挪到${slotName(answer.target)}。`, true);
}
function undo() {
  if (history.length === 0) return;
  curtain(false);
  const { actor, from } = history.pop();
  positions[actor] = from;
  result = "playing";
  selected = actor;
  hinted = -1;
  render();
  message("已撤回上一步。");
  playSound("undo");
}
function finish(won) {
  result = won ? "won" : "failed";
  selected = hinted = -1;
  if (won && (!scores[current] || history.length < scores[current])) {
    scores[current] = history.length;
    try {
      const best = Object.fromEntries(levels.map((entry, index) => [entry.id, scores[index]]));
      localStorage.setItem(scoreKey, JSON.stringify(best));
    } catch {}
  }
  progress();
  render();
  byId("resultTitle").textContent = won ? "每盆花都安顿好了" : "步数用完啦";
  byId("resultStars").innerHTML = won ? starsBadge(starsFor(level, history.length)) : "";
  byId("resultNote").textContent = won
    ? `本次 ${history.length} 步 · 本关最佳 ${scores[current]} 步`
    : "还有心愿没满足。可以撤回一步，或重新来过。";
  byId("resultNext").textContent = nextLabel();
  byId("resultAside").textContent = won ? "看看这间花房" : "撤回一步";
  curtain(true);
  byId("resultNext").focus({ preventScroll: true });
  playSound(won ? "win" : "fail");
}
function advance() {
  if (result === "failed") loadLevel(current);
  else if (current < levels.length - 1) loadLevel(current + 1);
  else {
    curtain(false);
    openJournal();
    return;
  }
  focusWorld();
}
function viewRoom() {
  curtain(false);
  byId("next").focus({ preventScroll: true });
}

function openJournal() {
  if (journal.open || !byId("result").hidden) return;
  journal.showModal();
  byId("journalClose").focus();
  playSound("choose");
}

world.addEventListener("click", event => {
  if (ignoreClick || result !== "playing") return;
  const plant = event.target.closest("[data-piece]");
  const slot = event.target.closest("[data-slot]");
  if (plant) {
    const index = Number(plant.dataset.piece);
    pick(selected === index ? -1 : index);
  } else if (slot && selected >= 0) move(selected, Number(slot.dataset.slot));
});

world.addEventListener("pointerdown", event => {
  ignoreClick = false;
  const plant = event.target.closest("[data-piece]");
  if (!plant || result !== "playing" || !event.isPrimary || event.button !== 0) return;
  gesture = { id: event.pointerId, actor: Number(plant.dataset.piece), plant, x: event.clientX, y: event.clientY, dragging: false };
});
window.addEventListener("pointermove", event => {
  if (gesture?.id !== event.pointerId) return;
  const dx = event.clientX - gesture.x;
  const dy = event.clientY - gesture.y;
  if (!gesture.dragging) {
    if (Math.hypot(dx, dy) < 10) return;
    gesture.dragging = true;
    pick(gesture.actor, false);
    gesture.plant.classList.add("dragging");
  }
  gesture.plant.style.setProperty("--dx", dx + "px");
  gesture.plant.style.setProperty("--dy", dy + "px");
});
function releaseGesture(event, canceled = false) {
  if (gesture?.id !== event.pointerId) return;
  const { plant, actor, dragging } = gesture;
  gesture = undefined;
  if (!dragging) return;
  plant.classList.remove("dragging");
  ignoreClick = true;
  setTimeout(() => { ignoreClick = false; }, 0);
  if (canceled) return;
  const plantBox = plant.getBoundingClientRect();
  // The point closest to the base follows the pot, even when it was grabbed by a flower.
  const baseX = plantBox.left + plantBox.width / 2 + parseFloat(plant.style.getPropertyValue("--dx") || "0");
  const baseY = plantBox.bottom + parseFloat(plant.style.getPropertyValue("--dy") || "0");
  let best = 1.28;
  let target = -1;
  const findSpot = (x, y) => {
    for (const [cell, slot] of slots.entries()) {
      if (!slot || cell === positions[actor] || level.fixtures.has(cell)) continue;
      const box = slot.getBoundingClientRect();
      const distance = Math.hypot(
        (x - box.left - box.width / 2) / (box.width / 2 + 8),
        (y - box.top - box.height / 2) / (box.height / 2 + 12)
      );
      if (distance < best) {
        best = distance;
        target = cell;
      }
    }
  };
  findSpot(baseX, baseY);
  if (target < 0) findSpot(event.clientX, event.clientY);
  if (target >= 0) move(actor, target);
  else message("把花盆放到亮起的花垫上。", true);
}
window.addEventListener("pointerup", event => releaseGesture(event));
window.addEventListener("pointercancel", event => releaseGesture(event, true));

byId("undo").addEventListener("click", undo);
byId("restart").addEventListener("click", () => loadLevel(current));
byId("hint").addEventListener("click", hint);
byId("next").addEventListener("click", advance);
byId("resultNext").addEventListener("click", advance);
byId("journalToggle").addEventListener("click", openJournal);
byId("journalClose").addEventListener("click", () => journal.close());
byId("resultAside").addEventListener("click", () => {
  if (result === "failed") {
    undo();
    pieces[selected].button.focus({ preventScroll: true });
  } else viewRoom();
});
byId("soundToggle").addEventListener("click", () => {
  audioEnabled = !audioEnabled;
  try { localStorage.setItem(audioKey, audioEnabled ? "on" : "off"); } catch {}
  audioButton();
  if (audioEnabled) playSound("choose");
});
document.addEventListener("keydown", event => {
  if (journal.open) return;
  if (event.ctrlKey || event.altKey || event.metaKey) return;
  if (!byId("result").hidden) {
    if (event.key === "Escape") viewRoom();
    if (event.key === "Tab") {
      event.preventDefault();
      const next = document.activeElement === byId("resultNext") ? "resultAside" : "resultNext";
      byId(next).focus();
    }
    return;
  }
  const key = event.key.toLowerCase();
  if (key === "escape") pick(-1);
  if (key === "h") hint();
  if (key === "r") loadLevel(current);
  if (key === "z") undo();
});
byId("brandArt").append(sprite("daisy", true));
audioButton();
loadLevel(scores[0] ? 1 : 0);
