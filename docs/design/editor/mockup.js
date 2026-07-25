"use strict";
/* svsw editor mockup (M00). In-memory state only; no engine, no network.
   The one non-obvious mechanism is the fake world hash; see worldHash(). */

/* ---------- deterministic fake hash ----------
   The displayed hash must behave like the engine's world hash: same inputs,
   same hash. It derives from exactly two integers: the tick number and the
   count of world-mutating commands logged at or before that tick. Count-at-
   tick, not total log length, so scrubbing back to tick N reproduces tick N's
   historical hash after later commands were logged. View/sim commands
   (select, scrub_to, step_tick, toggles) are logged but excluded from the
   count: a scrub must not perturb the hash it revisits. */
function mix32(x) {
  x ^= x >>> 16; x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15; x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16; return x >>> 0;
}
function hex8(x) { return x.toString(16).padStart(8, "0"); }
function worldHash(tick, cmds) {
  const a = mix32(tick ^ Math.imul(cmds, 0x9e3779b1));
  const b = mix32(cmds ^ Math.imul(tick, 0x85ebca6b) ^ 0x27d4eb2f);
  return hex8(a) + hex8(b);
}
function chunkHash(cx, cy, tick, cmds) {
  return hex8(mix32(Math.imul(cx, 73856093) ^ Math.imul(cy, 19349663) ^
                    mix32(tick ^ Math.imul(cmds, 0x9e3779b1))));
}

/* ---------- state ---------- */
const UNIT = 44; // px per world unit; mirrors --unit in style.css

const state = {
  tick: 0,
  maxTick: 0,
  playing: false,
  running: false,  // play-in-editor Session booted
  pinned: false,   // run target frozen
  wireframe: false,
  selected: null,
  gizmo: "select",
  chunks: false,
  split: false,
  commands: [],
  simStep: -1,     // -1 = idle; otherwise index of the last system run this tick
  nextCrate: 4,
  demo: false,
  doc: "scene",
  docs: [{ id: "scene", label: "Scene", closable: false }],
  mods: { base: true, sample_tweaks: true, extra_props: true },
};
const undoStack = [];
let undoCursor = 0;
let cmdSeq = 0;
let playTimer = null;

const entityDefs = {
  platform_01: { group: "environment", box: [6, 6, 0.3], color: "#454c56",
    t: { x: 0, y: 0, z: 0 },
    components: { Render: { mesh: "meshes/platform.mesh", material: "materials/ground.mat" },
                  Collider: { shape: "aabb", half_extents: "3.0, 3.0, 0.15" } } },
  lamp_post: { group: "environment", box: [0.18, 0.18, 1.3], color: "#6e705f", light: true,
    t: { x: 1.6, y: 1.6, z: 0.3 },
    components: { Render: { mesh: "meshes/lamp_post.mesh", material: "materials/crate.mat" },
                  Light: { color: "#ffd9a0", intensity: "2.4", radius: "6.0" },
                  Collider: { shape: "aabb", half_extents: "0.09, 0.09, 0.65" } } },
  crate_01: { group: "props", box: [0.8, 0.8, 0.8], color: "#8a6d46",
    t: { x: -1.4, y: -0.6, z: 0.3 },
    components: { Render: { mesh: "meshes/cube.mesh", material: "materials/crate.mat" },
                  Collider: { shape: "aabb", half_extents: "0.4, 0.4, 0.4" } } },
  crate_02: { group: "props", box: [0.8, 0.8, 0.8], color: "#97794e",
    t: { x: 0.4, y: -1.2, z: 0.3 },
    components: { Render: { mesh: "meshes/cube.mesh", material: "materials/crate.mat" },
                  Collider: { shape: "aabb", half_extents: "0.4, 0.4, 0.4" } } },
  crate_03: { group: "props", box: [0.7, 0.7, 0.7], color: "#7d6240",
    t: { x: -0.3, y: 1.2, z: 0.3 },
    components: { Render: { mesh: "meshes/cube.mesh", material: "materials/crate.mat" },
                  Collider: { shape: "aabb", half_extents: "0.35, 0.35, 0.35" } } },
  spawn_point: { group: "markers", marker: true,
    t: { x: -1.8, y: 1.8, z: 0.3 },
    components: { Tag: { value: "spawn_point" } } },
};
const treeGroups = [
  { name: "environment", children: ["platform_01", "lamp_post"] },
  { name: "props", children: ["crate_01", "crate_02", "crate_03"] },
  { name: "markers", children: ["spawn_point"] },
];

const systems = [
  { name: "input_system", diff: t => [
      "input_snapshot.buttons  0x0000 → 0x0000  (no device input)",
      "intent_queue.len  0 → 0"] },
  { name: "movement_system", diff: t => [
      `crate_02.transform.x  ${(3.0 + (t % 40) * 0.003).toFixed(3)} → ${(3.0 + (t % 40 + 1) * 0.003).toFixed(3)}`,
      "crate_02.velocity.x  0.250 → 0.250"] },
  { name: "physics_system", diff: t => [
      "crate_02.velocity.z  -0.020 → 0.000  (resting contact)",
      "contact_pairs  4 → 4"] },
  { name: "script_systems", diff: t => [
      "storage.crate_count  3 → 3",
      `lamp_post.light.phase  ${((t % 100) / 100).toFixed(2)} → ${(((t + 1) % 100) / 100).toFixed(2)}`] },
  { name: "render_extract", diff: t => [
      "draw_list: 7 draws, 1 light  (reads sim state, mutates nothing)"] },
];

const luaSource = [
  "-- crates.luau (mod: sample_tweaks, control stage)",
  'local speed = settings.get("crate_drift_speed")',
  "",
  "local function drift(e, dt)",
  "  local t = e.transform",
  "  t.x = t.x + speed * dt",
  "  if t.x > 6.0 then t.x = -6.0 end",
  "end",
  "",
  "svsw.on_tick(function(tick)",
  '  for _, e in svsw.query("crate") do',
  "    drift(e, svsw.dt)",
  "  end",
  "  if tick % 60 == 0 then",
  '    svsw.log("crates: " .. svsw.count("crate"))',
  "  end",
  "end)",
];

/* ---------- project files (the script IDE surface) ---------- */
const CRATES = "mods/sample_tweaks/crates.luau";

const fileDefs = {
  "mods/base/settings.luau": { lang: "lua", size: "0.3 KB", src: [
    "-- base settings (settings stage)",
    "svsw.setting.declare {",
    '  name = "crate_drift_speed",',
    '  type = "double",',
    "  default = 0.25,",
    "  min = 0.0, max = 2.0,",
    "}",
  ] },
  "mods/base/data.luau": { lang: "lua", size: "0.5 KB", src: [
    "-- base prototypes (data stage)",
    "svsw.data.extend {",
    '  { type = "entity", name = "crate", mesh = "meshes/cube.mesh" },',
    '  { type = "entity", name = "lamp", mesh = "meshes/lamp_post.mesh" },',
    '  { type = "tile", name = "ground", texture = "textures/ground_tiles.png" },',
    "}",
  ] },
  "mods/base/control.luau": { lang: "lua", size: "0.4 KB", src: [
    "-- base control (control stage)",
    "svsw.on_init(function()",
    '  svsw.storage.crate_count = svsw.count("crate")',
    "end)",
    "",
    "svsw.on_tick(function(tick)",
    "  if tick % 600 == 0 then",
    '    svsw.log("autosave checkpoint")',
    "  end",
    "end)",
  ] },
  "mods/sample_tweaks/settings.luau": { lang: "lua", size: "0.2 KB", src: [
    "-- sample_tweaks settings (settings stage)",
    "svsw.setting.override {",
    '  name = "crate_drift_speed",',
    "  default = 0.25,",
    "}",
  ] },
  "mods/sample_tweaks/data.luau": { lang: "lua", size: "0.4 KB", src: [
    "-- sample_tweaks data patches (data stage)",
    'local crate = svsw.data.get("entity", "crate")',
    'crate.material = "materials/crate.mat"',
    "",
    "svsw.data.extend {",
    '  { type = "tile", name = "ground_worn", texture = "textures/ground_tiles.png" },',
    "}",
  ] },
  [CRATES]: { lang: "lua", size: "0.6 KB", src: luaSource },
  "mods/extra_props/data.luau": { lang: "lua", size: "0.3 KB", src: [
    "-- extra_props prototypes (data stage)",
    "svsw.data.extend {",
    '  { type = "entity", name = "barrel", mesh = "meshes/cube.mesh" },',
    '  { type = "entity", name = "pallet", mesh = "meshes/platform.mesh" },',
    "}",
  ] },
  "engine/systems/movement_system.odin": { lang: "odin", size: "1.1 KB", src: [
    "package systems",
    "",
    'import "engine:ecs"',
    "",
    "// movement integrates velocity into transform; fixed dt (D11)",
    "movement_system :: proc(w: ^ecs.World, dt: f32) {",
    "  for &e in ecs.query(w, ecs.Transform, ecs.Velocity) {",
    "    t := ecs.get(&e, ecs.Transform)",
    "    v := ecs.get(&e, ecs.Velocity)",
    "    t.x += v.x * dt",
    "    t.y += v.y * dt",
    "  }",
    "}",
  ] },
  "engine/simmath3d/vec3.odin": { lang: "odin", size: "0.7 KB", src: [
    "package simmath3d",
    "",
    "Vec3 :: struct { x, y, z: f32 }",
    "",
    "add :: proc(a, b: Vec3) -> Vec3 {",
    "  return Vec3{a.x + b.x, a.y + b.y, a.z + b.z}",
    "}",
    "",
    "scale :: proc(v: Vec3, s: f32) -> Vec3 {",
    "  return Vec3{v.x * s, v.y * s, v.z * s}",
    "}",
  ] },
  "server/gateway.go": { lang: "go", size: "1.4 KB", src: [
    "package main",
    "",
    'import "net"',
    "",
    "// gateway accepts client sessions and relays tick commands",
    "func main() {",
    '  ln, err := net.Listen("tcp", ":7777")',
    "  if err != nil {",
    "    panic(err)",
    "  }",
    "  for {",
    "    conn, _ := ln.Accept()",
    "    go handleSession(conn)",
    "  }",
    "}",
  ] },
  "server/protocol/frames.go": { lang: "go", size: "0.8 KB", src: [
    "package protocol",
    "",
    "// frame envelope: kind, tick, payload length",
    "type Frame struct {",
    "  Kind   uint8",
    "  Tick   uint64",
    "  Length uint32",
    "}",
    "",
    "const (",
    "  KindCommand uint8 = 1",
    "  KindHash    uint8 = 2",
    ")",
  ] },
};

