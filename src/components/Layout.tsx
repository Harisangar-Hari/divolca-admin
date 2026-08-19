import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100 ">

      {/* ================= SIDEBAR ================= */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={`
          fixed md:static z-50 h-full bg-white border-r shadow
          transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
          w-64
        `}
      >
        <Sidebar close={() => setOpen(false)} />
      </div>

      {/* ================= MAIN AREA ================= */}
      <div className="flex-1 flex flex-col min-h-screen">

        {/* TOP BAR (mobile only) */}
        <div className="md:hidden flex items-center p-3 bg-white shadow">
          <button
            onClick={() => setOpen(true)}
            className="text-2xl"
          >
            ☰
          </button>

          <h1 className="ml-3 font-bold">MYL ADMIN</h1>
        </div>

        {/* ================= PAGE CONTENT ================= */}
        <main className="flex-1 overflow-y-auto bg-gray-100">

          {/* 🔥 THIS FIXES YOUR “EDGE TO EDGE UI” ISSUE */}
          <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-4">

            <Outlet />

          </div>

        </main>

      </div>
    </div>
  );
}