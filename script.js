const PANEL_SIZE = 240;
const PANEL_GAP_X = 34;
const PANEL_GAP_Y = 32;
const POSITION_PRECISION = 5;
const MIN_ALBUM_SCALE = 0.45;
const MAX_ALBUM_SCALE = 1.8;
const ALIGN_SNAP_THRESHOLD = 12;
const ALIGN_SNAP_RELEASE_THRESHOLD = 20;
const GAP_SNAP_THRESHOLD = 18;
const GAP_SNAP_RELEASE_THRESHOLD = 28;
const WALL_CAMERA_FOV = 42;
const MIN_WALL_PERSPECTIVE = -18;
const MAX_WALL_PERSPECTIVE = 18;
const DEFAULT_WALL_PERSPECTIVE = -8;
const MIN_SPOTLIGHT_COUNT = 0;
const MAX_SPOTLIGHT_COUNT = 6;
const DEFAULT_SPOTLIGHT_COUNT = 3;
const MIN_SPOTLIGHT_POSITION = 0.055;
const MAX_SPOTLIGHT_POSITION = 0.945;
const SPOTLIGHT_POSITION_GAP = 0.045;
const DEFAULT_FRAME_TYPE = "acrylic";
const FRAME_TYPES = {
  acrylic: { label: "亚克力夹板", inset: 0.13 },
  glass: { label: "玻璃夹板", inset: 0.13 },
};

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
const wallPerspectiveControl = document.querySelector("#wallPerspectiveControl");
const wallPerspectiveValue = document.querySelector("#wallPerspectiveValue");
const spotlightCountControl = document.querySelector("#spotlightCountControl");
const spotlightCountValue = document.querySelector("#spotlightCountValue");
const spotlightHandles = document.querySelector("#spotlightHandles");
const alignmentGuides = document.querySelector("#alignmentGuides");
const verticalGuide = alignmentGuides.querySelector(".alignment-guide--vertical");
const horizontalGuide = alignmentGuides.querySelector(".alignment-guide--horizontal");
const horizontalSpacingGuide = alignmentGuides.querySelector(".spacing-guide--horizontal");
const verticalSpacingGuide = alignmentGuides.querySelector(".spacing-guide--vertical");
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
const moduleConfig = document.querySelector("#moduleConfig");
const moduleConfigIndex = document.querySelector("#moduleConfigIndex");
const moduleConfigTitle = document.querySelector("#moduleConfigTitle");
const moduleConfigMeta = document.querySelector("#moduleConfigMeta");
const closeModuleConfigButton = document.querySelector("#closeModuleConfig");
const frameTypeOptions = [...moduleConfig.querySelectorAll('input[name="albumFrameType"]')];

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
let albumFrameTypes = records.map(() => DEFAULT_FRAME_TYPE);
let positionLayout = "";
let activeDrag;
let activeResize;
let topStackOrder = records.length;
let canvasMetrics;
let pointerFrame;
let pendingPointer;
let configuredAlbumIndex;
let rendererSyncFrame;
let wallPerspective = DEFAULT_WALL_PERSPECTIVE;
let spotlightCount = DEFAULT_SPOTLIGHT_COUNT;
let spotlightPositions = [];
let activeSpotlightDrag;

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

function renderRecords() {
  grid.replaceChildren();

  records.forEach((record, index) => {
    const fragment = template.content.cloneNode(true);
    const item = fragment.querySelector(".record-item");
    const resizeHandles = [...fragment.querySelectorAll(".resize-handle")];
    const imported = importedCovers[index];
    const accessibleName = imported
      ? `${imported.name}，${imported.artist}，专辑《${imported.album}》`
      : `${record.name} 专辑展示`;

    item.dataset.index = String(index);
    item.dataset.frame = getAlbumFrameType(index);
    item.dataset.accessibleName = accessibleName;
    item.tabIndex = 0;
    item.setAttribute("role", "group");
    item.setAttribute("aria-label", `${accessibleName}，${FRAME_TYPES[getAlbumFrameType(index)].label}`);
    item.setAttribute("aria-describedby", "canvasHint");
    item.setAttribute("aria-roledescription", "可拖动专辑");
    item.setAttribute("aria-grabbed", "false");
    item.style.zIndex = String(index + 1);
    resizeHandles.forEach((handle) => {
      const cornerNames = { tl: "左上角", tr: "右上角", bl: "左下角", br: "右下角" };
      handle.setAttribute("aria-label", `从${cornerNames[handle.dataset.corner]}调整 ${accessibleName} 的大小`);
    });

    grid.append(fragment);
  });

  syncModuleConfigurator();
  scheduleVisualRendererSync();
}

function getAlbumFrameType(index) {
  const frameType = albumFrameTypes[index];
  return FRAME_TYPES[frameType] ? frameType : DEFAULT_FRAME_TYPE;
}

function setAlbumFrameType(item, index, value) {
  const frameType = FRAME_TYPES[value] ? value : DEFAULT_FRAME_TYPE;
  albumFrameTypes[index] = frameType;
  item.dataset.frame = frameType;
  item.setAttribute("aria-label", `${item.dataset.accessibleName}，${FRAME_TYPES[frameType].label}`);
  if (configuredAlbumIndex === index) {
    frameTypeOptions.forEach((option) => {
      option.checked = option.value === frameType;
    });
    moduleConfigMeta.textContent = getAlbumConfigCopy(index).meta;
  }
}

function changeAlbumFrame(event) {
  const option = event.target.closest('input[name="albumFrameType"]');
  if (!option || configuredAlbumIndex === undefined) return;
  const item = grid.querySelector(`.record-item[data-index="${configuredAlbumIndex}"]`);
  if (!item) return;
  setAlbumFrameType(item, configuredAlbumIndex, option.value);
  bringItemToFront(item);
  document.body.dataset.canvasInteracted = "true";
}

