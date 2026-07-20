const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const scriptSource = fs.readFileSync(path.join(__dirname, "..", "script.js"), "utf8");

function extractFunction(name) {
  const start = scriptSource.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`Function ${name} not found`);
  const bodyStart = scriptSource.indexOf("{", start);
  let depth = 0;
  for (let index = bodyStart; index < scriptSource.length; index += 1) {
    if (scriptSource[index] === "{") depth += 1;
    if (scriptSource[index] === "}") depth -= 1;
    if (depth === 0) return scriptSource.slice(start, index + 1);
  }
  throw new Error(`Function ${name} is incomplete`);
}

const context = vm.createContext({
  ALIGN_SNAP_THRESHOLD: 12,
  ALIGN_SNAP_RELEASE_THRESHOLD: 20,
  GAP_SNAP_THRESHOLD: 18,
  GAP_SNAP_RELEASE_THRESHOLD: 28,
  activeDrag: undefined,
  activeResize: undefined,
  canvasMetrics: { width: 500, height: 400 },
});

[
  "rangesOverlap",
  "rectanglesOverlap",
  "getMoveCandidateRect",
  "snapCandidateScore",
  "addMoveGapCandidates",
  "findMoveSnap",
  "getResizeCandidateRect",
  "buildResizeGapCandidates",
].forEach((name) => vm.runInContext(extractFunction(name), context));

function rect(left, top, size) {
  return { left, top, right: left + size, bottom: top + size, size };
}

function setDrag({ size = 50, rects = [], gaps = { x: [], y: [] }, x = [], y = [] }) {
  context.activeDrag = {
    size,
    targets: { rects, gaps, x, y },
    snapCandidates: {},
  };
}

test("moving module reuses an existing horizontal gap", () => {
  setDrag({ rects: [rect(0, 0, 100)], gaps: { x: [20], y: [] } });
  const snap = context.findMoveSnap("x", 123, 10);
  assert.equal(snap.kind, "gap");
  assert.equal(snap.position, 120);
  assert.equal(snap.gap, 20);
});

test("equal-gap attraction starts before the normal alignment threshold", () => {
  setDrag({ rects: [rect(0, 0, 100)], gaps: { x: [20], y: [] } });
  const snap = context.findMoveSnap("x", 136, 10);
  assert.equal(snap.kind, "gap");
  assert.equal(snap.position, 120);
});

test("moving module distributes itself evenly between adjacent modules", () => {
  setDrag({ rects: [rect(0, 0, 100), rect(180, 0, 100)] });
  const snap = context.findMoveSnap("x", 119, 10);
  assert.equal(snap.kind, "gap");
  assert.equal(snap.source, "distributed");
  assert.equal(snap.position, 115);
  assert.equal(snap.gap, 15);
});

test("moving module reuses an existing vertical gap", () => {
  setDrag({ rects: [rect(0, 0, 100)], gaps: { x: [], y: [24] } });
  const snap = context.findMoveSnap("y", 129, 10);
  assert.equal(snap.kind, "gap");
  assert.equal(snap.position, 124);
  assert.equal(snap.gap, 24);
});

test("edge alignment keeps priority when it is equally close", () => {
  setDrag({ rects: [rect(0, 0, 100)], gaps: { x: [20], y: [] }, x: [118] });
  const snap = context.findMoveSnap("x", 119, 10);
  assert.equal(snap.kind, undefined);
  assert.equal(snap.position, 118);
});

test("resizing module reuses the neighboring gap", () => {
  context.activeResize = {
    anchorX: 0,
    anchorY: 0,
    xDirection: 1,
    yDirection: 1,
    minSize: 50,
    maxSize: 200,
    targets: {
      rects: [rect(150, 0, 100)],
      gaps: { x: [20], y: [] },
    },
  };
  const [snap] = context.buildResizeGapCandidates("x", 134);
  assert.equal(snap.kind, "gap");
  assert.equal(snap.size, 130);
  assert.equal(snap.gap, 20);
});
