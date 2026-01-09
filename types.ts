export interface PilotRawData {
  [key: string]: string | number | undefined;
}

export enum PilotStatus {
  VALID = 'VALID',
  WARNING = 'WARNING',
  EXPIRED = 'EXPIRED',
}

export interface Pilot {
  id: string;
  name: string;
  licenseNumber?: string;
  expirationDate: Date | null;
  expirationString: string; // Original string for display
  status: PilotStatus;
  originalData: PilotRawData;
}

export interface ColumnMapping {
  name: string;
  expiration: string;
  status?: string; // Optional: explicit status column
  license?: string;
}

export interface AppState {
  step: 'UPLOAD' | 'MAPPING' | 'DASHBOARD';
  rawData: PilotRawData[];
  columns: string[];
  mapping: ColumnMapping;
  processedPilots: Pilot[];
  thresholdDays: number;
}
