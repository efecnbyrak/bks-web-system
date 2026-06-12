"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { Search, X, Loader2, BookOpen, ChevronDown, ChevronUp, Sparkles, Circle, ShieldAlert, Clock, Grid2X2, Users, Shield, FileText, AlertTriangle, Hand, CheckCircle2 } from "lucide-react";
import { markArticleRead } from "@/app/actions/rules";

interface RuleSection {
    id: string;
    title: string;
    paragraphs: string[];
}

interface RuleArticle {
    id: string;
    title: string;
    page: number;
    intro: string[];
    sections: RuleSection[];
}

interface SearchEntry {
    madde: string;
    maddeTitle: string;
    sectionId: string;
    sectionTitle: string;
    text: string;
    page: number;
}

interface NativeRulesViewerProps {
    type: "kural" | "yorum";
    readArticleIds?: string[];
}

// Madde numarasından kategori
const ARTICLE_CATEGORY: Record<number, string> = {
    1: "oyun",
    2: "saha", 3: "saha",
    4: "takimlar", 5: "takimlar", 6: "takimlar", 7: "takimlar",
    8: "duzenlemeler", 9: "duzenlemeler", 10: "duzenlemeler", 11: "duzenlemeler",
    12: "duzenlemeler", 13: "duzenlemeler", 14: "duzenlemeler", 15: "duzenlemeler",
    16: "duzenlemeler", 17: "duzenlemeler", 18: "duzenlemeler", 19: "duzenlemeler",
    20: "duzenlemeler",
    21: "duzenlemeler",
    22: "ihlaller", 23: "ihlaller", 24: "ihlaller", 25: "ihlaller",
    26: "ihlaller", 27: "ihlaller", 28: "ihlaller", 29: "ihlaller",
    30: "ihlaller", 31: "ihlaller",
    32: "fauller", 33: "fauller", 34: "fauller", 35: "fauller",
    36: "fauller", 37: "fauller", 38: "fauller", 39: "fauller",
    40: "genel", 41: "genel", 42: "genel", 43: "genel", 44: "genel",
    45: "hakemler", 46: "hakemler", 47: "hakemler", 48: "hakemler", 49: "hakemler", 50: "hakemler",
};

interface CategoryDef {
    key: string;
    label: string;
    color: string;
    textColor: string;
    borderColor: string;
    icon: React.ReactNode;
}

const CATEGORIES: CategoryDef[] = [
    { key: "oyun",         label: "Oyun",         color: "bg-red-600",     textColor: "text-white",   borderColor: "border-red-600",      icon: <Circle className="w-4 h-4" /> },
    { key: "saha",         label: "Saha",          color: "bg-purple-600",  textColor: "text-white",   borderColor: "border-purple-600",   icon: <Grid2X2 className="w-4 h-4" /> },
    { key: "takimlar",     label: "Takımlar",      color: "bg-cyan-600",    textColor: "text-white",   borderColor: "border-cyan-600",     icon: <Users className="w-4 h-4" /> },
    { key: "duzenlemeler", label: "Düzenlemeler",  color: "bg-blue-600",    textColor: "text-white",   borderColor: "border-blue-600",     icon: <Clock className="w-4 h-4" /> },
    { key: "ihlaller",     label: "İhlaller",      color: "bg-green-600",   textColor: "text-white",   borderColor: "border-green-600",    icon: <AlertTriangle className="w-4 h-4" /> },
    { key: "fauller",      label: "Fauller",       color: "bg-orange-500",  textColor: "text-white",   borderColor: "border-orange-500",   icon: <Hand className="w-4 h-4" /> },
    { key: "genel",        label: "Genel",         color: "bg-stone-600",   textColor: "text-white",   borderColor: "border-stone-600",    icon: <FileText className="w-4 h-4" /> },
    { key: "hakemler",     label: "Hakemler",      color: "bg-rose-600",    textColor: "text-white",   borderColor: "border-rose-600",     icon: <Shield className="w-4 h-4" /> },
];

