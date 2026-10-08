import type { MedicineDoc } from "@/lib/store";

export const EXPIRY_SOON_DAYS = 90;

export function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const ms = new Date(dateStr + "T00:00:00Z").getTime() - Date.now();
  if (!Number.isFinite(ms)) return null;
  return Math.floor(ms / 86400000);
}

export type ExpiryStatus = "expired" | "soon" | "ok" | "none";

export function expiryStatus(m: MedicineDoc): { status: ExpiryStatus; days: number | null } {
  const days = daysUntil(m.expiryDate);
  if (days === null) return { status: "none", days };
  if (days < 0) return { status: "expired", days };
  if (days <= EXPIRY_SOON_DAYS) return { status: "soon", days };
  return { status: "ok", days };
}
