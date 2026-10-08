import { NextResponse } from "next/server";
import { addMedicine } from "@/lib/store";
import { addDueCustomer, addDueTxn } from "@/lib/dues";

/** One-click demo data for client demos. */
export async function POST() {
  const future = (days: number) => {
    const d = new Date(Date.now() + days * 86400000);
    return d.toISOString().slice(0, 10);
  };
  const meds = [
    { name: "Napa 500mg", company: "Beximco", stock: 240, minStock: 50, expiryDate: future(400), buyPrice: 1.2, sellPrice: 2 },
    { name: "Seclo 20mg", company: "Square", stock: 8, minStock: 30, expiryDate: future(300), buyPrice: 4, sellPrice: 6 },
    { name: "Maxpro 20mg", company: "Renata", stock: 120, minStock: 20, expiryDate: future(45), buyPrice: 4.5, sellPrice: 7 },
    { name: "Old Stock Syrup", company: "Demo", stock: 5, minStock: 10, expiryDate: future(-12), buyPrice: 60, sellPrice: 95 },
  ];
  let addedMeds = 0;
  for (const m of meds) {
    try {
      await addMedicine(m);
      addedMeds++;
    } catch {
      /* re-seed — skip */
    }
  }
  let addedDues = 0;
  try {
    const c = await addDueCustomer("Karim Uddin", "01XXXXXXXXX");
    await addDueTxn(c.id, 1250, "due", "Monthly medicine");
    await addDueTxn(c.id, 500, "payment", "Partial payment");
    addedDues = 2;
  } catch {
    /* re-seed — skip */
  }
  return NextResponse.json({ addedMeds, addedDues });
}
