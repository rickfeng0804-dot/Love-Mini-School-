import { Student, LearningRecord, ContactBook, CornerAreaId, CornerAreaDef, getStudentGrade } from '../types';
import { CORNER_AREAS } from '../data/initialData';
import { getStoredCornerAreas } from './cornerStorage';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3/files';

export const DEFAULT_SPREADSHEET_ID = '1jFe492XljTkDx3A4fLWBX1PEy4J7Q7TffNLQiVlJI6c';
export const DEFAULT_SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}/edit`;

export const DEFAULT_STUDENT_LIBRARY_URL = 'https://script.google.com/macros/library/d/1zxsAWe1a9DBr8oIZtY4vXXq-VVsnmA2fxvUq4XJc6CgmIPyRshanJVxh/2';
export const DEFAULT_STUDENT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwj9uSMKO1_Me0A1H3G3AuMnAaEg3cehrGlgXnv4hDczdbf_wh16bp7jnYBCMp02eON/exec';
export const DEFAULT_LEARNING_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbz_tGPQoBjfRl_s75spbBoeT1xOp1dgp6d0E4Apn-YHdCyNtQmI8g7kW28ZWfJP1rZ5/exec';
export const DEFAULT_CONTACT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwviyCk9O501BzbbTZH1JzSLLiuT7CFCIrK8Y5stg546T-z0I7BGtPjo8OS0w9gN2Nw8g/exec';
export const DEFAULT_MEDIA_FOLDER_URL = 'https://drive.google.com/drive/folders/1HmKXkl-xbLMaaCq663RMRINAsdavttJp?usp=drive_link';
export const DEFAULT_NAS_STORAGE_URL = 'https://llk-nas.quickconnect.to/d/s/19gzQx1DuMJbQbtNaWeRVaxUAqcUrtCX/ct9etCC8-qwn8ehO52880kb6gRugFamQ-RbTA_sIIeA0';
export const DEFAULT_WEB_APP_URL = DEFAULT_STUDENT_WEB_APP_URL;

export interface SyncedData {
  students: Student[];
  learningRecords: LearningRecord[];
  contactBooks: ContactBook[];
}

/**
 * Returns column headers for LearningRecords sheet with ALL 48 items across 8 corner areas
 * expanded into dedicated columns, plus 8 area observation notes.
 */
export function getExpandedLearningHeaders(): string[] {
  const headers: string[] = [
    'ID',
    'DateStart',
    'DateEnd',
    'WeekRange',
    'StudentId',
    'StudentName',
    'Grade',
    'ClassName',
    'SeatNumber',
  ];

  const dynamicAreas = getStoredCornerAreas();
  dynamicAreas.forEach((area) => {
    area.items.forEach((item) => {
      headers.push(`[${area.name}] ${item}`);
    });
    headers.push(`[${area.name}] 觀察筆記`);
  });

  headers.push(
    'TotalChecked',
    'ActiveAreasCount',
    'TeacherComment',
    'Stamp',
    'PhotoImagesJSON',
    'VideoUrlsJSON',
    'CheckedItemsJSON',
    'CustomNotesJSON',
    'CreatedAt'
  );

  return headers;
}

/**
 * Maps a single LearningRecord into a complete row with all 48 item columns marked with 'V'
 */
export function formatLearningRecordRow(
  r: LearningRecord,
  grade: string = '',
  markSymbol: string = 'V'
): (string | number)[] {
  const row: (string | number)[] = [
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

  let totalChecked = 0;
  let activeAreas = 0;

  const dynamicAreas = getStoredCornerAreas();
  dynamicAreas.forEach((area) => {
    const checkedList = (r.checkedItems && r.checkedItems[area.id]) || [];
    const note = (r.customNotes && r.customNotes[area.id]) || '';

    if (checkedList.length > 0 || note.trim().length > 0) {
      activeAreas++;
    }

    area.items.forEach((item) => {
      if (checkedList.includes(item)) {
        row.push(markSymbol);
        totalChecked++;
      } else {
        row.push('');
      }
    });

    row.push(note);
  });

  row.push(
    totalChecked,
    activeAreas,
    r.teacherComment || '',
    r.stamp || '',
    JSON.stringify(r.photoImages || []),
    JSON.stringify(r.videoUrls || []),
    JSON.stringify(r.checkedItems || {}),
    JSON.stringify(r.customNotes || {}),
    r.createdAt || new Date().toISOString()
  );

  return row;
}

/**
 * Returns column headers for vertical checklist tab
 */
export function formatLearningChecklistHeaders(): string[] {
  return [
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
}

/**
 * Formats vertical checklist rows for all 48 items
 */
export function formatLearningChecklistRows(
  records: LearningRecord[],
  studentMap: Map<string, Student>,
  markSymbol: string = 'V'
): (string | number)[][] {
  const rows: (string | number)[][] = [];
  records.forEach((r) => {
    const s = studentMap.get(r.studentId);
    const grade = s ? getStudentGrade(s) : (r.className.includes('大') ? '大班' : r.className.includes('中') ? '中班' : '小班');

    const dynamicAreas = getStoredCornerAreas();
    dynamicAreas.forEach((area) => {
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
  return rows;
}

/**
 * Find existing Kindergarten spreadsheets in Google Drive
 */
export async function findKindergartenSpreadsheet(accessToken: string): Promise<{ id: string; name: string } | null> {
  try {
    const q = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false and name contains '愛愛幼兒園'");
    const res = await fetch(`${DRIVE_API_BASE}?q=${q}&fields=files(id,name)`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return { id: data.files[0].id, name: data.files[0].name };
    }
    return null;
  } catch (err) {
    console.error('Error finding spreadsheet in Drive:', err);
    return null;
  }
}

/**
 * Create a new Google Spreadsheet specifically structured for the Kindergarten system
 */
export async function createKindergartenSpreadsheet(accessToken: string, title: string = '愛愛幼兒園_學習歷程與聯絡簿_資料庫'): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const body = {
    properties: {
      title,
    },
    sheets: [
      { properties: { title: 'Students' } },
      { properties: { title: 'LearningRecords' } },
      { properties: { title: 'LearningChecklist_48Items' } },
      { properties: { title: 'ContactBooks' } },
    ],
  };

  const res = await fetch(SHEETS_API_BASE, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`建立 Google Sheet 失敗: ${errText}`);
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

  // Initialize Header Rows
  await initializeSheetHeaders(accessToken, spreadsheetId);

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Write headers to the 4 tabs including expanded 8-area 48-item learning records
 */
async function initializeSheetHeaders(accessToken: string, spreadsheetId: string) {
  const learningHeaders = getExpandedLearningHeaders();
  const checklistHeaders = formatLearningChecklistHeaders();

  const values = [
    {
      range: 'Students!A1:J1',
      values: [['ID', 'Name', 'Grade', 'SeatNumber', 'ClassName', 'Gender', 'AvatarUrl', 'ParentName', 'ParentContact', 'Notes']],
    },
    {
      range: 'LearningRecords!A1',
      values: [learningHeaders],
    },
    {
      range: 'LearningChecklist_48Items!A1',
      values: [checklistHeaders],
    },
    {
      range: 'ContactBooks!A1:Q1',
      values: [['ID', 'Date', 'StudentId', 'StudentName', 'ClassName', 'SeatNumber', 'Breakfast', 'Lunch', 'Snack', 'NapMinutes', 'Mood', 'Temperature', 'HealthNotes', 'TeacherMessage', 'ParentReply', 'IsReadByParent', 'CreatedAt']],
    },
  ];

  await fetch(`${SHEETS_API_BASE}/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: values,
    }),
  });
}

