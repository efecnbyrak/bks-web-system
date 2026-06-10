import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { normalizePhoneToStorage } from "@/lib/validation-utils";
import { logAction } from "@/lib/logger";

export async function GET() {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
    }

    const [referees, officials] = await Promise.all([
        db.referee.findMany({ select: { id: true, phone: true, firstName: true, lastName: true } }),
        db.generalOfficial.findMany({ select: { id: true, phone: true, firstName: true, lastName: true } }),
    ]);

    const targetFormat = /^05\d{9}$/;

    const refNeedsFix = referees.filter(r => r.phone && !targetFormat.test(r.phone));
    const offNeedsFix = officials.filter(o => o.phone && !targetFormat.test(o.phone));

    return NextResponse.json({
        referees: {
            total: referees.length,
            needsFix: refNeedsFix.length,
            examples: refNeedsFix.slice(0, 5).map(r => ({
                name: `${r.firstName} ${r.lastName}`,
                current: r.phone,
                normalized: normalizePhoneToStorage(r.phone),
            })),
        },
        officials: {
            total: officials.length,
            needsFix: offNeedsFix.length,
            examples: offNeedsFix.slice(0, 5).map(o => ({
                name: `${o.firstName} ${o.lastName}`,
                current: o.phone,
                normalized: normalizePhoneToStorage(o.phone),
            })),
        },
        totalNeedsFix: refNeedsFix.length + offNeedsFix.length,
    });
}

export async function POST() {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
    }

    const [referees, officials] = await Promise.all([
        db.referee.findMany({ select: { id: true, phone: true } }),
        db.generalOfficial.findMany({ select: { id: true, phone: true } }),
    ]);

    const targetFormat = /^05\d{9}$/;
    let updatedReferees = 0;
    let updatedOfficials = 0;

    for (const r of referees) {
        if (!r.phone || targetFormat.test(r.phone)) continue;
        const normalized = normalizePhoneToStorage(r.phone);
        if (normalized !== r.phone) {
            await db.referee.update({ where: { id: r.id }, data: { phone: normalized } });
            updatedReferees++;
        }
    }

    for (const o of officials) {
        if (!o.phone || targetFormat.test(o.phone)) continue;
        const normalized = normalizePhoneToStorage(o.phone);
        if (normalized !== o.phone) {
            await db.generalOfficial.update({ where: { id: o.id }, data: { phone: normalized } });
            updatedOfficials++;
        }
    }

    await logAction(
        session.userId,
        "PHONE_NORMALIZE",
        `Telefon normalizasyonu: ${updatedReferees} hakem + ${updatedOfficials} görevli güncellendi.`
    );

    return NextResponse.json({
        success: true,
        updatedReferees,
        updatedOfficials,
        total: updatedReferees + updatedOfficials,
        message: `${updatedReferees + updatedOfficials} kayıt güncellendi (${updatedReferees} hakem, ${updatedOfficials} görevli).`,
    });
}
