import { api } from "./axios";

export interface Purchase {
    id: string;
    invoiceNumber: string;
    purchaseDate: string;
    grandTotal: number;
    supplierId: string;
    balanceAmount: number;
    paidAmount: number;

    supplier: {
        id: string;
        name: string;
        phone: string;
        email?: string;
        address?: string;
    };

    itemsCount: number;
}


export const getPurchases = async (): Promise<Purchase[]> => {

    const res = await api.get("/purchases");

    return res.data.map((p: any) => ({
        id: p.Id,

        invoiceNumber: p.InvoiceNumber,

        purchaseDate: p.PurchaseDate,

        purchaseNumber: p.PurchaseNumber,

        grandTotal: Number(p.GrandTotal ?? 0),

        supplierId: p.SupplierId,
        status: p.Status !== undefined ? p.Status : 0,

        balanceAmount: Number(p.BalanceAmount ?? 0),

        paidAmount: Number(p.PaidAmount ?? 0),


        supplier: p.Suppliers
            ? {
                id: p.Suppliers.Id,
                name: p.Suppliers.Name,
                phone: p.Suppliers.Phone,
                email: p.Suppliers.Email,
                address: p.Suppliers.Address
            }
            : null,


        itemsCount: p._count?.PurchaseItems ?? 0
    }));

};

export const getPurchaseById = async (id: string) => {

    const res = await api.get(`/purchases/${id}`);

    const p = res.data;


    return {

        id: p.Id,

        invoiceNumber: p.InvoiceNumber,

        purchaseDate: p.PurchaseDate,

        supplierId: p.SupplierId ?? p.supplier?.Id,
        grandTotal: Number(p.GrandTotal ?? 0),

        paidAmount: Number(p.PaidAmount ?? 0),

        balanceAmount: Number(p.BalanceAmount ?? 0),

        status: p.Status !== undefined ? p.Status : 0,

        supplier: p.supplier
            ? {
                id: p.supplier.Id,
                name: p.supplier.Name,
                phone: p.supplier.Phone,
                email: p.supplier.Email,
                address: p.supplier.Address
            }
            : null,



        items: (p.items ?? []).map((item: any) => ({

            productId: item.ProductId,

            productName: item.productName,

            quantity: item.Quantity,

            costPrice: Number(item.CostPrice ?? 0),

            lineTotal: Number(item.lineTotal ?? 0)

        }))

    };

};

export const cancelPurchase = async (id: string, reason?: string) => {
    const res = await api.delete(`/purchases/cancel/${id}`, {
        data: { reason },
    });
    return res.data;
};

// ✅ Cancel purchase by invoice number
export const cancelPurchaseByInvoice = async (invoiceNumber: string, reason?: string) => {
    const res = await api.delete(`/purchases/cancel/invoice/${invoiceNumber}`, {
        data: { reason },
    });
    return res.data;
};