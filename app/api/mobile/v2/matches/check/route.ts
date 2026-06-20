import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyMobileToken } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const auth = await verifyMobileToken(req);
    if (!auth) {
        return NextResponse.json({ matchCount: 0, matchIds: [] }, { status: 401 });
    }
    try {
        const assignments = await db.userMatchAssignment.findMany({
            where: { userId: auth.userId, match: { cancelledAt: null } },
            select: { matchId: true },
        });
        const matchIds = assignments.map((a) => a.matchId);
        return NextResponse.json({ matchCount: matchIds.length, matchIds });
    } catch (e) {
        console.error("[mobile/v2/matches/check] GET error:", e);
        return NextResponse.json({ matchCount: 0, matchIds: [] }, { status: 500 });
    }
}