/**
 * Fetch all data from Google Sheets, including all 48 item columns across 8 corner areas
 */
export async function loadAllFromSheet(accessToken: string, spreadsheetId: string): Promise<SyncedData> {
  const ranges = ['Students!A2:J', 'LearningRecords!A1:ZZ', 'ContactBooks!A2:Q'];
  const url = `${SHEETS_API_BASE}/${spreadsheetId}/values:batchGet?${ranges.map(r => `ranges=${encodeURIComponent(r)}`).join('&')}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`載入 Google Sheet 資料失敗: ${errText}`);
  }

  const data = await res.json();
  const valueRanges = data.valueRanges || [];

  const studentsRowData = valueRanges[0]?.values || [];
  const rawLearning = valueRanges[1]?.values || [];
  const contactRowData = valueRanges[2]?.values || [];

  const students: Student[] = studentsRowData.map((row: string[]) => {
    let grade = '';
    let seatNumber = '';
    let className = '大班 (櫻桃班)';
    let gender: 'boy' | 'girl' = 'girl';
    let avatarUrl = '';
    let parentName = '';
    let parentContact = '';
    let notes = '';

    if (row.length >= 10) {
      grade = row[2] || '';
      seatNumber = row[3] || '';
      className = row[4] || '大班 (櫻桃班)';
      gender = (row[5] as any) === 'boy' ? 'boy' : 'girl';
      avatarUrl = row[6] || '';
      parentName = row[7] || '';
      parentContact = row[8] || '';
      notes = row[9] || '';
    } else {
      seatNumber = row[2] || '';
      className = row[3] || '大班 (櫻桃班)';
      gender = (row[4] as any) === 'boy' ? 'boy' : 'girl';
      avatarUrl = row[5] || '';
      parentName = row[6] || '';
      parentContact = row[7] || '';
      notes = row[8] || '';
    }

    if (!grade) {
      if (className.includes('幼幼')) grade = '幼幼班';
      else if (className.includes('小班')) grade = '小班';
      else if (className.includes('中班')) grade = '中班';
      else if (className.includes('大班')) grade = '大班';
    }

    return {
      id: row[0] || '',
      name: row[1] || '',
      grade,
      seatNumber,
      className,
      gender,
      avatarUrl,
      parentName,
      parentContact,
      notes,
    };
  });

  let learningRecords: LearningRecord[] = [];

  if (rawLearning.length > 1) {
    const headerRow: string[] = rawLearning[0] || [];
    const hasExpandedHeaders = headerRow.some((h: string) => h && h.includes('[') && h.includes(']'));

    if (hasExpandedHeaders) {
      // Dynamic index mapping for all items and notes
      const itemCols: { colIdx: number; areaId: CornerAreaId; itemName: string }[] = [];
      const noteCols: { colIdx: number; areaId: CornerAreaId }[] = [];
      const dynamicAreas = getStoredCornerAreas();

      headerRow.forEach((colHeader: string, idx: number) => {
        if (!colHeader) return;
        dynamicAreas.forEach((area) => {
          if (colHeader.includes(`[${area.name}]`) && colHeader.includes('觀察筆記')) {
            noteCols.push({ colIdx: idx, areaId: area.id });
          } else {
            area.items.forEach((item) => {
              if (colHeader.includes(`[${area.name}]`) && colHeader.includes(item)) {
                itemCols.push({ colIdx: idx, areaId: area.id, itemName: item });
              }
            });
          }
        });
      });

      const idIdx = headerRow.indexOf('ID');
      const startIdx = headerRow.indexOf('DateStart');
      const endIdx = headerRow.indexOf('DateEnd');
      const studentIdIdx = headerRow.indexOf('StudentId');
      const studentNameIdx = headerRow.indexOf('StudentName');
      const classIdx = headerRow.indexOf('ClassName');
      const seatIdx = headerRow.indexOf('SeatNumber');
      const commentIdx = headerRow.indexOf('TeacherComment');
      const stampIdx = headerRow.indexOf('Stamp');
      const photoIdx = headerRow.indexOf('PhotoImagesJSON');
      const videoIdx = headerRow.indexOf('VideoUrlsJSON');
      const checkedJsonIdx = headerRow.indexOf('CheckedItemsJSON');
      const notesJsonIdx = headerRow.indexOf('CustomNotesJSON');
      const createdIdx = headerRow.indexOf('CreatedAt');

      for (let r = 1; r < rawLearning.length; r++) {
        const row = rawLearning[r];
        if (!row || row.length === 0) continue;

        const checkedItems: Record<CornerAreaId, string[]> = {
          language: [],
          watercolor: [],
          art: [],
          beads: [],
          science: [],
          brain: [],
          puzzle: [],
          blocks: [],
        };

        const customNotes: Record<CornerAreaId, string> = {
          language: '',
          watercolor: '',
          art: '',
          beads: '',
          science: '',
          brain: '',
          puzzle: '',
          blocks: '',
        };

        // Populate items checked by 'V', 'v', '1', '是', '✓' etc.
        itemCols.forEach(({ colIdx, areaId, itemName }) => {
          const val = row[colIdx];
          if (val && (val === 'V' || val === 'v' || val === '1' || val === '是' || val === 'true' || val === 'TRUE' || val === '✓' || val === '✔' || String(val).trim().length > 0)) {
            if (!checkedItems[areaId].includes(itemName)) {
              checkedItems[areaId].push(itemName);
            }
          }
        });

        noteCols.forEach(({ colIdx, areaId }) => {
          const val = row[colIdx];
          if (val && typeof val === 'string' && val.trim()) {
            customNotes[areaId] = val.trim();
          }
        });

        // Merge from JSON if available and column list was empty
        if (checkedJsonIdx !== -1 && row[checkedJsonIdx]) {
          const parsedChecked = safeJsonParse(row[checkedJsonIdx], null);
          if (parsedChecked) {
            Object.keys(parsedChecked).forEach((k) => {
              const aid = k as CornerAreaId;
              if (checkedItems[aid] && checkedItems[aid].length === 0 && Array.isArray(parsedChecked[aid])) {
                checkedItems[aid] = parsedChecked[aid];
              }
            });
          }
        }

        if (notesJsonIdx !== -1 && row[notesJsonIdx]) {
          const parsedNotes = safeJsonParse(row[notesJsonIdx], null);
          if (parsedNotes) {
            Object.keys(parsedNotes).forEach((k) => {
              const aid = k as CornerAreaId;
              if (!customNotes[aid] && parsedNotes[aid]) {
                customNotes[aid] = parsedNotes[aid];
              }
            });
          }
        }

        learningRecords.push({
          id: row[idIdx !== -1 ? idIdx : 0] || `rec-${Date.now()}-${r}`,
          dateStart: row[startIdx !== -1 ? startIdx : 1] || '',
          dateEnd: row[endIdx !== -1 ? endIdx : 2] || '',
          studentId: row[studentIdIdx !== -1 ? studentIdIdx : 4] || '',
          studentName: row[studentNameIdx !== -1 ? studentNameIdx : 5] || '',
          className: (row[classIdx !== -1 ? classIdx : 7] as any) || '大班 (櫻桃班)',
          seatNumber: row[seatIdx !== -1 ? seatIdx : 8] || '',
          checkedItems,
          customNotes,
          drawingImage: '',
          photoImages: photoIdx !== -1 ? safeJsonParse(row[photoIdx], []) : [],
          videoUrls: videoIdx !== -1 ? safeJsonParse(row[videoIdx], []) : [],
          teacherComment: row[commentIdx !== -1 ? commentIdx : 11] || '',
          stamp: row[stampIdx !== -1 ? stampIdx : 12] || '特別優秀',
          createdAt: row[createdIdx !== -1 ? createdIdx : 13] || new Date().toISOString(),
        });
      }
    } else {
      // Legacy format
      for (let r = 1; r < rawLearning.length; r++) {
        const row = rawLearning[r];
        if (!row || row.length === 0) continue;
        learningRecords.push({
          id: row[0] || '',
          dateStart: row[1] || '',
          dateEnd: row[2] || '',
          studentId: row[3] || '',
          studentName: row[4] || '',
          className: (row[5] as any) || '大班 (櫻桃班)',
          seatNumber: row[6] || '',
          checkedItems: safeJsonParse(row[7], {}),
          customNotes: safeJsonParse(row[8], {}),
          drawingImage: row[9] || '',
          photoImages: safeJsonParse(row[10], []),
          teacherComment: row[11] || '',
          stamp: row[12] || '特別優秀',
          createdAt: row[13] || new Date().toISOString(),
        });
      }
    }
  }

  const contactBooks: ContactBook[] = contactRowData.map((row: string[]) => ({
    id: row[0] || '',
    date: row[1] || '',
    studentId: row[2] || '',
    studentName: row[3] || '',
    className: (row[4] as any) || '大班 (櫻桃班)',
    seatNumber: row[5] || '',
    breakfast: (row[6] as any) || '全部吃完',
    lunch: (row[7] as any) || '全部吃完',
    snack: (row[8] as any) || '全部吃完',
    napMinutes: parseInt(row[9] || '90', 10),
    mood: (row[10] as any) || '開心熱情 🌸',
    temperature: row[11] || '36.5°C',
    healthNotes: row[12] || '',
    teacherMessage: row[13] || '',
    parentReply: row[14] || '',
    isReadByParent: row[15] === 'TRUE' || row[15] === 'true',
    createdAt: row[16] || new Date().toISOString(),
  }));

  return { students, learningRecords, contactBooks };
}

/**
 * Upload image or video file to specified Google Drive Folder via Web App URL
 */
export async function uploadPhotoToGoogleDrive(
  webAppUrl: string,
  base64Data: string,
  fileName: string,
  folderUrl?: string,
  contentType: string = 'image/jpeg'
): Promise<{ status: string; fileId?: string; fileUrl?: string; downloadUrl?: string; message?: string }> {
  try {
    const normalizedUrl = normalizeWebAppUrl(webAppUrl);
    if (!normalizedUrl) {
      throw new Error('未設定有效的 Google Sheet Web App URL');
    }

    const payload = {
      action: 'uploadFile',
      base64Data,
      fileName,
      folderUrl: folderUrl || DEFAULT_MEDIA_FOLDER_URL,
      contentType: contentType || 'image/jpeg',
    };

    const jsonString = JSON.stringify(payload);

    // 1. Send via beacon if available
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      try {
        const formData = new FormData();
        formData.append('payload', jsonString);
        navigator.sendBeacon(normalizedUrl, formData);
      } catch (bErr) {
        console.warn('sendBeacon upload warning:', bErr);
      }
    }

    // 2. Send via hidden form helper
    sendViaHiddenForm(normalizedUrl, payload);

    // 3. Send fetch request
    const params = new URLSearchParams();
    params.append('payload', jsonString);

    const response = await fetch(normalizedUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok && response.type !== 'opaque') {
      throw new Error(`HTTP 錯誤 ${response.status}`);
    }

    if (response.type === 'opaque') {
      return {
        status: 'success',
        message: '照片已透過背景連線同步傳送至 Google Drive 雲端資料夾',
      };
    }

    const text = await response.text();
    if (text) {
      try {
        const data = JSON.parse(text);
        return data;
      } catch (e) {}
    }

    return { status: 'success', message: '照片已成功傳送至 Google Drive 資料夾' };
  } catch (error: any) {
    console.warn('Google Drive photo upload notice:', error);
    return {
      status: 'error',
      message: error.message || '無法連線至 Google Drive Web App',
    };
  }
}

/**
 * Sync all current state back to Google Sheet (bulk overwrite)
 * Includes all 8 learning corner areas and 48 items expanded into columns with 'V' marks,
 * plus a vertical LearningChecklist_48Items sheet.
 */
export async function syncAllToSheet(
  accessToken: string,
  spreadsheetId: string,
  students: Student[],
  learningRecords: LearningRecord[],
  contactBooks: ContactBook[],
  markSymbol: string = 'V'
): Promise<void> {
  const studentMap = new Map<string, Student>();
  students.forEach((s) => studentMap.set(s.id, s));

  // 1. Students Roster Table
  const studentHeaders = ['ID', 'Name', 'Grade', 'SeatNumber', 'ClassName', 'Gender', 'AvatarUrl', 'ParentName', 'ParentContact', 'Notes'];
  const studentValues = [
    studentHeaders,
    ...students.map((s) => [
      s.id,
      s.name,
      s.grade || getStudentGrade(s) || '',
      s.seatNumber,
      s.className,
      s.gender,
      s.avatarUrl,
      s.parentName || '',
      s.parentContact || '',
      s.notes || '',
    ]),
  ];

  // 2. Learning Records (8 Areas & ALL 48 Items Expanded)
  const learningHeaders = getExpandedLearningHeaders();
  const learningValues = [
    learningHeaders,
    ...learningRecords.map((r) => {
      const s = studentMap.get(r.studentId);
      const grade = s ? getStudentGrade(s) : (r.className.includes('大') ? '大班' : r.className.includes('中') ? '中班' : '小班');
      return formatLearningRecordRow(r, grade, markSymbol);
    }),
  ];

  // 3. Learning Checklist (Vertical format with 48 items as rows for Google Sheets sorting & filtering)
  const checklistHeaders = formatLearningChecklistHeaders();
  const checklistRows = formatLearningChecklistRows(learningRecords, studentMap, markSymbol);
  const checklistValues = [checklistHeaders, ...checklistRows];

  // 4. Contact Books Table
  const contactHeaders = ['ID', 'Date', 'StudentId', 'StudentName', 'ClassName', 'SeatNumber', 'Breakfast', 'Lunch', 'Snack', 'NapMinutes', 'Mood', 'Temperature', 'HealthNotes', 'TeacherMessage', 'ParentReply', 'IsReadByParent', 'CreatedAt'];
  const contactValues = [
    contactHeaders,
    ...contactBooks.map((c) => [
      c.id,
      c.date,
      c.studentId,
      c.studentName,
      c.className,
      c.seatNumber,
      c.breakfast,
      c.lunch,
      c.snack,
      c.napMinutes.toString(),
      c.mood,
      c.temperature,
      c.healthNotes,
      c.teacherMessage,
      c.parentReply || '',
      c.isReadByParent ? 'TRUE' : 'FALSE',
      c.createdAt || new Date().toISOString(),
    ]),
  ];

  // First clear old values across sheets to prevent leftover rows
  try {
    await fetch(`${SHEETS_API_BASE}/${spreadsheetId}/values:batchClear`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ranges: ['Students!A:Z', 'LearningRecords!A:ZZ', 'LearningChecklist_48Items!A:Z', 'ContactBooks!A:Z'],
      }),
    });
  } catch (clearErr) {
    console.warn('Batch clear warning:', clearErr);
  }

  // Write all updated data tables
  const data = [
    { range: 'Students!A1', values: studentValues },
    { range: 'LearningRecords!A1', values: learningValues },
    { range: 'LearningChecklist_48Items!A1', values: checklistValues },
    { range: 'ContactBooks!A1', values: contactValues },
  ];

  const res = await fetch(`${SHEETS_API_BASE}/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`同步寫入 Google Sheet 失敗: ${errText}`);
  }
}

