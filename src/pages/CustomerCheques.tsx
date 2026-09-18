import { useEffect, useMemo, useState } from "react";
import {
    getIncomingCheques,
    clearChequeByReference,
    bounceChequeByReference,
    type IncomingCheque,
} from "../api/creditChequeApi";
import { useToast } from "../store/toastStore";

type Tab = "pending" | "cleared" | "bounced";

export default function CustomerCheques() {
    const { showToast } = useToast();

    const [tab, setTab] = useState<Tab>("pending");
    const [cheques, setCheques] = useState<IncomingCheque[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionRef, setActionRef] = useState<string | null>(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            setLoading(true);
            const data = await getIncomingCheques();
            setCheques(data);
        } catch {
            showToast("Failed to load cheques", "error");
        } finally {
            setLoading(false);
        }
    };

    // Group by Reference
    const grouped = useMemo(() => {
        const map = new Map<string, IncomingCheque[]>();
        cheques.forEach((c) => {
            const key = c.Reference || c.Id;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(c);
        });
        return Array.from(map.entries()).map(([reference, rows]) => ({
            reference,
            rows,
            total: rows.reduce((sum, r) => sum + r.Amount, 0),
            status: rows[0].Status,
            customerName: rows[0].CustomerName,
            customerPhone: rows[0].CustomerPhone,
            chequeDate: rows[0].ChequeDate,
            paidAt: rows[0].PaidAt,
            clearedAt: rows[0].ClearedAt,
        }));
    }, [cheques]);

    const filtered = grouped
        .filter((g) => g.status === tab)
        .filter((g) => {
            if (!search.trim()) return true;
            const q = search.toLowerCase();
            return (
                g.reference.toLowerCase().includes(q) ||
                g.customerName.toLowerCase().includes(q) ||
                g.rows.some((r) =>
                    (r.InvoiceNumber || "").toLowerCase().includes(q)
                )
            );
        });

    const totals = useMemo(() => {
        const pending = grouped.filter((g) => g.status === "pending");
        return {
            pendingTotal: pending.reduce((s, g) => s + g.total, 0),
            pendingCount: pending.length,
            clearedCount: grouped.filter((g) => g.status === "cleared").length,
            bouncedCount: grouped.filter((g) => g.status === "bounced").length,
        };
    }, [grouped]);

    const handleClear = async (reference: string) => {
        if (!confirm(`Clear cheque #${reference}?`)) return;
        try {
            setActionRef(reference);
            await clearChequeByReference(reference);
            showToast("Cheque cleared", "success");
            await load();
        } catch (err: any) {
            showToast(
                err?.response?.data?.message || "Failed to clear cheque",
                "error"
            );
        } finally {
            setActionRef(null);
        }
    };

    const handleBounce = async (reference: string) => {
        const reason = prompt("Reason for bounce (optional):");
        if (reason === null) return;
        if (!confirm(`Bounce cheque #${reference}? This will reverse the payment.`)) return;
        try {
            setActionRef(reference);
            await bounceChequeByReference(reference, reason || undefined);
            showToast("Cheque bounced — invoices reversed", "success");
            await load();
        } catch (err: any) {
            showToast(
                err?.response?.data?.message || "Failed to bounce cheque",
                "error"
            );
        } finally {
            setActionRef(null);
        }
    };

    if (loading) {
        return (
            <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className="h-24 rounded-2xl bg-black/5 animate-pulse"
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-[#14181C]">
                    Customer Cheques
                </h1>
                <p className="text-[13px] text-black/40 mt-0.5">
                    Incoming cheques from customers paying off credit
                </p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
                    <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                        Pending Value
                    </p>
                    <p className="text-2xl font-bold mt-1 text-amber-700 font-mono">
                        Rs {totals.pendingTotal.toLocaleString()}
                    </p>
                </div>
                <div className="bg-white border border-black/5 rounded-2xl p-4 shadow-sm">
                    <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                        Pending Cheques
                    </p>
                    <p className="text-2xl font-bold mt-1">
                        {totals.pendingCount}
                    </p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm">
                    <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                        Cleared
                    </p>
                    <p className="text-2xl font-bold mt-1 text-[#0B6E4F]">
                        {totals.clearedCount}
                    </p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 shadow-sm">
                    <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                        Bounced
                    </p>
                    <p className="text-2xl font-bold mt-1 text-red-600">
                        {totals.bouncedCount}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-white border border-black/5 rounded-xl p-1 w-fit shadow-sm">
                {(["pending", "cleared", "bounced"] as Tab[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium capitalize cursor-pointer transition ${tab === t
                                ? "bg-[#14181C] text-white"
                                : "text-black/50 hover:text-black/70"
                            }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30"
                >
                    <circle
                        cx="11"
                        cy="11"
                        r="7"
                        stroke="currentColor"
                        strokeWidth="1.8"
                    />
                    <path
                        d="M21 21l-4.35-4.35"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                    />
                </svg>
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search cheque #, customer, or invoice…"
                    className="w-full border border-black/10 bg-white rounded-xl p-3 pl-11 text-[14px] outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition shadow-sm"
                />
            </div>

            {/* List */}
            {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-black/5 py-14 text-center text-black/30 text-sm">
                    {search
                        ? "No cheques match your search"
                        : `No ${tab} cheques`}
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((group) => (
                        <div
                            key={group.reference}
                            className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <div
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0 ${group.status === "pending"
                                                ? "bg-amber-500"
                                                : group.status === "cleared"
                                                    ? "bg-[#0B6E4F]"
                                                    : "bg-red-600"
                                            }`}
                                    >
                                        #
                                    </div>
                                    <div>
                                        <p className="font-mono font-semibold text-[15px]">
                                            Cheque {group.reference}
                                        </p>
                                        <p className="text-[12px] text-black/50 mt-0.5">
                                            {group.customerName}
                                            {group.customerPhone &&
                                                ` • ${group.customerPhone}`}
                                        </p>
                                        <p className="text-[11px] text-black/40 mt-0.5">
                                            Cheque date:{" "}
                                            {group.chequeDate
                                                ? new Date(
                                                    group.chequeDate
                                                ).toLocaleDateString()
                                                : "—"}
                                            {group.clearedAt &&
                                                ` • Cleared: ${new Date(
                                                    group.clearedAt
                                                ).toLocaleDateString()}`}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                                    <div className="text-right">
                                        <p className="font-mono font-bold text-lg">
                                            Rs{" "}
                                            {group.total.toLocaleString()}
                                        </p>
                                        <p className="text-[11px] text-black/40">
                                            {group.rows.length} invoice
                                            {group.rows.length === 1 ? "" : "s"}
                                        </p>
                                    </div>

                                    {group.status === "pending" && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() =>
                                                    handleClear(group.reference)
                                                }
                                                disabled={
                                                    actionRef ===
                                                    group.reference
                                                }
                                                className="px-3 py-1.5 bg-[#0B6E4F] hover:bg-[#0A5F44] text-white rounded-lg text-[12px] font-medium cursor-pointer transition disabled:opacity-50"
                                            >
                                                {actionRef === group.reference
                                                    ? "…"
                                                    : "Clear"}
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleBounce(
                                                        group.reference
                                                    )
                                                }
                                                disabled={
                                                    actionRef ===
                                                    group.reference
                                                }
                                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[12px] font-medium cursor-pointer transition disabled:opacity-50"
                                            >
                                                Bounce
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Invoice rows */}
                            <div className="divide-y divide-black/5">
                                {group.rows.map((r) => (
                                    <div
                                        key={r.Id}
                                        className="flex justify-between items-center px-4 py-2.5 text-[13px]"
                                    >
                                        <span className="font-mono text-black/70">
                                            {r.InvoiceNumber}
                                        </span>
                                        <span className="font-mono font-medium">
                                            Rs {r.Amount.toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Note */}
                            {group.rows[0].Note && (
                                <div className="px-4 py-2 bg-gray-50 border-t border-black/5 text-[12px] text-black/50 italic">
                                    {group.rows[0].Note}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}