"use client";

import { Trash2, Calendar, Filter, XCircle, User } from "lucide-react";
import { useState } from "react";
import { clearAuditLogs } from "@/app/actions/logs";
import { useRouter, useSearchParams } from "next/navigation";

interface UserOption {
    id: number;
    username: string;
    referee: { firstName: string; lastName: string } | null;
    official: { firstName: string; lastName: string } | null;
}

interface LogsClientProps {
    users: UserOption[];
}

export function LogsClient({ users }: LogsClientProps) {
    const [isPending, setIsPending] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
    const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");
    const [userId, setUserId] = useState(searchParams.get("userId") || "");

    const hasFilters = startDate || endDate || userId;

    const handleApplyFilters = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (startDate) params.set("startDate", startDate); else params.delete("startDate");
        if (endDate) params.set("endDate", endDate); else params.delete("endDate");
        if (userId) params.set("userId", userId); else params.delete("userId");
        router.push(`/admin/logs?${params.toString()}`);
    };

    const handleClearFilters = () => {
        setStartDate("");
        setEndDate("");
        setUserId("");
        router.push("/admin/logs");
    };

    const handleClear = async () => {
        if (!confirm("Tüm sistem kayıtlarını kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) {
            return;
        }
        setIsPending(true);
        try {
            const res = await clearAuditLogs();
            if (res.success) {
                alert(res.message);
                router.refresh();
            } else {
                alert(res.message);
            }
        } catch (error: any) {
            alert("Bir hata oluştu: " + error.message);
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                {/* Date range */}
                <div className="flex items-center gap-2 px-3">
                    <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-transparent border-none outline-none text-[10px] font-black uppercase text-zinc-600 dark:text-zinc-400"
                    />
                    <span className="text-zinc-300">-</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-transparent border-none outline-none text-[10px] font-black uppercase text-zinc-600 dark:text-zinc-400"
                    />
                </div>

                {/* User filter */}
                <div className="flex items-center gap-2 px-3 border-l border-zinc-100 dark:border-zinc-800">
                    <User className="w-4 h-4 text-zinc-400 shrink-0" />
                    <select
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        className="bg-transparent border-none outline-none text-[10px] font-black uppercase text-zinc-600 dark:text-zinc-400 max-w-[160px]"
                    >
                        <option value="">Tüm Kullanıcılar</option>
                        {users.map((u) => {
                            const profile = u.referee || u.official;
                            const label = profile
                                ? `${profile.firstName} ${profile.lastName}`
                                : u.username;
                            return (
                                <option key={u.id} value={String(u.id)}>
                                    {label}
                                </option>
                            );
                        })}
                    </select>
                </div>

                {/* Action buttons */}
                <div className="flex gap-1 border-l border-zinc-100 dark:border-zinc-800 pl-2">
                    <button
                        onClick={handleApplyFilters}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-600 dark:text-zinc-400 transition-colors"
                        title="Filtrele"
                    >
                        <Filter className="w-4 h-4" />
                    </button>
                    {hasFilters && (
                        <button
                            onClick={handleClearFilters}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-colors"
                            title="Filtreleri Temizle"
                        >
                            <XCircle className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            <button
                onClick={handleClear}
                disabled={isPending}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-800 text-white dark:text-zinc-300 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-700 transition-all text-xs font-black uppercase italic tracking-wider disabled:opacity-50"
            >
                <Trash2 className="w-4 h-4" />
                {isPending ? "Temizleniyor..." : "Tümünü Temizle"}
            </button>
        </div>
    );
}