const QUICK_CHIPS: Record<string, string[]> = {
    kural: ["Faul", "Serbest Atış", "8 Saniye", "Dripling", "Teknik Faul", "Kavga", "Sayı", "Zaman Aşımı"],
    yorum: ["Temas", "Pozisyon", "Hareketler", "İhlal", "Faul", "Kural Uygulama"],
};

const TYPE_LABEL: Record<string, string> = {
    kural: "Basketbol Oyun Kuralları 2024",
    yorum: "Resmi Yorumlar",
};

function highlightText(text: string, query: string): React.ReactNode {
    if (!query || query.trim().length < 2) return text;
    const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === query.trim().toLowerCase()
                    ? <mark key={i} className="bg-amber-200 dark:bg-amber-700/60 text-zinc-900 dark:text-zinc-100 rounded px-0.5 not-italic font-semibold">{part}</mark>
                    : part
            )}
        </>
    );
}

function ArticleCard({
    article,
    query,
    defaultOpen = false,
    matchedSectionIds = [],
    isRead = false,
    onOpen,
}: {
    article: RuleArticle;
    query: string;
    defaultOpen?: boolean;
    matchedSectionIds?: string[];
    isRead?: boolean;
    onOpen?: () => void;
}) {
    const [open, setOpen] = useState(defaultOpen);
    const hasNotified = useRef(false);

    useEffect(() => {
        setOpen(defaultOpen);
    }, [defaultOpen]);

    const handleToggle = () => {
        const opening = !open;
        setOpen(opening);
        if (opening && !hasNotified.current) {
            hasNotified.current = true;
            onOpen?.();
        }
    };

    return (
        <div className={`border rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm transition-all duration-200 ${
            isRead
                ? "border-green-200 dark:border-green-900/60"
                : "border-zinc-200 dark:border-zinc-800"
        }`}>
            {/* Article Header */}
            <button
                onClick={handleToggle}
                className="w-full flex items-center gap-3 sm:gap-4 px-4 py-4 sm:px-5 sm:py-5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/60 active:bg-zinc-100 dark:active:bg-zinc-800 transition-colors"
            >
                {/* Number badge */}
                <span className={`shrink-0 inline-flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl text-white text-sm sm:text-base font-black shadow-sm ${
                    isRead
                        ? "bg-green-500 shadow-green-500/30"
                        : "bg-red-600 shadow-red-600/30"
                }`}>
                    {isRead ? <CheckCircle2 className="w-5 h-5" /> : article.id}
                </span>

                <div className="flex-1 min-w-0">
                    <p className={`text-[10px] font-black uppercase tracking-[0.15em] mb-0.5 ${
                        isRead ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"
                    }`}>
                        Madde {article.id}{isRead ? " · Okundu" : ""}
                    </p>
                    <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm sm:text-[15px] leading-snug">
                        {query ? highlightText(article.title, query) : article.title}
                    </p>
                </div>

                <span className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                    open
                        ? "bg-red-50 dark:bg-red-900/20 text-red-500"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                }`}>
                    {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
            </button>

            {/* Article Content */}
            {open && (
                <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 pb-5 pt-4 sm:px-5 space-y-5">
                    {article.intro.length > 0 && (
                        <div className="space-y-2.5 pb-1">
                            {article.intro.map((p, i) => (
                                <p key={i} className="text-[15px] text-zinc-700 dark:text-zinc-300 leading-[1.75]">
                                    {query ? highlightText(p, query) : p}
                                </p>
                            ))}
                        </div>
                    )}

                    <div className="space-y-4">
                        {article.sections.map((sec, si) => {
                            const isMatchedSection = matchedSectionIds.includes(sec.id);
                            return (
                                <div
                                    key={si}
                                    className={`relative pl-4 border-l-[3px] rounded-r-xl pr-3 py-3 space-y-2 ${
                                        isMatchedSection && query
                                            ? "border-amber-400 bg-amber-50 dark:bg-amber-900/10"
                                            : "border-red-200 dark:border-red-900/60 bg-zinc-50 dark:bg-zinc-800/40"
                                    }`}
                                >
                                    {(sec.title || sec.id) && (
                                        <div className="flex flex-wrap items-baseline gap-2">
                                            {sec.id && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-black tracking-wide shrink-0">
                                                    {sec.id}
                                                </span>
                                            )}
                                            {sec.title && (
                                                <span className="text-[15px] sm:text-base font-bold text-zinc-800 dark:text-zinc-200 leading-snug">
                                                    {query ? highlightText(sec.title, query) : sec.title}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        {sec.paragraphs.map((para, pi) => (
                                            <p key={pi} className={`text-[14px] sm:text-[15px] leading-[1.75] ${
                                                para.startsWith('•') || para.startsWith('-')
                                                    ? "pl-4 text-zinc-500 dark:text-zinc-400"
                                                    : "text-zinc-700 dark:text-zinc-300"
                                            }`}>
                                                {query ? highlightText(para, query) : para}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export function NativeRulesViewer({ type, readArticleIds = [] }: NativeRulesViewerProps) {
    const [articles, setArticles] = useState<RuleArticle[]>([]);
    const [searchIndex, setSearchIndex] = useState<SearchEntry[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searching, setSearching] = useState(false);

    const [searchResults, setSearchResults] = useState<{article: RuleArticle; matchedSectionIds: string[]}[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const [localReadIds, setLocalReadIds] = useState<Set<string>>(new Set(readArticleIds));
    const [, startTransition] = useTransition();

    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fuseRef = useRef<any>(null);

    useEffect(() => {
        async function load() {
            try {
                const [artRes, searchRes] = await Promise.all([
                    fetch(`/rules-data/${type}-articles.json`),
                    fetch(`/rules-data/${type}-search.json`),
                ]);
                const arts: RuleArticle[] = await artRes.json();
                const idx: SearchEntry[] = await searchRes.json();
                setArticles(arts);
                setSearchIndex(idx);

                const Fuse = (await import('fuse.js')).default;
                fuseRef.current = new Fuse(idx, {
                    keys: [
                        { name: 'maddeTitle', weight: 0.4 },
                        { name: 'sectionTitle', weight: 0.3 },
                        { name: 'text', weight: 0.3 },
                    ],
                    threshold: 0.38,
                    includeScore: true,
                    ignoreLocation: true,
                    findAllMatches: true,
                    minMatchCharLength: 2,
                });
            } catch (e) {
                console.error('Failed to load rules data', e);
            } finally {
                setLoadingData(false);
            }
        }
        load();
    }, [type]);

    const handleArticleOpen = useCallback((articleId: string) => {
        if (!localReadIds.has(articleId)) {
            setLocalReadIds(prev => new Set([...prev, articleId]));
            startTransition(() => { markArticleRead(articleId, type); });
        }
    }, [localReadIds, type]);

    const doSearch = useCallback((q: string) => {
        if (!q || q.trim().length < 2 || !fuseRef.current) {
            setSearchResults([]);
            setHasSearched(false);
            setSuggestions([]);
            return;
        }

        setSearching(true);

        const results = fuseRef.current.search(q.trim(), { limit: 20 });

        const maddeMap = new Map<string, Set<string>>();
        for (const r of results) {
            const item: SearchEntry = r.item;
            if (!maddeMap.has(item.madde)) maddeMap.set(item.madde, new Set());
            if (item.sectionId) maddeMap.get(item.madde)!.add(item.sectionId);
        }

        const matched = [];
        for (const [maddeId, sectionIds] of maddeMap) {
            const article = articles.find(a => a.id === maddeId);
            if (article) {
                matched.push({ article, matchedSectionIds: Array.from(sectionIds) });
            }
        }

        setSearchResults(matched);
        setHasSearched(true);
        setSearching(false);

        const q2 = q.toLowerCase();
        const words = new Set<string>();
        for (const entry of searchIndex) {
            const tokens = (entry.maddeTitle + ' ' + entry.text).toLowerCase().split(/\s+/);
            for (const t of tokens) {
                if (t.length >= 4 && t.startsWith(q2) && t !== q2) words.add(t);
                if (words.size >= 6) break;
            }
            if (words.size >= 6) break;
        }
        setSuggestions(Array.from(words).slice(0, 5));
    }, [articles, searchIndex]);

    useEffect(() => {
        clearTimeout(debounceRef.current);
        if (query.trim().length >= 2) {
            debounceRef.current = setTimeout(() => doSearch(query), 300);
        } else {
            setSearchResults([]);
            setHasSearched(false);
            setSuggestions([]);
        }
        return () => clearTimeout(debounceRef.current);
    }, [query, doSearch]);

    const clearSearch = () => {
        setQuery("");
        setSearchResults([]);
        setHasSearched(false);
        setSuggestions([]);
        inputRef.current?.focus();
    };

    const toggleCategory = (key: string) => {
        setActiveCategory(prev => prev === key ? null : key);
        clearSearch();
    };

    const applyQuery = (q: string) => {
        setQuery(q);
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

    if (loadingData) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                <span className="ml-3 text-zinc-500 font-semibold">Kurallar yükleniyor...</span>
            </div>
        );
    }

    const baseArticles = activeCategory && type === "kural"
        ? articles.filter(a => ARTICLE_CATEGORY[parseInt(a.id)] === activeCategory)
        : articles;

    const displayArticles = hasSearched
        ? searchResults.filter(r => !activeCategory || !type || type !== "kural" || ARTICLE_CATEGORY[parseInt(r.article.id)] === activeCategory)
        : baseArticles.map(a => ({ article: a, matchedSectionIds: [] }));

    // Progress hesaplama
    const readCount = articles.filter(a => localReadIds.has(a.id)).length;
    const totalCount = articles.length;
    const progressPercent = totalCount > 0 ? Math.round((readCount / totalCount) * 100) : 0;

    return (
        <div className="space-y-5">
            {/* İlerleme çubuğu */}
            {totalCount > 0 && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
                                {TYPE_LABEL[type]} — İlerleme
                            </span>
                        </div>
                        <span className="text-xs font-black text-green-600 dark:text-green-400">
                            {readCount} / {totalCount} madde
                        </span>
                    </div>
                    <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1.5 font-medium">
                        {progressPercent}% tamamlandı
                        {progressPercent === 100 && " · Tüm maddeler okundu!"}
                    </p>
                </div>
            )}

            {/* Search Input */}
            <div className="relative">
                <div className={`flex items-center gap-3 bg-white dark:bg-zinc-900 border-2 rounded-2xl transition-all duration-200 shadow-md ${
                    query
                        ? "border-red-500 shadow-red-500/10 dark:shadow-red-500/5"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 focus-within:border-red-500 focus-within:shadow-red-500/10"
                }`}>
                    <div className="pl-4 shrink-0">
                        {searching
                            ? <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                            : <Search className="w-5 h-5 text-zinc-400" />
                        }
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => { setQuery(e.target.value); setShowSuggestions(true); }}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        onKeyDown={e => { if (e.key === 'Escape') clearSearch(); }}
                        placeholder={
                            type === "kural"
                                ? "Madde, kural veya kelime arayın..."
                                : "Yorum, pozisyon veya madde arayın..."
                        }
                        className="flex-1 bg-transparent py-4 text-[15px] text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 outline-none font-medium min-w-0"
                    />
                    {query && (
                        <button
                            onClick={clearSearch}
                            className="pr-4 shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Autocomplete */}
                {showSuggestions && suggestions.length > 0 && query.length >= 2 && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl z-20 overflow-hidden">
                        <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Öneriler
                            </span>
                        </div>
                        {suggestions.map((s, i) => (
                            <button
                                key={i}
                                onMouseDown={() => applyQuery(s)}
                                className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 active:bg-zinc-100 transition-colors"
                            >
                                <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                <span className="text-zinc-700 dark:text-zinc-300 font-medium">{s}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Category filter — only for kurallar */}
            {type === "kural" && !query && (
                <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em] mb-3">Kategoriler</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {CATEGORIES.map(cat => {
                            const isActive = activeCategory === cat.key;
                            const count = articles.filter(a => ARTICLE_CATEGORY[parseInt(a.id)] === cat.key).length;
                            return (
                                <button
                                    key={cat.key}
                                    onClick={() => toggleCategory(cat.key)}
                                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-left transition-all active:scale-95 ${
                                        isActive
                                            ? `${cat.color} ${cat.textColor} ${cat.borderColor} shadow-md`
                                            : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600"
                                    }`}
                                >
                                    <span className={`shrink-0 ${isActive ? cat.textColor : "text-zinc-400 dark:text-zinc-500"}`}>
                                        {cat.icon}
                                    </span>
                                    <span className="flex-1 min-w-0">
                                        <span className="block text-[13px] font-bold leading-tight truncate">{cat.label}</span>
                                        <span className={`text-[11px] font-semibold ${isActive ? "opacity-80" : "text-zinc-400 dark:text-zinc-500"}`}>{count} madde</span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    {activeCategory && (
                        <button
                            onClick={() => setActiveCategory(null)}
                            className="mt-2 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 font-semibold underline-offset-2 hover:underline transition-colors"
                        >
                            Tüm maddeler
                        </button>
                    )}
                </div>
            )}

            {/* Quick chips */}
            {!query && !activeCategory && (
                <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em] mb-3">Hızlı Arama</p>
                    <div className="flex flex-wrap gap-2">
                        {QUICK_CHIPS[type].map(chip => (
                            <button
                                key={chip}
                                onClick={() => applyQuery(chip)}
                                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 active:scale-95 transition-all"
                            >
                                {chip}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Results / list header */}
            {hasSearched ? (
                <div className="flex items-center justify-between py-0.5">
                    <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
                        {displayArticles.length > 0
                            ? <><span className="text-red-600 dark:text-red-500">{displayArticles.length}</span> madde bulundu</>
                            : `"${query}" için sonuç bulunamadı`
                        }
                    </p>
                    <button onClick={clearSearch} className="text-xs text-zinc-400 hover:text-zinc-600 font-semibold underline-offset-2 hover:underline transition-colors">
                        Temizle
                    </button>
                </div>
            ) : (
                !query && (
                    <div className="flex items-center justify-between py-0.5">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">
                            {activeCategory
                                ? <>{CATEGORIES.find(c => c.key === activeCategory)?.label} — <span className="text-red-500">{displayArticles.length}</span> Madde</>
                                : <>{TYPE_LABEL[type]} — {articles.length} Madde</>
                            }
                        </p>
                    </div>
                )
            )}

            {/* Articles list */}
            <div className="space-y-2.5">
                {displayArticles.map(({ article, matchedSectionIds }) => (
                    <ArticleCard
                        key={article.id}
                        article={article}
                        query={query}
                        defaultOpen={hasSearched}
                        matchedSectionIds={matchedSectionIds}
                        isRead={localReadIds.has(article.id)}
                        onOpen={() => handleArticleOpen(article.id)}
                    />
                ))}
            </div>

            {/* Empty state */}
            {hasSearched && searchResults.length === 0 && (
                <div className="text-center py-16 text-zinc-400">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-25" />
                    <p className="font-bold text-zinc-500 dark:text-zinc-400 text-base">
                        &ldquo;{query}&rdquo; için sonuç bulunamadı
                    </p>
                    <p className="text-sm mt-2 text-zinc-400">Farklı bir kelime veya madde numarası deneyin</p>
                </div>
            )}
        </div>
    );
}
