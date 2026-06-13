"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Star, Trophy, BookOpen, Zap, Target, Award, Lock, Flame, Shield,
    Crown, Gem, GraduationCap, CheckCircle, XCircle, ChevronRight,
    Video, User, Swords, Brain, Layers, Medal, TrendingUp, Bolt,
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { RankModal, RANKS } from "./RankModal";

interface ExamAttempt {
    id: number;
    score: number;
    totalQuestions: number;
    difficulty: string | null;
    createdAt: string;
}

interface AchievementData {
    completedAssignments: number;
    totalAssignments: number;
    kuralVisited: boolean;
    yorumVisited: boolean;
    examAttempts: ExamAttempt[];
    loginCount: number;
    isProfileComplete: boolean;
    videoWatchedCount: number;
    allVideosWatched: boolean;
    ruleProgressKuralCount: number;
    ruleProgressYorumCount: number;
    totalKuralCount: number;
    totalYorumCount: number;
    consecutiveCorrect: number;
    highScoreExams: number;
    veryHighScoreExams: number;
    perfectExams: number;
    hardExamCount: number;
    avgScore: number;
    totalQuestionsAnswered: number;
}

interface Achievement {
    id: string;
    title: string;
    description: string;
    detail: string;
    icon: React.ReactNode;
    glowColor: string;
    gradientFrom: string;
    gradientTo: string;
    ringColor: string;
    textColor: string;
    condition: (data: AchievementData) => boolean;
    progress?: (data: AchievementData) => { current: number; max: number };
    xp: number;
    tier: "baslangic" | "gelisim" | "orta" | "ileri" | "uzman" | "master" | "legend";
}

const TIER_LABELS: Record<string, string> = {
    baslangic: "Başlangıç",
    gelisim: "Gelişim",
    orta: "Orta Seviye",
    ileri: "İleri Seviye",
    uzman: "Uzman",
    master: "Master",
    legend: "Legend",
};