/* per-file IDE state: breakpoints, dirty flag, rendered views */
const fileState = {};
function getFileState(path) {
  return fileState[path] || (fileState[path] = { bp: new Set(), dirty: false, views: [] });
}

/* ---------- fake syntax highlighting (mockup fidelity, not a parser) ---------- */
const langTokens = {
  lua: /\b(local|function|end|if|then|elseif|else|for|in|do|return|not|and|or|nil|true|false|while|break)\b/g,
  odin: /\b(package|import|proc|struct|return|if|else|for|in|defer|switch|case|break|continue|using|when|f32|true|false|nil)\b/g,
  go: /\b(package|import|func|type|struct|return|if|else|for|range|defer|switch|case|break|continue|go|chan|select|var|const|uint8|uint32|uint64|true|false|nil)\b/g,
};

function highlightLine(text, lang) {
  const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const cm = lang === "lua" ? "--" : "//";
  const ci = text.indexOf(cm);
  let code = text, tail = "";
  if (ci !== -1) { code = text.slice(0, ci); tail = `<span class="tok-c">${esc(text.slice(ci))}</span>`; }
  const html = esc(code)
    .replace(/("[^"]*")/g, '<span class="tok-s">$1</span>')
    .replace(langTokens[lang], '<span class="tok-k">$&</span>')
    .replace(/(^|[^\w"])(\d+(?:\.\d+)?)\b/g, '$1<span class="tok-n">$2</span>');
  return (html + tail) || " ";
}

/* ---------- dom ---------- */
const $ = id => document.getElementById(id);
const worlds = Array.from(document.querySelectorAll(".world"));
const entityEls = {};   // name -> [element per world]
const treeRows = {};    // name -> tree row element
let lampHalo = null;

function el(cls, parent, text) {
  const e = document.createElement("div");
  e.className = cls;
  if (text !== undefined) e.textContent = text;
  if (parent) parent.appendChild(e);
  return e;
}

/* ---------- CSS 3D scene ---------- */
function addFace(box, w, h, transform, shade, color) {
  const f = el("face " + shade, box);
  f.style.width = w + "px";
  f.style.height = h + "px";
  f.style.transform = "translate(-50%,-50%) " + transform;
  f.style.background = color;
}

function makeBox(def) {
  const W = def.box[0] * UNIT, D = def.box[1] * UNIT, H = def.box[2] * UNIT;
  const box = el("box");
  box.style.width = W + "px";
  box.style.height = D + "px";
  const c = def.color;
  addFace(box, W, D, `translateZ(${H / 2}px)`, "top", c);
  addFace(box, H, D, `rotateY(90deg) translateZ(${W / 2}px)`, "side-a", c);
  addFace(box, H, D, `rotateY(-90deg) translateZ(${W / 2}px)`, "side-b", c);
  addFace(box, W, H, `rotateX(90deg) translateZ(${D / 2}px)`, "side-b", c);
  addFace(box, W, H, `rotateX(-90deg) translateZ(${D / 2}px)`, "side-a", c);
  return box;
}

function boxTransform(def) {
  const W = def.box[0] * UNIT, D = def.box[1] * UNIT, H = def.box[2] * UNIT;
  const px = def.t.x * UNIT, py = def.t.y * UNIT;
  return `translate3d(${px - W / 2}px, ${py - D / 2}px, ${def.t.z * UNIT + H / 2}px)`;
}

function addEntityToWorlds(name) {
  const def = entityDefs[name];
  entityEls[name] = worlds.map((world, i) => {
    let node;
    if (def.marker) {
      node = el("marker");
    } else {
      node = makeBox(def);
    }
    node.addEventListener("pointerdown", () => selectEntity(name));
    world.appendChild(node);
    if (def.light && i === 0) {
      lampHalo = el("light-halo", world);
    }
    return node;
  });
  syncTransform(name);
}

function syncTransform(name) {
  const def = entityDefs[name];
  if (!entityEls[name]) return;
  entityEls[name].forEach(node => {
    if (def.marker) {
      const px = def.t.x * UNIT, py = def.t.y * UNIT;
      node.style.transform = `translate3d(${px}px, ${py}px, ${def.t.z * UNIT + 2}px)`;
    } else {
      node.style.transform = boxTransform(def);
    }
  });
  if (def.light && lampHalo) {
    const px = def.t.x * UNIT, py = def.t.y * UNIT;
    const top = (def.t.z + def.box[2]) * UNIT + 16;
    // counter-rotate the halo so it faces the perspective camera
    lampHalo.style.transform =
      `translate3d(${px - 13}px, ${py - 13}px, ${top}px) rotateZ(-45deg) rotateX(-58deg)`;
  }
}

function removeEntity(name) {
  const order = Object.keys(treeRows);
  const i = order.indexOf(name);
  const sibling = order[i + 1] || order[i - 1] || null; // nearest tree neighbour, not the first dict key
  (entityEls[name] || []).forEach(n => n.remove());
  delete entityEls[name];
  if (entityDefs[name] && entityDefs[name].light && lampHalo) { lampHalo.remove(); lampHalo = null; }
  if (treeRows[name]) { treeRows[name].remove(); delete treeRows[name]; }
  if (state.selected === name) applySelect(sibling);
}

function buildWorlds() {
  worlds.forEach(world => {
    el("floor", world);
    el("chunkgrid", world);
  });
  Object.keys(entityDefs).forEach(addEntityToWorlds);
}

/* ---------- scene tree ---------- */
function treeItem(row) {
  row.setAttribute("role", "treeitem");
  row.tabIndex = 0;
  return row;
}

function addTreeEntity(groupName, name) {
  const holder = document.querySelector(`[data-group="${groupName}"]`);
  const def = entityDefs[name];
  const row = treeItem(el("tree-row", holder));
  row.setAttribute("aria-selected", "false");
  row.style.paddingLeft = "26px";
  el("tree-icon", row, def.marker ? "⊕" : def.light ? "◆" : "▢");
  el("tree-name", row, name);
  row.addEventListener("click", () => selectEntity(name));
  treeRows[name] = row;
}

function buildTree() {
  const root = $("scene-tree");
  root.setAttribute("role", "tree");
  const rootRow = treeItem(el("tree-row tree-group", root));
  el("tree-arrow", rootRow, "▾");
  el("tree-name", rootRow, "scene_root  (sandbox_01)");
  treeGroups.forEach(g => {
    const gRow = treeItem(el("tree-row tree-group", root));
    gRow.setAttribute("aria-expanded", "true");
    gRow.style.paddingLeft = "14px";
    const arrow = el("tree-arrow", gRow, "▾");
    el("tree-name", gRow, g.name);
    const holder = el("tree-children", root);
    holder.dataset.group = g.name;
    gRow.addEventListener("click", () => {
      const collapsed = holder.classList.toggle("collapsed");
      arrow.textContent = collapsed ? "▸" : "▾";
      gRow.setAttribute("aria-expanded", String(!collapsed));
    });
    g.children.forEach(name => addTreeEntity(g.name, name));
  });
}

/* shared tree keyboard semantics: arrows move / expand / collapse,
   Enter = click + the row's double-click action, Space = click */
function initTreeKeys(root) {
  root.addEventListener("keydown", e => {
    const row = e.target.closest(".tree-row, .file-row");
    if (!row) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      row.click();
      if (e.key === "Enter") row.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const rows = [...root.querySelectorAll(".tree-row, .file-row")]
        .filter(r => r.offsetParent !== null);
      const next = rows[rows.indexOf(row) + (e.key === "ArrowDown" ? 1 : -1)];
      if (next) next.focus();
    } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      const holder = row.nextElementSibling;
      if (!holder || !holder.classList.contains("tree-children")) return;
      const collapsed = holder.classList.contains("collapsed");
      if (e.key === "ArrowRight" ? collapsed : !collapsed) { e.preventDefault(); row.click(); }
    }
  });
}

/* ---------- inspector ---------- */
function fieldRow(parent, label, value) {
  const row = el("comp-row", parent);
  const lab = document.createElement("label");
  lab.textContent = label;
  row.appendChild(lab);
  const input = document.createElement("input");
  input.value = value;
  row.appendChild(input);
  return input;
}

function buildInspector(name) {
  const def = name ? entityDefs[name] : null;
  const body = $("inspector-body");
  body.textContent = "";
  if (!def) { el("insp-empty", body, "no selection"); return; }
  const head = el("insp-entity", body);
  head.textContent = name;
  const g = document.createElement("span");
  g.className = "insp-group";
  g.textContent = def.group;
  head.appendChild(g);

  const tHead = el("comp-head", body, "Transform");
  el("comp-tag", tHead, "base").className = "comp-tag";
  const posRow = el("comp-row pos", body);
  const lab = document.createElement("label");
  lab.textContent = "position";
  posRow.appendChild(lab);
  const xyz = el("xyz", posRow);
  ["x", "y", "z"].forEach(axis => {
    const cell = el("axis", xyz);
    const s = document.createElement("span");
    s.textContent = axis;
    cell.appendChild(s);
    const input = document.createElement("input");
    input.type = "number";
    input.step = "0.1";
    input.value = def.t[axis].toFixed(2);
    input.addEventListener("change", () => {
      const to = parseFloat(input.value);
      const from = def.t[axis];
      if (Number.isNaN(to) || to === from) { input.value = from.toFixed(2); return; }
      editTransform(name, axis, from, to);
      input.value = to.toFixed(2);
    });
    cell.appendChild(input);
  });
  fieldRow(body, "rotation z", "0.00");
  fieldRow(body, "scale", "1.00, 1.00, 1.00");

  Object.entries(def.components).forEach(([comp, fields]) => {
    const h = el("comp-head", body, comp);
    el("comp-tag", h, "base").className = "comp-tag";
    Object.entries(fields).forEach(([k, v]) => fieldRow(body, k, v));
  });
}

function refreshInspectorIfSelected(name) {
  if (state.selected === name) buildInspector(name);
}

/* ---------- selection ---------- */
function applySelect(name) {
  if (name && (!entityDefs[name] || !entityEls[name])) name = Object.keys(entityEls)[0] || null;
  state.selected = name;
  Object.entries(entityEls).forEach(([n, nodes]) =>
    nodes.forEach(node => node.classList.toggle("selected", n === name)));
  Object.entries(treeRows).forEach(([n, row]) => {
    row.classList.toggle("selected", n === name);
    row.setAttribute("aria-selected", String(n === name));
  });
  buildInspector(name);
}

function selectEntity(name) {
  if (state.selected === name) return;
  const prev = state.selected;
  applySelect(name);
  setRunTarget("scene: sandbox_01");
  pushCmd("select", `{entity="${name}", prev="${prev}"}`, {
    undo: () => applySelect(prev),
    redo: () => applySelect(name),
  });
}

/* ---------- commands, undo/redo (D71: undo walks the log, appends nothing) ---------- */
function cmdCountAtTick(tick) {
  let n = 0;
  for (const c of state.commands) if (c.world && !c.undone && c.tick <= tick) n++;
  return n;
}

function renderCmdRow(c) {
  const row = el("cmd-row", $("cmd-lines"));
  el("cmd-id", row, "#" + String(c.id).padStart(4, "0"));
  el("cmd-tick", row, "t" + String(c.tick).padStart(4, "0"));
  el("cmd-type", row, c.type);
  el("cmd-args", row, c.args);
  c.el = row;
  const panel = $("tab-cmdlog");
  panel.scrollTop = panel.scrollHeight;
}

function pushCmd(type, args, opts = {}) {
  const c = { id: ++cmdSeq, tick: state.tick, type, args,
              world: !!opts.world, undo: opts.undo || null, redo: opts.redo || null,
              undone: false, el: null };
  state.commands.push(c);
  if (c.undo) {
    undoStack.length = undoCursor; // a new edit drops the redo branch
    undoStack.push(c);
    undoCursor = undoStack.length;
  }
  renderCmdRow(c);
  updateAll();
  return c;
}

function undo() {
  if (undoCursor === 0) return;
  const c = undoStack[--undoCursor];
  c.undo();
  c.undone = true;
  if (c.el) c.el.classList.add("undone");
  updateAll();
}

function redo() {
  if (undoCursor >= undoStack.length) return;
  const c = undoStack[undoCursor++];
  (c.redo || c.undo)();
  c.undone = false;
  if (c.el) c.el.classList.remove("undone");
  updateAll();
}

/* ---------- edits ---------- */
function editTransform(name, axis, from, to) {
  const t = entityDefs[name].t;
  t[axis] = to;
  syncTransform(name);
  pushCmd("set_transform", `{entity="${name}", ${axis}: ${from.toFixed(2)} -> ${to.toFixed(2)}}`, {
    world: true,
    undo: () => { t[axis] = from; syncTransform(name); refreshInspectorIfSelected(name); },
    redo: () => { t[axis] = to; syncTransform(name); refreshInspectorIfSelected(name); },
  });
}

function spawnCrate() {
  const name = "crate_" + String(state.nextCrate++).padStart(2, "0");
  const n = state.nextCrate - 4;
  entityDefs[name] = { group: "props", box: [0.8, 0.8, 0.8], color: "#8f7248",
    t: { x: 1.4 + (n % 3) * 0.6, y: -2.1 + Math.floor(n / 3) * 0.9, z: 0.3 },
    components: { Render: { mesh: "meshes/cube.mesh", material: "materials/crate.mat" },
                  Collider: { shape: "aabb", half_extents: "0.4, 0.4, 0.4" } } };
  addEntityToWorlds(name);
  addTreeEntity("props", name);
  logConsole("ok", `entity ${name} spawned from prototype entity/crate`);
  pushCmd("spawn_entity", `{prototype="entity/crate", name="${name}"}`, {
    world: true,
    undo: () => removeEntity(name),
    redo: () => { addEntityToWorlds(name); addTreeEntity("props", name); },
  });
  return name;
}

function duplicateSelected() {
  const src = state.selected;
  if (!src) { toast("no entity selected"); return; }
  const name = src + "_copy";
  if (entityDefs[name]) { toast(name + " already exists"); return; }
  const copy = JSON.parse(JSON.stringify(entityDefs[src]));
  copy.t.x += 0.5;
  entityDefs[name] = copy;
  addEntityToWorlds(name);
  addTreeEntity(copy.group, name);
  applySelect(name);
  logConsole("ok", `entity ${name} duplicated from ${src}`);
  pushCmd("spawn_entity", `{duplicate_of="${src}", name="${name}"}`, {
    world: true,
    undo: () => removeEntity(name),
    redo: () => { addEntityToWorlds(name); addTreeEntity(copy.group, name); },
  });
}

function deleteSelected() {
  const name = state.selected;
  if (!name) { toast("no entity selected"); return; }
  if (!confirm(`delete entity ${name}? (Edit > Undo restores it)`)) return;
  const def = entityDefs[name];
  removeEntity(name);
  logConsole("info", `entity ${name} deleted`);
  pushCmd("delete_entity", `{name="${name}"}`, {
    world: true,
    undo: () => { addEntityToWorlds(name); addTreeEntity(def.group, name); },
    redo: () => removeEntity(name),
  });
}

/* ---------- sim controls ---------- */
function setTick(t) {
  state.tick = Math.max(0, t);
  state.maxTick = Math.max(state.maxTick, state.tick);
  updateAll();
}

function setPlaying(on) {
  if (state.playing === on) return;
  state.playing = on;
  if (on) playTimer = setInterval(() => setTick(state.tick + 1), 125);
  else { clearInterval(playTimer); playTimer = null; }
  updateAll();
}

/* ---------- run control + transport ---------- */
/* run-target changes driven by selection are logged and flashed so the
   side effect is noticed (the select sits far from the browser panels) */
function setRunTarget(label) {
  if (state.pinned) return;
  const sel = $("run-target");
  if (![...sel.options].some(o => o.value === label)) sel.add(new Option(label, label));
  if (sel.value === label) return;
  sel.value = label;
  pushCmd("set_run_target", `{target="${label}", via="selection"}`);
  sel.classList.add("flash");
  setTimeout(() => sel.classList.remove("flash"), 800);
}

function toggleRun() {
  state.running = !state.running;
  if (state.running) {
    pushCmd("run_session", `{target="${$("run-target").value}"}`);
    logConsole("ok", `session started: ${$("run-target").value}`);
    setPlaying(true);
  } else {
    setPlaying(false);
    pushCmd("stop_session", `{tick=${state.tick}}`);
    logConsole("info", `session stopped at tick ${state.tick}`);
  }
  updateAll();
}

function togglePause() {
  if (!state.running) return;
  const pausing = state.playing;
  setPlaying(!state.playing);
  pushCmd(pausing ? "pause" : "resume", "{}");
}

function stepForward() {
  state.simStep = -1;
  renderSysList();
  pushCmd("step_tick", "{}");
  setTick(state.tick + 1);
}

/* step back = exact replay to tick-1: the fake hash derives from (tick,
   world-command count at tick), so one tick less restores identically */
function stepBack() {
  if (state.tick === 0) return;
  state.simStep = -1;
  renderSysList();
  pushCmd("step_back", `{to_tick=${state.tick - 1}}`);
  setTick(state.tick - 1);
}

function stepSystem() {
  if (state.simStep < systems.length - 1) {
    state.simStep++;
    const sys = systems[state.simStep];
    pushCmd("step_system", `{system="${sys.name}"}`);
    showSimDiff(sys.diff(state.tick));
  } else {
    state.simStep = -1;
    pushCmd("step_system", `{commit_tick=${state.tick + 1}}`);
    setTick(state.tick + 1);
    showSimDiff([`tick ${state.tick} committed → hash ${worldHash(state.tick, cmdCountAtTick(state.tick)).slice(0, 8)}…`]);
  }
  renderSysList();
}

function showSimDiff(lines) {
  const box = $("sim-diff");
  box.textContent = "";
  lines.forEach(l => el("diff-line", box, l));
}

function renderSysList() {
  const list = $("sys-list");
  list.textContent = "";
  systems.forEach((sys, i) => {
    const row = el("sys-row" +
      (i < state.simStep ? " done" : i === state.simStep ? " current" : ""), list);
    el("sys-dot", row, i <= state.simStep ? "●" : "○");
    el("sys-name", row, sys.name);
  });
}

/* ---------- timeline ---------- */
let rulerW = 0, rulerWindow = 0;

function windowTicks() {
  return Math.max(240, Math.ceil((state.maxTick + 40) / 120) * 120);
}

function rebuildRuler() {
  const tl = $("timeline");
  const W = windowTicks();
  if (W === rulerWindow && tl.clientWidth === rulerW) return;
  rulerWindow = W;
  rulerW = tl.clientWidth;
  const ruler = $("ruler");
  ruler.textContent = "";
  let minor = 10;
  for (const s of [10, 20, 50, 100, 200]) { minor = s; if (rulerW / W * s >= 7) break; }
  const major = minor * 5;
  for (let t = 0; t <= W; t += minor) {
    const mark = el("tl-mark" + (t % major === 0 ? " major" : ""), ruler);
    mark.style.left = (t / W * rulerW) + "px";
    if (t % major === 0 && t > 0) {
      const lab = el("tl-label", ruler, String(t));
      lab.style.left = (t / W * rulerW) + "px";
    }
  }
}

function initTimeline() {
  const tl = $("timeline");
  let scrubbing = false;
  const tickAt = e => {
    const r = tl.getBoundingClientRect();
    const t = Math.round((e.clientX - r.left) / r.width * windowTicks());
    return Math.max(0, Math.min(state.maxTick, t));
  };
  tl.addEventListener("pointerdown", e => {
    scrubbing = true;
    tl.setPointerCapture(e.pointerId);
    state.tick = tickAt(e);
    updateAll();
  });
  tl.addEventListener("pointermove", e => {
    if (!scrubbing) return;
    state.tick = tickAt(e);
    updateAll();
  });
  tl.addEventListener("pointerup", e => {
    if (!scrubbing) return;
    scrubbing = false;
    pushCmd("scrub_to", `{tick=${state.tick}}`);
  });
}

/* ---------- chunk chips ---------- */
const chipDefs = [
  { cx: -1, cy: -1, left: "50%", top: "26%" },
  { cx: 0, cy: -1, left: "72%", top: "50%" },
  { cx: -1, cy: 0, left: "28%", top: "50%" },
  { cx: 0, cy: 0, left: "50%", top: "76%" },
];
let chipEls = [];

function buildChips() {
  const holder = $("chunk-chips");
  chipEls = chipDefs.map(c => {
    const chip = el("chip3", holder);
    chip.style.left = c.left;
    chip.style.top = c.top;
    return chip;
  });
}

function updateChips() {
  if (!state.chunks) return;
  const n = cmdCountAtTick(state.tick);
  chipDefs.forEach((c, i) => {
    chipEls[i].textContent = `(${c.cx},${c.cy}) ${chunkHash(c.cx, c.cy, state.tick, n)}`;
  });
}

/* ---------- console, profiler ---------- */
function logConsole(tag, text) {
  const row = el("log-line", $("console-lines"));
  el("log-tag" + (tag === "ok" ? " ok" : tag === "warn" ? " warn" : ""), row, tag);
  row.appendChild(document.createTextNode(text));
  const panel = $("tab-console");
  panel.scrollTop = panel.scrollHeight;
}

function updateProfiler() {
  document.querySelectorAll(".prof-row").forEach((row, i) => {
    const base = parseFloat(row.dataset.base);
    const j = (mix32(state.tick ^ (i + 1) * 7919) % 1000) / 1000;
    const ms = base * (0.85 + 0.3 * j);
    row.querySelector(".prof-bar").style.width = Math.min(100, ms / 2.4 * 100) + "%";
    row.querySelector(".prof-ms").textContent = ms.toFixed(2);
  });
}

/* ---------- status + global refresh ---------- */
function updateAll() {
  const n = cmdCountAtTick(state.tick);
  $("st-tick").textContent = "tick " + String(state.tick).padStart(5, "0");
  $("st-hash").textContent = worldHash(state.tick, n);
  $("watch-tick").textContent = String(state.tick);
  $("timeline-label").textContent =
    `tick ${state.tick} / ${state.maxTick}`;
  rebuildRuler();
  $("playhead").style.left = (state.tick / windowTicks() * rulerW) + "px";
  $("btn-run").textContent = state.running ? "■ stop" : "▶ run";
  $("btn-run").classList.toggle("active", state.running);
  $("st-session").textContent =
    state.running ? (state.playing ? "running" : "paused") : "stopped";
  $("st-session").classList.toggle("on", state.running);
  $("btn-pause").disabled = !state.running;
  $("btn-pause").textContent = state.running && !state.playing ? "▶ resume" : "⏸ pause";
  $("btn-back").disabled = state.tick === 0;
  $("btn-undo").disabled = undoCursor === 0;
  $("btn-redo").disabled = undoCursor >= undoStack.length;
  updateChips();
  updateProfiler();
}

/* ---------- tabs ---------- */
function activateTab(tabBtn) {
  const tabs = tabBtn.parentElement;
  tabs.querySelectorAll(":scope > .tab").forEach(t => {
    t.classList.toggle("active", t === tabBtn);
    t.setAttribute("aria-selected", String(t === tabBtn));
    const panel = $(t.dataset.panel);
    if (panel) panel.classList.toggle("active", t === tabBtn);
  });
}

function initTabs() {
  // trees double as tab panels; a role set by their builder (tree) wins
  document.querySelectorAll(".tab-panel:not([role])").forEach(p => p.setAttribute("role", "tabpanel"));
  document.querySelectorAll(".tabs").forEach(bar => {
    bar.setAttribute("role", "tablist");
    bar.addEventListener("keydown", e => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const tabs = [...bar.querySelectorAll(":scope > .tab")];
      const i = tabs.indexOf(e.target);
      if (i === -1) return;
      e.preventDefault();
      const next = tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
      next.focus();
      next.click();
    });
  });
  // doc tabs (no data-panel) manage themselves in renderDocTabs
  document.querySelectorAll(".tabs > .tab[data-panel]").forEach(tab => {
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-selected", String(tab.classList.contains("active")));
    tab.addEventListener("click", () => activateTab(tab));
  });
}

function focusDockTab(dockId, panelId) {
  applyPanel(dockId, false);
  activateTab(document.querySelector(`[data-panel="${panelId}"]`));
}

/* ---------- script rendering: one state per file, N synced views ----------
   Breakpoint toggles and the current line mutate row classes in place
   (no re-render), so contenteditable buffer edits survive them. */
let currentLine = 6; // crates.luau only; the call stack points here

function renderCode(path, holder, editable) {
  const def = fileDefs[path];
  const fs = getFileState(path);
  holder.textContent = "";
  def.src.forEach((text, i) => {
    const lineNo = i + 1;
    const row = el("code-line" +
      (path === CRATES && lineNo === currentLine ? " current" : "") +
      (fs.bp.has(lineNo) ? " bp" : ""), holder);
    const gut = el("gutter", row);
    el("lineno", row, String(lineNo));
    const code = el("code-text", row);
    code.innerHTML = highlightLine(text || " ", def.lang);
    if (editable) {
      code.contentEditable = "true";
      code.spellcheck = false;
    }
    gut.addEventListener("click", () => toggleBreakpoint(path, lineNo));
  });
  fs.views.push(holder);
}

function toggleBreakpoint(path, lineNo) {
  const fs = getFileState(path);
  const on = !fs.bp.has(lineNo);
  if (on) fs.bp.add(lineNo); else fs.bp.delete(lineNo);
  const file = path.split("/").pop();
  pushCmd(on ? "set_breakpoint" : "clear_breakpoint", `{file="${file}", line=${lineNo}}`);
  logConsole("info", `breakpoint ${on ? "set" : "cleared"} at ${file}:${lineNo}`);
  fs.views.forEach(v => v.children[lineNo - 1] && v.children[lineNo - 1].classList.toggle("bp", on));
  if (fileDefs[path].lang !== "lua") toast("native breakpoints land with S24b");
}

function setCurrentLine(n) {
  currentLine = n;
  getFileState(CRATES).views.forEach(v =>
    [...v.children].forEach((row, i) => row.classList.toggle("current", i + 1 === n)));
}

/* ---------- tabbed document center (Scene + N script editors) ---------- */
const reloadChips = {
  lua: { text: "hot-reload ✓ (S22b)", cls: "" },
  odin: { text: "requires engine rebuild (S02a)", cls: " rebuild" },
  go: { text: "requires services rebuild (S26)", cls: " rebuild" },
};

function createEditor(path) {
  const def = fileDefs[path];
  const ed = el("doc editor");
  ed.dataset.path = path;
  const bar = el("editor-bar", ed);
  el("ed-path mono", bar, path);
  el("reload-chip" + reloadChips[def.lang].cls, bar, reloadChips[def.lang].text);
  const find = document.createElement("input");
  find.className = "find-input";
  find.placeholder = "find";
  bar.appendChild(find);
  const count = el("find-count mono", bar, "");
  const code = el("ed-code", ed);
  // the buffer stays one contenteditable node per line (breakpoint/highlight
  // styling needs the rows); the container announces itself as one editor
  code.setAttribute("role", "textbox");
  code.setAttribute("aria-multiline", "true");
  code.setAttribute("aria-label", path + " code editor");
  renderCode(path, code, true);
  code.addEventListener("input", () => {
    const fs = getFileState(path);
    if (!fs.dirty) { fs.dirty = true; renderDocTabs(); }
  });
  find.addEventListener("input", () => {
    const term = find.value.toLowerCase();
    let hits = 0;
    [...code.children].forEach(row => {
      const text = row.querySelector(".code-text").textContent.toLowerCase();
      const hit = !!term && text.includes(term);
      row.classList.toggle("find-hit", hit);
      if (hit) hits++;
    });
    count.textContent = term ? (hits ? hits + " matching lines" : "no matches") : "";
    count.classList.toggle("no-hit", !!term && hits === 0);
  });
  $("center").insertBefore(ed, $("timeline"));
  return ed;
}

function renderDocTabs() {
  const bar = $("doc-tabs");
  bar.textContent = "";
  state.docs.forEach(d => {
    const t = document.createElement("button");
    t.className = "tab" + (state.doc === d.id ? " active" : "");
    t.setAttribute("role", "tab");
    t.setAttribute("aria-selected", String(state.doc === d.id));
    t.title = d.file || d.label;
    t.appendChild(document.createTextNode(d.label));
    if (d.file && getFileState(d.file).dirty) {
      const dot = document.createElement("span");
      dot.className = "dirty-dot";
      dot.textContent = "●";
      dot.title = "unsaved changes";
      t.appendChild(dot);
    }
    t.addEventListener("click", () => {
      if (state.doc === d.id) return;
      pushCmd("focus_document", `{doc="${d.label}"}`);
      focusDoc(d.id);
    });
    if (d.closable) {
      const x = document.createElement("span");
      x.className = "tab-close";
      x.textContent = "×";
      x.title = "close";
      x.setAttribute("role", "button");
      x.setAttribute("aria-label", "close " + d.label);
      x.tabIndex = 0;
      x.addEventListener("keydown", e => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        e.stopPropagation();
        x.click();
      });
      x.addEventListener("click", e => {
        e.stopPropagation();
        const fs = getFileState(d.file);
        if (fs.dirty && !confirm(`discard unsaved changes to ${d.label}?`)) return;
        state.docs = state.docs.filter(o => o.id !== d.id);
        const ed = document.querySelector(`#center > .editor[data-path="${d.file}"]`);
        fs.views = fs.views.filter(v => !ed.contains(v));
        fs.dirty = false;
        ed.remove();
        pushCmd("close_document", `{doc="${d.label}"}`);
        focusDoc("scene");
      });
      t.appendChild(x);
    }
    bar.appendChild(t);
  });
}

