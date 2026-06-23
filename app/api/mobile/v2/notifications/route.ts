import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyMobileToken } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

export interface NotificationItem {
    id: string;
    type: "ANNOUNCEMENT" | "TICKET_REPLY" | "MATCH";
    title: string;
    body: string;
    createdAt: string;
    isRead: boolean;
    navTarget: "Announcements" | "Tickets" | "Matches";
    refId: number;
}

export async function GET(req: NextRequest) {
    const auth = await verifyMobileToken(req);
    if (!auth) {
        return NextResponse.json(
            { items: [], unreadCounts: { announcements: 0, tickets: 0, total: 0 } },
            { status: 401 }
        );
    }

    try {
        const targetGroups = ["ALL"];
        const roleTargets = ["REFEREE", "OBSERVER", "TABLE", "STATISTICIAN", "HEALTH", "FIELD_COMMISSIONER"];
        if (roleTargets.includes(auth.role)) targetGroups.push(auth.role);
        targetGroups.push(`SPECIFIC:${auth.userId}`);

        const [announcementRows, ticketRows, matchRows] = await Promise.all([
            db.announcement.findMany({
                where: { target: { in: targetGroups } },
                include: {
                    reads: {
                        where: { userId: auth.userId },
                        select: { id: true },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: 50,
            }),
            db.supportTicket.findMany({
                where: { userId: auth.userId, adminNote: { not: null } },
                orderBy: { updatedAt: "desc" },
                take: 30,
            }),
            db.userMatchAssignment.findMany({
                where: { userId: auth.userId, match: { cancelledAt: null } },
                include: {
                    match: {
                        select: { macAdi: true, tarihDate: true, createdAt: true },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: 20,
            }),
        ]);

        const announcementItems: NotificationItem[] = announcementRows.map((a) => ({
            id: `ann_${a.id}`,
            type: "ANNOUNCEMENT",
            title: a.subject,
            body: a.content.replace(/<[^>]*>/g, "").slice(0, 120),
            createdAt: a.createdAt.toISOString(),
            isRead: a.reads.length > 0,
            navTarget: "Announcements",
            refId: a.id,
        }));

        const ticketItems: NotificationItem[] = ticketRows.map((t) => ({
            id: `ticket_${t.id}`,
            type: "TICKET_REPLY",
            title: "Destek Talebinize Yanıt",
            body: t.subject,
            createdAt: (t.updatedAt ?? t.createdAt).toISOString(),
            isRead: t.replySeenAt !== null,
            navTarget: "Tickets",
            refId: t.id,
        }));

        const matchItems: NotificationItem[] = matchRows.map((a) => ({
            id: `match_${a.matchId}`,
            type: "MATCH",
            title: "Yeni Maç Ataması",
            body: a.match?.macAdi ?? "Maç bilgisi yükleniyor",
            createdAt: (a.createdAt ?? a.match?.createdAt ?? new Date()).toISOString(),
            isRead: true,
            navTarget: "Matches",
            refId: a.matchId,
        }));

        const all = [...announcementItems, ...ticketItems, ...matchItems].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ).slice(0, 50);

        const unreadAnnouncements = announcementItems.filter((n) => !n.isRead).length;
        const unreadTickets = ticketItems.filter((n) => !n.isRead).length;

        return NextResponse.json({
            items: all,
            unreadCounts: {
                announcements: unreadAnnouncements,
                tickets: unreadTickets,
                total: unreadAnnouncements + unreadTickets,
            },
        });
    } catch (e) {
        console.error("[mobile/v2/notifications] GET error:", e);
        return NextResponse.json(
            { items: [], unreadCounts: { announcements: 0, tickets: 0, total: 0 } },
            { status: 500 }
        );
    }
}
