import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../store/toastStore";
import {
    getCustomerAging,
    getOutstandingInvoices,
    type AgingCustomer,
    type OutstandingInvoice,
} from "../../api/reportsApi";

type Tab = "summary" | "details";

const CUSTOMER_TYPES = [
    "ALL",
    "RETAIL",
    "WHOLESALE",
    "CORPORATE",
    "VIP",
    "GOVERNMENT",
    "EDUCATIONAL",
];

const BUCKETS = ["ALL", "0-30", "31-60", "61-90", "91-120", "121-150", ">=151"];

export default function CustomerReport() {
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [tab, setTab] = useState<Tab>("summary");
    const [loading, setLoading] = useState(true);

    // ---------------- Summary state ----------------
    const [customers, setCustomers] = useState<AgingCustomer[]>([]);
    const [summaryTotals, setSummaryTotals] = useState({
        days0to30: 0,
        days31to60: 0,
        days61to90: 0,
        days91to120: 0,
        days121to150: 0,
        days151plus: 0,
        TotalOutstanding: 0,
    });

    // ---------------- Details state ----------------
    const [invoices, setInvoices] = useState<OutstandingInvoice[]>([]);
    const [invoiceTotals, setInvoiceTotals] = useState({
        TotalAmount: 0,
        PaidAmount: 0,
        BalanceAmount: 0,
    });

    console.log("CustomerReport render", { customers, invoices, summaryTotals, invoiceTotals });
    // ---------------- Filters ----------------
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [bucketFilter, setBucketFilter] = useState("ALL");

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const load = async () => {
        try {
            setLoading(true);
            const [aging, outstanding] = await Promise.all([
                getCustomerAging(),
                getOutstandingInvoices(),
            ]);
            setCustomers(aging.customers);
            setSummaryTotals(aging.totals);
            setInvoices(outstanding.rows);
            setInvoiceTotals(outstanding.totals);
        } catch {
            showToast("Failed to load customer report", "error");
        } finally {
            setLoading(false);
        }
    };

    // ---------------- Summary derived ----------------
    const filteredCustomers = useMemo(() => {
        const q = search.toLowerCase().trim();
        return customers.filter((c) => {
            const matchesType =
                typeFilter === "ALL" || c.CustomerType === typeFilter;
            const matchesSearch =
                !q ||
                c.CustomerName.toLowerCase().includes(q) ||
                c.CustomerPhone.includes(q) ||
                (c.CustomerEmail || "").toLowerCase().includes(q);
            return matchesType && matchesSearch;
        });
    }, [customers, search, typeFilter]);

    const filteredSummaryTotals = useMemo(() => {
        const t = {
            days0to30: 0,
            days31to60: 0,
            days61to90: 0,
            days91to120: 0,
            days121to150: 0,
            days151plus: 0,
            TotalOutstanding: 0,
        };
        filteredCustomers.forEach((c) => {
            t.days0to30 += c.days0to30;
            t.days31to60 += c.days31to60;
            t.days61to90 += c.days61to90;
            t.days91to120 += c.days91to120;
            t.days121to150 += c.days121to150;
            t.days151plus += c.days151plus;
            t.TotalOutstanding += c.TotalOutstanding;
        });
        return t;
    }, [filteredCustomers]);

    // ---------------- Details derived ----------------
    const filteredInvoices = useMemo(() => {
        const q = search.toLowerCase().trim();
        const filtered = invoices.filter((inv) => {
            const matchesSearch =
                !q ||
                inv.InvoiceNumber.toLowerCase().includes(q) ||
                inv.CustomerName.toLowerCase().includes(q) ||
                inv.CustomerPhone.includes(q);
            const matchesBucket =
                bucketFilter === "ALL" || inv.Bucket === bucketFilter;
            return matchesSearch && matchesBucket;
        });

        // ✅ Group by customer → then invoice date ascending within each customer
        return filtered.sort((a, b) => {
            const nameCompare = a.CustomerName.localeCompare(b.CustomerName);
            if (nameCompare !== 0) return nameCompare;
            // Within the same customer, oldest invoice first
            return (
                new Date(a.InvoiceDate).getTime() -
                new Date(b.InvoiceDate).getTime()
            );
        });
    }, [invoices, search, bucketFilter]);

    const filteredInvoiceTotals = useMemo(() => {
        const t = { TotalAmount: 0, PaidAmount: 0, BalanceAmount: 0 };
        filteredInvoices.forEach((r) => {
            t.TotalAmount += r.TotalAmount;
            t.PaidAmount += r.PaidAmount;
            t.BalanceAmount += r.BalanceAmount;
        });
        return t;
    }, [filteredInvoices]);

    // ---------------- Excel exports ----------------
    const exportSummary = () => {
        try {
            const rows = filteredCustomers.map((c) => ({
                Customer: c.CustomerName,
                Phone: c.CustomerPhone,
                Type: c.CustomerType,
                "0-30": c.days0to30,
                "31-60": c.days31to60,
                "61-90": c.days61to90,
                "91-120": c.days91to120,
                "121-150": c.days121to150,
                ">=151": c.days151plus,
                Total: c.TotalOutstanding,
                Invoices: c.InvoiceCount,
            }));

            rows.push({
                Customer: "TOTAL",
                Phone: "",
                Type: "",
                "0-30": filteredSummaryTotals.days0to30,
                "31-60": filteredSummaryTotals.days31to60,
                "61-90": filteredSummaryTotals.days61to90,
                "91-120": filteredSummaryTotals.days91to120,
                "121-150": filteredSummaryTotals.days121to150,
                ">=151": filteredSummaryTotals.days151plus,
                Total: filteredSummaryTotals.TotalOutstanding,
                Invoices: 0,
            });

            const ws = XLSX.utils.json_to_sheet(rows);
            ws["!cols"] = [
                { wch: 28 }, { wch: 15 }, { wch: 15 },
                { wch: 12 }, { wch: 12 }, { wch: 12 },
                { wch: 12 }, { wch: 12 }, { wch: 12 },
                { wch: 14 }, { wch: 10 },
            ];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Aging Summary");

            XLSX.writeFile(
                wb,
                `Customer_Aging_Summary_${new Date().toISOString().split("T")[0]}.xlsx`
            );
            showToast("Exported successfully!", "success");
        } catch {
            showToast("Failed to export", "error");
        }
    };

    const exportDetails = () => {
        try {
            const rows = filteredInvoices.map((r) => ({
                Customer: r.CustomerName,
                Phone: r.CustomerPhone,
                Date: new Date(r.InvoiceDate).toLocaleDateString("en-GB"),
                Type: r.PaymentMode.toUpperCase(),
                "Invoice No": r.InvoiceNumber,
                Amount: r.TotalAmount,
                "Pending Amount": r.BalanceAmount,
                Days: r.AgeDays,
                Bucket: r.Bucket,
            }));

            rows.push({
                Customer: "TOTAL",
                Phone: "",
                Date: "",
                Type: "",
                "Invoice No": `${filteredInvoices.length} invoices`,
                Amount: filteredInvoiceTotals.TotalAmount,
                "Pending Amount": filteredInvoiceTotals.BalanceAmount,
                Days: 0,
                Bucket: "",
            });

            const ws = XLSX.utils.json_to_sheet(rows);
            ws["!cols"] = [
                { wch: 28 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
                { wch: 20 }, { wch: 14 }, { wch: 16 }, { wch: 8 }, { wch: 10 },
            ];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Outstanding Invoices");

            XLSX.writeFile(
                wb,
                `Outstanding_Invoices_${new Date().toISOString().split("T")[0]}.xlsx`
            );
            showToast("Exported successfully!", "success");
        } catch {
            showToast("Failed to export", "error");
        }
    };

    const fmt = (n: number) =>
        n === 0
            ? "—"
            : n.toLocaleString(undefined, { maximumFractionDigits: 2 });

    const daysColor = (days: number) => {
        if (days <= 30) return "text-emerald-700 font-medium";
        if (days <= 60) return "text-lime-700 font-medium";
        if (days <= 90) return "text-amber-700 font-medium";
        if (days <= 120) return "text-orange-700 font-semibold";
        if (days <= 150) return "text-red-700 font-semibold";
        return "text-red-900 font-bold";
    };

    if (loading) {
        return (
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className="h-12 rounded-xl bg-black/5 animate-pulse"
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* ============ SUMMARY CARDS ============ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white border border-black/5 rounded-2xl p-4 shadow-sm">
                    <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                        {tab === "summary" ? "Customers" : "Invoices"}
                    </p>
                    <p className="text-2xl font-bold mt-1 font-mono">
                        {tab === "summary"
                            ? filteredCustomers.length
                            : filteredInvoices.length}
                    </p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 shadow-sm">
                    <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                        Total Outstanding
                    </p>
                    <p className="text-2xl font-bold mt-1 font-mono text-red-600">
                        Rs{" "}
                        {(tab === "summary"
                            ? filteredSummaryTotals.TotalOutstanding
                            : filteredInvoiceTotals.BalanceAmount
                        ).toLocaleString()}
                    </p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
                    <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                        Over 90 Days
                    </p>
                    <p className="text-2xl font-bold mt-1 font-mono text-amber-700">
                        Rs{" "}
                        {tab === "summary"
                            ? (
                                filteredSummaryTotals.days91to120 +
                                filteredSummaryTotals.days121to150 +
                                filteredSummaryTotals.days151plus
                            ).toLocaleString()
                            : filteredInvoices
                                .filter((i) => i.AgeDays > 90)
                                .reduce((s, i) => s + i.BalanceAmount, 0)
                                .toLocaleString()}
                    </p>
                </div>
                <div className="bg-[#12171A] rounded-2xl p-4 shadow-sm">
                    <p className="text-[11px] font-semibold tracking-widest text-white/40 uppercase">
                        Critical (≥151)
                    </p>
                    <p className="text-2xl font-bold mt-1 font-mono text-[#F87171]">
                        Rs{" "}
                        {tab === "summary"
                            ? filteredSummaryTotals.days151plus.toLocaleString()
                            : filteredInvoices
                                .filter((i) => i.AgeDays > 150)
                                .reduce((s, i) => s + i.BalanceAmount, 0)
                                .toLocaleString()}
                    </p>
                </div>
            </div>

            {/* ============ TABS ============ */}
            <div className="flex bg-white border border-black/5 rounded-xl p-1 w-fit shadow-sm">
                <button
                    onClick={() => setTab("summary")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition ${tab === "summary"
                        ? "bg-[#14181C] text-white"
                        : "text-black/50 hover:text-black/70"
                        }`}
                >
                    Summary (Aging)
                </button>
                <button
                    onClick={() => setTab("details")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition ${tab === "details"
                        ? "bg-[#14181C] text-white"
                        : "text-black/50 hover:text-black/70"
                        }`}
                >
                    Details (By Invoice)
                </button>
            </div>

            {/* ============ FILTERS ============ */}
            <div className="bg-white border border-black/5 rounded-2xl p-4 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className={tab === "summary" ? "md:col-span-2" : ""}>
                        <label className="text-[11px] font-semibold text-black/50 uppercase tracking-widest block mb-1">
                            Search
                        </label>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Customer, phone, invoice #…"
                            className="w-full border border-black/10 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                        />
                    </div>

                    {tab === "summary" ? (
                        <div>
                            <label className="text-[11px] font-semibold text-black/50 uppercase tracking-widest block mb-1">
                                Customer Type
                            </label>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="w-full border border-black/10 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                            >
                                {CUSTOMER_TYPES.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="text-[11px] font-semibold text-black/50 uppercase tracking-widest block mb-1">
                                    Aging Bucket
                                </label>
                                <select
                                    value={bucketFilter}
                                    onChange={(e) =>
                                        setBucketFilter(e.target.value)
                                    }
                                    className="w-full border border-black/10 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                                >
                                    {BUCKETS.map((b) => (
                                        <option key={b} value={b}>
                                            {b}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={() => {
                                        setSearch("");
                                        setBucketFilter("ALL");
                                    }}
                                    className="w-full px-4 py-2 bg-[#F3F6F4] hover:bg-[#E7ECE9] text-black/70 rounded-xl font-medium text-[13px] transition"
                                >
                                    Reset
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex gap-2 justify-end mt-3">
                    {tab === "summary" && (
                        <button
                            onClick={() => {
                                setSearch("");
                                setTypeFilter("ALL");
                            }}
                            className="px-4 py-2 bg-[#F3F6F4] hover:bg-[#E7ECE9] text-black/70 rounded-xl font-medium text-[13px] transition"
                        >
                            Reset
                        </button>
                    )}
                    <button
                        onClick={tab === "summary" ? exportSummary : exportDetails}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium text-[13px] transition shadow-sm flex items-center gap-2"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        Export Excel
                    </button>
                </div>
            </div>

            {/* ============ TAB 1: SUMMARY AGING ============ */}
            {tab === "summary" && (
                <div className="bg-white border border-black/5 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px] min-w-[900px]">
                            <thead className="bg-gray-50 border-b border-black/5">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-[11px] uppercase tracking-widest text-black/40">
                                        Customer
                                    </th>
                                    <th className="px-3 py-3 text-right font-semibold text-[11px] uppercase tracking-widest text-emerald-700">
                                        0–30
                                    </th>
                                    <th className="px-3 py-3 text-right font-semibold text-[11px] uppercase tracking-widest text-lime-700">
                                        31–60
                                    </th>
                                    <th className="px-3 py-3 text-right font-semibold text-[11px] uppercase tracking-widest text-amber-700">
                                        61–90
                                    </th>
                                    <th className="px-3 py-3 text-right font-semibold text-[11px] uppercase tracking-widest text-orange-700">
                                        91–120
                                    </th>
                                    <th className="px-3 py-3 text-right font-semibold text-[11px] uppercase tracking-widest text-red-700">
                                        121–150
                                    </th>
                                    <th className="px-3 py-3 text-right font-semibold text-[11px] uppercase tracking-widest text-red-900">
                                        ≥151
                                    </th>
                                    <th className="px-4 py-3 text-right font-semibold text-[11px] uppercase tracking-widest text-black/60 border-l border-black/5">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCustomers.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-4 py-10 text-center text-black/30"
                                        >
                                            No customers with outstanding balances
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCustomers.map((c) => (
                                        <tr
                                            key={c.CustomerId}
                                            onClick={() =>
                                                navigate(
                                                    `/credit-customers/${c.CustomerId}`
                                                )
                                            }
                                            className={`border-b border-black/5 cursor-pointer hover:bg-[#FAFAF8] transition ${c.days151plus > 0
                                                ? "bg-red-50/30"
                                                : ""
                                                }`}
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[#F3F6F4] flex items-center justify-center text-[#4338CA] font-semibold text-xs shrink-0">
                                                        {c.CustomerName
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-[13px] truncate">
                                                            {c.CustomerName}
                                                        </p>
                                                        <p className="text-[11px] font-mono text-black/40">
                                                            {c.CustomerPhone}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={`px-3 py-3 text-right font-mono ${c.days0to30 > 0 ? "text-emerald-700 font-semibold" : "text-black/20"}`}>
                                                {fmt(c.days0to30)}
                                            </td>
                                            <td className={`px-3 py-3 text-right font-mono ${c.days31to60 > 0 ? "text-lime-700 font-semibold" : "text-black/20"}`}>
                                                {fmt(c.days31to60)}
                                            </td>
                                            <td className={`px-3 py-3 text-right font-mono ${c.days61to90 > 0 ? "text-amber-700 font-semibold" : "text-black/20"}`}>
                                                {fmt(c.days61to90)}
                                            </td>
                                            <td className={`px-3 py-3 text-right font-mono ${c.days91to120 > 0 ? "text-orange-700 font-semibold" : "text-black/20"}`}>
                                                {fmt(c.days91to120)}
                                            </td>
                                            <td className={`px-3 py-3 text-right font-mono ${c.days121to150 > 0 ? "text-red-700 font-semibold" : "text-black/20"}`}>
                                                {fmt(c.days121to150)}
                                            </td>
                                            <td className={`px-3 py-3 text-right font-mono ${c.days151plus > 0 ? "text-red-900 font-bold" : "text-black/20"}`}>
                                                {fmt(c.days151plus)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-bold text-black border-l border-black/5">
                                                Rs {c.TotalOutstanding.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {filteredCustomers.length > 0 && (
                                <tfoot className="bg-gray-100 border-t-2 border-black/10">
                                    <tr>
                                        <td className="px-4 py-3 font-bold text-[12px] uppercase tracking-wider text-black/60">
                                            Grand Total
                                        </td>
                                        <td className="px-3 py-3 text-right font-mono font-bold text-emerald-800">
                                            {filteredSummaryTotals.days0to30.toLocaleString()}
                                        </td>
                                        <td className="px-3 py-3 text-right font-mono font-bold text-lime-800">
                                            {filteredSummaryTotals.days31to60.toLocaleString()}
                                        </td>
                                        <td className="px-3 py-3 text-right font-mono font-bold text-amber-800">
                                            {filteredSummaryTotals.days61to90.toLocaleString()}
                                        </td>
                                        <td className="px-3 py-3 text-right font-mono font-bold text-orange-800">
                                            {filteredSummaryTotals.days91to120.toLocaleString()}
                                        </td>
                                        <td className="px-3 py-3 text-right font-mono font-bold text-red-800">
                                            {filteredSummaryTotals.days121to150.toLocaleString()}
                                        </td>
                                        <td className="px-3 py-3 text-right font-mono font-bold text-red-900">
                                            {filteredSummaryTotals.days151plus.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-bold text-black border-l border-black/10">
                                            Rs {filteredSummaryTotals.TotalOutstanding.toLocaleString()}
                                        </td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            )}

            {/* ============ TAB 2: DETAILS BY INVOICE ============ */}
            {tab === "details" && (
                <div className="bg-white border border-black/5 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-[13px] min-w-[1000px]">
                            <thead className="bg-gray-50 border-b border-black/5">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-[11px] uppercase tracking-widest text-black/40">
                                        Customer
                                    </th>
                                    <th className="px-3 py-3 text-left font-semibold text-[11px] uppercase tracking-widest text-black/40">
                                        Date
                                    </th>
                                    <th className="px-3 py-3 text-center font-semibold text-[11px] uppercase tracking-widest text-black/40">
                                        Type
                                    </th>
                                    <th className="px-3 py-3 text-left font-semibold text-[11px] uppercase tracking-widest text-black/40">
                                        Invoice No
                                    </th>
                                    <th className="px-3 py-3 text-right font-semibold text-[11px] uppercase tracking-widest text-black/40">
                                        Amount
                                    </th>
                                    <th className="px-3 py-3 text-right font-semibold text-[11px] uppercase tracking-widest text-black/40">
                                        Pending
                                    </th>
                                    <th className="px-3 py-3 text-center font-semibold text-[11px] uppercase tracking-widest text-black/40">
                                        Days
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInvoices.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-10 text-center text-black/30"
                                        >
                                            No outstanding invoices found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredInvoices.map((r) => (
                                        <tr
                                            key={r.SaleId}
                                            onClick={() =>
                                                navigate(`/sales/${r.SaleId}`)
                                            }
                                            className="border-b border-black/5 cursor-pointer hover:bg-[#FAFAF8] transition"
                                        >
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-[13px] truncate">
                                                    {r.CustomerName}
                                                </p>
                                                {r.CustomerPhone && (
                                                    <p className="text-[11px] font-mono text-black/40">
                                                        {r.CustomerPhone}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-[12px] text-black/60 whitespace-nowrap">
                                                {new Date(
                                                    r.InvoiceDate
                                                ).toLocaleDateString("en-GB", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <span
                                                    className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${r.PaymentMode === "cash"
                                                        ? "bg-emerald-100 text-emerald-700"
                                                        : r.PaymentMode === "card"
                                                            ? "bg-blue-100 text-blue-700"
                                                            : "bg-purple-100 text-purple-700"
                                                        }`}
                                                >
                                                    {r.PaymentMode}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 font-mono text-[12px] text-[#4338CA] font-medium whitespace-nowrap">
                                                {r.InvoiceNumber}
                                            </td>
                                            <td className="px-3 py-3 text-right font-mono text-black/70">
                                                Rs {r.TotalAmount.toLocaleString()}
                                            </td>
                                            <td className="px-3 py-3 text-right font-mono font-semibold text-red-600">
                                                Rs {r.BalanceAmount.toLocaleString()}
                                            </td>
                                            <td
                                                className={`px-3 py-3 text-center font-mono ${daysColor(
                                                    r.AgeDays
                                                )}`}
                                            >
                                                {r.AgeDays}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            {filteredInvoices.length > 0 && (
                                <tfoot className="bg-gray-100 border-t-2 border-black/10">
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-4 py-3 font-bold text-[12px] uppercase tracking-wider text-black/60"
                                        >
                                            Grand Total ({filteredInvoices.length} invoices)
                                        </td>
                                        <td className="px-3 py-3 text-right font-mono font-bold text-black/70">
                                            Rs{" "}
                                            {filteredInvoiceTotals.TotalAmount.toLocaleString()}
                                        </td>
                                        <td className="px-3 py-3 text-right font-mono font-bold text-red-800">
                                            Rs{" "}
                                            {filteredInvoiceTotals.BalanceAmount.toLocaleString()}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}