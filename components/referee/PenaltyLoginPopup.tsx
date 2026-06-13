"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, X, ShieldAlert, CalendarRange } from "lucide-react";

interface Penalty {
    id: number;
    type: string;
    reason: string;
    startDate: string;
    endDate: string | null;
    isActive: boolean;
}

const PENALTY_TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    SUSPENSION: { label: "Askıya Alma", color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" },
    WARNING:    { label: "Uyarı",       color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30" },
    FINE:       { label: "Para Cezası", color: "text-blue-600 dark:text-blue-400",  bg: "bg-blue-100 dark:bg-blue-900/30" },
};

const SESSION_KEY = "penaltyPopupDismissed";

export function PenaltyLoginPopup() {
    const [penalties, setPenalties] = useState<Penalty[]>([]);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (sessionStorage.getItem(SESSION_KEY)) return;

        fetch("/api/penalties")
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (!data) return;
                const active: Penalty[] = (data.penalties || data).filter(
                    (p: Penalty) => p.isActive && (!p.endDate || new Date(p.endDate) > new Date())
                );
                if (active.length > 0) {
                    setPenalties(active);
                    setOpen(true);
                } else {
                    sessionStorage.setItem(SESSION_KEY, "1");
                }
            })
            .catch(() => {});
    }, []);

    const dismiss = () => {
        sessionStorage.setItem(SESSION_KEY, "1");
        setOpen(false);
    };

    if (!open || penalties.length === 0) return null;

    const formatDate = (d: string | null) =>
        d ? new Date(d).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" }) : "Süresiz";

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Red gradient overlay */}
                <div className="absolute top-0 inset-x-0 h-36 bg-gradient-to-br from-red-600 to-red-900 opacity-[0.15] dark:opacity-30 pointer-events-none" />

                {/* Close button */}
                <button
                    onClick={dismiss}
                    className="absolute top-4 right-4 z-10 p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Kapat"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="relative p-8">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/30 shrink-0">
                            <ShieldAlert className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Atama Kısıtlaması</h2>
                            <p className="text-xs font-bold text-red-600 uppercase tracking-widest">
                                {penalties.length} aktif kayıt
                            </p>
                        </div>
                    </div>

                    {/* Penalty list */}
                    <div className="space-y-3 mb-7 max-h-72 overflow-y-auto pr-1">
                        {penalties.map(p => {
                            const meta = PENALTY_TYPE_LABELS[p.type] || { label: p.type, color: "text-zinc-600", bg: "bg-zinc-100" };
                            return (
                                <div key={p.id} className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${meta.bg} ${meta.color}`}>
                                            {meta.label}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-medium">
                                            <CalendarRange className="w-3.5 h-3.5" />
                                            {formatDate(p.startDate)} — {formatDate(p.endDate)}
                                        </div>
                                    </div>
                                    <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">
                                        {p.reason}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    {/* Warning note */}
                    <div className="flex items-start gap-3 mb-6 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                            Kayıtlı kısıtlamalarınız bulunmaktadır. Atama alıp alamayacağınız bu kayıtlardan etkilenebilir. Detaylar için <strong>Atama Kısıtlama Kayıtları</strong> bölümünü inceleyin.
                        </p>
                    </div>

                    <button
                        onClick={dismiss}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl transition-all shadow-xl shadow-red-600/20 flex items-center justify-center gap-2 uppercase tracking-wide"
                    >
                        Anladım
                    </button>
                </div>
            </div>
        </div>
    );
}
