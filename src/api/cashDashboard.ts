import { api } from "./axios";


export interface CashEntry {

    id: string;

    date: string;

    type: "IN" | "OUT";

    amount: number;

    category: string;

    referenceId: string;

    description: string;

    createdAt: string;

}


export interface DailyCashDashboard {
    date: string;
    totalIn: number;
    totalOut: number;
    balance: number;

    // Add these:
    cashSales: number;
    cardSales: number;
    creditSales: number;
    grandTotal: number;

    entries: CashEntry[];
}


export const getDailyCash = async (
    date: string
): Promise<DailyCashDashboard> => {

    const res = await api.get(`/cash-dashboard/daily?date=${date}`);

    const data = res.data;

    return {
        date: data.date,
        totalIn: Number(data.totalIn ?? 0),
        totalOut: Number(data.totalOut ?? 0),
        balance: Number(data.balance ?? 0),

        // ✅ NEW FIELDS YOU WERE MISSING!
        cashSales: Number(data.cashSales ?? 0),
        cardSales: Number(data.cardSales ?? 0),
        creditSales: Number(data.creditSales ?? 0),
        grandTotal: Number(data.grandTotal ?? 0),

        entries: (data.entries ?? []).map((e: any) => ({
            id: e.Id,
            date: e.Date,
            type: e.Type,
            amount: Number(e.Amount ?? 0),
            category: e.Category,
            referenceId: e.ReferenceId,
            description: e.Description,
            createdAt: e.CreatedAt
        }))
    };
};

export const addManualCash = async (data: any) => {

    const res = await api.post(
        "/cash-dashboard/manual",
        data
    );

    return res.data;

};