const ACHIEVEMENTS: Achievement[] = [
    // BAŞLANGIÇ
    {
        id: "merakli", title: "Meraklı Hakem", description: "İlk kez sisteme giriş yap", detail: "Yolculuk başlıyor!",
        icon: <Star className="w-5 h-5" />, glowColor: "shadow-zinc-400/30", gradientFrom: "from-zinc-400", gradientTo: "to-zinc-500",
        ringColor: "ring-zinc-400/30", textColor: "text-zinc-500", xp: 20, tier: "baslangic",
        condition: (d) => d.loginCount >= 1,
    },
    {
        id: "profil", title: "Profil Oluşturucu", description: "Profilini tamamla", detail: "Kimliğini oluştur",
        icon: <User className="w-5 h-5" />, glowColor: "shadow-blue-400/30", gradientFrom: "from-blue-400", gradientTo: "to-blue-500",
        ringColor: "ring-blue-400/30", textColor: "text-blue-500", xp: 20, tier: "baslangic",
        condition: (d) => d.isProfileComplete,
    },
    {
        id: "kural_oku", title: "Kural Okuyucu", description: "Kural kitabını aç", detail: "Bilgi güçtür",
        icon: <BookOpen className="w-5 h-5" />, glowColor: "shadow-blue-400/40", gradientFrom: "from-blue-400", gradientTo: "to-cyan-500",
        ringColor: "ring-blue-400/30", textColor: "text-blue-500", xp: 30, tier: "baslangic",
        condition: (d) => d.kuralVisited,
    },
    {
        id: "yorum_taki", title: "Yorum Takipçisi", description: "Resmi yorumları incele", detail: "Derinlemesine analiz",
        icon: <Zap className="w-5 h-5" />, glowColor: "shadow-cyan-400/40", gradientFrom: "from-cyan-400", gradientTo: "to-teal-500",
        ringColor: "ring-cyan-400/30", textColor: "text-cyan-500", xp: 30, tier: "baslangic",
        condition: (d) => d.yorumVisited,
    },
    {
        id: "ilk_adim", title: "İlk Adım", description: "İlk görevi tamamla", detail: "Yolculuk ilk adımla başlar",
        icon: <Star className="w-5 h-5" />, glowColor: "shadow-amber-400/40", gradientFrom: "from-amber-400", gradientTo: "to-yellow-500",
        ringColor: "ring-amber-400/30", textColor: "text-amber-500", xp: 50, tier: "baslangic",
        condition: (d) => d.completedAssignments >= 1,
        progress: (d) => ({ current: Math.min(d.completedAssignments, 1), max: 1 }),
    },

    // GELİŞİM
    {
        id: "besgorev", title: "Çalışkan Hakem", description: "5 görev tamamla", detail: "Kararlılık ve azimle ilerle",
        icon: <Flame className="w-5 h-5" />, glowColor: "shadow-orange-400/40", gradientFrom: "from-orange-400", gradientTo: "to-red-500",
        ringColor: "ring-orange-400/30", textColor: "text-orange-500", xp: 150, tier: "gelisim",
        condition: (d) => d.completedAssignments >= 5,
        progress: (d) => ({ current: Math.min(d.completedAssignments, 5), max: 5 }),
    },
    {
        id: "ilk_sinav", title: "Sınav Başlangıcı", description: "İlk sınavını tamamla", detail: "Her uzman bir kez başlar",
        icon: <GraduationCap className="w-5 h-5" />, glowColor: "shadow-violet-400/40", gradientFrom: "from-violet-500", gradientTo: "to-purple-600",
        ringColor: "ring-violet-400/30", textColor: "text-violet-500", xp: 50, tier: "gelisim",
        condition: (d) => d.examAttempts.length >= 1,
        progress: (d) => ({ current: Math.min(d.examAttempts.length, 1), max: 1 }),
    },
    {
        id: "kural_25", title: "Kural Ezbercisi", description: "Kural kitabının %25'ini oku", detail: "Temeli oluştur",
        icon: <BookOpen className="w-5 h-5" />, glowColor: "shadow-emerald-400/30", gradientFrom: "from-emerald-400", gradientTo: "to-green-500",
        ringColor: "ring-emerald-400/30", textColor: "text-emerald-500", xp: 80, tier: "gelisim",
        condition: (d) => d.totalKuralCount > 0 && d.ruleProgressKuralCount / d.totalKuralCount >= 0.25,
        progress: (d) => ({ current: d.ruleProgressKuralCount, max: Math.ceil(d.totalKuralCount * 0.25) }),
    },
    {
        id: "yorum_25", title: "Yorum Okuyucu", description: "Yorum kitabının %25'ini oku", detail: "Derinlere dal",
        icon: <Zap className="w-5 h-5" />, glowColor: "shadow-teal-400/30", gradientFrom: "from-teal-400", gradientTo: "to-cyan-500",
        ringColor: "ring-teal-400/30", textColor: "text-teal-500", xp: 70, tier: "gelisim",
        condition: (d) => d.totalYorumCount > 0 && d.ruleProgressYorumCount / d.totalYorumCount >= 0.25,
        progress: (d) => ({ current: d.ruleProgressYorumCount, max: Math.ceil(d.totalYorumCount * 0.25) }),
    },
    {
        id: "sinav_80", title: "Başarılı Hakem", description: "Bir sınavda %80 veya üzeri al", detail: "Yüksek performansın kanıtı",
        icon: <CheckCircle className="w-5 h-5" />, glowColor: "shadow-emerald-400/40", gradientFrom: "from-emerald-500", gradientTo: "to-green-600",
        ringColor: "ring-emerald-400/30", textColor: "text-emerald-500", xp: 100, tier: "gelisim",
        condition: (d) => d.highScoreExams >= 1,
    },
    {
        id: "uc_sinav", title: "Denemeci", description: "3 sınav tamamla", detail: "Sürekli gelişim",
        icon: <Star className="w-5 h-5" />, glowColor: "shadow-indigo-400/40", gradientFrom: "from-indigo-500", gradientTo: "to-blue-600",
        ringColor: "ring-indigo-400/30", textColor: "text-indigo-500", xp: 150, tier: "gelisim",
        condition: (d) => d.examAttempts.length >= 3,
        progress: (d) => ({ current: Math.min(d.examAttempts.length, 3), max: 3 }),
    },
    {
        id: "eksiksiz", title: "Eksiksiz Hakem", description: "Tüm ödevleri tamamla", detail: "Mükemmelliğin zirvesi",
        icon: <Target className="w-5 h-5" />, glowColor: "shadow-rose-400/40", gradientFrom: "from-rose-500", gradientTo: "to-pink-600",
        ringColor: "ring-rose-400/30", textColor: "text-rose-500", xp: 200, tier: "gelisim",
        condition: (d) => d.totalAssignments > 0 && d.completedAssignments === d.totalAssignments,
        progress: (d) => ({ current: d.completedAssignments, max: Math.max(d.totalAssignments, 1) }),
    },

    // ORTA SEVİYE
    {
        id: "ongorev", title: "Kural Ustası", description: "10 görev tamamla", detail: "Uzmanlık deneyimle gelir",
        icon: <Award className="w-5 h-5" />, glowColor: "shadow-purple-400/40", gradientFrom: "from-purple-500", gradientTo: "to-indigo-600",
        ringColor: "ring-purple-400/30", textColor: "text-purple-500", xp: 300, tier: "orta",
        condition: (d) => d.completedAssignments >= 10,
        progress: (d) => ({ current: Math.min(d.completedAssignments, 10), max: 10 }),
    },
    {
        id: "on_soru", title: "Soru Çözücü", description: "200+ soru çöz (10 sınav)", detail: "Pratik mükemmelleştirir",
        icon: <Brain className="w-5 h-5" />, glowColor: "shadow-sky-400/30", gradientFrom: "from-sky-400", gradientTo: "to-blue-500",
        ringColor: "ring-sky-400/30", textColor: "text-sky-500", xp: 120, tier: "orta",
        condition: (d) => d.totalQuestionsAnswered >= 200,
        progress: (d) => ({ current: Math.min(d.totalQuestionsAnswered, 200), max: 200 }),
    },
    {
        id: "zor_yol", title: "Zorlu Yolu Seçen", description: "Zor seviyede sınav tamamla", detail: "Güçlükle büyürsün",
        icon: <Trophy className="w-5 h-5" />, glowColor: "shadow-red-400/40", gradientFrom: "from-red-500", gradientTo: "to-rose-600",
        ringColor: "ring-red-400/30", textColor: "text-red-500", xp: 200, tier: "orta",
        condition: (d) => d.hardExamCount >= 1,
    },
    {
        id: "video_ilk", title: "Video İzleyici", description: "5 eğitim videosu izle", detail: "Görsel öğrenme",
        icon: <Video className="w-5 h-5" />, glowColor: "shadow-pink-400/30", gradientFrom: "from-pink-400", gradientTo: "to-rose-500",
        ringColor: "ring-pink-400/30", textColor: "text-pink-500", xp: 120, tier: "orta",
        condition: (d) => d.videoWatchedCount >= 5,
        progress: (d) => ({ current: Math.min(d.videoWatchedCount, 5), max: 5 }),
    },
    {
        id: "ardisik10", title: "Hatasız Seri", description: "Bir sınavda 10 ardışık doğru", detail: "Konsantrasyon ve bilgi",
        icon: <TrendingUp className="w-5 h-5" />, glowColor: "shadow-amber-400/30", gradientFrom: "from-amber-400", gradientTo: "to-orange-500",
        ringColor: "ring-amber-400/30", textColor: "text-amber-500", xp: 250, tier: "orta",
        condition: (d) => d.consecutiveCorrect >= 10,
        progress: (d) => ({ current: Math.min(d.consecutiveCorrect, 10), max: 10 }),
    },
    {
        id: "bes_sinav_ort", title: "Tutarlı Performans", description: "5 sınav ortalama %75+", detail: "İstikrarın gücü",
        icon: <Medal className="w-5 h-5" />, glowColor: "shadow-teal-400/30", gradientFrom: "from-teal-500", gradientTo: "to-green-600",
        ringColor: "ring-teal-400/30", textColor: "text-teal-500", xp: 350, tier: "orta",
        condition: (d) => d.examAttempts.length >= 5 && d.avgScore >= 75,
        progress: (d) => ({ current: Math.min(d.examAttempts.length, 5), max: 5 }),
    },

    // İLERİ SEVİYE
    {
        id: "sinav_90", title: "%90 Kulübü", description: "Bir sınavda %90+ skor al", detail: "Neredeyse kusursuz",
        icon: <Crown className="w-5 h-5" />, glowColor: "shadow-amber-400/40", gradientFrom: "from-amber-400", gradientTo: "to-yellow-300",
        ringColor: "ring-amber-400/30", textColor: "text-amber-500", xp: 400, tier: "ileri",
        condition: (d) => d.veryHighScoreExams >= 1,
    },
    {
        id: "kural_75", title: "Kural Hafızı", description: "Kural kitabının %75'ini oku", detail: "Derin bilgi",
        icon: <Layers className="w-5 h-5" />, glowColor: "shadow-indigo-400/40", gradientFrom: "from-indigo-500", gradientTo: "to-violet-600",
        ringColor: "ring-indigo-400/30", textColor: "text-indigo-500", xp: 400, tier: "ileri",
        condition: (d) => d.totalKuralCount > 0 && d.ruleProgressKuralCount / d.totalKuralCount >= 0.75,
        progress: (d) => ({ current: d.ruleProgressKuralCount, max: Math.ceil(d.totalKuralCount * 0.75) }),
    },
    {
        id: "ardisik20", title: "Hata Yok", description: "Bir sınavda 0 hata (20 soru)", detail: "Mükemmel kontrol",
        icon: <Swords className="w-5 h-5" />, glowColor: "shadow-rose-400/40", gradientFrom: "from-rose-500", gradientTo: "to-red-600",
        ringColor: "ring-rose-400/30", textColor: "text-rose-500", xp: 500, tier: "ileri",
        condition: (d) => d.perfectExams >= 1,
    },
    {
        id: "on_sinav", title: "Elit Hakem", description: "10 sınav tamamla", detail: "Azimle zirveye",
        icon: <Trophy className="w-5 h-5" />, glowColor: "shadow-violet-400/40", gradientFrom: "from-violet-500", gradientTo: "to-purple-600",
        ringColor: "ring-violet-400/30", textColor: "text-violet-500", xp: 500, tier: "ileri",
        condition: (d) => d.examAttempts.length >= 10,
        progress: (d) => ({ current: Math.min(d.examAttempts.length, 10), max: 10 }),
    },
    {
        id: "bes_kural_zor", title: "Kural Avcısı", description: "5 zor seviye sınav tamamla", detail: "Zorlu sorular korkutmaz",
        icon: <Swords className="w-5 h-5" />, glowColor: "shadow-red-400/40", gradientFrom: "from-red-600", gradientTo: "to-rose-500",
        ringColor: "ring-red-400/30", textColor: "text-red-500", xp: 200, tier: "ileri",
        condition: (d) => d.hardExamCount >= 5,
        progress: (d) => ({ current: Math.min(d.hardExamCount, 5), max: 5 }),
    },
    {
        id: "elli_hiz", title: "Hakem Refleksi", description: "1000+ soru çöz", detail: "Refleks ve bilgi birleşiyor",
        icon: <Bolt className="w-5 h-5" />, glowColor: "shadow-yellow-400/40", gradientFrom: "from-yellow-400", gradientTo: "to-amber-500",
        ringColor: "ring-yellow-400/30", textColor: "text-yellow-600", xp: 300, tier: "ileri",
        condition: (d) => d.totalQuestionsAnswered >= 1000,
        progress: (d) => ({ current: Math.min(d.totalQuestionsAnswered, 1000), max: 1000 }),
    },
    {
        id: "yirmi_gorev", title: "Kural Ustası Pro", description: "20 görev tamamla", detail: "Üst seviye bağlılık",
        icon: <Award className="w-5 h-5" />, glowColor: "shadow-purple-400/40", gradientFrom: "from-purple-600", gradientTo: "to-violet-700",
        ringColor: "ring-purple-400/30", textColor: "text-purple-600", xp: 500, tier: "ileri",
        condition: (d) => d.completedAssignments >= 20,
        progress: (d) => ({ current: Math.min(d.completedAssignments, 20), max: 20 }),
    },

    // UZMAN SEVİYE
    {
        id: "sinav_100", title: "Mükemmel Skor", description: "Bir sınavda %100 başarı", detail: "Hata yapmak diye bir şey yok",
        icon: <Crown className="w-5 h-5" />, glowColor: "shadow-amber-400/50", gradientFrom: "from-amber-300", gradientTo: "to-yellow-200",
        ringColor: "ring-amber-400/40", textColor: "text-amber-500", xp: 1000, tier: "uzman",
        condition: (d) => d.perfectExams >= 1,
    },
    {
        id: "kural_100", title: "Kural Kitabı Ustası", description: "Kural kitabını %100 tamamla", detail: "Tüm kurallar parmak ucunda",
        icon: <BookOpen className="w-5 h-5" />, glowColor: "shadow-emerald-400/50", gradientFrom: "from-emerald-400", gradientTo: "to-teal-400",
        ringColor: "ring-emerald-400/40", textColor: "text-emerald-500", xp: 600, tier: "uzman",
        condition: (d) => d.totalKuralCount > 0 && d.ruleProgressKuralCount >= d.totalKuralCount,
        progress: (d) => ({ current: d.ruleProgressKuralCount, max: d.totalKuralCount }),
    },
    {
        id: "bes_zor", title: "Turnuva Hazır", description: "5 zor sınav tamamla", detail: "Turnuva seviyesinde hazırsın",
        icon: <Trophy className="w-5 h-5" />, glowColor: "shadow-red-400/50", gradientFrom: "from-red-500", gradientTo: "to-orange-500",
        ringColor: "ring-red-400/40", textColor: "text-red-500", xp: 600, tier: "uzman",
        condition: (d) => d.hardExamCount >= 5,
        progress: (d) => ({ current: Math.min(d.hardExamCount, 5), max: 5 }),
    },
    {
        id: "yuz_soru", title: "Analizci Hakem", description: "2000+ soru çöz", detail: "Analitik zihin",
        icon: <Brain className="w-5 h-5" />, glowColor: "shadow-sky-400/40", gradientFrom: "from-sky-500", gradientTo: "to-indigo-500",
        ringColor: "ring-sky-400/30", textColor: "text-sky-500", xp: 200, tier: "uzman",
        condition: (d) => d.totalQuestionsAnswered >= 2000,
        progress: (d) => ({ current: Math.min(d.totalQuestionsAnswered, 2000), max: 2000 }),
    },
    {
        id: "video_usta", title: "Video Ustası", description: "Tüm eğitim videolarını izle", detail: "Her görsel bir ders",
        icon: <Video className="w-5 h-5" />, glowColor: "shadow-pink-400/40", gradientFrom: "from-pink-500", gradientTo: "to-rose-500",
        ringColor: "ring-pink-400/30", textColor: "text-pink-500", xp: 300, tier: "uzman",
        condition: (d) => d.allVideosWatched,
        progress: (d) => ({ current: d.videoWatchedCount, max: d.videoWatchedCount > 0 ? d.videoWatchedCount : 1 }),
    },
    {
        id: "besyirmi_sinav", title: "Hakem Efsanesi", description: "25 sınav tamamla", detail: "Efsaneler bu yoldan geçer",
        icon: <Gem className="w-5 h-5" />, glowColor: "shadow-violet-400/50", gradientFrom: "from-violet-500", gradientTo: "to-indigo-600",
        ringColor: "ring-violet-400/40", textColor: "text-violet-500", xp: 1000, tier: "uzman",
        condition: (d) => d.examAttempts.length >= 25,
        progress: (d) => ({ current: Math.min(d.examAttempts.length, 25), max: 25 }),
    },

    // MASTER SEVİYE
    {
        id: "uc_mukemmel", title: "Kusursuz Hakem", description: "3 sınavda %100 başarı", detail: "Kusursuzluk bir alışkanlık",
        icon: <Crown className="w-5 h-5" />, glowColor: "shadow-amber-400/60", gradientFrom: "from-amber-400", gradientTo: "to-yellow-300",
        ringColor: "ring-amber-400/50", textColor: "text-amber-500", xp: 2000, tier: "master",
        condition: (d) => d.perfectExams >= 3,
        progress: (d) => ({ current: Math.min(d.perfectExams, 3), max: 3 }),
    },
    {
        id: "ardisik50", title: "Hata Kabul Etmeyen", description: "50 ardışık doğru cevap", detail: "Seri kırılmaz",
        icon: <Flame className="w-5 h-5" />, glowColor: "shadow-orange-400/50", gradientFrom: "from-orange-500", gradientTo: "to-red-500",
        ringColor: "ring-orange-400/40", textColor: "text-orange-500", xp: 1500, tier: "master",
        condition: (d) => d.consecutiveCorrect >= 50,
        progress: (d) => ({ current: Math.min(d.consecutiveCorrect, 50), max: 50 }),
    },
    {
        id: "bin_soru", title: "Efsanevi Öğrenci", description: "1000 soru çöz (birden fazla sınavla)", detail: "Bilginin sınırı yok",
        icon: <Brain className="w-5 h-5" />, glowColor: "shadow-indigo-400/50", gradientFrom: "from-indigo-500", gradientTo: "to-purple-600",
        ringColor: "ring-indigo-400/40", textColor: "text-indigo-500", xp: 2000, tier: "master",
        condition: (d) => d.totalQuestionsAnswered >= 1000,
        progress: (d) => ({ current: Math.min(d.totalQuestionsAnswered, 1000), max: 1000 }),
    },
    {
        id: "besyirmi_gorev", title: "İnsanüstü Hakem", description: "40 görev tamamla", detail: "İnsanüstü bir azim",
        icon: <Swords className="w-5 h-5" />, glowColor: "shadow-rose-400/50", gradientFrom: "from-rose-500", gradientTo: "to-pink-600",
        ringColor: "ring-rose-400/40", textColor: "text-rose-500", xp: 1000, tier: "master",
        condition: (d) => d.completedAssignments >= 40,
        progress: (d) => ({ current: Math.min(d.completedAssignments, 40), max: 40 }),
    },
    {
        id: "final_boss", title: "Final Boss", description: "Zor sınav + %100 başarı", detail: "Son engeli aş",
        icon: <Swords className="w-5 h-5" />, glowColor: "shadow-red-400/60", gradientFrom: "from-red-600", gradientTo: "to-rose-700",
        ringColor: "ring-red-400/50", textColor: "text-red-500", xp: 2000, tier: "master",
        condition: (d) => d.hardExamCount >= 1 && d.perfectExams >= 1,
    },

    // LEGEND
    {
        id: "bks_sampiyonu", title: "BKS Şampiyonu", description: "Başarıların %80'ini tamamla", detail: "Şampiyonlar burada",
        icon: <Trophy className="w-5 h-5" />, glowColor: "shadow-amber-400/60", gradientFrom: "from-amber-400", gradientTo: "to-rose-500",
        ringColor: "ring-amber-400/50", textColor: "text-amber-500", xp: 2500, tier: "legend",
        condition: () => false, // runtime'da hesaplanır
    },
    {
        id: "sistemin_efendisi", title: "Sistemin Efendisi", description: "Tüm modülleri bitir", detail: "Tam hakimiyet",
        icon: <Crown className="w-5 h-5" />, glowColor: "shadow-violet-400/60", gradientFrom: "from-violet-600", gradientTo: "to-purple-700",
        ringColor: "ring-violet-400/50", textColor: "text-violet-500", xp: 3000, tier: "legend",
        condition: (d) =>
            d.totalKuralCount > 0 &&
            d.ruleProgressKuralCount >= d.totalKuralCount &&
            d.allVideosWatched &&
            d.examAttempts.length >= 10,
    },
    {
        id: "ultimate_master", title: "Ultimate Master", description: "Tüm sınavları tamamla + kural + video", detail: "En üst seviye",
        icon: <Gem className="w-5 h-5" />, glowColor: "shadow-sky-400/60", gradientFrom: "from-sky-400", gradientTo: "to-indigo-500",
        ringColor: "ring-sky-400/50", textColor: "text-sky-500", xp: 4000, tier: "legend",
        condition: (d) =>
            d.totalKuralCount > 0 &&
            d.ruleProgressKuralCount >= d.totalKuralCount &&
            d.allVideosWatched &&
            d.examAttempts.length >= 10,
    },
];

