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
// export const getSaleById = async (id: string) => {
//     const res = await api.get(`/sales/${id}`);
//     const sale = res.data;

//     return {
//         id: sale.Id,
//         invoiceNumber: sale.InvoiceNumber,
//         totalAmount: parseFloat(sale.TotalAmount || "0"),
//         paidAmount: parseFloat(sale.PaidAmount || "0"),
//         balanceAmount: parseFloat(sale.BalanceAmount || "0"),
//         createdAt: sale.CreatedAt,
//         status: sale.Status,
//         isCreditSale: sale.IsCreditSale,
//         paymentMode: sale.paymentMode || "cash",
//         subTotal: parseFloat(sale.SubTotal || "0"),
//         invoiceDiscountAmount: parseFloat(sale.InvoiceDiscount || "0"),
//         returnedAmount: parseFloat(sale.ReturnedAmount || "0"),
//         hasReturns: sale.HasReturns || false,

//         customer: sale.Customers
//             ? {
//                 id: sale.Customers.Id,
//                 name: sale.Customers.Name,
//                 phone: sale.Customers.Phone,
//                 email: sale.Customers.Email,
//                 address: sale.Customers.Address || "",
//                 city: sale.Customers.City || "",
//                 state: sale.Customers.State || "",
//                 country: sale.Customers.Country || "",
//                 creditBalance: parseFloat(sale.Customers.CreditBalance || "0"),
//                 creditLimit: parseFloat(sale.Customers.CreditLimit || "0"),
//                 companyName: sale.Customers.CompanyName || "",
//                 customerType: sale.Customers.CustomerType || "RETAIL",
//                 loyaltyPoints: sale.Customers.LoyaltyPoints || 0,
//                 loyaltyTier: sale.Customers.LoyaltyTier || "Bronze",
//                 totalSpent: parseFloat(sale.Customers.TotalSpent || "0"),
//                 isBlocked: sale.Customers.IsBlocked || false,
//             }
//             : null,

//         items: (sale.SaleItems || []).map((item: any) => {
//             const totalLineDiscount = parseFloat(item.Discount || "0");
//             const quantity = item.Quantity || 1;
//             const unitPrice = parseFloat(item.UnitPrice || "0");
//             const lineTotal = parseFloat(item.Total || "0");

//             // ✅ Per-unit discount
//             const perUnitDiscount = totalLineDiscount / quantity;

//             // ✅ Calculate discount percentage for this item
//             let discountPercent = 0;
//             if (unitPrice > 0 && perUnitDiscount > 0) {
//                 discountPercent = Math.round((perUnitDiscount / unitPrice) * 100);
//             }

//             return {
//                 id: item.Id,                    // The SaleItem ID
//                 saleItemId: item.Id,            // Alias for clarity
//                 productName: item.Products?.Name || item.productName || "Unknown Product",
//                 productId: item.ProductId || item.productId,
//                 quantity: quantity,
//                 unitPrice: unitPrice,
//                 total: lineTotal,
//                 discount: perUnitDiscount,
//                 discountPercent: discountPercent,
//                 sku: item.Products?.SKU || "",
//                 warrantyMonths: item.Products?.WarrantyMonths || 0,
//                 originalPrice: unitPrice,
//             };
//         }),

//         payments: (sale.SalePayments || []).map((payment: any) => ({
//             id: payment.Id,
//             amount: parseFloat(payment.Amount || "0"),
//             paymentMode: payment.PaymentMode || "cash",
//             paidAt: payment.PaidAt || new Date(),
//             status: payment.Status || "completed",
//             reference: payment.Reference || "",
//         })),

