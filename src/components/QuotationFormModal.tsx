import { useEffect, useMemo, useState } from "react";
import { useToast } from "../store/toastStore";
import { getProducts } from "../api/productsApi";
import { getCreditCustomers } from "../api/customerApi";
import {
    getQuotationById,
    createQuotation,
    updateQuotation,
    type CreateQuotationPayload,
} from "../api/quotationsApi";

interface Props {
    quotationId: string | null;
    onClose: () => void;
    onSaved: () => void;
}

interface LineItem {
    productId: string;
    name: string;
    unitPrice: number;
    quantity: number;
    discountPercent: number;   // ✅ percentage (0–100)
    stockQty: number;
}

export default function QuotationFormModal({
    quotationId,
    onClose,
    onSaved,
}: Props) {
    const { showToast } = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [products, setProducts] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [customerSearch, setCustomerSearch] = useState("");
    const [productSearch, setProductSearch] = useState("");

    const [items, setItems] = useState<LineItem[]>([]);
    const [invoiceDiscountPercent, setInvoiceDiscountPercent] = useState(0);
    const [notes, setNotes] = useState("");
    const [selectedCustomerId, setSelectedCustomerId] = useState("");
    const [freeName, setFreeName] = useState("");
    const [freePhone, setFreePhone] = useState("");

    // ---------- Load ----------
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const [prods, custs] = await Promise.all([
                    getProducts(),
                    getCreditCustomers(),
                ]);
                setProducts(prods);
                setCustomers(custs);

                if (quotationId) {
                    const q = await getQuotationById(quotationId);

                    const stockMap = new Map<string, number>();
                    (prods as any[]).forEach((p) =>
                        stockMap.set(p.id, Number(p.stockQty ?? 0))
                    );

                    setItems(
                        q.Items.map((it) => {
                            // it.Discount = total line discount in Rs
                            // → per-unit Rs → percent
                            const perUnit =
                                it.Quantity > 0
                                    ? it.Discount / it.Quantity
                                    : 0;
                            const percent =
                                it.UnitPrice > 0
                                    ? Number(
                                          (
                                              (perUnit / it.UnitPrice) *
                                              100
                                          ).toFixed(2)
                                      )
                                    : 0;

                            return {
                                productId: it.ProductId,
                                name: it.ProductName,
                                unitPrice: it.UnitPrice,
                                quantity: it.Quantity,
                                discountPercent: percent,
                                stockQty: stockMap.get(it.ProductId) ?? 0,
                            };
                        })
                    );
                    setNotes(q.Notes || "");
                    setSelectedCustomerId(q.CustomerId || "");
                    setFreeName(q.CustomerName || "");
                    setFreePhone(q.CustomerPhone || "");

                    // ✅ Precise invoice discount % round-trip
                    const totalLineDiscount = q.Items.reduce(
                        (s, it) => s + it.Discount,
                        0
                    );
                    const afterItem = q.SubTotal - totalLineDiscount;

                    if (afterItem > 0 && q.InvoiceDiscount > 0) {
                        const percent = Number(
                            ((q.InvoiceDiscount / afterItem) * 100).toFixed(2)
                        );
                        setInvoiceDiscountPercent(percent);
                    } else {
                        setInvoiceDiscountPercent(0);
                    }
                }
            } catch {
                showToast("Failed to load data", "error");
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [quotationId]);

    // ---------- Derived ----------
    const subTotal = useMemo(
        () => items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
        [items]
    );

    const totalItemDiscount = useMemo(
        () =>
            items.reduce(
                (s, i) =>
                    s +
                    i.unitPrice *
                        i.quantity *
                        (i.discountPercent / 100),
                0
            ),
        [items]
    );

    const afterItemDiscount = Math.max(0, subTotal - totalItemDiscount);

    const invoiceDiscountAmount = useMemo(
        () => (afterItemDiscount * invoiceDiscountPercent) / 100,
        [afterItemDiscount, invoiceDiscountPercent]
    );

    const totalAmount = Math.max(
        0,
        afterItemDiscount - invoiceDiscountAmount
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

    const filteredProducts = useMemo(() => {
        const q = productSearch.toLowerCase().trim();
        if (!q) return [];
        return products
            .filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    p.barcode.includes(q)
            )
            .slice(0, 10);
    }, [products, productSearch]);

    // ---------- Handlers ----------
    const addProduct = (p: any) => {
        const stock = Number(p.stockQty ?? 0);
        const existing = items.find((i) => i.productId === p.id);

        if (existing) {
            if (existing.quantity >= stock) {
                showToast(
                    `Only ${stock} in stock for ${p.name}`,
                    "error"
                );
                return;
            }
            setItems((prev) =>
                prev.map((i) =>
                    i.productId === p.id
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                )
            );
        } else {
            if (stock === 0) {
                showToast(`${p.name} is out of stock`, "error");
                return;
            }
            setItems((prev) => [
                ...prev,
                {
                    productId: p.id,
                    name: p.name,
                    unitPrice: Number(p.price),
                    quantity: 1,
                    discountPercent: 0,
                    stockQty: stock,
                },
            ]);
        }
        setProductSearch("");
    };

    const updateLine = (
        productId: string,
        patch: Partial<LineItem>
    ) => {
        setItems((prev) =>
            prev.map((i) =>
                i.productId === productId ? { ...i, ...patch } : i
            )
        );
    };

    const setQuantitySafely = (productId: string, raw: string) => {
        const line = items.find((i) => i.productId === productId);
        if (!line) return;

        const val = Number(raw);
        if (isNaN(val)) {
            updateLine(productId, { quantity: 1 });
            return;
        }
        const clamped = Math.max(
            1,
            Math.min(Math.floor(val), line.stockQty)
        );
        updateLine(productId, { quantity: clamped });
    };

    const setItemDiscountPercentSafely = (
        productId: string,
        raw: string
    ) => {
        const val = Number(raw);
        if (isNaN(val) || val < 0) {
            updateLine(productId, { discountPercent: 0 });
            return;
        }
        const clamped = Math.min(100, Math.max(0, val));
        updateLine(productId, { discountPercent: clamped });
    };

    const removeLine = (productId: string) => {
        setItems((prev) => prev.filter((i) => i.productId !== productId));
    };

    const handleSave = async () => {
        if (items.length === 0) {
            showToast("Add at least one product", "error");
            return;
        }
        if (!selectedCustomerId && (!freeName.trim() || !freePhone.trim())) {
            showToast(
                "Select a customer or enter name and phone",
                "error"
            );
            return;
        }

        const payload: CreateQuotationPayload = {
            customerId: selectedCustomerId || undefined,
            customerName: !selectedCustomerId ? freeName.trim() : undefined,
            customerPhone: !selectedCustomerId
                ? freePhone.trim()
                : undefined,
            notes: notes.trim() || undefined,
            items: items.map((i) => ({
                productId: i.productId,
                quantity: i.quantity,
                // ✅ Backend expects per-unit discount in Rs
                discount: Number(
                    ((i.unitPrice * i.discountPercent) / 100).toFixed(2)
                ),
            })),
            invoiceDiscount: Number(invoiceDiscountAmount.toFixed(2)),
        };

        try {
            setSaving(true);
            if (quotationId) {
                await updateQuotation(quotationId, payload);
                showToast("Quotation updated", "success");
            } else {
                const created = await createQuotation(payload);
                showToast(
                    `Quotation ${created.QuotationNumber} created`,
                    "success"
                );
            }
            onSaved();
        } catch (err: any) {
            showToast(
                err?.response?.data?.message || "Failed to save",
                "error"
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Backdrop onClose={onClose}>
                <div className="p-10 text-center text-black/40">
                    Loading…
                </div>
            </Backdrop>
        );
    }

    return (
        <Backdrop onClose={onClose}>
            <div className="p-5 border-b border-black/5 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#14181C]">
                    {quotationId ? "Edit Quotation" : "New Quotation"}
                </h2>
                <button
                    onClick={onClose}
                    className="text-black/30 hover:text-black/60 text-lg leading-none"
                >
                    ✕
                </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-4">
                {/* ================= CUSTOMER ================= */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-3">
                    <p className="text-[11px] font-semibold tracking-widest text-black/50 uppercase">
                        Customer
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
                                    No matches — fill in name/phone below
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
                                placeholder="Name (optional)"
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

                {/* ================= PRODUCT PICKER ================= */}
                <div>
                    <p className="text-[11px] font-semibold tracking-widest text-black/50 uppercase mb-2">
                        Add Products
                    </p>
                    <input
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="Search product name or barcode…"
                        className="w-full border border-black/10 bg-white rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                    />

                    {productSearch && filteredProducts.length > 0 && (
                        <div className="mt-1 max-h-48 overflow-y-auto border border-black/10 rounded-xl bg-white">
                            {filteredProducts.map((p) => {
                                const stock = Number(p.stockQty ?? 0);
                                const isOut = stock === 0;
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => addProduct(p)}
                                        disabled={isOut}
                                        className={`w-full flex justify-between items-center px-3 py-2 border-b border-black/5 last:border-0 text-sm ${
                                            isOut
                                                ? "opacity-40 cursor-not-allowed"
                                                : "hover:bg-gray-50"
                                        }`}
                                    >
                                        <div className="text-left min-w-0">
                                            <p className="truncate">
                                                {p.name}
                                            </p>
                                            <p className="text-[10px] font-mono text-black/40">
                                                Stock: {stock}
                                            </p>
                                        </div>
                                        <span className="font-mono text-[#0B6E4F] shrink-0 ml-2">
                                            Rs {p.price}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ================= LINE ITEMS ================= */}
                <div className="border border-black/10 rounded-xl overflow-hidden">
                    <table className="w-full text-[13px]">
                        <thead className="bg-gray-50 border-b border-black/5">
                            <tr>
                                <th className="px-3 py-2 text-left font-semibold text-[10px] uppercase tracking-widest text-black/40">
                                    Product
                                </th>
                                <th className="px-2 py-2 text-center font-semibold text-[10px] uppercase tracking-widest text-black/40 w-24">
                                    Qty / Stock
                                </th>
                                <th className="px-2 py-2 text-center font-semibold text-[10px] uppercase tracking-widest text-black/40 w-20">
                                    Unit
                                </th>
                                <th className="px-2 py-2 text-center font-semibold text-[10px] uppercase tracking-widest text-black/40 w-24">
                                    Disc %
                                </th>
                                <th className="px-3 py-2 text-right font-semibold text-[10px] uppercase tracking-widest text-black/40 w-28">
                                    Line Total
                                </th>
                                <th className="w-8"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="p-6 text-center text-black/30 text-sm"
                                    >
                                        No items yet — search above
                                    </td>
                                </tr>
                            ) : (
                                items.map((i) => {
                                    const lineTotal = Math.max(
                                        0,
                                        i.unitPrice *
                                            i.quantity *
                                            (1 - i.discountPercent / 100)
                                    );
                                    const atMax = i.quantity >= i.stockQty;
                                    return (
                                        <tr
                                            key={i.productId}
                                            className="border-b border-black/5 last:border-0"
                                        >
                                            <td className="px-3 py-2">
                                                <p className="font-medium">
                                                    {i.name}
                                                </p>
                                            </td>

                                            <td className="px-2 py-2">
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={i.stockQty}
                                                    value={i.quantity}
                                                    onChange={(e) =>
                                                        setQuantitySafely(
                                                            i.productId,
                                                            e.target.value
                                                        )
                                                    }
                                                    className={`w-full text-center border rounded px-1 py-1 text-sm font-mono ${
                                                        atMax
                                                            ? "border-amber-300 bg-amber-50"
                                                            : "border-black/10"
                                                    }`}
                                                />
                                                <p className="text-[9px] text-black/40 mt-0.5 text-center">
                                                    of {i.stockQty}
                                                </p>
                                            </td>

                                            <td className="px-2 py-2 text-center font-mono">
                                                {i.unitPrice}
                                            </td>

                                            <td className="px-2 py-2">
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={100}
                                                        step="0.5"
                                                        value={i.discountPercent}
                                                        onChange={(e) =>
                                                            setItemDiscountPercentSafely(
                                                                i.productId,
                                                                e.target.value
                                                            )
                                                        }
                                                        className="w-full text-center border border-black/10 rounded px-1 py-1 text-sm font-mono pr-5"
                                                    />
                                                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-black/30 pointer-events-none">
                                                        %
                                                    </span>
                                                </div>
                                                {i.discountPercent > 0 && (
                                                    <p className="text-[9px] text-red-500 mt-0.5 text-center font-mono">
                                                        -Rs{" "}
                                                        {(
                                                            (i.unitPrice *
                                                                i.discountPercent *
                                                                i.quantity) /
                                                            100
                                                        ).toFixed(2)}
                                                    </p>
                                                )}
                                            </td>

                                            <td className="px-3 py-2 text-right font-mono font-semibold">
                                                Rs{" "}
                                                {lineTotal.toLocaleString()}
                                            </td>

                                            <td className="pr-2">
                                                <button
                                                    onClick={() =>
                                                        removeLine(i.productId)
                                                    }
                                                    className="text-red-500 hover:text-red-700 text-sm"
                                                >
                                                    ✕
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ================= TOTALS ================= */}
                <div className="bg-[#12171A] rounded-2xl p-4 text-white space-y-1.5">
                    <div className="flex justify-between text-sm">
                        <span className="text-white/50">Sub Total</span>
                        <span className="font-mono">
                            Rs {subTotal.toLocaleString()}
                        </span>
                    </div>

                    {totalItemDiscount > 0 && (
                        <div className="flex justify-between text-sm text-amber-300">
                            <span>Item Discounts</span>
                            <span className="font-mono">
                                -Rs {totalItemDiscount.toFixed(2)}
                            </span>
                        </div>
                    )}

                    <div className="flex justify-between text-sm">
                        <span className="text-white/50">
                            After Item Discounts
                        </span>
                        <span className="font-mono">
                            Rs {afterItemDiscount.toLocaleString()}
                        </span>
                    </div>

                    <div className="h-px bg-white/10 my-1.5" />

                    <div className="flex items-center justify-between gap-3 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-white/50">
                                Invoice Discount
                            </span>
                            <input
                                type="number"
                                min={0}
                                max={100}
                                step="0.01"
                                value={invoiceDiscountPercent}
                                onChange={(e) =>
                                    setInvoiceDiscountPercent(
                                        Math.max(
                                            0,
                                            Math.min(
                                                100,
                                                Number(e.target.value) || 0
                                            )
                                        )
                                    )
                                }
                                className="w-16 px-2 py-0.5 rounded bg-white/10 border border-white/10 text-white text-right font-mono text-sm outline-none focus:border-white/30"
                            />
                            <span className="text-white/40 text-xs">%</span>
                        </div>

                        <span className="font-mono text-red-400">
                            {invoiceDiscountAmount > 0
                                ? `-Rs ${invoiceDiscountAmount.toFixed(2)}`
                                : "—"}
                        </span>
                    </div>

                    <div className="h-px bg-white/10 my-1.5" />

                    <div className="flex justify-between items-baseline">
                        <span className="text-[11px] tracking-widest uppercase text-white/40 font-semibold">
                            Total
                        </span>
                        <span className="font-mono text-2xl font-bold text-[#4ADE9A]">
                            Rs {totalAmount.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* ================= NOTES ================= */}
                <div>
                    <label className="text-[11px] font-semibold tracking-widest text-black/50 uppercase block mb-1">
                        Notes
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        placeholder="Special instructions, delivery notes…"
                        className="w-full border border-black/10 bg-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition resize-none"
                    />
                </div>
            </div>

            <div className="p-5 border-t border-black/5 flex justify-end gap-2">
                <button
                    onClick={onClose}
                    disabled={saving}
                    className="px-4 py-2.5 bg-[#F3F6F4] hover:bg-[#E7ECE9] text-black/70 rounded-xl font-medium text-[14px] transition disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving || items.length === 0}
                    className="px-4 py-2.5 bg-[#0B6E4F] hover:bg-[#0A5F44] text-white rounded-xl font-medium text-[14px] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving
                        ? "Saving…"
                        : quotationId
                        ? "Update Quotation"
                        : "Save Draft"}
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
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4 z-50"
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