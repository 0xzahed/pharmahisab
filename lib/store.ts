import { db } from "@/lib/db";
import { Medicine } from "@/models/Medicine";

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
