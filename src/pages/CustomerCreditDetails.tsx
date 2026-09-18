//src/pages/CustomerCreditDetails.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useToast } from "../store/toastStore";
import { getCustomerById, getCustomerInvoices, getCustomerLedger, payCustomerCredit, type CustomerLedger } from "../api/customerApi";
import { recordBulkCreditCheque } from "../api/creditChequeApi";
import { useNavigate } from "react-router-dom";

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



    const [paymentMethod, setPaymentMethod] = useState<"cash" | "cheque">("cash");

    // Cheque state
    const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
    const [chequeNumber, setChequeNumber] = useState("");
    const [chequeDate, setChequeDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [chequeNote, setChequeNote] = useState("");
    const [chequeSubmitting, setChequeSubmitting] = useState(false);



    const [showLedgerModal, setShowLedgerModal] = useState(false);
    const [ledger, setLedger] = useState<CustomerLedger | null>(null);
    const [ledgerLoading, setLedgerLoading] = useState(false);


    const navigate = useNavigate();

    const openLedger = async () => {
        setShowLedgerModal(true);

        if (ledger) return; // already loaded this session

        try {
            setLedgerLoading(true);
            const data = await getCustomerLedger(id!);
            setLedger(data);
        } catch (error: any) {
            showToast(
                error?.response?.data?.message || "Failed to load ledger",
                "error"
            );
        } finally {
            setLedgerLoading(false);
        }
    };

    const getLedgerTypeBadge = (type: string) => {
        const map: Record<string, { label: string; color: string }> = {
            SALE: { label: "Sale", color: "bg-orange-100 text-orange-700" },
            PAYMENT: { label: "Payment", color: "bg-emerald-100 text-emerald-700" },
            RETURN: { label: "Return", color: "bg-blue-100 text-blue-700" },
            CANCELLATION: { label: "Cancellation", color: "bg-gray-100 text-gray-700" },
            CANCELLATION_REVERSAL: { label: "Reversal", color: "bg-gray-100 text-gray-500" },
            CHEQUE_PENDING: { label: "Cheque (Pending)", color: "bg-amber-100 text-amber-700" },
            CHEQUE_BOUNCED: { label: "Cheque (Bounced)", color: "bg-red-100 text-red-700" },
        };
        return map[type] || { label: type, color: "bg-gray-100 text-gray-600" };
    };

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

    // Compute cheque total from selected invoices
    const chequeTotal = invoices
        .filter((i) => selectedInvoiceIds.includes(i.Id))
        .reduce((sum, i) => sum + getNumber(i.BalanceAmount), 0);

    // Reset modal state
    const resetPaymentModal = () => {
        setAmount("");
        setPaymentMethod("cash");
        setSelectedInvoiceIds([]);
        setChequeNumber("");
        setChequeDate(new Date().toISOString().split("T")[0]);
        setChequeNote("");
    };

    // Handle cheque submission
    const handleRecordCheque = async () => {
        if (selectedInvoiceIds.length === 0) {
            showToast("Select at least one invoice", "error");
            return;
        }
        if (!chequeNumber.trim()) {
            showToast("Cheque number is required", "error");
            return;
        }
        if (!chequeDate) {
            showToast("Cheque date is required", "error");
            return;
        }

        try {
            setChequeSubmitting(true);
            await recordBulkCreditCheque({
                saleIds: selectedInvoiceIds,
                chequeNumber: chequeNumber.trim(),
                chequeDate,
                note: chequeNote.trim() || undefined,
            });

            showToast(
                `Cheque recorded — Rs ${formatNumber(chequeTotal)} across ${selectedInvoiceIds.length} invoice(s)`,
                "success"
            );

            setShowPaymentModal(false);
            resetPaymentModal();
            await load();
        } catch (error: any) {
            showToast(
                error?.response?.data?.message || "Failed to record cheque",
                "error"
            );
        } finally {
            setChequeSubmitting(false);
        }
    };


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


    const totalBalance = invoices.reduce(
        (sum, i) => sum + getNumber(i.BalanceAmount),
        0
    );

    const handlePayCredit = async () => {
        const paymentAmount =
            typeof amount === "string" ? parseFloat(amount) : amount;

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
                paymentMethod: "cash", // Assuming cash for this function
            });

            showToast("Payment successful!", "success");
            setShowPaymentModal(false);
            resetPaymentModal();
            await load();
        } catch (error: any) {
            showToast(error?.response?.data?.message || "Payment failed", "error");
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
        if (status === 2) {
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
                        <button
                            onClick={openLedger}
                            className=" bg-white border border-black/10 hover:bg-[#F3F6F4] text-[#14181C] p-3 rounded-2xl shadow-sm font-medium text-[14px] transition flex items-center justify-center gap-2"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                <path d="M9 12h6M9 16h6" />
                            </svg>
                            View Ledger
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
                                onClick={() => navigate(`/sales/${inv.Id}`)}
                                className="bg-white p-4 rounded-2xl shadow-sm border border-black/5 hover:shadow-md hover:border-[#0B6E4F]/30 cursor-pointer transition"
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
            {/* PAYMENT MODAL */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4 shadow-xl">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-[#14181C]">
                                Record Payment
                            </h2>
                            <button
                                onClick={() => {
                                    setShowPaymentModal(false);
                                    resetPaymentModal();
                                }}
                                className="text-black/30 hover:text-black/60"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Customer info */}
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm space-y-1">
                            <div className="flex justify-between">
                                <span className="text-black/60">Customer</span>
                                <span className="font-medium">{customer.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-black/60">Outstanding</span>
                                <span className="font-bold text-red-600">
                                    Rs {formatNumber(totalBalance)}
                                </span>
                            </div>
                        </div>

                        {/* Method tabs */}
                        <div className="flex border border-gray-300 rounded-xl overflow-hidden">
                            <button
                                onClick={() => setPaymentMethod("cash")}
                                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${paymentMethod === "cash"
                                    ? "bg-[#0B6E4F] text-white"
                                    : "text-gray-600 hover:bg-gray-100"
                                    }`}
                            >
                                Cash
                            </button>
                            <div className="w-px bg-gray-300" />
                            <button
                                onClick={() => setPaymentMethod("cheque")}
                                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${paymentMethod === "cheque"
                                    ? "bg-[#4338CA] text-white"
                                    : "text-gray-600 hover:bg-gray-100"
                                    }`}
                            >
                                Cheque
                            </button>
                        </div>

                        {/* ================= CASH TAB ================= */}
                        {paymentMethod === "cash" && (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-[13px] text-black/60 font-medium block mb-1">
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
                                    <button
                                        type="button"
                                        onClick={() => setAmount(totalBalance)}
                                        className="mt-1 text-xs text-[#0B6E4F] font-medium hover:underline"
                                    >
                                        Pay full balance (Rs {formatNumber(totalBalance)})
                                    </button>
                                </div>

                                <button
                                    onClick={handlePayCredit}
                                    className="w-full bg-[#0B6E4F] hover:bg-[#0A5F44] text-white p-3 rounded-xl font-semibold transition"
                                >
                                    Record Cash Payment
                                </button>
                            </div>
                        )}

                        {/* ================= CHEQUE TAB ================= */}
                        {paymentMethod === "cheque" && (
                            <div className="space-y-3">
                                {/* Invoice picker */}
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[13px] text-black/60 font-medium">
                                            Select Invoices
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const unpaid = invoices.filter(
                                                    (i) => getNumber(i.BalanceAmount) > 0
                                                );
                                                const allSelected =
                                                    selectedInvoiceIds.length ===
                                                    unpaid.length;
                                                setSelectedInvoiceIds(
                                                    allSelected
                                                        ? []
                                                        : unpaid.map((i) => i.Id)
                                                );
                                            }}
                                            className="text-xs text-[#4338CA] font-medium hover:underline"
                                        >
                                            {selectedInvoiceIds.length ===
                                                invoices.filter(
                                                    (i) => getNumber(i.BalanceAmount) > 0
                                                ).length
                                                ? "Clear All"
                                                : "Select All"}
                                        </button>
                                    </div>

                                    <div className="border border-black/10 rounded-xl max-h-56 overflow-y-auto bg-[#FAFAF8]">
                                        {invoices.filter(
                                            (i) => getNumber(i.BalanceAmount) > 0
                                        ).length === 0 ? (
                                            <p className="p-4 text-center text-sm text-black/40">
                                                No unpaid invoices
                                            </p>
                                        ) : (
                                            invoices
                                                .filter(
                                                    (i) => getNumber(i.BalanceAmount) > 0
                                                )
                                                .map((inv) => {
                                                    const balance = getNumber(
                                                        inv.BalanceAmount
                                                    );
                                                    const checked =
                                                        selectedInvoiceIds.includes(
                                                            inv.Id
                                                        );
                                                    return (
                                                        <label
                                                            key={inv.Id}
                                                            className={`flex items-center gap-3 p-3 border-b border-black/5 last:border-0 cursor-pointer hover:bg-white transition ${checked
                                                                ? "bg-blue-50/40"
                                                                : ""
                                                                }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={checked}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedInvoiceIds(
                                                                            (prev) => [
                                                                                ...prev,
                                                                                inv.Id,
                                                                            ]
                                                                        );
                                                                    } else {
                                                                        setSelectedInvoiceIds(
                                                                            (prev) =>
                                                                                prev.filter(
                                                                                    (x) =>
                                                                                        x !==
                                                                                        inv.Id
                                                                                )
                                                                        );
                                                                    }
                                                                }}
                                                                className="w-4 h-4 accent-[#4338CA]"
                                                            />
                                                            <div className="flex-1">
                                                                <p className="font-mono text-sm font-medium">
                                                                    {inv.InvoiceNumber}
                                                                </p>
                                                                <p className="text-xs text-black/40">
                                                                    {new Date(
                                                                        inv.CreatedAt
                                                                    ).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            <span className="font-mono font-semibold text-red-600 text-sm">
                                                                Rs {formatNumber(balance)}
                                                            </span>
                                                        </label>
                                                    );
                                                })
                                        )}
                                    </div>
                                </div>

                                {/* Computed total */}
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex justify-between items-center">
                                    <span className="text-sm font-medium text-blue-900">
                                        Cheque Amount ({selectedInvoiceIds.length}{" "}
                                        invoice
                                        {selectedInvoiceIds.length === 1 ? "" : "s"})
                                    </span>
                                    <span className="font-mono font-bold text-lg text-blue-900">
                                        Rs {formatNumber(chequeTotal)}
                                    </span>
                                </div>

                                {/* Cheque fields */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[13px] text-black/60 font-medium block mb-1">
                                            Cheque Number *
                                        </label>
                                        <input
                                            type="text"
                                            value={chequeNumber}
                                            onChange={(e) =>
                                                setChequeNumber(e.target.value)
                                            }
                                            placeholder="e.g. 123456"
                                            className="w-full border border-black/10 bg-[#FAFAF8] p-3 rounded-xl font-mono text-sm outline-none focus:ring-2 focus:ring-[#4338CA]/30 focus:border-[#4338CA] transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[13px] text-black/60 font-medium block mb-1">
                                            Cheque Date *
                                        </label>
                                        <input
                                            type="date"
                                            value={chequeDate}
                                            onChange={(e) =>
                                                setChequeDate(e.target.value)
                                            }
                                            className="w-full border border-black/10 bg-[#FAFAF8] p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4338CA]/30 focus:border-[#4338CA] transition"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[13px] text-black/60 font-medium block mb-1">
                                        Note (optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={chequeNote}
                                        onChange={(e) => setChequeNote(e.target.value)}
                                        placeholder="e.g. Post-dated cheque"
                                        className="w-full border border-black/10 bg-[#FAFAF8] p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#4338CA]/30 focus:border-[#4338CA] transition"
                                    />
                                </div>

                                <button
                                    onClick={handleRecordCheque}
                                    disabled={
                                        selectedInvoiceIds.length === 0 ||
                                        !chequeNumber.trim() ||
                                        !chequeDate ||
                                        chequeSubmitting
                                    }
                                    className="w-full bg-[#4338CA] hover:bg-[#372FA6] text-white p-3 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {chequeSubmitting
                                        ? "Recording..."
                                        : `Record Cheque — Rs ${formatNumber(chequeTotal)}`}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showLedgerModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-xl flex flex-col">
                        {/* Header */}
                        <div className="p-4 sm:p-5 border-b border-black/5 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-[#14181C]">
                                    Customer Ledger
                                </h2>
                                <p className="text-[12px] text-black/40 mt-0.5">
                                    {customer.name} • {customer.phone}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowLedgerModal(false)}
                                className="text-black/30 hover:text-black/60 transition text-lg leading-none"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Body */}
                        <div className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-4">
                            {ledgerLoading && (
                                <div className="space-y-2">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="h-10 rounded-lg bg-black/5 animate-pulse" />
                                    ))}
                                </div>
                            )}

                            {!ledgerLoading && ledger && (
                                <>
                                    {/* Summary cards */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                                            <p className="text-[10px] font-semibold tracking-widest text-black/40 uppercase">
                                                Total Invoiced
                                            </p>
                                            <p className="font-mono font-bold text-[15px] text-orange-700 mt-1">
                                                Rs {ledger.summary.totalCredit.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                                            <p className="text-[10px] font-semibold tracking-widest text-black/40 uppercase">
                                                Total Paid
                                            </p>
                                            <p className="font-mono font-bold text-[15px] text-emerald-700 mt-1">
                                                Rs {ledger.summary.totalDebit.toLocaleString()}
                                            </p>
                                        </div>
                                        <div
                                            className={`rounded-xl p-3 border ${ledger.summary.balance > 0
                                                ? "bg-red-50 border-red-200"
                                                : "bg-emerald-50 border-emerald-200"
                                                }`}
                                        >
                                            <p className="text-[10px] font-semibold tracking-widest text-black/40 uppercase">
                                                Balance
                                            </p>
                                            <p
                                                className={`font-mono font-bold text-[15px] mt-1 ${ledger.summary.balance > 0
                                                    ? "text-red-700"
                                                    : "text-emerald-700"
                                                    }`}
                                            >
                                                Rs {ledger.summary.balance.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Ledger table */}
                                    {ledger.entries.length === 0 ? (
                                        <div className="py-10 text-center text-black/30 text-sm">
                                            No ledger entries yet
                                        </div>
                                    ) : (
                                        <div className="border border-black/5 rounded-xl overflow-hidden">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-[13px]">
                                                    <thead className="bg-gray-50 border-b border-black/5">
                                                        <tr>
                                                            <th className="px-3 py-2.5 text-left font-semibold text-[11px] uppercase tracking-widest text-black/40">
                                                                Date
                                                            </th>
                                                            <th className="px-3 py-2.5 text-left font-semibold text-[11px] uppercase tracking-widest text-black/40">
                                                                Type
                                                            </th>
                                                            <th className="px-3 py-2.5 text-right font-semibold text-[11px] uppercase tracking-widest text-black/40">
                                                                Debit
                                                            </th>
                                                            <th className="px-3 py-2.5 text-right font-semibold text-[11px] uppercase tracking-widest text-black/40">
                                                                Credit
                                                            </th>
                                                            <th className="px-3 py-2.5 text-right font-semibold text-[11px] uppercase tracking-widest text-black/40">
                                                                Balance
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {(() => {
                                                            let running = 0;
                                                            return ledger.entries.map((e) => {
                                                                running += e.credit - e.debit;
                                                                const badge = getLedgerTypeBadge(e.type);
                                                                return (
                                                                    <tr
                                                                        key={e.id}
                                                                        className="border-b border-black/5 last:border-0 hover:bg-[#FAFAF8] transition"
                                                                    >
                                                                        <td className="px-3 py-2.5 text-black/60 whitespace-nowrap">
                                                                            {new Date(e.date).toLocaleDateString("en-GB", {
                                                                                day: "2-digit",
                                                                                month: "short",
                                                                                year: "numeric",
                                                                            })}
                                                                        </td>
                                                                        <td className="px-3 py-2.5">
                                                                            <span
                                                                                className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${badge.color}`}
                                                                            >
                                                                                {badge.label}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-3 py-2.5 text-right font-mono text-emerald-600">
                                                                            {e.debit > 0
                                                                                ? `Rs ${e.debit.toLocaleString()}`
                                                                                : "—"}
                                                                        </td>
                                                                        <td className="px-3 py-2.5 text-right font-mono text-orange-600">
                                                                            {e.credit > 0
                                                                                ? `Rs ${e.credit.toLocaleString()}`
                                                                                : "—"}
                                                                        </td>
                                                                        <td
                                                                            className={`px-3 py-2.5 text-right font-mono font-semibold ${running > 0
                                                                                ? "text-red-600"
                                                                                : "text-black/60"
                                                                                }`}
                                                                        >
                                                                            Rs {running.toLocaleString()}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            });
                                                        })()}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    <p className="text-[11px] text-black/40 text-center italic">
                                        Credit increases what the customer owes • Debit reduces it
                                    </p>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-black/5 flex justify-end">
                            <button
                                onClick={() => setShowLedgerModal(false)}
                                className="px-4 py-2.5 bg-[#F3F6F4] hover:bg-[#E7ECE9] text-black/70 rounded-xl font-medium text-[14px] transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}