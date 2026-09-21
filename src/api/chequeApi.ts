//src/api/chequeApi.ts
import { api } from "./axios";


// ===============================
// TYPES
// ===============================

export interface ChequeSummary {

    total: number;

    pending: number;

    overdue: number;

    dueToday: number;

    cleared: number;
    bounced: number;

}



export interface Cheque {

    id: string;

    amount: number;

    status: string;

    clearedAt: string | null;

    chequeNumber: string | null;

    chequeDate: string | null;

    supplier: string;

    invoice: string;

}



export interface ChequeDashboard {

    summary: ChequeSummary;

    pending: Cheque[];

    overdue: Cheque[];

    dueToday: Cheque[];

    cleared: Cheque[];
    bounced: Cheque[];

}



// ===============================
// RESPONSE MAPPER
// ===============================

const mapCheque = (c: any): Cheque => ({

    id: c.Id,


    amount:
        Number(c.Amount ?? 0),


    status:
        c.Status ?? "Pending",


    clearedAt:
        c.ClearedAt ?? null,


    chequeNumber:
        c.ChequeNumber ?? null,


    chequeDate:
        c.ChequeDate ?? null,



    supplier:
        c.Purchases?.Suppliers?.Name ??
        c.supplier ??
        "Unknown",



    invoice:
        c.Purchases?.InvoiceNumber ??
        c.invoice ??
        "-"

});



// ===============================
// GET DASHBOARD
// ===============================

export const getChequeDashboard =
    async (): Promise<ChequeDashboard> => {


        const res =
            await api.get("/cheques/dashboard");



        const data = res.data;



        return {


            summary: {

                total:
                    data.summary.total,


                pending:
                    data.summary.pending,


                overdue:
                    data.summary.overdue,


                dueToday:
                    data.summary.dueToday,


                cleared:
                    data.summary.cleared,

                bounced: data.summary.bounced ?? 0,

            },



            pending:
                (data.pending ?? [])
                    .map(mapCheque),



            overdue:
                (data.overdue ?? [])
                    .map(mapCheque),



            dueToday:
                (data.dueToday ?? [])
                    .map(mapCheque),



            cleared:
                (data.cleared ?? [])
                    .map(mapCheque),
            bounced: (data.bounced ?? []).map(mapCheque),

        };

    };



// ===============================
// CLEAR SINGLE CHEQUE
// ===============================

export const clearCheque =
    async (
        id: string
    ) => {


        const res =
            await api.post(
                `/cheques/${id}/clear`
            );


        return res.data;

    };