import { wrapInLayout, ctaButton, FRONTEND_URL, WARNING_COLOR } from './layout.js';

interface TemplateData {
  device: string;
  ipAddress: string;
  location: string;
  timestamp: string;
}

export function render(data: TemplateData): { subject: string; html: string; text: string } {
  const { device, ipAddress, location, timestamp } = data;

  const content = `
    <div style="background-color: ${WARNING_COLOR}; padding: 16px 24px; border-radius: 8px 8px 0 0;">
      <h2 style="color: #ffffff; margin: 0; font-size: 20px;">
        🔐 New Login Detected
      </h2>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 16px; margin: 0 0 16px;">
        A new login to your Dualis Finance account was detected. If this was you, no action is needed.
      </p>
      <div style="background-color: #f8f9fa; border-left: 4px solid ${WARNING_COLOR}; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Device</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${device}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">IP Address</td>
            <td style="padding: 8px 0; text-align: right; font-family: monospace; font-size: 13px;">${ipAddress}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Location</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${location}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Time</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${timestamp}</td>
          </tr>
        </table>
      </div>
      <div style="background-color: #fffbeb; border: 1px solid #fbbf24; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px;">
        <p style="margin: 0; font-size: 14px; color: #92400e;">
          <strong>Don't recognize this login?</strong> If you did not initiate this session, please
          review your account security immediately and consider changing your credentials.
        </p>
      </div>
      ${ctaButton('Review Account Security', `${FRONTEND_URL}/settings`, WARNING_COLOR)}
    </div>
  `;

  return {
    subject: `🔐 New Login Detected — ${device}`,
    html: wrapInLayout(content),
    text: [
      'New Login Detected',
      '',
      'A new login to your Dualis Finance account was detected.',
      '',
      `Device: ${device}`,
      `IP Address: ${ipAddress}`,
      `Location: ${location}`,
      `Time: ${timestamp}`,
      '',
      "Don't recognize this login? Review your account security immediately.",
      '',
      `Review security: ${FRONTEND_URL}/settings`,
    ].join('\n'),
  };
}
