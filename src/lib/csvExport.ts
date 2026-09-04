import { Student, LearningRecord, ContactBook, CornerAreaId, getStudentGrade } from '../types';
import { CORNER_AREAS } from '../data/initialData';

/**
 * Map of Corner Area ID to Chinese display name
 */
export const CORNER_NAME_MAP: Record<CornerAreaId, string> = {
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
 * Escapes a cell value for CSV format according to RFC 4180
 */
export function escapeCsvCell(value: string | number | boolean | null | undefined): string {
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
 * Generate a specialized CSV for the current observation form content
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
  } = params;

  const lines: string[] = [];

  // Title Header
  lines.push('【桃園市私立 愛愛幼兒園 - 角落學習觀察紀錄填寫表單】');
  lines.push(`匯出時間,${escapeCsvCell(new Date().toLocaleString('zh-TW'))}`);
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

  // Corner Areas Detailed Breakdown Table
  lines.push('【8 大學習角落觀察能力指標與個別筆記】');
  lines.push([
    '學習角落區',
    '英文識別碼',
    '勾選項目數',
    '勾選能力指標項目',
    '角落觀察紀錄與個別筆記'
  ].map(escapeCsvCell).join(','));

  CORNER_AREAS.forEach((area) => {
    const items = checkedItems[area.id] || [];
    const note = customNotes[area.id] || '';
    lines.push([
      area.name,
      area.id,
      items.length,
      items.join('； '),
      note
    ].map(escapeCsvCell).join(','));
  });

  lines.push('');

  // Overall Teacher Comment & Praise Stamp
  lines.push('【老師總結評語與賞識鼓勵】');
  lines.push(['老師評語與學習建議', '賞識鼓勵印章'].map(escapeCsvCell).join(','));
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
 * Convert LearningRecord array to comprehensive CSV string
 * Includes dedicated columns for each of the 8 learning corners
 */
export function generateLearningRecordsCsv(
  records: LearningRecord[],
  students?: Student[]
): string {
  const studentMap = new Map<string, Student>();
  if (students) {
    students.forEach((s) => studentMap.set(s.id, s));
  }

  const headers = [
    '紀錄ID',
    '開始日期',
    '結束日期',
    '週次區間',
    '學生ID',
    '學生姓名',
    '年級',
    '班別',
    '座號',
    '語文區_勾選能力',
    '語文區_觀察筆記',
    '水彩區_勾選能力',
    '水彩區_觀察筆記',
    '美勞區_勾選能力',
    '美勞區_觀察筆記',
    '拼豆區_勾選能力',
    '拼豆區_觀察筆記',
    '科學區_勾選能力',
    '科學區_觀察筆記',
    '益智區_勾選能力',
    '益智區_觀察筆記',
    '拼圖區_勾選能力',
    '拼圖區_觀察筆記',
    '積木區_勾選能力',
    '積木區_觀察筆記',
    '勾選能力指標總數',
    '參與學習角落數',
    '老師總結評語',
    '賞識鼓勵章',
    '照片總數',
    '活動照片網址',
    '影片總數',
    '活動影片網址',
    '建立時間'
  ];

  const rows = records.map((r) => {
    const s = studentMap.get(r.studentId);
    const grade = s ? getStudentGrade(s) : (r.className.includes('大') ? '大班' : r.className.includes('中') ? '中班' : r.className.includes('小') ? '小班' : '幼幼班');

    // Extract items & notes per corner
    const getCornerData = (id: CornerAreaId) => {
      const items = (r.checkedItems && r.checkedItems[id]) || [];
      const note = (r.customNotes && r.customNotes[id]) || '';
      return {
        itemsStr: items.join('； '),
        count: items.length,
        noteStr: note.trim()
      };
    };

    const lang = getCornerData('language');
    const watercolor = getCornerData('watercolor');
    const art = getCornerData('art');
    const beads = getCornerData('beads');
    const sci = getCornerData('science');
    const brain = getCornerData('brain');
    const puzzle = getCornerData('puzzle');
    const blocks = getCornerData('blocks');

    const totalChecked = 
      lang.count + watercolor.count + art.count + beads.count + 
      sci.count + brain.count + puzzle.count + blocks.count;

    const activeCornersCount = [
      lang, watercolor, art, beads, sci, brain, puzzle, blocks
    ].filter((c) => c.count > 0 || c.noteStr.length > 0).length;

    const photoUrls = r.photoImages || [];
    const videoUrls = r.videoUrls || [];

    return [
      r.id,
      r.dateStart,
      r.dateEnd,
      `${r.dateStart} ~ ${r.dateEnd}`,
      r.studentId,
      r.studentName,
      grade,
      r.className,
      r.seatNumber,
      lang.itemsStr,
      lang.noteStr,
      watercolor.itemsStr,
      watercolor.noteStr,
      art.itemsStr,
      art.noteStr,
      beads.itemsStr,
      beads.noteStr,
      sci.itemsStr,
      sci.noteStr,
      brain.itemsStr,
      brain.noteStr,
      puzzle.itemsStr,
      puzzle.noteStr,
      blocks.itemsStr,
      blocks.noteStr,
      totalChecked,
      activeCornersCount,
      r.teacherComment || '',
      r.stamp || '',
      photoUrls.length,
      photoUrls.join(' ; '),
      videoUrls.length,
      videoUrls.join(' ; '),
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

