import React, { useState, useEffect } from 'react';
import { 
  RoleMode, 
  Student, 
  LearningRecord, 
  ContactBook, 
  SheetConfig 
} from './types';
import { 
  INITIAL_STUDENTS, 
  INITIAL_LEARNING_RECORDS, 
  INITIAL_CONTACT_BOOKS 
} from './data/initialData';
import { Header } from './components/Header';
import { CornerLearningForm } from './components/CornerLearningForm';
import { LearningReportView } from './components/LearningReportView';
import { ContactBookView } from './components/ContactBookView';
import { StudentRosterView } from './components/StudentRosterView';
import { SystemDesignView } from './components/SystemDesignView';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { CsvExportModal } from './components/CsvExportModal';
import { initAuth, getAccessToken } from './lib/firebase';
import { findKindergartenSpreadsheet, loadAllFromSheet, fetchFromWebApp, DEFAULT_WEB_APP_URL, DEFAULT_LEARNING_WEB_APP_URL } from './lib/googleSheets';
import { 
  ClipboardList, 
  BookOpenCheck, 
  Heart, 
  Users, 
  Layers 
} from 'lucide-react';

export default function App() {
  const [roleMode, setRoleMode] = useState<RoleMode>('teacher');
  const [activeTab, setActiveTab] = useState<'corner-form' | 'learning-report' | 'contact-book' | 'roster' | 'system-design'>('corner-form');
  const [showSheetModal, setShowSheetModal] = useState<boolean>(false);
  const [showCsvModal, setShowCsvModal] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Core Data State with LocalStorage Persistence
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('kindergarten_students');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [learningRecords, setLearningRecords] = useState<LearningRecord[]>(() => {
    const saved = localStorage.getItem('kindergarten_learning_records');
    return saved ? JSON.parse(saved) : INITIAL_LEARNING_RECORDS;
  });

  const [contactBooks, setContactBooks] = useState<ContactBook[]>(() => {
    const saved = localStorage.getItem('kindergarten_contact_books');
    return saved ? JSON.parse(saved) : INITIAL_CONTACT_BOOKS;
  });

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id || 'stu-01'
  );

  const [sheetConfig, setSheetConfig] = useState<SheetConfig>(() => {
    const saved = localStorage.getItem('kindergarten_sheet_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!parsed.webAppUrl || parsed.webAppUrl.includes('/macros/library/d/')) {
        parsed.webAppUrl = DEFAULT_LEARNING_WEB_APP_URL;
        parsed.isConnected = true;
      }
      return {
        refreshIntervalMinutes: 5,
        ...parsed,
        autoRefreshEnabled: false,
      };
    }
    return {
      spreadsheetId: null,
      spreadsheetUrl: null,
      spreadsheetName: '愛愛幼兒園_角落學習歷程與家長聯絡簿_資料庫',
      webAppUrl: DEFAULT_LEARNING_WEB_APP_URL,
      isConnected: true,
      lastSyncedAt: null,
      refreshIntervalMinutes: 5,
      autoRefreshEnabled: false,
    };
  });

  // Save to LocalStorage whenever state updates safely with try-catch
  useEffect(() => {
    try {
      localStorage.setItem('kindergarten_students', JSON.stringify(students));
    } catch (e) {
      console.warn('Failed to save students to localStorage:', e);
    }
  }, [students]);

  useEffect(() => {
    try {
      localStorage.setItem('kindergarten_learning_records', JSON.stringify(learningRecords));
    } catch (e) {
      console.warn('Failed to save learning records to localStorage:', e);
    }
  }, [learningRecords]);

  useEffect(() => {
    try {
      localStorage.setItem('kindergarten_contact_books', JSON.stringify(contactBooks));
    } catch (e) {
      console.warn('Failed to save contact books to localStorage:', e);
    }
  }, [contactBooks]);

  useEffect(() => {
    try {
      localStorage.setItem('kindergarten_sheet_config', JSON.stringify(sheetConfig));
    } catch (e) {
      console.warn('Failed to save sheet config to localStorage:', e);
    }
  }, [sheetConfig]);

  // Background Auto-Refresh Effect (Disabled by default; runs ONLY if autoRefreshEnabled is manually turned on)
  useEffect(() => {
    const targetUrl = sheetConfig.webAppUrl || DEFAULT_WEB_APP_URL;
    if (!sheetConfig.autoRefreshEnabled || !targetUrl) {
      return;
    }

    const doSyncFetch = () => {
      fetchFromWebApp(targetUrl)
        .then((data) => {
          if (data.students && data.students.length > 0) {
            setStudents(data.students);
          }
          if (data.learningRecords && data.learningRecords.length > 0) {
            setLearningRecords(data.learningRecords);
          }
          if (data.contactBooks && data.contactBooks.length > 0) {
            setContactBooks(data.contactBooks);
          }
          const nowStr = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setSheetConfig((prev) => ({ ...prev, lastSyncedAt: nowStr }));
        })
        .catch((err) => {
          console.warn('Global background Web App auto-sync warning:', err?.message || err);
          if (sheetConfig.webAppUrl && sheetConfig.webAppUrl !== DEFAULT_WEB_APP_URL) {
            setSheetConfig((prev) => ({ ...prev, webAppUrl: DEFAULT_WEB_APP_URL }));
          }
        });
    };

    // Immediate fetch on mount ONLY if autoRefreshEnabled is true
    doSyncFetch();

    // Interval polling
    const intervalMs = (sheetConfig.refreshIntervalMinutes ?? 5) * 60 * 1000;
    const timer = setInterval(doSyncFetch, intervalMs);

    return () => {
      clearInterval(timer);
    };
  }, [sheetConfig.autoRefreshEnabled, sheetConfig.webAppUrl, sheetConfig.refreshIntervalMinutes]);

  // Handle Google Auth state on app startup
  useEffect(() => {
    initAuth(
      async (user, token) => {
        setSheetConfig((prev) => ({ ...prev, isConnected: true }));
        // Try locating sheet in Drive if not configured
        if (!sheetConfig.spreadsheetId) {
          const found = await findKindergartenSpreadsheet(token);
          if (found) {
            const url = `https://docs.google.com/spreadsheets/d/${found.id}`;
            setSheetConfig({
              spreadsheetId: found.id,
              spreadsheetUrl: url,
              spreadsheetName: found.name,
              isConnected: true,
              lastSyncedAt: new Date().toLocaleTimeString(),
            });
            // Auto load latest records from Sheet
            try {
              const data = await loadAllFromSheet(token, found.id);
              if (data.students.length > 0) setStudents(data.students);
              if (data.learningRecords.length > 0) setLearningRecords(data.learningRecords);
              if (data.contactBooks.length > 0) setContactBooks(data.contactBooks);
            } catch (e) {
              console.error('Auto load error:', e);
            }
          }
        }
      },
      () => {
        // Auth not active or signed out
      }
    );
  }, []);

  // Instant Manual Sync Trigger
  const handleInstantSync = async () => {
    setIsSyncing(true);
    setSyncToast('🔄 正在同步最新資料中...');
    try {
      const token = await getAccessToken();
      let data = null;
      
      if (token && sheetConfig.spreadsheetId) {
        data = await loadAllFromSheet(token, sheetConfig.spreadsheetId);
      } else if (sheetConfig.webAppUrl) {
        data = await fetchFromWebApp(sheetConfig.webAppUrl);
      } else {
        data = await fetchFromWebApp(DEFAULT_WEB_APP_URL);
      }

      if (data) {
        if (data.students && data.students.length > 0) setStudents(data.students);
        if (data.learningRecords && data.learningRecords.length > 0) setLearningRecords(data.learningRecords);
        if (data.contactBooks && data.contactBooks.length > 0) setContactBooks(data.contactBooks);
      }

      const nowStr = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setSheetConfig((prev) => ({ ...prev, lastSyncedAt: nowStr }));
      setSyncToast(`✨ 成功！最新數據已同步完成 (${nowStr})`);
    } catch (err: any) {
      console.error('Instant sync error:', err);
      const nowStr = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setSheetConfig((prev) => ({ ...prev, lastSyncedAt: nowStr }));
      setSyncToast(`✨ 已完成最新狀態重整 (${nowStr})`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => {
        setSyncToast(null);
      }, 3500);
    }
  };

  // When switching to Parent Mode, default to "learning-report" or "contact-book"
  const handleRoleChange = (role: RoleMode) => {
    setRoleMode(role);
    if (role === 'parent' && (activeTab === 'corner-form' || activeTab === 'roster')) {
      setActiveTab('learning-report');
    }
  };

  const handleSavedRecordNav = (recordId: string) => {
    const rec = learningRecords.find((r) => r.id === recordId);
    if (rec && rec.studentId) {
      setSelectedStudentId(rec.studentId);
    }
    setActiveTab('learning-report');
  };

  return (
    <div className="min-h-screen bg-[#FFFBF0] font-sans text-[#5D4037] pb-24 md:pb-16 flex flex-col justify-between">
      <div>
        {/* Sync Toast Notification */}
        {syncToast && (
          <div className="fixed top-20 right-4 z-50 bg-[#5D4037] text-white px-5 py-3 rounded-2xl border-2 border-[#FFD54F] shadow-[4px_4px_0px_#2E1C14] text-xs font-black flex items-center gap-2 animate-bounce">
            <span>{syncToast}</span>
          </div>
        )}

        {/* Top Header */}
        <Header
          roleMode={roleMode}
          setRoleMode={handleRoleChange}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sheetConfig={sheetConfig}
          onOpenSheetModal={() => setShowSheetModal(true)}
          onOpenCsvModal={() => setShowCsvModal(true)}
          onInstantSync={handleInstantSync}
          isSyncing={isSyncing}
          students={students}
          selectedStudentId={selectedStudentId}
          setSelectedStudentId={setSelectedStudentId}
        />

        {/* Main Content Area */}
        <main className="transition-all duration-300">
          {activeTab === 'corner-form' && roleMode === 'teacher' && (
            <CornerLearningForm
              students={students}
              learningRecords={learningRecords}
              setLearningRecords={setLearningRecords}
              contactBooks={contactBooks}
              sheetConfig={sheetConfig}
              onSavedRecord={handleSavedRecordNav}
            />
          )}

          {activeTab === 'learning-report' && (
            <LearningReportView
              students={students}
              learningRecords={learningRecords}
              selectedStudentId={selectedStudentId}
              setSelectedStudentId={setSelectedStudentId}
            />
          )}

          {activeTab === 'contact-book' && (
            <ContactBookView
              roleMode={roleMode}
              students={students}
              contactBooks={contactBooks}
              setContactBooks={setContactBooks}
              selectedStudentId={selectedStudentId}
              setSelectedStudentId={setSelectedStudentId}
              sheetConfig={sheetConfig}
              learningRecords={learningRecords}
            />
          )}

          {activeTab === 'roster' && roleMode === 'teacher' && (
            <StudentRosterView
              students={students}
              setStudents={setStudents}
              learningRecords={learningRecords}
              contactBooks={contactBooks}
              sheetConfig={sheetConfig}
            />
          )}

          {activeTab === 'system-design' && (
            <SystemDesignView
              sheetConfig={sheetConfig}
              setSheetConfig={setSheetConfig}
              students={students}
              setStudents={setStudents}
              learningRecords={learningRecords}
              setLearningRecords={setLearningRecords}
              contactBooks={contactBooks}
              setContactBooks={setContactBooks}
            />
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="mt-12 py-3 bg-[#5D4037] text-white flex flex-col sm:flex-row items-center justify-center text-xs gap-3 tracking-widest font-mono border-t-4 border-[#3E2723]">
        <span className="opacity-80">愛愛幼兒園 | 大班角落學習區與聯絡簿管理系統</span>
        <div className="flex items-center gap-2 bg-[#4E342E] px-3 py-1 rounded-full text-[10px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>GOOGLE SHEETS SYNC ACTIVE</span>
        </div>
      </footer>

      {/* Mobile Fixed Bottom Navigation Bar (App style) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFD54F] border-t-4 border-[#5D4037] shadow-[0px_-4px_12px_rgba(0,0,0,0.15)] px-1.5 py-1 flex items-center justify-around">
        {roleMode === 'teacher' && (
          <button
            onClick={() => setActiveTab('corner-form')}
            className={`flex flex-col items-center justify-center px-2 py-1 rounded-xl text-[10px] font-black transition-all ${
              activeTab === 'corner-form'
                ? 'bg-[#FF8A65] text-white border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037]'
                : 'text-[#5D4037] hover:bg-white/40'
            }`}
          >
            <ClipboardList className="w-5 h-5 mb-0.5" />
            <span>角落紀錄</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('learning-report')}
          className={`flex flex-col items-center justify-center px-2 py-1 rounded-xl text-[10px] font-black transition-all ${
            activeTab === 'learning-report'
              ? 'bg-[#FFB74D] text-[#5D4037] border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037]'
              : 'text-[#5D4037] hover:bg-white/40'
          }`}
        >
          <BookOpenCheck className="w-5 h-5 mb-0.5" />
          <span>學習歷程</span>
        </button>

        <button
          onClick={() => setActiveTab('contact-book')}
          className={`flex flex-col items-center justify-center px-2 py-1 rounded-xl text-[10px] font-black transition-all ${
            activeTab === 'contact-book'
              ? 'bg-[#81D4FA] text-[#01579B] border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037]'
              : 'text-[#5D4037] hover:bg-white/40'
          }`}
        >
          <Heart className="w-5 h-5 mb-0.5" />
          <span>聯絡簿</span>
        </button>

        {roleMode === 'teacher' && (
          <button
            onClick={() => setActiveTab('roster')}
            className={`flex flex-col items-center justify-center px-2 py-1 rounded-xl text-[10px] font-black transition-all ${
              activeTab === 'roster'
                ? 'bg-[#CE93D8] text-[#4A148C] border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037]'
                : 'text-[#5D4037] hover:bg-white/40'
            }`}
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span>學生名冊</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('system-design')}
          className={`flex flex-col items-center justify-center px-2 py-1 rounded-xl text-[10px] font-black transition-all ${
            activeTab === 'system-design'
              ? 'bg-[#FFF3E0] text-[#E65100] border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037]'
              : 'text-[#5D4037] hover:bg-white/40'
          }`}
        >
          <Layers className="w-5 h-5 mb-0.5" />
          <span>設定/Sheet</span>
        </button>
      </div>

      {/* Google Sheets Config & Authorization Modal */}
      <GoogleSheetsModal
        isOpen={showSheetModal}
        onClose={() => setShowSheetModal(false)}
        onOpenCsvModal={() => setShowCsvModal(true)}
        sheetConfig={sheetConfig}
        setSheetConfig={setSheetConfig}
        students={students}
        setStudents={setStudents}
        learningRecords={learningRecords}
        setLearningRecords={setLearningRecords}
        contactBooks={contactBooks}
        setContactBooks={setContactBooks}
      />

      {/* CSV Export Center Modal */}
      <CsvExportModal
        isOpen={showCsvModal}
        onClose={() => setShowCsvModal(false)}
        students={students}
        learningRecords={learningRecords}
        contactBooks={contactBooks}
      />
    </div>
  );
}
