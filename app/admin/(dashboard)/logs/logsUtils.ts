export type Severity = "INFO" | "WARNING" | "CRITICAL";
export type Category = "auth" | "user_mgmt" | "penalty" | "announcement" | "system";

interface ActionMeta {
    category: Category;
    severity: Severity;
    label_tr: string;
}

export const ACTION_META: Record<string, ActionMeta> = {
    LOGIN_SUCCESS:                    { category: "auth",         severity: "INFO",     label_tr: "Giriş Başarılı" },
    LOGIN_FORCED_RESET_REDIRECT:      { category: "auth",         severity: "WARNING",  label_tr: "Zorunlu Şifre Yönlendirme" },
    PROMOTE_TO_ADMIN:                 { category: "user_mgmt",    severity: "WARNING",  label_tr: "Admin Yetki Verildi" },
    DEMOTE_FROM_ADMIN:                { category: "user_mgmt",    severity: "WARNING",  label_tr: "Admin Yetki Alındı" },
    PASSWORD_RESET_REQUESTED:         { category: "auth",         severity: "INFO",     label_tr: "Şifre Sıfırlama Talebi" },
    PASSWORD_RESET_SUCCESS:           { category: "auth",         severity: "INFO",     label_tr: "Şifre Sıfırlandı" },
    PASSWORD_RESET_SQ_SUCCESS:        { category: "auth",         severity: "INFO",     label_tr: "Güvenlik Sorusuyla Sıfırlama" },
    PASSWORD_RESET_RC_SUCCESS:        { category: "auth",         severity: "INFO",     label_tr: "Kurtarma Koduyla Sıfırlama" },
    FORCED_PASSWORD_RESET_COMPLETED:  { category: "auth",         severity: "WARNING",  label_tr: "Zorunlu Şifre Sıfırlama" },
    EMAIL_VERIFIED_REGISTER:          { category: "auth",         severity: "INFO",     label_tr: "E-posta Doğrulandı (Kayıt)" },
    EMAIL_VERIFIED_CHANGE:            { category: "auth",         severity: "INFO",     label_tr: "E-posta Değiştirildi" },
    USER_APPROVED:                    { category: "user_mgmt",    severity: "INFO",     label_tr: "Kullanıcı Onaylandı" },
    USER_REJECTED:                    { category: "user_mgmt",    severity: "WARNING",  label_tr: "Kullanıcı Reddedildi" },
    USER_SUSPENDED:                   { category: "user_mgmt",    severity: "CRITICAL", label_tr: "Kullanıcı Askıya Alındı" },
    USER_UNSUSPENDED:                 { category: "user_mgmt",    severity: "INFO",     label_tr: "Askı Kaldırıldı" },
    USER_DELETED:                     { category: "user_mgmt",    severity: "CRITICAL", label_tr: "Kullanıcı Silindi" },
    PENALTY_ADD:                      { category: "penalty",      severity: "CRITICAL", label_tr: "Ceza Eklendi" },
    PENALTY_REMOVE:                   { category: "penalty",      severity: "WARNING",  label_tr: "Ceza Kaldırıldı" },
    ANNOUNCEMENT_SENT:                { category: "announcement", severity: "INFO",     label_tr: "Duyuru Gönderildi" },
    ANNOUNCEMENT_DELETED:             { category: "announcement", severity: "WARNING",  label_tr: "Duyuru Silindi" },
    LOGS_CLEARED:                     { category: "system",       severity: "CRITICAL", label_tr: "Loglar Temizlendi" },
    AVAILABILITY_FORM_SUBMIT:         { category: "system",       severity: "INFO",     label_tr: "Uygunluk Formu Gönderildi" },
    PHONE_NORMALIZE:                  { category: "system",       severity: "INFO",     label_tr: "Telefon Numaraları Düzenlendi" },
    EXCEL_EXPORT:                     { category: "announcement", severity: "INFO",     label_tr: "Excel Listesi İndirildi" },
    LOGS_AUTO_PURGED:                 { category: "system",       severity: "WARNING",  label_tr: "Eski Loglar Otomatik Temizlendi" },
};

