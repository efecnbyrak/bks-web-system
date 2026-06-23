import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
    const identifier = request.nextUrl.searchParams.get("identifier")?.trim();

    if (!identifier) {
        return NextResponse.json({ error: "Lütfen kullanıcı adı veya e-posta giriniz." }, { status: 400 });
    }

    try {
        const user = await db.user.findFirst({
            where: {
                OR: [
                    { username: { equals: identifier, mode: "insensitive" } },
                    { referee: { email: { equals: identifier, mode: "insensitive" } } },
                    { official: { email: { equals: identifier, mode: "insensitive" } } },
                ],
            },
            select: { securityQuestion: true },
        });

        if (!user) {
            return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
        }

        if (!user.securityQuestion) {
            return NextResponse.json(
                { error: "Hesabınıza tanımlı bir güvenlik sorusu bulunamadı. Lütfen kurtarma kodu yöntemini deneyin." },
                { status: 404 }
            );
        }

        return NextResponse.json({ question: user.securityQuestion });
    } catch {
        return NextResponse.json({ error: "Sistemde bir hata oluştu." }, { status: 500 });
    }
}
