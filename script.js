const PANEL_SIZE = 240;
const PANEL_GAP_X = 34;
const PANEL_GAP_Y = 32;
const POSITION_PRECISION = 5;
const MIN_ALBUM_SCALE = 0.45;
const MAX_ALBUM_SCALE = 1.8;
const ALIGN_SNAP_THRESHOLD = 12;
const ALIGN_SNAP_RELEASE_THRESHOLD = 20;

const records = [
  {
    name: "MIDNIGHT CURRENT",
    year: "1984",
    type: "vinyl",
    label: "#d45b35",
    labelInk: "#f5d9b9",
    monogram: "MC",
  },
  {
    name: "A QUIET FIELD",
    year: "2002",
    type: "cover",
    artwork:
      "linear-gradient(180deg, transparent 47%, rgba(14,18,12,.92) 48%), repeating-linear-gradient(101deg, rgba(216,201,130,.75) 0 2px, transparent 2px 11px), linear-gradient(135deg, #99a170, #d8ce9d 62%, #827b4d)",
    coverInk: "#202319",
    title: "A Quiet\nField",
    subtitle: "STUDIES IN STILLNESS",
  },
  {
    name: "BLUE HOUR",
    year: "1997",
    type: "vinyl",
    label: "#426d8a",
    labelInk: "#e2b949",
    monogram: "BH",
  },
  {
    name: "LATE SUMMER",
    year: "2018",
    type: "cover",
    artwork:
      "linear-gradient(32deg, transparent 0 47%, rgba(247,218,174,.88) 48% 52%, transparent 53%), radial-gradient(circle at 72% 24%, #db6e4f 0 8%, transparent 8.5%), linear-gradient(150deg, #26383d, #78918b 54%, #d3b087)",
    coverInk: "#f5e9d4",
    title: "Late\nSummer",
    subtitle: "VOL. IV / COASTAL RECORDINGS",
  },
  {
    name: "LOW TIDE",
    year: "1979",
    type: "cover",
    artwork:
      "repeating-linear-gradient(171deg, transparent 0 17px, rgba(216,234,227,.19) 18px 20px), linear-gradient(180deg, #99b1aa 0 46%, #294450 47% 67%, #c9bca0 68%)",
    coverInk: "#f5f0e7",
    title: "Low Tide",
    subtitle: "AN EXERCISE IN BLUE",
  },
  {
    name: "ORANGE ROOM",
    year: "2008",
    type: "vinyl",
    label: "#d96b2f",
    labelInk: "#382016",
    monogram: "OR",
  },
  {
    name: "NIGHT GARDEN",
    year: "2021",
    type: "cover",
    artwork:
      "radial-gradient(ellipse at 20% 90%, #9b775c 0 9%, transparent 9.5%), radial-gradient(ellipse at 68% 72%, #4e7359 0 13%, transparent 13.5%), radial-gradient(circle at 77% 20%, #d9c38b 0 6%, transparent 6.5%), linear-gradient(135deg, #101c1c, #30423a)",
    coverInk: "#e7ddc1",
    title: "Night\nGarden",
    subtitle: "AFTER THE RAIN",
  },
  {
    name: "SOFT SIGNAL",
    year: "2015",
    type: "vinyl",
    label: "#bd7380",
    labelInk: "#3d2530",
    monogram: "SS",
  },
  {
    name: "PALE MEMORY",
    year: "1992",
    type: "cover",
    artwork:
      "linear-gradient(90deg, transparent 49%, rgba(60,62,57,.25) 49.5% 50.5%, transparent 51%), radial-gradient(circle at 50% 43%, rgba(226,205,167,.72) 0 14%, transparent 14.5%), linear-gradient(145deg, #a8aaa1, #e2dac9 58%, #777c75)",
    coverInk: "#292b27",
    title: "Pale\nMemory",
    subtitle: "ARCHIVE No. 09",
  },
];

const layoutSettings = {
  "4x2": { columns: 4, rows: 2, visible: 8, label: "4×2" },
  "3x3": { columns: 3, rows: 3, visible: 9, label: "3×3" },
  "3x2": { columns: 3, rows: 2, visible: 6, label: "3×2" },
};

const mountVariations = [
  { x: -0.4, y: 0.2, rotate: -0.045 },
  { x: 0.3, y: -0.3, rotate: 0.035 },
  { x: -0.1, y: 0.4, rotate: -0.025 },
  { x: 0.5, y: 0.1, rotate: 0.04 },
  { x: 0.2, y: -0.2, rotate: 0.025 },
  { x: -0.3, y: 0.3, rotate: -0.035 },
  { x: 0.1, y: 0.2, rotate: 0.02 },
  { x: -0.2, y: -0.1, rotate: -0.03 },
  { x: 0.35, y: 0.25, rotate: 0.03 },
];

const grid = document.querySelector("#recordGrid");
const stage = document.querySelector("#galleryStage");
const wall = document.querySelector(".wall");
const template = document.querySelector("#recordTemplate");
const alignmentGuides = document.querySelector("#alignmentGuides");
const verticalGuide = alignmentGuides.querySelector(".alignment-guide--vertical");
const horizontalGuide = alignmentGuides.querySelector(".alignment-guide--horizontal");
const playlistDialog = document.querySelector("#playlistDialog");
const playlistForm = document.querySelector("#playlistImportForm");
const playlistUrl = document.querySelector("#playlistUrl");
const playlistStatus = document.querySelector("#playlistImportStatus");
const playlistDialogKicker = document.querySelector("#playlistDialogKicker");
const playlistHint = document.querySelector("#playlistHint");
const platformOptions = [...document.querySelectorAll('input[name="playlistPlatform"]')];
const importButton = document.querySelector("#openPlaylistImport");
const resetPositionsButton = document.querySelector("#resetAlbumPositions");
const parsePlaylistButton = document.querySelector("#parsePlaylistButton");
const requiredCoverCount = document.querySelector("#requiredCoverCount");
const currentLayoutLabel = document.querySelector("#currentLayoutLabel");
const shareButton = document.querySelector("#copyShareLink");
const shareImageButton = document.querySelector("#openShareImage");
const shareImageDialog = document.querySelector("#shareImageDialog");
const shareImageStage = document.querySelector("#shareImageStage");
const shareImagePreview = document.querySelector("#shareImagePreview");
const shareImageStatus = document.querySelector("#shareImageStatus");

let fitFrame;
let importedCovers = [];
let importRequest;
let importedPlaylistName = "网易云歌单";
let shareFeedbackTimer;
let shareImageObjectUrl;
let shareImageGeneration = 0;
let sceneScale = 1;
let albumPositions = [];
let albumSizes = records.map(() => 1);
let positionLayout = "";
let activeDrag;
let activeResize;
let topStackOrder = records.length;
let canvasMetrics;
let pointerFrame;
let pendingPointer;

