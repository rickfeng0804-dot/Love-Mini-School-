import React, { useState } from 'react';
import { 
  Student, 
  ContactBook, 
  SheetConfig, 
  ClassFilterOption,
  GradeFilterOption,
  GRADE_OPTIONS,
  getStudentGrade
} from '../types';
import { syncAllToSheet, syncToWebApp, DEFAULT_WEB_APP_URL } from '../lib/googleSheets';
import { getAccessToken } from '../lib/firebase';
import confetti from 'canvas-confetti';
import { 
  Heart, 
  Send, 
  CheckCheck, 
  Smile, 
  Clock, 
  Thermometer, 
  Sparkles, 
  MessageSquare, 
  Utensils, 
  Moon, 
  Plus,
  Download,
  Printer,
  Filter,
  GraduationCap
} from 'lucide-react';
import { generateContactBooksCsv, downloadCsv } from '../lib/csvExport';

interface ContactBookViewProps {
  students: Student[];
  contactBooks: ContactBook[];
  setContactBooks: React.Dispatch<React.SetStateAction<ContactBook[]>>;
  selectedStudentId: string;
  setSelectedStudentId: (id: string) => void;
  sheetConfig: SheetConfig;
  learningRecords: any[];
}

export const ContactBookView: React.FC<ContactBookViewProps> = ({
  students,
  contactBooks,
  setContactBooks,
  selectedStudentId,
  setSelectedStudentId,
  sheetConfig,
  learningRecords,
}) => {
  const [cbGradeFilter, setCbGradeFilter] = useState<GradeFilterOption>('全部年級');
  const [cbClassFilter, setCbClassFilter] = useState<ClassFilterOption>('全部班級');

  // Dynamically compute unique grades
  const uniqueGradeList = Array.from(
    new Set(['全部年級', ...GRADE_OPTIONS, ...students.map((s) => getStudentGrade(s)).filter(Boolean)])
  );

  // Available students for selected grade
  const availableStudentsForGrade = students.filter(
    (s) => cbGradeFilter === '全部年級' || getStudentGrade(s) === cbGradeFilter
  );

  // Dynamically compute unique classes for selected grade
  const uniqueClassList = Array.from(
    new Set(['全部班級', ...availableStudentsForGrade.map((s) => s.className).filter(Boolean)])
  );

  const filteredCbStudents = students.filter((s) => {
    const matchGrade = cbGradeFilter === '全部年級' || getStudentGrade(s) === cbGradeFilter;
    const matchClass = cbClassFilter === '全部班級' || s.className === cbClassFilter;
    return matchGrade && matchClass;
  });

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
  const studentContactBooks = contactBooks.filter((c) => c.studentId === selectedStudentId);

  // New Contact Book Form State (Teacher)
  const [date, setDate] = useState<string>('2026-07-30');
  const [breakfast, setBreakfast] = useState<any>('全部吃完');
  const [lunch, setLunch] = useState<any>('全部吃完');
  const [snack, setSnack] = useState<any>('全部吃完');
  const [napMinutes, setNapMinutes] = useState<number>(90);
  const [mood, setMood] = useState<any>('開心熱情 🌸');
  const [temperature, setTemperature] = useState<string>('36.5°C');
  const [healthNotes, setHealthNotes] = useState<string>('體溫正常，精神活潑。');
  const [teacherMessage, setTeacherMessage] = useState<string>(
    '寶貝今天在幼兒園表現好棒！角落活動時間開心地繪畫與拼圖，午餐全部吃光光喔～'
  );

  // Parent Reply Input State
  const [parentReplyInput, setParentReplyInput] = useState<string>('');

  const handleCreateContactBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const newEntry: ContactBook = {
      id: `cb-${Date.now()}`,
      date,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      className: selectedStudent.className,
      seatNumber: selectedStudent.seatNumber,
      breakfast,
      lunch,
      snack,
      napMinutes,
      mood,
      temperature,
      healthNotes,
      teacherMessage,
      parentReply: '',
      isReadByParent: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [newEntry, ...contactBooks];
    setContactBooks(updated);

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch {}

    // Async background sync
    (async () => {
      const webAppTarget = sheetConfig.webAppUrl || DEFAULT_WEB_APP_URL;
      if (webAppTarget) {
        try {
          await syncToWebApp(webAppTarget, students, learningRecords, updated);
        } catch (err) {
          console.warn('Contact book Web App background sync warning:', err);
        }
      }

      if (sheetConfig.isConnected && sheetConfig.spreadsheetId) {
        try {
          const token = getAccessToken();
          if (token) {
            await syncAllToSheet(token, sheetConfig.spreadsheetId, students, learningRecords, updated);
          }
        } catch (err) {
          console.warn('Contact book sheet sync warning:', err);
        }
      }
    })();
  };

  const handleParentSubmitReply = async (contactBookId: string) => {
    if (!parentReplyInput.trim()) return;

    const updated = contactBooks.map((c) => {
      if (c.id === contactBookId) {
        return {
          ...c,
          parentReply: parentReplyInput,
          isReadByParent: true,
        };
      }
      return c;
    });

    setContactBooks(updated);
    setParentReplyInput('');

    try {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
    } catch {}

    const webAppTarget = sheetConfig.webAppUrl || DEFAULT_WEB_APP_URL;
    if (webAppTarget) {
      try {
        await syncToWebApp(webAppTarget, students, learningRecords, updated);
      } catch (err) {
        console.error('Web App sync error:', err);
      }
    }

    if (sheetConfig.isConnected && sheetConfig.spreadsheetId) {
      try {
        const token = getAccessToken();
        if (token) {
          await syncAllToSheet(token, sheetConfig.spreadsheetId, students, learningRecords, updated);
        }
      } catch (err) {
        console.error('Sync error:', err);
      }
    }
  };

  const handlePrintContactBook = () => {
    const listArea = document.getElementById('contact-book-list');
    const stuName = selectedStudent?.name || '幼童';

    if (listArea) {
      try {
        const printWindow = window.open('', '_blank', 'width=1024,height=900,top=50,left=50');
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>愛愛幼兒園 - 家長聯絡簿 - ${stuName}</title>
                <meta charset="utf-8" />
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                  @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; margin: 0 !important; padding: 0 !important; }
                    *, *::before, *::after {
                      -webkit-print-color-adjust: exact !important;
                      print-color-adjust: exact !important;
                      color-adjust: exact !important;
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
                  <span style="font-weight: 900; color: #5D4037; margin-right: 15px; font-size: 15px;">📄 愛愛幼兒園 家長聯絡簿卡片 - ${stuName}：</span>
                  <button onclick="window.focus(); window.print();" style="background: #FF8A65; color: white; border: 2px solid #5D4037; padding: 8px 20px; border-radius: 20px; font-weight: 900; cursor: pointer; font-size: 14px; margin-right: 10px; box-shadow: 2px 2px 0px #5D4037;">
                    🖨️ 立即列印 / 儲存 PDF 檔案
                  </button>
                  <button onclick="window.close();" style="background: #e0e0e0; color: #333; border: 2px solid #5D4037; padding: 8px 16px; border-radius: 20px; font-weight: 900; cursor: pointer; font-size: 14px;">
                    ✖ 關閉視窗
                  </button>
                </div>
                <div style="max-width: 960px; margin: 0 auto; background: white;">
                  ${listArea.outerHTML}
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

    window.focus();
    setTimeout(() => { window.print(); }, 100);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Top Banner */}
      <div className="bg-[#FFFDE7] border-4 border-[#5D4037] rounded-[2rem] p-6 shadow-[8px_8px_0px_#FFD54F] mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#5D4037] text-white font-black text-xs px-3 py-1 rounded-full shadow-xs">
              親師溝通橋樑
            </span>
            <span className="bg-[#81D4FA] text-[#5D4037] border-2 border-[#5D4037] font-black text-xs px-3 py-1 rounded-full shadow-[2px_2px_0px_#5D4037]">
              日式繪本卡片風
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-[#5D4037] flex items-center gap-2 italic">
            家長聯絡簿
            <Heart className="w-6 h-6 text-[#FF5252] fill-[#FF5252] animate-pulse" />
          </h2>
          <p className="text-xs text-[#5D4037]/80 font-bold mt-1">
            即時紀錄幼兒在園飲食、睡眠、情緒表達與雙向留言互動。
          </p>
        </div>

        {/* Student Select Bar */}
        <div className="flex flex-wrap items-center gap-2 justify-between md:justify-end w-full md:w-auto">
          <div className="w-full sm:w-auto bg-white p-2 rounded-2xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] flex flex-wrap items-center gap-2">
            {/* Grade Filter Dropdown */}
            <div className="flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-[#E65100]" />
              <select
                value={cbGradeFilter}
                onChange={(e) => {
                  const newGrade = e.target.value as GradeFilterOption;
                  setCbGradeFilter(newGrade);
                  setCbClassFilter('全部班級');
                  const filtered = students.filter(
                    (s) => newGrade === '全部年級' || getStudentGrade(s) === newGrade
                  );
                  if (filtered.length > 0) {
                    setSelectedStudentId(filtered[0].id);
                  }
                }}
                className="bg-[#FFFBF0] border-2 border-[#5D4037] rounded-xl px-2 py-1 text-xs font-bold text-[#5D4037] focus:outline-none shadow-[2px_2px_0px_#5D4037] cursor-pointer"
              >
                {uniqueGradeList.map((grd) => (
                  <option key={grd} value={grd}>
                    {grd === '全部年級' ? '🏫 全部年級' : `🎓 ${grd}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Class Filter Dropdown */}
            <div className="flex items-center gap-1 border-l border-[#5D4037]/20 pl-2">
              <Filter className="w-3.5 h-3.5 text-[#7B1FA2]" />
              <select
                value={cbClassFilter}
                onChange={(e) => {
                  const newFilter = e.target.value as ClassFilterOption;
                  setCbClassFilter(newFilter);
                  const filtered = students.filter((s) => {
                    const matchGrade = cbGradeFilter === '全部年級' || getStudentGrade(s) === cbGradeFilter;
                    const matchClass = newFilter === '全部班級' || s.className === newFilter;
                    return matchGrade && matchClass;
                  });
                  if (filtered.length > 0) {
                    setSelectedStudentId(filtered[0].id);
                  }
                }}
                className="bg-[#FFFBF0] border-2 border-[#5D4037] rounded-xl px-2 py-1 text-xs font-bold text-[#5D4037] focus:outline-none shadow-[2px_2px_0px_#5D4037] cursor-pointer"
              >
                {uniqueClassList.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls === '全部班級' ? '🎒 全部班級' : `🎒 ${cls}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 border-l sm:border-l border-[#5D4037]/20 pl-2">
              {selectedStudent?.avatarUrl && (
                <img
                  src={selectedStudent.avatarUrl}
                  alt={selectedStudent.name}
                  className="w-8 h-8 rounded-full border border-[#5D4037] object-cover shrink-0 shadow-xs"
                />
              )}
              <span className="text-xs font-black text-[#5D4037] shrink-0">選擇學生:</span>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="bg-[#FFFBF0] border-2 border-[#5D4037] rounded-xl px-2.5 py-1 text-xs font-bold text-[#5D4037] focus:outline-none shadow-[2px_2px_0px_#5D4037] cursor-pointer"
              >
                {filteredCbStudents.length > 0 ? (
                  filteredCbStudents.map((stu) => (
                    <option key={stu.id} value={stu.id}>
                      {stu.grade || getStudentGrade(stu)} · {stu.className} - {stu.seatNumber}號 {stu.name}
                    </option>
                  ))
                ) : (
                  <option value="">該篩選條件尚無學生</option>
                )}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrintContactBook}
              className="flex-1 sm:flex-none justify-center bg-[#FF8A65] hover:bg-[#FF7043] text-white font-black text-xs py-2 px-3 rounded-2xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer min-h-[38px]"
            >
              <Printer className="w-3.5 h-3.5" /> 列印 / PDF
            </button>
            <button
              onClick={() => {
                const csv = generateContactBooksCsv(contactBooks);
                downloadCsv(`愛愛幼兒園_家長聯絡簿紀錄_${new Date().toISOString().slice(0, 10)}.csv`, csv);
              }}
              className="flex-1 sm:flex-none justify-center bg-[#FFB74D] hover:bg-[#FFA726] text-[#5D4037] font-black text-xs py-2 px-3 rounded-2xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer min-h-[38px]"
            >
              <Download className="w-3.5 h-3.5" /> 匯出 CSV
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Teacher Entry Form */}
        <div className="lg:col-span-1 bg-white border-4 border-[#5D4037] rounded-[2rem] p-5 shadow-[6px_6px_0px_#5D4037]">
          <h3 className="font-black text-[#5D4037] text-base mb-4 flex items-center gap-2 border-b-2 border-dashed border-[#5D4037]/30 pb-2 italic">
            <Plus className="w-5 h-5 text-[#FF8A65]" />
            新增今日聯絡簿紀錄
          </h3>

          <form onSubmit={handleCreateContactBook} className="space-y-4 text-xs font-bold text-[#5D4037]">
            <div>
              <label className="block text-[#5D4037] font-black mb-1">日期:</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#FFFBF0] border-2 border-[#5D4037] rounded-xl px-3 py-1.5 focus:outline-none shadow-[2px_2px_0px_#5D4037]"
              />
            </div>

            {/* Meal Options */}
            <div className="bg-[#FFF8E1] p-3 rounded-2xl border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037] space-y-2">
              <span className="text-[#5D4037] font-black flex items-center gap-1 mb-1">
                <Utensils className="w-3.5 h-3.5 text-[#FF8A65]" /> 飲食紀錄:
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-[#5D4037]/80 mb-0.5">早餐</label>
                  <select
                    value={breakfast}
                    onChange={(e) => setBreakfast(e.target.value as any)}
                    className="w-full bg-white border-2 border-[#5D4037] rounded-lg p-1 text-[11px] font-bold"
                  >
                    <option value="全部吃完">全部吃完</option>
                    <option value="吃了一半">吃了一半</option>
                    <option value="食慾較弱">食慾較弱</option>
                    <option value="未食用">未食用</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#5D4037]/80 mb-0.5">午餐</label>
                  <select
                    value={lunch}
                    onChange={(e) => setLunch(e.target.value as any)}
                    className="w-full bg-white border-2 border-[#5D4037] rounded-lg p-1 text-[11px] font-bold"
                  >
                    <option value="全部吃完">全部吃完</option>
                    <option value="吃了一半">吃了一半</option>
                    <option value="食慾較弱">食慾較弱</option>
                    <option value="未食用">未食用</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#5D4037]/80 mb-0.5">點心</label>
                  <select
                    value={snack}
                    onChange={(e) => setSnack(e.target.value as any)}
                    className="w-full bg-white border-2 border-[#5D4037] rounded-lg p-1 text-[11px] font-bold"
                  >
                    <option value="全部吃完">全部吃完</option>
                    <option value="吃了一半">吃了一半</option>
                    <option value="食慾較弱">食慾較弱</option>
                    <option value="未食用">未食用</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Nap & Mood & Temp */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[#5D4037] font-black mb-1 flex items-center gap-1">
                  <Moon className="w-3.5 h-3.5 text-[#7E57C2]" /> 午睡時間 (分):
                </label>
                <input
                  type="number"
                  value={napMinutes}
                  onChange={(e) => setNapMinutes(Number(e.target.value))}
                  className="w-full bg-[#FFFBF0] border-2 border-[#5D4037] rounded-xl px-3 py-1.5 focus:outline-none shadow-[2px_2px_0px_#5D4037]"
                />
              </div>
              <div>
                <label className="block text-[#5D4037] font-black mb-1 flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-[#FF5252]" /> 體溫:
                </label>
                <input
                  type="text"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="w-full bg-[#FFFBF0] border-2 border-[#5D4037] rounded-xl px-3 py-1.5 focus:outline-none shadow-[2px_2px_0px_#5D4037]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#5D4037] font-black mb-1 flex items-center gap-1">
                <Smile className="w-3.5 h-3.5 text-[#FFA726]" /> 今日情緒表現:
              </label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value as any)}
                className="w-full bg-[#FFFBF0] border-2 border-[#5D4037] rounded-xl px-3 py-1.5 font-bold text-[#5D4037] shadow-[2px_2px_0px_#5D4037]"
              >
                <option value="開心熱情 🌸">開心熱情 🌸</option>
                <option value="平靜穩定 ✨">平靜穩定 ✨</option>
                <option value="活潑好動 🌟">活潑好動 🌟</option>
                <option value="稍微疲倦 💤">稍微疲倦 💤</option>
                <option value="情緒敏感 💧">情緒敏感 💧</option>
              </select>
            </div>

            <div>
              <label className="block text-[#5D4037] font-black mb-1">健康與活動備註:</label>
              <input
                type="text"
                value={healthNotes}
                onChange={(e) => setHealthNotes(e.target.value)}
                className="w-full bg-[#FFFBF0] border-2 border-[#5D4037] rounded-xl px-3 py-1.5 focus:outline-none shadow-[2px_2px_0px_#5D4037]"
              />
            </div>

            <div>
              <label className="block text-[#5D4037] mb-1 font-black">老師親師留言板:</label>
              <textarea
                rows={3}
                value={teacherMessage}
                onChange={(e) => setTeacherMessage(e.target.value)}
                className="w-full bg-[#FFFBF0] border-2 border-[#5D4037] rounded-xl p-2.5 focus:outline-none shadow-[2px_2px_0px_#5D4037] font-sans font-bold"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#FF8A65] hover:bg-[#FF7043] text-white font-black py-2.5 px-4 rounded-full border-2 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] hover:shadow-[2px_2px_0px_#5D4037] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" /> 發送今日聯絡簿紀錄
            </button>
          </form>
        </div>

        {/* Right Column: Postcard Style Contact Book Entries */}
        <div id="contact-book-list" className="lg:col-span-2 space-y-4">
          <h3 className="font-black text-[#5D4037] text-base mb-2 flex items-center gap-2 italic">
            <MessageSquare className="w-5 h-5 text-[#FF5252]" />
            {selectedStudent.name} 的歷史聯絡簿紀錄
          </h3>

          {studentContactBooks.length > 0 ? (
            studentContactBooks.map((entry) => (
              <div
                key={entry.id}
                className="bg-white border-4 border-[#5D4037] rounded-[2rem] p-5 shadow-[6px_6px_0px_#FFD54F] relative overflow-hidden transition-all hover:shadow-[8px_8px_0px_#FFD54F]"
              >
                {/* Stamp Decoration */}
                <div className="absolute top-3 right-4 bg-[#FFCDD2] border-2 border-[#5D4037] text-[#5D4037] font-black text-[10px] px-3 py-1 rounded-full flex items-center gap-1 shadow-[2px_2px_0px_#5D4037]">
                  <Heart className="w-3 h-3 fill-[#FF5252] stroke-[#5D4037]" />
                  {entry.date} 日誌
                </div>

                {/* Header Info */}
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={selectedStudent.avatarUrl}
                    alt={selectedStudent.name}
                    className="w-12 h-12 rounded-full border-2 border-[#5D4037] object-cover shadow-[2px_2px_0px_#5D4037]"
                  />
                  <div>
                    <h4 className="font-black text-base text-[#5D4037]">
                      {entry.studentName} ({entry.className} {entry.seatNumber}號)
                    </h4>
                    <span className="text-xs text-[#5D4037] font-black bg-[#FFE082] px-2.5 py-0.5 rounded-full border border-[#5D4037]">
                      情緒表現: {entry.mood}
                    </span>
                  </div>
                </div>

                {/* Grid Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 text-xs">
                  <div className="bg-[#FFF8E1] p-2.5 rounded-2xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037]">
                    <span className="text-[10px] text-[#5D4037] font-black block">🍳 飲食發育</span>
                    <span className="font-extrabold text-[#5D4037]">
                      早:{entry.breakfast} / 午:{entry.lunch}
                    </span>
                  </div>
                  <div className="bg-[#E8EAF6] p-2.5 rounded-2xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037]">
                    <span className="text-[10px] text-[#5D4037] font-black block">💤 午睡休息</span>
                    <span className="font-extrabold text-[#5D4037]">{entry.napMinutes} 分鐘</span>
                  </div>
                  <div className="bg-[#FFEBEE] p-2.5 rounded-2xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037]">
                    <span className="text-[10px] text-[#5D4037] font-black block">🌡️ 額溫記錄</span>
                    <span className="font-extrabold text-[#5D4037]">{entry.temperature}</span>
                  </div>
                  <div className="bg-[#E8F5E9] p-2.5 rounded-2xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037]">
                    <span className="text-[10px] text-[#5D4037] font-black block">💬 閱覽狀態</span>
                    <span className="font-extrabold text-[#5D4037] flex items-center gap-1">
                      {entry.isReadByParent ? (
                        <span className="text-[#2E7D32] flex items-center gap-1 font-black">
                          <CheckCheck className="w-3.5 h-3.5" /> 家長已查閱
                        </span>
                      ) : (
                        <span className="text-[#E65100] font-black">待家長簽閱</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Teacher Message Box */}
                <div className="bg-[#E1F5FE] border-2 border-[#5D4037] rounded-2xl p-3.5 mb-3 text-xs shadow-[2px_2px_0px_#5D4037]">
                  <span className="font-black text-[#5D4037] block mb-1">👩‍🏫 老師溫馨叮嚀:</span>
                  <p className="text-[#5D4037] leading-relaxed font-sans font-bold">{entry.teacherMessage}</p>
                </div>

                {/* Parent Reply Section */}
                {entry.parentReply ? (
                  <div className="bg-[#FFEBEE] border-2 border-[#5D4037] rounded-2xl p-3.5 text-xs shadow-[2px_2px_0px_#5D4037]">
                    <span className="font-black text-[#5D4037] block mb-1">👨‍👩‍👧 家長回覆內容 ({selectedStudent.parentName}):</span>
                    <p className="text-[#5D4037] leading-relaxed font-sans font-bold">{entry.parentReply}</p>
                  </div>
                ) : (
                  <div className="bg-[#FFF8E1] border-2 border-[#5D4037] rounded-2xl p-3 text-xs space-y-2 shadow-[2px_2px_0px_#5D4037]">
                    <label className="block font-black text-[#5D4037]">✍️ 填寫家長簽署與回覆留言：</label>
                    <textarea
                      rows={2}
                      value={parentReplyInput}
                      onChange={(e) => setParentReplyInput(e.target.value)}
                      placeholder="如: 收到！謝謝老師，小花回家開心地說明日要帶繪本分享..."
                      className="w-full bg-white border-2 border-[#5D4037] rounded-xl p-2 text-xs text-[#5D4037] font-bold focus:outline-none shadow-[2px_2px_0px_#5D4037]"
                    />

                    {/* Cute Sticker Quick Options */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] text-[#5D4037] font-black">快捷回覆:</span>
                        {['❤️ 謝謝老師', '👍 收到了解', '🌸 辛苦了！', '🌟 寶貝真棒'].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setParentReplyInput((prev) => (prev ? `${prev} ${s}` : s))}
                            className="bg-white border border-[#5D4037] text-[10px] font-black px-2 py-0.5 rounded-lg hover:bg-[#FFF3E0] cursor-pointer"
                          >
                            {s}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleParentSubmitReply(entry.id)}
                        className="bg-[#FF8A65] hover:bg-[#FF7043] text-white font-black px-4 py-1.5 rounded-full border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" /> 簽署並送出回覆
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="bg-[#FFFDE7] border-4 border-[#5D4037] rounded-[2rem] p-8 text-center text-[#5D4037] shadow-[6px_6px_0px_#FFD54F]">
              <MessageSquare className="w-10 h-10 text-[#FF8A65] mx-auto mb-2" />
              <p className="text-xs font-black">尚無此學生的家長聯絡簿紀錄</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