function getAlbumConfigCopy(index) {
  const imported = importedCovers[index];
  const record = records[index];
  return imported
    ? { title: imported.album || imported.name, meta: `${imported.artist} · ${imported.name}` }
    : { title: record.name, meta: `${record.year} · ${FRAME_TYPES[getAlbumFrameType(index)].label}` };
}

function syncModuleConfigurator({ focus = false } = {}) {
  grid.querySelectorAll(".record-item.is-configured").forEach((item) => item.classList.remove("is-configured"));
  if (configuredAlbumIndex === undefined) return;
  const item = grid.querySelector(`.record-item[data-index="${configuredAlbumIndex}"]`);
  if (!item || item.hidden) {
    closeModuleConfigurator();
    return;
  }

  const copy = getAlbumConfigCopy(configuredAlbumIndex);
  moduleConfigIndex.textContent = `MODULE ${String(configuredAlbumIndex + 1).padStart(2, "0")}`;
  moduleConfigTitle.textContent = copy.title;
  moduleConfigMeta.textContent = copy.meta;
  frameTypeOptions.forEach((option) => {
    option.checked = option.value === getAlbumFrameType(configuredAlbumIndex);
  });
  item.classList.add("is-configured");
  moduleConfig.classList.add("is-open");
  moduleConfig.removeAttribute("inert");
  moduleConfig.setAttribute("aria-hidden", "false");
  document.body.dataset.configOpen = "true";
  if (focus) closeModuleConfigButton.focus({ preventScroll: true });
}

function openModuleConfigurator(item, options) {
  if (!item || item.hidden) return;
  configuredAlbumIndex = Number(item.dataset.index);
  bringItemToFront(item);
  syncModuleConfigurator(options);
}

function closeModuleConfigurator() {
  grid.querySelector(".record-item.is-configured")?.classList.remove("is-configured");
  configuredAlbumIndex = undefined;
  moduleConfig.classList.remove("is-open");
  moduleConfig.setAttribute("inert", "");
  moduleConfig.setAttribute("aria-hidden", "true");
  delete document.body.dataset.configOpen;
}

function getCanvasMetrics(layout) {
  const scene = getSceneSize(layout);
  const bounds = stage.getBoundingClientRect();
  const { width, height, left, top } = bounds;
  const insetX = Math.min(92, Math.max(16, width * 0.06));
  const insetY = Math.min(64, Math.max(30, height * 0.06));
  const availableWidth = Math.max(1, width - insetX * 2);
  const availableHeight = Math.max(1, height - insetY * 2);
  const perspectiveFit = 1 - Math.abs(wallPerspective) * 0.0065;
  const scale = Math.min(availableWidth / scene.width, availableHeight / scene.height, 1.12) * perspectiveFit;
  const panelSize = PANEL_SIZE * scale;

  return { scene, width, height, left, top, scale, panelSize };
}

function getWallCameraDistance(height) {
  return (height / 2) / Math.tan((WALL_CAMERA_FOV * Math.PI) / 360);
}

function getWallYaw() {
  return -wallPerspective;
}

function updateWallPerspectiveStyles(metrics) {
  const height = metrics?.height || stage.clientHeight || window.innerHeight;
  const cameraDistance = getWallCameraDistance(height);
  document.documentElement.style.setProperty("--wall-perspective-angle", `${getWallYaw()}deg`);
  document.documentElement.style.setProperty("--wall-camera-distance", `${cameraDistance.toFixed(2)}px`);
}

function updateWallPerspective(value, { refit = true } = {}) {
  const nextValue = Math.min(MAX_WALL_PERSPECTIVE, Math.max(MIN_WALL_PERSPECTIVE, Number(value) || 0));
  wallPerspective = nextValue;
  wallPerspectiveControl.value = String(nextValue);
  wallPerspectiveValue.value = nextValue === 0
    ? "正视"
    : `${nextValue < 0 ? "左侧" : "右侧"}近 ${Math.abs(nextValue)}°`;
  updateWallPerspectiveStyles(canvasMetrics);
  scheduleVisualRendererSync();
  if (refit) scheduleSceneFit();
}

function getDefaultSpotlightPositions(count) {
  const span = MAX_SPOTLIGHT_POSITION - MIN_SPOTLIGHT_POSITION;
  return Array.from({ length: count }, (_, index) => (
    MIN_SPOTLIGHT_POSITION + ((index + 1) / (count + 1)) * span
  ));
}

function syncSpotlightPositions(count) {
  spotlightPositions = spotlightPositions
    .map(Number)
    .filter(Number.isFinite)
    .map((position) => Math.min(MAX_SPOTLIGHT_POSITION, Math.max(MIN_SPOTLIGHT_POSITION, position)))
    .sort((a, b) => a - b);

  if (!spotlightPositions.length && count) {
    spotlightPositions = getDefaultSpotlightPositions(count);
    return;
  }

  spotlightPositions = spotlightPositions.slice(0, count);
  while (spotlightPositions.length < count) {
    const boundaries = [MIN_SPOTLIGHT_POSITION, ...spotlightPositions, MAX_SPOTLIGHT_POSITION];
    let largestGapIndex = 0;
    for (let index = 1; index < boundaries.length - 1; index += 1) {
      if (boundaries[index + 1] - boundaries[index] > boundaries[largestGapIndex + 1] - boundaries[largestGapIndex]) {
        largestGapIndex = index;
      }
    }
    spotlightPositions.push((boundaries[largestGapIndex] + boundaries[largestGapIndex + 1]) / 2);
    spotlightPositions.sort((a, b) => a - b);
  }
}

