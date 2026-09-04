import React from 'react';
import { 
  SheetConfig, 
  Student,
  ClassFilterOption,
  CLASS_FILTER_OPTIONS
} from '../types';
import { 
  ClipboardList, 
  FileSpreadsheet, 
  BookOpenCheck, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Baby, 
  GraduationCap,
  Download,
  Layers,
  RefreshCw,
  Type,
  Filter
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'corner-form' | 'learning-report' | 'roster' | 'system-design';
  setActiveTab: (tab: 'corner-form' | 'learning-report' | 'roster' | 'system-design') => void;
  sheetConfig: SheetConfig;
  onOpenSheetModal: () => void;
  onOpenCsvModal: () => void;
  onInstantSync?: () => void;
  isSyncing?: boolean;
  students: Student[];
  selectedStudentId: string;
  setSelectedStudentId: (id: string) => void;
  fontSize: 'normal' | 'large' | 'xlarge';
  setFontSize: (size: 'normal' | 'large' | 'xlarge') => void;
  selectedClassFilter: ClassFilterOption;
  setSelectedClassFilter: (filter: ClassFilterOption) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  sheetConfig,
  onOpenSheetModal,
  onOpenCsvModal,
  onInstantSync,
  isSyncing,
  fontSize,
  setFontSize,
  selectedClassFilter,
  setSelectedClassFilter,
}) => {
  return (
    <header className="bg-[#FFD54F] border-b-4 border-[#5D4037] shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
        {/* Top Branding Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 mb-2 sm:mb-3">
          {/* Kindergarten Logo & Name */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-2xl flex items-center justify-center border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] transform -rotate-3 shrink-0">
                <span className="text-xl sm:text-2xl">🌸</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] sm:text-xs bg-[#5D4037] text-white font-black px-2 py-0.2 rounded-full tracking-wider">
                    桃園市私立
                  </span>
                  <span className="text-[10px] sm:text-xs bg-[#FFE082] text-[#5D4037] font-black px-2.5 py-0.5 rounded-full border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] flex items-center gap-1">
                    👑 園長 黃雅琦 Rachel
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#5D4037] tracking-tight flex items-center gap-2 flex-wrap">
                  愛愛幼兒園
                  <span className="text-[10px] sm:text-xs text-[#5D4037] font-extrabold hidden md:inline-block bg-white px-2.5 py-0.5 rounded-full border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037]">
                    角落學習紀錄系統
                  </span>
                </h1>
              </div>
            </div>
          </div>

          {/* Right Action Bar: Instant Sync, CSV Export, Sheet & Font Size */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-stretch sm:justify-end">
            {/* Instant Sync Button */}
            <button
              onClick={onInstantSync}
              disabled={isSyncing}
              title={sheetConfig.lastSyncedAt ? `上次同步時間：${sheetConfig.lastSyncedAt}` : '立即同步最新資料'}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1 min-h-[38px] px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-black transition-all border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] cursor-pointer active:scale-95 ${
                isSyncing
                  ? 'bg-amber-100 text-[#5D4037] cursor-wait'
                  : 'bg-[#00E676] hover:bg-[#00C853] text-[#1B5E20]'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#1B5E20]' : ''}`} />
              <span>{isSyncing ? '同步中' : '立即同步'}</span>
            </button>

            {/* CSV Export Button */}
            <button
              onClick={onOpenCsvModal}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1 min-h-[38px] px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-black transition-all bg-[#FF8A65] hover:bg-[#FF7043] text-white border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>匯出 CSV</span>
            </button>

            {/* Google Sheets Status Badge */}
            <button
              onClick={onOpenSheetModal}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1 min-h-[38px] px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-black transition-all border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] cursor-pointer active:scale-95 ${
                sheetConfig.isConnected
                  ? 'bg-[#C8E6C9] text-[#2E7D32] hover:bg-[#A5D6A7]'
                  : 'bg-[#FFE082] text-[#5D4037] hover:bg-[#FFCA28] animate-pulse'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              {sheetConfig.isConnected ? (
                <span>Sheet 已連線</span>
              ) : (
                <span>設定 Sheet</span>
              )}
            </button>

            {/* Font Size Selector */}
            <div className="bg-white p-0.5 sm:p-1 rounded-full border-2 border-[#5D4037] flex items-center shadow-[2px_2px_0px_#5D4037] shrink-0">
              <button
                type="button"
                onClick={() => {
                  const next = fontSize === 'normal' ? 'large' : fontSize === 'large' ? 'xlarge' : 'normal';
                  setFontSize(next);
                }}
                title="點擊切換字體大小 (標準 / 大 / 特大)"
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-black transition-all bg-[#FFE082] text-[#5D4037] hover:bg-[#FFD54F] border border-[#5D4037] cursor-pointer"
              >
                <Type className="w-3.5 h-3.5 text-[#5D4037]" />
                <span>字體: {fontSize === 'normal' ? '標準' : fontSize === 'large' ? '大 🔍' : '特大 🔍+'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Desktop & Tablet) */}
        <nav className="hidden md:flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          <button
            onClick={() => setActiveTab('corner-form')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-black text-xs md:text-sm whitespace-nowrap transition-all border-2 border-[#5D4037] ${
              activeTab === 'corner-form'
                ? 'bg-[#FF8A65] text-white shadow-[3px_3px_0px_#5D4037] transform -translate-y-0.5'
                : 'bg-white text-[#5D4037] hover:bg-[#FFF3E0] shadow-[2px_2px_0px_#5D4037]'
            }`}
          >
            <ClipboardList className="w-4 h-4" /> 角落學習紀錄表
          </button>

          <button
            onClick={() => setActiveTab('learning-report')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-black text-xs md:text-sm whitespace-nowrap transition-all border-2 border-[#5D4037] ${
              activeTab === 'learning-report'
                ? 'bg-[#FFB74D] text-[#5D4037] shadow-[3px_3px_0px_#5D4037] transform -translate-y-0.5'
                : 'bg-white text-[#5D4037] hover:bg-[#FFF8E1] shadow-[2px_2px_0px_#5D4037]'
            }`}
          >
            <BookOpenCheck className="w-4 h-4" /> 學生角落學習紀錄報告
          </button>

          <button
            onClick={() => setActiveTab('roster')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-black text-xs md:text-sm whitespace-nowrap transition-all border-2 border-[#5D4037] ${
              activeTab === 'roster'
                ? 'bg-[#CE93D8] text-[#4A148C] shadow-[3px_3px_0px_#5D4037] transform -translate-y-0.5'
                : 'bg-white text-[#5D4037] hover:bg-[#F3E5F5] shadow-[2px_2px_0px_#5D4037]'
            }`}
          >
            <Users className="w-4 h-4" /> 學生名冊管理
          </button>

          <button
            onClick={() => setActiveTab('system-design')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-black text-xs md:text-sm whitespace-nowrap transition-all border-2 border-[#5D4037] ${
              activeTab === 'system-design'
                ? 'bg-[#FFF3E0] text-[#E65100] shadow-[3px_3px_0px_#5D4037] transform -translate-y-0.5 border-orange-500'
                : 'bg-white text-[#5D4037] hover:bg-[#FFF3E0] shadow-[2px_2px_0px_#5D4037]'
            }`}
          >
            <Layers className="w-4 h-4 text-[#FF8A65]" /> 系統設計與 Google Sheet 連結
          </button>
        </nav>
      </div>
    </header>
  );
};