/**
 * Synchronize a single child's observation record into Google Sheet (ID: 1jFe492XljTkDx3A4fLWBX1PEy4J7Q7TffNLQiVlJI6c)
 * Appends the 48-item expanded row to LearningRecords sheet
 */
export async function syncSingleLearningRecordToSheet(
  accessToken: string,
  spreadsheetId: string,
  record: LearningRecord,
  student?: Student,
  markSymbol: string = 'V'
): Promise<void> {
  const grade = student ? getStudentGrade(student) : (record.className.includes('大') ? '大班' : '中班');
  const rowData = formatLearningRecordRow(record, grade, markSymbol);

  const res = await fetch(`${SHEETS_API_BASE}/${spreadsheetId}/values/LearningRecords!A1:append?valueInputOption=USER_ENTERED`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [rowData],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`單筆同步至 Google Sheet 失敗: ${errText}`);
  }
}

export const LEARNING_CORNER_APPS_SCRIPT_CODE = `/**
 * 愛愛幼兒園 - 角落學習區紀錄專用 Google Sheets Apps Script 程式碼
 * 
 * 步驟說明：
 * 1. 開啟您的角落學習區 Google 試算表 ➔ 點選選單「擴充功能」 ➔ 「Apps Script」
 * 2. 清空現有程式碼，全選貼上下方 JavaScript 腳本
 * 3. 點選右上角「部署」 ➔ 「新增部署」 
 * 4. 種類選「網頁應用程式 (Web App)」
 * 5. 執行身分選「我 (Me)」，存取權限設為「所有人 (Anyone)」
 * 6. 點擊「部署」並完成帳號授權，複製「網頁應用程式 URL」貼回幼兒園系統設定頁面！
 */

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("LearningRecords") || ss.getSheetByName("角落學習紀錄");
  
  if (!sheet) {
    sheet = ss.insertSheet("LearningRecords");
    sheet.appendRow([
      "ID", "DateStart", "DateEnd", "StudentId", "StudentName", "ClassName", "SeatNumber", 
      "CheckedItemsJSON", "CustomNotesJSON", "DrawingImage", "PhotoImagesJSON", "VideoUrlsJSON", 
      "TeacherComment", "Stamp", "CreatedAt"
    ]);
  }
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify({ status: "success", learningRecords: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    rows.push(obj);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    learningRecords: rows,
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var contents;
    if (e && e.parameter && e.parameter.payload) {
      contents = JSON.parse(e.parameter.payload);
    } else if (e && e.postData && e.postData.contents) {
      contents = JSON.parse(e.postData.contents);
    } else {
      contents = {};
    }

    // Google Drive 上傳照片與媒體檔案功能
    if (contents.action === "uploadFile" || contents.action === "uploadMedia") {
      var folderId = "1HmKXkl-xbLMaaCq663RMRINAsdavttJp"; // 預設雲端資料夾 ID
      if (contents.folderUrl) {
        var match = contents.folderUrl.match(/\/folders\/([a-zA-Z0-9_-]+)/);
        if (match) folderId = match[1];
      }
      try {
        var folder = DriveApp.getFolderById(folderId);
        var base64 = contents.base64Data;
        if (base64.indexOf(",") > -1) {
          base64 = base64.split(",")[1];
        }
        var contentType = contents.contentType || "image/jpeg";
        var bytes = Utilities.base64Decode(base64);
        var fileName = contents.fileName || ("photo_" + new Date().getTime() + ".jpg");
        var blob = Utilities.newBlob(bytes, contentType, fileName);
        var file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        
        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          fileId: file.getId(),
          fileUrl: file.getUrl(),
          downloadUrl: "https://lh3.googleusercontent.com/d/" + file.getId(),
          message: "照片已成功上傳至指定 Google Drive 雲端資料夾！"
        })).setMimeType(ContentService.MimeType.JSON);
      } catch(fileErr) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          message: "Google Drive 上傳錯誤: " + fileErr.toString()
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("LearningRecords") || ss.getSheetByName("角落學習紀錄");
    
    if (!sheet) {
      sheet = ss.insertSheet("LearningRecords");
    }
    
    sheet.clear();
    sheet.appendRow([
      "ID", "DateStart", "DateEnd", "StudentId", "StudentName", "ClassName", "SeatNumber", 
      "CheckedItemsJSON", "CustomNotesJSON", "DrawingImage", "PhotoImagesJSON", "VideoUrlsJSON", 
      "TeacherComment", "Stamp", "CreatedAt"
    ]);
    
    var records = contents.learningRecords || contents.records || [];
    records.forEach(function(r) {
      sheet.appendRow([
        r.id, r.dateStart, r.dateEnd, r.studentId, r.studentName, r.className, r.seatNumber,
        JSON.stringify(r.checkedItems || {}), JSON.stringify(r.customNotes || {}),
        r.drawingImage || "", JSON.stringify(r.photoImages || []), JSON.stringify(r.videoUrls || []),
        r.teacherComment || "", r.stamp || "", r.createdAt || new Date().toISOString()
      ]);
    });
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "角落學習區紀錄已成功更新至 Google Sheet！"
    })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;

export const STUDENT_ROSTER_APPS_SCRIPT_CODE = `/**
 * 愛愛幼兒園 - 學生名冊專用 Google Sheets Apps Script 程式碼
 * 
 * 步驟說明：
 * 1. 開啟您的學生名冊 Google 試算表 ➔ 點選選單「擴充功能」 ➔ 「Apps Script」
 * 2. 清空現有程式碼，全選貼上下方 JavaScript 腳本
 * 3. 點選右上角「部署」 ➔ 「新增部署」 
 * 4. 種類選「網頁應用程式 (Web App)」
 * 5. 執行身分選「我 (Me)」，存取權限設為「所有人 (Anyone)」
 * 6. 點擊「部署」並完成帳號授權，複製「網頁應用程式 URL」貼回幼兒園系統設定頁面！
 */

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Students") || ss.getSheetByName("學生名冊");
  
  if (!sheet) {
    sheet = ss.insertSheet("Students");
    sheet.appendRow([
      "ID", "Name", "SeatNumber", "ClassName", "Gender", "AvatarUrl", "ParentName", "ParentContact", "Notes"
    ]);
  }
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify({ status: "success", students: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    rows.push(obj);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    students: rows,
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Students") || ss.getSheetByName("學生名冊");
    
    if (!sheet) {
      sheet = ss.insertSheet("Students");
    }
    
    sheet.clear();
    sheet.appendRow([
      "ID", "Name", "Grade", "SeatNumber", "ClassName", "Gender", "AvatarUrl", "ParentName", "ParentContact", "Notes"
    ]);
    
    var students = contents.students || [];
    students.forEach(function(s) {
      sheet.appendRow([
        s.id, s.name, s.grade || "", s.seatNumber, s.className, s.gender,
        s.avatarUrl || "", s.parentName || "", s.parentContact || "", s.notes || ""
      ]);
    });
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "學生名冊資料已成功更新至 Google Sheet！"
    })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;

