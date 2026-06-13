"use client";

import { useState, useRef } from "react";
import { Send, Upload, X, CheckCircle, Clock, AlertCircle, ChevronDown, Image as ImageIcon, FileText } from "lucide-react";

const ERROR_TYPES = [
    { value: "TEKNIK_HATA", label: "Teknik Hata" },
    { value: "SINAV_SORUNU", label: "Sınav Sorunu" },
    { value: "KURAL_KITABI", label: "Kural Kitabı" },
    { value: "ODEME", label: "Ödeme" },
    { value: "ATAMA", label: "Atama" },
    { value: "HESAP", label: "Hesap / Profil" },
    { value: "DIGER", label: "Diğer" },
];

const STATUS_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
    OPEN: { label: "Beklemede", icon: <Clock className="w-3.5 h-3.5" />, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
    IN_PROGRESS: { label: "İnceleniyor", icon: <AlertCircle className="w-3.5 h-3.5" />, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
    CLOSED: { label: "Kapatıldı", icon: <CheckCircle className="w-3.5 h-3.5" />, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
};

interface Ticket {
    id: number;
    errorType: string;
    subject: string;
    description: string;
    imageUrl: string | null;
    status: string;
    adminNote: string | null;
    createdAt: string;
}

interface TicketFormProps {
    basePath: string;
}

export function TicketForm({ basePath }: TicketFormProps) {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loadingTickets, setLoadingTickets] = useState(true);
    const [view, setView] = useState<"list" | "new">("list");

    const [errorType, setErrorType] = useState("");
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedTicket, setExpandedTicket] = useState<number | null>(null);

    const fileRef = useRef<HTMLInputElement>(null);

    const fetchTickets = async () => {
        setLoadingTickets(true);
        try {
            const res = await fetch("/api/tickets");
            const data = await res.json();
            setTickets(data.tickets ?? []);
        } catch {
            // ignore
        } finally {
            setLoadingTickets(false);
        }
    };

    // Initial fetch
    useState(() => { fetchTickets(); });

    const handleImageUpload = async (file: File) => {
        if (!file.type.startsWith("image/")) {
            setError("Yalnızca görsel dosyaları yükleyebilirsiniz.");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setError("Dosya boyutu 10MB'ı geçemez.");
            return;
        }

        setUploading(true);
        setError(null);
        try {
            const CHUNK_SIZE = 512 * 1024;
            const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

            const initRes = await fetch("/api/upload/init", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filename: file.name, type: file.type, total: totalChunks }),
            });
            const { uploadId } = await initRes.json();

            for (let i = 0; i < totalChunks; i++) {
                const chunk = file.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
                const b64 = await new Promise<string>((res) => {
                    const reader = new FileReader();
                    reader.onload = (e) => res((e.target?.result as string).split(",")[1]);
                    reader.readAsDataURL(chunk);
                });
                await fetch("/api/upload/chunk", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ uploadId, index: i, data: b64 }),
                });
            }

            const completeRes = await fetch("/api/upload/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ uploadId }),
            });
            const { url } = await completeRes.json();
            setImageUrl(url);
        } catch {
            setError("Görsel yüklenirken bir hata oluştu.");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!errorType || !subject.trim() || !description.trim()) {
            setError("Lütfen tüm zorunlu alanları doldurun.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ errorType, subject: subject.trim(), description: description.trim(), imageUrl }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error ?? "Bir hata oluştu.");
                return;
            }

            setSuccess(true);
            setErrorType("");
            setSubject("");
            setDescription("");
            setImageUrl(null);
            await fetchTickets();
            setTimeout(() => {
                setSuccess(false);
                setView("list");
            }, 2000);
        } catch {
            setError("Ticket gönderilemedi. Lütfen tekrar deneyin.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-4">
            {/* Header */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="relative px-6 py-5 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-blue-950/10 pointer-events-none" />
                    <div className="relative flex items-center justify-between">
                        <div>
                            <h1 className="text-lg font-black text-zinc-900 dark:text-white">Destek & İletişim</h1>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Yaşadığın sorunları bizimle paylaş, en kısa sürede yanıtlayalım.</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setView("list")}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${view === "list" ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}
                            >
                                Taleplerim ({tickets.length})
                            </button>
                            <button
                                onClick={() => setView("new")}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${view === "new" ? "bg-blue-600 text-white" : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40"}`}
                            >
                                + Yeni Talep
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Yeni Ticket Formu */}
            {view === "new" && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                        <h2 className="text-sm font-black text-zinc-900 dark:text-white">Yeni Destek Talebi</h2>
                        <p className="text-[11px] text-zinc-400 mt-0.5">Sorununuzu detaylı açıklarsanız daha hızlı çözüm sunabiliriz.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {/* Hata Konusu */}
                        <div>
                            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                Hata Konusu <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    value={errorType}
                                    onChange={(e) => setErrorType(e.target.value)}
                                    className="w-full appearance-none px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                                    required
                                >
                                    <option value="">Konu seçin...</option>
                                    {ERROR_TYPES.map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Konu Başlığı */}
                        <div>
                            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                Konu Başlığı <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                maxLength={200}
                                placeholder="Sorununuzu kısaca özetleyin..."
                                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                                required
                            />
                            <p className="text-[10px] text-zinc-400 mt-1 text-right">{subject.length}/200</p>
                        </div>

                        {/* Açıklama */}
                        <div>
                            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                Açıklama <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Sorununuzu detaylı açıklayın. Ne zaman oldu, ne yaptınız, ne bekliyordunuz?"
                                rows={5}
                                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all resize-none"
                                required
                            />
                        </div>

                        {/* Görsel Yükleme */}
                        <div>
                            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                                Ekran Görüntüsü (İsteğe Bağlı)
                            </label>

                            {imageUrl ? (
                                <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-200 dark:border-emerald-700/40 bg-emerald-50 dark:bg-emerald-900/10">
                                    <ImageIcon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                    <span className="text-xs text-emerald-700 dark:text-emerald-400 flex-1 truncate">Görsel yüklendi</span>
                                    <button
                                        type="button"
                                        onClick={() => setImageUrl(null)}
                                        className="p-1 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => fileRef.current?.click()}
                                    disabled={uploading}
                                    className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-500 text-zinc-400 hover:text-blue-500 transition-all bg-zinc-50 dark:bg-zinc-800/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/10"
                                >
                                    {uploading ? (
                                        <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Upload className="w-5 h-5" />
                                    )}
                                    <span className="text-xs font-medium">
                                        {uploading ? "Yükleniyor..." : "Görsel eklemek için tıklayın"}
                                    </span>
                                    <span className="text-[10px]">PNG, JPG, WEBP — Max 10MB</span>
                                </button>
                            )}
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
                            />
                        </div>

                        {/* Hata mesajı */}
                        {error && (
                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/40">
                                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        {/* Başarı mesajı */}
                        {success && (
                            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/40">
                                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Talebiniz başarıyla iletildi!</p>
                            </div>
                        )}

                        <div className="flex gap-3 pt-1">
                            <button
                                type="button"
                                onClick={() => setView("list")}
                                className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || uploading}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-all disabled:opacity-60 shadow-sm"
                            >
                                {submitting ? (
                                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                                {submitting ? "Gönderiliyor..." : "Gönder"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Ticket Listesi */}
            {view === "list" && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
                        <h2 className="text-sm font-black text-zinc-900 dark:text-white">Taleplerim</h2>
                    </div>

                    {loadingTickets ? (
                        <div className="p-8 flex justify-center">
                            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="flex flex-col items-center py-12 px-5 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center mb-3">
                                <FileText className="w-7 h-7 text-blue-400" />
                            </div>
                            <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400 mb-1">Henüz destek talebi yok</p>
                            <p className="text-[11px] text-zinc-400 mb-4">Bir sorun yaşadığında yeni talep oluşturabilirsin.</p>
                            <button
                                onClick={() => setView("new")}
                                className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold hover:opacity-90 transition-opacity shadow-sm"
                            >
                                İlk Talebi Oluştur
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {tickets.map((ticket) => {
                                const statusInfo = STATUS_LABELS[ticket.status] ?? STATUS_LABELS.OPEN;
                                const isExpanded = expandedTicket === ticket.id;
                                const errorLabel = ERROR_TYPES.find((t) => t.value === ticket.errorType)?.label ?? ticket.errorType;

                                return (
                                    <div key={ticket.id} className="overflow-hidden">
                                        <button
                                            className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                                            onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                                        >
                                            <div className={`mt-0.5 flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${statusInfo.color} ${statusInfo.bg}`}>
                                                {statusInfo.icon}
                                                {statusInfo.label}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-xs font-black text-zinc-800 dark:text-zinc-100 truncate">{ticket.subject}</span>
                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">{errorLabel}</span>
                                                </div>
                                                <p className="text-[10px] text-zinc-400 mt-0.5">
                                                    {new Date(ticket.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                                                </p>
                                            </div>
                                            <ChevronDown className={`w-4 h-4 text-zinc-400 flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                                        </button>

                                        {isExpanded && (
                                            <div className="px-5 pb-4 space-y-3 bg-zinc-50/50 dark:bg-zinc-800/20">
                                                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-4">
                                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1.5">Açıklama</p>
                                                    <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
                                                </div>

                                                {ticket.imageUrl && (
                                                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 p-4">
                                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-2">Ekran Görüntüsü</p>
                                                        <img
                                                            src={`/api/upload/blob?key=${ticket.imageUrl}`}
                                                            alt="Ticket görseli"
                                                            className="max-w-full rounded-lg border border-zinc-100 dark:border-zinc-800"
                                                        />
                                                    </div>
                                                )}

                                                {ticket.adminNote && (
                                                    <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-700/30 p-4">
                                                        <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1.5">Admin Yanıtı</p>
                                                        <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">{ticket.adminNote}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
