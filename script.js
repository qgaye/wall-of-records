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
const importButton = document.querySelector("#openPlaylistImport");
const parsePlaylistButton = document.querySelector("#parsePlaylistButton");
const requiredCoverCount = document.querySelector("#requiredCoverCount");
const currentLayoutLabel = document.querySelector("#currentLayoutLabel");
const shareButton = document.querySelector("#copyShareLink");

let fitFrame;
let importedCovers = [];
let importRequest;
let importedPlaylistName = "网易云歌单";
let shareFeedbackTimer;

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
    return url.protocol === "https:" && /(^|\.)music\.126\.net$/i.test(url.hostname);
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
  shareButton.hidden = importedCovers.length === 0;
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
      shareButton.querySelector("span").textContent = "复制分享";
      shareButton.title = "复制可复原当前墙面的分享链接";
    }, 1800);
  } catch {
    shareButton.querySelector("span").textContent = "复制失败";
    shareButton.title = "无法访问剪贴板，请检查浏览器权限";
  }
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
  const value = playlistUrl.value.trim();

  if (!value) {
    setImportStatus("请先粘贴网易云歌单链接。", "error");
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
    const response = await fetch("/api/netease-playlist", {
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
document.querySelector("#closePlaylistDialog").addEventListener("click", closeImportDialog);
document.querySelector("#cancelPlaylistImport").addEventListener("click", closeImportDialog);
playlistForm.addEventListener("submit", importPlaylist);
playlistDialog.addEventListener("cancel", stopImportRequest);
playlistDialog.addEventListener("click", (event) => {
  if (event.target === playlistDialog) closeImportDialog();
});

grid.addEventListener("pointermove", updateReflectionFromPointer);
grid.addEventListener("pointerleave", resetReflection);
window.addEventListener("resize", scheduleSceneFit, { passive: true });
window.visualViewport?.addEventListener("resize", scheduleSceneFit, { passive: true });

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
