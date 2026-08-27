import React, { useState } from 'react';
import { Student, LearningRecord, CornerAreaId, ClassFilterOption, SheetConfig } from '../types';
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
  FolderOpen,
  Type,
  FileCheck,
  Eye
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
import { SingleReportCard } from './SingleReportCard';
import { PrintInspectionModal } from './PrintInspectionModal';

interface LearningReportViewProps {
  students: Student[];
  learningRecords: LearningRecord[];
  selectedStudentId: string;
  setSelectedStudentId: (id: string) => void;
  sheetConfig?: SheetConfig;
}

export const LearningReportView: React.FC<LearningReportViewProps> = ({
  students,
  learningRecords,
  selectedStudentId,
  setSelectedStudentId,
  sheetConfig,
}) => {
  const [reportClassFilter, setReportClassFilter] = useState<ClassFilterOption>('全部班級');
  const [reportFontSize, setReportFontSize] = useState<number>(18);
  const [isPrintInspectionOpen, setIsPrintInspectionOpen] = useState<boolean>(false);

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
                <title>愛愛幼兒園 - 角落學習紀錄表 - ${stuName}</title>
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
              <title>愛愛幼兒園 - 全班角落學習紀錄表 (全班 A4 批次檔)</title>
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

  const chartData = computeDomainStats(activeRecord);
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

          {/* Report Font Size Selector */}
          <div className="flex-1 sm:flex-none min-w-[170px]">
            <label className="block text-xs font-black text-[#5D4037] mb-1 flex items-center gap-1">
              <Type className="w-3.5 h-3.5 text-[#FF8A65]" />
              報告字體大小:
            </label>
            <div className="flex items-center gap-1.5 bg-[#FFFBF0] border-2 border-[#5D4037] rounded-xl px-2 py-1 shadow-[2px_2px_0px_#5D4037]">
              <button
                type="button"
                onClick={() => setReportFontSize((prev) => Math.max(14, prev - 2))}
                className="w-7 h-7 rounded-lg bg-[#FFE082] hover:bg-[#FFD54F] border border-[#5D4037] font-black text-xs text-[#5D4037] flex items-center justify-center cursor-pointer transition-all active:scale-90"
                title="縮小字體"
              >
                -
              </button>
              <select
                value={reportFontSize}
                onChange={(e) => setReportFontSize(Number(e.target.value))}
                className="flex-1 bg-transparent font-black text-xs text-[#5D4037] text-center focus:outline-none cursor-pointer py-1"
              >
                <option value={14}>14 px (標準)</option>
                <option value={16}>16 px (清晰)</option>
                <option value={18}>18 px (大字)</option>
                <option value={20}>20 px (特大)</option>
                <option value={22}>22 px (超大)</option>
                <option value={24}>24 px (極大)</option>
                <option value={26}>26 px (長者友善)</option>
                <option value={28}>28 px (超醒目)</option>
              </select>
              <button
                type="button"
                onClick={() => setReportFontSize((prev) => Math.min(28, prev + 2))}
                className="w-7 h-7 rounded-lg bg-[#FFE082] hover:bg-[#FFD54F] border border-[#5D4037] font-black text-xs text-[#5D4037] flex items-center justify-center cursor-pointer transition-all active:scale-90"
                title="放大字體"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsPrintInspectionOpen(true)}
            className="flex-1 sm:flex-none justify-center bg-[#FFE082] hover:bg-[#FFD54F] text-[#5D4037] font-black text-xs py-2.5 px-3.5 rounded-full border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer min-h-[40px]"
            title="開啟園長 A4 列印檢查模式，預覽所有幼兒紀錄之版面比例與自動分頁符號"
          >
            <FileCheck className="w-4 h-4 text-[#FF8A65]" /> 園長列印檢查模式 (A4 預覽)
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

      {/* Learning Corner Distribution Analytics Card (Hidden on Print) */}
      {activeRecord && (
        <div className="print:hidden bg-[#E1F5FE] border-4 border-[#5D4037] rounded-[2rem] p-5 shadow-[6px_6px_0px_#81D4FA] mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 border-b-2 border-[#5D4037]/20 pb-3">
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#5D4037] flex items-center gap-2 italic">
                <BarChart3 className="w-5 h-5 text-[#FF8A65]" />
                {selectedStudent.name} 的學習分布圖（各角落活動頻率分析）
              </h3>
              <p className="text-[11px] font-bold text-[#5D4037]/80 mt-0.5">
                依據各角落觀察勾選指標與紀錄次數，自動生成 8 大學習區活動頻率雷達圖與圓餅圖
              </p>
            </div>

            {/* View Mode & Time Scope Selectors */}
            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
              {/* Chart Mode Toggle */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037]">
                <button
                  type="button"
                  onClick={() => setChartViewMode('dual')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    chartViewMode === 'dual'
                      ? 'bg-[#0288D1] text-white shadow-[1px_1px_0px_#5D4037]'
                      : 'text-[#5D4037] hover:bg-[#FFE082]'
                  }`}
                >
                  📊 雙圖對照
                </button>
                <button
                  type="button"
                  onClick={() => setChartViewMode('radar')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    chartViewMode === 'radar'
                      ? 'bg-[#0288D1] text-white shadow-[1px_1px_0px_#5D4037]'
                      : 'text-[#5D4037] hover:bg-[#FFE082]'
                  }`}
                >
                  🎯 頻率雷達圖
                </button>
                <button
                  type="button"
                  onClick={() => setChartViewMode('pie')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    chartViewMode === 'pie'
                      ? 'bg-[#0288D1] text-white shadow-[1px_1px_0px_#5D4037]'
                      : 'text-[#5D4037] hover:bg-[#FFE082]'
                  }`}
                >
                  🥧 比例圓餅圖
                </button>
              </div>

              {/* Time Scope Toggle */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037]">
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
                  📚 全學期 ({studentRecords.length}週)
                </button>
              </div>
            </div>
          </div>

          {/* Grid of Analytics Panels */}
          <div className={`grid gap-5 mb-4 ${chartViewMode === 'dual' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            {/* Panel 1: Radar Chart (8-Corner Activity Frequency Radar) */}
            {(chartViewMode === 'dual' || chartViewMode === 'radar') && (
              <div className="bg-white rounded-2xl p-4 border-2 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-xs text-[#5D4037] flex items-center gap-1.5">
                    <span className="text-base">🎯</span> 8 大學習區活動頻率分布 (雷達圖)
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
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-[#FFFBF0] border-2 border-[#5D4037] p-2.5 rounded-xl shadow-[3px_3px_0px_#5D4037] text-xs font-black text-[#5D4037] z-50">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="w-2.5 h-2.5 rounded-full inline-block border border-[#5D4037]" style={{ backgroundColor: data.color }} />
                                  <span>{data.subject}</span>
                                </div>
                                <div className="text-[11px] font-bold text-[#5D4037]/90 space-y-0.5">
                                  <p>活動頻率：<span className="text-[#FF8A65]">{data.count} 次</span></p>
                                  <p>角落佔比：<span className="text-[#0288D1]">{data.percentage}%</span></p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Corner Frequency Legend Badges */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2.5 border-t border-[#5D4037]/10">
                  {cornerFrequencyData.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border border-[#5D4037]/30 bg-[#FFFBF0]"
                    >
                      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: item.color }} />
                      <span className="text-[#5D4037]">{item.name}</span>
                      <span className="text-[#0288D1] font-mono">{item.count}次</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Panel 2: Pie Chart (Corner Categories Distribution) */}
            {(chartViewMode === 'dual' || chartViewMode === 'pie') && (
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

                {pieData.length > 0 ? (
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
                                    <p>活動紀錄：<span className="text-[#FF8A65]">{data.value} 次</span></p>
                                    <p>投入比例：<span className="text-[#0288D1]">{data.percentage}%</span></p>
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
                      <span className="text-[10px] font-black text-[#5D4037]/70">總活動紀錄</span>
                      <span className="text-sm font-black text-[#FF8A65]">
                        {totalActivityCount} 次
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-xs font-bold text-[#5D4037]/70 italic">
                    此區間尚無角落觀察指標紀錄
                  </div>
                )}

                {/* Pie Chart Legend Chips */}
                {pieData.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2.5 border-t border-[#5D4037]/10">
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
            )}
          </div>

          {/* Bottom Insights Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white rounded-2xl border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037]">
              <span className="font-black text-[#FF8A65] block mb-1">🌟 各角落活動頻率亮點分析：</span>
              <p className="text-[#5D4037] font-bold leading-relaxed">
                {selectedStudent.name} 在{pieMode === 'cumulative' ? '全學期累積觀察中' : '本週角落學習期間'}，共於 8 大學習區留下{' '}
                <strong className="text-[#FF8A65]">{totalActivityCount}</strong>{' '}
                次活動紀錄。{topCorner ? `其中以「${topCorner.name}」參與頻率最高 (${topCorner.count}次，佔比 ${topCorner.percentage}%)！` : '展現廣泛且均衡的角落探索興趣！'}
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
      {activeRecord ? (
        <>
          <div id="printable-area">
            <SingleReportCard record={activeRecord} students={students} fontSize={reportFontSize} />
          </div>

          {/* Hidden Container for Batch Printing All Students with A4 Page Breaks */}
          <div id="all-printable-reports" className="hidden">
            {learningRecords.map((rec) => (
              <div key={rec.id} className="a4-page-break mb-8">
                <SingleReportCard record={rec} students={students} isBatch={true} fontSize={reportFontSize} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="bg-[#FFFDE7] border-4 border-[#5D4037] rounded-[2rem] p-12 text-center text-[#5D4037] shadow-[6px_6px_0px_#FFD54F]">
          <BookOpen className="w-12 h-12 text-[#FF8A65] mx-auto mb-3" />
          <h3 className="font-black text-lg text-[#5D4037]">尚無角落學習紀錄</h3>
          <p className="text-xs font-bold mt-1">請先於「角落學習紀錄表」為學生建立觀察紀錄。</p>
        </div>
      )}

      {/* 園長專用 A4 列印檢查模式視窗 */}
      <PrintInspectionModal
        isOpen={isPrintInspectionOpen}
        onClose={() => setIsPrintInspectionOpen(false)}
        students={students}
        learningRecords={learningRecords}
        initialStudentId={selectedStudentId}
        initialFontSize={reportFontSize}
        onPrintSingle={(rec) => {
          setSelectedStudentId(rec.studentId);
          setTimeout(() => handlePrintSingle(), 150);
        }}
        onPrintBatch={(recs) => {
          handlePrintAllStudents();
        }}
      />
    </div>
  );
};
