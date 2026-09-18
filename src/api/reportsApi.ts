// src/api/reportsApi.ts
import { api } from "./axios";

// ============================
// STOCK REPORTS
// ============================

export const getStockInHand = async () => {
    const res = await api.get("/reports/stock-in-hand");
    return res.data;
};

export const getStockInHandFiltered = async (filters: {
    categoryId?: string;
    brandId?: string;
    minStock?: number;
    maxStock?: number;
    search?: string;
}) => {
    const res = await api.get("/reports/stock-in-hand/filtered", { params: filters });
    return res.data;
};

export const getLowStockItems = async () => {
    const res = await api.get("/reports/low-stock");
    return res.data;
};

export const getStockValueSummary = async () => {
    const res = await api.get("/reports/stock-value");
    return res.data;
};

// ============================
// SALES REPORTS
// ============================

export const getSalesReport = async (filters?: {
    startDate?: string;
    endDate?: string;
    paymentMode?: string;
}) => {
    const res = await api.get("/reports/sales", { params: filters });
    return res.data;
};

// ============================
// PURCHASE REPORTS
// ============================

export const getPurchaseReport = async (filters?: {
    startDate?: string;
    endDate?: string;
}) => {
    const res = await api.get("/reports/purchases", { params: filters });
    return res.data;
};

// ============================
// CUSTOMER REPORTS
// ============================

export const getCustomerReport = async () => {
    const res = await api.get("/reports/customers");
    return res.data;
};

// ============================
// PROFIT & LOSS REPORTS
// ============================

export const getProfitLossReport = async (filters?: {
    startDate?: string;
    endDate?: string;
}) => {
    const res = await api.get("/reports/profit-loss", { params: filters });
    return res.data;
};

// ============================
// EXPORT FUNCTIONS
// ============================

export const exportStockToExcel = async () => {
    const res = await api.post("/reports/export/stock-excel", null, {
        responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    const contentDisposition = res.headers["content-disposition"];
    const filename = contentDisposition?.split("filename=")[1] || "stock_report.xlsx";
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

export const exportStockToPDF = async () => {
    try {
        const response = await api.post("/reports/export/stock-pdf", null, {
            responseType: "blob",
            headers: {
                'Accept': 'application/pdf',
            },
        });

        // ✅ Get content-type from headers safely
        const contentType = response.headers['content-type'] as string || response.headers['Content-Type'] as string || '';

        // Check if response is a valid PDF
        if (contentType && !contentType.includes('application/pdf')) {
            // If it's not PDF, it might be an error JSON
            const text = await response.data.text();
            throw new Error(text || 'Failed to generate PDF');
        }

        // Create download link
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        // Extract filename from headers
        const contentDisposition = response.headers['content-disposition'] as string || '';
        let filename = `Stock_In_Hand_${new Date().toISOString().split('T')[0]}.pdf`;
        if (contentDisposition) {
            const match = contentDisposition.match(/filename="?([^"]+)"?/);
            if (match) {
                filename = match[1];
            }
        }

        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();

        // Cleanup
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
        }, 5000);

        return true;
    } catch (error: any) {
        console.error('PDF export failed:', error);
        throw error;
    }
};

export const exportSalesToExcel = async (filters?: {
    startDate?: string;
    endDate?: string;
    paymentMode?: string;
}) => {
    const res = await api.post("/reports/export/sales-excel", filters || {}, {
        responseType: "blob",
    });

    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    const contentDisposition = res.headers["content-disposition"];
    const filename = contentDisposition?.split("filename=")[1] || "sales_report.xlsx";
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};


// ============================
// CUSTOMER AGING ANALYSIS
// ============================
export interface AgingCustomer {
    CustomerId: string;
    CustomerName: string;
    CustomerPhone: string;
    CustomerEmail: string | null;
    CustomerType: string;
    CreditLimit: number;
    CreditBalance: number;

    days0to30: number;
    days31to60: number;
    days61to90: number;
    days91to120: number;
    days121to150: number;
    days151plus: number;