function renderSpotlightHandles() {
  spotlightHandles.replaceChildren();
  spotlightPositions.slice(0, spotlightCount).forEach((position, index) => {
    const handle = document.createElement("button");
    handle.type = "button";
    handle.className = "spotlight-handle";
    handle.dataset.index = String(index);
    handle.style.setProperty("--spotlight-x", `${(position * 100).toFixed(3)}%`);
    handle.setAttribute("role", "slider");
    handle.setAttribute("aria-label", `移动第 ${index + 1} 盏头部射灯`);
    handle.setAttribute("aria-valuemin", String(Math.round(MIN_SPOTLIGHT_POSITION * 100)));
    handle.setAttribute("aria-valuemax", String(Math.round(MAX_SPOTLIGHT_POSITION * 100)));
    handle.setAttribute("aria-valuenow", String(Math.round(position * 100)));
    handle.title = `拖动第 ${index + 1} 盏射灯左右移动`;
    spotlightHandles.append(handle);
  });
}

function updateSpotlightCount(value) {
  const nextValue = Math.round(Math.min(MAX_SPOTLIGHT_COUNT, Math.max(MIN_SPOTLIGHT_COUNT, Number(value) || 0)));
  spotlightCount = nextValue;
  syncSpotlightPositions(nextValue);
  renderSpotlightHandles();
  spotlightCountControl.value = String(nextValue);
  spotlightCountValue.value = nextValue ? `${nextValue} 盏` : "关闭";
  scheduleVisualRendererSync();
}

function setSpotlightPosition(index, value) {
  if (!Number.isInteger(index) || !Number.isFinite(spotlightPositions[index])) return;
  const lower = index > 0
    ? spotlightPositions[index - 1] + SPOTLIGHT_POSITION_GAP
    : MIN_SPOTLIGHT_POSITION;
  const upper = index < spotlightCount - 1
    ? spotlightPositions[index + 1] - SPOTLIGHT_POSITION_GAP
    : MAX_SPOTLIGHT_POSITION;
  const position = Math.min(upper, Math.max(lower, value));
  spotlightPositions[index] = position;
  const handle = spotlightHandles.querySelector(`.spotlight-handle[data-index="${index}"]`);
  handle?.style.setProperty("--spotlight-x", `${(position * 100).toFixed(3)}%`);
  handle?.setAttribute("aria-valuenow", String(Math.round(position * 100)));
  scheduleVisualRendererSync();
}

function startSpotlightDrag(event) {
  const handle = event.target.closest(".spotlight-handle");
  const layout = layoutSettings[grid.dataset.layout || "4x2"];
  if (!handle || !layout || event.button !== 0) return;
  const metrics = canvasMetrics || getCanvasMetrics(layout);
  canvasMetrics = metrics;
  const index = Number(handle.dataset.index);
  const wallPoint = screenPointToWall(event.clientX, event.clientY, metrics);
  activeSpotlightDrag = {
    handle,
    index,
    pointerId: event.pointerId,
    offsetX: wallPoint.x - spotlightPositions[index] * metrics.width,
  };
  handle.classList.add("is-dragging");
  handle.setPointerCapture(event.pointerId);
  document.body.dataset.canvasInteracted = "true";
  scheduleVisualRendererSync();
  event.preventDefault();
}

function moveSpotlight(event) {
  if (!activeSpotlightDrag || event.pointerId !== activeSpotlightDrag.pointerId) return;
  const layout = layoutSettings[grid.dataset.layout || "4x2"];
  if (!layout) return;
  const metrics = canvasMetrics || getCanvasMetrics(layout);
  const wallPoint = screenPointToWall(event.clientX, event.clientY, metrics);
  setSpotlightPosition(activeSpotlightDrag.index, (wallPoint.x - activeSpotlightDrag.offsetX) / metrics.width);
  event.preventDefault();
}

function finishSpotlightDrag(event) {
  if (!activeSpotlightDrag || event.pointerId !== activeSpotlightDrag.pointerId) return;
  activeSpotlightDrag.handle.classList.remove("is-dragging");
  if (activeSpotlightDrag.handle.hasPointerCapture(event.pointerId)) {
    activeSpotlightDrag.handle.releasePointerCapture(event.pointerId);
  }
  activeSpotlightDrag = undefined;
  scheduleVisualRendererSync();
}

