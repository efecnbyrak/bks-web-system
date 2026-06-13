"use client";

import { useEffect, useState } from "react";
import { X, MessageSquare, ExternalLink, CheckCircle, AlertCircle, Clock } from "lucide-react";
import Link from "next/link";

const SESSION_KEY = "ticketReplyPopupShown";

interface TicketWithReply {
    id: number;
    subject: string;
    adminNote: string;
    status: string;
    type: string;
    updatedAt: string;
}

const STATUS_LABEL: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    IN_PROGRESS: { label: "İnceleniyor", color: "text-blue-600 dark:text-blue-400", icon: AlertCircle },
    CLOSED: { label: "Kapatıldı", color: "text-emerald-600 dark:text-emerald-400", icon: CheckCircle },
    OPEN: { label: "Beklemede", color: "text-amber-600 dark:text-amber-400", icon: Clock },
};

export function TicketReplyPopup() {
    const [tickets, setTickets] = useState<TicketWithReply[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const alreadySeen = sessionStorage.getItem(SESSION_KEY);
        if (alreadySeen) return;

        fetch("/api/tickets/check-replies")
            .then((r) => r.json())
            .then((data) => {
                const list: TicketWithReply[] = data.tickets ?? [];
                if (list.length > 0) {
                    setTickets(list);
                    setIsOpen(true);
                }
                sessionStorage.setItem(SESSION_KEY, "1");
            })
            .catch(() => {
                sessionStorage.setItem(SESSION_KEY, "1");
            });
    }, []);

    const close = () => setIsOpen(false);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-md mx-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">

                {/* Gradient Header */}
                <div className="relative bg-gradient-to-r from-indigo-600 to-blue-500 px-6 py-5 overflow-hidden">
                    {/* Dekoratif arka plan çemberi */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                    <div className="relative flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center rotate-3">
                                <MessageSquare className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="text-white font-bold text-base leading-tight">
                                    Destek Talebinize Yanıt Geldi!
                                </p>
                                <p className="text-white/70 text-xs mt-0.5">
                                    {tickets.length} talebinize yanıt verildi
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={close}
                            className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Ticket Listesi */}
                <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
                    {tickets.map((ticket) => {
                        const statusCfg = STATUS_LABEL[ticket.status] ?? STATUS_LABEL.OPEN;
                        const StatusIcon = statusCfg.icon;
                        return (
                            <div
                                key={ticket.id}
                                className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700"
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                                        {ticket.subject}
                                    </p>
                                    <span className={`flex items-center gap-1 text-xs font-medium shrink-0 ${statusCfg.color}`}>
                                        <StatusIcon className="w-3 h-3" />
                                        {statusCfg.label}
                                    </span>
                                </div>
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2">
                                    <p className="text-xs text-emerald-700 dark:text-emerald-300 line-clamp-2 leading-relaxed">
                                        {ticket.adminNote}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer Butonlar */}
                <div className="px-4 pb-4 pt-1 flex gap-3">
                    <button
                        onClick={close}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                    >
                        Tamam
                    </button>
                    <Link
                        href="/referee/ticket"
                        onClick={close}
                        className="flex-[2] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition shadow-sm shadow-indigo-600/20"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Talepleri Görüntüle
                    </Link>
                </div>
            </div>
        </div>
    );
}
