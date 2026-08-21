import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPurchaseById, cancelPurchase } from "../../api/purchaseApi";

interface Purchase {
    id: string;
    invoiceNumber: string;
    purchaseDate: string;
    grandTotal: number;
    paidAmount: number;
    balanceAmount: number;
    supplierId: string;
    status: number;
    supplier: {
        id: string;
        name: string;
        phone: string;
        email?: string;
        address?: string;
    } | null;
    items: PurchaseItem[];
}

interface PurchaseItem {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    costPrice: number;
    lineTotal: number;
}

export default function PurchaseDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState<Purchase | null>(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        load();
    }, [id]);

    const load = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const res = await getPurchaseById(id);
            setData(res);
        } catch (error) {
            console.error("Failed to load purchase:", error);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Status helpers
    const isCancelled = () => data?.status === 3;
    const isCompleted = () => data?.status === 2;
    const isPartial = () => data?.status === 1;

    const getStatusLabel = () => {
        if (isCancelled()) return "Cancelled";
        if (isCompleted()) return "Completed";
        if (isPartial()) return "Partial";
        return "Pending";
    };

    const getStatusColor = () => {
        if (isCancelled()) return "bg-gray-100 text-gray-600";
        if (isCompleted()) return "bg-emerald-50 text-[#0B6E4F]";
        if (isPartial()) return "bg-amber-50 text-amber-700";
        return "bg-yellow-50 text-yellow-700";
    };

    // ✅ Handle cancel
    const handleCancel = async () => {
        if (!data) return;

        const reason = prompt("Enter reason for cancellation (optional):");
        if (reason === null) return;

        const ok = confirm(`Are you sure you want to cancel purchase ${data.invoiceNumber}?`);
        if (!ok) return;

        try {
            setCancelling(true);
            await cancelPurchase(data.id, reason || undefined);
            alert("Purchase cancelled successfully");
            await load();
        } catch (err: any) {
            alert(err?.response?.data?.message || "Failed to cancel purchase");
        } finally {
            setCancelling(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#EEF1EF] p-4 md:p-6 font-sans">
                <div className="max-w-3xl mx-auto space-y-3">
                    <div className="h-24 rounded-2xl bg-black/5 animate-pulse" />
                    <div className="h-14 rounded-2xl bg-black/5 animate-pulse" />
                    <div className="h-14 rounded-2xl bg-black/5 animate-pulse" />
                    <div className="h-14 rounded-2xl bg-black/5 animate-pulse" />
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-[#EEF1EF] p-4 md:p-6 font-sans">
                <div className="max-w-3xl mx-auto text-center py-12">
                    <p className="text-black/40 text-sm">Purchase not found</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-3 text-[#4338CA] text-sm font-medium hover:underline cursor-pointer"
                    >
                        Go back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#EEF1EF] p-4 md:p-6 font-sans text-[#14181C]">
            <div className="max-w-3xl mx-auto space-y-5">

                {/* HEADER */}
                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-5 relative overflow-hidden">
                    <div className="absolute left-0 top-0 h-full w-1 bg-[#4338CA]" />

                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[11px] font-semibold tracking-widest text-[#4338CA] uppercase">
                                Purchase invoice
                            </p>
                            <h2 className="text-xl font-bold font-mono mt-1">
                                {data.invoiceNumber}
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-full ${getStatusColor()}`}>
                                {getStatusLabel()}
                            </span>
                            {isCancelled() && (
                                <span className="text-[10px] font-mono bg-red-100 text-red-600 px-2 py-1 rounded-full">
                                    ⚠️ Cancelled
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[13px]">
                        <div>
                            <p className="text-[10px] font-semibold tracking-widest text-black/40 uppercase">
                                Supplier
                            </p>
                            <p className="mt-0.5 font-medium">
                                {data.supplier?.name || "—"}
                            </p>
                        </div>

                        <div>
                            <p className="text-[10px] font-semibold tracking-widest text-black/40 uppercase">
                                Phone
                            </p>
                            <p className="mt-0.5 font-mono">
                                {data.supplier?.phone || "—"}
                            </p>
                        </div>

                        <div>
                            <p className="text-[10px] font-semibold tracking-widest text-black/40 uppercase">
                                Date
                            </p>
                            <p className="mt-0.5">
                                {new Date(data.purchaseDate).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* ✅ Action Buttons */}
                    <div className="mt-4 pt-4 border-t border-black/5 flex flex-wrap gap-2">
                        {!isCancelled() && data.paidAmount === 0 && (
                            <button
                                onClick={handleCancel}
                                disabled={cancelling}
                                className="text-[13px] font-medium px-3.5 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 cursor-pointer transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {cancelling ? "Processing…" : "Cancel Purchase"}
                            </button>
                        )}

                        {isCancelled() && (
                            <span className="text-[13px] font-medium px-3.5 py-2 rounded-xl bg-gray-100 text-gray-500">
                                Already Cancelled
                            </span>
                        )}

                        {!isCancelled() && data.paidAmount > 0 && (
                            <span className="text-[13px] font-medium px-3.5 py-2 rounded-xl bg-yellow-50 text-yellow-600">
                                Cannot cancel - Payments have been made
                            </span>
                        )}

                        <button
                            onClick={() => navigate(-1)}
                            className="text-[13px] font-medium px-3.5 py-2 rounded-xl bg-white border border-black/10 text-black/60 hover:bg-[#F3F6F4] cursor-pointer transition shadow-sm"
                        >
                            Back
                        </button>
                    </div>
                </div>

                {/* ITEMS */}
                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-5">
                    <h3 className="text-[11px] font-semibold tracking-widest text-black/40 uppercase mb-2">
                        Items
                    </h3>

                    {!data.items?.length ? (
                        <div className="py-10 text-center text-black/30 text-sm">
                            No items on this invoice
                        </div>
                    ) : (
                        <div className="divide-y divide-dashed divide-black/10">
                            {data.items.map((i) => (
                                <div
                                    key={i.productId}
                                    className="flex justify-between items-center py-3"
                                >
                                    <div>
                                        <p className="font-medium text-[14px]">
                                            {i.productName}
                                        </p>

                                        <p className="text-[12px] text-black/40 font-mono mt-0.5">
                                            {i.quantity} × Rs {i.costPrice}
                                        </p>
                                    </div>

                                    <div className="font-mono font-semibold text-[15px]">
                                        Rs {i.lineTotal}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* TOTAL */}
                <div className="bg-[#12171A] rounded-2xl p-5 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] tracking-widest uppercase text-white/40 font-semibold">
                            Paid
                        </span>
                        <span className="font-mono text-[15px] tabular-nums text-white/70">
                            Rs {data.paidAmount}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-[11px] tracking-widest uppercase text-white/40 font-semibold">
                            Balance
                        </span>
                        <span
                            className={`font-mono text-[15px] tabular-nums ${data.balanceAmount > 0 ? "text-[#F87171]" : "text-white/70"
                                }`}
                        >
                            Rs {data.balanceAmount}
                        </span>
                    </div>

                    <div className="h-px bg-white/10" />

                    <div className="flex items-center justify-between">
                        <span className="text-[11px] tracking-widest uppercase text-white/40 font-semibold">
                            Grand total
                        </span>
                        <span className="font-mono text-2xl font-semibold tabular-nums text-[#4ADE9A] [text-shadow:0_0_18px_rgba(74,222,154,0.35)]">
                            Rs {data.grandTotal}
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
}