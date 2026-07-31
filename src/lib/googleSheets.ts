import { Student, LearningRecord, ContactBook } from '../types';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3/files';

export interface SyncedData {
  students: Student[];
  learningRecords: LearningRecord[];
  contactBooks: ContactBook[];
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
 * Write headers to the 3 tabs
 */
async function initializeSheetHeaders(accessToken: string, spreadsheetId: string) {
  const values = [
    {
      range: 'Students!A1:I1',
      values: [['ID', 'Name', 'SeatNumber', 'ClassName', 'Gender', 'AvatarUrl', 'ParentName', 'ParentContact', 'Notes']],
    },
    {
      range: 'LearningRecords!A1:N1',
      values: [['ID', 'DateStart', 'DateEnd', 'StudentId', 'StudentName', 'ClassName', 'SeatNumber', 'CheckedItemsJSON', 'CustomNotesJSON', 'DrawingImage', 'PhotoImagesJSON', 'TeacherComment', 'Stamp', 'CreatedAt']],
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
 * Fetch all data from Google Sheets
 */
export async function loadAllFromSheet(accessToken: string, spreadsheetId: string): Promise<SyncedData> {
  const ranges = ['Students!A2:I', 'LearningRecords!A2:N', 'ContactBooks!A2:Q'];
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
  const learningRowData = valueRanges[1]?.values || [];
  const contactRowData = valueRanges[2]?.values || [];

  const students: Student[] = studentsRowData.map((row: string[]) => ({
    id: row[0] || '',
    name: row[1] || '',
    seatNumber: row[2] || '',
    className: (row[3] as any) || '大班 (櫻桃班)',
    gender: (row[4] as any) || 'girl',
    avatarUrl: row[5] || '',
    parentName: row[6] || '',
    parentContact: row[7] || '',
    notes: row[8] || '',
  }));

  const learningRecords: LearningRecord[] = learningRowData.map((row: string[]) => ({
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
    stamp: row[12] || 'たいへんよくできました',
    createdAt: row[13] || new Date().toISOString(),
  }));

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
 * Sync all current state back to Google Sheet (bulk overwrite or append)
 */
export async function syncAllToSheet(
  accessToken: string,
  spreadsheetId: string,
  students: Student[],
  learningRecords: LearningRecord[],
  contactBooks: ContactBook[]
): Promise<void> {
  const studentValues = students.map(s => [
    s.id,
    s.name,
    s.seatNumber,
    s.className,
    s.gender,
    s.avatarUrl,
    s.parentName,
    s.parentContact,
    s.notes || '',
  ]);

  const learningValues = learningRecords.map(r => [
    r.id,
    r.dateStart,
    r.dateEnd,
    r.studentId,
    r.studentName,
    r.className,
    r.seatNumber,
    JSON.stringify(r.checkedItems || {}),
    JSON.stringify(r.customNotes || {}),
    r.drawingImage || '',
    JSON.stringify(r.photoImages || []),
    r.teacherComment || '',
    r.stamp || '',
    r.createdAt || new Date().toISOString(),
  ]);

  const contactValues = contactBooks.map(c => [
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
  ]);

  // First clear old values A2:Z
  await fetch(`${SHEETS_API_BASE}/${spreadsheetId}/values:batchClear`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ranges: ['Students!A2:Z', 'LearningRecords!A2:Z', 'ContactBooks!A2:Z'],
    }),
  });

  // Then write updated values
  const data = [
    { range: `Students!A2:I${1 + studentValues.length}`, values: studentValues },
    { range: `LearningRecords!A2:N${1 + learningValues.length}`, values: learningValues },
    { range: `ContactBooks!A2:Q${1 + contactValues.length}`, values: contactValues },
  ].filter(d => d.values.length > 0);

  if (data.length > 0) {
    await fetch(`${SHEETS_API_BASE}/${spreadsheetId}/values:batchUpdate`, {
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
  }
}

function safeJsonParse(str: string, fallback: any) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}
