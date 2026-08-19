import { api } from "./axios";

// =========================
// CREDIT SUMMARY
// =========================
export const getCreditCustomers = async () => {
    const res = await api.get("/customers/credit-summary");

    return res.data.map((c: any) => ({
        id: c.Id,
        name: c.Name,
        phone: c.Phone,
        email: c.Email || "",
        address: c.Address || "",
        city: c.City || "",
        state: c.State || "",
        country: c.Country || "",
        companyName: c.CompanyName || "",
        customerType: c.CustomerType || "RETAIL",
        creditLimit: Number(c.CreditLimit || 0),
        creditBalance: Number(c.CreditBalance || 0),
        availableCredit: Number(c.AvailableCredit || 0),
        isActive: c.IsActive !== undefined ? c.IsActive : true,
        isBlocked: c.IsBlocked || false,
        loyaltyPoints: c.LoyaltyPoints || 0,
        loyaltyTier: c.LoyaltyTier || "Bronze",
        totalPurchases: Number(c.TotalPurchases || 0),
        totalPaid: Number(c.TotalPaid || 0),
        totalBalance: Number(c.TotalBalance || 0),
        totalInvoices: c.TotalInvoices || 0,
        activeCreditSales: c.ActiveCreditSales || 0,
        createdAt: c.CreatedAt,
        updatedAt: c.UpdatedAt,
        lastPurchaseDate: c.LastPurchaseDate,
        lastPaymentDate: c.LastPaymentDate,
    }));
};

// =========================
// GET CUSTOMER BY ID
// =========================
export const getCustomerById = async (id: string) => {
    const res = await api.get(`/customers/${id}`);

    return {
        id: res.data.Id,
        name: res.data.Name,
        phone: res.data.Phone,
        email: res.data.Email || "",
        address: res.data.Address || "",
        deliveryAddress: res.data.DeliveryAddress || "",
        billingAddress: res.data.BillingAddress || "",
        city: res.data.City || "",
        state: res.data.State || "",
        postalCode: res.data.PostalCode || "",
        country: res.data.Country || "",
        alternativePhone: res.data.AlternativePhone || "",
        companyName: res.data.CompanyName || "",
        taxNumber: res.data.TaxNumber || "",
        customerType: res.data.CustomerType || "RETAIL",
        creditLimit: Number(res.data.CreditLimit || 0),
        creditBalance: Number(res.data.CreditBalance || 0),
        availableCredit: Number(res.data.AvailableCredit || 0),
        isActive: res.data.IsActive,
        isBlocked: res.data.IsBlocked,
        blockReason: res.data.BlockReason || "",
        creditRiskScore: res.data.CreditRiskScore || null,
        paymentTerms: res.data.PaymentTerms || "",
        notes: res.data.Notes || "",
        loyaltyPoints: res.data.LoyaltyPoints || 0,
        loyaltyTier: res.data.LoyaltyTier || "Bronze",
        totalSpent: Number(res.data.TotalSpent || 0),
        createdAt: res.data.CreatedAt,
        updatedAt: res.data.UpdatedAt,
        lastPurchaseDate: res.data.LastPurchaseDate,
        lastPaymentDate: res.data.LastPaymentDate,
        sales: (res.data.Sales || []).map((s: any) => ({
            id: s.Id,
            invoiceNumber: s.InvoiceNumber,
            totalAmount: Number(s.TotalAmount || 0),
            paidAmount: Number(s.PaidAmount || 0),
            balanceAmount: Number(s.BalanceAmount || 0),
            createdAt: s.CreatedAt,
            status: s.Status,
            isCreditSale: s.IsCreditSale,
        })),
        recentLedgerEntries: res.data.RecentLedgerEntries || [],
    };
};

// =========================
// GET CUSTOMER INVOICES
// =========================
export const getCustomerInvoices = async (id: string) => {
    // Use the detailed customer endpoint to get all sales
    const res = await api.get(`/customers/${id}`);

    const customer = res.data;

    return {
        customer: {
            Id: customer.Id,
            Name: customer.Name,
            Phone: customer.Phone,
            Email: customer.Email || "",
            CreditBalance: Number(customer.CreditBalance || 0),
            CreditLimit: Number(customer.CreditLimit || 0),
        },
        invoices: (customer.Sales || []).map((invoice: any) => ({
            Id: invoice.Id,
            InvoiceNumber: invoice.InvoiceNumber,
            TotalAmount: Number(invoice.TotalAmount || 0),
            PaidAmount: Number(invoice.PaidAmount || 0),
            BalanceAmount: Number(invoice.BalanceAmount || 0),
            CreatedAt: invoice.CreatedAt,
            Status: invoice.Status || 0,
            IsCreditSale: invoice.IsCreditSale || false,
        })),
    };
};

