import { db } from "@/lib/db";
import { Medicine } from "@/models/Medicine";
import { StockTxn } from "@/models/StockTxn";

export interface MedicineDoc {
  id: string;
  name: string;
  company: string;
  stock: number;
  minStock: number;
  expiryDate: string;
  buyPrice: number;
  sellPrice: number;
  createdAt: string;
  updatedAt: string;
}

export type NewMedicine = Omit<MedicineDoc, "id" | "createdAt" | "updatedAt">;

const mem = new Map<string, MedicineDoc>();

type Raw = Record<string, unknown> & {
  _id?: unknown;
  id?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

const toDoc = (p: Raw): MedicineDoc => ({
  id: String(p._id ?? p.id ?? ""),
  name: String(p.name ?? ""),
  company: String(p.company ?? ""),
  stock: Number(p.stock ?? 0),
  minStock: Number(p.minStock ?? 10),
  expiryDate: String(p.expiryDate ?? ""),
  buyPrice: Number(p.buyPrice ?? 0),
  sellPrice: Number(p.sellPrice ?? 0),
  createdAt: String(p.createdAt ?? new Date().toISOString()),
  updatedAt: String(p.updatedAt ?? new Date().toISOString()),
});

export async function listMedicines(): Promise<MedicineDoc[]> {
  if (await db()) {
    const rows = await Medicine.find({}).sort({ name: 1 }).lean().catch(() => []);
    return (rows as unknown as Raw[]).map(toDoc);
  }
  return [...mem.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function addMedicine(m: NewMedicine): Promise<MedicineDoc> {
  if (await db()) {
    const created = await Medicine.create(m);
    return toDoc(created.toObject() as unknown as Raw);
  }
  const now = new Date().toISOString();
  const doc: MedicineDoc = {
    ...m,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: now,
    updatedAt: now,
  };
  mem.set(doc.id, doc);
  return doc;
}

export async function updateMedicine(
  id: string,
  patch: Partial<NewMedicine>,
): Promise<MedicineDoc | null> {
  if (await db()) {
    const row = await Medicine.findByIdAndUpdate(id, patch, { new: true }).lean().catch(() => null);
    return row ? toDoc(row as unknown as Raw) : null;
  }
  const cur = mem.get(id);
  if (!cur) return null;
  const next: MedicineDoc = { ...cur, ...patch, updatedAt: new Date().toISOString() };
  mem.set(id, next);
  return next;
}

export async function deleteMedicine(id: string): Promise<boolean> {
  if (await db()) {
    const r = await Medicine.findByIdAndDelete(id).catch(() => null);
    return !!r;
  }
  return mem.delete(id);
}

/** Adjust stock and record the movement. Throws on bad input or insufficient stock. */
export async function adjustStock(
  id: string,
  qty: number,
  kind: string,
  note = "",
): Promise<MedicineDoc> {
  if (!id) throw new Error("Medicine id is required.");
  if (!Number.isFinite(qty) || qty <= 0) throw new Error("Quantity must be a positive number.");
  if (kind !== "in" && kind !== "out") throw new Error("kind must be in or out.");

  if (await db()) {
    const med = await Medicine.findById(id);
    if (!med) throw new Error("Medicine not found.");
    const next = (med.stock as number) + (kind === "in" ? qty : -qty);
    if (next < 0) throw new Error(`Insufficient stock (have ${med.stock}).`);
    med.stock = next;
    await med.save();
    await StockTxn.create({ medicineId: id, kind, qty, note }).catch(() => undefined);
    return toDoc(med.toObject() as unknown as Raw);
  }

  const cur = mem.get(id);
  if (!cur) throw new Error("Medicine not found.");
  const next = cur.stock + (kind === "in" ? qty : -qty);
  if (next < 0) throw new Error(`Insufficient stock (have ${cur.stock}).`);
  const updated: MedicineDoc = { ...cur, stock: next, updatedAt: new Date().toISOString() };
  mem.set(id, updated);
  memTxns.push({ medicineId: id, kind, qty, note, at: new Date().toISOString() });
  return updated;
}

export interface StockTxnDoc {
  medicineId: string;
  kind: string;
  qty: number;
  note: string;
  at: string;
}

const memTxns: StockTxnDoc[] = [];

export async function listStockTxns(medicineId?: string): Promise<StockTxnDoc[]> {
  if (await db()) {
    const q = medicineId ? { medicineId } : {};
    const rows = await StockTxn.find(q).sort({ createdAt: -1 }).limit(100).lean().catch(() => []);
    return (rows as unknown as { medicineId: string; kind: string; qty: number; note?: string; createdAt?: Date }[]).map(
      (r) => ({
        medicineId: r.medicineId,
        kind: r.kind,
        qty: r.qty,
        note: String(r.note ?? ""),
        at: String(r.createdAt ?? ""),
      }),
    );
  }
  const rows = medicineId ? memTxns.filter((t) => t.medicineId === medicineId) : memTxns;
  return rows.slice(-100).reverse();
}
