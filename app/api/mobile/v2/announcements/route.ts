import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyMobileToken } from "@/lib/mobile-auth";

export async function GET(req: NextRequest) {
    const auth = await verifyMobileToken(req);
    if (!auth) {
        return NextResponse.json({ announcements: [], unreadCount: 0 }, { status: 401 });
    }

    try {
        const targetGroups = ["ALL"];
        const roleTargets = ["REFEREE", "OBSERVER", "TABLE", "STATISTICIAN", "HEALTH", "FIELD_COMMISSIONER"];
        if (roleTargets.includes(auth.role)) targetGroups.push(auth.role);
        targetGroups.push(`SPECIFIC:${auth.userId}`);

        const rows = await db.announcement.findMany({
            where: {
                target: { in: targetGroups },
            },
            include: {
                reads: {
                    where: { userId: auth.userId },
                    select: { id: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        const announcements = rows.map((a) => ({
            id: a.id,
            subject: a.subject,
            content: a.content,
            target: a.target,
            createdAt: a.createdAt.toISOString(),
            isRead: a.reads.length > 0,
        }));

        const unreadCount = announcements.filter((a) => !a.isRead).length;

        return NextResponse.json({ announcements, unreadCount });
    } catch (e) {
        console.error("[mobile/v2/announcements] GET error:", e);
        return NextResponse.json({ announcements: [], unreadCount: 0 }, { status: 500 });
    }
}