function focusDoc(id) {
  if (!state.docs.some(d => d.id === id)) id = "scene";
  state.doc = id;
  $("doc-scene").classList.toggle("active", id === "scene");
  document.querySelectorAll("#center > .editor").forEach(ed =>
    ed.classList.toggle("active", ed.dataset.path === id));
  $("st-lang").textContent = id === "scene" ? "scene" : fileDefs[id].lang;
  renderDocTabs();
}

function openFileDoc(path) {
  if (!state.docs.some(d => d.id === path)) {
    state.docs.push({ id: path, label: path.split("/").pop(), closable: true, file: path });
    createEditor(path);
    pushCmd("open_document", `{path="${path}"}`);
  }
  focusDoc(path);
}

function saveFocusedFile() {
  const path = state.doc;
  if (path === "scene") return;
  getFileState(path).dirty = false;
  renderDocTabs();
  pushCmd("save_file", `{path="${path}"}`);
  toast(`saved ${path}`);
}

/* ---------- files explorer ---------- */
function buildFilesTree() {
  const root = $("files-tree");
  root.setAttribute("role", "tree");
  root.textContent = "";
  const folders = {};
  Object.keys(fileDefs).forEach(p => {
    const dir = p.slice(0, p.lastIndexOf("/"));
    (folders[dir] = folders[dir] || []).push(p);
  });
  Object.entries(folders).forEach(([dir, paths]) => {
    const gRow = treeItem(el("tree-row tree-group", root));
    gRow.setAttribute("aria-expanded", "true");
    const arrow = el("tree-arrow", gRow, "▾");
    el("tree-name", gRow, dir + "/");
    const holder = el("tree-children", root);
    gRow.addEventListener("click", () => {
      const collapsed = holder.classList.toggle("collapsed");
      arrow.textContent = collapsed ? "▸" : "▾";
      gRow.setAttribute("aria-expanded", String(!collapsed));
    });
    paths.forEach(p => {
      const def = fileDefs[p];
      const row = treeItem(el("file-row", holder));
      row.setAttribute("aria-selected", "false");
      row.title = "double-click to open in the editor";
      el("lang-badge", row, { lua: "LUAU", odin: "ODN", go: "GO" }[def.lang]);
      el("file-name mono", row, p.split("/").pop());
      el("file-size", row, def.size);
      row.addEventListener("click", () => {
        if (row.classList.contains("selected")) return; // no-op re-click logs nothing
        document.querySelectorAll("#files-tree .file-row.selected").forEach(r => {
          r.classList.remove("selected");
          r.setAttribute("aria-selected", "false");
        });
        row.classList.add("selected");
        row.setAttribute("aria-selected", "true");
        if (p === CRATES) setRunTarget("sample: crates.luau");
        else if (p.startsWith("mods/")) setRunTarget("mod: " + p.split("/")[1]);
        pushCmd("select", `{file="${p}"}`);
      });
      row.addEventListener("dblclick", () => openFileDoc(p));
    });
  });
}

