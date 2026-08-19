import { useEffect, useState } from "react";
import { api } from "../api/axios";

interface Purchase {
    id: string;
    invoiceNumber: string;
    supplierName: string;
    grandTotal: number;
    purchaseDate: string;
    itemsCount: number;
}

export default function PurchaseInvoices() {
    const [data, setData] = useState<Purchase[]>([]);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        const res = await api.get("/purchases");
        setData(res.data);
    };

    return (
        <div className="min-h-screen bg-[#EEF1EF] p-4 md:p-6 font-sans text-[#14181C]">
            <div className="max-w-5xl mx-auto space-y-5">

                {/* HEADER */}
                <div>
                    <h1 className="text-2xl font-bold text-[#14181C]">
                        Purchase invoices
                    </h1>
                    <p className="text-[13px] text-black/40 mt-0.5">
                        {data.length} {data.length === 1 ? "invoice" : "invoices"} recorded
                    </p>
                </div>

                {/* ================= MOBILE VIEW ================= */}
                <div className="md:hidden space-y-3">

                    {data.length === 0 && (
                        <div className="bg-white rounded-2xl border border-black/5 py-12 text-center text-black/30 text-sm">
                            No purchase invoices yet
                        </div>
                    )}

                    {data.map(p => (
                        <div
                            key={p.id}
                            className="bg-white rounded-2xl shadow-sm border border-black/5 p-4 space-y-2.5"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="font-semibold text-[#14181C] text-[15px] font-mono">
                                    {p.invoiceNumber}
                                </div>
                                <span className="text-[11px] text-black/40 shrink-0">
                                    {new Date(p.purchaseDate).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="text-[13px] text-black/60">
                                {p.supplierName}
                            </div>

                            <div className="flex justify-between text-sm pt-1">
                                <span className="text-black/40 text-[12px] uppercase tracking-wide font-semibold">Total</span>
                                <span className="font-mono font-semibold text-[#0B6E4F]">Rs {p.grandTotal}</span>
                            </div>

                            <div className="flex justify-between text-sm">
                                <span className="text-black/40 text-[12px] uppercase tracking-wide font-semibold">Items</span>
                                <span className="font-mono font-semibold">{p.itemsCount}</span>
                            </div>
                        </div>
                    ))}

                </div>

                {/* ================= DESKTOP TABLE ================= */}
                <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-black/5 overflow-x-auto">

                    <table className="w-full text-[13px]">

                        <thead className="text-left text-black/40">
                            <tr className="border-b border-black/5">
                                <th className="p-4 font-semibold text-[11px] uppercase tracking-widest">Invoice</th>
                                <th className="font-semibold text-[11px] uppercase tracking-widest">Supplier</th>
                                <th className="font-semibold text-[11px] uppercase tracking-widest">Total</th>
                                <th className="font-semibold text-[11px] uppercase tracking-widest">Items</th>
                                <th className="font-semibold text-[11px] uppercase tracking-widest text-right pr-4">Date</th>
                            </tr>
                        </thead>

                        <tbody>
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-10 text-center text-black/30">
                                        No purchase invoices yet
                                    </td>
                                </tr>
                            )}

                            {data.map(p => (
                                <tr
                                    key={p.id}
                                    className="border-b border-black/5 last:border-0 hover:bg-[#FAFAF8] transition"
                                >
                                    <td className="p-4 font-mono font-medium text-[#14181C]">
                                        {p.invoiceNumber}
                                    </td>

                                    <td className="text-black/60">{p.supplierName}</td>

                                    <td className="font-mono font-semibold text-[#0B6E4F]">
                                        Rs {p.grandTotal}
                                    </td>

                                    <td className="font-mono">{p.itemsCount}</td>

                                    <td className="text-right pr-4 text-black/50">
                                        {new Date(p.purchaseDate).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>

                    </table>
                </div>

            </div>
        </div>
    );
}