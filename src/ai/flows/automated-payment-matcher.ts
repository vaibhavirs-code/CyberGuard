import { MatchResult, PaymentEvent, TrackedCustomer, ZoneDefinition } from "@/lib/types";

export interface AutomatedPaymentMatcherInput {
  customers: TrackedCustomer[];
  paymentEvent: PaymentEvent;
  zones?: ZoneDefinition[];
}

function centerOfZone(zone?: ZoneDefinition) {
  if (!zone) return null;
  return {
    x: zone.x + zone.width / 2,
    y: zone.y + zone.height / 2,
  };
}

function centerOfCustomer(customer: TrackedCustomer) {
  if (customer.centroid) return customer.centroid;
  return {
    x: customer.bbox.x + customer.bbox.width / 2,
    y: customer.bbox.y + customer.bbox.height / 2,
  };
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function normalizeMethod(method?: string) {
  const m = (method || "").toLowerCase().trim();
  if (m === "qr" || m === "pos" || m === "card" || m === "upi" || m === "cash") {
    return m as "qr" | "pos" | "card" | "upi" | "cash";
  }
  return undefined;
}

function getBillingZone(zones?: ZoneDefinition[]) {
  if (!zones?.length) return undefined;
  return zones.find((z) => z.type === "billing");
}

function scoreCustomer(
  customer: TrackedCustomer,
  paymentEvent: PaymentEvent,
  zones?: ZoneDefinition[]
) {
  // Already paid customers should not be re-matched unless there is a direct reference match.
  if (customer.paid && !paymentEvent.referenceId) {
    return -1;
  }

  const now = paymentEvent.timestamp ?? Date.now();
  let score = 0;

  const billingZone = getBillingZone(zones);
  const billingCenter = centerOfZone(billingZone);
  const customerCenter = centerOfCustomer(customer);

  // Strongest signal: explicit reference match.
  if (paymentEvent.referenceId) {
    const ref = paymentEvent.referenceId.toLowerCase();
    const id = customer.id.toLowerCase();
    const label = customer.label.toLowerCase();

    if (ref === id || ref.includes(id) || id.includes(ref)) {
      score += 0.85;
    } else if (ref.includes(label) || label.includes(ref)) {
      score += 0.5;
    }
  }

  // Payment confirmation matters.
  if (paymentEvent.confirmed !== false) {
    score += 0.08;
  } else {
    score -= 0.35;
  }

  // Prefer customers who were actually seen at billing.
  if (customer.seenBilling) score += 0.22;
  if (customer.zone === "billing") score += 0.28;
  if (customer.zone === "entry") score += 0.02;
  if (customer.zone === "floor") score += 0.06;
  if (customer.zone === "exit") score -= 0.05;

  // Prefer customers that are active/recent.
  const ageSinceSeen = now - customer.lastSeen;
  const recencyScore = clamp(1 - ageSinceSeen / 5000);
  score += recencyScore * 0.18;

  // If the payment happened recently, keep the association stronger.
  if (customer.paymentAt) {
    const sincePayment = Math.abs(now - customer.paymentAt);
    const paymentRecency = clamp(1 - sincePayment / 6000);
    score += paymentRecency * 0.08;
  }

  // Billing-zone proximity is important.
  if (billingCenter) {
    const d = distance(customerCenter, billingCenter);
    const proximity = clamp(1 - d / 500);
    score += proximity * 0.28;
  } else {
    // If no billing zone exists, use customer state only.
    if (customer.zone === "billing") score += 0.2;
  }

  // Extra boost if the person is clearly inside the store.
  if (customer.enteredStore) score += 0.08;
  if (customer.insideStore) score += 0.08;

  // Small penalty if the person is already alerted and unpaid.
  if (customer.alerted && !customer.paid) score -= 0.08;

  // Normalize into 0..1 range.
  return clamp(score);
}

export async function automatedPaymentMatcherFlow(
  input: AutomatedPaymentMatcherInput
): Promise<MatchResult> {
  const customers = input.customers ?? [];
  const paymentEvent = input.paymentEvent;
  const zones = input.zones ?? [];
  const method = normalizeMethod(paymentEvent.method);
  const paymentConfirmed = paymentEvent.confirmed !== false;

  if (!paymentConfirmed) {
    return {
      customers,
      message: "Payment event not confirmed, so no customer was matched.",
    };
  }

  if (!customers.length) {
    return {
      customers: [],
      message: "No tracked customers available for payment matching.",
    };
  }

  const scored = customers
    .map((customer) => ({
      customer,
      score: scoreCustomer(customer, paymentEvent, zones),
    }))
    .filter((item) => item.score >= 0)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) {
    return {
      customers,
      message: "No suitable customer was found for the incoming payment event.",
    };
  }

  const best = scored[0];
  const secondBest = scored[1];

  const enoughConfidence = best.score >= 0.55;
  const clearWinner = !secondBest || best.score - secondBest.score >= 0.12;

  if (!enoughConfidence || !clearWinner) {
    return {
      customers,
      message: "Payment event was detected, but no confident customer match was found.",
    };
  }

  const matchedCustomerId = best.customer.id;

  const updatedCustomers = customers.map((customer) => {
    if (customer.id !== matchedCustomerId) return customer;

    return {
      ...customer,
      paid: true,
      paymentMethod: method ?? customer.paymentMethod ?? "qr",
      paymentAt: paymentEvent.timestamp ?? Date.now(),
      seenBilling: true,
      alerted: false,
      alertAt: undefined,
    };
  });

  return {
    customers: updatedCustomers,
    matchedCustomerId,
    message: `Matched payment event to customer ${matchedCustomerId} with confidence ${Math.round(best.score * 100)}%.`,
  };
}

export default automatedPaymentMatcherFlow;