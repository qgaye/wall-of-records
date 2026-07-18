const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs/promises");
const { randomInt } = require("node:crypto");

const HOST = process.env.RECORD_WALL_HOST || "127.0.0.1";
const PORT = Number(process.env.RECORD_WALL_PORT) || 8000;
const ROOT = __dirname;
const MAX_BODY_SIZE = 16 * 1024;

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

function writeJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
}

function directPlaylistId(value) {
  const raw = String(value || "").trim();
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // 分享页 HTML 可能包含不完整的百分号转义；继续按原文匹配即可。
  }
  if (/^\d{4,}$/.test(decoded)) return decoded;

  const queryMatch = decoded.match(/[?&#]id=(\d{4,})/i);
  if (queryMatch) return queryMatch[1];

  const pathMatch = decoded.match(/\/playlist\/(\d{4,})/i);
  return pathMatch?.[1] || null;
}

function firstUrl(value) {
  const match = String(value || "").match(/https?:\/\/[^\s<>"']+/i);
  return match?.[0]?.replace(/[，。；、）】》,.;:!?\)]+$/u, "") || null;
}

function isAllowedNeteaseHost(hostname) {
  const host = hostname.toLowerCase();
  return (
    host === "music.163.com" ||
    host.endsWith(".music.163.com") ||
    host === "163cn.tv" ||
    host.endsWith(".163cn.tv")
  );
}

async function resolveSharedPlaylistId(value) {
  const raw = String(value || "").trim();
  if (/^\d{4,}$/.test(raw)) return raw;

  const sharedUrl = firstUrl(raw);
  if (!sharedUrl) {
    throw new Error("没有找到有效的网易云歌单链接或歌单 ID");
  }

  let current;
  try {
    current = new URL(sharedUrl);
  } catch {
    throw new Error("歌单链接格式不正确");
  }

  if (!isAllowedNeteaseHost(current.hostname)) {
    throw new Error("目前只支持网易云音乐歌单链接");
  }

  const direct = directPlaylistId(current.href);
  if (direct) return direct;

  for (let redirectCount = 0; redirectCount < 5; redirectCount += 1) {
    if (!isAllowedNeteaseHost(current.hostname)) {
      throw new Error("目前只支持网易云音乐歌单链接");
    }

    const idInUrl = directPlaylistId(current.href);
    if (idInUrl) return idInUrl;

    const result = await fetch(current, {
      redirect: "manual",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        Referer: "https://music.163.com/",
        "User-Agent": "Mozilla/5.0 RecordWall/1.0",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (result.status >= 300 && result.status < 400) {
      const location = result.headers.get("location");
      if (!location) break;
      current = new URL(location, current);
      continue;
    }

    const html = await result.text();
    const idInPage = directPlaylistId(html);
    if (idInPage) return idInPage;
    break;
  }

  throw new Error("无法从这条分享链接中识别歌单 ID");
}

function coverUrl(value) {
  if (!value) return null;
  const secure = value.replace(/^http:/i, "https:");
  return `${secure}${secure.includes("?") ? "&" : "?"}param=600y600`;
}

function normalizeTracks(payload) {
  const playlist = payload.result || payload.playlist;
  const rawTracks = playlist?.tracks || [];

  const tracks = rawTracks
    .map((track) => {
      const album = track.album || track.al || {};
      const artists = track.artists || track.ar || [];
      const cover = coverUrl(album.picUrl);
      if (!cover) return null;

      return {
        id: String(track.id),
        name: track.name || "未命名歌曲",
        artist: artists.map((artist) => artist.name).filter(Boolean).join(" / ") || "未知艺人",
        album: album.name || "未知专辑",
        cover,
      };
    })
    .filter(Boolean);

  return {
    id: String(playlist?.id || ""),
    name: playlist?.name || "网易云歌单",
    trackCount: Number(playlist?.trackCount) || tracks.length,
    tracks,
  };
}

function randomTracks(tracks, limit) {
  const unique = [];
  const seenCovers = new Set();

  tracks.forEach((track) => {
    const key = track.cover.split("?")[0];
    if (seenCovers.has(key)) return;
    seenCovers.add(key);
    unique.push(track);
  });

  const pool = unique.length >= limit ? unique : tracks.slice();
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
  }
  return pool.slice(0, limit);
}

async function fetchPlaylistPayload(playlistId) {
  const endpoints = [
    `https://music.163.com/api/v6/playlist/detail?id=${encodeURIComponent(playlistId)}`,
    `https://music.163.com/api/playlist/detail?id=${encodeURIComponent(playlistId)}`,
  ];
  let lastError;
  let lastCode;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          Accept: "application/json,text/plain,*/*",
          Referer: "https://music.163.com/",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36",
        },
        signal: AbortSignal.timeout(12_000),
      });

      if (!response.ok) {
        lastError = new Error(`网易云返回了 ${response.status} 状态`);
        continue;
      }

      const payload = await response.json();
      if ((payload.playlist || payload.result) && (payload.code === 200 || payload.code == null)) {
        return payload;
      }

      lastCode = payload.code;
      lastError = new Error(payload.message || payload.msg || `网易云接口返回异常代码 ${payload.code}`);
    } catch (error) {
      lastError = error;
    }
  }

  if (lastCode === -447) {
    throw new Error("网易云暂时限制了匿名访问（-447），请稍后重新导入");
  }
  if (lastError?.name === "TimeoutError") {
    throw new Error("连接网易云超时，请稍后重试");
  }
  throw lastError || new Error("网易云歌单接口暂时不可用");
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_SIZE) throw new Error("请求内容过大");
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("请求格式不正确");
  }
}