function focusFilesPanel() {
  applyPanel("left", false);
  activateTab(document.querySelector('[data-panel="files-tree"]'));
}

let newScriptSeq = 0;
function newScript(lang) {
  const dirs = { lua: "mods/sample_tweaks", odin: "engine/systems", go: "server" };
  const path = `${dirs[lang]}/untitled_${++newScriptSeq}.${lang === "lua" ? "luau" : lang}`;
  const tpl = {
    lua: ["-- untitled (control stage)", "", "svsw.on_tick(function(tick)", "end)"],
    odin: ["package systems", "", "// untitled system", "untitled :: proc() {", "}"],
    go: ["package main", "", "// untitled service", "func main() {", "}"],
  };
  fileDefs[path] = { lang, size: "0.1 KB", src: tpl[lang] };
  buildFilesTree();
  focusFilesPanel();
  pushCmd("create_file", `{path="${path}"}`);
  openFileDoc(path);
}

function initScriptLinks() {
  $("btn-open-editor").addEventListener("click", () => openFileDoc(CRATES));
  document.querySelectorAll(".stack-row[data-line]").forEach(row => {
    keyClickable(row);
    row.addEventListener("click", () => {
      openFileDoc(CRATES);
      setCurrentLine(parseInt(row.dataset.line, 10));
    });
  });
}