const playlistPlatforms = {
  netease: {
    name: "网易云音乐",
    kicker: "NETEASE PLAYLIST",
    endpoint: "/api/netease-playlist",
    placeholder: "https://music.163.com/playlist?id=...",
    hint: "支持网易云标准歌单链接、分享短链，也可以直接输入歌单 ID。",
  },
  qq: {
    name: "QQ 音乐",
    kicker: "QQ MUSIC PLAYLIST",
    endpoint: "/api/qq-playlist",
    placeholder: "https://i2.y.qq.com/.../playlist.html?id=...",
    hint: "支持 QQ 音乐歌单分享链接，也可以直接输入歌单 ID。",
  },
};

function getSceneSize(layout) {
  return {
    width: layout.columns * PANEL_SIZE + (layout.columns - 1) * PANEL_GAP_X,
    height: layout.rows * PANEL_SIZE + (layout.rows - 1) * PANEL_GAP_Y,
  };
}

function buildGeneratedArtwork(slot, record) {
  if (record.type === "vinyl") {
    slot.classList.add("album-slot--vinyl");
    slot.innerHTML = `
      <span class="record-disc" style="--label: ${record.label}; --label-ink: ${record.labelInk}">
        <span class="label-monogram">${record.monogram}</span>
      </span>
    `;
    return;
  }

  slot.style.setProperty("--artwork", record.artwork);
  slot.style.setProperty("--cover-ink", record.coverInk);
  slot.innerHTML = `
    <span class="cover-mark cover-mark--orbit" aria-hidden="true"></span>
    <span class="cover-mark cover-mark--line" aria-hidden="true"></span>
    <span class="cover-copy">
      <strong>${record.title.replace("\n", "<br>")}</strong>
      <small>${record.subtitle}</small>
    </span>
  `;
}

function renderRecords() {
  grid.replaceChildren();

  records.forEach((record, index) => {
    const fragment = template.content.cloneNode(true);
    const item = fragment.querySelector(".record-item");
    const frame = fragment.querySelector(".acrylic-frame");
    const slot = fragment.querySelector(".album-slot");
    const resizeHandles = [...fragment.querySelectorAll(".resize-handle")];
    const variation = mountVariations[index];
    const imported = importedCovers[index];
    const accessibleName = imported
      ? `${imported.name}，${imported.artist}，专辑《${imported.album}》`
      : `${record.name} 专辑展示`;

    item.style.setProperty("--mount-x", `${variation.x}px`);
    item.style.setProperty("--mount-y", `${variation.y}px`);
    item.style.setProperty("--mount-rotate", `${variation.rotate}deg`);
    item.dataset.index = String(index);
    item.tabIndex = 0;
    item.setAttribute("role", "group");
    item.setAttribute("aria-label", accessibleName);
    item.setAttribute("aria-describedby", "canvasHint");
    item.setAttribute("aria-roledescription", "可拖动专辑");
    item.setAttribute("aria-grabbed", "false");
    item.style.zIndex = String(index + 1);
    frame.setAttribute("aria-label", accessibleName);
    resizeHandles.forEach((handle) => {
      const cornerNames = { tl: "左上角", tr: "右上角", bl: "左下角", br: "右下角" };
      handle.setAttribute("aria-label", `从${cornerNames[handle.dataset.corner]}调整 ${accessibleName} 的大小`);
    });

    if (imported) {
      slot.classList.add("album-slot--uploaded");
      slot.style.backgroundImage = `url("${imported.cover}")`;
    } else {
      buildGeneratedArtwork(slot, record);
    }

    grid.append(fragment);
  });
}

function getCanvasMetrics(layout) {
  const scene = getSceneSize(layout);
  const bounds = stage.getBoundingClientRect();
  const { width, height, left, top } = bounds;
  const insetX = Math.min(92, Math.max(16, width * 0.06));
  const insetY = Math.min(64, Math.max(30, height * 0.06));
  const availableWidth = Math.max(1, width - insetX * 2);
  const availableHeight = Math.max(1, height - insetY * 2);
  const scale = Math.min(availableWidth / scene.width, availableHeight / scene.height, 1.12);
  const panelSize = PANEL_SIZE * scale;

  return { scene, width, height, left, top, scale, panelSize };
}

function buildDefaultPositions(layout, metrics) {
  const scaledWidth = metrics.scene.width * metrics.scale;
  const scaledHeight = metrics.scene.height * metrics.scale;
  const originX = (metrics.width - scaledWidth) / 2;
  const originY = (metrics.height - scaledHeight) / 2;
  const maxX = Math.max(0, metrics.width - metrics.panelSize);
  const maxY = Math.max(0, metrics.height - metrics.panelSize);

  return records.map((_, index) => {
    const column = index % layout.columns;
    const row = Math.floor(index / layout.columns);
    const x = originX + column * (PANEL_SIZE + PANEL_GAP_X) * metrics.scale;
    const y = originY + row * (PANEL_SIZE + PANEL_GAP_Y) * metrics.scale;
    return {
      x: maxX ? Math.min(1, Math.max(0, x / maxX)) : 0,
      y: maxY ? Math.min(1, Math.max(0, y / maxY)) : 0,
    };
  });
}

function updateItemReflection(item, x, y) {
  const index = Number(item.dataset.index);
  const safeScale = sceneScale * getAlbumScale(index) || 1;
  item.style.setProperty("--reflection-x", `${(-x / safeScale).toFixed(2)}px`);
  item.style.setProperty("--reflection-y", `${(-y / safeScale).toFixed(2)}px`);
  if (canvasMetrics) {
    item.style.setProperty("--item-scene-width", `${(canvasMetrics.width / safeScale).toFixed(2)}px`);
    item.style.setProperty("--item-scene-height", `${(canvasMetrics.height / safeScale).toFixed(2)}px`);
  }
}

function getAlbumScale(index) {
  return Math.min(MAX_ALBUM_SCALE, Math.max(MIN_ALBUM_SCALE, albumSizes[index] || 1));
}

function getAlbumPanelSize(index, metrics) {
  return PANEL_SIZE * metrics.scale * getAlbumScale(index);
}

function setItemScale(item, index, value) {
  const nextScale = Math.min(MAX_ALBUM_SCALE, Math.max(MIN_ALBUM_SCALE, value));
  albumSizes[index] = nextScale;
  item.style.setProperty("--item-scale", (sceneScale * nextScale).toFixed(5));
  item.querySelectorAll(".resize-handle").forEach((handle) => {
    handle.setAttribute("aria-valuenow", String(Math.round(nextScale * 100)));
  });
  return nextScale;
}