export const CONTACT_BOOK_APPS_SCRIPT_CODE = `/**
 * 愛愛幼兒園 - 家長聯絡簿專用 Google Sheets Apps Script 程式碼
 * 
 * 步驟說明：
 * 1. 開啟您的家長聯絡簿 Google 試算表 ➔ 點選選單「擴充功能」 ➔ 「Apps Script」
 * 2. 清空現有程式碼，全選貼上下方 JavaScript 腳本
 * 3. 點選右上角「部署」 ➔ 「新增部署」 
 * 4. 種類選「網頁應用程式 (Web App)」
 * 5. 執行身分選「我 (Me)」，存取權限設為「所有人 (Anyone)」
 * 6. 點擊「部署」並完成帳號授權，複製「網頁應用程式 URL」貼回幼兒園系統設定頁面！
 */

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("ContactBooks") || ss.getSheetByName("聯絡簿");
  
  if (!sheet) {
    sheet = ss.insertSheet("ContactBooks");
    sheet.appendRow([
      "ID", "Date", "StudentId", "StudentName", "ClassName", "SeatNumber", 
      "Breakfast", "Lunch", "Snack", "NapMinutes", "Mood", "Temperature", 
      "HealthNotes", "TeacherMessage", "ParentReply", "IsReadByParent", "CreatedAt"
    ]);
  }
  
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify({ status: "success", contactBooks: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    rows.push(obj);
  }
  
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    contactBooks: rows,
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("ContactBooks") || ss.getSheetByName("聯絡簿");
    
    if (!sheet) {
      sheet = ss.insertSheet("ContactBooks");
    }
    
    sheet.clear();
    sheet.appendRow([
      "ID", "Date", "StudentId", "StudentName", "ClassName", "SeatNumber", 
      "Breakfast", "Lunch", "Snack", "NapMinutes", "Mood", "Temperature", 
      "HealthNotes", "TeacherMessage", "ParentReply", "IsReadByParent", "CreatedAt"
    ]);
    
    var contactBooks = contents.contactBooks || [];
    contactBooks.forEach(function(c) {
      sheet.appendRow([
        c.id, c.date, c.studentId, c.studentName, c.className, c.seatNumber,
        c.breakfast, c.lunch, c.snack, c.napMinutes, c.mood, c.temperature,
        c.healthNotes || "", c.teacherMessage || "", c.parentReply || "",
        c.isReadByParent ? "TRUE" : "FALSE", c.createdAt || new Date().toISOString()
      ]);
    });
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "家長聯絡簿資料已成功更新至 Google Sheet！"
    })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;

export const APPS_SCRIPT_CODE = `/**
 * 愛愛幼兒園 - Google Sheets 雙向資料同步腳本 (Google Apps Script)
 * 步驟：
 * 1. 開啟您的 Google 試算表 ➔ 點選「擴充功能」 ➔ 「Apps Script」
 * 2. 刪除原有程式碼，貼上本程式碼
 * 3. 點選右上角「部署」 ➔ 「新增部署」
 * 4. 種類選擇「網頁應用程式 (Web App)」
 * 5. 執行身分選「我」，存取權限選「所有人 (Anyone)」
 * 6. 部署後複製網址，貼回幼兒園系統的 Web App URL 欄位即可！
 */

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var studentsSheet = ss.getSheetByName("Students");
  var learningSheet = ss.getSheetByName("LearningRecords");
  var contactSheet = ss.getSheetByName("ContactBooks");
  
  // 自動建立缺少的分頁
  if (!studentsSheet) {
    studentsSheet = ss.insertSheet("Students");
    studentsSheet.appendRow(["ID", "Name", "SeatNumber", "ClassName", "Gender", "AvatarUrl", "ParentName", "ParentContact", "Notes"]);
  }
  if (!learningSheet) {
    learningSheet = ss.insertSheet("LearningRecords");
    learningSheet.appendRow(["ID", "DateStart", "DateEnd", "StudentId", "StudentName", "ClassName", "SeatNumber", "CheckedItemsJSON", "CustomNotesJSON", "DrawingImage", "PhotoImagesJSON", "VideoUrlsJSON", "TeacherComment", "Stamp", "CreatedAt"]);
  }
  if (!contactSheet) {
    contactSheet = ss.insertSheet("ContactBooks");
    contactSheet.appendRow(["ID", "Date", "StudentId", "StudentName", "ClassName", "SeatNumber", "Breakfast", "Lunch", "Snack", "NapMinutes", "Mood", "Temperature", "HealthNotes", "TeacherMessage", "ParentReply", "IsReadByParent", "CreatedAt"]);
  }
  
  var studentsData = getSheetDataAsObjects(studentsSheet);
  var learningData = getSheetDataAsObjects(learningSheet);
  var contactData = getSheetDataAsObjects(contactSheet);
  
  var result = {
    status: "success",
    students: studentsData,
    learningRecords: learningData,
    contactBooks: contactData,
    timestamp: new Date().toISOString()
  };
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var contents;
    if (e && e.parameter && e.parameter.payload) {
      contents = JSON.parse(e.parameter.payload);
    } else if (e && e.postData && e.postData.contents) {
      contents = JSON.parse(e.postData.contents);
    } else {
      contents = {};
    }

    // Google Drive 上傳照片與媒體檔案功能
    if (contents.action === "uploadFile" || contents.action === "uploadMedia") {
      var folderId = "1HmKXkl-xbLMaaCq663RMRINAsdavttJp"; // 預設雲端資料夾 ID
      if (contents.folderUrl) {
        var match = contents.folderUrl.match(/\/folders\/([a-zA-Z0-9_-]+)/);
        if (match) folderId = match[1];
      }
      try {
        var folder = DriveApp.getFolderById(folderId);
        var base64 = contents.base64Data;
        if (base64.indexOf(",") > -1) {
          base64 = base64.split(",")[1];
        }
        var contentType = contents.contentType || "image/jpeg";
        var bytes = Utilities.base64Decode(base64);
        var fileName = contents.fileName || ("photo_" + new Date().getTime() + ".jpg");
        var blob = Utilities.newBlob(bytes, contentType, fileName);
        var file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        
        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          fileId: file.getId(),
          fileUrl: file.getUrl(),
          downloadUrl: "https://lh3.googleusercontent.com/d/" + file.getId(),
          message: "照片已成功上傳至指定 Google Drive 雲端資料夾！"
        })).setMimeType(ContentService.MimeType.JSON);
      } catch(fileErr) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          message: "Google Drive 上傳錯誤: " + fileErr.toString()
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (contents.students && Array.isArray(contents.students)) {
      updateStudentsSheet(ss, contents.students);
    }
    var learning = contents.learningRecords || contents.records;
    if (learning && Array.isArray(learning)) {
      updateLearningSheet(ss, learning);
    }
    if (contents.contactBooks && Array.isArray(contents.contactBooks)) {
      updateContactSheet(ss, contents.contactBooks);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "資料同步成功！" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getSheetDataAsObjects(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    rows.push(obj);
  }
  return rows;
}