/* ---------- browsers feed the run target ---------- */
/* rows wired to a click action get pointer cursor + Enter/Space activation;
   Enter also fires the row's double-click action, matching the trees */
function keyClickable(row, opensOnDbl) {
  row.tabIndex = 0;
  row.classList.add("clickable");
  row.addEventListener("keydown", e => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    row.click();
    if (opensOnDbl && e.key === "Enter") row.dispatchEvent(new MouseEvent("dblclick"));
  });
}

/* one contract for every browser row: single-click selects the row (visible
   + logged); rows that feed the run target retarget it (setRunTarget logs
   and flashes); double-click opens where openable */
function selectRow(row) {
  if (row.classList.contains("selected")) return false; // no-op re-click logs nothing
  row.parentElement.querySelectorAll(":scope > .selected").forEach(r => r.classList.remove("selected"));
  row.classList.add("selected");
  return true;
}

function initBrowsers() {
  document.querySelectorAll("#tab-assets .asset-row").forEach(row => {
    const path = row.querySelector(".asset-path").textContent;
    keyClickable(row);
    row.addEventListener("click", () => {
      if (!selectRow(row)) return;
      if (path.endsWith(".scene")) setRunTarget("scene: sandbox_01");
      pushCmd("select", `{asset="${path}"}`);
    });
  });
  document.querySelectorAll(".mod-row").forEach(row => {
    const name = row.querySelector(".mod-name").textContent;
    keyClickable(row);
    row.addEventListener("click", () => {
      if (!selectRow(row)) return;
      setRunTarget("mod: " + name);
      pushCmd("select", `{mod="${name}"}`);
    });
  });
  document.querySelectorAll(".proto-list .proto-row").forEach(row => {
    const id = row.querySelector(".proto-id").textContent;
    keyClickable(row);
    row.addEventListener("click", () => {
      if (selectRow(row)) pushCmd("select", `{prototype="${id}"}`);
    });
  });
  const crates = $("row-crates-lua");
  keyClickable(crates, true);
  crates.addEventListener("click", () => {
    if (!selectRow(crates)) return;
    setRunTarget("sample: crates.luau");
    pushCmd("select", `{script="crates.luau"}`);
  });
  crates.addEventListener("dblclick", () => openFileDoc(CRATES));
}

