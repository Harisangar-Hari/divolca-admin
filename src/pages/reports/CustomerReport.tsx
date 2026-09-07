// src/pages/reports/CustomerReport.tsx
import { useEffect, useState } from "react";
import { useToast } from "../../store/toastStore";
import { getCustomerReport } from "../../api/reportsApi";
import { getSalesReport } from "../../api/reportsApi";
import * as XLSX from "xlsx";

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

interface MonthlyOutstanding {
    month: string;
    year: number;
    amount: number;
}

interface CustomerWithMonthlyOutstanding extends CustomerItem {
    monthlyOutstanding: MonthlyOutstanding[];
}

// ✅ Helper function to safely convert to number
const toNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
};

export default function CustomerReport() {
    const [data, setData] = useState<CustomerItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredData, setFilteredData] = useState<CustomerItem[]>([]);
    const [showMonthlyView, setShowMonthlyView] = useState(false);
    const [customerMonthlyData, setCustomerMonthlyData] = useState<CustomerWithMonthlyOutstanding[]>([]);
    const { showToast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [customers, sales] = await Promise.all([
                getCustomerReport(),
                getSalesReport()
            ]);

            // ✅ Convert string values to numbers
            const parsedCustomers = customers.map((customer: any) => ({
                ...customer,
                CreditBalance: toNumber(customer.CreditBalance),
                CreditLimit: toNumber(customer.CreditLimit),
                TotalSpent: toNumber(customer.TotalSpent),
                LoyaltyPoints: toNumber(customer.LoyaltyPoints),
                TotalInvoices: toNumber(customer.TotalInvoices),
                TotalCredit: toNumber(customer.TotalCredit),
                TotalPaid: toNumber(customer.TotalPaid),
            }));

            setData(parsedCustomers);
            setFilteredData(parsedCustomers);

            // Calculate monthly outstanding for each customer
            const monthlyData = parsedCustomers.map((customer: CustomerItem) => {
                // Get all sales for this customer
                const customerSales = sales.filter((sale: any) =>
                    sale.CustomerName === customer.Name &&
                    toNumber(sale.BalanceAmount) > 0
                );

                // Group by month
                const monthMap: { [key: string]: { amount: number; month: string; year: number } } = {};

                customerSales.forEach((sale: any) => {
                    const date = new Date(sale.CreatedAt);
                    const month = date.toLocaleString('default', { month: 'short' });
                    const year = date.getFullYear();
                    const key = `${month}-${year}`;

                    if (!monthMap[key]) {
                        monthMap[key] = { amount: 0, month, year };
                    }
                    monthMap[key].amount += toNumber(sale.BalanceAmount);
                });

                const monthlyOutstanding: MonthlyOutstanding[] = Object.values(monthMap)
                    .sort((a, b) => (a.year * 12 + new Date(`${a.month} 1, 2000`).getMonth()) -
                        (b.year * 12 + new Date(`${b.month} 1, 2000`).getMonth()));

                return {
                    ...customer,
                    monthlyOutstanding
                };
            });

            setCustomerMonthlyData(monthlyData);
        } catch (error) {
            showToast("Failed to load customer data", "error");
            console.error(error);
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

    // ✅ Export to Excel - Monthly Outstanding Report
    const exportMonthlyToExcel = () => {
        try {
            // Prepare data for Excel
            const excelData: any[] = [];

            // Add header row
            excelData.push({
                'Customer Name': 'Customer Name',
                'Phone': 'Phone',
                'Customer Type': 'Customer Type',
                'Total Outstanding': 'Total Outstanding',
                'Month': 'Month',
                'Outstanding Amount': 'Outstanding Amount',
                // '% of Total': '% of Total',
            });

            // Add data rows
            customerMonthlyData
                .filter(c => c.monthlyOutstanding.length > 0)
                .forEach((customer) => {
                    const totalOutstanding = toNumber(customer.CreditBalance);

                    customer.monthlyOutstanding.forEach((month) => {
                        // const percentage = totalOutstanding > 0
                        //     ? (month.amount / totalOutstanding) * 100
                        //     : 0;

                        excelData.push({
                            'Customer Name': customer.Name,
                            'Phone': customer.Phone,
                            'Customer Type': customer.CustomerType,
                            'Total Outstanding': totalOutstanding,
                            'Month': `${month.month} ${month.year}`,
                            'Outstanding Amount': month.amount,
                            // '% of Total': percentage,
                        });
                    });

                    // Add a blank row between customers for readability
                    excelData.push({
                        'Customer Name': '',
                        'Phone': '',
                        'Customer Type': '',
                        'Total Outstanding': '',
                        'Month': '',
                        'Outstanding Amount': '',
                        // '% of Total': '',
                    });
                });

            // Remove the last blank row if it exists
            if (excelData.length > 0 && !excelData[excelData.length - 1]['Customer Name']) {
                excelData.pop();
            }

            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(excelData);

            // Auto-size columns
            const colWidths = [
                { wch: 25 }, // Customer Name
                { wch: 15 }, // Phone
                { wch: 15 }, // Customer Type
                { wch: 18 }, // Total Outstanding
                { wch: 15 }, // Month
                { wch: 20 }, // Outstanding Amount
                { wch: 15 }, // % of Total
            ];
            ws['!cols'] = colWidths;

            // Create workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Monthly Outstanding');

            // Generate filename
            const filename = `Customer_Monthly_Outstanding_${new Date().toISOString().split('T')[0]}.xlsx`;

            // Save file
            XLSX.writeFile(wb, filename);
            showToast("Monthly outstanding report exported successfully!", "success");
        } catch (error) {
            console.error("Export failed:", error);
            showToast("Failed to export monthly report", "error");
        }
    };

    // ✅ Export to Excel - Customer List
    const exportCustomerListToExcel = () => {
        try {
            const excelData = filteredData.map((customer) => ({
                'Name': customer.Name,
                'Phone': customer.Phone,
                'Email': customer.Email || '',
                'Address': customer.Address || '',
                'Customer Type': customer.CustomerType,
                'Total Spent': toNumber(customer.TotalSpent),
                'Outstanding': toNumber(customer.CreditBalance),
                'Credit Limit': toNumber(customer.CreditLimit),
                'Loyalty Points': toNumber(customer.LoyaltyPoints),
                'Loyalty Tier': customer.LoyaltyTier,
                'Total Invoices': customer.TotalInvoices,
            }));

            const ws = XLSX.utils.json_to_sheet(excelData);
            const colWidths = [
                { wch: 25 }, { wch: 15 }, { wch: 25 }, { wch: 30 },
                { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
                { wch: 15 }, { wch: 15 }, { wch: 15 }
            ];
            ws['!cols'] = colWidths;

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Customers');

            const filename = `Customers_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, filename);
            showToast("Customer list exported successfully!", "success");
        } catch (error) {
            console.error("Export failed:", error);
            showToast("Failed to export customer list", "error");
        }
    };

    const totalCustomers = filteredData.length;
    const totalCreditBalance = filteredData.reduce((sum, item) => sum + toNumber(item.CreditBalance), 0);
    const totalSpent = filteredData.reduce((sum, item) => sum + toNumber(item.TotalSpent), 0);

    if (loading) {
        return <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-black/5 animate-pulse" />)}</div>;
    }

    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                <div className="bg-blue-50 rounded-2xl p-4 shadow-sm border border-blue-200">
                    <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">Avg. Outstanding</p>
                    <p className="text-2xl font-bold mt-1 text-blue-600">
                        LKR {totalCustomers > 0 ? (totalCreditBalance / totalCustomers).toFixed(2) : '0.00'}
                    </p>
                </div>
            </div>

            {/* View Toggle & Export Buttons */}
            <div className="flex flex-wrap justify-between items-center gap-2">
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setShowMonthlyView(false)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition ${!showMonthlyView
                                ? 'bg-[#0B6E4F] text-white shadow-sm'
                                : 'bg-white border border-black/10 text-black/60 hover:bg-gray-50'
                            }`}
                    >
                        📋 Customer List
                    </button>
                    <button
                        onClick={() => setShowMonthlyView(true)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition ${showMonthlyView
                                ? 'bg-[#0B6E4F] text-white shadow-sm'
                                : 'bg-white border border-black/10 text-black/60 hover:bg-gray-50'
                            }`}
                    >
                        📊 Monthly Outstanding
                    </button>
                </div>

                {/* Export Buttons */}
                <div className="flex gap-2 flex-wrap">
                    {!showMonthlyView ? (
                        <button
                            onClick={exportCustomerListToExcel}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition shadow-sm flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export Excel
                        </button>
                    ) : (
                        <button
                            onClick={exportMonthlyToExcel}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition shadow-sm flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export Monthly
                        </button>
                    )}
                </div>
            </div>

            {/* Search */}
            {!showMonthlyView && (
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
            )}

            {/* Customer List View */}
            {!showMonthlyView && (
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
                                            <td className="px-4 py-3 text-right font-mono">LKR {toNumber(item.TotalSpent).toFixed(2)}</td>
                                            <td className={`px-4 py-3 text-right font-mono font-semibold ${toNumber(item.CreditBalance) > 0 ? "text-red-600" : "text-green-600"
                                                }`}>
                                                LKR {toNumber(item.CreditBalance).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    {toNumber(item.LoyaltyPoints)} pts
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
            )}

            {/* Monthly Outstanding View - Per Customer */}
            {showMonthlyView && (
                <div className="space-y-4">
                    {customerMonthlyData.filter(c => c.monthlyOutstanding.length > 0).length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-10 text-center text-gray-400">
                            No outstanding balances found
                        </div>
                    ) : (
                        customerMonthlyData
                            .filter(c => c.monthlyOutstanding.length > 0)
                            .map((customer) => {
                                const totalOutstanding = toNumber(customer.CreditBalance);
                                return (
                                    <div key={customer.Id} className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
                                        {/* Customer Header */}
                                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-gray-800">{customer.Name}</p>
                                                <p className="text-xs text-gray-500">{customer.Phone} • {customer.CustomerType}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-red-600">
                                                    Total Outstanding: LKR {totalOutstanding.toFixed(2)}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {customer.monthlyOutstanding.length} month(s)
                                                </p>
                                            </div>
                                        </div>

                                        {/* Monthly Breakdown */}
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-50 border-b border-gray-200">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left font-semibold text-gray-600">Month</th>
                                                        <th className="px-4 py-2 text-right font-semibold text-gray-600">Outstanding Amount</th>
                                                        <th className="px-4 py-2 text-center font-semibold text-gray-600">% of Total</th>
                                                        <th className="px-4 py-2 text-center font-semibold text-gray-600">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {customer.monthlyOutstanding.map((month, index) => {
                                                        const percentage = totalOutstanding > 0
                                                            ? (month.amount / totalOutstanding) * 100
                                                            : 0;
                                                        const isOldest = index === 0;
                                                        const isNewest = index === customer.monthlyOutstanding.length - 1;

                                                        return (
                                                            <tr key={`${customer.Id}-${month.month}-${month.year}`}
                                                                className={`border-b border-gray-100 hover:bg-gray-50 transition ${isOldest ? 'bg-yellow-50/30' : ''
                                                                    }`}>
                                                                <td className="px-4 py-2 font-medium text-gray-700">
                                                                    {month.month} {month.year}
                                                                    {isOldest && (
                                                                        <span className="ml-2 text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
                                                                            Oldest
                                                                        </span>
                                                                    )}
                                                                    {isNewest && month.amount > 0 && (
                                                                        <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
                                                                            Current
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-2 text-right font-mono font-semibold text-red-600">
                                                                    LKR {month.amount.toFixed(2)}
                                                                </td>
                                                                <td className="px-4 py-2 text-center">
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        <div className="w-20 bg-gray-200 rounded-full h-1.5">
                                                                            <div
                                                                                className="bg-red-500 h-1.5 rounded-full transition-all duration-500"
                                                                                style={{ width: `${Math.min(percentage, 100)}%` }}
                                                                            />
                                                                        </div>
                                                                        <span className="text-xs font-mono text-gray-500">
                                                                            {percentage.toFixed(1)}%
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-2 text-center">
                                                                    {month.amount > 0 ? (
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                                            ⚠️ Due
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                                            ✅ Paid
                                                                        </span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                                                    <tr>
                                                        <td className="px-4 py-2 font-semibold text-gray-700">Total</td>
                                                        <td className="px-4 py-2 text-right font-mono font-bold text-red-700">
                                                            LKR {customer.monthlyOutstanding.reduce((sum, m) => sum + m.amount, 0).toFixed(2)}
                                                        </td>
                                                        <td className="px-4 py-2 text-center text-xs text-gray-400" colSpan={2}>
                                                            {customer.monthlyOutstanding.length} month(s) with outstanding balance
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })
                    )}
                </div>
            )}
        </div>
    );
}