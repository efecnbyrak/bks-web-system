<div align="center">

# 🏀 BKS — Basketbol Koordinasyon Sistemi

**Türkiye basketbol hakemlerini ve görevlilerini koordine eden full-stack web platformu**

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?logo=prisma&logoColor=white)](https://prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://postgresql.org)
[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)

</div>

---

## 📋 İçindekiler

- [Proje Hakkında](#-proje-hakkında)
- [Özellikler](#-özellikler)
- [Mimari](#-mimari)
- [Teknoloji Stack](#-teknoloji-stack)
- [Kullanıcı Rolleri](#-kullanıcı-rolleri)
- [Kurulum](#-kurulum)
- [Ortam Değişkenleri](#-ortam-değişkenleri)
- [Veritabanı](#-veritabanı)
- [Deployment](#-deployment)
- [Testler](#-testler)
- [Geliştirici](#-geliştirici)

---

## 🎯 Proje Hakkında

BKS (Basketbol Koordinasyon Sistemi), Türkiye'deki basketbol hakemlerini, masa görevlilerini, saha gözlemcilerini ve diğer saha personelini tek bir platformda buluşturan kapsamlı bir web uygulamasıdır.

Sistem; haftalık uygunluk takvimleri, otomatik maç atamaları, sınav yönetimi, AI destekli kural arama ve zengin içerik yönetimi gibi özelliklerle hakem koordinasyonunu uçtan uca dijitalleştirir.

---

## ✨ Özellikler

### 📅 Uygunluk Formu Sistemi
- Hakemlerin ve görevlilerin haftalık uygunluklarını bildirdiği dinamik takvim formu
- **AUTO / OPEN / CLOSED** modları — Vercel Cron ile otomatik açılıp kapanır
  - Pazar 12:00 UTC → Form açılır
  - Salı 14:30 UTC → Form kapanır
- Admin tarafından tüm uygunluklar toplu görüntülenebilir ve Excel'e aktarılabilir

### ⚽ Maç Atama Sistemi
- Google Drive Sheets entegrasyonu ile otomatik maç import
- Excel dosyası upload ile toplu atama
- Kullanıcı bazlı maç geçmişi ve istatistikleri
- Google Sheets real-time senkronizasyon desteği

### 📝 Sınav Sistemi
- Çoktan seçmeli, doğru/yanlış ve boş doldurma soru tipleri
- Hakem ve görevli sınavları ayrı ayrı yönetilir
- Sınav ataması (belirli kullanıcılara veya gruplara özel)
- Sonuç raporlama ve Excel export

### 🤖 AI Destekli Kural Arama
- Google Gemini + Pinecone vektör veritabanı ile RAG (Retrieval-Augmented Generation)
- PDF kural kitabından semantik arama
- Konuşma geçmişi destekli chat arayüzü

### 📢 Duyuru Sistemi
- Rich text editor (Quill) ile zengin içerikli duyurular
- Hedef grup seçimi (TÜM, HAKEM, GÖREVLİ, ADAY_HAKEM, OBSERVER)
- Okundu bildirimleri takibi + email bildirimi entegrasyonu

### 🎬 Video & Kural Kitabı
- YouTube entegrasyonu ile kategorize eğitim videoları
- Video izleme ilerlemesi takibi
- PDF kural kitabı — bölüm bazlı okuma takibi
- Vercel Blob ile güvenli dosya depolama

### 🔍 Gözlemci Raporları
- Saha gözlemcilerinin maç raporları
- Admin tarafından filtreleme ve yönetim

### ⚖️ Ceza Yönetimi
- Hakem ceza kayıtları (Suspension, Warning, Fine)
- Aktif ceza takibi ve tarih bazlı yönetim

### 📊 Audit Log & Raporlama
- Tüm admin işlemleri otomatik loglanır (IP adresi dahil)
- Excel export desteği
- Otomatik periyodik log temizleme (Cron)

### 🔒 Güvenlik
- Rate limiting (login: 5/dk, register: 3/2dk)
- JWT (jose) tabanlı session yönetimi
- bcryptjs ile şifre hashing
- Email doğrulama + admin onay akışı

### 📱 Mobile API (v2)
- Mobil uygulama için ayrı `/api/mobile/v2` endpoint grubu

### 🌙 Dark Mode
- `next-themes` ile sistem tercihi uyumlu tam dark mode desteği

---

## 🏗 Mimari

```
tbf-app-ready/
├── app/
│   ├── (auth)/                 # Login, Register, Forgot Password
│   ├── admin/                  # Admin paneli (SUPER_ADMIN, ADMIN_IHK)
│   │   └── (dashboard)/        # Hakem, Maç, Sınav, Log yönetimi (20+ sayfa)
│   ├── referee/                # Hakem paneli
│   ├── general/                # Görevli paneli (Table, Observer, vb.)
│   ├── basket/                 # AI Kural Arama (Gemini + Pinecone)
│   └── api/                    # 42 REST API route
│       ├── auth/               # Authentication
│       ├── admin/              # Admin işlemleri
│       ├── mobile/v2/          # Mobile API
│       ├── rules/              # PDF arama & görüntüleme
│       └── cron/               # Scheduled jobs
├── prisma/
│   ├── schema.prisma           # 38 model, PostgreSQL
│   └── seed.ts
├── lib/                        # Utilities, DB client, email, cache
├── components/                 # Shared UI components
└── data/
    └── gameRules/              # PDF kural kitabı dosyaları
```

### Cron Jobs

| Job | Schedule | Açıklama |
|-----|----------|----------|
| `availability-open` | Her Pazar 12:00 UTC | Uygunluk formunu açar |
| `availability-close` | Her Salı 14:30 UTC | Uygunluk formunu kapatır |
| `purge-old-logs` | Her ay 1. ve 15. gün 03:00 | Eski audit logları temizler |

---

## 🛠 Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| **Framework** | Next.js 16.1.6 (App Router, Server Actions, Server Components) |
| **UI Library** | React 19 |
| **Dil** | TypeScript 5.9 |
| **Styling** | Tailwind CSS v4, Radix UI primitives, Lucide Icons |
| **Veritabanı** | PostgreSQL 16 |
| **ORM** | Prisma 6.x (38 model) |
| **Auth** | JWT (jose), bcryptjs |
| **Storage** | Vercel Blob |
| **AI** | Google Generative AI (Gemini), Pinecone vector DB |
| **Email** | Nodemailer (Gmail SMTP) |
| **Google** | Drive API, Sheets API |
| **Excel** | ExcelJS, SheetJS (xlsx) |
| **PDF** | pdf-parse |
| **Rich Text** | React Quill |
| **Charts** | Recharts |
| **Search** | Fuse.js (fuzzy search) |
| **Analytics** | Vercel Analytics |
| **Testing** | Vitest + Testing Library |
| **Deployment** | Vercel |
| **Cron** | Vercel Cron (3 scheduled jobs) |

---

## 👥 Kullanıcı Rolleri

| Rol | Tip | Erişim |
|-----|-----|--------|
| `SUPER_ADMIN` | Admin | Tam sistem yönetimi |
| `ADMIN_IHK` | Admin | Hakem koordinasyon yönetimi |
| `REFEREE` | Hakem | Uygunluk, maçlar, sınav, kurallar |
| `TABLE` | Görevli | Masa hakemliği paneli |
| `OBSERVER` | Görevli | Gözlemci paneli + raporlar |
| `HEALTH` | Görevli | Sağlık görevlisi paneli |
| `STATISTICIAN` | Görevli | İstatistikçi paneli |
| `FIELD_COMMISSIONER` | Görevli | Saha komiserliği paneli |

---

## 🚀 Kurulum

### Gereksinimler

- Node.js 20.x
- PostgreSQL 16+
- npm / pnpm / yarn

### Adımlar

```bash
# 1. Repoyu klonla
git clone https://github.com/efecnbyrak/bks.git
cd bks

# 2. Bağımlılıkları yükle
npm install

# 3. Ortam değişkenlerini ayarla
cp .env.example .env.local
# .env.local dosyasını düzenle

# 4. Veritabanını kur
npx prisma db push
npx prisma db seed

# 5. Geliştirme sunucusunu başlat
npm run dev
```

Tarayıcıda [http://localhost:3000](http://localhost:3000) adresini aç.

---

## 🔑 Ortam Değişkenleri

`.env.local` dosyasına aşağıdaki değişkenleri ekle:

```env
# DATABASE
DATABASE_URL="postgresql://user:password@host:5432/dbname?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/dbname"

# AUTH
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"

# GOOGLE DRIVE & SHEETS
GOOGLE_CLIENT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GOOGLE_DRIVE_FOLDER_ID="your-drive-folder-id"

# AI (Gemini + Pinecone)
GEMINI_API_KEY="your-gemini-api-key"
PINECONE_API_KEY="your-pinecone-api-key"
PINECONE_INDEX_NAME="your-index-name"

# STORAGE
BLOB_READ_WRITE_TOKEN="vercel-blob-token"

# EMAIL (Gmail SMTP)
GMAIL_USER="your-gmail@gmail.com"
GMAIL_APP_PASSWORD="your-gmail-app-password-16-chars"

# CRON
CRON_SECRET="your-cron-secret-key"
```

---

## 🗄 Veritabanı

Proje **38 Prisma modeli** içerir:

`User` · `Referee` · `GeneralOfficial` · `Region` · `Match` · `MatchAssignment` · `UserMatchAssignment` · `AvailabilityForm` · `AvailabilityDay` · `SystemSetting` · `Question` · `ExamAttempt` · `ExamAssignment` · `UserAnswer` · `VideoCategory` · `Video` · `VideoProgress` · `ChatSession` · `Message` · `RuleBook` · `ReffAIDocument` · `Announcement` · `AnnouncementRead` · `UserMessage` · `ObserverReport` · `Penalty` · `AuditLog` · `LoginAttempt` · `GameAssignment` · `DriveFile` · `ParsedMatch` · `PendingUpload` · `UploadChunk` · `SectionVisit` · `RuleProgress` · `WorkerSyncLog` · `WorkerSyncState`

```bash
npx prisma db push      # Şemayı DB'ye uygula
npx prisma studio       # Prisma Studio aç
npx prisma db seed      # Seed data yükle
```

---

## ☁️ Deployment

Proje **Vercel** üzerinde production-ready olarak çalışmaktadır.

```bash
npm i -g vercel
vercel --prod
```

Build sırası: `prisma db push → PDF text extraction → next build`

Cron job'lar `vercel.json` üzerinden Vercel tarafından otomatik tetiklenir. `CRON_SECRET` ile güvenlik sağlanır.

---

## 🧪 Testler

```bash
npm test             # Testleri çalıştır
npm run test:watch   # Watch modunda
```

Framework: **Vitest** + **Testing Library**

---

## 👤 Geliştirici

**Efe Can Bayrak**

[![GitHub](https://img.shields.io/badge/GitHub-efecnbyrak-181717?logo=github&logoColor=white)](https://github.com/efecnbyrak)
[![Email](https://img.shields.io/badge/Email-efecanbayrak3557%40gmail.com-D14836?logo=gmail&logoColor=white)](mailto:efecanbayrak3557@gmail.com)

---

<div align="center">

**BKS** — Türk basketbol hakemlik sistemini dijitalleştiren platform.

Made with ❤️ in Turkey

</div>
