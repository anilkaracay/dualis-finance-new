import { wrapInLayout, ctaButton, severityColor, FRONTEND_URL } from './layout.js';

interface TemplateData {
  severity: 'critical' | 'warning' | 'info';
  healthFactor: number;
  pool: string;
  positionId: string;
}

export function render(data: TemplateData): { subject: string; html: string; text: string } {
  const { severity, healthFactor, pool, positionId } = data;
  const color = severityColor(severity);
  const hfDisplay = healthFactor.toFixed(2);

  const advice =
    severity === 'critical'
      ? 'Your position is at immediate risk of liquidation. Please add collateral or repay debt urgently.'
      : 'Consider adding collateral or repaying some debt to improve your position health.';

  const content = `
    <div style="background-color: ${color}; padding: 16px 24px; border-radius: 8px 8px 0 0;">
      <h2 style="color: #ffffff; margin: 0; font-size: 20px;">
        ⚠ Health Factor ${severity === 'critical' ? 'Critical' : 'Warning'}
      </h2>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 16px; margin: 0 0 16px;">
        Your health factor for the <strong>${pool}</strong> pool has dropped to a concerning level.
      </p>
      <div style="background-color: #f8f9fa; border-left: 4px solid ${color}; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Health Factor</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 700; font-size: 18px; color: ${color};">${hfDisplay}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Pool</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${pool}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Position ID</td>
            <td style="padding: 8px 0; text-align: right; font-family: monospace; font-size: 13px;">${positionId}</td>
          </tr>
        </table>
      </div>
      <p style="font-size: 14px; color: #374151; margin: 0 0 24px;">${advice}</p>
      ${ctaButton('View Position', `${FRONTEND_URL}/borrow`, color)}
    </div>
  `;

  return {
    subject: `⚠ Health Factor ${severity === 'critical' ? 'Critical' : 'Warning'} — ${pool} (HF: ${hfDisplay})`,
    html: wrapInLayout(content),
    text: [
      `Health Factor ${severity === 'critical' ? 'Critical' : 'Warning'}`,
      '',
      `Your health factor for the ${pool} pool has dropped to ${hfDisplay}.`,
      `Position ID: ${positionId}`,
      '',
      advice,
      '',
      `View your position: ${FRONTEND_URL}/borrow`,
    ].join('\n'),
  };
}
