import { api } from "./axios";

export interface Supplier {
    id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;
    createdAt: string;
}


export const getSuppliers = async (): Promise<Supplier[]> => {

    const res = await api.get("/suppliers");

    return res.data.map((s: any) => ({
        id: s.Id,
        name: s.Name,
        phone: s.Phone,
        email: s.Email,
        address: s.Address,
        createdAt: s.CreatedAt
    }));

};

export const getSupplierById = async (id: string): Promise<Supplier> => {
    const res = await api.get(`/suppliers/${id}`);
    return res.data;
};

export const createSupplier = async (data: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
}) => {
    const res = await api.post("/suppliers", data);
    return res.data;
};

export const updateSupplier = async (
    id: string,
    data: {
        name: string;
        phone: string;
        email?: string;
        address?: string;
    }
) => {
    const res = await api.put(`/suppliers/${id}`, data);
    return res.data;
};

export const deleteSupplier = async (id: string) => {
    const res = await api.delete(`/suppliers/${id}`);
    return res.data;
};

export interface SupplierDetails {
    id: string;
    name: string;
    phone: string;
    email?: string;
    address?: string;

    purchases: SupplierPurchase[];
}
export interface SupplierPurchase {
    id: string;
    invoiceNumber: string;
    grandTotal: number;
    paidAmount: number;
    balanceAmount: number;
    purchaseDate: string;
}
export const getSupplierDetails = async (
    id: string
): Promise<SupplierDetails> => {

    const res = await api.get(`/suppliers/${id}`);

    const s = res.data;


    return {

        id: s.Id,

        name: s.Name,

        phone: s.Phone,

        email: s.Email,

        address: s.Address,


        purchases: (s.purchases ?? []).map((p: any) => ({

            id: p.Id,

            invoiceNumber: p.InvoiceNumber,

            grandTotal: Number(p.GrandTotal ?? 0),

            paidAmount: Number(p.PaidAmount ?? 0),

            balanceAmount: Number(p.BalanceAmount ?? 0),

            purchaseDate: p.PurchaseDate

        }))

    };

};

export interface SupplierLedgerResponse {

    supplier: {
        id: string;
        name: string;
        phone: string;
    };


    summary: {
        totalPurchases: number;
        totalPaid: number;
        totalOutstanding: number;
    };


    invoices: {

        id: string;
        invoiceNumber: string;
        purchaseDate: string;
        grandTotal: number;
        supplierId: string;
        balanceAmount: number;
        paidAmount: number;

    }[];


    payments: {

        id: string;
        purchaseId: string;
        amount: number;
        paymentMethod: string;
        paidAt: string;
        status?: string;
        cashLedgerPosted?: boolean;
        clearedAt?: string | null;
        chequeNumber?: string | null;
        chequeDate?: string | null;
        notes?: string | null;

    }[];

}



export const getSupplierLedger = async (
    id: string
): Promise<SupplierLedgerResponse> => {


    const res = await api.get(
        `/suppliers/${id}/ledger`
    );


    const data = res.data;


    return {

        supplier: {

            id: data.supplier.Id,
            name: data.supplier.Name,
            phone: data.supplier.Phone

        },


        summary: {

            totalPurchases:
                Number(data.summary.totalPurchases ?? 0),

            totalPaid:
                Number(data.summary.totalPaid ?? 0),

            totalOutstanding:
                Number(data.summary.totalOutstanding ?? 0)

        },


        invoices: (data.invoices ?? []).map(
            (inv: any) => ({

                id: inv.Id,

                invoiceNumber:
                    inv.InvoiceNumber,

                purchaseDate:
                    inv.PurchaseDate,

                grandTotal:
                    Number(inv.GrandTotal ?? 0),

                supplierId:
                    inv.SupplierId,

                balanceAmount:
                    Number(inv.BalanceAmount ?? 0),

                paidAmount:
                    Number(inv.PaidAmount ?? 0)

            })
        ),



        payments: (data.payments ?? []).map(
            (p: any) => ({

                id: p.Id,

                purchaseId:
                    p.PurchaseId,

                amount:
                    Number(p.Amount ?? 0),

                paymentMethod:
                    p.PaymentMethod,

                paidAt:
                    p.PaidAt,

                status:
                    p.Status,

                cashLedgerPosted:
                    p.CashLedgerPosted,

                clearedAt:
                    p.ClearedAt,

                chequeNumber:
                    p.ChequeNumber,

                chequeDate:
                    p.ChequeDate,

                notes:
                    p.Notes,
                purchases:{
                    InvoiceNumber: p.Purchases?.InvoiceNumber
                }

            })
        )

    };

};