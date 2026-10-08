"use client";

import { useCallback, useEffect, useState } from "react";

interface Medicine {
  id: string;
  name: string;
  company: string;
  stock: number;
  minStock: number;
  expiryDate: string;
  buyPrice: number;
  sellPrice: number;
}

interface Alerts {
  counts: { lowStock: number; expired: number; expiring: number };
  lowStock: Medicine[];
  expired: Medicine[];
  expiring: Medicine[];
}

interface DueCustomer {
  id: string;
  name: string;
  phone: string;
  balance: number;
}

const input =
  "h-11 rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm outline-none placeholder:text-slate-600 focus:border-emerald-500";
const btn =
  "h-11 cursor-pointer rounded-xl bg-emerald-500 px-5 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40";
const ghost =
  "h-11 cursor-pointer rounded-xl border border-slate-700 px-4 text-sm text-slate-300 transition hover:border-emerald-500 hover:text-white";

export default function Home() {
  const [meds, setMeds] = useState<Medicine[]>([]);
  const [alerts, setAlerts] = useState<Alerts | null>(null);
  const [dues, setDues] = useState<DueCustomer[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", company: "", stock: "", minStock: "10", expiryDate: "", buyPrice: "", sellPrice: "" });
  const [dueForm, setDueForm] = useState({ name: "", phone: "" });
  const [txn, setTxn] = useState({ customerId: "", amount: "", kind: "due" });

  const load = useCallback(async () => {
    try {
      const [m, a, d] = await Promise.all([
        fetch("/api/medicines").then((r) => r.json()),
        fetch("/api/alerts").then((r) => r.json()),
        fetch("/api/dues").then((r) => r.json()),
      ]);
      setMeds(m.medicines ?? []);
      setAlerts(a);
      setDues(d.customers ?? []);
    } catch {
      /* offline */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const fail = (e: unknown) => setError(e instanceof Error ? e.message : "Failed.");

  const addMed = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const r = await fetch("/api/medicines", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          stock: Number(form.stock) || 0,
          minStock: Number(form.minStock) || 0,
          buyPrice: Number(form.buyPrice) || 0,
          sellPrice: Number(form.sellPrice) || 0,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setForm({ name: "", company: "", stock: "", minStock: "10", expiryDate: "", buyPrice: "", sellPrice: "" });
      load();
    } catch (e) {
      fail(e);
    }
  };

  const stock = async (id: string, kind: "in" | "out") => {
    const qty = Number(prompt(kind === "in" ? "Stock in — quantity?" : "Sell/dispense — quantity?"));
    if (!qty || qty <= 0) return;
    setError("");
    try {
      const r = await fetch("/api/medicines/stock", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, qty, kind }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      load();
    } catch (e) {
      fail(e);
    }
  };

  const removeMed = async (id: string) => {
    if (!confirm("Delete this medicine?")) return;
    await fetch(`/api/medicines?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    load();
  };

  const addCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const r = await fetch("/api/dues", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(dueForm),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setDueForm({ name: "", phone: "" });
      load();
    } catch (e) {
      fail(e);
    }
  };

  const addTxn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const r = await fetch("/api/dues/txn", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...txn, amount: Number(txn.amount) }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setTxn({ customerId: "", amount: "", kind: "due" });
      load();
    } catch (e) {
      fail(e);
    }
  };

  const seed = async () => {
    await fetch("/api/seed", { method: "POST" });
    load();
  };

  const totalDues = dues.reduce((a, d) => a + d.balance, 0);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-emerald-400">PharmaHisab</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Pharmacy, fully hisab&apos;d.</h1>
          <p className="mt-2 text-slate-400">Stock · expiry alerts · বাকি-খাতা — one dashboard.</p>
        </div>
        <button onClick={seed} className={ghost}>
          Load demo data
        </button>
      </header>

      {error && (
        <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {alerts && (alerts.counts.expired > 0 || alerts.counts.expiring > 0 || alerts.counts.lowStock > 0) && (
        <div className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
          <p className="font-bold text-amber-300">⚠ Action needed</p>
          <ul className="mt-1.5 space-y-1 text-slate-300">
            {alerts.expired.map((m) => (
              <li key={m.id}>🔴 <b>{m.name}</b> expired ({m.expiryDate}) — remove from shelf!</li>
            ))}
            {alerts.expiring.map((m) => (
              <li key={m.id}>🟡 <b>{m.name}</b> expires {m.expiryDate} — sell first.</li>
            ))}
            {alerts.lowStock.map((m) => (
              <li key={m.id}>📦 <b>{m.name}</b> low stock: {m.stock} left (min {m.minStock}).</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Medicines", v: meds.length },
          { l: "Stock units", v: meds.reduce((a, m) => a + m.stock, 0) },
          { l: "Alerts", v: (alerts?.counts.expired ?? 0) + (alerts?.counts.expiring ?? 0) + (alerts?.counts.lowStock ?? 0) },
          { l: "বাকি outstanding (৳)", v: totalDues },
        ].map((c) => (
          <div key={c.l} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-sm text-slate-400">{c.l}</p>
            <p className="mt-1 text-3xl font-black tabular-nums">{c.v}</p>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-slate-500">Stock</h2>
        <form onSubmit={addMed} className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Medicine name *" className={input} />
          <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company" className={input} />
          <input value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="Stock qty" inputMode="numeric" className={input} />
          <input value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} placeholder="Min stock" inputMode="numeric" className={input} />
          <input value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} type="date" className={`${input} text-slate-400`} />
          <input value={form.buyPrice} onChange={(e) => setForm({ ...form, buyPrice: e.target.value })} placeholder="Buy ৳" inputMode="decimal" className={input} />
          <input value={form.sellPrice} onChange={(e) => setForm({ ...form, sellPrice: e.target.value })} placeholder="Sell ৳" inputMode="decimal" className={input} />
          <button type="submit" className={btn}>Add medicine</button>
        </form>

        <ul className="mt-4 space-y-2">
          {meds.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-bold">
                  {m.name} <span className="font-normal text-slate-500">{m.company}</span>
                </p>
                <p className="font-mono text-xs text-slate-500">
                  stock <b className={m.stock <= m.minStock ? "text-amber-300" : "text-slate-300"}>{m.stock}</b>
                  {" · "}exp {m.expiryDate || "—"}{" · "}৳{m.buyPrice}→৳{m.sellPrice}
                </p>
              </div>
              <span className="ml-auto flex gap-2">
                <button onClick={() => stock(m.id, "in")} className="cursor-pointer rounded-lg border border-slate-700 px-3 py-1.5 text-xs hover:border-emerald-500">+ In</button>
                <button onClick={() => stock(m.id, "out")} className="cursor-pointer rounded-lg border border-slate-700 px-3 py-1.5 text-xs hover:border-amber-500">− Out</button>
                <button onClick={() => removeMed(m.id)} className="cursor-pointer rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-500 hover:border-red-500 hover:text-red-300">Del</button>
              </span>
            </li>
          ))}
        </ul>
        {meds.length === 0 && <p className="mt-4 text-center text-sm text-slate-500">No medicines yet — add one or load demo data.</p>}
      </section>

      <section className="mt-10">
        <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-slate-500">বাকি-খাতা (credit ledger)</h2>
        <form onSubmit={addCustomer} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input value={dueForm.name} onChange={(e) => setDueForm({ ...dueForm, name: e.target.value })} placeholder="Customer name *" className={`${input} flex-1`} />
          <input value={dueForm.phone} onChange={(e) => setDueForm({ ...dueForm, phone: e.target.value })} placeholder="Phone" className={`${input} flex-1`} />
          <button type="submit" className={btn}>Add customer</button>
        </form>
        <form onSubmit={addTxn} className="mt-2 flex flex-col gap-2 sm:flex-row">
          <select value={txn.customerId} onChange={(e) => setTxn({ ...txn, customerId: e.target.value })} className={`${input} flex-1 cursor-pointer`}>
            <option value="">Select customer…</option>
            {dues.map((d) => (
              <option key={d.id} value={d.id}>{d.name} (৳{d.balance})</option>
            ))}
          </select>
          <input value={txn.amount} onChange={(e) => setTxn({ ...txn, amount: e.target.value })} placeholder="Amount ৳" inputMode="decimal" className={input} />
          <select value={txn.kind} onChange={(e) => setTxn({ ...txn, kind: e.target.value })} className={`${input} cursor-pointer`}>
            <option value="due">Due (বাকি)</option>
            <option value="payment">Payment (জমা)</option>
          </select>
          <button type="submit" className={btn}>Record</button>
        </form>
        <ul className="mt-4 space-y-2">
          {dues.map((d) => (
            <li key={d.id} className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
              <div>
                <p className="font-bold">{d.name}</p>
                <p className="font-mono text-xs text-slate-500">{d.phone || "no phone"}</p>
              </div>
              <p className={`ml-auto font-mono text-lg font-black tabular-nums ${d.balance > 0 ? "text-amber-300" : "text-emerald-300"}`}>
                ৳{d.balance}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
