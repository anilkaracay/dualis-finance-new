import { wrapInLayout, ctaButton, FRONTEND_URL, BRAND_COLOR, TEXT_MUTED } from './layout.js';

interface TemplateData {
  displayName?: string;
}

export function render(data: TemplateData): { subject: string; html: string; text: string } {
  const { displayName } = data;
  const greeting = displayName ? `Hello, ${displayName}!` : 'Hello!';

  const steps = [
    {
      number: '1',
      title: 'Connect Wallet',
      description: 'Link your Cardano wallet to access all protocol features securely.',
    },
    {
      number: '2',
      title: 'Explore Markets',
      description: 'Browse available lending and borrowing pools with real-time rates.',
    },
    {
      number: '3',
      title: 'Start Lending',
      description: 'Deposit assets to start earning yield on your holdings.',
    },
  ];

  const stepsHtml = steps.map((step) => `
    <tr>
      <td style="padding: 16px; vertical-align: top; width: 48px;">
        <div style="width: 36px; height: 36px; border-radius: 50%; background-color: ${BRAND_COLOR}; color: #ffffff; font-size: 16px; font-weight: 700; text-align: center; line-height: 36px;">
          ${step.number}
        </div>
      </td>
      <td style="padding: 16px; vertical-align: top;">
        <strong style="font-size: 15px; color: #111827;">${step.title}</strong>
        <p style="margin: 4px 0 0; font-size: 14px; color: ${TEXT_MUTED};">${step.description}</p>
      </td>
    </tr>
  `).join('');

  const content = `
    <div style="background-color: ${BRAND_COLOR}; padding: 32px 24px; border-radius: 8px 8px 0 0; text-align: center;">
      <h1 style="color: #ffffff; margin: 0 0 8px; font-size: 28px;">Welcome to Dualis Finance</h1>
      <p style="color: rgba(255,255,255,0.85); margin: 0; font-size: 16px;">Institutional-Grade DeFi on Cardano</p>
    </div>
    <div style="padding: 24px;">
      <p style="font-size: 16px; margin: 0 0 8px;">${greeting}</p>
      <p style="font-size: 16px; margin: 0 0 24px;">
        Thank you for joining Dualis Finance. We are building the premier institutional-grade
        lending and borrowing protocol on Cardano, powered by Canton Network settlement.
      </p>
      <h3 style="font-size: 16px; color: #111827; margin: 0 0 8px;">Get started in three steps:</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        ${stepsHtml}
      </table>
      ${ctaButton('Get Started', `${FRONTEND_URL}/overview`, BRAND_COLOR)}
      <p style="font-size: 13px; color: ${TEXT_MUTED}; text-align: center; margin: 24px 0 0;">
        Need help? Visit our documentation or reach out to our support team anytime.
      </p>
    </div>
  `;

  return {
    subject: 'Welcome to Dualis Finance — Get Started Today',
    html: wrapInLayout(content),
    text: [
      'Welcome to Dualis Finance',
      '',
      greeting,
      '',
      'Thank you for joining Dualis Finance. We are building the premier institutional-grade lending and borrowing protocol on Cardano, powered by Canton Network settlement.',
      '',
      'Get started in three steps:',
      '',
      '1. Connect Wallet — Link your Cardano wallet to access all protocol features securely.',
      '2. Explore Markets — Browse available lending and borrowing pools with real-time rates.',
      '3. Start Lending — Deposit assets to start earning yield on your holdings.',
      '',
      `Get started: ${FRONTEND_URL}/overview`,
    ].join('\n'),
  };
}