export const CATEGORY_LABELS: Record<Category, string> = {
    auth:         "Kimlik Doğrulama",
    user_mgmt:    "Kullanıcı Yönetimi",
    penalty:      "Ceza İşlemleri",
    announcement: "Duyurular",
    system:       "Sistem",
};

const FALLBACK_META: ActionMeta = { category: "system", severity: "INFO", label_tr: "" };

export function getActionMeta(action: string): ActionMeta {
    return ACTION_META[action] ?? FALLBACK_META;
}

export function getSeverityStyles(severity: Severity): {
    banner: string;
    pill: string;
    label: string;
} {
    switch (severity) {
        case "CRITICAL":
            return {
                banner: "border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400",
                pill:   "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
                label:  "CRITICAL",
            };
        case "WARNING":
            return {
                banner: "border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400",
                pill:   "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
                label:  "WARNING",
            };
        default:
            return {
                banner: "border-l-4 border-sky-400 bg-sky-50 dark:bg-sky-900/10 text-sky-700 dark:text-sky-400",
                pill:   "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400",
                label:  "INFO",
            };
    }
}

export function getActionColor(action: string): string {
    if (action.includes("LOGIN")) return "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20";
    if (action.includes("PASSWORD") || action.includes("RESET")) return "text-amber-600 bg-amber-50 dark:bg-amber-900/20";
    if (action.includes("DELETE") || action.includes("REJECT") || action.includes("SUSPEND") || action.includes("PENALTY")) return "text-rose-600 bg-rose-50 dark:bg-rose-900/20";
    if (action.includes("APPROVE") || action.includes("SUBMIT") || action.includes("SUCCESS")) return "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20";
    if (action.includes("PROMOTE") || action.includes("DEMOTE")) return "text-violet-600 bg-violet-50 dark:bg-violet-900/20";
    if (action.includes("CLEAR") || action.includes("TRUNCATE")) return "text-orange-600 bg-orange-50 dark:bg-orange-900/20";
    if (action.includes("PHONE") || action.includes("NORMALIZE")) return "text-blue-600 bg-blue-50 dark:bg-blue-900/20";
    return "text-zinc-600 bg-zinc-50 dark:bg-zinc-900/20";
}

const DATE_KEY_PATTERN = /createdAt|updatedAt|date|Date|_at$/;

export interface ParsedDetails {
    parsed: Record<string, unknown> | null;
    raw: string;
    jsonFormatted: string | null;
}

export function parseDetailsEnhanced(details: string | null): ParsedDetails {
    if (!details) return { parsed: null, raw: "", jsonFormatted: null };
    try {
        const obj = JSON.parse(details);
        if (typeof obj === "object" && obj !== null) {
            const enriched: Record<string, unknown> = {};
            for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
                if (DATE_KEY_PATTERN.test(key) && typeof val === "string") {
                    const d = new Date(val);
                    if (!isNaN(d.getTime())) {
                        enriched[key] = val;
                        enriched[`${key}_parsed`] = d.toLocaleString("tr-TR", {
                            day: "2-digit", month: "long", year: "numeric",
                            hour: "2-digit", minute: "2-digit", second: "2-digit",
                        });
                        continue;
                    }
                }
                enriched[key] = val;
            }
            return {
                parsed: enriched,
                raw: details,
                jsonFormatted: JSON.stringify(enriched, null, 2),
            };
        }
    } catch {
        // not JSON
    }
    return { parsed: null, raw: details, jsonFormatted: null };
}

export function formatISO(dateStr: string): string {
    return new Date(dateStr).toISOString();
}

interface LogStats {
    total: number;
    auth: number;
    user_mgmt: number;
    penalty: number;
    announcement: number;
    system: number;
    critical: number;
    warning: number;
    info: number;
}

export function getLogStats(logs: { action: string }[]): LogStats {
    const stats: LogStats = { total: logs.length, auth: 0, user_mgmt: 0, penalty: 0, announcement: 0, system: 0, critical: 0, warning: 0, info: 0 };
    for (const log of logs) {
        const meta = getActionMeta(log.action);
        stats[meta.category]++;
        if (meta.severity === "CRITICAL") stats.critical++;
        else if (meta.severity === "WARNING") stats.warning++;
        else stats.info++;
    }
    return stats;
}
