import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyMobileToken } from "@/lib/mobile-auth";

export async function POST(req: NextRequest) {
    const auth = await verifyMobileToken(req);
    if (!auth) {
        return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    let body: any;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    }

    const { token, platform } = body;

    if (!token || typeof token !== "string") {
        return NextResponse.json({ error: "Geçersiz token." }, { status: 400 });
    }

    const validPlatform = platform === "ios" ? "ios" : "android";

    try {
        await db.pushToken.upsert({
            where: { token },
            create: { userId: auth.userId, token, platform: validPlatform },
            update: { userId: auth.userId, platform: validPlatform },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[v1/notifications/register-token] POST error:", error);
        return NextResponse.json({ error: "Token kaydedilemedi." }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const auth = await verifyMobileToken(req);
    if (!auth) {
        return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    let body: any;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    }

    const { token } = body;

    if (!token || typeof token !== "string") {
        return NextResponse.json({ error: "Geçersiz token." }, { status: 400 });
    }

    try {
        await db.pushToken.deleteMany({
            where: { token, userId: auth.userId },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[v1/notifications/register-token] DELETE error:", error);
        return NextResponse.json({ error: "Token silinemedi." }, { status: 500 });
    }
}
