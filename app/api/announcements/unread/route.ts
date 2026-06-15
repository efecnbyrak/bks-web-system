import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ hasUnread: false, count: 0 });
        }

        // Role is already in the verified session JWT — no extra DB fetch needed
        const targetGroups = ["ALL"];
        const roleTargets = ["REFEREE", "OBSERVER", "TABLE", "STATISTICIAN", "HEALTH", "FIELD_COMMISSIONER"];
        if (roleTargets.includes(session.role)) targetGroups.push(session.role);

        // Count unread genel + rol bazlı duyurular
        const unreadGenelCount = await db.announcement.count({
            where: {
                target: { in: targetGroups },
                reads: { none: { userId: session.userId } }
            }
        });

        // Count unread SPECIFIC (bana özel) duyurular
        const unreadSpecificCount = await db.announcement.count({
            where: {
                target: { contains: `SPECIFIC:` },
                reads: { none: { userId: session.userId } }
            }
        });

        // Sadece bu kullanıcıya ait SPECIFIC duyuruları filtrele
        const specificAnnouncements = await db.announcement.findMany({
            where: {
                target: { contains: "SPECIFIC:" },
                reads: { none: { userId: session.userId } }
            },
            select: { target: true }
        });
        const mySpecificUnread = specificAnnouncements.filter(a =>
            a.target.split(":")[1]?.split(",").map(Number).includes(session.userId)
        ).length;

        const unreadCount = unreadGenelCount + mySpecificUnread;

        return NextResponse.json({
            hasUnread: unreadCount > 0,
            count: unreadCount
        }, {
            headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' }
        });
    } catch (e) {
        console.error("Error fetching unread announcements:", e);
        return NextResponse.json({ hasUnread: false, count: 0 });
    }
}
