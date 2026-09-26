import type { CameraFeedState, TransactionTwinResult, TrackedCustomer } from "@/lib/types";

function round(value: number) {
  return Math.round(value * 100) / 100;
}

export function buildTransactionTwin(camera: CameraFeedState, customer: TrackedCustomer): TransactionTwinResult {
  const products = camera.detectedProducts.filter(
    (product) => product.associatedPersonId === customer.id && product.state !== "lost_tracking",
  );
  const expectedAmount = round(products.reduce((sum, product) => sum + Math.max(0, product.unitPrice), 0));
  const paymentAmount = customer.paymentAmount;
  const detectionConfidence = Math.max(0, Math.min(1, customer.confidence));
  const trackingStability = Math.max(0, Math.min(1,
    (customer.framesSeen / 30) * 0.6 +
    (customer.trackingConfidence === "high" ? 0.4 : customer.trackingConfidence === "medium" ? 0.25 : 0.1)
  ));
  const evidence = camera.evidenceSnapshots.filter((snapshot) => snapshot.customerId === customer.id);
  const timeline: TransactionTwinResult["timeline"] = [
    { at: customer.firstSeenAt, label: "Customer detected", detail: customer.framesSeen + " frames observed", kind: "detection" as const },
    ...customer.history.slice(-8).map((point) => ({
      at: point.at, label: "Zone: " + point.zone, detail: "Tracked movement event", kind: "movement" as const,
    })),
    ...products.flatMap((product) => [
      { at: product.firstSeenAt, label: product.name, detail: "₹" + product.unitPrice.toFixed(2) + " · " + product.framesSeen + " frames", kind: "product" as const },
      ...(product.checkoutAt ? [{ at: product.checkoutAt, label: product.name + " at checkout", detail: "Product reached checkout zone", kind: "product" as const }] : []),
    ]),
    ...(customer.paymentAt ? [{
      at: customer.paymentAt,
      label: "Payment event",
      detail: (customer.paymentMethod?.toUpperCase() ?? "PAYMENT") + (paymentAmount !== undefined ? " · ₹" + paymentAmount.toFixed(2) : ""),
      kind: "payment" as const,
    }] : []),
  ].sort((a, b) => a.at - b.at);

  const reasons: string[] = [
    products.length + " associated product track" + (products.length === 1 ? "" : "s") + " reconstructed from multi-frame tracking.",
    "Detection confidence is " + Math.round(detectionConfidence * 100) + "%; tracking stability is " + Math.round(trackingStability * 100) + "%.",
  ];

  let state: TransactionTwinResult["state"] = "AMBIGUOUS/REVIEW REQUIRED";
  let consistency = 0.35;

  if (!customer.paymentAt || customer.paymentState === "unpaid") {
    state = expectedAmount > 0 ? "NO PAYMENT" : "AMBIGUOUS/REVIEW REQUIRED";
    consistency = expectedAmount > 0 ? 0.15 : 0.35;
    reasons.push(expectedAmount > 0 ? "A basket was reconstructed but no related payment event is attached to this customer track." : "No reliable basket or payment relationship is available.");
  } else if (customer.paymentConfirmed === false) {
    state = "PAYMENT FAILED";
    consistency = 0.2;
    reasons.push("A payment event exists but is explicitly marked unconfirmed.");
  } else if (customer.paymentState === "paid" && paymentAmount !== undefined && expectedAmount > 0 && Math.abs(paymentAmount - expectedAmount) > 0.01) {
    state = "AMOUNT MISMATCH";
    consistency = 0.25;
    reasons.push("Payment amount ₹" + paymentAmount.toFixed(2) + " differs from reconstructed basket total ₹" + expectedAmount.toFixed(2) + ".");
  } else if (customer.paymentState !== "paid") {
    state = "PAYMENT PENDING";
    consistency = 0.45;
    reasons.push("A payment-related event is associated, but the customer is not in a confirmed paid state.");
  } else {
    state = "VERIFIED";
    consistency = paymentAmount === undefined ? 0.78 : 0.95;
    reasons.push(paymentAmount === undefined
      ? "Payment is confirmed, but no amount was supplied by the payment source, so amount consistency is not claimed."
      : "Payment is confirmed and the payment amount matches the reconstructed basket.");
  }

  consistency = round(Math.max(0, Math.min(1,
    consistency - Math.max(0, 1 - trackingStability) * 0.2 - Math.max(0, 1 - detectionConfidence) * 0.15
  )));

  return {
    state, transactionConsistencyScore: consistency, expectedAmount, paymentAmount,
    detectionConfidence, trackingStability, customerId: customer.id,
    paymentReferenceId: customer.paymentReferenceId, paymentMethod: customer.paymentMethod,
    paymentState: customer.paymentState, reasons,
    evidenceIds: evidence.map((item) => item.id), timeline,
  };
}
