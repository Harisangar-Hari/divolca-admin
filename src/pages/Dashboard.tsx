import { useEffect, useState } from "react";
import {
  getDashboardStats,
  getSalesTrend,
  getTopProducts,
  getLowStockProducts,
} from "../api/dashboardApi";
import type { DashboardStats } from "../types/dashboard";

import {
  Boxes,
  ShoppingCart,
  Receipt,
  AlertTriangle,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function Dashboard() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    loadTrend();
    loadTopProducts();
    loadLowStock();
  }, []);

  const loadData = async () => {
    const res = await getDashboardStats();
    setData(res);
    setLoading(false);
  };

  const loadTrend = async () => {
    const res = await getSalesTrend();
    setTrend(res);
  };

  const loadTopProducts = async () => {
    const res = await getTopProducts();
    setTopProducts(res);
  };

  const loadLowStock = async () => {
    const res = await getLowStockProducts();
    setLowStock(res); // ✅ IMPORTANT FIX
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EEF1EF] p-4 md:p-6 font-sans">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="h-8 w-56 rounded-lg bg-black/5 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-black/5 animate-pulse" />
            ))}
          </div>
          <div className="h-72 rounded-2xl bg-black/5 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#EEF1EF] p-4 md:p-6 font-sans flex items-center justify-center">
        <p className="text-black/40 text-sm">Failed to load dashboard</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EEF1EF] p-4 md:p-6 font-sans text-[#14181C]">
      <div className="max-w-6xl mx-auto space-y-5">

        {/* HEADER */}
        <h1 className="text-2xl font-bold">
          Dashboard Analytics
        </h1>

        {/* KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card icon={<Boxes size={18} />} title="Products" value={data.totalProducts} tone="indigo" />
          <Card icon={<ShoppingCart size={18} />} title="Categories" value={data.totalCategories} tone="neutral" />
          <Card icon={<Receipt size={18} />} title="Today sales" value={`Rs ${data.todaySales}`} tone="green" />
          <Card icon={<AlertTriangle size={18} />} title="Low stock" value={lowStock.length} tone="red" />
        </div>

        {/* SECOND ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card icon={<Receipt size={18} />} title="Total revenue" value={`Rs ${data.totalRevenue ?? 0}`} tone="green" />
          <Card icon={<ShoppingCart size={18} />} title="Today orders" value={data.todayOrders ?? 0} tone="indigo" />
          <Card icon={<AlertTriangle size={18} />} title="Out of stock" value={data.outOfStockItems ?? 0} tone="red" />
        </div>

        {/* CHART */}
        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-black/5">
          <h2 className="text-[11px] font-semibold tracking-widest text-black/40 uppercase mb-4">
            Sales trend (weekly)
          </h2>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(20,24,28,0.06)" />
              <XAxis dataKey="day" stroke="rgba(20,24,28,0.35)" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(20,24,28,0.35)" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid rgba(20,24,28,0.08)",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  fontSize: 13,
                }}
              />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#0B6E4F"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#0B6E4F" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* TOP PRODUCTS */}
        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-black/5">
          <h2 className="text-[11px] font-semibold tracking-widest text-black/40 uppercase mb-2">
            Top selling products
          </h2>

          {topProducts.length === 0 ? (
            <div className="py-8 text-center text-black/30 text-sm">
              No sales data yet
            </div>
          ) : (
            <div className="divide-y divide-dashed divide-black/10">
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-[#F3F6F4] text-[11px] font-mono font-semibold text-black/50 shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-[14px]">{p.name}</span>
                  </div>
                  <span className="font-mono font-semibold text-[13px] text-[#0B6E4F]">
                    {p.quantity} sold
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LOW STOCK */}
        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-black/5">
          <h2 className="text-[11px] font-semibold tracking-widest text-red-600 uppercase mb-2 flex items-center gap-1.5">
            <AlertTriangle size={13} />
            Low stock products
          </h2>

          {lowStock.length === 0 ? (
            <div className="py-8 text-center text-black/30 text-sm">
              Nothing running low right now
            </div>
          ) : (
            <div className="divide-y divide-dashed divide-black/10">
              {lowStock.map((p) => (
                <div key={p.id} className="flex justify-between items-center py-2.5">
                  <span className="text-[14px]">{p.name}</span>
                  <span className="text-red-600 font-mono font-semibold text-[13px]">
                    {p.stockQty} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

/* ================= CARD ================= */
const TONES: Record<string, { bg: string; text: string }> = {
  neutral: { bg: "bg-black/5", text: "text-black/60" },
  green: { bg: "bg-[#0B6E4F]/10", text: "text-[#0B6E4F]" },
  red: { bg: "bg-red-50", text: "text-red-600" },
  indigo: { bg: "bg-[#4338CA]/10", text: "text-[#4338CA]" },
};

function Card({
  icon,
  title,
  value,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  tone?: "neutral" | "green" | "red" | "indigo";
}) {
  const t = TONES[tone] ?? TONES.neutral;

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-black/5">
      <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${t.bg} ${t.text}`}>
        {icon}
      </div>

      <p className="text-[11px] font-semibold tracking-widest text-black/40 uppercase mt-3">
        {title}
      </p>

      <p className="text-2xl font-mono font-bold mt-1">
        {value}
      </p>
    </div>
  );
}