/* ---------- demo ---------- */
const sleep = ms => new Promise(r => setTimeout(r, ms));

function caption(text) {
  const c = $("demo-caption");
  c.textContent = text;
  c.classList.remove("hidden");
}

async function runDemo() {
  if (state.demo) return;
  state.demo = true;
  if (state.playing) setPlaying(false);
  focusDoc("scene");
  activateTab(document.querySelector('[data-panel="tab-cmdlog"]'));
  logConsole("info", "demo: determinism walkthrough started");

  caption("every edit is a typed command; watch the command log below");
  await sleep(2000);

  caption("spawn a crate: one spawn_entity command lands in the log");
  const name = spawnCrate();
  selectEntity(name);
  await sleep(2200);

  const mark = state.tick;
  const markHash = worldHash(mark, cmdCountAtTick(mark));
  caption(`mark tick ${mark} (hash ${markHash.slice(0, 8)}…); now step three ticks: the hash changes each tick`);
  for (let i = 0; i < 3; i++) {
    await sleep(1100);
    pushCmd("step_tick", "{}");
    setTick(state.tick + 1);
  }
  await sleep(1500);

  caption(`scrub back to tick ${mark}`);
  await sleep(900);
  while (state.tick > mark) {
    state.tick--;
    updateAll();
    await sleep(90);
  }
  pushCmd("scrub_to", `{tick=${mark}}`);
  await sleep(600);

  const now = worldHash(state.tick, cmdCountAtTick(state.tick));
  caption(now === markHash
    ? `tick ${mark} again: hash ${now.slice(0, 8)}… restored identical. same tick, same commands, same world.`
    : "hash mismatch: the mockup broke its own rule");
  $("st-hash").classList.add("flash");
  await sleep(4500);
  $("st-hash").classList.remove("flash");
  $("demo-caption").classList.add("hidden");
  state.demo = false;
}

/* ---------- viewport + panel toggles (shared by toolbar and menus) ---------- */
function toggleChunks() {
  state.chunks = !state.chunks;
  document.body.classList.toggle("chunks-on", state.chunks);
  $("chunk-chips").classList.toggle("hidden", !state.chunks);
  $("btn-chunks").classList.toggle("active", state.chunks);
  pushCmd("toggle_chunk_overlay", `{on=${state.chunks}}`);
}

function toggleSplit() {
  state.split = !state.split;
  $("viewport-wrap").classList.toggle("split", state.split);
  $("pane2").classList.toggle("hidden", !state.split);
  $("btn-split").classList.toggle("active", state.split);
  pushCmd("toggle_viewport_split", `{on=${state.split}}`);
}

function setShading(wire) {
  if (state.wireframe === wire) return;
  state.wireframe = wire;
  document.body.classList.toggle("wireframe", wire);
  pushCmd("set_viewport_shading", `{mode="${wire ? "wireframe" : "shaded"}"}`);
}

function toggleGrid() {
  const off = document.body.classList.toggle("no-grid");
  pushCmd("toggle_grid", `{visible=${!off}}`);
}

function toggleGizmos() {
  const off = document.body.classList.toggle("no-gizmos");
  pushCmd("toggle_gizmos", `{visible=${!off}}`);
}

/* ---------- toolbar wiring ---------- */
function initToolbar() {
  $("run-target").addEventListener("change", () =>
    pushCmd("set_run_target", `{target="${$("run-target").value}"}`));
  $("btn-pin").addEventListener("click", () => {
    state.pinned = !state.pinned;
    $("btn-pin").classList.toggle("active", state.pinned);
    pushCmd("pin_run_target", `{pinned=${state.pinned}}`);
  });
  $("btn-run").addEventListener("click", toggleRun);
  $("btn-pause").addEventListener("click", togglePause);
  $("btn-back").addEventListener("click", stepBack);
  $("btn-step").addEventListener("click", stepForward);
  $("btn-undo").addEventListener("click", undo);
  $("btn-redo").addEventListener("click", redo);
  document.querySelectorAll(".gizmo-btn").forEach(btn =>
    btn.addEventListener("click", () => {
      if (btn.classList.contains("active")) return;
      const prev = state.gizmo;
      state.gizmo = btn.dataset.mode;
      document.querySelectorAll(".gizmo-btn").forEach(b =>
        b.classList.toggle("active", b === btn));
      pushCmd("set_gizmo_mode", `{mode="${state.gizmo}", prev="${prev}"}`);
    }));
  $("btn-chunks").addEventListener("click", toggleChunks);
  $("btn-split").addEventListener("click", toggleSplit);
  $("btn-scripts").addEventListener("click", () => {
    pushCmd("focus_files", "{}");
    focusFilesPanel();
  });
  $("btn-step-system").addEventListener("click", stepSystem);
  $("btn-tour").addEventListener("click", runDemo);
}

/* global shortcuts, exactly the set Help > Keyboard Shortcuts documents.
   Skipped while typing (inputs, contenteditable) or while a menu, tree,
   or tab strip owns the arrow keys. */
function initShortcuts() {
  const gizmoKeys = { q: "select", w: "move", e: "rotate", r: "scale" };
  document.addEventListener("keydown", e => {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest &&
        e.target.closest("input, select, button, [contenteditable], .dropdown, [role='tree'], [role='tablist'], .menu-item")) return;
    const mode = gizmoKeys[e.key.toLowerCase()];
    if (mode) document.querySelector(`.gizmo-btn[data-mode="${mode}"]`).click();
    else if (e.key === " ") { e.preventDefault(); togglePause(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); stepForward(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); stepBack(); }
  });
}

/* ---------- panel collapse (no drag-docking; panels fold to a slim strip)
   applyPanel is silent so bulk operations (reset layout, fullscreen
   viewport) log one command instead of one toggle_panel per panel. ---------- */
const panelNames = {
  left: "left_dock", right: "inspector",
  "dock-bl": "bottom_left_dock", "dock-br": "bottom_right_dock",
  timeline: "timeline",
};

function isCollapsed(id) {
  return id === "timeline"
    ? $("center").classList.contains("collapse-timeline")
    : $(id).classList.contains("collapsed");
}

