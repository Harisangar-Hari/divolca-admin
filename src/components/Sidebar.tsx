import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Layers,
  BarChart3,
  Users,
  LogOut,
  ShoppingBag,
  DollarSign,
  FileText,
  Truck,
  Wallet,
  UserCog,
  FileCheck,
  RotateCcw,
} from "lucide-react";

import logo from "../assets/logo.jpeg";
import { usePermissions } from "../hooks/usePermissions";
import { api } from "../api/axios";

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  permission: string;
  end?: boolean;
}

export default function Sidebar({ close }: { close?: () => void }) {
  const navigate = useNavigate();
  const { user, can } = usePermissions();

  const linkClass = ({ isActive }: any) =>
    `group relative flex items-center gap-3 px-4 py-3 rounded-xl
         transition-all duration-300 ease-out transform
         ${isActive
      ? "bg-[#0B6E4F] text-white shadow-sm"
      : "text-white/40 hover:text-white/90 hover:bg-white/5 hover:translate-x-1"
    }`;

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");   // ✅ clears httpOnly cookie
    } catch {
      // ignore
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };
  const navItems: NavItem[] = [
    {
      to: "/",
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
      permission: "canViewDashboard",
      end: true,
    },
    {
      to: "/products",
      label: "Products",
      icon: <Package size={18} />,
      permission: "canViewProducts",
    },
    {
      to: "/categories",
      label: "Categories",
      icon: <Layers size={18} />,
      permission: "canViewCategories",
    },
    {
      to: "/sales",
      label: "Sales",
      icon: <BarChart3 size={18} />,
      permission: "canViewSales",
    },
    {
      to: "/credit-customers",
      label: "Credit Customers",
      icon: <Users size={18} />,
      permission: "canViewCustomers",
    },
    {
      to: "/customer-cheques",
      label: "Customer Cheques",
      icon: <FileCheck size={18} />,
      permission: "canViewCustomerCheques",
    },
    {
      to: "/reports",
      label: "Reports",
      icon: <BarChart3 size={18} />,
      permission: "canViewReports",
    },
    {
      to: "/purchases",
      label: "Purchases",
      icon: <ShoppingBag size={18} />,
      permission: "canViewPurchases",
    },
    {
      to: "/purchases-list",
      label: "Purchase Invoices",
      icon: <FileText size={18} />,
      permission: "canViewPurchases",
    },
    {
      to: "/suppliers",
      label: "Suppliers",
      icon: <Truck size={18} />,
      permission: "canViewSuppliers",
    },
    {
      to: "/expenses",
      label: "Expenses",
      icon: <DollarSign size={18} />,
      permission: "canViewExpenses",
    },
    {
      to: "/cash-dashboard",
      label: "Cash Dashboard",
      icon: <Wallet size={18} />,
      permission: "canViewCashDashboard",
    },
    {
      to: "/supplier-cheque-dashboard",
      label: "Supplier Cheque Dashboard",
      icon: <FileText size={18} />,
      permission: "canViewSupplierCheques",
    },
    {
    to: "/returns",
    label: "Returns",
    icon: <RotateCcw size={18} />,
    permission: "canViewSales",
},
    {
      to: "/users",
      label: "Users",
      icon: <UserCog size={18} />,
      permission: "canManageUsers",
    },
  ];

  // Filter out links the user cannot access
  const visibleItems = navItems.filter((item) => can(item.permission));

  return (
    <div className="flex flex-col h-full justify-between bg-[#12171A] text-white overflow-scroll scrollbar-none">
      {/* TOP SECTION */}
      <div>
        {/* BRAND */}
        <div className="m-3 mb-6">
          <div className="flex items-center gap-3 rounded-2xl bg-white/[0.03] px-4 py-4 border border-white/5 transition-all duration-300 hover:border-white/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white transition-transform duration-300 group-hover:scale-105">
              <img
                src={logo}
                alt="Karrali"
                className="h-8 w-8 object-contain"
              />
            </div>

            <div>
              <h2 className="text-sm font-semibold tracking-wide text-white">
                KARRALI
              </h2>
              <p className="text-[11px] font-mono text-white/40">
                KARRALI-DIVOLCA
              </p>
            </div>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="space-y-1 px-2">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={close}
              className={linkClass}
            >
              <span className="transition-transform duration-300 group-hover:scale-110">
                {item.icon}
              </span>
              <span className="text-[14px] font-medium">
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* BOTTOM: USER CARD + LOGOUT */}
        <div className="px-2 pb-4 space-y-2 mt-5">
          {user && (
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="w-9 h-9 rounded-full bg-[#0B6E4F] flex items-center justify-center text-white font-semibold text-sm shrink-0">
                {(user.fullName || user.username || "?")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-white truncate">
                  {user.fullName || user.username}
                </p>
                <p className="text-[10px] font-mono uppercase tracking-wider text-[#4ADE9A]">
                  {user.role}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="group flex items-center gap-3 px-4 py-3 w-full rounded-xl text-red-400
                               hover:text-red-300 hover:bg-red-500/10
                               transition-all duration-300 ease-out hover:translate-x-1"
          >
            <LogOut
              size={18}
              className="transition-transform duration-300 group-hover:rotate-12"
            />
            <span className="text-[14px] font-medium">Logout</span>
          </button>
        </div>
      </div>


    </div>
  );
}