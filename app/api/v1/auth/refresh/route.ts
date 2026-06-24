import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jwtVerify, SignJWT } from "jose";
import { createHash } from "crypto";

/**
 * POST /api/v1/auth/refresh
 *
 * Mobile token yenileme endpoint'i.
 * Mevcut geçerli JWT'yi doğrular ve 14 günlük yeni bir token döndürür.
 * Re-login gerektirmez.
 */

const getMobileKey = () => {
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
    if (!secret) {
        if (process.env.NODE_ENV === "production") {
            throw new Error("CRITICAL: NEXTAUTH_SECRET or JWT_SECRET must be set in production.");
        }
        return new TextEncoder().encode("dev-only-mobile-key-not-for-production!!");
    }
    return new TextEncoder().encode(secret);
};

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Token gereklidir." }, { status: 401 });
        }

        const oldToken = authHeader.substring(7);

        let payload: { userId?: number; role?: string } = {};
        try {
            const result = await jwtVerify(oldToken, getMobileKey(), { algorithms: ["HS256"] });
            payload = result.payload as { userId?: number; role?: string };
        } catch {
            return NextResponse.json({ error: "Geçersiz veya süresi dolmuş token." }, { status: 401 });
        }

        if (!payload.userId) {
            return NextResponse.json({ error: "Geçersiz token içeriği." }, { status: 401 });
        }

        // DB'deki token hash ile eşleştiğini doğrula (revoke desteği)
        const tokenHash = createHash("sha256").update(oldToken).digest("hex");
        const user = await db.user.findUnique({
            where: { id: payload.userId },
            include: { role: true, referee: true, official: true },
        }) as any;

        if (!user) {
            return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 401 });
        }

        if (user.mobileToken !== tokenHash) {
            return NextResponse.json({ error: "Token geçersiz kılınmış." }, { status: 401 });
        }

        if (!user.isActive || !user.isApproved) {
            return NextResponse.json({ error: "Hesap erişimi kısıtlandı." }, { status: 403 });
        }

        // Yeni token oluştur
        const newToken = await new SignJWT({ userId: user.id, role: user.role.name, mobile: true })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("14d")
            .sign(getMobileKey());

        const newHash = createHash("sha256").update(newToken).digest("hex");
        const expiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

        await db.user.update({
            where: { id: user.id },
            data: { mobileToken: newHash, mobileTokenExpiry: expiry },
        });

        const profile = user.referee || user.official;
        const userResponse = {
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
            imageUrl: profile?.imageUrl ?? null,
            officialType: profile?.officialType ?? null,
            isApproved: user.isApproved,
            isActive: user.isActive,
            recoveryCode: user.recoveryCode ?? null,
            securityQuestion: user.securityQuestion ?? null,
        };

        return NextResponse.json({ success: true, token: newToken, user: userResponse });

    } catch (error) {
        console.error("[API/V1/AUTH/REFRESH] Error:", error);
        return NextResponse.json(
            { error: "Token yenilenirken bir hata oluştu." },
            { status: 500 }
        );
    }
}