function setItemPosition(item, index, x, y, metrics, updateState = true, updateReflection = true) {
  const panelSize = getAlbumPanelSize(index, metrics);
  const maxX = Math.max(0, metrics.width - panelSize);
  const maxY = Math.max(0, metrics.height - panelSize);
  const nextX = Math.min(maxX, Math.max(0, x));
  const nextY = Math.min(maxY, Math.max(0, y));

  item.style.setProperty("--item-x", `${nextX.toFixed(2)}px`);
  item.style.setProperty("--item-y", `${nextY.toFixed(2)}px`);
  item.canvasX = nextX;
  item.canvasY = nextY;
  if (updateReflection) updateItemReflection(item, nextX, nextY);

  if (updateState) {
    albumPositions[index] = {
      x: maxX ? nextX / maxX : 0,
      y: maxY ? nextY / maxY : 0,
    };
  }
}

function fitSceneToViewport(layout, resetPositions = false) {
  const metrics = getCanvasMetrics(layout);
  canvasMetrics = metrics;
  sceneScale = metrics.scale;
  grid.style.setProperty("--scene-scale", sceneScale.toFixed(4));
  grid.style.setProperty("--scene-width", `${(metrics.width / sceneScale).toFixed(2)}px`);
  grid.style.setProperty("--scene-height", `${(metrics.height / sceneScale).toFixed(2)}px`);

  if (resetPositions || positionLayout !== grid.dataset.layout || albumPositions.length < layout.visible) {
    albumPositions = buildDefaultPositions(layout, metrics);
    positionLayout = grid.dataset.layout;
  }

  grid.querySelectorAll(".record-item").forEach((item, index) => {
    const position = albumPositions[index] || { x: 0.5, y: 0.5 };
    setItemScale(item, index, getAlbumScale(index));
    const panelSize = getAlbumPanelSize(index, metrics);
    const maxX = Math.max(0, metrics.width - panelSize);
    const maxY = Math.max(0, metrics.height - panelSize);
    setItemPosition(item, index, position.x * maxX, position.y * maxY, metrics, false);
  });

  if (activeDrag) {
    activeDrag.offsetX = activeDrag.lastClientX - metrics.left - activeDrag.item.canvasX;
    activeDrag.offsetY = activeDrag.lastClientY - metrics.top - activeDrag.item.canvasY;
  }
}

function scheduleSceneFit() {
  window.cancelAnimationFrame(fitFrame);
  fitFrame = window.requestAnimationFrame(() => {
    const layout = layoutSettings[grid.dataset.layout];
    if (layout) fitSceneToViewport(layout);
  });
}

function applyLayout(layoutName) {
  const layout = layoutSettings[layoutName];
  if (!layout) return;
  const layoutChanged = Boolean(grid.dataset.layout && grid.dataset.layout !== layoutName);

  grid.dataset.layout = layoutName;
  grid.style.setProperty("--layout-columns", layout.columns);
  grid.setAttribute("aria-label", `唱片收藏，${layout.label} 排列`);

  grid.querySelectorAll(".record-item").forEach((item, index) => {
    item.hidden = index >= layout.visible;
  });

  document.querySelectorAll(".layout-option").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.layout === layoutName));
  });

  updateDialogLayoutSummary(layout);
  window.cancelAnimationFrame(fitFrame);
  fitFrame = window.requestAnimationFrame(() => fitSceneToViewport(layout, layoutChanged));
}

function updateReflectionFromPointer(clientX, clientY) {
  if (!canvasMetrics) return;
  const normalizedX = (clientX - canvasMetrics.left) / canvasMetrics.width - 0.5;
  const normalizedY = (clientY - canvasMetrics.top) / canvasMetrics.height - 0.5;
  grid.style.setProperty("--reflection-shift-x", `${(-normalizedX * 14).toFixed(2)}px`);
  grid.style.setProperty("--reflection-shift-y", `${(-normalizedY * 6).toFixed(2)}px`);
}

function resetReflection() {
  if (!activeDrag && !activeResize && pointerFrame) {
    window.cancelAnimationFrame(pointerFrame);
    pointerFrame = undefined;
    pendingPointer = undefined;
  }
  grid.style.setProperty("--reflection-shift-x", "0px");
  grid.style.setProperty("--reflection-shift-y", "0px");
}

function bringItemToFront(item) {
  topStackOrder += 1;
  item.style.zIndex = String(topStackOrder);
}

function startAlbumDrag(event) {
  const item = event.target.closest(".record-item");
  if (
    !item ||
    event.target.closest(".resize-handle") ||
    activeResize ||
    !event.isPrimary ||
    (event.pointerType === "mouse" && event.button !== 0)
  ) return;

  const metrics = canvasMetrics || getCanvasMetrics(layoutSettings[grid.dataset.layout]);
  canvasMetrics = metrics;
  const x = item.canvasX || 0;
  const y = item.canvasY || 0;
  activeDrag = {
    item,
    index: Number(item.dataset.index),
    pointerId: event.pointerId,
    offsetX: event.clientX - metrics.left - x,
    offsetY: event.clientY - metrics.top - y,
    lastClientX: event.clientX,
    lastClientY: event.clientY,
    size: getAlbumPanelSize(Number(item.dataset.index), metrics),
    targets: collectAlignmentTargets(Number(item.dataset.index), metrics),
    snapCandidates: {},
  };

  hideAlignmentGuides();
  bringItemToFront(item);
  grid.classList.add("is-dragging");
  item.classList.add("is-dragging");
  item.setAttribute("aria-grabbed", "true");
  item.setPointerCapture(event.pointerId);
  document.body.dataset.canvasInteracted = "true";
  event.preventDefault();
}

function getCornerDirections(corner) {
  return {
    x: corner.endsWith("r") ? 1 : -1,
    y: corner.startsWith("b") ? 1 : -1,
  };
}

function collectAlignmentTargets(activeIndex, metrics) {
  const targets = {
    x: [0, metrics.width / 2, metrics.width],
    y: [0, metrics.height / 2, metrics.height],
  };

  grid.querySelectorAll(".record-item:not([hidden])").forEach((item) => {
    const index = Number(item.dataset.index);
    if (index === activeIndex) return;
    const size = getAlbumPanelSize(index, metrics);
    const left = item.canvasX || 0;
    const top = item.canvasY || 0;
    targets.x.push(left, left + size / 2, left + size);
    targets.y.push(top, top + size / 2, top + size);
  });

  return {
    x: [...new Set(targets.x.map((value) => Number(value.toFixed(2))))],
    y: [...new Set(targets.y.map((value) => Number(value.toFixed(2))))],
  };
}

