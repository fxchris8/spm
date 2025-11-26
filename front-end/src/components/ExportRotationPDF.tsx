// src/components/ExportRotationPDF.tsx
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TableJson {
  columns: string[];
  data: Record<string, any>[];
}

interface ExportRotationPDFProps {
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

// Convert any month text into standardized short month (Jan, Feb, Mar...)
const normalizeMonthName = (monthStr: string): string => {
  const map: Record<string, string> = {
    // Standard 3-letter maps and their variations
    JAN: 'Jan',
    JANUAR: 'Jan',
    FEB: 'Feb',
    FEBRUAR: 'Feb',
    FEBRUARY: 'Feb',
    MAR: 'Mar',
    MARCH: 'Mar',
    M: 'Mar',
    r: 'Mar', // Handles "March" and its single-letter fragments
    APR: 'Apr',
    APRIL: 'Apr',
    AP: 'Apr',
    ap: 'Apr', // Handles "April" and fragments
    MAY: 'May',
    MAV: 'May',
    y: 'May', // Handles "May" and fragments
    JUN: 'Jun',
    JUNE: 'Jun',
    J: 'Jun',
    un: 'Jun', // Handles "June" and fragments
    JUL: 'Jul',
    JULY: 'Jul',
    LY: 'Jul',
    l: 'Jul', // Handles "July" and fragments
    AUG: 'Aug',
    AUGUST: 'Aug',
    uug: 'Aug',
    st: 'Aug', // Handles "August" and fragments
    SEP: 'Sep',
    SEPTEMBER: 'Sep',
    S: 'Sep',
    ciy: 'Sep',
    hl: 'Sep', // Handles "September" and fragments
    OCT: 'Oct',
    OCTOBER: 'Oct',
    O: 'Oct',
    ber: 'Oct', // Handles "October" and fragments
    NOV: 'Nov',
    NOVEMBER: 'Nov',
    v: 'Nov',
    DEC: 'Dec',
    DECEMBER: 'Dec',
    mm: 'Dec',
    bb: 'Dec', // Handles "December" and fragments // Handling the "MA" (March/April?) and "JJ" (June/July) and "ND" (Nov/Dec) from Source 8

    MA: 'Mar', // Assuming the first part is March
    JJ: 'Jun', // Assuming the first part is June
    ND: 'Nov', // Assuming the first part is November
  };

  const up = monthStr.toUpperCase().trim(); // Try exact match first

  if (map[up]) return map[up]; // Try matching by checking if the string starts with a key (for fragments)

  for (const key in map) {
    if (up.startsWith(key)) {
      return map[key];
    }
  }

  return monthStr; // Fallback
};

/**
 * Helper function: Parse month string to get year and month
 * Input: "DEC 2025" or "JAN 2026"
 * Output: { year: 2025, month: "DEC", fullText: "DEC 2025" }
 */
const parseMonthYear = (
  monthStr: string
): { year: number; month: string; fullText: string } => {
  const parts = monthStr.trim().split(' ');
  if (parts.length === 2) {
    const monthShort = normalizeMonthName(parts[0]);
    return {
      year: parseInt(parts[1]),
      month: monthShort,
      fullText: `${monthShort} ${parts[1]}`,
    };
  }
  return { year: 0, month: normalizeMonthName(monthStr), fullText: monthStr };
};

/**
 * Helper function: Group months by year for 2-level header
 * Returns array of { year, startCol, endCol, monthCount }
 */
const groupMonthsByYear = (
  columns: string[]
): Array<{
  year: number;
  startCol: number;
  endCol: number;
  monthCount: number;
}> => {
  const yearGroups: Array<{
    year: number;
    startCol: number;
    endCol: number;
    monthCount: number;
  }> = [];
  let currentYear = 0;
  let startCol = 2; // Start after Ship and First Rotation Date

  for (let i = 2; i < columns.length; i++) {
    const parsed = parseMonthYear(columns[i]);

    if (parsed.year !== currentYear) {
      // New year group
      if (currentYear !== 0) {
        // Save previous group
        yearGroups.push({
          year: currentYear,
          startCol: startCol,
          endCol: i - 1,
          monthCount: i - startCol,
        });
      }
      currentYear = parsed.year;
      startCol = i;
    }
  } // Add last group

  if (currentYear !== 0) {
    yearGroups.push({
      year: currentYear,
      startCol: startCol,
      endCol: columns.length - 1,
      monthCount: columns.length - startCol,
    });
  }

  return yearGroups;
};

/**
 * Main export function
 */
export const exportRotationToPDF = ({
  job,
  selectedGroup,
  scheduleTable,
  nahkodaTable,
  daratTable,
}: ExportRotationPDFProps): void => {
  if (!nahkodaTable && !scheduleTable) {
    console.error('No data to export');
    return;
  }

  const doc = new jsPDF('landscape');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let yPosition = 20; // ============================================================================ // HEADER SECTION - CENTERED // ============================================================================

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const title = `${getJobDisplayName(job)} Rotation Schedule`;
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, (pageWidth - titleWidth) / 2, yPosition);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  yPosition += 8;
  const groupText = `Group: ${selectedGroup || '-'}`;
  const groupWidth = doc.getTextWidth(groupText);
  doc.text(groupText, (pageWidth - groupWidth) / 2, yPosition);

