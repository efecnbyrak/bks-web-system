import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyMobileToken } from "@/lib/mobile-auth";

/**
 * GET /api/v1/auth/me
 *
 * Mevcut token'a sahip kullanıcının tam profilini döndürür.
 * Login response'unda olmayan securityQuestion, recoveryCode gibi
 * alanları da içerir. Mobil uygulama login sonrası bunu çağırır.
 */
export async function GET(request: NextRequest) {
    const auth = await verifyMobileToken(request);
    if (!auth) {
        return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    try {
        const user = await db.user.findUnique({
            where: { id: auth.userId },
            include: { role: true, referee: true, official: true },
        }) as any;

        if (!user) {
            return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
        }

        if (!user.isActive || !user.isApproved) {
            return NextResponse.json({ error: "Hesap erişimi kısıtlandı." }, { status: 403 });
        }

        const profile = user.referee || user.official;

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                role: user.role.name,
                firstName: profile?.firstName ?? null,
                lastName: profile?.lastName ?? null,
                email: profile?.email ?? null,
                phone: profile?.phone ?? null,
                classification: profile?.classification ?? null,
                iban: profile?.iban ?? null,
                address: profile?.address ?? null,
                imageUrl: profile?.imageUrl ?? user.imageUrl ?? null,
                officialType: user.official?.officialType ?? null,
                isApproved: user.isApproved,
                isActive: user.isActive,
                // Güvenlik sorusu ve kurtarma kodu — profil ekranında gösterilir
                recoveryCode: user.recoveryCode ?? null,
                securityQuestion: user.securityQuestion ?? null,
            },
        });

    } catch (error) {
        console.error("[API/V1/AUTH/ME] Error:", error);
        return NextResponse.json(
            { error: "Profil bilgileri alınırken bir hata oluştu." },
            { status: 500 }
        );
    }
}
