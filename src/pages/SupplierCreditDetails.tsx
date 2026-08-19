import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/axios";
import { useToast } from "../store/toastStore";

interface Purchase {
    id: string;
    invoiceNumber: string;
    grandTotal: number;
    paidAmount: number;
    balanceAmount: number;
    purchaseDate: string;
}

interface Supplier {
    id: string;
    name: string;
    phone: string;
}

export default function SupplierCreditDetails() {
    const { id } = useParams();
    const { showToast } = useToast();

    const [supplier, setSupplier] = useState<Supplier | null>(null);
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [amount, setAmount] = useState(0);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            const res = await api.get(`/suppliers/${id}/details`);
            setSupplier(res.data.supplier);
            setPurchases(res.data.purchases);
        } catch {
            showToast("Failed to load supplier details", "error");
        }
    };

    const totalBalance = purchases.reduce(
        (sum, p) => sum + p.balanceAmount,
        0
    );

    const paySupplier = async () => {
        if (amount <= 0) {
            showToast("Enter valid amount", "error");
            return;
        }

        try {
            await api.post(`/suppliers/pay-credit`, {
                supplierId: id,
                amount,
                paymentMethod: "cash",
            });

            showToast("Payment successful", "success");
            setAmount(0);
            load();
        } catch {
            showToast("Payment failed", "error");
        }
    };

    return (
        <div className="space-y-4 p-4">

            {/* HEADER */}
            <div className="bg-white p-4 rounded-xl shadow">
                <h2 className="text-xl font-bold">
                    {supplier?.name}
                </h2>
                <p className="text-gray-500">{supplier?.phone}</p>

                <p className="text-red-600 font-semibold mt-2">
                    Total Outstanding: Rs {totalBalance}
                </p>
            </div>

            {/* PAY SECTION */}
            <div className="bg-white p-4 rounded-xl shadow space-y-2">
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    placeholder="Enter payment amount"
                    className="w-full border p-3 rounded-lg"
                />

                <button
                    onClick={paySupplier}
                    className="w-full bg-black text-white p-3 rounded-lg"
                >
                    Pay Supplier
                </button>
            </div>

            {/* PURCHASE LIST */}
            <div className="space-y-3">
                {purchases.map((p) => (
                    <div
                        key={p.id}
                        className="bg-white p-4 rounded-xl shadow"
                    >
                        <div className="flex justify-between">

                            <div>
                                <p className="font-semibold">
                                    {p.invoiceNumber}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {new Date(p.purchaseDate).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="text-right">
                                <p>Total: Rs {p.grandTotal}</p>
                                <p>Paid: Rs {p.paidAmount || 0}</p>
                                <p className="text-red-600 font-bold">
                                    Balance: Rs {p.balanceAmount}
                                </p>
                            </div>

                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}