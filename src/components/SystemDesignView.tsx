import React, { useState, useEffect } from 'react';
import { Student, LearningRecord, ContactBook, SheetConfig } from '../types';
import { 
  APPS_SCRIPT_CODE, 
  CONTACT_BOOK_APPS_SCRIPT_CODE, 
  LEARNING_CORNER_APPS_SCRIPT_CODE, 
  STUDENT_ROSTER_APPS_SCRIPT_CODE,
  DEFAULT_WEB_APP_URL,
  DEFAULT_STUDENT_WEB_APP_URL,
  DEFAULT_STUDENT_LIBRARY_URL,
  DEFAULT_LEARNING_WEB_APP_URL,
  DEFAULT_CONTACT_WEB_APP_URL,
  DEFAULT_MEDIA_FOLDER_URL,
  fetchFromWebApp, 
  fetchStudentRoster,
  fetchAllKindergartenData,
  syncToWebApp,
  normalizeWebAppUrl
} from '../lib/googleSheets';
import { 
  FileSpreadsheet, 
  Code2, 
  Copy, 
  Check, 
  RefreshCw, 
  Clock, 
  Link2, 
  ExternalLink, 
  Sparkles, 
  Layers, 
  Database, 
  Globe, 
  Users, 
  BookOpen, 
  Heart, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  MessageSquare,
  Shapes,
  Folder,
  FolderOpen,
  Camera,
  Video
} from 'lucide-react';

interface SystemDesignViewProps {
  sheetConfig: SheetConfig;
  setSheetConfig: React.Dispatch<React.SetStateAction<SheetConfig>>;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  learningRecords: LearningRecord[];
  setLearningRecords: React.Dispatch<React.SetStateAction<LearningRecord[]>>;
  contactBooks: ContactBook[];
  setContactBooks: React.Dispatch<React.SetStateAction<ContactBook[]>>;
}

