import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    getCreditCustomers,
    createCustomer,
} from "../api/customerApi";

interface CustomerCredit {
    id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    companyName?: string;
    customerType: string;
    creditLimit: number;
    creditBalance: number;
    availableCredit: number;
    isActive: boolean;
    isBlocked: boolean;
    totalPurchases: number;
    totalPaid: number;
    totalBalance: number;
    activeCreditSales: number;
    loyaltyPoints: number;
    loyaltyTier: string;
    totalInvoices: number;
}

export default function CreditCustomers() {
    const [customers, setCustomers] = useState<CustomerCredit[]>([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);

    // Form state for creating customer
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        address: "",
        deliveryAddress: "",
        billingAddress: "",
        city: "",
        state: "",
        postalCode: "",
        country: "Srilanka",
        alternativePhone: "",
        companyName: "",
        taxNumber: "",
        customerType: "RETAIL",
        creditLimit: 0,
        paymentTerms: "Due on receipt",
        notes: "",
    });

    // Filter states
    const [view, setView] = useState<"all" | "credit" | "blocked">("all");
    const [customerTypeFilter, setCustomerTypeFilter] = useState<string>("ALL");
    const [minCreditLimit, setMinCreditLimit] = useState<number>(0);

    const navigate = useNavigate();

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            setLoading(true);
            const data = await getCreditCustomers();
            setCustomers(data || []);
        } catch {
            alert("Failed to load customers");
        } finally {
            setLoading(false);
        }
    };

    // Filter customers
    const filteredCustomers = customers.filter((c) => {
        const q = search.toLowerCase();

        // Search filter
        const matchesSearch =
            c.name.toLowerCase().includes(q) ||
            c.phone.includes(search) ||
            (c.email && c.email.toLowerCase().includes(q)) ||
            (c.companyName && c.companyName.toLowerCase().includes(q));

        // View filter
        const matchesView =
            view === "all"
                ? true
                : view === "credit"
                    ? c.totalBalance > 0
                    : c.isBlocked;

        // Customer type filter
        const matchesType =
            customerTypeFilter === "ALL" || c.customerType === customerTypeFilter;

        // Credit limit filter
        const matchesCreditLimit = c.creditLimit >= minCreditLimit;

        return matchesSearch && matchesView && matchesType && matchesCreditLimit;
    });

    // Statistics
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.isActive).length;
    const blockedCustomers = customers.filter(c => c.isBlocked).length;
    const customersWithOutstanding = customers.filter(c => c.totalBalance > 0).length;
    const totalOutstanding = customers.reduce(
        (sum, c) => sum + (c.totalBalance || 0),
        0
    );
    const totalCreditLimit = customers.reduce(
        (sum, c) => sum + (c.creditLimit || 0),
        0
    );

    const handleCreateCustomer = async () => {
        if (!formData.name.trim()) return alert("Customer name is required");
        if (!formData.phone.trim()) return alert("Phone number is required");

        try {
            await createCustomer({
                name: formData.name,
                phone: formData.phone,
                email: formData.email || undefined,
                address: formData.address || undefined,
                deliveryAddress: formData.deliveryAddress || undefined,
                billingAddress: formData.billingAddress || undefined,
                city: formData.city || undefined,
                state: formData.state || undefined,
                postalCode: formData.postalCode || undefined,
                country: formData.country || "Bangladesh",
                alternativePhone: formData.alternativePhone || undefined,
                creditLimit: formData.creditLimit,
                companyName: formData.companyName || undefined,
                taxNumber: formData.taxNumber || undefined,
                customerType: formData.customerType || "RETAIL",
                paymentTerms: formData.paymentTerms || "Due on receipt",
                notes: formData.notes || undefined,
            });

            alert("Customer created successfully");

            // Reset form
            setFormData({
                name: "",
                phone: "",
                email: "",
                address: "",
                deliveryAddress: "",
                billingAddress: "",
                city: "",
                state: "",
                postalCode: "",
                country: "srilanka",
                alternativePhone: "",
                companyName: "",
                taxNumber: "",
                customerType: "RETAIL",
                creditLimit: 0,
                paymentTerms: "Due on receipt",
                notes: "",
            });

            setShowModal(false);
            await load();
        } catch (error: any) {
            alert(
                error?.response?.data?.message ||
                error?.response?.data ||
                error?.message ||
                "Failed to create customer"
            );
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (name === 'creditLimit') {
            const numValue = parseFloat(value);
            setFormData(prev => ({
                ...prev,
                [name]: isNaN(numValue) ? 0 : numValue
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'number' ? parseFloat(value) || 0 : value
            }));
        }
    };

    const getCustomerTypeBadgeColor = (type: string) => {
        const colors: Record<string, string> = {
            RETAIL: "bg-blue-100 text-blue-800",
            WHOLESALE: "bg-purple-100 text-purple-800",
            CORPORATE: "bg-indigo-100 text-indigo-800",
            VIP: "bg-amber-100 text-amber-800",
            GOVERNMENT: "bg-red-100 text-red-800",
            EDUCATIONAL: "bg-green-100 text-green-800",
        };
        return colors[type] || "bg-gray-100 text-gray-800";
    };

    if (loading) {
        return (
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 rounded-2xl bg-black/5 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-5">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-[#14181C]">
                        Credit customers
                    </h1>
                    <p className="text-[13px] text-black/40 mt-0.5">
                        Manage customer credit balances and profiles
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setShowFilterModal(true)}
                        className="bg-white border border-black/10 hover:bg-black/5 text-black/70 px-4 py-2.5 rounded-xl font-medium text-[14px] cursor-pointer transition shadow-sm inline-flex items-center gap-1.5 justify-center"
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                            <path d="M3 6h18M5 12h14M8 18h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        Filter
                    </button>

                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-[#0B6E4F] hover:bg-[#0A5F44] text-white px-4 py-2.5 rounded-xl font-medium text-[14px] cursor-pointer transition shadow-sm inline-flex items-center gap-1.5 justify-center"
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        Add customer
                    </button>
                </div>
            </div>

            {/* TOGGLE VIEW */}
            <div className="flex bg-white border border-black/5 rounded-xl p-1 w-full md:w-fit shadow-sm">
                <button
                    onClick={() => setView("all")}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-[14px] font-medium cursor-pointer transition ${view === "all"
                        ? "bg-[#14181C] text-white shadow-sm"
                        : "text-black/50 hover:text-black/70"
                        }`}
                >
                    All ({totalCustomers})
                </button>

                <button
                    onClick={() => setView("credit")}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-[14px] font-medium cursor-pointer transition ${view === "credit"
                        ? "bg-red-600 text-white shadow-sm"
                        : "text-black/50 hover:text-black/70"
                        }`}
                >
                    On credit ({customersWithOutstanding})
                </button>

                <button
                    onClick={() => setView("blocked")}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-[14px] font-medium cursor-pointer transition ${view === "blocked"
                        ? "bg-gray-800 text-white shadow-sm"
                        : "text-black/50 hover:text-black/70"
                        }`}
                >
                    Blocked ({blockedCustomers})
                </button>
            </div>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-4">
                    <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                        {view === "credit" ? "Outstanding" : "Total customers"}
                    </p>
                    <p className="text-2xl font-bold mt-1 font-mono tabular-nums">
                        {view === "credit" ? customersWithOutstanding : totalCustomers}
                    </p>
                    <p className="text-[11px] text-black/30 mt-1">
                        {activeCustomers} active
                    </p>
                </div>

                <div className="bg-[#12171A] rounded-2xl p-4 shadow-sm">
                    <p className="text-[11px] font-semibold tracking-widest text-white/40 uppercase">
                        Outstanding balance
                    </p>
                    <p className="text-2xl font-bold mt-1 font-mono tabular-nums text-[#F87171] [text-shadow:0_0_18px_rgba(248,113,113,0.35)]">
                        Rs {totalOutstanding.toLocaleString()}
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-4">
                    <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                        Total credit limit
                    </p>
                    <p className="text-2xl font-bold mt-1 font-mono tabular-nums text-[#0B6E4F]">
                        Rs {totalCreditLimit.toLocaleString()}
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-4">
                    <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase">
                        Avg. credit usage
                    </p>
                    <p className="text-2xl font-bold mt-1 font-mono tabular-nums">
                        {totalCustomers > 0 && totalCreditLimit > 0
                            ? Math.round((totalOutstanding / totalCreditLimit) * 100)
                            : 0}%
                    </p>
                </div>
            </div>

            {/* SEARCH */}
            <div className="relative">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30">
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, phone, email, or company…"
                    className="w-full border border-black/10 bg-white rounded-xl p-3 pl-11 text-[14px] outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition shadow-sm"
                />
                {search && (
                    <button
                        onClick={() => setSearch("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-black/30 hover:text-black/60"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* LIST */}
            <div className="grid gap-3">
                {filteredCustomers.length === 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-10 text-center text-black/30 text-sm">
                        {search ? "No customers match your search" : "No customers found"}
                    </div>
                )}

                {filteredCustomers.map((c) => (
                    <div
                        key={c.id}
                        onClick={() =>
                            navigate(`/credit-customers/${c.id}`)
                        }
                        className={`bg-white p-4 rounded-2xl shadow-sm border cursor-pointer hover:shadow-md hover:border-black/10 transition ${c.isBlocked ? "border-red-200 bg-red-50/30" : "border-black/5"
                            }`}
                    >
                        <div className="flex flex-col md:flex-row md:items-center gap-3">

                            {/* NAME & INFO */}
                            <div className="flex-1 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#F3F6F4] flex items-center justify-center text-[#4338CA] font-semibold text-sm shrink-0">
                                    {(c.name || "?").charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-semibold text-[15px] text-[#14181C]">
                                            {c.name}
                                        </p>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getCustomerTypeBadgeColor(c.customerType)}`}>
                                            {c.customerType}
                                        </span>
                                        {c.isBlocked && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                                                BLOCKED
                                            </span>
                                        )}
                                        {!c.isActive && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                                                INACTIVE
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-[12px] text-black/40">
                                        <span className="font-mono">{c.phone}</span>
                                        {c.email && <span>• {c.email}</span>}
                                        {c.companyName && <span>• {c.companyName}</span>}
                                        {c.city && <span>• {c.city}</span>}
                                    </div>
                                </div>
                            </div>

                            {/* CREDIT INFO */}
                            <div className="flex items-center gap-4 md:gap-6 flex-wrap">
                                <div className="text-right">
                                    <p className="text-[10px] text-black/30 uppercase tracking-wider font-semibold">
                                        Balance
                                    </p>
                                    <p className={`text-base font-bold font-mono tabular-nums ${c.totalBalance > 0 ? "text-red-600" : "text-[#0B6E4F]"
                                        }`}>
                                        Rs {c.totalBalance.toLocaleString()}
                                    </p>
                                </div>

                                <div className="text-right">
                                    <p className="text-[10px] text-black/30 uppercase tracking-wider font-semibold">
                                        Credit Limit
                                    </p>
                                    <p className="text-sm font-mono tabular-nums text-black/70">
                                        Rs {c.creditLimit.toLocaleString()}
                                    </p>
                                </div>

                                <div className="text-right">
                                    <p className="text-[10px] text-black/30 uppercase tracking-wider font-semibold">
                                        Invoices
                                    </p>
                                    <p className="text-sm font-mono tabular-nums text-black/70">
                                        {c.activeCreditSales} active
                                    </p>
                                </div>

                                <div className="text-right">
                                    <p className="text-[10px] text-black/30 uppercase tracking-wider font-semibold">
                                        Loyalty
                                    </p>
                                    <p className="text-sm font-mono tabular-nums text-black/70">
                                        {c.loyaltyPoints} pts
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>
                ))}
            </div>

            {/* CREATE CUSTOMER MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4 shadow-xl">

                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-[#14181C]">
                                Create customer
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-black/30 hover:text-black/60"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            {/* Personal Info */}
                            <div className="space-y-3 md:col-span-2">
                                <h3 className="text-sm font-semibold text-black/60">Personal Information</h3>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] text-black/60 font-medium">
                                    Customer name *
                                </label>
                                <input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g. John Doe"
                                    className="w-full border border-black/10 bg-[#FAFAF8] rounded-xl p-3 text-[14px] outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] text-black/60 font-medium">
                                    Phone number *
                                </label>
                                <input
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="+8801712345678"
                                    className="w-full border border-black/10 bg-[#FAFAF8] rounded-xl p-3 text-[14px] font-mono outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] text-black/60 font-medium">
                                    Email
                                </label>
                                <input
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="john@example.com"
                                    className="w-full border border-black/10 bg-[#FAFAF8] rounded-xl p-3 text-[14px] outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] text-black/60 font-medium">
                                    Alternative phone
                                </label>
                                <input
                                    name="alternativePhone"
                                    value={formData.alternativePhone}
                                    onChange={handleInputChange}
                                    placeholder="+8801812345678"
                                    className="w-full border border-black/10 bg-[#FAFAF8] rounded-xl p-3 text-[14px] font-mono outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] text-black/60 font-medium">
                                    Company name
                                </label>
                                <input
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleInputChange}
                                    placeholder="ABC Corporation"
                                    className="w-full border border-black/10 bg-[#FAFAF8] rounded-xl p-3 text-[14px] outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                                />
                            </div>

                            {/* Address */}
                            <div className="space-y-3 md:col-span-2">
                                <h3 className="text-sm font-semibold text-black/60">Address Information</h3>
                            </div>

                            <div className="flex flex-col gap-1.5 md:col-span-2">
                                <label className="text-[13px] text-black/60 font-medium">
                                    Address
                                </label>
                                <input
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    placeholder="123 Main Street"
                                    className="w-full border border-black/10 bg-[#FAFAF8] rounded-xl p-3 text-[14px] outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] text-black/60 font-medium">
                                    City
                                </label>
                                <input
                                    name="city"
                                    value={formData.city}
                                    onChange={handleInputChange}
                                    placeholder="jaffna"
                                    className="w-full border border-black/10 bg-[#FAFAF8] rounded-xl p-3 text-[14px] outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] text-black/60 font-medium">
                                    State
                                </label>
                                <input
                                    name="state"
                                    value={formData.state}
                                    onChange={handleInputChange}
                                    placeholder="jaffna"
                                    className="w-full border border-black/10 bg-[#FAFAF8] rounded-xl p-3 text-[14px] outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] text-black/60 font-medium">
                                    Postal code
                                </label>
                                <input
                                    name="postalCode"
                                    value={formData.postalCode}
                                    onChange={handleInputChange}
                                    placeholder="1212"
                                    className="w-full border border-black/10 bg-[#FAFAF8] rounded-xl p-3 text-[14px] outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] text-black/60 font-medium">
                                    Country
                                </label>
                                <input
                                    name="country"
                                    value={formData.country}
                                    onChange={handleInputChange}
                                    placeholder="Srilanka"
                                    className="w-full border border-black/10 bg-[#FAFAF8] rounded-xl p-3 text-[14px] outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                                />
                            </div>

                            {/* Business Info */}
                            <div className="space-y-3 md:col-span-2">
                                <h3 className="text-sm font-semibold text-black/60">Business Information</h3>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] text-black/60 font-medium">
                                    Customer type
                                </label>
                                <select
                                    name="customerType"
                                    value={formData.customerType}
                                    onChange={handleInputChange}
                                    className="w-full border border-black/10 bg-[#FAFAF8] rounded-xl p-3 text-[14px] outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                                >
                                    <option value="RETAIL">Retail</option>
                                    <option value="WHOLESALE">Wholesale</option>
                                    <option value="CORPORATE">Corporate</option>
                                    <option value="VIP">VIP</option>
                                    <option value="GOVERNMENT">Government</option>
                                    <option value="EDUCATIONAL">Educational</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] text-black/60 font-medium">
                                    Tax number (VAT/GST/TIN)
                                </label>
                                <input
                                    name="taxNumber"
                                    value={formData.taxNumber}
                                    onChange={handleInputChange}
                                    placeholder="123456789012"
                                    className="w-full border border-black/10 bg-[#FAFAF8] rounded-xl p-3 text-[14px] outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] text-black/60 font-medium">
                                    Credit limit
                                </label>
                                <input
                                    name="creditLimit"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.creditLimit || ''}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        const numValue = parseFloat(value);
                                        setFormData(prev => ({
                                            ...prev,
                                            creditLimit: value === '' ? 0 : (isNaN(numValue) ? 0 : numValue)
                                        }));
                                    }}
                                    placeholder="0.00"
                                    className="w-full border border-black/10 bg-[#FAFAF8] rounded-xl p-3 text-[14px] font-mono outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] text-black/60 font-medium">
                                    Payment terms
                                </label>
                                <input
                                    name="paymentTerms"
                                    value={formData.paymentTerms}
                                    onChange={handleInputChange}
                                    placeholder="Net 30 days"
                                    className="w-full border border-black/10 bg-[#FAFAF8] rounded-xl p-3 text-[14px] outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5 md:col-span-2">
                                <label className="text-[13px] text-black/60 font-medium">
                                    Notes
                                </label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    placeholder="Additional notes about the customer..."
                                    rows={2}
                                    className="w-full border border-black/10 bg-[#FAFAF8] rounded-xl p-3 text-[14px] outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1 border-t border-black/5">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2.5 bg-[#F3F6F4] hover:bg-[#E7ECE9] text-black/70 rounded-xl font-medium text-[14px] cursor-pointer transition"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleCreateCustomer}
                                className="px-4 py-2.5 bg-[#0B6E4F] hover:bg-[#0A5F44] text-white rounded-xl font-medium text-[14px] cursor-pointer transition shadow-sm"
                            >
                                Create customer
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* FILTER MODAL */}
            {showFilterModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl">
                        <h2 className="text-lg font-semibold text-[#14181C]">
                            Filter customers
                        </h2>

                        <div className="space-y-3">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] text-black/60 font-medium">
                                    Customer type
                                </label>
                                <select
                                    value={customerTypeFilter}
                                    onChange={(e) => setCustomerTypeFilter(e.target.value)}
                                    className="w-full border border-black/10 bg-[#FAFAF8] rounded-xl p-3 text-[14px] outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                                >
                                    <option value="ALL">All types</option>
                                    <option value="RETAIL">Retail</option>
                                    <option value="WHOLESALE">Wholesale</option>
                                    <option value="CORPORATE">Corporate</option>
                                    <option value="VIP">VIP</option>
                                    <option value="GOVERNMENT">Government</option>
                                    <option value="EDUCATIONAL">Educational</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[13px] text-black/60 font-medium">
                                    Minimum credit limit
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={minCreditLimit}
                                    onChange={(e) => setMinCreditLimit(parseFloat(e.target.value) || 0)}
                                    placeholder="0"
                                    className="w-full border border-black/10 bg-[#FAFAF8] rounded-xl p-3 text-[14px] font-mono outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                            <button
                                onClick={() => {
                                    setCustomerTypeFilter("ALL");
                                    setMinCreditLimit(0);
                                }}
                                className="px-4 py-2.5 bg-[#F3F6F4] hover:bg-[#E7ECE9] text-black/70 rounded-xl font-medium text-[14px] cursor-pointer transition"
                            >
                                Reset
                            </button>

                            <button
                                onClick={() => setShowFilterModal(false)}
                                className="px-4 py-2.5 bg-[#0B6E4F] hover:bg-[#0A5F44] text-white rounded-xl font-medium text-[14px] cursor-pointer transition shadow-sm"
                            >
                                Apply filters
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}