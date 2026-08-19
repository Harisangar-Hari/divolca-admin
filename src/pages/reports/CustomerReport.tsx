// src/pages/reports/CustomerReport.tsx
import { useEffect, useState } from "react";
import { useToast } from "../../store/toastStore";
import { getCustomerReport } from "../../api/reportsApi";

interface CustomerItem {
    Id: string;
    Name: string;
    Phone: string;
    Email: string;
    Address: string;
    CustomerType: string;
    CreditBalance: number;
    CreditLimit: number;
    TotalSpent: number;
    LoyaltyPoints: number;
    LoyaltyTier: string;
    TotalInvoices: number;
    TotalCredit: number;
    TotalPaid: number;
}

export default function CustomerReport() {
    const [data, setData] = useState<CustomerItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredData, setFilteredData] = useState<CustomerItem[]>([]);
    const { showToast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await getCustomerReport();
            setData(res);
            setFilteredData(res);
        } catch (error) {
            showToast("Failed to load customer data", "error");
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
                item.Phone.includes(term) ||
                (item.Email && item.Email.toLowerCase().includes(term.toLowerCase()))
        );
        setFilteredData(filtered);
    };

    const totalCustomers = filteredData.length;
    const totalCreditBalance = filteredData.reduce((sum, item) => sum + Number(item.CreditBalance), 0);
    const totalSpent = filteredData.reduce((sum, item) => sum + Number(item.TotalSpent), 0);

    if (loading) {
        return <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-black/5 animate-pulse" />)}</div>;
    }

    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-4">
                    <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">Total Customers</p>
                    <p className="text-2xl font-bold mt-1">{totalCustomers}</p>
                </div>
                <div className="bg-red-50 rounded-2xl p-4 shadow-sm border border-red-200">
                    <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">Total Outstanding</p>
                    <p className="text-2xl font-bold mt-1 text-red-600">LKR {totalCreditBalance.toFixed(2)}</p>
                </div>
                <div className="bg-[#0B6E4F] rounded-2xl p-4 shadow-sm">
                    <p className="text-[11px] font-semibold tracking-widest text-white/60 uppercase">Total Spent</p>
                    <p className="text-2xl font-bold mt-1 text-white">LKR {totalSpent.toFixed(2)}</p>
                </div>
            </div>

            {/* Search */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search by name, phone, or email..."
                        className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Phone</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">Type</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-600">Total Spent</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-600">Outstanding</th>
                                <th className="px-4 py-3 text-center font-semibold text-gray-600">Loyalty</th>
                                <th className="px-4 py-3 text-center font-semibold text-gray-600">Invoices</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-gray-400">No customers found</td>
                                </tr>
                            ) : (
                                filteredData.map((item) => (
                                    <tr key={item.Id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                        <td className="px-4 py-3 font-medium text-gray-800">{item.Name}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.Phone}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.CustomerType === "RETAIL" ? "bg-blue-100 text-blue-800" :
                                                    item.CustomerType === "WHOLESALE" ? "bg-purple-100 text-purple-800" :
                                                        item.CustomerType === "CORPORATE" ? "bg-indigo-100 text-indigo-800" :
                                                            item.CustomerType === "VIP" ? "bg-amber-100 text-amber-800" :
                                                                "bg-gray-100 text-gray-800"
                                                }`}>
                                                {item.CustomerType}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-mono">LKR {Number(item.TotalSpent).toFixed(2)}</td>
                                        <td className={`px-4 py-3 text-right font-mono font-semibold ${Number(item.CreditBalance) > 0 ? "text-red-600" : "text-green-600"}`}>
                                            LKR {Number(item.CreditBalance).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                {item.LoyaltyPoints} pts
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center font-mono">{item.TotalInvoices}</td>
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