//         creditPayments: (sale.CreditPayments || []).map((payment: any) => ({
//             id: payment.Id,
//             amount: parseFloat(payment.Amount || "0"),
//             paidAt: payment.PaidAt || new Date(),
//             note: payment.Note || "",
//         })),
//     };
// };


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
        paymentMode: sale.paymentMode || "cash",
        subTotal: parseFloat(sale.SubTotal || "0"),
        invoiceDiscountAmount: parseFloat(sale.InvoiceDiscount || "0"),
        returnedAmount: parseFloat(sale.ReturnedAmount || "0"),
        hasReturns: sale.HasReturns || false,

        customer: sale.Customers
            ? {
                id: sale.Customers.Id,
                name: sale.Customers.Name,
                phone: sale.Customers.Phone,
                email: sale.Customers.Email,
                address: sale.Customers.Address || "",
                city: sale.Customers.City || "",
                state: sale.Customers.State || "",
                country: sale.Customers.Country || "",
                creditBalance: parseFloat(sale.Customers.CreditBalance || "0"),
                creditLimit: parseFloat(sale.Customers.CreditLimit || "0"),
                companyName: sale.Customers.CompanyName || "",
                customerType: sale.Customers.CustomerType || "RETAIL",
                loyaltyPoints: sale.Customers.LoyaltyPoints || 0,
                loyaltyTier: sale.Customers.LoyaltyTier || "Bronze",
                totalSpent: parseFloat(sale.Customers.TotalSpent || "0"),
                isBlocked: sale.Customers.IsBlocked || false,
            }
            : null,

        // ✅ FIX: Calculate discount percentage correctly
        items: (sale.SaleItems || []).map((item: any) => {
            const totalLineDiscount = parseFloat(item.Discount || "0");
            const quantity = item.Quantity || 1;
            const unitPrice = parseFloat(item.UnitPrice || "0");
            const lineTotal = parseFloat(item.Total || "0");

            // ✅ Per-unit discount amount
            const perUnitDiscount = totalLineDiscount / quantity;

            // ✅ Calculate discount percentage based on UNIT PRICE
            // This is the correct way: (discount per unit / unit price) * 100
            let discountPercent = 0;
            if (unitPrice > 0 && perUnitDiscount > 0) {
                discountPercent = Math.round((perUnitDiscount / unitPrice) * 100);
            }

            return {
                id: item.Id,
                saleItemId: item.Id,
                productId: item.ProductId,
                productName: item.Products?.Name || item.productName || "Unknown Product",
                quantity: quantity,
                unitPrice: unitPrice,
                total: lineTotal,
                discount: perUnitDiscount, // Per-unit discount amount
                discountPercent: discountPercent, // ✅ Correct percentage based on unit price
                sku: item.Products?.SKU || "",
                warrantyMonths: item.Products?.WarrantyMonths || 0,
                originalPrice: unitPrice,
            };
        }),

        payments: (sale.SalePayments || []).map((payment: any) => ({
            id: payment.Id,
            amount: parseFloat(payment.Amount || "0"),
            paymentMode: payment.PaymentMode || "cash",
            paidAt: payment.PaidAt || new Date(),
            status: payment.Status || "completed",
            reference: payment.Reference || "",
        })),

        creditPayments: (sale.CreditPayments || []).map((payment: any) => ({
            id: payment.Id,
            amount: parseFloat(payment.Amount || "0"),
            paidAt: payment.PaidAt || new Date(),
            note: payment.Note || "",
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

export const cancelSale = async (id: string, reason?: string) => {
    const res = await api.delete(`/sales/cancel/${id}`, {
        data: { reason },
    });
    return res.data;
};

// ✅ Cancel sale by invoice number
export const cancelSaleByInvoice = async (invoiceNumber: string, reason?: string) => {
    const res = await api.delete(`/sales/cancel/invoice/${invoiceNumber}`, {
        data: { reason },
    });
    return res.data;
};



export const editSale = async (id: string, data: {
    customerId?: string;
    paymentMode?: string;
    invoiceDiscount?: number;
    items?: Array<{
        productId: string;
        quantity: number;
        discount?: number;
    }>;
}) => {
    const res = await api.put(`/sales/edit/${id}`, data);
    return res.data;
};

// ✅ Update sale item
export const updateSaleItem = async (saleId: string, itemId: string, data: {
    quantity: number;
    discount?: number;
}) => {
    if (!saleId || !itemId) {
        throw new Error('Sale ID and Item ID are required');
    }

    console.log('🔵 API call - updateSaleItem:', { saleId, itemId, data });

    const res = await api.put(`/sales/item/${saleId}/${itemId}`, data);
    return res.data;
};

// ✅ Remove item from sale
export const removeSaleItem = async (saleId: string, itemId: string) => {
    // ✅ Ensure both IDs are valid
    if (!saleId || !itemId) {
        throw new Error('Sale ID and Item ID are required');
    }

    const res = await api.delete(`/sales/item/${saleId}/${itemId}`);
    return res.data;
};

// ✅ Add item to sale
export const addSaleItem = async (saleId: string, data: {
    productId: string;
    quantity: number;
    discount?: number;
}) => {
    if (!saleId) {
        throw new Error('Sale ID is required');
    }

    const res = await api.post(`/sales/item/${saleId}`, data);
    return res.data;
};