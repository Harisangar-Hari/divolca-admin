// src/pages/reports/SalesReport.tsx
import { useEffect, useState } from "react";
import { useToast } from "../../store/toastStore";
import { getSalesReport, exportSalesToExcel } from "../../api/reportsApi";

interface SaleItem {
    Id: string;
    InvoiceNumber: string;
    TotalAmount: number;
    PaidAmount: number;
    BalanceAmount: number;
    PaymentMode: string;
    IsCreditSale: boolean;
    CreatedAt: string;
    CustomerName: string;
    CustomerPhone: string;
    TotalItems: number;
}

export default function SalesReport() {
    const [data, setData] = useState<SaleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        startDate: "",
        endDate: "",
        paymentMode: "",
    });
    const [filteredData, setFilteredData] = useState<SaleItem[]>([]);
    const { showToast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await getSalesReport();
            setData(res);
            setFilteredData(res);
        } catch (error) {
            showToast("Failed to load sales data", "error");
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = async () => {
        try {
            setLoading(true);
            const res = await getSalesReport({
                startDate: filters.startDate || undefined,
                endDate: filters.endDate || undefined,
                paymentMode: filters.paymentMode || undefined,
            });
            setFilteredData(res);
        } catch (error) {
            showToast("Failed to apply filters", "error");
        } finally {
            setLoading(false);
        }
    };

    const resetFilters = () => {
        setFilters({ startDate: "", endDate: "", paymentMode: "" });
        setFilteredData(data);
    };

    const handleExportExcel = async () => {
        try {
            await exportSalesToExcel({
                startDate: filters.startDate || undefined,
                endDate: filters.endDate || undefined,
                paymentMode: filters.paymentMode || undefined,
            });
            showToast("Excel exported successfully!", "success");
        } catch (error) {
            showToast("Failed to export Excel", "error");
        }
    };

    const totalSales = filteredData.length;
    const totalAmount = filteredData.reduce((sum, item) => sum + Number(item.TotalAmount), 0);
    const totalPaid = filteredData.reduce((sum, item) => sum + Number(item.PaidAmount), 0);
    const totalBalance = filteredData.reduce((sum, item) => sum + Number(item.BalanceAmount), 0);

    if (loading) {
        return <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-black/5 animate-pulse" />)}</div>;
    }

    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-4">
                    <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">Total Sales</p>
                    <p className="text-2xl font-bold mt-1">{totalSales}</p>
                </div>
                <div className="bg-[#0B6E4F] rounded-2xl p-4 shadow-sm">
                    <p className="text-[11px] font-semibold tracking-widest text-white/60 uppercase">Total Amount</p>
                    <p className="text-2xl font-bold mt-1 text-white">LKR {totalAmount.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-4">
                    <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">Total Paid</p>
                    <p className="text-2xl font-bold mt-1">LKR {totalPaid.toFixed(2)}</p>
                </div>
                <div className="bg-red-50 rounded-2xl p-4 shadow-sm border border-red-200">
                    <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">Total Balance</p>
                    <p className="text-2xl font-bold mt-1 text-red-600">LKR {totalBalance.toFixed(2)}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
                    <div>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Payment Mode</label>
                        <select
                            value={filters.paymentMode}
                            onChange={(e) => setFilters({ ...filters, paymentMode: e.target.value })}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition bg-white"
                        >
                            <option value="">All</option>
                            <option value="cash">Cash</option>
                            <option value="card">Card</option>
                            <option value="credit">Credit</option>
                        </select>
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

            {/* Actions */}
            <div className="flex justify-end">
                <button
                    onClick={handleExportExcel}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium text-[14px] cursor-pointer transition shadow-sm flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Excel
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Invoice</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Customer</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-600">Total</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-600">Paid</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-600">Balance</th>
                                <th className="px-4 py-3 text-center font-semibold text-gray-600">Payment</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400">No sales found</td>
                                </tr>
                            ) : (
                                filteredData.map((item) => (
                                    <tr key={item.Id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{item.InvoiceNumber}</td>
                                        <td className="px-4 py-3 text-gray-800">{item.CustomerName}</td>
                                        <td className="px-4 py-3 text-gray-500">{new Date(item.CreatedAt).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 text-right font-mono">LKR {Number(item.TotalAmount).toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right font-mono text-green-600">LKR {Number(item.PaidAmount).toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right font-mono text-red-600">LKR {Number(item.BalanceAmount).toFixed(2)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.PaymentMode === "credit"
                                                    ? "bg-purple-100 text-purple-800"
                                                    : item.PaymentMode === "cash"
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-blue-100 text-blue-800"
                                                }`}>
                                                {item.PaymentMode.toUpperCase()}
                                            </span>
                                        </td>
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