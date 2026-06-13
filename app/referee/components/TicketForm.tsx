"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
    Wrench, Lightbulb, Plus, X, ChevronDown, ChevronUp,
    Upload, Send, Clock, CheckCircle,
    AlertCircle, Loader2, MessageSquare, Eye,
    FileImage, Maximize2
} from "lucide-react";

type TicketType = "DESTEK" | "ONERI";

const SUPPORT_ERROR_TYPES = [
    { value: "TEKNIK_HATA", label: "Teknik Hata" },
    { value: "SINAV_SORUNU", label: "Sınav Sorunu" },
    { value: "KURAL_KITABI", label: "Kural Kitabı" },
    { value: "ATAMA", label: "Atama Sorunu" },
    { value: "HESAP", label: "Hesap Sorunu" },
    { value: "SIFRE_YENILEME", label: "Şifre Yenileme" },
    { value: "DIGER", label: "Diğer" },
];

const SUGGESTION_TYPES = [
    { value: "GENEL", label: "Genel Öneri" },
    { value: "UYGULAMA", label: "Uygulama İyileştirmesi" },
    { value: "KURAL", label: "Kural / Mevzuat" },
    { value: "EGITIM", label: "Eğitim & İçerik" },
    { value: "DIGER", label: "Diğer" },
];

const STATUS_CONFIG = {
    OPEN: { label: "Beklemede", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Clock },
    IN_PROGRESS: { label: "İnceleniyor", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: AlertCircle },
    CLOSED: { label: "Kapatıldı", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle },
};

interface Ticket {
    id: number;
    type: string;
    errorType: string;
    subject: string;
    description: string;
    imageUrls: string | null;
    status: string;
    adminNote: string | null;
    createdAt: string;
}

interface UploadingFile {
    id: string;
    name: string;
    progress: number;
    url?: string;
    error?: string;
    preview?: string;
}

const MAX_IMAGES = 5;
const MAX_TOTAL_MB = 10;

