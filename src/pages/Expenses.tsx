import { useEffect, useState } from "react";
import { createExpense, getExpenses } from "../api/expenseApi";

interface Expense {
    id: string;
    title: string;
    amount: number;
    category: string;
    notes?:  string | null | undefined;
    expenseDate: string;
}

export default function Expenses() {
    const [expenses, setExpenses] = useState<Expense[]>([]);

    const [title, setTitle] = useState("");
    const [amount, setAmount] = useState<number>(0);
    const [category, setCategory] = useState("");
    const [notes, setNotes] = useState("");

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        const res = await getExpenses();
        setExpenses(res);
    };

    const submit = async () => {
        if (!title || !amount || !category) return;

        await createExpense({
            title,
            amount,
            category,
            notes,
        });

        setTitle("");
        setAmount(0);
        setCategory("");
        setNotes("");

        load();
    };

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);

    return (
        <div className="min-h-screen bg-[#EEF1EF] p-4 md:p-6 font-sans text-[#14181C]">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-7xl mx-auto">

                {/* LEFT: FORM */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-black/5 space-y-3 relative overflow-hidden">
                    <div className="absolute left-0 top-0 h-full w-1 bg-red-500" />

                    <h2 className="text-[11px] font-semibold tracking-widest text-red-600 uppercase">
                        Add expense
                    </h2>

                    <div>
                        <label className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                            Title
                        </label>
                        <input
                            placeholder="e.g. Fuel for delivery van"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full mt-1.5 border border-black/10 bg-[#FAFAF8] p-3 rounded-xl cursor-text text-[14px] outline-none focus:ring-2 focus:ring-red-500/25 focus:border-red-400 transition"
                        />
                    </div>

                    <div>
                        <label className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                            Amount
                        </label>
                        <input
                            placeholder="0"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="w-full mt-1.5 border border-black/10 bg-[#FAFAF8] p-3 rounded-xl cursor-text font-mono text-[15px] outline-none focus:ring-2 focus:ring-red-500/25 focus:border-red-400 transition"
                        />
                    </div>

                    <div>
                        <label className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                            Category
                        </label>
                        <input
                            placeholder="Fuel, Salary, Rent…"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full mt-1.5 border border-black/10 bg-[#FAFAF8] p-3 rounded-xl cursor-text text-[14px] outline-none focus:ring-2 focus:ring-red-500/25 focus:border-red-400 transition"
                        />
                    </div>

                    <div>
                        <label className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                            Notes
                        </label>
                        <textarea
                            placeholder="Optional details"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full mt-1.5 border border-black/10 bg-[#FAFAF8] p-3 rounded-xl cursor-text text-[14px] outline-none focus:ring-2 focus:ring-red-500/25 focus:border-red-400 transition resize-none"
                        />
                    </div>

                    <button
                        onClick={submit}
                        className="w-full bg-red-600 hover:bg-red-700 text-white p-3.5 rounded-2xl font-semibold tracking-wide cursor-pointer transition shadow-sm"
                    >
                        Add expense
                    </button>

                </div>

                {/* RIGHT: LIST */}
                <div className="lg:col-span-2 bg-white p-4 rounded-2xl shadow-sm border border-black/5">

                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                            Expense list
                        </h2>
                        <span className="text-[11px] font-mono text-black/40">
                            {expenses.length} {expenses.length === 1 ? "entry" : "entries"}
                        </span>
                    </div>

                    {expenses.length === 0 ? (
                        <div className="py-12 text-center text-black/30 text-sm">
                            No expenses recorded yet
                        </div>
                    ) : (
                        <div className="divide-y divide-dashed divide-black/10">
                            {expenses.map((e) => (
                                <div
                                    key={e.id}
                                    className="flex justify-between items-center py-3"
                                >
                                    <div>
                                        <p className="font-medium text-[14px]">{e.title}</p>
                                        <p className="text-[12px] text-black/40 mt-0.5">
                                            {e.category}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="font-mono font-bold text-[15px] text-red-600">
                                            − Rs {e.amount}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* TOTAL */}
                    <div className="mt-4 bg-[#12171A] rounded-2xl p-4 flex items-center justify-between">
                        <p className="text-[11px] tracking-widest uppercase text-white/40 font-semibold">
                            Total expenses
                        </p>
                        <p className="font-mono text-2xl font-semibold tabular-nums text-[#F87171] [text-shadow:0_0_18px_rgba(248,113,113,0.35)]">
                            Rs {total}
                        </p>
                    </div>

                </div>

            </div>
        </div>
    );
}