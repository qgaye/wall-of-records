const PANEL_SIZE = 240;
const PANEL_GAP_X = 34;
const PANEL_GAP_Y = 32;

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
const playlistDialog = document.querySelector("#playlistDialog");
const playlistForm = document.querySelector("#playlistImportForm");
const playlistUrl = document.querySelector("#playlistUrl");
const playlistStatus = document.querySelector("#playlistImportStatus");
const playlistDialogKicker = document.querySelector("#playlistDialogKicker");
const playlistHint = document.querySelector("#playlistHint");
const platformOptions = [...document.querySelectorAll('input[name="playlistPlatform"]')];
const importButton = document.querySelector("#openPlaylistImport");
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
    const variation = mountVariations[index];
    const imported = importedCovers[index];

    item.style.setProperty("--mount-x", `${variation.x}px`);
    item.style.setProperty("--mount-y", `${variation.y}px`);
    item.style.setProperty("--mount-rotate", `${variation.rotate}deg`);
    frame.setAttribute(
      "aria-label",
      imported ? `${imported.name}，${imported.artist}，专辑《${imported.album}》` : `${record.name} 专辑展示`,
    );

    if (imported) {
      slot.classList.add("album-slot--uploaded");
      slot.style.backgroundImage = `url("${imported.cover}")`;
    } else {
      buildGeneratedArtwork(slot, record);
    }

    grid.append(fragment);
  });
}

function positionReflectionCrops(layout) {
  const scene = getSceneSize(layout);
  grid.style.setProperty("--scene-width", `${scene.width}px`);
  grid.style.setProperty("--scene-height", `${scene.height}px`);

  grid.querySelectorAll(".record-item").forEach((item, index) => {
    const column = index % layout.columns;
    const row = Math.floor(index / layout.columns);
    const worldX = column * (PANEL_SIZE + PANEL_GAP_X);
    const worldY = row * (PANEL_SIZE + PANEL_GAP_Y);

    item.style.setProperty("--reflection-x", `${-worldX}px`);
    item.style.setProperty("--reflection-y", `${-worldY}px`);
  });
}

function fitSceneToViewport(layout) {
  const scene = getSceneSize(layout);
  const wallStyle = getComputedStyle(wall);
  const horizontalPadding = parseFloat(wallStyle.paddingLeft) + parseFloat(wallStyle.paddingRight);
  const verticalPadding = parseFloat(wallStyle.paddingTop) + parseFloat(wallStyle.paddingBottom);
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
  const availableWidth = wall.clientWidth - horizontalPadding;
  const availableHeight = viewportHeight - verticalPadding;
  const scale = Math.min(availableWidth / scene.width, availableHeight / scene.height, 1.12);

  grid.style.setProperty("--scene-scale", scale.toFixed(4));
  stage.style.setProperty("--stage-width", `${Math.floor(scene.width * scale)}px`);
  stage.style.setProperty("--stage-height", `${Math.floor(scene.height * scale)}px`);
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
  positionReflectionCrops(layout);
  scheduleSceneFit();
}

function updateReflectionFromPointer(event) {
  const bounds = grid.getBoundingClientRect();
  const normalizedX = (event.clientX - bounds.left) / bounds.width - 0.5;
  const normalizedY = (event.clientY - bounds.top) / bounds.height - 0.5;
  grid.style.setProperty("--reflection-shift-x", `${(-normalizedX * 14).toFixed(2)}px`);
  grid.style.setProperty("--reflection-shift-y", `${(-normalizedY * 6).toFixed(2)}px`);
}

function resetReflection() {
  grid.style.setProperty("--reflection-shift-x", "0px");
  grid.style.setProperty("--reflection-shift-y", "0px");
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
  return {
    v: 1,
    l: grid.dataset.layout || "4x2",
    p: importedPlaylistName,
    t: importedCovers.slice(0, records.length).map((track) => ({
      n: track.name,
      a: track.artist,
      b: track.album,
      c: track.cover,
    })),
  };
}

function readShareState() {
  const encoded = new URLSearchParams(window.location.hash.slice(1)).get("share");
  if (!encoded || encoded.length > 24_000) return null;

  try {
    const state = decodeBase64Url(encoded);
    if (state?.v !== 1 || !layoutSettings[state.l] || !Array.isArray(state.t)) return null;

    const tracks = state.t.slice(0, records.length).map((track) => ({
      name: String(track?.n || "未命名歌曲").slice(0, 160),
      artist: String(track?.a || "未知艺人").slice(0, 160),
      album: String(track?.b || "未知专辑").slice(0, 160),
      cover: String(track?.c || ""),
    }));

    if (!tracks.length || tracks.some((track) => !isAllowedSharedCover(track.cover))) return null;
    return {
      layout: state.l,
      playlistName: String(state.p || "分享歌单").slice(0, 160),
      tracks,
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

  const gap = 38;
  const availableWidth = width - 300;
  const availableHeight = height - 230;
  const panelSize = Math.min(
    (availableWidth - gap * (layout.columns - 1)) / layout.columns,
    (availableHeight - gap * (layout.rows - 1)) / layout.rows,
  );
  const gridWidth = panelSize * layout.columns + gap * (layout.columns - 1);
  const gridHeight = panelSize * layout.rows + gap * (layout.rows - 1);
  const originX = (width - gridWidth) / 2;
  const originY = (height - gridHeight) / 2;

  images.forEach((image, index) => {
    const column = index % layout.columns;
    const row = Math.floor(index / layout.columns);
    if (row >= layout.rows) return;
    const variation = mountVariations[index] || mountVariations[0];
    drawSharePanel(
      context,
      image,
      originX + column * (panelSize + gap) + variation.x,
      originY + row * (panelSize + gap) + variation.y,
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

grid.addEventListener("pointermove", updateReflectionFromPointer);
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
  importButton.querySelector("span").textContent = "重新导入";
  importButton.title = `当前墙面来自分享链接：《${importedPlaylistName}》`;
}

renderRecords();
applyLayout(sharedState?.layout || "4x2");
enableSharing();
document.fonts?.ready.then(scheduleSceneFit);
