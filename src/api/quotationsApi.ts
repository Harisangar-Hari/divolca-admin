import { api } from "./axios";

export type QuotationStatus = "draft" | "converted" | "cancelled";

export interface QuotationItem {
    Id: string;
    ProductId: string;
    ProductName: string;
    ProductBarcode: string | null;
    Quantity: number;
    UnitPrice: number;
    Discount: number;   // total line discount in Rs
    Total: number;
}

export interface Quotation {
    Id: string;
    QuotationNumber: string;
    CreatedAt: string;
    UpdatedAt: string | null;
    CustomerId: string | null;
    CustomerName: string | null;
    CustomerPhone: string | null;
    Customer: { Id: string; Name: string; Phone: string } | null;
    Notes: string | null;
    SubTotal: number;
    InvoiceDiscount: number;
    TotalAmount: number;
    Status: QuotationStatus;
    ConvertedSaleId: string | null;
    ConvertedAt: string | null;
    Items: QuotationItem[];
}

export interface QuotationListItem {
    Id: string;
    QuotationNumber: string;
    CreatedAt: string;
    UpdatedAt: string | null;
    CustomerId: string | null;
    CustomerName: string;
    CustomerPhone: string | null;
    SubTotal: number;
    InvoiceDiscount: number;
    TotalAmount: number;
    Status: QuotationStatus;
    ConvertedSaleId: string | null;
    ConvertedAt: string | null;
    ItemsCount: number;
}

export interface CreateQuotationPayload {
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    notes?: string;
    items: Array<{
        productId: string;
        quantity: number;
        discount?: number;
    }>;
    invoiceDiscount?: number;
}

const mapItem = (it: any): QuotationItem => ({
    Id: it.Id,
    ProductId: it.ProductId,
    ProductName: it.ProductName || "Unknown",
    ProductBarcode: it.ProductBarcode || null,
    Quantity: it.Quantity,
    UnitPrice: Number(it.UnitPrice || 0),
    Discount: Number(it.Discount || 0),
    Total: Number(it.Total || 0),
});

const mapFull = (q: any): Quotation => ({
    Id: q.Id,
    QuotationNumber: q.QuotationNumber,
    CreatedAt: q.CreatedAt,
    UpdatedAt: q.UpdatedAt || null,
    CustomerId: q.CustomerId || null,
    CustomerName: q.CustomerName || null,
    CustomerPhone: q.CustomerPhone || null,
    Customer: q.Customer
        ? { Id: q.Customer.Id, Name: q.Customer.Name, Phone: q.Customer.Phone }
        : null,
    Notes: q.Notes || null,
    SubTotal: Number(q.SubTotal || 0),
    InvoiceDiscount: Number(q.InvoiceDiscount || 0),
    TotalAmount: Number(q.TotalAmount || 0),
    Status: q.Status,
    ConvertedSaleId: q.ConvertedSaleId || null,
    ConvertedAt: q.ConvertedAt || null,
    Items: (q.Items || []).map(mapItem),
});

const mapList = (q: any): QuotationListItem => ({
    Id: q.Id,
    QuotationNumber: q.QuotationNumber,
    CreatedAt: q.CreatedAt,
    UpdatedAt: q.UpdatedAt || null,
    CustomerId: q.CustomerId || null,
    CustomerName: q.CustomerName || "Walk-in",
    CustomerPhone: q.CustomerPhone || null,
    SubTotal: Number(q.SubTotal || 0),
    InvoiceDiscount: Number(q.InvoiceDiscount || 0),
    TotalAmount: Number(q.TotalAmount || 0),
    Status: q.Status,
    ConvertedSaleId: q.ConvertedSaleId || null,
    ConvertedAt: q.ConvertedAt || null,
    ItemsCount: q.ItemsCount || 0,
});

export const getQuotations = async (
    status?: QuotationStatus
): Promise<QuotationListItem[]> => {
    const res = await api.get("/quotations", {
        params: status ? { status } : {},
    });
    return (res.data || []).map(mapList);
};

export const getQuotationById = async (id: string): Promise<Quotation> => {
    const res = await api.get(`/quotations/${id}`);
    return mapFull(res.data);
};

export const createQuotation = async (payload: CreateQuotationPayload) => {
    const res = await api.post("/quotations", payload);
    return mapFull(res.data);
};

export const updateQuotation = async (
    id: string,
    payload: CreateQuotationPayload
) => {
    const res = await api.put(`/quotations/${id}`, payload);
    return mapFull(res.data);
};

export const deleteQuotation = async (id: string) => {
    const res = await api.delete(`/quotations/${id}`);
    return res.data;
};

export const cancelQuotation = async (id: string) => {
    const res = await api.post(`/quotations/${id}/cancel`);
    return res.data;
};