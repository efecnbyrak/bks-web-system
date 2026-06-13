"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getUserSecurityQuestion, resetPasswordWithSecurityQuestion, resetPasswordWithRecoveryCode } from "@/app/actions/auth";
import { Shield, Key, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Fingerprint, Eye, EyeOff, Mail, Clock, Info } from "lucide-react";
import Link from "next/link";

type Method = "NONE" | "RECOVERY_CODE" | "SECURITY_QUESTION" | "CONTACT";
type Step = "CHOOSE" | "IDENTIFY_SQ" | "SECURITY_QUESTION" | "RECOVERY_CODE_FORM" | "SUCCESS" | "CONTACT_FORM" | "CONTACT_SUCCESS";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>("CHOOSE");
    
    // Shared State
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Feature Specific State
    const [recoveryCode, setRecoveryCode] = useState("");
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [contactEmail, setContactEmail] = useState("");

    const handleIdentifySQ = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        
        const res = await getUserSecurityQuestion(identifier);
        
        if (res.success && res.question) {
            setQuestion(res.question);
            setStep("SECURITY_QUESTION");
        } else {
            setError(res.error || "Güvenlik sorusu alınamadı.");
        }
        setIsLoading(false);
    };

    const handleSQSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const formData = new FormData();
        formData.append("identifier", identifier);
        formData.append("answer", answer);
        formData.append("password", password);
        formData.append("passwordConfirm", passwordConfirm);

        const res = await resetPasswordWithSecurityQuestion({ success: false }, formData);
        if (res.success) {
            setStep("SUCCESS");
            setTimeout(() => {
                router.push("/");
            }, 3000);
        } else {
            setError(res.error || "Şifre güncellenemedi.");
        }
        setIsLoading(false);
    };

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const res = await fetch("/api/tickets/guest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: contactEmail }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setStep("CONTACT_SUCCESS");
            } else {
                setError(data.error || "Bir hata oluştu. Lütfen tekrar deneyin.");
            }
        } catch {
            setError("Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.");
        }

        setIsLoading(false);
    };

    const handleRofSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const formData = new FormData();
        formData.append("identifier", identifier);
        formData.append("recoveryCode", recoveryCode);
        formData.append("password", password);
        formData.append("passwordConfirm", passwordConfirm);

        const res = await resetPasswordWithRecoveryCode({ success: false }, formData);
        if (res.success) {
            setStep("SUCCESS");
            setTimeout(() => {
                router.push("/");
            }, 3000);
        } else {
            setError(res.error || "Şifre güncellenemedi.");
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-red-700 rounded-2xl mx-auto flex items-center justify-center shadow-xl shadow-red-900/40 mb-6 transition-all group hover:scale-105">
                        <Key className="w-8 h-8 text-white group-hover:rotate-12 transition-transform" />
                    </div>
                    <h1 className="text-2xl font-bold text-white uppercase tracking-tight">Şifremi Unuttum</h1>
                    <p className="text-zinc-500 text-sm mt-2">Hesabınızı kurtarmak için bir yöntem seçin.</p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    
                    {step === "CHOOSE" && (
                        <div className="space-y-4">
                            <button
                                onClick={() => setStep("RECOVERY_CODE_FORM")}
                                className="w-full relative overflow-hidden bg-zinc-950 border-2 border-red-900/50 hover:border-red-600 rounded-2xl p-6 transition-all group flex flex-col items-center gap-3"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <Fingerprint className="w-8 h-8 text-red-500" />
                                <div className="text-center">
                                    <h3 className="text-white font-bold text-lg">Kurtarma Kodu İle Sıfırla</h3>
                                    <p className="text-red-500/80 text-xs mt-1 font-semibold tracking-widest uppercase">En Güvenli & Önerilen</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setStep("IDENTIFY_SQ")}
                                className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-6 transition-all group flex flex-col items-center gap-3"
                            >
                                <Shield className="w-8 h-8 text-zinc-500 group-hover:text-white transition-colors" />
                                <div className="text-center">
                                    <h3 className="text-zinc-400 group-hover:text-white font-bold text-lg transition-colors">Güvenlik Sorusu İle Sıfırla</h3>
                                    <p className="text-zinc-600 text-xs mt-1">Klasik Kurtarma</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setStep("CONTACT_FORM")}
                                className="w-full relative overflow-hidden bg-zinc-950 border border-indigo-900/40 hover:border-indigo-500/60 rounded-2xl p-6 transition-all group flex flex-col items-center gap-3"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <Mail className="w-8 h-8 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                                <div className="text-center">
                                    <h3 className="text-zinc-400 group-hover:text-white font-bold text-lg transition-colors">Bizimle İletişime Geçin</h3>
                                    <p className="text-zinc-600 text-xs mt-1">E-posta ile destek talebi</p>
                                </div>
                            </button>
                        </div>
                    )}

                    {step === "RECOVERY_CODE_FORM" && (
                        <form onSubmit={handleRofSubmit} className="space-y-5">
                            <div className="text-center mb-6 border-b border-zinc-800 pb-4">
                                <h2 className="text-white font-bold text-lg">Kurtarma Kodu</h2>
                                <p className="text-red-500 text-xs mt-1">Lütfen 8 haneli kurtarma kodunuzu girin.</p>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-900/20 border border-red-900/30 text-red-500 text-xs rounded-xl flex items-center gap-3 mb-4">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Kullanıcı Adı veya E-posta</label>
                                <input
                                    type="text"
                                    required
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none transition-all"
                                    placeholder="Hesabınızı tanımlayın"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">8 Haneli Kurtarma Kodu</label>
                                <input
                                    type="text"
                                    required
                                    value={recoveryCode}
                                    onChange={(e) => setRecoveryCode(e.target.value)}
                                    className="w-full bg-zinc-950 border border-red-900/40 text-red-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none transition-all tracking-[0.2em] uppercase font-black placeholder:font-normal placeholder:lowercase placeholder:tracking-normal"
                                    placeholder="Örn: 8F3K-92LD"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Yeni Şifre</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 pr-12 py-3 focus:ring-2 focus:ring-red-600 outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                    <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors" tabIndex={-1}>
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Yeni Şifre Tekrar</label>
                                <div className="relative">
                                    <input
                                        type={showPasswordConfirm ? "text" : "password"}
                                        required
                                        value={passwordConfirm}
                                        onChange={(e) => setPasswordConfirm(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 pr-12 py-3 focus:ring-2 focus:ring-red-600 outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                    <button type="button" onClick={() => setShowPasswordConfirm(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors" tabIndex={-1}>
                                        {showPasswordConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : "Şifreyi Güncelle"}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep("CHOOSE")}
                                className="w-full text-zinc-600 hover:text-zinc-400 text-xs font-bold transition-colors uppercase tracking-widest"
                            >
                                Geri Dön
                            </button>
                        </form>
                    )}

                    {step === "IDENTIFY_SQ" && (
                        <form onSubmit={handleIdentifySQ} className="space-y-6">
                            <div className="text-center mb-6 border-b border-zinc-800 pb-4">
                                <h2 className="text-white font-bold text-lg">Güvenlik Sorusu</h2>
                                <p className="text-zinc-500 text-xs mt-1">Önce hesabınızı bulalım.</p>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-900/20 border border-red-900/30 text-red-500 text-xs rounded-xl flex items-center gap-3 mb-4">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Kullanıcı Adı veya E-posta</label>
                                <input
                                    type="text"
                                    required
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-4 focus:ring-2 focus:ring-red-600 outline-none transition-all"
                                    placeholder="Hesabınızı tanımlayın"
                                    autoFocus
                                />
                            </div>
                            
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : "Devam Et"}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep("CHOOSE")}
                                className="w-full text-zinc-600 hover:text-zinc-400 text-xs font-bold transition-colors uppercase tracking-widest mt-4"
                            >
                                Geri Dön
                            </button>
                        </form>
                    )}

                    {step === "SECURITY_QUESTION" && (
                        <form onSubmit={handleSQSubmit} className="space-y-5">
                            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
                                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Güvenlik Sorunuz</label>
                                <div className="text-white font-bold text-sm italic">"{question}"</div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-900/20 border border-red-900/30 text-red-500 text-xs rounded-xl flex items-center gap-3 font-bold">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Cevabınız</label>
                                    <input
                                        type="text"
                                        required
                                        value={answer}
                                        onChange={(e) => setAnswer(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none transition-all"
                                        placeholder="Cevabınızı girin"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Yeni Şifre</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 pr-12 py-3 focus:ring-2 focus:ring-red-600 outline-none transition-all"
                                            placeholder="••••••••"
                                        />
                                        <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors" tabIndex={-1}>
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Yeni Şifre Tekrar</label>
                                    <div className="relative">
                                        <input
                                            type={showPasswordConfirm ? "text" : "password"}
                                            required
                                            value={passwordConfirm}
                                            onChange={(e) => setPasswordConfirm(e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 pr-12 py-3 focus:ring-2 focus:ring-red-600 outline-none transition-all"
                                            placeholder="••••••••"
                                        />
                                        <button type="button" onClick={() => setShowPasswordConfirm(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors" tabIndex={-1}>
                                            {showPasswordConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : "Şifreyi Güncelle"}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep("CHOOSE")}
                                className="w-full text-zinc-600 hover:text-zinc-400 text-xs font-bold transition-colors uppercase tracking-widest"
                            >
                                İptal Et
                            </button>
                        </form>
                    )}

                    {step === "CONTACT_FORM" && (
                        <form onSubmit={handleContactSubmit} className="space-y-6">
                            <div className="text-center mb-6 border-b border-zinc-800 pb-4">
                                <h2 className="text-white font-bold text-lg">Bizimle İletişime Geçin</h2>
                                <p className="text-zinc-500 text-xs mt-1">E-posta adresinizi girin, ekibimiz en kısa sürede sizi bilgilendirecektir.</p>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-900/20 border border-red-900/30 text-red-500 text-xs rounded-xl flex items-center gap-3">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">E-posta Adresiniz</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <input
                                        type="email"
                                        required
                                        value={contactEmail}
                                        onChange={(e) => setContactEmail(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                                        placeholder="ornek@eposta.com"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-indigo-950/30 border border-indigo-900/30 rounded-xl flex items-start gap-3">
                                <Clock className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                                <p className="text-indigo-300 text-xs leading-relaxed">
                                    Talebiniz alındıktan sonra <span className="font-bold">0-30 dakika</span> içerisinde şifrenizi yenilemek için tekrardan giriş yapabilirsiniz.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : "Gönder"}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setStep("CHOOSE"); setError(null); }}
                                className="w-full text-zinc-600 hover:text-zinc-400 text-xs font-bold transition-colors uppercase tracking-widest"
                            >
                                Geri Dön
                            </button>
                        </form>
                    )}

                    {step === "CONTACT_SUCCESS" && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-indigo-900/20 border border-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-8 h-8 text-indigo-400" />
                                </div>
                                <h3 className="text-white font-bold text-xl">Talebiniz Alındı!</h3>
                                <p className="text-zinc-400 text-sm mt-2">
                                    <span className="text-indigo-400 font-bold">0-30 dakika</span> içerisinde şifrenizi yenilemek için tekrardan giriş yapabilirsiniz.
                                </p>
                            </div>

                            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                                    <p className="text-xs font-black text-zinc-300 uppercase tracking-widest">Şifre Yenileme Adımları</p>
                                </div>
                                <ol className="space-y-2.5">
                                    <li className="flex items-start gap-3">
                                        <span className="w-5 h-5 rounded-full bg-indigo-900/50 border border-indigo-700 flex items-center justify-center text-[10px] font-black text-indigo-300 flex-shrink-0 mt-0.5">1</span>
                                        <p className="text-zinc-400 text-xs leading-relaxed">Login kısmında <span className="text-white font-bold">e-posta adresinizi</span> girin.</p>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="w-5 h-5 rounded-full bg-indigo-900/50 border border-indigo-700 flex items-center justify-center text-[10px] font-black text-indigo-300 flex-shrink-0 mt-0.5">2</span>
                                        <p className="text-zinc-400 text-xs leading-relaxed">Şifre alanını <span className="text-white font-bold">boş bırakarak</span> giriş yapmayı deneyin.</p>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="w-5 h-5 rounded-full bg-indigo-900/50 border border-indigo-700 flex items-center justify-center text-[10px] font-black text-indigo-300 flex-shrink-0 mt-0.5">3</span>
                                        <p className="text-zinc-400 text-xs leading-relaxed">Açılan ekranda yeni şifrenizi <span className="text-white font-bold">iki defa girin</span>.</p>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="w-5 h-5 rounded-full bg-emerald-900/50 border border-emerald-700 flex items-center justify-center text-[10px] font-black text-emerald-300 flex-shrink-0 mt-0.5">✓</span>
                                        <p className="text-zinc-400 text-xs leading-relaxed">Şifreniz başarıyla yenilenmiş olacaktır.</p>
                                    </li>
                                </ol>
                            </div>
                        </div>
                    )}

                    {step === "SUCCESS" && (
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 bg-emerald-900/20 border border-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-xl">Şifre Başarıyla Değiştirildi</h3>
                                <p className="text-zinc-500 text-sm mt-2">
                                    Yeni şifrenizle giriş yapabilirsiniz. Yönlendiriliyorsunuz...
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8 text-center">
                    <Link href="/" className="text-zinc-600 hover:text-red-500 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                        <ArrowLeft className="w-3 h-3" /> Giriş Sayfasına Dön
                    </Link>
                </div>
            </div>
        </div>
    );
}

