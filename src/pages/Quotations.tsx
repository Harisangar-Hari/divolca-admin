import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../store/toastStore";
import {
    getQuotations,
    deleteQuotation,
    cancelQuotation,
    type QuotationListItem,
    type QuotationStatus,
} from "../api/quotationsApi";
import QuotationFormModal from "../components/QuotationFormModal";
import ConvertQuotationModal from "../components/ConvertQuotationModal";
import { printA4Quotation } from "../utils/printA4Quotation";
import { getQuotationById } from "../api/quotationsApi";

type Tab = "draft" | "converted" | "cancelled";

const STATUS_COLORS: Record<QuotationStatus, string> = {
    draft: "bg-amber-100 text-amber-800",
    converted: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-gray-100 text-gray-600",
};

export default function Quotations() {
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [tab, setTab] = useState<Tab>("draft");
    const [quotations, setQuotations] = useState<QuotationListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [convertId, setConvertId] = useState<string | null>(null);

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const load = async () => {
        try {
            setLoading(true);
            const data = await getQuotations();
            setQuotations(data);
        } catch {
            showToast("Failed to load quotations", "error");
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        return quotations
            .filter((x) => x.Status === tab)
            .filter(
                (x) =>
                    !q ||
                    x.QuotationNumber.toLowerCase().includes(q) ||
                    x.CustomerName.toLowerCase().includes(q) ||
                    (x.CustomerPhone || "").includes(q)
            );
    }, [quotations, tab, search]);

    const counts = useMemo(() => {
        return {
            draft: quotations.filter((x) => x.Status === "draft").length,
            converted: quotations.filter((x) => x.Status === "converted").length,
            cancelled: quotations.filter((x) => x.Status === "cancelled").length,
        };
    }, [quotations]);

    const totalDraftValue = useMemo(
        () =>
            quotations
                .filter((x) => x.Status === "draft")
                .reduce((s, x) => s + x.TotalAmount, 0),
        [quotations]
    );

    const openCreate = () => {
        setEditingId(null);
        setShowForm(true);
    };

    const openEdit = (id: string) => {
        setEditingId(id);
        setShowForm(true);
    };

    const handleDelete = async (q: QuotationListItem) => {
        if (!confirm(`Delete quotation ${q.QuotationNumber}?`)) return;
        try {
            await deleteQuotation(q.Id);
            showToast("Quotation deleted", "success");
            load();
        } catch (err: any) {
            showToast(
                err?.response?.data?.message || "Failed to delete",
                "error"
            );
        }
    };

    const handleCancel = async (q: QuotationListItem) => {
        if (!confirm(`Cancel quotation ${q.QuotationNumber}?`)) return;
        try {
            await cancelQuotation(q.Id);
            showToast("Quotation cancelled", "success");
            load();
        } catch (err: any) {
            showToast(
                err?.response?.data?.message || "Failed to cancel",
                "error"
            );
        }
    };

    const handlePrint = async (id: string) => {
        try {
            const full = await getQuotationById(id);
            printA4Quotation(full);
        } catch {
            showToast("Failed to load quotation", "error");
        }
    };

    if (loading) {
        return (
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className="h-14 rounded-2xl bg-black/5 animate-pulse"
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-[#14181C]">
                        Quotations
                    </h1>
                    <p className="text-[13px] text-black/40 mt-0.5">
                        Draft quotes, convert to sales when customer approves
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="bg-[#0B6E4F] hover:bg-[#0A5F44] text-white px-4 py-2.5 rounded-xl font-medium text-[14px] cursor-pointer transition shadow-sm inline-flex items-center gap-1.5 justify-center"
                >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    New Quotation
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white border border-black/5 rounded-2xl p-4 shadow-sm">
                    <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                        Draft
                    </p>
                    <p className="text-2xl font-bold mt-1 font-mono">
                        {counts.draft}
                    </p>
                </div>
                <div className="bg-white border border-black/5 rounded-2xl p-4 shadow-sm">
                    <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                        Converted
                    </p>
                    <p className="text-2xl font-bold mt-1 font-mono text-emerald-700">
                        {counts.converted}
                    </p>
                </div>
                <div className="bg-white border border-black/5 rounded-2xl p-4 shadow-sm">
                    <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                        Cancelled
                    </p>
                    <p className="text-2xl font-bold mt-1 font-mono text-gray-500">
                        {counts.cancelled}
                    </p>
                </div>
                <div className="bg-[#12171A] rounded-2xl p-4 shadow-sm">
                    <p className="text-[11px] font-semibold tracking-widest text-white/40 uppercase">
                        Draft Value
                    </p>
                    <p className="text-2xl font-bold mt-1 font-mono text-[#4ADE9A]">
                        Rs {totalDraftValue.toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-white border border-black/5 rounded-xl p-1 w-fit shadow-sm">
                {(
                    [
                        ["draft", `Draft (${counts.draft})`],
                        ["converted", `Converted (${counts.converted})`],
                        ["cancelled", `Cancelled (${counts.cancelled})`],
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

            {/* Search */}
            <div className="relative">
                <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30"
                >
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by quotation number, customer, or phone…"
                    className="w-full border border-black/10 bg-white rounded-xl p-3 pl-11 text-[14px] outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition shadow-sm"
                />
            </div>

            {/* List */}
            <div className="bg-white border border-black/5 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-[13px]">
                        <thead className="text-left text-black/40 border-b border-black/5">
                            <tr>
                                <th className="p-4 font-semibold text-[11px] uppercase tracking-widest">
                                    Quotation
                                </th>
                                <th className="font-semibold text-[11px] uppercase tracking-widest">
                                    Customer
                                </th>
                                <th className="font-semibold text-[11px] uppercase tracking-widest">
                                    Date
                                </th>
                                <th className="font-semibold text-[11px] uppercase tracking-widest text-center">
                                    Items
                                </th>
                                <th className="font-semibold text-[11px] uppercase tracking-widest text-right">
                                    Total
                                </th>
                                <th className="font-semibold text-[11px] uppercase tracking-widest text-center">
                                    Status
                                </th>
                                <th className="font-semibold text-[11px] uppercase tracking-widest text-right pr-4">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="p-10 text-center text-black/30"
                                    >
                                        No {tab} quotations
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((q) => (
                                    <tr
                                        key={q.Id}
                                        className="border-b border-black/5 last:border-0 hover:bg-[#FAFAF8] transition"
                                    >
                                        <td className="p-4">
                                            <p className="font-mono font-semibold text-[#4338CA]">
                                                {q.QuotationNumber}
                                            </p>
                                        </td>
                                        <td>
                                            <p className="font-medium">
                                                {q.CustomerName}
                                            </p>
                                            {q.CustomerPhone && (
                                                <p className="text-[11px] font-mono text-black/40">
                                                    {q.CustomerPhone}
                                                </p>
                                            )}
                                        </td>
                                        <td className="text-[12px] text-black/60">
                                            {new Date(
                                                q.CreatedAt
                                            ).toLocaleDateString("en-GB", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </td>
                                        <td className="text-center font-mono">
                                            {q.ItemsCount}
                                        </td>
                                        <td className="text-right font-mono font-semibold">
                                            Rs {q.TotalAmount.toLocaleString()}
                                        </td>
                                        <td className="text-center">
                                            <span
                                                className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${STATUS_COLORS[q.Status]}`}
                                            >
                                                {q.Status}
                                            </span>
                                        </td>
                                        <td className="p-3 pr-4">
                                            <div className="flex gap-1.5 justify-end flex-wrap">
                                                {q.Status === "draft" && (
                                                    <>
                                                        <button
                                                            onClick={() =>
                                                                setConvertId(q.Id)
                                                            }
                                                            className="px-3 py-1.5 bg-[#0B6E4F] hover:bg-[#0A5F44] text-white rounded-lg font-medium text-[12px] cursor-pointer transition"
                                                        >
                                                            Convert
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                openEdit(q.Id)
                                                            }
                                                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium text-[12px] cursor-pointer transition"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handlePrint(q.Id)
                                                            }
                                                            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-medium text-[12px] cursor-pointer transition"
                                                        >
                                                            Print
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleCancel(q)
                                                            }
                                                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-medium text-[12px] cursor-pointer transition"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleDelete(q)
                                                            }
                                                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium text-[12px] cursor-pointer transition"
                                                        >
                                                            Delete
                                                        </button>
                                                    </>
                                                )}

                                                {q.Status === "converted" &&
                                                    q.ConvertedSaleId && (
                                                        <>
                                                            <button
                                                                onClick={() =>
                                                                    navigate(
                                                                        `/sales/${q.ConvertedSaleId}`
                                                                    )
                                                                }
                                                                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#0B6E4F] rounded-lg font-medium text-[12px] cursor-pointer transition"
                                                            >
                                                                View Sale
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    handlePrint(
                                                                        q.Id
                                                                    )
                                                                }
                                                                className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-medium text-[12px] cursor-pointer transition"
                                                            >
                                                                Print
                                                            </button>
                                                        </>
                                                    )}

                                                {q.Status === "cancelled" && (
                                                    <>
                                                        <button
                                                            onClick={() =>
                                                                handlePrint(q.Id)
                                                            }
                                                            className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg font-medium text-[12px] cursor-pointer transition"
                                                        >
                                                            Print
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleDelete(q)
                                                            }
                                                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium text-[12px] cursor-pointer transition"
                                                        >
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            {showForm && (
                <QuotationFormModal
                    quotationId={editingId}
                    onClose={() => setShowForm(false)}
                    onSaved={() => {
                        setShowForm(false);
                        load();
                    }}
                />
            )}

            {convertId && (
                <ConvertQuotationModal
                    quotationId={convertId}
                    onClose={() => setConvertId(null)}
                    onConverted={(saleId) => {
                        setConvertId(null);
                        load();
                        navigate(`/sales/${saleId}`);
                    }}
                />
            )}
        </div>
    );
}