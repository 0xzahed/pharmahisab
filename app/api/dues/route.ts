import { NextResponse } from "next/server";
import { addDueCustomer, listDueCustomers } from "@/lib/dues";

export async function GET() {
  return NextResponse.json({ customers: await listDueCustomers() });
}

export async function POST(req: Request) {
  let b: { name?: string; phone?: string };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ error: "Send { name, phone? }." }, { status: 400 });
  }
  const name = String(b.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Customer name is required." }, { status: 400 });
  const doc = await addDueCustomer(name, String(b.phone ?? "").trim());
  return NextResponse.json(doc, { status: 201 });
}
