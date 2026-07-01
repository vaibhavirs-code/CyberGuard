import { z } from "zod";

const appEnvSchema = z.object({
  NEXT_PUBLIC_DEFAULT_STORE_ID: z
    .string()
    .trim()
    .min(1)
    .regex(/^[A-Z0-9_-]+$/)
    .default("LOCAL_STORE"),
  NEXT_PUBLIC_ENABLE_SERIAL_ALERTS: z.enum(["true", "false"]).default("true"),
});

export function getAppConfig() {
  return appEnvSchema.parse(process.env);
}

export function validateAppConfig() {
  return appEnvSchema.safeParse(process.env);
}
