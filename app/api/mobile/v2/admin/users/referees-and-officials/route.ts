// Duyuru bireysel seçimi için hakem ve görevli listesi döner.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyMobileToken } from "@/lib/mobile-auth";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "ADMIN_IHK"];

export async function GET(req: NextRequest) {
    const auth = await verifyMobileToken(req);
    if (!auth || !ADMIN_ROLES.includes(auth.role)) {
        return NextResponse.json({ referees: [], officials: [] }, { status: 403 });
    }

    try {
        const referees = await db.referee.findMany({
            where: { user: { isActive: true } },
            select: { userId: true, firstName: true, lastName: true, email: true },
            orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        });

        const officials = await db.generalOfficial.findMany({
            where: { user: { isActive: true } },
            select: { userId: true, firstName: true, lastName: true, email: true, officialType: true },
            orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        });

        return NextResponse.json({ referees, officials });
    } catch (e) {
        console.error("[mobile/v2/admin/users/referees-and-officials] GET error:", e);
        return NextResponse.json({ referees: [], officials: [] }, { status: 500 });
    }
}
