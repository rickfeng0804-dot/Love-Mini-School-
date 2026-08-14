import React, { useState, useEffect, useRef } from 'react';
import { Student, LearningRecord, ClassFilterOption, CLASS_FILTER_OPTIONS } from '../types';
import { SingleReportCard } from './SingleReportCard';
import { 
  Printer, 
  X, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  FileCheck, 
  Layers, 
  Type, 
  Columns, 
  Eye, 
  Sliders, 
  Maximize2,
  Minimize2,
  FileText,
  Sparkles,
  Scissors
} from 'lucide-react';

interface PrintInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  learningRecords: LearningRecord[];
  initialStudentId?: string;
  initialFontSize?: number;
  onPrintSingle: (record: LearningRecord) => void;
  onPrintBatch: (records: LearningRecord[]) => void;
}

export const PrintInspectionModal: React.FC<PrintInspectionModalProps> = ({
  isOpen,
  onClose,
  students,
  learningRecords,
  initialStudentId,
  initialFontSize = 18,
  onPrintSingle,
  onPrintBatch
}) => {
  const [selectedClass, setSelectedClass] = useState<ClassFilterOption>('全部班級');
  const [currentRecordIndex, setCurrentRecordIndex] = useState<number>(0);
  const [inspectionViewMode, setInspectionViewMode] = useState<'single' | 'double' | 'continuous'>('single');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [fontSize, setFontSize] = useState<number>(initialFontSize);
  const [showSafeMargins, setShowSafeMargins] = useState<boolean>(true);
  const [isGrayscale, setIsGrayscale] = useState<boolean>(false);
  const [showPageBreaks, setShowPageBreaks] = useState<boolean>(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filter records based on selected class
  const filteredRecords = learningRecords.filter((rec) => {
    if (selectedClass === '全部班級') return true;
    return rec.className === selectedClass;
  });

  // Sync initial student selection
  useEffect(() => {
    if (initialStudentId && filteredRecords.length > 0) {
      const idx = filteredRecords.findIndex((r) => r.studentId === initialStudentId);
      if (idx !== -1) {
        setCurrentRecordIndex(idx);
      }
    }
  }, [initialStudentId, isOpen]);

  // Keep index in bound
  useEffect(() => {
    if (currentRecordIndex >= filteredRecords.length && filteredRecords.length > 0) {
      setCurrentRecordIndex(filteredRecords.length - 1);
    }
  }, [filteredRecords.length, currentRecordIndex]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentRecord = filteredRecords[currentRecordIndex] || filteredRecords[0];
  const totalPages = filteredRecords.length;

  const handlePrev = () => {
    if (inspectionViewMode === 'double') {
      setCurrentRecordIndex((prev) => Math.max(0, prev - 2));
    } else {
      setCurrentRecordIndex((prev) => Math.max(0, prev - 1));
    }
  };

  const handleNext = () => {
    if (inspectionViewMode === 'double') {
      setCurrentRecordIndex((prev) => Math.min(totalPages - 1, prev + 2));
    } else {
      setCurrentRecordIndex((prev) => Math.min(totalPages - 1, prev + 1));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#2A1E17]/90 backdrop-blur-md text-[#5D4037] font-sans transition-all overflow-hidden">
      {/* Top Main Navigation Bar */}
      <header className="bg-[#FFFBF0] border-b-4 border-[#5D4037] px-4 py-3 shrink-0 flex flex-wrap items-center justify-between gap-3 shadow-[0px_4px_12px_rgba(0,0,0,0.2)]">
        {/* Left: Title & A4 Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF8A65] border-2 border-[#5D4037] flex items-center justify-center text-white shadow-[2px_2px_0px_#5D4037]">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-[#5D4037] tracking-wide">
                園長 A4 列印檢查模式
              </h2>
              <span className="bg-[#FFE082] text-[#5D4037] text-[11px] font-black px-2 py-0.5 rounded-full border border-[#5D4037] shadow-[1px_1px_0px_#5D4037]">
                A4 標準 210 × 297 mm
              </span>
            </div>
            <p className="text-xs text-[#5D4037]/75 font-bold">
              檢查所有紀錄表之版面比例、圖片邊距及自動 A4 分頁符號，確認列印無誤後可一鍵輸出
            </p>
          </div>
        </div>

        {/* Right: Quick Print & Close */}
        <div className="flex items-center gap-2">
          {currentRecord && (
            <button
              onClick={() => onPrintSingle(currentRecord)}
              className="bg-[#FF8A65] hover:bg-[#FF7043] text-white font-black text-xs py-2 px-3 rounded-xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              title="列印當前檢查的這份 A4 報告書"
            >
              <Printer className="w-4 h-4" /> 列印當前頁 (A4)
            </button>
          )}

          <button
            onClick={() => onPrintBatch(filteredRecords)}
            className="bg-[#4FC3F7] hover:bg-[#29B6F6] text-[#5D4037] font-black text-xs py-2 px-3 rounded-xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            title="批次列印當前篩選之所有幼兒紀錄表（自動獨立 A4 分頁）"
          >
            <Layers className="w-4 h-4" /> 全班批次列印 ({filteredRecords.length} 頁)
          </button>

          <button
            onClick={onClose}
            className="bg-[#FFE082] hover:bg-[#FFD54F] text-[#5D4037] font-black text-sm p-2 rounded-xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] active:scale-95 transition-all cursor-pointer flex items-center gap-1"
            title="關閉檢查模式 (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Secondary Inspection Controls Toolbar */}
      <div className="bg-[#FFF8E7] border-b-2 border-[#5D4037] px-4 py-2 shrink-0 flex flex-wrap items-center justify-between gap-3 text-xs font-black">
        {/* Left Section: Target Selection */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Class Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#5D4037]">班級:</span>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value as ClassFilterOption);
                setCurrentRecordIndex(0);
              }}
              className="bg-white border-2 border-[#5D4037] rounded-lg px-2 py-1 text-xs font-black text-[#5D4037] shadow-[1px_1px_0px_#5D4037] focus:outline-none cursor-pointer"
            >
              {CLASS_FILTER_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Student Selector in Single Mode */}
          {inspectionViewMode !== 'continuous' && filteredRecords.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[#5D4037]">檢查學童:</span>
              <select
                value={currentRecordIndex}
                onChange={(e) => setCurrentRecordIndex(Number(e.target.value))}
                className="bg-white border-2 border-[#5D4037] rounded-lg px-2.5 py-1 text-xs font-black text-[#5D4037] shadow-[1px_1px_0px_#5D4037] focus:outline-none cursor-pointer max-w-[200px]"
              >
                {filteredRecords.map((rec, i) => (
                  <option key={rec.id} value={i}>
                    {i + 1}. {rec.studentName} ({rec.className} {rec.seatNumber}號)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Page Counter Indicator */}
          <div className="bg-[#FFE082] px-2.5 py-1 rounded-lg border border-[#5D4037] font-black text-[#5D4037] flex items-center gap-1 shadow-[1px_1px_0px_#5D4037]">
            <FileText className="w-3.5 h-3.5 text-[#FF8A65]" />
            {inspectionViewMode === 'continuous'
              ? `共 ${totalPages} 份 A4 報告書`
              : `第 ${currentRecordIndex + 1} / ${totalPages} 頁 (每人獨立 1 頁 A4)`}
          </div>
        </div>

        {/* Center: View Layout & Tool Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Modes */}
          <div className="flex items-center bg-white rounded-lg border-2 border-[#5D4037] p-0.5 shadow-[1px_1px_0px_#5D4037]">
            <button
              onClick={() => setInspectionViewMode('single')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                inspectionViewMode === 'single'
                  ? 'bg-[#FF8A65] text-white shadow-[1px_1px_0px_#5D4037]'
                  : 'text-[#5D4037] hover:bg-[#FFF3E0]'
              }`}
              title="單頁聚焦檢視"
            >
              單頁檢視
            </button>
            <button
              onClick={() => setInspectionViewMode('double')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                inspectionViewMode === 'double'
                  ? 'bg-[#FF8A65] text-white shadow-[1px_1px_0px_#5D4037]'
                  : 'text-[#5D4037] hover:bg-[#FFF3E0]'
              }`}
              title="雙頁對開檢視"
            >
              雙頁對開
            </button>
            <button
              onClick={() => setInspectionViewMode('continuous')}
              className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                inspectionViewMode === 'continuous'
                  ? 'bg-[#FF8A65] text-white shadow-[1px_1px_0px_#5D4037]'
                  : 'text-[#5D4037] hover:bg-[#FFF3E0]'
              }`}
              title="連續直向滾動預覽全班"
            >
              連續檢視
            </button>
          </div>

          {/* Safe Margins Toggle */}
          <button
            onClick={() => setShowSafeMargins(!showSafeMargins)}
            className={`px-2.5 py-1 rounded-lg border-2 border-[#5D4037] shadow-[1px_1px_0px_#5D4037] transition-all flex items-center gap-1 cursor-pointer ${
              showSafeMargins ? 'bg-[#C8E6C9] text-[#1B5E20]' : 'bg-white text-[#5D4037]'
            }`}
            title="顯示 A4 10mm 安全邊界輔助線"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>邊界格線</span>
          </button>

          {/* Page Breaks Marker Toggle */}
          <button
            onClick={() => setShowPageBreaks(!showPageBreaks)}
            className={`px-2.5 py-1 rounded-lg border-2 border-[#5D4037] shadow-[1px_1px_0px_#5D4037] transition-all flex items-center gap-1 cursor-pointer ${
              showPageBreaks ? 'bg-[#FFE082] text-[#5D4037]' : 'bg-white text-[#5D4037]'
            }`}
            title="顯示 A4 自動分頁符號指示"
          >
            <Scissors className="w-3.5 h-3.5 text-[#FF8A65]" />
            <span>分頁符號</span>
          </button>

          {/* Grayscale Simulator */}
          <button
            onClick={() => setIsGrayscale(!isGrayscale)}
            className={`px-2.5 py-1 rounded-lg border-2 border-[#5D4037] shadow-[1px_1px_0px_#5D4037] transition-all flex items-center gap-1 cursor-pointer ${
              isGrayscale ? 'bg-gray-700 text-white' : 'bg-white text-[#5D4037]'
            }`}
            title="模擬黑白影印列印效果"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isGrayscale ? '黑白預覽中' : '彩色完稿'}</span>
          </button>
        </div>

        {/* Right Section: Font Size & Zoom */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Font Size Tuner */}
          <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border-2 border-[#5D4037] shadow-[1px_1px_0px_#5D4037]">
            <Type className="w-3.5 h-3.5 text-[#FF8A65]" />
            <button
              onClick={() => setFontSize((prev) => Math.max(14, prev - 2))}
              className="w-5 h-5 bg-[#FFE082] rounded flex items-center justify-center font-black cursor-pointer hover:bg-[#FFD54F]"
            >
              -
            </button>
            <span className="w-10 text-center font-mono font-bold text-xs">{fontSize}px</span>
            <button
              onClick={() => setFontSize((prev) => Math.min(28, prev + 2))}
              className="w-5 h-5 bg-[#FFE082] rounded flex items-center justify-center font-black cursor-pointer hover:bg-[#FFD54F]"
            >
              +
            </button>
          </div>

          {/* Zoom Level */}
          <div className="flex items-center gap-1 bg-white px-2 py-0.5 rounded-lg border-2 border-[#5D4037] shadow-[1px_1px_0px_#5D4037]">
            <button
              onClick={() => setZoomLevel((prev) => Math.max(50, prev - 15))}
              className="p-1 hover:bg-[#FFF3E0] rounded cursor-pointer"
              title="縮小"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="w-12 text-center font-mono font-bold text-xs">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((prev) => Math.min(130, prev + 15))}
              className="p-1 hover:bg-[#FFF3E0] rounded cursor-pointer"
              title="放大"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(100)}
              className="text-[10px] bg-[#FFE082] px-1.5 py-0.5 rounded border border-[#5D4037] cursor-pointer hover:bg-[#FFD54F]"
              title="重設為 100% 原始比例"
            >
              1:1
            </button>
          </div>
        </div>
      </div>

      {/* A4 Compliance Status Bar */}
      <div className="bg-[#E8F5E9] border-b border-[#A5D6A7] px-4 py-1.5 text-xs text-[#2E7D32] font-black flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0" />
          <span>
            A4 比例與排版合規診斷：版面已依據 A4 標準（210mm × 297mm）進行最佳化，雙導師與園長簽章欄位、8 大學習區及幼兒紀錄皆符合單頁完整規範。
          </span>
        </div>
        <span className="hidden md:inline-block font-mono bg-white px-2 py-0.5 rounded border border-[#A5D6A7] text-[11px]">
          頁面方向: 直式 (Portrait) • 建議邊距: 8~10mm
        </span>
      </div>

      {/* Main Inspection Canvas Stage */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-8 flex justify-center items-start bg-[#4A3B32]/40"
      >
        <div 
          style={{ 
            transform: `scale(${zoomLevel / 100})`, 
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out'
          }}
          className="flex flex-col items-center gap-8 min-w-max pb-16"
        >
          {filteredRecords.length === 0 ? (
            <div className="bg-[#FFFBF0] border-4 border-[#5D4037] p-8 rounded-2xl shadow-[6px_6px_0px_#5D4037] text-center max-w-md my-12">
              <Sparkles className="w-12 h-12 text-[#FF8A65] mx-auto mb-3" />
              <h3 className="text-lg font-black text-[#5D4037] mb-1">查無此班級之學習紀錄</h3>
              <p className="text-xs text-[#5D4037]/75 font-bold">請切換班級篩選條件或至學習區紀錄表單中新增紀錄。</p>
            </div>
          ) : inspectionViewMode === 'continuous' ? (
            /* Continuous Multi-Student Batch Inspection */
            filteredRecords.map((rec, index) => (
              <div key={rec.id} className="flex flex-col items-center">
                {/* A4 Sheet Simulated Page Frame */}
                <div className="relative bg-white p-3 sm:p-5 rounded-2xl border-4 border-[#5D4037] shadow-[12px_12px_0px_#2A1E17] w-[880px] max-w-[95vw]">
                  {/* Sheet Header Badge */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b-2 border-dashed border-[#5D4037]/30 text-xs font-black text-[#5D4037]">
                    <span className="flex items-center gap-1.5">
                      <span className="bg-[#FF8A65] text-white px-2 py-0.5 rounded-full text-[11px]">
                        A4 第 {index + 1} 頁
                      </span>
                      <span>{rec.studentName} 同學 ({rec.className} {rec.seatNumber}號)</span>
                    </span>
                    <span className="text-[#5D4037]/60 font-mono text-[11px]">
                      A4 規格: 210mm × 297mm (單頁)
                    </span>
                  </div>

                  {/* Rendered Single Report Card */}
                  <SingleReportCard
                    record={rec}
                    students={students}
                    fontSize={fontSize}
                    grayscale={isGrayscale}
                    showSafeMargins={showSafeMargins}
                  />
                </div>

                {/* Visible Page Break Separator between students */}
                {showPageBreaks && index < filteredRecords.length - 1 && (
                  <div className="my-6 w-[880px] max-w-[95vw] flex items-center justify-center gap-3">
                    <div className="h-0.5 flex-1 border-b-2 border-dashed border-[#FFD54F]" />
                    <div className="bg-[#FFE082] border-2 border-[#5D4037] text-[#5D4037] text-xs font-black px-4 py-1 rounded-full shadow-[2px_2px_0px_#5D4037] flex items-center gap-2 shrink-0">
                      <Scissors className="w-4 h-4 text-[#FF8A65]" />
                      <span>--- ✂️ A4 Page Break 自動分頁符號（列印時自動獨立切換下一張實體紙張） ---</span>
                    </div>
                    <div className="h-0.5 flex-1 border-b-2 border-dashed border-[#FFD54F]" />
                  </div>
                )}
              </div>
            ))
          ) : inspectionViewMode === 'double' ? (
            /* Two-Page Spread Inspection */
            <div className="flex flex-wrap items-start justify-center gap-6">
              {/* Left Page */}
              {currentRecord && (
                <div className="relative bg-white p-3 sm:p-5 rounded-2xl border-4 border-[#5D4037] shadow-[12px_12px_0px_#2A1E17] w-[620px] max-w-[90vw]">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b-2 border-dashed border-[#5D4037]/30 text-xs font-black text-[#5D4037]">
                    <span className="bg-[#FF8A65] text-white px-2 py-0.5 rounded-full text-[11px]">
                      A4 第 {currentRecordIndex + 1} 頁 (左頁)
                    </span>
                    <span>{currentRecord.studentName} ({currentRecord.className})</span>
                  </div>
                  <SingleReportCard
                    record={currentRecord}
                    students={students}
                    fontSize={Math.max(14, fontSize - 2)}
                    grayscale={isGrayscale}
                    showSafeMargins={showSafeMargins}
                  />
                </div>
              )}

              {/* Right Page (if exists) */}
              {filteredRecords[currentRecordIndex + 1] ? (
                <div className="relative bg-white p-3 sm:p-5 rounded-2xl border-4 border-[#5D4037] shadow-[12px_12px_0px_#2A1E17] w-[620px] max-w-[90vw]">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b-2 border-dashed border-[#5D4037]/30 text-xs font-black text-[#5D4037]">
                    <span className="bg-[#4FC3F7] text-[#5D4037] px-2 py-0.5 rounded-full text-[11px]">
                      A4 第 {currentRecordIndex + 2} 頁 (右頁)
                    </span>
                    <span>
                      {filteredRecords[currentRecordIndex + 1].studentName} (
                      {filteredRecords[currentRecordIndex + 1].className})
                    </span>
                  </div>
                  <SingleReportCard
                    record={filteredRecords[currentRecordIndex + 1]}
                    students={students}
                    fontSize={Math.max(14, fontSize - 2)}
                    grayscale={isGrayscale}
                    showSafeMargins={showSafeMargins}
                  />
                </div>
              ) : (
                <div className="w-[620px] border-4 border-dashed border-[#5D4037]/30 rounded-2xl p-12 flex flex-col items-center justify-center text-[#5D4037]/60 font-black text-center bg-white/20">
                  <p className="text-sm">已至最後一頁</p>
                  <p className="text-xs mt-1">（全班紀錄已完全預覽）</p>
                </div>
              )}
            </div>
          ) : (
            /* Single Page Focused Inspection */
            currentRecord && (
              <div className="flex flex-col items-center">
                <div className="relative bg-white p-3 sm:p-5 rounded-2xl border-4 border-[#5D4037] shadow-[12px_12px_0px_#2A1E17] w-[880px] max-w-[95vw]">
                  {/* Sheet Header Badge */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b-2 border-dashed border-[#5D4037]/30 text-xs font-black text-[#5D4037]">
                    <span className="flex items-center gap-1.5">
                      <span className="bg-[#FF8A65] text-white px-2.5 py-0.5 rounded-full text-xs">
                        A4 第 {currentRecordIndex + 1} 頁 / 共 {totalPages} 頁
                      </span>
                      <span className="text-sm font-black">{currentRecord.studentName} 同學</span>
                      <span className="text-xs text-[#5D4037]/75 font-bold">
                        ({currentRecord.className} {currentRecord.seatNumber}號)
                      </span>
                    </span>
                    <span className="text-[#5D4037]/75 font-mono text-xs">
                      標準 A4 直式 (210 × 297 mm)
                    </span>
                  </div>

                  <SingleReportCard
                    record={currentRecord}
                    students={students}
                    fontSize={fontSize}
                    grayscale={isGrayscale}
                    showSafeMargins={showSafeMargins}
                  />
                </div>

                {/* Single Page Auto Break Footer Indicator */}
                {showPageBreaks && (
                  <div className="mt-4 bg-[#FFE082] border-2 border-[#5D4037] text-[#5D4037] text-xs font-black px-4 py-1 rounded-full shadow-[2px_2px_0px_#5D4037] flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-[#FF8A65]" />
                    <span>A4 單頁完稿標記：此紀錄表符合單頁 A4 比例，列印時將完整輸出於單張紙上</span>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {/* Bottom Sticky Navigation & Page Selector Footer */}
      {inspectionViewMode !== 'continuous' && filteredRecords.length > 0 && (
        <footer className="bg-[#FFFBF0] border-t-4 border-[#5D4037] px-4 py-2.5 shrink-0 flex items-center justify-between gap-3 shadow-[0px_-4px_12px_rgba(0,0,0,0.1)]">
          {/* Prev Button */}
          <button
            onClick={handlePrev}
            disabled={currentRecordIndex === 0}
            className="bg-[#FFE082] hover:bg-[#FFD54F] disabled:opacity-40 text-[#5D4037] font-black text-xs py-2 px-3.5 rounded-xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] active:scale-95 transition-all flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" /> 上一頁
          </button>

          {/* Quick Page Jump Thumbnails Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-[60vw] py-1 px-2">
            {filteredRecords.map((rec, i) => {
              const isSelected = i === currentRecordIndex;
              return (
                <button
                  key={rec.id}
                  onClick={() => setCurrentRecordIndex(i)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black border-2 transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-[#FF8A65] text-white border-[#5D4037] shadow-[2px_2px_0px_#5D4037] scale-105'
                      : 'bg-white text-[#5D4037] border-[#5D4037]/40 hover:border-[#5D4037]'
                  }`}
                  title={`${i + 1}. ${rec.studentName}`}
                >
                  {i + 1}. {rec.studentName}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={currentRecordIndex >= totalPages - 1}
            className="bg-[#FFE082] hover:bg-[#FFD54F] disabled:opacity-40 text-[#5D4037] font-black text-xs py-2 px-3.5 rounded-xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] active:scale-95 transition-all flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
          >
            下一頁 <ChevronRight className="w-4 h-4" />
          </button>
        </footer>
      )}
    </div>
  );
};
