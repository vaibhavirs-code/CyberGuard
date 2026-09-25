import type {
  PaymentState,
  RiskState,
  TrackedCustomer,
  ZoneType,
} from "@/lib/types";
import { createId } from "@/lib/id";

export type DpiEventType =
  | "STORE_ACTIVITY"
  | "CHECKOUT_PAYMENT"
  | "NORMAL_EXIT"
  | "UNRESOLVED_EXIT"
  | "RISK_REVIEW";

export type DpiTransactionStatus =
  | "NOT_APPLICABLE"
  | "MATCHED"
  | "NOT_CONFIRMED"
  | "AMBIGUOUS";

export type DpiRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface DpiEvent {
  eventId: string;
  subjectToken: string;
  eventType: DpiEventType;
  transactionStatus: DpiTransactionStatus;
  riskLevel: DpiRiskLevel;
  riskScore: number;
  zone: ZoneType;
  timestamp: string;
  source: "CYBERGUARD_VISION";
  schemaVersion: "1.0";
  shareStatus: "LOCAL_ONLY" | "READY_FOR_AUTHORIZED_SYSTEM";
  consentRequired: boolean;
  reasons: string[];
}

const subjectTokens = new Map<string, string>();

function getPrivacySubjectToken(customerId: string) {
  const existingToken = subjectTokens.get(customerId);

  if (existingToken) {
    return existingToken;
  }

  const token = createId("PT");
  subjectTokens.set(customerId, token);

  return token;
}

function getRiskLevel(riskState: RiskState, riskScore: number): DpiRiskLevel {
  if (
    riskState === "high_risk_suspicious_activity" ||
    riskScore >= 0.82
  ) {
    return "HIGH";
  }

  if (
    riskState === "suspicious_activity" ||
    riskState === "possible_removal" ||
    riskScore >= 0.55
  ) {
    return "MEDIUM";
  }

  return "LOW";
}

function getTransactionStatus(
  paymentState: PaymentState,
  zone: ZoneType,
): DpiTransactionStatus {
  if (paymentState === "matched" || paymentState === "paid") {
    return "MATCHED";
  }

  if (zone === "exit" || zone === "outside") {
    return "NOT_CONFIRMED";
  }

  return "NOT_APPLICABLE";
}

function getEventType(
  customer: TrackedCustomer,
): DpiEventType {
  if (
    customer.paymentState === "matched" ||
    customer.paymentState === "paid"
  ) {
    return "CHECKOUT_PAYMENT";
  }

  if (
    (customer.zone === "exit" || customer.zone === "outside") &&
    customer.riskScore >= 0.55
  ) {
    return "UNRESOLVED_EXIT";
  }

  if (customer.riskScore >= 0.55) {
    return "RISK_REVIEW";
  }

  if (customer.zone === "exit" || customer.zone === "outside") {
    return "NORMAL_EXIT";
  }

  return "STORE_ACTIVITY";
}

export function createDpiEvent(customer: TrackedCustomer): DpiEvent {
  const timestamp = new Date(customer.lastSeen).toISOString();

  return {
    eventId: createId("DPI"),
    subjectToken: getPrivacySubjectToken(customer.id),
    eventType: getEventType(customer),
    transactionStatus: getTransactionStatus(
      customer.paymentState,
      customer.zone,
    ),
    riskLevel: getRiskLevel(
      customer.riskState,
      customer.riskScore,
    ),
    riskScore: Number(customer.riskScore.toFixed(2)),
    zone: customer.zone,
    timestamp,
    source: "CYBERGUARD_VISION",
    schemaVersion: "1.0",
    shareStatus: "LOCAL_ONLY",
    consentRequired: true,
    reasons: customer.riskReasons,
  };
}

export function createDpiEvents(
  customers: TrackedCustomer[],
): DpiEvent[] {
  return customers.map(createDpiEvent);
}
