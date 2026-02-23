import { wrapInLayout, ctaButton, FRONTEND_URL, DANGER_COLOR } from './layout.js';

interface TemplateData {
  pool: string;
  amount: string;
  penalty: string;
  remainingCollateral: string;
  positionId: string;
}

export function render(data: TemplateData): { subject: string; html: string; text: string } {
  const { pool, amount, penalty, remainingCollateral, positionId } = data;

  const content = `
    <div style="background-color: ${DANGER_COLOR}; padding: 16px 24px; border-radius: 8px 8px 0 0;">
      <h2 style="color: #ffffff; margin: 0; font-size: 20px;">
        🔴 Liquidation Executed
      </h2>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 16px; margin: 0 0 16px;">
        A liquidation has been executed on your position in the <strong>${pool}</strong> pool.
      </p>
      <div style="background-color: #fef2f2; border-left: 4px solid ${DANGER_COLOR}; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Liquidated Amount</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 700; font-size: 16px; color: ${DANGER_COLOR};">${amount}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Liquidation Penalty</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600; color: ${DANGER_COLOR};">${penalty}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Remaining Collateral</td>
            <td style="padding: 8px 0; text-align: right; font-weight: 600;">${remainingCollateral}</td>
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
      <p style="font-size: 14px; color: #374151; margin: 0 0 24px;">
        To avoid future liquidations, consider maintaining a higher health factor by adding more
        collateral or reducing your borrow balance.
      </p>
      ${ctaButton('View Details', `${FRONTEND_URL}/borrow`, DANGER_COLOR)}
    </div>
  `;

  return {
    subject: `🔴 Liquidation Executed — ${pool} Pool`,
    html: wrapInLayout(content),
    text: [
      'Liquidation Executed',
      '',
      `A liquidation has been executed on your position in the ${pool} pool.`,
      '',
      `Liquidated Amount: ${amount}`,
      `Liquidation Penalty: ${penalty}`,
      `Remaining Collateral: ${remainingCollateral}`,
      `Position ID: ${positionId}`,
      '',
      'To avoid future liquidations, consider maintaining a higher health factor by adding more collateral or reducing your borrow balance.',
      '',
      `View details: ${FRONTEND_URL}/borrow`,
    ].join('\n'),
  };
}
