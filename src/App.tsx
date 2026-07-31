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

export default function App() {
  const [roleMode, setRoleMode] = useState<RoleMode>('teacher');
  const [activeTab, setActiveTab] = useState<'corner-form' | 'learning-report' | 'contact-book' | 'roster' | 'system-design'>('corner-form');
  const [showSheetModal, setShowSheetModal] = useState<boolean>(false);
  const [showCsvModal, setShowCsvModal] = useState<boolean>(false);

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
      if (!parsed.webAppUrl) {
        parsed.webAppUrl = DEFAULT_WEB_APP_URL;
        parsed.isConnected = true;
      }
      return {
        refreshIntervalMinutes: 1,
        autoRefreshEnabled: true,
        ...parsed,
      };
    }
    return {
      spreadsheetId: null,
      spreadsheetUrl: null,
      spreadsheetName: '愛愛幼兒園_學習歷程與家長聯絡簿_資料庫',
      webAppUrl: DEFAULT_WEB_APP_URL,
      isConnected: true,
      lastSyncedAt: null,
      refreshIntervalMinutes: 1,
      autoRefreshEnabled: true,
    };
  });

  // Save to LocalStorage whenever state updates
  useEffect(() => {
    localStorage.setItem('kindergarten_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('kindergarten_learning_records', JSON.stringify(learningRecords));
  }, [learningRecords]);

  useEffect(() => {
    localStorage.setItem('kindergarten_contact_books', JSON.stringify(contactBooks));
  }, [contactBooks]);

  useEffect(() => {
    localStorage.setItem('kindergarten_sheet_config', JSON.stringify(sheetConfig));
  }, [sheetConfig]);

  // Global Auto-Refresh Effect (polls Google Sheet Web App every X minutes, default 1 min)
  useEffect(() => {
    if (!sheetConfig.autoRefreshEnabled || !sheetConfig.webAppUrl || (sheetConfig.refreshIntervalMinutes ?? 1) <= 0) {
      return;
    }

    const intervalMs = (sheetConfig.refreshIntervalMinutes ?? 1) * 60 * 1000;
    const timer = setInterval(() => {
      fetchFromWebApp(sheetConfig.webAppUrl!)
        .then((data) => {
          if (data.students && data.students.length > 0) setStudents(data.students);
          if (data.learningRecords && data.learningRecords.length > 0) setLearningRecords(data.learningRecords);
          if (data.contactBooks && data.contactBooks.length > 0) setContactBooks(data.contactBooks);
          const nowStr = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setSheetConfig((prev) => ({ ...prev, lastSyncedAt: nowStr }));
        })
        .catch((err) => {
          console.error('Global background Web App auto-sync error:', err);
        });
    }, intervalMs);

    return () => clearInterval(timer);
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

  // When switching to Parent Mode, default to "learning-report" or "contact-book"
  const handleRoleChange = (role: RoleMode) => {
    setRoleMode(role);
    if (role === 'parent' && (activeTab === 'corner-form' || activeTab === 'roster')) {
      setActiveTab('learning-report');
    }
  };

  const handleSavedRecordNav = (recordId: string) => {
    setActiveTab('learning-report');
  };

  return (
    <div className="min-h-screen bg-[#FFFBF0] font-sans text-[#5D4037] pb-16 flex flex-col justify-between">
      <div>
        {/* Top Header */}
        <Header
          roleMode={roleMode}
          setRoleMode={handleRoleChange}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          sheetConfig={sheetConfig}
          onOpenSheetModal={() => setShowSheetModal(true)}
          onOpenCsvModal={() => setShowCsvModal(true)}
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
