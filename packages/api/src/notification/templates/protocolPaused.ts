import { wrapInLayout, ctaButton, FRONTEND_URL, WARNING_COLOR, DANGER_COLOR, SUCCESS_COLOR, BRAND_COLOR } from './layout.js';

interface TemplateData {
  type: 'PROTOCOL_PAUSED' | 'PROTOCOL_RESUMED' | 'SYSTEM_MAINTENANCE';
  reason?: string;
  estimatedDuration?: string;
}

const TYPE_CONFIG = {
  PROTOCOL_PAUSED: {
    icon: '⏸',
    color: DANGER_COLOR,
    title: 'Protocol Paused',
    message: 'The Dualis Finance protocol has been temporarily paused. All lending, borrowing, and withdrawal operations are currently suspended.',
    reassurance: 'Your funds remain safe and secure. The protocol pause is a protective measure and does not affect the safety of your deposits.',
  },
  PROTOCOL_RESUMED: {
    icon: '▶',
    color: SUCCESS_COLOR,
    title: 'Protocol Resumed',
    message: 'The Dualis Finance protocol has resumed normal operations. All lending, borrowing, and withdrawal functions are now available.',
    reassurance: 'All protocol features are fully operational. You may resume your activities as normal.',
  },
  SYSTEM_MAINTENANCE: {
    icon: '🔧',
    color: WARNING_COLOR,
    title: 'Scheduled Maintenance',
    message: 'Dualis Finance will undergo scheduled maintenance. Some features may be temporarily unavailable during this period.',
    reassurance: 'This is planned maintenance to improve platform performance and security. Your funds are not affected.',
  },
} as const;

export function render(data: TemplateData): { subject: string; html: string; text: string } {
  const { type, reason, estimatedDuration } = data;
  const config = TYPE_CONFIG[type];

  const detailRows: string[] = [];
  if (reason) {
    detailRows.push(`
      <tr>
        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Reason</td>
        <td style="padding: 8px 0; text-align: right; font-weight: 600;">${reason}</td>
      </tr>
    `);
  }
  if (estimatedDuration) {
    detailRows.push(`
      <tr>
        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Estimated Duration</td>
        <td style="padding: 8px 0; text-align: right; font-weight: 600;">${estimatedDuration}</td>
      </tr>
    `);
  }

  const detailsBlock = detailRows.length > 0
    ? `<div style="background-color: #f8f9fa; border-left: 4px solid ${config.color}; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          ${detailRows.join('')}
        </table>
      </div>`
    : '';

  const content = `
    <div style="background-color: ${config.color}; padding: 16px 24px; border-radius: 8px 8px 0 0;">
      <h2 style="color: #ffffff; margin: 0; font-size: 20px;">
        ${config.icon} ${config.title}
      </h2>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 16px; margin: 0 0 16px;">${config.message}</p>
      ${detailsBlock}
      <div style="background-color: #f0fdf4; border: 1px solid #86efac; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 14px; color: #166534;">
          <strong>Your funds are safe.</strong> ${config.reassurance}
        </p>
      </div>
      ${ctaButton('Go to Dashboard', `${FRONTEND_URL}/overview`, BRAND_COLOR)}
    </div>
  `;

  return {
    subject: `${config.icon} ${config.title}${estimatedDuration ? ` — Est. ${estimatedDuration}` : ''}`,
    html: wrapInLayout(content),
    text: [
      config.title,
      '',
      config.message,
      ...(reason ? [`Reason: ${reason}`] : []),
      ...(estimatedDuration ? [`Estimated Duration: ${estimatedDuration}`] : []),
      '',
      config.reassurance,
      '',
      `Dashboard: ${FRONTEND_URL}/overview`,
    ].join('\n'),
  };
}
