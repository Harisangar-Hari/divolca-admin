// src/pages/SupplierDetails.tsx
import { useEffect, useMemo, useState } from "react";
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
    email?: string;
    address?: string;
    advanceBalance: number;      // ✅ NEW
    pendingAdvance: number;
    purchases: Purchase[];
}

export default function SupplierDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState<Supplier | null>(null);
    const [loading, setLoading] = useState(true);

    const [tab, setTab] = useState<"overview" | "invoices" | "payments">(
        "overview"
    );

    // ============================
    // PAYMENT STATE
    // ============================
    const [payMode, setPayMode] = useState<"auto" | "select">("auto");
    const [selectedPurchaseIds, setSelectedPurchaseIds] = useState<string[]>(
        []
    );
    const [payAmountInput, setPayAmountInput] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Cheque">(
        "Cash"
    );
    const [chequeNumber, setChequeNumber] = useState("");
    const [chequeDate, setChequeDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [payNotes, setPayNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // ============================
    // LOAD
    // ============================
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
        data?.purchases?.reduce(
            (sum, p) => sum + (p.balanceAmount || 0),
            0
        ) || 0;

    // ============================
    // DERIVED
    // ============================
    const unpaidPurchases = useMemo(
        () => (data?.purchases || []).filter((p) => p.balanceAmount > 0),
        [data]
    );

    const totalUnpaid = useMemo(
        () =>
            unpaidPurchases.reduce((s, p) => s + p.balanceAmount, 0),
        [unpaidPurchases]
    );

    const selectedTotal = useMemo(
        () =>
            unpaidPurchases
                .filter((p) => selectedPurchaseIds.includes(p.id))
                .reduce((s, p) => s + p.balanceAmount, 0),
        [unpaidPurchases, selectedPurchaseIds]
    );

    // Pool used for the allocation preview
    const allocationPool = useMemo(
        () =>
            payMode === "select"
                ? unpaidPurchases.filter((p) =>
                    selectedPurchaseIds.includes(p.id)
                )
                : unpaidPurchases,
        [payMode, unpaidPurchases, selectedPurchaseIds]
    );

    // FIFO allocation preview
    const allocationPreview = useMemo(() => {
        const sorted = [...allocationPool].sort(
            (a, b) =>
                new Date(a.purchaseDate).getTime() -
                new Date(b.purchaseDate).getTime()
        );

        let remaining = payAmountInput;
        const rows: Array<{ invoice: string; amount: number }> = [];

        for (const p of sorted) {
            if (remaining <= 0) break;
            const alloc = Math.min(p.balanceAmount, remaining);
            rows.push({ invoice: p.invoiceNumber, amount: alloc });
            remaining -= alloc;
        }

        return { rows, advance: remaining };
    }, [allocationPool, payAmountInput]);

    // ============================
    // HANDLERS
    // ============================
    const resetForm = () => {
        setPayMode("auto");
        setSelectedPurchaseIds([]);
        setPayAmountInput(0);
        setPaymentMethod("Cash");
        setChequeNumber("");
        setChequeDate(new Date().toISOString().split("T")[0]);
        setPayNotes("");
    };

    const paySupplier = async () => {
        if (payAmountInput <= 0) {
            alert("Enter a valid amount");
            return;
        }

        if (payMode === "select" && selectedPurchaseIds.length === 0) {
            alert("Select at least one invoice");
            return;
        }

        if (payMode === "auto" && unpaidPurchases.length === 0) {
            alert("No unpaid invoices to allocate");
            return;
        }

        if (paymentMethod === "Cheque") {
            if (!chequeNumber.trim()) {
                alert("Enter cheque number");
                return;
            }
            if (!chequeDate) {
                alert("Select cheque date");
                return;
            }
        }

        try {
            setSubmitting(true);

            const payload: any = {
                amount: payAmountInput,
                paymentMethod,
                notes: payNotes.trim() || undefined,
            };

            if (payMode === "select") {
                payload.purchaseIds = selectedPurchaseIds;
            } else {
                payload.supplierId = data?.id;
            }

            if (paymentMethod === "Cheque") {
                payload.chequeNumber = chequeNumber.trim();
                payload.chequeDate = chequeDate;
            }

            const res = await api.post("/suppliers/pay", payload);

            alert(res.data?.message || "Payment recorded successfully");
            resetForm();
            load();
        } catch (err: any) {
            console.error(err);
            alert(err?.response?.data?.message || "Payment failed");
        } finally {
            setSubmitting(false);
        }
    };

    // ============================
    // LOADING
    // ============================
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

    // ============================
    // RENDER
    // ============================
    return (
        <div className="min-h-screen bg-[#EEF1EF] p-4 md:p-6 font-sans text-[#14181C]">
            <div className="max-w-3xl mx-auto space-y-5">
                {/* HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-black/5">
                    <div>
                        <h2 className="text-xl font-bold">{data.name}</h2>
                        <p className="text-black/40 font-mono text-[13px] mt-0.5">
                            {data.phone}
                        </p>

                        <div className="mt-3 inline-flex flex-col">
                            <span className="text-[10px] font-semibold tracking-widest text-black/40 uppercase">
                                Outstanding
                            </span>
                            <span
                                className={`font-mono font-bold text-2xl tabular-nums ${totalOutstanding > 0
                                    ? "text-red-600"
                                    : "text-[#0B6E4F]"
                                    }`}
                            >
                                Rs {totalOutstanding.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={() =>
                            navigate(`/suppliers/${data.id}/ledger`)
                        }
                        className="bg-[#14181C] hover:bg-black text-white px-4 py-2.5 rounded-xl font-medium text-[14px] cursor-pointer transition shrink-0"
                    >
                        View ledger
                    </button>
                </div>

                {/* ✅ ADVANCE CARDS */}
                {(data.advanceBalance > 0 || data.pendingAdvance > 0) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {data.advanceBalance > 0 && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm">
                                <p className="text-[10px] tracking-widest uppercase text-black/50 font-semibold">
                                    Available Advance
                                </p>
                                <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-emerald-700">
                                    Rs {data.advanceBalance.toLocaleString()}
                                </p>
                                <p className="text-[11px] text-emerald-600 mt-0.5">
                                    Supplier owes you this amount
                                </p>
                            </div>
                        )}

                        {data.pendingAdvance > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm">
                                <p className="text-[10px] tracking-widest uppercase text-black/50 font-semibold">
                                    Pending Advance
                                </p>
                                <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-amber-700">
                                    Rs {data.pendingAdvance.toLocaleString()}
                                </p>
                                <p className="text-[11px] text-amber-600 mt-0.5">
                                    Awaiting cheque clearance
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* TABS */}
                <div className="flex bg-white rounded-xl p-1 border border-black/5 shadow-sm w-full sm:w-fit">
                    <button
                        onClick={() => setTab("overview")}
                        className={`px-4 py-2 rounded-lg text-[13px] font-medium cursor-pointer transition flex-1 sm:flex-none ${tab === "overview"
                            ? "bg-[#14181C] text-white"
                            : "text-black/50 hover:text-black/70"
                            }`}
                    >
                        Overview
                    </button>

                    <button
                        onClick={() => setTab("invoices")}
                        className={`px-4 py-2 rounded-lg text-[13px] font-medium cursor-pointer transition flex-1 sm:flex-none ${tab === "invoices"
                            ? "bg-[#14181C] text-white"
                            : "text-black/50 hover:text-black/70"
                            }`}
                    >
                        Invoices
                    </button>

                    <button
                        onClick={() => setTab("payments")}
                        className={`px-4 py-2 rounded-lg text-[13px] font-medium cursor-pointer transition flex-1 sm:flex-none ${tab === "payments"
                            ? "bg-[#0B6E4F] text-white"
                            : "text-black/50 hover:text-black/70"
                            }`}
                    >
                        Pay
                    </button>
                </div>

                {/* OVERVIEW */}
                {tab === "overview" && (
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-black/5 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
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
                                    {unpaidPurchases.length}
                                </p>
                            </div>
                        </div>

                        {/* ✅ Advance summary in overview */}
                        {(data.advanceBalance > 0 || data.pendingAdvance > 0) && (
                            <div className="pt-4 border-t border-black/5 grid grid-cols-2 gap-4">
                                {data.advanceBalance > 0 && (
                                    <div>
                                        <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                                            Available Advance
                                        </p>
                                        <p className="font-mono text-xl font-semibold mt-1 text-emerald-700">
                                            Rs {data.advanceBalance.toLocaleString()}
                                        </p>
                                    </div>
                                )}
                                {data.pendingAdvance > 0 && (
                                    <div>
                                        <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                                            Pending Advance
                                        </p>
                                        <p className="font-mono text-xl font-semibold mt-1 text-amber-700">
                                            Rs {data.pendingAdvance.toLocaleString()}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
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
                                <div
                                    key={p.id}
                                    className="bg-white p-4 rounded-2xl shadow-sm border border-black/5 flex items-center justify-between gap-3"
                                >
                                    <div>
                                        <p className="font-medium text-[14px] font-mono">
                                            {p.invoiceNumber}
                                        </p>
                                        <p className="text-[12px] text-black/40 mt-0.5">
                                            {new Date(
                                                p.purchaseDate
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <p className="text-[12px] text-black/40">
                                            Total{" "}
                                            <span className="font-mono text-black/70">
                                                Rs {p.grandTotal}
                                            </span>
                                        </p>
                                        <p className="text-[12px] text-black/40">
                                            Paid{" "}
                                            <span className="font-mono text-black/70">
                                                Rs {p.paidAmount}
                                            </span>
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
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-black/5 space-y-4">
                        <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                            Pay supplier
                        </p>

                        {/* Mode toggle */}
                        <div className="flex border border-black/10 rounded-xl overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setPayMode("auto")}
                                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition ${payMode === "auto"
                                    ? "bg-[#4338CA] text-white"
                                    : "text-gray-600 hover:bg-gray-100"
                                    }`}
                            >
                                Auto-allocate
                            </button>
                            <div className="w-px bg-gray-300" />
                            <button
                                type="button"
                                onClick={() => setPayMode("select")}
                                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition ${payMode === "select"
                                    ? "bg-[#4338CA] text-white"
                                    : "text-gray-600 hover:bg-gray-100"
                                    }`}
                            >
                                Select Invoices
                            </button>
                        </div>

                        {/* Invoice picker (select mode only) */}
                        {payMode === "select" && (
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-[13px] text-black/60 font-medium">
                                        Select Invoices
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const allSelected =
                                                selectedPurchaseIds.length ===
                                                unpaidPurchases.length;
                                            setSelectedPurchaseIds(
                                                allSelected
                                                    ? []
                                                    : unpaidPurchases.map(
                                                        (p) => p.id
                                                    )
                                            );
                                        }}
                                        className="text-xs text-[#4338CA] font-medium hover:underline"
                                    >
                                        {selectedPurchaseIds.length ===
                                            unpaidPurchases.length
                                            ? "Clear All"
                                            : "Select All"}
                                    </button>
                                </div>

                                <div className="border border-black/10 rounded-xl max-h-56 overflow-y-auto bg-[#FAFAF8]">
                                    {unpaidPurchases.length === 0 ? (
                                        <p className="p-4 text-center text-sm text-black/40">
                                            No unpaid invoices
                                        </p>
                                    ) : (
                                        unpaidPurchases.map((p) => {
                                            const checked =
                                                selectedPurchaseIds.includes(
                                                    p.id
                                                );
                                            return (
                                                <label
                                                    key={p.id}
                                                    className={`flex items-center gap-3 p-3 border-b border-black/5 last:border-0 cursor-pointer hover:bg-white transition ${checked
                                                        ? "bg-blue-50/40"
                                                        : ""
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={(e) => {
                                                            if (
                                                                e.target
                                                                    .checked
                                                            ) {
                                                                setSelectedPurchaseIds(
                                                                    (
                                                                        prev
                                                                    ) => [
                                                                            ...prev,
                                                                            p.id,
                                                                        ]
                                                                );
                                                            } else {
                                                                setSelectedPurchaseIds(
                                                                    (
                                                                        prev
                                                                    ) =>
                                                                        prev.filter(
                                                                            (
                                                                                x
                                                                            ) =>
                                                                                x !==
                                                                                p.id
                                                                        )
                                                                );
                                                            }
                                                        }}
                                                        className="w-4 h-4 accent-[#4338CA]"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-mono text-[13px] font-medium truncate">
                                                            {p.invoiceNumber}
                                                        </p>
                                                        <p className="text-[11px] text-black/40">
                                                            {new Date(
                                                                p.purchaseDate
                                                            ).toLocaleDateString(
                                                                "en-GB",
                                                                {
                                                                    day: "2-digit",
                                                                    month: "short",
                                                                    year: "numeric",
                                                                }
                                                            )}
                                                        </p>
                                                    </div>
                                                    <span className="font-mono font-semibold text-red-600 text-[13px] shrink-0">
                                                        Rs{" "}
                                                        {p.balanceAmount.toLocaleString()}
                                                    </span>
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Amount */}
                        <div>
                            <label className="text-[13px] text-black/60 font-medium block mb-1">
                                {paymentMethod === "Cash"
                                    ? "Cash Amount *"
                                    : "Cheque Amount *"}
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={payAmountInput || ""}
                                onChange={(e) =>
                                    setPayAmountInput(
                                        Number(e.target.value)
                                    )
                                }
                                placeholder="Enter amount"
                                className="w-full border border-black/10 bg-[#FAFAF8] p-3 rounded-xl font-mono text-[16px] outline-none focus:ring-2 focus:ring-[#4338CA]/30 focus:border-[#4338CA] transition"
                            />
                            <button
                                type="button"
                                onClick={() =>
                                    setPayAmountInput(
                                        payMode === "select"
                                            ? selectedTotal
                                            : totalUnpaid
                                    )
                                }
                                className="mt-1 text-xs text-[#4338CA] font-medium hover:underline"
                            >
                                Set to{" "}
                                {payMode === "select"
                                    ? "selected"
                                    : "full outstanding"}{" "}
                                total (Rs{" "}
                                {(payMode === "select"
                                    ? selectedTotal
                                    : totalUnpaid
                                ).toLocaleString()}
                                )
                            </button>
                        </div>

                        {/* Allocation preview */}
                        {payAmountInput > 0 &&
                            (payMode === "auto"
                                ? unpaidPurchases.length > 0
                                : selectedPurchaseIds.length > 0) && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-1">
                                    <p className="text-[11px] font-semibold text-blue-900 uppercase tracking-wider">
                                        Allocation Preview
                                    </p>
                                    {allocationPreview.rows.map((r) => (
                                        <div
                                            key={r.invoice}
                                            className="flex justify-between text-[12px] text-blue-900"
                                        >
                                            <span className="font-mono">
                                                {r.invoice}
                                            </span>
                                            <span className="font-mono">
                                                Rs{" "}
                                                {r.amount.toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                    {allocationPreview.advance > 0 && (
                                        <div className="flex justify-between text-[12px] text-amber-700 font-semibold border-t border-blue-200 pt-1 mt-1">
                                            <span>→ Advance (pending)</span>
                                            <span className="font-mono">
                                                Rs{" "}
                                                {allocationPreview.advance.toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                        {/* Payment method */}
                        <div>
                            <label className="text-[13px] text-black/60 font-medium block mb-1">
                                Payment Method
                            </label>
                            <select
                                value={paymentMethod}
                                onChange={(e) =>
                                    setPaymentMethod(
                                        e.target.value as "Cash" | "Cheque"
                                    )
                                }
                                className="w-full border border-black/10 bg-[#FAFAF8] p-3 rounded-xl cursor-pointer text-[14px] outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                            >
                                <option value="Cash">Cash</option>
                                <option value="Cheque">Cheque</option>
                            </select>
                        </div>

                        {/* Cheque fields */}
                        {paymentMethod === "Cheque" && (
                            <>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[13px] text-black/60 font-medium block mb-1">
                                            Cheque Number *
                                        </label>
                                        <input
                                            type="text"
                                            value={chequeNumber}
                                            onChange={(e) =>
                                                setChequeNumber(
                                                    e.target.value
                                                )
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

                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[12px] text-amber-800">
                                    💡 The cheque will be recorded as{" "}
                                    <strong>pending</strong>. Clear it from the
                                    Supplier Cheque Dashboard once the bank
                                    confirms.
                                </div>
                            </>
                        )}

                        {/* Notes */}
                        <div>
                            <label className="text-[13px] text-black/60 font-medium block mb-1">
                                Notes (optional)
                            </label>
                            <input
                                type="text"
                                value={payNotes}
                                onChange={(e) => setPayNotes(e.target.value)}
                                placeholder="Any remarks…"
                                className="w-full border border-black/10 bg-[#FAFAF8] p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                            />
                        </div>

                        {/* Submit */}
                        <button
                            onClick={paySupplier}
                            disabled={
                                submitting ||
                                payAmountInput <= 0 ||
                                (payMode === "select" &&
                                    selectedPurchaseIds.length === 0) ||
                                (payMode === "auto" &&
                                    unpaidPurchases.length === 0) ||
                                (paymentMethod === "Cheque" &&
                                    (!chequeNumber.trim() || !chequeDate))
                            }
                            className="w-full bg-[#0B6E4F] hover:bg-[#0A5F44] text-white p-3.5 rounded-2xl font-semibold tracking-wide cursor-pointer transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting
                                ? "Processing…"
                                : paymentMethod === "Cash"
                                    ? `Pay Rs ${payAmountInput.toLocaleString()} (Cash)`
                                    : `Record Cheque — Rs ${payAmountInput.toLocaleString()}`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}