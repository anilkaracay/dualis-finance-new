import { wrapInLayout, ctaButton, FRONTEND_URL, SUCCESS_COLOR, DANGER_COLOR, BRAND_COLOR } from './layout.js';

interface TemplateData {
  status: 'received' | 'approved' | 'rejected';
  reason?: string;
}

const STATUS_CONFIG = {
  received: {
    icon: '📋',
    color: BRAND_COLOR,
    title: 'KYB Application Received',
    message: 'We have received your Know Your Business (KYB) application. Our compliance team is currently reviewing your submission. You will be notified once the review is complete.',
  },
  approved: {
    icon: '✅',
    color: SUCCESS_COLOR,
    title: 'KYB Application Approved',
    message: 'Congratulations! Your Know Your Business (KYB) application has been approved. You now have full access to institutional features on Dualis Finance.',
  },
  rejected: {
    icon: '❌',
    color: DANGER_COLOR,
    title: 'KYB Application Rejected',
    message: 'Unfortunately, your Know Your Business (KYB) application could not be approved at this time.',
  },
} as const;

export function render(data: TemplateData): { subject: string; html: string; text: string } {
  const { status, reason } = data;
  const config = STATUS_CONFIG[status];

  const reasonBlock = status === 'rejected' && reason
    ? `<div style="background-color: #fef2f2; border-left: 4px solid ${DANGER_COLOR}; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 14px; color: #374151;"><strong>Reason:</strong> ${reason}</p>
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
      ${reasonBlock}
      ${status === 'rejected'
        ? `<p style="font-size: 14px; color: #374151; margin: 0 0 24px;">
            You may update your documents and resubmit your application from the institutional dashboard.
          </p>`
        : ''}
      ${ctaButton('Go to Dashboard', `${FRONTEND_URL}/institutional`, config.color)}
    </div>
  `;

  return {
    subject: `${config.icon} ${config.title}`,
    html: wrapInLayout(content),
    text: [
      config.title,
      '',
      config.message,
      ...(status === 'rejected' && reason ? ['', `Reason: ${reason}`, '', 'You may update your documents and resubmit your application.'] : []),
      '',
      `Go to dashboard: ${FRONTEND_URL}/institutional`,
    ].join('\n'),
  };
}
