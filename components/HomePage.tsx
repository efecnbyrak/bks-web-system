"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";

const LoginModal = dynamic(() => import("@/components/auth/LoginModal").then(mod => mod.LoginModal), {
    ssr: false,
});

const RegisterModal = dynamic(() => import("@/components/auth/RegisterModal").then(mod => mod.RegisterModal), {
    ssr: false,
});

export function HomePage() {
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);

    const openLogin = () => {
        setIsRegisterOpen(false);
        setIsLoginOpen(true);
    };

    const openRegister = () => {
        setIsLoginOpen(false);
        setIsRegisterOpen(true);
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-red-700 to-zinc-950 text-white relative overflow-x-hidden">

            <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 z-10">
                <div className="flex flex-col items-center text-center max-w-2xl w-full bg-black/20 backdrop-blur-md p-5 md:p-8 rounded-[2.5rem] border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-500">
                    {/* Logo Container */}
                    <div className="mb-6 md:mb-8 transform hover:scale-105 transition-all duration-500">
                        <img src="/logo.png" alt="BKS Logo" className="w-24 h-24 md:w-28 md:h-28 object-contain" />
                    </div>

                    <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter mb-2 italic">
                        Basketbol Koordinasyon Sistemi
                    </h1>
                    <p className="text-zinc-500 text-xs font-medium">© 2026 Basketbol Koordinasyon Sistemi - Tüm Hakları Saklıdır</p>
                    <p className="text-sm md:text-lg text-zinc-200 mb-6 md:mb-8 max-w-lg mx-auto font-medium mt-1">
                        Güvenli ve Hızlı <br className="hidden md:block" />
                        Koordinasyon Portalı
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
                        <button
                            onClick={openLogin}
                            className="w-full py-3.5 px-6 bg-white text-red-700 font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl hover:bg-zinc-100 transform hover:-translate-y-1 transition-all duration-200"
                        >
                            Giriş Yap
                        </button>
                        <button
                            onClick={openRegister}
                            className="w-full py-3.5 px-6 bg-transparent border-2 border-zinc-100/50 text-zinc-100 font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-white/10 transform hover:-translate-y-1 transition-all duration-200"
                        >
                            Kayıt Ol
                        </button>
                    </div>
                </div>
            </main>

            <footer className="w-full p-4 flex items-center justify-center text-zinc-400 text-[10px] md:text-xs z-20 border-t border-white/5 bg-black/10 backdrop-blur-sm italic font-bold">
                © 2026 Basketbol Koordinasyon Sistemi - Tüm Hakları Saklıdır
            </footer>

            {/* Modals */}
            <LoginModal
                isOpen={isLoginOpen}
                onClose={() => setIsLoginOpen(false)}
                onSwitchToRegister={openRegister}
            />
            <RegisterModal
                isOpen={isRegisterOpen}
                onClose={() => setIsRegisterOpen(false)}
                onSwitchToLogin={openLogin}
            />
        </div>
    );
}
