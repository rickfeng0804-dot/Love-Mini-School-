import React, { useState } from 'react';
import { Student, LearningRecord, CornerAreaId, getStudentGrade } from '../types';
import { CORNER_AREAS } from '../data/initialData';
import { 
  generateCurrentFormObservationCsv, 
  generateLearningRecordsCsv, 
  generateGoogleSheetsChecklistCsv,
  createRecordFromFormState,
  downloadCsv,
  getAllCornerItems
} from '../lib/csvExport';
import { DEFAULT_SPREADSHEET_ID, DEFAULT_SPREADSHEET_URL } from '../lib/googleSheets';
import { 
  X, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Check, 
  Sparkles, 
  ExternalLink,
  Users,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
  TableProperties,
  ListFilter,
  Layers,
  Edit3
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CornerCsvExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Current Form State
  currentStudent: Student;
  currentDateStart: string;
  currentDateEnd: string;
  currentCheckedItems: Record<CornerAreaId, string[]>;
  currentCustomNotes: Record<CornerAreaId, string>;
  currentTeacherComment: string;
  currentStamp: string;
  currentPhotoImages: string[];
  currentVideoUrls: string[];
  // Global & Filtered Records
  learningRecords: LearningRecord[];
  students: Student[];
  currentGradeFilter: string;
  currentClassFilter: string;
}

