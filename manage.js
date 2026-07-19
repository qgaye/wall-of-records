const panel = document.querySelector("#ledgerPanel");
const rows = document.querySelector("#ledgerRows");
const summary = document.querySelector("#ledgerSummary");
const pageLabel = document.querySelector("#pageLabel");
const previousButton = document.querySelector("#previousPage");
const nextButton = document.querySelector("#nextPage");
const refreshButton = document.querySelector("#refreshLogs");
const pageSizeSelect = document.querySelector("#pageSize");

const query = new URLSearchParams(window.location.search);
const initialPage = Number(query.get("page"));
const initialPageSize = Number(query.get("pageSize"));
const allowedPageSizes = new Set([10, 20, 50, 100]);

let page = Number.isInteger(initialPage) && initialPage > 0 ? initialPage : 1;
let pageSize = allowedPageSizes.has(initialPageSize) ? initialPageSize : 20;
let requestController;

pageSizeSelect.value = String(pageSize);

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "未知时间", time: "—" };

  return {
    date: new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date),
    time: new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date),
  };
}

function platformName(platform) {
  if (platform === "netease") return "网易云音乐";
  if (platform === "qq") return "QQ 音乐";
  return platform || "未知平台";
}

function playlistUrl(entry) {
  const savedUrl = entry?.playlist?.url;
  if (typeof savedUrl === "string") {
    try {
      const parsed = new URL(savedUrl);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") return parsed.href;
    } catch {
      // Fall back to a canonical URL for older or malformed log entries.
    }
  }

  const id = entry?.playlist?.id;
  if (!id) return null;
  if (entry?.platform === "netease") {
    return `https://music.163.com/playlist?id=${encodeURIComponent(id)}`;
  }
  if (entry?.platform === "qq") {
    return `https://y.qq.com/n/ryqq/playlist/${encodeURIComponent(id)}`;
  }
  return null;
}

function resultDescription(result) {
  if (result?.status === "success") {
    return {
      badge: "SUCCESS",
      title: `返回 ${result.returned ?? "—"} 张 · 唯一 ${result.available ?? "—"} 张`,
      meta:
        result.pool !== undefined
          ? `歌曲池 ${result.pool} / 抽样 ${result.sampled ?? "—"} / 请求 ${result.requested ?? "—"}`
          : `请求 ${result.requested ?? "—"} / 可用 ${result.available ?? "—"}`,
    };
  }

  return {
    badge: "ERROR",
    title: result?.message || "解析失败",
    meta: "请求未完成",
  };
}

function renderEntry(entry, index) {
  const status = entry?.result?.status === "success" ? "success" : "error";
  const row = createElement("article", "ledger-row");
  row.dataset.status = status;
  row.style.animationDelay = `${Math.min(index * 24, 240)}ms`;

  const time = formatTime(entry?.time);
  const timeCell = createElement("div", "log-time");
  timeCell.append(createElement("strong", "", time.date), createElement("span", "", time.time));

  const playlistCell = createElement("div", "playlist-copy");
  const playlistName = createElement("strong", "playlist-name");
  const url = playlistUrl(entry);
  if (url) {
    const link = createElement("a", "playlist-link", entry?.playlist?.name || "未识别歌单");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.title = url;
    playlistName.append(link);
  } else {
    playlistName.textContent = entry?.playlist?.name || "未识别歌单";
  }
  playlistCell.append(
    playlistName,
    createElement("span", "playlist-id", entry?.playlist?.id ? `ID ${entry.playlist.id}` : "ID —"),
  );

  const platformCell = createElement("span", "platform-badge", platformName(entry?.platform));
  platformCell.dataset.platform = entry?.platform || "unknown";

  const copy = resultDescription(entry?.result);
  const resultCell = createElement("div", "result-copy");
  resultCell.append(
    createElement("span", "status-badge", copy.badge),
    createElement("strong", "", copy.title),
    createElement("span", "result-meta", copy.meta),
  );

  row.append(timeCell, playlistCell, platformCell, resultCell);
  return row;
}

function renderEmpty(title, detail) {
  const empty = createElement("div", "empty-state");
  const copy = createElement("div");
  copy.append(createElement("strong", "", title), createElement("span", "", detail));
  empty.append(copy);
  rows.replaceChildren(empty);
}

function updateUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("page", String(page));
  url.searchParams.set("pageSize", String(pageSize));
  window.history.replaceState(null, "", url);
}

function setLoading(isLoading) {
  panel.setAttribute("aria-busy", String(isLoading));
  previousButton.disabled = isLoading || page <= 1;
  nextButton.disabled = isLoading;
  refreshButton.disabled = isLoading;
  pageSizeSelect.disabled = isLoading;
  if (isLoading) summary.textContent = "正在读取日志";
}

async function loadLogs() {
  requestController?.abort();
  requestController = new AbortController();
  setLoading(true);
  pageLabel.textContent = `第 ${page} 页`;
  updateUrl();

  try {
    const response = await fetch(`/api/manage/logs?page=${page}&pageSize=${pageSize}`, {
      signal: requestController.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "日志读取失败");

    rows.replaceChildren(...data.entries.map(renderEntry));
    if (!data.entries.length) {
      renderEmpty(page === 1 ? "还没有解析记录" : "这一页没有记录", page === 1 ? "完成一次歌单导入后，日志会出现在这里。" : "请返回上一页继续查看。");
    }

    summary.textContent = `本页 ${data.entries.length} 条 · 最新记录在前`;
    previousButton.disabled = !data.hasPrevious;
    nextButton.disabled = !data.hasMore;
  } catch (error) {
    if (error.name === "AbortError") return;
    renderEmpty("日志读取失败", error.message || "请稍后刷新重试。");
    summary.textContent = "读取失败";
    previousButton.disabled = page <= 1;
    nextButton.disabled = true;
  } finally {
    panel.setAttribute("aria-busy", "false");
    refreshButton.disabled = false;
    pageSizeSelect.disabled = false;
  }
}

previousButton.addEventListener("click", () => {
  if (page <= 1) return;
  page -= 1;
  loadLogs();
});

nextButton.addEventListener("click", () => {
  page += 1;
  loadLogs();
});

refreshButton.addEventListener("click", loadLogs);

pageSizeSelect.addEventListener("change", () => {
  pageSize = Number(pageSizeSelect.value);
  page = 1;
  loadLogs();
});

loadLogs();
