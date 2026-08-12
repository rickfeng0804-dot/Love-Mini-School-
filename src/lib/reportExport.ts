import { LearningRecord, Student } from '../types';
import { CORNER_AREAS } from '../data/initialData';
import { uploadPhotoToGoogleDrive, DEFAULT_WEB_APP_URL, DEFAULT_MEDIA_FOLDER_URL } from './googleSheets';

/**
 * Generate a complete standalone HTML string for a Student Learning History Report.
 */
export function generateLearningReportHtml(record: LearningRecord, student?: Student): string {
  const stuName = record.studentName || student?.name || '幼童';
  const className = record.className || student?.className || '大班';
  const seatNumber = record.seatNumber || student?.seatNumber || 1;
  const stamp = record.stamp || 'たいへんよくできました';
  const teacherComment = record.teacherComment || '學習態度非常良好，樂於探索與分享。';

  // Render 8 Corner Areas
  const cornerBoxesHtml = CORNER_AREAS.map((area) => {
    const checkedList = record.checkedItems?.[area.id] || [];
    const note = record.customNotes?.[area.id] || '';
    const itemsHtml = area.items
      .map((item) => {
        const isChecked = checkedList.includes(item);
        return `<div style="display:flex; align-items:flex-start; gap:4px; margin-bottom:3px; font-size:11px;">
          <span style="font-weight:900; color:#5D4037;">${isChecked ? '☑' : '□'}</span>
          <span style="${isChecked ? 'font-weight:bold; color:#5D4037;' : 'color:#8D6E63;'}">${item}</span>
        </div>`;
      })
      .join('');

    const noteHtml = note
      ? `<div style="margin-top:4px; padding-top:4px; border-top:1px dashed #5D4037; font-size:10px; font-weight:bold; color:#5D4037;">□ ${note}</div>`
      : '';

    return `<div style="border:1.5px solid #5D4037; padding:8px; background:white; border-radius:8px;">
      <h4 style="font-weight:900; font-size:12px; text-align:center; background:#FFE082; padding:3px; border-radius:4px; margin:0 0 6px 0; border:1px solid #5D4037;">${area.name}</h4>
      ${itemsHtml}
      ${noteHtml}
    </div>`;
  }).join('');

  // Photos html
  const photoHtml =
    record.photoImages && record.photoImages.length > 0
      ? record.photoImages
          .map(
            (img) =>
              `<img src="${img}" style="width:100px; height:80px; object-fit:cover; border:1px solid #5D4037; border-radius:6px; margin:3px;" />`
          )
          .join('')
      : '<span style="color:#8D6E63; font-style:italic; font-size:11px;">（尚無照片紀錄）</span>';

  // Videos html
  const videoHtml =
    record.videoUrls && record.videoUrls.length > 0
      ? record.videoUrls
          .map(
            (v, idx) =>
              `<a href="${v}" target="_blank" style="color:#0288D1; font-weight:bold; font-size:11px; margin-right:10px;">🎬 影片檔 #${
                idx + 1
              }</a>`
          )
          .join('')
      : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>愛愛幼兒園 - 學習區紀錄表 - ${stuName}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background:#f9f6f0; color:#5D4037; padding:20px; margin:0; }
    .card { max-width:850px; margin:0 auto; background:#FFFBF0; border:4px solid #5D4037; border-radius:24px; padding:24px; box-shadow:8px 8px 0px #5D4037; }
    .header { display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid #5D4037; padding-bottom:10px; margin-bottom:12px; }
    .title { font-size:22px; font-weight:900; color:#5D4037; margin:0; }
    .subtitle { font-size:11px; font-weight:bold; color:#8D6E63; }
    .info-bar { display:flex; justify-content:space-between; font-size:12px; font-weight:bold; border-bottom:2px solid #5D4037; padding-bottom:8px; margin-bottom:12px; }
    .grid { display:grid; grid-template-columns:repeat(4, 1fr); gap:8px; margin-bottom:12px; }
    .media-box { border:2px solid #5D4037; background:#E1F5FE; border-radius:12px; padding:10px; margin-bottom:12px; }
    .stamp-box { border:2px solid #5D4037; background:#FFF3E0; border-radius:16px; padding:12px; display:flex; justify-content:space-between; align-items:center; }
    .stamp { width:80px; height:80px; border:3px solid #FF5252; border-radius:50%; color:#FF5252; font-weight:900; text-align:center; display:flex; flex-direction:column; justify-content:center; transform:rotate(6deg); background:white; }
    .footer { display:flex; justify-content:space-between; font-size:11px; font-weight:bold; margin-top:12px; color:#5D4037; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div>
        <div class="subtitle">桃園市私立</div>
        <div class="title">愛愛幼兒園 <span style="font-size:16px; color:#FF8A65;">校園學習紀錄表</span></div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:20px; font-weight:900;">我的學習紀錄</div>
        <div class="subtitle">ぼくのぐんぐんきろく</div>
      </div>
    </div>

    <div class="info-bar">
      <span>日期：<u>${record.dateStart}</u> 至 <u>${record.dateEnd}</u></span>
      <span>班級：<u>${className}</u></span>
      <span>座號：<u>${seatNumber}</u> 號</span>
      <span>姓名：<u>${stuName}</u></span>
    </div>

    <div class="grid">
      ${cornerBoxesHtml}
    </div>

    <div class="media-box">
      <div style="font-weight:900; font-size:12px; margin-bottom:6px; color:#01579B;">📷 影像與 🎥 影片紀錄</div>
      <div style="display:flex; flex-wrap:wrap; align-items:center;">
        ${photoHtml}
      </div>
      ${videoHtml ? `<div style="margin-top:6px;">${videoHtml}</div>` : ''}
    </div>

    <div class="stamp-box">
      <div style="flex:1; padding-right:12px;">
        <div style="font-weight:900; font-size:12px; margin-bottom:4px;">📝 教師觀察總評：</div>
        <div style="font-size:12px; font-weight:bold; line-height:1.5;">${teacherComment}</div>
      </div>
      <div class="stamp">
        <span style="font-size:9px; border-bottom:1px solid #FF5252; padding-bottom:1px;">愛愛幼兒園</span>
        <span style="font-size:10px; margin:2px 0;">${stamp}</span>
        <span style="font-size:8px;">2026.07</span>
      </div>
    </div>

    <div class="footer">
      <span>班級導師簽章：__________________</span>
      <span>園長：黃雅琦 Rachel (簽章：__________________)</span>
      <span>家長查閱簽章：__________________</span>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Upload a Student Learning Report HTML file to Google Drive.
 */
export async function uploadReportToGoogleDrive(
  webAppUrl: string,
  record: LearningRecord,
  student?: Student,
  folderUrl?: string
) {
  const htmlContent = generateLearningReportHtml(record, student);
  const base64Data = 'data:text/html;base64,' + btoa(unescape(encodeURIComponent(htmlContent)));

  const stuName = record.studentName || student?.name || '學生';
  const className = record.className || student?.className || '大班';
  const seatNum = record.seatNumber || student?.seatNumber || '1';
  const fileName = `${className}_${seatNum}號_${stuName}_${record.dateStart}_學習歷程報告.html`;

  return await uploadPhotoToGoogleDrive(
    webAppUrl,
    base64Data,
    fileName,
    folderUrl || DEFAULT_MEDIA_FOLDER_URL,
    'text/html'
  );
}
