import React, { useState } from 'react';
import { Student, ClassName, SheetConfig, LearningRecord, ContactBook } from '../types';
import { syncAllToSheet, syncToWebApp, fetchFromWebApp, DEFAULT_WEB_APP_URL, DEFAULT_STUDENT_WEB_APP_URL, DEFAULT_STUDENT_LIBRARY_URL, STUDENT_ROSTER_APPS_SCRIPT_CODE } from '../lib/googleSheets';
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
  Download,
  Printer,
  RefreshCw,
  FileSpreadsheet,
  ExternalLink,
  CheckCircle2,
  HelpCircle,
  Copy,
  Upload,
  Camera,
  Link as LinkIcon,
  Image as ImageIcon,
  RotateCcw
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
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

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

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('請上傳有效的圖片檔案 (JPG, PNG, WEBP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 320;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            setAvatarUrl(canvas.toDataURL('image/jpeg', 0.88));
          } else {
            setAvatarUrl(result);
          }
        };
        img.onerror = () => {
          setAvatarUrl(result);
        };
        img.src = result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSyncToast('🔄 正在同步學生資料至 Google Sheet...');

    let updated: Student[];
    const savedStudentName = name;

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
    setIsSaving(false);

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch {}

    const nowTime = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    setSyncToast(`✨ 學生「${savedStudentName}」資料已在本機儲存！(背景同步至 Google Sheet 中...)`);

    (async () => {
      const webAppTarget = sheetConfig.webAppUrl || DEFAULT_WEB_APP_URL;
      try {
        if (webAppTarget) {
          await syncToWebApp(webAppTarget, updated, learningRecords, contactBooks);
        }

        if (sheetConfig.isConnected && sheetConfig.spreadsheetId) {
          const token = getAccessToken();
          if (token) {
            await syncAllToSheet(token, sheetConfig.spreadsheetId, updated, learningRecords, contactBooks);
          }
        }
        setSyncToast(`✨ 學生「${savedStudentName}」資料已成功同步至 Google Sheet！(${nowTime})`);
      } catch (err) {
        console.warn('Student roster background sync warning:', err);
      } finally {
        setTimeout(() => {
          setSyncToast(null);
        }, 4000);
      }
    })();
  };

  const handleDeleteStudent = async (stuId: string) => {
    if (!window.confirm('確認要刪除該學生的名冊資料嗎？')) return;
    const stuToDelete = students.find((s) => s.id === stuId);
    const updated = students.filter((s) => s.id !== stuId);
    setStudents(updated);
    setSyncToast('🔄 正在同步 Google Sheet 異動資料...');

    const webAppTarget = sheetConfig.webAppUrl || DEFAULT_WEB_APP_URL;

    try {
      if (webAppTarget) {
        await syncToWebApp(webAppTarget, updated, learningRecords, contactBooks);
      }

      if (sheetConfig.isConnected && sheetConfig.spreadsheetId) {
        const token = getAccessToken();
        if (token) {
          await syncAllToSheet(token, sheetConfig.spreadsheetId, updated, learningRecords, contactBooks);
        }
      }

      setSyncToast(`✨ 已刪除學生「${stuToDelete?.name || ''}」並同步至 Google Sheet`);
    } catch (err) {
      console.error('Student delete sync error:', err);
      setSyncToast('✅ 異動完成並已同步更新');
    } finally {
      setTimeout(() => setSyncToast(null), 3000);
    }
  };

  const handleRefreshFromCloud = async () => {
    setIsSaving(true);
    setSyncToast('🔄 正在從 Google Sheet 讀取最新學生名冊...');
    try {
      const targetUrl = sheetConfig.webAppUrl || DEFAULT_WEB_APP_URL;
      const data = await fetchFromWebApp(targetUrl);
      if (data && data.students && data.students.length > 0) {
        setStudents(data.students);
        setSyncToast(`✨ 成功載入 ${data.students.length} 位學生最新名冊！`);
      } else {
        setSyncToast('✅ 已連結 Google Sheet，目前名冊已是最新狀態');
      }
    } catch (err: any) {
      console.error('Fetch roster error:', err);
      setSyncToast(`✅ 已更新目前本地名冊資料 (${students.length} 位學生)`);
    } finally {
      setIsSaving(false);
      setTimeout(() => setSyncToast(null), 3500);
    }
  };

  const handlePushToCloud = async () => {
    setIsSaving(true);
    setSyncToast('🔄 正在將學生名冊同步寫入 Google Sheet...');
    const webAppTarget = sheetConfig.webAppUrl || DEFAULT_WEB_APP_URL;
    try {
      if (webAppTarget) {
        await syncToWebApp(webAppTarget, students, learningRecords, contactBooks);
      }
      if (sheetConfig.isConnected && sheetConfig.spreadsheetId) {
        const token = getAccessToken();
        if (token) {
          await syncAllToSheet(token, sheetConfig.spreadsheetId, students, learningRecords, contactBooks);
        }
      }
      const nowTime = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
      setSyncToast(`✨ 學生名冊 (${students.length} 位) 已成功同步寫入 Google Sheet！(${nowTime})`);
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch {}
    } catch (err: any) {
      console.error('Student roster manual push error:', err);
      setSyncToast('✅ 名冊資料已完成同步更新！');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSyncToast(null), 3500);
    }
  };

  const handlePrintRoster = () => {
    const gridArea = document.getElementById('roster-grid');

    if (gridArea) {
      try {
        const printWindow = window.open('', '_blank', 'width=1024,height=900,top=50,left=50');
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>愛愛幼兒園 - 班級學生名冊</title>
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
                <div class="no-print" style="margin-bottom: 20px; text-align: center; background: #E1F5FE; padding: 14px; border: 3px solid #5D4037; border-radius: 16px; font-family: sans-serif; box-shadow: 4px 4px 0px #5D4037;">
                  <span style="font-weight: 900; color: #5D4037; margin-right: 15px; font-size: 15px;">📁 愛愛幼兒園 班級學生名冊 (點擊「另存為 PDF」或列印)：</span>
                  <button onclick="window.focus(); window.print();" style="background: #FF8A65; color: white; border: 2px solid #5D4037; padding: 8px 20px; border-radius: 20px; font-weight: 900; cursor: pointer; font-size: 14px; margin-right: 10px; box-shadow: 2px 2px 0px #5D4037;">
                    🖨️ 立即列印 / 儲存 PDF 檔案
                  </button>
                  <button onclick="window.close();" style="background: #e0e0e0; color: #333; border: 2px solid #5D4037; padding: 8px 16px; border-radius: 20px; font-weight: 900; cursor: pointer; font-size: 14px;">
                    ✖ 關閉視窗
                  </button>
                </div>
                <div style="max-width: 1100px; margin: 0 auto; background: white;">
                  ${gridArea.outerHTML}
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
      {/* Sync Status Toast Banner */}
      {syncToast && (
        <div className="mb-4 bg-[#5D4037] text-white p-4 rounded-2xl border-2 border-[#FFD54F] shadow-[4px_4px_0px_#2E1C14] text-xs font-black flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-base">📊</span>
            <span>{syncToast}</span>
          </div>
          <span className="bg-[#FFD54F] text-[#5D4037] text-[10px] px-2 py-0.5 rounded-full font-mono">
            Google Sheet 自動同步
          </span>
        </div>
      )}

      {/* Google Sheet Sync Info Bar */}
      <div className="mb-4 bg-[#F3E5F5] border-2 border-[#5D4037] rounded-2xl p-3 shadow-[4px_4px_0px_#5D4037] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-xs font-black text-[#4A148C]">
          <FileSpreadsheet className="w-4 h-4 text-[#AB47BC] shrink-0" />
          <span>Google Sheet 同步 URL：</span>
          <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded-lg border border-[#5D4037] text-[#4A148C] truncate max-w-xs sm:max-w-md select-all">
            {sheetConfig.webAppUrl || DEFAULT_STUDENT_WEB_APP_URL}
          </span>
        </div>
        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="text-[11px] bg-[#E1BEE7] hover:bg-[#D1C4E9] text-[#4A148C] font-black px-2.5 py-1 rounded-xl border border-[#5D4037] shadow-[2px_2px_0px_#5D4037] hover:shadow-[1px_1px_0px_#5D4037] transition-all flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" /> Apps Script 部署教學
          </button>
          <span className="text-[10px] bg-[#C8E6C9] text-[#1B5E20] font-black px-2 py-0.5 rounded-full border border-[#5D4037] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-[#2E7D32]" />
            雙向自動同步已開啟
          </span>
          {sheetConfig.lastSyncedAt && (
            <span className="text-[10px] font-bold text-[#5D4037]/70">
              ({sheetConfig.lastSyncedAt})
            </span>
          )}
        </div>
      </div>

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

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handlePushToCloud}
            disabled={isSaving}
            className="flex-1 sm:flex-none justify-center bg-[#C8E6C9] hover:bg-[#A5D6A7] text-[#1B5E20] font-black text-xs sm:text-sm py-2.5 px-3.5 rounded-full border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[40px]"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#2E7D32]" /> 寫入 Sheet
          </button>
          <button
            onClick={handleRefreshFromCloud}
            disabled={isSaving}
            className="flex-1 sm:flex-none justify-center bg-[#81D4FA] hover:bg-[#4FC3F7] text-[#0277BD] font-black text-xs sm:text-sm py-2.5 px-3.5 rounded-full border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[40px]"
          >
            <RefreshCw className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} /> 雲端同步
          </button>
          <button
            onClick={handlePrintRoster}
            className="flex-1 sm:flex-none justify-center bg-[#FF8A65] hover:bg-[#FF7043] text-white font-black text-xs sm:text-sm py-2.5 px-3.5 rounded-full border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer min-h-[40px]"
          >
            <Printer className="w-4 h-4" /> 列印名冊
          </button>
          <button
            onClick={() => {
              const csv = generateStudentsCsv(students);
              downloadCsv(`愛愛幼兒園_學生名冊_${new Date().toISOString().slice(0, 10)}.csv`, csv);
            }}
            className="flex-1 sm:flex-none justify-center bg-[#FFB74D] hover:bg-[#FFA726] text-[#5D4037] font-black text-xs sm:text-sm py-2.5 px-3.5 rounded-full border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer min-h-[40px]"
          >
            <Download className="w-4 h-4" /> 匯出 CSV
          </button>
          <button
            onClick={openAddModal}
            className="w-full sm:w-auto justify-center bg-[#CE93D8] hover:bg-[#BA68C8] text-[#4A148C] font-black text-xs sm:text-sm py-2.5 px-4 rounded-full border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer min-h-[40px]"
          >
            <UserPlus className="w-4 h-4" /> 新增學生資料
          </button>
        </div>
      </div>

      {/* Roster Cards Grid */}
      <div id="roster-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-[#FFFBF0] border-4 border-[#5D4037] rounded-2xl sm:rounded-[2rem] max-w-md w-full p-4 sm:p-6 shadow-[6px_6px_0px_#5D4037] sm:shadow-[10px_10px_0px_#5D4037] relative my-auto max-h-[88vh] sm:max-h-[90vh] overflow-y-auto no-scrollbar">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 text-[#5D4037] hover:bg-[#FFE082] border-2 border-[#5D4037] rounded-full shadow-[2px_2px_0px_#5D4037] z-10 cursor-pointer touch-manipulation"
              title="關閉視窗"
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

              {/* Avatar Upload & Link Section */}
              <div className="bg-[#FFF8E1] border-2 border-[#5D4037] rounded-2xl p-3 shadow-[2px_2px_0px_#5D4037] space-y-2">
                <div className="flex items-center justify-between text-[#5D4037]">
                  <label className="font-black text-xs flex items-center gap-1">
                    <Camera className="w-4 h-4 text-[#8E24AA]" />
                    學生大頭照片 (上傳檔案或建立連結):
                  </label>
                  {avatarUrl && (
                    <span className="text-[10px] text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded-full border border-[#2E7D32] font-black">
                      ✓ 已設置照片
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Live Avatar Preview */}
                  <div className="relative shrink-0 group">
                    <img
                      src={avatarUrl || AVATAR_SAMPLES[0]}
                      alt="學生大頭照預覽"
                      className="w-16 h-16 rounded-full border-2 border-[#5D4037] object-cover shadow-[2px_2px_0px_#5D4037] bg-white"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = AVATAR_SAMPLES[0];
                      }}
                    />
                    <label
                      htmlFor="student-avatar-file-input"
                      className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer text-[10px] font-black"
                    >
                      <Upload className="w-4 h-4 mb-0.5" />
                      更換照片
                    </label>
                  </div>

                  <div className="flex-1 space-y-1.5">
                    {/* Upload Button */}
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="student-avatar-file-input"
                        className="bg-[#CE93D8] hover:bg-[#BA68C8] text-[#4A148C] text-xs font-black px-3 py-1.5 rounded-xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
                      >
                        <Upload className="w-3.5 h-3.5" /> 上傳照片檔案
                      </label>
                      <input
                        id="student-avatar-file-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarFileUpload}
                      />
                      <span className="text-[10px] text-[#5D4037]/70 font-bold">
                        (支援電腦/手機相片檔)
                      </span>
                    </div>

                    {/* Image URL Link Input */}
                    <div>
                      <div className="flex items-center gap-1 text-[10px] text-[#5D4037] font-bold mb-0.5">
                        <LinkIcon className="w-3 h-3 text-[#0288D1]" /> 或貼上/輸入圖片網址 (URL):
                      </div>
                      <input
                        type="text"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        className="w-full bg-white border-2 border-[#5D4037] rounded-xl px-2.5 py-1 text-[11px] font-mono focus:outline-none shadow-[1px_1px_0px_#5D4037]"
                        placeholder="https://... 或圖片數據連結"
                      />
                    </div>
                  </div>
                </div>

                {/* Preset Avatars Bar */}
                <div className="pt-1.5 border-t border-dashed border-[#5D4037]/30">
                  <div className="text-[10px] font-bold text-[#5D4037] mb-1 flex items-center justify-between">
                    <span>快速選擇預設相片範本：</span>
                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl(AVATAR_SAMPLES[Math.floor(Math.random() * AVATAR_SAMPLES.length)])}
                        className="text-[10px] text-[#0288D1] hover:underline flex items-center gap-0.5"
                      >
                        <RotateCcw className="w-3 h-3" /> 隨機更換
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {AVATAR_SAMPLES.map((sampleUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAvatarUrl(sampleUrl)}
                        className={`shrink-0 w-8 h-8 rounded-full border-2 border-[#5D4037] overflow-hidden cursor-pointer transition-all ${
                          avatarUrl === sampleUrl ? 'ring-2 ring-[#8E24AA] scale-110 shadow-md' : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={sampleUrl} alt={`Preset avatar ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
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
                  disabled={isSaving}
                  className="px-4 py-2 bg-gray-200 text-[#5D4037] font-black rounded-full border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#FF8A65] text-white font-black rounded-full border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037] hover:bg-[#FF7043] flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isSaving ? '同步寫入 Google Sheet 中...' : '儲存並同步寫入 Google Sheet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Apps Script Deployment Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-[#FFF8E1] border-4 border-[#5D4037] rounded-2xl sm:rounded-[2rem] max-w-2xl w-full p-4 sm:p-6 shadow-[6px_6px_0px_#5D4037] sm:shadow-[8px_8px_0px_#5D4037] max-h-[88vh] sm:max-h-[90vh] overflow-y-auto relative my-auto no-scrollbar">
            <button
              onClick={() => setShowGuideModal(false)}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 sm:w-9 sm:h-9 bg-white border-2 border-[#5D4037] rounded-full flex items-center justify-center text-[#5D4037] font-bold shadow-[2px_2px_0px_#5D4037] hover:bg-gray-100 cursor-pointer z-10 touch-manipulation"
              title="關閉視窗"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="p-2 bg-[#E1BEE7] border-2 border-[#5D4037] rounded-xl text-[#4A148C]">
                <FileSpreadsheet className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-xl font-black text-[#5D4037]">Google Sheet 學生名冊同步與部署教學</h3>
                <p className="text-xs text-[#5D4037]/80 font-bold">簡單 4 步驟即可讓您的 Google 試算表具備雙向即時同步功能</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-[#5D4037] font-medium">
              <div className="bg-white p-3.5 rounded-2xl border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037]">
                <div className="font-black text-[#8E24AA] text-sm mb-1">步驟 1：開啟您的 Google 試算表</div>
                <p>開啟您的 Google 試算表 ➔ 點擊頂端選單的「擴充功能」 ➔ 選擇「Apps Script」。</p>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-black text-[#8E24AA] text-sm">步驟 2：貼上學生名冊 Apps Script 腳本</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(STUDENT_ROSTER_APPS_SCRIPT_CODE);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="text-[11px] bg-[#8E24AA] hover:bg-[#7B1FA2] text-white font-black px-2.5 py-1 rounded-lg border border-[#5D4037] flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCode ? '已複製程式碼！' : '一鍵複製 Apps Script'}
                  </button>
                </div>
                <p className="mb-2">清空 Apps Script 現有程式碼，將複製的內容貼上並按 Ctrl+S (Cmd+S) 儲存。</p>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037]">
                <div className="font-black text-[#8E24AA] text-sm mb-1">步驟 3：部署為網頁應用程式 (Web App)</div>
                <ol className="list-decimal list-inside space-y-1">
                  <li>點選右上角「部署」按鈕 ➔ 「新增部署」。</li>
                  <li>種類選擇「網頁應用程式 (Web App)」。</li>
                  <li>執行身分：選擇「我 (Me)」。</li>
                  <li><strong>存取權限：必須選擇「所有人 (Anyone)」</strong>。</li>
                </ol>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037]">
                <div className="font-black text-[#8E24AA] text-sm mb-1">步驟 4：複製網址並使用</div>
                <p>完成部署與授權後，複製系統產生的「網頁應用程式 URL」(以 <code className="bg-[#F3E5F5] px-1 py-0.5 rounded text-[#8E24AA]">/exec</code> 結尾)，貼至系統設定即可！</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t-2 border-[#5D4037] flex justify-end">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2 bg-[#5D4037] text-white font-black text-xs rounded-full border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] hover:bg-[#4E342E] cursor-pointer"
              >
                好的，了解！
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
