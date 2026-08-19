// src/pages/reports/ProfitLossReport.tsx
import { useEffect, useState } from "react";
import { useToast } from "../../store/toastStore";
import { getProfitLossReport } from "../../api/reportsApi";

interface ProfitLossData {
    summary: {
        totalSales: number;
        totalRevenue: number;
        totalCost: number;
        totalProfit: number;
        profitMargin: number;
        totalCreditSales: number;
        totalCashSales: number;
    };
    sales: Array<{
        InvoiceNumber: string;
        TotalAmount: number;
        CreatedAt: string;
        IsCreditSale: boolean;
        Items: number;
    }>;
}

export default function ProfitLossReport() {
    const [data, setData] = useState<ProfitLossData | null>(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ startDate: "", endDate: "" });
    const { showToast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await getProfitLossReport();
            setData(res);
        } catch (error) {
            showToast("Failed to load profit & loss data", "error");
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = async () => {
        try {
            setLoading(true);
            const res = await getProfitLossReport({
                startDate: filters.startDate || undefined,
                endDate: filters.endDate || undefined,
            });
            setData(res);
        } catch (error) {
            showToast("Failed to apply filters", "error");
        } finally {
            setLoading(false);
        }
    };

    const resetFilters = () => {
        setFilters({ startDate: "", endDate: "" });
        loadData();
    };

    if (loading) {
        return <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-black/5 animate-pulse" />)}</div>;
    }

    if (!data) return null;

    const { summary, sales } = data;

    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-4">
                    <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">Total Sales</p>
                    <p className="text-2xl font-bold mt-1">{summary.totalSales}</p>
                </div>
                <div className="bg-[#0B6E4F] rounded-2xl p-4 shadow-sm">
                    <p className="text-[11px] font-semibold tracking-widest text-white/60 uppercase">Revenue</p>
                    <p className="text-2xl font-bold mt-1 text-white">LKR {summary.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-red-50 rounded-2xl p-4 shadow-sm border border-red-200">
                    <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">Cost</p>
                    <p className="text-2xl font-bold mt-1 text-red-600">LKR {summary.totalCost.toFixed(2)}</p>
                </div>
                <div className={`rounded-2xl p-4 shadow-sm ${summary.totalProfit > 0 ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                    <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">Profit</p>
                    <p className={`text-2xl font-bold mt-1 ${summary.totalProfit > 0 ? "text-green-600" : "text-red-600"}`}>
                        LKR {summary.totalProfit.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{summary.profitMargin.toFixed(1)}% margin</p>
                </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-3 text-center">
                    <p className="text-[10px] font-semibold tracking-widest text-black/40 uppercase">Cash Sales</p>
                    <p className="text-lg font-bold mt-0.5">{summary.totalCashSales}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-3 text-center">
                    <p className="text-[10px] font-semibold tracking-widest text-black/40 uppercase">Credit Sales</p>
                    <p className="text-lg font-bold mt-0.5">{summary.totalCreditSales}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-3 text-center">
                    <p className="text-[10px] font-semibold tracking-widest text-black/40 uppercase">Avg. Sale Value</p>
                    <p className="text-lg font-bold mt-0.5">
                        LKR {summary.totalSales > 0 ? (summary.totalRevenue / summary.totalSales).toFixed(2) : "0.00"}
                    </p>
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

            {/* Sales List */}
            <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Invoice</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-600">Amount</th>
                                <th className="px-4 py-3 text-center font-semibold text-gray-600">Type</th>
                                <th className="px-4 py-3 text-center font-semibold text-gray-600">Items</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-4 py-10 text-center text-gray-400">No sales found</td>
                                </tr>
                            ) : (
                                sales.map((sale, index) => (
                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{sale.InvoiceNumber}</td>
                                        <td className="px-4 py-3 text-gray-500">{new Date(sale.CreatedAt).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 text-right font-mono">LKR {Number(sale.TotalAmount).toFixed(2)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sale.IsCreditSale ? "bg-purple-100 text-purple-800" : "bg-green-100 text-green-800"
                                                }`}>
                                                {sale.IsCreditSale ? "Credit" : "Cash"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center font-mono">{sale.Items}</td>
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