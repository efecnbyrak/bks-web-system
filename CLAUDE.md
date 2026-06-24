# CLAUDE.md

Bu dosya, bu repoda çalışırken Claude Code'a (claude.ai/code) rehberlik eder.

## Proje Özeti

**BKS Web** — Next.js (App Router) tabanlı web uygulaması. Türkiye Basketbol Federasyonu
hakemler ve görevliler için yönetim/portal arayüzü ve mobil uygulamaya servis veren API katmanı.

Genel yapı:
- `app/` — Next.js App Router. İçindeki klasörler URL yollarına karşılık gelir.
  - `app/.../page.tsx` → bir sayfa (kullanıcının gördüğü ekran).
  - `app/api/.../route.ts` → bir API endpoint'i (GET/POST/... handler'ları).
- `components/` — tekrar kullanılan arayüz parçaları.
- `lib/` — yardımcı fonksiyonlar, ortak iş mantığı.
- `hooks/` — React hook'ları (paylaşılan state/davranış).
- `prisma/` — veritabanı şeması ve erişim.

## Kod Yorumlama Standardı

Bu projede yazılan/değiştirilen **her kodda** aşağıdaki kurallara uyulur. Amaç: kodu, dile
çok hakim olmayan bir yazılımcının bile rahatça okuyup anlayabilmesi.

- **Türkçe yorum**: Her anlamlı mantık bloğunun veya fonksiyonun başına Türkçe bir açıklama yaz.
  "Bu ne yapar ve neden var" sorusunu cevaplasın.
- **Blok bazlı, satır bazlı değil**: Her satıra yorum koyma. Sadece anlamlı blokların başına koy.
  Birbirini takip eden, yapısal olarak aynı şeyler varsa hepsine değil, bir tanesine yorum yeterli.
- **Humanize / insan gibi yaz**: Normal bir insan yazılımcının yazacağı sade, doğal dille açıkla.
  Gereksiz teknik jargon yığma; bir arkadaşına anlatır gibi yaz.
- **Mantığı asla değiştirme**: Yorum yalnızca açıklar. Kodun çalışma mantığı (logic) kesinlikle
  yorum eklerken değiştirilmez.
- **Zaten yorumlu kodu yeniden yazma**: İyi yorumlanmış bir dosyaya dokunma; sadece eksik kalan
  yerleri tamamla.
