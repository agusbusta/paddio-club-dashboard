/**
 * Utilidades para exportar datos a CSV y Excel
 */
import * as XLSX from 'xlsx';

/**
 * Convierte un array de objetos a CSV
 */
function convertToCSV(data: any[], delimiter: string = ','): string {
  if (!data || data.length === 0) {
    return '';
  }

  const headers = Object.keys(data[0]);
  const headerRow = headers.map(header => escapeCSVValue(header)).join(delimiter);

  const dataRows = data.map(row => {
    return headers.map(header => {
      const value = row[header] ?? '';
      return escapeCSVValue(value);
    }).join(delimiter);
  });

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Escapa valores para CSV
 */
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Descarga un archivo CSV
 */
function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporta datos a CSV y descarga el archivo
 */
export function exportToCSV(data: any[], filename: string = 'export'): void {
  if (!data || data.length === 0) {
    console.warn('No hay datos para exportar');
    return;
  }

  const csvContent = convertToCSV(data);
  downloadCSV(csvContent, filename);
}

/**
 * Exporta datos a Excel (XLSX) y descarga el archivo
 */
export function exportToExcel(data: any[], filename: string = 'export'): void {
  if (!data || data.length === 0) {
    console.warn('No hay datos para exportar');
    return;
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Ajustar el ancho de las columnas
  const maxWidth = 50;
  const colWidths = Object.keys(data[0]).map((key) => {
    const headerLength = key.length;
    const maxDataLength = Math.max(
      ...data.map((row) => String(row[key] || '').length)
    );
    return { wch: Math.min(Math.max(headerLength, maxDataLength) + 2, maxWidth) };
  });
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Datos');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
