export type ZoneType = "entry" | "billing" | "exit" | "floor";

export type PaymentMethod = "qr" | "pos" | "card" | "upi" | "cash";

export type PaymentStatus = "unpaid" | "paid" | "pending" | "failed";

export type Direction = "in" | "out" | "unknown";

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ZoneDefinition extends BoundingBox {
  id: string;
  label: string;
  type: ZoneType;
  color: string;
}

export interface DetectionInput {
  id?: string;
  label: string;
  confidence: number;
  bbox: BoundingBox;
}

export interface TrackHistoryPoint {
  x: number;
  y: number;
  zone: ZoneType;
  at: number;
}

export interface TrackedCustomer {
  id: string;
  label: string;
  confidence: number;
  bbox: BoundingBox;
  centroid: { x: number; y: number };
  zone: ZoneType;
  direction: Direction;
  enteredStore: boolean;
  seenBilling: boolean;
  paid: boolean;
  paymentMethod?: PaymentMethod;
  paymentAt?: number;
  alerted: boolean;
  alertAt?: number;
  lastSeen: number;
  history: TrackHistoryPoint[];

  insideStore?: boolean;
  firstSeenAt?: number;
  zoneEnteredAt?: number;
  exitCandidateAt?: number;
}

export interface PaymentEvent {
  method: PaymentMethod;
  timestamp?: number;
  amount?: number;
  referenceId?: string;
  confirmed?: boolean;
}

export interface MatchResult {
  customers: TrackedCustomer[];
  matchedCustomerId?: string;
  message: string;
}