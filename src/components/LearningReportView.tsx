import React, { useState } from 'react';
import { Student, LearningRecord, ContactBook, CornerAreaId, ClassFilterOption } from '../types';
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
  FileSpreadsheet,
  PieChart as PieIcon,
  Camera,
  Image as ImageIcon,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  Tag,
  ZoomIn,
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
  Legend
} from 'recharts';

interface LearningReportViewProps {
  students: Student[];
  learningRecords: LearningRecord[];
  selectedStudentId: string;
  setSelectedStudentId: (id: string) => void;
  contactBooks?: ContactBook[];
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
              愛愛幼兒園 <span className="text-base font-black ml-2 text-[#FF8A65]">大班角落學習區紀錄表</span>
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
  contactBooks = [],
}) => {
  const [reportClassFilter, setReportClassFilter] = useState<ClassFilterOption>('全部班級');
  const filteredReportStudents = students.filter(
    (s) => reportClassFilter === '全部班級' || s.className === reportClassFilter
  );

  const studentRecords = learningRecords.filter((r) => r.studentId === selectedStudentId);
  const [activeRecordId, setActiveRecordId] = useState<string>('');
  const [pieMode, setPieMode] = useState<'week' | 'cumulative'>('week');

  // Photo Wall States
  const [activeTabMode, setActiveTabMode] = useState<'all' | 'gallery' | 'analytics' | 'printable'>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [galleryCornerFilter, setGalleryCornerFilter] = useState<string>('all');

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

  // Construct Gallery Photos Array for selected student (or all students if filtering)
  interface GalleryPhotoItem {
    id: string;
    url: string;
    date: string;
    recordId: string;
    studentName: string;
    className: string;
    seatNumber: string;
    teacherComment?: string;
    stamp?: string;
    sourceType: 'learningRecord' | 'contactBook';
    cornerName: string;
  }

  const galleryPhotos: GalleryPhotoItem[] = [];

  const targetRecordsForPhotos = studentRecords.length > 0 ? studentRecords : learningRecords;
  targetRecordsForPhotos.forEach((rec) => {
    if (rec.photoImages && rec.photoImages.length > 0) {
      rec.photoImages.forEach((imgUrl, idx) => {
        let cornerName = '角落學習作品';
        if (rec.customNotes) {
          const foundEntry = Object.entries(rec.customNotes).find(([_, note]) => typeof note === 'string' && note.trim());
          if (foundEntry) {
            const cornerDef = CORNER_AREAS.find((c) => c.id === foundEntry[0]);
            if (cornerDef) cornerName = cornerDef.name;
          }
        }
        galleryPhotos.push({
          id: `${rec.id}-photo-${idx}`,
          url: imgUrl,
          date: `${rec.dateStart} ~ ${rec.dateEnd}`,
          recordId: rec.id,
          studentName: rec.studentName,
          className: rec.className,
          seatNumber: rec.seatNumber,
          teacherComment: rec.teacherComment,
          stamp: rec.stamp,
          sourceType: 'learningRecord',
          cornerName,
        });
      });
    }
  });

  if (contactBooks && contactBooks.length > 0) {
    const studentCBs = contactBooks.filter((cb) => cb.studentId === selectedStudentId);
    studentCBs.forEach((cb) => {
      if (cb.photoUrls && cb.photoUrls.length > 0) {
        cb.photoUrls.forEach((pUrl, pIdx) => {
          galleryPhotos.push({
            id: `${cb.id}-cbphoto-${pIdx}`,
            url: pUrl,
            date: cb.date,
            recordId: cb.id,
            studentName: cb.studentName,
            className: cb.className,
            seatNumber: cb.seatNumber,
            teacherComment: cb.teacherMessage,
            sourceType: 'contactBook',
            cornerName: '聯絡簿照片',
          });
        });
      }
    });
  }

  // Filter Photos by selected Corner Area
  const filteredGalleryPhotos = galleryPhotos.filter((p) => {
    if (galleryCornerFilter === 'all') return true;
    return p.cornerName.includes(galleryCornerFilter);
  });

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

  const computeCornerPieData = () => {
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

    // If student has records with data, return actual calculated values
    if (total > 0) {
      return CORNER_AREAS.map((area) => {
        const val = counts[area.id] || 0;
        const percentage = Math.round((val / total) * 100);
        return {
          name: area.name,
          id: area.id,
          value: val,
          percentage,
          color: CORNER_COLORS[area.id] || '#FFA726',
        };
      }).filter((item) => item.value > 0);
    }

    // Default sample values for new / empty records so Pie chart remains clear & informative
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
        name: area.name,
        id: area.id,
        value: val,
        percentage,
        color: CORNER_COLORS[area.id] || '#FFA726',
      };
    });
  };

  const chartData = computeDomainStats(activeRecord);
  const pieData = computeCornerPieData();
  const topCorner = pieData.length > 0
    ? [...pieData].sort((a, b) => b.value - a.value)[0]
    : null;

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

      {/* View Mode Switcher Sub-Header Bar */}
      <div className="print:hidden bg-white border-4 border-[#5D4037] rounded-2xl p-2.5 mb-6 shadow-[4px_4px_0px_#5D4037] flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTabMode('all')}
            className={`px-3.5 py-2 rounded-xl border-2 border-[#5D4037] font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTabMode === 'all'
                ? 'bg-[#FFE082] text-[#5D4037] shadow-[2px_2px_0px_#5D4037]'
                : 'bg-[#FFFBF0] text-[#5D4037]/70 hover:bg-[#FFF59D]'
            }`}
          >
            <Layers className="w-4 h-4 text-[#FF8A65]" /> 全部整合視圖
          </button>

          <button
            onClick={() => setActiveTabMode('gallery')}
            className={`px-3.5 py-2 rounded-xl border-2 border-[#5D4037] font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTabMode === 'gallery'
                ? 'bg-[#FF8A65] text-white shadow-[2px_2px_0px_#5D4037]'
                : 'bg-[#FFFBF0] text-[#5D4037]/70 hover:bg-[#FFE0B2]'
            }`}
          >
            <Camera className="w-4 h-4" /> 📸 學習照片記錄牆 (瀑布流)
            <span className="bg-white text-[#5D4037] text-[10px] px-2 py-0.5 rounded-full font-black ml-1 border border-[#5D4037]">
              {galleryPhotos.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTabMode('analytics')}
            className={`px-3.5 py-2 rounded-xl border-2 border-[#5D4037] font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTabMode === 'analytics'
                ? 'bg-[#4FC3F7] text-[#5D4037] shadow-[2px_2px_0px_#5D4037]'
                : 'bg-[#FFFBF0] text-[#5D4037]/70 hover:bg-[#E1F5FE]'
            }`}
          >
            <PieIcon className="w-4 h-4 text-[#0288D1]" /> 📊 各角落統計與雷達圖
          </button>

          <button
            onClick={() => setActiveTabMode('printable')}
            className={`px-3.5 py-2 rounded-xl border-2 border-[#5D4037] font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTabMode === 'printable'
                ? 'bg-[#C8E6C9] text-[#5D4037] shadow-[2px_2px_0px_#5D4037]'
                : 'bg-[#FFFBF0] text-[#5D4037]/70 hover:bg-[#E8F5E9]'
            }`}
          >
            <BookOpen className="w-4 h-4 text-[#388E3C]" /> 📄 A4 官方觀察報告
          </button>
        </div>

        <div className="text-xs font-black text-[#5D4037] px-2 flex items-center gap-1">
          <span>目前檢視學生：</span>
          <span className="bg-[#FFE082] px-2.5 py-1 rounded-full border border-[#5D4037] text-[#5D4037]">
            🌸 {selectedStudent.className} {selectedStudent.seatNumber}號 {selectedStudent.name}
          </span>
        </div>
      </div>

      {/* 
        ===================================================================
        PHOTO GALLERY MASONRY WALL (學習照片記錄牆)
        ===================================================================
      */}
      {(activeTabMode === 'all' || activeTabMode === 'gallery') && (
        <div className="print:hidden bg-[#FFF3E0] border-4 border-[#5D4037] rounded-[2rem] p-5 shadow-[6px_6px_0px_#FFB74D] mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 border-b-2 border-[#5D4037]/20 pb-4">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-[#5D4037] flex items-center gap-2 italic">
                <Camera className="w-6 h-6 text-[#FF8A65]" />
                📸 {selectedStudent.name} 的學習照片記錄牆 (瀑布流展覽)
              </h3>
              <p className="text-xs font-bold text-[#5D4037]/80 mt-1">
                記錄孩子在角落活動過程中的藝術手作、建構作品與學習亮點
              </p>
            </div>

            {/* Corner Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black text-[#5D4037] flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-[#FF8A65]" /> 篩選角落:
              </span>
              <button
                onClick={() => setGalleryCornerFilter('all')}
                className={`px-2.5 py-1 rounded-full border-2 border-[#5D4037] text-xs font-black transition-all cursor-pointer ${
                  galleryCornerFilter === 'all'
                    ? 'bg-[#FF8A65] text-white shadow-[2px_2px_0px_#5D4037]'
                    : 'bg-white text-[#5D4037] hover:bg-[#FFE082]'
                }`}
              >
                全部 ({galleryPhotos.length})
              </button>
              {CORNER_AREAS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setGalleryCornerFilter(c.name)}
                  className={`px-2.5 py-1 rounded-full border-2 border-[#5D4037] text-xs font-black transition-all cursor-pointer ${
                    galleryCornerFilter === c.name
                      ? 'bg-[#FF8A65] text-white shadow-[2px_2px_0px_#5D4037]'
                      : 'bg-white text-[#5D4037] hover:bg-[#FFE082]'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Masonry Waterfall Layout */}
          {filteredGalleryPhotos.length > 0 ? (
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {filteredGalleryPhotos.map((photo, idx) => (
                <div
                  key={photo.id}
                  onClick={() => setLightboxIndex(idx)}
                  className="break-inside-avoid bg-white rounded-2xl border-2 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] hover:shadow-[6px_6px_0px_#FF8A65] hover:-translate-y-1 transition-all group overflow-hidden cursor-pointer relative flex flex-col mb-4"
                >
                  <div className="relative overflow-hidden bg-[#FFFBF0]">
                    <img
                      src={photo.url}
                      alt={photo.studentName}
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <span className="absolute top-2 left-2 bg-[#5D4037]/85 backdrop-blur-md text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-white/40 shadow-sm">
                      📅 {photo.date}
                    </span>
                    <div className="absolute top-2 right-2 bg-white/90 text-[#5D4037] p-1.5 rounded-full border border-[#5D4037] opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                      <ZoomIn className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="bg-[#FFE082] text-[#5D4037] text-[10px] font-black px-2 py-0.5 rounded-full border border-[#5D4037]">
                          🏷️ {photo.cornerName}
                        </span>
                        {photo.stamp && (
                          <span className="text-[10px] font-black text-[#D81B60] bg-[#FCE4EC] px-1.5 py-0.5 rounded border border-[#D81B60]/30">
                            💮 {photo.stamp}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#5D4037] font-bold leading-snug line-clamp-3">
                        {photo.teacherComment || '學習成長觀察紀錄照片'}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-dashed border-[#5D4037]/20 flex items-center justify-between text-[10px] font-black text-[#5D4037]/70">
                      <span>{photo.className} {photo.studentName}</span>
                      <span className="text-[#0288D1] flex items-center gap-0.5 group-hover:underline">
                        <Maximize2 className="w-2.5 h-2.5" /> 點擊放大
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl border-2 border-[#5D4037] text-center text-[#5D4037]">
              <ImageIcon className="w-10 h-10 text-[#FF8A65] mx-auto mb-2" />
              <p className="font-black text-sm">目前尚無符合「{galleryCornerFilter}」的歷程照片</p>
              <p className="text-xs font-bold text-[#5D4037]/70 mt-1">您可以點擊「新增角落學習區紀錄」或聯絡簿中上傳照片或貼上圖片 URL。</p>
            </div>
          )}
        </div>
      )}

      {/* Development Domain & Corner Category Analytics Card (Hidden on Print) */}
      {(activeTabMode === 'all' || activeTabMode === 'analytics') && activeRecord && (
        <div className="print:hidden bg-[#E1F5FE] border-4 border-[#5D4037] rounded-[2rem] p-5 shadow-[6px_6px_0px_#81D4FA] mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b-2 border-[#5D4037]/20 pb-3">
            <h3 className="text-base sm:text-lg font-black text-[#5D4037] flex items-center gap-2 italic">
              <BarChart3 className="w-5 h-5 text-[#FF8A65]" />
              {selectedStudent.name} 的學習歷程雙維度視覺化分析
            </h3>

            {/* Pie Chart Mode Selector */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setPieMode('week')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  pieMode === 'week'
                    ? 'bg-[#FF8A65] text-white shadow-[1px_1px_0px_#5D4037]'
                    : 'text-[#5D4037] hover:bg-[#FFE082]'
                }`}
              >
                📅 本週觀察
              </button>
              <button
                type="button"
                onClick={() => setPieMode('cumulative')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  pieMode === 'cumulative'
                    ? 'bg-[#FF8A65] text-white shadow-[1px_1px_0px_#5D4037]'
                    : 'text-[#5D4037] hover:bg-[#FFE082]'
                }`}
              >
                📚 全學期累積 ({studentRecords.length}週)
              </button>
            </div>
          </div>

          {/* Grid of Two Analytics Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-4">
            {/* Panel 1: Radar Chart (Ability Radar) */}
            <div className="bg-white rounded-2xl p-4 border-2 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="font-black text-xs text-[#5D4037] flex items-center gap-1.5">
                  <span className="text-base">🎯</span> 幼兒六大發展能力評量 (雷達圖)
                </span>
                <span className="text-[10px] bg-[#FFE082] px-2 py-0.5 rounded-full font-black text-[#5D4037] border border-[#5D4037]">
                  能力指標
                </span>
              </div>
              <div className="h-[220px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="68%" data={chartData}>
                    <PolarGrid stroke="#5D4037" strokeDasharray="3 3" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#5D4037', fontSize: 10, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name={activeRecord.studentName} dataKey="score" stroke="#FF8A65" fill="#FF8A65" fillOpacity={0.5} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Panel 2: Pie Chart (Corner Categories Distribution) */}
            <div className="bg-white rounded-2xl p-4 border-2 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="font-black text-xs text-[#5D4037] flex items-center gap-1.5">
                  <PieIcon className="w-4 h-4 text-[#0288D1]" /> 各角落類別投入比例 (圓餅圖)
                </span>
                {topCorner && (
                  <span className="text-[10px] bg-[#E1F5FE] text-[#0288D1] px-2 py-0.5 rounded-full font-black border border-[#0288D1]">
                    🏆 最熱衷：{topCorner.name} ({topCorner.percentage}%)
                  </span>
                )}
              </div>

              {pieData.length > 0 ? (
                <div className="h-[220px] w-full flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                        label={renderPieLabel}
                        labelLine={false}
                      >
                        {pieData.map((entry) => (
                          <Cell key={entry.id} fill={entry.color} stroke="#5D4037" strokeWidth={1.5} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-[#FFFBF0] border-2 border-[#5D4037] p-2.5 rounded-xl shadow-[3px_3px_0px_#5D4037] text-xs font-black text-[#5D4037] z-50">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="w-2.5 h-2.5 rounded-full inline-block border border-[#5D4037]" style={{ backgroundColor: data.color }} />
                                  <span>{data.name}</span>
                                </div>
                                <div className="text-[11px] font-bold text-[#5D4037]/90 space-y-0.5">
                                  <p>達成指標：<span className="text-[#FF8A65]">{data.value} 項</span></p>
                                  <p>角落佔比：<span className="text-[#0288D1]">{data.percentage}%</span></p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Center Donut Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[10px] font-black text-[#5D4037]/70">總參與項</span>
                    <span className="text-sm font-black text-[#FF8A65]">
                      {pieData.reduce((acc, curr) => acc + curr.value, 0)} 項
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-xs font-bold text-[#5D4037]/70 italic">
                  此區間尚無角落觀察指標紀錄
                </div>
              )}

              {/* Pie Chart Legend Chips */}
              {pieData.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2 border-t border-[#5D4037]/10">
                  {pieData.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border border-[#5D4037]/30 bg-[#FFFBF0]"
                    >
                      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: item.color }} />
                      <span className="text-[#5D4037]">{item.name}</span>
                      <span className="text-[#FF8A65] font-mono">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Insights Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white rounded-2xl border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037]">
              <span className="font-black text-[#FF8A65] block mb-1">🌟 發展領域與角落亮點報告：</span>
              <p className="text-[#5D4037] font-bold leading-relaxed">
                {selectedStudent.name} 在{pieMode === 'cumulative' ? '全學期累積觀察中' : '本週角落學習期間'}，共有{' '}
                <strong className="text-[#FF8A65]">
                  {pieData.reduce((acc, curr) => acc + curr.value, 0)}
                </strong>{' '}
                項指標獲老師紀錄達成。{topCorner ? `其中以「${topCorner.name}」展現最高投入度 (${topCorner.percentage}%)！` : '繪畫、精細肌肉與專注觀察領域發展極佳！'}
              </p>
            </div>
            <div className="p-3 bg-white rounded-2xl border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037]">
              <span className="font-black text-[#0288D1] block mb-1">💮 老師指導建議：</span>
              <p className="text-[#5D4037] font-bold leading-relaxed">{activeRecord.teacherComment || '學習態度非常良好，樂於探索與分享。'}</p>
            </div>
          </div>
        </div>
      )}

      {/* 
        ===================================================================
        PRINTABLE A4 OFFICIAL FORM REPLICA - "桃園市私立 愛愛幼兒園 大班角落學習區紀錄表"
        ===================================================================
      */}
      {(activeTabMode === 'all' || activeTabMode === 'printable') && (
        activeRecord ? (
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
        )
      )}

      {/* Lightbox Modal for Photo Gallery */}
      {lightboxIndex !== null && filteredGalleryPhotos[lightboxIndex] && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-white border-4 border-[#5D4037] rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
            {/* Lightbox Image View */}
            <div className="flex-1 bg-black flex items-center justify-center relative min-h-[300px] md:min-h-[450px] p-2">
              <img
                src={filteredGalleryPhotos[lightboxIndex].url}
                alt="放大照片"
                className="max-h-[75vh] w-auto object-contain rounded-lg"
              />
              {/* Navigation Arrows */}
              {lightboxIndex > 0 && (
                <button
                  onClick={() => setLightboxIndex(lightboxIndex - 1)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-[#5D4037] p-2 rounded-full border-2 border-[#5D4037] shadow-lg cursor-pointer transition-all"
                  title="上一張"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              {lightboxIndex < filteredGalleryPhotos.length - 1 && (
                <button
                  onClick={() => setLightboxIndex(lightboxIndex + 1)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-[#5D4037] p-2 rounded-full border-2 border-[#5D4037] shadow-lg cursor-pointer transition-all"
                  title="下一張"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Lightbox Sidebar Info */}
            <div className="w-full md:w-80 bg-[#FFFDE7] p-5 flex flex-col justify-between border-t-4 md:border-t-0 md:border-l-4 border-[#5D4037]">
              <div>
                <div className="flex items-center justify-between mb-3 border-b-2 border-[#5D4037]/20 pb-2">
                  <div>
                    <span className="text-[10px] font-black bg-[#FF8A65] text-white px-2 py-0.5 rounded-full border border-[#5D4037]">
                      {filteredGalleryPhotos[lightboxIndex].className}
                    </span>
                    <h4 className="text-base font-black text-[#5D4037] mt-1">
                      {filteredGalleryPhotos[lightboxIndex].studentName} 的學習歷程照片
                    </h4>
                  </div>
                  <button
                    onClick={() => setLightboxIndex(null)}
                    className="bg-[#FF5252] hover:bg-[#FF1744] text-white p-1.5 rounded-full border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-3 text-xs font-bold text-[#5D4037]">
                  <div>
                    <span className="text-[10px] text-[#5D4037]/70 font-black block">紀錄日期區間：</span>
                    <p className="text-xs font-black text-[#0288D1]">📅 {filteredGalleryPhotos[lightboxIndex].date}</p>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#5D4037]/70 font-black block">角落 / 觀察類別：</span>
                    <span className="inline-block bg-[#FFE082] px-2.5 py-0.5 rounded-full border border-[#5D4037] font-black text-xs mt-0.5">
                      🏷️ {filteredGalleryPhotos[lightboxIndex].cornerName}
                    </span>
                  </div>

                  {filteredGalleryPhotos[lightboxIndex].teacherComment && (
                    <div>
                      <span className="text-[10px] text-[#5D4037]/70 font-black block">教師觀察心得與評估：</span>
                      <p className="bg-white p-2.5 rounded-xl border border-[#5D4037] leading-relaxed text-[#5D4037] mt-0.5 shadow-inner">
                        {filteredGalleryPhotos[lightboxIndex].teacherComment}
                      </p>
                    </div>
                  )}

                  {filteredGalleryPhotos[lightboxIndex].stamp && (
                    <div className="pt-2">
                      <span className="inline-block bg-[#FCE4EC] border-2 border-[#D81B60] text-[#D81B60] font-black px-3 py-1 rounded-full text-xs shadow-sm">
                        💮 印章：{filteredGalleryPhotos[lightboxIndex].stamp}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t-2 border-[#5D4037]/20 flex items-center justify-between gap-2 mt-4">
                <a
                  href={filteredGalleryPhotos[lightboxIndex].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={`愛愛幼兒園_學習照片_${filteredGalleryPhotos[lightboxIndex].studentName}`}
                  className="flex-1 bg-[#4FC3F7] hover:bg-[#29B6F6] text-[#5D4037] font-black text-xs py-2 px-3 rounded-xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> 下載高解析照片
                </a>
                <button
                  onClick={() => setLightboxIndex(null)}
                  className="bg-[#FFE082] hover:bg-[#FFD54F] text-[#5D4037] font-black text-xs py-2 px-3 rounded-xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] cursor-pointer"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
