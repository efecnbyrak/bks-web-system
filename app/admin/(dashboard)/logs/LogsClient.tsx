"use client";

import { Trash2, Calendar, Filter, XCircle, Search } from "lucide-react";
import { useState, useRef, useEffect } from "react";
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
    const [search, setSearch] = useState(searchParams.get("search") || "");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Seçili kullanıcının label'ını bul
    const selectedUser = users.find(u => String(u.id) === userId);
    const selectedLabel = selectedUser
        ? (() => { const p = selectedUser.referee || selectedUser.official; return p ? `${p.firstName} ${p.lastName}` : selectedUser.username; })()
        : "";

    // Arama inputundaki metne göre filtreli liste
    const filteredUsers = users.filter(u => {
        const p = u.referee || u.official;
        const label = p ? `${p.firstName} ${p.lastName}` : u.username;
        return label.toLocaleLowerCase('tr').includes(search.toLocaleLowerCase('tr'));
    });

    // Dışarı tıklanırsa dropdown kapansın
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const hasFilters = startDate || endDate || userId;

    const handleApplyFilters = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (startDate) params.set("startDate", startDate); else params.delete("startDate");
        if (endDate) params.set("endDate", endDate); else params.delete("endDate");
        if (userId) params.set("userId", userId); else params.delete("userId");
        if (search) params.set("search", search); else params.delete("search");
        router.push(`/admin/logs?${params.toString()}`);
    };

    const handleClearFilters = () => {
        setStartDate("");
        setEndDate("");
        setUserId("");
        setSearch("");
        router.push("/admin/logs");
    };

    const handleSelectUser = (id: string, label: string) => {
        setUserId(id);
        setSearch(label);
        setDropdownOpen(false);
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
                {/* Tarih aralığı */}
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

                {/* Kullanıcı arama */}
                <div className="relative flex items-center gap-2 px-3 border-l border-zinc-100 dark:border-zinc-800" ref={dropdownRef}>
                    <Search className="w-4 h-4 text-zinc-400 shrink-0" />
                    <input
                        type="text"
                        placeholder="Kişi ara..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setUserId("");
                            setDropdownOpen(true);
                        }}
                        onFocus={() => setDropdownOpen(true)}
                        className="bg-transparent border-none outline-none text-[10px] font-black uppercase text-zinc-600 dark:text-zinc-400 w-36 placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                    />
                    {search && (
                        <button
                            onClick={() => { setSearch(""); setUserId(""); setDropdownOpen(false); }}
                            className="text-zinc-300 hover:text-zinc-500 transition-colors"
                        >
                            <XCircle className="w-3.5 h-3.5" />
                        </button>
                    )}

                    {/* Dropdown */}
                    {dropdownOpen && filteredUsers.length > 0 && (
                        <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto">
                            <div
                                className="px-4 py-2.5 text-[10px] font-black uppercase text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                                onClick={() => { setUserId(""); setSearch(""); setDropdownOpen(false); }}
                            >
                                Tüm Kullanıcılar
                            </div>
                            {filteredUsers.map((u) => {
                                const p = u.referee || u.official;
                                const label = p ? `${p.firstName} ${p.lastName}` : u.username;
                                return (
                                    <div
                                        key={u.id}
                                        onClick={() => handleSelectUser(String(u.id), label)}
                                        className={`px-4 py-2.5 text-[11px] font-semibold cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors ${userId === String(u.id) ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white" : "text-zinc-700 dark:text-zinc-300"}`}
                                    >
                                        {label}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Butonlar */}
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
