
export type ZoneType = "entry" | "billing" | "exit" | "floor";
export type PaymentMethod = "qr" | "pos" | "card" | "upi" | "cash";
export type Direction = "in" | "out" | "unknown";

export type OwnershipState = 
  | "NO_ITEM" 
  | "POSSIBLE_ITEM" 
  | "OBSERVED_ITEM" 
  | "CONFIRMED_ITEM" 
  | "TRANSFERRED_ITEM" 
  | "PAID_ITEM" 
  | "CLEARED_EXIT";

export type ExitState = 
  | "WATCHING" 
  | "EXIT_PENDING" 
  | "REVIEW_EXIT" 
  | "SAFE_EXIT" 
  | "ALERT_EXIT";

export type ArduinoStatus = 
  | "DISCONNECTED" 
  | "CONNECTING" 
  | "CONNECTED" 
  | "OFFLINE" 
  | "ERROR";

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
  
  // Advanced State Management
  ownershipState: OwnershipState;
  ownershipConfidence: number; // 0..1
  groupId?: string;
  
  // Transition Tracking
  exitState: ExitState;
  exitConfidence: number;
  
  // Items & Transfers
  hasItem: boolean;
  transferredToId?: string;
  transferConfidence: number;
  
  // Security Meta
  firstSeenAt: number;
  lastSeen: number;
  seenBilling: boolean;
  paid: boolean;
  paymentMethod?: PaymentMethod;
  paymentAt?: number;
  
  // Semantic Flags for AI Matcher
  enteredStore: boolean;
  insideStore: boolean;
  
  alerted: boolean;
  alertAt?: number;
  theftConfirmedAt?: number;
  
  history: TrackHistoryPoint[];
  velocity: { x: number; y: number };
}

export interface SystemLog {
  id: string;
  timestamp: string;
  type: "info" | "success" | "warning" | "error" | "alert" | "transfer";
  category: "TRACK" | "ITEM" | "PAYMENT" | "EXIT" | "HARDWARE" | "SYSTEM";
  message: string;
  reasoning?: string;
  confidence?: number;
  trackerId?: string;
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
