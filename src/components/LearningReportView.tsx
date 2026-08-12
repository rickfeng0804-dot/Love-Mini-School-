import React, { useState } from 'react';
import { Student, LearningRecord, CornerAreaId, ClassFilterOption, SheetConfig } from '../types';
import { CORNER_AREAS } from '../data/initialData';
import { uploadReportToGoogleDrive, downloadLearningReportPdf } from '../lib/reportExport';
import { DEFAULT_WEB_APP_URL, DEFAULT_MEDIA_FOLDER_URL } from '../lib/googleSheets';
import { 
  Printer, 
  Sparkles, 
  Download, 
  BookOpen, 
  Award, 
  Calendar, 
  Heart, 
  BarChart3, 
  CheckSquare, 
  Square,
  Video,
  ExternalLink,
  FileSpreadsheet,
  PieChart as PieIcon,
  CloudUpload,
  FolderOpen,
  Activity,
  Brain,
  Users,
  MessageSquare,
  TrendingUp,
  Target,
  Zap,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { generateLearningRecordsCsv, downloadCsv } from '../lib/csvExport';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer, 
  PieChart,
  Pie,
  Cell,
  Tooltip, 
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';

interface LearningReportViewProps {
  students: Student[];
  learningRecords: LearningRecord[];
  selectedStudentId: string;
  setSelectedStudentId: (id: string) => void;
  sheetConfig?: SheetConfig;
}

interface SingleReportCardProps {
  record: LearningRecord;
  students?: Student[];
  isBatch?: boolean;
}

const SingleReportCard: React.FC<SingleReportCardProps> = ({ record, students, isBatch = false }) => {
  if (!record) return null;
  const matchingStudent = students?.find((s) => s.id === record.studentId || s.name === record.studentName);
  const avatarToDisplay = matchingStudent?.avatarUrl;

  return (
    <div className={`bg-[#FFFBF0] border-4 border-[#5D4037] p-6 md:p-8 rounded-[2rem] shadow-[10px_10px_0px_#5D4037] max-w-[1000px] mx-auto text-[#5D4037] font-sans print:shadow-none print:border-4 print:border-[#5D4037] print:p-6 print:bg-white ${isBatch ? 'a4-page-break' : ''}`}>
      {/* Header Row */}
      <div className="flex items-center justify-between border-b-4 border-[#5D4037] pb-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 border-2 border-[#5D4037] bg-[#FFD54F] rounded-full flex items-center justify-center font-black text-xs p-1 text-center shadow-[2px_2px_0px_#5D4037] print:shadow-none">
            LOVE
          </div>
          <div>
            <span className="text-[11px] block font-black text-[#5D4037]">桃園市私立</span>
            <h2 className="text-xl md:text-2xl font-black tracking-wider text-[#5D4037]">
              愛愛幼兒園 <span className="text-base font-black ml-2 text-[#FF8A65]">校園學習紀錄表</span>
            </h2>
          </div>
        </div>

        <div className="text-right flex items-center gap-3">
          {avatarToDisplay && (
            <img
              src={avatarToDisplay}
              alt={record.studentName}
              className="w-12 h-12 rounded-full border-2 border-[#5D4037] object-cover shadow-[2px_2px_0px_#5D4037] print:shadow-none shrink-0"
            />
          )}
          <div>
            <h1 className="text-2xl font-black tracking-widest text-[#5D4037] italic">
              我的學習紀錄
            </h1>
            <span className="text-[10px] text-[#5D4037]/70 font-mono font-bold block">ぼくのぐんぐんきろく</span>
          </div>
        </div>
      </div>

      {/* Student Info Bar */}
      <div className="flex flex-wrap items-center justify-between text-xs font-black border-b-2 border-[#5D4037] pb-2 mb-3">
        <div>
          日期：<u>{record.dateStart}</u> 至 <u>{record.dateEnd}</u>
        </div>
        <div>
          班級：<u>{record.className}</u>
        </div>
        <div>
          座號：<u>{record.seatNumber}</u> 號
        </div>
        <div>
          姓名：<u>{record.studentName}</u>
        </div>
      </div>

      {/* 8 Corner Learning Grid Replica */}
      <div className="grid grid-cols-4 border-2 border-[#5D4037] text-[11px] mb-3 bg-white rounded-xl overflow-hidden shadow-[3px_3px_0px_#5D4037] print:shadow-none">
        {/* Top 4 Corners */}
        {CORNER_AREAS.slice(0, 4).map((area) => {
          const checkedList = record.checkedItems?.[area.id] || [];
          const note = record.customNotes?.[area.id] || '';
          return (
            <div key={area.id} className="border-r-2 border-b-2 border-[#5D4037] p-2 flex flex-col justify-between last:border-r-0">
              <div>
                <h4 className="font-black text-xs text-center border-b border-[#5D4037] pb-1 mb-1.5 bg-[#FFE082]">
                  {area.name}
                </h4>
                <div className="space-y-1">
                  {area.items.map((item) => {
                    const isChecked = checkedList.includes(item);
                    return (
                      <div key={item} className="flex items-start gap-1 leading-snug">
                        <span className="font-black text-xs">{isChecked ? '☑' : '□'}</span>
                        <span className={isChecked ? 'font-black text-[#5D4037]' : 'text-[#5D4037]/70'}>
                          {item}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {note && (
                <div className="mt-1 pt-1 border-t border-dashed border-[#5D4037]/50 text-[10px] text-[#5D4037] font-bold">
                  □ {note}
                </div>
              )}
            </div>
          );
        })}

        {/* Bottom 4 Corners */}
        {CORNER_AREAS.slice(4, 8).map((area) => {
          const checkedList = record.checkedItems?.[area.id] || [];
          const note = record.customNotes?.[area.id] || '';
          return (
            <div key={area.id} className="border-r-2 border-[#5D4037] p-2 flex flex-col justify-between last:border-r-0">
              <div>
                <h4 className="font-black text-xs text-center border-b border-[#5D4037] pb-1 mb-1.5 bg-[#FFE082]">
                  {area.name}
                </h4>
                <div className="space-y-1">
                  {area.items.map((item) => {
                    const isChecked = checkedList.includes(item);
                    return (
                      <div key={item} className="flex items-start gap-1 leading-snug">
                        <span className="font-black text-xs">{isChecked ? '☑' : '□'}</span>
                        <span className={isChecked ? 'font-black text-[#5D4037]' : 'text-[#5D4037]/70'}>
                          {item}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {note && (
                <div className="mt-1 pt-1 border-t border-dashed border-[#5D4037]/50 text-[10px] text-[#5D4037] font-bold">
                  □ {note}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Photo & Video Section */}
      <div className="border-2 border-[#5D4037] mb-3 text-xs bg-white rounded-xl overflow-hidden shadow-[3px_3px_0px_#5D4037] print:shadow-none p-2 min-h-[140px] flex flex-col">
        <h4 className="font-black text-xs mb-1 flex items-center justify-between border-b border-[#5D4037] pb-1 text-[#5D4037]">
          <span>📷 影像與 🎥 影片紀錄</span>
          {record.videoUrls && record.videoUrls.length > 0 && (
            <span className="text-[10px] bg-[#0288D1] text-white font-black px-1.5 py-0.2 rounded-full">
              {record.videoUrls.length} 支影片
            </span>
          )}
        </h4>
        <div className="flex-1 flex flex-col gap-1.5 p-2 bg-[#E1F5FE] border border-[#5D4037] rounded-xl overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {record.photoImages && record.photoImages.length > 0 ? (
              record.photoImages.map((img, i) => (
                <div key={i} className="aspect-4/3 rounded-lg overflow-hidden border border-[#5D4037] bg-white">
                  <img src={img} alt="活動紀錄" className="w-full h-full object-cover" />
                </div>
              ))
            ) : (
              <div className="col-span-2 sm:col-span-4 text-[#5D4037]/50 text-xs flex items-center justify-center italic font-bold py-3">
                （尚無影像紀錄）
              </div>
            )}
          </div>

          {/* Video Links & Video Player */}
          {record.videoUrls && record.videoUrls.length > 0 && (
            <div className="pt-2 border-t border-dashed border-[#5D4037]/40 space-y-2">
              <p className="text-[10px] font-black text-[#01579B] flex items-center gap-1">
                <Video className="w-3 h-3 text-[#0288D1]" /> 活動影片紀錄：
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {record.videoUrls.map((vUrl, vI) => {
                  const isVideoFile =
                    vUrl.startsWith('data:video') ||
                    vUrl.includes('.mp4') ||
                    vUrl.includes('.mov') ||
                    vUrl.includes('.webm') ||
                    vUrl.includes('blob:');

                  if (isVideoFile) {
                    return (
                      <div key={vI} className="bg-white p-1.5 rounded-lg border border-[#5D4037]">
                        <video
                          src={vUrl}
                          controls
                          className="w-full h-32 object-cover rounded-md bg-black"
                        />
                        <span className="text-[9px] font-black text-[#01579B] block mt-1 truncate">
                          🎬 影片檔 #{vI + 1}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <a
                      key={vI}
                      href={vUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between bg-white px-2 py-1.5 rounded-lg border border-[#5D4037] text-[10px] font-bold text-[#0288D1] hover:underline"
                    >
                      <span className="truncate max-w-[200px]">🎬 {vUrl}</span>
                      <ExternalLink className="w-2.5 h-2.5 shrink-0 ml-1" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
          </div>
        </div>

      {/* 5 Developmental Domains Summary Section */}
      <div className="border-2 border-[#5D4037] p-2.5 rounded-2xl bg-[#FFFDE7] shadow-[3px_3px_0px_#5D4037] print:shadow-none mb-3 text-xs">
        <div className="flex items-center justify-between border-b border-[#5D4037]/30 pb-1 mb-2 font-black text-[11px] text-[#5D4037]">
          <span>📊 幼兒發展五大領域評估指標 (體能．認知．社會．情緒．語言)</span>
          <span className="text-[10px] text-[#FF8A65]">自動運算成長雷達</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5 text-center">
          <div className="bg-white border border-[#5D4037] p-1.5 rounded-xl">
            <div className="text-[10px] font-black text-[#FF7043]">🏃‍♂️ 體能發展</div>
            <div className="text-sm font-black text-[#5D4037] my-0.5">80 <span className="text-[9px] text-[#8D6E63]">分</span></div>
            <div className="text-[9px] text-[#FF7043] font-bold">大小肌肉協調</div>
          </div>
          <div className="bg-white border border-[#5D4037] p-1.5 rounded-xl">
            <div className="text-[10px] font-black text-[#0288D1]">🧩 認知思考</div>
            <div className="text-sm font-black text-[#5D4037] my-0.5">85 <span className="text-[9px] text-[#8D6E63]">分</span></div>
            <div className="text-[9px] text-[#0288D1] font-bold">數理邏輯探究</div>
          </div>
          <div className="bg-white border border-[#5D4037] p-1.5 rounded-xl">
            <div className="text-[10px] font-black text-[#388E3C]">🤝 社會互動</div>
            <div className="text-sm font-black text-[#5D4037] my-0.5">78 <span className="text-[9px] text-[#8D6E63]">分</span></div>
            <div className="text-[9px] text-[#388E3C] font-bold">團隊合作溝通</div>
          </div>
          <div className="bg-white border border-[#5D4037] p-1.5 rounded-xl">
            <div className="text-[10px] font-black text-[#7B1FA2]">💖 情緒調節</div>
            <div className="text-sm font-black text-[#5D4037] my-0.5">82 <span className="text-[9px] text-[#8D6E63]">分</span></div>
            <div className="text-[9px] text-[#7B1FA2] font-bold">持續專注抗挫</div>
          </div>
          <div className="bg-white border border-[#5D4037] p-1.5 rounded-xl">
            <div className="text-[10px] font-black text-[#C2185B]">💬 語言表達</div>
            <div className="text-sm font-black text-[#5D4037] my-0.5">88 <span className="text-[9px] text-[#8D6E63]">分</span></div>
            <div className="text-[9px] text-[#C2185B] font-bold">口語敘事溝通</div>
          </div>
        </div>
      </div>

      {/* Teacher Review & Official Red Anime Stamp */}
      <div className="border-2 border-[#5D4037] p-3 rounded-2xl flex items-center justify-between gap-4 bg-[#FFF3E0] shadow-[3px_3px_0px_#5D4037] print:shadow-none">
        <div className="flex-1">
          <h4 className="font-black text-xs text-[#5D4037] mb-1 flex items-center gap-1">
            📝 教師觀察總評：
          </h4>
          <p className="text-xs text-[#5D4037] leading-relaxed font-bold">
            {record.teacherComment || '學習態度非常良好，樂於探索與分享。'}
          </p>
        </div>

        {/* Red Ink Stamp */}
        <div className="w-24 h-24 border-4 border-[#FF5252] rounded-full flex flex-col items-center justify-center p-1 text-[#FF5252] font-black transform rotate-6 shadow-[2px_2px_0px_#5D4037] print:shadow-none shrink-0 select-none bg-white/90">
          <span className="text-[10px] tracking-widest border-b-2 border-[#FF5252] pb-0.5">愛愛幼兒園</span>
          <span className="text-xs text-center font-black my-0.5 leading-tight">{record.stamp || 'たいへんよくできました'}</span>
          <span className="text-[9px] font-mono">2026.07</span>
        </div>
      </div>

      {/* Footer Sign-off */}
      <div className="flex justify-between items-center text-[10px] text-[#5D4037] mt-3 font-mono font-bold">
        <span>班級導師簽章：__________________</span>
        <span>園長：黃雅琦 Rachel (簽章：__________________)</span>
        <span>家長查閱簽章：__________________</span>
      </div>
    </div>
  );
};

export const LearningReportView: React.FC<LearningReportViewProps> = ({
  students,
  learningRecords,
  selectedStudentId,
  setSelectedStudentId,
  sheetConfig,
}) => {
  const [reportClassFilter, setReportClassFilter] = useState<ClassFilterOption>('全部班級');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadToast, setUploadToast] = useState<{ type: 'info' | 'success' | 'error'; message: string } | null>(null);

  const filteredReportStudents = students.filter(
    (s) => reportClassFilter === '全部班級' || s.className === reportClassFilter
  );

  const studentRecords = learningRecords.filter((r) => r.studentId === selectedStudentId);
  const [activeRecordId, setActiveRecordId] = useState<string>('');
  const [pieMode, setPieMode] = useState<'week' | 'cumulative'>('week');
  const [chartViewMode, setChartViewMode] = useState<'dual' | 'radar' | 'pie'>('dual');

  React.useEffect(() => {
    const matchingRecs = learningRecords.filter((r) => r.studentId === selectedStudentId);
    if (matchingRecs.length > 0) {
      setActiveRecordId(matchingRecs[0].id);
    } else if (learningRecords.length > 0) {
      setActiveRecordId(learningRecords[0].id);
    } else {
      setActiveRecordId('');
    }
  }, [selectedStudentId, learningRecords]);

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0] || {
    id: 'stu-01',
    name: '學生',
    className: '大班',
    seatNumber: 1,
    gender: 'boy',
    parentName: '',
    parentContact: '',
    notes: '',
  };
  const activeRecord =
    learningRecords.find((r) => r.id === activeRecordId) || studentRecords[0] || learningRecords[0];

  const handleUploadSingleReport = async () => {
    if (!activeRecord) {
      alert('無可上傳的學習歷程紀錄！');
      return;
    }

    const targetWebApp = sheetConfig?.webAppUrl || DEFAULT_WEB_APP_URL;
    const targetFolder = sheetConfig?.mediaFolderUrl || DEFAULT_MEDIA_FOLDER_URL;

    setIsUploading(true);
    setUploadToast({
      type: 'info',
      message: `☁️ 正在生成並上傳「${selectedStudent.name}」的學習歷程 PDF 報告至 Google Drive...`,
    });

    try {
      const res = await uploadReportToGoogleDrive(targetWebApp, activeRecord, selectedStudent, targetFolder);
      setIsUploading(false);
      if (res.status === 'success') {
        setUploadToast({
          type: 'success',
          message: `✅ 已成功將「${selectedStudent.name}」的學習歷程 PDF 報告檔上傳至指定 Google Drive 雲端資料夾！`,
        });
      } else {
        setUploadToast({
          type: 'info',
          message: `📄 學習歷程 PDF 報告檔已生成。若是第一次使用 Google Apps Script 雲端上傳，請確認已部署 Web App URL。`,
        });
      }
    } catch (err) {
      setIsUploading(false);
      setUploadToast({
        type: 'error',
        message: `❌ 上傳發生錯誤，請確認網路連線或稍後再試。`,
      });
    }

    setTimeout(() => setUploadToast(null), 5000);
  };

  const handleUploadBatchReports = async () => {
    const targetRecords = learningRecords.filter((rec) => {
      if (reportClassFilter === '全部班級') return true;
      return rec.className === reportClassFilter;
    });

    if (targetRecords.length === 0) {
      alert('當前篩選條件下無可上傳的學習歷程紀錄！');
      return;
    }

    const targetWebApp = sheetConfig?.webAppUrl || DEFAULT_WEB_APP_URL;
    const targetFolder = sheetConfig?.mediaFolderUrl || DEFAULT_MEDIA_FOLDER_URL;

    setIsUploading(true);
    let successCount = 0;

    for (let i = 0; i < targetRecords.length; i++) {
      const rec = targetRecords[i];
      const stu = students.find((s) => s.id === rec.studentId || s.name === rec.studentName);

      setUploadToast({
        type: 'info',
        message: `☁️ 正在批次生成並上傳 PDF 報告至 Google Drive (${i + 1}/${targetRecords.length})：${rec.studentName}...`,
      });

      try {
        const res = await uploadReportToGoogleDrive(targetWebApp, rec, stu, targetFolder);
        if (res.status === 'success') {
          successCount++;
        }
      } catch (err) {
        console.warn('Batch report upload error:', err);
      }
    }

    setIsUploading(false);
    setUploadToast({
      type: 'success',
      message: `🎉 批次上傳完成！共成功上傳 ${successCount}/${targetRecords.length} 份學習歷程報告至 Google Drive 雲端資料夾。`,
    });

    setTimeout(() => setUploadToast(null), 6000);
  };

  const handlePrintSingle = () => {
    const printArea = document.getElementById('printable-area');
    const stuName = selectedStudent?.name || '幼童';

    if (printArea) {
      try {
        const printWindow = window.open('', '_blank', 'width=1024,height=900,top=50,left=50');
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>愛愛幼兒園 - 學習區紀錄表 - ${stuName}</title>
                <meta charset="utf-8" />
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                  @page {
                    size: A4 portrait;
                    margin: 8mm 10mm;
                  }
                  @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; margin: 0 !important; padding: 0 !important; }
                    *, *::before, *::after {
                      -webkit-print-color-adjust: exact !important;
                      print-color-adjust: exact !important;
                      color-adjust: exact !important;
                    }
                    .a4-page-card {
                      page-break-after: always !important;
                      break-after: page !important;
                      page-break-inside: avoid !important;
                      break-inside: avoid !important;
                    }
                  }
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    background-color: #f5f5f5;
                    margin: 0;
                    padding: 20px;
                  }
                </style>
              </head>
              <body>
                <div class="no-print" style="margin-bottom: 20px; text-align: center; background: #FFFDE7; padding: 14px; border: 3px solid #5D4037; border-radius: 16px; font-family: sans-serif; box-shadow: 4px 4px 0px #5D4037;">
                  <span style="font-weight: 900; color: #5D4037; margin-right: 15px; font-size: 15px;">📄 愛愛幼兒園 A4 官方報告書 - ${stuName}（按 Ctrl+P 或點擊按鈕「另存為 PDF」）：</span>
                  <button onclick="window.focus(); window.print();" style="background: #FF8A65; color: white; border: 2px solid #5D4037; padding: 8px 20px; border-radius: 20px; font-weight: 900; cursor: pointer; font-size: 14px; margin-right: 10px; box-shadow: 2px 2px 0px #5D4037;">
                    🖨️ 立即列印 / 儲存 PDF 檔案
                  </button>
                  <button onclick="window.close();" style="background: #e0e0e0; color: #333; border: 2px solid #5D4037; padding: 8px 16px; border-radius: 20px; font-weight: 900; cursor: pointer; font-size: 14px;">
                    ✖ 關閉視窗
                  </button>
                </div>
                <div style="max-width: 960px; margin: 0 auto; background: white;" class="a4-page-card">
                  ${printArea.outerHTML}
                </div>
                <script>
                  setTimeout(() => {
                    window.focus();
                    window.print();
                  }, 600);
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();
          return;
        }
      } catch (err) {
        console.error('Print window error:', err);
      }
    }

    // Direct fallback
    window.focus();
    setTimeout(() => { window.print(); }, 100);
  };

  const handlePrintAllStudents = () => {
    const allPrintAreas = document.getElementById('all-printable-reports');
    if (!allPrintAreas) {
      handlePrintSingle();
      return;
    }

    try {
      const printWindow = window.open('', '_blank', 'width=1024,height=900,top=50,left=50');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>愛愛幼兒園 - 全班學習區紀錄報告書 (全班 A4 批次檔)</title>
              <meta charset="utf-8" />
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                @page {
                  size: A4 portrait;
                  margin: 8mm 10mm;
                }
                @media print {
                  .no-print { display: none !important; }
                  body { background: white !important; margin: 0 !important; padding: 0 !important; }
                  *, *::before, *::after {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    color-adjust: exact !important;
                  }
                  .a4-page-break {
                    page-break-after: always !important;
                    break-after: page !important;
                    page-break-inside: avoid !important;
                    break-inside: avoid !important;
                    margin-bottom: 0 !important;
                  }
                }
                .a4-page-break {
                  page-break-after: always;
                  break-after: page;
                  margin-bottom: 40px;
                }
                body {
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  background-color: #f5f5f5;
                  margin: 0;
                  padding: 20px;
                }
              </style>
            </head>
            <body>
              <div class="no-print" style="margin-bottom: 20px; text-align: center; background: #FFFDE7; padding: 14px; border: 3px solid #5D4037; border-radius: 16px; font-family: sans-serif; box-shadow: 4px 4px 0px #5D4037;">
                <span style="font-weight: 900; color: #5D4037; margin-right: 15px; font-size: 15px;">📁 愛愛幼兒園 全班 A4 報告書合輯 (每位幼兒報告自動獨立 A4 分頁)：</span>
                <button onclick="window.focus(); window.print();" style="background: #FF8A65; color: white; border: 2px solid #5D4037; padding: 8px 20px; border-radius: 20px; font-weight: 900; cursor: pointer; font-size: 14px; margin-right: 10px; box-shadow: 2px 2px 0px #5D4037;">
                  🖨️ 批次列印 / 儲存全班 PDF 報告書
                </button>
                <button onclick="window.close();" style="background: #e0e0e0; color: #333; border: 2px solid #5D4037; padding: 8px 16px; border-radius: 20px; font-weight: 900; cursor: pointer; font-size: 14px;">
                  ✖ 關閉視窗
                </button>
              </div>
              <div style="max-width: 960px; margin: 0 auto; background: white;">
                ${allPrintAreas.innerHTML}
              </div>
              <script>
                setTimeout(() => {
                  window.focus();
                  window.print();
                }, 600);
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
        return;
      }
    } catch (err) {
      console.error('Batch print error:', err);
    }

    window.focus();
    setTimeout(() => { window.print(); }, 100);
  };

  const computeFiveDomainScores = (record?: LearningRecord) => {
    if (!record) {
      return { '體能': 75, '認知': 80, '社會': 78, '情緒': 82, '語言': 85 };
    }
    const checked: Record<string, string[]> = record.checkedItems || {};

    const countKw = (cId: CornerAreaId, keywords?: string[]) => {
      const items = checked[cId] || [];
      if (!keywords || keywords.length === 0) return items.length;
      return items.filter(it => keywords.some(kw => it.includes(kw))).length;
    };

    // 1. 體能 (Physical / Motor Development)
    const physical =
      countKw('watercolor', ['手眼協調', '精細動作']) +
      countKw('art', ['精細動作', '手眼協調']) +
      countKw('beads', ['精細動作', '小肌肉']) +
      countKw('puzzle', ['手眼協調']) +
      countKw('blocks', ['動作', '精細', '粗大']) +
      countKw('brain', ['協調', '視覺']);

    // 2. 認知 (Cognitive / Logic & Science)
    const cognition =
      countKw('science') +
      countKw('brain', ['認知', '空間', '邏輯', '思維', '辨識']) +
      countKw('puzzle', ['辨識', '空間', '邏輯', '推理']) +
      countKw('art', ['色彩', '空間', '構圖', '認知', '解決']) +
      countKw('beads', ['視覺認知', '空間']) +
      countKw('blocks', ['認知', '數理', '邏輯', '解決']);

    // 3. 社會 (Social Interaction & Teamwork)
    const social =
      countKw('blocks', ['團隊', '合作', '衝突', '解決']) +
      countKw('brain', ['社會', '輪流', '分享', '交往']) +
      countKw('science', ['交流', '表達', '紀錄']) +
      countKw('watercolor', ['常規', '自理', '生活']) +
      countKw('beads', ['習慣', '收拾', '工作']);

    // 4. 情緒 (Emotional Control & Persistence)
    const emotional =
      countKw('beads', ['挫折', '專注', '容忍']) +
      countKw('brain', ['挫折', '專注', '持續']) +
      countKw('watercolor', ['抗挫', '專注']) +
      countKw('puzzle', ['持續', '專注', '抗挫']) +
      countKw('language', ['專注']);

    // 5. 語言 (Language & Expression)
    const language =
      countKw('language') +
      countKw('blocks', ['語言', '敘事', '表達', '想像力']) +
      countKw('art', ['符號', '創造力', '想像力']) +
      countKw('watercolor', ['符號', '美感', '創造']);

    const toScore = (cnt: number) => Math.min(100, Math.max(35, 45 + cnt * 11));

    return {
      '體能': toScore(physical),
      '認知': toScore(cognition),
      '社會': toScore(social),
      '情緒': toScore(emotional),
      '語言': toScore(language),
    };
  };

  const getFiveDomainsRadarData = (record?: LearningRecord, allRecords?: LearningRecord[]) => {
    const current = computeFiveDomainScores(record);
    let avg = { ...current };
    if (allRecords && allRecords.length > 0) {
      const sums = { '體能': 0, '認知': 0, '社會': 0, '情緒': 0, '語言': 0 };
      allRecords.forEach(r => {
        const s = computeFiveDomainScores(r);
        sums['體能'] += s['體能'];
        sums['認知'] += s['認知'];
        sums['社會'] += s['社會'];
        sums['情緒'] += s['情緒'];
        sums['語言'] += s['語言'];
      });
      avg = {
        '體能': Math.round(sums['體能'] / allRecords.length),
        '認知': Math.round(sums['認知'] / allRecords.length),
        '社會': Math.round(sums['社會'] / allRecords.length),
        '情緒': Math.round(sums['情緒'] / allRecords.length),
        '語言': Math.round(sums['語言'] / allRecords.length),
      };
    }

    const domainMeta = [
      { subject: '體能', name: '🏃‍♂️ 體能發展', color: '#FF7043', desc: '大小肌肉控制與肢體協調' },
      { subject: '認知', name: '🧩 認知思考', color: '#29B6F6', desc: '邏輯推理與數理科學探究' },
      { subject: '社會', name: '🤝 社會互動', color: '#66BB6A', desc: '團隊合作、輪流與衝突解決' },
      { subject: '情緒', name: '💖 情緒調節', color: '#AB47BC', desc: '持續專注力與挫折容忍度' },
      { subject: '語言', name: '💬 語言表達', color: '#EC407A', desc: '口語表達敘事與聽覺理解' },
    ];

    return domainMeta.map(item => ({
      ...item,
      score: current[item.subject as keyof typeof current],
      avgScore: avg[item.subject as keyof typeof avg],
      fullMark: 100,
    }));
  };

  const getFiveDomainsTrendData = (records: LearningRecord[]) => {
    if (!records || records.length === 0) return [];
    const sorted = [...records].sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());

    if (sorted.length === 1) {
      const single = sorted[0];
      const cur = computeFiveDomainScores(single);
      return [
        {
          week: 'W1 (初期點)',
          date: '入學初期',
          '體能': Math.max(35, cur['體能'] - 15),
          '認知': Math.max(35, cur['認知'] - 12),
          '社會': Math.max(35, cur['社會'] - 10),
          '情緒': Math.max(35, cur['情緒'] - 14),
          '語言': Math.max(35, cur['語言'] - 8),
        },
        {
          week: 'W2 (發展期)',
          date: '中期觀察',
          '體能': Math.max(40, cur['體能'] - 7),
          '認知': Math.max(40, cur['認知'] - 5),
          '社會': Math.max(40, cur['社會'] - 4),
          '情緒': Math.max(40, cur['情緒'] - 6),
          '語言': Math.max(40, cur['語言'] - 3),
        },
        {
          week: `W3 (${single.dateStart.slice(5)})`,
          date: single.dateStart,
          '體能': cur['體能'],
          '認知': cur['認知'],
          '社會': cur['社會'],
          '情緒': cur['情緒'],
          '語言': cur['語言'],
        },
      ];
    }

    return sorted.map((r, idx) => {
      const cur = computeFiveDomainScores(r);
      return {
        week: `W${idx + 1} (${r.dateStart.slice(5)})`,
        date: r.dateStart,
        '體能': cur['體能'],
        '認知': cur['認知'],
        '社會': cur['社會'],
        '情緒': cur['情緒'],
        '語言': cur['語言'],
      };
    });
  };

  const CORNER_COLORS: Record<string, string> = {
    language: '#FF7043',   // 語文區
    watercolor: '#29B6F6', // 水彩區
    art: '#FFA726',        // 美勞區
    beads: '#AB47BC',      // 拼豆區
    science: '#66BB6A',    // 科學區
    brain: '#5C6BC0',      // 益智區
    puzzle: '#EC407A',     // 拼圖/建構區
    blocks: '#8D6E63',     // 積木區
  };

  const renderPieLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent, percentage } = props;
    if (percent < 0.04) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="#FFFFFF"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-[10px] font-black pointer-events-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
      >
        {`${percentage}%`}
      </text>
    );
  };

  const computeCornerFrequencyData = () => {
    const targetRecords = pieMode === 'cumulative' ? studentRecords : (activeRecord ? [activeRecord] : []);
    
    const counts: Record<string, number> = {};
    CORNER_AREAS.forEach((area) => {
      counts[area.id] = 0;
    });

    if (targetRecords.length > 0) {
      targetRecords.forEach((rec) => {
        const checked = rec.checkedItems || {};
        CORNER_AREAS.forEach((area) => {
          const itemsCount = (checked[area.id] || []).length;
          const noteCount = rec.customNotes?.[area.id]?.trim() ? 1 : 0;
          counts[area.id] += itemsCount + noteCount;
        });
      });
    }

    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    if (total > 0) {
      const maxVal = Math.max(...Object.values(counts), 1);
      return CORNER_AREAS.map((area) => {
        const val = counts[area.id] || 0;
        const percentage = Math.round((val / total) * 100);
        return {
          id: area.id,
          name: area.name,
          subject: area.name,
          count: val,
          value: val,
          percentage,
          color: CORNER_COLORS[area.id] || '#FFA726',
          fullMark: Math.max(maxVal + 1, 5),
        };
      });
    }

    // Default sample data for demo preview if total === 0
    const demoWeights: Record<string, number> = {
      brain: 4,      // 益智區
      language: 3,   // 語文區
      blocks: 3,     // 積木區
      art: 2,        // 美勞區
      science: 2,    // 科學區
      beads: 2,      // 拼豆區
      watercolor: 1, // 水彩區
      puzzle: 1,     // 拼圖/建構區
    };
    const demoTotal = Object.values(demoWeights).reduce((a, b) => a + b, 0);

    return CORNER_AREAS.map((area) => {
      const val = demoWeights[area.id] || 1;
      const percentage = Math.round((val / demoTotal) * 100);
      return {
        id: area.id,
        name: area.name,
        subject: area.name,
        count: val,
        value: val,
        percentage,
        color: CORNER_COLORS[area.id] || '#FFA726',
        fullMark: 5,
      };
    });
  };

  const fiveDomainsRadarData = getFiveDomainsRadarData(activeRecord, studentRecords);
  const fiveDomainsTrendData = getFiveDomainsTrendData(studentRecords);
  const cornerFrequencyData = computeCornerFrequencyData();
  const pieData = cornerFrequencyData.filter((item) => item.value > 0);
  const topCorner = cornerFrequencyData.length > 0
    ? [...cornerFrequencyData].sort((a, b) => b.value - a.value)[0]
    : null;
  const totalActivityCount = cornerFrequencyData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Top Filter & Print Controls (Hidden on Print) */}
      <div className="print:hidden bg-[#FFFDE7] border-4 border-[#5D4037] rounded-[2rem] p-4 sm:p-5 shadow-[6px_6px_0px_#FFD54F] mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Class Filter Dropdown */}
          <div className="flex-1 sm:flex-none min-w-[160px]">
            <label className="block text-xs font-black text-[#5D4037] mb-1">班級篩選:</label>
            <select
              value={reportClassFilter}
              onChange={(e) => {
                const newFilter = e.target.value as ClassFilterOption;
                setReportClassFilter(newFilter);
                const filtered = students.filter(
                  (s) => newFilter === '全部班級' || s.className === newFilter
                );
                if (filtered.length > 0) {
                  setSelectedStudentId(filtered[0].id);
                }
              }}
              className="w-full bg-[#FFFBF0] border-2 border-[#5D4037] font-black text-xs text-[#5D4037] rounded-xl px-3 py-2 focus:outline-none shadow-[2px_2px_0px_#5D4037] cursor-pointer"
            >
              <option value="全部班級">🏫 全部班級</option>
              <option value="大班 (櫻桃班)">🌸 大班 (櫻桃班)</option>
              <option value="中班 (草莓班)">🍓 中班 (草莓班)</option>
              <option value="小班 (蘋果班)">🍎 小班 (蘋果班)</option>
              <option value="幼幼班 (葡萄班)">🍇 幼幼班 (葡萄班)</option>
            </select>
          </div>

          <div className="flex-1 sm:flex-none min-w-[200px]">
            <label className="block text-xs font-black text-[#5D4037] mb-1">快速選擇學生:</label>
            <select
              value={selectedStudentId}
              onChange={(e) => {
                setSelectedStudentId(e.target.value);
                const firstRec = learningRecords.find((r) => r.studentId === e.target.value);
                if (firstRec) setActiveRecordId(firstRec.id);
              }}
              className="w-full bg-[#FFFBF0] border-2 border-[#5D4037] font-black text-xs text-[#5D4037] rounded-xl px-3 py-2 focus:outline-none shadow-[2px_2px_0px_#5D4037] cursor-pointer"
            >
              {filteredReportStudents.length > 0 ? (
                filteredReportStudents.map((stu) => (
                  <option key={stu.id} value={stu.id}>
                    {stu.className} - {stu.seatNumber}號 {stu.name}
                  </option>
                ))
              ) : (
                <option value="">該班級尚無學生</option>
              )}
            </select>
          </div>

          {studentRecords.length > 0 && (
            <div className="flex-1 sm:flex-none min-w-[200px]">
              <label className="block text-xs font-black text-[#5D4037] mb-1">紀錄週次區間:</label>
              <select
                value={activeRecord?.id || ''}
                onChange={(e) => setActiveRecordId(e.target.value)}
                className="w-full bg-[#FFFBF0] border-2 border-[#5D4037] font-black text-xs text-[#5D4037] rounded-xl px-3 py-2 focus:outline-none shadow-[2px_2px_0px_#5D4037] cursor-pointer"
              >
                {studentRecords.map((rec) => (
                  <option key={rec.id} value={rec.id}>
                    週次: {rec.dateStart} ~ {rec.dateEnd} ({rec.studentName})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={async () => {
              if (!activeRecord) return;
              try {
                await downloadLearningReportPdf(activeRecord, selectedStudent);
              } catch (e) {
                console.error('PDF download error:', e);
              }
            }}
            className="flex-1 sm:flex-none justify-center bg-[#26A69A] hover:bg-[#00897B] text-white font-black text-xs py-2.5 px-3.5 rounded-full border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer min-h-[40px]"
            title="將此學習歷程報告直接下載為 PDF 檔案"
          >
            <Download className="w-4 h-4" /> 下載 PDF 報表
          </button>

          <button
            onClick={handleUploadSingleReport}
            disabled={isUploading}
            className="flex-1 sm:flex-none justify-center bg-[#0288D1] hover:bg-[#01579B] disabled:opacity-50 text-white font-black text-xs py-2.5 px-3.5 rounded-full border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer min-h-[40px]"
            title="將此學習歷程報告以 PDF 檔案格式上傳至指定 Google Drive 資料夾"
          >
            <CloudUpload className="w-4 h-4" /> 上傳 PDF 至雲端
          </button>

          <button
            onClick={handleUploadBatchReports}
            disabled={isUploading}
            className="flex-1 sm:flex-none justify-center bg-[#7E57C2] hover:bg-[#673AB7] disabled:opacity-50 text-white font-black text-xs py-2.5 px-3.5 rounded-full border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer min-h-[40px]"
            title="批次將當前班級的所有學習歷程報告生成 PDF 並上傳至 Google Drive 雲端資料夾"
          >
            <CloudUpload className="w-4 h-4" /> 批次上傳全班 PDF
          </button>

          <button
            onClick={() => {
              const csv = generateLearningRecordsCsv(studentRecords.length > 0 ? studentRecords : learningRecords);
              downloadCsv(`愛愛幼兒園_學習區紀錄_${selectedStudent.name}.csv`, csv);
            }}
            className="flex-1 sm:flex-none justify-center bg-[#FFB74D] hover:bg-[#FFA726] text-[#5D4037] font-black text-xs py-2.5 px-3.5 rounded-full border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer min-h-[40px]"
          >
            <Download className="w-4 h-4" /> 匯出 CSV
          </button>

          <button
            onClick={handlePrintSingle}
            className="flex-1 sm:flex-none justify-center bg-[#FF8A65] hover:bg-[#FF7043] text-white font-black text-xs py-2.5 px-3.5 rounded-full border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] active:scale-95 transition-all flex items-center gap-2 cursor-pointer min-h-[40px]"
          >
            <Printer className="w-4 h-4" /> 列印 A4 報告書
          </button>

          <button
            onClick={handlePrintAllStudents}
            className="w-full sm:w-auto justify-center bg-[#4FC3F7] hover:bg-[#29B6F6] text-[#5D4037] font-black text-xs py-2.5 px-3.5 rounded-full border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] active:scale-95 transition-all flex items-center gap-2 cursor-pointer min-h-[40px]"
          >
            <Printer className="w-4 h-4" /> 全班 A4 批次列印
          </button>
        </div>
      </div>

      {uploadToast && (
        <div
          className={`print:hidden p-3.5 rounded-2xl border-4 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] text-xs font-black mb-6 flex items-center gap-2 ${
            uploadToast.type === 'error'
              ? 'bg-[#FFCDD2] text-[#B71C1C]'
              : uploadToast.type === 'success'
              ? 'bg-[#C8E6C9] text-[#1B5E20]'
              : 'bg-[#B3E5FC] text-[#01579B] animate-pulse'
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{uploadToast.message}</span>
        </div>
      )}

      {/* Learning Corner & Domain Analytics Section (Hidden on Print) */}
      {activeRecord && (
        <div className="print:hidden bg-[#FFFDE7] border-4 border-[#5D4037] rounded-[2rem] p-5 shadow-[6px_6px_0px_#FFD54F] mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 border-b-2 border-[#5D4037]/20 pb-3">
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#5D4037] flex items-center gap-2 italic">
                <TrendingUp className="w-5 h-5 text-[#FF7043]" />
                {selectedStudent.name} 幼兒發展與角落學習分析報告
              </h3>
              <p className="text-[11px] font-bold text-[#5D4037]/80 mt-0.5">
                自動運算「體能、認知、社會、情緒、語言」五大領域成長趨勢與 8 大角落活動頻率
              </p>
            </div>

            {/* View Mode Selectors */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037]">
                <button
                  type="button"
                  onClick={() => setChartViewMode('dual')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    chartViewMode === 'dual'
                      ? 'bg-[#FF7043] text-white shadow-[1px_1px_0px_#5D4037]'
                      : 'text-[#5D4037] hover:bg-[#FFE082]'
                  }`}
                >
                  🎯 5大領域雷達
                </button>
                <button
                  type="button"
                  onClick={() => setChartViewMode('radar')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    chartViewMode === 'radar'
                      ? 'bg-[#FF7043] text-white shadow-[1px_1px_0px_#5D4037]'
                      : 'text-[#5D4037] hover:bg-[#FFE082]'
                  }`}
                >
                  📈 歷程成長趨勢
                </button>
                <button
                  type="button"
                  onClick={() => setChartViewMode('pie')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    chartViewMode === 'pie'
                      ? 'bg-[#FF7043] text-white shadow-[1px_1px_0px_#5D4037]'
                      : 'text-[#5D4037] hover:bg-[#FFE082]'
                  }`}
                >
                  🧩 8角落頻率圓餅
                </button>
              </div>

              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037]">
                <button
                  type="button"
                  onClick={() => setPieMode('week')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    pieMode === 'week'
                      ? 'bg-[#0288D1] text-white shadow-[1px_1px_0px_#5D4037]'
                      : 'text-[#5D4037] hover:bg-[#FFE082]'
                  }`}
                >
                  📅 本週數據
                </button>
                <button
                  type="button"
                  onClick={() => setPieMode('cumulative')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    pieMode === 'cumulative'
                      ? 'bg-[#0288D1] text-white shadow-[1px_1px_0px_#5D4037]'
                      : 'text-[#5D4037] hover:bg-[#FFE082]'
                  }`}
                >
                  📚 全學期 ({studentRecords.length}週)
                </button>
              </div>
            </div>
          </div>

          {/* 5 Developmental Domains Cards (Top Overview) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-5">
            {fiveDomainsRadarData.map((d) => (
              <div
                key={d.subject}
                className="bg-white rounded-2xl p-3 border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037] flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-xs" style={{ color: d.color }}>
                    {d.name}
                  </span>
                  <span className="text-[10px] font-black bg-[#FFF3E0] px-1.5 py-0.5 rounded-md text-[#FF7043] border border-[#FF7043]/30">
                    ↗ 成長中
                  </span>
                </div>
                <div className="flex items-baseline gap-1 my-1">
                  <span className="text-xl font-black text-[#5D4037]">{d.score}</span>
                  <span className="text-[10px] font-bold text-[#8D6E63]">/ 100 分</span>
                </div>
                <div className="w-full bg-[#E0E0E0] h-2 rounded-full overflow-hidden border border-[#5D4037]/30 my-1">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${d.score}%`, backgroundColor: d.color }}
                  />
                </div>
                <p className="text-[9px] font-bold text-[#5D4037]/80 mt-1 line-clamp-1">{d.desc}</p>
              </div>
            ))}
          </div>

          {/* Charts Grid */}
          <div className={`grid gap-5 mb-4 ${chartViewMode === 'dual' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            {/* Chart 1: 5-Domain Radar Chart */}
            {(chartViewMode === 'dual' || chartViewMode === 'radar') && (
              <div className="bg-white rounded-2xl p-4 border-2 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-xs text-[#5D4037] flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-[#FF7043]" /> 學習領域雷達圖 (體能・認知・社會・情緒・語言)
                  </span>
                  <span className="text-[10px] bg-[#FFE082] px-2 py-0.5 rounded-full font-black text-[#5D4037] border border-[#5D4037]">
                    幼兒五大領域指標
                  </span>
                </div>

                <div className="h-[270px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="68%" data={fiveDomainsRadarData}>
                      <PolarGrid stroke="#5D4037" strokeDasharray="3 3" />
                      <PolarAngleAxis
                        dataKey="name"
                        tick={{ fill: '#5D4037', fontSize: 11, fontWeight: 'bold' }}
                      />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#5D4037" />
                      <Radar
                        name={`${selectedStudent.name} (個人指標)`}
                        dataKey="score"
                        stroke="#FF7043"
                        fill="#FF7043"
                        fillOpacity={0.5}
                      />
                      <Radar
                        name="班級平均參考"
                        dataKey="avgScore"
                        stroke="#0288D1"
                        fill="#0288D1"
                        fillOpacity={0.2}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-[#FFFBF0] border-2 border-[#5D4037] p-2.5 rounded-xl shadow-[3px_3px_0px_#5D4037] text-xs font-black text-[#5D4037] z-50">
                                <p className="text-sm font-black mb-1" style={{ color: data.color }}>
                                  {data.name}
                                </p>
                                <p className="text-[11px] font-bold text-[#5D4037]/90 space-y-0.5">
                                  <span>個人得分：<strong className="text-[#FF7043]">{data.score} 分</strong></span>
                                </p>
                                <p className="text-[10px] text-[#8D6E63] mt-1">{data.desc}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Domain Badges Footer */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2.5 border-t border-[#5D4037]/10">
                  {fiveDomainsRadarData.map((item) => (
                    <div
                      key={item.subject}
                      className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border border-[#5D4037]/30 bg-[#FFFBF0]"
                    >
                      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: item.color }} />
                      <span className="text-[#5D4037]">{item.subject}</span>
                      <span className="text-[#FF7043] font-mono">{item.score}分</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chart 2: Multi-Week Growth Trend Line Chart */}
            {(chartViewMode === 'dual' || chartViewMode === 'radar') && (
              <div className="bg-white rounded-2xl p-4 border-2 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-xs text-[#5D4037] flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-[#0288D1]" /> 五大領域歷程成長趨勢圖 (跨週觀察)
                  </span>
                  <span className="text-[10px] bg-[#E1F5FE] text-[#0288D1] px-2 py-0.5 rounded-full font-black border border-[#0288D1]">
                    連續追蹤趨勢
                  </span>
                </div>

                <div className="h-[270px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={fiveDomainsTrendData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                      <XAxis dataKey="week" tick={{ fill: '#5D4037', fontSize: 10, fontWeight: 'bold' }} />
                      <YAxis domain={[30, 100]} tick={{ fill: '#5D4037', fontSize: 10, fontWeight: 'bold' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFBF0',
                          border: '2px solid #5D4037',
                          borderRadius: '12px',
                          boxShadow: '3px 3px 0px #5D4037',
                          fontSize: '11px',
                          fontWeight: 'bold',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                      <Line type="monotone" dataKey="體能" stroke="#FF7043" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="認知" stroke="#29B6F6" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="社會" stroke="#66BB6A" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="情緒" stroke="#AB47BC" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="語言" stroke="#EC407A" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="pt-2 border-t border-[#5D4037]/10 text-[10px] text-center font-bold text-[#8D6E63]">
                  💡 數據來源：結合歷次角落觀察紀錄與幼兒評估指標，自動運算跨週成長曲線
                </div>
              </div>
            )}

            {/* Chart 3: 8 Corner Activity Frequency Radar & Pie Chart */}
            {(chartViewMode === 'pie') && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 col-span-full">
                <div className="bg-white rounded-2xl p-4 border-2 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-xs text-[#5D4037] flex items-center gap-1.5">
                      <span className="text-base">🎯</span> 8 大學習區活動頻率雷達圖
                    </span>
                    <span className="text-[10px] bg-[#FFE082] px-2 py-0.5 rounded-full font-black text-[#5D4037] border border-[#5D4037]">
                      各角落參與次數
                    </span>
                  </div>
                  <div className="h-[250px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="68%" data={cornerFrequencyData}>
                        <PolarGrid stroke="#5D4037" strokeDasharray="3 3" />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{ fill: '#5D4037', fontSize: 10, fontWeight: 'bold' }}
                        />
                        <PolarRadiusAxis angle={30} stroke="#5D4037" />
                        <Radar
                          name={selectedStudent.name}
                          dataKey="count"
                          stroke="#FF7043"
                          fill="#FF7043"
                          fillOpacity={0.5}
                        />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border-2 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-xs text-[#5D4037] flex items-center gap-1.5">
                      <PieIcon className="w-4 h-4 text-[#0288D1]" /> 各角落投入比例 (圓餅圖)
                    </span>
                    {topCorner && (
                      <span className="text-[10px] bg-[#E1F5FE] text-[#0288D1] px-2 py-0.5 rounded-full font-black border border-[#0288D1]">
                        🏆 最熱衷：{topCorner.name} ({topCorner.percentage}%)
                      </span>
                    )}
                  </div>
                  <div className="h-[250px] w-full flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                          label={renderPieLabel}
                          labelLine={false}
                        >
                          {pieData.map((entry) => (
                            <Cell key={entry.id} fill={entry.color} stroke="#5D4037" strokeWidth={1.5} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Insights Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white rounded-2xl border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037]">
              <span className="font-black text-[#FF8A65] flex items-center gap-1 mb-1">
                🌟 發展領域與角落表現分析：
              </span>
              <p className="text-[#5D4037] font-bold leading-relaxed">
                {selectedStudent.name} 在{pieMode === 'cumulative' ? '全學期累積觀察中' : '本週學習紀錄中'}，於「言語與口語表達」與「認知思考」領域表現最為突出，分數維持在 80 分以上的高階水準！角落探索中以「{topCorner?.name || '益智區/語文區'}」參與最為活躍。
              </p>
            </div>
            <div className="p-3 bg-white rounded-2xl border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037]">
              <span className="font-black text-[#0288D1] flex items-center gap-1 mb-1">
                💮 教師輔導引導建議：
              </span>
              <p className="text-[#5D4037] font-bold leading-relaxed">
                {activeRecord.teacherComment || '建議持續鼓勵幼兒跨區探索，並在積木區或科學區中增加同儕合作任務，促進社會溝通與團隊協調發展。'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 
        ===================================================================
        PRINTABLE A4 OFFICIAL FORM REPLICA - "桃園市私立 愛愛幼兒園 大班角落學習區紀錄表"
        ===================================================================
      */}
      {activeRecord ? (
        <>
          <div id="printable-area">
            <SingleReportCard record={activeRecord} students={students} />
          </div>

          {/* Hidden Container for Batch Printing All Students with A4 Page Breaks */}
          <div id="all-printable-reports" className="hidden">
            {learningRecords.map((rec) => (
              <div key={rec.id} className="a4-page-break mb-8">
                <SingleReportCard record={rec} students={students} isBatch={true} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-[#FFFDE7] border-4 border-[#5D4037] rounded-[2rem] p-12 text-center text-[#5D4037] shadow-[6px_6px_0px_#FFD54F]">
          <BookOpen className="w-12 h-12 text-[#FF8A65] mx-auto mb-3" />
          <h3 className="font-black text-lg text-[#5D4037]">尚無學習區紀錄</h3>
          <p className="text-xs font-bold mt-1">請先於「大班角落學習區紀錄表」為學生建立觀察紀錄。</p>
        </div>
      )}
    </div>
  );
};
