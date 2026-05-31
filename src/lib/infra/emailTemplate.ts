/** Premium transactional email — açık tema, NMM logosu (public/logo.png). */

export const NMM_APP_URL = 'https://nmm.suattayfuntopak.com'
export const NMM_LOGO_URL = `${NMM_APP_URL}/logo.png`

/** E-posta üstü — yuvarlak NMM logosu (Gmail/Outlook uyumlu mutlak URL). */
export function emailLogoHeader(): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
  <tr>
    <td align="center" style="padding:0 0 4px;">
      <img src="${NMM_LOGO_URL}" alt="Network Marketing Master" width="72" height="72" style="display:block;width:72px;height:72px;border-radius:50%;border:2px solid #EEEDFE;object-fit:cover;" />
    </td>
  </tr>
  <tr>
    <td align="center" style="padding:0;">
      <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#534AB7;">Network Marketing Master</p>
    </td>
  </tr>
</table>`
}

export function buildPremiumEmail(contentHtml: string, lang: 'tr' | 'en'): string {
  const footer =
    lang === 'en'
      ? 'Network Marketing Master · Questions? Reply to this email.'
      : 'Network Marketing Master · Sorularınız için bu e-postayı yanıtlayabilirsiniz.'

  const copyright =
    lang === 'en'
      ? '© 2026 Network Marketing Master'
      : '© 2026 Network Marketing Master'

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Network Marketing Master</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8eaef;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.06);">
          <tr>
            <td style="padding:28px 32px 8px;text-align:center;border-bottom:1px solid #f0f1f4;">
              ${emailLogoHeader()}
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 24px;color:#3f3f46;font-size:15px;line-height:1.65;">
              ${contentHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 28px;text-align:center;border-top:1px solid #f0f1f4;">
              <p style="margin:0 0 6px;font-size:12px;color:#71717a;">${footer}</p>
              <p style="margin:0;font-size:11px;color:#a1a1aa;">${copyright}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function emailHeading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#18181b;letter-spacing:-0.02em;line-height:1.3;">${text}</h1>`
}

export function emailParagraph(html: string): string {
  return `<p style="margin:0 0 16px;color:#52525b;">${html}</p>`
}

export function emailHighlight(text: string): string {
  return `<strong style="color:#534AB7;font-weight:700;">${text}</strong>`
}

export function emailCta(href: string, label: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr><td align="center">
    <a href="${href}" style="display:inline-block;background:#534AB7;color:#ffffff!important;text-decoration:none;padding:14px 28px;font-size:14px;font-weight:700;border-radius:12px;box-shadow:0 4px 14px rgba(83,74,183,0.25);">${label}</a>
  </td></tr></table>`
}

/** Metin tabanlı plan özeti — resim yok. */
export function emailPlanBox(lines: string[]): string {
  const rows = lines
    .map(
      line =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #f0f1f4;font-size:14px;color:#3f3f46;">${line}</td></tr>`
    )
    .join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#fafafa;border:1px solid #e8eaef;border-radius:12px;padding:4px 16px;">${rows}</table>`
}

export function emailBulletList(items: string[]): string {
  const lis = items.map(i => `<li style="margin-bottom:8px;">${i}</li>`).join('')
  return `<ul style="margin:0 0 16px;padding-left:20px;color:#52525b;">${lis}</ul>`
}
