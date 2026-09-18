import { useEffect, useState } from "react";
import { useToast } from "../store/toastStore";
import {
    getUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    getPermissionsForRole,
    type User,
    type UserRole,
    type UserPermissions,
} from "../api/usersApi";

// ============================================
// PERMISSION LABELS (human-readable)
// ============================================
const PERMISSION_LABELS: Record<string, string> = {
    canViewDashboard: "View Dashboard",
    canViewSales: "View Sales",
    canCreateSales: "Create Sales",
    canEditSales: "Edit Sales",
    canDeleteSales: "Delete Sales",
    canViewProducts: "View Products",
    canCreateProducts: "Create Products",
    canEditProducts: "Edit Products",
    canDeleteProducts: "Delete Products",
    canViewCustomers: "View Customers",
    canCreateCustomers: "Create Customers",
    canEditCustomers: "Edit Customers",
    canDeleteCustomers: "Delete Customers",
    canViewReports: "View Reports",
    canExportReports: "Export Reports",
    canViewPurchases: "View Purchases",
    canCreatePurchases: "Create Purchases",
    canEditPurchases: "Edit Purchases",
    canDeletePurchases: "Delete Purchases",
    canViewSuppliers: "View Suppliers",
    canCreateSuppliers: "Create Suppliers",
    canEditSuppliers: "Edit Suppliers",
    canDeleteSuppliers: "Delete Suppliers",
    canViewExpenses: "View Expenses",
    canCreateExpenses: "Create Expenses",
    canEditExpenses: "Edit Expenses",
    canDeleteExpenses: "Delete Expenses",
    canManageUsers: "Manage Users",
    canManageSettings: "Manage Settings",
};

const ROLE_COLORS: Record<UserRole, string> = {
    admin: "bg-red-100 text-red-800",
    manager: "bg-indigo-100 text-indigo-800",
    cashier: "bg-emerald-100 text-emerald-800",
    viewer: "bg-gray-100 text-gray-800",
    sales: "bg-blue-100 text-blue-800",
};

