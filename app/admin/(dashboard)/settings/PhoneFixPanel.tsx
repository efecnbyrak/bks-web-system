"use client";

import { useState } from "react";
import { Phone, CheckCircle, AlertCircle, Loader2, Search } from "lucide-react";

interface PhonePreview {
    name: string;
    current: string;
    normalized: string;
}

interface PreviewData {
    referees: { total: number; needsFix: number; examples: PhonePreview[] };
    officials: { total: number; needsFix: number; examples: PhonePreview[] };
    totalNeedsFix: number;
}

export function PhoneFixPanel() {
    const [preview, setPreview] = useState<PreviewData | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handlePreview = async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const res = await fetch("/api/admin/fix-phones");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Bir hata oluştu.");
            setPreview(data);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFix = async () => {
        if (!preview || preview.totalNeedsFix === 0) return;
        if (!confirm(`${preview.totalNeedsFix} kayıt güncellenecek. Devam etmek istiyor musunuz?`)) return;

        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/admin/fix-phones", { method: "POST" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Bir hata oluştu.");
            setResult(data.message);
            setPreview(null);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-5">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="text-base font-black text-zinc-900 dark:text-white uppercase italic tracking-tight">Telefon Numarası Normalizasyonu</h2>
                    <p className="text-xs text-zinc-500 font-medium">Tüm kayıtları 05XXXXXXXXX formatına çevirir</p>
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={handlePreview}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    Önizle
                </button>

                {preview && preview.totalNeedsFix > 0 && (
                    <button
                        onClick={handleFix}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Phone className="w-3.5 h-3.5" />}
                        {preview.totalNeedsFix} Kaydı Düzelt
                    </button>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-2 text-rose-600 text-sm bg-rose-50 dark:bg-rose-900/20 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                </div>
            )}

            {result && (
                <div className="flex items-center gap-2 text-emerald-600 text-sm bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    {result}
                </div>
            )}

            {preview && (
                <div className="space-y-4">
                    <div className="flex gap-4 text-sm">
                        <div className="flex-1 bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4">
                            <p className="font-black text-zinc-500 uppercase text-[10px] tracking-widest mb-1">Hakemler</p>
                            <p className="text-2xl font-black text-zinc-900 dark:text-white">{preview.referees.needsFix}</p>
                            <p className="text-xs text-zinc-500">/ {preview.referees.total} toplam kayıt</p>
                        </div>
                        <div className="flex-1 bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4">
                            <p className="font-black text-zinc-500 uppercase text-[10px] tracking-widest mb-1">Görevliler</p>
                            <p className="text-2xl font-black text-zinc-900 dark:text-white">{preview.officials.needsFix}</p>
                            <p className="text-xs text-zinc-500">/ {preview.officials.total} toplam kayıt</p>
                        </div>
                    </div>

                    {(preview.referees.examples.length > 0 || preview.officials.examples.length > 0) && (
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Örnek Değişiklikler</p>
                            <div className="space-y-1.5">
                                {[...preview.referees.examples, ...preview.officials.examples].map((ex, i) => (
                                    <div key={i} className="flex items-center gap-3 text-xs bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2">
                                        <span className="text-zinc-600 dark:text-zinc-400 min-w-[120px] font-medium">{ex.name}</span>
                                        <span className="font-mono text-rose-500 line-through">{ex.current}</span>
                                        <span className="text-zinc-400">→</span>
                                        <span className="font-mono text-emerald-600 font-bold">{ex.normalized}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {preview.totalNeedsFix === 0 && (
                        <div className="flex items-center gap-2 text-emerald-600 text-sm">
                            <CheckCircle className="w-4 h-4" />
                            Tüm telefon numaraları zaten doğru formatta.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
