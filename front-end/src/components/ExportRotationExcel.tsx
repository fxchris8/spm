// src/components/ExportRotationExcel.tsx
import * as XLSX from 'xlsx';

interface TableJson {
  columns: string[];
  data: Record<string, any>[];
}

interface ExportRotationExcelProps {
  job: string;
  selectedGroup: string | null;
  scheduleTable: TableJson | null;
  nahkodaTable: TableJson | null;
  daratTable: TableJson | null;
}

/**
 * Helper function: Format date for display
 */
const formatDateForDisplay = (dateString: string): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

/**
 * Helper function: Get column header label
 */
const getColumnLabel = (column: string): string => {
  const labelMap: Record<string, string> = {
    Index: 'INDEX',
    name: 'NAME',
    last_location: 'LAST_LOCATION',
    seamancode: 'SEAMANCODE',
    start_date: 'START_DATE',
    end_date: 'END_DATE',
    first_rotation_date: 'FIRST_ROTATION_DATE',
    Ship: 'SHIP',
    'First Rotation Date': 'FIRST_ROTATION_DATE',
  };
  return labelMap[column] || column.toUpperCase().replace(/_/g, ' ');
};

/**
 * Helper function: Get job display name
 */
const getJobDisplayName = (job: string): string => {
  switch (job) {
    case 'nakhoda':
      return 'NAHKODA';
    case 'KKM':
      return 'KKM';
    case 'mualimI':
      return 'MUALIM I';
    case 'masinisII':
      return 'MASINIS II';
    default:
      return job.toUpperCase();
  }
};

/**
 * Main export function
 */
export const exportRotationToExcel = ({
  job,
  selectedGroup,
  scheduleTable,
  nahkodaTable,
  daratTable,
}: ExportRotationExcelProps): void => {
  if (!nahkodaTable && !scheduleTable) {
    console.error('No data to export');
    return;
  }

  const wb = XLSX.utils.book_new();

  // ============================================================================
  // SHEET 1: JOB (NAHKODA/KKM/MUALIM I/MASINIS II)
  // ============================================================================
  if (nahkodaTable && nahkodaTable.columns && nahkodaTable.data.length > 0) {
    // Map data dengan urutan kolom yang benar
    const nahkodaData = nahkodaTable.data.map((row: any) => {
      const orderedRow: Record<string, any> = {};

      // Iterate sesuai urutan columns dari API
      nahkodaTable.columns.forEach(col => {
        const label = getColumnLabel(col);
        const value = row[col] || row[col.toLowerCase()] || '';

        // Format dates for better readability
        if (col.includes('date') || col.includes('Date')) {
          orderedRow[label] = formatDateForDisplay(value);
        } else {
          orderedRow[label] = value;
        }
      });

      return orderedRow;
    });

    const wsNahkoda = XLSX.utils.json_to_sheet(nahkodaData);

    // Set column widths
    const colWidths = nahkodaTable.columns.map(col => {
      if (col.includes('name') || col.includes('location')) return { wch: 25 };
      if (col.includes('date') || col.includes('Date')) return { wch: 20 };
      return { wch: 15 };
    });
    wsNahkoda['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, wsNahkoda, getJobDisplayName(job));
  }

  // ============================================================================
  // SHEET 2: RELIEVER (if exists)
  // ============================================================================
  if (daratTable && daratTable.columns && daratTable.data.length > 0) {
    const daratData = daratTable.data.map((row: any) => {
      const orderedRow: Record<string, any> = {};

      daratTable.columns.forEach(col => {
        const label = getColumnLabel(col);
        const value = row[col] || row[col.toLowerCase()] || '';

        if (col.includes('date') || col.includes('Date')) {
          orderedRow[label] = formatDateForDisplay(value);
        } else {
          orderedRow[label] = value;
        }
      });

      return orderedRow;
    });

    const wsDarat = XLSX.utils.json_to_sheet(daratData);

    const colWidths = daratTable.columns.map(col => {
      if (col.includes('name') || col.includes('location')) return { wch: 25 };
      if (col.includes('date') || col.includes('Date')) return { wch: 20 };
      return { wch: 15 };
    });
    wsDarat['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, wsDarat, 'Reliever');
  }

  // ============================================================================
  // SHEET 3: ROTATION PLAN
  // ============================================================================
  if (scheduleTable && scheduleTable.columns && scheduleTable.data.length > 0) {
    const scheduleData = scheduleTable.data.map((row: any) => {
      const orderedRow: Record<string, any> = {};

      scheduleTable.columns.forEach(col => {
        const label = getColumnLabel(col);
        orderedRow[label] = row[col] || '';
      });

      return orderedRow;
    });

    const wsSchedule = XLSX.utils.json_to_sheet(scheduleData);

    // Set column widths untuk schedule
    const colWidths = scheduleTable.columns.map((col, idx) => {
      if (idx === 0) return { wch: 25 }; // Ship column
      if (col === 'First Rotation Date') return { wch: 18 }; // First Rotation Date
      return { wch: 12 }; // Month columns
    });
    wsSchedule['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, wsSchedule, 'Rotation Plan');
  }

  // ============================================================================
  // SAVE FILE
  // ============================================================================
  const fileName = `${getJobDisplayName(job)}_Schedule_${selectedGroup}_${
    new Date().toISOString().split('T')[0]
  }.xlsx`;
  XLSX.writeFile(wb, fileName);
};

// Export helper functions if needed elsewhere
export { formatDateForDisplay, getColumnLabel, getJobDisplayName };
