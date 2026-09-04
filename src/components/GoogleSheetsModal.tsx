import React, { useState } from 'react';
import { SheetConfig, Student, LearningRecord, ContactBook } from '../types';
import { googleSignIn, logout, getAccessToken } from '../lib/firebase';
import { 
  createKindergartenSpreadsheet, 
  loadAllFromSheet, 
  syncAllToSheet, 
  findKindergartenSpreadsheet,
  DEFAULT_SPREADSHEET_ID,
  DEFAULT_SPREADSHEET_URL
} from '../lib/googleSheets';
import { 
  X, 
  FileSpreadsheet, 
  ExternalLink, 
  RefreshCw, 
  PlusCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Sparkles,
  Search,
  Download
} from 'lucide-react';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCsvModal?: () => void;
  sheetConfig: SheetConfig;
  setSheetConfig: React.Dispatch<React.SetStateAction<SheetConfig>>;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  learningRecords: LearningRecord[];
  setLearningRecords: React.Dispatch<React.SetStateAction<LearningRecord[]>>;
  contactBooks: ContactBook[];
  setContactBooks: React.Dispatch<React.SetStateAction<ContactBook[]>>;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  onOpenCsvModal,
  sheetConfig,
  setSheetConfig,
  students,
  setStudents,
  learningRecords,
  setLearningRecords,
  contactBooks,
  setContactBooks,
}) => {
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    action: () => Promise<void>;
  }>({ show: false, title: '', message: '', action: async () => {} });

  const [editingSheetId, setEditingSheetId] = useState(sheetConfig.spreadsheetId || DEFAULT_SPREADSHEET_ID);
  const [isEditingId, setIsEditingId] = useState(false);

  if (!isOpen) return null;

  const handleApplySheetId = (newId: string) => {
    const trimmed = newId.trim();
    if (!trimmed) return;
    const url = `https://docs.google.com/spreadsheets/d/${trimmed}/edit`;
    setSheetConfig((prev) => ({
      ...prev,
      spreadsheetId: trimmed,
      spreadsheetUrl: url,
      isConnected: true,
    }));
    setIsEditingId(false);
    setStatusMsg(`已套用試算表 ID: ${trimmed}`);
  };

  const handleSignIn = async () => {
    setLoading(true);
    setStatusMsg('正在進行 Google 帳號授權...');
    try {
      const res = await googleSignIn();
      if (res) {
        setStatusMsg('登入成功！搜尋您 Google Drive 中的幼兒園資料庫...');
        const token = res.accessToken;
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
          setStatusMsg(`已自動找到並連線至試算表：${found.name}`);
        } else {
          setSheetConfig((prev) => ({ ...prev, isConnected: true }));
          setStatusMsg('授權完成！請點擊下方「建立全新 Google Sheet 資料庫」或「搜尋連結」。');
        }
      } else {
        setStatusMsg('📱 正在前往 Google 帳號授權頁面，完成授權後系統將自動返回並連線...');
      }
    } catch (err: any) {
      console.error(err);
      setStatusMsg(`登入授權失敗: ${err.message || '請確認網路與視窗權限'}`);
    } finally {
      setLoading(false);
    }
  };

  const triggerCreateNewSheet = () => {
    setConfirmModal({
      show: true,
      title: '確認建立全新 Google Sheet 資料庫？',
      message: '系統將會在您的 Google Drive 中新增名為「愛愛幼兒園_角落學習歷程_資料庫」的試算表，並寫入目前的學生名冊與學習區紀錄，請問要繼續嗎？',
      action: async () => {
        setLoading(true);
        setStatusMsg('正在建立 Google 試算表與設定工作表 (Students, LearningRecords)...');
        try {
          const token = getAccessToken();
          if (!token) {
            throw new Error('存取金鑰已過期，請重新「Google 帳號登入」');
          }
          const res = await createKindergartenSpreadsheet(token, '愛愛幼兒園_角落學習歷程_資料庫');
          setSheetConfig({
            spreadsheetId: res.spreadsheetId,
            spreadsheetUrl: res.spreadsheetUrl,
            spreadsheetName: '愛愛幼兒園_角落學習歷程_資料庫',
            isConnected: true,
            lastSyncedAt: new Date().toLocaleTimeString(),
          });
          setStatusMsg('Google 試算表建立成功！正在寫入現有資料...');
          await syncAllToSheet(token, res.spreadsheetId, students, learningRecords, contactBooks);
          setStatusMsg('現有資料已全部同步至您的 Google Sheet 資料庫！');
        } catch (err: any) {
          console.error(err);
          setStatusMsg(`建立失敗: ${err.message}`);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const triggerSyncToSheet = () => {
    if (!sheetConfig.spreadsheetId) return;
    setConfirmModal({
      show: true,
      title: '確認同步寫入 Google Sheet？',
      message: `將會把系統內目前的 ${students.length} 筆學生資料與 ${learningRecords.length} 筆學習區紀錄寫入您的 Google 試算表。這會更新雲端對應資料，請問確認嗎？`,
      action: async () => {
        setLoading(true);
        setStatusMsg('正在與 Google Sheet 進行資料同步寫入...');
        try {
          const token = getAccessToken();
          if (!token) throw new Error('金鑰過期，請先重新登入 Google 帳號');
          await syncAllToSheet(token, sheetConfig.spreadsheetId!, students, learningRecords, contactBooks);
          setSheetConfig((prev) => ({
            ...prev,
            lastSyncedAt: new Date().toLocaleTimeString(),
          }));
          setStatusMsg('資料成功同步寫入至 Google Sheet！');
        } catch (err: any) {
          console.error(err);
          setStatusMsg(`同步失敗: ${err.message}`);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const triggerLoadFromSheet = () => {
    if (!sheetConfig.spreadsheetId) return;
    setConfirmModal({
      show: true,
      title: '確認從 Google Sheet 載入覆蓋？',
      message: '這將會自您的雲端 Google Sheet 下載最新紀錄並更新此頁面畫面，請問確認嗎？',
      action: async () => {
        setLoading(true);
        setStatusMsg('正在從 Google Sheet 讀取最新數據...');
        try {
          const token = getAccessToken();
          if (!token) throw new Error('金鑰過期，請先重新登入 Google 帳號');
          const data = await loadAllFromSheet(token, sheetConfig.spreadsheetId!);
          if (data.students.length > 0) setStudents(data.students);
          if (data.learningRecords.length > 0) setLearningRecords(data.learningRecords);
          if (data.contactBooks.length > 0) setContactBooks(data.contactBooks);

          setSheetConfig((prev) => ({
            ...prev,
            lastSyncedAt: new Date().toLocaleTimeString(),
          }));
          setStatusMsg('已成功從 Google Sheet 載入最新資料！');
        } catch (err: any) {
          console.error(err);
          setStatusMsg(`載入失敗: ${err.message}`);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white border-4 border-emerald-300 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-emerald-100 border-2 border-emerald-400 rounded-2xl flex items-center justify-center text-emerald-700 shadow-xs">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
              Google Sheet 後端連線與管理
            </h3>
            <p className="text-xs text-gray-500">將學生的學習歷程與名冊資料記錄於 Google 試算表</p>
          </div>
        </div>

        {/* Status Alert Box */}
        {statusMsg && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Step 1: Google Auth Login */}
        <div className="bg-emerald-50/70 border-2 border-emerald-200 rounded-2xl p-4 mb-4">
          <h4 className="text-sm font-bold text-emerald-900 mb-2 flex items-center justify-between">
            <span>步驟 1: Google 帳號授權連線</span>
            {sheetConfig.isConnected && (
              <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> 已完成授權
              </span>
            )}
          </h4>

          <p className="text-xs text-emerald-800 mb-3 leading-relaxed">
            系統會請求使用您的 Google Sheets 與 Google Drive 權限，用以儲存與存取這份幼兒園角落學習區資料庫。
          </p>

          <div className="flex justify-center">
            {/* Official GSI Material Button Spec */}
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="gsi-material-button w-full sm:w-auto shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="gsi-material-button-state"></div>
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span className="gsi-material-button-contents font-bold">使用 Google 帳號授權登入</span>
              </div>
            </button>
          </div>
        </div>

        {/* Step 2: Spreadsheet Operations */}
        <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-gray-800">步驟 2: Google 試算表資料庫管理</h4>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
              8大區48項指標同步
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-white border border-gray-300 rounded-xl text-xs space-y-2">
              <div className="font-bold text-gray-800 flex items-center justify-between">
                <span>連線中的試算表：</span>
                <a
                  href={sheetConfig.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${sheetConfig.spreadsheetId || DEFAULT_SPREADSHEET_ID}/edit`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  前往 Google Sheet 查看 <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {isEditingId ? (
                <div className="space-y-1.5 pt-1 border-t border-gray-100">
                  <div className="text-[11px] font-bold text-gray-600">設定 Google 試算表 ID：</div>
                  <input
                    type="text"
                    value={editingSheetId}
                    onChange={(e) => setEditingSheetId(e.target.value)}
                    placeholder="請輸入 Google Sheet ID"
                    className="w-full font-mono text-xs p-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleApplySheetId(editingSheetId)}
                      className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
                    >
                      確認套用
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSheetId(DEFAULT_SPREADSHEET_ID);
                        handleApplySheetId(DEFAULT_SPREADSHEET_ID);
                      }}
                      className="px-2.5 py-1 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600"
                    >
                      使用指定預設 ID
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingId(false)}
                      className="px-2 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-300"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2 bg-gray-100 p-2 rounded-lg border border-gray-200">
                  <div className="truncate font-mono text-[11px] text-gray-700">
                    ID: {sheetConfig.spreadsheetId || DEFAULT_SPREADSHEET_ID}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSheetId(sheetConfig.spreadsheetId || DEFAULT_SPREADSHEET_ID);
                        setIsEditingId(true);
                      }}
                      className="text-[11px] text-blue-600 hover:underline font-bold px-1"
                    >
                      變更
                    </button>
                    {(sheetConfig.spreadsheetId !== DEFAULT_SPREADSHEET_ID) && (
                      <button
                        type="button"
                        onClick={() => handleApplySheetId(DEFAULT_SPREADSHEET_ID)}
                        className="text-[10px] bg-amber-100 text-amber-800 hover:bg-amber-200 font-bold px-1.5 py-0.5 rounded border border-amber-300"
                      >
                        重設為預設 ID
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Synchronized Tabs Info */}
              <div className="bg-emerald-50/60 p-2 rounded-lg border border-emerald-200 text-[11px] text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  已同步工作表結構（支援直接在 Google Sheet 修改內容）：
                </div>
                <ul className="list-disc list-inside text-[10.5px] text-emerald-800 pl-1 space-y-0.5">
                  <li><strong>LearningRecords</strong>：8大角落區48項指標完整橫向展開（含各區專屬筆記與評語）</li>
                  <li><strong>LearningChecklist_48Items</strong>：48項指標縱向檢核表（方便依角落區篩選與樞紐統計）</li>
                  <li><strong>Students</strong>：幼生名冊資料表</li>
                </ul>
              </div>

              {sheetConfig.lastSyncedAt && (
                <div className="text-[11px] text-gray-500">
                  上次同步時間: {sheetConfig.lastSyncedAt}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={triggerSyncToSheet}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                同步寫入 Sheet
              </button>

              <button
                type="button"
                onClick={triggerLoadFromSheet}
                disabled={loading}
                className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                從 Sheet 讀取載入
              </button>
            </div>
          </div>
        </div>

        {/* Step 3 / Alternative Option: Export CSV for Google Sheets */}
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-3 mb-4 flex items-center justify-between gap-3">
          <div>
            <h5 className="text-xs font-black text-amber-900 flex items-center gap-1">
              <Download className="w-3.5 h-3.5 text-amber-600" /> 匯出 CSV 檔 (可在 Google Sheets 匯入)
            </h5>
            <p className="text-[11px] text-amber-800 font-medium">支援一鍵將學生名冊與角落學習紀錄匯出成標準 UTF-8 CSV 檔案。</p>
          </div>
          {onOpenCsvModal && (
            <button
              onClick={() => {
                onClose();
                onOpenCsvModal();
              }}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-1.5 px-3 rounded-xl shrink-0 shadow-xs transition-colors"
            >
              開啟 CSV 匯出中心
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-[11px] text-gray-500">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-emerald-600" /> 資料均儲存於您的個人 Google 雲端
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold text-xs"
          >
            關閉
          </button>
        </div>
      </div>

      {/* Mandatory User Confirmation Modal for Mutating/Destructive operations */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-60 animate-fade-in">
          <div className="bg-white border-2 border-amber-400 rounded-3xl max-w-md w-full p-5 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <AlertTriangle className="w-7 h-7 shrink-0" />
              <h4 className="font-extrabold text-lg text-gray-800">{confirmModal.title}</h4>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed mb-5">
              {confirmModal.message}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-xl"
              >
                取消
              </button>
              <button
                type="button"
                onClick={async () => {
                  const act = confirmModal.action;
                  setConfirmModal({ ...confirmModal, show: false });
                  await act();
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow"
              >
                確認執行
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
