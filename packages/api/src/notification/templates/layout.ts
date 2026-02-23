/**
 * Common email layout wrapper — responsive HTML shell with Dualis branding.
 */

const BRAND_COLOR = '#0EA5E9'; // sky-500
const DANGER_COLOR = '#EF4444';
const WARNING_COLOR = '#F59E0B';
const SUCCESS_COLOR = '#22C55E';
const BG_COLOR = '#0F172A'; // slate-900
const CARD_BG = '#1E293B'; // slate-800
const TEXT_COLOR = '#E2E8F0'; // slate-200
const TEXT_MUTED = '#94A3B8'; // slate-400
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

export function severityColor(severity: string): string {
  switch (severity) {
    case 'critical': return DANGER_COLOR;
    case 'warning': return WARNING_COLOR;
    case 'info': return BRAND_COLOR;
    default: return BRAND_COLOR;
  }
}

export function ctaButton(text: string, href: string, color: string = BRAND_COLOR): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto;">
      <tr>
        <td style="border-radius:8px;background:${color};">
          <a href="${href}" target="_blank" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>`;
}

export function wrapInLayout(content: string, unsubscribeUrl?: string): string {
  const unsub = unsubscribeUrl ?? `${FRONTEND_URL}/settings/notifications`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="color-scheme" content="dark light">
  <meta name="supported-color-schemes" content="dark light">
  <title>Dualis Finance</title>
  <!--[if mso]>
  <style>table,td{border-collapse:collapse;}</style>
  <![endif]-->
  <style>
    @media (prefers-color-scheme: light) {
      .email-body { background-color: #f1f5f9 !important; }
      .email-card { background-color: #ffffff !important; }
      .email-text { color: #1e293b !important; }
      .email-muted { color: #64748b !important; }
    }
    @media only screen and (max-width: 600px) {
      .email-card { width: 100% !important; padding: 24px 16px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="email-body" style="background-color:${BG_COLOR};padding:32px 16px;">
    <tr>
      <td align="center">
        <!-- Logo -->
        <table role="presentation" width="560" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <span style="font-size:24px;font-weight:700;color:${BRAND_COLOR};letter-spacing:-0.5px;">Dualis Finance</span>
            </td>
          </tr>
        </table>

        <!-- Card -->
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" class="email-card" style="background-color:${CARD_BG};border-radius:12px;padding:32px;">
          <tr>
            <td class="email-text" style="color:${TEXT_COLOR};font-size:14px;line-height:1.6;">
              ${content}
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" width="560" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p class="email-muted" style="color:${TEXT_MUTED};font-size:12px;line-height:1.5;margin:0;">
                You're receiving this because you have notifications enabled on Dualis Finance.
                <br>
                <a href="${unsub}" style="color:${BRAND_COLOR};text-decoration:underline;">Manage notification settings</a>
                &nbsp;·&nbsp;
                <a href="${unsub}" style="color:${BRAND_COLOR};text-decoration:underline;">Unsubscribe</a>
              </p>
              <p class="email-muted" style="color:${TEXT_MUTED};font-size:11px;margin-top:16px;">
                © ${new Date().getFullYear()} Dualis Finance. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export { FRONTEND_URL, BRAND_COLOR, DANGER_COLOR, WARNING_COLOR, SUCCESS_COLOR, TEXT_COLOR, TEXT_MUTED };
