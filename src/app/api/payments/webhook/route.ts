import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

function json(status: number, body: unknown) {
  return NextResponse.json(body, { status });
}

async function supabaseRequest(path: string, init: RequestInit = {}, serviceRole = false) {
  if (!SUPABASE_URL) throw new Error("Supabase URL is not configured.");
  const key = serviceRole ? SUPABASE_SERVICE_ROLE_KEY : SUPABASE_ANON_KEY;
  if (!key) throw new Error("Supabase API key is not configured.");

  return fetch(`${SUPABASE_URL}${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
}

function verifyWebhookSignature(rawBody: string, signature: string | null) {
  if (!RAZORPAY_WEBHOOK_SECRET || !signature) return false;
  const expected = createHmac("sha256", RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest("hex");
  const left = Buffer.from(expected, "utf8");
  const right = Buffer.from(signature, "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();

    if (!verifyWebhookSignature(rawBody, request.headers.get("x-razorpay-signature"))) {
      return json(401, { error: "Invalid webhook signature." });
    }

    const payload = JSON.parse(rawBody) as {
      event?: string;
      payload?: {
        payment?: {
          entity?: {
            id?: string;
            method?: string;
            amount?: number;
            currency?: string;
            status?: string;
            captured?: boolean;
            created_at?: number;
            order_id?: string;
          };
        };
      };
    };

    if (payload.event !== "payment.captured") {
      return json(200, { accepted: true, ignored: true, event: payload.event ?? "unknown" });
    }

    const payment = payload.payload?.payment?.entity;
    if (!payment?.id) {
      return json(400, { error: "Captured payment payload is missing payment id." });
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return json(503, { error: "Payment event storage is not configured." });
    }

    const row = {
      external_payment_id: payment.id,
      method: payment.method ?? "upi",
      amount: payment.amount ?? null,
      currency: payment.currency ?? "INR",
      confirmed: payment.status === "captured" || payment.captured === true,
      timestamp: payment.created_at ? payment.created_at * 1000 : Date.now(),
      reference_id: payment.order_id ?? payment.id,
      source: "RAZORPAY",
    };

    const response = await supabaseRequest("/rest/v1/payment_events?on_conflict=external_payment_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(row),
    }, true);

    if (!response.ok) {
      const detail = await response.text();
      return json(502, { error: "Unable to persist payment event.", detail });
    }

    return json(200, { accepted: true, paymentId: payment.id });
  } catch (error) {
    return json(500, { error: error instanceof Error ? error.message : "Webhook processing failed." });
  }
}

export async function GET(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return json(401, { error: "Operator authentication required." });
    }

    const userResponse = await supabaseRequest("/auth/v1/user", {
      headers: { Authorization: authorization },
    });

    if (!userResponse.ok) {
      return json(401, { error: "Invalid operator session." });
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return json(503, { error: "Payment event storage is not configured." });
    }

    const url = new URL(request.url);
    const since = Number(url.searchParams.get("since") ?? 0);
    const safeSince = Number.isFinite(since) ? since : 0;

    const response = await supabaseRequest(
      `/rest/v1/payment_events?select=id,external_payment_id,method,amount,currency,confirmed,timestamp,reference_id,source&timestamp=gt.${encodeURIComponent(safeSince)}&order=timestamp.asc&limit=20`,
      {},
      true,
    );

    if (!response.ok) {
      return json(502, { error: "Unable to read payment events." });
    }

    return json(200, { events: await response.json() });
  } catch (error) {
    return json(500, { error: error instanceof Error ? error.message : "Payment event polling failed." });
  }
}
