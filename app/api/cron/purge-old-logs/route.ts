import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const RETENTION_DAYS = 30;

export async function GET(req: Request) {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

        const result = await (db as any).auditLog.deleteMany({
            where: { createdAt: { lt: cutoff } },
        });

        await (db as any).auditLog.create({
            data: {
                userId: null,
                action: "LOGS_AUTO_PURGED",
                details: JSON.stringify({ deletedCount: result.count, retentionDays: RETENTION_DAYS }),
                ipAddress: "cron",
            },
        });

        return NextResponse.json({ success: true, deletedCount: result.count });
    } catch (error: any) {
        console.error("[PURGE LOGS ERROR]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