export const CornerCsvExportModal: React.FC<CornerCsvExportModalProps> = ({
  isOpen,
  onClose,
  currentStudent,
  currentDateStart,
  currentDateEnd,
  currentCheckedItems,
  currentCustomNotes,
  currentTeacherComment,
  currentStamp,
  currentPhotoImages,
  currentVideoUrls,
  learningRecords,
  students,
  currentGradeFilter,
  currentClassFilter,
}) => {
  const [downloadSuccessType, setDownloadSuccessType] = useState<string | null>(null);
  const [markSymbol, setMarkSymbol] = useState<string>('V');
  const [showItemsList, setShowItemsList] = useState<boolean>(false);
  const [exportFormatTab, setExportFormatTab] = useState<'checklist' | 'wide'>('checklist');

  if (!isOpen) return null;

  const allItems = getAllCornerItems();

  // Calculate stats for current form
  let currentTotalChecked = 0;
  let currentNotesCount = 0;
  CORNER_AREAS.forEach((area) => {
    const items = currentCheckedItems[area.id] || [];
    currentTotalChecked += items.length;
    if (currentCustomNotes[area.id] && currentCustomNotes[area.id].trim()) {
      currentNotesCount += 1;
    }
  });

  // Calculate filtered records for class/grade
  const classFilteredRecords = learningRecords.filter((rec) => {
    const matchedStudent = students.find((s) => s.id === rec.studentId);
    const recGrade = matchedStudent ? getStudentGrade(matchedStudent) : (rec.className.includes('大') ? '大班' : rec.className.includes('中') ? '中班' : '小班');
    const matchGrade = currentGradeFilter === '全部年級' || recGrade === currentGradeFilter;
    const matchClass = currentClassFilter === '全部班級' || rec.className === currentClassFilter;
    return matchGrade && matchClass;
  });

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#FFB74D', '#81C784', '#4FC3F7', '#FF8A65']
      });
    } catch {}
  };

  // Helper to create current record object
  const currentRecordObject = createRecordFromFormState({
    student: currentStudent,
    dateStart: currentDateStart,
    dateEnd: currentDateEnd,
    checkedItems: currentCheckedItems,
    customNotes: currentCustomNotes,
    teacherComment: currentTeacherComment,
    stamp: currentStamp,
    photoImages: currentPhotoImages,
    videoUrls: currentVideoUrls,
  });

  // 1. Export Current Form - Vertical 48 Items Checklist CSV
  const handleExportCurrentFormChecklist = () => {
    const csvContent = generateGoogleSheetsChecklistCsv([currentRecordObject], students, markSymbol);
    const safeDate = currentDateStart.replace(/[^0-9-]/g, '');
    const filename = `愛愛幼兒園_角落學習48項指標清單_${currentStudent.className}_${currentStudent.name}_${safeDate}.csv`;
    downloadCsv(filename, csvContent);
    triggerCelebration();
    setDownloadSuccessType('current-checklist');
    setTimeout(() => setDownloadSuccessType(null), 3500);
  };

  // 2. Export Current Form - Standard Full Form with all 48 items CSV
  const handleExportCurrentFormFull = () => {
    const csvContent = generateCurrentFormObservationCsv({
      student: currentStudent,
      dateStart: currentDateStart,
      dateEnd: currentDateEnd,
      checkedItems: currentCheckedItems,
      customNotes: currentCustomNotes,
      teacherComment: currentTeacherComment,
      stamp: currentStamp,
      photoImages: currentPhotoImages,
      videoUrls: currentVideoUrls,
      markSymbol,
    });

    const safeDate = currentDateStart.replace(/[^0-9-]/g, '');
    const filename = `愛愛幼兒園_角落觀察紀錄_${currentStudent.className}_${currentStudent.name}_${safeDate}.csv`;
    downloadCsv(filename, csvContent);
    triggerCelebration();
    setDownloadSuccessType('current-full');
    setTimeout(() => setDownloadSuccessType(null), 3500);
  };

  // 3. Export Current Form - Wide format (Single Child, 48 items columns)
  const handleExportCurrentFormWide = () => {
    const csvContent = generateLearningRecordsCsv([currentRecordObject], students, markSymbol);
    const safeDate = currentDateStart.replace(/[^0-9-]/g, '');
    const filename = `愛愛幼兒園_角落學習全展開寬表_${currentStudent.className}_${currentStudent.name}_${safeDate}.csv`;
    downloadCsv(filename, csvContent);
    triggerCelebration();
    setDownloadSuccessType('current-wide');
    setTimeout(() => setDownloadSuccessType(null), 3500);
  };

  // 4. Export Class Records - Wide format (all 48 items columns)
  const handleExportClassRecords = () => {
    const targetRecords = classFilteredRecords.length > 0 ? classFilteredRecords : learningRecords;
    const csvContent = generateLearningRecordsCsv(targetRecords, students, markSymbol);
    const filterTag = currentClassFilter !== '全部班級' ? currentClassFilter : currentGradeFilter;
    const filename = `愛愛幼兒園_角落觀察全展開_${filterTag}_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCsv(filename, csvContent);
    triggerCelebration();
    setDownloadSuccessType('class');
    setTimeout(() => setDownloadSuccessType(null), 3500);
  };

  // 5. Export All Records - Wide format (all 48 items columns)
  const handleExportAllRecords = () => {
    const csvContent = generateLearningRecordsCsv(learningRecords, students, markSymbol);
    const filename = `愛愛幼兒園_角落學習紀錄總表_8區48項全展開_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCsv(filename, csvContent);
    triggerCelebration();
    setDownloadSuccessType('all');
    setTimeout(() => setDownloadSuccessType(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-[#FFFBF0] border-4 border-[#5D4037] rounded-[2rem] shadow-[12px_12px_0px_#5D4037] max-w-4xl w-full p-5 md:p-6 relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white hover:bg-[#FFCDD2] text-[#5D4037] p-2 rounded-full border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-[#FFE082] border-2 border-[#5D4037] rounded-2xl shadow-[3px_3px_0px_#5D4037]">
            <FileSpreadsheet className="w-7 h-7 text-[#5D4037]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <span className="bg-[#5D4037] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
                8 大學習區 48 個項目全展開
              </span>
              <span className="bg-[#2E7D32] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full border border-[#5D4037]">
                Google Sheet 編輯相容 (UTF-8 BOM)
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-[#5D4037] italic flex items-center gap-2">
              觀察紀錄 CSV 匯出選單
              <Sparkles className="w-5 h-5 text-[#FFB74D] animate-spin" />
            </h2>
          </div>
        </div>

        {/* Google Sheets Compatibility Alert Banner */}
        <div className="mb-4 bg-[#E8F5E9] border-2 border-[#2E7D32] rounded-2xl p-3.5 shadow-[3px_3px_0px_#2E7D32] text-xs font-bold text-[#1B5E20] flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5">
          <div className="flex items-start gap-2">
            <Edit3 className="w-5 h-5 text-[#2E7D32] shrink-0 mt-0.5" />
            <div>
              <div className="font-black text-sm text-[#1B5E20]">
                8 大角落所有 48 項能力指標皆已獨立列出，可直接在 Google Sheet 修改！
              </div>
              <p className="text-[11px] text-[#2E7D32]/90 mt-0.5">
                匯出後可於 Google 試算表直接打勾填寫「{markSymbol}」或取消、修改各區個別筆記與老師評語。
              </p>
            </div>
          </div>
          <a
            href="https://sheets.new"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-black py-1.5 px-3 rounded-xl border border-[#5D4037] shadow-[2px_2px_0px_#5D4037] shrink-0 transition-all"
          >
            開啟 Google 試算表 ↗
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Settings Bar: Mark Symbol & Expand 48 Items */}
        <div className="bg-white border-2 border-[#5D4037] rounded-2xl p-3 shadow-[3px_3px_0px_#5D4037] mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-black text-[#5D4037]">
            <span>🎯 勾選標記符號：</span>
            <div className="inline-flex rounded-xl border-2 border-[#5D4037] p-0.5 bg-[#FFF8E1]">
              <button
                type="button"
                onClick={() => setMarkSymbol('V')}
                className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all ${
                  markSymbol === 'V'
                    ? 'bg-[#5D4037] text-white shadow-xs'
                    : 'text-[#5D4037] hover:bg-[#FFE082]'
                }`}
                title="標準打勾符號 (V)"
              >
                V (打勾)
              </button>
              <button
                type="button"
                onClick={() => setMarkSymbol('是')}
                className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all ${
                  markSymbol === '是'
                    ? 'bg-[#5D4037] text-white shadow-xs'
                    : 'text-[#5D4037] hover:bg-[#FFE082]'
                }`}
                title="文字標記 (是)"
              >
                是 (文字)
              </button>
              <button
                type="button"
                onClick={() => setMarkSymbol('1')}
                className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all ${
                  markSymbol === '1'
                    ? 'bg-[#5D4037] text-white shadow-xs'
                    : 'text-[#5D4037] hover:bg-[#FFE082]'
                }`}
                title="數字標記 (1)，適合 Google Sheet 使用 SUM 計算總分"
              >
                1 (數值)
              </button>
            </div>
          </div>

          {/* Toggle View 48 Items */}
          <button
            type="button"
            onClick={() => setShowItemsList(!showItemsList)}
            className="text-xs font-black text-[#5D4037] hover:text-[#E65100] flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-[#FFF3E0] border border-[#5D4037]/30 hover:bg-[#FFE082] transition-all cursor-pointer"
          >
            <ListFilter className="w-3.5 h-3.5 text-[#E65100]" />
            {showItemsList ? '收合 48 個項目清單' : '預覽 8 大區 48 個能力項目'}
            {showItemsList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Expandable 48 Items Preview List */}
        {showItemsList && (
          <div className="mb-4 bg-white border-2 border-[#5D4037] rounded-2xl p-3.5 shadow-[3px_3px_0px_#5D4037] animate-fade-in text-xs">
            <div className="flex items-center justify-between border-b border-[#5D4037]/20 pb-2 mb-2 font-black text-[#5D4037]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
                8 大學習角落共 {allItems.length} 個能力指標（已全數收錄於 CSV 中）：
              </span>
              <span className="text-[11px] text-[#5D4037]/70 font-bold">
                每區皆附專屬「觀察筆記」欄位
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {CORNER_AREAS.map((area) => (
                <div key={area.id} className="bg-[#FFFDF7] border border-[#5D4037]/30 rounded-xl p-2">
                  <div className="font-black text-[#5D4037] flex items-center justify-between border-b border-[#5D4037]/15 pb-1 mb-1.5">
                    <span>{area.name}</span>
                    <span className="bg-[#5D4037]/10 text-[#5D4037] text-[10px] px-1.5 py-0.2 rounded font-bold">
                      {area.items.length} 項
                    </span>
                  </div>
                  <ul className="space-y-1 text-[11px] text-[#5D4037]/80">
                    {area.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1">
                        <span className="text-[#E65100] font-black shrink-0">•</span>
                        <span className="leading-tight">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Toast */}
        {downloadSuccessType && (
          <div className="mb-4 p-3 bg-[#E8F5E9] border-2 border-[#2E7D32] rounded-2xl flex items-center gap-2 text-xs font-black text-[#2E7D32] shadow-[3px_3px_0px_#2E7D32] animate-fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>
              {downloadSuccessType === 'current-checklist'
                ? `🎉 已成功匯出「${currentStudent.name}」48 項逐項檢核清單 CSV！可在 Google Sheet 逐行打勾修改。`
                : downloadSuccessType === 'current-full'
                ? `🎉 已成功匯出「${currentStudent.name}」觀察紀錄完整清單 CSV（含 48 項指標明細、多媒體與評語）！`
                : downloadSuccessType === 'current-wide'
                ? `🎉 已成功匯出「${currentStudent.name}」48 項全展開橫向寬表 CSV！`
                : downloadSuccessType === 'class'
                ? `🎉 已成功匯出班級全展開觀察紀錄 CSV（共 ${classFilteredRecords.length} 筆，每筆展開 48 項能力）！`
                : `🎉 已成功匯出全園歷次學習紀錄總表 CSV（共 ${learningRecords.length} 筆，每筆展開 48 項能力）！`}
            </span>
          </div>
        )}

        {/* Export Options Grid */}
        <div className="space-y-4 mb-6">
          {/* Group 1: Current Child / Current Form Exports */}
          <div className="bg-white border-3 border-[#5D4037] rounded-2xl p-4 shadow-[4px_4px_0px_#5D4037]">
            <div className="flex items-center justify-between border-b border-[#5D4037]/15 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="bg-[#FF8A65] text-white font-black text-xs px-2.5 py-0.5 rounded-full border border-[#5D4037]">
                  當前填寫幼兒
                </span>
                <h3 className="font-black text-base text-[#5D4037] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#FF8A65]" />
                  目前表單紀錄（{currentStudent.name} · {getStudentGrade(currentStudent)} {currentStudent.className}）
                </h3>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-black text-[#5D4037]">
                <span className="bg-[#FFF8E1] px-2 py-0.5 rounded-lg border border-[#5D4037]/30">
                  已勾選 {currentTotalChecked} 項 / 共 48 項
                </span>
              </div>
            </div>

            <p className="text-xs text-[#5D4037]/80 font-bold mb-3">
              提供兩種 Google Sheet 最佳化格式，將 8 大角落的 48 個項目完整列出，方便在試算表直接編輯：
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Option 1A: 48 Items Vertical Checklist (Best for direct Google Sheet cell check) */}
              <div className="bg-[#FFF8E1] border-2 border-[#5D4037] rounded-xl p-3 flex flex-col justify-between hover:shadow-[3px_3px_0px_#5D4037] transition-all">
                <div className="space-y-1 mb-3">
                  <div className="flex items-center gap-1.5 font-black text-xs text-[#5D4037]">
                    <ListFilter className="w-4 h-4 text-[#E65100]" />
                    【推薦】8 區 48 項目逐項檢核清單（48 列明細）
                  </div>
                  <p className="text-[11px] text-[#5D4037]/80 font-bold leading-relaxed">
                    將 48 個能力項目逐行展開為 48 列。在 Google Sheet 裡可直接針對每一個項目輸入「{markSymbol}」打勾或刪除取消，並即時修改該區筆記！
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportCurrentFormChecklist}
                  className="w-full bg-[#E65100] hover:bg-[#BF360C] text-white font-black text-xs py-2 px-3 rounded-xl border border-[#5D4037] shadow-[2px_2px_0px_#5D4037] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> 匯出 48 項逐列檢核清單 CSV 📄
                </button>
              </div>

              {/* Option 1B: 48 Items Horizontal Wide Table (Single Record) */}
              <div className="bg-[#E0F2F1] border-2 border-[#5D4037] rounded-xl p-3 flex flex-col justify-between hover:shadow-[3px_3px_0px_#5D4037] transition-all">
                <div className="space-y-1 mb-3">
                  <div className="flex items-center gap-1.5 font-black text-xs text-[#004D40]">
                    <TableProperties className="w-4 h-4 text-[#00695C]" />
                    8 區 48 項目全展開橫向寬表（獨立 48 欄）
                  </div>
                  <p className="text-[11px] text-[#004D40]/80 font-bold leading-relaxed">
                    單一列紀錄，每個能力指標各自佔一欄位（如 <code className="bg-white/60 px-1 rounded">[語文區] 聽覺專注...</code>），適合橫向比對與試算表欄位分析。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportCurrentFormWide}
                  className="w-full bg-[#00695C] hover:bg-[#004D40] text-white font-black text-xs py-2 px-3 rounded-xl border border-[#5D4037] shadow-[2px_2px_0px_#5D4037] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> 匯出全展開單人橫表 CSV 📑
                </button>
              </div>
            </div>
          </div>

          {/* Group 2: Class/Grade Records - 48 Items Expanded */}
          <div className="bg-white border-2 border-[#5D4037] rounded-2xl p-4 shadow-[4px_4px_0px_#5D4037] hover:shadow-[6px_6px_0px_#5D4037] transition-all">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-[#CE93D8] text-[#4A148C] font-black text-xs px-2.5 py-0.5 rounded-full border border-[#5D4037]">
                    班級篩選總表
                  </span>
                  <h3 className="font-black text-sm md:text-base text-[#5D4037] flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-[#8E24AA]" />
                    匯出當前班級歷次觀察紀錄（{currentGradeFilter} · {currentClassFilter}）
                  </h3>
                </div>
                <p className="text-xs text-[#5D4037]/80 font-bold">
                  每列一位幼兒，<strong>8 大角落 48 項能力全部展開為獨立欄位</strong>，加上 8 區自訂筆記與評語，可在 Google Sheet 批次填寫、修改或統計全班表現。
                </p>
                <div className="text-[11px] font-bold text-[#8E24AA]">
                  📊 符合篩選條件：共 {classFilteredRecords.length} 筆觀察紀錄
                </div>
              </div>

              <button
                type="button"
                onClick={handleExportClassRecords}
                className="w-full md:w-auto bg-[#CE93D8] hover:bg-[#BA68C8] text-[#4A148C] font-black text-xs py-2.5 px-4 rounded-xl border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037] active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" /> 匯出班級 48 項展開 CSV
              </button>
            </div>
          </div>

          {/* Group 3: All Learning Records - Full Kindergarten Database */}
          <div className="bg-white border-2 border-[#5D4037] rounded-2xl p-4 shadow-[4px_4px_0px_#5D4037] hover:shadow-[6px_6px_0px_#5D4037] transition-all">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-[#81C784] text-[#1B5E20] font-black text-xs px-2.5 py-0.5 rounded-full border border-[#5D4037]">
                    全園完整資料庫
                  </span>
                  <h3 className="font-black text-sm md:text-base text-[#5D4037] flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#2E7D32]" />
                    匯出全園歷次角落學習紀錄總表（8 區 48 項目全展開總表）
                  </h3>
                </div>
                <p className="text-xs text-[#5D4037]/80 font-bold">
                  包含全校各班幼兒所有歷史紀錄，全部展開 48 個獨立能力欄位，可在 Google Sheets 進行幼兒園全校評量統計、大數據樞紐分析。
                </p>
                <div className="text-[11px] font-bold text-[#2E7D32]">
                  📚 系統內總紀錄：共 {learningRecords.length} 筆觀察紀錄
                </div>
              </div>

              <button
                type="button"
                onClick={handleExportAllRecords}
                className="w-full md:w-auto bg-[#81C784] hover:bg-[#66BB6A] text-[#1B5E20] font-black text-xs py-2.5 px-4 rounded-xl border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037] active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" /> 匯出全園 48 項展開 CSV
              </button>
            </div>
          </div>
        </div>

        {/* Step-by-Step Google Sheets Guide */}
        <div className="bg-[#FFF3E0] border-2 border-[#5D4037] rounded-2xl p-4 shadow-[3px_3px_0px_#5D4037] text-xs font-bold text-[#5D4037] space-y-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-black text-sm text-[#E65100]">
              <Info className="w-4 h-4" />
              💡 如何在 Google 試算表（Google Sheets）查看與修改內容？
            </div>
            <div className="flex items-center gap-2">
              <a
                href={DEFAULT_SPREADSHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white px-2.5 py-1 rounded-lg font-black text-[11px] flex items-center gap-1 shadow-xs"
                title="直接開啟系統預設同步的 Google 試算表"
              >
                前往預設 Google Sheet ↗
              </a>
              <a
                href="https://sheets.new"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#E65100] hover:underline font-black text-[11px] flex items-center gap-1"
              >
                開啟空白試算表 ↗
              </a>
            </div>
          </div>

          <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-[#5D4037]/90 leading-relaxed pl-1">
            <li>
              <strong>直接線上同步與修改</strong>：資料已與預設 Google Sheet (ID: <code>1jFe492XljTkDx3A4fLWBX1PEy4J7Q7TffNLQiVlJI6c</code>) 連線，直接前往該試算表即可即時查看或編輯已同步之 8 大區 48 項指標！
            </li>
            <li>
              <strong>或透過 CSV 自訂匯入</strong>：點選上方按鈕<strong>下載 CSV 檔案</strong>（已自動內建 UTF-8 BOM，不論以 Excel 或 Google Sheets 開啟皆<strong>清晰繁體中文、完全不亂碼</strong>）。
            </li>
            <li>
              打開瀏覽器前往 <strong>Google 試算表 (sheets.new)</strong>。
            </li>
            <li>
              在 Google 試算表上方功能表點擊：<strong>「檔案」➔「匯入」➔ 選擇「上傳」分頁</strong>，選取剛下載的 CSV。
            </li>
            <li>
              匯入位置選擇<strong>「取代現有工作表」</strong>，即可看到 8 大學習區 48 項指標整齊排列，您可隨意修改勾選標記（填寫或刪除「{markSymbol}」）、修改個別筆記與老師評語！
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

