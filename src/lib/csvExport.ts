import { Student, LearningRecord, ContactBook, CornerAreaId, CornerAreaDef, getStudentGrade } from '../types';
import { CORNER_AREAS } from '../data/initialData';
import { getStoredCornerAreas } from './cornerStorage';

/**
 * Map of Corner Area ID to Chinese display name
 */
export const CORNER_NAME_MAP: Record<string, string> = {
  language: '語文區',
  watercolor: '水彩區',
  art: '美勞區',
  beads: '拼豆區',
  science: '科學區',
  brain: '益智區',
  puzzle: '拼圖區',
  blocks: '積木區',
};

/**
 * Metadata for every single item across all corner areas
 */
export interface CornerItemMeta {
  areaId: CornerAreaId;
  areaName: string;
  itemName: string;
  columnHeader: string;
}

/**
 * Returns the flat list of all items across corner areas
 */
export function getAllCornerItems(customAreas?: CornerAreaDef[]): CornerItemMeta[] {
  const itemsList: CornerItemMeta[] = [];
  const areas = customAreas || getStoredCornerAreas();
  areas.forEach((area) => {
    area.items.forEach((item) => {
      itemsList.push({
        areaId: area.id,
        areaName: area.name,
        itemName: item,
        columnHeader: `[${area.name}] ${item}`,
      });
    });
  });
  return itemsList;
}

/**
 * Escapes a cell value for CSV format according to RFC 4180
 */
export function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  // If string contains quotes, commas, or line breaks, enclose in quotes and escape internal quotes
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
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
 * Generate a specialized CSV for the current observation form content.
 * Explicitly lists ALL 48 items across the 8 areas with check status and notes
 * so the user can directly edit everything in Google Sheets.
 */
export function generateCurrentFormObservationCsv(params: {
  student: Student;
  dateStart: string;
  dateEnd: string;
  checkedItems: Record<CornerAreaId, string[]>;
  customNotes: Record<CornerAreaId, string>;
  teacherComment: string;
  stamp: string;
  photoImages: string[];
  videoUrls: string[];
  markSymbol?: string;
}): string {
  const {
    student,
    dateStart,
    dateEnd,
    checkedItems,
    customNotes,
    teacherComment,
    stamp,
    photoImages,
    videoUrls,
    markSymbol = 'V',
  } = params;

  const lines: string[] = [];

  // Title Header
  lines.push('【桃園市私立 愛愛幼兒園 - 角落學習觀察紀錄填寫表單 (Google Sheet 編輯版)】');
  lines.push(`匯出時間,${escapeCsvCell(new Date().toLocaleString('zh-TW'))}`);
  lines.push('說明,本表單已將 8 大角落所有 48 項能力指標全部列出，匯入 Google Sheet 後可直接修改打勾 (V)、備註與評語。');
  lines.push('');

  // Student Basic Info Table
  lines.push('【幼兒基本資料與觀察區間】');
  lines.push([
    '學生姓名',
    '年級',
    '班別',
    '座號',
    '性別',
    '觀察週次開始',
    '觀察週次結束',
    '家長姓名',
    '家長電話'
  ].map(escapeCsvCell).join(','));

  lines.push([
    student.name,
    getStudentGrade(student),
    student.className,
    student.seatNumber,
    student.gender === 'boy' ? '男 (Boy)' : '女 (Girl)',
    dateStart,
    dateEnd,
    student.parentName || '',
    student.parentContact || ''
  ].map(escapeCsvCell).join(','));

  lines.push('');

  // Corner Areas Detailed Breakdown Table - ALL 48 ITEMS LISTED OUT
  lines.push('【8 大學習角落 48 項能力指標全展開明細表 (可在 Google Sheet 直接修改 V 與筆記)】');
  lines.push([
    '序號',
    '學習角落區',
    '能力指標項目',
    '勾選狀態(達成填V/留空未達)',
    '該區自訂觀察筆記(可在Sheet編輯)'
  ].map(escapeCsvCell).join(','));

  let itemCounter = 1;
  const areas = getStoredCornerAreas();
  areas.forEach((area) => {
    const areaChecked = checkedItems[area.id] || [];
    const note = customNotes[area.id] || '';
    area.items.forEach((item, idx) => {
      const isChecked = areaChecked.includes(item);
      const markValue = isChecked ? markSymbol : '';
      // Only display note on the first item of each area, or repeat for clarity
      const noteDisplay = idx === 0 ? note : (note ? `(同上) ${note}` : '');
      lines.push([
        itemCounter++,
        area.name,
        item,
        markValue,
        noteDisplay
      ].map(escapeCsvCell).join(','));
    });
  });

  lines.push('');

  // Overall Teacher Comment & Praise Stamp
  lines.push('【老師總結評語與賞識鼓勵】');
  lines.push(['老師評語與學習建議 (可在Sheet修改)', '賞識鼓勵印章 (可在Sheet修改)'].map(escapeCsvCell).join(','));
  lines.push([teacherComment, stamp].map(escapeCsvCell).join(','));

  lines.push('');

  // Photos & Videos Summary
  lines.push('【多媒體活動紀錄】');
  lines.push(['類型', '序號', '連結或狀態'].map(escapeCsvCell).join(','));
  
  if (photoImages.length === 0) {
    lines.push(['照片紀錄', '0', '無上傳照片'].map(escapeCsvCell).join(','));
  } else {
    photoImages.forEach((img, idx) => {
      const displayUrl = img.startsWith('data:') ? '本機暫存圖像 (Base64)' : img;
      lines.push(['照片紀錄', `照片 #${idx + 1}`, displayUrl].map(escapeCsvCell).join(','));
    });
  }

  if (videoUrls.length === 0) {
    lines.push(['影片紀錄', '0', '無上傳影片'].map(escapeCsvCell).join(','));
  } else {
    videoUrls.forEach((vUrl, idx) => {
      const displayUrl = vUrl.startsWith('data:') ? '本機暫存影片 (Base64)' : vUrl;
      lines.push(['影片紀錄', `影片 #${idx + 1}`, displayUrl].map(escapeCsvCell).join(','));
    });
  }

  return lines.join('\r\n');
}

