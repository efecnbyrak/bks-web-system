import { db } from './db';

const WINDOW_MS = 5 * 60 * 1000; // 5 dakika
const MAX_MANUAL = 2;             // pencere başına maks manuel yenileme

interface QuotaData {
    count: number;
    windowStart: string; // ISO string
}

export type QuotaResult =
    | { allowed: true; retryAfterMs?: never }
    | { allowed: false; retryAfterMs: number };

/**
 * Kullanıcının manuel yenileme quota'sını kontrol eder ve artırır.
 * - count < 2 ise izin verir ve count'u artırır
 * - count >= 2 ise:
 *   - 5 dk pencere dolmuşsa sıfırlayıp izin verir
 *   - dolmamışsa 429 + kalan süreyi döndürür
 * - Otomatik yenileme (manualRefresh=false) bu fonksiyonu hiç çağırmaz
 */
export async function checkAndIncrementRefreshQuota(userId: number): Promise<QuotaResult> {
    const user = await db.user.findUnique({
        where: { id: userId },
        select: { matchRefreshQuota: true },
    });

    const now = Date.now();
    const raw = user?.matchRefreshQuota as unknown as QuotaData | null;

    let count = raw?.count ?? 0;
    let windowStart = raw?.windowStart ? new Date(raw.windowStart).getTime() : now;
    const windowAge = now - windowStart;

    // Pencere 5 dk geçtiyse sıfırla
    if (windowAge >= WINDOW_MS) {
        count = 0;
        windowStart = now;
    }

    if (count >= MAX_MANUAL) {
        const retryAfterMs = Math.max(0, WINDOW_MS - (now - windowStart));
        return { allowed: false, retryAfterMs };
    }

    // İzin ver ve yeni sayacı kaydet
    await db.user.update({
        where: { id: userId },
        data: {
            matchRefreshQuota: {
                count: count + 1,
                windowStart: new Date(windowStart).toISOString(),
            },
        },
    });

    return { allowed: true };
}

/**
 * Mevcut quota durumunu okur (count artırmadan).
 * Popup'ta süreyi göstermek için kullanılabilir.
 */
export async function getRefreshQuotaStatus(userId: number): Promise<{
    remaining: number;
    retryAfterMs: number;
}> {
    const user = await db.user.findUnique({
        where: { id: userId },
        select: { matchRefreshQuota: true },
    });

    const now = Date.now();
    const raw = user?.matchRefreshQuota as unknown as QuotaData | null;

    let count = raw?.count ?? 0;
    let windowStart = raw?.windowStart ? new Date(raw.windowStart).getTime() : now;

    if (now - windowStart >= WINDOW_MS) {
        count = 0;
    }

    const remaining = Math.max(0, MAX_MANUAL - count);
    const retryAfterMs = remaining > 0 ? 0 : Math.max(0, WINDOW_MS - (now - windowStart));

    return { remaining, retryAfterMs };
}
