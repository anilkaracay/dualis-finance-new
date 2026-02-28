'use client';

import { Callout } from '@/components/docs/Callout';

export default function BrandPage() {
  return (
    <>
      <h1>Brand Assets</h1>
      <p className="docs-lead">
        This page documents the Dualis Finance brand identity including color palette, typography,
        and logo usage guidelines. Use these specifications when creating integrations, marketing
        materials, or referencing Dualis in partner communications.
      </p>

      <h2 id="colors">Brand Colors</h2>
      <p>
        The Dualis color system is built around a teal accent on a dark background, conveying
        trust, precision, and financial sophistication. The palette adapts for both dark and
        light contexts.
      </p>

      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Color</th>
              <th>Hex</th>
              <th>Usage</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: 4, background: '#2DD4BF' }} />
                  Teal (Dark Mode)
                </span>
              </td>
              <td><code>#2DD4BF</code></td>
              <td>Primary accent on dark backgrounds. Used for interactive elements, highlights, and the logo mark.</td>
            </tr>
            <tr>
              <td>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: 4, background: '#0D9488' }} />
                  Teal (Light Mode)
                </span>
              </td>
              <td><code>#0D9488</code></td>
              <td>Primary accent on light backgrounds. Darker teal ensures WCAG AA contrast compliance on white.</td>
            </tr>
            <tr>
              <td>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: 4, background: '#09090B', border: '1px solid #333' }} />
                  Dark Background
                </span>
              </td>
              <td><code>#09090B</code></td>
              <td>Primary background in dark mode. Used across the application shell, documentation, and marketing pages.</td>
            </tr>
            <tr>
              <td>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ display: 'inline-block', width: 16, height: 16, borderRadius: 4, background: '#FAFAFA', border: '1px solid #e5e5e5' }} />
                  Light Background
                </span>
              </td>
              <td><code>#FAFAFA</code></td>
              <td>Primary background in light mode. Clean, neutral surface for content readability.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <Callout type="tip" title="Accessibility">
        The dual teal values are not cosmetic variants. The dark-mode teal (#2DD4BF) is
        specifically calibrated for contrast on dark backgrounds, while the light-mode teal
        (#0D9488) meets WCAG AA requirements on white. Always use the appropriate variant for
        the background context.
      </Callout>

      <h2 id="typography">Typography</h2>
      <p>
        Dualis uses three typefaces, each serving a distinct role in the visual hierarchy:
      </p>

      <div className="docs-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Typeface</th>
              <th>Role</th>
              <th>Usage</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Plus Jakarta Sans</strong></td>
              <td>Body</td>
              <td>
                Primary typeface for all body text, navigation, buttons, form labels, and UI
                elements. A geometric sans-serif with excellent readability at small sizes and
                a modern, professional character.
              </td>
            </tr>
            <tr>
              <td><strong>JetBrains Mono</strong></td>
              <td>Code</td>
              <td>
                Monospaced typeface for code blocks, inline code, contract addresses, transaction
                hashes, and technical data. Designed for developer-facing content with
                distinguishable characters (0/O, 1/l/I).
              </td>
            </tr>
            <tr>
              <td><strong>Instrument Serif</strong></td>
              <td>Display</td>
              <td>
                Serif typeface used sparingly for hero headings, marketing titles, and editorial
                content. Provides visual contrast against the sans-serif body text and conveys
                institutional gravitas.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="logo-usage">Logo Usage</h2>
      <p>
        The Dualis Finance logo consists of a stylized &quot;D&quot; mark in the primary teal
        color alongside the &quot;DUALIS&quot; wordmark in the body typeface. The following
        guidelines apply to all uses of the logo:
      </p>
      <ul>
        <li>
          <strong>Clear space:</strong> Maintain a minimum clear space equal to the height of the
          &quot;D&quot; mark on all sides. No other elements should encroach on this zone.
        </li>
        <li>
          <strong>Minimum size:</strong> The logo should not be reproduced smaller than 24px in
          height for digital applications or 10mm for print.
        </li>
        <li>
          <strong>Color variants:</strong> Use the full-color logo (teal mark + dark text) on
          light backgrounds. Use the inverted logo (teal mark + white text) on dark backgrounds.
          A monochrome white variant is available for single-color contexts.
        </li>
        <li>
          <strong>Do not:</strong> Stretch, rotate, add effects (shadows, gradients, outlines),
          change the typeface, or alter the proportions of the logo. Do not place the logo on
          busy backgrounds where legibility is compromised.
        </li>
      </ul>

      <h2 id="sub-brand">Sub-Brand: FINANCE</h2>
      <p>
        The &quot;FINANCE&quot; sub-label appears in a lighter weight with extended letter-spacing
        adjacent to the DUALIS wordmark. It uses Plus Jakarta Sans at font-weight 300 with
        0.2em letter-spacing. This sub-brand element should always accompany the full wordmark
        and should not be used independently.
      </p>

      <h2 id="downloads">Asset Downloads</h2>
      <p>
        Brand assets including logo files (SVG, PNG), color swatches, and typography specimens
        are available on request. Contact{' '}
        <a href="mailto:info@cayvox.com" style={{ color: 'var(--docs-accent)' }}>
          info@cayvox.com
        </a>{' '}
        for the brand asset package.
      </p>
    </>
  );
}
