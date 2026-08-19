import { useEffect, useState } from "react";
import { getSales } from "../api/salesApi";
import { useNavigate } from "react-router-dom";
import { Search, Calendar, X, ChevronRight } from "lucide-react";

export default function Sales() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      const data = await getSales();
      setSales(data);
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter((s) => {
    const matchSearch = (s.invoiceNumber || "")
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchDate = date
      ? new Date(s.createdAt).toISOString().split("T")[0] === date
      : true;

    return matchSearch && matchDate;
  });

  const isReturned = (status: any) =>
    status === 1 || status === "Returned";

  const getPaymentStatus = (s: any) => {
    // 1. Check if fully returned first (Overrides everything else)
    if (isReturned(s.status)) return "Returned";

    // 2. Check if partially paid
    if (s.balanceAmount > 0 && s.paidAmount > 0) return "Partial";

    // 3. If balance is 0, paidAmount is 0, AND HasReturns is true -> Fully Refunded
    if (s.hasReturns && s.paidAmount === 0 && s.balanceAmount === 0) return "Refunded";

    // 4. If paidAmount is 0 and no return happened
    if (s.paidAmount === 0) return "Unpaid";

    return "Paid";
  };

  const statusColor = (s: any) => {
    if (isReturned(s.status)) return "bg-red-50 text-red-600";
    if (s.hasReturns && s.paidAmount === 0 && s.balanceAmount === 0) return "bg-purple-50 text-purple-600"; // Refunded
    if (s.balanceAmount > 0) return "bg-amber-50 text-amber-700";
    return "bg-emerald-50 text-[#0B6E4F]";
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-3 bg-[#EEF1EF] min-h-screen">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-2xl bg-black/5 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EEF1EF] p-4 md:p-6 font-sans text-[#14181C]">
      <div className="max-w-4xl mx-auto space-y-5">

        <div>
          <h1 className="text-2xl font-bold">Sales</h1>
          <p className="text-[13px] text-black/40 mt-0.5">
            {filteredSales.length} of {sales.length} invoices
          </p>
        </div>

        {/* FILTERS */}
        <div className="flex flex-col md:flex-row gap-2">

          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoice number…"
              className="w-full border border-black/10 bg-white p-3 pl-10 rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition shadow-sm"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-black/10 bg-white p-3 pl-10 rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition shadow-sm cursor-pointer"
            />
          </div>

          <button
            onClick={() => {
              setSearch("");
              setDate("");
            }}
            className="flex items-center gap-1.5 bg-white hover:bg-[#F3F6F4] border border-black/10 text-black/60 px-4 rounded-xl text-[14px] font-medium cursor-pointer transition shadow-sm shrink-0"
          >
            <X className="w-4 h-4" />
            Reset
          </button>

        </div>

        {/* LIST */}
        <div className="grid gap-3">

          {filteredSales.length === 0 && (
            <div className="bg-white rounded-2xl border border-black/5 py-14 text-center text-black/30 text-sm">
              No sales match these filters
            </div>
          )}

          {filteredSales.map((s) => (
            <div
              key={s.id}
              onClick={() => navigate(`/sales/${s.id}`)}
              className="bg-white p-4 rounded-2xl shadow-sm border border-black/5 cursor-pointer hover:shadow-md hover:border-black/10 transition"
            >
              <div className="flex justify-between items-center gap-3">

                <div>
                  <p className="font-semibold flex items-center gap-2 flex-wrap">
                    <span className="font-mono">{s.invoiceNumber}</span>

                    <span className={`text-[11px] font-semibold tracking-wide px-2 py-1 rounded-full ${statusColor(s)}`}>
                      {getPaymentStatus(s)}
                    </span>
                  </p>

                  <p className="text-[13px] text-black/40 mt-1">
                    {new Date(s.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="font-mono font-bold text-[15px]">Rs {s.totalAmount}</p>
                    <p className="text-[13px] text-black/40">
                      {s.itemsCount} items
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-black/20" />
                </div>

              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}