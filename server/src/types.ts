export type Location = "INDOOR" | "OUTDOOR";

export interface RfidScanRecord {
  id: string;
  recordedAt: string;
  recordedUID: string;
  scannerID: string;
  location: Location;
}

export interface IrScanRecord {
  id: string;
  recordedAt: string;
  indoorStatus: boolean;
  outdoorStatus: boolean;
  scannerID: string;
}

export interface MotionRecord {
  id: string;
  recordedAt: string;
  towards: Location;
  scannerID: string;
}

export interface StudentsPresenceRecord {
  id: string;
  recordedAt: string;
  location: Location;
  studentId: string;
}
