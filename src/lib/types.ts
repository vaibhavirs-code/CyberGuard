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
export type SessionMode = "LOCAL" | "ACTIVE";
export type DeploymentMode = "single" | "multi";
export type OperatorLevel = "OPERATOR" | "SUPERVISOR" | "ADMIN";
export type ArduinoStatus = "DISCONNECTED" | "CONNECTING" | "CONNECTED" | "OFFLINE" | "ERROR";
export type ConfidenceBand = "low" | "medium" | "high";
export type PersonState =
  | "entering"
  | "browsing"
  | "near_shelf"
  | "interacting_with_item"
  | "carrying_item"
  | "interacting_with_person"
  | "near_checkout"
  | "near_exit"
  | "leaving"
  | "lost_tracking";
export type ItemState =
  | "on_shelf"
  | "touched"
  | "picked_up"
  | "moving"
  | "associated_with_person"
  | "transferred_between_people"
  | "returned_to_shelf"
  | "near_checkout"
  | "near_exit"
  | "exited_boundary"
  | "lost_tracking";
export type TrackerEventType =
  | "person_entered"
  | "zone_transition"
  | "item_touch"
  | "item_pickup"
  | "item_movement"
  | "person_interaction"
  | "possible_transfer"
  | "item_return"
  | "possible_checkout_interaction"
  | "item_near_exit"
  | "exit_crossing"
  | "lost_tracking";
export type BuzzerTestStatus = "idle" | "sending" | "success" | "failure";

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

export interface RawPersonDetection extends DetectionInput {
  id: string;
  seenAt: number;
}

export interface TrackHistoryPoint {
  x: number;
  y: number;
  zone: ZoneType;
  at: number;
}

export interface TrackerEvent {
  id: string;
  at: number;
  type: TrackerEventType;
  confidence: number;
  message: string;
  reasoning: string;
  severity: "info" | "warning" | "alert";
  zone?: ZoneType;
  personId?: string;
  relatedPersonId?: string;
  itemId?: string;
}

export interface TrackedItem {
  id: string;
  source: "inferred_from_behavior";
  state: ItemState;
  confidence: number;
  uncertaintyScore: number;
  associatedPersonId?: string;
  lastAssociatedPersonId?: string;
  originZone: ZoneType;
  currentZone: ZoneType;
  createdAt: number;
  updatedAt: number;
  touchAt?: number;
  pickedUpAt?: number;
  transferAt?: number;
  returnedAt?: number;
  checkoutAt?: number;
  nearExitAt?: number;
  exitedAt?: number;
  position: { x: number; y: number };
  evidence: string[];
}

export interface TrackedCustomer {
  id: string;
  label: string;
  confidence: number;
  trackingConfidence: ConfidenceBand;
  bbox: BoundingBox;
  centroid: { x: number; y: number };
  zone: ZoneType;
  direction: Direction;
  state: PersonState;
  uncertaintyScore: number;
  interactionScore: number;
  associatedItemIds: string[];
  nearbyPersonIds: string[];

  firstSeenAt: number;
  lastSeen: number;
  framesSeen: number;
  zoneEnteredAt: number;
  zoneDwellMs: number;
  totalDwellMs: number;
  zoneTransitions: number;
  lastTransitionAt?: number;

  seenCheckout: boolean;
  checkoutVisits: number;
  lastCheckoutAt?: number;
  paid: boolean;
  paymentState: PaymentState;
  paymentMethod?: PaymentMethod;
  paymentAt?: number;

  enteredStore: boolean;
  insideStore: boolean;
  riskState: RiskState;
  riskScore: number;
  riskReasons: string[];
  alerted: boolean;
  alertAt?: number;
  history: TrackHistoryPoint[];
  velocity: { x: number; y: number };
}

export interface TrackerSnapshot {
  customers: TrackedCustomer[];
  items: TrackedItem[];
  events: TrackerEvent[];
}

export interface SystemLog {
  id: string;
  timestamp: string;
  type: "info" | "success" | "warning" | "error" | "alert" | "transfer";
  category: "TRACK" | "ITEM" | "PAYMENT" | "EXIT" | "HARDWARE" | "SYSTEM" | "TRANSFER";
  message: string;
  reasoning?: string;
  confidence?: number;
  trackerId?: string;
  relatedTrackerId?: string;
  itemId?: string;
  cameraId?: string;
  cameraLabel?: string;
}

export type CameraStatus = "LIVE" | "LOADING" | "PAUSED" | "ALERT" | "OFFLINE";

export type CameraSourceKind = "empty" | "upload" | "screen" | "local" | "stream";

export interface EvidenceSnapshot {
  id: string;
  cameraId: string;
  cameraLabel: string;
  customerId: string;
  timestamp: string;
  riskScore: number;
  reasons: string[];
  dataUrl: string;
}

export interface CameraFeedState {
  id: string;
  label: string;
  status: CameraStatus;
  sourceKind: CameraSourceKind;
  customers: TrackedCustomer[];
  items: TrackedItem[];
  rawDetections: RawPersonDetection[];
  zones: ZoneDefinition[];
  logs: SystemLog[];
  fps: number;
  currentTime: number;
  videoUrl: string | null;
  liveStream: MediaStream | null;
  streamUrl: string;
  isProcessingPayment: boolean;
  isTestingBuzzer: boolean;
  buzzerTestStatus: BuzzerTestStatus;
  buzzerTestMessage: string | null;
  evidenceSnapshots: EvidenceSnapshot[];\n  cashDetection: CashDetectionState;
}

export interface SiteOverview {
  activeCameraCount: number;
  totalTrackedPeople: number;
  totalAlerts: number;
  activeCameraId: string;
  activeCameraLabel: string;
}

export interface DeploymentConfig {
  mode: DeploymentMode;
  cameraCount: number;
}

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
