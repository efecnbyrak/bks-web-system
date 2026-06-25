// Admin genel görevli listesi — tip filtresi ve arama ile.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyMobileToken } from "@/lib/mobile-auth";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "ADMIN_IHK"];

export async function GET(req: NextRequest) {
    const auth = await verifyMobileToken(req);
    if (!auth || !ADMIN_ROLES.includes(auth.role)) {
        return NextResponse.json({ officials: [] }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const officialType = searchParams.get("officialType"); // TABLE, OBSERVER, STATISTICIAN, HEALTH, FIELD_COMMISSIONER
    const search = searchParams.get("search")?.trim() ?? "";
    const approvedOnly = searchParams.get("approvedOnly") !== "false";

    try {
        const where: any = {};

        if (officialType && officialType !== "ALL") {
            where.officialType = officialType;
        }

        if (approvedOnly) {
            where.user = { isApproved: true };
        }

        const officials = await db.generalOfficial.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        isActive: true,
                        isApproved: true,
                        suspendedUntil: true,
                        lastLoginAt: true,
                        role: { select: { name: true } },
                    },
                },
                regions: { select: { id: true, name: true } },
            },
            orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        });

        const filtered = search
            ? officials.filter((o) => {
                  const fullName = `${o.firstName} ${o.lastName}`.toLowerCase();
                  return fullName.includes(search.toLowerCase()) || (o.email ?? "").toLowerCase().includes(search.toLowerCase());
              })
            : officials;

        const result = filtered.map((o) => ({
            userId: o.userId,
            firstName: o.firstName,
            lastName: o.lastName,
            email: o.email,
            phone: o.phone,
            officialType: o.officialType,
            imageUrl: o.imageUrl,
            address: o.address,
            regions: o.regions.map((reg) => reg.name),
            isActive: o.user.isActive,
            isApproved: o.user.isApproved,
            isAdmin: o.user.role?.name === "ADMIN" || o.user.role?.name === "SUPER_ADMIN",
            roleName: o.user.role?.name ?? null,
            suspendedUntil: o.user.suspendedUntil?.toISOString() ?? null,
            lastLoginAt: o.user.lastLoginAt?.toISOString() ?? null,
        }));

        return NextResponse.json({ officials: result });
    } catch (e) {
        console.error("[mobile/v2/admin/officials] GET error:", e);
        return NextResponse.json({ officials: [] }, { status: 500 });
    }
}
