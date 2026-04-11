import { randomBytes } from "node:crypto";

const RESET_TOKEN_BYTES = 32;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

export function createPasswordResetTokenValue(): string {
  return randomBytes(RESET_TOKEN_BYTES).toString("base64url");
}

export function getPasswordResetExpiresAt(): Date {
  return new Date(Date.now() + RESET_TOKEN_TTL_MS);
}

/**
 * URL pública da app (link no e-mail de reset).
 * Ordem: APP_URL → VERCEL_URL → em desenvolvimento, localhost com PORT.
 */
export function getAppBaseUrl(): string | undefined {
  const explicit = process.env.APP_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
    return `https://${host}`;
  }

  if (process.env.NODE_ENV === "development") {
    const port = process.env.PORT ?? "3000";
    return `http://localhost:${port}`;
  }

  return undefined;
}