function findMoveSnap(axis, rawPosition) {
  const drag = activeDrag;
  if (!drag) return undefined;

  const limit = axis === "x" ? canvasMetrics.width : canvasMetrics.height;
  const maxPosition = Math.max(0, limit - drag.size);
  const subjects = axis === "x" ? ["left", "centerX", "right"] : ["top", "centerY", "bottom"];
  const offsets = [0, drag.size / 2, drag.size].map((value, index) => ({
    value,
    priority: index === 1 ? 1 : 0,
    subject: subjects[index],
  }));
  const candidates = [];
  const retained = drag.snapCandidates[axis];
  if (retained) {
    const retainedDistance = Math.abs(retained.position - rawPosition);
    if (retainedDistance <= ALIGN_SNAP_RELEASE_THRESHOLD) {
      candidates.push({ ...retained, distance: retainedDistance, retained: true });
    }
  }

  drag.targets[axis].forEach((target) => {
    offsets.forEach((offset) => {
      const position = target - offset.value;
      const distance = Math.abs(position - rawPosition);
      if (position >= 0 && position <= maxPosition && distance <= ALIGN_SNAP_THRESHOLD) {
        candidates.push({ axis, target, position, distance, priority: offset.priority, subject: offset.subject });
      }
    });
  });

  candidates.sort((a, b) => a.distance - b.distance || a.priority - b.priority);
  drag.snapCandidates[axis] = candidates[0];
  return drag.snapCandidates[axis];
}

function showAlignmentFeedback({ xSnap, ySnap, item }) {
  const x = xSnap?.target;
  const y = ySnap?.target;
  const hasSnap = x !== undefined || y !== undefined;
  verticalGuide.style.setProperty("--guide-position", `${x || 0}px`);
  horizontalGuide.style.setProperty("--guide-position", `${y || 0}px`);
  verticalGuide.classList.toggle("is-visible", x !== undefined);
  horizontalGuide.classList.toggle("is-visible", y !== undefined);
  item.classList.toggle("is-snapped", hasSnap);
}

function moveAlbumFromPointer(pointer) {
  if (!activeDrag || !canvasMetrics) return;
  const maxX = Math.max(0, canvasMetrics.width - activeDrag.size);
  const maxY = Math.max(0, canvasMetrics.height - activeDrag.size);
  const rawX = Math.min(maxX, Math.max(0, pointer.clientX - canvasMetrics.left - activeDrag.offsetX));
  const rawY = Math.min(maxY, Math.max(0, pointer.clientY - canvasMetrics.top - activeDrag.offsetY));
  const snapX = findMoveSnap("x", rawX);
  const snapY = findMoveSnap("y", rawY);

  setItemPosition(
    activeDrag.item,
    activeDrag.index,
    snapX?.position ?? rawX,
    snapY?.position ?? rawY,
    canvasMetrics,
    true,
    false,
  );
  showAlignmentFeedback({
    xSnap: snapX,
    ySnap: snapY,
    item: activeDrag.item,
  });
}

function findResizeSnap(rawSize) {
  const resize = activeResize;
  if (!resize) return { size: rawSize };
  const candidates = [];
  if (resize.snapCandidate) {
    const divisor = resize.snapCandidate.priority === 1 ? 2 : 1;
    const retainedDistance = Math.abs(resize.snapCandidate.size - rawSize) / divisor;
    if (retainedDistance <= ALIGN_SNAP_RELEASE_THRESHOLD) {
      candidates.push({ ...resize.snapCandidate, distance: retainedDistance, retained: true });
    }
  }

  const addCandidates = (axis, anchor, direction) => {
    const edgeSubject = axis === "x"
      ? direction === 1 ? "right" : "left"
      : direction === 1 ? "bottom" : "top";
    const centerSubject = axis === "x" ? "centerX" : "centerY";
    resize.targets[axis].forEach((target) => {
      const edgeSize = direction * (target - anchor);
      const edgeDistance = Math.abs(edgeSize - rawSize);
      if (edgeSize >= resize.minSize && edgeSize <= resize.maxSize && edgeDistance <= ALIGN_SNAP_THRESHOLD) {
        candidates.push({ axis, target, size: edgeSize, distance: edgeDistance, priority: 0, subject: edgeSubject });
      }

      const centerSize = direction * (target - anchor) * 2;
      const centerDistance = Math.abs(centerSize - rawSize) / 2;
      if (centerSize >= resize.minSize && centerSize <= resize.maxSize && centerDistance <= ALIGN_SNAP_THRESHOLD) {
        candidates.push({ axis, target, size: centerSize, distance: centerDistance, priority: 1, subject: centerSubject });
      }
    });
  };

  addCandidates("x", resize.anchorX, resize.xDirection);
  addCandidates("y", resize.anchorY, resize.yDirection);
  candidates.sort((a, b) => a.distance - b.distance || a.priority - b.priority);
  resize.snapCandidate = candidates[0];
  return resize.snapCandidate || { size: rawSize };
}

function findGuideMatch(axis, size) {
  if (!activeResize) return undefined;
  const anchor = axis === "x" ? activeResize.anchorX : activeResize.anchorY;
  const direction = axis === "x" ? activeResize.xDirection : activeResize.yDirection;
  const edgeSubject = axis === "x"
    ? direction === 1 ? "right" : "left"
    : direction === 1 ? "bottom" : "top";
  const subjectLines = [
    { value: anchor + direction * size, subject: edgeSubject },
    { value: anchor + direction * size / 2, subject: axis === "x" ? "centerX" : "centerY" },
  ];
  let match;

  activeResize.targets[axis].forEach((target) => {
    subjectLines.forEach((subject) => {
      const distance = Math.abs(subject.value - target);
      if (distance <= 0.8 && (!match || distance < match.distance)) {
        match = { axis, target, distance, subject: subject.subject };
      }
    });
  });
  return match;
}

function updateAlignmentGuides(size, snap) {
  const xSnap = snap.axis === "x" ? snap : findGuideMatch("x", size);
  const ySnap = snap.axis === "y" ? snap : findGuideMatch("y", size);
  showAlignmentFeedback({ xSnap, ySnap, item: activeResize.item });
}

function hideAlignmentGuides() {
  verticalGuide.classList.remove("is-visible");
  horizontalGuide.classList.remove("is-visible");
  grid.querySelector(".record-item.is-snapped")?.classList.remove("is-snapped");
}

