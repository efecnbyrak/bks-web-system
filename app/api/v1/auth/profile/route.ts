import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jwtVerify } from "jose";

/**
 * PATCH /api/v1/auth/profile
 *
 * Mobile profil güncelleme endpoint'i.
 * phone, email, iban, address alanlarını günceller.
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

export async function PATCH(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Token gereklidir." }, { status: 401 });
        }

        const token = authHeader.substring(7);
        let payload: { userId?: number; role?: string } = {};
        try {
            const result = await jwtVerify(token, getMobileKey(), { algorithms: ["HS256"] });
            payload = result.payload as { userId?: number; role?: string };
        } catch {
            return NextResponse.json({ error: "Geçersiz veya süresi dolmuş token." }, { status: 401 });
        }

        if (!payload.userId) {
            return NextResponse.json({ error: "Geçersiz token." }, { status: 401 });
        }

        const body = await request.json();
        const { phone, email, iban, address } = body as {
            phone?: string;
            email?: string;
            iban?: string;
            address?: string;
        };

        // Sadece izin verilen alanları al; boş string → DB'den sil (null olarak yaz)
        const updateData: Record<string, string | null> = {};
        if (phone !== undefined) updateData.phone = phone.trim() || null;
        if (email !== undefined) updateData.email = email.trim() || null;
        if (iban !== undefined) updateData.iban = iban.trim() || null;
        if (address !== undefined) updateData.address = address.trim() || null;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "Güncellenecek alan bulunamadı." }, { status: 400 });
        }

        const user = await db.user.findUnique({
            where: { id: payload.userId },
            include: { role: true, referee: true, official: true },
        }) as any;

        if (!user) {
            return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
        }

        const isReferee = !!user.referee;
        const isOfficial = !!user.official;

        if (!isReferee && !isOfficial) {
            return NextResponse.json({ error: "Profil bulunamadı." }, { status: 404 });
        }

        if (isReferee) {
            await db.referee.update({
                where: { userId: payload.userId },
                data: updateData,
            });
        } else {
            await db.generalOfficial.update({
                where: { userId: payload.userId },
                data: updateData,
            });
        }

        // Güncel profili döndür
        const updatedUser = await db.user.findUnique({
            where: { id: payload.userId },
            include: { role: true, referee: true, official: true },
        }) as any;

        const profile = updatedUser?.referee || updatedUser?.official;

        return NextResponse.json({
            success: true,
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                role: updatedUser.role.name,
                firstName: profile?.firstName ?? null,
                lastName: profile?.lastName ?? null,
                email: profile?.email ?? null,
                phone: profile?.phone ?? null,
                classification: profile?.classification ?? null,
                iban: profile?.iban ?? null,
                address: profile?.address ?? null,
                isApproved: updatedUser.isApproved,
                isActive: updatedUser.isActive,
            },
        });

    } catch (error) {
        console.error("[API/V1/AUTH/PROFILE] Error:", error);
        return NextResponse.json(
            { error: "Profil güncellenirken bir hata oluştu." },
            { status: 500 }
        );
    }
}
