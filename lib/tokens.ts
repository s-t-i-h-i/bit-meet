import { randomBytes, createHash } from "crypto";

export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

// losowemu tokenowi wystarczy SHA-256 (wolny bcrypt jest dla hasel wpisywanych przez ludzi)
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