function startAlbumResize(event) {
  const handle = event.target.closest(".resize-handle");
  const item = handle?.closest(".record-item");
  if (!handle || !item || activeDrag || !event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;

  const metrics = canvasMetrics || getCanvasMetrics(layoutSettings[grid.dataset.layout]);
  canvasMetrics = metrics;
  const index = Number(item.dataset.index);
  const startSize = getAlbumPanelSize(index, metrics);
  const directions = getCornerDirections(handle.dataset.corner);
  const anchorX = directions.x === 1 ? item.canvasX : item.canvasX + startSize;
  const anchorY = directions.y === 1 ? item.canvasY : item.canvasY + startSize;
  activeResize = {
    handle,
    item,
    index,
    corner: handle.dataset.corner,
    pointerId: event.pointerId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startSize,
    anchorX,
    anchorY,
    xDirection: directions.x,
    yDirection: directions.y,
    minSize: PANEL_SIZE * sceneScale * MIN_ALBUM_SCALE,
    maxSize: Math.min(
      PANEL_SIZE * sceneScale * MAX_ALBUM_SCALE,
      directions.x === 1 ? metrics.width - anchorX : anchorX,
      directions.y === 1 ? metrics.height - anchorY : anchorY,
    ),
    targets: collectAlignmentTargets(index, metrics),
  };

  hideAlignmentGuides();
  bringItemToFront(item);
  grid.classList.add("is-resizing");
  item.classList.add("is-resizing");
  handle.setPointerCapture(event.pointerId);
  document.body.dataset.canvasInteracted = "true";
  event.preventDefault();
}

function resizeAlbumFromPointer(pointer) {
  if (!activeResize || !canvasMetrics) return;
  const deltaX = activeResize.xDirection * (pointer.clientX - activeResize.startClientX);
  const deltaY = activeResize.yDirection * (pointer.clientY - activeResize.startClientY);
  const delta = Math.abs(deltaX) >= Math.abs(deltaY) ? deltaX : deltaY;
  const rawSize = Math.min(activeResize.maxSize, Math.max(activeResize.minSize, activeResize.startSize + delta));
  const snap = findResizeSnap(rawSize);
  const nextSize = snap.size;
  const nextX = activeResize.xDirection === 1 ? activeResize.anchorX : activeResize.anchorX - nextSize;
  const nextY = activeResize.yDirection === 1 ? activeResize.anchorY : activeResize.anchorY - nextSize;
  setItemScale(activeResize.item, activeResize.index, nextSize / (PANEL_SIZE * sceneScale));
  setItemPosition(
    activeResize.item,
    activeResize.index,
    nextX,
    nextY,
    canvasMetrics,
    true,
    false,
  );
  activeResize.currentSize = nextSize;
  updateAlignmentGuides(nextSize, snap);
}

function flushPointerFrame() {
  pointerFrame = undefined;
  if (!pendingPointer) return;
  const pointer = pendingPointer;
  pendingPointer = undefined;

  if (activeResize && activeResize.pointerId === pointer.pointerId) {
    resizeAlbumFromPointer(pointer);
    return;
  }

  if (activeDrag && activeDrag.pointerId === pointer.pointerId && canvasMetrics) {
    moveAlbumFromPointer(pointer);
    return;
  }

  updateReflectionFromPointer(pointer.clientX, pointer.clientY);
}

function moveAlbum(event) {
  if (activeDrag?.pointerId === event.pointerId) {
    activeDrag.lastClientX = event.clientX;
    activeDrag.lastClientY = event.clientY;
  }
  pendingPointer = {
    clientX: event.clientX,
    clientY: event.clientY,
    pointerId: event.pointerId,
  };
  if (!pointerFrame) pointerFrame = window.requestAnimationFrame(flushPointerFrame);
  if (activeDrag?.pointerId === event.pointerId || activeResize?.pointerId === event.pointerId) event.preventDefault();
}

function finishAlbumDrag(event) {
  if (!activeDrag || activeDrag.pointerId !== event.pointerId) return;
  if (pointerFrame) window.cancelAnimationFrame(pointerFrame);
  pointerFrame = undefined;
  pendingPointer = undefined;

  const { item } = activeDrag;
  const cancelled = event.type === "pointercancel";
  if (!cancelled) moveAlbumFromPointer({ clientX: event.clientX, clientY: event.clientY });
  updateItemReflection(item, item.canvasX, item.canvasY);
  hideAlignmentGuides();
  if (!cancelled) updateReflectionFromPointer(event.clientX, event.clientY);
  grid.classList.remove("is-dragging");
  item.classList.remove("is-dragging");
  item.setAttribute("aria-grabbed", "false");
  if (item.hasPointerCapture(event.pointerId)) item.releasePointerCapture(event.pointerId);
  activeDrag = undefined;
}

function finishAlbumResize(event) {
  if (!activeResize || activeResize.pointerId !== event.pointerId) return;
  if (pointerFrame) window.cancelAnimationFrame(pointerFrame);
  pointerFrame = undefined;
  pendingPointer = undefined;

  const { handle, item } = activeResize;
  if (event.type !== "pointercancel") {
    resizeAlbumFromPointer({ clientX: event.clientX, clientY: event.clientY });
  }
  updateItemReflection(item, item.canvasX, item.canvasY);
  hideAlignmentGuides();
  grid.classList.remove("is-resizing");
  item.classList.remove("is-resizing");
  if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
  activeResize = undefined;
}

function resizeAlbumWithKeyboard(event) {
  const handle = event.target.closest(".resize-handle");
  const item = handle?.closest(".record-item");
  const layout = layoutSettings[grid.dataset.layout];
  if (!handle || !item || !layout) return;

  const direction = ["ArrowUp", "ArrowRight"].includes(event.key)
    ? 1
    : ["ArrowDown", "ArrowLeft"].includes(event.key)
      ? -1
      : 0;
  if (!direction && event.key !== "Home") return;

  const metrics = canvasMetrics || getCanvasMetrics(layout);
  canvasMetrics = metrics;
  const index = Number(item.dataset.index);
  const corner = handle.dataset.corner;
  const directions = getCornerDirections(corner);
  const currentSize = getAlbumPanelSize(index, metrics);
  const anchorX = directions.x === 1 ? item.canvasX : item.canvasX + currentSize;
  const anchorY = directions.y === 1 ? item.canvasY : item.canvasY + currentSize;
  const maxSize = Math.min(
    PANEL_SIZE * sceneScale * MAX_ALBUM_SCALE,
    directions.x === 1 ? metrics.width - anchorX : anchorX,
    directions.y === 1 ? metrics.height - anchorY : anchorY,
  );
  const step = event.shiftKey ? 0.15 : 0.05;
  const requestedScale = event.key === "Home" ? 1 : getAlbumScale(index) + direction * step;
  const nextSize = Math.min(maxSize, Math.max(PANEL_SIZE * sceneScale * MIN_ALBUM_SCALE, requestedScale * PANEL_SIZE * sceneScale));
  const nextX = directions.x === 1 ? anchorX : anchorX - nextSize;
  const nextY = directions.y === 1 ? anchorY : anchorY - nextSize;
  setItemScale(item, index, nextSize / (PANEL_SIZE * sceneScale));
  setItemPosition(item, index, nextX, nextY, metrics);
  bringItemToFront(item);
  document.body.dataset.canvasInteracted = "true";
  event.preventDefault();
}

function moveAlbumWithKeyboard(event) {
  const directions = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
  };
  const direction = directions[event.key];
  if (!direction || event.target.closest(".resize-handle")) return;

  const item = event.target.closest(".record-item");
  const layout = layoutSettings[grid.dataset.layout];
  if (!item || !layout) return;
  const step = event.shiftKey ? 20 : 5;
  const metrics = canvasMetrics || getCanvasMetrics(layout);
  canvasMetrics = metrics;
  const index = Number(item.dataset.index);
  setItemPosition(
    item,
    index,
    (item.canvasX || 0) + direction[0] * step,
    (item.canvasY || 0) + direction[1] * step,
    metrics,
  );
  bringItemToFront(item);
  document.body.dataset.canvasInteracted = "true";
  event.preventDefault();
}

