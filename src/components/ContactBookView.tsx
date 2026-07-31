import React, { useState } from 'react';
import { Student, ContactBook, RoleMode, SheetConfig } from '../types';
import { syncAllToSheet } from '../lib/googleSheets';
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
  Plus 
} from 'lucide-react';

interface ContactBookViewProps {
  roleMode: RoleMode;
  students: Student[];
  contactBooks: ContactBook[];
  setContactBooks: React.Dispatch<React.SetStateAction<ContactBook[]>>;
  selectedStudentId: string;
  setSelectedStudentId: (id: string) => void;
  sheetConfig: SheetConfig;
  learningRecords: any[];
}

export const ContactBookView: React.FC<ContactBookViewProps> = ({
  roleMode,
  students,
  contactBooks,
  setContactBooks,
  selectedStudentId,
  setSelectedStudentId,
  sheetConfig,
  learningRecords,
}) => {
  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];
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

    // Sync to sheet
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
            家長聯絡簿 (れんらくちょう)
            <Heart className="w-6 h-6 text-[#FF5252] fill-[#FF5252] animate-pulse" />
          </h2>
          <p className="text-xs text-[#5D4037]/80 font-bold mt-1">
            即時紀錄幼兒在園飲食、睡眠、情緒表達與雙向留言互動。
          </p>
        </div>

        {/* Student Select Bar */}
        <div className="bg-white p-3 rounded-2xl border-2 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] flex items-center gap-3">
          <span className="text-xs font-black text-[#5D4037]">選擇孩子:</span>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="bg-[#FFFBF0] border-2 border-[#5D4037] rounded-xl px-3 py-1 text-xs font-bold text-[#5D4037] focus:outline-none shadow-[2px_2px_0px_#5D4037]"
          >
            {students.map((stu) => (
              <option key={stu.id} value={stu.id}>
                {stu.className} - {stu.seatNumber}號 {stu.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Teacher Entry Form (Only visible in Teacher Mode) */}
        {roleMode === 'teacher' && (
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
        )}

        {/* Right Column: Postcard Style Contact Book Entries */}
        <div className={roleMode === 'teacher' ? 'lg:col-span-2 space-y-4' : 'lg:col-span-3 space-y-4'}>
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
                ) : roleMode === 'parent' ? (
                  <div className="bg-[#FFF8E1] border-2 border-[#5D4037] rounded-2xl p-3 text-xs space-y-2 shadow-[2px_2px_0px_#5D4037]">
                    <label className="block font-black text-[#5D4037]">✍️ 寫下給老師的回覆或在家觀察：</label>
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
                        <span className="text-[10px] text-[#5D4037] font-black">快捷貼圖:</span>
                        {['❤️ 謝謝老師', '👍 收到了解', '🌸 辛苦了！', '🌟 寶貝真棒'].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setParentReplyInput((prev) => (prev ? `${prev} ${s}` : s))}
                            className="bg-white border border-[#5D4037] text-[10px] font-black px-2 py-0.5 rounded-lg hover:bg-[#FFF3E0]"
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
                ) : (
                  <div className="text-[11px] text-[#5D4037]/60 font-bold italic text-right">
                    （家長尚未簽署回覆）
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
