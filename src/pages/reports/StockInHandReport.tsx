// src/pages/reports/StockInHandReport.tsx
import { useEffect, useState } from "react";
import { useToast } from "../../store/toastStore";
import { getStockInHand, exportStockToExcel, exportStockToPDF } from "../../api/reportsApi";

interface StockItem {
    Id: string;
    Name: string;
    Barcode: string;
    SKU: string;
    StockQty: number;
    Unit: string;
    CostPrice: number;
    Price: number;
    ReorderLevel: number;
    Category: string;
    Brand: string;
    Amount: number;
    Status: string;
}

export default function StockInHandReport() {
    const [data, setData] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredData, setFilteredData] = useState<StockItem[]>([]);
    const { showToast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await getStockInHand();
            // ✅ Convert string values to numbers
            const processedData = res.map((item: any) => ({
                ...item,
                StockQty: Number(item.StockQty) || 0,
                CostPrice: Number(item.CostPrice) || 0,
                Price: Number(item.Price) || 0,
                Amount: Number(item.Amount) || 0,
                ReorderLevel: Number(item.ReorderLevel) || 0,
            }));
            setData(processedData);
            setFilteredData(processedData);
        } catch (error) {
            showToast("Failed to load stock data", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        if (!term.trim()) {
            setFilteredData(data);
            return;
        }
        const filtered = data.filter(
            (item) =>
                item.Name.toLowerCase().includes(term.toLowerCase()) ||
                item.Barcode.toLowerCase().includes(term.toLowerCase()) ||
                item.SKU.toLowerCase().includes(term.toLowerCase())
        );
        setFilteredData(filtered);
    };

    const handleExportExcel = async () => {
        try {
            await exportStockToExcel();
            showToast("Excel exported successfully!", "success");
        } catch (error) {
            showToast("Failed to export Excel", "error");
        }
    };

    const handleExportPDF = async () => {
        try {
            await exportStockToPDF();
            showToast("PDF exported successfully!", "success");
        } catch (error) {
            showToast("Failed to export PDF", "error");
        }
    };

    const totalValue = filteredData.reduce((sum, item) => sum + item.Amount, 0);
    const totalItems = filteredData.length;
    const totalQuantity = filteredData.reduce((sum, item) => sum + item.StockQty, 0);
    const lowStockItems = filteredData.filter((item) => item.Status === "LOW_STOCK").length;

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-24 rounded-xl bg-black/5 animate-pulse" />
                    ))}
                </div>
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 rounded-xl bg-black/5 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-4">
                    <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">Total Items</p>
                    <p className="text-2xl font-bold mt-1">{totalItems}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-4">
                    <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">Total Quantity</p>
                    <p className="text-2xl font-bold mt-1">{totalQuantity}</p>
                </div>
                <div className="bg-[#0B6E4F] rounded-2xl p-4 shadow-sm">
                    <p className="text-[11px] font-semibold tracking-widest text-white/60 uppercase">Total Value</p>
                    <p className="text-2xl font-bold mt-1 text-white">LKR {totalValue.toFixed(2)}</p>
                </div>
                <div className={`rounded-2xl p-4 shadow-sm ${lowStockItems > 0 ? "bg-red-50 border border-red-200" : "bg-white border border-black/5"}`}>
                    <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">Low Stock</p>
                    <p className={`text-2xl font-bold mt-1 ${lowStockItems > 0 ? "text-red-600" : "text-black"}`}>
                        {lowStockItems}
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search by name, barcode, or SKU..."
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExportExcel}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-medium text-[14px] cursor-pointer transition shadow-sm flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Excel
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-medium text-[14px] cursor-pointer transition shadow-sm flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        PDF
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Item Name</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Barcode</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Category</th>
                                <th className="px-4 py-3 text-center font-semibold text-gray-600">QTY</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-600">Cost Price</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-600">Amount</th>
                                <th className="px-4 py-3 text-center font-semibold text-gray-600">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400">No items found</td>
                                </tr>
                            ) : (
                                filteredData.map((item) => (
                                    <tr key={item.Id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                        <td className="px-4 py-3 font-medium text-gray-800">{item.Name}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.Barcode}</td>
                                        <td className="px-4 py-3 text-gray-600">{item.Category || "-"}</td>
                                        <td className="px-4 py-3 text-center font-mono">{item.StockQty}</td>
                                        <td className="px-4 py-3 text-right font-mono">
                                            LKR {typeof item.CostPrice === 'number' ? item.CostPrice.toFixed(2) : Number(item.CostPrice).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono font-semibold text-[#0B6E4F]">
                                            LKR {typeof item.Amount === 'number' ? item.Amount.toFixed(2) : Number(item.Amount).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {item.Status === "LOW_STOCK" ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    ⚠️ Low
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    ✅ OK
                                                </span>
                                            )}
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