export type Location = "INDOOR" | "OUTDOOR";

export interface RfidScanRecord {
  recordedUID: string;
  recordedAt: string;
  scannerID: string;
  location: Location;
}

export interface IrScanRecord {
  indoorStatus: boolean;
  outdoorStatus: boolean;
  recordedAt: string;
  scannerID: string;
}

export interface MotionRecord {
  towards: Location;
  recordedAt: string;
  scannerID: string;
}
