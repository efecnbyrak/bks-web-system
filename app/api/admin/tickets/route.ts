import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        const session = await verifySession();
        if (!session.userId || !["SUPER_ADMIN", "ADMIN", "ADMIN_IHK"].includes(session.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const search = searchParams.get("search") ?? "";

        const tickets = await db.supportTicket.findMany({
            where: {
                ...(status && status !== "ALL" ? { status } : {}),
                ...(search ? {
                    OR: [
                        { subject: { contains: search, mode: "insensitive" } },
                        { description: { contains: search, mode: "insensitive" } },
                    ],
                } : {}),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        referee: { select: { firstName: true, lastName: true, email: true } },
                        official: { select: { firstName: true, lastName: true, email: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        const formatted = tickets.map((t) => ({
            ...t,
            userName: t.user.referee
                ? `${t.user.referee.firstName} ${t.user.referee.lastName}`
                : t.user.official
                ? `${t.user.official.firstName} ${t.user.official.lastName}`
                : "Bilinmiyor",
            userEmail: t.user.referee?.email ?? t.user.official?.email ?? "-",
        }));

        return NextResponse.json({ tickets: formatted });
    } catch (error) {
        console.error("GET /api/admin/tickets error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
