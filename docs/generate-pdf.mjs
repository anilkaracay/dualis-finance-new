/**
 * Dualis Finance — Premium Whitepaper PDF Generator
 * Dark cover + light content theme
 * Usage: node generate-pdf.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { marked } from 'marked';
import puppeteer from 'puppeteer';
import katex from 'katex';

// ─── KaTeX math rendering ───
function renderMath(text) {
  // Display math: $$...$$
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, tex) => {
    try {
      return `<div class="math-display">${katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false, output: 'html' })}</div>`;
    } catch {
      return `<div class="math-display">${tex.trim()}</div>`;
    }
  });
  // Inline math: $...$  (but not $$)
  text = text.replace(/(?<!\$)\$(?!\$)([^\$\n]+?)\$(?!\$)/g, (_, tex) => {
    try {
      return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false, output: 'html' });
    } catch {
      return tex.trim();
    }
  });
  return text;
}

// ─── Read and parse markdown ───
const md = readFileSync('DUALIS_FINANCE_WHITEPAPER_v1.md', 'utf-8');

// Split off the cover/abstract (before section 1)
const sectionSplit = md.split(/(?=^## 1\. )/m);
const frontMatter = sectionSplit[0];
const mainContent = sectionSplit.slice(1).join('');

// Render math before markdown parsing
const mainWithMath = renderMath(mainContent);
const frontWithMath = renderMath(frontMatter);

// Parse markdown to HTML
const htmlContent = marked.parse(mainWithMath, { breaks: false, gfm: true });
const abstractHtml = marked.parse(frontWithMath, { breaks: false, gfm: true });

// Extract abstract text (plain, no math in abstract)
const abstractMatch = frontMatter.match(/## Abstract\n\n([\s\S]*?)(?=\n---|\n## )/);
const abstractText = abstractMatch ? abstractMatch[1].trim() : '';

// Build full HTML document
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dualis Finance — Technical Whitepaper v1.0</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css">
<style>
/* ═══════════════════════════════════════════════════════
   DUALIS FINANCE — WHITEPAPER PDF STYLESHEET
   Dark cover + Light content theme
   ═══════════════════════════════════════════════════════ */

:root {
  /* Cover (dark) */
  --cover-bg: #09090B;
  --cover-text: #FAFAFA;
  --cover-muted: #71717A;
  --cover-faint: #3F3F46;

  /* Content (light) */
  --bg: #FFFFFF;
  --bg-elevated: #F8FAFC;
  --bg-card: #F1F5F9;
  --bg-subtle: #E2E8F0;
  --text: #0F172A;
  --text-secondary: #334155;
  --text-muted: #64748B;
  --text-faint: #94A3B8;
  --accent: #0D9488;
  --accent-light: #14B8A6;
  --accent-dim: rgba(13, 148, 136, 0.06);
  --accent-border: rgba(13, 148, 136, 0.20);
  --border: #E2E8F0;
  --border-strong: #CBD5E1;
  --font: 'Plus Jakarta Sans', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --font-serif: 'Crimson Pro', Georgia, serif;
}

@page {
  size: A4;
  margin: 24mm 24mm 30mm 24mm;
}

@page :first { margin: 0; }

* { box-sizing: border-box; }

body {
  font-family: var(--font);
  font-size: 11pt;
  line-height: 1.85;
  color: var(--text-secondary);
  background: var(--bg);
  margin: 0;
  padding: 0;
  -webkit-font-smoothing: antialiased;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* ─── COVER PAGE (DARK) ─── */
.cover {
  width: 210mm;
  height: 297mm;
  background: var(--cover-bg);
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 64px 56px;
  overflow: hidden;
  page-break-after: always;
}

/* Gradient orb — top-right */
.cover::before {
  content: '';
  position: absolute;
  width: 700px;
  height: 700px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(45,212,191,0.20) 0%, rgba(45,212,191,0.06) 35%, transparent 65%);
  top: -180px;
  right: -200px;
  filter: blur(80px);
}

