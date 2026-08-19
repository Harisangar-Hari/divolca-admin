import { useEffect, useState } from "react";
import {
    getDailyCash,
    addManualCash,
} from "../api/cashDashboard";

interface CashEntry {
    id: string;
    type: "IN" | "OUT";
    amount: number;
    description?: string;
    date: string;
}

interface ManualCashForm {
    type: "IN" | "OUT";
    amount: number;
    category: string;
    description: string;
}

export default function CashDashboard() {
    const [date, setDate] = useState(
        new Date().toISOString().split("T")[0]
    );

    const [data, setData] = useState<any>(null);
    const [entries, setEntries] = useState<CashEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState<ManualCashForm>({
        type: "IN",
        amount: 0,
        category: "OPENING_CASH",
        description: "",
    });

    useEffect(() => {
        loadData();
    }, [date]);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await getDailyCash(date);
            console.log("API RESPONSE:", res); // <--- Check your console to verify the numbers exist!
            setData(res);
            setEntries(res?.entries ?? []);
        } catch (err) {
            console.error(err);
            setData(null);
            setEntries([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (form.amount <= 0) {
            alert("Enter a valid amount.");
            return;
        }
        try {
            setSaving(true);
            await addManualCash(form);
            setShowModal(false);
            setForm({
                type: "IN",
                amount: 0,
                category: "OPENING_CASH",
                description: "",
            });
            await loadData();
        } catch (err) {
            console.error(err);
            alert("Failed to save cash entry.");
        } finally {
            setSaving(false);
        }
    };

    const inCategories = [
        "OPENING_CASH",
        "OWNER_INVESTMENT",
        "BANK_WITHDRAWAL",
        "LOAN",
        "OTHER_INCOME",
        "CASH_ADJUSTMENT",
        "OTHER",
    ];

    const outCategories = [
        "PETTY_CASH",
        "OFFICE_EXPENSE",
        "TRANSPORT",
        "FUEL",
        "SALARY",
        "BANK_DEPOSIT",
        "CASH_ADJUSTMENT",
        "OTHER_EXPENSE",
    ];

    // Directly read from backend
    const totalIn = data?.totalIn ?? 0;
    const totalOut = data?.totalOut ?? 0;
    const cashSales = data?.cashSales ?? 0;
    const cardSales = data?.cardSales ?? 0;
    const creditSales = data?.creditSales ?? 0;
    const grandTotal = data?.grandTotal ?? 0;

    return (
        <div className="min-h-screen bg-[#EEF1EF] p-4 md:p-6 font-sans text-[#14181C]">
            <div className="max-w-6xl mx-auto space-y-5">

                {/* HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold">Cash Dashboard</h1>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-[#0B6E4F] text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm hover:opacity-90 transition"
                        >
                            + Manual Entry
                        </button>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="border border-black/10 bg-white shadow-sm px-3 py-2.5 rounded-xl cursor-pointer text-[14px] outline-none"
                        />
                    </div>
                </div>

                {/* MANUAL CASH MODAL */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-bold">Manual Cash Entry</h2>
                                <button onClick={() => setShowModal(false)} className="text-black/40 hover:text-black">✕</button>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-black/40 uppercase">Type</label>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <button
                                        onClick={() => setForm({ ...form, type: "IN", category: "OPENING_CASH" })}
                                        className={`py-2 rounded-xl text-sm font-medium border ${form.type === "IN" ? "bg-[#0B6E4F] text-white" : "bg-white"}`}
                                    >Cash In</button>
                                    <button
                                        onClick={() => setForm({ ...form, type: "OUT", category: "PETTY_CASH" })}
                                        className={`py-2 rounded-xl text-sm font-medium border ${form.type === "OUT" ? "bg-red-600 text-white" : "bg-white"}`}
                                    >Cash Out</button>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-black/40 uppercase">Amount</label>
                                <input
                                    type="number"
                                    value={form.amount}
                                    onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                                    className="mt-2 w-full border border-black/10 rounded-xl px-3 py-2.5 outline-none"
                                    placeholder="Enter amount"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-black/40 uppercase">Category</label>
                                <select
                                    value={form.category}
                                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                                    className="mt-2 w-full border border-black/10 rounded-xl px-3 py-2.5"
                                >
                                    {(form.type === "IN" ? inCategories : outCategories).map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-black/40 uppercase">Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    rows={3}
                                    className="mt-2 w-full border border-black/10 rounded-xl px-3 py-2.5 resize-none"
                                    placeholder="Example: Opening cash"
                                />
                            </div>
                            <button onClick={handleSave} disabled={saving} className="w-full bg-[#14181C] text-white rounded-xl py-3 text-sm font-medium disabled:opacity-50">
                                {saving ? "Saving..." : "Save Entry"}
                            </button>
                        </div>
                    </div>
                )}

                {/* 6-BOX SUMMARY (Showing ALL variables) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">

                    {/* Box 1: Cash Ledger In */}
                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-black/5 relative overflow-hidden">
                        <div className="absolute left-0 top-0 h-full w-1 bg-[#0B6E4F]" />
                        <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">Cash Ledger In</p>
                        <p className="text-2xl font-mono font-bold mt-1 text-[#0B6E4F]">Rs {totalIn}</p>
                    </div>

                    {/* Box 2: Cash Ledger Out */}
                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-black/5 relative overflow-hidden">
                        <div className="absolute left-0 top-0 h-full w-1 bg-red-500" />
                        <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">Cash Ledger Out</p>
                        <p className="text-2xl font-mono font-bold mt-1 text-red-600">Rs {totalOut}</p>
                    </div>

                    {/* Box 3: POS Cash Sales (Resolved from backend) */}
                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-black/5 relative overflow-hidden">
                        <div className="absolute left-0 top-0 h-full w-1 bg-emerald-500" />
                        <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">POS Cash Sales</p>
                        <p className="text-2xl font-mono font-bold mt-1 text-emerald-600">Rs {cashSales}</p>
                    </div>

                    {/* Box 4: Card Sales (Resolved from backend) */}
                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-black/5 relative overflow-hidden">
                        <div className="absolute left-0 top-0 h-full w-1 bg-blue-500" />
                        <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">Card Sales</p>
                        <p className="text-2xl font-mono font-bold mt-1 text-blue-600">Rs {cardSales}</p>
                    </div>

                    {/* Box 5: Credit Sales */}
                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-black/5 relative overflow-hidden">
                        <div className="absolute left-0 top-0 h-full w-1 bg-amber-500" />
                        <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">Credit Sales</p>
                        <p className="text-2xl font-mono font-bold mt-1 text-amber-600">Rs {creditSales}</p>
                    </div>

                    {/* Box 6: Grand Total Revenue */}
                    <div className="p-4 bg-[#12171A] rounded-2xl shadow-sm">
                        <p className="text-[11px] font-semibold tracking-widest text-white/40 uppercase">
                            Grand Total
                        </p>
                        <p className="text-2xl font-mono font-bold mt-1 text-[#4ADE9A]">
                            Rs {grandTotal}
                        </p>
                    </div>
                </div>

                {/* TABLE */}
                <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-black/5">
                    <table className="min-w-full border-collapse text-[13px]">
                        <thead>
                            <tr className="text-left text-black/40 border-b border-black/5">
                                <th className="p-4 font-semibold text-[11px] uppercase tracking-widest">Type</th>
                                <th className="font-semibold text-[11px] uppercase tracking-widest">Amount</th>
                                <th className="font-semibold text-[11px] uppercase tracking-widest">Category</th>
                                <th className="font-semibold text-[11px] uppercase tracking-widest">Description</th>
                                <th className="font-semibold text-[11px] uppercase tracking-widest pr-4">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="text-center p-8 text-black/30">Loading...</td></tr>
                            ) : entries.length === 0 ? (
                                <tr><td colSpan={5} className="text-center p-10 text-black/30">No cash entries found</td></tr>
                            ) : (
                                entries.map((item, index) => (
                                    <tr key={item.id ?? index} className="border-b border-black/5 last:border-0 hover:bg-[#FAFAF8] transition">
                                        <td className="p-4">
                                            <span className={`text-[10px] font-semibold tracking-wide uppercase px-2 py-1 rounded-full ${item.type === "IN" ? "bg-[#0B6E4F]/10 text-[#0B6E4F]" : "bg-red-50 text-red-600"}`}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className={`font-mono font-semibold ${item.type === "IN" ? "text-[#0B6E4F]" : "text-red-600"}`}>
                                            {item.type === "IN" ? "+" : "-"} Rs {item.amount}
                                        </td>
                                        <td className="text-black/60">{(item as any).category ?? "-"}</td>
                                        <td className="text-black/60">{item.description ?? "-"}</td>
                                        <td className="text-[12px] text-black/40 pr-4">{new Date(item.date).toLocaleString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}