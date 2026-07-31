import React, { useState } from 'react';
import { Student, ClassName, SheetConfig, LearningRecord, ContactBook } from '../types';
import { syncAllToSheet, syncToWebApp } from '../lib/googleSheets';
import { getAccessToken } from '../lib/firebase';
import confetti from 'canvas-confetti';
import { 
  Users, 
  UserPlus, 
  Edit3, 
  Trash2, 
  GraduationCap, 
  Phone, 
  Sparkles, 
  Check, 
  X, 
  BookOpen,
  Download
} from 'lucide-react';
import { generateStudentsCsv, downloadCsv } from '../lib/csvExport';

interface StudentRosterViewProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  learningRecords: LearningRecord[];
  contactBooks: ContactBook[];
  sheetConfig: SheetConfig;
}

const AVATAR_SAMPLES = [
  'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1595454223600-91fbddbbf255?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=200&auto=format&fit=crop&q=80',
];

export const StudentRosterView: React.FC<StudentRosterViewProps> = ({
  students,
  setStudents,
  learningRecords,
  contactBooks,
  sheetConfig,
}) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form fields
  const [name, setName] = useState<string>('');
  const [seatNumber, setSeatNumber] = useState<string>('05');
  const [className, setClassName] = useState<ClassName>('大班 (櫻桃班)');
  const [gender, setGender] = useState<'boy' | 'girl'>('girl');
  const [avatarUrl, setAvatarUrl] = useState<string>(AVATAR_SAMPLES[0]);
  const [parentName, setParentName] = useState<string>('');
  const [parentContact, setParentContact] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const openAddModal = () => {
    setEditingStudent(null);
    setName('');
    setSeatNumber(`0${students.length + 1}`);
    setClassName('大班 (櫻桃班)');
    setGender('girl');
    setAvatarUrl(AVATAR_SAMPLES[Math.floor(Math.random() * AVATAR_SAMPLES.length)]);
    setParentName('');
    setParentContact('');
    setNotes('');
    setShowModal(true);
  };

  const openEditModal = (stu: Student) => {
    setEditingStudent(stu);
    setName(stu.name);
    setSeatNumber(stu.seatNumber);
    setClassName(stu.className);
    setGender(stu.gender);
    setAvatarUrl(stu.avatarUrl || AVATAR_SAMPLES[0]);
    setParentName(stu.parentName);
    setParentContact(stu.parentContact);
    setNotes(stu.notes || '');
    setShowModal(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    let updated: Student[];

    if (editingStudent) {
      updated = students.map((s) =>
        s.id === editingStudent.id
          ? { ...s, name, seatNumber, className, gender, avatarUrl, parentName, parentContact, notes }
          : s
      );
    } else {
      const newStu: Student = {
        id: `stu-${Date.now()}`,
        name,
        seatNumber,
        className,
        gender,
        avatarUrl,
        parentName,
        parentContact,
        notes,
      };
      updated = [...students, newStu];
    }

    setStudents(updated);
    setShowModal(false);

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch {}

    // Auto sync Web App URL
    if (sheetConfig.webAppUrl) {
      try {
        await syncToWebApp(sheetConfig.webAppUrl, updated, learningRecords, contactBooks);
      } catch (err) {
        console.error('Student roster Web App sync failed:', err);
      }
    }

    // Auto sync sheet
    if (sheetConfig.isConnected && sheetConfig.spreadsheetId) {
      try {
        const token = getAccessToken();
        if (token) {
          await syncAllToSheet(token, sheetConfig.spreadsheetId, updated, learningRecords, contactBooks);
        }
      } catch (err) {
        console.error('Sheet sync error:', err);
      }
    }
  };

  const handleDeleteStudent = async (stuId: string) => {
    if (!window.confirm('確認要刪除該學生的名冊資料嗎？')) return;
    const updated = students.filter((s) => s.id !== stuId);
    setStudents(updated);

    if (sheetConfig.webAppUrl) {
      try {
        await syncToWebApp(sheetConfig.webAppUrl, updated, learningRecords, contactBooks);
      } catch (err) {
        console.error('Student roster Web App sync failed:', err);
      }
    }

    if (sheetConfig.isConnected && sheetConfig.spreadsheetId) {
      try {
        const token = getAccessToken();
        if (token) {
          await syncAllToSheet(token, sheetConfig.spreadsheetId, updated, learningRecords, contactBooks);
        }
      } catch (err) {
        console.error('Sheet sync error:', err);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Top Banner */}
      <div className="bg-[#E1F5FE] border-4 border-[#5D4037] rounded-[2rem] p-6 shadow-[6px_6px_0px_#81D4FA] mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#5D4037] text-white font-black text-xs px-3 py-1 rounded-full shadow-xs">
              📁 班級學生名冊
            </span>
            <span className="bg-white text-[#5D4037] border-2 border-[#5D4037] font-black text-xs px-3 py-1 rounded-full shadow-[2px_2px_0px_#5D4037]">
              共有 {students.length} 位幼童
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-[#5D4037] flex items-center gap-2 italic">
            學生名冊與檔案資料
            <GraduationCap className="w-7 h-7 text-[#0288D1]" />
          </h2>
          <p className="text-xs text-[#5D4037]/80 font-bold mt-1">
            管理學生基本個人檔、大頭貼、家長聯絡資訊及學習歷程累計檔案。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              const csv = generateStudentsCsv(students);
              downloadCsv(`愛愛幼兒園_學生名冊_${new Date().toISOString().slice(0, 10)}.csv`, csv);
            }}
            className="bg-[#FFB74D] hover:bg-[#FFA726] text-[#5D4037] font-black text-sm py-2.5 px-4 rounded-full border-2 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] hover:shadow-[2px_2px_0px_#5D4037] transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" /> 匯出名冊 CSV
          </button>
          <button
            onClick={openAddModal}
            className="bg-[#CE93D8] hover:bg-[#BA68C8] text-[#4A148C] font-black text-sm py-2.5 px-5 rounded-full border-2 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] hover:shadow-[2px_2px_0px_#5D4037] transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> 新增學生資料
          </button>
        </div>
      </div>

      {/* Roster Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {students.map((stu) => {
          const stuRecordsCount = learningRecords.filter((r) => r.studentId === stu.id).length;
          const stuContactCount = contactBooks.filter((c) => c.studentId === stu.id).length;

          return (
            <div
              key={stu.id}
              className="bg-white border-2 border-[#5D4037] rounded-3xl p-4 shadow-[4px_4px_0px_#5D4037] hover:shadow-[6px_6px_0px_#5D4037] transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-[#FFF9C4] text-[#5D4037] text-[11px] font-black px-3 py-0.5 rounded-full border border-[#5D4037]">
                    {stu.className}
                  </span>
                  <span className="text-xs font-black text-[#5D4037] font-mono bg-[#E3F2FD] px-2 py-0.5 rounded-full border border-[#5D4037]">
                    {stu.seatNumber} 號
                  </span>
                </div>

                {/* Avatar & Name */}
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={stu.avatarUrl}
                    alt={stu.name}
                    className="w-14 h-14 rounded-full border-2 border-[#5D4037] object-cover shadow-[2px_2px_0px_#5D4037]"
                  />
                  <div>
                    <h3 className="font-black text-lg text-[#5D4037] flex items-center gap-1">
                      {stu.name}
                      <span className="text-xs">
                        {stu.gender === 'boy' ? '👦' : '👧'}
                      </span>
                    </h3>
                    <p className="text-xs text-[#5D4037]/80 font-bold flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-[#0288D1]" /> {stu.parentName} ({stu.parentContact || '暫無'})
                    </p>
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="grid grid-cols-2 gap-2 mb-3 text-[11px] font-bold">
                  <div className="bg-[#FFEBEE] p-2 rounded-2xl text-[#C62828] border border-[#5D4037] text-center">
                    <span className="block text-[10px] text-[#5D4037]/70 font-black">學習區紀錄</span>
                    <span className="text-sm font-black">{stuRecordsCount} 篇</span>
                  </div>
                  <div className="bg-[#E0F7FA] p-2 rounded-2xl text-[#006064] border border-[#5D4037] text-center">
                    <span className="block text-[10px] text-[#5D4037]/70 font-black">聯絡簿話語</span>
                    <span className="text-sm font-black">{stuContactCount} 則</span>
                  </div>
                </div>

                {stu.notes && (
                  <p className="text-[11px] text-[#5D4037] bg-[#FFFDE7] p-2 rounded-2xl border border-[#5D4037] line-clamp-2 font-bold">
                    💡 {stu.notes}
                  </p>
                )}
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t-2 border-dashed border-[#5D4037]/30">
                <button
                  onClick={() => openEditModal(stu)}
                  className="p-1.5 px-3 rounded-full bg-[#E1BEE7] text-[#4A148C] border-2 border-[#5D4037] text-xs font-black flex items-center gap-1 shadow-[2px_2px_0px_#5D4037]"
                >
                  <Edit3 className="w-3.5 h-3.5" /> 編輯
                </button>
                <button
                  onClick={() => handleDeleteStudent(stu.id)}
                  className="p-1.5 px-3 rounded-full bg-[#FFCDD2] text-[#B71C1C] border-2 border-[#5D4037] text-xs font-black flex items-center gap-1 shadow-[2px_2px_0px_#5D4037]"
                >
                  <Trash2 className="w-3.5 h-3.5" /> 刪除
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Student Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#FFFBF0] border-4 border-[#5D4037] rounded-[2rem] max-w-md w-full p-6 shadow-[10px_10px_0px_#5D4037] relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 text-[#5D4037] hover:bg-[#FFE082] border-2 border-[#5D4037] rounded-full shadow-[2px_2px_0px_#5D4037]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-black text-xl text-[#5D4037] mb-4 flex items-center gap-2 italic">
              <Sparkles className="w-5 h-5 text-[#FFB74D]" />
              {editingStudent ? '編輯學生資料' : '新增學生資料'}
            </h3>

            <form onSubmit={handleSaveStudent} className="space-y-3 text-xs font-black text-[#5D4037]">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#5D4037] mb-1">學生姓名:</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border-2 border-[#5D4037] rounded-xl px-3 py-1.5 focus:outline-none shadow-[2px_2px_0px_#5D4037]"
                    placeholder="如: 林小花"
                  />
                </div>
                <div>
                  <label className="block text-[#5D4037] mb-1">座號:</label>
                  <input
                    type="text"
                    required
                    value={seatNumber}
                    onChange={(e) => setSeatNumber(e.target.value)}
                    className="w-full bg-white border-2 border-[#5D4037] rounded-xl px-3 py-1.5 focus:outline-none shadow-[2px_2px_0px_#5D4037]"
                    placeholder="如: 01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#5D4037] mb-1">班級:</label>
                  <select
                    value={className}
                    onChange={(e) => setClassName(e.target.value as ClassName)}
                    className="w-full bg-white border-2 border-[#5D4037] rounded-xl px-3 py-1.5 font-bold shadow-[2px_2px_0px_#5D4037]"
                  >
                    <option value="大班 (櫻桃班)">大班 (櫻桃班)</option>
                    <option value="中班 (草莓班)">中班 (草莓班)</option>
                    <option value="小班 (蘋果班)">小班 (蘋果班)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#5D4037] mb-1">性別:</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'boy' | 'girl')}
                    className="w-full bg-white border-2 border-[#5D4037] rounded-xl px-3 py-1.5 font-bold shadow-[2px_2px_0px_#5D4037]"
                  >
                    <option value="girl">女孩 👧</option>
                    <option value="boy">男孩 👦</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#5D4037] mb-1">家長稱呼:</label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full bg-white border-2 border-[#5D4037] rounded-xl px-3 py-1.5 focus:outline-none shadow-[2px_2px_0px_#5D4037]"
                    placeholder="如: 林媽媽"
                  />
                </div>
                <div>
                  <label className="block text-[#5D4037] mb-1">家長電話:</label>
                  <input
                    type="text"
                    value={parentContact}
                    onChange={(e) => setParentContact(e.target.value)}
                    className="w-full bg-white border-2 border-[#5D4037] rounded-xl px-3 py-1.5 focus:outline-none shadow-[2px_2px_0px_#5D4037]"
                    placeholder="如: 0912-345-678"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#5D4037] mb-1">老師學習觀察筆記:</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border-2 border-[#5D4037] rounded-xl p-2 focus:outline-none font-sans shadow-[2px_2px_0px_#5D4037]"
                  placeholder="紀錄性向特質或飲食習慣..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 text-[#5D4037] font-black rounded-full border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037]"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#FF8A65] text-white font-black rounded-full border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037] hover:bg-[#FF7043]"
                >
                  儲存學生檔案
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
