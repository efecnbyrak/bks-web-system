import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { History, User as UserIcon, Globe, Clock, ShieldAlert } from "lucide-react";
import { ensureAuditLogTable } from "@/lib/logger";
import { LogsClient } from "./LogsClient";

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{ startDate?: string; endDate?: string; userId?: string }>;
}

export default async function AuditLogsPage({ searchParams }: PageProps) {
    const session = await getSession();
    if (session?.role !== "SUPER_ADMIN") {
        redirect("/admin");
    }

    const params = await searchParams;
    const { startDate, endDate, userId } = params;

    await ensureAuditLogTable();

    // Fetch user list for filter dropdown
    const users = await db.user.findMany({
        select: {
            id: true,
            username: true,
            referee: { select: { firstName: true, lastName: true } },
            official: { select: { firstName: true, lastName: true } },
        },
        orderBy: { id: 'asc' },
    });

    let logs: any[] = [];
    try {
        const where: any = {};
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.createdAt.lte = end;
            }
        }
        if (userId) {
            where.userId = parseInt(userId, 10);
        }

        logs = await (db as any).auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 200,
            include: {
                user: {
                    select: {
                        username: true,
                        referee: {
                            select: { firstName: true, lastName: true }
                        },
                        official: {
                            select: { firstName: true, lastName: true }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error("[AUDIT LOG ERROR] Prisma fetch failed:", error);
    }

    const getActionColor = (action: string) => {
        if (action.includes("LOGIN")) return "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20";
        if (action.includes("PASSWORD") || action.includes("RESET")) return "text-amber-600 bg-amber-50 dark:bg-amber-900/20";
        if (action.includes("DELETE") || action.includes("REJECT") || action.includes("SUSPEND") || action.includes("PENALTY")) return "text-rose-600 bg-rose-50 dark:bg-rose-900/20";
        if (action.includes("APPROVE") || action.includes("SUBMIT") || action.includes("SUCCESS")) return "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20";
        if (action.includes("PROMOTE") || action.includes("DEMOTE")) return "text-violet-600 bg-violet-50 dark:bg-violet-900/20";
        return "text-zinc-600 bg-zinc-50 dark:bg-zinc-900/20";
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20">
                        <History className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tight">Sistem İşlem Kayıtları</h1>
                        <p className="text-sm text-zinc-500 font-bold uppercase italic">Son 200 işlem günlüğü</p>
                    </div>
                </div>
                <LogsClient users={users} />
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 uppercase text-[10px] font-black tracking-widest border-b border-zinc-100 dark:border-zinc-800">
                                <th className="px-6 py-5">İşlem</th>
                                <th className="px-6 py-5">Kullanıcı</th>
                                <th className="px-6 py-5">Detay</th>
                                <th className="px-6 py-5">IP Adresi</th>
                                <th className="px-6 py-5">Tarih</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-medium">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-20">
                                            <ShieldAlert className="w-12 h-12" />
                                            <p className="uppercase font-black italic">Henüz kayıt bulunmuyor</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => {
                                    const profile = log.user?.referee || log.user?.official;
                                    const displayName = profile
                                        ? `${profile.firstName} ${profile.lastName}`
                                        : (log.user?.username || "Sistem");
                                    return (
                                        <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getActionColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
                                                        <UserIcon className="w-4 h-4 text-zinc-400" />
                                                    </div>
                                                    <div>
                                                        <p className="text-zinc-900 dark:text-zinc-100 truncate max-w-[150px]">{displayName}</p>
                                                        <p className="text-[10px] text-zinc-500 font-bold">UID: {log.userId || "-"}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 max-w-xs truncate italic">
                                                {log.details || "-"}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-zinc-500">
                                                    <Globe className="w-3 h-3 text-zinc-400" />
                                                    <span className="font-mono text-xs">{log.ipAddress || "Bilinmiyor"}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-zinc-500">
                                                    <Clock className="w-3 h-3 text-zinc-400" />
                                                    <span className="text-[10px] font-bold">
                                                        {new Date(log.createdAt).toLocaleString('tr-TR', {
                                                            day: '2-digit',
                                                            month: '2-digit',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
