// src/pages/sales/SaleDetail.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSaleById, cancelSale, editSale, updateSaleItem, addSaleItem, removeSaleItem } from "../api/salesApi";
import { getProducts } from "../api/productsApi";
import { printA4Receipt, type ReceiptData } from "../utils/printA4Receipt";
import { useToast } from "../store/toastStore";

// interface SaleItem {
//     id: string;
//     saleItemId: string;
//     productId: string;
//     productName: string;
//     quantity: number;
//     unitPrice: number;
//     discount: number;
//     total: number;
// }


export default function SaleDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [sale, setSale] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);

    const [editedItems, setEditedItems] = useState<{
        [key: string]: {
            quantity: number;
            discount: number;
            discountPercent?: number;
        }
    }>({});

    const [editedInvoiceDiscount, setEditedInvoiceDiscount] = useState<number>(0);
    const [isDiscountManuallySet, setIsDiscountManuallySet] = useState(false);

    // ✅ Add state for edited date
    const [editedDate, setEditedDate] = useState<string>("");

    useEffect(() => {
        loadSale();
    }, [id]);

    const loadSale = async () => {
        if (!id) return;

        try {
            const data = await getSaleById(id);

            setSale(data);
            setEditedItems({});

            // ✅ Set the date from the sale data
            if (data?.createdAt) {
                const date = new Date(data.createdAt);
                setEditedDate(date.toISOString().split('T')[0]);
            }

            const subTotal = data?.subTotal || 0;
            const discountAmount = data?.invoiceDiscountAmount || 0;

            if (!isDiscountManuallySet) {
                const discountPercentage = subTotal > 0 ? Math.round((discountAmount / subTotal) * 100) : 0;
                setEditedInvoiceDiscount(discountPercentage);
            }
        } catch (error) {
            console.error('Error loading sale:', error);
            showToast("Failed to load sale", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (term: string) => {
        setSearchTerm(term);
        if (!term.trim()) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }
        try {
            const products = await getProducts();
            const filtered = products.filter((p: any) =>
                p.name.toLowerCase().includes(term.toLowerCase()) ||
                p.barcode.includes(term)
            );
            setSearchResults(filtered);
            setShowSearchResults(true);
        } catch (error) {
            console.error("Search failed:", error);
            setSearchResults([]);
            setShowSearchResults(false);
        }
    };

    const handleAddItem = async (product: any) => {
        if (!id) return;
        try {
            setEditLoading(true);
            await addSaleItem(id, {
                productId: product.id,
                quantity: 1,
                discount: 0,
            });
            showToast("Item added successfully", "success");
            setSearchTerm("");
            setSearchResults([]);
            setShowSearchResults(false);
            await loadSale();
        } catch (error: any) {
            showToast(error?.message || "Failed to add item", "error");
        } finally {
            setEditLoading(false);
        }
    };

    const startEditingItem = (itemId: string, currentQty: number, currentDiscount: number, unitPrice: number) => {
        const discountPercent = unitPrice > 0 ? Math.round((currentDiscount / unitPrice) * 100) : 0;

        setEditedItems(prev => ({
            ...prev,
            [itemId]: {
                quantity: currentQty,
                discount: currentDiscount,
                discountPercent: discountPercent,
            }
        }));
    };

    const updateItemQuantity = (itemId: string, quantity: number) => {
        setEditedItems(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                quantity: quantity,
            }
        }));
    };

    const updateDiscountFromPercent = (itemId: string, percent: number, unitPrice: number) => {
        const discountAmount = (unitPrice * percent) / 100;
        setEditedItems(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                discount: discountAmount,
                discountPercent: percent,
            }
        }));
    };

    const handleUpdateItem = async (itemId: string) => {
        if (!id) return;
        const editData = editedItems[itemId];
        if (!editData) {
            showToast("No changes to save", "error");
            return;
        }

        try {
            setEditLoading(true);

            await updateSaleItem(id, itemId, {
                quantity: editData.quantity,
                discount: editData.discount,
            });

            showToast("Item updated successfully", "success");

            setEditedItems(prev => {
                const newState = { ...prev };
                delete newState[itemId];
                return newState;
            });
            await loadSale();
        } catch (error: any) {
            console.error('❌ Update error:', error);
            showToast(error?.response?.data?.message || "Failed to update item", "error");
        } finally {
            setEditLoading(false);
        }
    };

    const cancelEditingItem = (itemId: string) => {
        setEditedItems(prev => {
            const newState = { ...prev };
            delete newState[itemId];
            return newState;
        });
    };

    const handleRemoveItem = async (itemId: string) => {
        if (!confirm("Remove this item from the sale?")) return;
        if (!id) return;
        try {
            setEditLoading(true);
            await removeSaleItem(id, itemId);
            showToast("Item removed successfully", "success");
            setEditedItems(prev => {
                const newState = { ...prev };
                delete newState[itemId];
                return newState;
            });
            await loadSale();
        } catch (error: any) {
            showToast(error?.message || "Failed to remove item", "error");
        } finally {
            setEditLoading(false);
        }
    };

    // ✅ Save invoice discount
    const handleSaveInvoiceDiscount = async () => {
        if (!id) return;

        const subTotal = sale.subTotal || 0;
        const discountPercentage = editedInvoiceDiscount;
        const discountAmount = (subTotal * discountPercentage) / 100;

        if (discountAmount === 0 && discountPercentage === 0) {
            if (sale.invoiceDiscountAmount === 0) {
                showToast("No changes to save", "info");
                return;
            }
        }

        try {
            setEditLoading(true);
            await editSale(id, {
                invoiceDiscount: discountAmount,
                customerId: sale.customer?.id || undefined,
            });
            showToast(`Invoice discount ${discountPercentage}% (Rs ${discountAmount.toFixed(2)}) applied successfully`, "success");
            setIsDiscountManuallySet(true);
            await loadSale();
        } catch (error: any) {
            showToast(error?.message || "Failed to update discount", "error");
        } finally {
            setEditLoading(false);
        }
    };

    // ✅ Handle discount input change
    const handleDiscountChange = (val: number) => {
        setEditedInvoiceDiscount(val);
        setIsDiscountManuallySet(true);
    };

    // ✅ Save all edits - Intelligent discount handling
    const handleSaveEdits = async () => {
        if (!id) return;

        const editingItemIds = Object.keys(editedItems);
        if (editingItemIds.length > 0) {
            showToast("Please save or cancel individual item edits first", "error");
            return;
        }

        try {
            setEditLoading(true);

            const currentItems = (sale.items || []).map((item: any) => ({
                productId: item.productId,
                quantity: item.quantity,
                discount: item.discount || 0,
            }));

            // Intelligent discount handling
            let discountAmount = sale.invoiceDiscountAmount || 0;

            if (isDiscountManuallySet) {
                const subTotal = sale.subTotal || 0;
                const discountPercentage = editedInvoiceDiscount;
                discountAmount = Math.round((subTotal * discountPercentage) / 100 * 100) / 100;
            } else {
                discountAmount = sale.invoiceDiscountAmount || 0;
            }

            // ✅ Prepare update data with date
            const updateData: any = {
                items: currentItems,
                invoiceDiscount: discountAmount,
                paymentMode: sale.paymentMode || "cash",
                customerId: sale.customer?.id || undefined,
            };

            // ✅ If date was changed, include it
            if (editedDate && sale.createdAt) {
                const currentDate = new Date(sale.createdAt);
                const currentDateStr = currentDate.toISOString().split('T')[0];
                if (editedDate !== currentDateStr) {
                    updateData.createdAt = new Date(editedDate).toISOString();
                }
            }

            await editSale(id, updateData);

            showToast(`Invoice updated successfully`, "success");
            setIsEditing(false);
            setIsDiscountManuallySet(false);
            await loadSale();
        } catch (error: any) {
            showToast(error?.message || "Failed to update invoice", "error");
        } finally {
            setEditLoading(false);
        }
    };

    const startEditing = () => {
        setIsEditing(true);
        setEditedItems({});
        const subTotal = sale?.subTotal || 0;
        const discountAmount = sale?.invoiceDiscountAmount || 0;
        const discountPercentage = subTotal > 0 ? Math.round((discountAmount / subTotal) * 100) : 0;
        setEditedInvoiceDiscount(discountPercentage);
        setIsDiscountManuallySet(false);
        setSearchTerm("");
        setSearchResults([]);
        setShowSearchResults(false);

        // ✅ Set the date when entering edit mode
        if (sale?.createdAt) {
            const date = new Date(sale.createdAt);
            setEditedDate(date.toISOString().split('T')[0]);
        }
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setEditedItems({});
        const subTotal = sale?.subTotal || 0;
        const discountAmount = sale?.invoiceDiscountAmount || 0;
        const discountPercentage = subTotal > 0 ? Math.round((discountAmount / subTotal) * 100) : 0;
        setEditedInvoiceDiscount(discountPercentage);
        setIsDiscountManuallySet(false);
        setSearchTerm("");
        setSearchResults([]);
        setShowSearchResults(false);
        // ✅ Reset date to original
        if (sale?.createdAt) {
            const date = new Date(sale.createdAt);
            setEditedDate(date.toISOString().split('T')[0]);
        }
        loadSale();
    };

    // Status helper functions
    const isCancelled = () => sale?.status === 4 || sale?.status === "Cancelled";
    const isReturned = () => sale?.status === 2 || sale?.status === "Returned" || sale?.status === "FULLY_RETURNED";
    const isCompleted = () => sale?.status === 3 || sale?.status === "Completed";

    const getStatus = () => {
        if (isCancelled()) return "Cancelled";
        if (isReturned()) return "Returned";
        if (isCompleted()) return "Completed";
        if (sale?.balanceAmount > 0 && sale?.paidAmount > 0) return "Partial";
        if (sale?.balanceAmount === 0) return "Paid";
        return "Unpaid";
    };

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
            showToast("Sale cancelled successfully", "success");
            await loadSale();
        } catch (err: any) {
            showToast(err?.response?.data?.message || "Failed to cancel sale", "error");
        } finally {
            setLoading(false);
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
            createdAt: sale.createdAt || "",
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

    const canEdit = !isCancelledStatus && !isReturnedStatus && sale.status !== 2 && sale.status !== 4;

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
                        {isEditing && (
                            <span className="text-[10px] font-mono bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                                ✏️ Editing
                            </span>
                        )}
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        {canEdit && !isEditing && (
                            <button
                                onClick={startEditing}
                                className="text-[13px] font-medium px-3.5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 cursor-pointer transition shadow-sm"
                            >
                                ✏️ Edit Invoice
                            </button>
                        )}

                        {isEditing && (
                            <>
                                <button
                                    onClick={handleSaveEdits}
                                    disabled={editLoading || Object.keys(editedItems).length > 0}
                                    className="text-[13px] font-medium px-3.5 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 cursor-pointer transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {editLoading ? "Saving..." : "💾 Save Changes"}
                                </button>
                                <button
                                    onClick={cancelEditing}
                                    disabled={editLoading}
                                    className="text-[13px] font-medium px-3.5 py-2 rounded-xl bg-gray-600 text-white hover:bg-gray-700 cursor-pointer transition shadow-sm disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </>
                        )}

                        {!isReturnedStatus && !isCancelledStatus && sale.balanceAmount > 0 && !isEditing && (
                            <button
                                onClick={() => navigate(`/sales/${sale.id}/pay-credit`)}
                                className="text-[13px] font-medium px-3.5 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer transition"
                            >
                                Pay Credit
                            </button>
                        )}

                        {!isReturnedStatus && !isCancelledStatus && !isEditing && (
                            <button
                                onClick={handleCancel}
                                className="text-[13px] font-medium px-3.5 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 cursor-pointer transition shadow-sm"
                            >
                                Cancel Invoice
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

                {/* INVOICE DISCOUNT & DATE */}
                {isEditing && (
                    <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-4 space-y-3">
                        {/* Discount Section */}
                        <div className="flex items-center gap-4 flex-wrap">
                            <label className="text-[13px] font-medium text-black/60">Invoice Discount (%):</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={editedInvoiceDiscount}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    if (!isNaN(val) && val >= 0 && val <= 100) {
                                        handleDiscountChange(val);
                                    }
                                }}
                                className="border border-gray-300 rounded-xl px-3 py-2 w-24 text-sm outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                            />
                            <span className="text-sm text-black/40">%</span>

                            {editedInvoiceDiscount > 0 && (
                                <span className="text-sm text-green-600">
                                    = Rs {((sale.subTotal || 0) * editedInvoiceDiscount / 100).toFixed(2)}
                                </span>
                            )}

                            <button
                                onClick={handleSaveInvoiceDiscount}
                                disabled={editLoading}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50"
                            >
                                Update Discount
                            </button>

                            <span className="text-xs text-black/40">
                                Current: {sale.invoiceDiscountAmount > 0
                                    ? `${Math.round((sale.invoiceDiscountAmount / (sale.subTotal || 1)) * 100)}% (Rs ${sale.invoiceDiscountAmount || 0})`
                                    : 'No discount'
                                }
                            </span>
                        </div>

                        {/* ✅ Date Section */}
                        <div className="flex items-center gap-4 flex-wrap border-t border-black/5 pt-3">
                            <label className="text-[13px] font-medium text-black/60">Invoice Date:</label>
                            <input
                                type="date"
                                value={editedDate}
                                onChange={(e) => setEditedDate(e.target.value)}
                                className="border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                            />
                            <span className="text-xs text-black/40">
                                Original: {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>
                    </div>
                )}

                {/* ITEMS */}
                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-4">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                            Items {isEditing && "(Click edit to modify)"}
                        </p>
                        {isEditing && (
                            <span className="text-[11px] text-blue-600">
                                {sale.items?.length || 0} items
                            </span>
                        )}
                    </div>

                    <div className="divide-y divide-dashed divide-black/10">
                        {(sale.items ?? []).map((item: any, index: number) => {
                            const itemId = item.id || item.saleItemId;

                            const discount = Number(item.discount || 0);
                            const unitPrice = Number(item.unitPrice);
                            const qty = item.quantity;
                            const finalLineTotal = Number(item.total);
                            const isEditingThisItem = editedItems[itemId] !== undefined;
                            const editData = editedItems[itemId];

                            const discountPercent = unitPrice > 0 ? Math.round((discount / unitPrice) * 100) : 0;

                            return (
                                <div key={itemId || index} className="py-3">
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="flex-1">
                                            <p className="font-medium text-[14px]">
                                                {item.productName || "Product"}
                                            </p>
                                            <div className="text-[13px] text-black/40 font-mono mt-0.5">
                                                {isEditingThisItem ? (
                                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                                        <label className="text-xs">Qty:</label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={editData?.quantity || qty}
                                                            onChange={(e) => updateItemQuantity(itemId, Number(e.target.value))}
                                                            className="w-16 border rounded px-2 py-1 text-sm"
                                                        />

                                                        <label className="text-xs ml-2">Disc %:</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            step="0.5"
                                                            value={editData?.discountPercent || 0}
                                                            onChange={(e) => {
                                                                const percent = Number(e.target.value);
                                                                if (!isNaN(percent) && percent >= 0 && percent <= 100) {
                                                                    updateDiscountFromPercent(itemId, percent, unitPrice);
                                                                }
                                                            }}
                                                            className="w-16 border rounded px-2 py-1 text-sm"
                                                        />

                                                        <span className="text-xs text-gray-400">
                                                            = Rs {((unitPrice * (editData?.discountPercent || 0)) / 100).toFixed(2)}
                                                        </span>

                                                        <button
                                                            onClick={() => handleUpdateItem(itemId)}
                                                            disabled={editLoading}
                                                            className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => cancelEditingItem(itemId)}
                                                            className="text-xs bg-gray-300 px-2 py-1 rounded hover:bg-gray-400"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <p>{qty} × Rs {unitPrice.toFixed(2)}</p>
                                                        {discount > 0 && (
                                                            <p className="text-red-500 font-medium">
                                                                Disc: Rs {discount.toFixed(2)} /each ({discountPercent}%)
                                                            </p>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-mono font-semibold text-[14px]">
                                                Rs {finalLineTotal.toFixed(2)}
                                            </div>
                                            {isEditing && !isEditingThisItem && (
                                                <div className="flex gap-1 mt-1 justify-end">
                                                    <button
                                                        onClick={() => {
                                                            const correctId = item.id || item.saleItemId;
                                                            startEditingItem(correctId, qty, discount, unitPrice);
                                                        }}
                                                        className="text-[10px] text-blue-600 hover:underline"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const correctId = item.id || item.saleItemId;
                                                            handleRemoveItem(correctId);
                                                        }}
                                                        className="text-[10px] text-red-600 hover:underline"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Add Item Section */}
                    {isEditing && (
                        <div className="mt-4 pt-4 border-t border-black/10">
                            <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase mb-2">
                                Add Item
                            </p>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="Search products to add..."
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                                    onFocus={() => {
                                        if (searchTerm.trim() && searchResults.length > 0) {
                                            setShowSearchResults(true);
                                        }
                                    }}
                                    onBlur={() => {
                                        setTimeout(() => {
                                            setShowSearchResults(false);
                                        }, 200);
                                    }}
                                />
                                {showSearchResults && searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-48 overflow-y-auto z-10">
                                        {searchResults.map((product) => (
                                            <div
                                                key={product.id}
                                                onClick={() => handleAddItem(product)}
                                                className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 flex justify-between items-center"
                                            >
                                                <span>{product.name}</span>
                                                <span className="text-sm font-mono text-[#0B6E4F]">
                                                    Rs {product.price}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
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