import { NextRequest } from "next/server";
import { jwtVerify } from "jose";

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

export interface MobileAuthPayload {
    userId: number;
    role: string;
}

export async function verifyMobileToken(req: NextRequest): Promise<MobileAuthPayload | null> {
    const auth = req.headers.get("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token) {
        console.warn("[mobile-auth] No Bearer token in request");
        return null;
    }
    try {
        const key = getMobileKey();
        const { payload } = await jwtVerify(token, key);
        const userId = payload.userId as number;
        const role = payload.role as string;
        if (!userId || !role) {
            console.warn("[mobile-auth] Token missing userId or role:", { userId, role });
            return null;
        }
        return { userId, role };
    } catch (err: any) {
        console.warn("[mobile-auth] jwtVerify failed:", err?.code, err?.message);
        return null;
    }
}
