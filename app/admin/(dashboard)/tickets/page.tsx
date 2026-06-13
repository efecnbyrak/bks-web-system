"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Ticket, Search, ChevronDown, CheckCircle, Clock, AlertCircle,
    X, Save, Trash2, Filter, RefreshCw, ImageIcon, Wrench, Lightbulb,
    MessageSquare, Maximize2, FileImage, Loader2,
} from "lucide-react";

interface AdminTicket {
    id: number;
    userId: number;
    userName: string;
    userEmail: string;
    type: string;
    errorType: string;
    subject: string;
    description: string;
    imageUrls: string | null;
    status: string;
    adminNote: string | null;
    createdAt: string;
    updatedAt: string;
}

const STATUS_OPTIONS = [
    { value: "ALL", label: "Tümü" },
    { value: "OPEN", label: "Beklemede" },
    { value: "IN_PROGRESS", label: "İnceleniyor" },
    { value: "CLOSED", label: "Kapatıldı" },
];

const STATUS_STYLES: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string; ring: string }> = {
    OPEN: { label: "Beklemede", icon: <Clock className="w-3.5 h-3.5" />, color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20", ring: "ring-amber-200 dark:ring-amber-700/40" },
    IN_PROGRESS: { label: "İnceleniyor", icon: <AlertCircle className="w-3.5 h-3.5" />, color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", ring: "ring-blue-200 dark:ring-blue-700/40" },
    CLOSED: { label: "Kapatıldı", icon: <CheckCircle className="w-3.5 h-3.5" />, color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", ring: "ring-emerald-200 dark:ring-emerald-700/40" },
};

const ERROR_TYPE_LABELS: Record<string, string> = {
    TEKNIK_HATA: "Teknik Hata",
    SINAV_SORUNU: "Sınav Sorunu",
    KURAL_KITABI: "Kural Kitabı",
    ATAMA: "Atama",
    HESAP: "Hesap / Profil",
    DIGER: "Diğer",
    GENEL: "Genel Öneri",
    UYGULAMA: "Uygulama İyileştirmesi",
    KURAL: "Kural / Mevzuat",
    EGITIM: "Eğitim & İçerik",
};

function parseImageUrls(raw: string | null): string[] {
    if (!raw) return [];
    try { return JSON.parse(raw) as string[]; }
    catch { return []; }
}

export default function AdminTicketsPage() {
    const [tickets, setTickets] = useState<AdminTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [selected, setSelected] = useState<AdminTicket | null>(null);
    const [adminNote, setAdminNote] = useState("");
    const [newStatus, setNewStatus] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<string | null>(null);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    const fetchTickets = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter !== "ALL") params.set("status", statusFilter);
            if (search) params.set("search", search);
            const res = await fetch(`/api/admin/tickets?${params}`);
            const data = await res.json();
            setTickets(data.tickets ?? []);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, search]);

    useEffect(() => { fetchTickets(); }, [fetchTickets]);

    const openTicket = (t: AdminTicket) => {
        setSelected(t);
        setAdminNote(t.adminNote ?? "");
        setNewStatus(t.status);
        setSaveMsg(null);
    };

    const saveTicket = async () => {
        if (!selected) return;
        setSaving(true);
        setSaveMsg(null);
        try {
            const res = await fetch(`/api/admin/tickets/${selected.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus, adminNote }),
            });
            if (res.ok) {
                setSaveMsg("Kaydedildi!");
                await fetchTickets();
                setSelected((prev) => prev ? { ...prev, status: newStatus, adminNote } : prev);
            } else {
                setSaveMsg("Hata oluştu.");
            }
        } finally {
            setSaving(false);
        }
    };

    const deleteTicket = async (id: number) => {
        if (!confirm("Bu ticket silinsin mi?")) return;
        await fetch(`/api/admin/tickets/${id}`, { method: "DELETE" });
        setSelected(null);
        await fetchTickets();
    };

    const openCount = tickets.filter((t) => t.status === "OPEN").length;
    const inProgressCount = tickets.filter((t) => t.status === "IN_PROGRESS").length;
    const closedCount = tickets.filter((t) => t.status === "CLOSED").length;
    const supportCount = tickets.filter((t) => t.type === "DESTEK").length;
    const suggestionCount = tickets.filter((t) => t.type === "ONERI").length;

    return (
        <>
            {/* Lightbox */}
            {lightboxUrl && (
                <div
                    className="fixed inset-0 z-[500] bg-black/90 flex items-center justify-center"
                    onClick={() => setLightboxUrl(null)}
                >
                    <button className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={() => setLightboxUrl(null)}>
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

            <div className="p-4 md:p-6 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
                            <Ticket className="w-5 h-5 text-blue-500" />
                            Destek & Öneri Yönetimi
                        </h1>
                        <p className="text-xs text-zinc-500 mt-0.5">
                            Kullanıcıların destek taleplerini ve önerilerini yönetin
                        </p>
                    </div>
                    <button
                        onClick={fetchTickets}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                        <RefreshCw className="w-3.5 h-3.5" /> Yenile
                    </button>
                </div>

                {/* İstatistik Kartları */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4">
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Toplam</p>
                        <p className="text-2xl font-black text-zinc-900 dark:text-white mt-0.5">{tickets.length}</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 p-4">
                        <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wide">Beklemede</p>
                        <p className="text-2xl font-black text-amber-600 mt-0.5">{openCount}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-4">
                        <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wide">İnceleniyor</p>
                        <p className="text-2xl font-black text-blue-600 mt-0.5">{inProgressCount}</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 p-4">
                        <p className="text-[10px] text-red-600 font-bold uppercase tracking-wide flex items-center gap-1"><Wrench className="w-3 h-3" /> Destek</p>
                        <p className="text-2xl font-black text-red-600 mt-0.5">{supportCount}</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 p-4">
                        <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wide flex items-center gap-1"><Lightbulb className="w-3 h-3" /> Öneri</p>
                        <p className="text-2xl font-black text-amber-600 mt-0.5">{suggestionCount}</p>
                    </div>
                </div>

                {/* Filtreler */}
                <div className="flex gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Konu, kullanıcı veya email ara..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pl-9 pr-8 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none"
                        >
                            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                    </div>
                </div>

                <div className="flex gap-4 items-start">
                    {/* Ticket Listesi */}
                    <div className="flex-1 min-w-0 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-12 gap-2 text-zinc-400">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-sm">Yükleniyor...</span>
                            </div>
                        ) : tickets.length === 0 ? (
                            <div className="flex flex-col items-center py-12 text-center px-6">
                                <Ticket className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mb-3" />
                                <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">Talep bulunamadı</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {tickets.map((ticket) => {
                                    const s = STATUS_STYLES[ticket.status] ?? STATUS_STYLES.OPEN;
                                    const isActive = selected?.id === ticket.id;
                                    const images = parseImageUrls(ticket.imageUrls);
                                    return (
                                        <button
                                            key={ticket.id}
                                            onClick={() => openTicket(ticket)}
                                            className={`w-full flex items-start gap-3 px-4 py-4 text-left transition-colors ${isActive ? "bg-blue-50 dark:bg-blue-900/10" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}`}
                                        >
                                            {/* Tip ikonu */}
                                            <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                ticket.type === "ONERI"
                                                    ? "bg-amber-100 dark:bg-amber-900/30"
                                                    : "bg-red-100 dark:bg-red-900/30"
                                            }`}>
                                                {ticket.type === "ONERI"
                                                    ? <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                                    : <Wrench className="w-4 h-4 text-red-600 dark:text-red-400" />
                                                }
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="text-xs font-black text-zinc-800 dark:text-zinc-100 truncate flex-1">{ticket.subject}</p>
                                                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${s.color} ${s.bg} ring-1 ${s.ring}`}>
                                                        {s.icon}
                                                        {s.label}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                                                        {ERROR_TYPE_LABELS[ticket.errorType] ?? ticket.errorType}
                                                    </span>
                                                    {images.length > 0 && (
                                                        <span className="flex items-center gap-0.5 text-[9px] text-zinc-400">
                                                            <FileImage className="w-3 h-3" />{images.length}
                                                        </span>
                                                    )}
                                                    {ticket.adminNote && (
                                                        <span className="flex items-center gap-0.5 text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                                                            <MessageSquare className="w-3 h-3" /> Yanıtlandı
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-zinc-500 mt-1 font-medium">{ticket.userName} · {ticket.userEmail}</p>
                                                <p className="text-[10px] text-zinc-400 mt-0.5">
                                                    {new Date(ticket.createdAt).toLocaleDateString("tr-TR", {
                                                        day: "numeric", month: "long", year: "numeric",
                                                        hour: "2-digit", minute: "2-digit"
                                                    })}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Detay Paneli */}
                    {selected && (() => {
                        const images = parseImageUrls(selected.imageUrls);
                        return (
                            <div className="w-96 flex-shrink-0 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden sticky top-4">
                                {/* Panel Header */}
                                <div className={`px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 ${
                                    selected.type === "ONERI"
                                        ? "bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/10 dark:to-yellow-900/10"
                                        : "bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10"
                                }`}>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                selected.type === "ONERI" ? "bg-amber-100 dark:bg-amber-900/30" : "bg-red-100 dark:bg-red-900/30"
                                            }`}>
                                                {selected.type === "ONERI"
                                                    ? <Lightbulb className="w-4 h-4 text-amber-600" />
                                                    : <Wrench className="w-4 h-4 text-red-600" />
                                                }
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-black text-zinc-900 dark:text-white truncate">{selected.subject}</p>
                                                <p className="text-[10px] text-zinc-400">{selected.type === "ONERI" ? "Öneri" : "Destek Talebi"}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <button
                                                onClick={() => deleteTicket(selected.id)}
                                                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-400 hover:text-red-500 transition-colors"
                                                title="Sil"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => setSelected(null)}
                                                className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto modern-scrollbar">
                                    {/* Kullanıcı & Meta */}
                                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                                        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3">
                                            <p className="text-zinc-400 font-bold uppercase tracking-wide mb-0.5">Kullanıcı</p>
                                            <p className="text-zinc-700 dark:text-zinc-300 font-bold truncate">{selected.userName}</p>
                                            <p className="text-zinc-400 truncate">{selected.userEmail}</p>
                                        </div>
                                        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3">
                                            <p className="text-zinc-400 font-bold uppercase tracking-wide mb-0.5">Kategori</p>
                                            <p className="text-zinc-700 dark:text-zinc-300 font-bold">{ERROR_TYPE_LABELS[selected.errorType] ?? selected.errorType}</p>
                                            <p className="text-zinc-400">{new Date(selected.createdAt).toLocaleDateString("tr-TR")}</p>
                                        </div>
                                    </div>

                                    {/* Açıklama */}
                                    <div className="bg-zinc-50 dark:bg-zinc-800/30 rounded-xl p-4">
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-2">Açıklama</p>
                                        <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">{selected.description}</p>
                                    </div>

                                    {/* Görseller */}
                                    {images.length > 0 && (
                                        <div className="bg-zinc-50 dark:bg-zinc-800/30 rounded-xl p-4">
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-3 flex items-center gap-1">
                                                <ImageIcon className="w-3 h-3" /> Ekli Görseller ({images.length})
                                            </p>
                                            <div className="grid grid-cols-3 gap-2">
                                                {images.map((url, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => setLightboxUrl(url)}
                                                        className="aspect-square rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 hover:scale-105 transition group relative"
                                                    >
                                                        <img src={url} alt={`Görsel ${i + 1}`} className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
                                                            <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition" />
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Durum */}
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Durum</label>
                                        <div className="relative">
                                            <select
                                                value={newStatus}
                                                onChange={(e) => setNewStatus(e.target.value)}
                                                className="w-full appearance-none px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                            >
                                                <option value="OPEN">Beklemede</option>
                                                <option value="IN_PROGRESS">İnceleniyor</option>
                                                <option value="CLOSED">Kapatıldı</option>
                                            </select>
                                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Admin Yanıtı */}
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wide mb-1.5">
                                            Kullanıcıya Yanıt
                                            {selected.adminNote && (
                                                <span className="ml-2 text-emerald-500 font-bold normal-case">✓ Yanıtlandı</span>
                                            )}
                                        </label>
                                        <textarea
                                            value={adminNote}
                                            onChange={(e) => setAdminNote(e.target.value)}
                                            placeholder="Kullanıcıya açıklayıcı bir yanıt yazın..."
                                            rows={5}
                                            className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
                                        />
                                        <p className="text-[9px] text-zinc-400 mt-1">
                                            Yanıt kaydedildiğinde kullanıcı sisteme giriş yapınca bildirim alacak.
                                        </p>
                                    </div>

                                    {saveMsg && (
                                        <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold ${
                                            saveMsg.includes("Hata")
                                                ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
                                                : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                                        }`}>
                                            {saveMsg.includes("Hata")
                                                ? <AlertCircle className="w-4 h-4" />
                                                : <CheckCircle className="w-4 h-4" />
                                            }
                                            {saveMsg}
                                        </div>
                                    )}

                                    <button
                                        onClick={saveTicket}
                                        disabled={saving}
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all disabled:opacity-60 shadow-sm shadow-blue-600/20"
                                    >
                                        {saving
                                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor...</>
                                            : <><Save className="w-3.5 h-3.5" /> Yanıtı Kaydet & Bildir</>
                                        }
                                    </button>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </>
    );
}
