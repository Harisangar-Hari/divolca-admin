// src/pages/reports/PurchaseReport.tsx
import { useEffect, useState } from "react";
import { useToast } from "../../store/toastStore";
import { getPurchaseReport } from "../../api/reportsApi";
import * as XLSX from "xlsx";

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

    // ✅ Export to Excel
    const exportToExcel = () => {
        try {
            // Prepare data for Excel
            const excelData = filteredData.map((item) => ({
                'Invoice Number': item.InvoiceNumber,
                'Supplier': item.SupplierName,
                'Phone': item.SupplierPhone || '-',
                'Date': new Date(item.PurchaseDate).toLocaleDateString(),
                'Total (LKR)': Number(item.GrandTotal).toFixed(2),
                'Paid (LKR)': Number(item.PaidAmount).toFixed(2),
                'Balance (LKR)': Number(item.BalanceAmount).toFixed(2),
                'Items': item.TotalItems,
            }));

            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(excelData);

            // Auto-size columns
            const colWidths = [
                { wch: 20 }, // Invoice Number
                { wch: 25 }, // Supplier
                { wch: 15 }, // Phone
                { wch: 15 }, // Date
                { wch: 18 }, // Total
                { wch: 18 }, // Paid
                { wch: 18 }, // Balance
                { wch: 10 }, // Items
            ];
            ws['!cols'] = colWidths;

            // Create workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Purchase Report');

            // Add summary sheet
            const summaryData = [
                { 'Metric': 'Total Purchases', 'Value': filteredData.length },
                { 'Metric': 'Total Amount', 'Value': filteredData.reduce((sum, item) => sum + Number(item.GrandTotal), 0).toFixed(2) },
                { 'Metric': 'Total Paid', 'Value': filteredData.reduce((sum, item) => sum + Number(item.PaidAmount), 0).toFixed(2) },
                { 'Metric': 'Total Balance', 'Value': filteredData.reduce((sum, item) => sum + Number(item.BalanceAmount), 0).toFixed(2) },
                { 'Metric': 'Filter Date Range', 'Value': `${filters.startDate || 'All'} to ${filters.endDate || 'All'}` },
                { 'Metric': 'Generated On', 'Value': new Date().toLocaleString() },
            ];

            const summaryWs = XLSX.utils.json_to_sheet(summaryData);
            const summaryColWidths = [
                { wch: 20 },
                { wch: 25 },
            ];
            summaryWs['!cols'] = summaryColWidths;
            XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

            // Generate filename
            const filename = `Purchase_Report_${new Date().toISOString().split('T')[0]}.xlsx`;

            // Save file
            XLSX.writeFile(wb, filename);
            showToast("Purchase report exported successfully!", "success");
        } catch (error) {
            console.error("Export failed:", error);
            showToast("Failed to export purchase report", "error");
        }
    };

    const totalPurchases = filteredData.length;
    const totalAmount = filteredData.reduce((sum, item) => sum + Number(item.GrandTotal), 0);
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
                    <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">Total Purchases</p>
                    <p className="text-2xl font-bold mt-1">{totalPurchases}</p>
                </div>
                <div className="bg-[#0B6E4F] rounded-2xl p-4 shadow-sm">
                    <p className="text-[11px] font-semibold tracking-widest text-white/60 uppercase">Total Amount</p>
                    <p className="text-2xl font-bold mt-1 text-white">LKR {totalAmount.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-4">
                    <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">Total Paid</p>
                    <p className="text-2xl font-bold mt-1 text-green-600">LKR {totalPaid.toFixed(2)}</p>
                </div>
                <div className="bg-red-50 rounded-2xl p-4 shadow-sm border border-red-200">
                    <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">Total Balance</p>
                    <p className="text-2xl font-bold mt-1 text-red-600">LKR {totalBalance.toFixed(2)}</p>
                </div>
            </div>

            {/* Filters & Export */}
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
                    <div className="flex items-end gap-2 col-span-1 md:col-span-2">
                        <button
                            onClick={applyFilters}
                            className="flex-1 bg-[#0B6E4F] hover:bg-[#0A5F44] text-white px-4 py-2 rounded-xl font-medium text-sm transition"
                        >
                            Apply Filters
                        </button>
                        <button
                            onClick={resetFilters}
                            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium text-sm transition"
                        >
                            Reset
                        </button>
                        <button
                            onClick={exportToExcel}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-medium text-sm transition shadow-sm flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export Excel
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
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Phone</th>
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
                                    <td colSpan={8} className="px-4 py-10 text-center text-gray-400">No purchases found</td>
                                </tr>
                            ) : (
                                filteredData.map((item) => (
                                    <tr key={item.Id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{item.InvoiceNumber}</td>
                                        <td className="px-4 py-3 text-gray-800">{item.SupplierName}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.SupplierPhone || "-"}</td>
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