import { wrapInLayout, ctaButton, FRONTEND_URL, WARNING_COLOR, DANGER_COLOR } from './layout.js';

interface TemplateData {
  documentName: string;
  expiryDate: string;
  daysUntil: number;
}

export function render(data: TemplateData): { subject: string; html: string; text: string } {
  const { documentName, expiryDate, daysUntil } = data;
  const isUrgent = daysUntil <= 7;
  const color = isUrgent ? DANGER_COLOR : WARNING_COLOR;

  const urgencyText = daysUntil <= 0
    ? 'This document has expired.'
    : daysUntil === 1
      ? 'This document expires tomorrow.'
      : `This document expires in ${daysUntil} days.`;

  const content = `
    <div style="background-color: ${color}; padding: 16px 24px; border-radius: 8px 8px 0 0;">
      <h2 style="color: #ffffff; margin: 0; font-size: 20px;">
        📄 Document ${daysUntil <= 0 ? 'Expired' : 'Expiring Soon'}
      </h2>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 16px; margin: 0 0 16px;">
        ${urgencyText} Please update it to maintain your institutional access.
      </p>
      <div style="background-color: #f8f9fa; border-left: 4px solid ${color}; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Document</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${documentName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Expiry Date</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${expiryDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Days Remaining</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 700; color: ${color};">
              ${daysUntil <= 0 ? 'Expired' : `${daysUntil} day${daysUntil !== 1 ? 's' : ''}`}
            </td>
          </tr>
        </table>
      </div>
      <p style="font-size: 14px; color: #374151; margin: 0 0 24px;">
        Failure to update expired documents may result in restricted access to certain features.
      </p>
      ${ctaButton('Update Document', `${FRONTEND_URL}/institutional/onboard`, color)}
    </div>
  `;

  return {
    subject: `📄 Document ${daysUntil <= 0 ? 'Expired' : 'Expiring Soon'}: ${documentName}`,
    html: wrapInLayout(content),
    text: [
      `Document ${daysUntil <= 0 ? 'Expired' : 'Expiring Soon'}`,
      '',
      urgencyText,
      '',
      `Document: ${documentName}`,
      `Expiry Date: ${expiryDate}`,
      `Days Remaining: ${daysUntil <= 0 ? 'Expired' : daysUntil}`,
      '',
      'Please update your document to maintain institutional access.',
      '',
      `Update document: ${FRONTEND_URL}/institutional/onboard`,
    ].join('\n'),
  };
}
