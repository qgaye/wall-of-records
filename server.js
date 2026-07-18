const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs/promises");
const { randomInt } = require("node:crypto");

const HOST = process.env.RECORD_WALL_HOST || "127.0.0.1";
const PORT = Number(process.env.RECORD_WALL_PORT) || 8000;
const ROOT = __dirname;
const MAX_BODY_SIZE = 16 * 1024;
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const IMPORT_LOG_FILE =
  process.env.RECORD_WALL_IMPORT_LOG || path.join(ROOT, "logs", "playlist-imports.jsonl");

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

async function appendImportLog({ platform, playlist, result }) {
  const entry = {
    time: new Date().toISOString(),
    playlist: {
      id: playlist?.id ? String(playlist.id) : null,
      name: playlist?.name || null,
    },
    platform,
    result,
  };

  try {
    await fs.mkdir(path.dirname(IMPORT_LOG_FILE), { recursive: true });
    await fs.appendFile(IMPORT_LOG_FILE, `${JSON.stringify(entry)}\n`, "utf8");
  } catch (error) {
    console.error(`无法写入歌单解析日志：${error.message}`);
  }
}

function isAllowedCoverHost(hostname) {
  return /(^|\.)music\.126\.net$/i.test(hostname) || hostname.toLowerCase() === "y.gtimg.cn";
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

function isAllowedQQHost(hostname) {
  const host = hostname.toLowerCase();
  return host === "y.qq.com" || host.endsWith(".y.qq.com");
}

function resolveQQPlaylist(value) {
  const raw = String(value || "").trim();
  if (/^\d{4,}$/.test(raw)) {
    return { playlistId: raw, encodedHostUin: "" };
  }

  const sharedUrl = firstUrl(raw);
  if (!sharedUrl) {
    throw new Error("没有找到有效的 QQ 音乐歌单链接或歌单 ID");
  }

  let parsed;
  try {
    parsed = new URL(sharedUrl);
  } catch {
    throw new Error("歌单链接格式不正确");
  }

  if (!isAllowedQQHost(parsed.hostname)) {
    throw new Error("这不是有效的 QQ 音乐歌单链接");
  }

  const playlistId = parsed.searchParams.get("id") || parsed.searchParams.get("disstid");
  if (!/^\d{4,}$/.test(playlistId || "")) {
    throw new Error("无法从这条 QQ 音乐链接中识别歌单 ID");
  }

  return {
    playlistId,
    encodedHostUin: parsed.searchParams.get("hosteuin") || "",
  };
}

function coverUrl(value) {
  if (!value) return null;
  const secure = value.replace(/^http:/i, "https:");
  return `${secure}${secure.includes("?") ? "&" : "?"}param=600y600`;
}

function normalizeTracks(payload) {
  const playlist = payload.result || payload.playlist;
  const rawTracks = playlist?.tracks || [];

  return {
    id: String(playlist?.id || ""),
    name: playlist?.name || "网易云歌单",
    trackCount: Number(playlist?.trackCount) || rawTracks.length,
    tracks: normalizeNeteaseTrackList(rawTracks),
  };
}

function normalizeNeteaseTrackList(rawTracks) {
  return rawTracks
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
}

function uniqueTracksByCover(tracks) {
  const unique = [];
  const seenCovers = new Set();

  tracks.forEach((track) => {
    const key = track.cover.split("?")[0];
    if (seenCovers.has(key)) return;
    seenCovers.add(key);
    unique.push(track);
  });

  return unique;
}

function randomTracks(tracks, limit) {
  return randomSample(uniqueTracksByCover(tracks), limit);
}

function randomSample(items, limit) {
  const pool = items.slice();
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
  }
  return pool.slice(0, limit);
}

function neteaseTrackIds(payload) {
  const playlist = payload.result || payload.playlist;
  const rawTrackIds = playlist?.trackIds?.length ? playlist.trackIds : playlist?.tracks || [];

  return [
    ...new Set(
      rawTrackIds
        .map((track) => Number(track?.id ?? track))
        .filter((id) => Number.isSafeInteger(id) && id > 0),
    ),
  ];
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

async function fetchNeteaseSongDetails(trackIds) {
  if (!trackIds.length) return [];

  const serializedIds = JSON.stringify(trackIds);
  const endpoints = [
    `https://music.163.com/api/song/detail/?ids=${encodeURIComponent(serializedIds)}`,
    `https://music.163.com/api/v3/song/detail?c=${encodeURIComponent(
      JSON.stringify(trackIds.map((id) => ({ id }))),
    )}`,
  ];
  let lastError;

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
        lastError = new Error(`网易云歌曲详情接口返回了 ${response.status} 状态`);
        continue;
      }

      const payload = await response.json();
      if (payload.code === 200 && Array.isArray(payload.songs)) {
        return normalizeNeteaseTrackList(payload.songs);
      }
      lastError = new Error(payload.message || payload.msg || "网易云没有返回歌曲详情");
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError?.name === "TimeoutError") {
    throw new Error("连接网易云歌曲详情接口超时，请稍后重试");
  }
  throw lastError || new Error("网易云歌曲详情接口暂时不可用");
}