// =========================
// CREATE CUSTOMER
// =========================
export const createCustomer = async (data: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    deliveryAddress?: string;
    billingAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    alternativePhone?: string;
    creditLimit?: number | string;
    companyName?: string;
    taxNumber?: string;
    customerType?: string;
    paymentTerms?: string;
    notes?: string;
}) => {
    let creditLimitValue = 0;
    if (data.creditLimit !== undefined && data.creditLimit !== null && data.creditLimit !== '') {
        const parsed = typeof data.creditLimit === 'string'
            ? parseFloat(data.creditLimit)
            : data.creditLimit;
        creditLimitValue = isNaN(parsed) ? 0 : parsed;
    }

    const payload = {
        Name: data.name,
        Phone: data.phone,
        Email: data.email || null,
        Address: data.address || null,
        DeliveryAddress: data.deliveryAddress || null,
        BillingAddress: data.billingAddress || null,
        City: data.city || null,
        State: data.state || null,
        PostalCode: data.postalCode || null,
        Country: data.country || "Bangladesh",
        AlternativePhone: data.alternativePhone || null,
        CreditLimit: creditLimitValue,
        CompanyName: data.companyName || null,
        TaxNumber: data.taxNumber || null,
        CustomerType: data.customerType || "RETAIL",
        PaymentTerms: data.paymentTerms || "Due on receipt",
        Notes: data.notes || null,
    };

    const res = await api.post("/customers", payload);

    return {
        id: res.data.Id,
        name: res.data.Name,
        phone: res.data.Phone,
        email: res.data.Email,
        address: res.data.Address,
        city: res.data.City,
        state: res.data.State,
        country: res.data.Country,
        companyName: res.data.CompanyName,
        customerType: res.data.CustomerType,
        creditLimit: Number(res.data.CreditLimit || 0),
        creditBalance: Number(res.data.CreditBalance || 0),
        availableCredit: Number(res.data.AvailableCredit || 0),
        isActive: res.data.IsActive,
        isBlocked: res.data.IsBlocked,
        loyaltyPoints: res.data.LoyaltyPoints || 0,
        loyaltyTier: res.data.LoyaltyTier || "Bronze",
        totalSpent: Number(res.data.TotalSpent || 0),
        createdAt: res.data.CreatedAt,
        updatedAt: res.data.UpdatedAt,
    };
};

// =========================
// PAY CUSTOMER CREDIT
// =========================
export const payCustomerCredit = async (data: {
    customerId: string;
    amount: number;
}) => {
    const res = await api.post("/customers/pay-customer-credit", {
        customerId: data.customerId,
        amount: data.amount,
    });

    return {
        message: res.data.message,
        totalPaid: res.data.totalPaid,
        remainingUnallocated: res.data.remainingUnallocated,
        remainingBalance: res.data.remainingBalance,
    };
};

// =========================
// UPDATE CUSTOMER
// =========================
export const updateCustomer = async (id: string, data: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    deliveryAddress?: string;
    billingAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    alternativePhone?: string;
    creditLimit?: number | string;
    companyName?: string;
    taxNumber?: string;
    customerType?: string;
    paymentTerms?: string;
    notes?: string;
}) => {
    let creditLimitValue = 0;
    if (data.creditLimit !== undefined && data.creditLimit !== null && data.creditLimit !== '') {
        const parsed = typeof data.creditLimit === 'string'
            ? parseFloat(data.creditLimit)
            : data.creditLimit;
        creditLimitValue = isNaN(parsed) ? 0 : parsed;
    }

    const res = await api.put(`/customers/${id}`, {
        Name: data.name,
        Phone: data.phone,
        Email: data.email,
        Address: data.address,
        DeliveryAddress: data.deliveryAddress,
        BillingAddress: data.billingAddress,
        City: data.city,
        State: data.state,
        PostalCode: data.postalCode,
        Country: data.country,
        AlternativePhone: data.alternativePhone,
        CreditLimit: creditLimitValue,
        CompanyName: data.companyName,
        TaxNumber: data.taxNumber,
        CustomerType: data.customerType,
        PaymentTerms: data.paymentTerms,
        Notes: data.notes,
    });

    return {
        id: res.data.Id,
        name: res.data.Name,
        phone: res.data.Phone,
        email: res.data.Email,
        customerType: res.data.CustomerType,
        creditLimit: Number(res.data.CreditLimit || 0),
        updatedAt: res.data.UpdatedAt,
    };
};

// =========================
// TOGGLE CUSTOMER STATUS
// =========================
export const toggleCustomerStatus = async (id: string) => {
    const res = await api.patch(`/customers/${id}/toggle-status`);
    return {
        id: res.data.Id,
        name: res.data.Name,
        isActive: res.data.IsActive,
    };
};

// =========================
// TOGGLE BLOCK CUSTOMER
// =========================
export const toggleBlockCustomer = async (id: string, reason?: string) => {
    const res = await api.patch(`/customers/${id}/toggle-block`, { reason });
    return {
        id: res.data.Id,
        name: res.data.Name,
        isBlocked: res.data.IsBlocked,
        blockReason: res.data.BlockReason,
    };
};