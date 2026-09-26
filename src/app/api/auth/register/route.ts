import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export async function GET(request: Request) {
  const url = new URL(request.url);

  if (url.searchParams.get("check") === "supabase") {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return NextResponse.json(
        { ok: false, route: "registration-api", configured: false },
        { status: 500 },
      );
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
        headers: { apikey: SUPABASE_KEY },
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));
      return NextResponse.json({
        ok: response.ok,
        route: "registration-api",
        configured: true,
        supabaseStatus: response.status,
        supabaseReachable: true,
        authEmailEnabled: data?.external?.email ?? null,
      });
    } catch {
      return NextResponse.json(
        {
          ok: false,
          route: "registration-api",
          configured: true,
          supabaseReachable: false,
          message: "Vercel could not reach Supabase.",
        },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({
    ok: true,
    route: "registration-api",
    configured: Boolean(SUPABASE_URL && SUPABASE_KEY),
  });
}

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json(
      { message: "Authentication is not configured on the server." },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();
    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: "The server could not reach Supabase. Please try again." },
      { status: 502 },
    );
  }
}
