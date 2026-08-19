import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getSupplierLedger } from "../api/supplierApi";
interface Invoice {
    id: string;
    invoiceNumber: string;
    grandTotal: number;
    paidAmount: number;
    balanceAmount: number;
    purchaseDate: string;
}

interface Payment {

    id: string;

    purchaseId: string;

    amount: number;

    paymentMethod: string;

    paidAt: string;

    status?: string | null;

    cashLedgerPosted?: boolean;

    chequeNumber?: string | null;

    chequeDate?: string | null;

    clearedAt?: string | null;

    notes?: string | null;
    purchases?: {
        InvoiceNumber: string;
    }
}

export default function SupplierLedger() {
    const { id } = useParams();

    const [supplier, setSupplier] = useState<any>(null);
    const [summary, setSummary] = useState<any>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    const [tab, setTab] = useState<"ledger" | "payments">("ledger");

    useEffect(() => {
        load();
    }, [id]);

    const load = async () => {
        try {
            setLoading(true);
            const data = await getSupplierLedger(id!);


            setSupplier(data.supplier);

            setSummary(data.summary);

            setInvoices(data.invoices);

            setPayments(data.payments);

        } catch (err) {
            console.error("Ledger load failed:", err);
        } finally {
            setLoading(false);
        }
    };

    const formatMoney = (v: number) =>
        new Intl.NumberFormat("en-LK", {
            style: "currency",
            currency: "LKR",
        }).format(v);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#EEF1EF] p-4 md:p-6 font-sans">
                <div className="max-w-3xl mx-auto space-y-3">
                    <div className="h-32 rounded-2xl bg-black/5 animate-pulse" />
                    <div className="h-10 rounded-xl bg-black/5 animate-pulse w-56" />
                    <div className="h-24 rounded-2xl bg-black/5 animate-pulse" />
                    <div className="h-24 rounded-2xl bg-black/5 animate-pulse" />
                </div>
            </div>
        );
    }

    if (!supplier) {
        return (
            <div className="min-h-screen bg-[#EEF1EF] p-4 md:p-6 font-sans flex items-center justify-center">
                <p className="text-black/40 text-sm">Supplier not found</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#EEF1EF] p-4 md:p-6 font-sans text-[#14181C]">
            <div className="max-w-3xl mx-auto space-y-5">

                {/* HEADER */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-black/5 relative overflow-hidden">
                    <div className="absolute left-0 top-0 h-full w-1 bg-[#4338CA]" />

                    <h2 className="text-xl font-bold">{supplier.name}</h2>
                    <p className="text-black/40 font-mono text-[13px] mt-0.5">{supplier.phone}</p>

                    {/* SAFE SUMMARY */}
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <p className="text-[10px] font-semibold tracking-widest text-black/40 uppercase">
                                Total purchases
                            </p>
                            <p className="font-mono font-semibold text-[16px] mt-0.5">
                                {formatMoney(summary?.totalPurchases || 0)}
                            </p>
                        </div>

                        <div>
                            <p className="text-[10px] font-semibold tracking-widest text-black/40 uppercase">
                                Total paid
                            </p>
                            <p className="font-mono font-semibold text-[16px] mt-0.5 text-[#0B6E4F]">
                                {formatMoney(summary?.totalPaid || 0)}
                            </p>
                        </div>

                        <div>
                            <p className="text-[10px] font-semibold tracking-widest text-black/40 uppercase">
                                Outstanding
                            </p>
                            <p className="font-mono font-bold text-[16px] mt-0.5 text-red-600">
                                {formatMoney(summary?.totalOutstanding || 0)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* TABS */}
                <div className="flex bg-white rounded-xl p-1 border border-black/5 shadow-sm w-full sm:w-fit">
                    <button
                        onClick={() => setTab("ledger")}
                        className={`px-4 py-2 rounded-lg text-[13px] font-medium cursor-pointer transition flex-1 sm:flex-none ${tab === "ledger" ? "bg-[#14181C] text-white" : "text-black/50 hover:text-black/70"
                            }`}
                    >
                        Invoices
                    </button>

                    <button
                        onClick={() => setTab("payments")}
                        className={`px-4 py-2 rounded-lg text-[13px] font-medium cursor-pointer transition flex-1 sm:flex-none ${tab === "payments" ? "bg-[#14181C] text-white" : "text-black/50 hover:text-black/70"
                            }`}
                    >
                        Payments
                    </button>
                </div>

                {/* INVOICES */}
                {tab === "ledger" && (
                    <div className="space-y-2.5">
                        {invoices.length === 0 && (
                            <div className="bg-white rounded-2xl border border-black/5 py-12 text-center text-black/30 text-sm">
                                No invoices
                            </div>
                        )}

                        {invoices.map((inv) => (
                            <div
                                key={inv.id}
                                className="bg-white p-4 rounded-2xl shadow-sm border border-black/5"
                            >
                                <div className="flex justify-between items-start gap-3">
                                    <div>
                                        <p className="font-medium text-[14px] font-mono">
                                            {inv.invoiceNumber}
                                        </p>
                                        <p className="text-[12px] text-black/40 mt-0.5">
                                            {new Date(
                                                inv.purchaseDate
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <p className="text-[12px] text-black/40">
                                            Total <span className="font-mono text-black/70">{formatMoney(inv.grandTotal)}</span>
                                        </p>
                                        <p className="text-[12px] text-black/40">
                                            Paid <span className="font-mono text-[#0B6E4F]">{formatMoney(inv.paidAmount)}</span>
                                        </p>
                                        <p className="font-mono font-bold text-[14px] text-red-600 mt-0.5">
                                            {formatMoney(inv.balanceAmount)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* PAYMENTS */}
                {tab === "payments" && (
                    <div className="space-y-2.5">

                        {payments.length === 0 && (
                            <div className="bg-white rounded-2xl border border-black/5 py-12 text-center text-black/30 text-sm">
                                No payments
                            </div>
                        )}

                        {payments.map((p) => (
                            <div
                                key={p.id}
                                className="bg-white p-4 rounded-2xl shadow-sm border border-black/5"
                            >
                                <div className="flex justify-between items-start gap-3">

                                    <div>
                                        <p className="font-medium text-[14px] font-mono">
                                            Purchase: {p.purchases?.InvoiceNumber ?? "N/A"}
                                        </p>

                                        <p className="text-[11px] text-black/40 mt-0.5">
                                            {new Date(p.paidAt).toLocaleString()}
                                        </p>

                                        {/* CHEQUE INFO */}
                                        {p.paymentMethod === "Cheque" && (
                                            <div className="text-[11px] text-black/50 mt-2 space-y-0.5">
                                                <p>Cheque #: <span className="font-mono">{p.chequeNumber || "-"}</span></p>
                                                <p>
                                                    Cheque date:{" "}
                                                    <span className="font-mono">
                                                        {p.chequeDate
                                                            ? new Date(
                                                                p.chequeDate
                                                            ).toLocaleDateString()
                                                            : "-"}
                                                    </span>
                                                </p>
                                                <span className={`inline-block mt-1 text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full ${p.status === "Cleared"
                                                    ? "bg-[#0B6E4F]/10 text-[#0B6E4F]"
                                                    : "bg-amber-50 text-amber-600"
                                                    }`}>
                                                    {p.status || "Pending"}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-right shrink-0">
                                        <p className="font-mono font-bold text-[15px] text-[#0B6E4F]">
                                            {formatMoney(p.amount)}
                                        </p>
                                        <p className="text-[11px] text-black/40 mt-0.5">
                                            {p.paymentMethod}
                                        </p>

                                        {p.clearedAt && (
                                            <p className="text-[11px] text-[#4338CA] mt-1">
                                                Cleared:{" "}
                                                {new Date(
                                                    p.clearedAt
                                                ).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>

                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}