/* Secondary orb — bottom-left */
.cover::after {
  content: '';
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(94,234,212,0.10) 0%, transparent 60%);
  bottom: 80px;
  left: -120px;
  filter: blur(60px);
}

/* Grid overlay */
.cover-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(45,212,191,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(45,212,191,0.025) 1px, transparent 1px);
  background-size: 32px 32px;
  mask-image: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.3) 70%, transparent 100%);
  -webkit-mask-image: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.3) 70%, transparent 100%);
}

.cover-content {
  position: relative;
  z-index: 1;
}

.cover-logo {
  font-family: var(--font);
  font-size: 13pt;
  font-weight: 800;
  letter-spacing: 0.3em;
  margin-bottom: 80px;
}
.cover-logo span:first-child { color: #2DD4BF; }
.cover-logo span:last-child { color: var(--cover-text); }

.cover-badge {
  display: inline-block;
  padding: 5px 14px;
  border: 1px solid rgba(45, 212, 191, 0.15);
  border-radius: 20px;
  font-size: 8pt;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #2DD4BF;
  margin-bottom: 28px;
}

.cover-title {
  font-family: var(--font);
  font-size: 52pt;
  font-weight: 800;
  line-height: 1.04;
  letter-spacing: -0.035em;
  color: var(--cover-text);
  margin: 0 0 16px 0;
}

.cover-subtitle {
  font-family: var(--font);
  font-size: 16pt;
  font-weight: 400;
  line-height: 1.45;
  color: var(--cover-muted);
  margin: 0 0 48px 0;
  max-width: 85%;
}

.cover-line {
  width: 56px;
  height: 2px;
  background: linear-gradient(90deg, #2DD4BF, #5EEAD4);
  border-radius: 1px;
  margin-bottom: 28px;
}

.cover-meta {
  display: flex;
  gap: 40px;
  font-size: 9pt;
  color: var(--cover-muted);
}

.cover-meta-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.cover-meta-label {
  font-size: 7pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--cover-faint);
}

.cover-meta-value {
  font-weight: 500;
  color: #B4B4BC;
}

.cover-footer {
  position: absolute;
  bottom: 32px;
  left: 56px;
  right: 56px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 7.5pt;
  color: var(--cover-faint);
  letter-spacing: 0.05em;
  z-index: 1;
}

/* ─── ABSTRACT PAGE (LIGHT) ─── */
.abstract-page {
  page-break-after: always;
  padding-top: 24px;
}

.abstract-label {
  font-size: 8pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--accent);
  margin-bottom: 20px;
}

.abstract-text {
  font-family: var(--font-serif);
  font-size: 11.5pt;
  line-height: 1.78;
  color: var(--text-secondary);
  text-align: justify;
  hyphens: auto;
  max-width: 100%;
}

.abstract-text::first-letter {
  font-size: 34pt;
  font-weight: 700;
  color: var(--accent);
  float: left;
  line-height: 0.85;
  margin-right: 6px;
  margin-top: 4px;
}

/* ─── TABLE OF CONTENTS (LIGHT) ─── */
.toc-page {
  page-break-after: always;
  padding-top: 24px;
}

.toc-title {
  font-size: 8pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--accent);
  margin-bottom: 32px;
}

.toc-section {
  display: flex;
  align-items: baseline;
  padding: 9px 0;
  border-bottom: 1px solid var(--border);
  text-decoration: none;
}

.toc-num {
  font-weight: 700;
  color: var(--accent);
  min-width: 28px;
  font-size: 9pt;
  font-variant-numeric: tabular-nums;
}

.toc-label {
  flex: 1;
  font-weight: 600;
  color: var(--text);
  font-size: 10.5pt;
}

.toc-dots {
  flex: 1;
  border-bottom: 1px dotted var(--text-faint);
  margin: 0 8px;
  min-width: 20px;
}