/**
 * Convert Student array to CSV string
 */
export function generateStudentsCsv(students: Student[]): string {
  const headers = [
    '學生ID (Student ID)',
    '姓名 (Name)',
    '年級 (Grade)',
    '班別 (Class Name)',
    '座號 (Seat Number)',
    '性別 (Gender)',
    '頭像照片網址 (Avatar Photo URL)',
    '家長姓名 (Parent Name)',
    '家長聯絡電話 (Parent Contact)',
    '備註說明 (Notes)'
  ];

  const rows = students.map((s) => [
    s.id,
    s.name,
    s.grade || getStudentGrade(s) || '',
    s.className,
    s.seatNumber,
    s.gender === 'boy' ? '男 (Boy)' : '女 (Girl)',
    s.avatarUrl || '',
    s.parentName || '',
    s.parentContact || '',
    s.notes || ''
  ]);

  const csvLines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(','))
  ];

  return csvLines.join('\r\n');
}

/**
 * Generate a Vertical Checklist CSV where all 48 items of the 8 corner areas
 * are each represented as a dedicated row.
 * In Google Sheet, users can easily sort, filter, and edit marks/notes line by line.
 */
export function generateGoogleSheetsChecklistCsv(
  records: LearningRecord[],
  students?: Student[],
  markSymbol: string = 'V'
): string {
  const studentMap = new Map<string, Student>();
  if (students) {
    students.forEach((s) => studentMap.set(s.id, s));
  }

  const headers = [
    '紀錄ID',
    '學生姓名',
    '年級',
    '班別',
    '座號',
    '觀察開始日期',
    '觀察結束日期',
    '學習角落區',
    '能力指標項目',
    '勾選狀態(填V或留空)',
    '該區觀察筆記(可在Sheet編輯)',
    '老師總結評語(可在Sheet編輯)',
    '賞識印章'
  ];

  const rows: (string | number)[][] = [];

  records.forEach((r) => {
    const s = studentMap.get(r.studentId);
    const grade = s ? getStudentGrade(s) : (r.className.includes('大') ? '大班' : r.className.includes('中') ? '中班' : '小班');

    const areas = getStoredCornerAreas();
    areas.forEach((area) => {
      const checkedList = (r.checkedItems && r.checkedItems[area.id]) || [];
      const note = (r.customNotes && r.customNotes[area.id]) || '';

      area.items.forEach((item) => {
        const isChecked = checkedList.includes(item);
        rows.push([
          r.id,
          r.studentName,
          grade,
          r.className,
          r.seatNumber,
          r.dateStart,
          r.dateEnd,
          area.name,
          item,
          isChecked ? markSymbol : '',
          note,
          r.teacherComment || '',
          r.stamp || ''
        ]);
      });
    });
  });

  const csvLines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(','))
  ];

  return csvLines.join('\r\n');
}