const TOTAL_NON_LEGEND = ACHIEVEMENTS.filter((a) => a.tier !== "legend").length;

function computeAchievements(data: AchievementData) {
    const base = ACHIEVEMENTS.map((a) => {
        if (a.id === "bks_sampiyonu") {
            const earnedCount = ACHIEVEMENTS.filter((x) => x.id !== "bks_sampiyonu" && x.condition(data)).length;
            return { ...a, condition: () => earnedCount >= Math.ceil(TOTAL_NON_LEGEND * 0.8) };
        }
        return a;
    });
    return base;
}

function getRankData(xp: number) {
    let current = RANKS[0];
    for (const r of RANKS) {
        if (xp >= r.minXP) current = r;
    }
    const idx = RANKS.indexOf(current);
    return { rank: current, nextRank: RANKS[idx + 1] ?? null };
}

function CircularProgress({ percent, size = 80, stroke = 7, gradient }: { percent: number; size?: number; stroke?: number; gradient: string }) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (percent / 100) * circ;
    const gradId = `grad-${Math.round(percent)}-${size}`;
    const c1 = gradient.includes("amber") ? "#f59e0b" : gradient.includes("teal") ? "#2dd4bf" : gradient.includes("sky") ? "#38bdf8" : gradient.includes("violet") ? "#8b5cf6" : gradient.includes("rose") ? "#f43f5e" : "#71717a";
    const c2 = gradient.includes("amber") ? "#fbbf24" : gradient.includes("teal") ? "#67e8f9" : gradient.includes("sky") ? "#818cf8" : gradient.includes("violet") ? "#a78bfa" : gradient.includes("rose") ? "#fb923c" : "#a1a1aa";
    return (
        <svg width={size} height={size} className="-rotate-90">
            <defs>
                <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={c1} />
                    <stop offset="100%" stopColor={c2} />
                </linearGradient>
            </defs>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-zinc-200 dark:text-zinc-700" />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${gradId})`} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 1s ease" }} />
        </svg>
    );
}