    TotalOutstanding: number;
    InvoiceCount: number;
}

export interface AgingTotals {
    days0to30: number;
    days31to60: number;
    days61to90: number;
    days91to120: number;
    days121to150: number;
    days151plus: number;
    TotalOutstanding: number;
}

export interface AgingResponse {
    generatedAt: string;
    customers: AgingCustomer[];
    totals: AgingTotals;
}

export const getCustomerAging = async (): Promise<AgingResponse> => {
    const res = await api.get("/reports/customer-aging");

    const mapNum = (v: any) => Number(v || 0);

    return {
        generatedAt: res.data.generatedAt,
        customers: (res.data.customers || []).map((c: any) => ({
            CustomerId: c.CustomerId,
            CustomerName: c.CustomerName,
            CustomerPhone: c.CustomerPhone,
            CustomerEmail: c.CustomerEmail || null,
            CustomerType: c.CustomerType,
            CreditLimit: mapNum(c.CreditLimit),
            CreditBalance: mapNum(c.CreditBalance),

            days0to30: mapNum(c.days0to30),
            days31to60: mapNum(c.days31to60),
            days61to90: mapNum(c.days61to90),
            days91to120: mapNum(c.days91to120),
            days121to150: mapNum(c.days121to150),
            days151plus: mapNum(c.days151plus),

            TotalOutstanding: mapNum(c.TotalOutstanding),
            InvoiceCount: mapNum(c.InvoiceCount),
        })),
        totals: {
            days0to30: mapNum(res.data.totals?.days0to30),
            days31to60: mapNum(res.data.totals?.days31to60),
            days61to90: mapNum(res.data.totals?.days61to90),
            days91to120: mapNum(res.data.totals?.days91to120),
            days121to150: mapNum(res.data.totals?.days121to150),
            days151plus: mapNum(res.data.totals?.days151plus),
            TotalOutstanding: mapNum(res.data.totals?.TotalOutstanding),
        },
    };
};


// ============================
// OUTSTANDING INVOICES (flat)
// ============================
export interface OutstandingInvoice {
    SaleId: string;
    InvoiceNumber: string;
    InvoiceDate: string;

    CustomerId: string | null;
    CustomerName: string;
    CustomerPhone: string;
    CustomerType: string;

    PaymentMode: string;
    IsCreditSale: boolean;

    TotalAmount: number;
    PaidAmount: number;
    BalanceAmount: number;

    AgeDays: number;
    Bucket: string;
}

export interface OutstandingInvoicesResponse {
    generatedAt: string;
    count: number;
    rows: OutstandingInvoice[];
    totals: {
        TotalAmount: number;
        PaidAmount: number;
        BalanceAmount: number;
    };
}

export const getOutstandingInvoices = async (): Promise<OutstandingInvoicesResponse> => {
    const res = await api.get("/reports/outstanding-invoices");
    const n = (v: any) => Number(v || 0);

    return {
        generatedAt: res.data.generatedAt,
        count: n(res.data.count),
        rows: (res.data.rows || []).map((r: any) => ({
            SaleId: r.SaleId,
            InvoiceNumber: r.InvoiceNumber,
            InvoiceDate: r.InvoiceDate,

            CustomerId: r.CustomerId || null,
            CustomerName: r.CustomerName || "Walk-in Customer",
            CustomerPhone: r.CustomerPhone || "",
            CustomerType: r.CustomerType || "RETAIL",

            PaymentMode: r.PaymentMode || "cash",
            IsCreditSale: !!r.IsCreditSale,

            TotalAmount: n(r.TotalAmount),
            PaidAmount: n(r.PaidAmount),
            BalanceAmount: n(r.BalanceAmount),

            AgeDays: n(r.AgeDays),
            Bucket: r.Bucket || "0-30",
        })),
        totals: {
            TotalAmount: n(res.data.totals?.TotalAmount),
            PaidAmount: n(res.data.totals?.PaidAmount),
            BalanceAmount: n(res.data.totals?.BalanceAmount),
        },
    };
};