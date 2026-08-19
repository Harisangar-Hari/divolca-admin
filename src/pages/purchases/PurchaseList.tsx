import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPurchases } from "../../api/purchaseApi";

interface Purchase {
    id: string;
    invoiceNumber: string;
    supplierName?: string;
    supplier?: {
        name: string;
    };
    grandTotal: number;
    purchaseDate: string;
    itemsCount: number;
    purchaseNumber?: string;
}

export default function PurchaseList() {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        const res = await getPurchases();
        setPurchases(res);
    };

    return (
        <div className="min-h-screen bg-[#EEF1EF] p-4 md:p-6 font-sans text-[#14181C]">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-black/5 p-4 md:p-5">

                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                        Purchase invoices
                    </h2>
                    <span className="text-[11px] font-mono text-black/40">
                        {purchases.length} {purchases.length === 1 ? "invoice" : "invoices"}
                    </span>
                </div>

                {purchases.length === 0 ? (
                    <div className="py-14 text-center text-black/30 text-sm">
                        No purchase invoices yet
                    </div>
                ) : (
                    <div className="space-y-2">
                        {purchases.map((p) => (
                            <div
                                key={p.id}
                                onClick={() => navigate(`/purchases/${p.id}`)}
                                className="border border-black/10 p-3.5 rounded-xl cursor-pointer hover:border-[#0B6E4F]/40 hover:bg-[#F3F6F4] transition flex items-center justify-between gap-3"
                            >
                                <div className="min-w-0">
                                    <p className="font-medium text-[14px] font-mono truncate">
                                        {p.purchaseNumber || "Unknown invoice"}
                                    </p>
                                    <p className="text-[13px] text-black/40 mt-0.5 truncate">
                                        {p.supplier?.name || p.supplierName || "Unknown supplier"}
                                    </p>
                                </div>

                                <div className="text-right shrink-0">
                                    <p className="font-mono font-semibold text-[15px] text-[#0B6E4F]">
                                        Rs {p.grandTotal}
                                    </p>
                                    <p className="text-[11px] text-black/40 mt-0.5">
                                        {p.itemsCount} {p.itemsCount === 1 ? "item" : "items"}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}