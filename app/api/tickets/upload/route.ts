import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/heic"];

export async function POST(req: NextRequest) {
    try {
        const session = await verifySession();
        if (!session.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { data, type, name } = body;

        if (!data || !type || !name) {
            return NextResponse.json({ error: "Eksik parametreler." }, { status: 400 });
        }

        if (!ALLOWED_TYPES.includes(type)) {
            return NextResponse.json({ error: "Sadece görsel dosyaları yükleyebilirsiniz." }, { status: 400 });
        }

        // base64 boyutu kontrol et (base64 ~%33 büyür)
        const base64Data = data.replace(/^data:[^;]+;base64,/, "");
        const fileSizeBytes = Math.ceil((base64Data.length * 3) / 4);
        if (fileSizeBytes > MAX_FILE_SIZE) {
            return NextResponse.json({ error: "Dosya boyutu 10MB'ı geçemez." }, { status: 400 });
        }

        // data URI olarak döndür
        const url = `data:${type};base64,${base64Data}`;
        return NextResponse.json({ url });
    } catch {
        return NextResponse.json({ error: "Görsel yüklenirken bir hata oluştu." }, { status: 500 });
    }
}