export function TicketForm() {
    const [activeTab, setActiveTab] = useState<TicketType>("DESTEK");
    const [view, setView] = useState<"list" | "new">("list");
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loadingTickets, setLoadingTickets] = useState(true);
    const [expandedTicket, setExpandedTicket] = useState<number | null>(null);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    // Form state
    const [errorType, setErrorType] = useState("");
    const [subject, setSubject] = useState("");
    const [description, setDescription] = useState("");
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const filteredTickets = tickets.filter((t) => t.type === activeTab);

    const loadTickets = useCallback(async () => {
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
    }, []);

    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    const resetForm = () => {
        setErrorType("");
        setSubject("");
        setDescription("");
        setUploadingFiles([]);
        setFormError(null);
        setSuccess(null);
    };

    const uploadFile = async (file: File): Promise<string | null> => {
        if (!file.type.startsWith("image/")) return null;
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const dataUrl = e.target?.result as string;
                const base64 = dataUrl.split(",")[1];
                try {
                    const res = await fetch("/api/tickets/upload", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ data: base64, type: file.type, name: file.name }),
                    });
                    if (!res.ok) resolve(null);
                    else {
                        const { url } = await res.json();
                        resolve(url);
                    }
                } catch {
                    resolve(null);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const handleFiles = async (files: FileList | File[]) => {
        const fileArr = Array.from(files).filter((f) => f.type.startsWith("image/"));
        const currentCount = uploadingFiles.filter((f) => f.url && !f.error).length;

        if (currentCount + fileArr.length > MAX_IMAGES) {
            setFormError(`En fazla ${MAX_IMAGES} görsel yükleyebilirsiniz.`);
            return;
        }

        const existingBytes = uploadingFiles
            .filter((f) => f.url)
            .reduce((acc, f) => {
                const b64 = (f.url ?? "").split(",")[1] ?? "";
                return acc + Math.ceil((b64.length * 3) / 4);
            }, 0);
        const newBytes = fileArr.reduce((acc, f) => acc + f.size, 0);
        if (existingBytes + newBytes > MAX_TOTAL_MB * 1024 * 1024) {
            setFormError(`Toplam görsel boyutu ${MAX_TOTAL_MB}MB'ı geçemez.`);
            return;
        }

        setFormError(null);

        for (const file of fileArr) {
            const id = `${Date.now()}-${Math.random()}`;
            const preview = URL.createObjectURL(file);

            setUploadingFiles((prev) => [
                ...prev,
                { id, name: file.name, progress: 0, preview },
            ]);

            const progressInterval = setInterval(() => {
                setUploadingFiles((prev) =>
                    prev.map((f) =>
                        f.id === id && f.progress < 85 ? { ...f, progress: f.progress + 20 } : f
                    )
                );
            }, 120);

            const url = await uploadFile(file);
            clearInterval(progressInterval);

            if (url) {
                setUploadingFiles((prev) =>
                    prev.map((f) => (f.id === id ? { ...f, progress: 100, url } : f))
                );
            } else {
                setUploadingFiles((prev) =>
                    prev.map((f) => (f.id === id ? { ...f, progress: 0, error: "Yükleme başarısız" } : f))
                );
            }
        }
    };

    const removeFile = (id: string) => {
        setUploadingFiles((prev) => {
            const file = prev.find((f) => f.id === id);
            if (file?.preview) URL.revokeObjectURL(file.preview);
            return prev.filter((f) => f.id !== id);
        });
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleSubmit = async () => {
        setFormError(null);

        if (!subject.trim()) { setFormError("Konu başlığı zorunludur."); return; }
        if (!description.trim()) { setFormError("Açıklama zorunludur."); return; }
        if (activeTab === "DESTEK" && !errorType) { setFormError("Hata kategorisi seçiniz."); return; }

        const successfulUrls = uploadingFiles.filter((f) => f.url && !f.error).map((f) => f.url!);

        setSubmitting(true);
        try {
            const res = await fetch("/api/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: activeTab,
                    errorType: errorType || "GENEL",
                    subject: subject.trim(),
                    description: description.trim(),
                    imageUrls: successfulUrls,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                setFormError(data.error ?? "Bir hata oluştu.");
                return;
            }

            setSuccess(
                activeTab === "DESTEK"
                    ? "Destek talebiniz başarıyla gönderildi."
                    : "Öneriniz başarıyla gönderildi."
            );
            resetForm();
            await loadTickets();
            setTimeout(() => { setView("list"); setSuccess(null); }, 2000);
        } catch {
            setFormError("Bir hata oluştu. Lütfen tekrar deneyin.");
        } finally {
            setSubmitting(false);
        }
    };

    const getImageUrls = (ticket: Ticket): string[] => {
        if (!ticket.imageUrls) return [];
        try { return JSON.parse(ticket.imageUrls) as string[]; }
        catch { return []; }
    };

    const getErrorLabel = (ticket: Ticket) => {
        const list = ticket.type === "ONERI" ? SUGGESTION_TYPES : SUPPORT_ERROR_TYPES;
        return list.find((t) => t.value === ticket.errorType)?.label ?? ticket.errorType;
    };

    const uploadedCount = uploadingFiles.filter((f) => f.url && !f.error).length;
    const isUploading = uploadingFiles.some((f) => !f.url && !f.error);

    return (
        <>
            {/* Lightbox */}
            {lightboxUrl && (
                <div
                    className="fixed inset-0 z-[500] bg-black/90 flex items-center justify-center"
                    onClick={() => setLightboxUrl(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white/70 hover:text-white transition"
                        onClick={() => setLightboxUrl(null)}
                    >
                        <X className="w-8 h-8" />
                    </button>
                    <img
                        src={lightboxUrl}
                        alt="Büyük görünüm"
                        className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            <div className="w-full max-w-4xl mx-auto">
                {/* Sayfa Başlığı */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                        Destek & İletişim
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        Sorunlarınızı bildirin veya önerilerinizi paylaşın
                    </p>
                </div>

                {/* Üst Sekme + Yeni Buton */}
                <div className="flex items-center gap-3 mb-6 flex-wrap">
                    <button
                        onClick={() => { setActiveTab("DESTEK"); setView("list"); resetForm(); }}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                            activeTab === "DESTEK"
                                ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20"
                                : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-red-300"
                        }`}
                    >
                        <Wrench className="w-4 h-4" />
                        Destek Talebi
                        {tickets.filter((t) => t.type === "DESTEK").length > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                activeTab === "DESTEK" ? "bg-white/20 text-white" : "bg-zinc-100 dark:bg-zinc-700 text-zinc-500"
                            }`}>
                                {tickets.filter((t) => t.type === "DESTEK").length}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => { setActiveTab("ONERI"); setView("list"); resetForm(); }}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                            activeTab === "ONERI"
                                ? "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20"
                                : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-amber-300"
                        }`}
                    >
                        <Lightbulb className="w-4 h-4" />
                        Öneri Gönder
                        {tickets.filter((t) => t.type === "ONERI").length > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                activeTab === "ONERI" ? "bg-white/20 text-white" : "bg-zinc-100 dark:bg-zinc-700 text-zinc-500"
                            }`}>
                                {tickets.filter((t) => t.type === "ONERI").length}
                            </span>
                        )}
                    </button>

                    <div className="ml-auto">
                        {view === "list" ? (
                            <button
                                onClick={() => { resetForm(); setView("new"); }}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                                    activeTab === "DESTEK"
                                        ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-100"
                                        : "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-100"
                                }`}
                            >
                                <Plus className="w-4 h-4" />
                                {activeTab === "DESTEK" ? "Yeni Talep" : "Öneri Yaz"}
                            </button>
                        ) : (
                            <button
                                onClick={() => { setView("list"); resetForm(); }}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 transition-all"
                            >
                                <ChevronDown className="w-4 h-4 rotate-90" />
                                Listeye Dön
                            </button>
                        )}
                    </div>
                </div>

                {/* ===== FORM GÖRÜNÜMÜ ===== */}
                {view === "new" && (
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden">
                        {/* Form Header */}
                        <div className={`px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 ${
                            activeTab === "DESTEK"
                                ? "bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/10"
                                : "bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/10"
                        }`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                    activeTab === "DESTEK" ? "bg-red-100 dark:bg-red-900/40" : "bg-amber-100 dark:bg-amber-900/40"
                                }`}>
                                    {activeTab === "DESTEK"
                                        ? <Wrench className="w-5 h-5 text-red-600 dark:text-red-400" />
                                        : <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                    }
                                </div>
                                <div>
                                    <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">
                                        {activeTab === "DESTEK" ? "Destek Talebi Oluştur" : "Öneri Gönder"}
                                    </h2>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                        {activeTab === "DESTEK"
                                            ? "Yaşadığınız sorunu detaylı açıklayın, en kısa sürede yanıtlanacak"
                                            : "Sistemi geliştirmemize yardımcı olun"
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Kategori */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                                    {activeTab === "DESTEK" ? "Hata Kategorisi" : "Öneri Kategorisi"}
                                    {activeTab === "DESTEK" && <span className="text-red-500 ml-1">*</span>}
                                </label>
                                <select
                                    value={errorType}
                                    onChange={(e) => setErrorType(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 dark:focus:ring-red-600 transition"
                                >
                                    <option value="">— Kategori seçin —</option>
                                    {(activeTab === "DESTEK" ? SUPPORT_ERROR_TYPES : SUGGESTION_TYPES).map((t) => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Konu */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                                    Konu Başlığı <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    maxLength={200}
                                    placeholder={activeTab === "DESTEK" ? "Sorunu kısaca özetleyin" : "Önerinizi kısaca özetleyin"}
                                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 dark:focus:ring-red-600 transition placeholder:text-zinc-400"
                                />
                                <p className="text-xs text-zinc-400 mt-1 text-right">{subject.length}/200</p>
                            </div>

                            {/* Açıklama */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                                    Açıklama <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={5}
                                    placeholder={
                                        activeTab === "DESTEK"
                                            ? "Sorunu detaylı açıklayın. Ne zaman oluştu, hangi adımları izlediniz, ne görmeyi bekliyordunuz?"
                                            : "Önerinizi detaylı açıklayın. Bu değişiklik nasıl bir fayda sağlar?"
                                    }
                                    className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 dark:focus:ring-red-600 transition placeholder:text-zinc-400 resize-none"
                                />
                            </div>

                            {/* Fotoğraf Yükleme */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                                    Görsel Ekle
                                    <span className="text-zinc-400 font-normal ml-2">
                                        (opsiyonel · max {MAX_IMAGES} görsel · toplam {MAX_TOTAL_MB}MB)
                                    </span>
                                </label>

                                {uploadedCount < MAX_IMAGES && (
                                    <div
                                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                        onDragLeave={() => setIsDragging(false)}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`relative flex flex-col items-center justify-center gap-2 px-6 py-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                                            isDragging
                                                ? "border-red-400 bg-red-50 dark:bg-red-900/20 scale-[1.02]"
                                                : "border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/50 hover:border-red-300 hover:bg-red-50/30 dark:hover:bg-red-900/10"
                                        }`}
                                    >
                                        <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
                                            <Upload className="w-5 h-5 text-zinc-400" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                                Görsel sürükleyin veya <span className="text-red-500">tıklayın</span>
                                            </p>
                                            <p className="text-xs text-zinc-400 mt-0.5">
                                                JPG, PNG, GIF, WEBP · Kalan: {MAX_IMAGES - uploadedCount} görsel
                                            </p>
                                        </div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={(e) => e.target.files && handleFiles(e.target.files)}
                                        />
                                    </div>
                                )}

                                {uploadingFiles.length > 0 && (
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-3">
                                        {uploadingFiles.map((file) => (
                                            <div
                                                key={file.id}
                                                className="relative aspect-square rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 group"
                                            >
                                                {file.preview && (
                                                    <img
                                                        src={file.preview}
                                                        alt={file.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                )}

                                                {!file.url && !file.error && (
                                                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1">
                                                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                                                        <div className="w-3/4 h-1 bg-white/20 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-white rounded-full transition-all duration-300"
                                                                style={{ width: `${file.progress}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {file.error && (
                                                    <div className="absolute inset-0 bg-red-900/70 flex items-center justify-center">
                                                        <AlertCircle className="w-5 h-5 text-red-300" />
                                                    </div>
                                                )}

                                                {file.url && (
                                                    <div className="absolute top-1 left-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                                        <CheckCircle className="w-3.5 h-3.5 text-white" />
                                                    </div>
                                                )}

                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                                    {file.url && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setLightboxUrl(file.url!)}
                                                            className="w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center hover:bg-white"
                                                        >
                                                            <Maximize2 className="w-3.5 h-3.5 text-zinc-700" />
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile(file.id)}
                                                        className="w-7 h-7 bg-red-500/90 rounded-lg flex items-center justify-center hover:bg-red-500"
                                                    >
                                                        <X className="w-3.5 h-3.5 text-white" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Hata / Başarı mesajları */}
                            {formError && (
                                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    {formError}
                                </div>
                            )}
                            {success && (
                                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle className="w-4 h-4 shrink-0" />
                                    {success}
                                </div>
                            )}

                            {/* Butonlar */}
                            <div className="flex gap-3 pt-1">
                                <button
                                    onClick={() => { setView("list"); resetForm(); }}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || isUploading}
                                    className={`flex-[2] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed ${
                                        activeTab === "DESTEK"
                                            ? "bg-red-600 hover:bg-red-700 shadow-red-600/20"
                                            : "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20"
                                    }`}
                                >
                                    {submitting ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Gönderiliyor...</>
                                    ) : isUploading ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Görseller yükleniyor...</>
                                    ) : (
                                        <><Send className="w-4 h-4" /> {activeTab === "DESTEK" ? "Talebi Gönder" : "Öneriyi Gönder"}</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== LİSTE GÖRÜNÜMÜ ===== */}
                {view === "list" && (
                    <div className="space-y-3">
                        {loadingTickets ? (
                            <div className="flex items-center justify-center py-16 text-zinc-400">
                                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                <span className="text-sm">Yükleniyor...</span>
                            </div>
                        ) : filteredTickets.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                                    activeTab === "DESTEK" ? "bg-red-50 dark:bg-red-900/20" : "bg-amber-50 dark:bg-amber-900/20"
                                }`}>
                                    {activeTab === "DESTEK"
                                        ? <Wrench className="w-8 h-8 text-red-300 dark:text-red-600" />
                                        : <Lightbulb className="w-8 h-8 text-amber-300 dark:text-amber-600" />
                                    }
                                </div>
                                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                    {activeTab === "DESTEK" ? "Henüz destek talebiniz yok" : "Henüz öneri göndermediniz"}
                                </p>
                                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                                    Yukarıdaki butona tıklayarak {activeTab === "DESTEK" ? "talebinizi" : "önerinizi"} iletebilirsiniz
                                </p>
                            </div>
                        ) : (
                            filteredTickets.map((ticket) => {
                                const images = getImageUrls(ticket);
                                const statusCfg = STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.OPEN;
                                const StatusIcon = statusCfg.icon;
                                const isExpanded = expandedTicket === ticket.id;

                                return (
                                    <div
                                        key={ticket.id}
                                        className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm overflow-hidden"
                                    >
                                        <button
                                            onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                                            className="w-full flex items-start gap-4 p-5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition"
                                        >
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                                ticket.type === "DESTEK" ? "bg-red-50 dark:bg-red-900/20" : "bg-amber-50 dark:bg-amber-900/20"
                                            }`}>
                                                {ticket.type === "DESTEK"
                                                    ? <Wrench className="w-4 h-4 text-red-500 dark:text-red-400" />
                                                    : <Lightbulb className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                                                }
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                                            {ticket.subject}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                            <span className="text-xs text-zinc-400">{getErrorLabel(ticket)}</span>
                                                            {images.length > 0 && (
                                                                <span className="flex items-center gap-1 text-xs text-zinc-400">
                                                                    <FileImage className="w-3 h-3" />
                                                                    {images.length} görsel
                                                                </span>
                                                            )}
                                                            {ticket.adminNote && (
                                                                <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                                                    <MessageSquare className="w-3 h-3" />
                                                                    Yanıt var
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${statusCfg.color}`}>
                                                            <StatusIcon className="w-3 h-3" />
                                                            {statusCfg.label}
                                                        </span>
                                                        {isExpanded
                                                            ? <ChevronUp className="w-4 h-4 text-zinc-400" />
                                                            : <ChevronDown className="w-4 h-4 text-zinc-400" />
                                                        }
                                                    </div>
                                                </div>
                                                <p className="text-xs text-zinc-400 mt-1.5">
                                                    {new Date(ticket.createdAt).toLocaleDateString("tr-TR", {
                                                        day: "numeric", month: "long", year: "numeric",
                                                        hour: "2-digit", minute: "2-digit"
                                                    })}
                                                </p>
                                            </div>
                                        </button>

                                        {isExpanded && (
                                            <div className="border-t border-zinc-100 dark:border-zinc-800 px-5 pb-5 pt-4 space-y-4">
                                                <div>
                                                    <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">Açıklama</p>
                                                    <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                                                        {ticket.description}
                                                    </p>
                                                </div>

                                                {images.length > 0 && (
                                                    <div>
                                                        <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
                                                            Eklenen Görseller ({images.length})
                                                        </p>
                                                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                                            {images.map((url, i) => (
                                                                <button
                                                                    key={i}
                                                                    type="button"
                                                                    onClick={() => setLightboxUrl(url)}
                                                                    className="aspect-square rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 hover:scale-105 transition group relative"
                                                                >
                                                                    <img src={url} alt={`Görsel ${i + 1}`} className="w-full h-full object-cover" />
                                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                                                                        <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition" />
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {ticket.adminNote && (
                                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                                                                <MessageSquare className="w-3.5 h-3.5 text-white" />
                                                            </div>
                                                            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                                                                Yönetici Yanıtı
                                                            </p>
                                                        </div>
                                                        <p className="text-sm text-emerald-800 dark:text-emerald-300 whitespace-pre-wrap leading-relaxed">
                                                            {ticket.adminNote}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
