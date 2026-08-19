import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Layers,
  BarChart3,
  Users,
  LogOut,
  ShoppingBag, DollarSign, FileText, Truck, Wallet
} from "lucide-react";


import logo from "../assets/logo.jpeg";

export default function Sidebar({ close }: { close?: () => void }) {
  const navigate = useNavigate();

  const linkClass = ({ isActive }: any) =>
    `group relative flex items-center gap-3 px-4 py-3 rounded-xl
     transition-all duration-300 ease-out transform
     ${isActive
      ? "bg-[#0B6E4F] text-white shadow-sm"
      : "text-white/40 hover:text-white/90 hover:bg-white/5 hover:translate-x-1"
    }`;

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="flex flex-col h-full justify-between bg-[#12171A] text-white">
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
          <NavLink to="/" onClick={close} className={linkClass}>
            <LayoutDashboard
              size={18}
              className="transition-transform duration-300 group-hover:scale-110"
            />
            <span className="transition-all duration-300 text-[14px] font-medium">
              Dashboard
            </span>
          </NavLink>

          <NavLink to="/products" onClick={close} className={linkClass}>
            <Package
              size={18}
              className="transition-transform duration-300 group-hover:scale-110"
            />
            <span className="text-[14px] font-medium">Products</span>
          </NavLink>

          <NavLink to="/categories" onClick={close} className={linkClass}>
            <Layers
              size={18}
              className="transition-transform duration-300 group-hover:scale-110"
            />
            <span className="text-[14px] font-medium">Categories</span>
          </NavLink>

          <NavLink to="/sales" onClick={close} className={linkClass}>
            <BarChart3
              size={18}
              className="transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-0.5"
            />
            <span className="text-[14px] font-medium">Sales</span>
          </NavLink>

          <NavLink
            to="/credit-customers"
            onClick={close}
            className={linkClass}
          >
            <Users
              size={18}
              className="transition-transform duration-300 group-hover:scale-110"
            />
            <span className="text-[14px] font-medium">Credit Customers</span>
          </NavLink>
          <NavLink to="/purchases" onClick={close} className={linkClass}>
            <ShoppingBag size={18} />
            <span className="text-[14px] font-medium">Purchases</span>
          </NavLink>
          <NavLink to="/purchases-list" onClick={close} className={linkClass}>
            <FileText size={18} />
            <span className="text-[14px] font-medium">Purchase Invoices</span>
          </NavLink>
          <NavLink to="/suppliers" onClick={close} className={linkClass}>
            <Truck size={18} />
            <span className="text-[14px] font-medium">Suppliers</span>
          </NavLink>
          <NavLink to="/expenses" onClick={close} className={linkClass}>
            <DollarSign size={18} />
            <span className="text-[14px] font-medium">Expenses</span>
          </NavLink>
          <NavLink to="/cash-dashboard" onClick={close} className={linkClass}>
            <Wallet
              size={18}
              className="transition-transform duration-300 group-hover:scale-110"
            />
            <span className="text-[14px] font-medium">Cash Dashboard</span>
          </NavLink>
          <NavLink to="/supplier-cheque-dashboard" onClick={close} className={linkClass}>
            <FileText
              size={18}
              className="transition-transform duration-300 group-hover:scale-110"
            />
            <span className="text-[14px] font-medium">Supplier Cheque Dashboard</span>
          </NavLink>
          <NavLink to="/reports" onClick={close} className={linkClass}>
            <BarChart3 size={18} />
            <span className="text-[14px] font-medium">Reports</span>
          </NavLink>
        </nav>
      </div>

      {/* BOTTOM LOGOUT */}
      <div className="px-2 pb-4">
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
  );
}