import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Rate limiting: IP başına max 3 istek/saat
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export async function POST(req: NextRequest) {
    try {
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
        const now = Date.now();
        const hourMs = 60 * 60 * 1000;

        const existing = rateLimitMap.get(ip);
        if (existing) {
            if (now < existing.resetAt) {
                if (existing.count >= 3) {
                    return NextResponse.json(
                        { error: "Çok fazla istek gönderdiniz. Lütfen bir süre bekleyip tekrar deneyin." },
                        { status: 429 }
                    );
                }
                existing.count++;
            } else {
                rateLimitMap.set(ip, { count: 1, resetAt: now + hourMs });
            }
        } else {
            rateLimitMap.set(ip, { count: 1, resetAt: now + hourMs });
        }

        const body = await req.json();
        const { email } = body;

        if (!email || typeof email !== "string" || !email.includes("@")) {
            return NextResponse.json({ error: "Geçerli bir e-posta adresi giriniz." }, { status: 400 });
        }

        const sanitizedEmail = email.trim().toLowerCase().slice(0, 254);

        await db.supportTicket.create({
            data: {
                userId: null,
                guestEmail: sanitizedEmail,
                type: "DESTEK",
                errorType: "SIFRE_YENILEME",
                subject: "Şifre Yenileme Talebi",
                description: `E-posta adresi: ${sanitizedEmail}\nTalep tarihi: ${new Date().toLocaleString("tr-TR")}`,
                status: "OPEN",
            },
        });

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        console.error("POST /api/tickets/guest error:", error);
        return NextResponse.json({ error: "Bir hata oluştu. Lütfen tekrar deneyin." }, { status: 500 });
    }
}
