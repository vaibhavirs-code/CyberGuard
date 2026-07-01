import { NextResponse } from "next/server";
import { validateAppConfig } from "@/lib/env";

export function GET() {
  const validation = validateAppConfig();

  return NextResponse.json({
    ok: validation.success,
    timestamp: new Date().toISOString(),
    checks: {
      configValid: validation.success,
    },
    errors: validation.success ? [] : validation.error.issues.map((issue) => issue.path.join(".")),
  });
}
