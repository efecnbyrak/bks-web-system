// Tüm hakemler ve görevlilerin haftalık uygunluk formlarını döner.
// week=current|last, tab=referees|officials, subFilter=klasman veya tip
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyMobileToken } from "@/lib/mobile-auth";
import { getAvailabilityWindow } from "@/lib/availability-utils";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "ADMIN_IHK"];

export async function GET(req: NextRequest) {
    const auth = await verifyMobileToken(req);
    if (!auth || !ADMIN_ROLES.includes(auth.role)) {
        return NextResponse.json({ users: [], weekDates: [] }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const week = searchParams.get("week") ?? "current"; // current | last
    const tab = searchParams.get("tab") ?? "referees"; // referees | officials
    const subFilter = searchParams.get("subFilter") ?? ""; // klasman veya officialType
    const search = searchParams.get("search")?.trim() ?? "";

    try {
        const { startDate } = await getAvailabilityWindow();

        // Hedef haftanın başlangıç tarihi
        const weekStart = new Date(startDate);
        if (week === "last") {
            weekStart.setDate(weekStart.getDate() - 7);
        }
        weekStart.setHours(0, 0, 0, 0);

        // 7 günlük tarih dizisi oluştur
        const weekDates: string[] = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(weekStart);
            d.setDate(d.getDate() + i);
            return d.toISOString().split("T")[0];
        });

        if (tab === "referees") {
            const refWhere: any = { user: { isApproved: true, isActive: true } };
            if (subFilter && subFilter !== "ALL") {
                refWhere.classification = subFilter;
            }

            const referees = await db.referee.findMany({
                where: refWhere,
                include: {
                    forms: {
                        where: { weekStartDate: weekStart },
                        include: { days: true },
                    },
                    regions: { select: { name: true } },
                },
                orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
            });

            const filtered = search
                ? referees.filter((r) => `${r.firstName} ${r.lastName}`.toLowerCase().includes(search.toLowerCase()))
                : referees;

            const result = filtered.map((r) => {
                const form = r.forms[0] ?? null;
                const dayMap = new Map(form?.days.map((d) => [d.date.toISOString().split("T")[0], d.slots]) ?? []);
                return {
                    userId: r.userId,
                    firstName: r.firstName,
                    lastName: r.lastName,
                    phone: r.phone,
                    classification: r.classification,
                    regions: r.regions.map((reg) => reg.name),
                    hasForm: !!form,
                    slots: weekDates.map((date) => ({ date, slots: dayMap.get(date) ?? null })),
                };
            });

            return NextResponse.json({ users: result, weekDates, weekStart: weekStart.toISOString() });
        } else {
            const offWhere: any = { user: { isApproved: true, isActive: true } };
            if (subFilter && subFilter !== "ALL") {
                offWhere.officialType = subFilter;
            }

            const officials = await db.generalOfficial.findMany({
                where: offWhere,
                include: {
                    forms: {
                        where: { weekStartDate: weekStart },
                        include: { days: true },
                    },
                    regions: { select: { name: true } },
                },
                orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
            });

            const filtered = search
                ? officials.filter((o) => `${o.firstName} ${o.lastName}`.toLowerCase().includes(search.toLowerCase()))
                : officials;

            const result = filtered.map((o) => {
                const form = o.forms[0] ?? null;
                const dayMap = new Map(form?.days.map((d) => [d.date.toISOString().split("T")[0], d.slots]) ?? []);
                return {
                    userId: o.userId,
                    firstName: o.firstName,
                    lastName: o.lastName,
                    phone: o.phone,
                    officialType: o.officialType,
                    regions: o.regions.map((reg) => reg.name),
                    hasForm: !!form,
                    slots: weekDates.map((date) => ({ date, slots: dayMap.get(date) ?? null })),
                };
            });

            return NextResponse.json({ users: result, weekDates, weekStart: weekStart.toISOString() });
        }
    } catch (e) {
        console.error("[mobile/v2/admin/all-availabilities] GET error:", e);
        return NextResponse.json({ users: [], weekDates: [] }, { status: 500 });
    }
}
