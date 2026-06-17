import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/lib/db";

async function verifyToken(req: NextRequest): Promise<{ userId: number; role: string } | null> {
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) return null;
    try {
        const hash = createHash("sha256").update(token).digest("hex");
        const user = await db.user.findFirst({
            where: { mobileToken: hash, mobileTokenExpiry: { gt: new Date() } },
            include: { role: true },
        });
        if (!user) return null;
        return { userId: user.id, role: user.role.name };
    } catch {
        return null;
    }
}

export async function GET(req: NextRequest) {
    const auth = await verifyToken(req);
    if (!auth) {
        return NextResponse.json({ announcements: [] }, { status: 401 });
    }

    try {
        const targetGroups = ["ALL"];
        const roleTargets = ["REFEREE", "OBSERVER", "TABLE", "STATISTICIAN", "HEALTH", "FIELD_COMMISSIONER"];
        if (roleTargets.includes(auth.role)) targetGroups.push(auth.role);
        // SPECIFIC:<userId> hedefli duyurular
        targetGroups.push(`SPECIFIC:${auth.userId}`);

        const announcements = await db.announcement.findMany({
            where: {
                target: { in: targetGroups },
                reads: {
                    none: { userId: auth.userId },
                },
            },
            orderBy: { createdAt: "asc" },
        });

        return NextResponse.json({ announcements });
    } catch (e) {
        console.error("[mobile/v2/announcements] GET error:", e);
        return NextResponse.json({ announcements: [] }, { status: 500 });
    }
}
