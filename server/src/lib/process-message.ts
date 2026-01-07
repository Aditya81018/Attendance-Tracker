import type WebSocket from "ws";
import type {
  IrScanRecord,
  Location,
  MotionRecord,
  RfidScanRecord,
} from "../types.ts";

const logs: string[] = [];
const scanners: { [key: string]: WebSocket } = {};
const clients: { [key: string]: WebSocket } = {};
const rfidScanHistory: RfidScanRecord[] = [];
const irScanHistory: IrScanRecord[] = [];
const motionHistory: MotionRecord[] = [];

let expectedMotion: null | Location = null;
let motionStage: 0 | 1 | 2 | 3 = 0;

export default function processMessage(ws: WebSocket, message: string) {
  const datetime = new Date().toISOString();

  logs.push(datetime + ": " + message);

  const args = message.split(" ");
  if (args[0] === "init") {
    if (args[1] === "scanner") {
      scanners[args[2]!] = ws;
    }
    if (args[1] === "client") {
      clients[args[2]!] = ws;
    }
  }

  if (args[0] === "rfid") {
    rfidScanHistory.push({
      recordedUID: args[2]!,
      location: args[1]!.toUpperCase() as "INDOOR" | "OUTDOOR",
      recordedAt: datetime,
      scannerID: args[4]!,
    });
  }

  if (args[0] === "ir") {
    const indoorStatus = args[2]! === "ON";
    const outdoorStatus = args[4]! === "ON";
    const scannerID = args[6]!;

    irScanHistory.push({
      indoorStatus,
      outdoorStatus,
      recordedAt: datetime,
      scannerID,
    });

    if (!indoorStatus && !outdoorStatus) {
      if (expectedMotion && motionStage === 3) {
        motionHistory.push({
          towards: expectedMotion,
          recordedAt: datetime,
          scannerID,
        });
      }
      expectedMotion = null;
      motionStage = 0;
    }
    if (indoorStatus && !outdoorStatus) {
      if (!expectedMotion && motionStage === 0) {
        expectedMotion = "OUTDOOR";
        motionStage = 1;
      } else if (expectedMotion && motionStage === 2) {
        motionStage = 3;
      }
    }
    if (!indoorStatus && outdoorStatus) {
      if (!expectedMotion && motionStage === 0) {
        expectedMotion = "INDOOR";
        motionStage = 1;
      } else if (expectedMotion && motionStage === 2) {
        motionStage = 3;
      }
    }
    if (indoorStatus && outdoorStatus) {
      if (expectedMotion && motionStage === 1) {
        motionStage = 2;
      }
    }
  }

  for (const id in clients) {
    clients[id]?.send(
      JSON.stringify({
        recordedAt: datetime,
        scanners: Object.keys(scanners),
        clients: Object.keys(clients),
        rfidScanHistory,
        irScanHistory,
        logs,
        motionHistory,
      }),
    );
  }
}
