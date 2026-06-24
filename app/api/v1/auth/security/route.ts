import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyMobileToken } from "@/lib/mobile-auth";
import crypto from "crypto";

/**
 * GET /api/v1/auth/security
 * Mevcut güvenlik sorusu seçeneklerini döndürür.
 *
 * POST /api/v1/auth/security
 * Kullanıcının güvenlik sorusunu ve cevabını kaydeder.
 * Kurtarma kodu yoksa otomatik oluşturur (format: XXXX-XXXX).
 * Body: { question: string, answer: string }
 */

const SECURITY_QUESTIONS = [
    "En sevdiğiniz meyve nedir?",
    "En sevdiğiniz yemek nedir?",
    "En sevdiğiniz film nedir?",
    "En sevdiğiniz kitap nedir?",
    "En sevdiğiniz spor takımı nedir?",
];

// 4 büyük harf/rakamdan oluşan bir parça üretir (hex üzerinden, sadece 0-9 A-F)
function randomPart(): string {
    return crypto.randomBytes(3).toString("hex").toUpperCase().slice(0, 4);
}

// XXXX-XXXX formatında benzersiz kurtarma kodu üretir
async function generateUniqueRecoveryCode(): Promise<string> {
    for (let attempt = 0; attempt < 20; attempt++) {
        const code = `${randomPart()}-${randomPart()}`;
        const exists = await db.user.findUnique({ where: { recoveryCode: code } });
        if (!exists) return code;
    }
    // 20 denemede çakışma olursa ek entropi ekle
    return `${randomPart()}${randomPart()}-${randomPart()}`.slice(0, 9);
}

export async function GET() {
    return NextResponse.json({ questions: SECURITY_QUESTIONS });
}

export async function POST(request: NextRequest) {
    console.log('[SECURITY POST] istek geldi, Authorization:', request.headers.get('authorization')?.slice(0, 30));
    const auth = await verifyMobileToken(request);
    console.log('[SECURITY POST] auth sonucu:', auth);
    if (!auth) {
        return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    try {
        const body = await request.json();
        console.log('[SECURITY POST] userId:', auth.userId, 'question:', body?.question?.slice(0, 30));
        const question: string = (body.question ?? "").trim();
        const answer: string = (body.answer ?? "").trim();

        if (!question || !answer) {
            return NextResponse.json({ error: "Soru ve cevap boş bırakılamaz." }, { status: 400 });
        }

        if (!SECURITY_QUESTIONS.includes(question)) {
            return NextResponse.json({ error: "Geçersiz güvenlik sorusu." }, { status: 400 });
        }

        if (answer.length < 2) {
            return NextResponse.json({ error: "Cevap en az 2 karakter olmalıdır." }, { status: 400 });
        }

        const user = await db.user.findUnique({
            where: { id: auth.userId },
            select: { recoveryCode: true, isActive: true, isApproved: true },
        });

        if (!user) {
            console.error("[API/V1/AUTH/SECURITY] User not found for userId:", auth.userId);
            return NextResponse.json({ error: "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin." }, { status: 500 });
        }

        if (!user.isActive || !user.isApproved) {
            return NextResponse.json({ error: "Hesabınıza erişim kısıtlandı." }, { status: 403 });
        }

        // Kurtarma kodu yoksa ilk kez oluştur — format: XXXX-XXXX (örn. LJ87-P5XF)
        const recoveryCode = user.recoveryCode ?? await generateUniqueRecoveryCode();

        await db.user.update({
            where: { id: auth.userId },
            data: {
                securityQuestion: question,
                securityAnswer: answer.toLowerCase(), // Büyük/küçük harf duyarsız karşılaştırma için
                recoveryCode,
            },
        });

        return NextResponse.json({
            success: true,
            recoveryCode,
            securityQuestion: question,
            message: "Güvenlik sorunuz ve kurtarma kodunuz başarıyla kaydedildi.",
        });

    } catch (error) {
        console.error("[API/V1/AUTH/SECURITY] Error:", error);
        return NextResponse.json(
            { error: "Güvenlik bilgileri kaydedilirken bir hata oluştu." },
            { status: 500 }
        );
    }
}