async function handlePlaylistApi(request, response) {
  if (request.method !== "POST") {
    writeJson(response, 405, { error: "请使用 POST 请求" });
    return;
  }

  try {
    const body = await readJsonBody(request);
    const requestedLimit = Number(body.limit);
    const limit = Number.isInteger(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 24)
      : 8;
    const playlistId = await resolveSharedPlaylistId(body.url);

    const playlist = normalizeTracks(await fetchPlaylistPayload(playlistId));
    if (!playlist.tracks.length) {
      throw new Error(
        playlist.trackCount === 0
          ? "这个歌单目前没有歌曲"
          : "歌单存在，但网易云没有返回歌曲详情；如果是私密歌单，请先设为公开",
      );
    }
    if (playlist.tracks.length < limit) {
      throw new Error(`这个歌单只有 ${playlist.tracks.length} 首可用歌曲，当前布局需要 ${limit} 首`);
    }

    const selected = randomTracks(playlist.tracks, limit);
    writeJson(response, 200, {
      playlist: { id: playlist.id, name: playlist.name },
      requested: limit,
      available: playlist.tracks.length,
      tracks: selected,
    });
  } catch (error) {
    const message = error?.name === "TimeoutError" ? "连接网易云超时，请稍后重试" : error.message;
    writeJson(response, 400, { error: message || "歌单解析失败" });
  }
}

async function serveStatic(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  const pathname = decodeURIComponent(requestUrl.pathname);
  const relativePath = pathname === "/" || pathname === "/share" ? "index.html" : pathname.replace(/^\/+/, "");
  const filePath = path.resolve(ROOT, relativePath);

  if (filePath !== ROOT && !filePath.startsWith(`${ROOT}${path.sep}`)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const file = await fs.readFile(filePath);
    response.writeHead(200, {
      "Content-Type": contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    if (request.method === "HEAD") response.end();
    else response.end(file);
  } catch (error) {
    response.writeHead(error.code === "ENOENT" ? 404 : 500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(error.code === "ENOENT" ? "Not found" : "Server error");
  }
}

const server = http.createServer(async (request, response) => {
  const pathname = new URL(request.url, `http://${request.headers.host || "localhost"}`).pathname;
  if (pathname === "/api/netease-playlist") {
    await handlePlaylistApi(request, response);
    return;
  }

  if (pathname === "/share/") {
    response.writeHead(308, { Location: "/share" });
    response.end();
    return;
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405);
    response.end("Method not allowed");
    return;
  }
  await serveStatic(request, response);
});

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    console.log(`Record Wall: http://${HOST}:${PORT}`);
  });
}

module.exports = {
  directPlaylistId,
  fetchPlaylistPayload,
  normalizeTracks,
  randomTracks,
  resolveSharedPlaylistId,
  server,
};
