import { Student, LearningRecord, ContactBook } from '../types';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3/files';

export const DEFAULT_LEARNING_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbz_tGPQoBjfRl_s75spbBoeT1xOp1dgp6d0E4Apn-YHdCyNtQmI8g7kW28ZWfJP1rZ5/exec';
export const DEFAULT_CONTACT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwviyCk9O501BzbbTZH1JzSLLiuT7CFCIrK8Y5stg546T-z0I7BGtPjo8OS0w9gN2Nw8g/exec';
export const DEFAULT_WEB_APP_URL = DEFAULT_LEARNING_WEB_APP_URL;

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
    var contents = JSON.parse(e.postData.contents);
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
    
    var records = contents.learningRecords || [];
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
    var contents = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (contents.students && Array.isArray(contents.students)) {
      updateStudentsSheet(ss, contents.students);
    }
    if (contents.learningRecords && Array.isArray(contents.learningRecords)) {
      updateLearningSheet(ss, contents.learningRecords);
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
  sheet.appendRow(["ID", "Name", "SeatNumber", "ClassName", "Gender", "AvatarUrl", "ParentName", "ParentContact", "Notes"]);
  students.forEach(function(s) {
    sheet.appendRow([s.id, s.name, s.seatNumber, s.className, s.gender, s.avatarUrl, s.parentName, s.parentContact, s.notes || ""]);
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

/**
 * Fetch data using Web App URL
 */
export async function fetchFromWebApp(webAppUrl: string): Promise<SyncedData> {
  const res = await fetch(webAppUrl);
  if (!res.ok) {
    throw new Error(`Web App 請求失敗 (${res.status}): ${res.statusText}`);
  }
  const data = await res.json();
  if (data.status !== 'success') {
    throw new Error(data.message || 'Web App 回傳錯誤');
  }

  const rawStudents = data.students || [];
  const rawLearning = data.learningRecords || [];
  const rawContact = data.contactBooks || [];

  const students: Student[] = rawStudents.map((s: any) => ({
    id: s.ID || s.id || String(Math.random()),
    name: s.Name || s.name || '',
    seatNumber: String(s.SeatNumber || s.seatNumber || ''),
    className: s.ClassName || s.className || '大班 (櫻桃班)',
    gender: s.Gender || s.gender || 'girl',
    avatarUrl: s.AvatarUrl || s.avatarUrl || '',
    parentName: s.ParentName || s.parentName || '',
    parentContact: String(s.ParentContact || s.parentContact || ''),
    notes: s.Notes || s.notes || '',
  }));

  const learningRecords: LearningRecord[] = rawLearning.map((r: any) => ({
    id: r.ID || r.id || String(Math.random()),
    dateStart: r.DateStart || r.dateStart || '',
    dateEnd: r.DateEnd || r.dateEnd || '',
    studentId: r.StudentId || r.studentId || '',
    studentName: r.StudentName || r.studentName || '',
    className: r.ClassName || r.className || '大班 (櫻桃班)',
    seatNumber: String(r.SeatNumber || r.seatNumber || ''),
    checkedItems: typeof r.CheckedItemsJSON === 'string' ? safeJsonParse(r.CheckedItemsJSON, {}) : (r.checkedItems || {}),
    customNotes: typeof r.CustomNotesJSON === 'string' ? safeJsonParse(r.CustomNotesJSON, {}) : (r.customNotes || {}),
    drawingImage: r.DrawingImage || r.drawingImage || '',
    photoImages: typeof r.PhotoImagesJSON === 'string' ? safeJsonParse(r.PhotoImagesJSON, []) : (r.photoImages || []),
    videoUrls: typeof r.VideoUrlsJSON === 'string' ? safeJsonParse(r.VideoUrlsJSON, []) : (r.videoUrls || []),
    teacherComment: r.TeacherComment || r.teacherComment || '',
    stamp: r.Stamp || r.stamp || 'たいへんよくできました',
    createdAt: r.CreatedAt || r.createdAt || new Date().toISOString(),
  }));

  const contactBooks: ContactBook[] = rawContact.map((c: any) => ({
    id: c.ID || c.id || String(Math.random()),
    date: c.Date || c.date || '',
    studentId: c.StudentId || c.studentId || '',
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
 * Push data using Web App URL
 */
export async function syncToWebApp(
  webAppUrl: string,
  students: Student[],
  learningRecords: LearningRecord[],
  contactBooks: ContactBook[]
): Promise<void> {
  const payload = {
    action: 'syncAll',
    students,
    learningRecords,
    contactBooks,
  };

  const res = await fetch(webAppUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8', // Avoid preflight CORS issue in Apps Script
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Web App 寫入失敗 (${res.status}): ${res.statusText}`);
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
