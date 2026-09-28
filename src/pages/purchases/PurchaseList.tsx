import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPurchases } from "../../api/purchaseApi";

interface Purchase {
    id: string;
    invoiceNumber: string;
    purchaseNumber?: string;
    supplierName?: string;
    supplier?: {
        id?: string;
        name: string;
        phone?: string;
    };
    grandTotal: number;
    paidAmount?: number;
    balanceAmount?: number;
    purchaseDate: string;
    itemsCount: number;
    status?: number;
}

type StatusFilter = "all" | "pending" | "completed" | "cancelled";

const STATUS_LABELS: Record<number, { label: string; color: string }> = {
    0: { label: "Pending", color: "bg-amber-100 text-amber-800" },
    1: { label: "Partial", color: "bg-blue-100 text-blue-800" },
    2: { label: "Completed", color: "bg-emerald-100 text-emerald-800" },
    3: { label: "Cancelled", color: "bg-gray-100 text-gray-600" },
};

export default function PurchaseList() {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // ---------- Filters ----------
    const [search, setSearch] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [supplierFilter, setSupplierFilter] = useState("all");

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            setLoading(true);
            const res = await getPurchases();
            setPurchases(res || []);
        } catch (err) {
            console.error("Failed to load purchases", err);
        } finally {
            setLoading(false);
        }
    };

    // ---------- Supplier list for filter dropdown ----------
    const suppliers = useMemo(() => {
        const map = new Map<string, string>();
        purchases.forEach((p) => {
            if (p.supplier?.id && p.supplier?.name) {
                map.set(p.supplier.id, p.supplier.name);
            }
        });
        return Array.from(map.entries())
            .map(([id, name]) => ({ id, name }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [purchases]);

    // ---------- Filtering ----------
    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();

        return purchases.filter((p) => {
            // Search
            const matchesSearch =
                !q ||
                (p.invoiceNumber || "").toLowerCase().includes(q) ||
                (p.purchaseNumber || "").toLowerCase().includes(q) ||
                (p.supplier?.name || p.supplierName || "")
                    .toLowerCase()
                    .includes(q) ||
                (p.supplier?.phone || "").includes(q);

            // Date range
            const purchaseDate = new Date(p.purchaseDate);
            const matchesStart = startDate
                ? purchaseDate >= new Date(startDate + "T00:00:00")
                : true;
            const matchesEnd = endDate
                ? purchaseDate <= new Date(endDate + "T23:59:59")
                : true;

            // Status
            const matchesStatus =
                statusFilter === "all"
                    ? true
                    : statusFilter === "pending"
                        ? p.status === 0 || p.status === 1
                        : statusFilter === "completed"
                            ? p.status === 2
                            : statusFilter === "cancelled"
                                ? p.status === 3
                                : true;

            // Supplier
            const matchesSupplier =
                supplierFilter === "all" ||
                p.supplier?.id === supplierFilter;

            return (
                matchesSearch &&
                matchesStart &&
                matchesEnd &&
                matchesStatus &&
                matchesSupplier
            );
        });
    }, [
        purchases,
        search,
        startDate,
        endDate,
        statusFilter,
        supplierFilter,
    ]);

    // ---------- Totals (from filtered set) ----------
    const totals = useMemo(() => {
        return filtered.reduce(
            (acc, p) => {
                acc.grand += Number(p.grandTotal || 0);
                acc.paid += Number(p.paidAmount || 0);
                acc.balance += Number(p.balanceAmount || 0);
                acc.items += Number(p.itemsCount || 0);
                return acc;
            },
            { grand: 0, paid: 0, balance: 0, items: 0 }
        );
    }, [filtered]);

    const resetFilters = () => {
        setSearch("");
        setStartDate("");
        setEndDate("");
        setStatusFilter("all");
        setSupplierFilter("all");
    };

    const hasActiveFilters =
        search ||
        startDate ||
        endDate ||
        statusFilter !== "all" ||
        supplierFilter !== "all";

    if (loading) {
        return (
            <div className="min-h-screen bg-[#EEF1EF] p-4 md:p-6 space-y-3">
                <div className="h-10 w-64 rounded-xl bg-black/5 animate-pulse" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className="h-20 rounded-2xl bg-black/5 animate-pulse"
                        />
                    ))}
                </div>
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className="h-16 rounded-2xl bg-black/5 animate-pulse"
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#EEF1EF] p-4 md:p-6 font-sans text-[#14181C]">
            <div className="max-w-5xl mx-auto space-y-5">
                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold">
                            Purchase Invoices
                        </h1>
                        <p className="text-[13px] text-black/40 mt-0.5">
                            {filtered.length} of {purchases.length} invoices
                            {hasActiveFilters && " (filtered)"}
                        </p>
                    </div>

                    {hasActiveFilters && (
                        <button
                            onClick={resetFilters}
                            className="text-[13px] font-medium text-[#4338CA] hover:underline cursor-pointer"
                        >
                            Clear all filters
                        </button>
                    )}
                </div>

                {/* SUMMARY CARDS */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white border border-black/5 rounded-2xl p-4 shadow-sm">
                        <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                            Invoices
                        </p>
                        <p className="text-2xl font-bold mt-1 font-mono">
                            {filtered.length}
                        </p>
                        <p className="text-[11px] text-black/40 mt-0.5">
                            {totals.items} items total
                        </p>
                    </div>

                    <div className="bg-[#12171A] rounded-2xl p-4 shadow-sm">
                        <p className="text-[11px] font-semibold tracking-widest text-white/40 uppercase">
                            Total Value
                        </p>
                        <p className="text-xl md:text-2xl font-bold mt-1 font-mono text-[#4ADE9A]">
                            Rs {totals.grand.toLocaleString()}
                        </p>
                    </div>

                    <div className="bg-white border border-black/5 rounded-2xl p-4 shadow-sm">
                        <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                            Total Paid
                        </p>
                        <p className="text-xl md:text-2xl font-bold mt-1 font-mono text-emerald-600">
                            Rs {totals.paid.toLocaleString()}
                        </p>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 shadow-sm">
                        <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                            Outstanding
                        </p>
                        <p className="text-xl md:text-2xl font-bold mt-1 font-mono text-red-600">
                            Rs {totals.balance.toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* FILTERS */}
                <div className="bg-white border border-black/5 rounded-2xl p-4 shadow-sm space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        {/* Search */}
                        <div className="md:col-span-2">
                            <label className="text-[11px] font-semibold text-black/50 uppercase tracking-widest block mb-1">
                                Search
                            </label>
                            <div className="relative">
                                <svg
                                    width="15"
                                    height="15"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30"
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
                                    type="text"
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(e.target.value)
                                    }
                                    placeholder="Invoice, purchase #, supplier name/phone…"
                                    className="w-full border border-black/10 bg-white rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                                />
                            </div>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="text-[11px] font-semibold text-black/50 uppercase tracking-widest block mb-1">
                                Status
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(
                                        e.target.value as StatusFilter
                                    )
                                }
                                className="w-full border border-black/10 bg-white rounded-xl px-3 py-2 text-sm cursor-pointer outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                            >
                                <option value="all">All</option>
                                <option value="pending">
                                    Pending / Partial
                                </option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        {/* Supplier */}
                        <div>
                            <label className="text-[11px] font-semibold text-black/50 uppercase tracking-widest block mb-1">
                                Supplier
                            </label>
                            <select
                                value={supplierFilter}
                                onChange={(e) =>
                                    setSupplierFilter(e.target.value)
                                }
                                className="w-full border border-black/10 bg-white rounded-xl px-3 py-2 text-sm cursor-pointer outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                            >
                                <option value="all">All Suppliers</option>
                                {suppliers.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Date range */}
                        <div className="md:col-span-2">
                            <label className="text-[11px] font-semibold text-black/50 uppercase tracking-widest block mb-1">
                                Date Range
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) =>
                                        setStartDate(e.target.value)
                                    }
                                    className="flex-1 border border-black/10 bg-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                                />
                                <span className="text-black/30 text-sm">→</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) =>
                                        setEndDate(e.target.value)
                                    }
                                    className="flex-1 border border-black/10 bg-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                                />
                            </div>
                        </div>

                        {/* Quick date buttons */}
                        <div className="md:col-span-2 flex items-end gap-2">
                            <button
                                onClick={() => {
                                    const today = new Date();
                                    const start = new Date(today);
                                    start.setDate(today.getDate() - 7);
                                    setStartDate(
                                        start.toISOString().split("T")[0]
                                    );
                                    setEndDate(
                                        today.toISOString().split("T")[0]
                                    );
                                }}
                                className="flex-1 px-3 py-2 text-[12px] font-medium bg-[#F3F6F4] hover:bg-[#E7ECE9] text-black/70 rounded-xl transition"
                            >
                                Last 7 days
                            </button>
                            <button
                                onClick={() => {
                                    const today = new Date();
                                    const start = new Date(
                                        today.getFullYear(),
                                        today.getMonth(),
                                        1
                                    );
                                    setStartDate(
                                        start.toISOString().split("T")[0]
                                    );
                                    setEndDate(
                                        today.toISOString().split("T")[0]
                                    );
                                }}
                                className="flex-1 px-3 py-2 text-[12px] font-medium bg-[#F3F6F4] hover:bg-[#E7ECE9] text-black/70 rounded-xl transition"
                            >
                                This month
                            </button>
                            <button
                                onClick={resetFilters}
                                className="flex-1 px-3 py-2 text-[12px] font-medium bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                {/* LIST */}
                <div className="space-y-3">
                    {filtered.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-black/5 py-14 text-center text-black/30 text-sm">
                            {purchases.length === 0
                                ? "No purchase invoices yet"
                                : "No invoices match your filters"}
                        </div>
                    ) : (
                        filtered.map((p) => {
                            const status =
                                STATUS_LABELS[p.status ?? 0] ||
                                STATUS_LABELS[0];

                            return (
                                <div
                                    key={p.id}
                                    onClick={() =>
                                        navigate(`/purchases/${p.id}`)
                                    }
                                    className="bg-white rounded-2xl shadow-sm border border-black/5 p-4 cursor-pointer hover:border-[#0B6E4F]/40 hover:bg-[#FAFAF8] transition"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                        {/* Left — invoice + supplier */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-mono font-semibold text-[14px]">
                                                    {p.purchaseNumber ||
                                                        p.invoiceNumber}
                                                </p>
                                                <span
                                                    className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${status.color}`}
                                                >
                                                    {status.label}
                                                </span>
                                            </div>

                                            <p className="text-[13px] text-black/60 mt-1 truncate">
                                                {p.supplier?.name ||
                                                    p.supplierName ||
                                                    "Unknown supplier"}
                                            </p>

                                            <p className="text-[12px] text-black/40 mt-0.5">
                                                {new Date(
                                                    p.purchaseDate
                                                ).toLocaleDateString("en-GB", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                                {p.supplier?.phone && (
                                                    <span className="ml-2 font-mono">
                                                        • {p.supplier.phone}
                                                    </span>
                                                )}
                                            </p>
                                        </div>

                                        {/* Right — amounts */}
                                        <div className="text-right shrink-0 grid grid-cols-3 gap-4 md:gap-6">
                                            <div>
                                                <p className="text-[10px] text-black/40 uppercase tracking-wider font-semibold">
                                                    Total
                                                </p>
                                                <p className="font-mono font-semibold text-[14px] text-black">
                                                    Rs{" "}
                                                    {Number(
                                                        p.grandTotal || 0
                                                    ).toLocaleString()}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-[10px] text-black/40 uppercase tracking-wider font-semibold">
                                                    Paid
                                                </p>
                                                <p className="font-mono font-semibold text-[14px] text-emerald-600">
                                                    Rs{" "}
                                                    {Number(
                                                        p.paidAmount || 0
                                                    ).toLocaleString()}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-[10px] text-black/40 uppercase tracking-wider font-semibold">
                                                    Balance
                                                </p>
                                                <p
                                                    className={`font-mono font-semibold text-[14px] ${Number(
                                                        p.balanceAmount ||
                                                        0
                                                    ) > 0
                                                            ? "text-red-600"
                                                            : "text-black/30"
                                                        }`}
                                                >
                                                    Rs{" "}
                                                    {Number(
                                                        p.balanceAmount || 0
                                                    ).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}