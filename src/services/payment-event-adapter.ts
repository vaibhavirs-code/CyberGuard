import type { PaymentEvent, PaymentMethod } from "@/lib/types";

export type PaymentEventSource = "DEMO" | "RAZORPAY";

export interface NormalizedPaymentEvent extends PaymentEvent {
  source: PaymentEventSource;
  externalPaymentId?: string;
  amount?: number;
  currency?: string;
}

const PAYMENT_METHOD_MAP: Record<string, PaymentMethod> = {
  upi: "upi",
  card: "card",
  pos: "pos",
  qr: "qr",
  cash: "cash",
};

export function normalizePaymentEvent(input: {
  source: PaymentEventSource;
  method: string;
  referenceId?: string;
  externalPaymentId?: string;
  amount?: number;
  currency?: string;
  confirmed?: boolean;
  timestamp?: number;
}): NormalizedPaymentEvent {
  const method = PAYMENT_METHOD_MAP[input.method.toLowerCase()] ?? "upi";

  return {
    source: input.source,
    method,
    referenceId: input.referenceId ?? input.externalPaymentId,
    externalPaymentId: input.externalPaymentId,
    amount: input.amount,
    currency: input.currency ?? "INR",
    confirmed: input.confirmed ?? false,
    timestamp: input.timestamp ?? Date.now(),
  };
}

export function normalizeRazorpayCapturedPayment(payment: {
  id?: string;
  method?: string;
  amount?: number;
  currency?: string;
  status?: string;
  captured?: boolean;
  created_at?: number;
}): NormalizedPaymentEvent {
  const confirmed = payment.status === "captured" || payment.captured === true;

  return normalizePaymentEvent({
    source: "RAZORPAY",
    method: payment.method ?? "upi",
    externalPaymentId: payment.id,
    amount: payment.amount,
    currency: payment.currency,
    confirmed,
    timestamp: payment.created_at ? payment.created_at * 1000 : Date.now(),
  });
}
