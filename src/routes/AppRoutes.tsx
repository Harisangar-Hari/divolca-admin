import { Routes, Route, Navigate } from "react-router-dom";

import Layout from "../components/Layout";
import ProtectedRoute from "../components/ProtectedRoute";
import PermissionRoute from "../components/PermissionRoute";

import Login from "../pages/Login";

import Dashboard from "../pages/Dashboard";
import Products from "../pages/Products";
import Categories from "../pages/Categories";
import Sales from "../pages/Sales";
import SaleDetail from "../pages/SaleDetail";

import CreditCustomers from "../pages/CreditCustomers";
import CustomerCreditDetails from "../pages/CustomerCreditDetails";
import CustomerCheques from "../pages/CustomerCheques";

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
import Users from "../pages/Users";
import Returns from "../pages/Returns";

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
        <Route
          index
          element={
            <PermissionRoute required="canViewDashboard">
              <Dashboard />
            </PermissionRoute>
          }
        />

        {/* PRODUCTS */}
        <Route
          path="products"
          element={
            <PermissionRoute required="canViewProducts">
              <Products />
            </PermissionRoute>
          }
        />

        {/* CATEGORIES */}
        <Route
          path="categories"
          element={
            <PermissionRoute required="canViewCategories">
              <Categories />
            </PermissionRoute>
          }
        />

        {/* SALES */}
        <Route
          path="sales"
          element={
            <PermissionRoute required="canViewSales">
              <Sales />
            </PermissionRoute>
          }
        />
        <Route
          path="sales/:id"
          element={
            <PermissionRoute required="canViewSales">
              <SaleDetail />
            </PermissionRoute>
          }
        />
        <Route
          path="sales/:id/pay-credit"
          element={
            <PermissionRoute required="canManageCreditPayments">
              <PayCredit />
            </PermissionRoute>
          }
        />

        {/* CREDIT CUSTOMERS */}
        <Route
          path="credit-customers"
          element={
            <PermissionRoute required="canViewCustomers">
              <CreditCustomers />
            </PermissionRoute>
          }
        />
        <Route
          path="credit-customers/:id"
          element={
            <PermissionRoute required="canViewCustomers">
              <CustomerCreditDetails />
            </PermissionRoute>
          }
        />

        {/* CUSTOMER CHEQUES */}
        <Route
          path="customer-cheques"
          element={
            <PermissionRoute required="canViewCustomerCheques">
              <CustomerCheques />
            </PermissionRoute>
          }
        />

        {/* PURCHASES */}
        <Route
          path="purchases"
          element={
            <PermissionRoute required="canViewPurchases">
              <Purchases />
            </PermissionRoute>
          }
        />
        <Route
          path="purchases-list"
          element={
            <PermissionRoute required="canViewPurchases">
              <PurchaseList />
            </PermissionRoute>
          }
        />
        <Route
          path="purchases/:id"
          element={
            <PermissionRoute required="canViewPurchases">
              <PurchaseDetails />
            </PermissionRoute>
          }
        />

        {/* EXPENSES */}
        <Route
          path="expenses"
          element={
            <PermissionRoute required="canViewExpenses">
              <Expenses />
            </PermissionRoute>
          }
        />

        {/* SUPPLIERS */}
        <Route
          path="suppliers"
          element={
            <PermissionRoute required="canViewSuppliers">
              <Suppliers />
            </PermissionRoute>
          }
        />
        <Route
          path="suppliers/:id"
          element={
            <PermissionRoute required="canViewSuppliers">
              <SupplierDetails />
            </PermissionRoute>
          }
        />
        <Route
          path="suppliers/:id/ledger"
          element={
            <PermissionRoute required="canViewSuppliers">
              <SupplierLedger />
            </PermissionRoute>
          }
        />

        {/* CASH DASHBOARD */}
        <Route
          path="cash-dashboard"
          element={
            <PermissionRoute required="canViewCashDashboard">
              <CashDashboard />
            </PermissionRoute>
          }
        />

        {/* SUPPLIER CHEQUE DASHBOARD */}
        <Route
          path="supplier-cheque-dashboard"
          element={
            <PermissionRoute required="canViewSupplierCheques">
              <SupplierChequeDashboard />
            </PermissionRoute>
          }
        />

        {/* REPORTS */}
        <Route
          path="reports"
          element={
            <PermissionRoute required="canViewReports">
              <ReportsPage />
            </PermissionRoute>
          }
        />
        <Route
          path="reports/:tab"
          element={
            <PermissionRoute required="canViewReports">
              <ReportsPage />
            </PermissionRoute>
          }
        />

        {/* USERS (admin only) */}
        <Route
          path="users"
          element={
            <PermissionRoute required="canManageUsers">
              <Users />
            </PermissionRoute>
          }
        />

        <Route
          path="returns"
          element={
            <PermissionRoute required="canViewSales">
              <Returns />
            </PermissionRoute>
          }
        />
      </Route>

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}