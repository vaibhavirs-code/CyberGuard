import type {
  RiskState,
  TrackHistoryPoint,
  TrackedCustomer,
  TrackedItem,
  ZoneDefinition,
  ZoneType,
} from "@/lib/types";
import { clamp } from "./tracker-utils";

type ZoneRole = "payment" | "shopping" | "exit_buffer" | "outside" | "entry";

export interface StoreZone extends ZoneDefinition {
  role: ZoneRole;
  riskBias: number;
  hysteresisPx: number;
}

export const STORE_ZONES: StoreZone[] = [
  {
    id: "checkout",
    type: "checkout",
    label: "Payment / Checkout",
    x: 2,
    y: 14,
    width: 20,
    height: 72,
    color: "#38bdf8",
    role: "payment",
    riskBias: -0.45,
    hysteresisPx: 3,
  },
  {
    id: "shelf",
    type: "shelf",
    label: "Shopping / Shelves",
    x: 18,
    y: 6,
    width: 64,
    height: 88,
    color: "#fbbf24",
    role: "shopping",
    riskBias: 0.08,
    hysteresisPx: 4,
  },
  {
    id: "aisle",
    type: "aisle",
    label: "Aisle / Movement",
    x: 32,
    y: 8,
    width: 30,
    height: 84,
    color: "#22c55e",
    role: "shopping",
    riskBias: 0.05,
    hysteresisPx: 4,
  },
  {
    id: "exit",
    type: "exit",
    label: "Exit Buffer",
    x: 82,
    y: 16,
    width: 8,
    height: 68,
    color: "#a855f7",
    role: "exit_buffer",
    riskBias: 0.18,
    hysteresisPx: 4,
  },
  {
    id: "outside",
    type: "outside",
    label: "Outside Boundary",
    x: 90,
    y: 14,
    width: 10,
    height: 72,
    color: "#ec4899",
    role: "outside",
    riskBias: 0.42,
    hysteresisPx: 5,
  },
  {
    id: "entrance",
    type: "entrance",
    label: "Entry Edge",
    x: 0,
    y: 14,
    width: 4,
    height: 72,
    color: "#60a5fa",
    role: "entry",
    riskBias: -0.08,
    hysteresisPx: 3,
  },
];

function compressZones(history: TrackHistoryPoint[]) {
  const result: ZoneType[] = [];
  for (const point of history) {
    const last = result[result.length - 1];
    if (last !== point.zone) {
      result.push(point.zone);
    }
  }
  return result;
}

function lastSeenAt(history: TrackHistoryPoint[], zone: ZoneType) {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (history[i].zone === zone) {
      return history[i].at;
    }
  }
  return undefined;
}

function tailDwellMs(history: TrackHistoryPoint[], zone: ZoneType, now: number) {
  let firstIdx = -1;
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (history[i].zone !== zone) {
      break;
    }
    firstIdx = i;
  }

  if (firstIdx === -1) {
    return 0;
  }

  return now - history[firstIdx].at;
}