.toc-sub {
  padding-left: 28px;
}
.toc-sub .toc-label {
  font-weight: 400;
  color: var(--text-secondary);
  font-size: 9.5pt;
}
.toc-sub .toc-num {
  color: var(--text-muted);
  font-weight: 500;
}

.toc-appendix {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-strong);
}
.toc-appendix .toc-num { color: var(--text-muted); }

/* ─── MAIN CONTENT TYPOGRAPHY (LIGHT) ─── */
.content {
  max-width: 100%;
}

h1 {
  font-family: var(--font);
  font-size: 24pt;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  color: var(--text);
  margin: 0 0 12px 0;
  page-break-after: avoid;
}

h2 {
  font-family: var(--font);
  font-size: 18pt;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: var(--text);
  margin-top: 40px;
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--accent);
  page-break-after: avoid;
  page-break-before: always;
}

.content > h2:first-child {
  page-break-before: avoid;
}

h3 {
  font-family: var(--font);
  font-size: 12.5pt;
  font-weight: 600;
  line-height: 1.3;
  color: var(--text);
  margin-top: 24px;
  margin-bottom: 10px;
  page-break-after: avoid;
}

h4 {
  font-family: var(--font);
  font-size: 10pt;
  font-weight: 700;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 16px;
  margin-bottom: 6px;
  page-break-after: avoid;
}

p {
  margin: 0 0 12px 0;
  text-align: justify;
  hyphens: auto;
}

strong {
  font-weight: 600;
  color: var(--text);
}

em {
  font-style: italic;
  color: var(--text-secondary);
}

a {
  color: var(--accent);
  text-decoration: none;
}

/* ─── LISTS ─── */
ul, ol {
  margin: 0 0 10px 0;
  padding-left: 20px;
}

li {
  margin-bottom: 5px;
  line-height: 1.7;
}

li::marker {
  color: var(--accent);
}

/* ─── TABLES ─── */
table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin: 18px 0 22px;
  font-size: 8.5pt;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--border-strong);
  page-break-inside: avoid;
}

thead th {
  padding: 8px 10px;
  font-weight: 700;
  font-size: 7pt;
  color: #FFFFFF;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  text-align: left;
  background: #0F172A;
  border-bottom: 2px solid var(--accent);
}

tbody td {
  padding: 6px 10px;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border);
  vertical-align: top;
}

tbody tr:last-child td {
  border-bottom: none;
}

tbody tr:nth-child(even) {
  background: var(--bg-elevated);
}

tbody td:first-child {
  font-weight: 500;
  color: var(--text);
}

/* ─── CODE ─── */
code {
  font-family: var(--font-mono);
  font-size: 8pt;
  background: var(--accent-dim);
  border: 1px solid var(--accent-border);
  padding: 1px 4px;
  border-radius: 3px;
  color: var(--accent);
}

pre {
  background: #0F172A;
  border: 1px solid #1E293B;
  border-left: 3px solid var(--accent);
  border-radius: 0 6px 6px 0;
  padding: 12px 14px;
  overflow-x: auto;
  font-family: var(--font-mono);
  font-size: 7.5pt;
  line-height: 1.55;
  color: #E2E8F0;
  margin: 10px 0 14px;
  page-break-inside: avoid;
}

pre code {
  background: none;
  border: none;
  padding: 0;
  color: inherit;
  font-size: inherit;
}

/* ─── BLOCKQUOTES ─── */
blockquote {
  border-left: 3px solid var(--accent);
  padding: 12px 18px;
  margin: 14px 0;
  background: var(--accent-dim);
  border-radius: 0 6px 6px 0;
  page-break-inside: avoid;
}

blockquote p {
  color: var(--text-secondary);
  font-style: italic;
  margin-bottom: 0;
  font-size: 9.5pt;
}