  yPosition += 6;
  const generatedText = `Generated: ${new Date().toLocaleString('id-ID')}`;
  const generatedWidth = doc.getTextWidth(generatedText);
  doc.text(generatedText, (pageWidth - generatedWidth) / 2, yPosition);
  yPosition += 12; // ============================================================================ // TABLE 1: JOB (NAHKODA/KKM/MUALIM I/MASINIS II) // ============================================================================

  if (nahkodaTable && nahkodaTable.columns && nahkodaTable.data.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(getJobDisplayName(job).toUpperCase(), 14, yPosition);
    yPosition += 8;

    const headers = nahkodaTable.columns.map(col => getColumnLabel(col));
    const rows = nahkodaTable.data.map((row: any) =>
      nahkodaTable.columns.map(col => {
        const value = row[col] || row[col.toLowerCase()] || '';
        if (col.includes('date') || col.includes('Date')) {
          return formatDateForDisplay(value);
        }
        return String(value);
      })
    ); // ✅ Calculate dynamic widths to fill page

    const availableWidth = pageWidth - margin * 2; // PERBAIKAN: Mengurangi lebar Index
    const indexWidth = 10;
    const seamancodeWidth = 25;
    const dateWidth = 28;
    const remainingWidth =
      availableWidth - indexWidth - seamancodeWidth - dateWidth * 3;
    const nameWidth = remainingWidth * 0.5;
    const locationWidth = remainingWidth * 0.5;

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: yPosition,
      theme: 'striped',
      styles: {
        fontSize: 8,
        cellPadding: 2, // lebih rapat
        overflow: 'hidden', // cegah teks turun ke bawah
        minCellHeight: 8, // tinggi seragam
        halign: 'center',
        valign: 'middle',
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [59, 130, 246], // Blue
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 9,
        overflow: 'hidden', // wajib
        minCellHeight: 10,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: indexWidth, halign: 'center' }, // Index (New width 10)
        1: { cellWidth: nameWidth, halign: 'left' }, // Name - left align for readability
        2: { cellWidth: locationWidth, halign: 'left' }, // Last Location - left align
        3: { cellWidth: seamancodeWidth, halign: 'center' }, // Seaman Code
        4: { cellWidth: dateWidth, halign: 'center' }, // Start Date
        5: { cellWidth: dateWidth, halign: 'center' }, // End Date
        6: { cellWidth: dateWidth, halign: 'center' }, // First Rotation Date
      },
      margin: { left: margin, right: margin },
      tableWidth: 'auto',
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  } // ============================================================================ // TABLE 2: RELIEVER (if exists) // ============================================================================

  if (daratTable && daratTable.columns && daratTable.data.length > 0) {
    // Check if new page needed
    if (yPosition > 160) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('RELIEVER', 14, yPosition);
    yPosition += 8;

    const headers = daratTable.columns.map(col => getColumnLabel(col));
    const rows = daratTable.data.map((row: any) =>
      daratTable.columns.map(col => {
        const value = row[col] || row[col.toLowerCase()] || '';
        if (col.includes('date') || col.includes('Date')) {
          return formatDateForDisplay(value);
        }
        return String(value);
      })
    ); // ✅ Same dynamic widths as JOB table

    const availableWidth = pageWidth - margin * 2; // PERBAIKAN: Mengurangi lebar Index
    const indexWidth = 10;
    const seamancodeWidth = 25;
    const dateWidth = 28;
    const remainingWidth =
      availableWidth - indexWidth - seamancodeWidth - dateWidth * 3;
    const nameWidth = remainingWidth * 0.5;
    const locationWidth = remainingWidth * 0.5;

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: yPosition,
      theme: 'striped',
      styles: {
        fontSize: 8,
        cellPadding: 2, // lebih rapat
        overflow: 'hidden', // cegah teks turun ke bawah
        minCellHeight: 8, // tinggi seragam
        halign: 'center',
        valign: 'middle',
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [16, 185, 129], // Green
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 9,
        overflow: 'hidden', // wajib
        minCellHeight: 10,
      },
      alternateRowStyles: {
        fillColor: [240, 253, 244],
      },
      columnStyles: {
        0: { cellWidth: indexWidth, halign: 'center', overflow: 'hidden' }, // Index (New width 10)
        1: { cellWidth: nameWidth, halign: 'left' }, // Name - left align
        2: { cellWidth: locationWidth, halign: 'left' }, // Last Location - left align
        3: { cellWidth: seamancodeWidth, halign: 'center' },
        4: { cellWidth: dateWidth, halign: 'center' },
        5: { cellWidth: dateWidth, halign: 'center' },
        6: { cellWidth: dateWidth, halign: 'center' },
      },
      margin: { left: margin, right: margin },
      tableWidth: 'auto',
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  } // ============================================================================ // TABLE 3: ROTATION PLAN - NEW PAGE with 2-LEVEL HEADER // ============================================================================ // Peta warna berdasarkan kode kru (Index)

  const crewColorMap: Record<string, [number, number, number]> = {
    A: [255, 199, 102], // Light Orange/Peach
    B: [173, 216, 230], // Light Blue
    C: [144, 238, 144], // Light Green
    D: [255, 182, 193], // Light Pink
    E: [255, 255, 153], // Light Yellow
    F: [204, 153, 255], // Light Purple
    G: [152, 251, 152], // Pale Green
    H: [255, 223, 186], // Pale Orange
    I: [224, 255, 255], // Light Cyan
    J: [255, 204, 229], // Light Rose
    K: [255, 250, 205], // Lemon Chiffon
    L: [216, 191, 216], // Thistle
    '1': [255, 99, 71], // Tomato (untuk index '1' atau '111')
  };
  if (scheduleTable && scheduleTable.columns && scheduleTable.data.length > 0) {
    doc.addPage();
    yPosition = 20;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ROTATION PLAN', 14, yPosition);
    yPosition += 8; // ✅ Calculate dynamic column widths (Disesuaikan di permintaan sebelumnya)

    const availableWidth = pageWidth - margin * 2;
    const shipWidth = 60;
    const firstRotationWidth = 35;
    const monthCount = scheduleTable.columns.length - 2;
    const monthWidth =
      (availableWidth - shipWidth - firstRotationWidth) / monthCount;

    const parsedColumns = scheduleTable.columns.map((c, idx) => {
      if (idx < 2) return c; // Ship, First Rotation Date
      const parsed = parseMonthYear(c);
      return `${parsed.month} ${parsed.year}`;
    }); // ✅ Group months by year for 2-level header

    const yearGroups = groupMonthsByYear(scheduleTable.columns); // ✅ Create 2-level headers // Row 1: Year headers (merged)

    const headerRow1: any[] = [
      {
        content: 'SHIP',
        rowSpan: 2,
        styles: { halign: 'center', valign: 'middle' },
      },
      {
        content: 'FIRST_ROTATION_DATE',
        rowSpan: 2,
        styles: { halign: 'center', valign: 'middle' },
      },
    ];

    yearGroups.forEach(group => {
      headerRow1.push({
        content: group.year.toString(),
        colSpan: group.monthCount,
        styles: { halign: 'center', fillColor: [245, 158, 11] }, // Oranye untuk header Tahun
      });
    }); // Row 2: Month headers (tetap menggunakan nama bulan 3 huruf)

    const headerRow2: string[] = [];
    for (let i = 2; i < scheduleTable.columns.length; i++) {
      const parsed = parseMonthYear(scheduleTable.columns[i]);
      headerRow2.push(parsed.month);
    } // Body rows

    const rows = scheduleTable.data.map((row: any) =>
      parsedColumns.map((_, i) => String(row[scheduleTable.columns[i]] || ''))
    );

    const columnStyles: Record<number, any> = {
      0: { cellWidth: shipWidth, halign: 'left' },
      1: { cellWidth: firstRotationWidth, halign: 'center' },
    };

    for (let i = 2; i < scheduleTable.columns.length; i++) {
      columnStyles[i] = {
        cellWidth: monthWidth,
        halign: 'center',
        fontStyle: 'bold',
      };
    }

    autoTable(doc, {
      head: [headerRow1, headerRow2],
      body: rows,
      startY: yPosition,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak',
        lineColor: [180, 180, 180],
        lineWidth: 0.3,
        valign: 'middle',
        halign: 'center',
        textColor: [0, 0, 0],
      },
      headStyles: {
        fillColor: [245, 158, 11],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 9,
        overflow: 'hidden', // wajib
        minCellHeight: 10,
      },
      columnStyles: columnStyles,
      margin: { left: margin, right: margin },
      tableWidth: 'auto',
      didParseCell: data => {
        const col = data.column.index; // Hanya kolom bulan (indeks 2 dan seterusnya)

        if (col >= 2) {
          // Baris Body (Index A, B, C...)
          if (data.section === 'body') {
            const content = data.cell.raw;
            if (content && content.toString().trim() !== '') {
              // Logika Baru: Ambil karakter pertama sebagai kode kru
              const crewCode = content
                .toString()
                .trim()
                .charAt(0)
                .toUpperCase();
              const crewColor = crewColorMap[crewCode] || [255, 255, 255]; // Default putih // ✅ Terapkan warna LATAR BELAKANG berdasarkan kode kru

              data.cell.styles.fillColor = crewColor; // Teksnya dibuat gelap agar terbaca
              data.cell.styles.textColor = [0, 0, 0];
              data.cell.styles.fontStyle = 'bold';
            } else {
              // Jika sel kosong, latar belakang tetap putih/default body
              data.cell.styles.fillColor = [255, 255, 255];
            }
          }
        } // Ship + First Rotation tetap putih

        if (col <= 1 && data.section === 'body') {
          data.cell.styles.fillColor = [255, 255, 255];
          data.cell.styles.textColor = [0, 0, 0];
        }
      },
    });
  } // ============================================================================ // SAVE PDF // ============================================================================

  const fileName = `${getJobDisplayName(job)}_Schedule_${selectedGroup}_${
    new Date().toISOString().split('T')[0]
  }.pdf`;
  doc.save(fileName);
};

// Export helper functions if needed elsewhere
export { formatDateForDisplay, getColumnLabel, getJobDisplayName };
