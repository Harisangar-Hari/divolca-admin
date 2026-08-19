import { api } from "./axios";

// =========================
// GET ALL SALES
// =========================
export const getSales = async () => {
    const res = await api.get("/sales");

    return res.data.map((s: any) => ({
        id: s.Id,
        invoiceNumber: s.InvoiceNumber,
        totalAmount: Number(s.TotalAmount || 0),
        balanceAmount: Number(s.BalanceAmount || 0),
        paidAmount: Number(s.PaidAmount || 0),
        createdAt: s.CreatedAt,
        status: s.Status,

        // ✅ CRITICAL: Add these missing mapped fields!
        hasReturns: s.HasReturns ?? false,
        returnedAmount: Number(s.ReturnedAmount || 0),

        customer: s.Customers ? {
            id: s.Customers.Id,
            name: s.Customers.Name,
            phone: s.Customers.Phone,
        } : null,

        itemsCount: s.SaleItems?.length ?? 0
    }));
};

// =========================
// GET SALE BY ID
// =========================
export const getSaleById = async (id: string) => {
    const res = await api.get(`/sales/${id}`);
    const sale = res.data;

    return {
        id: sale.Id,
        invoiceNumber: sale.InvoiceNumber,
        totalAmount: parseFloat(sale.TotalAmount || "0"),
        paidAmount: parseFloat(sale.PaidAmount || "0"),
        balanceAmount: parseFloat(sale.BalanceAmount || "0"),
        createdAt: sale.CreatedAt,
        status: sale.Status,
        isCreditSale: sale.IsCreditSale,
        subTotal: parseFloat(sale.SubTotal || "0"),
        invoiceDiscount: parseFloat(sale.InvoiceDiscount || "0"),

        customer: sale.Customers
            ? {
                id: sale.Customers.Id,
                name: sale.Customers.Name,
                phone: sale.Customers.Phone,
            }
            : null,

        items: (sale.SaleItems || []).map((item: any) => {
            const totalLineDiscount = parseFloat(item.Discount || "0");
            const quantity = item.Quantity || 1;

            return {
                productName: item.Products?.Name || item.productName || "Unknown Product",
                quantity: quantity,
                unitPrice: parseFloat(item.UnitPrice || "0"),
                total: parseFloat(item.Total || "0"),
                // FIX: Calculate per-unit discount so the receipt math is correct
                discount: totalLineDiscount / quantity,
            };
        }),

        payments: (sale.CreditPayments || []).map((payment: any) => ({
            amount: parseFloat(payment.Amount || "0"),
            paidAt: payment.PaidAt || new Date(),
        })),
    };
};

// =========================
// RETURN SALE
// =========================
export const returnSale = async (invoiceNumber: string) => {
    const res = await api.post(`/sales/return/${invoiceNumber}`);
    return res.data;
};

export const payCredits = async (saleId: string, amount: number) => {
    const res = await api.post(`/sales/pay-credits`, { saleId, amount });
    return res.data;
};