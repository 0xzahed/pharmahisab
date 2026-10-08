import { db } from "@/lib/db";
import { DueCustomer, DueTxn } from "@/models/Dues";

export interface DueCustomerDoc {
  id: string;
  name: string;
  phone: string;
  balance: number; // due minus payments, ৳
}

export interface DueTxnDoc {
  id: string;
  customerId: string;
  kind: "due" | "payment";
  amount: number;
  note: string;
  at: string;
}

const memCustomers = new Map<string, { id: string; name: string; phone: string }>();
const memTxns: DueTxnDoc[] = [];

type Raw = Record<string, unknown> & { _id?: unknown; createdAt?: Date | string };

async function balanceOf(customerId: string): Promise<number> {
  if (await db()) {
    const rows = (await DueTxn.find({ customerId }).lean().catch(() => [])) as unknown as {
      kind: string;
      amount: number;
    }[];
    return rows.reduce((a, r) => a + (r.kind === "due" ? r.amount : -r.amount), 0);
  }
  return memTxns
    .filter((t) => t.customerId === customerId)
    .reduce((a, t) => a + (t.kind === "due" ? t.amount : -t.amount), 0);
}

export async function listDueCustomers(): Promise<DueCustomerDoc[]> {
  if (await db()) {
    const rows = (await DueCustomer.find({}).sort({ name: 1 }).lean().catch(() => [])) as unknown as Raw[];
    const out: DueCustomerDoc[] = [];
    for (const r of rows) {
      const id = String(r._id ?? "");
      out.push({
        id,
        name: String(r.name ?? ""),
        phone: String(r.phone ?? ""),
        balance: await balanceOf(id),
      });
    }
    return out;
  }
  const out: DueCustomerDoc[] = [];
  for (const c of memCustomers.values()) {
    out.push({ ...c, balance: await balanceOf(c.id) });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export async function addDueCustomer(name: string, phone: string): Promise<DueCustomerDoc> {
  if (await db()) {
    const created = await DueCustomer.create({ name, phone });
    const id = String(created._id);
    return { id, name, phone, balance: 0 };
  }
  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  memCustomers.set(id, { id, name, phone });
  return { id, name, phone, balance: 0 };
}

export async function addDueTxn(
  customerId: string,
  amount: number,
  kind: string,
  note: string,
): Promise<DueTxnDoc> {
  if (!customerId) throw new Error("customerId is required.");
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Amount must be positive.");
  if (kind !== "due" && kind !== "payment") throw new Error("kind must be due or payment.");
  if (await db()) {
    const exists = await DueCustomer.findById(customerId).lean().catch(() => null);
    if (!exists) throw new Error("Customer not found.");
    const created = await DueTxn.create({ customerId, kind, amount, note });
    const r = created.toObject() as unknown as Raw;
    return {
      id: String(r._id ?? ""),
      customerId,
      kind: kind as "due" | "payment",
      amount,
      note,
      at: String(r.createdAt ?? new Date().toISOString()),
    };
  }
  if (!memCustomers.has(customerId)) throw new Error("Customer not found.");
  const txn: DueTxnDoc = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    customerId,
    kind: kind as "due" | "payment",
    amount,
    note,
    at: new Date().toISOString(),
  };
  memTxns.push(txn);
  return txn;
}
