// src/pages/sales/SaleDetail.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSaleById, returnSale, cancelSale } from "../api/salesApi";
import { printA4Receipt, type ReceiptData } from "../utils/printA4Receipt";

export default function SaleDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [sale, setSale] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [returning, setReturning] = useState(false);

    useEffect(() => {
        loadSale();
    }, [id]);

    const loadSale = async () => {
        if (!id) return;

        try {
            const data = await getSaleById(id);
            console.log('Mapped sale data:', data);
            setSale(data);
        } catch (error) {
            console.error('Error loading sale:', error);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Status helper functions
    const isCancelled = () => sale?.status === 4 || sale?.status === "Cancelled";
    const isReturned = () => sale?.status === 2 || sale?.status === "Returned" || sale?.status === "FULLY_RETURNED";
    const isCompleted = () => sale?.status === 3 || sale?.status === "Completed";

    // ✅ Get status based on status field
    const getStatus = () => {
        if (isCancelled()) return "Cancelled";
        if (isReturned()) return "Returned";
        if (isCompleted()) return "Completed";
        if (sale?.balanceAmount > 0 && sale?.paidAmount > 0) return "Partial";
        if (sale?.balanceAmount === 0) return "Paid";
        return "Unpaid";
    };

    // ✅ Get status color based on status field
    const getStatusColor = () => {
        if (isCancelled()) return "bg-gray-100 text-gray-600";
        if (isReturned()) return "bg-red-50 text-red-600";
        if (isCompleted()) return "bg-emerald-50 text-[#0B6E4F]";
        if (sale?.balanceAmount > 0 && sale?.paidAmount > 0) return "bg-amber-50 text-amber-700";
        if (sale?.balanceAmount === 0) return "bg-emerald-50 text-[#0B6E4F]";
        return "bg-red-50 text-red-600";
    };

    const handleCancel = async () => {
        if (!sale) return;

        const reason = prompt("Enter reason for cancellation (optional):");
        if (reason === null) return;

        const ok = confirm(`Are you sure you want to cancel invoice ${sale.invoiceNumber}?`);
        if (!ok) return;

        try {
            setLoading(true);
            await cancelSale(sale.id, reason || undefined);
            alert("Sale cancelled successfully");
            await loadSale();
        } catch (err: any) {
            alert(err?.response?.data?.message || "Failed to cancel sale");
        } finally {
            setLoading(false);
        }
    };

    const handleReturn = async () => {
        if (!sale || isReturned() || isCancelled()) return;

        const ok = confirm("Return this invoice?");
        if (!ok) return;

        try {
            setReturning(true);
            await returnSale(sale.invoiceNumber);
            alert("Returned successfully");
            await loadSale();
        } catch (err: any) {
            alert(err?.response?.data || "Failed");
        } finally {
            setReturning(false);
        }
    };

    const handlePrint = () => {
        if (!sale) return;

        const invoiceLevelDiscount = sale.invoiceDiscountAmount || 0;
        const subTotal = sale.subTotal || 0;

        let discountPercent = 0;
        if (subTotal > 0 && invoiceLevelDiscount > 0) {
            discountPercent = Math.round((invoiceLevelDiscount / subTotal) * 100);
        }

        const customerCreditBalance = sale.customer?.creditBalance || 0;
        const currentBalance = sale.balanceAmount || 0;
        const previousOutstanding = Math.max(0, customerCreditBalance - currentBalance);

        const customerAddress = sale.customer?.address
            ? `${sale.customer.address}${sale.customer.city ? `, ${sale.customer.city}` : ''}${sale.customer.country ? `, ${sale.customer.country}` : ''}`
            : "";

        const receiptData: ReceiptData = {
            invoiceNumber: sale.invoiceNumber,
            items: (sale.items ?? []).map((item: any) => ({
                name: item.productName || "Product",
                quantity: item.quantity,
                price: item.originalPrice || item.unitPrice || 0,
                discountPercent: item.discountPercent || 0,
                discountRs: item.discount || 0,
                sku: item.sku || "",
            })),
            customerName: sale.customer?.name || "",
            customerPhone: sale.customer?.phone || "",
            customerAddress: customerAddress,
            total: sale.totalAmount || 0,
            paid: sale.paidAmount || 0,
            balance: sale.balanceAmount || 0,
            change: 0,
            paymentMode: sale.paymentMode || "cash",
            invoiceDiscount: discountPercent,
            invoiceDiscountAmount: invoiceLevelDiscount,
            previousOutstanding: previousOutstanding,
        };

        console.log('Printing A4 receipt with data:', receiptData);
        printA4Receipt(receiptData);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#EEF1EF] p-4 md:p-6">
                <div className="max-w-3xl mx-auto space-y-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-16 rounded-2xl bg-black/5 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (!sale) {
        return (
            <div className="min-h-screen bg-[#EEF1EF] flex items-center justify-center p-6">
                <div className="text-center">
                    <p className="text-black/40 text-sm">Invoice not found</p>
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

    const statusLabel = getStatus();
    const statusColor = getStatusColor();
    const isCancelledStatus = isCancelled();
    const isReturnedStatus = isReturned();

    const totalItemDiscount = (sale.items ?? []).reduce((acc: number, item: any) => {
        return acc + (Number(item.discount || 0) * Number(item.quantity || 1));
    }, 0);
    const grandTotalDiscount = totalItemDiscount + Number(sale.invoiceDiscountAmount || 0);

    const payments = sale.payments || [];
    const hasPayments = payments.length > 0;

    return (
        <div className="min-h-screen bg-[#EEF1EF] p-4 md:p-6 font-sans text-[#14181C]">
            <div className="max-w-3xl mx-auto space-y-5">

                {/* HEADER */}
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="flex gap-2 items-center flex-wrap">
                        <h1 className="text-xl font-bold font-mono">
                            {sale.invoiceNumber}
                        </h1>
                        <span className={`text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-full ${statusColor}`}>
                            {statusLabel}
                        </span>
                        <span className="text-[10px] font-mono bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                            {sale.paymentMode?.toUpperCase() || 'CASH'}
                        </span>
                        {isCancelledStatus && (
                            <span className="text-[10px] font-mono bg-red-100 text-red-600 px-2 py-1 rounded-full">
                                ⚠️ Cancelled
                            </span>
                        )}
                    </div>

                    <div className="flex gap-2">
                        {/* Show Pay Credit button only if not returned, not cancelled, and has balance */}
                        {!isReturnedStatus && !isCancelledStatus && sale.balanceAmount > 0 && (
                            <button
                                onClick={() => navigate(`/sales/${sale.id}/pay-credit`)}
                                className="text-[13px] font-medium px-3.5 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer transition"
                            >
                                Pay Credit
                            </button>
                        )}

                        {/* Show Cancel button only if not returned and not cancelled */}
                        {!isReturnedStatus && !isCancelledStatus && (
                            <button
                                onClick={handleCancel}
                                className="text-[13px] font-medium px-3.5 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 cursor-pointer transition shadow-sm"
                            >
                                Cancel Invoice
                            </button>
                        )}

                        {/* Show Return button only if not returned and not cancelled */}
                        {!isReturnedStatus && !isCancelledStatus && (
                            <button
                                onClick={handleReturn}
                                disabled={returning}
                                className="text-[13px] font-medium px-3.5 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 cursor-pointer transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {returning ? "Processing…" : "Return Invoice"}
                            </button>
                        )}

                        <button
                            onClick={handlePrint}
                            className="text-[13px] font-medium px-3.5 py-2 rounded-xl bg-[#4338CA] text-white hover:bg-[#3730A3] cursor-pointer transition shadow-sm"
                        >
                            🖨️ Print A4
                        </button>

                        <button
                            onClick={() => navigate(-1)}
                            className="text-[13px] font-medium bg-white border border-black/10 text-black/60 px-3.5 py-2 rounded-xl hover:bg-[#F3F6F4] cursor-pointer transition shadow-sm"
                        >
                            Back
                        </button>
                    </div>
                </div>

                {/* CUSTOMER INFO */}
                {sale.customer && (
                    <div className="bg-white border border-black/5 rounded-2xl shadow-sm p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#F3F6F4] flex items-center justify-center text-[#4338CA] font-semibold text-sm shrink-0">
                            {(sale.customer.name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-medium text-[14px]">{sale.customer.name}</p>
                            <p className="text-[13px] text-black/40 font-mono">{sale.customer.phone}</p>
                            {sale.customer.address && (
                                <p className="text-[12px] text-black/30">{sale.customer.address}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* ITEMS */}
                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-4">
                    <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase mb-2">
                        Items
                    </p>

                    <div className="divide-y divide-dashed divide-black/10">
                        {(sale.items ?? []).map((item: any, i: number) => {
                            const discount = Number(item.discount || 0);
                            const unitPrice = Number(item.unitPrice);
                            const qty = item.quantity;
                            const finalLineTotal = Number(item.total);

                            return (
                                <div key={i} className="flex justify-between items-center py-3">
                                    <div>
                                        <p className="font-medium text-[14px]">
                                            {item.productName || "Product"}
                                        </p>
                                        <div className="text-[13px] text-black/40 font-mono mt-0.5 space-y-0.5">
                                            <p>{qty} × Rs {unitPrice.toFixed(2)}</p>
                                            {discount > 0 && (
                                                <p className="text-red-500 font-medium">
                                                    (Disc: -Rs {discount.toFixed(2)} /each)
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="font-mono font-semibold text-[14px]">
                                        Rs {finalLineTotal.toFixed(2)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* PAYMENT SUMMARY */}
                <div className="bg-[#12171A] rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-[11px] tracking-widest uppercase text-white/40 font-semibold">SubTotal</span>
                        <span className="font-mono font-semibold text-[15px] text-white/80">Rs {(sale.subTotal || 0).toFixed(2)}</span>
                    </div>

                    {grandTotalDiscount > 0 && (
                        <div className="flex justify-between items-center">
                            <span className="text-[11px] tracking-widest uppercase text-white/40 font-semibold">Total Discount</span>
                            <span className="font-mono font-semibold text-[15px] text-red-400">-Rs {(grandTotalDiscount || 0).toFixed(2)}</span>
                        </div>
                    )}

                    <div className="flex justify-between items-center">
                        <span className="text-[11px] tracking-widest uppercase text-white/40 font-semibold">Total</span>
                        <span className="font-mono font-semibold text-[15px] text-white">Rs {(sale.totalAmount || 0).toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-[11px] tracking-widest uppercase text-white/40 font-semibold">Paid</span>
                        <span className="font-mono text-[15px] text-[#4ADE9A]">
                            Rs {(sale.paidAmount || 0).toFixed(2)}
                        </span>
                    </div>

                    <div className="h-px bg-white/10" />

                    <div>
                        <p className="text-[11px] tracking-widest uppercase text-white/40 font-semibold">Balance</p>
                        <p
                            className={`mt-1 font-mono text-3xl font-semibold tabular-nums ${(sale.balanceAmount || 0) > 0
                                ? "text-[#F87171] [text-shadow:0_0_18px_rgba(248,113,113,0.35)]"
                                : "text-[#4ADE9A] [text-shadow:0_0_18px_rgba(74,222,154,0.35)]"
                                }`}
                        >
                            Rs {(sale.balanceAmount || 0).toFixed(2)}
                        </p>
                    </div>
                </div>

                {/* PAYMENT HISTORY */}
                {hasPayments && (
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-black/5">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                                Payment History
                            </p>
                            <span className="text-[10px] font-mono text-black/30">
                                {payments.length} payment{payments.length > 1 ? 's' : ''}
                            </span>
                        </div>

                        <div className="divide-y divide-dashed divide-black/10">
                            {payments.map((p: any, i: number) => (
                                <div key={p.id || i} className="flex justify-between items-center py-2.5">
                                    <div className="flex flex-col">
                                        <span className="text-[13px] text-black/50">
                                            {new Date(p.paidAt).toLocaleString()}
                                        </span>
                                        <span className="text-[10px] font-mono text-black/30">
                                            {p.paymentMode?.toUpperCase() || 'CASH'}
                                            {p.reference && ` • ${p.reference}`}
                                            {p.status && ` • ${p.status}`}
                                        </span>
                                    </div>
                                    <span className="font-mono font-medium text-[14px] text-[#0B6E4F]">
                                        Rs {(p.amount || 0).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-3 pt-3 border-t border-black/10 flex justify-between text-[12px]">
                            <span className="text-black/40">Total Paid</span>
                            <span className="font-mono font-semibold">
                                Rs {payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0).toFixed(2)}
                            </span>
                        </div>
                    </div>
                )}

                {/* CREDIT PAYMENTS */}
                {sale.creditPayments && sale.creditPayments.length > 0 && (
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-black/5">
                        <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase mb-2">
                            Credit Payments
                        </p>
                        <div className="divide-y divide-dashed divide-black/10">
                            {sale.creditPayments.map((p: any, i: number) => (
                                <div key={i} className="flex justify-between text-[13px] py-2.5">
                                    <span className="text-black/50">
                                        {new Date(p.paidAt).toLocaleString()}
                                        {p.note && <span className="ml-2 text-black/30 text-[11px]">({p.note})</span>}
                                    </span>
                                    <span className="font-mono font-medium text-[#0B6E4F]">
                                        Rs {(p.amount || 0).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}