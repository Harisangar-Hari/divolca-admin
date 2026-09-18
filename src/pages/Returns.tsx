import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getReturns, type SaleReturn } from "../api/returnsApi";
import { useToast } from "../store/toastStore";

type Tab = "byReturn" | "byCustomer" | "byItem";

interface CustomerGroup {
    customerId: string;
    customerName: string;
    customerPhone: string | null;
    returnCount: number;
    totalRefund: number;
    totalItems: number;
    lastReturnAt: string;
}

interface ItemGroup {
    productId: string;
    productName: string;
    productBarcode: string | null;
    returnCount: number;
    totalQuantity: number;
    totalRefund: number;
    lastReturnAt: string;
}

export default function Returns() {
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [tab, setTab] = useState<Tab>("byReturn");
    const [returns, setReturns] = useState<SaleReturn[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [search, setSearch] = useState("");

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const load = async () => {
        try {
            setLoading(true);
            const data = await getReturns({
                startDate: startDate || undefined,
                endDate: endDate || undefined,
            });
            setReturns(data);
        } catch {
            showToast("Failed to load returns", "error");
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => load();

    const resetFilters = () => {
        setStartDate("");
        setEndDate("");
        setSearch("");
        load();
    };

    // =========================================
    // Client-side search filter (invoice / customer / product)
    // =========================================
    const filtered = useMemo(() => {
        if (!search.trim()) return returns;
        const q = search.toLowerCase();
        return returns.filter(
            (r) =>
                (r.InvoiceNumber || "").toLowerCase().includes(q) ||
                r.CustomerName.toLowerCase().includes(q) ||
                (r.CustomerPhone || "").includes(q) ||
                r.Items.some((it) =>
                    it.ProductName.toLowerCase().includes(q) ||
                    (it.ProductBarcode || "").includes(q)
                )
        );
    }, [returns, search]);

    // =========================================
    // Aggregations
    // =========================================
    const customerGroups = useMemo<CustomerGroup[]>(() => {
        const map = new Map<string, CustomerGroup>();
        filtered.forEach((r) => {
            const key = r.CustomerId || "__walkin__";
            const existing = map.get(key);
            const itemCount = r.Items.reduce((s, it) => s + it.Quantity, 0);

            if (existing) {
                existing.returnCount += 1;
                existing.totalRefund += r.ReturnAmount;
                existing.totalItems += itemCount;
                if (new Date(r.ReturnedAt) > new Date(existing.lastReturnAt)) {
                    existing.lastReturnAt = r.ReturnedAt;
                }
            } else {
                map.set(key, {
                    customerId: r.CustomerId || "",
                    customerName: r.CustomerName,
                    customerPhone: r.CustomerPhone,
                    returnCount: 1,
                    totalRefund: r.ReturnAmount,
                    totalItems: itemCount,
                    lastReturnAt: r.ReturnedAt,
                });
            }
        });
        return Array.from(map.values()).sort(
            (a, b) => b.totalRefund - a.totalRefund
        );
    }, [filtered]);

    const itemGroups = useMemo<ItemGroup[]>(() => {
        const map = new Map<string, ItemGroup>();
        filtered.forEach((r) => {
            r.Items.forEach((it) => {
                const existing = map.get(it.ProductId);
                if (existing) {
                    existing.returnCount += 1;
                    existing.totalQuantity += it.Quantity;
                    existing.totalRefund += it.LineTotal;
                    if (new Date(r.ReturnedAt) > new Date(existing.lastReturnAt)) {
                        existing.lastReturnAt = r.ReturnedAt;
                    }
                } else {
                    map.set(it.ProductId, {
                        productId: it.ProductId,
                        productName: it.ProductName,
                        productBarcode: it.ProductBarcode,
                        returnCount: 1,
                        totalQuantity: it.Quantity,
                        totalRefund: it.LineTotal,
                        lastReturnAt: r.ReturnedAt,
                    });
                }
            });
        });
        return Array.from(map.values()).sort(
            (a, b) => b.totalQuantity - a.totalQuantity
        );
    }, [filtered]);

    // =========================================
    // Summary cards
    // =========================================
    const summary = useMemo(() => {
        const totalRefund = filtered.reduce((s, r) => s + r.ReturnAmount, 0);
        const totalItems = filtered.reduce(
            (s, r) => s + r.Items.reduce((x, it) => x + it.Quantity, 0),
            0
        );
        return {
            returnCount: filtered.length,
            totalRefund,
            totalItems,
            uniqueCustomers: customerGroups.length,
            uniqueProducts: itemGroups.length,
        };
    }, [filtered, customerGroups, itemGroups]);

    if (loading) {
        return (
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
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
                <h1 className="text-2xl font-bold text-[#14181C]">Returns</h1>
                <p className="text-[13px] text-black/40 mt-0.5">
                    Track returned items, customers, and refund amounts
                </p>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white border border-black/5 rounded-2xl p-4 shadow-sm">
                    <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                        Total Returns
                    </p>
                    <p className="text-2xl font-bold mt-1 font-mono">
                        {summary.returnCount}
                    </p>
                </div>
                <div className="bg-white border border-black/5 rounded-2xl p-4 shadow-sm">
                    <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                        Items Returned
                    </p>
                    <p className="text-2xl font-bold mt-1 font-mono">
                        {summary.totalItems}
                    </p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 shadow-sm">
                    <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                        Total Refunded
                    </p>
                    <p className="text-2xl font-bold mt-1 font-mono text-red-600">
                        Rs {summary.totalRefund.toLocaleString()}
                    </p>
                </div>
                <div className="bg-white border border-black/5 rounded-2xl p-4 shadow-sm">
                    <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                        Customers Affected
                    </p>
                    <p className="text-2xl font-bold mt-1 font-mono">
                        {summary.uniqueCustomers}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-white border border-black/5 rounded-xl p-1 w-fit shadow-sm">
                {(
                    [
                        ["byReturn", "By Return"],
                        ["byCustomer", "By Customer"],
                        ["byItem", "By Item"],
                    ] as [Tab, string][]
                ).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition ${tab === key
                                ? "bg-[#14181C] text-white"
                                : "text-black/50 hover:text-black/70"
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white border border-black/5 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                        <label className="text-[11px] font-semibold text-black/50 uppercase tracking-widest block mb-1">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full border border-black/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                        />
                    </div>
                    <div>
                        <label className="text-[11px] font-semibold text-black/50 uppercase tracking-widest block mb-1">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full border border-black/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-[11px] font-semibold text-black/50 uppercase tracking-widest block mb-1">
                            Search
                        </label>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Invoice, customer, product, barcode…"
                            className="w-full border border-black/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                        />
                    </div>
                </div>
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={resetFilters}
                        className="px-4 py-2 bg-[#F3F6F4] hover:bg-[#E7ECE9] text-black/70 rounded-xl font-medium text-[13px] transition"
                    >
                        Reset
                    </button>
                    <button
                        onClick={applyFilters}
                        className="px-4 py-2 bg-[#0B6E4F] hover:bg-[#0A5F44] text-white rounded-xl font-medium text-[13px] transition"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>

            {/* ============================================ */}
            {/* TAB: BY RETURN */}
            {/* ============================================ */}
            {tab === "byReturn" && (
                <div className="space-y-3">
                    {filtered.length === 0 ? (
                        <EmptyState message="No returns found" />
                    ) : (
                        filtered.map((r) => (
                            <div
                                key={r.Id}
                                className="bg-white border border-black/5 rounded-2xl shadow-sm overflow-hidden"
                            >
                                {/* Header */}
                                <div className="p-4 border-b border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 font-bold shrink-0">
                                            ↩
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <button
                                                    onClick={() =>
                                                        navigate(
                                                            `/sales/${r.SaleId}`
                                                        )
                                                    }
                                                    className="font-mono font-semibold text-[14px] text-[#4338CA] hover:underline cursor-pointer"
                                                >
                                                    {r.InvoiceNumber || "—"}
                                                </button>
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium uppercase tracking-wider">
                                                    Return
                                                </span>
                                            </div>
                                            <p className="text-[12px] text-black/50 mt-0.5">
                                                {r.CustomerName}
                                                {r.CustomerPhone &&
                                                    ` • ${r.CustomerPhone}`}
                                            </p>
                                            <p className="text-[11px] text-black/40 mt-0.5">
                                                {new Date(
                                                    r.ReturnedAt
                                                ).toLocaleString("en-GB", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <p className="font-mono font-bold text-lg text-red-600">
                                            -Rs{" "}
                                            {r.ReturnAmount.toLocaleString()}
                                        </p>
                                        <p className="text-[11px] text-black/40">
                                            {r.Items.length} product
                                            {r.Items.length === 1 ? "" : "s"}
                                        </p>
                                    </div>
                                </div>

                                {/* Reason */}
                                {r.Reason && (
                                    <div className="px-4 py-2 bg-amber-50/50 border-b border-black/5 text-[12px] text-amber-800">
                                        <span className="font-semibold">
                                            Reason:
                                        </span>{" "}
                                        {r.Reason}
                                    </div>
                                )}

                                {/* Items */}
                                <div className="divide-y divide-black/5">
                                    {r.Items.map((it, idx) => (
                                        <div
                                            key={`${r.Id}-${it.ProductId}-${idx}`}
                                            className="flex justify-between items-center px-4 py-2.5 text-[13px]"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium truncate">
                                                    {it.ProductName}
                                                </p>
                                                {it.ProductBarcode && (
                                                    <p className="text-[11px] text-black/40 font-mono">
                                                        #{it.ProductBarcode}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="font-mono">
                                                    {it.Quantity} × Rs{" "}
                                                    {it.UnitPrice.toLocaleString()}
                                                </p>
                                                <p className="text-[11px] font-mono text-red-600">
                                                    -Rs{" "}
                                                    {it.LineTotal.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ============================================ */}
            {/* TAB: BY CUSTOMER */}
            {/* ============================================ */}
            {tab === "byCustomer" && (
                <div className="bg-white border border-black/5 rounded-2xl shadow-sm overflow-hidden">
                    {customerGroups.length === 0 ? (
                        <EmptyState message="No customer returns found" />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-[13px]">
                                <thead className="bg-gray-50 border-b border-black/5">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-[11px] uppercase tracking-widest text-black/40">
                                            Customer
                                        </th>
                                        <th className="px-4 py-3 text-center font-semibold text-[11px] uppercase tracking-widest text-black/40">
                                            Returns
                                        </th>
                                        <th className="px-4 py-3 text-center font-semibold text-[11px] uppercase tracking-widest text-black/40">
                                            Items
                                        </th>
                                        <th className="px-4 py-3 text-right font-semibold text-[11px] uppercase tracking-widest text-black/40">
                                            Refunded
                                        </th>
                                        <th className="px-4 py-3 text-right font-semibold text-[11px] uppercase tracking-widest text-black/40">
                                            Last Return
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customerGroups.map((c) => (
                                        <tr
                                            key={c.customerId || "walkin"}
                                            className="border-b border-black/5 last:border-0 hover:bg-[#FAFAF8] transition"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[#F3F6F4] flex items-center justify-center text-[#4338CA] font-semibold text-xs shrink-0">
                                                        {c.customerName
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-[13px]">
                                                            {c.customerName}
                                                        </p>
                                                        {c.customerPhone && (
                                                            <p className="text-[11px] font-mono text-black/40">
                                                                {c.customerPhone}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center font-mono">
                                                {c.returnCount}
                                            </td>
                                            <td className="px-4 py-3 text-center font-mono">
                                                {c.totalItems}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-semibold text-red-600">
                                                Rs{" "}
                                                {c.totalRefund.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-right text-[12px] text-black/50">
                                                {new Date(
                                                    c.lastReturnAt
                                                ).toLocaleDateString("en-GB", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ============================================ */}
            {/* TAB: BY ITEM */}
            {/* ============================================ */}
            {tab === "byItem" && (
                <div className="bg-white border border-black/5 rounded-2xl shadow-sm overflow-hidden">
                    {itemGroups.length === 0 ? (
                        <EmptyState message="No product returns found" />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-[13px]">
                                <thead className="bg-gray-50 border-b border-black/5">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-[11px] uppercase tracking-widest text-black/40">
                                            Product
                                        </th>
                                        <th className="px-4 py-3 text-center font-semibold text-[11px] uppercase tracking-widest text-black/40">
                                            Times Returned
                                        </th>
                                        <th className="px-4 py-3 text-center font-semibold text-[11px] uppercase tracking-widest text-black/40">
                                            Total Qty
                                        </th>
                                        <th className="px-4 py-3 text-right font-semibold text-[11px] uppercase tracking-widest text-black/40">
                                            Total Refund
                                        </th>
                                        <th className="px-4 py-3 text-right font-semibold text-[11px] uppercase tracking-widest text-black/40">
                                            Last Return
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {itemGroups.map((it) => (
                                        <tr
                                            key={it.productId}
                                            className="border-b border-black/5 last:border-0 hover:bg-[#FAFAF8] transition"
                                        >
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-[13px]">
                                                    {it.productName}
                                                </p>
                                                {it.productBarcode && (
                                                    <p className="text-[11px] font-mono text-black/40">
                                                        #{it.productBarcode}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center font-mono">
                                                {it.returnCount}
                                            </td>
                                            <td className="px-4 py-3 text-center font-mono font-semibold">
                                                {it.totalQuantity}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-semibold text-red-600">
                                                Rs{" "}
                                                {it.totalRefund.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-right text-[12px] text-black/50">
                                                {new Date(
                                                    it.lastReturnAt
                                                ).toLocaleDateString("en-GB", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ============================================
// EMPTY STATE
// ============================================
function EmptyState({ message }: { message: string }) {
    return (
        <div className="bg-white border border-black/5 rounded-2xl py-14 text-center text-black/30 text-sm">
            {message}
        </div>
    );
}