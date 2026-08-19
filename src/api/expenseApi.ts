import { api } from "./axios";

export interface Expense {

    id: string;

    title: string;

    amount: number;

    category: string;

    expenseDate: string;

    notes?: string | null;

}


export const getExpenses = async (): Promise<Expense[]> => {

    const res = await api.get("/expenses");


    return res.data.map((e: any) => ({

        id: e.Id,

        title: e.Title,

        amount: Number(e.Amount ?? 0),

        category: e.Category,

        expenseDate: e.ExpenseDate,

        notes: e.Notes ?? null

    }));

};

export const createExpense = async (data: {
    title: string;
    amount: number;
    category: string;
    notes?: string;
}) => {
    const res = await api.post("/expenses", data);
    return res.data;
};