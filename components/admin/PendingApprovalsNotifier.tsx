"use client";

import { useState, useEffect } from "react";
import { Bell, X, ArrowRight, UserPlus } from "lucide-react";
import Link from "next/link";

interface PendingApprovalsNotifierProps {
    count: number;
}

export function PendingApprovalsNotifier({ count }: PendingApprovalsNotifierProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const dismissedStr = localStorage.getItem("pendingApprovalsDismissedAt");
        let shouldShow = true;

        if (dismissedStr) {
            const dismissedAt = new Date(dismissedStr).getTime();
            const now = new Date().getTime();
            const twelveHours = 12 * 60 * 60 * 1000;
            if (now - dismissedAt < twelveHours) {
                shouldShow = false;
            }
        }

        if (count > 0 && shouldShow) {
            const timer = setTimeout(() => setIsVisible(true), 800);
            return () => clearTimeout(timer);
        }
    }, [count]);

    const handleDismiss = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsVisible(false);
        localStorage.setItem("pendingApprovalsDismissedAt", new Date().toISOString());
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/50 shadow-2xl rounded-3xl p-8 w-full max-w-md relative overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-400">
                {/* Decorative glow */}
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-red-500/10 blur-3xl rounded-full pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-red-500/5 blur-2xl rounded-full pointer-events-none" />

                {/* Close button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Icon + badge */}
                <div className="flex flex-col items-center text-center gap-6">
                    <div className="relative">
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-500/20 rounded-2xl flex items-center justify-center shadow-lg shadow-red-500/10">
                            <Bell className="w-10 h-10 text-red-600 animate-[ring_3s_ease-in-out_infinite]" />
                        </div>
                        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-black w-7 h-7 flex items-center justify-center rounded-full border-2 border-white dark:border-zinc-900 shadow">
                            {count > 99 ? "99+" : count}
                        </span>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-black text-zinc-900 dark:text-white text-xl uppercase tracking-tight">
                            Yeni Başvurular Var!
                        </h3>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium max-w-xs">
                            <strong className="text-red-600 dark:text-red-400">{count} kişi</strong> sisteme kayıt oldu ve onayınızı bekliyor.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 w-full">
                        <Link
                            onClick={() => setIsVisible(false)}
                            href="/admin/approvals"
                            className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-3.5 px-6 rounded-2xl transition-colors shadow-lg shadow-red-600/20 w-full"
                        >
                            <UserPlus className="w-4 h-4" />
                            İncele ve Onayla
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <button
                            onClick={handleDismiss}
                            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 text-xs font-bold uppercase tracking-widest transition-colors py-1"
                        >
                            Daha Sonra Hatırlat
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
