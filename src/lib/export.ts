/**
 * Enterprise data export utilities.
 * Supports CSV export with proper escaping and Unicode BOM for Excel compatibility.
 */

interface ExportColumn {
  key: string;
  label: string;
  format?: (value: any, row: any) => string;
}

/**
 * Export data as CSV with proper encoding for Excel
 */
export function exportToCSV(
  data: Record<string, any>[],
  columns: ExportColumn[],
  filename: string
) {
  if (data.length === 0) return;

  // Headers
  const headers = columns.map((col) => escapeCSV(col.label));

  // Rows
  const rows = data.map((row) =>
    columns.map((col) => {
      const value = col.format ? col.format(row[col.key], row) : row[col.key];
      return escapeCSV(value);
    })
  );

  // Add BOM for UTF-8 Excel compatibility
  const BOM = '\uFEFF';
  const csv = BOM + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8');
}

/**
 * Escape a value for CSV (handle commas, quotes, newlines)
 */
function escapeCSV(value: any): string {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Trigger file download in browser
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format currency for export
 */
export function formatCurrencyExport(amount: number): string {
  return Number(amount).toFixed(2);
}

/**
 * Format date for export
 */
export function formatDateExport(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
