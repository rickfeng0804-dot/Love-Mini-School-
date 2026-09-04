import React, { useState } from 'react';
import { Student, LearningRecord, CornerAreaId, getStudentGrade } from '../types';
import { CORNER_AREAS } from '../data/initialData';
import { 
  generateCurrentFormObservationCsv, 
  generateLearningRecordsCsv, 
  downloadCsv 
} from '../lib/csvExport';
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
  Info
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

  if (!isOpen) return null;

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

  // 1. Export Current Form Data
  const handleExportCurrentForm = () => {
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
    });

    const safeDate = currentDateStart.replace(/[^0-9-]/g, '');
    const filename = `愛愛幼兒園_角落學習觀察紀錄_${currentStudent.className}_${currentStudent.name}_${safeDate}.csv`;
    downloadCsv(filename, csvContent);
    triggerCelebration();
    setDownloadSuccessType('current');
    setTimeout(() => setDownloadSuccessType(null), 3500);
  };

  // 2. Export Filtered Records (Class / Grade)
  const handleExportClassRecords = () => {
    const targetRecords = classFilteredRecords.length > 0 ? classFilteredRecords : learningRecords;
    const csvContent = generateLearningRecordsCsv(targetRecords, students);
    const filterTag = currentClassFilter !== '全部班級' ? currentClassFilter : currentGradeFilter;
    const filename = `愛愛幼兒園_角落學習觀察紀錄_${filterTag}_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCsv(filename, csvContent);
    triggerCelebration();
    setDownloadSuccessType('class');
    setTimeout(() => setDownloadSuccessType(null), 3500);
  };

  // 3. Export All Learning Records
  const handleExportAllRecords = () => {
    const csvContent = generateLearningRecordsCsv(learningRecords, students);
    const filename = `愛愛幼兒園_角落學習觀察紀錄總表_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCsv(filename, csvContent);
    triggerCelebration();
    setDownloadSuccessType('all');
    setTimeout(() => setDownloadSuccessType(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-[#FFFBF0] border-4 border-[#5D4037] rounded-[2rem] shadow-[12px_12px_0px_#5D4037] max-w-3xl w-full p-6 relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white hover:bg-[#FFCDD2] text-[#5D4037] p-2 rounded-full border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-[#FFE082] border-2 border-[#5D4037] rounded-2xl shadow-[3px_3px_0px_#5D4037]">
            <FileSpreadsheet className="w-7 h-7 text-[#5D4037]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="bg-[#5D4037] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
                角落學習觀察紀錄
              </span>
              <span className="bg-[#4CAF50] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full border border-[#5D4037]">
                UTF-8 BOM (Excel 中文防亂碼)
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-[#5D4037] italic flex items-center gap-2">
              觀察紀錄 CSV 匯出功能
              <Sparkles className="w-5 h-5 text-[#FFB74D] animate-spin" />
            </h2>
          </div>
        </div>

        {/* Status Toast */}
        {downloadSuccessType && (
          <div className="mb-4 p-3 bg-[#E8F5E9] border-2 border-[#2E7D32] rounded-2xl flex items-center gap-2 text-xs font-black text-[#2E7D32] shadow-[3px_3px_0px_#2E7D32] animate-fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>
              {downloadSuccessType === 'current'
                ? `🎉 已成功匯出「${currentStudent.name}」當前填寫的角落觀察紀錄 CSV 檔案！`
                : downloadSuccessType === 'class'
                ? `🎉 已成功匯出班級觀察紀錄 CSV 檔案（共 ${classFilteredRecords.length} 筆紀錄）！`
                : `🎉 已成功匯出全園歷次角落學習紀錄總表 CSV（共 ${learningRecords.length} 筆紀錄）！`}
            </span>
          </div>
        )}

        {/* Three Export Options Grid */}
        <div className="space-y-4 mb-6">
          {/* Option 1: Current Form Record (Direct Export) */}
          <div className="bg-white border-3 border-[#5D4037] rounded-2xl p-4 shadow-[4px_4px_0px_#5D4037] hover:shadow-[6px_6px_0px_#5D4037] transition-all">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-[#FF8A65] text-white font-black text-xs px-2.5 py-0.5 rounded-full border border-[#5D4037]">
                    即時草稿 / 當前填寫
                  </span>
                  <h3 className="font-black text-base text-[#5D4037] flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#FF8A65]" />
                    匯出目前表單觀察紀錄（單筆 CSV）
                  </h3>
                </div>
                <p className="text-xs text-[#5D4037]/80 font-bold">
                  直接將當前畫面上勾選的 8 大角落指標、自訂筆記、照片/影片清單與評語匯出為專屬 CSV。
                </p>

                {/* Live Preview Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-bold text-[#5D4037]">
                  <span className="bg-[#FFF8E1] px-2 py-0.5 rounded-lg border border-[#5D4037]/30">
                    🧒 幼兒：{currentStudent.name}（{getStudentGrade(currentStudent)} · {currentStudent.className} · {currentStudent.seatNumber}號）
                  </span>
                  <span className="bg-[#E0F2F1] px-2 py-0.5 rounded-lg border border-[#5D4037]/30">
                    📅 週次：{currentDateStart} ~ {currentDateEnd}
                  </span>
                  <span className="bg-[#EDE7F6] px-2 py-0.5 rounded-lg border border-[#5D4037]/30">
                    ✅ 勾選指標：{currentTotalChecked} 項
                  </span>
                  <span className="bg-[#FCE4EC] px-2 py-0.5 rounded-lg border border-[#5D4037]/30">
                    📝 角落筆記：{currentNotesCount} 則
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExportCurrentForm}
                className="w-full md:w-auto bg-[#FF8A65] hover:bg-[#FF7043] text-white font-black text-xs py-2.5 px-4 rounded-xl border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037] active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" /> 匯出此筆觀察紀錄 CSV
              </button>
            </div>
          </div>

          {/* Option 2: Class/Grade Records */}
          <div className="bg-white border-2 border-[#5D4037] rounded-2xl p-4 shadow-[4px_4px_0px_#5D4037] hover:shadow-[6px_6px_0px_#5D4037] transition-all">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-[#CE93D8] text-[#4A148C] font-black text-xs px-2.5 py-0.5 rounded-full border border-[#5D4037]">
                    班級篩選匯出
                  </span>
                  <h3 className="font-black text-sm md:text-base text-[#5D4037] flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-[#8E24AA]" />
                    匯出當前班級歷次觀察紀錄（{currentGradeFilter} · {currentClassFilter}）
                  </h3>
                </div>
                <p className="text-xs text-[#5D4037]/80 font-bold">
                  匯出符合目前篩選年級與班級的觀察紀錄，每列包含 8 大角落勾選能力與評語明細。
                </p>
                <div className="text-[11px] font-bold text-[#8E24AA]">
                  📊 符合條件資料量：共 {classFilteredRecords.length} 筆觀察紀錄
                </div>
              </div>

              <button
                type="button"
                onClick={handleExportClassRecords}
                className="w-full md:w-auto bg-[#CE93D8] hover:bg-[#BA68C8] text-[#4A148C] font-black text-xs py-2.5 px-4 rounded-xl border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037] active:scale-95 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" /> 匯出班級紀錄 CSV
              </button>
            </div>
          </div>

          {/* Option 3: All Learning Records */}
          <div className="bg-white border-2 border-[#5D4037] rounded-2xl p-4 shadow-[4px_4px_0px_#5D4037] hover:shadow-[6px_6px_0px_#5D4037] transition-all">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-[#81C784] text-[#1B5E20] font-black text-xs px-2.5 py-0.5 rounded-full border border-[#5D4037]">
                    全園總表
                  </span>
                  <h3 className="font-black text-sm md:text-base text-[#5D4037] flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#2E7D32]" />
                    匯出全園歷次角落學習紀錄總表（全校匯總 CSV）
                  </h3>
                </div>
                <p className="text-xs text-[#5D4037]/80 font-bold">
                  包含全校各班幼兒所有歷次角落探索評估，適合進行園務備份、校務評鑑與大數據分析。
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
                <Download className="w-4 h-4" /> 匯出全園總表 CSV
              </button>
            </div>
          </div>
        </div>

        {/* Feature Specifications & Instructions */}
        <div className="bg-[#FFF3E0] border-2 border-[#5D4037] rounded-2xl p-4 shadow-[3px_3px_0px_#5D4037] text-xs font-bold text-[#5D4037] space-y-2">
          <div className="flex items-center gap-1.5 font-black text-sm text-[#E65100]">
            <Info className="w-4 h-4" />
            CSV 格式與匯入使用說明：
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-[#5D4037]/90 leading-relaxed">
            <li>
              <strong>UTF-8 BOM 支援</strong>：匯出檔案內嵌微軟相容 UTF-8 BOM 識別頭碼，以 Windows 或 Mac 上的 <strong>Microsoft Excel</strong> 點兩下開啟時，繁體中文不亂碼。
            </li>
            <li>
              <strong>完整 8 大角落欄位</strong>：包含語文區、水彩區、美勞區、拼豆區、科學區、益智區、拼圖區、積木區各自的勾選能力、筆記備註、照片影片 URL 與總結評語。
            </li>
            <li>
              <strong>相容 Google 試算表</strong>：可於 Google 試算表中選擇「檔案」➔「匯入」➔「上傳」，即可無縫整合至雲端試算表。
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
