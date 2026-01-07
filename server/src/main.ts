import express from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import cors from "cors";
import processMessage from "./lib/process-message.ts";

dotenv.config();

const PORT = process.env.PORT || 8080;

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

app.use(cors({ origin: "*" }));

app.get("/hello", (_req, res) => res.send("Hello World"));

wss.on("connection", (ws) => {
  console.log("New Client Connected");

  ws.on("message", (message) => {
    console.log("Message Received: " + message);
    processMessage(ws, String(message));
  });

  ws.on("close", () => {
    console.log("A Client Disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
