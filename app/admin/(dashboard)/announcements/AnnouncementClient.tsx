"use client";

import { useState, useEffect } from "react";
import { Send, Users, ChevronDown, CheckCircle2, AlertCircle, Loader2, Search, UserCheck, X } from "lucide-react";
import { sendAnnouncement, getRefereesAndOfficials } from "@/app/actions/announcements";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const GROUP_TARGETS = [
    { id: "ALL", label: "Tüm Kullanıcılar" },
    { id: "REFEREE", label: "Tüm Hakemler" },
    { id: "TABLE", label: "Tüm Masa Görevlileri" },
    { id: "OBSERVER", label: "Tüm Gözlemciler" },
    { id: "STATISTICIAN", label: "Tüm İstatistikçiler" },
    { id: "HEALTH", label: "Tüm Sağlıkçılar" },
    { id: "FIELD_COMMISSIONER", label: "Tüm Saha Komiserleri" },
];

const OFFICIAL_TYPE_LABELS: Record<string, string> = {
    TABLE: "Masa Görevlisi",
    OBSERVER: "Gözlemci",
    STATISTICIAN: "İstatistikçi",
    HEALTH: "Sağlıkçı",
    FIELD_COMMISSIONER: "Saha Komiseri",
};

interface Person {
    userId: number;
    firstName: string;
    lastName: string;
    email: string | null;
    officialType?: string;
}

type SelectionMode = "group" | "individual";

