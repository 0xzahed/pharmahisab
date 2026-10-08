import { NextResponse } from "next/server";
import { adjustStock } from "@/lib/store";

export async function POST(req: Request) {
  let b: { id?: string; qty?: number; kind?: string; note?: string };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Send { id, qty, kind: in|out }." }, { status: 400 });
  }
  try {
    const doc = await adjustStock(String(b.id ?? ""), Number(b.qty), String(b.kind ?? ""), String(b.note ?? ""));
    return NextResponse.json(doc);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Stock update failed.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
