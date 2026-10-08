import { NextResponse } from "next/server";
import { addMedicine, deleteMedicine, listMedicines, updateMedicine } from "@/lib/store";

const num = (v: unknown, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

export async function GET() {
  return NextResponse.json({ medicines: await listMedicines() });
}

export async function POST(req: Request) {
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Send medicine JSON." }, { status: 400 });
  }
  const name = String(b.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Medicine name is required." }, { status: 400 });
  const doc = await addMedicine({
    name,
    company: String(b.company ?? "").trim(),
    stock: num(b.stock),
    minStock: num(b.minStock, 10),
    expiryDate: String(b.expiryDate ?? ""),
    buyPrice: num(b.buyPrice),
    sellPrice: num(b.sellPrice),
  });
  return NextResponse.json(doc, { status: 201 });
}

export async function PATCH(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Send patch JSON." }, { status: 400 });
  }
  const patch: Record<string, unknown> = {};
  if (b.name !== undefined) patch.name = String(b.name).trim();
  if (b.company !== undefined) patch.company = String(b.company).trim();
  for (const k of ["stock", "minStock", "buyPrice", "sellPrice"] as const) {
    if (b[k] !== undefined) patch[k] = num(b[k]);
  }
  if (b.expiryDate !== undefined) patch.expiryDate = String(b.expiryDate);
  const doc = await updateMedicine(id, patch);
  if (!doc) return NextResponse.json({ error: "Medicine not found." }, { status: 404 });
  return NextResponse.json(doc);
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const ok = await deleteMedicine(id);
  return NextResponse.json({ deleted: ok });
}
