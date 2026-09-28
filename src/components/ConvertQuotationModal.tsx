import { useEffect, useMemo, useState } from "react";
import { useToast } from "../store/toastStore";
import { getProducts } from "../api/productsApi";
import { getCreditCustomers } from "../api/customerApi";
import { getQuotationById, type Quotation } from "../api/quotationsApi";
import { checkoutSale } from "../api/salesApi";

interface Props {
    quotationId: string;
    onClose: () => void;
    onConverted: (saleId: string) => void;
}

interface LineState {
    productId: string;
    name: string;
    unitPrice: number;
    originalQty: number;
    qty: number;
    discountRs: number;         // per-unit Rs (frozen from quote)
    currentStock: number;
    removed: boolean;
}

export default function ConvertQuotationModal({
    quotationId,
    onClose,
    onConverted,
}: Props) {
    const { showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [quotation, setQuotation] = useState<Quotation | null>(null);
    const [lines, setLines] = useState<LineState[]>([]);

    const [customers, setCustomers] = useState<any[]>([]);
    const [customerSearch, setCustomerSearch] = useState("");
    const [selectedCustomerId, setSelectedCustomerId] = useState("");
    const [freeName, setFreeName] = useState("");
    const [freePhone, setFreePhone] = useState("");

    const [paymentMode, setPaymentMode] = useState<
        "cash" | "card" | "credit"
    >("cash");
    const [paidAmount, setPaidAmount] = useState<number>(0);

    // ---------- Load ----------
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const [quote, prods, custs] = await Promise.all([
                    getQuotationById(quotationId),
                    getProducts(),
                    getCreditCustomers(),
                ]);

                setQuotation(quote);
                setCustomers(custs);

                if (quote.CustomerId) {
                    setSelectedCustomerId(quote.CustomerId);
                } else {
                    setFreeName(quote.CustomerName || "");
                    setFreePhone(quote.CustomerPhone || "");
                }

                const stockMap = new Map<string, number>();
                (prods as any[]).forEach((p: any) =>
                    stockMap.set(p.id, Number(p.stockQty))
                );

                setLines(
                    quote.Items.map((it) => {
                        const stock = stockMap.get(it.ProductId) ?? 0;
                        const discountPerUnit =
                            it.Quantity > 0 ? it.Discount / it.Quantity : 0;
                        return {
                            productId: it.ProductId,
                            name: it.ProductName,
                            unitPrice: it.UnitPrice,
                            originalQty: it.Quantity,
                            qty: Math.min(it.Quantity, stock),
                            discountRs: discountPerUnit,
                            currentStock: stock,
                            removed: false,
                        };
                    })
                );
            } catch {
                showToast("Failed to load quotation", "error");
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quotationId]);

    // ---------- Derived ----------
    const activeLines = useMemo(
        () => lines.filter((l) => !l.removed),
        [lines]
    );

    const subTotal = useMemo(
        () => activeLines.reduce((s, l) => s + l.unitPrice * l.qty, 0),
        [activeLines]
    );

    const afterItemDiscount = useMemo(
        () =>
            activeLines.reduce(
                (s, l) => s + l.unitPrice * l.qty - l.discountRs * l.qty,
                0
            ),
        [activeLines]
    );

    // Preserve the original invoice discount % from the quote
    const invoiceDiscountPercent = useMemo(() => {
        if (!quotation) return 0;
        const originalAfterItem = quotation.Items.reduce(
            (s, it) => s + it.UnitPrice * it.Quantity - it.Discount,
            0
        );
        if (originalAfterItem === 0) return 0;
        return (
            (quotation.InvoiceDiscount / originalAfterItem) * 100
        );
    }, [quotation]);

    const invoiceDiscountAmount =
        (afterItemDiscount * invoiceDiscountPercent) / 100;

    const totalAmount = Math.max(
        0,
        afterItemDiscount - invoiceDiscountAmount
    );

    const balance = Math.max(0, totalAmount - paidAmount);
    const change = Math.max(0, paidAmount - totalAmount);

    const allLinesOk = activeLines.every(
        (l) => l.qty > 0 && l.qty <= l.currentStock
    );

    const filteredCustomers = useMemo(() => {
        const q = customerSearch.toLowerCase().trim();
        if (!q) return customers.slice(0, 20);
        return customers
            .filter(
                (c) =>
                    c.name.toLowerCase().includes(q) ||
                    c.phone.includes(q)
            )
            .slice(0, 20);
    }, [customers, customerSearch]);

    // ---------- Handlers ----------
    const updateLine = (productId: string, patch: Partial<LineState>) => {
        setLines((prev) =>
            prev.map((l) =>
                l.productId === productId ? { ...l, ...patch } : l
            )
        );
    };

    const removeLine = (productId: string) => {
        updateLine(productId, { removed: true });
    };

    const handleSubmit = async () => {
        if (!quotation) return;
        if (activeLines.length === 0) {
            showToast("Add at least one item", "error");
            return;
        }
        if (!allLinesOk) {
            showToast("Fix stock issues before converting", "error");
            return;
        }

        const payload: any = {
            quotationId: quotation.Id,
            items: activeLines.map((l) => ({
                productId: l.productId,
                quantity: l.qty,
                discount: l.discountRs,   // ✅ Rs (per-unit)
            })),
            invoiceDiscount: invoiceDiscountAmount,
            paymentMode,
        };

        if (paymentMode === "credit") {
            if (!selectedCustomerId) {
                showToast(
                    "Credit sales require a registered customer",
                    "error"
                );
                return;
            }
            payload.customerId = selectedCustomerId;
            payload.paidAmount = paidAmount;
        } else {
            payload.paidAmount = paidAmount;
            payload.customerId = selectedCustomerId || null;
            payload.customerName = !selectedCustomerId
                ? freeName.trim() || null
                : null;
            payload.customerPhone = !selectedCustomerId
                ? freePhone.trim() || null
                : null;
        }

        try {
            setSubmitting(true);
            const res = await checkoutSale(payload);
            showToast(
                `Sale created — ${res?.InvoiceNumber || ""}`,
                "success"
            );
            onConverted(res?.Id || res?.SaleId || "");
        } catch (err: any) {
            showToast(
                err?.response?.data?.message ||
                    err?.message ||
                    "Conversion failed",
                "error"
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Backdrop onClose={onClose}>
                <div className="p-10 text-center text-black/40">
                    Loading quotation…
                </div>
            </Backdrop>
        );
    }

    if (!quotation) {
        return (
            <Backdrop onClose={onClose}>
                <div className="p-10 text-center text-black/40">
                    Quotation not found
                </div>
            </Backdrop>
        );
    }

    const hasStockIssues = activeLines.some(
        (l) => l.qty > l.currentStock
    );

    return (
        <Backdrop onClose={onClose}>
            <div className="p-5 border-b border-black/5 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-[#14181C]">
                        Convert to Sale
                    </h2>
                    <p className="text-[12px] text-black/40 mt-0.5 font-mono">
                        {quotation.QuotationNumber}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="text-black/30 hover:text-black/60 text-lg leading-none"
                >
                    ✕
                </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-4">
                {hasStockIssues && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[13px] text-amber-800">
                        ⚠️ Some items are short on stock. Adjust quantities or
                        remove items before converting.
                    </div>
                )}

                <div>
                    <p className="text-[11px] font-semibold tracking-widest text-black/50 uppercase mb-2">
                        Items
                    </p>
                    <div className="border border-black/10 rounded-xl overflow-hidden">
                        <table className="w-full text-[13px]">
                            <thead className="bg-gray-50 border-b border-black/5">
                                <tr>
                                    <th className="px-3 py-2 text-left font-semibold text-[10px] uppercase tracking-widest text-black/40">
                                        Product
                                    </th>
                                    <th className="px-2 py-2 text-center font-semibold text-[10px] uppercase tracking-widest text-black/40 w-20">
                                        Quoted
                                    </th>
                                    <th className="px-2 py-2 text-center font-semibold text-[10px] uppercase tracking-widest text-black/40 w-20">
                                        Stock
                                    </th>
                                    <th className="px-2 py-2 text-center font-semibold text-[10px] uppercase tracking-widest text-black/40 w-24">
                                        Qty
                                    </th>
                                    <th className="px-3 py-2 text-right font-semibold text-[10px] uppercase tracking-widest text-black/40 w-24">
                                        Line
                                    </th>
                                    <th className="w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeLines.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="p-6 text-center text-black/30 text-sm"
                                        >
                                            All items removed
                                        </td>
                                    </tr>
                                ) : (
                                    activeLines.map((l) => {
                                        const lineTotal =
                                            l.unitPrice * l.qty -
                                            l.discountRs * l.qty;
                                        const isShort =
                                            l.qty > l.currentStock;
                                        const isOut = l.currentStock === 0;

                                        return (
                                            <tr
                                                key={l.productId}
                                                className={`border-b border-black/5 last:border-0 ${
                                                    isShort
                                                        ? "bg-red-50/40"
                                                        : ""
                                                }`}
                                            >
                                                <td className="px-3 py-2 font-medium">
                                                    {l.name}
                                                </td>
                                                <td className="px-2 py-2 text-center font-mono text-black/60">
                                                    {l.originalQty}
                                                </td>
                                                <td
                                                    className={`px-2 py-2 text-center font-mono font-semibold ${
                                                        isShort
                                                            ? "text-red-600"
                                                            : "text-emerald-600"
                                                    }`}
                                                >
                                                    {l.currentStock}
                                                </td>
                                                <td className="px-2 py-2">
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={l.currentStock}
                                                        value={l.qty}
                                                        onChange={(e) =>
                                                            updateLine(
                                                                l.productId,
                                                                {
                                                                    qty:
                                                                        Number(
                                                                            e
                                                                                .target
                                                                                .value
                                                                        ) || 1,
                                                                }
                                                            )
                                                        }
                                                        className={`w-full text-center border rounded px-1 py-1 text-sm font-mono ${
                                                            isShort
                                                                ? "border-red-400"
                                                                : "border-black/10"
                                                        }`}
                                                    />
                                                    {isShort && (
                                                        <p className="text-[9px] text-red-600 mt-0.5 text-center">
                                                            Max: {l.currentStock}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2 text-right font-mono font-semibold">
                                                    Rs{" "}
                                                    {lineTotal.toLocaleString()}
                                                </td>
                                                <td className="pr-2">
                                                    {isOut ? (
                                                        <button
                                                            onClick={() =>
                                                                removeLine(
                                                                    l.productId
                                                                )
                                                            }
                                                            className="text-red-500 hover:text-red-700 text-[10px] font-medium"
                                                        >
                                                            Remove
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() =>
                                                                removeLine(
                                                                    l.productId
                                                                )
                                                            }
                                                            className="text-gray-400 hover:text-red-500 text-sm"
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Customer */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
                    <p className="text-[11px] font-semibold tracking-widest text-black/50 uppercase">
                        Customer{paymentMode === "credit" && " *"}
                    </p>

                    <input
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        placeholder="Search existing customer…"
                        className="w-full border border-black/10 bg-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                    />

                    {customerSearch && (
                        <div className="max-h-40 overflow-y-auto border border-black/10 rounded-xl bg-white">
                            {filteredCustomers.length === 0 ? (
                                <p className="p-3 text-center text-xs text-black/40">
                                    No matches
                                </p>
                            ) : (
                                filteredCustomers.map((c) => (
                                    <button
                                        key={c.id}
                                        onClick={() => {
                                            setSelectedCustomerId(c.id);
                                            setCustomerSearch("");
                                            setFreeName("");
                                            setFreePhone("");
                                        }}
                                        className={`w-full text-left px-3 py-2 border-b border-black/5 last:border-0 hover:bg-gray-50 text-sm ${
                                            selectedCustomerId === c.id
                                                ? "bg-blue-50"
                                                : ""
                                        }`}
                                    >
                                        <p className="font-medium">
                                            {c.name}
                                        </p>
                                        <p className="text-[11px] font-mono text-black/40">
                                            {c.phone}
                                        </p>
                                    </button>
                                ))
                            )}
                        </div>
                    )}

                    {selectedCustomerId ? (
                        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
                            <span className="text-sm text-emerald-900">
                                Selected:{" "}
                                <strong>
                                    {
                                        customers.find(
                                            (c) => c.id === selectedCustomerId
                                        )?.name
                                    }
                                </strong>
                            </span>
                            <button
                                onClick={() => setSelectedCustomerId("")}
                                className="text-[11px] text-emerald-700 hover:underline"
                            >
                                Change
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                value={freeName}
                                onChange={(e) => setFreeName(e.target.value)}
                                placeholder="Name (optional for cash)"
                                className="border border-black/10 bg-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                            />
                            <input
                                value={freePhone}
                                onChange={(e) => setFreePhone(e.target.value)}
                                placeholder="Phone"
                                className="border border-black/10 bg-white rounded-xl px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                            />
                        </div>
                    )}
                </div>

                {/* Payment */}
                <div>
                    <p className="text-[11px] font-semibold tracking-widest text-black/50 uppercase mb-2">
                        Payment
                    </p>
                    <div className="flex border border-black/10 rounded-xl overflow-hidden">
                        {(
                            [
                                ["cash", "Cash"],
                                ["card", "Card"],
                                ["credit", "Credit"],
                            ] as ["cash" | "card" | "credit", string][]
                        ).map(([key, label]) => (
                            <button
                                key={key}
                                onClick={() => setPaymentMode(key)}
                                className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition ${
                                    paymentMode === key
                                        ? key === "credit"
                                            ? "bg-purple-600 text-white"
                                            : "bg-[#0B6E4F] text-white"
                                        : "text-gray-600 hover:bg-gray-100"
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <div className="mt-3">
                        <label className="text-[12px] text-black/60 font-medium block mb-1">
                            {paymentMode === "credit"
                                ? "Initial Payment"
                                : "Amount Received"}
                        </label>
                        <input
                            type="number"
                            value={paidAmount || ""}
                            onChange={(e) =>
                                setPaidAmount(Number(e.target.value))
                            }
                            placeholder="0.00"
                            className="w-full border border-black/10 bg-white rounded-xl px-3 py-2.5 font-mono text-lg font-bold outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                        />
                        <div className="flex justify-between items-center mt-1">
                            <button
                                type="button"
                                onClick={() => setPaidAmount(totalAmount)}
                                className="text-[11px] text-[#0B6E4F] font-medium hover:underline"
                            >
                                Pay full amount
                            </button>
                            {paymentMode === "cash" && paidAmount > 0 && (
                                <span className="text-[12px] text-black/60">
                                    Change:{" "}
                                    <span className="font-mono font-semibold">
                                        Rs {change.toFixed(2)}
                                    </span>
                                </span>
                            )}
                            {paymentMode === "credit" && (
                                <span className="text-[12px] text-black/60">
                                    Balance:{" "}
                                    <span className="font-mono font-semibold text-red-600">
                                        Rs {balance.toFixed(2)}
                                    </span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Total summary */}
                <div className="bg-[#12171A] rounded-2xl p-4 space-y-2 text-white">
                    <div className="flex justify-between text-sm">
                        <span className="text-white/50">Sub Total</span>
                        <span className="font-mono">
                            Rs {subTotal.toLocaleString()}
                        </span>
                    </div>
                    {invoiceDiscountAmount > 0 && (
                        <div className="flex justify-between text-sm text-red-400">
                            <span>
                                Invoice Discount (
                                {invoiceDiscountPercent.toFixed(1)}%)
                            </span>
                            <span className="font-mono">
                                -Rs{" "}
                                {invoiceDiscountAmount.toFixed(2)}
                            </span>
                        </div>
                    )}
                    <div className="h-px bg-white/10 my-1" />
                    <div className="flex justify-between items-baseline">
                        <span className="text-[11px] tracking-widest uppercase text-white/40 font-semibold">
                            Total
                        </span>
                        <span className="font-mono text-3xl font-bold text-[#4ADE9A]">
                            Rs {totalAmount.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-5 border-t border-black/5 flex justify-end gap-2">
                <button
                    onClick={onClose}
                    disabled={submitting}
                    className="px-4 py-2.5 bg-[#F3F6F4] hover:bg-[#E7ECE9] text-black/70 rounded-xl font-medium text-[14px] transition disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={submitting || !allLinesOk || activeLines.length === 0}
                    className="px-4 py-2.5 bg-[#0B6E4F] hover:bg-[#0A5F44] text-white rounded-xl font-medium text-[14px] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {submitting ? "Converting…" : "Convert to Sale"}
                </button>
            </div>
        </Backdrop>
    );
}

function Backdrop({
    children,
    onClose,
}: {
    children: React.ReactNode;
    onClose: () => void;
}) {
    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4 z-50"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] shadow-xl flex flex-col">
                {children}
            </div>
        </div>
    );
}