function applyPanel(id, collapsed) {
  if (id === "timeline") { $("center").classList.toggle("collapse-timeline", collapsed); return; }
  $(id).classList.toggle("collapsed", collapsed);
  const btn = document.querySelector(`.collapse-btn[data-target="${id}"]`);
  if (btn) btn.textContent = collapsed ? "▸" : "▾";
  if (id === "left") $("main").classList.toggle("collapse-left", collapsed);
  if (id === "right") $("main").classList.toggle("collapse-right", collapsed);
  if (id === "dock-bl" || id === "dock-br") {
    // the bottom row shrinks only when both docks are folded
    $("app").classList.toggle("bottom-collapsed",
      $("dock-bl").classList.contains("collapsed") &&
      $("dock-br").classList.contains("collapsed"));
  }
}

function togglePanel(id) {
  const collapsed = !isCollapsed(id);
  applyPanel(id, collapsed);
  pushCmd("toggle_panel", `{panel="${panelNames[id]}", collapsed=${collapsed}}`);
}

function applyResetLayout() {
  Object.keys(panelNames).forEach(id => applyPanel(id, false));
}

function initCollapse() {
  document.querySelectorAll(".collapse-btn").forEach(btn =>
    btn.addEventListener("click", () => togglePanel(btn.dataset.target)));
}

/* ---------- toasts + overlay ---------- */
function toast(text) {
  const holder = $("toasts");
  while (holder.children.length >= 3) holder.firstChild.remove();
  const t = el("toast", holder, text);
  t.title = "click to dismiss";
  let timer = setTimeout(() => t.remove(), 4000);
  t.addEventListener("mouseenter", () => clearTimeout(timer)); // hover pauses dismissal
  t.addEventListener("mouseleave", () => { timer = setTimeout(() => t.remove(), 2000); });
  t.addEventListener("click", () => { clearTimeout(timer); t.remove(); });
}

function showOverlay(title, lines) {
  $("overlay-title").textContent = title;
  const body = $("overlay-body");
  body.textContent = "";
  lines.forEach(l => el("overlay-line", body, l));
  $("overlay").classList.remove("hidden");
  $("overlay-close").focus();
}

function initOverlay() {
  $("overlay-close").addEventListener("click", () => $("overlay").classList.add("hidden"));
  $("overlay").addEventListener("click", e => {
    if (e.target === $("overlay")) $("overlay").classList.add("hidden");
  });
}

/* ---------- session menu helpers ---------- */
function scrubToTickPrompt() {
  const v = prompt(`scrub to tick (0..${state.maxTick})`, String(state.tick));
  if (v === null) return;
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) { toast(`not a tick: "${v}" — enter a number 0..${state.maxTick}`); return; }
  const t = Math.max(0, Math.min(state.maxTick, n));
  state.tick = t;
  updateAll();
  pushCmd("scrub_to", `{tick=${t}}`);
}

function copyWorldHash() {
  const h = $("st-hash").textContent;
  if (navigator.clipboard && navigator.clipboard.writeText)
    navigator.clipboard.writeText(h).catch(() => {});
  toast(`world hash ${h} copied`);
}

/* ---------- menus (data-driven; one template pattern) ----------
   Contract: clicking an item always appends its typed command to the
   command log. live items also perform the action; the rest toast what
   would happen and which spec ships it. Items whose action already logs
   its own typed command (toggles, spawns, transport) set log:false to
   avoid double entries. Undo/redo log nothing: D71, log navigation
   appends nothing. */
const T = (desc, spec) => spec ? `would ${desc} — lands with ${spec}` : `would ${desc}`;
const cmdNameOf = label => label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

const modItem = name => ({
  label: name, log: false,
  check: () => state.mods[name],
  live: () => {
    state.mods[name] = !state.mods[name];
    pushCmd("toggle_mod", `{mod="${name}", enabled=${state.mods[name]}}`);
    toast(T(`${state.mods[name] ? "enable" : "disable"} mod ${name} and re-run the load pipeline`, "S15"));
  },
});

const menuDefs = {
  File: [
    { label: "New Scene", toast: T("create an empty scene", "S22") },
    { label: "Open Scene…", toast: T("open a scene from the project", "S22") },
    { label: "Save Scene", toast: T("write the scene as data-stage content", "S22") },
    { label: "Recent Scenes", sub: [
      { label: "scenes/sandbox_01.scene", cmd: "open_scene", args: '{path="scenes/sandbox_01.scene"}', toast: T("open scenes/sandbox_01.scene", "S22") },
      { label: "scenes/testbed_02.scene", cmd: "open_scene", args: '{path="scenes/testbed_02.scene"}', toast: T("open scenes/testbed_02.scene", "S22") },
    ] },
    { sep: true },
    { label: "New Script", sub: [
      { label: "Luau", log: false, live: () => newScript("lua") },
      { label: "Odin", log: false, live: () => newScript("odin") },
      { label: "Go", log: false, live: () => newScript("go") },
    ] },
    { label: "Open File…", toast: T("open a file from the project", "S22") },
    { label: "Save", log: false, live: saveFocusedFile, enabled: () => state.doc !== "scene" },
    { sep: true },
    { label: "Import Asset…", toast: T("import a glTF, texture, or audio source", "S12a") },
    { label: "Bake Assets", toast: T("bake changed assets into the container", "S12a") },
    { label: "Rebake All", toast: T("rebake every asset from source", "S12a") },
    { sep: true },
    { label: "Project Settings", toast: T("open project settings", "S17") },
    { label: "Quit", toast: T("close the editor") },
  ],
  Edit: [
    { label: "Undo", log: false, live: undo, enabled: () => undoCursor > 0 },
    { label: "Redo", log: false, live: redo, enabled: () => undoCursor < undoStack.length },
    { sep: true },
    { label: "Duplicate Entity", log: false, live: duplicateSelected, enabled: () => !!state.selected },
    { label: "Delete Entity", log: false, live: deleteSelected, enabled: () => !!state.selected },
    { sep: true },
    { label: "Select All", toast: T("select every entity (multi-select)", "S22") },
    { label: "Deselect", live: () => applySelect(null) },
    { label: "Find Entity…", toast: T("search entities by name", "S22") },
    { sep: true },
    { label: "Snap Settings", toast: T("open snap settings", "S22") },
    { label: "Preferences", toast: T("open editor preferences", "S23") },
  ],
  View: [
    { label: "Left Dock (Scene Tree / Files)", log: false, live: () => togglePanel("left"), check: () => !isCollapsed("left") },
    { label: "Inspector", log: false, live: () => togglePanel("right"), check: () => !isCollapsed("right") },
    { label: "Bottom Left Dock", log: false, live: () => togglePanel("dock-bl"), check: () => !isCollapsed("dock-bl") },
    { label: "Bottom Right Dock", log: false, live: () => togglePanel("dock-br"), check: () => !isCollapsed("dock-br") },
    { label: "Timeline", log: false, live: () => togglePanel("timeline"), check: () => !isCollapsed("timeline") },
    { label: "Files Panel", cmd: "focus_files", live: focusFilesPanel },
    { sep: true },
    { label: "Viewport", sub: [
      { label: "Shaded", log: false, live: () => setShading(false), check: () => !state.wireframe },
      { label: "Wireframe", log: false, live: () => setShading(true), check: () => state.wireframe },
      { label: "Overdraw", cmd: "set_viewport_shading", args: '{mode="overdraw"}', toast: T("show the overdraw heat view", "S06") },
    ] },
    { label: "Chunk Overlay", log: false, live: toggleChunks, check: () => state.chunks },
    { label: "Grid", log: false, live: toggleGrid, check: () => !document.body.classList.contains("no-grid") },
    { label: "Gizmos", log: false, live: toggleGizmos, check: () => !document.body.classList.contains("no-gizmos") },
    { label: "Split Viewport", log: false, live: toggleSplit, check: () => state.split },
    { sep: true },
    { label: "Reset Layout", live: applyResetLayout },
  ],
  Session: [
    { label: () => state.running ? "Stop" : "Run", log: false, live: toggleRun },
    { label: "Pause", log: false, live: togglePause, enabled: () => state.running },
    { label: "Step Forward", log: false, live: stepForward },
    { label: "Step Back", log: false, live: stepBack, enabled: () => state.tick > 0 },
    { sep: true },
    { label: "Run Headless", toast: T("run the same target windowless; hashes must match", "S04") },
    { label: "Verify Parity (headless == windowed)", cmd: "verify_parity",
      toast: () => `parity ✓ hash ${$("st-hash").textContent} identical in both modes (S04)` },
    { sep: true },
    { label: "Load Replay…", toast: T("load a replay file", "S02a") },
    { label: "Save Replay", toast: T("save the session replay", "S02a") },
    { label: "Scrub to Tick…", log: false, live: scrubToTickPrompt },
    { sep: true },
    { label: "Copy World Hash", live: copyWorldHash },
    { label: "Re-record Goldens…", toast: "sanctioned re-record flow — requires stated intent (S02a)" },
    { label: "Session Settings", toast: T("edit session settings: seed, fixed timestep", "S22") },
  ],
  Mods: [
    { label: "Mod List", sub: [modItem("base"), modItem("sample_tweaks"), modItem("extra_props")] },
    { label: "Reload Mods",
      live: () => logConsole("info", "mods reloaded, data stages re-run"),
      toast: "mods reloaded, data stages re-run (S22b)" },
    { label: "Load Order…", toast: T("edit the mod load order", "S15") },
    { label: "Check Conflicts", toast: T("check for conflicts; mirroring test: no conflicts", "S15") },
    { sep: true },
    { label: "New Mod (scaffold)", cmd: "new_mod", toast: T("scaffold a new mod", "S17") },
    { label: "Open Mod Folder", toast: T("open the mod folder", "S17") },
    { label: "Data-Stage Inspector", live: () => focusDockTab("dock-bl", "tab-mods") },
    { sep: true },
    { label: "Editor Scripts…", toast: T("manage the editor-tier Luau capability set", "S24") },
  ],
  Window: [
    { label: "Layout", sub: [
      { label: "Default", cmd: "set_layout", args: '{layout="default"}',
        live: () => { applyResetLayout(); focusDoc("scene"); } },
      { label: "Scripting", cmd: "set_layout", args: '{layout="scripting"}',
        live: () => {
          openFileDoc(CRATES);
          focusDockTab("dock-br", "tab-debugger");
          activateTab(document.querySelector('[data-panel="dbg-script"]'));
        } },
      { label: "Debugging", cmd: "set_layout", args: '{layout="debugging"}',
        live: () => {
          focusDockTab("dock-br", "tab-debugger");
          activateTab(document.querySelector('[data-panel="dbg-sim"]'));
        } },
      { label: "Profiling", cmd: "set_layout", args: '{layout="profiling"}',
        live: () => focusDockTab("dock-br", "tab-profiler") },
    ] },
    { label: "Save Layout", toast: T("save the panel layout", "S23") },
    { label: "Reset Layout", live: applyResetLayout },
    { sep: true },
    { label: "Second Viewport", log: false, live: toggleSplit, check: () => state.split },
    { label: "Fullscreen Viewport",
      live: () => ["left", "right", "dock-bl", "dock-br"].forEach(id => applyPanel(id, true)) },
  ],
  Help: [
    { label: "Mockup Tour", live: runDemo },
    { label: "Keyboard Shortcuts", live: () => showOverlay("keyboard shortcuts", [
      "Q / W / E / R — gizmo mode: select, move, rotate, scale",
      "Space — pause / resume the session",
      "← / → — step back / step forward one tick",
    ]) },
    { label: "About svsw", live: () => showOverlay("about svsw", [
      "svsw, a 2D game engine",
      "editor mockup, M00 design artifact, not the engine",
      "license: Apache-2.0",
    ]) },
    { label: "Docs", toast: "see docs/README.md in the repository" },
  ],
};

