export async function register() {
  // Sunucu başlangıcında zorunlu env var'ları doğrula
  const required = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'CRON_SECRET'];
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`[Startup] Zorunlu ortam değişkeni eksik: ${key}`);
    }
  }
}
