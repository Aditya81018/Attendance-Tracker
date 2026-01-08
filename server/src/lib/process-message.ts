import type WebSocket from "ws";
import type {
  IrScanRecord,
  Location,
  MotionRecord,
  RfidScanRecord,
  StudentsPresenceRecord,
} from "../types.ts";
import { delay } from "./helpers.ts";

const RFID_TIMEOUT_DURATION = 5000;

const logs: string[] = [];
const scanners: { [key: string]: WebSocket } = {};
const clients: { [key: string]: WebSocket } = {};
const rfidScanHistory: RfidScanRecord[] = [];
const irScanHistory: IrScanRecord[] = [];
const motionHistory: MotionRecord[] = [];
const studentsIndoor: string[] = [];
const studentsPresenceHistory: StudentsPresenceRecord[] = [];
const studentsList = {
  ae6bf705: "Yellow",
  "8e800c06": "Orange",
  ac406f06: "Purple",
  fb896f06: "Green",
};

let expectedMotion: null | Location = null;
let motionStage: 0 | 1 | 2 | 3 = 0;

let lastRfidScan: RfidScanRecord | null = null;
let rfidScanTimeout: null | NodeJS.Timeout = null;

export default function processMessage(ws: WebSocket, message: string) {
  const datetime = new Date().toISOString();

  const newLog = datetime + ": " + message;
  logs.push(newLog);
  sendUpdatesToClients({ logs });

  const args = message.split(" ");
  if (args[0] === "init") {
    if (args[1] === "scanner") {
      scanners[args[2]!] = ws;
      sendUpdatesToClients({ scanners });
    }
    if (args[1] === "client") {
      clients[args[2]!] = ws;
      ws.send(
        JSON.stringify({
          logs,
          scanners,
          clients,
          rfidScanHistory,
          irScanHistory,
          motionHistory,
          lastRfidScan,
          studentsIndoor,
          studentsPresenceHistory,
          studentsList,
        }),
      );
    }
  }

  if (args[0] === "rfid") {
    if (lastRfidScan) return;
    const uid = args[2]!;
    const location = args[1]!.toUpperCase() as "INDOOR" | "OUTDOOR";

    if (
      (location === "INDOOR" && !studentsIndoor.includes(uid)) ||
      (location === "OUTDOOR" && studentsIndoor.includes(uid))
    ) {
      buzzer();
      return;
    }

    rfidScanHistory.push({
      recordedUID: uid,
      location: location,
      recordedAt: datetime,
      scannerID: args[4]!,
      id: crypto.randomUUID(),
    });

    lastRfidScan = rfidScanHistory.at(-1)!;
    rfidScanTimeout = setTimeout(() => {
      lastRfidScan = null;
      logs.push(new Date().toISOString() + ": rfid scan timeout");
      sendUpdatesToClients({ lastRfidScan, logs });
      beep();
    }, RFID_TIMEOUT_DURATION);
    beep(2);
    sendUpdatesToClients({ rfidScanHistory, lastRfidScan });
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
      id: crypto.randomUUID(),
    });
    sendUpdatesToClients({ irScanHistory });

    // if both sensor detect no motion currently
    if (!indoorStatus && !outdoorStatus) {
      buzzerOff();
      // but motion was detected before this
      if (expectedMotion && motionStage === 3) {
        // then it means a motion took place
        motionHistory.push({
          towards: expectedMotion,
          recordedAt: datetime,
          scannerID,
          id: crypto.randomUUID(),
        });
        logs.push(`${datetime}: motion towards ${expectedMotion}`);
        sendUpdatesToClients({ motionHistory, logs });
        if (!lastRfidScan) {
          buzzer();
        }
        // a valid motion with rfid scan is recorded
        else {
          const uid = lastRfidScan.recordedUID;
          logs.push(`${datetime}: ${uid} is ${expectedMotion}`);
          if (expectedMotion === "INDOOR") {
            studentsIndoor.push(uid);
          } else {
            studentsIndoor.splice(studentsIndoor.indexOf(uid), 1);
          }
          studentsPresenceHistory.push({
            id: crypto.randomUUID(),
            recordedAt: datetime,
            location: expectedMotion,
            studentId: uid,
          });
          beep();
          clearTimeout(rfidScanTimeout!);
          lastRfidScan = null;
          sendUpdatesToClients({
            logs,
            lastRfidScan,
            studentsIndoor,
            studentsPresenceHistory,
          });
        }
      }
      // by default - reset all motion detection
      expectedMotion = null;
      motionStage = 0;
    }
    // if any motion is detected and no rfid is scanned trigger a buzzer
    else if (!lastRfidScan) {
      buzzerOn();
    }

    // if motion is detected by only one sensor
    if ((indoorStatus && !outdoorStatus) || (!indoorStatus && outdoorStatus)) {
      // and no motion was detected before this
      if (!expectedMotion && motionStage === 0) {
        // then forward motion is expected i.e.
        // if motion detected at indoor ir then motion is towards outdoor &
        // if motion detected at outdoor ir then motion is towards indoor
        expectedMotion = indoorStatus ? "OUTDOOR" : "INDOOR";
        motionStage = 1;
      }
      // but if a motion was detected before this
      else if (
        expectedMotion &&
        motionStage === 2 &&
        ((indoorStatus && expectedMotion === "INDOOR") ||
          (outdoorStatus && expectedMotion === "OUTDOOR"))
      ) {
        // then the motion has progressed
        motionStage = 3;
        expectedMotion = indoorStatus ? "INDOOR" : "OUTDOOR";
      }
    }
    if (indoorStatus && outdoorStatus) {
      if (expectedMotion && motionStage === 1) {
        motionStage = 2;
      }
    }
  }

  if (args[0] === "buzzer") {
    buzzer();
  }

  if (args[0] === "beep") {
    beep();
  }
}

function sendUpdatesToClients(data: object) {
  for (const id in clients) {
    clients[id]?.send(JSON.stringify(data));
  }
}

function buzzerOn() {
  for (const scannerId in scanners) {
    scanners[scannerId]?.send("buzzer on");
  }
}
function buzzerOff() {
  for (const scannerId in scanners) {
    scanners[scannerId]?.send("buzzer off");
  }
}
async function buzzer(duration: number = 500) {
  buzzerOn();
  await delay(duration);
  buzzerOff();
}

async function beep(count: number = 1) {
  for (let i = 0; i < count; i++) {
    buzzerOn();
    await delay(50);
    buzzerOff();
    await delay(100);
  }
}
