import { NextResponse } from "next/server";
import { addDueTxn } from "@/lib/dues";

export async function POST(req: Request) {
  let b: { customerId?: string; amount?: number; kind?: string; note?: string };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Send { customerId, amount, kind: due|payment }." }, { status: 400 });
  }
  try {
    const txn = await addDueTxn(String(b.customerId ?? ""), Number(b.amount), String(b.kind ?? ""), String(b.note ?? ""));
    return NextResponse.json(txn, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