function resetAlbumPositions() {
  const layout = layoutSettings[grid.dataset.layout];
  if (!layout) return;
  albumSizes = records.map(() => 1);
  hideAlignmentGuides();
  fitSceneToViewport(layout, true);
  grid.querySelectorAll(".record-item").forEach((item, index) => {
    item.style.zIndex = String(index + 1);
  });
  topStackOrder = records.length;
  delete document.body.dataset.canvasInteracted;

  const label = resetPositionsButton.querySelector("span");
  label.textContent = "已重置";
  window.setTimeout(() => {
    label.textContent = "重置布局";
  }, 1200);
}

function encodeBase64Url(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function isAllowedSharedCover(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (/(^|\.)music\.126\.net$/i.test(url.hostname) || url.hostname.toLowerCase() === "y.gtimg.cn")
    );
  } catch {
    return false;
  }
}

function compactShareState() {
  const layout = layoutSettings[grid.dataset.layout || "4x2"];
  return {
    v: 3,
    l: grid.dataset.layout || "4x2",
    p: importedPlaylistName,
    t: importedCovers.slice(0, records.length).map((track) => ({
      n: track.name,
      a: track.artist,
      b: track.album,
      c: track.cover,
    })),
    o: albumPositions.slice(0, layout.visible).map((position) => [
      Number((position?.x || 0).toFixed(POSITION_PRECISION)),
      Number((position?.y || 0).toFixed(POSITION_PRECISION)),
    ]),
    s: albumSizes.slice(0, layout.visible).map((_, index) => Number(getAlbumScale(index).toFixed(3))),
  };
}

function readShareState() {
  const encoded = new URLSearchParams(window.location.hash.slice(1)).get("share");
  if (!encoded || encoded.length > 24_000) return null;

  try {
    const state = decodeBase64Url(encoded);
    if (![1, 2, 3].includes(state?.v) || !layoutSettings[state.l] || !Array.isArray(state.t)) return null;

    const tracks = state.t.slice(0, records.length).map((track) => ({
      name: String(track?.n || "未命名歌曲").slice(0, 160),
      artist: String(track?.a || "未知艺人").slice(0, 160),
      album: String(track?.b || "未知专辑").slice(0, 160),
      cover: String(track?.c || ""),
    }));

    if (!tracks.length || tracks.some((track) => !isAllowedSharedCover(track.cover))) return null;
    const positions = state.v >= 2 && Array.isArray(state.o)
      ? state.o.slice(0, records.length).map((position) => ({
          x: Number(position?.[0]),
          y: Number(position?.[1]),
        }))
      : [];
    const hasValidPositions = positions.length >= tracks.length && positions.every((position) => (
      Number.isFinite(position.x) &&
      Number.isFinite(position.y) &&
      position.x >= 0 && position.x <= 1 &&
      position.y >= 0 && position.y <= 1
    ));
    const sizes = state.v >= 3 && Array.isArray(state.s)
      ? state.s.slice(0, records.length).map(Number)
      : [];
    const hasValidSizes = sizes.length >= tracks.length && sizes.every((size) => (
      Number.isFinite(size) && size >= MIN_ALBUM_SCALE && size <= MAX_ALBUM_SCALE
    ));

    return {
      layout: state.l,
      playlistName: String(state.p || "分享歌单").slice(0, 160),
      tracks,
      positions: hasValidPositions ? positions : [],
      sizes: hasValidSizes ? sizes : [],
    };
  } catch {
    return null;
  }
}

function buildShareUrl() {
  const url = new URL("/share", window.location.origin);
  url.hash = `share=${encodeBase64Url(compactShareState())}`;
  return url.href;
}

function enableSharing() {
  const isHidden = importedCovers.length === 0;
  shareButton.hidden = isHidden;
  shareImageButton.hidden = isHidden;
}

function fallbackCopyText(value) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("浏览器没有允许复制");
}

async function copyShareLink() {
  const shareUrl = buildShareUrl();

  try {
    let copied = false;
    try {
      fallbackCopyText(shareUrl);
      copied = true;
    } catch {
      // 部分浏览器已移除 execCommand，再尝试现代剪贴板接口。
    }

    if (!copied && navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(shareUrl);
      copied = true;
    }
    if (!copied) throw new Error("浏览器没有允许复制");

    window.clearTimeout(shareFeedbackTimer);
    shareButton.dataset.state = "copied";
    shareButton.querySelector("span").textContent = "已复制";
    shareButton.title = shareUrl;
    shareFeedbackTimer = window.setTimeout(() => {
      shareButton.dataset.state = "";
      shareButton.querySelector("span").textContent = "分享链接";
      shareButton.title = "复制可复原当前墙面的分享链接";
    }, 1800);
  } catch {
    shareButton.querySelector("span").textContent = "复制失败";
    shareButton.title = "无法访问剪贴板，请检查浏览器权限";
  }
}

function loadCanvasCover(cover) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("有一张专辑封面读取失败"));
    image.src = `/api/cover?url=${encodeURIComponent(cover)}`;
  });
}

function roundedRectPath(context, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.arcTo(x + width, y, x + width, y + height, safeRadius);
  context.arcTo(x + width, y + height, x, y + height, safeRadius);
  context.arcTo(x, y + height, x, y, safeRadius);
  context.arcTo(x, y, x + width, y, safeRadius);
  context.closePath();
}

function drawShareWallBackground(context, width, height) {
  const wallTone = context.createLinearGradient(0, 0, width, height);
  wallTone.addColorStop(0, "#e2ded3");
  wallTone.addColorStop(0.52, "#d9d4c8");
  wallTone.addColorStop(1, "#cdc7ba");
  context.fillStyle = wallTone;
  context.fillRect(0, 0, width, height);

  const ceilingLight = context.createRadialGradient(width * 0.5, -height * 0.06, 0, width * 0.5, 0, width * 0.64);
  ceilingLight.addColorStop(0, "rgba(255, 247, 222, .78)");
  ceilingLight.addColorStop(0.46, "rgba(255, 238, 198, .25)");
  ceilingLight.addColorStop(1, "rgba(255, 238, 198, 0)");
  context.fillStyle = ceilingLight;
  context.fillRect(0, 0, width, height);

  let seed = 1487;
  context.fillStyle = "rgba(60, 55, 47, .022)";
  for (let index = 0; index < 3200; index += 1) {
    seed = (seed * 16807) % 2147483647;
    const x = (seed / 2147483647) * width;
    seed = (seed * 16807) % 2147483647;
    const y = (seed / 2147483647) * height;
    context.fillRect(x, y, 1, 1);
  }
}

