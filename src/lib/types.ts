
export type ZoneType = 'entry-exit' | 'billing' | 'shopping';

export interface Zone {
  id: string;
  type: ZoneType;
  label: string;
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  width: number; // 0-100 percentage
  height: number; // 0-100 percentage
  color: string;
}

export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'flagged';

export interface TrackedCustomer {
  trackerId: string;
  token: string;
  bbox: { x: number; y: number; w: number; h: number };
  status: PaymentStatus;
  currentZone: ZoneType | 'none';
  lastBillingZoneEntryTimestamp: string | null;
  history: { zone: ZoneType | 'none'; timestamp: string }[];
  confidence: number;
  isReal: boolean; // True if from AI model, False if simulated
}

export interface SystemLog {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'alert';
  message: string;
  metadata?: any;
}

export interface ArduinoStatus {
  connected: boolean;
  port: string | null;
}