/**
 * Convert LearningRecord array to Google Sheets Horizontal Wide CSV format.
 * All 48 items across the 8 corner areas are explicitly expanded into separate columns,
 * plus dedicated observation notes columns for each of the 8 areas.
 * In Google Sheet, teachers can directly type "V" or modify notes.
 */
export function generateLearningRecordsCsv(
  records: LearningRecord[],
  students?: Student[],
  markSymbol: string = 'V'
): string {
  const studentMap = new Map<string, Student>();
  if (students) {
    students.forEach((s) => studentMap.set(s.id, s));
  }

  // Build headers with all 48 items and 8 area notes explicitly expanded
  const headers: string[] = [
    '紀錄ID',
    '開始日期',
    '結束日期',
    '週次區間',
    '學生ID',
    '學生姓名',
    '年級',
    '班別',
    '座號',
  ];

  const dynamicAreas = getStoredCornerAreas();

  // Areas with items explicitly listed as separate columns
  dynamicAreas.forEach((area) => {
    area.items.forEach((item) => {
      headers.push(`[${area.name}] ${item}`);
    });
    headers.push(`[${area.name}] 觀察筆記`);
  });

  // Summary and media headers
  headers.push(
    '勾選能力指標總數',
    '參與學習角落數',
    '老師總結評語',
    '賞識鼓勵章',
    '照片總數',
    '活動照片網址',
    '影片總數',
    '活動影片網址',
    '建立時間'
  );

  const rows = records.map((r) => {
    const s = studentMap.get(r.studentId);
    const grade = s ? getStudentGrade(s) : (r.className.includes('大') ? '大班' : r.className.includes('中') ? '中班' : r.className.includes('小') ? '小班' : '幼幼班');

    const rowData: (string | number)[] = [
      r.id,
      r.dateStart,
      r.dateEnd,
      `${r.dateStart} ~ ${r.dateEnd}`,
      r.studentId,
      r.studentName,
      grade,
      r.className,
      r.seatNumber,
    ];

    let totalCheckedCount = 0;
    let activeCornerCount = 0;

    // Fill all item columns and note columns
    dynamicAreas.forEach((area) => {
      const areaChecked = (r.checkedItems && r.checkedItems[area.id]) || [];
      const note = (r.customNotes && r.customNotes[area.id]) || '';

      if (areaChecked.length > 0 || note.trim().length > 0) {
        activeCornerCount++;
      }

      area.items.forEach((item) => {
        if (areaChecked.includes(item)) {
          rowData.push(markSymbol);
          totalCheckedCount++;
        } else {
          rowData.push('');
        }
      });

      // Area custom note column
      rowData.push(note);
    });

    const photoUrls = r.photoImages || [];
    const videoUrls = r.videoUrls || [];

    // Summary data
    rowData.push(
      totalCheckedCount,
      activeCornerCount,
      r.teacherComment || '',
      r.stamp || '',
      photoUrls.length,
      photoUrls.join(' ; '),
      videoUrls.length,
      videoUrls.join(' ; '),
      r.createdAt || ''
    );

    return rowData;
  });

  const csvLines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(','))
  ];

  return csvLines.join('\r\n');
}

/**
 * Helper to construct a temporary LearningRecord from current observation form state
 */
export function createRecordFromFormState(params: {
  student: Student;
  dateStart: string;
  dateEnd: string;
  checkedItems: Record<CornerAreaId, string[]>;
  customNotes: Record<CornerAreaId, string>;
  teacherComment: string;
  stamp: string;
  photoImages: string[];
  videoUrls: string[];
}): LearningRecord {
  return {
    id: `rec-current-${params.student.id}-${params.dateStart}`,
    dateStart: params.dateStart,
    dateEnd: params.dateEnd,
    studentId: params.student.id,
    studentName: params.student.name,
    className: params.student.className,
    seatNumber: params.student.seatNumber,
    checkedItems: params.checkedItems,
    customNotes: params.customNotes,
    teacherComment: params.teacherComment,
    stamp: params.stamp,
    photoImages: params.photoImages,
    videoUrls: params.videoUrls,
    createdAt: new Date().toISOString(),
  };
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