function updateStudentsSheet(ss, students) {
  var sheet = ss.getSheetByName("Students") || ss.insertSheet("Students");
  sheet.clear();
  sheet.appendRow(["ID", "Name", "Grade", "SeatNumber", "ClassName", "Gender", "AvatarUrl", "ParentName", "ParentContact", "Notes"]);
  students.forEach(function(s) {
    sheet.appendRow([s.id, s.name, s.grade || "", s.seatNumber, s.className, s.gender, s.avatarUrl || "", s.parentName || "", s.parentContact || "", s.notes || ""]);
  });
}

function updateLearningSheet(ss, records) {
  var sheet = ss.getSheetByName("LearningRecords") || ss.insertSheet("LearningRecords");
  sheet.clear();
  sheet.appendRow(["ID", "DateStart", "DateEnd", "StudentId", "StudentName", "ClassName", "SeatNumber", "CheckedItemsJSON", "CustomNotesJSON", "DrawingImage", "PhotoImagesJSON", "VideoUrlsJSON", "TeacherComment", "Stamp", "CreatedAt"]);
  records.forEach(function(r) {
    sheet.appendRow([
      r.id, r.dateStart, r.dateEnd, r.studentId, r.studentName, r.className, r.seatNumber,
      JSON.stringify(r.checkedItems || {}), JSON.stringify(r.customNotes || {}),
      r.drawingImage || "", JSON.stringify(r.photoImages || []), JSON.stringify(r.videoUrls || []),
      r.teacherComment || "", r.stamp || "", r.createdAt || new Date().toISOString()
    ]);
  });
}

