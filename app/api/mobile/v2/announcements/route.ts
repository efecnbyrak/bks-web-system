import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyMobileToken } from "@/lib/mobile-auth";

export async function GET(req: NextRequest) {
    const auth = await verifyMobileToken(req);
    if (!auth) {
        return NextResponse.json({ announcements: [] }, { status: 401 });
    }

    try {
        const targetGroups = ["ALL"];
        const roleTargets = ["REFEREE", "OBSERVER", "TABLE", "STATISTICIAN", "HEALTH", "FIELD_COMMISSIONER"];
        if (roleTargets.includes(auth.role)) targetGroups.push(auth.role);
        // SPECIFIC:<userId> hedefli duyurular
        targetGroups.push(`SPECIFIC:${auth.userId}`);

        const announcements = await db.announcement.findMany({
            where: {
                target: { in: targetGroups },
                reads: {
                    none: { userId: auth.userId },
                },
            },
            orderBy: { createdAt: "asc" },
        });

        return NextResponse.json({ announcements });
    } catch (e) {
        console.error("[mobile/v2/announcements] GET error:", e);
        return NextResponse.json({ announcements: [] }, { status: 500 });
    }
}
