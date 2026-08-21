import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useToast } from "../store/toastStore";
import { getCustomerById, getCustomerInvoices, payCustomerCredit } from "../api/customerApi";

interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    deliveryAddress?: string;
    billingAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    alternativePhone?: string;
    companyName?: string;
    taxNumber?: string;
    customerType: string;
    creditLimit: number;
    creditBalance: number;
    availableCredit: number;
    isActive: boolean;
    isBlocked: boolean;
    blockReason?: string;
    paymentTerms?: string;
    notes?: string;
    loyaltyPoints: number;
    loyaltyTier: string;
    totalSpent: number;
    createdAt: string;
    updatedAt: string;
    lastPurchaseDate?: string;
    lastPaymentDate?: string;
}

interface Invoice {
    Id: string;
    InvoiceNumber: string;
    TotalAmount: number;
    PaidAmount: number;
    BalanceAmount: number;
    CreatedAt: string;
    Status: number;
    IsCreditSale: boolean;
}

export default function CustomerCreditDetails() {
    const { id } = useParams();
    const { showToast } = useToast();

    const [customer, setCustomer] = useState<Customer | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState<number | string>("");
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showCustomerDetails, setShowCustomerDetails] = useState(false);

    useEffect(() => {
        load();
    }, [id]);

    const load = async () => {
        try {
            setLoading(true);
            if (!id) return;

            // Load customer details
            const customerData = await getCustomerById(id);
            setCustomer(customerData);

            // Load customer invoices
            const invoiceData = await getCustomerInvoices(id);
            setInvoices(invoiceData.invoices || []);

        } catch (error: any) {
            showToast(
                error?.response?.data?.message || "Failed to load customer data",
                "error"
            );
        } finally {
            setLoading(false);
        }
    };

    // Helper function to safely format numbers
    const formatNumber = (value: any): string => {
        if (value === null || value === undefined) return "0";
        const num = typeof value === 'string' ? parseFloat(value) : Number(value);
        if (isNaN(num)) return "0";
        return num.toLocaleString();
    };

    // Helper function to safely get number value
    const getNumber = (value: any): number => {
        if (value === null || value === undefined) return 0;
        const num = typeof value === 'string' ? parseFloat(value) : Number(value);
        return isNaN(num) ? 0 : num;
    };

    const totalBalance = invoices.reduce(
        (sum, i) => sum + getNumber(i.BalanceAmount),
        0
    );

    const handlePayCredit = async () => {
        const paymentAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

        if (!paymentAmount || paymentAmount <= 0) {
            showToast("Enter a valid amount", "error");
            return;
        }

        if (paymentAmount > totalBalance) {
            showToast("Amount exceeds outstanding balance", "error");
            return;
        }

        try {
            await payCustomerCredit({
                customerId: id!,
                amount: paymentAmount,
            });

            showToast("Payment successful!", "success");
            setAmount("");
            setShowPaymentModal(false);
            await load();
        } catch (error: any) {
            showToast(
                error?.response?.data?.message || "Payment failed",
                "error"
            );
        }
    };

    const getCustomerTypeBadgeColor = (type: string) => {
        const colors: Record<string, string> = {
            RETAIL: "bg-blue-100 text-blue-800",
            WHOLESALE: "bg-purple-100 text-purple-800",
            CORPORATE: "bg-indigo-100 text-indigo-800",
            VIP: "bg-amber-100 text-amber-800",
            GOVERNMENT: "bg-red-100 text-red-800",
            EDUCATIONAL: "bg-green-100 text-green-800",
        };
        return colors[type] || "bg-gray-100 text-gray-800";
    };

    const getStatusBadge = (status: number, balanceAmount: number) => {

        if (status === 4) {
            return { label: "Cancelled", color: "bg-gray-100 text-gray-800" };
        }
        // If balance is 0, it's fully paid regardless of status
        if (balanceAmount === 0) {
            return { label: "Paid", color: "bg-green-100 text-green-800" };
        }

        const statusMap: Record<number, { label: string; color: string }> = {
            0: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
            1: { label: "Completed", color: "bg-green-100 text-green-800" },
            2: { label: "Cancelled", color: "bg-red-100 text-red-800" },
            3: { label: "Refunded", color: "bg-gray-100 text-gray-800" },
            4: { label: "Cancelled", color: "bg-gray-100 text-gray-800" },
        };

        return statusMap[status] || { label: "Unknown", color: "bg-gray-100 text-gray-800" };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#EEF1EF] p-4 md:p-6">
                <div className="max-w-2xl mx-auto space-y-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-16 rounded-2xl bg-black/5 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="min-h-screen bg-[#EEF1EF] p-4 md:p-6 flex items-center justify-center">
                <div className="bg-white p-10 rounded-2xl shadow-sm text-center">
                    <p className="text-black/40">Customer not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#EEF1EF] p-4 md:p-6 font-sans text-[#14181C]">
            <div className="max-w-2xl mx-auto space-y-5">

                {/* CUSTOMER HEADER */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-black/5">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-[#F3F6F4] flex items-center justify-center text-[#4338CA] font-semibold text-base shrink-0">
                            {(customer.name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="text-lg font-bold text-[#14181C]">
                                    {customer.name}
                                </h2>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getCustomerTypeBadgeColor(customer.customerType)}`}>
                                    {customer.customerType}
                                </span>
                                {customer.isBlocked && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                                        BLOCKED
                                    </span>
                                )}
                                {!customer.isActive && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                                        INACTIVE
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2 text-[13px] text-black/40">
                                <span className="font-mono">{customer.phone}</span>
                                {customer.email && <span>• {customer.email}</span>}
                                {customer.companyName && <span>• {customer.companyName}</span>}
                            </div>
                        </div>
                        <button
                            onClick={() => setShowCustomerDetails(!showCustomerDetails)}
                            className="text-black/30 hover:text-black/60 transition"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>

                    {/* Customer Details Expandable Section */}
                    {showCustomerDetails && (
                        <div className="mt-4 pt-4 border-t border-black/5 grid grid-cols-2 gap-3 text-[13px]">
                            {customer.email && (
                                <div>
                                    <p className="text-black/30 text-[10px] uppercase tracking-wider font-semibold">Email</p>
                                    <p className="font-medium">{customer.email}</p>
                                </div>
                            )}
                            {customer.phone && (
                                <div>
                                    <p className="text-black/30 text-[10px] uppercase tracking-wider font-semibold">Phone</p>
                                    <p className="font-medium">{customer.phone}</p>
                                </div>
                            )}
                            {customer.alternativePhone && (
                                <div>
                                    <p className="text-black/30 text-[10px] uppercase tracking-wider font-semibold">Alternative Phone</p>
                                    <p className="font-medium">{customer.alternativePhone}</p>
                                </div>
                            )}
                            {customer.companyName && (
                                <div>
                                    <p className="text-black/30 text-[10px] uppercase tracking-wider font-semibold">Company</p>
                                    <p className="font-medium">{customer.companyName}</p>
                                </div>
                            )}
                            {customer.taxNumber && (
                                <div>
                                    <p className="text-black/30 text-[10px] uppercase tracking-wider font-semibold">Tax Number</p>
                                    <p className="font-medium">{customer.taxNumber}</p>
                                </div>
                            )}
                            {customer.address && (
                                <div className="col-span-2">
                                    <p className="text-black/30 text-[10px] uppercase tracking-wider font-semibold">Address</p>
                                    <p className="font-medium">
                                        {customer.address}
                                        {customer.city && `, ${customer.city}`}
                                        {customer.state && `, ${customer.state}`}
                                        {customer.postalCode && `, ${customer.postalCode}`}
                                        {customer.country && `, ${customer.country}`}
                                    </p>
                                </div>
                            )}
                            {customer.paymentTerms && (
                                <div>
                                    <p className="text-black/30 text-[10px] uppercase tracking-wider font-semibold">Payment Terms</p>
                                    <p className="font-medium">{customer.paymentTerms}</p>
                                </div>
                            )}
                            {customer.loyaltyTier && (
                                <div>
                                    <p className="text-black/30 text-[10px] uppercase tracking-wider font-semibold">Loyalty Tier</p>
                                    <p className="font-medium">{customer.loyaltyTier} ({customer.loyaltyPoints} pts)</p>
                                </div>
                            )}
                            {customer.totalSpent > 0 && (
                                <div>
                                    <p className="text-black/30 text-[10px] uppercase tracking-wider font-semibold">Total Spent</p>
                                    <p className="font-medium">Rs {formatNumber(customer.totalSpent)}</p>
                                </div>
                            )}
                            {customer.notes && (
                                <div className="col-span-2">
                                    <p className="text-black/30 text-[10px] uppercase tracking-wider font-semibold">Notes</p>
                                    <p className="font-medium text-black/60">{customer.notes}</p>
                                </div>
                            )}
                            {customer.isBlocked && customer.blockReason && (
                                <div className="col-span-2">
                                    <p className="text-black/30 text-[10px] uppercase tracking-wider font-semibold">Block Reason</p>
                                    <p className="font-medium text-red-600">{customer.blockReason}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* CREDIT SUMMARY CARDS */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#12171A] rounded-2xl p-4 shadow-sm">
                        <p className="text-[10px] tracking-widest uppercase text-white/40 font-semibold">
                            Outstanding
                        </p>
                        <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#F87171]">
                            Rs {formatNumber(totalBalance)}
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-black/5">
                        <p className="text-[10px] tracking-widest uppercase text-black/40 font-semibold">
                            Credit Limit
                        </p>
                        <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-[#0B6E4F]">
                            Rs {formatNumber(customer.creditLimit)}
                        </p>
                        {customer.availableCredit !== undefined && customer.availableCredit !== null && (
                            <p className="text-[11px] text-black/30 mt-0.5">
                                Available: Rs {formatNumber(customer.availableCredit)}
                            </p>
                        )}
                    </div>
                </div>

                {/* Additional Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-black/5 text-center">
                        <p className="text-[9px] text-black/30 uppercase tracking-wider font-semibold">Invoices</p>
                        <p className="text-lg font-bold">{invoices.length}</p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-black/5 text-center">
                        <p className="text-[9px] text-black/30 uppercase tracking-wider font-semibold">Active Credit</p>
                        <p className="text-lg font-bold">
                            {invoices.filter(i => getNumber(i.BalanceAmount) > 0).length}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-3 shadow-sm border border-black/5 text-center">
                        <p className="text-[9px] text-black/30 uppercase tracking-wider font-semibold">Loyalty</p>
                        <p className="text-lg font-bold">{customer.loyaltyPoints}</p>
                    </div>
                </div>

                {/* PAYMENT SECTION */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-black/5 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                            Record a payment
                        </p>
                        {totalBalance > 0 && (
                            <button
                                onClick={() => setShowPaymentModal(true)}
                                className="bg-[#0B6E4F] hover:bg-[#0A5F44] text-white px-4 py-2 rounded-xl font-medium text-[13px] cursor-pointer transition shadow-sm"
                            >
                                Pay Now
                            </button>
                        )}
                    </div>

                    {totalBalance === 0 && (
                        <div className="text-center py-4 text-black/40 text-sm">
                            No outstanding balance
                        </div>
                    )}
                </div>

                {/* INVOICE LIST */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                            Invoices ({invoices.length})
                        </p>
                        <span className="text-[11px] text-black/30">
                            {invoices.filter(i => getNumber(i.BalanceAmount) > 0).length} with balance
                        </span>
                    </div>

                    {invoices.length === 0 && (
                        <div className="bg-white p-10 rounded-2xl shadow-sm border border-black/5 text-center text-black/30 text-sm">
                            No invoices found
                        </div>
                    )}

                    {invoices.map((inv) => {

                        const totalAmount = getNumber(inv.TotalAmount);
                        const paidAmount = getNumber(inv.PaidAmount);
                        const balanceAmount = getNumber(inv.BalanceAmount);
                        const status = getStatusBadge(inv.Status, balanceAmount);

                        return (
                            <div
                                key={inv.Id}
                                className="bg-white p-4 rounded-2xl shadow-sm border border-black/5 hover:shadow-md transition"
                            >
                                <div className="flex justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-semibold font-mono text-[14px]">
                                                {inv.InvoiceNumber}
                                            </p>
                                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                                                {status.label}
                                            </span>
                                            {inv.IsCreditSale && (
                                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                                                    Credit
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[12px] text-black/40 mt-0.5">
                                            {new Date(inv.CreatedAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>

                                    <div className="text-right space-y-0.5 shrink-0">
                                        <p className="text-[12px] text-black/50">
                                            Total <span className="font-mono text-[#14181C] ml-1">Rs {formatNumber(totalAmount)}</span>
                                        </p>
                                        <p className="text-[12px] text-black/50">
                                            Paid <span className="font-mono text-[#0B6E4F] ml-1">Rs {formatNumber(paidAmount)}</span>
                                        </p>
                                        <p className={`text-[15px] font-bold font-mono ${balanceAmount > 0 ? "text-red-600" : "text-[#0B6E4F]"}`}>
                                            Rs {formatNumber(balanceAmount)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>

            {/* PAYMENT MODAL */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-[#14181C]">
                                Make Payment
                            </h2>
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="text-black/30 hover:text-black/60"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-black/60">Outstanding Balance</span>
                                <span className="font-bold text-red-600">Rs {formatNumber(totalBalance)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-black/60">Customer</span>
                                <span className="font-medium">{customer.name}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] text-black/60 font-medium">
                                Payment Amount
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Enter amount"
                                className="w-full border border-black/10 bg-[#FAFAF8] p-3 rounded-xl font-mono text-[16px] outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                            />
                            {typeof amount === 'string' && parseFloat(amount) > totalBalance && (
                                <p className="text-red-500 text-xs">Amount exceeds outstanding balance</p>
                            )}
                        </div>

                        <div className="flex gap-2 pt-1">
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="flex-1 px-4 py-2.5 bg-[#F3F6F4] hover:bg-[#E7ECE9] text-black/70 rounded-xl font-medium text-[14px] cursor-pointer transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePayCredit}
                                className="flex-1 px-4 py-2.5 bg-[#0B6E4F] hover:bg-[#0A5F44] text-white rounded-xl font-medium text-[14px] cursor-pointer transition shadow-sm"
                            >
                                Pay Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}