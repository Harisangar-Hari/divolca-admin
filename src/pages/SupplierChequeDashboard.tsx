import { useEffect, useState } from "react";
import { getChequeDashboard, clearCheque } from "../api/chequeApi";


interface Cheque {

    id: string;

    amount: number;

    chequeNumber: string | null;

    chequeDate: string | null;

    clearedAt: string | null;

    supplier: string;

    invoice: string;

}



interface ChequeSummary {

    total: number;

    pending: number;

    overdue: number;

    dueToday: number;

    cleared: number;

}



interface ChequeDashboard {

    summary: ChequeSummary;

    pending: Cheque[];

    overdue: Cheque[];

    dueToday: Cheque[];

    cleared: Cheque[];

}



type TabType =
    | "pending"
    | "overdue"
    | "dueToday"
    | "cleared";





export default function SupplierChequeDashboard() {


    const [data, setData] =
        useState<ChequeDashboard | null>(null);


    const [loading, setLoading] =
        useState(true);


    const [tab, setTab] =
        useState<TabType>("pending");


    const [clearingId, setClearingId] =
        useState<string | null>(null);





    useEffect(() => {

        load();

    }, []);





    const load = async () => {

        try {

            const res =
                await getChequeDashboard();

            setData(res);


        } catch (error) {

            console.error(
                "Cheque dashboard error",
                error
            );

        }
        finally {

            setLoading(false);

        }

    };





    const handleClearCheque = async (
        id: string
    ) => {


        try {

            setClearingId(id);


            await clearCheque(id);


            await load();


        } catch (error) {

            console.error(error);

            alert(
                "Failed to clear cheque"
            );

        }
        finally {

            setClearingId(null);

        }

    };






    // const getDays = (
    //     date: string | null
    // ) => {


    //     if (!date)
    //         return null;



    //     const today = new Date();

    //     today.setHours(
    //         0, 0, 0, 0
    //     );



    //     const chequeDate =
    //         new Date(date);


    //     chequeDate.setHours(
    //         0, 0, 0, 0
    //     );



    //     const diff =
    //         chequeDate.getTime()
    //         -
    //         today.getTime();



    //     return Math.ceil(
    //         diff /
    //         (1000 * 60 * 60 * 24)
    //     );


    // };







    const Card = ({
        title,
        value,
        accent
    }: any) => (


        <div className="
            bg-white
            rounded-2xl
            border
            border-black/5
            shadow-sm
            p-4
            relative
            overflow-hidden
        ">


            {
                accent &&
                <div
                    className={`
                    absolute
                    left-0
                    top-0
                    h-full
                    w-1
                    ${accent}
                    `}
                />
            }


            <p className="
                text-[11px]
                uppercase
                tracking-widest
                text-black/40
                font-semibold
            ">
                {title}
            </p>


            <h2 className="
                text-2xl
                font-bold
                font-mono
                mt-1
            ">
                {value}
            </h2>


        </div>


    );









    const Table = ({
        items
    }: {
        items: Cheque[]
    }) => (


        <div className="
            bg-white
            rounded-2xl
            border
            border-black/5
            shadow-sm
            overflow-hidden
        ">


            <div className="
                overflow-x-auto
            ">


                <table className="
                w-full
                text-sm
                whitespace-nowrap
            ">


                    <thead>


                        <tr className="
                border-b
                text-left
                text-xs
                uppercase
                tracking-wide
                text-black/40
            ">


                            <th className="p-4">
                                Supplier
                            </th>


                            <th>
                                Invoice
                            </th>


                            <th>
                                Cheque No
                            </th>


                            <th>
                                Amount
                            </th>


                            <th>
                                Cheque Date
                            </th>


                            <th>
                                Status
                            </th>


                            <th>
                                Action
                            </th>


                        </tr>


                    </thead>





                    <tbody>



                        {
                            items.length === 0 &&

                            <tr>

                                <td
                                    colSpan={7}
                                    className="
                    text-center
                    p-10
                    text-black/40
                    "
                                >

                                    No cheques found

                                </td>

                            </tr>
                        }






                        {
                            items.map((c) => {


                                const isCleared =
                                    Boolean(c.clearedAt);



                                // const days =
                                //     getDays(c.chequeDate);





                                return (


                                    <tr
                                        key={c.id}
                                        className="
                border-b
                hover:bg-black/[0.02]
                "
                                    >


                                        <td className="
                        p-4
                        font-medium
                    ">
                                            {c.supplier}
                                        </td>



                                        <td className="
                        font-mono
                        text-black/60
                    ">
                                            {c.invoice}
                                        </td>



                                        <td className="
                        font-mono
                        text-black/60
                    ">
                                            {
                                                c.chequeNumber
                                                ||
                                                "-"
                                            }
                                        </td>



                                        <td className="
                        font-mono
                        font-semibold
                    ">
                                            Rs {c.amount}
                                        </td>




                                        <td>

                                            {
                                                c.chequeDate
                                                    ?
                                                    new Date(
                                                        c.chequeDate
                                                    ).toLocaleDateString()
                                                    :
                                                    "-"
                                            }


                                        </td>





                                        <td>


                                            <span
                                                className={`
                    text-[10px]
                    px-2
                    py-1
                    rounded-full
                    font-semibold
                    ${isCleared
                                                        ?
                                                        "bg-green-100 text-green-700"
                                                        :
                                                        "bg-amber-100 text-amber-700"
                                                    }
                    `}
                                            >


                                                {
                                                    isCleared
                                                        ?
                                                        "Cleared"
                                                        :
                                                        "Pending"
                                                }


                                            </span>



                                        </td>






                                        <td>


                                            {
                                                !isCleared

                                                    ?

                                                    <button

                                                        onClick={() =>
                                                            handleClearCheque(c.id)
                                                        }

                                                        disabled={
                                                            clearingId === c.id
                                                        }


                                                        className="
                    bg-[#0B6E4F]
                    text-white
                    px-3
                    py-1.5
                    rounded-lg
                    text-xs
                    disabled:opacity-50
                    "
                                                    >

                                                        {
                                                            clearingId === c.id
                                                                ?
                                                                "Clearing..."
                                                                :
                                                                "Clear"
                                                        }


                                                    </button>


                                                    :


                                                    <span className="
                        text-green-700
                        text-xs
                        font-medium
                    ">
                                                        Completed
                                                    </span>


                                            }



                                        </td>




                                    </tr>


                                );


                            })
                        }



                    </tbody>


                </table>


            </div>


        </div>


    );










    if (loading) {

        return (

            <div className="
            min-h-screen
            bg-[#EEF1EF]
            p-6
            ">

                Loading...

            </div>

        );

    }





    if (!data) {

        return (

            <div className="
            min-h-screen
            bg-[#EEF1EF]
            flex
            items-center
            justify-center
            ">

                No data

            </div>

        );

    }







    return (

        <div className="
        min-h-screen
        bg-[#EEF1EF]
        p-4 md:p-6
    ">


            <div className="
        max-w-6xl
        mx-auto
        space-y-5
    ">



                <div className="
        grid
        grid-cols-2
        md:grid-cols-4
        gap-4
    ">


                    <Card
                        title="Total"
                        value={data.summary.total}
                    />


                    <Card
                        title="Pending"
                        value={data.summary.pending}
                        accent="bg-yellow-400"
                    />


                    <Card
                        title="Overdue"
                        value={data.summary.overdue}
                        accent="bg-red-500"
                    />


                    <Card
                        title="Cleared"
                        value={data.summary.cleared}
                        accent="bg-green-600"
                    />


                </div>





                <div className="
        flex
        bg-white
        rounded-xl
        p-1
        w-fit
        border
    ">


                    {
                        [
                            ["pending", "Pending"],
                            ["overdue", "Overdue"],
                            ["dueToday", "Due Today"],
                            ["cleared", "Cleared"]

                        ].map(([key, label]) => (


                            <button

                                key={key}

                                onClick={() =>
                                    setTab(
                                        key as TabType
                                    )
                                }

                                className={`
        px-4
        py-2
        rounded-lg
        text-sm
        ${tab === key
                                        ?
                                        "bg-black text-white"
                                        :
                                        "text-black/50"
                                    }
        `}
                            >

                                {label}

                            </button>


                        ))
                    }



                </div>







                {
                    tab === "pending" &&
                    <Table items={data.pending} />
                }


                {
                    tab === "overdue" &&
                    <Table items={data.overdue} />
                }


                {
                    tab === "dueToday" &&
                    <Table items={data.dueToday} />
                }


                {
                    tab === "cleared" &&
                    <Table items={data.cleared} />
                }





            </div>


        </div>


    );

}