function updateContactSheet(ss, contactBooks) {
  var sheet = ss.getSheetByName("ContactBooks") || ss.insertSheet("ContactBooks");
  sheet.clear();
  sheet.appendRow(["ID", "Date", "StudentId", "StudentName", "ClassName", "SeatNumber", "Breakfast", "Lunch", "Snack", "NapMinutes", "Mood", "Temperature", "HealthNotes", "TeacherMessage", "ParentReply", "IsReadByParent", "CreatedAt"]);
  contactBooks.forEach(function(c) {
    sheet.appendRow([
      c.id, c.date, c.studentId, c.studentName, c.className, c.seatNumber,
      c.breakfast, c.lunch, c.snack, c.napMinutes, c.mood, c.temperature,
      c.healthNotes || "", c.teacherMessage || "", c.parentReply || "",
      c.isReadByParent ? "TRUE" : "FALSE", c.createdAt || new Date().toISOString()
    ]);
  });
}
`;

export function normalizeWebAppUrl(url: string): string {
  if (!url) return DEFAULT_WEB_APP_URL;
  let trimmed = url.trim();
  // Transform library URLs: /macros/library/d/{id}/... -> /macros/s/{id}/exec
  const libraryMatch = trimmed.match(/\/macros\/library\/d\/([^\/]+)/);
  if (libraryMatch && libraryMatch[1]) {
    return `https://script.google.com/macros/s/${libraryMatch[1]}/exec`;
  }
  // If macro URL doesn't end with /exec, append it if needed
  if (trimmed.includes('/macros/s/') && !trimmed.endsWith('/exec')) {
    trimmed = trimmed.replace(/\/+$/, '') + '/exec';
  }
  return trimmed;
}

/**
 * Fetch data using Web App URL
 */
