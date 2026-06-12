"use client";

import { useState, useMemo } from "react";
import {
    User as UserIcon, Globe, Clock, ChevronDown, ChevronRight,
    Info, Hash, Monitor, Database, ShieldAlert, Terminal,
} from "lucide-react";
import {
    getActionColor, getActionMeta, getSeverityStyles,
    parseDetailsEnhanced, formatISO, CATEGORY_LABELS,
    type Category,
} from "./logsUtils";

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

export function LogsTable({ logs }: LogsTableProps) {
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [activeCategory, setActiveCategory] = useState<Category | null>(null);

    const toggleExpand = (id: number) => setExpandedId(prev => (prev === id ? null : id));

    // Client-side category filter
    const categories = useMemo(() => {
        const cats = new Set<Category>(logs.map(l => getActionMeta(l.action).category));
        return Array.from(cats);
    }, [logs]);

    const categoryCounts = useMemo(() => {
        const counts: Partial<Record<Category, number>> = {};
        for (const log of logs) {
            const cat = getActionMeta(log.action).category;
            counts[cat] = (counts[cat] ?? 0) + 1;
        }
        return counts;
    }, [logs]);

    const filteredLogs = activeCategory
        ? logs.filter(l => getActionMeta(l.action).category === activeCategory)
        : logs;

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
        <div>
            {/* Category filter chips */}
            <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30">
                <button
                    onClick={() => setActiveCategory(null)}
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors ${
                        activeCategory === null
                            ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                >
                    Tümü ({logs.length})
                </button>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-colors ${
                            activeCategory === cat
                                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        }`}
                    >
                        {CATEGORY_LABELS[cat]} ({categoryCounts[cat] ?? 0})
                    </button>
                ))}
            </div>

            {/* Rows */}
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 overflow-x-auto">
                {filteredLogs.map((log) => {
                    const profile = log.user?.referee || log.user?.official;
                    const displayName = profile
                        ? `${profile.firstName} ${profile.lastName}`
                        : (log.user?.username || "Sistem");
                    const isExpanded = expandedId === log.id;
                    const { parsed, raw, jsonFormatted } = parseDetailsEnhanced(log.details);
                    const hasDetails = !!(log.details || log.targetId);
                    const meta = getActionMeta(log.action);
                    const severityStyles = getSeverityStyles(meta.severity);

                    return (
                        <div key={log.id} className="font-medium">
                            {/* Main row */}
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

                                {/* #id — lg+ only */}
                                <div className="hidden lg:block px-2 py-4 w-16 shrink-0">
                                    <span className="font-mono text-[10px] text-zinc-400">#{log.id}</span>
                                </div>

                                {/* Action + severity */}
                                <div className="px-4 py-4 w-52 md:w-64 shrink-0">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100 leading-snug line-clamp-1">
                                            {meta.label_tr || log.action}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold w-fit opacity-70 ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest w-fit ${severityStyles.pill}`}>
                                            {severityStyles.label}
                                        </span>
                                    </div>
                                </div>

                                {/* User */}
                                <div className="px-4 py-4 flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center shrink-0">
                                            <UserIcon className="w-4 h-4 text-zinc-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-zinc-900 dark:text-zinc-100 truncate max-w-[120px] md:max-w-[150px]">{displayName}</p>
                                            <p className="text-[10px] text-zinc-500 font-bold font-mono">uid={log.userId ?? "null"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Detail summary — md+ only */}
                                <div className="hidden md:block px-4 py-4 w-64 shrink-0 text-zinc-500 dark:text-zinc-400 italic text-sm truncate">
                                    {log.details ? (
                                        <span className="text-[12px] font-mono">{raw.length > 60 ? raw.substring(0, 60) + "…" : raw}</span>
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

                                {/* Date */}
                                <div className="px-4 py-4 w-28 md:w-36 shrink-0">
                                    <div className="flex items-center gap-1 md:gap-2 text-zinc-500">
                                        <Clock className="w-3 h-3 text-zinc-400 shrink-0" />
                                        <span className="text-[10px] font-bold">
                                            {new Date(log.createdAt).toLocaleString("tr-TR", {
                                                day: "2-digit", month: "2-digit", year: "numeric",
                                                hour: "2-digit", minute: "2-digit",
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded detail area */}
                            {isExpanded && hasDetails && (
                                <div className="bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 px-4 md:px-14 py-5 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">

                                    {/* ① Severity banner */}
                                    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-r-lg text-[11px] font-black uppercase tracking-widest ${severityStyles.banner}`}>
                                        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                                        <span>{severityStyles.label} — {meta.label_tr || log.action}</span>
                                        <span className="ml-auto font-mono font-normal text-[10px] opacity-60">severity={meta.severity}</span>
                                    </div>

                                    {/* ② Meta grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1 flex items-center gap-1"><Hash className="w-3 h-3" /> Log ID</p>
                                            <p className="font-mono text-sm font-bold text-zinc-800 dark:text-zinc-200">#{log.id}</p>
                                        </div>
                                        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> ISO 8601</p>
                                            <p className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 break-all">{formatISO(log.createdAt)}</p>
                                        </div>
                                        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Yerel Zaman</p>
                                            <p className="text-[11px] text-zinc-700 dark:text-zinc-300">
                                                {new Date(log.createdAt).toLocaleString("tr-TR", {
                                                    day: "2-digit", month: "long", year: "numeric",
                                                    hour: "2-digit", minute: "2-digit", second: "2-digit",
                                                })}
                                            </p>
                                        </div>
                                        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1 flex items-center gap-1"><Globe className="w-3 h-3" /> IP Adresi</p>
                                            <p className="font-mono text-sm font-bold text-zinc-800 dark:text-zinc-200">{log.ipAddress || "127.0.0.1"}</p>
                                        </div>
                                    </div>

                                    {/* ③ Details code block */}
                                    {log.details && (
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-1.5">
                                                <Terminal className="w-3 h-3" /> Detay Payload
                                            </p>
                                            {jsonFormatted ? (
                                                <pre className="bg-zinc-950 text-emerald-400 font-mono text-[11px] p-4 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed border border-zinc-800 max-h-64">
                                                    {jsonFormatted}
                                                </pre>
                                            ) : (
                                                <pre className="bg-zinc-950 text-zinc-300 font-mono text-[11px] p-4 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed border border-zinc-800 max-h-64">
                                                    {raw}
                                                </pre>
                                            )}
                                        </div>
                                    )}

                                    {/* ④ SQL reference */}
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-1.5">
                                            <Database className="w-3 h-3" /> Kayıt Sorgusu
                                        </p>
                                        <pre className="bg-zinc-950 text-sky-400 font-mono text-[10px] p-3 rounded-xl border border-zinc-800 overflow-x-auto">
                                            {`-- audit_logs tablosundan bu kaydı getir\nSELECT * FROM audit_logs WHERE id = ${log.id};`}
                                            {log.targetId ? `\n\n-- Hedef kullanıcı kaydı\nSELECT * FROM users WHERE id = ${log.targetId};` : ""}
                                        </pre>
                                    </div>

                                    {/* ⑤ User-agent + IP row */}
                                    <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-zinc-400 py-1">
                                        <div className="flex items-center gap-1.5">
                                            <Monitor className="w-3 h-3" />
                                            <span>User-Agent: <em className="text-zinc-500 not-italic">kaydedilmiyor</em></span>
                                        </div>
                                        <span className="text-zinc-700">·</span>
                                        <div className="flex items-center gap-1.5">
                                            <Globe className="w-3 h-3" />
                                            <span>Remote-Addr: <span className="text-zinc-300">{log.ipAddress || "127.0.0.1"}</span></span>
                                        </div>
                                        {log.userId && (
                                            <>
                                                <span className="text-zinc-700">·</span>
                                                <div className="flex items-center gap-1.5">
                                                    <UserIcon className="w-3 h-3" />
                                                    <span>actor_id: <span className="text-zinc-300">{log.userId}</span></span>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* ⑥ Summary row */}
                                    <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${severityStyles.pill}`}>
                                            {CATEGORY_LABELS[meta.category]}
                                        </span>
                                        <span className="text-[11px] text-zinc-400">
                                            {displayName} tarafından — {new Date(log.createdAt).toLocaleString("tr-TR", {
                                                day: "2-digit", month: "long", year: "numeric",
                                                hour: "2-digit", minute: "2-digit", second: "2-digit",
                                            })}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Table footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/20">
                <span className="text-[10px] font-mono text-zinc-400">
                    {filteredLogs.length} kayıt gösteriliyor
                    {activeCategory ? ` (${logs.length} toplamdan filtrelendi)` : ` (toplam ${logs.length})`}
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                    audit_logs · limit 200
                </span>
            </div>
        </div>
    );
}
