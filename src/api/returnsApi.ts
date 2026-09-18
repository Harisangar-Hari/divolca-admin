import { api } from "./axios";

export interface ReturnItem {
    ProductId: string;
    ProductName: string;
    ProductBarcode: string | null;
    Quantity: number;
    UnitPrice: number;
    Reason: string | null;
    LineTotal: number;
}

export interface SaleReturn {
    Id: string;
    ReturnedAt: string;
    Reason: string;
    ReturnAmount: number;
    RefundAmount: number;
    RefundMethod: string | null;

    SaleId: string;
    InvoiceNumber: string | null;
    SaleDate: string | null;

    CustomerId: string | null;
    CustomerName: string;
    CustomerPhone: string | null;

    Items: ReturnItem[];
}

export const getReturns = async (filters?: {
    startDate?: string;
    endDate?: string;
    customerId?: string;
    productId?: string;
}): Promise<SaleReturn[]> => {
    const res = await api.get("/sales/returns", {
        params: filters || {},
    });

    return (res.data || []).map((r: any) => ({
        Id: r.Id,
        ReturnedAt: r.ReturnedAt,
        Reason: r.Reason,
        ReturnAmount: Number(r.ReturnAmount || 0),
        RefundAmount: Number(r.RefundAmount || 0),
        RefundMethod: r.RefundMethod || null,

        SaleId: r.SaleId,
        InvoiceNumber: r.InvoiceNumber || null,
        SaleDate: r.SaleDate || null,

        CustomerId: r.CustomerId || null,
        CustomerName: r.CustomerName || "Walk-in Customer",
        CustomerPhone: r.CustomerPhone || null,

        Items: (r.Items || []).map((it: any) => ({
            ProductId: it.ProductId,
            ProductName: it.ProductName || "Unknown",
            ProductBarcode: it.ProductBarcode || null,
            Quantity: Number(it.Quantity || 0),
            UnitPrice: Number(it.UnitPrice || 0),
            Reason: it.Reason || null,
            LineTotal: Number(it.LineTotal || 0),
        })),
    }));
};