export async function fetchFromWebApp(webAppUrl: string): Promise<SyncedData> {
  const normalizedUrl = normalizeWebAppUrl(webAppUrl);
  if (!normalizedUrl) {
    throw new Error('請輸入或選擇有效的 Google Apps Script Web App URL');
  }

  // Append cache buster to prevent mobile browser aggressive GET caching
  const fetchUrl = normalizedUrl + (normalizedUrl.includes('?') ? '&' : '?') + `t=${Date.now()}`;

  let res: Response | null = null;
  try {
    res = await fetch(fetchUrl, { redirect: 'follow', cache: 'no-store' });
  } catch (err: any) {
    // Retry direct URL without extra query params if network error occurs
    try {
      res = await fetch(normalizedUrl, { redirect: 'follow' });
    } catch (retryErr) {
      if (normalizedUrl !== DEFAULT_WEB_APP_URL) {
        try {
          return await fetchFromWebApp(DEFAULT_WEB_APP_URL);
        } catch (fallbackErr) {}
      }
      console.warn(`Web App fetch warning (${normalizedUrl}):`, err?.message || err);
      throw new Error(`無法連線至 Web App 網址 (${normalizedUrl})。請確認 Apps Script 已點選「部署 ➔ 新增部署 ➔ 網頁應用程式 (Web App)」，存取權限設為「所有人 (Anyone)」。系統已安全載入本地名冊。`);
    }
  }

  if (!res || !res.ok) {
    if (normalizedUrl !== DEFAULT_WEB_APP_URL) {
      try {
        return await fetchFromWebApp(DEFAULT_WEB_APP_URL);
      } catch (fallbackErr) {}
    }
    throw new Error(`Web App 請求失敗 (${res ? res.status : '無回應'})。請確認已部署 Apps Script 為 Web App 並開放存取。`);
  }

  let data: any;
  try {
    data = await res.json();
  } catch (jsonErr) {
    if (normalizedUrl !== DEFAULT_WEB_APP_URL) {
      try {
        return await fetchFromWebApp(DEFAULT_WEB_APP_URL);
      } catch (fallbackErr) {}
    }
    throw new Error('Web App 回傳內容非 JSON 格式。請確認 Apps Script 程式碼已更新並重新部署。');
  }

  if (data.status !== 'success' && data.status !== 'ok') {
    throw new Error(data.message || 'Web App 執行結果異常');
  }

  const rawStudents = Array.isArray(data.students) ? data.students : [];
  const rawLearning = Array.isArray(data.learningRecords) ? data.learningRecords : [];
  const rawContact = Array.isArray(data.contactBooks) ? data.contactBooks : [];

  const students: Student[] = rawStudents.map((s: any, idx: number) => {
    const rawGender = String(s.Gender || s.gender || '').trim();
    const gender: 'boy' | 'girl' = (rawGender === '男' || rawGender.toLowerCase() === 'boy' || rawGender.toLowerCase() === 'b' || rawGender.includes('男')) ? 'boy' : 'girl';
    const rawId = s.ID !== undefined && s.ID !== null && s.ID !== '' ? String(s.ID).trim() : (s.id || '');
    const className = String(s.ClassName || s.className || '大班 (櫻桃班)').trim();
    const name = String(s.Name || s.name || '').trim();
    
    // Extract or infer Grade
    let grade = String(s.Grade || s.grade || s.Year || s.year || s['年級'] || '').trim();
    if (!grade) {
      if (className.includes('幼幼')) grade = '幼幼班';
      else if (className.includes('小班')) grade = '小班';
      else if (className.includes('中班')) grade = '中班';
      else if (className.includes('大班')) grade = '大班';
    }
    
    // Stable clean ID
    const studentId = rawId ? (rawId.startsWith('stu-') ? rawId : `stu-${className ? className.replace(/[\s()]/g, '') + '-' : ''}${rawId}`) : `stu-${idx + 1}`;
    
    const seatNum = String(s.SeatNumber || s.seatNumber || (rawId ? String(rawId).padStart(2, '0') : String(idx + 1).padStart(2, '0'))).trim();

    let avatar = String(s.AvatarUrl || s.avatarUrl || '').trim();
    if (!avatar || !avatar.startsWith('http')) {
      const seed = encodeURIComponent(name || `child-${idx}`);
      avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
    }

    return {
      id: studentId,
      name,
      grade,
      seatNumber: seatNum,
      className,
      gender,
      avatarUrl: avatar,
      parentName: String(s.ParentName || s.parentName || '').trim(),
      parentContact: String(s.ParentContact || s.parentContact || '').trim(),
      notes: String(s.Notes || s.notes || '').trim(),
    };
  });

  const learningRecords: LearningRecord[] = rawLearning.map((r: any) => ({
    id: String(r.ID || r.id || Math.random()),
    dateStart: r.DateStart || r.dateStart || '',
    dateEnd: r.DateEnd || r.dateEnd || '',
    studentId: String(r.StudentId || r.studentId || ''),
    studentName: r.StudentName || r.studentName || '',
    className: r.ClassName || r.className || '大班 (櫻桃班)',
    seatNumber: String(r.SeatNumber || r.seatNumber || ''),
    checkedItems: typeof r.CheckedItemsJSON === 'string' ? safeJsonParse(r.CheckedItemsJSON, {}) : (r.checkedItems || {}),
    customNotes: typeof r.CustomNotesJSON === 'string' ? safeJsonParse(r.CustomNotesJSON, {}) : (r.customNotes || {}),
    drawingImage: r.DrawingImage || r.drawingImage || '',
    photoImages: typeof r.PhotoImagesJSON === 'string' ? safeJsonParse(r.PhotoImagesJSON, []) : (r.photoImages || []),
    videoUrls: typeof r.VideoUrlsJSON === 'string' ? safeJsonParse(r.VideoUrlsJSON, []) : (r.videoUrls || []),
    teacherComment: r.TeacherComment || r.teacherComment || '',
    stamp: r.Stamp || r.stamp || '特別優秀',
    createdAt: r.CreatedAt || r.createdAt || new Date().toISOString(),
  }));

  const contactBooks: ContactBook[] = rawContact.map((c: any) => ({
    id: String(c.ID || c.id || Math.random()),
    date: c.Date || c.date || '',
    studentId: String(c.StudentId || c.studentId || ''),
    studentName: c.StudentName || c.studentName || '',
    className: c.ClassName || c.className || '大班 (櫻桃班)',
    seatNumber: String(c.SeatNumber || c.seatNumber || ''),
    breakfast: c.Breakfast || c.breakfast || '全部吃完',
    lunch: c.Lunch || c.lunch || '全部吃完',
    snack: c.Snack || c.snack || '全部吃完',
    napMinutes: Number(c.NapMinutes || c.napMinutes || 90),
    mood: c.Mood || c.mood || '開心熱情 🌸',
    temperature: c.Temperature || c.temperature || '36.5°C',
    healthNotes: c.HealthNotes || c.healthNotes || '',
    teacherMessage: c.TeacherMessage || c.teacherMessage || '',
    parentReply: c.ParentReply || c.parentReply || '',
    isReadByParent: c.IsReadByParent === 'TRUE' || c.IsReadByParent === true || c.isReadByParent === true,
    createdAt: c.CreatedAt || c.createdAt || new Date().toISOString(),
  }));

  return { students, learningRecords, contactBooks };
}

