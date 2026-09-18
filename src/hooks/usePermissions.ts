import { useMemo } from "react";

export interface UserPermissions {
    canViewDashboard?: boolean;

    canViewProducts?: boolean;
    canCreateProducts?: boolean;
    canEditProducts?: boolean;
    canDeleteProducts?: boolean;

    canViewCategories?: boolean;
    canCreateCategories?: boolean;
    canEditCategories?: boolean;
    canDeleteCategories?: boolean;

    canViewSales?: boolean;
    canCreateSales?: boolean;
    canEditSales?: boolean;
    canDeleteSales?: boolean;

    canViewCustomers?: boolean;
    canCreateCustomers?: boolean;
    canEditCustomers?: boolean;
    canDeleteCustomers?: boolean;
    canManageCreditPayments?: boolean;

    canViewCustomerCheques?: boolean;
    canManageCustomerCheques?: boolean;

    canViewReports?: boolean;
    canExportReports?: boolean;

    canViewPurchases?: boolean;
    canCreatePurchases?: boolean;
    canEditPurchases?: boolean;
    canDeletePurchases?: boolean;

    canViewSuppliers?: boolean;
    canCreateSuppliers?: boolean;
    canEditSuppliers?: boolean;
    canDeleteSuppliers?: boolean;

    canViewSupplierCheques?: boolean;
    canManageSupplierCheques?: boolean;

    canViewExpenses?: boolean;
    canCreateExpenses?: boolean;
    canEditExpenses?: boolean;
    canDeleteExpenses?: boolean;

    canViewCashDashboard?: boolean;

    canManageUsers?: boolean;
    canManageSettings?: boolean;

    [key: string]: boolean | undefined;
}

export interface LoggedInUser {
    id: string;
    username: string;
    role: string;
    fullName?: string | null;
    email?: string | null;
    permissions: UserPermissions;
}

export function usePermissions() {
    const user = useMemo<LoggedInUser | null>(() => {
        try {
            const raw = localStorage.getItem("user");
            if (!raw) return null;
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }, []);

    const permissions = user?.permissions || {};

    const can = (key: string): boolean => {
        return permissions[key] === true;
    };

    return {
        user,
        permissions,
        can,
        role: user?.role || null,
    };
}