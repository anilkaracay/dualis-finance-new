import { createChildLogger } from '../../config/logger.js';
import type {
  ExportType,
  ExportFormat,
  UserTransaction,
  TaxReportEntry,
  TimeSeriesPoint,
} from '@dualis/shared';
import { getUserTransactions, getTaxReport } from './portfolioAnalytics.service.js';
import { getPoolTimeSeries } from './poolAnalytics.service.js';
import { getRevenueSummary } from './revenue.service.js';

const log = createChildLogger('export-service');

// ---------------------------------------------------------------------------
// CSV Generator
// ---------------------------------------------------------------------------

function toCsv(headers: string[], rows: string[][]): string {
  const escape = (v: string) => {
    if (v.includes(',') || v.includes('"') || v.includes('\n')) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  };

  const lines = [
    headers.map(escape).join(','),
    ...rows.map(row => row.map(escape).join(',')),
  ];
  return lines.join('\n');
}

function transactionsToCsv(transactions: UserTransaction[]): string {
  const headers = ['Date', 'Type', 'Asset', 'Amount', 'USD Value', 'Pool'];
  const rows = transactions.map(tx => [
    tx.createdAt,
    tx.type,
    tx.asset,
    tx.amount.toString(),
    tx.amountUsd.toFixed(2),
    tx.poolId,
  ]);
  return toCsv(headers, rows);
}

function taxReportToCsv(entries: TaxReportEntry[]): string {
  const headers = ['Date', 'Type', 'Asset', 'Amount', 'USD Value', 'Fee', 'Running Balance'];
  const rows = entries.map(e => [
    e.date,
    e.type,
    e.asset,
    e.amount.toString(),
    e.usdValue.toFixed(2),
    e.fee.toFixed(2),
    e.runningBalance.toFixed(2),
  ]);
  return toCsv(headers, rows);
}

function poolHistoryToCsv(points: TimeSeriesPoint[]): string {
  const headers = ['Date', 'Value'];
  const rows = points.map(p => [p.timestamp, p.value.toString()]);
  return toCsv(headers, rows);
}

function revenueToCsv(): string {
  const summary = getRevenueSummary();
  const headers = ['Date', 'Revenue USD'];
  const rows = summary.dailyRevenue.map(p => [p.timestamp, p.value.toFixed(2)]);
  return toCsv(headers, rows);
}

// ---------------------------------------------------------------------------
// PDF Generator (HTML template)
// ---------------------------------------------------------------------------

function generatePdfHtml(title: string, content: string): string {
  return `<!DOCTYPE html>
<html><head>
<style>
  body { font-family: 'Helvetica Neue', sans-serif; padding: 40px; color: #1a1a2e; }
  .header { display: flex; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #0066FF; padding-bottom: 15px; }
  .logo { font-size: 24px; font-weight: bold; color: #0066FF; }
  .subtitle { color: #666; font-size: 12px; margin-top: 4px; }
  .date { margin-left: auto; color: #666; font-size: 12px; }
  h1 { font-size: 18px; color: #1a1a2e; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; margin: 15px 0; }
  th { background: #f0f4ff; padding: 10px; text-align: left; font-size: 12px; border-bottom: 1px solid #ddd; }
  td { padding: 8px 10px; font-size: 12px; border-bottom: 1px solid #eee; }
  .summary-card { display: inline-block; width: 22%; padding: 15px; margin: 5px; background: #f8f9ff; border-radius: 8px; }
  .summary-label { font-size: 11px; color: #666; }
  .summary-value { font-size: 20px; font-weight: bold; color: #1a1a2e; }
  .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; font-size: 10px; color: #999; }
</style>
</head><body>
<div class="header">
  <div>
    <div class="logo">DUALIS FINANCE</div>
    <div class="subtitle">Analytics Report</div>
  </div>
  <div class="date">Generated: ${new Date().toISOString().split('T')[0]}</div>
</div>
<h1>${title}</h1>
${content}
<div class="footer">This report is generated automatically by Dualis Finance. For questions, contact support@dualis.finance</div>
</body></html>`;
}

function transactionsPdfHtml(transactions: UserTransaction[]): string {
  const rows = transactions.map(tx =>
    `<tr><td>${tx.createdAt.split('T')[0]}</td><td>${tx.type}</td><td>${tx.asset}</td><td>${tx.amount}</td><td>$${tx.amountUsd.toLocaleString()}</td></tr>`
  ).join('');

  return generatePdfHtml('Transaction History', `
    <table>
      <tr><th>Date</th><th>Type</th><th>Asset</th><th>Amount</th><th>USD Value</th></tr>
      ${rows}
    </table>
  `);
}

function taxReportPdfHtml(entries: TaxReportEntry[], year: number): string {
  const rows = entries.map(e =>
    `<tr><td>${e.date}</td><td>${e.type}</td><td>${e.asset}</td><td>${e.amount}</td><td>$${e.usdValue.toFixed(2)}</td></tr>`
  ).join('');

  return generatePdfHtml(`Tax Report — ${year}`, `
    <table>
      <tr><th>Date</th><th>Type</th><th>Asset</th><th>Amount</th><th>USD Value</th></tr>
      ${rows}
    </table>
  `);
}

// ---------------------------------------------------------------------------
// Export Dispatcher
// ---------------------------------------------------------------------------

export interface ExportResult {
  content: string;
  contentType: string;
  fileName: string;
}

export function generateExport(
  type: ExportType,
  format: ExportFormat,
  userId: string,
  options?: { year?: number; poolId?: string; from?: string; to?: string },
): ExportResult {
  log.info({ type, format, userId }, 'Generating export');

  const ext = format === 'csv' ? 'csv' : 'html';
  const contentType = format === 'csv' ? 'text/csv' : 'text/html';

  switch (type) {
    case 'user_transactions': {
      const { transactions } = getUserTransactions(userId, 1000, 0);
      const content = format === 'csv'
        ? transactionsToCsv(transactions)
        : transactionsPdfHtml(transactions);
      return {
        content,
        contentType,
        fileName: `dualis_transactions_${new Date().toISOString().slice(0, 7)}.${ext}`,
      };
    }

    case 'tax_report': {
      const year = options?.year ?? new Date().getFullYear() - 1;
      const report = getTaxReport(userId, year);
      const content = format === 'csv'
        ? taxReportToCsv(report.entries)
        : taxReportPdfHtml(report.entries, year);
      return {
        content,
        contentType,
        fileName: `dualis_tax_report_${year}.${ext}`,
      };
    }

    case 'pool_history': {
      const poolId = options?.poolId ?? 'pool_usdc';
      const points = getPoolTimeSeries(poolId, 'tvl', '1y');
      const content = format === 'csv'
        ? poolHistoryToCsv(points)
        : generatePdfHtml(`Pool History — ${poolId}`, `<p>${points.length} data points</p>`);
      return {
        content,
        contentType,
        fileName: `dualis_pool_history_${poolId}.${ext}`,
      };
    }

    case 'revenue': {
      const content = format === 'csv'
        ? revenueToCsv()
        : generatePdfHtml('Revenue Report', '<p>Daily revenue breakdown</p>');
      return {
        content,
        contentType,
        fileName: `dualis_revenue_report.${ext}`,
      };
    }

    default: {
      const content = format === 'csv' ? '' : generatePdfHtml('Export', '<p>No data</p>');
      return { content, contentType, fileName: `dualis_export.${ext}` };
    }
  }
}
