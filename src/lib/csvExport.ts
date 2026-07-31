import { Student, LearningRecord, ContactBook } from '../types';

/**
 * Escapes a cell value for CSV format according to RFC 4180
 */
function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  // If string contains quotes, commas, or line breaks, enclose in quotes and escape internal quotes
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Triggers a browser download of a CSV string with UTF-8 BOM
 */
export function downloadCsv(filename: string, csvContent: string): void {
  // Prepend UTF-8 BOM (\uFEFF) to ensure Microsoft Excel & Google Sheets display Traditional Chinese correctly
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convert Student array to CSV string
 */
export function generateStudentsCsv(students: Student[]): string {
  const headers = [
    '學生ID (Student ID)',
    '姓名 (Name)',
    '座號 (Seat Number)',
    '班別 (Class Name)',
    '性別 (Gender)',
    '頭像照片網址 (Avatar Photo URL)',
    '家長姓名 (Parent Name)',
    '家長聯絡電話 (Parent Contact)',
    '備註說明 (Notes)'
  ];

  const rows = students.map((s) => [
    s.id,
    s.name,
    s.seatNumber,
    s.className,
    s.gender === 'boy' ? '男 (Boy)' : '女 (Girl)',
    s.avatarUrl || '',
    s.parentName,
    s.parentContact,
    s.notes || ''
  ]);

  const csvLines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(','))
  ];

  return csvLines.join('\r\n');
}

/**
 * Convert LearningRecord array to CSV string
 */
export function generateLearningRecordsCsv(records: LearningRecord[]): string {
  const headers = [
    '紀錄ID (Record ID)',
    '開始日期 (Date Start)',
    '結束日期 (Date End)',
    '學生ID (Student ID)',
    '學生姓名 (Student Name)',
    '班別 (Class Name)',
    '座號 (Seat Number)',
    '勾選能力項目摘要 (Checked Area Summary)',
    '自訂觀察筆記 (Custom Corner Notes)',
    '繪圖圖稿網址 (Drawing Image URL)',
    '活動照片網址 (Photo Image URLs)',
    '活動影片網址 (Video URLs)',
    '老師總結評語 (Teacher Comment)',
    '賞識章標題 (Stamp Title)',
    '建立時間 (Created At)'
  ];

  const rows = records.map((r) => {
    // Format checked items into a human-readable string for Google Sheet
    const checkedSummaryParts: string[] = [];
    if (r.checkedItems) {
      Object.entries(r.checkedItems).forEach(([areaId, items]) => {
        if (items && items.length > 0) {
          checkedSummaryParts.push(`[${areaId}]: ${items.join('; ')}`);
        }
      });
    }

    const customNotesParts: string[] = [];
    if (r.customNotes) {
      Object.entries(r.customNotes).forEach(([areaId, note]) => {
        if (note && note.trim()) {
          customNotesParts.push(`[${areaId}]: ${note}`);
        }
      });
    }

    // Join photo URLs with semicolon
    const photosUrlString = (r.photoImages || []).join(' ; ');
    // Join video URLs with semicolon
    const videosUrlString = (r.videoUrls || []).join(' ; ');

    return [
      r.id,
      r.dateStart,
      r.dateEnd,
      r.studentId,
      r.studentName,
      r.className,
      r.seatNumber,
      checkedSummaryParts.join(' | '),
      customNotesParts.join(' | '),
      r.drawingImage || '',
      photosUrlString,
      videosUrlString,
      r.teacherComment || '',
      r.stamp || '',
      r.createdAt || ''
    ];
  });

  const csvLines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(','))
  ];

  return csvLines.join('\r\n');
}

/**
 * Convert ContactBook array to CSV string
 */
export function generateContactBooksCsv(contactBooks: ContactBook[]): string {
  const headers = [
    '聯絡簿ID (Book ID)',
    '日期 (Date)',
    '學生ID (Student ID)',
    '學生姓名 (Student Name)',
    '班別 (Class Name)',
    '座號 (Seat Number)',
    '早餐 (Breakfast)',
    '午餐 (Lunch)',
    '點心 (Snack)',
    '午睡時間分鐘 (Nap Minutes)',
    '情緒表現 (Mood)',
    '額溫 (Temperature)',
    '健康與活動備註 (Health Notes)',
    '老師叮嚀留言 (Teacher Message)',
    '家長簽署回覆 (Parent Reply)',
    '活動照片網址 (Photo URLs)',
    '活動影片網址 (Video URLs)',
    '家長是否已查閱 (Is Read By Parent)',
    '建立時間 (Created At)'
  ];

  const rows = contactBooks.map((c) => {
    const photosUrlString = (c.photoUrls || []).join(' ; ');
    const videosUrlString = (c.videoUrls || []).join(' ; ');

    return [
      c.id,
      c.date,
      c.studentId,
      c.studentName,
      c.className,
      c.seatNumber,
      c.breakfast,
      c.lunch,
      c.snack,
      c.napMinutes,
      c.mood,
      c.temperature,
      c.healthNotes || '',
      c.teacherMessage || '',
      c.parentReply || '',
      photosUrlString,
      videosUrlString,
      c.isReadByParent ? '是 (TRUE)' : '否 (FALSE)',
      c.createdAt || ''
    ];
  });

  const csvLines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(','))
  ];

  return csvLines.join('\r\n');
}
