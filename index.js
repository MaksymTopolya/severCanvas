const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 5000 });

let sessions = {};
let sessionData = {};

wss.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("message", (message) => {
    const msg = JSON.parse(message);

    switch (msg.method) {
      case "connection":
        handleConnection(ws, msg);
        break;
      case "draw":
        handleDraw(ws, msg);
        break;
      case "clear":
        handleClear(ws, msg);
        break;
      default:
        console.log("Unknown method:", msg.method);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

function handleConnection(ws, msg) {
  const sessionId = msg.id;

  if (!sessions[sessionId]) {
    sessions[sessionId] = [];
    sessionData[sessionId] = [];
  }

  ws.sessionId = sessionId;
  sessions[sessionId].push(ws);

  ws.send(
    JSON.stringify({
      method: "init",
      figures: sessionData[sessionId],
    })
  );

  broadcast(ws, {
    method: "connection",
    username: msg.username,
    message: `${msg.username} connected to session ${sessionId}`,
  });
}

function handleDraw(ws, msg) {
  const sessionId = ws.sessionId;

  if (!sessionId || !sessions[sessionId]) return;

  sessionData[sessionId].push(msg.figure);

  broadcast(ws, msg);
}

function handleClear(ws, msg) {
  const sessionId = ws.sessionId;

  if (!sessionId || !sessions[sessionId]) return;

  sessionData[sessionId] = [];

  broadcast(ws, {
    method: "clear",
  });
}

function broadcast(ws, msg) {
  const sessionId = ws.sessionId;

  if (!sessions[sessionId]) return;

  sessions[sessionId].forEach((client) => {
    if (client !== ws && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(msg));
    }
  });
}

console.log("WebSocket server is running on ws://localhost:5000");
