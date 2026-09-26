import type { OperatorLevel, OperatorSession } from "@/lib/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SESSION_KEY = "cyberguard-auth-session";
const ACCESS_TOKEN_STORAGE_KEY = "cyberguard-auth-access-token";

interface SupabaseUser {
  id: string;
  email?: string;
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: SupabaseUser;
}

interface OperatorProfile {
  name: string;
  id: string;
  level: OperatorLevel;
  store: string;
}

function requireConfig() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Authentication is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
}

async function supabaseRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  requireConfig();
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body?.msg ?? body?.message ?? body?.error_description ?? "Authentication request failed.");
  }
  return body as T;
}

export async function registerOperator(
  email: string,
  password: string,
  name: string,
  operatorId: string,
  store: string,
): Promise<string> {
  const auth = await supabaseRequest<AuthResponse>("/auth/v1/signup", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      data: { name, operator_id: operatorId, store },
    }),
  });

  if (!auth.access_token) {
    return "Account created. Check your email to confirm the account, then sign in. Your operator profile must also be created by an administrator before first login.";
  }

  await supabaseRequest<OperatorProfile[]>("/rest/v1/operators", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.access_token}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      user_id: auth.user.id,
      name,
      id: operatorId,
      level: "OPERATOR",
      store,
    }),
  });

  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, auth.access_token);
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      accessToken: auth.access_token,
      refreshToken: auth.refresh_token,
      user: auth.user,
      profile: { name, id: operatorId, level: "OPERATOR", store },
    }),
  );

  return "Account created successfully. You are now signed in.";
}

export async function signInOperator(email: string, password: string): Promise<OperatorSession> {
  const auth = await supabaseRequest<AuthResponse>("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  const profiles = await supabaseRequest<OperatorProfile[]>(
    `/rest/v1/operators?select=name,id,level,store&user_id=eq.${encodeURIComponent(auth.user.id)}&limit=1`,
    { headers: { Authorization: `Bearer ${auth.access_token}` } },
  );

  const profile = profiles[0];
  if (!profile) {
    throw new Error("Your account is authenticated, but no operator profile is assigned.");
  }

  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, auth.access_token);
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      accessToken: auth.access_token,
      refreshToken: auth.refresh_token,
      user: auth.user,
      profile,
    }),
  );

  return { ...profile, mode: "ACTIVE" };
}

export function getOperatorAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function clearOperatorSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function hasConfiguredAuth() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
