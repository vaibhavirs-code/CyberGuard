export type ZoneType = 'entry' | 'billing' | 'exit' | 'shopping';

export interface Zone {
  id: string;
  type: ZoneType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
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
}

export interface PaymentEvent {
  paymentId: string;
  trackerId?: string;
  paymentMethod: 'QR' | 'POS' | 'Card' | 'UPI';
  amount: number;
  timestamp: string;
  status: 'success' | 'failed';
}

export interface SystemLog {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'alert';
  message: string;
  metadata?: any;
}