async function fetchQQPlaylist(playlistId, encodedHostUin) {
  try {
    const response = await fetch("https://u.y.qq.com/cgi-bin/musicu.fcg", {
      method: "POST",
      headers: {
        Accept: "application/json,text/plain,*/*",
        "Content-Type": "application/json",
        Origin: "https://y.qq.com",
        Referer: "https://y.qq.com/",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36",
      },
      body: JSON.stringify({
        comm: { ct: 23, cv: 200600 },
        req_0: {
          module: "music.srfDissInfo.aiDissInfo",
          method: "uniform_get_Dissinfo",
          param: {
            disstid: Number(playlistId),
            enc_host_uin: encodedHostUin,
            tag: 1,
            userinfo: 1,
            song_begin: 0,
            song_num: 500,
            orderlist: 1,
          },
        },
      }),
      signal: AbortSignal.timeout(12_000),
    });

    if (!response.ok) throw new Error(`QQ 音乐返回了 ${response.status} 状态`);
    const payload = await response.json();
    if (payload.code !== 0 || payload.req_0?.code !== 0 || !payload.req_0?.data) {
      throw new Error(payload.req_0?.msg || payload.msg || "QQ 音乐歌单接口返回异常");
    }
    return payload.req_0.data;
  } catch (error) {
    if (error?.name === "TimeoutError") {
      throw new Error("连接 QQ 音乐超时，请稍后重试");
    }
    throw error;
  }
}

