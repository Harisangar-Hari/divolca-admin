import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSaleById, payCredits } from "../api/salesApi";
import { useToast } from "../store/toastStore";

export default function PayCredit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [sale, setSale] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [amount, setAmount] = useState<number>(0);

    useEffect(() => {
        if (id) {
            loadSale();
        }
    }, [id]);

    const loadSale = async () => {
        if (!id) return;
        try {
            const data = await getSaleById(id);
            setSale(data);
            // Set default amount to full balance
            setAmount(data.balanceAmount || 0);
        } catch (error) {
            showToast("Failed to load sale", "error");
            navigate("/sales");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!sale) return;
        if (amount <= 0) {
            showToast("Amount must be greater than 0", "error");
            return;
        }
        if (amount > sale.balanceAmount) {
            showToast(`Amount cannot exceed balance: Rs ${sale.balanceAmount.toFixed(2)}`, "error");
            return;
        }

        try {
            setSubmitting(true);
            const result = await payCredits(sale.id, amount);
            console.log("Payment result:", result);
            showToast("Payment recorded successfully!", "success");

            // Navigate back to sale detail after success
            navigate(`/sales/${sale.id}`);
        } catch (error: any) {
            const message = error?.response?.data?.message || "Payment failed";
            showToast(message, "error");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#EEF1EF] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B6E4F] mx-auto"></div>
                    <p className="mt-4 text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    if (!sale) {
        return (
            <div className="min-h-screen bg-[#EEF1EF] flex items-center justify-center p-6">
                <div className="text-center">
                    <p className="text-black/40 text-sm">Sale not found</p>
                    <button
                        onClick={() => navigate("/sales")}
                        className="mt-3 text-[#4338CA] text-sm font-medium hover:underline cursor-pointer"
                    >
                        Go to Sales
                    </button>
                </div>
            </div>
        );
    }

    if (sale.balanceAmount <= 0) {
        return (
            <div className="min-h-screen bg-[#EEF1EF] flex items-center justify-center p-6">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm border border-black/5">
                    <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-semibold mb-2">No Balance Due</h2>
                    <p className="text-gray-500 text-sm mb-6">
                        This invoice has been fully paid. No credit payment is required.
                    </p>
                    <button
                        onClick={() => navigate(`/sales/${sale.id}`)}
                        className="px-6 py-2 bg-[#0B6E4F] text-white rounded-xl hover:bg-[#08523b] transition-colors"
                    >
                        View Invoice
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#EEF1EF] p-4 md:p-6 font-sans text-[#14181C]">
            <div className="max-w-md mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => navigate(`/sales/${sale.id}`)}
                        className="p-2 hover:bg-white/50 rounded-xl transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-bold">Pay Credit</h1>
                </div>

                {/* Sale Summary */}
                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-500">Invoice</span>
                        <span className="font-mono font-semibold">{sale.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-500">Customer</span>
                        <span className="font-medium">{sale.customer?.name || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Total Amount</span>
                        <span className="font-mono font-semibold">Rs {sale.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-black/5">
                        <span className="text-sm text-gray-500">Paid</span>
                        <span className="font-mono text-green-600">Rs {sale.paidAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                        <span className="text-sm font-semibold">Balance Due</span>
                        <span className="font-mono text-2xl font-bold text-red-600">
                            Rs {sale.balanceAmount.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Payment Form */}
                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Payment Amount
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-sm font-bold">
                                    Rs
                                </span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max={sale.balanceAmount}
                                    value={amount || ""}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-lg font-mono font-bold outline-none focus:border-[#0B6E4F] focus:ring-2 focus:ring-[#0B6E4F]/20 transition-colors"
                                    placeholder="0.00"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div className="mt-2 flex justify-between text-sm">
                                <span className="text-gray-400">Min: Rs 0.01</span>
                                <button
                                    type="button"
                                    onClick={() => setAmount(sale.balanceAmount)}
                                    className="text-[#0B6E4F] font-medium hover:underline"
                                >
                                    Pay Full Balance
                                </button>
                            </div>
                        </div>

                        {/* Quick amount buttons */}
                        <div className="grid grid-cols-4 gap-2 mb-6">
                            {[0.25, 0.50, 0.75, 1].map((fraction) => {
                                const quickAmount = Math.round(sale.balanceAmount * fraction * 100) / 100;
                                return (
                                    <button
                                        key={fraction}
                                        type="button"
                                        onClick={() => setAmount(quickAmount)}
                                        className="py-2 text-sm font-medium bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
                                    >
                                        {fraction * 100}%
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => navigate(`/sales/${sale.id}`)}
                                className="flex-1 py-3 px-4 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || amount <= 0 || amount > sale.balanceAmount}
                                className="flex-1 py-3 px-4 bg-[#0B6E4F] text-white rounded-xl hover:bg-[#08523b] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Processing...
                                    </span>
                                ) : (
                                    `Pay Rs ${amount.toFixed(2)}`
                                )}
                            </button>
                        </div>

                        {amount > sale.balanceAmount && (
                            <p className="mt-3 text-sm text-red-600">
                                Amount exceeds balance. Maximum: Rs {sale.balanceAmount.toFixed(2)}
                            </p>
                        )}
                    </form>
                </div>

                {/* Payment History */}
                {sale.payments && sale.payments.length > 0 && (
                    <div className="mt-6 bg-white rounded-2xl shadow-sm border border-black/5 p-4">
                        <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase mb-2">
                            Previous Payments
                        </p>
                        <div className="divide-y divide-dashed divide-black/10">
                            {sale.payments.map((p: any, i: number) => (
                                <div key={i} className="flex justify-between text-[13px] py-2.5">
                                    <span className="text-black/50">
                                        {new Date(p.paidAt).toLocaleString()}
                                        {p.paymentMode && (
                                            <span className="ml-2 text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                                                {p.paymentMode.toUpperCase()}
                                            </span>
                                        )}
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