function AchievementCard({ achievement, earned, data }: { achievement: Achievement; earned: boolean; data: AchievementData }) {
    const prog = achievement.progress ? achievement.progress(data) : null;
    const progPct = prog ? Math.round((prog.current / prog.max) * 100) : (earned ? 100 : 0);

    if (!earned) {
        return (
            <div className="relative group rounded-2xl border border-zinc-200 dark:border-zinc-700/60 bg-zinc-50 dark:bg-zinc-800/40 p-4 flex flex-col gap-3 overflow-hidden">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,rgba(0,0,0,0.015)_8px,rgba(0,0,0,0.015)_9px)] pointer-events-none" />
                <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0">
                        <Lock className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 truncate">{achievement.title}</p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-600 mt-0.5 line-clamp-2">{achievement.description}</p>
                    </div>
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500 flex-shrink-0">+{achievement.xp} XP</span>
                </div>
                {prog && (
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className="text-[9px] text-zinc-400 font-medium">{prog.current}/{prog.max}</span>
                            <span className="text-[9px] text-zinc-400">{progPct}%</span>
                        </div>
                        <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                            <div className="h-full bg-zinc-400 dark:bg-zinc-600 rounded-full transition-all duration-700" style={{ width: `${progPct}%` }} />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`relative group rounded-2xl border border-transparent bg-white dark:bg-zinc-900 p-4 flex flex-col gap-3 overflow-hidden shadow-lg ${achievement.glowColor} ring-2 ${achievement.ringColor} transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${achievement.gradientFrom} ${achievement.gradientTo} opacity-[0.04] pointer-events-none`} />
            <div className="flex items-start gap-3">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${achievement.gradientFrom} ${achievement.gradientTo} flex items-center justify-center flex-shrink-0 shadow-md`}>
                    <span className="text-white">{achievement.icon}</span>
                </div>
                <div className="min-w-0 flex-1">
                    <p className={`text-xs font-black truncate ${achievement.textColor}`}>{achievement.title}</p>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">{achievement.detail}</p>
                </div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r ${achievement.gradientFrom} ${achievement.gradientTo} text-white flex-shrink-0 shadow-sm`}>+{achievement.xp} XP</span>
            </div>
            <div>
                <div className="flex justify-between mb-1">
                    <span className={`text-[9px] font-bold ${achievement.textColor}`}>Tamamlandı</span>
                    <span className={`text-[9px] font-bold ${achievement.textColor}`}>100%</span>
                </div>
                <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${achievement.gradientFrom} ${achievement.gradientTo} rounded-full`} style={{ width: "100%" }} />
                </div>
            </div>
        </div>
    );
}

function getScoreStyle(score: number, total: number) {
    const pct = (score / total) * 100;
    if (pct >= 80) return { text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", icon: <CheckCircle className="w-3.5 h-3.5" /> };
    if (pct >= 60) return { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", icon: <CheckCircle className="w-3.5 h-3.5" /> };
    return { text: "text-red-600 dark:text-red-400", bg: "bg-red-500/10", icon: <XCircle className="w-3.5 h-3.5" /> };
}

function ExamHistorySection({ attempts }: { attempts: ExamAttempt[] }) {
    const shown = attempts.slice(0, 5);
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden mt-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                        <GraduationCap className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-zinc-900 dark:text-white">Sınav Geçmişim</h3>
                        <p className="text-[10px] text-zinc-400">{attempts.length} sınav tamamlandı</p>
                    </div>
                </div>
                {attempts.length > 0 && (
                    <Link href="/referee/results" className="flex items-center gap-1 text-[11px] font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 transition-colors">
                        Tümünü Gör <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                )}
            </div>
            {attempts.length === 0 ? (
                <div className="flex flex-col items-center py-10 px-5 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 flex items-center justify-center mb-3">
                        <GraduationCap className="w-7 h-7 text-violet-400" />
                    </div>
                    <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400 mb-1">Henüz sınava girmedin</p>
                    <p className="text-[11px] text-zinc-400 mb-4">Sınava girerek başarı rozetleri kazan.</p>
                    <Link href="/referee/bag/questions" className="px-4 py-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold hover:opacity-90 transition-opacity shadow-sm">
                        Sınava Gir
                    </Link>
                </div>
            ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {shown.map((attempt) => {
                        const pct = Math.round((attempt.score / attempt.totalQuestions) * 100);
                        const style = getScoreStyle(attempt.score, attempt.totalQuestions);
                        return (
                            <div key={attempt.id} className="flex items-center gap-3 px-5 py-3">
                                <div className={`w-8 h-8 rounded-lg ${style.bg} flex items-center justify-center flex-shrink-0 ${style.text}`}>{style.icon}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-sm font-black ${style.text}`}>{attempt.score}/{attempt.totalQuestions}</span>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${style.bg} ${style.text}`}>%{pct}</span>
                                        {attempt.difficulty && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500">{attempt.difficulty}</span>}
                                    </div>
                                    <p className="text-[10px] text-zinc-400 mt-0.5">{format(new Date(attempt.createdAt), "d MMM yyyy, HH:mm", { locale: tr })}</p>
                                </div>
                            </div>
                        );
                    })}
                    {attempts.length > 5 && (
                        <div className="px-5 py-3 text-center">
                            <Link href="/referee/results" className="text-[11px] font-bold text-violet-500 hover:text-violet-600 transition-colors">
                                +{attempts.length - 5} sınav daha → Tümünü Gör
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export function AchievementsSection() {
    const [data, setData] = useState<AchievementData>({
        completedAssignments: 0, totalAssignments: 0, kuralVisited: false, yorumVisited: false,
        examAttempts: [], loginCount: 0, isProfileComplete: false, videoWatchedCount: 0,
        allVideosWatched: false, ruleProgressKuralCount: 0, ruleProgressYorumCount: 0,
        totalKuralCount: 0, totalYorumCount: 0, consecutiveCorrect: 0, highScoreExams: 0,
        veryHighScoreExams: 0, perfectExams: 0, hardExamCount: 0, avgScore: 0, totalQuestionsAnswered: 0,
    });
    const [loading, setLoading] = useState(true);
    const [showRankModal, setShowRankModal] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("all");

    useEffect(() => {
        fetch("/api/user/achievement-data")
            .then((r) => r.json())
            .then((d) => { setData(d); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const achievements = computeAchievements(data);
    const earned = achievements.filter((a) => a.condition(data));
    const locked = achievements.filter((a) => !a.condition(data));
    const totalXP = earned.reduce((sum, a) => sum + a.xp, 0);
    const maxXP = achievements.reduce((sum, a) => sum + a.xp, 0);
    const xpPercent = maxXP > 0 ? Math.round((totalXP / maxXP) * 100) : 0;
    const { rank: currentRank, nextRank } = getRankData(totalXP);

    const xpInRank = totalXP - currentRank.minXP;
    const rankRange = nextRank ? nextRank.minXP - currentRank.minXP : 1000;
    const rankPct = Math.min(100, Math.round((xpInRank / rankRange) * 100));

    const tiers = Array.from(new Set(achievements.map((a) => a.tier)));

    const filteredEarned = activeTab === "all" ? earned : earned.filter((a) => a.tier === activeTab);
    const filteredLocked = activeTab === "all" ? locked : locked.filter((a) => a.tier === activeTab);

    if (loading) {
        return (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 animate-pulse">
                <div className="flex gap-4 mb-6">
                    <div className="w-20 h-20 bg-zinc-200 dark:bg-zinc-700 rounded-full" />
                    <div className="flex-1 space-y-2 pt-2">
                        <div className="h-4 w-28 bg-zinc-200 dark:bg-zinc-700 rounded" />
                        <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-700 rounded" />
                        <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full mt-3" />
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-zinc-100 dark:bg-zinc-800 rounded-2xl" />)}
                </div>
            </div>
        );
    }

    return (
        <>
            {showRankModal && (
                <RankModal
                    currentXP={totalXP}
                    currentRank={currentRank.name}
                    onClose={() => setShowRankModal(false)}
                />
            )}

            <div>
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    {/* Hero Header */}
                    <div className="relative px-6 py-6 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-amber-950/20 pointer-events-none" />
                        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-amber-100/60 to-transparent dark:from-amber-900/10 rounded-bl-full pointer-events-none" />

                        <div className="relative flex items-center gap-5">
                            <div className="relative flex-shrink-0">
                                <CircularProgress percent={xpPercent} size={84} stroke={7} gradient={currentRank.gradient} />
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 leading-none">{totalXP}</span>
                                    <span className="text-[8px] text-zinc-400 leading-none mt-0.5">XP</span>
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                    <button
                                        onClick={() => setShowRankModal(true)}
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r ${currentRank.gradient} shadow-sm hover:opacity-90 transition-opacity cursor-pointer`}
                                        title="Rank sistemini görüntüle"
                                    >
                                        <span className="text-white scale-75">{currentRank.icon}</span>
                                        <span className="text-[10px] font-black text-white tracking-wide">{currentRank.name}</span>
                                    </button>
                                    <span className="text-xs text-zinc-400 font-medium">{earned.length}/{achievements.length} rozet</span>
                                </div>
                                <h3 className="text-base font-black text-zinc-900 dark:text-white leading-tight">Başarılarım</h3>

                                {nextRank && (
                                    <div className="mt-2">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-[9px] text-zinc-400 font-medium">{currentRank.name} → {nextRank.name}</span>
                                            <span className="text-[9px] text-zinc-400">{xpInRank}/{rankRange} XP</span>
                                        </div>
                                        <div className="h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                                            <div className={`h-full bg-gradient-to-r ${currentRank.gradient} rounded-full transition-all duration-1000`} style={{ width: `${rankPct}%` }} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex-shrink-0 text-right">
                                <div className="text-2xl font-black text-amber-500 leading-none">{totalXP}</div>
                                <div className="text-[9px] text-zinc-400 font-medium mt-0.5">/ {maxXP} XP</div>
                            </div>
                        </div>

                        {/* Rank görüntüle butonu */}
                        <div className="relative mt-3">
                            <button
                                onClick={() => setShowRankModal(true)}
                                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-white/70 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/40 text-[11px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                            >
                                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                                Rank Sistemini Görüntüle
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    <div className="border-t border-zinc-100 dark:border-zinc-800" />

                    {/* Tier Filtreleri */}
                    <div className="px-5 pt-4 pb-2 flex gap-2 overflow-x-auto modern-scrollbar">
                        <button
                            onClick={() => setActiveTab("all")}
                            className={`flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-black transition-all ${activeTab === "all" ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}
                        >
                            Tümü ({achievements.length})
                        </button>
                        {tiers.map((tier) => {
                            const count = achievements.filter((a) => a.tier === tier && a.condition(data)).length;
                            const total = achievements.filter((a) => a.tier === tier).length;
                            return (
                                <button
                                    key={tier}
                                    onClick={() => setActiveTab(tier)}
                                    className={`flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-black transition-all ${activeTab === tier ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}
                                >
                                    {TIER_LABELS[tier]} ({count}/{total})
                                </button>
                            );
                        })}
                    </div>

                    {/* Achievement Grid */}
                    <div className="p-5 pt-3">
                        {filteredEarned.length > 0 && (
                            <div className="mb-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
                                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-2">Kazanıldı ({filteredEarned.length})</span>
                                    <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {filteredEarned.map((a) => <AchievementCard key={a.id} achievement={a} earned data={data} />)}
                                </div>
                            </div>
                        )}

                        {filteredLocked.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
                                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest px-2">Kilitli ({filteredLocked.length})</span>
                                    <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {filteredLocked.map((a) => <AchievementCard key={a.id} achievement={a} earned={false} data={data} />)}
                                </div>
                            </div>
                        )}

                        {filteredEarned.length === 0 && filteredLocked.length === 0 && (
                            <div className="text-center py-8 text-zinc-400 text-sm">Bu kategoride rozet bulunamadı.</div>
                        )}
                    </div>
                </div>

                <ExamHistorySection attempts={data.examAttempts} />
            </div>
        </>
    );
}
