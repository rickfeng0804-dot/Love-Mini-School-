import React, { useState } from 'react';
import { Student, LearningRecord, ContactBook } from '../types';
import { 
  generateStudentsCsv, 
  generateLearningRecordsCsv, 
  generateContactBooksCsv, 
  downloadCsv 
} from '../lib/csvExport';
import { 
  X, 
  Download, 
  FileSpreadsheet, 
  Users, 
  BookOpen, 
  Heart, 
  Check, 
  Sparkles, 
  ExternalLink,
  Video,
  Image as ImageIcon
} from 'lucide-react';

interface CsvExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  learningRecords: LearningRecord[];
  contactBooks: ContactBook[];
}

export const CsvExportModal: React.FC<CsvExportModalProps> = ({
  isOpen,
  onClose,
  students,
  learningRecords,
  contactBooks,
}) => {
  const [downloadedType, setDownloadedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportStudents = () => {
    const csv = generateStudentsCsv(students);
    const filename = `愛愛幼兒園_學生名冊_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCsv(filename, csv);
    setDownloadedType('students');
    setTimeout(() => setDownloadedType(null), 3000);
  };

  const handleExportLearningRecords = () => {
    const csv = generateLearningRecordsCsv(learningRecords);
    const filename = `愛愛幼兒園_角落學習區紀錄_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCsv(filename, csv);
    setDownloadedType('learning');
    setTimeout(() => setDownloadedType(null), 3000);
  };

  const handleExportContactBooks = () => {
    const csv = generateContactBooksCsv(contactBooks);
    const filename = `愛愛幼兒園_家長聯絡簿紀錄_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCsv(filename, csv);
    setDownloadedType('contact');
    setTimeout(() => setDownloadedType(null), 3000);
  };

  const handleExportAll = () => {
    handleExportStudents();
    setTimeout(() => handleExportLearningRecords(), 300);
    setTimeout(() => handleExportContactBooks(), 600);
    setDownloadedType('all');
    setTimeout(() => setDownloadedType(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-[#FFFBF0] border-4 border-[#5D4037] rounded-[2rem] shadow-[12px_12px_0px_#5D4037] max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white hover:bg-[#FFCDD2] text-[#5D4037] p-2 rounded-full border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-[#FFD54F] border-2 border-[#5D4037] rounded-2xl shadow-[3px_3px_0px_#5D4037]">
            <Download className="w-7 h-7 text-[#5D4037]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#FF8A65] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full border border-[#5D4037]">
                Google Sheet 匯入專用
              </span>
              <span className="bg-[#E1F5FE] text-[#0277BD] text-[10px] font-black px-2.5 py-0.5 rounded-full border border-[#5D4037]">
                UTF-8 BOM 防亂碼
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-[#5D4037] italic flex items-center gap-2">
              資料匯出 CSV 功能
              <Sparkles className="w-5 h-5 text-[#FFB74D] animate-spin" />
            </h2>
          </div>
        </div>

        {/* Information Banner */}
        <div className="bg-[#FFFDE7] border-2 border-[#5D4037] rounded-2xl p-3.5 mb-5 shadow-[3px_3px_0px_#FFD54F] text-xs font-bold text-[#5D4037] space-y-1">
          <p className="flex items-center gap-1.5 font-black text-sm text-[#E65100]">
            <ImageIcon className="w-4 h-4 text-[#FF8A65]" />
            <Video className="w-4 h-4 text-[#0288D1]" />
            圖片與影片以 URL 網址儲存
          </p>
          <p className="text-[#5D4037]/90 leading-relaxed">
            匯出的 CSV 檔案中，所有的照片、圖稿與影片皆轉換為標準 HTTP/HTTPS URL 連結，方能完整備份並直接上傳至 <strong>Google Sheets</strong> 或 <strong>Excel</strong> 儲存與查閱。
          </p>
        </div>

        {/* Export Buttons Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {/* Option 1: Students */}
          <div className="bg-white border-2 border-[#5D4037] rounded-2xl p-4 shadow-[4px_4px_0px_#5D4037] flex flex-col justify-between hover:shadow-[6px_6px_0px_#5D4037] transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Users className="w-6 h-6 text-[#CE93D8]" />
                <span className="text-xs font-black bg-[#F3E5F5] text-[#4A148C] px-2 py-0.5 rounded-full border border-[#5D4037]">
                  {students.length} 筆資料
                </span>
              </div>
              <h3 className="font-black text-sm text-[#5D4037] mb-1">學生名冊資料</h3>
              <p className="text-[11px] text-[#5D4037]/80 font-bold mb-3">
                包含學生基本資料、性別、座號、頭像照片 URL 與家長通訊電話。
              </p>
            </div>
            <button
              onClick={handleExportStudents}
              className="w-full bg-[#CE93D8] hover:bg-[#BA68C8] text-[#4A148C] font-black text-xs py-2 px-3 rounded-xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] hover:shadow-none transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> 匯出學生 CSV
            </button>
          </div>

          {/* Option 2: Learning Records */}
          <div className="bg-white border-2 border-[#5D4037] rounded-2xl p-4 shadow-[4px_4px_0px_#5D4037] flex flex-col justify-between hover:shadow-[6px_6px_0px_#5D4037] transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <BookOpen className="w-6 h-6 text-[#FFB74D]" />
                <span className="text-xs font-black bg-[#FFF8E1] text-[#E65100] px-2 py-0.5 rounded-full border border-[#5D4037]">
                  {learningRecords.length} 筆資料
                </span>
              </div>
              <h3 className="font-black text-sm text-[#5D4037] mb-1">角落學習區紀錄</h3>
              <p className="text-[11px] text-[#5D4037]/80 font-bold mb-3">
                包含 8 大角落勾選摘要、繪圖與照片網址 URL、影片連結及評語。
              </p>
            </div>
            <button
              onClick={handleExportLearningRecords}
              className="w-full bg-[#FFB74D] hover:bg-[#FFA726] text-[#5D4037] font-black text-xs py-2 px-3 rounded-xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] hover:shadow-none transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> 匯出學習區 CSV
            </button>
          </div>

          {/* Option 3: Contact Books */}
          <div className="bg-white border-2 border-[#5D4037] rounded-2xl p-4 shadow-[4px_4px_0px_#5D4037] flex flex-col justify-between hover:shadow-[6px_6px_0px_#5D4037] transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Heart className="w-6 h-6 text-[#81D4FA]" />
                <span className="text-xs font-black bg-[#E1F5FE] text-[#01579B] px-2 py-0.5 rounded-full border border-[#5D4037]">
                  {contactBooks.length} 筆資料
                </span>
              </div>
              <h3 className="font-black text-sm text-[#5D4037] mb-1">家長聯絡簿紀錄</h3>
              <p className="text-[11px] text-[#5D4037]/80 font-bold mb-3">
                包含每日飲食、睡眠、額溫、情緒、老師留言、家長簽名與活動影音 URL。
              </p>
            </div>
            <button
              onClick={handleExportContactBooks}
              className="w-full bg-[#81D4FA] hover:bg-[#4FC3F7] text-[#01579B] font-black text-xs py-2 px-3 rounded-xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] hover:shadow-none transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> 匯出聯絡簿 CSV
            </button>
          </div>
        </div>

        {/* One-click Export All Button */}
        <div className="mb-6">
          <button
            onClick={handleExportAll}
            className="w-full bg-[#FF8A65] hover:bg-[#FF7043] text-white font-black text-sm py-3 px-6 rounded-full border-4 border-[#5D4037] shadow-[6px_6px_0px_#5D4037] hover:shadow-[3px_3px_0px_#5D4037] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-5 h-5" />
            一鍵匯出全部 3 個 CSV 檔案 (可直接匯入 Google Sheet) 🚀
          </button>
          {downloadedType && (
            <div className="mt-2 text-center text-xs font-black text-[#2E7D32] bg-[#C8E6C9] border border-[#5D4037] rounded-full py-1 animate-fade-in flex items-center justify-center gap-1">
              <Check className="w-4 h-4" /> CSV 檔案已順利下載至您的電腦！
            </div>
          )}
        </div>

        {/* Instructions: How to import CSV into Google Sheets */}
        <div className="bg-white border-2 border-[#5D4037] rounded-2xl p-4 shadow-[3px_3px_0px_#5D4037]">
          <h4 className="font-black text-xs text-[#5D4037] mb-2 flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-[#2E7D32]" />
            如何將 CSV 檔案匯入 Google Sheets 簡易教學：
          </h4>
          <ol className="list-decimal list-inside space-y-1 text-[11px] font-bold text-[#5D4037]/90 leading-relaxed">
            <li>在瀏覽器開啟 <a href="https://sheets.google.com" target="_blank" rel="noopener noreferrer" className="text-[#0288D1] underline inline-flex items-center gap-0.5">Google 試算表 <ExternalLink className="w-3 h-3" /></a> 並建立新試算表。</li>
            <li>點擊上方選單的 <strong>「檔案」</strong> ➔ 點選 <strong>「匯入」</strong>。</li>
            <li>選擇 <strong>「上傳」</strong> 分頁，將剛剛下載的 <code>.csv</code> 檔案拖曳進去。</li>
            <li>匯入位置選擇 <strong>「建立新的試算表」</strong> 或 <strong>「取代目前的試算表」</strong>，分隔字元保持 <strong>「自動偵測」</strong>。</li>
            <li>點擊 <strong>「匯入資料」</strong>，即可看到所有學生、圖片 URL 與影片網址漂亮地顯示在表格中！</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
