// src/pages/reports/ReportsPage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "../../store/toastStore";
import {
    getStockInHand,
    getSalesReport,
    getPurchaseReport,
    getCustomerReport,
    getProfitLossReport,
    exportStockToExcel,
    exportStockToPDF,
    exportSalesToExcel,
} from "../../api/reportsApi";

// Import report components
import StockInHandReport from "./StockInHandReport";
import SalesReport from "./SalesReport";
import PurchaseReport from "./PurchaseReport";
import CustomerReport from "./CustomerReport";
import ProfitLossReport from "./ProfitLossReport";

interface ReportTab {
    id: string;
    name: string;
    icon: React.ReactNode;
    component: React.ReactNode;
}

export default function ReportsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState("stock-in-hand");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const tabs: ReportTab[] = [
        {
            id: "stock-in-hand",
            name: "Stock In Hand",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            ),
            component: <StockInHandReport />,
        },
        {
            id: "sales",
            name: "Sales Report",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            component: <SalesReport />,
        },
        {
            id: "purchases",
            name: "Purchase Report",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            component: <PurchaseReport />,
        },
        {
            id: "customers",
            name: "Customer Report",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            component: <CustomerReport />,
        },
        {
            id: "profit-loss",
            name: "Profit & Loss",
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            ),
            component: <ProfitLossReport />,
        },
    ];

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
        setIsMobileMenuOpen(false);
        navigate(`/reports/${tabId}`);
    };

    const activeTabContent = tabs.find((tab) => tab.id === activeTab);

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#14181C]">Reports</h1>
                        <p className="text-sm text-black/40 mt-0.5">
                            View and export business reports
                        </p>
                    </div>
                </div>

                {/* Mobile Tab Selector */}
                <div className="md:hidden">
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="w-full bg-white border border-gray-300 rounded-xl p-3 flex items-center justify-between shadow-sm"
                    >
                        <span className="font-semibold text-gray-700">
                            {tabs.find((t) => t.id === activeTab)?.name || "Select Report"}
                        </span>
                        <svg
                            className={`w-5 h-5 transition-transform ${isMobileMenuOpen ? "rotate-180" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {isMobileMenuOpen && (
                        <div className="mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${activeTab === tab.id
                                        ? "bg-[#0B6E4F] text-white"
                                        : "hover:bg-gray-50 text-gray-700"
                                        }`}
                                >
                                    {tab.icon}
                                    {tab.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Desktop Tab Navigation */}
                <div className="hidden md:flex bg-white rounded-2xl shadow-sm border border-gray-200 p-1 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                ? "bg-[#0B6E4F] text-white shadow-sm"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                        >
                            {tab.icon}
                            {tab.name}
                        </button>
                    ))}
                </div>

                {/* Report Content */}
                <div className="mt-6">
                    {activeTabContent?.component}
                </div>
            </div>
        </div>
    );
}