export const SystemDesignView: React.FC<SystemDesignViewProps> = ({
  sheetConfig,
  setSheetConfig,
  students,
  setStudents,
  learningRecords,
  setLearningRecords,
  contactBooks,
  setContactBooks,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'studentRoster' | 'learningCorner' | 'contactBook' | 'fullSystem'>('studentRoster');
  const [studentUrlInput, setStudentUrlInput] = useState(
    sheetConfig.studentWebAppUrl || sheetConfig.webAppUrl || DEFAULT_STUDENT_WEB_APP_URL
  );
  const [learningUrlInput, setLearningUrlInput] = useState(
    sheetConfig.learningWebAppUrl || DEFAULT_LEARNING_WEB_APP_URL
  );
  const [contactUrlInput, setContactUrlInput] = useState(
    sheetConfig.contactWebAppUrl || DEFAULT_CONTACT_WEB_APP_URL
  );
  const [webAppInput, setWebAppInput] = useState(sheetConfig.webAppUrl || DEFAULT_STUDENT_WEB_APP_URL);
  const [mediaFolderInput, setMediaFolderInput] = useState(
    sheetConfig.mediaFolderUrl || DEFAULT_MEDIA_FOLDER_URL
  );
  const [intervalMinutes, setIntervalMinutes] = useState<number>(
    sheetConfig.refreshIntervalMinutes ?? 5
  );
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(
    sheetConfig.autoRefreshEnabled ?? false
  );
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [nextSyncCountdown, setNextSyncCountdown] = useState<number | null>(null);

  // Sync state changes with sheetConfig
  useEffect(() => {
    setStudentUrlInput(sheetConfig.studentWebAppUrl || sheetConfig.webAppUrl || DEFAULT_STUDENT_WEB_APP_URL);
    setLearningUrlInput(sheetConfig.learningWebAppUrl || DEFAULT_LEARNING_WEB_APP_URL);
    setContactUrlInput(sheetConfig.contactWebAppUrl || DEFAULT_CONTACT_WEB_APP_URL);
    setWebAppInput(sheetConfig.webAppUrl || DEFAULT_STUDENT_WEB_APP_URL);
    setMediaFolderInput(sheetConfig.mediaFolderUrl || DEFAULT_MEDIA_FOLDER_URL);
    setIntervalMinutes(sheetConfig.refreshIntervalMinutes ?? 5);
    setAutoSyncEnabled(sheetConfig.autoRefreshEnabled ?? false);
  }, [sheetConfig]);

  // Copy code handler
  const handleCopyCode = (codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Test / Connect to Web App URL
  const handleTestConnection = async () => {
    const normStudent = normalizeWebAppUrl(studentUrlInput.trim());
    const normLearning = normalizeWebAppUrl(learningUrlInput.trim());
    const normContact = normalizeWebAppUrl(contactUrlInput.trim());

    setStudentUrlInput(normStudent);
    setLearningUrlInput(normLearning);
    setContactUrlInput(normContact);

    const testConfig: SheetConfig = {
      ...sheetConfig,
      studentWebAppUrl: normStudent,
      learningWebAppUrl: normLearning,
      contactWebAppUrl: normContact,
      webAppUrl: normStudent || normLearning,
      mediaFolderUrl: mediaFolderInput.trim() || DEFAULT_MEDIA_FOLDER_URL,
      refreshIntervalMinutes: intervalMinutes,
      autoRefreshEnabled: autoSyncEnabled,
      isConnected: true,
    };

    setIsSyncing(true);
    setStatusMessage({ type: 'info', text: '正在嘗試連接 Google Apps Script Web App (學生名冊/學習紀錄/聯絡簿)...' });

    try {
      const data = await fetchAllKindergartenData(testConfig);
      
      // Update local state if spreadsheet returns data
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

      setSheetConfig({
        ...testConfig,
        lastSyncedAt: nowStr,
        isConnected: true,
      });

      setStatusMessage({
        type: 'success',
        text: `連線成功！已由 Google Sheet 載入 ${data.students.length} 位學生名冊、${data.learningRecords.length} 筆角落紀錄與 ${data.contactBooks.length} 筆聯絡簿！`
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: `連線失敗：${err.message || '請確認 Web App URL 權限是否設為「所有人 (Anyone)」，並確認 Apps Script 已正式部署。'}`
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Save Settings
  const handleSaveSettings = () => {
    const normStudent = normalizeWebAppUrl(studentUrlInput.trim());
    const normLearning = normalizeWebAppUrl(learningUrlInput.trim());
    const normContact = normalizeWebAppUrl(contactUrlInput.trim());
    const rawMedia = mediaFolderInput.trim() || DEFAULT_MEDIA_FOLDER_URL;

    setStudentUrlInput(normStudent);
    setLearningUrlInput(normLearning);
    setContactUrlInput(normContact);

    setSheetConfig((prev) => ({
      ...prev,
      studentWebAppUrl: normStudent,
      learningWebAppUrl: normLearning,
      contactWebAppUrl: normContact,
      webAppUrl: normStudent || normLearning || prev.webAppUrl,
      mediaFolderUrl: rawMedia,
      refreshIntervalMinutes: intervalMinutes,
      autoRefreshEnabled: autoSyncEnabled,
      isConnected: Boolean(normStudent || normLearning || normContact),
    }));
    setStatusMessage({ type: 'success', text: '系統設定（學生名冊、角落學習區、聯絡簿與雲端資料夾網址）已成功儲存並生效！' });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Trigger manual push sync to Web App
  const handlePushSync = async () => {
    const url = normalizeWebAppUrl(sheetConfig.studentWebAppUrl || sheetConfig.webAppUrl || studentUrlInput.trim());
    if (!url) {
      setStatusMessage({ type: 'error', text: '請先設定並輸入 Google Apps Script Web App URL' });
      return;
    }

    setIsSyncing(true);
    setStatusMessage({ type: 'info', text: '正在將學生名冊、角落學習紀錄及聯絡簿同步寫入 Google Sheet...' });

    try {
      await syncToWebApp(url, students, learningRecords, contactBooks);
      const nowStr = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      setSheetConfig((prev) => ({
        ...prev,
        webAppUrl: url,
        isConnected: true,
        lastSyncedAt: nowStr,
      }));

      setStatusMessage({ type: 'success', text: `同步完成！已成功將 ${students.length} 位學生、${learningRecords.length} 筆角落紀錄與 ${contactBooks.length} 筆聯絡簿同步至 Google Sheet。` });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: `寫入失敗：${err.message || '無法連線至 Web App'}` });
    } finally {
      setIsSyncing(false);
    }
  };

  // Timer effect for auto-refresh
  useEffect(() => {
    if (!autoSyncEnabled || intervalMinutes <= 0) {
      setNextSyncCountdown(null);
      return;
    }

    let secondsLeft = intervalMinutes * 60;
    setNextSyncCountdown(secondsLeft);

    const timer = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft <= 0) {
        secondsLeft = intervalMinutes * 60;
        // Perform auto sync fetch
        fetchAllKindergartenData(sheetConfig)
          .then((data) => {
            if (data.students?.length) setStudents(data.students);
            if (data.learningRecords?.length) setLearningRecords(data.learningRecords);
            if (data.contactBooks?.length) setContactBooks(data.contactBooks);
            const nowStr = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setSheetConfig((prev) => ({ ...prev, lastSyncedAt: nowStr }));
          })
          .catch((err) => console.error('Auto sync failed:', err));
      }
      setNextSyncCountdown(secondsLeft);
    }, 1000);

    return () => clearInterval(timer);
  }, [autoSyncEnabled, sheetConfig, intervalMinutes]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="bg-[#FFFDE7] border-4 border-[#5D4037] rounded-[2rem] p-6 shadow-[8px_8px_0px_#FFD54F] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#5D4037] text-white font-black text-xs px-3 py-1 rounded-full shadow-xs">
              系統架構與 Google Sheet 整合
            </span>
            <span className="bg-[#81D4FA] text-[#01579B] border-2 border-[#5D4037] font-black text-xs px-3 py-1 rounded-full shadow-[2px_2px_0px_#5D4037]">
              Apps Script REST Web App API
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-[#5D4037] flex items-center gap-2 italic">
            系統設計與 Google Sheet 連結設定
            <Sparkles className="w-6 h-6 text-[#FF8A65] animate-pulse" />
          </h2>
          <p className="text-xs text-[#5D4037]/80 font-bold mt-1">
            將學生名冊、角落學習區歷程與家長聯絡簿即時連結至 Google 試算表，支援自動定時更新與雙向同步。
          </p>
        </div>

        {/* Live Sync Status Pill */}
        <div className="bg-white p-3.5 rounded-2xl border-2 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] flex items-center gap-3">
          <div className={`p-2 rounded-xl border border-[#5D4037] ${sheetConfig.isConnected ? 'bg-[#C8E6C9]' : 'bg-[#FFE082]'}`}>
            <Database className="w-5 h-5 text-[#5D4037]" />
          </div>
          <div>
            <div className="text-[10px] font-black text-[#5D4037]/70">Google Sheet 連線狀態</div>
            <div className="text-xs font-black text-[#5D4037] flex items-center gap-1">
              {sheetConfig.isConnected ? (
                <span className="text-[#2E7D32] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 已連結成功
                </span>
              ) : (
                <span className="text-[#E65100] flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> 尚未設定 URL
                </span>
              )}
            </div>
            {sheetConfig.lastSyncedAt && (
              <div className="text-[10px] font-bold text-[#5D4037]/60 mt-0.5">
                最後更新: {sheetConfig.lastSyncedAt}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Message Notification Bar */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border-2 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] flex items-center justify-between text-xs font-black animate-fade-in ${
            statusMessage.type === 'success'
              ? 'bg-[#C8E6C9] text-[#1B5E20]'
              : statusMessage.type === 'error'
              ? 'bg-[#FFCDD2] text-[#B71C1C]'
              : 'bg-[#E1F5FE] text-[#01579B]'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-current font-black hover:underline cursor-pointer">
            關閉
          </button>
        </div>
      )}

      {/* Section 1: System Architecture Visual Diagram */}
      <div className="bg-white border-4 border-[#5D4037] rounded-[2rem] p-6 shadow-[8px_8px_0px_#5D4037]">
        <h3 className="text-lg font-black text-[#5D4037] mb-4 flex items-center gap-2 italic border-b-2 border-dashed border-[#5D4037]/30 pb-2">
          <Layers className="w-5 h-5 text-[#FF8A65]" />
          1. 系統設計架構圖 (System Architecture Overview)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
          {/* Node 1: Frontend App */}
          <div className="bg-[#FFF8E1] border-2 border-[#5D4037] rounded-2xl p-4 shadow-[4px_4px_0px_#5D4037] flex flex-col justify-between">
            <div>
              <span className="bg-[#FF8A65] text-white font-black text-[10px] px-2.5 py-0.5 rounded-full border border-[#5D4037]">
                前端展示層 (Frontend UI)
              </span>
              <h4 className="font-black text-sm text-[#5D4037] mt-2 mb-1 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-[#FF8A65]" />
                愛愛幼兒園系統
              </h4>
              <p className="text-[11px] font-bold text-[#5D4037]/80 leading-relaxed">
                包含學生名冊管理、角落學習區評量、家長聯絡簿，即時呈現並儲存多媒體 URL。
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#5D4037]/20 text-[10px] font-black text-[#5D4037] flex justify-between">
              <span>目前名冊: {students.length} 人</span>
              <span>學習紀錄: {learningRecords.length} 筆</span>
            </div>
          </div>

          {/* Node 2: Middleware Google Apps Script */}
          <div className="bg-[#E1F5FE] border-2 border-[#5D4037] rounded-2xl p-4 shadow-[4px_4px_0px_#5D4037] flex flex-col justify-between">
            <div>
              <span className="bg-[#81D4FA] text-[#01579B] font-black text-[10px] px-2.5 py-0.5 rounded-full border border-[#5D4037]">
                中間 API 服務層 (Apps Script)
              </span>
              <h4 className="font-black text-sm text-[#01579B] mt-2 mb-1 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-[#0288D1]" />
                Google Apps Script Web App
              </h4>
              <p className="text-[11px] font-bold text-[#01579B]/80 leading-relaxed">
                自動處理 GET/POST JSON 請求，提供 CORS 跨域存取，將資料安全導向 Google 試算表。
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#5D4037]/20 text-[10px] font-black text-[#01579B]">
              格式: UTF-8 JSON / REST API
            </div>
          </div>

          {/* Node 3: Google Sheets Database */}
          <div className="bg-[#E8F5E9] border-2 border-[#5D4037] rounded-2xl p-4 shadow-[4px_4px_0px_#5D4037] flex flex-col justify-between">
            <div>
              <span className="bg-[#A5D6A7] text-[#1B5E20] font-black text-[10px] px-2.5 py-0.5 rounded-full border border-[#5D4037]">
                雲端資料庫層 (Database)
              </span>
              <h4 className="font-black text-sm text-[#1B5E20] mt-2 mb-1 flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-[#2E7D32]" />
                Google Sheets 試算表
              </h4>
              <p className="text-[11px] font-bold text-[#1B5E20]/80 leading-relaxed">
                包含 3 大工作表：<code>Students</code> (學生名冊)、<code>LearningRecords</code> (角落歷程)、<code>ContactBooks</code> (聯絡簿)。
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-[#5D4037]/20 text-[10px] font-black text-[#1B5E20]">
              儲存內容: 純文字、JSON 格式與多媒體 URL
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Input URL & Auto-Update Interval Settings */}
      <div className="bg-white border-4 border-[#5D4037] rounded-[2rem] p-6 shadow-[8px_8px_0px_#5D4037] space-y-6">
        <h3 className="text-lg font-black text-[#5D4037] flex items-center gap-2 italic border-b-2 border-dashed border-[#5D4037]/30 pb-2">
          <Link2 className="w-5 h-5 text-[#0288D1]" />
          2. 輸入 Web App URL 及更新時間設定 (URL & Auto-Refresh Interval Settings)
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Sub-card: Web App URLs Setting */}
          <div className="bg-[#FFFBF0] border-2 border-[#5D4037] rounded-2xl p-5 shadow-[4px_4px_0px_#5D4037] space-y-4">
            <div className="flex items-center justify-between border-b border-dashed border-[#5D4037]/30 pb-2">
              <h4 className="font-black text-sm text-[#5D4037] flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#FF8A65]" />
                Google Sheet Web App 服務端點設定
              </h4>
              <span className="bg-[#E0F7FA] text-[#00838F] border border-[#00838F] text-[10px] font-black px-2 py-0.5 rounded-full">
                多端點獨立分流
              </span>
            </div>

            {/* Student Roster Web App URL Field */}
            <div className="space-y-1 bg-white p-3 rounded-xl border border-[#5D4037]/40 shadow-xs">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-[#6A1B9A] flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#8E24AA]" />
                  1. 學生名冊 Web App URL:
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setStudentUrlInput(DEFAULT_STUDENT_WEB_APP_URL);
                    setStatusMessage({ type: 'info', text: '已填入學生名冊預設 Web App URL！' });
                  }}
                  className="text-[10px] bg-[#F3E5F5] hover:bg-[#E1BEE7] text-[#6A1B9A] font-black px-2 py-0.5 rounded border border-[#8E24AA]/40 cursor-pointer"
                >
                  帶入預設 URL
                </button>
              </div>
              <input
                type="url"
                value={studentUrlInput}
                onChange={(e) => setStudentUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfyc.../exec"
                className="w-full bg-[#FAFAFA] border border-[#5D4037] rounded-lg px-2.5 py-1.5 text-xs text-[#5D4037] font-mono font-bold focus:outline-none focus:bg-white"
              />
            </div>

            {/* Learning Records Web App URL Field */}
            <div className="space-y-1 bg-white p-3 rounded-xl border border-[#5D4037]/40 shadow-xs">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-[#00838F] flex items-center gap-1">
                  <Shapes className="w-3.5 h-3.5 text-[#00ACC1]" />
                  2. 角落學習紀錄 Web App URL:
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setLearningUrlInput(DEFAULT_LEARNING_WEB_APP_URL);
                    setStatusMessage({ type: 'info', text: '已填入角落學習紀錄預設 Web App URL！' });
                  }}
                  className="text-[10px] bg-[#E0F7FA] hover:bg-[#B2EBF2] text-[#00838F] font-black px-2 py-0.5 rounded border border-[#00ACC1]/40 cursor-pointer"
                >
                  帶入預設 URL
                </button>
              </div>
              <input
                type="url"
                value={learningUrlInput}
                onChange={(e) => setLearningUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfyc.../exec"
                className="w-full bg-[#FAFAFA] border border-[#5D4037] rounded-lg px-2.5 py-1.5 text-xs text-[#5D4037] font-mono font-bold focus:outline-none focus:bg-white"
              />
            </div>

            {/* Contact Book Web App URL Field */}
            <div className="space-y-1 bg-white p-3 rounded-xl border border-[#5D4037]/40 shadow-xs">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-[#E65100] flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-[#FF8A65]" />
                  3. 家長聯絡簿 Web App URL:
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setContactUrlInput(DEFAULT_CONTACT_WEB_APP_URL);
                    setStatusMessage({ type: 'info', text: '已填入家長聯絡簿預設 Web App URL！' });
                  }}
                  className="text-[10px] bg-[#FFF3E0] hover:bg-[#FFE0B2] text-[#E65100] font-black px-2 py-0.5 rounded border border-[#FF8A65]/40 cursor-pointer"
                >
                  帶入預設 URL
                </button>
              </div>
              <input
                type="url"
                value={contactUrlInput}
                onChange={(e) => setContactUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfyc.../exec"
                className="w-full bg-[#FAFAFA] border border-[#5D4037] rounded-lg px-2.5 py-1.5 text-xs text-[#5D4037] font-mono font-bold focus:outline-none focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleSaveSettings}
                className="bg-[#C8E6C9] hover:bg-[#A5D6A7] text-[#2E7D32] font-black text-xs py-2 px-4 rounded-xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] hover:shadow-none transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                儲存網址設定
              </button>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isSyncing}
                className="bg-[#81D4FA] hover:bg-[#4FC3F7] text-[#01579B] font-black text-xs py-2 px-4 rounded-xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] hover:shadow-none transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                測試連線並同步名冊
              </button>

              <button
                type="button"
                onClick={handlePushSync}
                disabled={isSyncing}
                className="bg-[#FFB74D] hover:bg-[#FFA726] text-[#5D4037] font-black text-xs py-2 px-4 rounded-xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] hover:shadow-none transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                推送更新至 Google Sheet
              </button>
            </div>
          </div>

          {/* Right Sub-card: Auto-Refresh Interval Settings */}
          <div className="bg-[#FFFBF0] border-2 border-[#5D4037] rounded-2xl p-5 shadow-[4px_4px_0px_#5D4037] space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-sm text-[#5D4037] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#7E57C2]" />
                資料更新時間設定 (Auto Refresh Interval)：
              </h4>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSyncEnabled}
                  onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2E7D32] border-2 border-[#5D4037]"></div>
                <span className="ml-2 text-xs font-black text-[#5D4037]">
                  {autoSyncEnabled ? '定時同步中' : '僅手動'}
                </span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-black text-[#5D4037] mb-2">
                選擇自動同步時間間隔：
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {[1, 5, 15, 30, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setIntervalMinutes(mins)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-black border-2 border-[#5D4037] transition-all cursor-pointer ${
                      intervalMinutes === mins
                        ? 'bg-[#7E57C2] text-white shadow-[2px_2px_0px_#5D4037]'
                        : 'bg-white text-[#5D4037] hover:bg-[#F3E5F5]'
                    }`}
                  >
                    {mins} 分鐘
                  </button>
                ))}
              </div>
            </div>

            {/* Countdown / Status display */}
            {autoSyncEnabled && nextSyncCountdown !== null && (
              <div className="bg-[#E8EAF6] p-2.5 rounded-xl border border-[#5D4037] text-xs font-black text-[#3F51B5] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 animate-spin text-[#3F51B5]" />
                  距離下次 Google Sheet 自動同步：
                </span>
                <span className="bg-white px-2 py-0.5 rounded-lg border border-[#5D4037]">
                  {Math.floor(nextSyncCountdown / 60)}分 {nextSyncCountdown % 60}秒
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleSaveSettings}
              className="w-full bg-[#FF8A65] hover:bg-[#FF7043] text-white font-black text-xs py-2.5 px-4 rounded-xl border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037] hover:shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" /> 儲存更新時間與 URL 設定
            </button>
          </div>

          {/* Media Folder Sub-card: Google Drive Upload Link */}
          <div className="lg:col-span-2 bg-[#E1F5FE] border-2 border-[#5D4037] rounded-2xl p-5 shadow-[4px_4px_0px_#5D4037] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-[#5D4037]/30 pb-2">
              <h4 className="font-black text-sm text-[#01579B] flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-[#0288D1]" />
                照片影片上傳雲端資料夾連結 URL (Google Drive Media Folder)
              </h4>
              <span className="bg-[#81D4FA] text-[#01579B] border border-[#0288D1] text-[10px] font-black px-2.5 py-0.5 rounded-full">
                多媒體與作品雲端備份
              </span>
            </div>

            <p className="text-xs text-[#01579B]/80 font-bold">
              可在系統設定中自由修改照片與影片的上傳資料夾連結。教師記錄角落學習區與聯絡簿時，可一鍵開啟此 Google Drive 雲端資料夾上傳作品照片或影片檔。
            </p>

            <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
              <div className="relative flex-1">
                <input
                  type="url"
                  value={mediaFolderInput}
                  onChange={(e) => setMediaFolderInput(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full bg-white border-2 border-[#5D4037] rounded-xl px-3 py-2 text-xs text-[#5D4037] font-mono font-bold focus:outline-none shadow-[2px_2px_0px_#5D4037]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMediaFolderInput(DEFAULT_MEDIA_FOLDER_URL);
                    setStatusMessage({ type: 'info', text: '已自動帶入預設照片影片 Google Drive 雲端資料夾網址！請記得點擊「儲存網址設定」。' });
                  }}
                  className="bg-[#B3E5FC] hover:bg-[#81D4FA] text-[#01579B] font-black text-xs py-2 px-3 rounded-xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] hover:shadow-none transition-all flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> 恢復預設網址
                </button>

                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-black text-xs py-2 px-4 rounded-xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] hover:shadow-none transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> 儲存網址設定
                </button>
              </div>
            </div>

            <div className="bg-white/90 p-2.5 rounded-xl border border-[#0288D1]/30 text-[11px] text-[#01579B] font-bold flex items-center justify-between">
              <span className="truncate">📂 當前儲存的雲端資料夾網址: <code className="font-mono text-[#0288D1] ml-1">{sheetConfig.mediaFolderUrl || DEFAULT_MEDIA_FOLDER_URL}</code></span>
              <button
                type="button"
                onClick={() => handleCopyCode(sheetConfig.mediaFolderUrl || DEFAULT_MEDIA_FOLDER_URL)}
                className="bg-[#E0F7FA] hover:bg-[#B2EBF2] text-[#00838F] font-black text-[10px] px-2 py-0.5 rounded-lg border border-[#00838F] cursor-pointer shrink-0 ml-2"
              >
                複製連結
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Data Links Showcase (Learning Records, Contact Books & Roster) */}
      <div className="bg-white border-4 border-[#5D4037] rounded-[2rem] p-6 shadow-[8px_8px_0px_#5D4037] space-y-6">
        <h3 className="text-lg font-black text-[#5D4037] flex items-center gap-2 italic border-b-2 border-dashed border-[#5D4037]/30 pb-2">
          <Database className="w-5 h-5 text-[#CE93D8]" />
          3. 資料連結展示 (Live Google Sheet Sync Status)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card A: Learning Corner Records */}
          <div className="bg-[#E0F7FA] border-2 border-[#5D4037] rounded-2xl p-4 shadow-[4px_4px_0px_#5D4037] flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="bg-[#00ACC1] text-white font-black text-[10px] px-2.5 py-0.5 rounded-full border border-[#5D4037]">
                  LearningRecords 工作表
                </span>
                <span className="text-xs font-black text-[#006064]">紀錄總數：{learningRecords.length} 筆</span>
              </div>
              <h4 className="font-black text-sm text-[#006064] flex items-center gap-2">
                <Shapes className="w-4 h-4 text-[#00838F]" />
                角落學習區紀錄資料連結
              </h4>
              <p className="text-xs font-bold text-[#006064]/80 mt-1">
                記錄積木、語文、美勞、益智、角角學習檢核勾選，以及畫布圖片、活動照片與影片 URL。
              </p>
            </div>

            <div className="flex flex-wrap gap-1 text-[10px] font-black text-[#006064] pt-1">
              <span className="bg-white border border-[#5D4037] px-2 py-0.5 rounded-md">學習區勾選</span>
              <span className="bg-white border border-[#5D4037] px-2 py-0.5 rounded-md">繪畫圖片</span>
              <span className="bg-white border border-[#5D4037] px-2 py-0.5 rounded-md">照片影片 URL</span>
              <span className="bg-white border border-[#5D4037] px-2 py-0.5 rounded-md">老師評語與章</span>
            </div>
          </div>

          {/* Card B: Contact Book Link */}
          <div className="bg-[#FFF3E0] border-2 border-[#5D4037] rounded-2xl p-4 shadow-[4px_4px_0px_#5D4037] flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="bg-[#FF9800] text-white font-black text-[10px] px-2.5 py-0.5 rounded-full border border-[#5D4037]">
                  ContactBooks 工作表
                </span>
                <span className="text-xs font-black text-[#E65100]">聯絡簿總數：{contactBooks.length} 筆</span>
              </div>
              <h4 className="font-black text-sm text-[#E65100] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#FB8C00]" />
                家長聯絡簿資料連結
              </h4>
              <p className="text-xs font-bold text-[#E65100]/80 mt-1">
                記錄早午點餐飲食、午睡分鐘、情緒體溫、健康叮嚀、老師評語與家長簽收狀態。
              </p>
            </div>

            <div className="flex flex-wrap gap-1 text-[10px] font-black text-[#E65100] pt-1">
              <span className="bg-white border border-[#5D4037] px-2 py-0.5 rounded-md">飲食紀錄</span>
              <span className="bg-white border border-[#5D4037] px-2 py-0.5 rounded-md">午睡狀況</span>
              <span className="bg-white border border-[#5D4037] px-2 py-0.5 rounded-md">體溫情緒</span>
              <span className="bg-white border border-[#5D4037] px-2 py-0.5 rounded-md">家長簽收回覆</span>
            </div>
          </div>

          {/* Card C: Student Roster Link */}
          <div className="bg-[#F3E5F5] border-2 border-[#5D4037] rounded-2xl p-4 shadow-[4px_4px_0px_#5D4037] flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="bg-[#AB47BC] text-white font-black text-[10px] px-2.5 py-0.5 rounded-full border border-[#5D4037]">
                  Students 工作表
                </span>
                <span className="text-xs font-black text-[#4A148C]">學生總數：{students.length} 位</span>
              </div>
              <h4 className="font-black text-sm text-[#4A148C] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#AB47BC]" />
                學生名冊資料連結
              </h4>
              <p className="text-xs font-bold text-[#4A148C]/80 mt-1">
                包含櫻桃班、草莓班、蘋果班學生名冊、座號、性別、頭像及家長通訊錄。
              </p>
            </div>

            {/* Student Preview Pills */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {students.slice(0, 4).map((stu) => (
                <div key={stu.id} className="bg-white border border-[#5D4037] rounded-lg p-1 text-center shadow-xs">
                  <div className="text-[10px] font-black text-[#5D4037] truncate">{stu.name}</div>
                  <div className="text-[9px] font-bold text-[#5D4037]/60">{stu.seatNumber}號</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Step-by-Step Google Sheet Connection Guide */}
      <div className="bg-white border-4 border-[#5D4037] rounded-[2rem] p-6 shadow-[8px_8px_0px_#5D4037] space-y-4">
        <h3 className="text-lg font-black text-[#5D4037] flex items-center gap-2 italic border-b-2 border-dashed border-[#5D4037]/30 pb-2">
          <HelpCircle className="w-5 h-5 text-[#FFB74D]" />
          4. Google Sheet 連結設定步驟 (Step-by-Step Connection Method)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-[#FFFDE7] border-2 border-[#5D4037] rounded-2xl p-4 shadow-[3px_3px_0px_#5D4037]">
            <span className="w-6 h-6 bg-[#5D4037] text-white rounded-full flex items-center justify-center font-black text-xs mb-2">1</span>
            <h4 className="font-black text-xs text-[#5D4037] mb-1">建立 Google 試算表</h4>
            <p className="text-[11px] font-bold text-[#5D4037]/80">
              在瀏覽器開啟 Google Sheets 建立新試算表，命名為「愛愛幼兒園_學習歷程與聯絡簿資料庫」。
            </p>
          </div>

          <div className="bg-[#FFFDE7] border-2 border-[#5D4037] rounded-2xl p-4 shadow-[3px_3px_0px_#5D4037]">
            <span className="w-6 h-6 bg-[#5D4037] text-white rounded-full flex items-center justify-center font-black text-xs mb-2">2</span>
            <h4 className="font-black text-xs text-[#5D4037] mb-1">開啟 Apps Script 編輯器</h4>
            <p className="text-[11px] font-bold text-[#5D4037]/80">
              點選頂端選單的「擴充功能」➔ 點選「Apps Script」，會自動開啟 Google Apps Script 編輯視窗。
            </p>
          </div>

          <div className="bg-[#FFFDE7] border-2 border-[#5D4037] rounded-2xl p-4 shadow-[3px_3px_0px_#5D4037]">
            <span className="w-6 h-6 bg-[#5D4037] text-white rounded-full flex items-center justify-center font-black text-xs mb-2">3</span>
            <h4 className="font-black text-xs text-[#5D4037] mb-1">貼上 Apps Script 程式碼</h4>
            <p className="text-[11px] font-bold text-[#5D4037]/80">
              選擇下方區塊 5 的「角落學習區專用」、「家長聯絡簿專用」或「全系統」 Apps Script 程式碼全選貼覆，按下 <code>Ctrl+S</code> 儲存。
            </p>
          </div>

          <div className="bg-[#FFFDE7] border-2 border-[#5D4037] rounded-2xl p-4 shadow-[3px_3px_0px_#5D4037]">
            <span className="w-6 h-6 bg-[#5D4037] text-white rounded-full flex items-center justify-center font-black text-xs mb-2">4</span>
            <h4 className="font-black text-xs text-[#5D4037] mb-1">進行 Web App 部署</h4>
            <p className="text-[11px] font-bold text-[#5D4037]/80">
              點擊右上角「部署」➔「新增部署」，種類選擇「網頁應用程式 (Web App)」。
            </p>
          </div>

          <div className="bg-[#FFFDE7] border-2 border-[#5D4037] rounded-2xl p-4 shadow-[3px_3px_0px_#5D4037]">
            <span className="w-6 h-6 bg-[#5D4037] text-white rounded-full flex items-center justify-center font-black text-xs mb-2">5</span>
            <h4 className="font-black text-xs text-[#5D4037] mb-1">設定存取權限為所有人</h4>
            <p className="text-[11px] font-bold text-[#5D4037]/80">
              執行身分選擇「我 (Me)」，誰可以存取選擇「所有人 (Anyone)」，點擊部署並完成授權。
            </p>
          </div>

          <div className="bg-[#FFFDE7] border-2 border-[#5D4037] rounded-2xl p-4 shadow-[3px_3px_0px_#5D4037]">
            <span className="w-6 h-6 bg-[#5D4037] text-white rounded-full flex items-center justify-center font-black text-xs mb-2">6</span>
            <h4 className="font-black text-xs text-[#5D4037] mb-1">貼回 Web App URL</h4>
            <p className="text-[11px] font-bold text-[#5D4037]/80">
              複製產生的網頁應用程式網址，貼回本頁面的區塊 2 輸入框，點擊「測試連線」即可完成！
            </p>
          </div>
        </div>
      </div>

      {/* Section 5: Google Apps Script Code Section */}
      <div className="bg-white border-4 border-[#5D4037] rounded-[2rem] p-6 shadow-[8px_8px_0px_#5D4037] space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b-2 border-dashed border-[#5D4037]/30 pb-2">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h3 className="text-lg font-black text-[#5D4037] flex items-center gap-2 italic">
              <Code2 className="w-5 h-5 text-[#FF8A65]" />
              5. Google Apps Script 程式碼 (GAS Source Code)
            </h3>

            {/* Code Tab Selector */}
            <div className="flex flex-wrap bg-[#F5F5F5] p-1 rounded-xl border-2 border-[#5D4037] gap-1">
              <button
                type="button"
                onClick={() => setActiveCodeTab('studentRoster')}
                className={`px-3 py-1 rounded-lg font-black text-xs transition-all cursor-pointer ${
                  activeCodeTab === 'studentRoster'
                    ? 'bg-[#AB47BC] text-white shadow-[1px_1px_0px_#5D4037]'
                    : 'text-[#5D4037] hover:bg-gray-200'
                }`}
              >
                學生名冊專用
              </button>
              <button
                type="button"
                onClick={() => setActiveCodeTab('learningCorner')}
                className={`px-3 py-1 rounded-lg font-black text-xs transition-all cursor-pointer ${
                  activeCodeTab === 'learningCorner'
                    ? 'bg-[#00ACC1] text-white shadow-[1px_1px_0px_#5D4037]'
                    : 'text-[#5D4037] hover:bg-gray-200'
                }`}
              >
                角落學習區專用
              </button>
              <button
                type="button"
                onClick={() => setActiveCodeTab('contactBook')}
                className={`px-3 py-1 rounded-lg font-black text-xs transition-all cursor-pointer ${
                  activeCodeTab === 'contactBook'
                    ? 'bg-[#FF8A65] text-white shadow-[1px_1px_0px_#5D4037]'
                    : 'text-[#5D4037] hover:bg-gray-200'
                }`}
              >
                家長聯絡簿專用
              </button>
              <button
                type="button"
                onClick={() => setActiveCodeTab('fullSystem')}
                className={`px-3 py-1 rounded-lg font-black text-xs transition-all cursor-pointer ${
                  activeCodeTab === 'fullSystem'
                    ? 'bg-[#81D4FA] text-[#01579B] shadow-[1px_1px_0px_#5D4037]'
                    : 'text-[#5D4037] hover:bg-gray-200'
                }`}
              >
                全系統整合
              </button>
            </div>
          </div>

          <button
            onClick={() =>
              handleCopyCode(
                activeCodeTab === 'studentRoster'
                  ? STUDENT_ROSTER_APPS_SCRIPT_CODE
                  : activeCodeTab === 'learningCorner'
                  ? LEARNING_CORNER_APPS_SCRIPT_CODE
                  : activeCodeTab === 'contactBook'
                  ? CONTACT_BOOK_APPS_SCRIPT_CODE
                  : APPS_SCRIPT_CODE
              )
            }
            className="bg-[#FF8A65] hover:bg-[#FF7043] text-white font-black text-xs py-2 px-4 rounded-full border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037] hover:shadow-[1px_1px_0px_#5D4037] transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-white" /> 已成功複製程式碼！
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> 複製{
                  activeCodeTab === 'studentRoster'
                    ? '學生名冊'
                    : activeCodeTab === 'learningCorner'
                    ? '角落學習區'
                    : activeCodeTab === 'contactBook'
                    ? '家長聯絡簿'
                    : '全系統'
                } Apps Script
              </>
            )}
          </button>
        </div>

        <div className="bg-[#212121] text-[#E0E0E0] p-4 rounded-2xl border-2 border-[#5D4037] font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[420px] overflow-y-auto">
          <pre>{
            activeCodeTab === 'studentRoster'
              ? STUDENT_ROSTER_APPS_SCRIPT_CODE
              : activeCodeTab === 'learningCorner'
              ? LEARNING_CORNER_APPS_SCRIPT_CODE
              : activeCodeTab === 'contactBook'
              ? CONTACT_BOOK_APPS_SCRIPT_CODE
              : APPS_SCRIPT_CODE
          }</pre>
        </div>
      </div>
    </div>
  );
};
