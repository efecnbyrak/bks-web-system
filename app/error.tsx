'use client'; // Error boundaries must be Client Components

import { useEffect } from 'react';
import { RefreshCcw, TriangleAlert } from 'lucide-react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error("Global UI Crash Blocked:", error);
    }, [error]);

    return (
        <div className="flex items-center justify-center min-h-[60vh] px-4">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-2xl p-10 max-w-md w-full text-center shadow-sm">
                <TriangleAlert className="w-10 h-10 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Bir sorun oluştu</h2>
                <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-6">Sayfa yüklenirken beklenmeyen bir hata meydana geldi. Lütfen tekrar deneyin veya daha sonra geri gelin.</p>
                <button
                    onClick={() => reset()}
                    className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                    <RefreshCcw className="w-4 h-4" /> Yeniden Dene
                </button>
            </div>
        </div>
    );
}