function normalizeQQTracks(data) {
  const playlist = data?.dirinfo || {};
  const tracks = (data?.songlist || [])
    .map((track) => {
      const albumMid = track.album?.mid;
      if (!albumMid) return null;

      return {
        id: String(track.mid || track.id || ""),
        name: track.name || track.title || "未命名歌曲",
        artist: (track.singer || []).map((artist) => artist.name).filter(Boolean).join(" / ") || "未知艺人",
        album: track.album?.name || track.album?.title || "未知专辑",
        cover: `https://y.gtimg.cn/music/photo_new/T002R800x800M000${albumMid}.jpg`,
      };
    })
    .filter(Boolean);

  return {
    id: String(playlist.id || ""),
    name: playlist.title || "QQ 音乐歌单",
    trackCount: Number(playlist.songnum) || tracks.length,
    tracks,
  };
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

async function handleNeteasePlaylistApi(request, response) {
  if (request.method !== "POST") {
    writeJson(response, 405, { error: "请使用 POST 请求" });
    return;
  }

  let playlistReference = { id: null, name: null };

  try {
    const body = await readJsonBody(request);
    playlistReference.id = directPlaylistId(body.url);
    const requestedLimit = Number(body.limit);
    const limit = Number.isInteger(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 24)
      : 8;
    const playlistId = await resolveSharedPlaylistId(body.url);
    playlistReference.id = playlistId;

    const playlistPayload = await fetchPlaylistPayload(playlistId);
    const playlist = normalizeTracks(playlistPayload);
    playlistReference = { id: playlist.id || playlistId, name: playlist.name };
    const allTrackIds = neteaseTrackIds(playlistPayload);
    if (!allTrackIds.length) {
      throw new Error(
        playlist.trackCount === 0
          ? "这个歌单目前没有歌曲"
          : "歌单存在，但网易云没有返回完整歌曲列表；如果是私密歌单，请先设为公开",
      );
    }

    const sampleSize = Math.min(allTrackIds.length, limit * 2);
    const sampledTrackIds = randomSample(allTrackIds, sampleSize);
    const sampledTracks = await fetchNeteaseSongDetails(sampledTrackIds);
    const uniqueTracks = uniqueTracksByCover(sampledTracks);
    if (uniqueTracks.length < limit) {
      throw new Error(
        `本次随机抽取 ${sampleSize} 首歌曲后只有 ${uniqueTracks.length} 张不重复的专辑封面，当前布局需要 ${limit} 张`,
      );
    }

    const selected = randomTracks(uniqueTracks, limit);
    await appendImportLog({
      platform: "netease",
      playlist: playlistReference,
      result: {
        status: "success",
        requested: limit,
        pool: allTrackIds.length,
        sampled: sampleSize,
        available: uniqueTracks.length,
        returned: selected.length,
      },
    });
    writeJson(response, 200, {
      playlist: { id: playlist.id, name: playlist.name },
      requested: limit,
      pool: allTrackIds.length,
      sampled: sampleSize,
      available: uniqueTracks.length,
      tracks: selected,
    });
  } catch (error) {
    const message = error?.name === "TimeoutError" ? "连接网易云超时，请稍后重试" : error.message;
    await appendImportLog({
      platform: "netease",
      playlist: playlistReference,
      result: { status: "error", message: message || "歌单解析失败" },
    });
    writeJson(response, 400, { error: message || "歌单解析失败" });
  }
}

async function handleQQPlaylistApi(request, response) {
  if (request.method !== "POST") {
    writeJson(response, 405, { error: "请使用 POST 请求" });
    return;
  }

  let playlistReference = { id: null, name: null };

  try {
    const body = await readJsonBody(request);
    playlistReference.id = directPlaylistId(body.url);
    const requestedLimit = Number(body.limit);
    const limit = Number.isInteger(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 24)
      : 8;
    const { playlistId, encodedHostUin } = resolveQQPlaylist(body.url);
    playlistReference.id = playlistId;
    const playlist = normalizeQQTracks(await fetchQQPlaylist(playlistId, encodedHostUin));
    playlistReference = { id: playlist.id || playlistId, name: playlist.name };

    if (!playlist.tracks.length) {
      throw new Error(
        playlist.trackCount === 0
          ? "这个 QQ 音乐歌单目前没有歌曲"
          : "歌单存在，但 QQ 音乐没有返回可用的专辑封面",
      );
    }
    const uniqueTracks = uniqueTracksByCover(playlist.tracks);
    if (uniqueTracks.length < limit) {
      throw new Error(`这个歌单只有 ${uniqueTracks.length} 张不重复的专辑封面，当前布局需要 ${limit} 张`);
    }

    const selected = randomTracks(uniqueTracks, limit);
    await appendImportLog({
      platform: "qq",
      playlist: playlistReference,
      result: {
        status: "success",
        requested: limit,
        available: uniqueTracks.length,
        returned: selected.length,
      },
    });
    writeJson(response, 200, {
      playlist: { id: playlist.id || playlistId, name: playlist.name },
      requested: limit,
      available: uniqueTracks.length,
      tracks: selected,
    });
  } catch (error) {
    const message = error.message || "QQ 音乐歌单解析失败";
    await appendImportLog({
      platform: "qq",
      playlist: playlistReference,
      result: { status: "error", message },
    });
    writeJson(response, 400, { error: message });
  }
}

async function handleCoverProxy(request, response) {
  if (request.method !== "GET") {
    writeJson(response, 405, { error: "请使用 GET 请求" });
    return;
  }

  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);
    const source = new URL(requestUrl.searchParams.get("url") || "");
    if (source.protocol !== "https:" || !isAllowedCoverHost(source.hostname) || source.port) {
      throw new Error("只允许读取受支持音乐平台的专辑封面");
    }

    const isQQCover = source.hostname.toLowerCase() === "y.gtimg.cn";

    const imageResponse = await fetch(source, {
      redirect: "error",
      headers: {
        Accept: "image/avif,image/webp,image/png,image/jpeg,*/*",
        Referer: isQQCover ? "https://y.qq.com/" : "https://music.163.com/",
        "User-Agent": "Mozilla/5.0 RecordWall/1.0",
      },
      signal: AbortSignal.timeout(12_000),
    });
    if (!imageResponse.ok) throw new Error(`封面服务返回了 ${imageResponse.status} 状态`);

    const contentType = imageResponse.headers.get("content-type") || "";
    if (!/^image\/(jpeg|jpg|png|webp|avif)$/i.test(contentType.split(";")[0])) {
      throw new Error("封面服务返回了非图片内容");
    }

    const declaredSize = Number(imageResponse.headers.get("content-length")) || 0;
    if (declaredSize > MAX_IMAGE_SIZE) throw new Error("封面图片过大");

    const image = Buffer.from(await imageResponse.arrayBuffer());
    if (image.length > MAX_IMAGE_SIZE) throw new Error("封面图片过大");

    response.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": image.length,
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(image);
  } catch (error) {
    writeJson(response, 400, { error: error.message || "封面读取失败" });
  }
}

async function serveStatic(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  const pathname = decodeURIComponent(requestUrl.pathname);
  if (pathname === "/logs" || pathname.startsWith("/logs/")) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }
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
    await handleNeteasePlaylistApi(request, response);
    return;
  }

  if (pathname === "/api/qq-playlist") {
    await handleQQPlaylistApi(request, response);
    return;
  }

  if (pathname === "/api/cover") {
    await handleCoverProxy(request, response);
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
  fetchNeteaseSongDetails,
  fetchPlaylistPayload,
  handleCoverProxy,
  isAllowedCoverHost,
  normalizeTracks,
  neteaseTrackIds,
  randomSample,
  randomTracks,
  resolveSharedPlaylistId,
  server,
  uniqueTracksByCover,
};
