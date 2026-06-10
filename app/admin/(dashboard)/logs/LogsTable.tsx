"use client";

import { useState } from "react";
import { User as UserIcon, Globe, Clock, ChevronDown, ChevronRight, Info, Hash } from "lucide-react";

interface LogEntry {
    id: number;
    action: string;
    details: string | null;
    ipAddress: string | null;
    createdAt: string;
    targetId: number | null;
    userId: number | null;
    user: {
        username: string;
        referee: { firstName: string; lastName: string } | null;
        official: { firstName: string; lastName: string } | null;
    } | null;
}

interface LogsTableProps {
    logs: LogEntry[];
}

function getActionColor(action: string) {
    if (action.includes("LOGIN")) return "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20";
    if (action.includes("PASSWORD") || action.includes("RESET")) return "text-amber-600 bg-amber-50 dark:bg-amber-900/20";
    if (action.includes("DELETE") || action.includes("REJECT") || action.includes("SUSPEND") || action.includes("PENALTY")) return "text-rose-600 bg-rose-50 dark:bg-rose-900/20";
    if (action.includes("APPROVE") || action.includes("SUBMIT") || action.includes("SUCCESS")) return "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20";
    if (action.includes("PROMOTE") || action.includes("DEMOTE")) return "text-violet-600 bg-violet-50 dark:bg-violet-900/20";
    if (action.includes("CLEAR") || action.includes("TRUNCATE")) return "text-orange-600 bg-orange-50 dark:bg-orange-900/20";
    if (action.includes("PHONE") || action.includes("NORMALIZE")) return "text-blue-600 bg-blue-50 dark:bg-blue-900/20";
    return "text-zinc-600 bg-zinc-50 dark:bg-zinc-900/20";
}

function parseDetails(details: string | null): { parsed: Record<string, unknown> | null; raw: string } {
    if (!details) return { parsed: null, raw: "" };
    try {
        const parsed = JSON.parse(details);
        if (typeof parsed === "object" && parsed !== null) {
            return { parsed: parsed as Record<string, unknown>, raw: details };
        }
    } catch {
        // not JSON
    }
    return { parsed: null, raw: details };
}

export function LogsTable({ logs }: LogsTableProps) {
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const toggleExpand = (id: number) => {
        setExpandedId(prev => (prev === id ? null : id));
    };

    if (logs.length === 0) {
        return (
            <div className="px-6 py-20 text-center">
                <div className="flex flex-col items-center gap-2 opacity-20">
                    <Info className="w-12 h-12" />
                    <p className="uppercase font-black italic">Henüz kayıt bulunmuyor</p>
                </div>
            </div>
        );
    }

    return (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800 overflow-x-auto">
            {logs.map((log) => {
                const profile = log.user?.referee || log.user?.official;
                const displayName = profile
                    ? `${profile.firstName} ${profile.lastName}`
                    : (log.user?.username || "Sistem");
                const isExpanded = expandedId === log.id;
                const { parsed, raw } = parseDetails(log.details);
                const hasDetails = !!(log.details || log.targetId);

                return (
                    <div key={log.id} className="font-medium">
                        {/* Ana satır */}
                        <div
                            className={`flex items-center gap-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors ${hasDetails ? "cursor-pointer" : ""}`}
                            onClick={() => hasDetails && toggleExpand(log.id)}
                        >
                            {/* Expand chevron */}
                            <div className="pl-4 pr-2 py-4 text-zinc-400 w-10 shrink-0">
                                {hasDetails ? (
                                    isExpanded
                                        ? <ChevronDown className="w-4 h-4 text-zinc-500" />
                                        : <ChevronRight className="w-4 h-4 text-zinc-400" />
                                ) : (
                                    <span className="w-4 h-4 block" />
                                )}
                            </div>

                            {/* İşlem */}
                            <div className="px-4 py-4 w-40 md:w-52 shrink-0">
                                <span className={`px-2 md:px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getActionColor(log.action)}`}>
                                    {log.action}
                                </span>
                            </div>

                            {/* Kullanıcı */}
                            <div className="px-4 py-4 flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center shrink-0">
                                        <UserIcon className="w-4 h-4 text-zinc-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-zinc-900 dark:text-zinc-100 truncate max-w-[120px] md:max-w-[150px]">{displayName}</p>
                                        <p className="text-[10px] text-zinc-500 font-bold">UID: {log.userId || "-"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Detay özeti — md+ only */}
                            <div className="hidden md:block px-4 py-4 w-64 shrink-0 text-zinc-500 dark:text-zinc-400 italic text-sm truncate">
                                {log.details ? (
                                    <span className="text-[12px]">{raw.length > 60 ? raw.substring(0, 60) + "…" : raw}</span>
                                ) : (
                                    <span className="text-zinc-300 dark:text-zinc-700 text-[11px]">—</span>
                                )}
                            </div>

                            {/* IP — lg+ only */}
                            <div className="hidden lg:block px-4 py-4 w-40 shrink-0">
                                <div className="flex items-center gap-2 text-zinc-500">
                                    <Globe className="w-3 h-3 text-zinc-400 shrink-0" />
                                    <span className="font-mono text-xs">{log.ipAddress || "Bilinmiyor"}</span>
                                </div>
                            </div>

                            {/* Tarih */}
                            <div className="px-4 py-4 w-28 md:w-36 shrink-0">
                                <div className="flex items-center gap-1 md:gap-2 text-zinc-500">
                                    <Clock className="w-3 h-3 text-zinc-400 shrink-0" />
                                    <span className="text-[10px] font-bold">
                                        {new Date(log.createdAt).toLocaleString("tr-TR", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Expand alanı */}
                        {isExpanded && hasDetails && (
                            <div className="bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 px-14 py-5 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                {/* Detay */}
                                {log.details && (
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-1.5">
                                            <Info className="w-3 h-3" /> Detay
                                        </p>
                                        {parsed ? (
                                            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-2">
                                                {Object.entries(parsed).map(([key, value]) => (
                                                    <div key={key} className="flex gap-3 text-sm">
                                                        <span className="text-zinc-500 font-semibold min-w-[120px] shrink-0 capitalize">{key}:</span>
                                                        <span className="text-zinc-800 dark:text-zinc-200 break-all">{String(value)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
                                                <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words">{raw}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Hedef ID */}
                                {log.targetId && (
                                    <div className="flex items-center gap-2">
                                        <Hash className="w-3.5 h-3.5 text-zinc-400" />
                                        <span className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">Hedef Kayıt ID:</span>
                                        <span className="text-sm font-mono font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                                            #{log.targetId}
                                        </span>
                                    </div>
                                )}

                                {/* İşlem özeti */}
                                <div className="flex items-center gap-3 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getActionColor(log.action)}`}>
                                        {log.action}
                                    </span>
                                    <span className="text-[11px] text-zinc-400">
                                        {displayName} tarafından — {new Date(log.createdAt).toLocaleString("tr-TR", {
                                            day: "2-digit", month: "long", year: "numeric",
                                            hour: "2-digit", minute: "2-digit", second: "2-digit"
                                        })}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
