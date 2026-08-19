import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/axios";
import { getSupplierDetails } from "../api/supplierApi";

interface Purchase {
    id: string;
    invoiceNumber: string;
    grandTotal: number;
    paidAmount: number;
    balanceAmount: number;
    purchaseDate: string;
}

interface Supplier {
    id: string;
    name: string;
    phone: string;
    purchases: Purchase[];
}

export default function SupplierDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState<Supplier | null>(null);
    const [loading, setLoading] = useState(true);

    const [tab, setTab] = useState<"overview" | "invoices" | "payments">("overview");

    const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
    const [payAmount, setPayAmount] = useState<number>(0);

    const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Cheque">("Cash");

    const [chequeNumber, setChequeNumber] = useState("");
    const [chequeDate, setChequeDate] = useState("");

    useEffect(() => {
        load();
    }, [id]);

    const load = async () => {
        try {
            setLoading(true);
            if (!id) return;


            const data = await getSupplierDetails(id);
            setData(data);
        } catch (err) {
            console.error(err);
            alert("Supplier not found");
        } finally {
            setLoading(false);
        }
    };

    const totalOutstanding =
        data?.purchases?.reduce((sum, p) => sum + (p.balanceAmount || 0), 0) || 0;

    const resetForm = () => {
        setPayAmount(0);
        setSelectedPurchaseId(null);
        setChequeNumber("");
        setChequeDate("");
    };

    const paySupplier = async () => {
        if (!selectedPurchaseId) return alert("Select invoice");
        if (payAmount <= 0) return alert("Enter valid amount");

        if (paymentMethod === "Cheque") {
            if (!chequeNumber) return alert("Enter cheque number");
            if (!chequeDate) return alert("Select cheque date");
        }

        try {
            await api.post("/suppliers/pay", {
                purchaseId: selectedPurchaseId,
                amount: payAmount,
                paymentMethod: paymentMethod,
                chequeNumber: paymentMethod === "Cheque" ? chequeNumber : null,
                chequeDate: paymentMethod === "Cheque" ? chequeDate : null
            });

            resetForm();
            load();
            alert("Payment successful");
        } catch (err: any) {
            console.error(err);
            alert(err?.response?.data || "Payment failed");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#EEF1EF] p-4 md:p-6 font-sans">
                <div className="max-w-3xl mx-auto space-y-3">
                    <div className="h-28 rounded-2xl bg-black/5 animate-pulse" />
                    <div className="h-10 rounded-xl bg-black/5 animate-pulse w-64" />
                    <div className="h-32 rounded-2xl bg-black/5 animate-pulse" />
                </div>
            </div>
        );
    }

    if (!data) {
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-black/5">

                    <div>
                        <h2 className="text-xl font-bold">{data.name}</h2>
                        <p className="text-black/40 font-mono text-[13px] mt-0.5">{data.phone}</p>

                        <div className="mt-3 inline-flex flex-col">
                            <span className="text-[10px] font-semibold tracking-widest text-black/40 uppercase">
                                Outstanding
                            </span>
                            <span
                                className={`font-mono font-bold text-2xl tabular-nums ${totalOutstanding > 0 ? "text-red-600" : "text-[#0B6E4F]"
                                    }`}
                            >
                                Rs {totalOutstanding}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate(`/suppliers/${data.id}/ledger`)}
                        className="bg-[#14181C] hover:bg-black text-white px-4 py-2.5 rounded-xl font-medium text-[14px] cursor-pointer transition shrink-0"
                    >
                        View ledger
                    </button>

                </div>

                {/* TABS */}
                <div className="flex bg-white rounded-xl p-1 border border-black/5 shadow-sm w-full sm:w-fit">
                    <button
                        onClick={() => setTab("overview")}
                        className={`px-4 py-2 rounded-lg text-[13px] font-medium cursor-pointer transition flex-1 sm:flex-none ${tab === "overview" ? "bg-[#14181C] text-white" : "text-black/50 hover:text-black/70"
                            }`}
                    >
                        Overview
                    </button>

                    <button
                        onClick={() => setTab("invoices")}
                        className={`px-4 py-2 rounded-lg text-[13px] font-medium cursor-pointer transition flex-1 sm:flex-none ${tab === "invoices" ? "bg-[#14181C] text-white" : "text-black/50 hover:text-black/70"
                            }`}
                    >
                        Invoices
                    </button>

                    <button
                        onClick={() => setTab("payments")}
                        className={`px-4 py-2 rounded-lg text-[13px] font-medium cursor-pointer transition flex-1 sm:flex-none ${tab === "payments" ? "bg-[#0B6E4F] text-white" : "text-black/50 hover:text-black/70"
                            }`}
                    >
                        Pay
                    </button>
                </div>

                {/* OVERVIEW */}
                {tab === "overview" && (
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-black/5 grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                                Total purchases
                            </p>
                            <p className="font-mono text-2xl font-semibold mt-1">
                                {data.purchases.length}
                            </p>
                        </div>

                        <div>
                            <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                                Pending
                            </p>
                            <p className="font-mono text-2xl font-semibold mt-1 text-red-600">
                                {data.purchases.filter(p => p.balanceAmount > 0).length}
                            </p>
                        </div>
                    </div>
                )}

                {/* INVOICES */}
                {tab === "invoices" && (
                    <div className="space-y-2.5">
                        {data.purchases.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-black/5 py-12 text-center text-black/30 text-sm">
                                No invoices for this supplier
                            </div>
                        ) : (
                            data.purchases.map((p) => (
                                <div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm border border-black/5 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="font-medium text-[14px] font-mono">{p.invoiceNumber}</p>
                                        <p className="text-[12px] text-black/40 mt-0.5">
                                            {new Date(p.purchaseDate).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <p className="text-[12px] text-black/40">
                                            Total <span className="font-mono text-black/70">Rs {p.grandTotal}</span>
                                        </p>
                                        <p className="text-[12px] text-black/40">
                                            Paid <span className="font-mono text-black/70">Rs {p.paidAmount}</span>
                                        </p>
                                        <p className="font-mono font-bold text-[14px] text-red-600 mt-0.5">
                                            Rs {p.balanceAmount}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* PAY */}
                {tab === "payments" && (
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-black/5 space-y-3">

                        <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                            Pay supplier
                        </p>

                        {/* Invoice */}
                        <select
                            className="w-full border border-black/10 bg-[#FAFAF8] p-3 rounded-xl cursor-pointer text-[14px] outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                            value={selectedPurchaseId || ""}
                            onChange={(e) => setSelectedPurchaseId(e.target.value)}
                        >
                            <option value="">Select invoice</option>
                            {data.purchases
                                .filter(p => p.balanceAmount > 0)
                                .map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.invoiceNumber} (Balance: {p.balanceAmount})
                                    </option>
                                ))}
                        </select>

                        {/* Amount */}
                        <input
                            type="number"
                            value={payAmount}
                            onChange={(e) => setPayAmount(Number(e.target.value))}
                            placeholder="Amount"
                            className="w-full border border-black/10 bg-[#FAFAF8] p-3 rounded-xl cursor-text font-mono text-[15px] outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                        />

                        {/* Payment Method */}
                        <select
                            value={paymentMethod}
                            onChange={(e) =>
                                setPaymentMethod(e.target.value as "Cash" | "Cheque")
                            }
                            className="w-full border border-black/10 bg-[#FAFAF8] p-3 rounded-xl cursor-pointer text-[14px] outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                        >
                            <option value="Cash">Cash</option>
                            <option value="Cheque">Cheque</option>
                        </select>

                        {/* CHEQUE FIELDS */}
                        {paymentMethod === "Cheque" && (
                            <>
                                <input
                                    type="text"
                                    value={chequeNumber}
                                    onChange={(e) => setChequeNumber(e.target.value)}
                                    placeholder="Cheque number"
                                    className="w-full border border-black/10 bg-[#FAFAF8] p-3 rounded-xl cursor-text text-[14px] outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                                />

                                <input
                                    type="date"
                                    value={chequeDate}
                                    onChange={(e) => setChequeDate(e.target.value)}
                                    className="w-full border border-black/10 bg-[#FAFAF8] p-3 rounded-xl cursor-pointer text-[14px] outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                                />
                            </>
                        )}

                        {/* BUTTON */}
                        <button
                            onClick={paySupplier}
                            className="w-full bg-[#0B6E4F] hover:bg-[#0A5F44] text-white p-3.5 rounded-2xl font-semibold tracking-wide cursor-pointer transition shadow-sm"
                        >
                            Pay
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}