/**
 * Specifically fetch student roster from dedicated Student Web App or configured URL
 */
export async function fetchStudentRoster(customUrl?: string): Promise<Student[]> {
  const targetUrl = customUrl ? normalizeWebAppUrl(customUrl) : DEFAULT_STUDENT_WEB_APP_URL;
  if (!targetUrl) return [];

  const data = await fetchFromWebApp(targetUrl);
  return data.students || [];
}

/**
 * Concurrently fetch from all kindergarten cloud endpoints (Students, Learning, Contact)
 */
export async function fetchAllKindergartenData(config?: {
  webAppUrl?: string;
  studentWebAppUrl?: string;
  learningWebAppUrl?: string;
  contactWebAppUrl?: string;
}): Promise<SyncedData> {
  const studentUrl = config?.studentWebAppUrl || (config?.webAppUrl && config.webAppUrl !== DEFAULT_LEARNING_WEB_APP_URL ? config.webAppUrl : DEFAULT_STUDENT_WEB_APP_URL);
  const learningUrl = config?.learningWebAppUrl || config?.webAppUrl || DEFAULT_LEARNING_WEB_APP_URL;
  const contactUrl = config?.contactWebAppUrl || (config?.webAppUrl && config.webAppUrl !== DEFAULT_LEARNING_WEB_APP_URL ? config.webAppUrl : DEFAULT_CONTACT_WEB_APP_URL);

  let mergedStudents: Student[] = [];
  let mergedLearning: LearningRecord[] = [];
  let mergedContact: ContactBook[] = [];

  const urlsToFetch = [
    { type: 'student', url: studentUrl },
    ...(learningUrl !== studentUrl ? [{ type: 'learning', url: learningUrl }] : []),
    ...(contactUrl !== studentUrl && contactUrl !== learningUrl ? [{ type: 'contact', url: contactUrl }] : [])
  ];

  const results = await Promise.allSettled(urlsToFetch.map(item => fetchFromWebApp(item.url)));

  results.forEach((res) => {
    if (res.status === 'fulfilled' && res.value) {
      if (res.value.students && res.value.students.length > 0 && mergedStudents.length === 0) {
        mergedStudents = res.value.students;
      }
      if (res.value.learningRecords && res.value.learningRecords.length > 0 && mergedLearning.length === 0) {
        mergedLearning = res.value.learningRecords;
      }
      if (res.value.contactBooks && res.value.contactBooks.length > 0 && mergedContact.length === 0) {
        mergedContact = res.value.contactBooks;
      }
    }
  });

  // Ensure students are fetched from DEFAULT_STUDENT_WEB_APP_URL if still empty
  if (mergedStudents.length === 0) {
    try {
      const studentFallback = await fetchFromWebApp(DEFAULT_STUDENT_WEB_APP_URL);
      if (studentFallback.students && studentFallback.students.length > 0) {
        mergedStudents = studentFallback.students;
      }
    } catch (fallbackErr) {
      console.warn('Fallback student fetch warning:', fallbackErr);
    }
  }

  return {
    students: mergedStudents,
    learningRecords: mergedLearning,
    contactBooks: mergedContact
  };
}

/**
 * Helper to post payload via hidden HTML form to ensure Google Apps Script receives POST redirects
 */
function sendViaHiddenForm(url: string, payload: any): void {
  try {
    let iframe = document.getElementById('gscript_sync_iframe') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'gscript_sync_iframe';
      iframe.name = 'gscript_sync_iframe';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = url;
    form.target = 'gscript_sync_iframe';
    form.style.display = 'none';

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'payload';
    input.value = JSON.stringify(payload);
    form.appendChild(input);

    document.body.appendChild(form);
    form.submit();

    setTimeout(() => {
      try {
        if (form.parentNode) {
          form.parentNode.removeChild(form);
        }
      } catch (e) {}
    }, 2000);
  } catch (err) {
    console.warn('Form submit helper warning:', err);
  }
}

/**
 * Push data using Web App URL
 */
export async function syncToWebApp(
  webAppUrl: string,
  students: Student[],
  learningRecords: LearningRecord[],
  contactBooks: ContactBook[]
): Promise<void> {
  const normalizedUrl = normalizeWebAppUrl(webAppUrl);
  if (!normalizedUrl) {
    throw new Error('未設定有效的 Google Sheet Web App URL');
  }

  const payload = {
    action: 'syncAll',
    students: students || [],
    learningRecords: learningRecords || [],
    records: learningRecords || [], // Alias for single-purpose scripts
    contactBooks: contactBooks || [],
  };

  const jsonString = JSON.stringify(payload);

  // 1. Send via beacon on mobile if available (avoids iframe security blocks & CORS redirects)
  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    try {
      const formData = new FormData();
      formData.append('payload', jsonString);
      navigator.sendBeacon(normalizedUrl, formData);
    } catch (bErr) {
      console.warn('sendBeacon warning:', bErr);
    }
  }

  // 2. Always execute hidden form submission as backup
  sendViaHiddenForm(normalizedUrl, payload);

  // 3. Execute fetch call with URLSearchParams body for mobile simple request POST
  try {
    const params = new URLSearchParams();
    params.append('payload', jsonString);

    const res = await fetch(normalizedUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
      redirect: 'follow',
    });

    if (res.type !== 'opaque' && !res.ok) {
      throw new Error(`Web App 寫入失敗 (HTTP ${res.status}): ${res.statusText}`);
    }

    if (res.type !== 'opaque') {
      try {
        const text = await res.text();
        if (text) {
          const json = JSON.parse(text);
          if (json.status === 'error') {
            throw new Error(`Apps Script 寫入錯誤: ${json.message}`);
          }
        }
      } catch (e: any) {
        if (e.message && e.message.includes('Apps Script 寫入錯誤')) throw e;
      }
    }
  } catch (err: any) {
    // Retry with no-cors and simple form params if CORS restriction triggered a fetch failure on mobile
    try {
      const params = new URLSearchParams();
      params.append('payload', jsonString);
      await fetch(normalizedUrl, {
        method: 'POST',
        mode: 'no-cors',
        body: params,
      });
    } catch (fallbackErr: any) {
      console.warn('Web App Sync Warning:', err.message || fallbackErr.message);
    }
  }
}

function safeJsonParse(str: string, fallback: any) {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}
