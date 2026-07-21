import crypto from "crypto";

/**
 * Generate a license key in XXXX-XXXX-XXXX-XXXX format
 */
export function generateLicenseKey(): string {
  const segments = 4;
  const segmentLength = 4;
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const parts: string[] = [];

  for (let i = 0; i < segments; i++) {
    let segment = "";
    const bytes = crypto.randomBytes(segmentLength);
    for (let j = 0; j < segmentLength; j++) {
      segment += chars[bytes[j] % chars.length];
    }
    parts.push(segment);
  }

  return parts.join("-");
}

/**
 * Calculate expiry date given duration in days. Returns null for lifetime.
 */
export function calculateExpiry(durationDays: number | null): Date | null {
  if (durationDays === null) return null;
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + durationDays);
  return expiry;
}