function moveSpotlightWithKeyboard(event) {
  const handle = event.target.closest(".spotlight-handle");
  if (!handle || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  const index = Number(handle.dataset.index);
  const step = event.shiftKey ? 0.05 : 0.0125;
  const nextValue = event.key === "Home"
    ? MIN_SPOTLIGHT_POSITION
    : event.key === "End"
      ? MAX_SPOTLIGHT_POSITION
      : spotlightPositions[index] + (event.key === "ArrowLeft" ? -step : step);
  setSpotlightPosition(index, nextValue);
  document.body.dataset.canvasInteracted = "true";
  event.preventDefault();
}

function screenPointToWall(clientX, clientY, metrics) {
  const screenX = clientX - metrics.left - metrics.width / 2;
  const screenY = clientY - metrics.top - metrics.height / 2;
  const yaw = (getWallYaw() * Math.PI) / 180;
  const cameraDistance = getWallCameraDistance(metrics.height);
  const denominator = cameraDistance * Math.cos(yaw) - screenX * Math.sin(yaw);
  if (Math.abs(denominator) < 0.001) {
    return { x: clientX - metrics.left, y: clientY - metrics.top };
  }
  const wallX = (screenX * cameraDistance) / denominator;
  const depth = cameraDistance + wallX * Math.sin(yaw);
  const wallY = screenY * depth / cameraDistance;
  return {
    x: wallX + metrics.width / 2,
    y: wallY + metrics.height / 2,
  };
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
  scheduleVisualRendererSync();
  return nextScale;
}

function setItemPosition(item, index, x, y, metrics, updateState = true) {
  const panelSize = getAlbumPanelSize(index, metrics);
  const maxX = Math.max(0, metrics.width - panelSize);
  const maxY = Math.max(0, metrics.height - panelSize);
  const nextX = Math.min(maxX, Math.max(0, x));
  const nextY = Math.min(maxY, Math.max(0, y));

  item.style.setProperty("--item-x", `${nextX.toFixed(2)}px`);
  item.style.setProperty("--item-y", `${nextY.toFixed(2)}px`);
  item.canvasX = nextX;
  item.canvasY = nextY;
  if (updateState) {
    albumPositions[index] = {
      x: maxX ? nextX / maxX : 0,
      y: maxY ? nextY / maxY : 0,
    };
  }
  scheduleVisualRendererSync();
}

function scheduleVisualRendererSync() {
  if (rendererSyncFrame) return;
  rendererSyncFrame = window.requestAnimationFrame(() => {
    rendererSyncFrame = undefined;
    const layout = layoutSettings[grid.dataset.layout || "4x2"];
    const metrics = canvasMetrics || (layout ? getCanvasMetrics(layout) : undefined);
    if (!metrics) return;

    const albums = [...grid.querySelectorAll(".record-item")].map((item, index) => {
      const imported = importedCovers[index];
      const record = records[index];
      return {
        index,
        x: Number(item.canvasX || 0),
        y: Number(item.canvasY || 0),
        size: getAlbumPanelSize(index, metrics),
        rotation: mountVariations[index]?.rotate || 0,
        zIndex: Number(item.style.zIndex) || index + 1,
        hidden: item.hidden,
        cover: imported?.cover || null,
        name: imported?.album || record.name,
        year: String(record.year || ""),
        kind: record.type,
        frameType: getAlbumFrameType(index),
        label: record.label || null,
        labelInk: record.labelInk || null,
        monogram: record.monogram || null,
        title: record.title || record.name,
        subtitle: record.subtitle || String(record.year || ""),
      };
    });

    window.dispatchEvent(new CustomEvent("record-wall:sync", {
      detail: {
        width: metrics.width,
        height: metrics.height,
        wallYaw: getWallYaw(),
        spotlightCount,
        spotlightPositions: spotlightPositions.slice(0, spotlightCount),
        interacting: Boolean(activeDrag || activeResize || activeSpotlightDrag),
        albums,
      },
    }));
  });
}

function setVisualRendererInteraction(active) {
  window.dispatchEvent(new CustomEvent("record-wall:interaction", {
    detail: { active },
  }));
}

function fitSceneToViewport(layout, resetPositions = false) {
  const metrics = getCanvasMetrics(layout);
  canvasMetrics = metrics;
  sceneScale = metrics.scale;
  updateWallPerspectiveStyles(metrics);
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
    const wallPoint = screenPointToWall(activeDrag.lastClientX, activeDrag.lastClientY, metrics);
    activeDrag.offsetX = wallPoint.x - activeDrag.item.canvasX;
    activeDrag.offsetY = wallPoint.y - activeDrag.item.canvasY;
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
  syncModuleConfigurator();

  document.querySelectorAll(".layout-option").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.layout === layoutName));
  });

  updateDialogLayoutSummary(layout);
  window.cancelAnimationFrame(fitFrame);
  fitFrame = window.requestAnimationFrame(() => fitSceneToViewport(layout, layoutChanged));
  scheduleVisualRendererSync();
}

