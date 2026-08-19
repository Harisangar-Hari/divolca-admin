import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSuppliers } from "../api/supplierApi";

interface Supplier {
    id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    createdAt: string;
}

export default function Suppliers() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [search, setSearch] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        const res = await getSuppliers();
        setSuppliers(res);
    };

    const filtered = suppliers.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.phone.includes(search)
    );

    return (
        <div className="min-h-screen bg-[#EEF1EF] p-4 md:p-6 font-sans text-[#14181C]">
            <div className="max-w-3xl mx-auto space-y-4">

                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Suppliers</h1>
                    <span className="text-[11px] font-mono text-black/40">
                        {suppliers.length} {suppliers.length === 1 ? "supplier" : "suppliers"}
                    </span>
                </div>

                {/* SEARCH */}
                <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-white shadow-sm focus-within:ring-2 focus-within:ring-black/10 transition">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" className="ml-3 shrink-0 text-black/35">
                        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                        <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search supplier..."
                        className="w-full py-3 pr-3 bg-transparent text-[15px] cursor-text outline-none placeholder:text-black/30"
                    />
                </div>

                {/* LIST */}
                {filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-black/5 py-14 text-center text-black/30 text-sm">
                        {suppliers.length === 0 ? "No suppliers yet" : "No suppliers match your search"}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filtered.map((s) => (
                            <div
                                key={s.id}
                                onClick={() => navigate(`/suppliers/${s.id}`)}
                                className="bg-white p-4 rounded-2xl shadow-sm border border-black/5 cursor-pointer hover:border-[#4338CA]/30 hover:bg-[#F3F6F4] transition flex items-center justify-between"
                            >
                                <div>
                                    <p className="font-semibold text-[14px]">{s.name}</p>
                                    <p className="text-[13px] text-black/40 font-mono mt-0.5">{s.phone}</p>
                                </div>

                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-black/25 shrink-0">
                                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}