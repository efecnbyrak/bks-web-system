import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmailSafe(to: string | null | undefined, subject: string, html: string): Promise<boolean> {
    if (!to || to.trim() === "") {
        console.warn("[EMAIL WARN] Recipient email missing. Skipping email sending.");
        return false;
    }

    if (!process.env.RESEND_API_KEY) {
        console.warn("RESEND_API_KEY not set. Email simulation:");
        console.log(`[SIMULATION] To: ${to}`);
        console.log(`[SIMULATION] Subject: ${subject}`);
        return true;
    }

    try {
        const { error } = await resend.emails.send({
            from: process.env.RESEND_FROM || 'BKS Asistan <noreply@bks.org.tr>',
            to,
            subject,
            html,
        });

        if (error) {
            console.error("Error sending email:", error);
            return false;
        }

        console.log(`Email sent successfully to ${to}`);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
}

export async function sendVerificationEmail(to: string | null | undefined, code: string) {
    const html = `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e5e5;border-radius:12px;overflow:hidden;">
            <div style="background:#c00;padding:24px 28px;">
                <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;">Basketbol Koordinasyon Sistemi</h1>
                <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">Giriş Doğrulama Kodu</p>
            </div>
            <div style="padding:28px;">
                <p style="color:#1a1a1a;font-size:15px;">Merhaba,</p>
                <p style="color:#555;font-size:14px;line-height:1.6;">
                    Sisteme giriş yapabilmek için aşağıdaki doğrulama kodunu kullanabilirsiniz:
                </p>

                <div style="margin:24px 0;text-align:center;background:#f9f9f9;padding:20px;border-radius:12px;border:1px dashed #ddd;">
                    <h1 style="font-size:32px;letter-spacing:8px;color:#c00;margin:0;font-family:monospace;">${code}</h1>
                </div>

                <p style="color:#888;font-size:12px;line-height:1.6;">
                    Bu kod 10 dakika boyunca geçerlidir. Eğer bu işlemi siz yapmadıysanız lütfen bu e-postayı dikkate almayınız.
                </p>
            </div>
            <div style="background:#f7f7f7;padding:16px 28px;border-top:1px solid #e5e5e5;">
                <p style="color:#bbb;font-size:10px;margin:0;font-style:italic;text-align:center;">© 2026 Basketbol Koordinasyon Sistemi - Tüm Hakları Saklıdır</p>
            </div>
        </div>
    `;

    return await sendEmailSafe(to, 'BKS - Giriş Doğrulama Kodu', html);
}

export async function sendEmailVerificationLink(to: string, verificationUrl: string) {
    const html = `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e5e5;border-radius:12px;overflow:hidden;">
            <div style="background:#c00;padding:24px 28px;">
                <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;">Basketbol Koordinasyon Sistemi</h1>
                <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">E-posta Doğrulama</p>
            </div>
            <div style="padding:28px;">
                <p style="color:#1a1a1a;font-size:15px;">Merhaba,</p>
                <p style="color:#555;font-size:14px;line-height:1.6;">
                    Basketbol Koordinasyon Sistemi'ne hoş geldiniz! Hesabınızı aktifleştirmek ve e-posta adresinizi doğrulamak için aşağıdaki butona tıklayabilirsiniz.
                </p>

                <div style="margin:24px 0;text-align:center;">
                    <a href="${verificationUrl}"
                       style="display:inline-block;background:#c00;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:14px;font-weight:700;letter-spacing:.3px;box-shadow:0 4px 12px rgba(192,0,0,0.2);">
                        ✅ E-postamı Doğrula
                    </a>
                </div>

                <p style="color:#888;font-size:12px;line-height:1.6;">
                    Bu bağlantı 24 saat boyunca geçerlidir.
                </p>

                <p style="color:#aaa;font-size:11px;margin-top:24px;border-top:1px solid #eee;padding-top:16px;">
                    Buton çalışmıyorsa aşağıdaki bağlantıyı tarayıcınıza kopyalayabilirsiniz:<br>
                    <a href="${verificationUrl}" style="color:#c00;word-break:break-all;">${verificationUrl}</a>
                </p>
            </div>
            <div style="background:#f7f7f7;padding:16px 28px;border-top:1px solid #e5e5e5;">
                <p style="color:#bbb;font-size:10px;margin:0;font-style:italic;text-align:center;">© 2026 Basketbol Koordinasyon Sistemi - Tüm Hakları Saklıdır</p>
            </div>
        </div>
    `;

    return await sendEmailSafe(to, 'BKS - E-posta Adresinizi Doğrulayın', html);
}

export async function sendEmailChangeVerification(to: string, verificationUrl: string) {
    const html = `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e5e5;border-radius:12px;overflow:hidden;">
            <div style="background:#c00;padding:24px 28px;">
                <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;">Basketbol Koordinasyon Sistemi</h1>
                <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">E-posta Değişikliği Onayı</p>
            </div>
            <div style="padding:28px;">
                <p style="color:#1a1a1a;font-size:15px;">Merhaba,</p>
                <p style="color:#555;font-size:14px;line-height:1.6;">
                    Hesabınıza bağlı e-posta adresini değiştirmek istediğinizi belirttiniz. Bu değişikliği onaylamak için lütfen aşağıdaki butona tıklayın.
                </p>

                <div style="margin:24px 0;text-align:center;">
                    <a href="${verificationUrl}"
                       style="display:inline-block;background:#3b82f6;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:14px;font-weight:700;letter-spacing:.3px;box-shadow:0 4px 12px rgba(59,130,246,0.2);">
                        🔄 Değişikliği Onayla
                    </a>
                </div>

                <p style="color:#888;font-size:12px;line-height:1.6;">
                    Bu işlemi siz yapmadıysanız lütfen hemen şifrenizi değiştirin ve yönetici ile iletişime geçin. Bu bağlantı 1 saat boyunca geçerlidir.
                </p>

                <p style="color:#aaa;font-size:11px;margin-top:24px;border-top:1px solid #eee;padding-top:16px;">
                    Buton çalışmıyorsa aşağıdaki bağlantıyı tarayıcınıza kopyalayabilirsiniz:<br>
                    <a href="${verificationUrl}" style="color:#c00;word-break:break-all;">${verificationUrl}</a>
                </p>
            </div>
            <div style="background:#f7f7f7;padding:16px 28px;border-top:1px solid #e5e5e5;">
                <p style="color:#bbb;font-size:10px;margin:0;font-style:italic;text-align:center;">© 2026 Basketbol Koordinasyon Sistemi - Tüm Hakları Saklıdır</p>
            </div>
        </div>
    `;

    return await sendEmailSafe(to, 'BKS - E-posta Değişikliği Onayı', html);
}

export async function sendAvailabilityConfirmationEmail(
    to: string | null | undefined,
    refereeName: string,
    weekLabel: string,
    availableDays: { dayName: string; date: string; slots: string }[],
    deadlineStr: string,
    formUrl: string
) {
    const dayRows = availableDays.length > 0
        ? availableDays.map(d => `
            <tr>
                <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-weight:600;color:#1a1a1a;">${d.dayName}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#555;">${d.date}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#c00;font-weight:700;">${d.slots}</td>
            </tr>`).join('')
        : `<tr><td colspan="3" style="padding:12px;text-align:center;color:#888;">Hiçbir gün için uygunluk belirtilmedi.</td></tr>`;

    const html = `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e5e5;border-radius:12px;overflow:hidden;">
            <div style="background:#c00;padding:24px 28px;">
                <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;">Basketbol Koordinasyon Sistemi</h1>
                <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">Uygunluk Formu Onayı</p>
            </div>
            <div style="padding:28px;">
                <p style="color:#1a1a1a;font-size:15px;">Merhaba <strong>${refereeName}</strong>,</p>
                <p style="color:#555;font-size:14px;line-height:1.6;">
                    <strong>${weekLabel}</strong> için uygunluk formunuz başarıyla kaydedildi.
                    Aşağıda seçiminizin özeti yer almaktadır.
                </p>

                <table style="width:100%;border-collapse:collapse;margin-top:16px;border:1px solid #e5e5e5;border-radius:8px;overflow:hidden;">
                    <thead>
                        <tr style="background:#f7f7f7;">
                            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Gün</th>
                            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Tarih</th>
                            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.5px;">Uygunluk</th>
                        </tr>
                    </thead>
                    <tbody>${dayRows}</tbody>
                </table>

                <p style="color:#888;font-size:12px;margin-top:14px;">
                    ⏰ Form güncelleme hakkınız <strong>${deadlineStr}</strong> tarihine kadar devam eder.
                </p>

                <div style="margin-top:20px;text-align:center;">
                    <a href="${formUrl}"
                       style="display:inline-block;background:#c00;color:#fff;text-decoration:none;padding:13px 28px;border-radius:8px;font-size:14px;font-weight:700;letter-spacing:.3px;">
                        🔗 Formu Görüntüle / Güncelle
                    </a>
                </div>
            </div>
            <div style="background:#f7f7f7;padding:16px 28px;border-top:1px solid #e5e5e5;">
                <p style="color:#aaa;font-size:11px;margin:0;margin-bottom:5px;">Bu e-posta Basketbol Koordinasyon Sistemi tarafından otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
                <p style="color:#bbb;font-size:10px;margin:0;font-style:italic;">© 2026 Basketbol Koordinasyon Sistemi - Tüm Hakları Saklıdır</p>
            </div>
        </div>
    `;

    return await sendEmailSafe(to, `BKS - ${weekLabel} Uygunluk Formu Onayı`, html);
}

export async function sendAdminTicketNotification(
    to: string,
    ticket: {
        id: number;
        type: string;
        errorType: string;
        subject: string;
        description: string;
        imageUrls: string[] | null;
        createdAt: Date;
        userName?: string;
        userEmail?: string;
    }
) {
    const typeLabel = ticket.type === "ONERI" ? "Öneri" : "Destek Talebi";
    const errorTypeLabels: Record<string, string> = {
        TEKNIK_HATA: "Teknik Hata",
        SINAV_SORUNU: "Sınav Sorunu",
        KURAL_KITABI: "Kural Kitabı",
        ATAMA: "Atama",
        HESAP: "Hesap",
        SIFRE_YENILEME: "Şifre Yenileme",
        GENEL: "Genel",
        UYGULAMA: "Uygulama",
        KURAL: "Kural",
        EGITIM: "Eğitim",
        DIGER: "Diğer",
    };
    const categoryLabel = errorTypeLabels[ticket.errorType] ?? ticket.errorType;
    const dateStr = new Date(ticket.createdAt).toLocaleString("tr-TR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });

    const imageSection = ticket.imageUrls && ticket.imageUrls.length > 0
        ? `
        <div style="margin-top:20px;">
            <p style="font-weight:700;color:#1a1a1a;font-size:13px;margin-bottom:10px;">Eklenen Görseller (${ticket.imageUrls.length} adet):</p>
            <div style="display:flex;flex-wrap:wrap;gap:10px;">
                ${ticket.imageUrls.map((url, i) => `
                <a href="${url}" target="_blank" style="display:block;">
                    <img src="${url}" alt="Görsel ${i + 1}" style="width:120px;height:90px;object-fit:cover;border-radius:8px;border:1px solid #e5e5e5;" />
                </a>`).join('')}
            </div>
        </div>`
        : `<p style="color:#888;font-size:12px;margin-top:12px;">Görsel eklenmemiş.</p>`;

    const html = `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:640px;margin:0 auto;border:1px solid #e5e5e5;border-radius:12px;overflow:hidden;">
            <div style="background:#c00;padding:24px 28px;">
                <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;">BKS — Yeni ${typeLabel}</h1>
                <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;">Ticket #${ticket.id} · ${dateStr}</p>
            </div>
            <div style="padding:28px;">
                <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
                    <tbody>
                        <tr>
                            <td style="padding:8px 12px;background:#f7f7f7;font-weight:700;font-size:12px;color:#555;width:140px;border-radius:6px 0 0 0;">Gönderen</td>
                            <td style="padding:8px 12px;font-size:13px;color:#1a1a1a;">${ticket.userName ?? "Bilinmiyor"}${ticket.userEmail ? ` &lt;${ticket.userEmail}&gt;` : ""}</td>
                        </tr>
                        <tr>
                            <td style="padding:8px 12px;background:#f7f7f7;font-weight:700;font-size:12px;color:#555;">Tür</td>
                            <td style="padding:8px 12px;font-size:13px;color:#1a1a1a;">${typeLabel}</td>
                        </tr>
                        <tr>
                            <td style="padding:8px 12px;background:#f7f7f7;font-weight:700;font-size:12px;color:#555;">Kategori</td>
                            <td style="padding:8px 12px;font-size:13px;color:#1a1a1a;">${categoryLabel}</td>
                        </tr>
                        <tr>
                            <td style="padding:8px 12px;background:#f7f7f7;font-weight:700;font-size:12px;color:#555;">Konu</td>
                            <td style="padding:8px 12px;font-size:13px;color:#1a1a1a;font-weight:600;">${ticket.subject}</td>
                        </tr>
                    </tbody>
                </table>

                <div style="background:#f9f9f9;border:1px solid #e5e5e5;border-radius:10px;padding:16px;">
                    <p style="font-weight:700;color:#555;font-size:12px;margin:0 0 8px;">Açıklama:</p>
                    <p style="color:#1a1a1a;font-size:14px;line-height:1.7;margin:0;white-space:pre-wrap;">${ticket.description}</p>
                </div>

                ${imageSection}
            </div>
            <div style="background:#f7f7f7;padding:14px 28px;border-top:1px solid #e5e5e5;">
                <p style="color:#bbb;font-size:10px;margin:0;text-align:center;">© 2026 Basketbol Koordinasyon Sistemi — Otomatik bildirim</p>
            </div>
        </div>
    `;

    return await sendEmailSafe(to, `BKS — Yeni ${typeLabel}: ${ticket.subject}`, html);
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
    const html = `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e5e5;border-radius:12px;overflow:hidden;">
            <div style="background:#c00;padding:24px 28px;">
                <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;">Basketbol Koordinasyon Sistemi</h1>
                <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:14px;">Şifre Sıfırlama İsteği</p>
            </div>
            <div style="padding:28px;">
                <p style="color:#1a1a1a;font-size:15px;">Merhaba,</p>
                <p style="color:#555;font-size:14px;line-height:1.6;">
                    Hesabınız için bir şifre sıfırlama isteği aldık. Şifrenizi sıfırlamak için aşağıdaki butona tıklayabilirsiniz.
                </p>

                <div style="margin:24px 0;text-align:center;">
                    <a href="${resetUrl}"
                       style="display:inline-block;background:#c00;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:14px;font-weight:700;letter-spacing:.3px;box-shadow:0 4px 12px rgba(192,0,0,0.2);">
                        🔒 Şifremi Sıfırla
                    </a>
                </div>

                <p style="color:#888;font-size:12px;line-height:1.6;">
                    Bu bağlantı 1 saat boyunca geçerlidir. Eğer şifre sıfırlama isteğinde bulunmadıysanız bu e-postayı dikkate almayınız.
                </p>

                <p style="color:#aaa;font-size:11px;margin-top:24px;border-top:1px solid #eee;padding-top:16px;">
                    Buton çalışmıyorsa aşağıdaki bağlantıyı tarayıcınıza kopyalayabilirsiniz:<br>
                    <a href="${resetUrl}" style="color:#c00;word-break:break-all;">${resetUrl}</a>
                </p>
            </div>
            <div style="background:#f7f7f7;padding:16px 28px;border-top:1px solid #e5e5e5;">
                <p style="color:#aaa;font-size:11px;margin:0;margin-bottom:5px;">Bu e-posta Basketbol Koordinasyon Sistemi tarafından otomatik olarak gönderilmiştir.</p>
                <p style="color:#bbb;font-size:10px;margin:0;font-style:italic;">© 2026 Basketbol Koordinasyon Sistemi - Tüm Hakları Saklıdır</p>
            </div>
        </div>
    `;

    return await sendEmailSafe(to, 'Basketbol Koordinasyon Sistemi - Şifre Sıfırlama', html);
}
