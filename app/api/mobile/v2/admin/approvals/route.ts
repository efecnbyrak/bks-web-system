// Onay bekleyen kullanıcılar listesi (isApproved: false).
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyMobileToken } from "@/lib/mobile-auth";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "ADMIN_IHK"];

export async function GET(req: NextRequest) {
    const auth = await verifyMobileToken(req);
    if (!auth || !ADMIN_ROLES.includes(auth.role)) {
        return NextResponse.json({ users: [] }, { status: 403 });
    }

    try {
        const pendingUsers = await db.user.findMany({
            where: { isApproved: false },
            include: {
                referee: { select: { firstName: true, lastName: true, email: true, phone: true, classification: true, address: true } },
                official: { select: { firstName: true, lastName: true, email: true, phone: true, officialType: true, address: true } },
            },
            orderBy: { createdAt: "asc" },
        });

        const result = pendingUsers.map((u) => {
            const profile = u.referee ?? u.official;
            return {
                userId: u.id,
                username: u.username,
                firstName: profile?.firstName ?? "",
                lastName: profile?.lastName ?? "",
                email: profile?.email ?? "",
                phone: profile?.phone ?? "",
                address: profile?.address ?? "",
                type: u.referee ? "REFEREE" : "OFFICIAL",
                classification: u.referee?.classification ?? null,
                officialType: u.official?.officialType ?? null,
                createdAt: u.createdAt.toISOString(),
            };
        });

        return NextResponse.json({ users: result });
    } catch (e) {
        console.error("[mobile/v2/admin/approvals] GET error:", e);
        return NextResponse.json({ users: [] }, { status: 500 });
    }
}
