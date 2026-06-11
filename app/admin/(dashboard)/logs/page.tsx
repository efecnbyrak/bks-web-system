import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { History, ShieldAlert } from "lucide-react";
import { ensureAuditLogTable } from "@/lib/logger";
import { getLogStats } from "./logsUtils";
import { LogsClient } from "./LogsClient";
import { LogsTable } from "./LogsTable";

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

    // Fetch user list for filter — sorted alphabetically by first name
    const usersRaw = await db.user.findMany({
        select: {
            id: true,
            username: true,
            referee: { select: { firstName: true, lastName: true } },
            official: { select: { firstName: true, lastName: true } },
        },
    });
    const users = usersRaw.sort((a, b) => {
        const nameA = (a.referee?.firstName || a.official?.firstName || a.username).toLocaleLowerCase('tr');
        const nameB = (b.referee?.firstName || b.official?.firstName || b.username).toLocaleLowerCase('tr');
        const lastA = (a.referee?.lastName || a.official?.lastName || '').toLocaleLowerCase('tr');
        const lastB = (b.referee?.lastName || b.official?.lastName || '').toLocaleLowerCase('tr');
        return (nameA + ' ' + lastA).localeCompare(nameB + ' ' + lastB, 'tr');
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

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20">
                        <History className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tight">Sistem İşlem Kayıtları</h1>
                        <p className="text-sm text-zinc-500 font-bold uppercase italic">Son 200 işlem — satıra tıkla detay gör</p>
                        {(() => {
                            const stats = getLogStats(logs);
                            return (
                                <p className="font-mono text-[10px] text-zinc-400 mt-1 flex flex-wrap gap-x-3">
                                    <span>TOTAL: {stats.total}</span>
                                    <span className="text-zinc-600">·</span>
                                    <span className="text-emerald-600 dark:text-emerald-500">AUTH: {stats.auth}</span>
                                    <span className="text-zinc-600">·</span>
                                    <span className="text-violet-600 dark:text-violet-400">MGMT: {stats.user_mgmt}</span>
                                    <span className="text-zinc-600">·</span>
                                    <span className="text-orange-600 dark:text-orange-400">PENALTY: {stats.penalty}</span>
                                    <span className="text-zinc-600">·</span>
                                    <span className="text-red-600 dark:text-red-400">CRITICAL: {stats.critical}</span>
                                    <span className="text-zinc-600">·</span>
                                    <span className="text-amber-600 dark:text-amber-400">WARN: {stats.warning}</span>
                                </p>
                            );
                        })()}
                    </div>
                </div>
                <LogsClient users={users} />
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                    {/* Tablo başlıkları */}
                    <div className="flex items-center gap-0 bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 uppercase text-[10px] font-black tracking-widest border-b border-zinc-100 dark:border-zinc-800">
                        <div className="pl-4 pr-2 py-5 w-10 shrink-0" />
                        <div className="hidden lg:block px-2 py-5 w-16 shrink-0 font-mono">#id</div>
                        <div className="px-4 py-5 w-52 md:w-64 shrink-0">İşlem</div>
                        <div className="px-4 py-5 flex-1">Kullanıcı</div>
                        <div className="px-4 py-5 w-64 shrink-0">Detay</div>
                        <div className="hidden lg:block px-4 py-5 w-40 shrink-0">IP Adresi</div>
                        <div className="px-4 py-5 w-36 shrink-0 flex items-center justify-between">
                            <span>Tarih</span>
                            <span className="font-mono text-[9px] normal-case text-zinc-400 hidden xl:block mr-2">{logs.length}/200</span>
                        </div>
                    </div>
                    {logs.length === 0 ? (
                        <div className="px-6 py-20 text-center">
                            <div className="flex flex-col items-center gap-2 opacity-20">
                                <ShieldAlert className="w-12 h-12" />
                                <p className="uppercase font-black italic">Henüz kayıt bulunmuyor</p>
                            </div>
                        </div>
                    ) : (
                        <LogsTable logs={logs.map(l => ({
                            ...l,
                            createdAt: l.createdAt.toISOString(),
                        }))} />
                    )}
                </div>
            </div>
        </div>
    );
}