function drawShareScrew(context, x, y, radius) {
  const metal = context.createRadialGradient(x - radius * 0.34, y - radius * 0.36, radius * 0.08, x, y, radius);
  metal.addColorStop(0, "#ffffff");
  metal.addColorStop(0.22, "#d9d7d1");
  metal.addColorStop(0.62, "#86857f");
  metal.addColorStop(0.82, "#bbb8af");
  metal.addColorStop(1, "#5e5d58");
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fillStyle = metal;
  context.shadowColor = "rgba(28, 27, 23, .42)";
  context.shadowBlur = radius * 0.65;
  context.shadowOffsetX = radius * 0.24;
  context.shadowOffsetY = radius * 0.36;
  context.fill();
  context.shadowColor = "transparent";
  context.lineWidth = Math.max(1, radius * 0.12);
  context.strokeStyle = "rgba(54, 53, 49, .5)";
  context.stroke();
}

function drawSharePanel(context, image, x, y, size, variation) {
  context.save();
  context.translate(x + size / 2, y + size / 2);
  context.rotate((variation.rotate * Math.PI) / 180);
  context.translate(-size / 2, -size / 2);

  roundedRectPath(context, 0, 0, size, size, size * 0.012);
  context.fillStyle = "rgba(255, 255, 255, .07)";
  context.shadowColor = "rgba(45, 40, 32, .24)";
  context.shadowBlur = size * 0.075;
  context.shadowOffsetX = size * 0.025;
  context.shadowOffsetY = size * 0.062;
  context.fill();
  context.shadowColor = "transparent";

  const inset = size * 0.13;
  const coverSize = size - inset * 2;
  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
  const sourceX = (image.naturalWidth - sourceSize) / 2;
  const sourceY = (image.naturalHeight - sourceSize) / 2;
  context.shadowColor = "rgba(27, 25, 21, .2)";
  context.shadowBlur = size * 0.036;
  context.shadowOffsetY = size * 0.018;
  context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, inset, inset, coverSize, coverSize);
  context.shadowColor = "transparent";

  context.fillStyle = "rgba(255, 239, 203, .055)";
  context.fillRect(inset, inset, coverSize, coverSize);

  roundedRectPath(context, 0, 0, size, size, size * 0.012);
  context.fillStyle = "rgba(255, 255, 255, .018)";
  context.fill();
  context.lineWidth = Math.max(1.2, size * 0.006);
  context.strokeStyle = "rgba(238, 248, 246, .58)";
  context.stroke();

  roundedRectPath(context, size * 0.012, size * 0.012, size * 0.976, size * 0.976, size * 0.008);
  context.lineWidth = Math.max(0.8, size * 0.003);
  context.strokeStyle = "rgba(83, 101, 105, .16)";
  context.stroke();

  context.save();
  roundedRectPath(context, 0, 0, size, size, size * 0.012);
  context.clip();
  const reflection = context.createLinearGradient(size * 0.06, size * 0.8, size * 0.92, size * 0.08);
  reflection.addColorStop(0, "rgba(255, 255, 255, 0)");
  reflection.addColorStop(0.43, "rgba(255, 255, 255, 0)");
  reflection.addColorStop(0.49, "rgba(255, 255, 255, .18)");
  reflection.addColorStop(0.54, "rgba(255, 255, 255, .035)");
  reflection.addColorStop(0.61, "rgba(255, 255, 255, 0)");
  context.fillStyle = reflection;
  context.fillRect(0, 0, size, size);
  context.restore();

  const screwInset = size * 0.067;
  const screwRadius = Math.max(4.8, size * 0.021);
  drawShareScrew(context, screwInset, screwInset, screwRadius);
  drawShareScrew(context, size - screwInset, screwInset, screwRadius);
  drawShareScrew(context, screwInset, size - screwInset, screwRadius);
  drawShareScrew(context, size - screwInset, size - screwInset, screwRadius);
  context.restore();
}

function drawShareImage(images, layout) {
  const width = 1600;
  const height = 1000;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: false });
  drawShareWallBackground(context, width, height);

  const sourceWidth = stage.clientWidth || width;
  const sourceHeight = stage.clientHeight || height;
  const viewportScale = Math.min(width / sourceWidth, height / sourceHeight);
  const viewportWidth = sourceWidth * viewportScale;
  const viewportHeight = sourceHeight * viewportScale;
  const originX = (width - viewportWidth) / 2;
  const originY = (height - viewportHeight) / 2;
  images.forEach((image, index) => {
    if (index >= layout.visible) return;
    const variation = mountVariations[index] || mountVariations[0];
    const position = albumPositions[index] || { x: 0.5, y: 0.5 };
    const sourcePanelSize = PANEL_SIZE * sceneScale * getAlbumScale(index);
    const panelSize = sourcePanelSize * viewportScale;
    const maxSourceX = Math.max(0, sourceWidth - sourcePanelSize);
    const maxSourceY = Math.max(0, sourceHeight - sourcePanelSize);
    drawSharePanel(
      context,
      image,
      originX + position.x * maxSourceX * viewportScale + variation.x,
      originY + position.y * maxSourceY * viewportScale + variation.y,
      panelSize,
      variation,
    );
  });

  const vignette = context.createRadialGradient(width / 2, height / 2, height * 0.34, width / 2, height / 2, width * 0.68);
  vignette.addColorStop(0, "rgba(42, 38, 31, 0)");
  vignette.addColorStop(1, "rgba(42, 38, 31, .09)");
  context.fillStyle = vignette;
  context.fillRect(0, 0, width, height);

  context.save();
  context.font = '500 17px "Avenir Next", Avenir, sans-serif';
  context.textAlign = "right";
  context.textBaseline = "alphabetic";
  context.fillStyle = "rgba(56, 52, 45, .24)";
  context.fillText("presented by spin.qgaye.me", width - 48, height - 38);
  context.restore();
  return canvas;
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("图片导出失败"));
    }, "image/png");
  });
}

async function generateShareImage() {
  const generation = ++shareImageGeneration;
  const layout = layoutSettings[grid.dataset.layout || "4x2"];
  const tracks = importedCovers.slice(0, layout.visible);

  shareImageStage.dataset.state = "loading";
  shareImageStage.setAttribute("aria-busy", "true");
  shareImagePreview.hidden = true;
  shareImageStatus.dataset.state = "";
  shareImageStatus.textContent = `正在处理 ${tracks.length} 张专辑封面…`;

  try {
    if (!tracks.length) throw new Error("请先导入歌单，再生成分享图片");
    const images = await Promise.all(tracks.map((track) => loadCanvasCover(track.cover)));
    if (generation !== shareImageGeneration) return;

    const canvas = drawShareImage(images, layout);
    const blob = await canvasToBlob(canvas);
    if (generation !== shareImageGeneration) return;

    if (shareImageObjectUrl) URL.revokeObjectURL(shareImageObjectUrl);
    shareImageObjectUrl = URL.createObjectURL(blob);
    shareImagePreview.src = shareImageObjectUrl;
    shareImagePreview.hidden = false;
    shareImageStage.dataset.state = "ready";
    shareImageStage.setAttribute("aria-busy", "false");
    shareImageStatus.textContent = "1600 × 1000 PNG · 长按或右键上方图片即可保存";
  } catch (error) {
    if (generation !== shareImageGeneration) return;
    shareImageStage.dataset.state = "error";
    shareImageStage.setAttribute("aria-busy", "false");
    shareImageStatus.dataset.state = "error";
    shareImageStatus.textContent = error.message || "分享图片生成失败，请稍后重试";
  }
}

