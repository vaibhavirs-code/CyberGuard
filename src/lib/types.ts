export type ZoneType = "entrance" | "shelf" | "aisle" | "checkout" | "exit" | "outside";
export type PaymentMethod = "qr" | "pos" | "card" | "upi" | "cash";
export type Direction = "in" | "out" | "unknown";
export type RiskState =
  | "benign"
  | "uncertain"
  | "possible_transfer"
  | "possible_removal"
  | "suspicious_activity"
  | "high_risk_suspicious_activity";
export type PaymentState = "unpaid" | "matched" | "paid";
export type CashDetectionLevel = "level1" | "level2" | "hybrid";

export interface CashDetectionState {
  detected: boolean;
  confidence: number;
  level: CashDetectionLevel;
  streak: number;
  lastDetectedAt?: number;
  lastCustomerId?: string;
  bbox?: BoundingBox;
}

export interface PaymentEvent {
  method: PaymentMethod;
  timestamp?: number;
  referenceId?: string;
  confirmed?: boolean;
}

export interface MatchResult {
  customers: TrackedCustomer[];
  matchedCustomerId?: string;
  message: string;
}

export interface OperatorSession {
  name: string;
  id: string;
  level: OperatorLevel;
  store: string;
  mode: SessionMode;
}
