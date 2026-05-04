const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const publicDir = __dirname;
const port = Number(process.env.PORT || 5173);
const rooms = new Map();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "GET" && url.pathname === "/api/health") {
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === "POST" && url.pathname === "/api/room/join") {
      const body = await readJson(req);
      const roomCode = cleanRoom(body.roomCode) || createRoomCode();
      const room = getRoom(roomCode);
      const player = upsertPlayer(room, {
        id: cleanId(body.playerId) || crypto.randomUUID(),
        name: cleanName(body.name) || "Jogador",
        mode: cleanText(body.mode) || "Adaptado",
        score: 0,
        reps: 0,
        updatedAt: Date.now(),
      });
      broadcast(room);
      return sendJson(res, 200, { roomCode, playerId: player.id, players: listPlayers(room) });
    }

    if (req.method === "POST" && url.pathname === "/api/score") {
      const body = await readJson(req);
      const roomCode = cleanRoom(body.roomCode);
      if (!roomCode || !rooms.has(roomCode)) return sendJson(res, 404, { error: "room not found" });
      const room = rooms.get(roomCode);
      upsertPlayer(room, {
        id: cleanId(body.playerId) || crypto.randomUUID(),
        name: cleanName(body.name) || "Jogador",
        mode: cleanText(body.mode) || "Jogando",
        score: clampInt(body.score, 0, 999999),
        reps: clampInt(body.reps, 0, 99999),
        updatedAt: Date.now(),
      });
      broadcast(room);
      return sendJson(res, 200, { ok: true, players: listPlayers(room) });
    }

    const eventMatch = url.pathname.match(/^\/api\/room\/([A-Z0-9]{4,8})\/events$/);
    if (req.method === "GET" && eventMatch) {
      const roomCode = cleanRoom(eventMatch[1]);
      const room = getRoom(roomCode);
      res.writeHead(200, {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      });
      const client = { res };
      room.clients.add(client);
      res.write(`data: ${JSON.stringify({ players: listPlayers(room) })}\n\n`);
      const ping = setInterval(() => res.write(": ping\n\n"), 25000);
      req.on("close", () => {
        clearInterval(ping);
        room.clients.delete(client);
      });
      return;
    }

    if (req.method !== "GET") return sendJson(res, 405, { error: "method not allowed" });
    return serveStatic(url.pathname, res);
  } catch (error) {
    return sendJson(res, 500, { error: "server error", detail: error.message });
  }
});

server.listen(port, () => {
  console.log(`Move Quest server running on port ${port}`);
});

function getRoom(code) {
  if (!rooms.has(code)) rooms.set(code, { code, players: new Map(), clients: new Set(), createdAt: Date.now() });
  return rooms.get(code);
}

function upsertPlayer(room, player) {
  const current = room.players.get(player.id) || {};
  const next = { ...current, ...player };
  room.players.set(next.id, next);
  return next;
}

function listPlayers(room) {
  const maxAge = Date.now() - 1000 * 60 * 60 * 3;
  for (const [id, player] of room.players) {
    if (player.updatedAt < maxAge) room.players.delete(id);
  }
  return [...room.players.values()]
    .sort((a, b) => b.score - a.score)
    .map((player) => ({
      id: player.id,
      name: player.name,
      mode: player.mode,
      score: player.score,
      reps: player.reps,
    }));
}

function broadcast(room) {
  const payload = `data: ${JSON.stringify({ players: listPlayers(room) })}\n\n`;
  for (const client of room.clients) client.res.write(payload);
}

function serveStatic(pathname, res) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(publicDir, safePath));
  if (!filePath.startsWith(publicDir)) return sendJson(res, 403, { error: "forbidden" });

  fs.readFile(filePath, (error, data) => {
    if (error) {
      fs.readFile(path.join(publicDir, "index.html"), (indexError, indexData) => {
        if (indexError) return sendJson(res, 404, { error: "not found" });
        res.writeHead(200, { "Content-Type": mimeTypes[".html"] });
        res.end(indexData);
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    res.end(data);
  });
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 100_000) {
        req.destroy();
        reject(new Error("payload too large"));
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function cleanName(value) {
  return cleanText(value).slice(0, 24);
}

function cleanText(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function cleanRoom(value) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

function cleanId(value) {
  return String(value || "").trim().replace(/[^a-zA-Z0-9-]/g, "").slice(0, 80);
}

function createRoomCode() {
  return crypto.randomBytes(4).toString("hex").slice(0, 6).toUpperCase();
}

function clampInt(value, min, max) {
  const number = Number.parseInt(value, 10);
  if (Number.isNaN(number)) return min;
  return Math.min(max, Math.max(min, number));
}
