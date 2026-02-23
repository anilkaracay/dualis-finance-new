import { wrapInLayout, ctaButton, severityColor, FRONTEND_URL, BRAND_COLOR, DANGER_COLOR, TEXT_MUTED } from './layout.js';

interface TopEvent {
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
}

interface TemplateData {
  period: string;
  totalNotifications: number;
  criticalCount: number;
  financialSummary?: string;
  topEvents: TopEvent[];
}

export function render(data: TemplateData): { subject: string; html: string; text: string } {
  const { period, totalNotifications, criticalCount, financialSummary, topEvents } = data;

  const statCards = `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <tr>
        <td style="width: 50%; padding: 8px;">
          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 16px; text-align: center;">
            <div style="font-size: 28px; font-weight: 700; color: ${BRAND_COLOR};">${totalNotifications}</div>
            <div style="font-size: 12px; color: ${TEXT_MUTED}; text-transform: uppercase; letter-spacing: 1px;">Total Notifications</div>
          </div>
        </td>
        <td style="width: 50%; padding: 8px;">
          <div style="background-color: ${criticalCount > 0 ? '#fef2f2' : '#f8f9fa'}; border-radius: 8px; padding: 16px; text-align: center;">
            <div style="font-size: 28px; font-weight: 700; color: ${criticalCount > 0 ? DANGER_COLOR : BRAND_COLOR};">${criticalCount}</div>
            <div style="font-size: 12px; color: ${TEXT_MUTED}; text-transform: uppercase; letter-spacing: 1px;">Critical Alerts</div>
          </div>
        </td>
      </tr>
    </table>
  `;

  const financialBlock = financialSummary
    ? `<div style="background-color: #f0fdf4; border-left: 4px solid ${BRAND_COLOR}; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 14px; color: #374151;"><strong>Financial Summary:</strong> ${financialSummary}</p>
      </div>`
    : '';

  const eventRows = topEvents.map((event) => {
    const color = severityColor(event.severity);
    return `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
          <div style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${color}; margin-right: 8px; vertical-align: middle;"></div>
          <strong style="font-size: 14px; color: #111827;">${event.title}</strong>
          <p style="margin: 4px 0 0; font-size: 13px; color: ${TEXT_MUTED}; padding-left: 16px;">${event.message}</p>
        </td>
      </tr>
    `;
  }).join('');

  const eventsBlock = topEvents.length > 0
    ? `<div style="margin-bottom: 24px;">
        <h3 style="font-size: 16px; color: #111827; margin: 0 0 12px;">Top Events</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${eventRows}
        </table>
      </div>`
    : '';

  const content = `
    <div style="background-color: ${BRAND_COLOR}; padding: 16px 24px; border-radius: 8px 8px 0 0;">
      <h2 style="color: #ffffff; margin: 0; font-size: 20px;">
        📬 Your ${period} Digest
      </h2>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 16px; margin: 0 0 20px;">
        Here is a summary of your Dualis Finance activity for the ${period.toLowerCase()} period.
      </p>
      ${statCards}
      ${financialBlock}
      ${eventsBlock}
      ${ctaButton('Go to Dashboard', `${FRONTEND_URL}/overview`, BRAND_COLOR)}
    </div>
  `;

  const textEvents = topEvents.map((e) => `  - [${e.severity.toUpperCase()}] ${e.title}: ${e.message}`).join('\n');

  return {
    subject: `📬 Your ${period} Digest — ${totalNotifications} notification${totalNotifications !== 1 ? 's' : ''}${criticalCount > 0 ? `, ${criticalCount} critical` : ''}`,
    html: wrapInLayout(content),
    text: [
      `Your ${period} Digest`,
      '',
      `Total Notifications: ${totalNotifications}`,
      `Critical Alerts: ${criticalCount}`,
      ...(financialSummary ? [`Financial Summary: ${financialSummary}`] : []),
      '',
      ...(topEvents.length > 0 ? ['Top Events:', textEvents] : []),
      '',
      `Go to dashboard: ${FRONTEND_URL}/overview`,
    ].join('\n'),
  };
}
