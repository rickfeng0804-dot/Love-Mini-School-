import React, { useState } from 'react';
import { 
  Student, 
  LearningRecord, 
  CornerAreaId, 
  ClassFilterOption, 
  SheetConfig,
  GradeFilterOption,
  GRADE_OPTIONS,
  getStudentGrade
} from '../types';
import { CORNER_AREAS } from '../data/initialData';
import { 
  Printer, 
  BookOpen, 
  BarChart3, 
  PieChart as PieIcon,
  Type,
  GraduationCap,
  Filter,
  HardDrive,
  ExternalLink,
  Copy,
  Check,
  TrendingUp,
  Award,
  Users,
  Compass,
  Sparkles,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { DEFAULT_NAS_STORAGE_URL } from '../lib/googleSheets';
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
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
  const [reportGradeFilter, setReportGradeFilter] = useState<GradeFilterOption>('全部年級');
  const [reportClassFilter, setReportClassFilter] = useState<ClassFilterOption>('全部班級');
  const [reportFontSize, setReportFontSize] = useState<number>(18);
  const [copiedNasUrl, setCopiedNasUrl] = useState(false);

  const nasStorageUrl = sheetConfig?.nasStorageUrl || DEFAULT_NAS_STORAGE_URL;

  const handleCopyNasUrl = () => {
    navigator.clipboard.writeText(nasStorageUrl);
    setCopiedNasUrl(true);
    setTimeout(() => setCopiedNasUrl(false), 2500);
  };

  // Dynamically compute unique grades
  const uniqueGradeList = Array.from(
    new Set(['全部年級', ...GRADE_OPTIONS, ...students.map((s) => getStudentGrade(s)).filter(Boolean)])
  );

  // Available students for selected grade
  const availableStudentsForGrade = students.filter(
    (s) => reportGradeFilter === '全部年級' || getStudentGrade(s) === reportGradeFilter
  );

  // Dynamically compute unique classes for selected grade
  const uniqueClassList = Array.from(
    new Set(['全部班級', ...availableStudentsForGrade.map((s) => s.className).filter(Boolean)])
  );

  const filteredReportStudents = students.filter((s) => {
    const matchGrade = reportGradeFilter === '全部年級' || getStudentGrade(s) === reportGradeFilter;
    const matchClass = reportClassFilter === '全部班級' || s.className === reportClassFilter;
    return matchGrade && matchClass;
  });

  const studentRecords = learningRecords.filter((r) => r.studentId === selectedStudentId);
  const [activeRecordId, setActiveRecordId] = useState<string>('');
  const [pieMode, setPieMode] = useState<'week' | 'cumulative'>('week');
  const [chartViewMode, setChartViewMode] = useState<'dual' | 'bar' | 'radar' | 'pie'>('dual');
  const [analyticsScope, setAnalyticsScope] = useState<'single' | 'overview'>('single');
  const [sortByUsage, setSortByUsage] = useState<boolean>(false);

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
                <div class="no-print" style="margin-bottom: 20px; background: #FFFDE7; padding: 14px 18px; border: 3px solid #5D4037; border-radius: 16px; font-family: sans-serif; box-shadow: 4px 4px 0px #5D4037; max-width: 960px; margin: 0 auto 20px auto;">
                  <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px;">
                    <div>
                      <span style="font-weight: 900; color: #5D4037; font-size: 15px; display: block;">📄 愛愛幼兒園 A4 官方報告書 - ${stuName}</span>
                      <span style="font-size: 11px; color: #795548; font-weight: bold; display: block; margin-top: 2px;">
                        📌 歸檔步驟：① 點擊【存 PDF 檔案】(目的地選「另存為 PDF」) ➔ ② 點擊【儲存至 NAS】開啟幼兒園群暉 NAS 目錄上傳歸檔！
                      </span>
                    </div>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center;">
                      <button onclick="window.focus(); window.print();" style="background: #FF8A65; color: white; border: 2px solid #5D4037; padding: 8px 18px; border-radius: 20px; font-weight: 900; cursor: pointer; font-size: 13px; box-shadow: 2px 2px 0px #5D4037;">
                        🖨️ 存 PDF 檔案
                      </button>
                      <a href="${nasStorageUrl}" target="_blank" rel="noopener noreferrer" style="background: #0288D1; color: white; border: 2px solid #5D4037; padding: 8px 18px; border-radius: 20px; font-weight: 900; text-decoration: none; font-size: 13px; box-shadow: 2px 2px 0px #5D4037; display: inline-flex; align-items: center; gap: 4px;">
                        🗄️ 儲存至 NAS ↗
                      </a>
                      <button onclick="window.close();" style="background: #e0e0e0; color: #333; border: 2px solid #5D4037; padding: 8px 14px; border-radius: 20px; font-weight: 900; cursor: pointer; font-size: 13px;">
                        ✖ 關閉視窗
                      </button>
                    </div>
                  </div>
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

  const renderBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#FFFBF0] border-2 border-[#5D4037] p-3 rounded-xl shadow-[3px_3px_0px_#5D4037] text-xs font-black text-[#5D4037] z-50 min-w-[160px]">
          <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-[#5D4037]/20">
            <span className="w-3 h-3 rounded-full inline-block border border-[#5D4037]" style={{ backgroundColor: data.color }} />
            <span className="text-sm font-black">{data.name}</span>
          </div>
          <div className="text-[11px] font-bold text-[#5D4037]/90 space-y-1">
            <div className="flex justify-between items-center gap-3">
              <span>參與次數：</span>
              <span className="text-[#FF7043] font-black font-mono text-xs">{data.count} 次</span>
            </div>
            <div className="flex justify-between items-center gap-3">
              <span>角落使用率：</span>
              <span className="text-[#0288D1] font-black font-mono text-xs">{data.percentage}%</span>
            </div>
            {analyticsScope === 'overview' && (
              <div className="flex justify-between items-center gap-3 pt-1 border-t border-[#5D4037]/15">
                <span>探索幼兒數：</span>
                <span className="text-[#2E7D32] font-black font-mono">{data.studentCount} 位幼兒</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderRadarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#FFFBF0] border-2 border-[#5D4037] p-2.5 rounded-xl shadow-[3px_3px_0px_#5D4037] text-xs font-black text-[#5D4037] z-50">
          <div className="flex items-center gap-1.5 mb-1 pb-1 border-b border-[#5D4037]/20">
            <span className="w-2.5 h-2.5 rounded-full inline-block border border-[#5D4037]" style={{ backgroundColor: data.color }} />
            <span>{data.subject}</span>
          </div>
          <div className="text-[11px] font-bold text-[#5D4037]/90 space-y-0.5">
            <p>活動頻率：<span className="text-[#FF7043] font-black">{data.count} 次</span></p>
            <p>角落佔比：<span className="text-[#0288D1] font-black">{data.percentage}%</span></p>
            {analyticsScope === 'overview' && (
              <p>探索人數：<span className="text-[#2E7D32] font-black">{data.studentCount} 位幼兒</span></p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const computeCornerFrequencyData = () => {
    let targetRecords: LearningRecord[] = [];

    if (analyticsScope === 'single') {
      targetRecords = pieMode === 'cumulative' ? studentRecords : (activeRecord ? [activeRecord] : []);
    } else {
      targetRecords = learningRecords.filter((rec) => {
        const matchStudent = students.find((s) => s.id === rec.studentId || s.name === rec.studentName);
        if (!matchStudent) return true;
        const matchGrade = reportGradeFilter === '全部年級' || getStudentGrade(matchStudent) === reportGradeFilter;
        const matchClass = reportClassFilter === '全部班級' || matchStudent.className === reportClassFilter;
        return matchGrade && matchClass;
      });
    }
    
    const counts: Record<string, number> = {};
    const uniqueStudents: Record<string, Set<string>> = {};

    CORNER_AREAS.forEach((area) => {
      counts[area.id] = 0;
      uniqueStudents[area.id] = new Set<string>();
    });

    if (targetRecords.length > 0) {
      targetRecords.forEach((rec) => {
        const checked = rec.checkedItems || {};
        CORNER_AREAS.forEach((area) => {
          const itemsCount = (checked[area.id] || []).length;
          const noteCount = rec.customNotes?.[area.id]?.trim() ? 1 : 0;
          const totalInArea = itemsCount + noteCount;
          counts[area.id] += totalInArea;
          if (totalInArea > 0) {
            uniqueStudents[area.id].add(rec.studentId || rec.studentName || 'unknown');
          }
        });
      });
    }

    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    if (total > 0) {
      const maxVal = Math.max(...Object.values(counts), 1);
      const data = CORNER_AREAS.map((area) => {
        const val = counts[area.id] || 0;
        const percentage = Math.round((val / total) * 100);
        return {
          id: area.id,
          name: area.name,
          subject: area.name,
          count: val,
          value: val,
          studentCount: uniqueStudents[area.id]?.size || 0,
          percentage,
          color: CORNER_COLORS[area.id] || '#FFA726',
          fullMark: Math.max(maxVal + 1, 5),
        };
      });

      if (sortByUsage) {
        return [...data].sort((a, b) => b.count - a.count);
      }
      return data;
    }

    // Default sample data for demo preview if total === 0
    const demoWeights: Record<string, number> = {
      brain: 5,      // 益智區
      language: 4,   // 語文區
      blocks: 4,     // 積木區
      art: 3,        // 美勞區
      science: 3,    // 科學區
      beads: 2,      // 拼豆區
      watercolor: 2, // 水彩區
      puzzle: 2,     // 拼圖/建構區
    };
    const demoTotal = Object.values(demoWeights).reduce((a, b) => a + b, 0);

    const demoData = CORNER_AREAS.map((area) => {
      const val = demoWeights[area.id] || 1;
      const percentage = Math.round((val / demoTotal) * 100);
      return {
        id: area.id,
        name: area.name,
        subject: area.name,
        count: val,
        value: val,
        studentCount: Math.min(val, 3),
        percentage,
        color: CORNER_COLORS[area.id] || '#FFA726',
        fullMark: 6,
      };
    });

    if (sortByUsage) {
      return [...demoData].sort((a, b) => b.count - a.count);
    }
    return demoData;
  };

  const chartData = computeDomainStats(activeRecord);
  const cornerFrequencyData = computeCornerFrequencyData();
  const sortedCorners = [...cornerFrequencyData].sort((a, b) => b.count - a.count);
  const topCorner = sortedCorners.length > 0 ? sortedCorners[0] : null;
  const lowestCorner = sortedCorners.length > 0 ? sortedCorners[sortedCorners.length - 1] : null;
  const pieData = cornerFrequencyData.filter((item) => item.value > 0);
  const totalActivityCount = cornerFrequencyData.reduce((acc, curr) => acc + curr.value, 0);

  const targetScopeRecords = analyticsScope === 'single'
    ? (pieMode === 'cumulative' ? studentRecords : (activeRecord ? [activeRecord] : []))
    : learningRecords.filter((rec) => {
        const matchStudent = students.find((s) => s.id === rec.studentId || s.name === rec.studentName);
        if (!matchStudent) return true;
        const matchGrade = reportGradeFilter === '全部年級' || getStudentGrade(matchStudent) === reportGradeFilter;
        const matchClass = reportClassFilter === '全部班級' || matchStudent.className === reportClassFilter;
        return matchGrade && matchClass;
      });
  const totalUniqueStudentsCount = new Set(targetScopeRecords.map((r) => r.studentId || r.studentName)).size;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Top Filter & Print Controls (Hidden on Print) */}
      <div className="print:hidden bg-[#FFFDE7] border-4 border-[#5D4037] rounded-[2rem] p-4 sm:p-5 shadow-[6px_6px_0px_#FFD54F] mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Grade Filter Dropdown */}
          <div className="flex-1 sm:flex-none min-w-[140px]">
            <label className="block text-xs font-black text-[#5D4037] mb-1 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-[#E65100]" /> 年級篩選:
            </label>
            <select
              value={reportGradeFilter}
              onChange={(e) => {
                const newGrade = e.target.value as GradeFilterOption;
                setReportGradeFilter(newGrade);
                setReportClassFilter('全部班級');
                const filtered = students.filter(
                  (s) => newGrade === '全部年級' || getStudentGrade(s) === newGrade
                );
                if (filtered.length > 0) {
                  setSelectedStudentId(filtered[0].id);
                  const firstRec = learningRecords.find((r) => r.studentId === filtered[0].id);
                  if (firstRec) setActiveRecordId(firstRec.id);
                }
              }}
              className="w-full bg-[#FFFBF0] border-2 border-[#5D4037] font-black text-xs text-[#5D4037] rounded-xl px-3 py-2 focus:outline-none shadow-[2px_2px_0px_#5D4037] cursor-pointer"
            >
              {uniqueGradeList.map((grd) => (
                <option key={grd} value={grd}>
                  {grd === '全部年級' ? '🏫 全部年級' : `🎓 ${grd}`}
                </option>
              ))}
            </select>
          </div>

          {/* Class Filter Dropdown */}
          <div className="flex-1 sm:flex-none min-w-[140px]">
            <label className="block text-xs font-black text-[#5D4037] mb-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#7B1FA2]" /> 班級篩選:
            </label>
            <select
              value={reportClassFilter}
              onChange={(e) => {
                const newFilter = e.target.value as ClassFilterOption;
                setReportClassFilter(newFilter);
                const filtered = students.filter((s) => {
                  const matchGrade = reportGradeFilter === '全部年級' || getStudentGrade(s) === reportGradeFilter;
                  const matchClass = newFilter === '全部班級' || s.className === newFilter;
                  return matchGrade && matchClass;
                });
                if (filtered.length > 0) {
                  setSelectedStudentId(filtered[0].id);
                  const firstRec = learningRecords.find((r) => r.studentId === filtered[0].id);
                  if (firstRec) setActiveRecordId(firstRec.id);
                }
              }}
              className="w-full bg-[#FFFBF0] border-2 border-[#5D4037] font-black text-xs text-[#5D4037] rounded-xl px-3 py-2 focus:outline-none shadow-[2px_2px_0px_#5D4037] cursor-pointer"
            >
              {uniqueClassList.map((cls) => (
                <option key={cls} value={cls}>
                  {cls === '全部班級' ? '🎒 全部班級' : `🎒 ${cls}`}
                </option>
              ))}
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
                    {stu.grade || getStudentGrade(stu)} · {stu.className} - {stu.seatNumber}號 {stu.name}
                  </option>
                ))
              ) : (
                <option value="">該篩選條件尚無學生</option>
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
            onClick={handlePrintSingle}
            className="flex-1 sm:flex-none justify-center bg-[#FF8A65] hover:bg-[#FF7043] text-white font-black text-xs py-2.5 px-3.5 rounded-full border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] active:scale-95 transition-all flex items-center gap-2 cursor-pointer min-h-[40px]"
            title="另存為 A4 PDF 格式檔案"
          >
            <Printer className="w-4 h-4" /> 存PDF檔案並分享或儲存
          </button>

          <a
            href={nasStorageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none justify-center bg-[#0288D1] hover:bg-[#0277BD] text-white font-black text-xs py-2.5 px-3.5 rounded-full border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer min-h-[40px]"
            title="開啟愛愛幼兒園群暉 Synology NAS 儲存目錄"
          >
            <HardDrive className="w-4 h-4" /> 轉PDF後儲存至 NAS <ExternalLink className="w-3.5 h-3.5 opacity-90" />
          </a>
        </div>
      </div>

      {/* NAS Cloud Archive Quick-Access Banner (Hidden on Print) */}
      <div className="print:hidden bg-[#E0F2F1] border-3 border-[#5D4037] rounded-2xl p-3.5 shadow-[4px_4px_0px_#00796B] mb-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#00897B] text-white flex items-center justify-center border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-black text-xs sm:text-sm text-[#004D40] flex items-center gap-1">
                學生角落學習紀錄報告 ➔ 轉 PDF 後儲存至 NAS
              </span>
              <span className="bg-[#B2DFDB] text-[#004D40] text-[10px] font-black px-2 py-0.5 rounded-full border border-[#00796B]">
                Synology QuickConnect
              </span>
            </div>
            <p className="text-[11px] text-[#004D40]/80 font-bold mt-0.5">
              💡 歸檔步驟：點擊【存PDF檔案】目的地選擇「另存為 PDF」轉存 ➔ 點擊【開啟 NAS 資料夾】將產生的 PDF 拖曳上傳歸檔！
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
          <a
            href={nasStorageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#00897B] hover:bg-[#00796B] text-white text-xs font-black px-3.5 py-1.5 rounded-xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            開啟 NAS 資料夾 <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={handleCopyNasUrl}
            className="bg-white hover:bg-[#E0F2F1] text-[#004D40] text-xs font-black px-3 py-1.5 rounded-xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            title="複製 NAS 專屬連結"
          >
            {copiedNasUrl ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-600" /> 已複製連結
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> 複製 NAS 網址
              </>
            )}
          </button>
        </div>
      </div>

      {/* Learning Corner Distribution Analytics Card (Hidden on Print) */}
      {(activeRecord || learningRecords.length > 0) && (
        <div className="print:hidden bg-[#E1F5FE] border-4 border-[#5D4037] rounded-[2rem] p-4 sm:p-6 shadow-[6px_6px_0px_#81D4FA] mb-6">
          {/* Card Header & Dynamic Title */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 border-b-2 border-[#5D4037]/20 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#FF8A65] text-white text-xs font-black px-2.5 py-0.5 rounded-full border border-[#5D4037]">
                  {analyticsScope === 'overview' ? '🏫 園長視角' : '🧒 幼兒個別視角'}
                </span>
                <h3 className="text-base sm:text-lg font-black text-[#5D4037] flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#FF8A65]" />
                  {analyticsScope === 'overview'
                    ? `園長總覽：各學習角落使用率與活動人次分析 (${reportGradeFilter !== '全部年級' ? reportGradeFilter : '全園'}${reportClassFilter !== '全部班級' ? ` · ${reportClassFilter}` : ''})`
                    : `${selectedStudent.name} 的學習分布圖（8 大角落參與次數與偏好）`}
                </h3>
              </div>
              <p className="text-[11px] font-bold text-[#5D4037]/80 mt-1">
                {analyticsScope === 'overview'
                  ? '即時彙整全園幼兒在各角落的探索頻率、偏好度與使用率排行，利於園長掌握各區教具活絡度與動態調整'
                  : '依據各角落觀察勾選指標與紀錄次數，視覺化呈現該幼兒在 8 大學習區的活動頻率與偏好傾向'}
              </p>
            </div>

            {/* View Mode & Scope Selectors */}
            <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
              {/* Analytics Scope Toggle (Individual vs Principal Overview) */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037]">
                <button
                  type="button"
                  onClick={() => setAnalyticsScope('single')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    analyticsScope === 'single'
                      ? 'bg-[#FF8A65] text-white shadow-[1px_1px_0px_#5D4037]'
                      : 'text-[#5D4037] hover:bg-[#FFE082]'
                  }`}
                  title="查看個別學生角落偏好"
                >
                  🧒 個別幼兒
                </button>
                <button
                  type="button"
                  onClick={() => setAnalyticsScope('overview')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    analyticsScope === 'overview'
                      ? 'bg-[#00897B] text-white shadow-[1px_1px_0px_#5D4037]'
                      : 'text-[#5D4037] hover:bg-[#FFE082]'
                  }`}
                  title="全園/班級角落使用率總覽 (園長)"
                >
                  🏫 園長總覽
                </button>
              </div>

              {/* Chart Mode Toggle */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037]">
                <button
                  type="button"
                  onClick={() => setChartViewMode('bar')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    chartViewMode === 'bar'
                      ? 'bg-[#0288D1] text-white shadow-[1px_1px_0px_#5D4037]'
                      : 'text-[#5D4037] hover:bg-[#FFE082]'
                  }`}
                  title="柱狀圖 (長條圖排行)"
                >
                  📊 柱狀圖
                </button>
                <button
                  type="button"
                  onClick={() => setChartViewMode('radar')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    chartViewMode === 'radar'
                      ? 'bg-[#0288D1] text-white shadow-[1px_1px_0px_#5D4037]'
                      : 'text-[#5D4037] hover:bg-[#FFE082]'
                  }`}
                  title="雷達圖 (多維能力偏好)"
                >
                  🎯 雷達圖
                </button>
                <button
                  type="button"
                  onClick={() => setChartViewMode('dual')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    chartViewMode === 'dual'
                      ? 'bg-[#0288D1] text-white shadow-[1px_1px_0px_#5D4037]'
                      : 'text-[#5D4037] hover:bg-[#FFE082]'
                  }`}
                  title="柱狀圖 + 雷達圖 雙圖對照"
                >
                  📈 雙圖並列
                </button>
                <button
                  type="button"
                  onClick={() => setChartViewMode('pie')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    chartViewMode === 'pie'
                      ? 'bg-[#0288D1] text-white shadow-[1px_1px_0px_#5D4037]'
                      : 'text-[#5D4037] hover:bg-[#FFE082]'
                  }`}
                  title="投入比例圓餅圖"
                >
                  🥧 圓餅圖
                </button>
              </div>

              {/* Time Scope Toggle (When in Single Student Mode) */}
              {analyticsScope === 'single' && (
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037]">
                  <button
                    type="button"
                    onClick={() => setPieMode('week')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
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
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      pieMode === 'cumulative'
                        ? 'bg-[#FF8A65] text-white shadow-[1px_1px_0px_#5D4037]'
                        : 'text-[#5D4037] hover:bg-[#FFE082]'
                    }`}
                  >
                    📚 全學期 ({studentRecords.length}週)
                  </button>
                </div>
              )}

              {/* Sort Order Toggle (for Bar / Dual view) */}
              {(chartViewMode === 'bar' || chartViewMode === 'dual') && (
                <button
                  type="button"
                  onClick={() => setSortByUsage(!sortByUsage)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-black border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] flex items-center gap-1 cursor-pointer transition-all ${
                    sortByUsage
                      ? 'bg-[#FFE082] text-[#5D4037]'
                      : 'bg-white text-[#5D4037] hover:bg-[#FFF9C4]'
                  }`}
                  title="切換依次數多寡排序或預設角落順序"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  {sortByUsage ? '依使用率排行' : '預設區位順序'}
                </button>
              )}
            </div>
          </div>

          {/* Quick KPI Highlight Tiles for Kindergarten Principal */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-white p-3 rounded-2xl border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037] flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FFE082] text-[#E65100] flex items-center justify-center font-black border border-[#5D4037] shrink-0 text-base shadow-sm">
                🏆
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-[#5D4037]/70 font-black block">最熱門角落 (No.1)</span>
                <span className="text-xs font-black text-[#E65100] truncate block">
                  {topCorner ? `${topCorner.name} (${topCorner.count}次)` : '暫無'}
                </span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037] flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#E1F5FE] text-[#0288D1] flex items-center justify-center font-black border border-[#5D4037] shrink-0 text-base shadow-sm">
                💡
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-[#5D4037]/70 font-black block">建議加強引導角落</span>
                <span className="text-xs font-black text-[#0288D1] truncate block">
                  {lowestCorner ? `${lowestCorner.name} (${lowestCorner.count}次)` : '暫無'}
                </span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037] flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#F1F8E9] text-[#33691E] flex items-center justify-center font-black border border-[#5D4037] shrink-0 text-base shadow-sm">
                📊
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-[#5D4037]/70 font-black block">角落探索總次數</span>
                <span className="text-xs font-black text-[#2E7D32] block font-mono">
                  {totalActivityCount} 次紀錄
                </span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037] flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FCE4EC] text-[#C2185B] flex items-center justify-center font-black border border-[#5D4037] shrink-0 text-base shadow-sm">
                🧒
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-[#5D4037]/70 font-black block">
                  {analyticsScope === 'overview' ? '涵蓋幼兒數' : '觀察模式'}
                </span>
                <span className="text-xs font-black text-[#C2185B] block truncate font-mono">
                  {analyticsScope === 'overview' ? `${totalUniqueStudentsCount} 位幼兒` : (pieMode === 'week' ? '本週單週' : '全學期累積')}
                </span>
              </div>
            </div>
          </div>

          {/* Grid of Analytics Panels */}
          <div className={`grid gap-5 mb-4 ${chartViewMode === 'dual' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            
            {/* Panel 1: Bar Chart (各學習角落參與次數與使用率柱狀圖) */}
            {(chartViewMode === 'dual' || chartViewMode === 'bar') && (
              <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📊</span>
                    <span className="font-black text-xs sm:text-sm text-[#5D4037]">
                      8 大學習角落參與次數與使用率（柱狀圖）
                    </span>
                  </div>
                  <span className="text-[10px] bg-[#E1F5FE] text-[#0288D1] px-2 py-0.5 rounded-full font-black border border-[#0288D1]">
                    {sortByUsage ? '依熱門度排序' : '依區域順序'}
                  </span>
                </div>

                <p className="text-[11px] text-[#5D4037]/70 font-bold mb-3">
                  直觀掌握各學習角落之幼兒參與人次與熱絡程度（滑鼠懸停可查看該區使用率與詳細次數）
                </p>

                {/* Recharts Bar Chart Container */}
                <div className="h-[270px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={cornerFrequencyData}
                      margin={{ top: 15, right: 15, left: -20, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E0D6CE" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#5D4037', fontSize: 11, fontWeight: 'bold' }}
                        interval={0}
                        angle={-18}
                        textAnchor="end"
                      />
                      <YAxis
                        tick={{ fill: '#5D4037', fontSize: 10, fontWeight: 'bold' }}
                        allowDecimals={false}
                      />
                      <Tooltip content={renderBarTooltip} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} name="參與次數">
                        {cornerFrequencyData.map((entry) => (
                          <Cell
                            key={entry.id}
                            fill={entry.color}
                            stroke="#5D4037"
                            strokeWidth={1.5}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Badges strip with rank indicators */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-3 border-t border-[#5D4037]/15">
                  {cornerFrequencyData.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border border-[#5D4037]/30 bg-[#FFFBF0] hover:bg-[#FFE082]/40 transition-colors"
                      title={`${item.name}：${item.count}次 (${item.percentage}%)`}
                    >
                      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: item.color }} />
                      <span className="text-[#5D4037]">{item.name}</span>
                      <span className="text-[#0288D1] font-mono">{item.count}次</span>
                      <span className="text-[#8D6E63] font-mono text-[9px]">({item.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Panel 2: Radar Chart (8-Corner Activity Frequency & Preference Radar) */}
            {(chartViewMode === 'dual' || chartViewMode === 'radar') && (
              <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎯</span>
                    <span className="font-black text-xs sm:text-sm text-[#5D4037]">
                      學習角落多維能力探索偏好（雷達圖）
                    </span>
                  </div>
                  <span className="text-[10px] bg-[#FFE082] px-2 py-0.5 rounded-full font-black text-[#5D4037] border border-[#5D4037]">
                    8 面向均衡度
                  </span>
                </div>

                <p className="text-[11px] text-[#5D4037]/70 font-bold mb-2">
                  透視幼兒在認知益智、語文表達、藝術美勞與空間建構等多重角落之發展均衡度
                </p>

                <div className="h-[270px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="68%" data={cornerFrequencyData}>
                      <PolarGrid stroke="#BCAAA4" strokeDasharray="3 3" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#5D4037', fontSize: 11, fontWeight: 'bold' }}
                      />
                      <PolarRadiusAxis angle={30} stroke="#8D6E63" strokeOpacity={0.6} tick={{ fill: '#8D6E63', fontSize: 9 }} />
                      <Radar
                        name="參與頻率"
                        dataKey="count"
                        stroke="#FF7043"
                        strokeWidth={2.5}
                        fill="#FF8A65"
                        fillOpacity={0.45}
                      />
                      <Tooltip content={renderRadarTooltip} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Corner Frequency Legend Badges */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-3 border-t border-[#5D4037]/15">
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

            {/* Panel 3: Pie Chart (Corner Categories Distribution) */}
            {chartViewMode === 'pie' && (
              <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-black text-xs sm:text-sm text-[#5D4037] flex items-center gap-1.5">
                    <PieIcon className="w-4 h-4 text-[#0288D1]" /> 各角落活動投入比例（圓餅圖）
                  </span>
                  {topCorner && (
                    <span className="text-[10px] bg-[#E1F5FE] text-[#0288D1] px-2 py-0.5 rounded-full font-black border border-[#0288D1]">
                      🏆 最熱衷：{topCorner.name} ({topCorner.percentage}%)
                    </span>
                  )}
                </div>

                {pieData.length > 0 ? (
                  <div className="h-[270px] w-full flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={95}
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
                  <div className="h-[270px] flex items-center justify-center text-xs font-bold text-[#5D4037]/70 italic">
                    此區間尚無角落觀察指標紀錄
                  </div>
                )}

                {/* Pie Chart Legend Chips */}
                {pieData.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-3 border-t border-[#5D4037]/15">
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

          {/* Bottom Insights & Principal Guidance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 bg-white rounded-2xl border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037]">
              <span className="font-black text-[#FF8A65] flex items-center gap-1.5 mb-1.5 text-xs">
                <Sparkles className="w-4 h-4 text-[#FF8A65]" />
                {analyticsScope === 'overview' ? '園務角落活絡度綜合評估：' : '各角落探索偏好分析：'}
              </span>
              <p className="text-[#5D4037] font-bold leading-relaxed">
                {analyticsScope === 'overview' ? (
                  <>
                    統計顯示，全園/班級在 8 大學習區累積有{' '}
                    <strong className="text-[#FF8A65] font-black">{totalActivityCount}</strong>{' '}
                    次幼兒自主探索紀錄。目前以「
                    <strong className="text-[#E65100] font-black">{topCorner?.name || '益智區'}</strong>
                    」使用率最高 ({topCorner?.count || 0} 次，佔比 {topCorner?.percentage || 0}%)；而「
                    <strong className="text-[#0288D1] font-black">{lowestCorner?.name || '水彩區'}</strong>
                    」參與次數相對較少，建議園長與教務老師可評估是否更新教具或安排引導活動。
                  </>
                ) : (
                  <>
                    {selectedStudent.name} 在{pieMode === 'cumulative' ? '全學期累積觀察中' : '本週角落學習期間'}，共於 8 大學習區留下{' '}
                    <strong className="text-[#FF8A65] font-black">{totalActivityCount}</strong>{' '}
                    次活動紀錄。{topCorner ? `其中以「${topCorner.name}」參與頻率最高 (${topCorner.count}次，佔比 ${topCorner.percentage}%)！` : '展現廣泛且均衡的角落探索興趣！'}
                  </>
                )}
              </p>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037]">
              <span className="font-black text-[#0288D1] flex items-center gap-1.5 mb-1.5 text-xs">
                <Compass className="w-4 h-4 text-[#0288D1]" />
                {analyticsScope === 'overview' ? '園長教務指導與備料建議：' : '老師個別輔導回饋：'}
              </span>
              <p className="text-[#5D4037] font-bold leading-relaxed">
                {analyticsScope === 'overview' ? (
                  <>
                    📌 <strong className="text-[#004D40]">教具輪替建議</strong>：對於使用率較高的熱門角落，請巡檢消耗品與教具磨損；使用率較低的角落可於晨會活動中進行情境示範引導，激發幼兒主動探索動機。
                  </>
                ) : (
                  activeRecord?.teacherComment || '學習態度非常良好，樂於探索各項角落教材，並能與同儕友善協作。'
                )}
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
    </div>
  );
};
