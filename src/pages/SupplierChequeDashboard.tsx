import { useEffect, useMemo, useState } from "react";
import { getChequeDashboard } from "../api/chequeApi";
import { clearChequeByNumber, bounceChequeByNumber } from "../api/supplierApi";

interface Cheque {
    id: string;
    amount: number;
    chequeNumber: string | null;
    chequeDate: string | null;
    clearedAt: string | null;
    supplier: string;
    invoice: string;
    status?: string;
}

interface ChequeSummary {
    total: number;
    pending: number;
    overdue: number;
    dueToday: number;
    cleared: number;
    bounced: number;
}

interface ChequeDashboard {
    summary: ChequeSummary;
    pending: Cheque[];
    overdue: Cheque[];
    dueToday: Cheque[];
    cleared: Cheque[];
    bounced: Cheque[];
}

type TabType = "pending" | "overdue" | "dueToday" | "cleared" | "bounced";

interface ChequeGroup {
    chequeNumber: string;
    chequeDate: string | null;
    clearedAt: string | null;
    supplier: string;
    total: number;
    rows: Cheque[];
}

export default function SupplierChequeDashboard() {
    const [data, setData] = useState<ChequeDashboard | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<TabType>("pending");
    const [actionCheque, setActionCheque] = useState<string | null>(null);


    const [bounceCheque, setBounceCheque] = useState<string | null>(null);

    const handleBounce = async (chequeNumber: string) => {
        if (chequeNumber === "—") return;

        const reason = prompt(
            `Reason for bouncing cheque #${chequeNumber}? (optional)`
        );
        if (reason === null) return; // user cancelled

        const confirmed = confirm(
            `Bounce cheque #${chequeNumber}? This will reverse the payment and re-add it to the supplier's outstanding.`
        );
        if (!confirmed) return;

        try {
            setBounceCheque(chequeNumber);
            await bounceChequeByNumber(chequeNumber, reason || undefined);
            await load();
        } catch (error: any) {
            console.error(error);
            alert(
                error?.response?.data?.message ||
                "Failed to bounce cheque"
            );
        } finally {
            setBounceCheque(null);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            const res = await getChequeDashboard();
            setData(res);
        } catch (error) {
            console.error("Cheque dashboard error", error);
        } finally {
            setLoading(false);
        }
    };

    // =========================================
    // Group rows by cheque number
    // =========================================
    const groupByCheque = (rows: Cheque[]): ChequeGroup[] => {
        const map = new Map<string, ChequeGroup>();

        rows.forEach((r) => {
            const key = r.chequeNumber || r.id;
            const existing = map.get(key);

            if (existing) {
                existing.total += Number(r.amount);
                existing.rows.push(r);
                // latest clearedAt wins
                if (r.clearedAt && !existing.clearedAt) {
                    existing.clearedAt = r.clearedAt;
                }
            } else {
                map.set(key, {
                    chequeNumber: r.chequeNumber || "—",
                    chequeDate: r.chequeDate,
                    clearedAt: r.clearedAt,
                    supplier: r.supplier,
                    total: Number(r.amount),
                    rows: [r],
                });
            }
        });

        return Array.from(map.values());
    };

    const grouped = useMemo(() => {
        if (!data) return null;
        return {
            pending: groupByCheque(data.pending),
            overdue: groupByCheque(data.overdue),
            dueToday: groupByCheque(data.dueToday),
            cleared: groupByCheque(data.cleared),
            bounced: groupByCheque(data.bounced),
        };
    }, [data]);

    const handleClear = async (chequeNumber: string) => {
        if (chequeNumber === "—") return;
        if (!confirm(`Clear cheque #${chequeNumber}?`)) return;

        try {
            setActionCheque(chequeNumber);
            await clearChequeByNumber(chequeNumber);
            await load();
        } catch (error: any) {
            console.error(error);
            alert(
                error?.response?.data?.message ||
                "Failed to clear cheque"
            );
        } finally {
            setActionCheque(null);
        }
    };

    const getDaysLeft = (chequeDate: string | null) => {
        if (!chequeDate) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(chequeDate);
        target.setHours(0, 0, 0, 0);
        return Math.ceil(
            (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
    };

    const Card = ({
        title,
        value,
        accent,
    }: {
        title: string;
        value: number;
        accent?: string;
    }) => (
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-4 relative overflow-hidden">
            {accent && (
                <div
                    className={`absolute left-0 top-0 h-full w-1 ${accent}`}
                />
            )}
            <p className="text-[11px] uppercase tracking-widest text-black/40 font-semibold">
                {title}
            </p>
            <h2 className="text-2xl font-bold font-mono mt-1">{value}</h2>
        </div>
    );

    const ChequeCard = ({
        group,
        showActions,
    }: {
        group: ChequeGroup;
        showActions: boolean;
    }) => {
        const isCleared = group.rows[0]?.status === "Cleared" || Boolean(group.clearedAt);
        const isBounced = group.rows[0]?.status === "Bounced";
        const daysLeft = getDaysLeft(group.chequeDate);

        return (
            <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0 ${isCleared
                                ? "bg-[#0B6E4F]"
                                : "bg-amber-500"
                                }`}
                        >
                            #
                        </div>
                        <div>
                            <p className="font-mono font-semibold text-[15px]">
                                Cheque {group.chequeNumber}
                            </p>
                            <p className="text-[12px] text-black/50 mt-0.5">
                                {group.supplier}
                            </p>
                            <p className="text-[11px] text-black/40 mt-0.5">
                                Cheque date:{" "}
                                {group.chequeDate
                                    ? new Date(
                                        group.chequeDate
                                    ).toLocaleDateString()
                                    : "—"}
                                {daysLeft !== null &&
                                    !isCleared &&
                                    daysLeft >= 0 &&
                                    ` • ${daysLeft} day${daysLeft === 1 ? "" : "s"
                                    } left`}
                                {daysLeft !== null &&
                                    !isCleared &&
                                    daysLeft < 0 &&
                                    ` • ${Math.abs(daysLeft)} day${Math.abs(daysLeft) === 1 ? "" : "s"
                                    } overdue`}
                                {isCleared &&
                                    group.clearedAt &&
                                    ` • Cleared: ${new Date(
                                        group.clearedAt
                                    ).toLocaleDateString()}`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                        <div className="text-right">
                            <p className="font-mono font-bold text-lg">
                                Rs {group.total.toLocaleString()}
                            </p>
                            <p className="text-[11px] text-black/40">
                                {group.rows.length} invoice
                                {group.rows.length === 1 ? "" : "s"}
                            </p>
                        </div>

                        {showActions && !isCleared && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleClear(group.chequeNumber)}
                                    disabled={
                                        actionCheque === group.chequeNumber ||
                                        bounceCheque === group.chequeNumber
                                    }
                                    className="px-3 py-1.5 bg-[#0B6E4F] hover:bg-[#0A5F44] text-white rounded-lg text-[12px] font-medium cursor-pointer transition disabled:opacity-50"
                                >
                                    {actionCheque === group.chequeNumber
                                        ? "Clearing…"
                                        : "Clear"}
                                </button>
                                <button
                                    onClick={() => handleBounce(group.chequeNumber)}
                                    disabled={
                                        actionCheque === group.chequeNumber ||
                                        bounceCheque === group.chequeNumber
                                    }
                                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[12px] font-medium cursor-pointer transition disabled:opacity-50"
                                >
                                    {bounceCheque === group.chequeNumber
                                        ? "Bouncing…"
                                        : "Bounce"}
                                </button>
                            </div>
                        )}

                        {isCleared && (
                            <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-[#0B6E4F]">
                                Cleared
                            </span>
                        )}
                        {isBounced && (
                            <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full bg-red-50 text-red-600">
                                Bounced
                            </span>
                        )}
                    </div>
                </div>

                {/* Invoice rows */}
                <div className="divide-y divide-black/5">
                    {group.rows.map((r) => (
                        <div
                            key={r.id}
                            className="flex justify-between items-center px-4 py-2.5 text-[13px]"
                        >
                            <span className="font-mono text-black/70">
                                {r.invoice}
                            </span>
                            <span className="font-mono font-medium">
                                Rs {Number(r.amount).toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const EmptyState = ({ message }: { message: string }) => (
        <div className="bg-white rounded-2xl border border-black/5 py-14 text-center text-black/30 text-sm">
            {message}
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-[#EEF1EF] p-6 space-y-3">
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className="h-24 rounded-2xl bg-black/5 animate-pulse"
                    />
                ))}
            </div>
        );
    }

    if (!data || !grouped) {
        return (
            <div className="min-h-screen bg-[#EEF1EF] flex items-center justify-center">
                <p className="text-black/40">No data</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#EEF1EF] p-4 md:p-6 font-sans text-[#14181C]">
            <div className="max-w-6xl mx-auto space-y-5">
                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

                {/* Tabs */}
                <div className="flex bg-white rounded-xl p-1 w-fit border border-black/5 shadow-sm">
                    {(
                        [
                            ["pending", "Pending"],
                            ["overdue", "Overdue"],
                            ["dueToday", "Due Today"],
                            ["cleared", "Cleared"],
                            ["bounced", "Bounced"],
                        ] as [TabType, string][]
                    ).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition ${tab === key
                                ? key === "bounced"
                                    ? "bg-red-600 text-white"
                                    : "bg-black text-white"
                                : "text-black/50 hover:text-black/70"
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* List — grouped by cheque number */}
                <div className="space-y-3">
                    {tab === "pending" &&
                        (grouped.pending.length === 0 ? (
                            <EmptyState message="No pending cheques" />
                        ) : (
                            grouped.pending.map((g) => (
                                <ChequeCard
                                    key={g.chequeNumber}
                                    group={g}
                                    showActions
                                />
                            ))
                        ))}

                    {tab === "overdue" &&
                        (grouped.overdue.length === 0 ? (
                            <EmptyState message="No overdue cheques" />
                        ) : (
                            grouped.overdue.map((g) => (
                                <ChequeCard
                                    key={g.chequeNumber}
                                    group={g}
                                    showActions
                                />
                            ))
                        ))}

                    {tab === "dueToday" &&
                        (grouped.dueToday.length === 0 ? (
                            <EmptyState message="No cheques due today" />
                        ) : (
                            grouped.dueToday.map((g) => (
                                <ChequeCard
                                    key={g.chequeNumber}
                                    group={g}
                                    showActions
                                />
                            ))
                        ))}

                    {tab === "cleared" &&
                        (grouped.cleared.length === 0 ? (
                            <EmptyState message="No cleared cheques" />
                        ) : (
                            grouped.cleared.map((g) => (
                                <ChequeCard
                                    key={g.chequeNumber}
                                    group={g}
                                    showActions={false}
                                />
                            ))
                        ))}

                    {tab === "bounced" &&
                        (grouped.bounced.length === 0 ? (
                            <EmptyState message="No bounced cheques" />
                        ) : (
                            grouped.bounced.map((g) => (
                                <ChequeCard
                                    key={g.chequeNumber}
                                    group={g}
                                    showActions={false}
                                />
                            ))
                        ))}
                </div>
            </div>
        </div>
    );
}