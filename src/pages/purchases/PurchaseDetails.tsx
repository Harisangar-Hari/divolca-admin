import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getPurchaseById } from "../../api/purchaseApi";

interface Purchase {
    id: string;


    invoiceNumber: string;

    purchaseDate: string;

    grandTotal: number;

    paidAmount: number;

    balanceAmount: number;

    supplierId: string;

    supplier: {
        id: string;
        name: string;
        phone: string;
        email?: string;
        address?: string;
    } | null;

    items: PurchaseItem[];
}


interface PurchaseItem {

    id: string;

    productId: string;

    productName: string;

    quantity: number;

    costPrice: number;

    lineTotal: number;
}


export default function PurchaseDetails() {
    const { id } = useParams();
    const [data, setData] = useState<Purchase | null>(null);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        if (!id) return;
        const res = await getPurchaseById(id);
        setData(res);
    };

    if (!data) {
        return (
            <div className="min-h-screen bg-[#EEF1EF] p-4 md:p-6 font-sans">
                <div className="max-w-3xl mx-auto space-y-3">
                    <div className="h-24 rounded-2xl bg-black/5 animate-pulse" />
                    <div className="h-14 rounded-2xl bg-black/5 animate-pulse" />
                    <div className="h-14 rounded-2xl bg-black/5 animate-pulse" />
                    <div className="h-14 rounded-2xl bg-black/5 animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#EEF1EF] p-4 md:p-6 font-sans text-[#14181C]">
            <div className="max-w-3xl mx-auto space-y-5">

                {/* HEADER */}
                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-5 relative overflow-hidden">
                    <div className="absolute left-0 top-0 h-full w-1 bg-[#4338CA]" />

                    <p className="text-[11px] font-semibold tracking-widest text-[#4338CA] uppercase">
                        Purchase invoice
                    </p>
                    <h2 className="text-xl font-bold font-mono mt-1">
                        {data.invoiceNumber}
                    </h2>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[13px]">
                        <div>
                            <p className="text-[10px] font-semibold tracking-widest text-black/40 uppercase">
                                Supplier
                            </p>
                            <p className="mt-0.5 font-medium">
                                {data.supplier?.name || "—"}
                            </p>
                        </div>

                        <div>
                            <p className="text-[10px] font-semibold tracking-widest text-black/40 uppercase">
                                Phone
                            </p>
                            <p className="mt-0.5 font-mono">
                                {data.supplier?.phone || "—"}
                            </p>
                        </div>

                        <div>
                            <p className="text-[10px] font-semibold tracking-widest text-black/40 uppercase">
                                Date
                            </p>
                            <p className="mt-0.5">
                                {new Date(data.purchaseDate).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ITEMS */}
                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-5">
                    <h3 className="text-[11px] font-semibold tracking-widest text-black/40 uppercase mb-2">
                        Items
                    </h3>

                    {!data.items?.length ? (
                        <div className="py-10 text-center text-black/30 text-sm">
                            No items on this invoice
                        </div>
                    ) : (
                        <div className="divide-y divide-dashed divide-black/10">
                            {data.items.map((i) => (
                                <div
                                    key={i.productId}
                                    className="flex justify-between items-center py-3"
                                >
                                    <div>
                                        <p className="font-medium text-[14px]">
                                            {i.productName}
                                        </p>

                                        <p className="text-[12px] text-black/40 font-mono mt-0.5">
                                            {i.quantity} × Rs {i.costPrice}
                                        </p>
                                    </div>

                                    <div className="font-mono font-semibold text-[15px]">
                                        Rs {i.lineTotal}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* TOTAL */}
                <div className="bg-[#12171A] rounded-2xl p-5 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] tracking-widest uppercase text-white/40 font-semibold">
                            Paid
                        </span>
                        <span className="font-mono text-[15px] tabular-nums text-white/70">
                            Rs {data.paidAmount}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-[11px] tracking-widest uppercase text-white/40 font-semibold">
                            Balance
                        </span>
                        <span
                            className={`font-mono text-[15px] tabular-nums ${data.balanceAmount > 0 ? "text-[#F87171]" : "text-white/70"
                                }`}
                        >
                            Rs {data.balanceAmount}
                        </span>
                    </div>

                    <div className="h-px bg-white/10" />

                    <div className="flex items-center justify-between">
                        <span className="text-[11px] tracking-widest uppercase text-white/40 font-semibold">
                            Grand total
                        </span>
                        <span className="font-mono text-2xl font-semibold tabular-nums text-[#4ADE9A] [text-shadow:0_0_18px_rgba(74,222,154,0.35)]">
                            Rs {data.grandTotal}
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
}