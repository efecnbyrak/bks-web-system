"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, BookMarked, ChevronRight, Calendar, ClipboardList } from "lucide-react";

interface Assignment {
    id: number;
    title: string;
    description: string | null;
    dueDate: string | null;
}

const SESSION_KEY = "assignmentPopupShown";

export function AssignmentNotificationPopup() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const alreadySeen = sessionStorage.getItem(SESSION_KEY);
        if (alreadySeen) return;

        fetch("/api/user/assignments")
            .then(r => r.json())
            .then(data => {
                const list: any[] = data.assignments || [];
                const pending = list.filter(a => !a.isCompleted && !a.isExpired);
                if (pending.length > 0) {
                    setAssignments(pending);
                    setIsOpen(true);
                }
                // Sadece oturumda bir kere göster
                sessionStorage.setItem(SESSION_KEY, "1");
            })
            .catch(() => {});
    }, []);

    const close = () => setIsOpen(false);

    if (!isOpen || assignments.length === 0) return null;

    return (
        <div className="fixed inset-0 z-[105] flex items-center justify-center p-3 sm:p-6 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-[2.5rem] w-full max-w-md shadow-2xl border border-zinc-200/50 dark:border-zinc-800/50 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 max-h-[90vh] flex flex-col">

                {/* Kapat */}
                <button
                    onClick={close}
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 w-8 h-8 sm:w-10 sm:h-10 bg-white/20 hover:bg-white/40 dark:bg-zinc-800/50 dark:hover:bg-zinc-700 backdrop-blur-md rounded-full flex items-center justify-center transition-colors text-zinc-900 dark:text-white"
                >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Header */}
                <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 sm:p-8 text-center relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-md rounded-2xl sm:rounded-3xl mx-auto flex items-center justify-center mb-3 sm:mb-4 rotate-3 shadow-xl">
                        <ClipboardList className="w-8 h-8 sm:w-10 sm:h-10 text-white" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white uppercase italic tracking-tighter mb-1 relative z-10">
                        {assignments.length === 1
                            ? "Bekleyen Ödeviniz Var!"
                            : `${assignments.length} Bekleyen Ödeviniz Var!`}
                    </h2>
                    <p className="text-orange-100 font-medium text-xs sm:text-sm relative z-10">
                        Aşağıdaki ödevleri tamamlayarak puan kazanabilirsiniz.
                    </p>
                </div>

                {/* Ödev Listesi */}
                <div className="p-5 sm:p-6 overflow-y-auto flex-1">
                    <div className="space-y-3 mb-5">
                        {assignments.map(a => (
                            <div key={a.id} className="flex items-start gap-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3.5 border border-zinc-100 dark:border-zinc-700/50">
                                <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0 mt-0.5">
                                    <BookMarked className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-zinc-900 dark:text-white leading-snug">{a.title}</p>
                                    {a.description && (
                                        <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">{a.description}</p>
                                    )}
                                    {a.dueDate && (
                                        <div className="flex items-center gap-1 mt-1.5">
                                            <Calendar className="w-3 h-3 text-orange-500" />
                                            <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
                                                Son: {new Date(a.dueDate).toLocaleDateString("tr-TR")}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link
                            href="/referee/bag/questions"
                            onClick={close}
                            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black py-3.5 rounded-xl transition-all uppercase text-xs tracking-wider shadow-lg shadow-orange-500/20"
                        >
                            Şimdi Git <ChevronRight className="w-4 h-4" />
                        </Link>
                        <button
                            onClick={close}
                            className="flex-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold py-3.5 rounded-xl transition-colors uppercase text-xs tracking-wider"
                        >
                            Daha Sonra
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
