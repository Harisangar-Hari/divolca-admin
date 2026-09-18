import { api } from "./axios";

export type UserRole = "admin" | "manager" | "sales" | "cashier" | "viewer";

export interface User {
    id: string;
    username: string;
    role: UserRole;
    fullName?: string | null;
    email?: string | null;
    isActive: boolean;
    createdAt: string;
    lastLogin?: string | null;
}

export interface UserPermissions {
    [key: string]: boolean;
}

// =========================
// GET ALL USERS
// =========================
export const getUsers = async (): Promise<User[]> => {
    const res = await api.get("/auth/users");
    return res.data.map((u: any) => ({
        id: u.id,
        username: u.username,
        role: u.role,
        fullName: u.fullName ?? null,
        email: u.email ?? null,
        isActive: u.isActive ?? true,
        createdAt: u.createdAt,
        lastLogin: u.lastLogin ?? null,
    }));
};

// =========================
// CREATE USER
// =========================
export const createUser = async (data: {
    username: string;
    password: string;
    role: UserRole;
    fullName?: string;
    email?: string;
}) => {
    const res = await api.post("/auth/users", data);
    return res.data;
};

// =========================
// UPDATE USER
// =========================
export const updateUser = async (
    id: string,
    data: {
        username?: string;
        password?: string;
        role?: UserRole;
        fullName?: string;
        email?: string;
        isActive?: boolean;
    }
) => {
    const res = await api.put(`/auth/users/${id}`, data);
    return res.data;
};

// =========================
// DELETE USER
// =========================
export const deleteUser = async (id: string) => {
    const res = await api.delete(`/auth/users/${id}`);
    return res.data;
};

// =========================
// TOGGLE USER STATUS
// =========================
export const toggleUserStatus = async (id: string) => {
    const res = await api.patch(`/auth/users/${id}/toggle-status`);
    return res.data;
};

// =========================
// GET PERMISSIONS FOR ROLE
// =========================
export const getPermissionsForRole = async (
    role: UserRole
): Promise<UserPermissions> => {
    const res = await api.get(`/auth/permissions/${role}`);
    return res.data;
};