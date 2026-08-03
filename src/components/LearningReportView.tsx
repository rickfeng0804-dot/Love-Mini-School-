import React, { useState } from 'react';
import { Student, LearningRecord, CornerAreaId } from '../types';
import { CORNER_AREAS } from '../data/initialData';
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
  FileSpreadsheet
} from 'lucide-react';
import { generateLearningRecordsCsv, downloadCsv } from '../lib/csvExport';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell 
} from 'recharts';

interface LearningReportViewProps {
  students: Student[];
  learningRecords: LearningRecord[];
  selectedStudentId: string;
  setSelectedStudentId: (id: string) => void;
}

interface SingleReportCardProps {
  record: LearningRecord;
  students?: Student[];
  isBatch?: boolean;
}

const SingleReportCard: React.FC<SingleReportCardProps> = ({ record, isBatch = false }) => {
  if (!record) return null;
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
              愛愛幼兒園 <span className="text-base font-black ml-2 text-[#FF8A65]">大班角落學習區紀錄表</span>
            </h2>
          </div>
        </div>

        <div className="text-right">
          <h1 className="text-2xl font-black tracking-widest text-[#5D4037] italic">
            我的學習紀錄
          </h1>
          <span className="text-[10px] text-[#5D4037]/70 font-mono font-bold">ぼくのぐんぐんきろく</span>
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
        <span>幼兒園導師簽章：__________________</span>
        <span>園長簽章：__________________</span>
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
}) => {
  const studentRecords = learningRecords.filter((r) => r.studentId === selectedStudentId);
  const [activeRecordId, setActiveRecordId] = useState<string>(
    studentRecords[0]?.id || learningRecords[0]?.id || ''
  );

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

  // Compute Domain Radar Stats based on checked items across corners
  const computeDomainStats = (record?: LearningRecord) => {
    if (!record) return [];
    const checked: Record<string, string[]> = record.checkedItems || {};

    let motorSkills = (checked['watercolor']?.length || 0) + (checked['art']?.length || 0) + (checked['beads']?.length || 0);
    let logicScience = (checked['science']?.length || 0) + (checked['brain']?.length || 0) + (checked['puzzle']?.length || 0);
    let artCreative = (checked['watercolor']?.length || 0) + (checked['art']?.length || 0) + (checked['blocks']?.length || 0);
    let socialLanguage = (checked['language']?.length || 0) + (checked['blocks']?.length || 0) + (checked['brain']?.length || 0);
    let focusPersistence = (checked['beads']?.length || 0) + (checked['puzzle']?.length || 0) + (checked['language']?.length || 0);

    return [
      { subject: '精細與手眼協調', score: Math.min(100, motorSkills * 15 + 30), fullMark: 100 },
      { subject: '邏輯與數理探索', score: Math.min(100, logicScience * 18 + 25), fullMark: 100 },
      { subject: '藝術美感與創造', score: Math.min(100, artCreative * 16 + 30), fullMark: 100 },
      { subject: '社會溝通與團隊', score: Math.min(100, socialLanguage * 17 + 25), fullMark: 100 },
      { subject: '持續專注與抗挫', score: Math.min(100, focusPersistence * 16 + 20), fullMark: 100 },
    ];
  };

  const chartData = computeDomainStats(activeRecord);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Top Filter & Print Controls (Hidden on Print) */}
      <div className="print:hidden bg-[#FFFDE7] border-4 border-[#5D4037] rounded-[2rem] p-4 sm:p-5 shadow-[6px_6px_0px_#FFD54F] mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
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
              {students.map((stu) => (
                <option key={stu.id} value={stu.id}>
                  {stu.className} - {stu.seatNumber}號 {stu.name}
                </option>
              ))}
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

      {/* Development Domain Analytics Card (Hidden on Print) */}
      {activeRecord && (
        <div className="print:hidden bg-[#E1F5FE] border-4 border-[#5D4037] rounded-[2rem] p-5 shadow-[6px_6px_0px_#81D4FA] mb-6">
          <h3 className="text-base font-black text-[#5D4037] mb-3 flex items-center gap-2 italic">
            <BarChart3 className="w-5 h-5 text-[#FF8A65]" />
            幼兒發展領域評量能力視覺化分析 (發展雷達圖)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="h-[220px] bg-white rounded-2xl p-2 border-2 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                  <PolarGrid stroke="#5D4037" strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#5D4037', fontSize: 11, fontWeight: 'bold' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name={activeRecord.studentName} dataKey="score" stroke="#FF8A65" fill="#FF8A65" fillOpacity={0.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-white rounded-2xl border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037]">
                <span className="font-black text-[#FF8A65] block mb-1">🌟 發展領域亮點報告：</span>
                <p className="text-[#5D4037] font-bold leading-relaxed">
                  {selectedStudent.name} 在本週角落學習期間，共有{' '}
                  <strong className="text-[#FF8A65]">
                    {Object.values(activeRecord.checkedItems || {}).flat().length}
                  </strong>{' '}
                  項指標獲老師紀錄達成。繪畫、精細肌肉與專注觀察領域發展極佳！
                </p>
              </div>
              <div className="p-3 bg-white rounded-2xl border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037]">
                <span className="font-black text-[#0288D1] block mb-1">💮 老師指導建議：</span>
                <p className="text-[#5D4037] font-bold leading-relaxed">{activeRecord.teacherComment}</p>
              </div>
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
            <SingleReportCard record={activeRecord} />
          </div>

          {/* Hidden Container for Batch Printing All Students with A4 Page Breaks */}
          <div id="all-printable-reports" className="hidden">
            {learningRecords.map((rec) => (
              <div key={rec.id} className="a4-page-break mb-8">
                <SingleReportCard record={rec} isBatch={true} />
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