export default function AnnouncementClient() {
    const [subject, setSubject] = useState("");
    const [content, setContent] = useState("");
    const [target, setTarget] = useState("ALL");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Individual selection
    const [mode, setMode] = useState<SelectionMode>("group");
    const [referees, setReferees] = useState<Person[]>([]);
    const [officials, setOffcials] = useState<Person[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");
    const [listLoading, setListLoading] = useState(false);

    useEffect(() => {
        if (mode === "individual" && referees.length === 0 && officials.length === 0) {
            setListLoading(true);
            getRefereesAndOfficials().then(({ referees: r, officials: o }) => {
                setReferees(r as Person[]);
                setOffcials(o as Person[]);
                setListLoading(false);
            });
        }
    }, [mode]);

    const toggleId = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const allPeople: Person[] = [...referees, ...officials];
    const filteredPeople = allPeople.filter(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject || !content) return;
        if (mode === "individual" && selectedIds.size === 0) {
            setStatus({ type: 'error', message: "Lütfen en az bir kişi seçin." });
            return;
        }

        setLoading(true);
        setStatus(null);

        try {
            const ids = mode === "individual" ? Array.from(selectedIds) : undefined;
            const res = await sendAnnouncement(subject, content, target, ids);
            if (res.success) {
                setStatus({ type: 'success', message: res.message });
                setSubject("");
                setContent("");
                setSelectedIds(new Set());
            } else {
                setStatus({ type: 'error', message: res.message });
            }
        } catch {
            setStatus({ type: 'error', message: "Beklenmedik bir hata oluştu." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] shadow-sm border border-zinc-200 dark:border-zinc-800">
            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Mode Tabs */}
                <div className="flex gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">
                    <button
                        type="button"
                        onClick={() => setMode("group")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                            mode === "group"
                                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        Grup Seçimi
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("individual")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                            mode === "individual"
                                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        }`}
                    >
                        <UserCheck className="w-4 h-4" />
                        Bireysel Seçim
                    </button>
                </div>

                {/* Group Target Selector */}
                {mode === "group" && (
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-widest italic ml-1">Alıcı Grubu</label>
                        <div className="relative group">
                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-red-500 transition-colors" />
                            <select
                                value={target}
                                onChange={(e) => setTarget(e.target.value)}
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all appearance-none italic"
                            >
                                {GROUP_TARGETS.map(t => (
                                    <option key={t.id} value={t.id}>{t.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                        </div>
                    </div>
                )}

                {/* Individual Selection */}
                {mode === "individual" && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-widest italic ml-1">Kişi Seçimi</label>
                            {selectedIds.size > 0 && (
                                <span className="text-[10px] font-black text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                                    {selectedIds.size} kişi seçildi
                                </span>
                            )}
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="İsim veya e-posta ile ara..."
                                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all text-zinc-900 dark:text-white placeholder:text-zinc-400"
                            />
                        </div>

                        {/* Bulk actions */}
                        {!listLoading && filteredPeople.length > 0 && (
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedIds(new Set(filteredPeople.map(p => p.userId)))}
                                    className="text-[10px] font-black text-red-600 hover:text-red-700 uppercase tracking-wider"
                                >
                                    Tümünü Seç
                                </button>
                                <span className="text-zinc-300 dark:text-zinc-700">|</span>
                                <button
                                    type="button"
                                    onClick={() => setSelectedIds(new Set())}
                                    className="text-[10px] font-black text-zinc-400 hover:text-zinc-600 uppercase tracking-wider"
                                >
                                    Temizle
                                </button>
                            </div>
                        )}

                        {/* Person List */}
                        <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                            {listLoading ? (
                                <div className="flex items-center justify-center py-8 gap-2 text-zinc-400">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span className="text-xs font-bold">Yükleniyor...</span>
                                </div>
                            ) : filteredPeople.length === 0 ? (
                                <div className="py-8 text-center text-xs font-bold text-zinc-400 italic">
                                    {searchQuery ? "Arama sonucu bulunamadı." : "Kayıtlı kullanıcı yok."}
                                </div>
                            ) : (
                                <>
                                    {/* Referees section */}
                                    {filteredPeople.filter(p => !p.officialType).length > 0 && (
                                        <div>
                                            <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
                                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Hakemler</span>
                                            </div>
                                            {filteredPeople.filter(p => !p.officialType).map(p => (
                                                <label key={p.userId} className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(p.userId)}
                                                        onChange={() => toggleId(p.userId)}
                                                        className="w-4 h-4 rounded border-zinc-300 text-red-600 focus:ring-red-500"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{p.firstName} {p.lastName}</p>
                                                        {p.email && <p className="text-[10px] text-zinc-400 truncate">{p.email}</p>}
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    )}

                                    {/* Officials section */}
                                    {filteredPeople.filter(p => !!p.officialType).length > 0 && (
                                        <div>
                                            <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
                                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Görevliler</span>
                                            </div>
                                            {filteredPeople.filter(p => !!p.officialType).map(p => (
                                                <label key={p.userId} className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(p.userId)}
                                                        onChange={() => toggleId(p.userId)}
                                                        className="w-4 h-4 rounded border-zinc-300 text-red-600 focus:ring-red-500"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{p.firstName} {p.lastName}</p>
                                                        <div className="flex items-center gap-2">
                                                            {p.officialType && (
                                                                <span className="text-[9px] font-black text-zinc-500 uppercase">{OFFICIAL_TYPE_LABELS[p.officialType] ?? p.officialType}</span>
                                                            )}
                                                            {p.email && <p className="text-[10px] text-zinc-400 truncate">{p.email}</p>}
                                                        </div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Subject */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-widest italic ml-1">Duyuru Konusu</label>
                    <input
                        required
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Örn: Hafta Sonu Maç Görevlendirmeleri Hakkında"
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all italic placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-zinc-900 dark:text-white"
                    />
                </div>

                {/* Content */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-widest italic ml-1">Duyuru İçeriği</label>
                    <div className="bg-zinc-50 dark:bg-zinc-950/50 rounded-3xl overflow-hidden focus-within:ring-2 focus-within:ring-red-500/20 focus-within:border-red-500 transition-all [&_.ql-toolbar]:border-none [&_.ql-toolbar]:bg-zinc-100/50 [&_.ql-toolbar]:dark:bg-zinc-900/50 [&_.ql-container]:!border-none [&_.ql-editor]:min-h-[200px] [&_.ql-editor]:text-zinc-900 [&_.ql-editor]:dark:text-white [&_.ql-editor]:text-sm [&_.ql-blank::before]:!text-zinc-400 [&_.ql-blank::before]:dark:!text-zinc-500 [&_.ql-blank::before]:!opacity-100 [&_.ql-blank::before]:italic [&_.ql-blank::before]:font-medium">
                        <ReactQuill
                            theme="snow"
                            value={content}
                            onChange={setContent}
                            placeholder="Mesajınızı buraya yazın..."
                            modules={{
                                toolbar: [
                                    [{ 'header': [1, 2, 3, false] }],
                                    ['bold', 'italic', 'underline', 'strike'],
                                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                                    ['link'],
                                    ['clean']
                                ]
                            }}
                        />
                    </div>
                </div>

                {/* Status Message */}
                {status && (
                    <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${status.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-red-50 dark:bg-red-900/20 text-red-600'}`}>
                        {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                        <p className="text-xs font-bold uppercase italic">{status.message}</p>
                    </div>
                )}

                {/* Submit */}
                <button
                    disabled={loading || !subject || !content || (mode === "individual" && selectedIds.size === 0)}
                    type="submit"
                    className="w-full bg-red-700 hover:bg-black text-white font-black py-5 rounded-2xl shadow-2xl shadow-red-600/40 border-4 border-white/10 hover:border-red-500 flex items-center justify-center gap-4 transition-all disabled:opacity-50 group hover:-translate-y-2 active:scale-95 outline-none tracking-tighter"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            {mode === "individual"
                                ? `${selectedIds.size} KİŞİYE GÖNDER`
                                : "DUYURUYU ŞİMDİ GÖNDER"
                            }
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