/* ─── HORIZONTAL RULES ─── */
hr {
  border: none;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--border) 15%,
    var(--border-strong) 50%,
    var(--border) 85%,
    transparent 100%
  );
  margin: 24px 0;
}

/* ─── SECTION LABEL ─── */
h2::before {
  display: block;
  font-size: 7.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--accent);
  margin-bottom: 6px;
}

/* ─── MATH/FORMULA DISPLAY ─── */
.math-display {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-left: 3px solid var(--accent);
  border-radius: 0 6px 6px 0;
  padding: 14px 18px;
  margin: 14px 0;
  text-align: center;
  color: var(--text);
  overflow-x: auto;
  page-break-inside: avoid;
}

.math-display .katex { font-size: 1.05em; }
.katex { font-size: 0.95em; color: var(--text); }

/* ─── PRINT UTILITIES ─── */
.page-break { page-break-before: always; break-before: page; }
.no-break { page-break-inside: avoid; break-inside: avoid; }

</style>
</head>
<body>

<!-- ═══════ COVER PAGE (DARK) ═══════ -->
<div class="cover">
  <div class="cover-grid"></div>
  <div class="cover-content">
    <div class="cover-logo">
      <span>D</span><span>UALIS</span>
    </div>
    <div class="cover-badge">Technical Whitepaper v1.0</div>
    <h1 class="cover-title">Dualis<br>Finance</h1>
    <p class="cover-subtitle">Institutional-Grade Hybrid Lending Infrastructure<br>for the Tokenized Economy</p>
    <div class="cover-line"></div>
    <div class="cover-meta">
      <div class="cover-meta-item">
        <span class="cover-meta-label">Organization</span>
        <span class="cover-meta-value">Cayvox Labs</span>
      </div>
      <div class="cover-meta-item">
        <span class="cover-meta-label">Date</span>
        <span class="cover-meta-value">March 2026</span>
      </div>
      <div class="cover-meta-item">
        <span class="cover-meta-label">Contact</span>
        <span class="cover-meta-value">info@dualis.finance</span>
      </div>
    </div>
  </div>
  <div class="cover-footer">
    <span>Confidential — Cayvox Labs © 2026</span>
    <span>dualis.finance</span>
  </div>
</div>

<!-- ═══════ ABSTRACT PAGE ═══════ -->
<div class="abstract-page">
  <div class="abstract-label">Abstract</div>
  <div class="abstract-text">${abstractText.replace(/\n/g, ' ')}</div>
</div>

