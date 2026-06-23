import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyMobileToken } from "@/lib/mobile-auth";

/**
 * GET /api/mobile/v2/availability/past
 * Son 14 günün uygunluk formlarını döndürür.
 */
export async function GET(request: NextRequest) {
    const auth = await verifyMobileToken(request);
    if (!auth) {
        return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    try {
        const [refereeProfile, officialProfile] = await Promise.all([
            db.referee.findUnique({ where: { userId: auth.userId } }),
            db.generalOfficial.findUnique({ where: { userId: auth.userId } }),
        ]);

        const profile = refereeProfile || officialProfile;
        const isOfficial = !refereeProfile;

        if (!profile) {
            return NextResponse.json({ error: "Profil bulunamadı." }, { status: 404 });
        }

        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 21);

        const forms = await db.availabilityForm.findMany({
            where: {
                ...(isOfficial ? { officialId: profile.id } : { refereeId: profile.id }),
                weekStartDate: { gte: twoWeeksAgo },
            },
            include: { days: true },
            orderBy: { weekStartDate: "desc" },
        });

        const result = forms.map((form) => {
            const weekStart = new Date(form.weekStartDate);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);

            return {
                id: form.id,
                weekStartDate: form.weekStartDate.toISOString(),
                weekEndDate: weekEnd.toISOString(),
                status: form.status,
                createdAt: form.createdAt.toISOString(),
                days: form.days.map((d: any) => ({
                    date: d.date.toISOString(),
                    slots: d.slots,
                })),
            };
        });

        return NextResponse.json({ forms: result });
    } catch (error) {
        console.error("[v2/availability/past] GET error:", error);
        return NextResponse.json({ error: "Sistem hatası." }, { status: 500 });
    }
}
