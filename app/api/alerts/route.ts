import { NextResponse } from "next/server";
import { listMedicines } from "@/lib/store";
import { expiryStatus } from "@/lib/expiry";

export async function GET() {
  const meds = await listMedicines();
  const lowStock = meds.filter((m) => m.stock <= m.minStock);
  const expired = meds.filter((m) => expiryStatus(m).status === "expired");
  const expiring = meds.filter((m) => expiryStatus(m).status === "soon");
  return NextResponse.json({
    counts: { lowStock: lowStock.length, expired: expired.length, expiring: expiring.length },
    lowStock,
    expired,
    expiring,
  });
}
