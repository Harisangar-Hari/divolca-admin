// src/pages/reports/PurchaseReport.tsx
import { useEffect, useState } from "react";
import { useToast } from "../../store/toastStore";
import { getPurchaseReport } from "../../api/reportsApi";

interface PurchaseItem {
    Id: string;
    InvoiceNumber: string;
    PurchaseDate: string;
    GrandTotal: number;
    PaidAmount: number;
    BalanceAmount: number;
    SupplierName: string;
    SupplierPhone: string;
    TotalItems: number;
}

export default function PurchaseReport() {
    const [data, setData] = useState<PurchaseItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ startDate: "", endDate: "" });
    const [filteredData, setFilteredData] = useState<PurchaseItem[]>([]);
    const { showToast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await getPurchaseReport();
            setData(res);
            setFilteredData(res);
        } catch (error) {
            showToast("Failed to load purchase data", "error");
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = async () => {
        try {
            setLoading(true);
            const res = await getPurchaseReport({
                startDate: filters.startDate || undefined,
                endDate: filters.endDate || undefined,
            });
            setFilteredData(res);
        } catch (error) {
            showToast("Failed to apply filters", "error");
        } finally {
            setLoading(false);
        }
    };

    const resetFilters = () => {
        setFilters({ startDate: "", endDate: "" });
        setFilteredData(data);
    };

    const totalPurchases = filteredData.length;
    const totalAmount = filteredData.reduce((sum, item) => sum + Number(item.GrandTotal), 0);

    if (loading) {
        return <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-black/5 animate-pulse" />)}</div>;
    }

    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-4">
                    <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">Total Purchases</p>
                    <p className="text-2xl font-bold mt-1">{totalPurchases}</p>
                </div>
                <div className="bg-[#0B6E4F] rounded-2xl p-4 shadow-sm">
                    <p className="text-[11px] font-semibold tracking-widest text-white/60 uppercase">Total Amount</p>
                    <p className="text-2xl font-bold mt-1 text-white">LKR {totalAmount.toFixed(2)}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Start Date</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">End Date</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                        />
                    </div>
                    <div className="flex items-end gap-2">
                        <button
                            onClick={applyFilters}
                            className="flex-1 bg-[#0B6E4F] hover:bg-[#0A5F44] text-white px-4 py-2 rounded-xl font-medium text-sm transition"
                        >
                            Apply
                        </button>
                        <button
                            onClick={resetFilters}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium text-sm transition"
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Invoice</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Supplier</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-600">Total</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-600">Paid</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-600">Balance</th>
                                <th className="px-4 py-3 text-center font-semibold text-gray-600">Items</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400">No purchases found</td>
                                </tr>
                            ) : (
                                filteredData.map((item) => (
                                    <tr key={item.Id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{item.InvoiceNumber}</td>
                                        <td className="px-4 py-3 text-gray-800">{item.SupplierName}</td>
                                        <td className="px-4 py-3 text-gray-500">{new Date(item.PurchaseDate).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 text-right font-mono">LKR {Number(item.GrandTotal).toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right font-mono text-green-600">LKR {Number(item.PaidAmount).toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right font-mono text-red-600">LKR {Number(item.BalanceAmount).toFixed(2)}</td>
                                        <td className="px-4 py-3 text-center font-mono">{item.TotalItems}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}