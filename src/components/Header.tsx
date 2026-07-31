import React from 'react';
import { 
  RoleMode, 
  SheetConfig, 
  Student 
} from '../types';
import { 
  ClipboardList, 
  FileSpreadsheet, 
  BookOpenCheck, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Heart, 
  Baby, 
  GraduationCap 
} from 'lucide-react';

interface HeaderProps {
  roleMode: RoleMode;
  setRoleMode: (role: RoleMode) => void;
  activeTab: 'corner-form' | 'learning-report' | 'contact-book' | 'roster';
  setActiveTab: (tab: 'corner-form' | 'learning-report' | 'contact-book' | 'roster') => void;
  sheetConfig: SheetConfig;
  onOpenSheetModal: () => void;
  students: Student[];
  selectedStudentId: string;
  setSelectedStudentId: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  roleMode,
  setRoleMode,
  activeTab,
  setActiveTab,
  sheetConfig,
  onOpenSheetModal,
  students,
  selectedStudentId,
  setSelectedStudentId,
}) => {
  return (
    <header className="bg-[#FFD54F] border-b-4 border-[#5D4037] shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Top Branding Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-3">
          {/* Kindergarten Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037] transform -rotate-3 hover:rotate-0 transition-transform">
              <span className="text-2xl">🌸</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-[#5D4037] text-white font-black px-2.5 py-0.5 rounded-full tracking-wider">
                  桃園市私立
                </span>
                <span className="text-xs text-[#5D4037] font-bold bg-white/90 px-2.5 py-0.5 rounded-full border border-[#5D4037]">
                  あいあいようちえん
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-[#5D4037] tracking-tight flex items-center gap-2">
                愛愛幼兒園
                <span className="text-xs text-[#5D4037] font-extrabold hidden sm:inline-block bg-white px-3 py-1 rounded-full border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037]">
                  大班角落學習區與聯絡簿
                </span>
              </h1>
            </div>
          </div>

          {/* Right Action Bar: Role Switch & Google Sheet Sync */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            {/* Google Sheets Status Badge */}
            <button
              onClick={onOpenSheetModal}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black transition-all border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] ${
                sheetConfig.isConnected
                  ? 'bg-[#C8E6C9] text-[#2E7D32] hover:bg-[#A5D6A7]'
                  : 'bg-[#FFE082] text-[#5D4037] hover:bg-[#FFCA28] animate-pulse'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              {sheetConfig.isConnected ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32]" />
                  <span>Google Sheet 已同步</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-[#E65100]" />
                  <span>連接 Google Sheet</span>
                </>
              )}
            </button>

            {/* Role Switcher */}
            <div className="bg-white p-1 rounded-full border-2 border-[#5D4037] flex items-center shadow-[2px_2px_0px_#5D4037]">
              <button
                onClick={() => setRoleMode('teacher')}
                className={`flex items-center gap-1 px-3.5 py-1 rounded-full text-xs font-black transition-all ${
                  roleMode === 'teacher'
                    ? 'bg-[#FF8A65] text-white border-2 border-[#5D4037] shadow-[1px_1px_0px_#5D4037]'
                    : 'text-[#5D4037] hover:bg-[#FFF3E0]'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" /> 老師模式
              </button>
              <button
                onClick={() => setRoleMode('parent')}
                className={`flex items-center gap-1 px-3.5 py-1 rounded-full text-xs font-black transition-all ${
                  roleMode === 'parent'
                    ? 'bg-[#81D4FA] text-[#0277BD] border-2 border-[#5D4037] shadow-[1px_1px_0px_#5D4037]'
                    : 'text-[#5D4037] hover:bg-[#E1F5FE]'
                }`}
              >
                <Baby className="w-3.5 h-3.5" /> 家長模式
              </button>
            </div>
          </div>
        </div>

        {/* Parent Mode Quick Student Select */}
        {roleMode === 'parent' && (
          <div className="bg-[#E1F5FE] border-2 border-[#5D4037] rounded-2xl p-2.5 mb-2 flex items-center justify-between gap-3 text-xs shadow-[3px_3px_0px_#5D4037]">
            <div className="flex items-center gap-2 text-[#5D4037] font-black">
              <Sparkles className="w-4 h-4 text-[#0288D1]" />
              <span>請選擇您的孩子：</span>
            </div>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="bg-white border-2 border-[#5D4037] rounded-xl px-3 py-1 font-extrabold text-[#5D4037] focus:outline-none shadow-[2px_2px_0px_#5D4037]"
            >
              {students.map((stu) => (
                <option key={stu.id} value={stu.id}>
                  {stu.className} - {stu.seatNumber}號 {stu.name} ({stu.parentName})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
          {roleMode === 'teacher' && (
            <button
              onClick={() => setActiveTab('corner-form')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-black text-xs md:text-sm whitespace-nowrap transition-all border-2 border-[#5D4037] ${
                activeTab === 'corner-form'
                  ? 'bg-[#FF8A65] text-white shadow-[3px_3px_0px_#5D4037] transform -translate-y-0.5'
                  : 'bg-white text-[#5D4037] hover:bg-[#FFF3E0] shadow-[2px_2px_0px_#5D4037]'
              }`}
            >
              <ClipboardList className="w-4 h-4" /> 大班角落學習區紀錄表
            </button>
          )}

          <button
            onClick={() => setActiveTab('learning-report')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-black text-xs md:text-sm whitespace-nowrap transition-all border-2 border-[#5D4037] ${
              activeTab === 'learning-report'
                ? 'bg-[#FFB74D] text-[#5D4037] shadow-[3px_3px_0px_#5D4037] transform -translate-y-0.5'
                : 'bg-white text-[#5D4037] hover:bg-[#FFF8E1] shadow-[2px_2px_0px_#5D4037]'
            }`}
          >
            <BookOpenCheck className="w-4 h-4" /> 學生學習歷程報告
          </button>

          <button
            onClick={() => setActiveTab('contact-book')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-black text-xs md:text-sm whitespace-nowrap transition-all border-2 border-[#5D4037] ${
              activeTab === 'contact-book'
                ? 'bg-[#81D4FA] text-[#01579B] shadow-[3px_3px_0px_#5D4037] transform -translate-y-0.5'
                : 'bg-white text-[#5D4037] hover:bg-[#E1F5FE] shadow-[2px_2px_0px_#5D4037]'
            }`}
          >
            <Heart className="w-4 h-4" /> 家長聯絡簿
          </button>

          {roleMode === 'teacher' && (
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
          )}
        </nav>
      </div>
    </header>
  );
};
