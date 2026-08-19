import { api } from "./axios";
import type { DashboardStats } from "../types/dashboard";

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const res = await api.get("/dashboard/stats");
  return res.data;
};

export const getSalesTrend = async () => {
  const res = await api.get("/dashboard/sales-trend");
  return res.data;
};

// TOP PRODUCTS
export const getTopProducts = async () => {
  const res = await api.get("/dashboard/top-products");
  return res.data;
};
export const getLowStockProducts = async () => {
  const res = await api.get("/dashboard/low-stock-products");
  return res.data;
};
