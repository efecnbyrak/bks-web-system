// Admin gözlemci raporları listesi — 14 günden eski olanlar otomatik temizlenir.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyMobileToken } from "@/lib/mobile-auth";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "ADMIN_IHK"];

export async function GET(req: NextRequest) {
    const auth = await verifyMobileToken(req);
    if (!auth || !ADMIN_ROLES.includes(auth.role)) {
        return NextResponse.json({ reports: [] }, { status: 403 });
    }

    try {
        // 14 günden eski raporları sil
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        await db.observerReport.deleteMany({ where: { createdAt: { lt: fourteenDaysAgo } } });

        const reports = await db.observerReport.findMany({
            include: {
                createdBy: {
                    include: {
                        referee: { select: { firstName: true, lastName: true, imageUrl: true } },
                        official: { select: { firstName: true, lastName: true, imageUrl: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        const result = reports.map((r) => {
            const profile = r.createdBy.referee ?? r.createdBy.official;
            return {
                id: r.id,
                title: r.title,
                content: r.content,
                imageUrl: r.imageUrl,
                createdAt: r.createdAt.toISOString(),
                createdById: r.createdById,
                creatorName: profile ? `${profile.firstName} ${profile.lastName}` : "Bilinmiyor",
                creatorImageUrl: profile?.imageUrl ?? null,
                creatorType: r.createdBy.referee ? "REFEREE" : "OFFICIAL",
            };
        });

        return NextResponse.json({ reports: result });
    } catch (e) {
        console.error("[mobile/v2/admin/observer-reports] GET error:", e);
        return NextResponse.json({ reports: [] }, { status: 500 });
    }
}
