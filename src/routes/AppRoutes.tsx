import { Routes, Route, Navigate } from "react-router-dom";

import Layout from "../components/Layout";
import ProtectedRoute from "../components/ProtectedRoute";

import Login from "../pages/Login";

import Dashboard from "../pages/Dashboard";
import Products from "../pages/Products";
import Categories from "../pages/Categories";
import Sales from "../pages/Sales";
import SaleDetail from "../pages/SaleDetail";

import CreditCustomers from "../pages/CreditCustomers";
import CustomerCreditDetails from "../pages/CustomerCreditDetails";

import Purchases from "../pages/Purchases";
import PurchaseList from "../pages/purchases/PurchaseList";
import PurchaseDetails from "../pages/purchases/PurchaseDetails";

import Expenses from "../pages/Expenses";

import Suppliers from "../pages/Suppliers";
import SupplierDetails from "../pages/SupplierDetails";
import SupplierLedger from "../pages/SupplierLedger";
import CashDashboard from "../pages/CashDashboard";
import SupplierChequeDashboard from "../pages/SupplierChequeDashboard";
import PayCredit from "../pages/PayCredit";
import ReportsPage from "../pages/reports/ReportsPage";

export default function AppRoutes() {
  return (
    <Routes>

      {/* LOGIN */}
      <Route path="/login" element={<Login />} />

      {/* PROTECTED AREA */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* DASHBOARD */}
        <Route index element={<Dashboard />} />

        {/* PRODUCTS */}
        <Route path="products" element={<Products />} />

        {/* CATEGORIES */}
        <Route path="categories" element={<Categories />} />

        {/* SALES */}
        <Route path="sales" element={<Sales />} />
        <Route path="sales/:id" element={<SaleDetail />} />

        {/* CREDIT CUSTOMERS */}
        <Route path="credit-customers" element={<CreditCustomers />} />
        <Route path="credit-customers/:id" element={<CustomerCreditDetails />} />

        {/* PURCHASES */}
         <Route path="purchases/:id" element={<PurchaseDetails />} />

        <Route path="purchases" element={<Purchases />} />
        <Route path="purchases-list" element={<PurchaseList />} />
       
        {/* EXPENSES */}
        <Route path="expenses" element={<Expenses />} />

        {/* SUPPLIERS */}
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="suppliers/:id" element={<SupplierDetails />} />
        <Route path="suppliers/:id/ledger" element={<SupplierLedger />} />
        <Route path="/sales/:id/pay-credit" element={<PayCredit />} />
        <Route path="cash-dashboard" element={<CashDashboard />} />
        <Route path="supplier-cheque-dashboard" element={<SupplierChequeDashboard />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/reports/:tab" element={<ReportsPage />} />
      </Route>

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}