import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function authHeaders(request: Request) {
  const authorization = request.headers.get("authorization");
  return {
    apikey: SUPABASE_KEY,
    ...(authorization ? { Authorization: authorization } : {}),
    "Content-Type": "application/json",
  };
}

export async function GET(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ message: "Authentication is not configured on the server." }, { status: 500 });
  }

  try {
    const url = new URL(request.url);
    const query = url.searchParams.toString();
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/operators?${query}`,
      { headers: authHeaders(request), cache: "no-store" },
    );
    const data = await response.json().catch(() => []);
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "The server could not reach Supabase. Please try again." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return NextResponse.json({ message: "Authentication is not configured on the server." }, { status: 500 });
  }

  try {
    const body = await request.json();
    const response = await fetch(`${SUPABASE_URL}/rest/v1/operators`, {
      method: "POST",
      headers: {
        ...authHeaders(request),
        Prefer: "return=minimal",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ message: "The server could not reach Supabase. Please try again." }, { status: 502 });
  }
}