function includesSequence(path: ZoneType[], sequence: ZoneType[]) {
  if (sequence.length === 0 || path.length < sequence.length) {
    return false;
  }

  for (let i = 0; i <= path.length - sequence.length; i += 1) {
    let ok = true;
    for (let j = 0; j < sequence.length; j += 1) {
      if (path[i + j] !== sequence[j]) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }

  return false;
}

function linkedItems(customer: TrackedCustomer, items: TrackedItem[]) {
  return items.filter(
    (item) =>
      customer.associatedItemIds.includes(item.id) ||
      item.associatedPersonId === customer.id ||
      item.lastAssociatedPersonId === customer.id,
  );
}

function hasRecentTransfer(items: TrackedItem[], now: number) {
  return items.some((item) => item.transferAt !== undefined && now - item.transferAt < 6000);
}

function hasRecentReturn(items: TrackedItem[], now: number) {
  return items.some((item) => item.returnedAt !== undefined && now - item.returnedAt < 7000);
}

function hasCheckoutSignal(customer: TrackedCustomer, now: number) {
  const checkoutAt = customer.lastCheckoutAt ?? customer.paymentAt;
  return checkoutAt !== undefined && now - checkoutAt < 12000;
}

export interface StoreRiskAssessment {
  score: number;
  state: RiskState;
  reasons: string[];
  shouldTriggerBuzzer: boolean;
}

export function stabilizeZone(
  previousZone: ZoneType,
  candidateZone: ZoneType,
  lastZoneChangeAt: number,
  now: number,
  holdMs = 260,
) {
  if (candidateZone === previousZone) {
    return previousZone;
  }

  if (now - lastZoneChangeAt < holdMs) {
    return previousZone;
  }

  return candidateZone;
}

export function assessStoreRisk(
  customer: TrackedCustomer,
  items: TrackedItem[],
  now: number,
): StoreRiskAssessment {
  if (customer.paid || customer.paymentState === "paid") {
    return {
      score: 0,
      state: "benign",
      reasons: ["payment already confirmed"],
      shouldTriggerBuzzer: false,
    };
  }

  const history = customer.history.slice(-36);
  const path = compressZones(history);
  const linked = linkedItems(customer, items);
  const checkoutSeen = path.includes("checkout");
  const exitSeen = path.includes("exit");
  const outsideSeen = path.includes("outside");
  const paymentDwellMs = tailDwellMs(history, "checkout", now);
  const exitDwellMs = tailDwellMs(history, "exit", now);
  const outsideSeenAt = lastSeenAt(history, "outside");
  const checkoutSeenAt = lastSeenAt(history, "checkout");
  const shelfSeenAt = lastSeenAt(history, "shelf");

  let score = 0;
  const reasons: string[] = [];

  const uncertainty = clamp(customer.uncertaintyScore);
  const recentTransfer = hasRecentTransfer(linked, now);
  const recentReturn = hasRecentReturn(linked, now);
  const recentCheckout = hasCheckoutSignal(customer, now);

  for (const item of linked) {
    switch (item.state) {
      case "touched":
        score += 0.06;
        reasons.push("item was touched");
        break;
      case "picked_up":
        score += 0.14;
        reasons.push("item was picked up");
        break;
      case "moving":
      case "associated_with_person":
        score += 0.12;
        reasons.push("item moved with the person");
        break;
      case "transferred_between_people":
        score += 0.04;
        reasons.push("possible handoff detected");
        break;
      case "near_checkout":
        score = Math.max(0, score - 0.18);
        reasons.push("item moved into checkout context");
        break;
      case "near_exit":
        score += 0.22;
        reasons.push("item approached exit");
        break;
      case "exited_boundary":
        score += 0.34;
        reasons.push("item crossed outside boundary");
        break;
      case "returned_to_shelf":
        score = Math.max(0, score - 0.34);
        reasons.push("item returned to shelf");
        break;
      case "lost_tracking":
        score = Math.max(0, score - 0.06);
        reasons.push("item continuity became uncertain");
        break;
      default:
        break;
    }
  }

  if (checkoutSeen) {
    score = Math.max(0, score - 0.22);
    reasons.push("checkout zone was visited");
  }

  if (paymentDwellMs >= 2200) {
    score = Math.max(0, score - 0.18);
    reasons.push("checkout dwell time is consistent with payment");
  }

  if (recentCheckout) {
    score = Math.max(0, score - 0.14);
    reasons.push("recent payment context reduces suspicion");
  }

  if (includesSequence(path, ["shelf", "checkout", "exit"])) {
    score = Math.max(0, score - 0.12);
    reasons.push("sequence suggests shelf to payment to exit");
  }

  if (includesSequence(path, ["shelf", "exit", "outside"])) {
    score += 0.26;
    reasons.push("sequence moved from shopping area to outside");
  }

  if (exitSeen) {
    score += 0.1;
    reasons.push("exit buffer was reached");
  }

  if (exitDwellMs >= 650 && linked.some((item) => item.state !== "returned_to_shelf")) {
    score += 0.12;
    reasons.push("sustained exit-buffer dwell");
  }

  if (outsideSeen) {
    score += 0.24;
    reasons.push("outside boundary was crossed");
  }

  if (outsideSeenAt !== undefined && now - outsideSeenAt >= 1200) {
    score += 0.12;
    reasons.push("outside boundary persistence");
  }

  if (shelfSeenAt !== undefined && checkoutSeenAt !== undefined && shelfSeenAt < checkoutSeenAt) {
    score = Math.max(0, score - 0.1);
    reasons.push("shopping preceded checkout");
  }

  if (recentTransfer) {
    score = Math.max(0, score - 0.26);
    reasons.push("recent transfer lowers certainty");
  }

  if (recentReturn) {
    score = Math.max(0, score - 0.3);
    reasons.push("recent return to shelf lowers risk");
  }

  if (customer.state === "interacting_with_person") {
    score = Math.max(0, score - 0.05);
    reasons.push("person-to-person interaction adds ambiguity");
  }

  if (customer.state === "near_checkout") {
    score = Math.max(0, score - 0.12);
    reasons.push("person is near checkout");
  }

  if (customer.state === "near_exit" || customer.state === "leaving") {
    score += 0.1;
    reasons.push("person is approaching exit");
  }

  if (customer.zone === "outside") {
    score += 0.16;
    reasons.push("person crossed store boundary");
  }

  const adjustedScore = clamp(score * (1 - uncertainty * 0.38));

  // No item hypothesis means no theft-style escalation.
  if (!linked.length) {
    return {
      score: Math.min(adjustedScore, 0.28),
      state: uncertainty >= 0.58 || outsideSeen || exitSeen ? "uncertain" : "benign",
      reasons: Array.from(new Set([...reasons, "no item hypothesis linked to person"])).slice(0, 6),
      shouldTriggerBuzzer: false,
    };
  }

  let state: RiskState = "benign";

  if (recentTransfer) {
    state = "possible_transfer";
  } else if (uncertainty >= 0.58) {
    state = "uncertain";
  } else if (adjustedScore < 0.12) {
    state = "benign";
  } else if (adjustedScore < 0.28) {
    state = "uncertain";
  } else if (adjustedScore < 0.48) {
    state = "possible_removal";
  } else if (adjustedScore < 0.72) {
    state = "suspicious_activity";
  } else {
    state = "high_risk_suspicious_activity";
  }

  const shouldTriggerBuzzer =
    state === "high_risk_suspicious_activity" &&
    outsideSeen &&
    !recentTransfer &&
    !recentReturn &&
    adjustedScore >= 0.82 &&
    uncertainty < 0.3 &&
    !customer.paid;

  return {
    score: adjustedScore,
    state,
    reasons: Array.from(new Set(reasons)).slice(0, 6),
    shouldTriggerBuzzer,
  };
}
