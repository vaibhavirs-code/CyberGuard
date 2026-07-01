import type { MatchResult, PaymentEvent, TrackedCustomer, ZoneDefinition } from "@/lib/types";
import { clamp } from "@/tracking/tracker-utils";

export interface AutomatedPaymentMatcherInput {
  customers: TrackedCustomer[];
  paymentEvent: PaymentEvent;
  zones?: ZoneDefinition[];
}

function getCheckoutZone(zones?: ZoneDefinition[]) {
  return zones?.find((zone) => zone.type === "checkout");
}

function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function scoreCustomer(customer: TrackedCustomer, paymentEvent: PaymentEvent, zones?: ZoneDefinition[]) {
  if (customer.paid && !paymentEvent.referenceId) {
    return -1;
  }

  const now = paymentEvent.timestamp ?? Date.now();
  let score = 0;
  const checkoutZone = getCheckoutZone(zones);

  if (customer.zone === "checkout") {
    score += 0.32;
  }

  if (customer.state === "near_checkout") {
    score += 0.22;
  }

  if (customer.seenCheckout) {
    score += 0.18;
  }

  score += clamp(customer.checkoutVisits / 3) * 0.1;
  score += clamp(customer.associatedItemIds.length / 2) * 0.12;

  if (customer.lastCheckoutAt) {
    score += clamp(1 - (now - customer.lastCheckoutAt) / 14000) * 0.18;
  }

  score += clamp(1 - (now - customer.lastSeen) / 5000) * 0.08;
  score += clamp(customer.zoneDwellMs / 4000) * 0.06;

  if (checkoutZone) {
    const checkoutCenter = {
      x: checkoutZone.x + checkoutZone.width / 2,
      y: checkoutZone.y + checkoutZone.height / 2,
    };
    score += clamp(1 - distance(customer.centroid, checkoutCenter) / 30) * 0.18;
  }

  if (customer.riskState === "possible_removal" || customer.riskState === "suspicious_activity") {
    score += 0.04;
  }

  if (paymentEvent.confirmed === false) {
    score -= 0.35;
  } else {
    score += 0.06;
  }

  return clamp(score);
}

export async function automatedPaymentMatcherFlow(
  input: AutomatedPaymentMatcherInput,
): Promise<MatchResult> {
  const customers = input.customers ?? [];
  const paymentEvent = input.paymentEvent;
  const zones = input.zones ?? [];

  if (paymentEvent.confirmed === false) {
    return {
      customers,
      message: "Payment event was not confirmed, so no person was matched.",
    };
  }

  if (!customers.length) {
    return {
      customers: [],
      message: "No tracked people are available for payment matching.",
    };
  }

  const scoredCustomers = customers
    .map((customer) => ({
      customer,
      score: scoreCustomer(customer, paymentEvent, zones),
    }))
    .filter((candidate) => candidate.score >= 0)
    .sort((left, right) => right.score - left.score);

  if (!scoredCustomers.length) {
    return {
      customers,
      message: "No eligible person was found for this payment event.",
    };
  }

  const best = scoredCustomers[0];
  const secondBest = scoredCustomers[1];

  if (best.score < 0.56 || (secondBest && best.score - secondBest.score < 0.12)) {
    return {
      customers,
      message: "Payment was captured, but checkout attribution is still ambiguous.",
    };
  }

  return {
    customers: customers.map((customer) =>
      customer.id === best.customer.id
        ? {
            ...customer,
            paid: true,
            paymentState: "matched",
            paymentMethod: paymentEvent.method,
            paymentAt: paymentEvent.timestamp ?? Date.now(),
            alerted: false,
            alertAt: undefined,
            state: "near_checkout",
            riskState: "benign",
            riskScore: 0,
            riskReasons: ["payment matched to checkout behavior"],
          }
        : customer,
    ),
    matchedCustomerId: best.customer.id,
    message: `Matched payment event to ${best.customer.id} with ${Math.round(best.score * 100)}% confidence.`,
  };
}
