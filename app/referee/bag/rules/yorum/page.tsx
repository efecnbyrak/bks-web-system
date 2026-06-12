import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";
import { FileText, MessageSquare, Sparkles } from "lucide-react";
import Link from "next/link";
import { NativeRulesViewer } from "@/components/rules/NativeRulesViewer";

export const dynamic = 'force-dynamic';

export default async function YorumPage({
    searchParams
}: {
    searchParams: { id?: string }
}) {
    const session = await verifySession();

    const [rules, readProgress] = await Promise.all([
        db.ruleBook.findMany({
            where: { category: "Yorumlar" },
            orderBy: { createdAt: 'desc' }
        }),
        db.ruleProgress.findMany({
            where: { userId: session.userId, type: "yorum" },
            select: { articleId: true },
        }),
    ]);

    const readArticleIds = readProgress.map((r: { articleId: string }) => r.articleId);
    const selectedRuleId = searchParams.id ? parseInt(searchParams.id) : rules[0]?.id;
    const selectedRule = rules.find(r => r.id === selectedRuleId) || rules[0];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* ── Native Yorumlar Viewer — dark glass header ── */}
            <div className="rounded-3xl overflow-hidden shadow-xl border border-blue-900/50">
                {/* Dark glass header */}
                <div className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4 sm:px-6 pt-5 sm:pt-6 pb-4 sm:pb-5 overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-500/8 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/40 flex-shrink-0">
                            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">Resmi Yorumlar</h2>
                                <span className="hidden sm:flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-cyan-300 bg-cyan-500/20 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                                    <Sparkles className="w-2.5 h-2.5" /> RESMİ
                                </span>
                            </div>
                            <p className="text-xs text-blue-300/70 font-medium">Basketbol Oyun Kuralları Resmi Yorumlar · Arama yapın veya listede gezinin</p>
                        </div>
                    </div>
                </div>
                {/* Content area */}
                <div className="bg-white dark:bg-zinc-950 p-4 sm:p-6">
                    <NativeRulesViewer type="yorum" readArticleIds={readArticleIds} />
                </div>
            </div>

            {/* ── DB-uploaded yorumlar (if any) ── */}
            {rules.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest">Yüklenen Diğer Dökümanlar</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rules.map((rule) => {
                            const isSelected = selectedRule?.id === rule.id;
                            return (
                                <Link
                                    key={rule.id}
                                    href={`/referee/bag/rules/yorum?id=${rule.id}`}
                                    scroll={false}
                                    className={`group p-4 rounded-2xl border-2 text-left transition-all ${
                                        isSelected
                                            ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/10"
                                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900"
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <FileText className={`w-5 h-5 mt-0.5 shrink-0 ${isSelected ? "text-blue-600" : "text-zinc-400"}`} />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-1 line-clamp-2">
                                                {rule.title}
                                            </h3>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