let openMenuName = null;
let openMenuEl = null;

function closeMenus() {
  if (openMenuEl) { openMenuEl.remove(); openMenuEl = null; openMenuName = null; }
  document.querySelectorAll("#menubar .menu-item.open").forEach(m => {
    m.classList.remove("open");
    m.setAttribute("aria-expanded", "false");
  });
}

function runMenuItem(item) {
  closeMenus();
  const label = typeof item.label === "function" ? item.label() : item.label;
  if (item.log !== false) pushCmd(item.cmd || cmdNameOf(label), item.args || "{}");
  if (item.live) item.live();
  const t = typeof item.toast === "function" ? item.toast() : item.toast;
  if (t) toast(t);
}

function buildDropdown(items) {
  const dd = el("dropdown");
  dd.setAttribute("role", "menu");
  items.forEach(item => {
    if (item.sep) { el("dd-sep", dd); return; }
    const row = el("dd-item", dd);
    row.setAttribute("role", "menuitem");
    row.tabIndex = -1;
    el("dd-check", row, item.check && item.check() ? "✓" : "");
    el("dd-label", row, typeof item.label === "function" ? item.label() : item.label);
    if (item.sub) {
      row.classList.add("has-sub");
      row.setAttribute("aria-haspopup", "menu");
      el("dd-arrow", row, "▸");
      const sub = buildDropdown(item.sub);
      sub.classList.add("submenu");
      row.appendChild(sub);
    } else if (item.enabled && !item.enabled()) {
      row.classList.add("disabled");
      row.setAttribute("aria-disabled", "true");
    } else {
      row.addEventListener("click", e => { e.stopPropagation(); runMenuItem(item); });
    }
  });
  return dd;
}

function openMenu(mi) {
  closeMenus();
  const dd = buildDropdown(menuDefs[mi.dataset.menu]);
  dd.addEventListener("click", e => e.stopPropagation());
  const r = mi.getBoundingClientRect();
  dd.style.left = r.left + "px";
  dd.style.top = r.bottom + "px";
  document.body.appendChild(dd);
  mi.classList.add("open");
  mi.setAttribute("aria-expanded", "true");
  openMenuEl = dd;
  openMenuName = mi.dataset.menu;
}

/* keyboard: menubar items open with Enter/Space/ArrowDown; arrows walk items
   and open menus; ArrowRight/Left enter/leave submenus; Esc closes and
   returns focus to the menubar */
function menubarItems() { return [...document.querySelectorAll("#menubar .menu-item")]; }

function openMenuAndFocus(mi) {
  openMenu(mi);
  const first = openMenuEl.querySelector(":scope > .dd-item:not(.disabled)");
  if (first) first.focus();
}

function switchMenu(dir) {
  const items = menubarItems();
  const i = items.findIndex(m => m.dataset.menu === openMenuName);
  openMenuAndFocus(items[(i + dir + items.length) % items.length]);
}

function openSubmenu(row) {
  row.classList.add("open");
  const first = row.querySelector(":scope > .submenu > .dd-item:not(.disabled)");
  if (first) first.focus();
}

function menuKeydown(e) {
  if (e.key === "Escape") {
    const mi = openMenuName &&
      document.querySelector(`#menubar .menu-item[data-menu="${openMenuName}"]`);
    closeMenus();
    $("overlay").classList.add("hidden");
    if (mi) mi.focus();
    return;
  }
  if (!openMenuEl || e.defaultPrevented) return;
  const level = (e.target.closest && e.target.closest(".dropdown")) || openMenuEl;
  const items = [...level.querySelectorAll(":scope > .dd-item:not(.disabled)")];
  const i = items.indexOf(e.target);
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    const dir = e.key === "ArrowDown" ? 1 : -1;
    const next = i === -1
      ? items[dir === 1 ? 0 : items.length - 1]
      : items[(i + dir + items.length) % items.length];
    if (next) next.focus();
  } else if (e.key === "Enter" || e.key === " ") {
    if (i === -1) return;
    e.preventDefault();
    const row = items[i];
    if (row.classList.contains("has-sub")) { openSubmenu(row); return; }
    const miName = openMenuName;
    row.click();
    const mi = document.querySelector(`#menubar .menu-item[data-menu="${miName}"]`);
    if (mi) mi.focus();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    if (i !== -1 && items[i].classList.contains("has-sub")) openSubmenu(items[i]);
    else switchMenu(1);
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    if (level.classList.contains("submenu")) {
      const parent = level.parentElement; // the has-sub dd-item
      parent.classList.remove("open");
      parent.focus();
    } else switchMenu(-1);
  }
}

function initMenus() {
  document.querySelectorAll("#menubar .menu-item").forEach(mi => {
    mi.addEventListener("click", e => {
      e.stopPropagation();
      if (openMenuName === mi.dataset.menu) closeMenus();
      else openMenu(mi);
    });
    mi.addEventListener("mouseenter", () => {
      if (openMenuEl && openMenuName !== mi.dataset.menu) openMenu(mi);
    });
    mi.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        openMenuAndFocus(mi);
      } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const items = menubarItems();
        const next = items[(items.indexOf(mi) + (e.key === "ArrowRight" ? 1 : -1) +
                            items.length) % items.length];
        if (openMenuEl) openMenuAndFocus(next); else next.focus();
      }
    });
  });
  document.addEventListener("click", closeMenus);
  document.addEventListener("keydown", menuKeydown);
}

/* ---------- boot ---------- */
function boot() {
  buildWorlds();
  buildTree();
  buildFilesTree();
  buildChips();
  getFileState(CRATES).bp.add(6); // the call stack's drift frame ships with a breakpoint
  renderCode(CRATES, $("lua-preview"), false);
  renderDocTabs();
  renderSysList();
  initTabs();
  initMenus();
  initOverlay();
  initToolbar();
  initShortcuts();
  initCollapse();
  initTimeline();
  initScriptLinks();
  initBrowsers();
  initTreeKeys($("scene-tree"));
  initTreeKeys($("files-tree"));
  window.addEventListener("resize", updateAll);

  // seed a small pre-session history, then join the session at tick 128
  pushCmd("load_scene", '{path="scenes/sandbox_01.scene"}', { world: true });
  pushCmd("select", '{entity="crate_02"}');
  applySelect("crate_02");
  state.tick = 128;
  state.maxTick = 128;
  logConsole("ok", `session ready at tick ${state.tick}`);
  updateAll();
}

boot();