function openShareImageDialog() {
  shareImageDialog.showModal();
  generateShareImage();
}

function closeShareImageDialog() {
  shareImageGeneration += 1;
  shareImageDialog.close();
  shareImageButton.focus();
}

function updateDialogLayoutSummary(layout = layoutSettings[grid.dataset.layout || "4x2"]) {
  requiredCoverCount.textContent = layout.visible;
  currentLayoutLabel.textContent = layout.label;
}

function setImportStatus(message = "", state = "") {
  playlistStatus.textContent = message;
  playlistStatus.dataset.state = state;
}

function setImportLoading(isLoading) {
  playlistForm.setAttribute("aria-busy", String(isLoading));
  parsePlaylistButton.disabled = isLoading;
  playlistUrl.disabled = isLoading;
  platformOptions.forEach((option) => {
    option.disabled = isLoading;
  });
}

function getSelectedPlatform() {
  return platformOptions.find((option) => option.checked)?.value || "netease";
}

function updatePlatformUI() {
  const platform = playlistPlatforms[getSelectedPlatform()] || playlistPlatforms.netease;
  playlistDialogKicker.textContent = platform.kicker;
  playlistUrl.placeholder = platform.placeholder;
  playlistHint.textContent = platform.hint;
  setImportStatus();
}

function stopImportRequest() {
  importRequest?.abort();
  importRequest = undefined;
  setImportLoading(false);
}

function openImportDialog() {
  const layout = layoutSettings[grid.dataset.layout || "4x2"];
  updateDialogLayoutSummary(layout);
  setImportStatus();
  playlistDialog.showModal();
  window.requestAnimationFrame(() => playlistUrl.focus());
}

function closeImportDialog() {
  stopImportRequest();
  playlistDialog.close();
}

async function importPlaylist(event) {
  event.preventDefault();
  const layout = layoutSettings[grid.dataset.layout || "4x2"];
  const platform = playlistPlatforms[getSelectedPlatform()] || playlistPlatforms.netease;
  const value = playlistUrl.value.trim();

  if (!value) {
    setImportStatus(`请先粘贴${platform.name}歌单链接。`, "error");
    playlistUrl.focus();
    return;
  }

  if (window.location.protocol === "file:") {
    setImportStatus("歌单解析需要通过 node server.js 启动页面，不能直接双击 index.html。", "error");
    return;
  }

  stopImportRequest();
  importRequest = new AbortController();
  setImportLoading(true);
  setImportStatus(`正在读取歌单，并随机挑选 ${layout.visible} 张封面…`, "loading");

  try {
    const response = await fetch(platform.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: value, limit: layout.visible }),
      signal: importRequest.signal,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "歌单解析失败，请稍后重试");
    if (!result.tracks?.length) throw new Error("这个歌单里没有可用的专辑封面");

    importedCovers = result.tracks;
    importedPlaylistName = result.playlist.name;
    renderRecords();
    applyLayout(grid.dataset.layout || "4x2");
    enableSharing();

    const loadedCount = result.tracks.length;
    importButton.querySelector("span").textContent = "重新导入";
    importButton.title = `已从《${result.playlist.name}》导入 ${loadedCount} 张封面`;
    playlistDialog.close("imported");
    importButton.focus();
  } catch (error) {
    if (error.name !== "AbortError") {
      setImportStatus(error.message || "歌单解析失败，请稍后重试。", "error");
    }
  } finally {
    importRequest = undefined;
    setImportLoading(false);
  }
}

document.querySelectorAll(".layout-option").forEach((button) => {
  button.addEventListener("click", () => applyLayout(button.dataset.layout));
});

importButton.addEventListener("click", openImportDialog);
resetPositionsButton.addEventListener("click", resetAlbumPositions);
shareButton.addEventListener("click", copyShareLink);
shareImageButton.addEventListener("click", openShareImageDialog);
document.querySelector("#closePlaylistDialog").addEventListener("click", closeImportDialog);
document.querySelector("#cancelPlaylistImport").addEventListener("click", closeImportDialog);
document.querySelector("#closeShareImageDialog").addEventListener("click", closeShareImageDialog);
playlistForm.addEventListener("submit", importPlaylist);
platformOptions.forEach((option) => option.addEventListener("change", updatePlatformUI));
playlistDialog.addEventListener("cancel", stopImportRequest);
playlistDialog.addEventListener("click", (event) => {
  if (event.target === playlistDialog) closeImportDialog();
});
shareImageDialog.addEventListener("cancel", () => {
  shareImageGeneration += 1;
});
shareImageDialog.addEventListener("click", (event) => {
  if (event.target === shareImageDialog) closeShareImageDialog();
});

grid.addEventListener("pointerdown", startAlbumResize);
grid.addEventListener("pointerdown", startAlbumDrag);
grid.addEventListener("pointermove", moveAlbum);
grid.addEventListener("pointerup", finishAlbumResize);
grid.addEventListener("pointerup", finishAlbumDrag);
grid.addEventListener("pointercancel", finishAlbumResize);
grid.addEventListener("pointercancel", finishAlbumDrag);
grid.addEventListener("keydown", resizeAlbumWithKeyboard);
grid.addEventListener("keydown", moveAlbumWithKeyboard);
grid.addEventListener("pointerleave", resetReflection);
window.addEventListener("resize", scheduleSceneFit, { passive: true });
window.visualViewport?.addEventListener("resize", scheduleSceneFit, { passive: true });
window.addEventListener("beforeunload", () => {
  if (shareImageObjectUrl) URL.revokeObjectURL(shareImageObjectUrl);
});

const sharedState = readShareState();
if (sharedState) {
  importedCovers = sharedState.tracks;
  importedPlaylistName = sharedState.playlistName;
  albumPositions = sharedState.positions;
  albumSizes = sharedState.sizes.length
    ? records.map((_, index) => sharedState.sizes[index] || 1)
    : records.map(() => 1);
  positionLayout = sharedState.positions.length ? sharedState.layout : "";
  importButton.querySelector("span").textContent = "重新导入";
  importButton.title = `当前墙面来自分享链接：《${importedPlaylistName}》`;
}

renderRecords();
applyLayout(sharedState?.layout || "4x2");
enableSharing();
document.fonts?.ready.then(scheduleSceneFit);
