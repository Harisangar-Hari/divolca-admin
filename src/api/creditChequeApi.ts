import { api } from "./axios";

export interface IncomingCheque {
    Id: string;
    SaleId: string;
    InvoiceNumber: string | null;
    CustomerId: string | null;
    CustomerName: string;
    CustomerPhone: string | null;
    Amount: number;
    PaymentMethod: string;
    Reference: string | null;
    ChequeDate: string | null;
    Status: "pending" | "cleared" | "bounced";
    ClearedAt: string | null;
    PaidAt: string;
    Note: string | null;
}

// Record against a single sale
export const recordCreditCheque = async (dto: {
    saleId: string;
    amount: number;
    chequeNumber: string;
    chequeDate: string;
    note?: string;
}) => {
    const res = await api.post("/sales/credit-cheques", dto);
    return res.data;
};

// Record against multiple sales (one physical cheque)
export const recordBulkCreditCheque = async (dto: {
    saleIds: string[];
    chequeNumber: string;
    chequeDate: string;
    note?: string;
}) => {
    const res = await api.post("/sales/credit-cheques/bulk", dto);
    return res.data;
};

// List
export const getIncomingCheques = async (
    status?: "pending" | "cleared" | "bounced"
): Promise<IncomingCheque[]> => {
    const res = await api.get("/sales/credit-cheques", {
        params: status ? { status } : {},
    });
    return res.data;
};

// Single-row clear/bounce (kept for edge cases)
export const clearCreditCheque = async (id: string) => {
    const res = await api.post(`/sales/credit-cheques/${id}/clear`);
    return res.data;
};

export const bounceCreditCheque = async (id: string, reason?: string) => {
    const res = await api.post(`/sales/credit-cheques/${id}/bounce`, {
        reason,
    });
    return res.data;
};

// Bulk clear/bounce by reference (whole cheque at once)
export const clearChequeByReference = async (reference: string) => {
    const res = await api.post(
        `/sales/credit-cheques/clear-by-reference/${encodeURIComponent(reference)}`
    );
    return res.data;
};

export const bounceChequeByReference = async (
    reference: string,
    reason?: string
) => {
    const res = await api.post(
        `/sales/credit-cheques/bounce-by-reference/${encodeURIComponent(reference)}`,
        { reason }
    );
    return res.data;
};