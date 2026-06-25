// Admin hakem listesi — filtreleme, arama ve aktiflik durumu ile.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyMobileToken } from "@/lib/mobile-auth";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "ADMIN_IHK"];

export async function GET(req: NextRequest) {
    const auth = await verifyMobileToken(req);
    if (!auth || !ADMIN_ROLES.includes(auth.role)) {
        return NextResponse.json({ referees: [] }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const classification = searchParams.get("classification"); // A, B, C, IL_HAKEMI, ADAY_HAKEM, BELIRLENMEMIS
    const search = searchParams.get("search")?.trim() ?? "";
    const approvedOnly = searchParams.get("approvedOnly") !== "false"; // default: true

    try {
        const where: any = {};

        if (classification && classification !== "ALL") {
            where.classification = classification;
        }

        // Onay bekleyenler için isApproved filtresi
        if (approvedOnly) {
            where.user = { isApproved: true };
        }

        const referees = await db.referee.findMany({
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

        // İsim araması sunucu tarafında filtrele
        const filtered = search
            ? referees.filter((r) => {
                  const fullName = `${r.firstName} ${r.lastName}`.toLowerCase();
                  return fullName.includes(search.toLowerCase()) || (r.email ?? "").toLowerCase().includes(search.toLowerCase());
              })
            : referees;

        const result = filtered.map((r) => ({
            userId: r.userId,
            firstName: r.firstName,
            lastName: r.lastName,
            email: r.email,
            phone: r.phone,
            classification: r.classification,
            imageUrl: r.imageUrl,
            address: r.address,
            regions: r.regions.map((reg) => reg.name),
            isActive: r.user.isActive,
            isApproved: r.user.isApproved,
            isAdmin: r.user.role?.name === "ADMIN" || r.user.role?.name === "SUPER_ADMIN",
            roleName: r.user.role?.name ?? null,
            suspendedUntil: r.user.suspendedUntil?.toISOString() ?? null,
            lastLoginAt: r.user.lastLoginAt?.toISOString() ?? null,
        }));

        return NextResponse.json({ referees: result });
    } catch (e) {
        console.error("[mobile/v2/admin/referees] GET error:", e);
        return NextResponse.json({ referees: [] }, { status: 500 });
    }
}
