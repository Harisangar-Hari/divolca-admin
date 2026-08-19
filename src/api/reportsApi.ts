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