function bringItemToFront(item) {
  topStackOrder += 1;
  item.style.zIndex = String(topStackOrder);
  scheduleVisualRendererSync();
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
  const wallPoint = screenPointToWall(event.clientX, event.clientY, metrics);
  activeDrag = {
    item,
    index: Number(item.dataset.index),
    pointerId: event.pointerId,
    offsetX: wallPoint.x - x,
    offsetY: wallPoint.y - y,
    lastClientX: event.clientX,
    lastClientY: event.clientY,
    startClientX: event.clientX,
    startClientY: event.clientY,
    didMove: false,
    size: getAlbumPanelSize(Number(item.dataset.index), metrics),
    targets: collectAlignmentTargets(Number(item.dataset.index), metrics),
    snapCandidates: {},
  };
  setVisualRendererInteraction(true);

  hideAlignmentGuides();
  bringItemToFront(item);
  item.focus({ preventScroll: true });
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

function rangesOverlap(startA, endA, startB, endB, minimum = 0) {
  return Math.min(endA, endB) - Math.max(startA, startB) >= minimum;
}

function rectanglesOverlap(first, second, inset = 0.5) {
  return (
    first.left < second.right - inset &&
    first.right > second.left + inset &&
    first.top < second.bottom - inset &&
    first.bottom > second.top + inset
  );
}

function uniqueNumbers(values) {
  return [...new Set(values.map((value) => Number(value.toFixed(2))))];
}

function collectAlignmentTargets(activeIndex, metrics) {
  const targets = {
    x: [0, metrics.width / 2, metrics.width],
    y: [0, metrics.height / 2, metrics.height],
    rects: [],
    gaps: { x: [], y: [] },
    gapSources: { x: [], y: [] },
  };

  grid.querySelectorAll(".record-item:not([hidden])").forEach((item) => {
    const index = Number(item.dataset.index);
    if (index === activeIndex) return;
    const size = getAlbumPanelSize(index, metrics);
    const left = item.canvasX || 0;
    const top = item.canvasY || 0;
    targets.x.push(left, left + size / 2, left + size);
    targets.y.push(top, top + size / 2, top + size);
    targets.rects.push({ index, left, top, right: left + size, bottom: top + size, size });
  });

  targets.rects.forEach((first, firstIndex) => {
    targets.rects.slice(firstIndex + 1).forEach((second) => {
      const minimumOverlap = Math.min(first.size, second.size) * 0.25;
      if (rangesOverlap(first.top, first.bottom, second.top, second.bottom, minimumOverlap)) {
        const [left, right] = first.left <= second.left ? [first, second] : [second, first];
        const gap = right.left - left.right;
        if (gap >= 4 && gap <= Math.min(first.size, second.size) * 0.75) {
          targets.gaps.x.push(gap);
          targets.gapSources.x.push({
            gap,
            start: left.right,
            end: right.left,
            cross: Math.min(left.top, right.top) - 7,
          });
        }
      }
      if (rangesOverlap(first.left, first.right, second.left, second.right, minimumOverlap)) {
        const [top, bottom] = first.top <= second.top ? [first, second] : [second, first];
        const gap = bottom.top - top.bottom;
        if (gap >= 4 && gap <= Math.min(first.size, second.size) * 0.75) {
          targets.gaps.y.push(gap);
          targets.gapSources.y.push({
            gap,
            start: top.bottom,
            end: bottom.top,
            cross: Math.min(top.left, bottom.left) - 7,
          });
        }
      }
    });
  });

  return {
    x: uniqueNumbers(targets.x),
    y: uniqueNumbers(targets.y),
    rects: targets.rects,
    gaps: {
      x: uniqueNumbers(targets.gaps.x),
      y: uniqueNumbers(targets.gaps.y),
    },
    gapSources: targets.gapSources,
  };
}

function getMoveCandidateRect(axis, position, perpendicularPosition, size) {
  const left = axis === "x" ? position : perpendicularPosition;
  const top = axis === "y" ? position : perpendicularPosition;
  return { left, top, right: left + size, bottom: top + size };
}

function snapCandidateScore(candidate) {
  return candidate.distance + (candidate.kind === "gap" ? 0.45 : 0) + (candidate.priority || 0) * 0.12;
}

function addMoveGapCandidates(axis, rawPosition, perpendicularPosition, maxPosition, candidates) {
  const drag = activeDrag;
  if (!drag || !drag.targets.rects.length) return;
  const isX = axis === "x";
  const perpendicularStart = perpendicularPosition;
  const perpendicularEnd = perpendicularStart + drag.size;
  const relevantRects = drag.targets.rects.filter((rect) => {
    const start = isX ? rect.top : rect.left;
    const end = isX ? rect.bottom : rect.right;
    return rangesOverlap(perpendicularStart, perpendicularEnd, start, end, Math.min(drag.size, rect.size) * 0.25);
  });
  const startKey = isX ? "left" : "top";
  const endKey = isX ? "right" : "bottom";

  const addCandidate = (position, facingEdge, neighborEdge, gap, source, spacingSegments) => {
    const distance = Math.abs(position - rawPosition);
    if (position < 0 || position > maxPosition || distance > GAP_SNAP_THRESHOLD) return;
    const proposedRect = getMoveCandidateRect(axis, position, perpendicularPosition, drag.size);
    if (drag.targets.rects.some((rect) => rectanglesOverlap(proposedRect, rect))) return;
    candidates.push({
      axis,
      target: facingEdge,
      secondaryTarget: neighborEdge,
      position,
      distance,
      priority: 2,
      subject: "equalGap",
      kind: "gap",
      gap,
      source,
      spacingSegments,
    });
  };

  relevantRects.forEach((neighbor) => {
    drag.targets.gaps[axis].forEach((gap) => {
      const sourceSegment = drag.targets.gapSources?.[axis]?.find((source) => Math.abs(source.gap - gap) <= 0.02);
      const afterPosition = neighbor[endKey] + gap;
      const afterCross = isX
        ? Math.min(perpendicularPosition, neighbor.top) - 7
        : Math.min(perpendicularPosition, neighbor.left) - 7;
      addCandidate(afterPosition, afterPosition, neighbor[endKey], gap, "matched", [
        sourceSegment,
        { start: neighbor[endKey], end: afterPosition, cross: afterCross },
      ].filter(Boolean));

      const beforePosition = neighbor[startKey] - gap - drag.size;
      const beforeCross = isX
        ? Math.min(perpendicularPosition, neighbor.top) - 7
        : Math.min(perpendicularPosition, neighbor.left) - 7;
      addCandidate(beforePosition, beforePosition + drag.size, neighbor[startKey], gap, "matched", [
        sourceSegment,
        { start: beforePosition + drag.size, end: neighbor[startKey], cross: beforeCross },
      ].filter(Boolean));
    });
  });

  const sortedRects = [...relevantRects].sort((first, second) => first[startKey] - second[startKey]);
  sortedRects.slice(0, -1).forEach((before, beforeIndex) => {
    const after = sortedRects[beforeIndex + 1];
    const availableSpace = after[startKey] - before[endKey];
    const gap = (availableSpace - drag.size) / 2;
    if (gap < 4) return;
    const position = before[endKey] + gap;
    const cross = isX
      ? Math.min(perpendicularPosition, before.top, after.top) - 7
      : Math.min(perpendicularPosition, before.left, after.left) - 7;
    addCandidate(position, position, before[endKey], gap, "distributed", [
      { start: before[endKey], end: position, cross },
      { start: position + drag.size, end: after[startKey], cross },
    ]);
  });
}

function findMoveSnap(axis, rawPosition, perpendicularPosition) {
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
    const releaseThreshold = retained.kind === "gap" ? GAP_SNAP_RELEASE_THRESHOLD : ALIGN_SNAP_RELEASE_THRESHOLD;
    if (retainedDistance <= releaseThreshold) {
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

  addMoveGapCandidates(axis, rawPosition, perpendicularPosition, maxPosition, candidates);

  candidates.sort((a, b) => snapCandidateScore(a) - snapCandidateScore(b) || a.distance - b.distance);
  drag.snapCandidates[axis] = candidates[0];
  return drag.snapCandidates[axis];
}

function updateSpacingGuide(guide, snap) {
  const segments = snap?.kind === "gap" ? snap.spacingSegments?.slice(0, 2) || [] : [];
  [segments[0], segments[1]].forEach((segment, index) => {
    const number = index === 0 ? "one" : "two";
    const start = segment?.start ?? 0;
    const end = segment?.end ?? start;
    guide.style.setProperty(`--segment-${number}-start`, `${start}px`);
    guide.style.setProperty(`--segment-${number}-length`, `${Math.max(0, end - start)}px`);
    guide.style.setProperty(`--segment-${number}-cross`, `${Math.max(4, segment?.cross ?? 0)}px`);
  });
  guide.classList.toggle("is-visible", segments.length > 0);
  guide.classList.toggle("has-two-segments", segments.length > 1);
}

function showAlignmentFeedback({ xSnap, ySnap, item }) {
  const x = xSnap?.target;
  const y = ySnap?.target;
  const hasSnap = x !== undefined || y !== undefined;
  verticalGuide.style.setProperty("--guide-position", `${x ?? 0}px`);
  horizontalGuide.style.setProperty("--guide-position", `${y ?? 0}px`);
  verticalGuide.classList.toggle("is-visible", x !== undefined && xSnap?.kind !== "gap");
  horizontalGuide.classList.toggle("is-visible", y !== undefined && ySnap?.kind !== "gap");
  updateSpacingGuide(horizontalSpacingGuide, xSnap);
  updateSpacingGuide(verticalSpacingGuide, ySnap);
  item.classList.toggle("is-snapped", hasSnap);
}

function moveAlbumFromPointer(pointer) {
  if (!activeDrag || !canvasMetrics) return;
  const wallPoint = screenPointToWall(pointer.clientX, pointer.clientY, canvasMetrics);
  const maxX = Math.max(0, canvasMetrics.width - activeDrag.size);
  const maxY = Math.max(0, canvasMetrics.height - activeDrag.size);
  const rawX = Math.min(maxX, Math.max(0, wallPoint.x - activeDrag.offsetX));
  const rawY = Math.min(maxY, Math.max(0, wallPoint.y - activeDrag.offsetY));
  const snapX = findMoveSnap("x", rawX, rawY);
  const snapY = findMoveSnap("y", rawY, snapX?.position ?? rawX);

  setItemPosition(
    activeDrag.item,
    activeDrag.index,
    snapX?.position ?? rawX,
    snapY?.position ?? rawY,
    canvasMetrics,
  );
  showAlignmentFeedback({
    xSnap: snapX,
    ySnap: snapY,
    item: activeDrag.item,
  });
}

function getResizeCandidateRect(size) {
  const resize = activeResize;
  if (!resize) return undefined;
  const left = resize.xDirection === 1 ? resize.anchorX : resize.anchorX - size;
  const top = resize.yDirection === 1 ? resize.anchorY : resize.anchorY - size;
  return { left, top, right: left + size, bottom: top + size };
}

function buildResizeGapCandidates(axis, rawSize, threshold = GAP_SNAP_THRESHOLD) {
  const resize = activeResize;
  if (!resize) return [];
  const isX = axis === "x";
  const direction = isX ? resize.xDirection : resize.yDirection;
  const anchor = isX ? resize.anchorX : resize.anchorY;
  const startKey = isX ? "left" : "top";
  const endKey = isX ? "right" : "bottom";
  const candidates = [];

  resize.targets.rects.forEach((neighbor) => {
    const neighborEdge = direction === 1 ? neighbor[startKey] : neighbor[endKey];
    const isOnMovingSide = direction === 1 ? neighbor[startKey] >= anchor : neighbor[endKey] <= anchor;
    if (!isOnMovingSide) return;

    resize.targets.gaps[axis].forEach((gap) => {
      const size = direction === 1
        ? neighborEdge - gap - anchor
        : anchor - neighborEdge - gap;
      const distance = Math.abs(size - rawSize);
      if (size < resize.minSize || size > resize.maxSize || distance > threshold) return;

      const proposedRect = getResizeCandidateRect(size);
      const perpendicularOverlap = isX
        ? rangesOverlap(proposedRect.top, proposedRect.bottom, neighbor.top, neighbor.bottom, Math.min(size, neighbor.size) * 0.25)
        : rangesOverlap(proposedRect.left, proposedRect.right, neighbor.left, neighbor.right, Math.min(size, neighbor.size) * 0.25);
      if (!perpendicularOverlap || resize.targets.rects.some((rect) => rectanglesOverlap(proposedRect, rect))) return;

      const movingEdge = anchor + direction * size;
      const currentSegment = {
        start: Math.min(movingEdge, neighborEdge),
        end: Math.max(movingEdge, neighborEdge),
        cross: isX
          ? Math.min(proposedRect.top, neighbor.top) - 7
          : Math.min(proposedRect.left, neighbor.left) - 7,
      };
      const sourceSegment = resize.targets.gapSources?.[axis]?.find((source) => Math.abs(source.gap - gap) <= 0.02);

      candidates.push({
        axis,
        target: movingEdge,
        secondaryTarget: neighborEdge,
        size,
        distance,
        priority: 2,
        subject: "equalGap",
        kind: "gap",
        gap,
        spacingSegments: [sourceSegment, currentSegment].filter(Boolean),
      });
    });
  });

  return candidates;
}

function findResizeSnap(rawSize) {
  const resize = activeResize;
  if (!resize) return { size: rawSize };
  const candidates = [];
  if (resize.snapCandidate) {
    const divisor = resize.snapCandidate.priority === 1 ? 2 : 1;
    const retainedDistance = Math.abs(resize.snapCandidate.size - rawSize) / divisor;
    const releaseThreshold = resize.snapCandidate.kind === "gap"
      ? GAP_SNAP_RELEASE_THRESHOLD
      : ALIGN_SNAP_RELEASE_THRESHOLD;
    if (retainedDistance <= releaseThreshold) {
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
  candidates.push(...buildResizeGapCandidates("x", rawSize), ...buildResizeGapCandidates("y", rawSize));
  candidates.sort((a, b) => snapCandidateScore(a) - snapCandidateScore(b) || a.distance - b.distance);
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

function findResizeGapMatch(axis, size) {
  const candidates = buildResizeGapCandidates(axis, size, 0.8);
  candidates.sort((a, b) => a.distance - b.distance);
  return candidates[0];
}

function updateAlignmentGuides(size, snap) {
  const xSnap = snap.axis === "x" ? snap : findGuideMatch("x", size) || findResizeGapMatch("x", size);
  const ySnap = snap.axis === "y" ? snap : findGuideMatch("y", size) || findResizeGapMatch("y", size);
  showAlignmentFeedback({ xSnap, ySnap, item: activeResize.item });
}

function hideAlignmentGuides() {
  verticalGuide.classList.remove("is-visible");
  horizontalGuide.classList.remove("is-visible");
  horizontalSpacingGuide.classList.remove("is-visible", "has-two-segments");
  verticalSpacingGuide.classList.remove("is-visible", "has-two-segments");
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
  const wallPoint = screenPointToWall(event.clientX, event.clientY, metrics);
  const anchorX = directions.x === 1 ? item.canvasX : item.canvasX + startSize;
  const anchorY = directions.y === 1 ? item.canvasY : item.canvasY + startSize;
  activeResize = {
    handle,
    item,
    index,
    corner: handle.dataset.corner,
    pointerId: event.pointerId,
    startWallX: wallPoint.x,
    startWallY: wallPoint.y,
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
  setVisualRendererInteraction(true);

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
  const wallPoint = screenPointToWall(pointer.clientX, pointer.clientY, canvasMetrics);
  const deltaX = activeResize.xDirection * (wallPoint.x - activeResize.startWallX);
  const deltaY = activeResize.yDirection * (wallPoint.y - activeResize.startWallY);
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

}

function moveAlbum(event) {
  if (activeDrag?.pointerId === event.pointerId) {
    activeDrag.lastClientX = event.clientX;
    activeDrag.lastClientY = event.clientY;
    if (Math.hypot(event.clientX - activeDrag.startClientX, event.clientY - activeDrag.startClientY) > 4) {
      activeDrag.didMove = true;
    }
  }
  if (!activeDrag && !activeResize) return;
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

  const { item, didMove } = activeDrag;
  const cancelled = event.type === "pointercancel";
  if (!cancelled) moveAlbumFromPointer({ clientX: event.clientX, clientY: event.clientY });
  hideAlignmentGuides();
  grid.classList.remove("is-dragging");
  item.classList.remove("is-dragging");
  item.setAttribute("aria-grabbed", "false");
  if (item.hasPointerCapture(event.pointerId)) item.releasePointerCapture(event.pointerId);
  activeDrag = undefined;
  setVisualRendererInteraction(false);
  if (!cancelled && !didMove) openModuleConfigurator(item);
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
  hideAlignmentGuides();
  grid.classList.remove("is-resizing");
  item.classList.remove("is-resizing");
  if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
  activeResize = undefined;
  setVisualRendererInteraction(false);
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

function openModuleConfiguratorWithKeyboard(event) {
  if (!["Enter", " "].includes(event.key) || event.target.closest(".resize-handle")) return;
  const item = event.target.closest(".record-item");
  if (!item) return;
  openModuleConfigurator(item, { focus: true });
  event.preventDefault();
}

function resetAlbumPositions() {
  const layout = layoutSettings[grid.dataset.layout];
  if (!layout) return;
  albumSizes = records.map(() => 1);
  albumFrameTypes = records.map(() => DEFAULT_FRAME_TYPE);
  spotlightPositions = [];
  updateSpotlightCount(DEFAULT_SPOTLIGHT_COUNT);
  hideAlignmentGuides();
  fitSceneToViewport(layout, true);
  grid.querySelectorAll(".record-item").forEach((item, index) => {
    item.style.zIndex = String(index + 1);
    setAlbumFrameType(item, index, DEFAULT_FRAME_TYPE);
  });
  syncModuleConfigurator();
  topStackOrder = records.length;
  delete document.body.dataset.canvasInteracted;

  const label = resetPositionsButton.querySelector("span");
  label.textContent = "已重置";
  window.setTimeout(() => {
    label.textContent = "重置布局";
  }, 1200);
  scheduleVisualRendererSync();
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
    v: 7,
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
    f: albumFrameTypes.slice(0, layout.visible).map((_, index) => getAlbumFrameType(index)),
    q: wallPerspective,
    h: spotlightCount,
    r: spotlightPositions.slice(0, spotlightCount).map((position) => Number(position.toFixed(POSITION_PRECISION))),
  };
}

function readShareState() {
  const encoded = new URLSearchParams(window.location.hash.slice(1)).get("share");
  if (!encoded || encoded.length > 24_000) return null;

  try {
    const state = decodeBase64Url(encoded);
    if (![1, 2, 3, 4, 5, 6, 7].includes(state?.v) || !layoutSettings[state.l] || !Array.isArray(state.t)) return null;

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
    const frameTypes = state.v >= 4 && Array.isArray(state.f)
      ? state.f.slice(0, records.length).map(String)
      : [];
    const hasValidFrameTypes = frameTypes.length >= tracks.length && frameTypes.every((frameType) => FRAME_TYPES[frameType]);
    const perspective = state.v >= 5 ? Number(state.q) : DEFAULT_WALL_PERSPECTIVE;
    const hasValidPerspective = Number.isFinite(perspective) &&
      perspective >= MIN_WALL_PERSPECTIVE && perspective <= MAX_WALL_PERSPECTIVE;
    const sharedSpotlightCount = state.v >= 6 ? Number(state.h) : DEFAULT_SPOTLIGHT_COUNT;
    const hasValidSpotlightCount = Number.isInteger(sharedSpotlightCount) &&
      sharedSpotlightCount >= MIN_SPOTLIGHT_COUNT && sharedSpotlightCount <= MAX_SPOTLIGHT_COUNT;
    const sharedSpotlightPositions = state.v >= 7 && Array.isArray(state.r)
      ? state.r.slice(0, sharedSpotlightCount).map(Number)
      : [];
    const hasValidSpotlightPositions = sharedSpotlightPositions.length === sharedSpotlightCount &&
      sharedSpotlightPositions.every((position, index) => (
        Number.isFinite(position) &&
        position >= MIN_SPOTLIGHT_POSITION &&
        position <= MAX_SPOTLIGHT_POSITION &&
        (index === 0 || position - sharedSpotlightPositions[index - 1] >= SPOTLIGHT_POSITION_GAP)
      ));

    return {
      layout: state.l,
      playlistName: String(state.p || "分享歌单").slice(0, 160),
      tracks,
      positions: hasValidPositions ? positions : [],
      sizes: hasValidSizes ? sizes : [],
      frameTypes: hasValidFrameTypes ? frameTypes : [],
      perspective: hasValidPerspective ? perspective : DEFAULT_WALL_PERSPECTIVE,
      spotlightCount: hasValidSpotlightCount ? sharedSpotlightCount : DEFAULT_SPOTLIGHT_COUNT,
      spotlightPositions: hasValidSpotlightPositions ? sharedSpotlightPositions : [],
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

function requestRenderedShareImage() {
  return new Promise((resolve, reject) => {
    if (document.body.dataset.webglUnavailable === "true") {
      reject(new Error("当前浏览器无法渲染分享图片"));
      return;
    }

    let settled = false;
    const timeout = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error("分享图片渲染超时，请重试"));
    }, 12000);
    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      callback(value);
    };

    window.dispatchEvent(new CustomEvent("record-wall:export", {
      detail: {
        resolve: (blob) => finish(resolve, blob),
        reject: (error) => finish(reject, error),
      },
    }));
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
    await Promise.all(tracks.map((track) => loadCanvasCover(track.cover)));
    if (generation !== shareImageGeneration) return;

    scheduleVisualRendererSync();
    await new Promise((resolve) => window.requestAnimationFrame(resolve));
    const blob = await requestRenderedShareImage();
    if (generation !== shareImageGeneration) return;

    if (shareImageObjectUrl) URL.revokeObjectURL(shareImageObjectUrl);
    shareImageObjectUrl = URL.createObjectURL(blob);
    shareImagePreview.src = shareImageObjectUrl;
    await shareImagePreview.decode();
    if (generation !== shareImageGeneration) return;
    shareImageStage.style.setProperty(
      "--share-image-aspect",
      `${shareImagePreview.naturalWidth} / ${shareImagePreview.naturalHeight}`,
    );
    shareImagePreview.hidden = false;
    shareImageStage.dataset.state = "ready";
    shareImageStage.setAttribute("aria-busy", "false");
    shareImageStatus.textContent = `${shareImagePreview.naturalWidth} × ${shareImagePreview.naturalHeight} PNG · 长按或右键上方图片即可保存`;
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

moduleConfig.addEventListener("change", changeAlbumFrame);
closeModuleConfigButton.addEventListener("click", () => {
  const item = configuredAlbumIndex === undefined
    ? undefined
    : grid.querySelector(`.record-item[data-index="${configuredAlbumIndex}"]`);
  closeModuleConfigurator();
  item?.focus({ preventScroll: true });
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
wallPerspectiveControl.addEventListener("input", (event) => updateWallPerspective(event.target.value));
spotlightCountControl.addEventListener("input", (event) => updateSpotlightCount(event.target.value));
spotlightHandles.addEventListener("pointerdown", startSpotlightDrag);
spotlightHandles.addEventListener("pointermove", moveSpotlight);
spotlightHandles.addEventListener("pointerup", finishSpotlightDrag);
spotlightHandles.addEventListener("pointercancel", finishSpotlightDrag);
spotlightHandles.addEventListener("keydown", moveSpotlightWithKeyboard);
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
grid.addEventListener("keydown", openModuleConfiguratorWithKeyboard);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && moduleConfig.classList.contains("is-open")) closeModuleConfigurator();
});
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
  albumFrameTypes = sharedState.frameTypes.length
    ? records.map((_, index) => sharedState.frameTypes[index] || DEFAULT_FRAME_TYPE)
    : records.map(() => DEFAULT_FRAME_TYPE);
  spotlightPositions = sharedState.spotlightPositions;
  positionLayout = sharedState.positions.length ? sharedState.layout : "";
  importButton.querySelector("span").textContent = "重新导入";
  importButton.title = `当前墙面来自分享链接：《${importedPlaylistName}》`;
}

updateWallPerspective(sharedState?.perspective ?? DEFAULT_WALL_PERSPECTIVE, { refit: false });
updateSpotlightCount(sharedState?.spotlightCount ?? DEFAULT_SPOTLIGHT_COUNT);
renderRecords();
applyLayout(sharedState?.layout || "4x2");
enableSharing();
document.fonts?.ready.then(scheduleSceneFit);
