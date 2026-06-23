import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
    let body: any;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    }

    const { identifier, recoveryCode, password, passwordConfirm } = body;

    if (!identifier || !recoveryCode || !password) {
        return NextResponse.json({ error: "Lütfen tüm alanları doldurun." }, { status: 400 });
    }
    if (password.length < 6) {
        return NextResponse.json({ error: "Şifre en az 6 karakter olmalıdır." }, { status: 400 });
    }
    if (password !== passwordConfirm) {
        return NextResponse.json({ error: "Şifreler eşleşmiyor." }, { status: 400 });
    }

    try {
        const user = await db.user.findFirst({
            where: {
                OR: [
                    { username: { equals: identifier.trim(), mode: "insensitive" } },
                    { referee: { email: { equals: identifier.trim(), mode: "insensitive" } } },
                    { official: { email: { equals: identifier.trim(), mode: "insensitive" } } },
                ],
            },
        });

        if (!user) {
            return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
        }

        if (!user.recoveryCode || user.recoveryCode !== recoveryCode.trim()) {
            return NextResponse.json({ error: "Kurtarma kodu hatalı. Lütfen kontrol ediniz." }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordCode: null,
                resetPasswordExpiresAt: null,
                verificationCode: null,
                verificationCodeExpiresAt: null,
            },
        });

        return NextResponse.json({ success: true, message: "Şifreniz başarıyla güncellendi." });
    } catch {
        return NextResponse.json({ error: "Sistemde bir hata oluştu." }, { status: 500 });
    }
}
