import { wrapInLayout, ctaButton, FRONTEND_URL, BRAND_COLOR, SUCCESS_COLOR, DANGER_COLOR } from './layout.js';

interface TemplateData {
  pool: string;
  oldRate: string;
  newRate: string;
  changePercent: string;
}

export function render(data: TemplateData): { subject: string; html: string; text: string } {
  const { pool, oldRate, newRate, changePercent } = data;

  const isIncrease = parseFloat(changePercent) > 0;
  const directionIcon = isIncrease ? '↑' : '↓';
  const directionWord = isIncrease ? 'increased' : 'decreased';
  const changeColor = isIncrease ? DANGER_COLOR : SUCCESS_COLOR;
  const displayChange = isIncrease ? `+${changePercent}%` : `${changePercent}%`;

  const content = `
    <div style="background-color: ${BRAND_COLOR}; padding: 16px 24px; border-radius: 8px 8px 0 0;">
      <h2 style="color: #ffffff; margin: 0; font-size: 20px;">
        📊 Interest Rate Change
      </h2>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 16px; margin: 0 0 16px;">
        The interest rate for the <strong>${pool}</strong> pool has ${directionWord}.
      </p>
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 24px; text-align: center;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="width: 40%; text-align: center; padding: 12px;">
              <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Previous Rate</div>
              <div style="font-size: 24px; font-weight: 700; color: #374151;">${oldRate}%</div>
            </td>
            <td style="width: 20%; text-align: center; padding: 12px;">
              <div style="font-size: 24px; color: ${changeColor}; font-weight: 700;">${directionIcon}</div>
              <div style="font-size: 13px; color: ${changeColor}; font-weight: 600;">${displayChange}</div>
            </td>
            <td style="width: 40%; text-align: center; padding: 12px;">
              <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">New Rate</div>
              <div style="font-size: 24px; font-weight: 700; color: ${changeColor};">${newRate}%</div>
            </td>
          </tr>
        </table>
      </div>
      <p style="font-size: 14px; color: #374151; margin: 0 0 24px;">
        This rate change may affect your current positions. Review your positions to ensure they
        still align with your strategy.
      </p>
      ${ctaButton('View Pool', `${FRONTEND_URL}/markets`, BRAND_COLOR)}
    </div>
  `;

  return {
    subject: `📊 Rate ${directionWord} for ${pool} (${displayChange})`,
    html: wrapInLayout(content),
    text: [
      'Interest Rate Change',
      '',
      `The interest rate for the ${pool} pool has ${directionWord}.`,
      '',
      `Previous Rate: ${oldRate}%`,
      `New Rate: ${newRate}%`,
      `Change: ${displayChange}`,
      '',
      'Review your positions to ensure they align with your strategy.',
      '',
      `View pool: ${FRONTEND_URL}/markets`,
    ].join('\n'),
  };
}