<!-- ═══════ TABLE OF CONTENTS ═══════ -->
<div class="toc-page">
  <div class="toc-title">Contents</div>

  <div class="toc-section"><span class="toc-num">01</span><span class="toc-label">Introduction</span></div>
  <div class="toc-section toc-sub"><span class="toc-num">1.1</span><span class="toc-label">The Structural Gap</span></div>
  <div class="toc-section toc-sub"><span class="toc-num">1.2</span><span class="toc-label">The Tokenization Catalyst</span></div>
  <div class="toc-section toc-sub"><span class="toc-num">1.3</span><span class="toc-label">Thesis Statement</span></div>

  <div class="toc-section"><span class="toc-num">02</span><span class="toc-label">Protocol Architecture</span></div>
  <div class="toc-section toc-sub"><span class="toc-num">2.1</span><span class="toc-label">System Overview</span></div>
  <div class="toc-section toc-sub"><span class="toc-num">2.2</span><span class="toc-label">Hybrid On-Chain / Off-Chain Design</span></div>
  <div class="toc-section toc-sub"><span class="toc-num">2.3</span><span class="toc-label">Canton Network Integration</span></div>
  <div class="toc-section toc-sub"><span class="toc-num">2.4</span><span class="toc-label">Technology Stack</span></div>

  <div class="toc-section"><span class="toc-num">03</span><span class="toc-label">Hybrid Lending Protocol</span></div>
  <div class="toc-section toc-sub"><span class="toc-num">3.1</span><span class="toc-label">Supply and Borrow Mechanics</span></div>
  <div class="toc-section toc-sub"><span class="toc-num">3.2</span><span class="toc-label">Interest Rate Model</span></div>
  <div class="toc-section toc-sub"><span class="toc-num">3.3</span><span class="toc-label">Index-Based Interest Accrual</span></div>
  <div class="toc-section toc-sub"><span class="toc-num">3.4</span><span class="toc-label">Health Factor and Liquidation</span></div>
  <div class="toc-section toc-sub"><span class="toc-num">3.5</span><span class="toc-label">Flash Loans</span></div>

  <div class="toc-section"><span class="toc-num">04</span><span class="toc-label">Asset-Agnostic Collateral Framework</span></div>
  <div class="toc-section"><span class="toc-num">05</span><span class="toc-label">Hybrid Credit Scoring System</span></div>
  <div class="toc-section"><span class="toc-num">06</span><span class="toc-label">Liquidation Engine</span></div>
  <div class="toc-section"><span class="toc-num">07</span><span class="toc-label">Securities Lending Protocol</span></div>
  <div class="toc-section"><span class="toc-num">08</span><span class="toc-label">Governance and Tokenomics</span></div>
  <div class="toc-section"><span class="toc-num">09</span><span class="toc-label">Privacy and Dual-Track Architecture</span></div>
  <div class="toc-section"><span class="toc-num">10</span><span class="toc-label">Oracle and Price Feed System</span></div>
  <div class="toc-section"><span class="toc-num">11</span><span class="toc-label">Security Considerations</span></div>
  <div class="toc-section"><span class="toc-num">12</span><span class="toc-label">Canton Network and Ecosystem</span></div>
  <div class="toc-section"><span class="toc-num">13</span><span class="toc-label">Roadmap and Conclusion</span></div>

  <div class="toc-section toc-appendix"><span class="toc-num">A</span><span class="toc-label">DAML Smart Contract Templates</span></div>
  <div class="toc-section toc-appendix"><span class="toc-num">—</span><span class="toc-label">References</span></div>
</div>

<!-- ═══════ MAIN CONTENT ═══════ -->
<div class="content">
${htmlContent}
</div>

</body>
</html>`;

// Write intermediate HTML for debugging
writeFileSync('DUALIS_FINANCE_WHITEPAPER_v1.html', html);
console.log('HTML generated: DUALIS_FINANCE_WHITEPAPER_v1.html');

// Generate PDF
const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });

// Wait for fonts to load
await page.evaluateHandle('document.fonts.ready');
await new Promise(r => setTimeout(r, 2000));

await page.pdf({
  path: 'DUALIS_FINANCE_WHITEPAPER_v1.pdf',
  format: 'A4',
  printBackground: true,
  margin: {
    top: '24mm',
    bottom: '30mm',
    left: '24mm',
    right: '24mm',
  },
  displayHeaderFooter: true,
  headerTemplate: `
    <div style="width:100%;font-family:'Plus Jakarta Sans',sans-serif;font-size:7pt;color:#94A3B8;display:flex;justify-content:space-between;padding:0 24mm;">
      <span>Dualis Finance — Technical Whitepaper v1.0</span>
      <span>Confidential</span>
    </div>
  `,
  footerTemplate: `
    <div style="width:100%;font-family:'Plus Jakarta Sans',sans-serif;font-size:7pt;color:#94A3B8;display:flex;justify-content:space-between;padding:0 24mm;">
      <span>Cayvox Labs © 2026</span>
      <span style="font-variant-numeric:tabular-nums;"><span class="pageNumber"></span></span>
    </div>
  `,
  preferCSSPageSize: false,
});

await browser.close();
console.log('PDF generated: DUALIS_FINANCE_WHITEPAPER_v1.pdf');