export default function Users() {
    const { showToast } = useToast();

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [saving, setSaving] = useState(false);

    // form state
    const [form, setForm] = useState({
        username: "",
        password: "",
        confirmPassword: "",
        role: "cashier" as UserRole,
        fullName: "",
        email: "",
    });

    // permissions preview
    const [permissions, setPermissions] = useState<UserPermissions | null>(null);
    const [permissionsLoading, setPermissionsLoading] = useState(false);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            setLoading(true);
            const data = await getUsers();
            setUsers(data);
        } catch {
            showToast("Failed to load users", "error");
        } finally {
            setLoading(false);
        }
    };

    // Fetch permissions whenever role changes
    useEffect(() => {
        const fetchPermissions = async () => {
            try {
                setPermissionsLoading(true);
                const perms = await getPermissionsForRole(form.role);
                setPermissions(perms);
            } catch {
                setPermissions(null);
            } finally {
                setPermissionsLoading(false);
            }
        };

        if (showModal) {
            fetchPermissions();
        }
    }, [form.role, showModal]);

    const openCreate = () => {
        setEditingUser(null);
        setForm({
            username: "",
            password: "",
            confirmPassword: "",
            role: "cashier",
            fullName: "",
            email: "",
        });
        setShowModal(true);
    };

    const openEdit = (user: User) => {
        setEditingUser(user);
        setForm({
            username: user.username,
            password: "",
            confirmPassword: "",
            role: user.role,
            fullName: user.fullName || "",
            email: user.email || "",
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.username.trim()) {
            showToast("Username is required", "error");
            return;
        }

        if (!editingUser) {
            if (!form.password || form.password.length < 6) {
                showToast("Password must be at least 6 characters", "error");
                return;
            }
            if (form.password !== form.confirmPassword) {
                showToast("Passwords do not match", "error");
                return;
            }
        } else if (form.password) {
            // editing + changing password
            if (form.password.length < 6) {
                showToast("Password must be at least 6 characters", "error");
                return;
            }
            if (form.password !== form.confirmPassword) {
                showToast("Passwords do not match", "error");
                return;
            }
        }

        try {
            setSaving(true);

            if (editingUser) {
                const payload: any = {
                    username: form.username,
                    role: form.role,
                    fullName: form.fullName || undefined,
                    email: form.email || undefined,
                };
                if (form.password) {
                    payload.password = form.password;
                }
                await updateUser(editingUser.id, payload);
                showToast("User updated successfully", "success");
            } else {
                await createUser({
                    username: form.username,
                    password: form.password,
                    role: form.role,
                    fullName: form.fullName || undefined,
                    email: form.email || undefined,
                });
                showToast("User created successfully", "success");
            }

            setShowModal(false);
            await load();
        } catch (err: any) {
            showToast(
                err?.response?.data?.message || "Failed to save user",
                "error"
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (user: User) => {
        if (user.role === "admin") {
            showToast("Admin users cannot be deleted", "error");
            return;
        }

        if (!confirm(`Delete user "${user.username}"?`)) return;

        try {
            await deleteUser(user.id);
            showToast("User deleted", "success");
            await load();
        } catch (err: any) {
            showToast(
                err?.response?.data?.message || "Failed to delete user",
                "error"
            );
        }
    };

    const handleToggleStatus = async (user: User) => {
        try {
            await toggleUserStatus(user.id);
            showToast(
                user.isActive ? "User deactivated" : "User activated",
                "success"
            );
            await load();
        } catch (err: any) {
            showToast(
                err?.response?.data?.message || "Failed to toggle status",
                "error"
            );
        }
    };

    const filtered = users.filter((u) =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        (u.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(search.toLowerCase())
    );

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
                    <h1 className="text-2xl font-bold text-[#14181C]">Users</h1>
                    <p className="text-[13px] text-black/40 mt-0.5">
                        {users.length} {users.length === 1 ? "user" : "users"} in system
                    </p>
                </div>

                <button
                    onClick={openCreate}
                    className="bg-[#0B6E4F] hover:bg-[#0A5F44] text-white px-4 py-2.5 rounded-xl font-medium text-[14px] cursor-pointer transition shadow-sm inline-flex items-center gap-1.5 justify-center"
                >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Add user
                </button>
            </div>

            {/* SEARCH */}
            <div className="relative">
                <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30"
                >
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by username, name, or email…"
                    className="w-full border border-black/10 bg-white rounded-xl p-3 pl-11 text-[14px] outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition shadow-sm"
                />
            </div>

            {/* LIST */}
            <div className="bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-[13px]">
                        <thead className="text-left text-black/40 border-b border-black/5">
                            <tr>
                                <th className="p-4 font-semibold text-[11px] uppercase tracking-widest">User</th>
                                <th className="font-semibold text-[11px] uppercase tracking-widest">Role</th>
                                <th className="font-semibold text-[11px] uppercase tracking-widest">Email</th>
                                <th className="font-semibold text-[11px] uppercase tracking-widest">Status</th>
                                <th className="font-semibold text-[11px] uppercase tracking-widest">Last Login</th>
                                <th className="font-semibold text-[11px] uppercase tracking-widest text-right pr-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-10 text-center text-black/30">
                                        {search ? "No users match your search" : "No users yet"}
                                    </td>
                                </tr>
                            )}

                            {filtered.map((u) => (
                                <tr
                                    key={u.id}
                                    className="border-b border-black/5 last:border-0 hover:bg-[#FAFAF8] transition"
                                >
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-[#F3F6F4] flex items-center justify-center text-[#4338CA] font-semibold text-sm shrink-0">
                                                {(u.fullName || u.username).charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-[#14181C]">{u.username}</p>
                                                {u.fullName && (
                                                    <p className="text-[12px] text-black/40">{u.fullName}</p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-full uppercase ${ROLE_COLORS[u.role]}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="font-mono text-black/60 text-[12px]">
                                        {u.email || "—"}
                                    </td>
                                    <td>
                                        {u.isActive ? (
                                            <span className="text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-full bg-emerald-50 text-[#0B6E4F]">
                                                Active
                                            </span>
                                        ) : (
                                            <span className="text-[11px] font-semibold tracking-wide px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
                                                Inactive
                                            </span>
                                        )}
                                    </td>
                                    <td className="text-[12px] text-black/50">
                                        {u.lastLogin
                                            ? new Date(u.lastLogin).toLocaleString()
                                            : "—"}
                                    </td>
                                    <td className="p-3 pr-4">
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => openEdit(u)}
                                                className="px-3 py-1.5 bg-[#F3F6F4] hover:bg-[#E7ECE9] text-black/70 rounded-lg font-medium text-[12px] cursor-pointer transition"
                                            >
                                                Edit
                                            </button>

                                            <button
                                                onClick={() => handleToggleStatus(u)}
                                                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg font-medium text-[12px] cursor-pointer transition"
                                            >
                                                {u.isActive ? "Disable" : "Enable"}
                                            </button>

                                            {u.role !== "admin" && (
                                                <button
                                                    onClick={() => handleDelete(u)}
                                                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium text-[12px] cursor-pointer transition"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ================= MODAL ================= */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-xl flex flex-col">
                        {/* HEADER */}
                        <div className="p-6 border-b border-black/5 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-[#14181C]">
                                {editingUser ? "Edit user" : "Create user"}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-black/30 hover:text-black/60"
                            >
                                ✕
                            </button>
                        </div>

                        {/* BODY */}
                        <div className="overflow-y-auto flex-1 p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[12px] font-semibold text-black/50 uppercase tracking-wider">
                                        Username *
                                    </label>
                                    <input
                                        type="text"
                                        value={form.username}
                                        onChange={(e) =>
                                            setForm({ ...form, username: e.target.value })
                                        }
                                        placeholder="e.g. cashier1"
                                        className="w-full mt-1 border border-black/10 bg-[#FAFAF8] p-3 rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                                    />
                                </div>

                                <div>
                                    <label className="text-[12px] font-semibold text-black/50 uppercase tracking-wider">
                                        Role *
                                    </label>
                                    <select
                                        value={form.role}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                role: e.target.value as UserRole,
                                            })
                                        }
                                        className="w-full mt-1 border border-black/10 bg-[#FAFAF8] p-3 rounded-xl text-[14px] cursor-pointer outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                                    >
                                        <option value="admin">Admin</option>
                                        <option value="manager">Manager</option>
                                        <option value="cashier">Cashier</option>
                                        <option value="viewer">Viewer</option>
                                        <option value="sales">Sales</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[12px] font-semibold text-black/50 uppercase tracking-wider">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        value={form.fullName}
                                        onChange={(e) =>
                                            setForm({ ...form, fullName: e.target.value })
                                        }
                                        placeholder="e.g. John Doe"
                                        className="w-full mt-1 border border-black/10 bg-[#FAFAF8] p-3 rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                                    />
                                </div>

                                <div>
                                    <label className="text-[12px] font-semibold text-black/50 uppercase tracking-wider">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={(e) =>
                                            setForm({ ...form, email: e.target.value })
                                        }
                                        placeholder="e.g. john@example.com"
                                        className="w-full mt-1 border border-black/10 bg-[#FAFAF8] p-3 rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                                    />
                                </div>

                                <div>
                                    <label className="text-[12px] font-semibold text-black/50 uppercase tracking-wider">
                                        {editingUser ? "New Password (leave blank to keep)" : "Password *"}
                                    </label>
                                    <input
                                        type="password"
                                        value={form.password}
                                        onChange={(e) =>
                                            setForm({ ...form, password: e.target.value })
                                        }
                                        placeholder="Minimum 6 characters"
                                        className="w-full mt-1 border border-black/10 bg-[#FAFAF8] p-3 rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                                    />
                                </div>

                                <div>
                                    <label className="text-[12px] font-semibold text-black/50 uppercase tracking-wider">
                                        {editingUser ? "Confirm New Password" : "Confirm Password *"}
                                    </label>
                                    <input
                                        type="password"
                                        value={form.confirmPassword}
                                        onChange={(e) =>
                                            setForm({ ...form, confirmPassword: e.target.value })
                                        }
                                        placeholder="Re-enter password"
                                        className="w-full mt-1 border border-black/10 bg-[#FAFAF8] p-3 rounded-xl text-[14px] outline-none focus:ring-2 focus:ring-[#0B6E4F]/30 focus:border-[#0B6E4F] transition"
                                    />
                                </div>
                            </div>

                            {/* PERMISSIONS PREVIEW */}
                            <div className="border-t border-black/5 pt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-[12px] font-semibold text-black/50 uppercase tracking-wider">
                                        Permissions for <span className="text-[#0B6E4F]">{form.role}</span>
                                    </p>
                                    {permissionsLoading && (
                                        <span className="text-[11px] text-black/30">Loading…</span>
                                    )}
                                </div>

                                {permissions ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 bg-[#FAFAF8] border border-black/5 rounded-xl p-4">
                                        {Object.entries(permissions).map(([key, allowed]) => (
                                            <div
                                                key={key}
                                                className="flex items-center justify-between text-[12px] py-1"
                                            >
                                                <span className={allowed ? "text-black/70" : "text-black/30 line-through"}>
                                                    {PERMISSION_LABELS[key] || key}
                                                </span>
                                                <span
                                                    className={`font-mono font-semibold ${allowed ? "text-[#0B6E4F]" : "text-red-400"
                                                        }`}
                                                >
                                                    {allowed ? "✓" : "✕"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    !permissionsLoading && (
                                        <p className="text-[12px] text-black/30">
                                            Could not load permissions
                                        </p>
                                    )
                                )}
                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="p-6 border-t border-black/5 flex justify-end gap-2">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2.5 bg-[#F3F6F4] hover:bg-[#E7ECE9] text-black/70 rounded-xl font-medium text-[14px] cursor-pointer transition"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2.5 bg-[#0B6E4F] hover:bg-[#0A5F44] text-white rounded-xl font-medium text-[14px] cursor-pointer transition shadow-sm disabled:opacity-50"
                            >
                                {saving ? "Saving…" : editingUser ? "Update user" : "Create user"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}