import React, { useState, useEffect } from 'react';
import {
  Target,
  Sparkles,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Download,
  ExternalLink,
  Code2,
  Copy,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Cloud,
  FileSpreadsheet,
  BookOpen,
  Palette,
  Scissors,
  Grid,
  Search,
  Brain,
  Puzzle,
  Box,
  Layers,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CornerAreaDef, SheetConfig } from '../types';
import { getStoredCornerAreas, saveStoredCornerAreas, resetStoredCornerAreas } from '../lib/cornerStorage';
import { exportCornerAreasIndicatorsCsv } from '../lib/csvExport';
import {
  DEFAULT_SPREADSHEET_ID,
  DEFAULT_SPREADSHEET_URL,
  DEFAULT_LEARNING_WEB_APP_URL,
  CORNER_INDICATORS_APPS_SCRIPT_CODE,
  syncCornerAreasToSheet,
  syncCornerAreasToWebApp,
  fetchCornerAreasFromWebApp,
} from '../lib/googleSheets';
import { getAccessToken } from '../lib/firebase';

interface CornerIndicatorsViewProps {
  cornerAreas: CornerAreaDef[];
  setCornerAreas: React.Dispatch<React.SetStateAction<CornerAreaDef[]>>;
  onSaveCornerAreas?: (areas: CornerAreaDef[]) => void;
  sheetConfig: SheetConfig;
  setSheetConfig: React.Dispatch<React.SetStateAction<SheetConfig>>;
  onOpenSheetModal?: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  BookOpen: <BookOpen className="w-5 h-5" />,
  Palette: <Palette className="w-5 h-5" />,
  Scissors: <Scissors className="w-5 h-5" />,
  Grid: <Grid className="w-5 h-5" />,
  Search: <Search className="w-5 h-5" />,
  Brain: <Brain className="w-5 h-5" />,
  Puzzle: <Puzzle className="w-5 h-5" />,
  Box: <Box className="w-5 h-5" />,
};

export const CornerIndicatorsView: React.FC<CornerIndicatorsViewProps> = ({
  cornerAreas,
  setCornerAreas,
  onSaveCornerAreas,
  sheetConfig,
  setSheetConfig,
  onOpenSheetModal,
}) => {
  // Working local state for safe edits
  const [localAreas, setLocalAreas] = useState<CornerAreaDef[]>(() => {
    return cornerAreas && cornerAreas.length > 0 ? cornerAreas : getStoredCornerAreas();
  });

  // Keep localAreas synced if external cornerAreas change when not dirty
  useEffect(() => {
    if (cornerAreas && cornerAreas.length > 0) {
      setLocalAreas(cornerAreas);
    }
  }, [cornerAreas]);

  // Active view tab: 'editor' | 'sync-script' | 'matrix'
  const [pageTab, setPageTab] = useState<'editor' | 'sync-script' | 'matrix'>('editor');

  // Selected area for editor tab
  const [selectedAreaId, setSelectedAreaId] = useState<string>(
    localAreas[0]?.id || 'language'
  );

  // Indicators editing states
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [newItemText, setNewItemText] = useState<string>('');

  // Area name editing states
  const [isEditingAreaName, setIsEditingAreaName] = useState<boolean>(false);
  const [editingAreaName, setEditingAreaName] = useState<string>('');

  // Syncing & UI status states
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [customWebAppUrl, setCustomWebAppUrl] = useState<string>(() => {
    if (!sheetConfig.learningWebAppUrl || sheetConfig.learningWebAppUrl.includes('AKfycbz_tGPQoBjfRl_s75spbBoeT1xOp1dgp6d0E4Apn-YHdCyNtQmI8g7kW28ZWfJP1rZ5')) {
      return DEFAULT_LEARNING_WEB_APP_URL;
    }
    return sheetConfig.learningWebAppUrl || DEFAULT_LEARNING_WEB_APP_URL;
  });

  // Auto-sync 8 areas and 48 indicators on first visit to maintain full header sync
  useEffect(() => {
    const targetUrl = customWebAppUrl || DEFAULT_LEARNING_WEB_APP_URL;
    const sessionKey = `corner_synced_${targetUrl.slice(-16)}`;
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, 'true');
      syncCornerAreasToWebApp(targetUrl, localAreas)
        .then(() => {
          showStatus('success', '✅ 系統已自動將 8 大區與 48 項指標寫入 Google Sheet，並保持表頭名稱完全同步！', 5000);
        })
        .catch(() => {});
    }
  }, []);

  // Unsaved changes detector
  const currentTotalItems = localAreas.reduce((acc, a) => acc + (a.items?.length || 0), 0);

  const selectedArea = localAreas.find((a) => a.id === selectedAreaId) || localAreas[0];

  const showStatus = (type: 'success' | 'error' | 'info', message: string, durationMs = 4000) => {
    setSyncStatus({ type, message });
    setTimeout(() => {
      setSyncStatus((prev) => (prev?.message === message ? null : prev));
    }, durationMs);
  };

  // Save to persistent storage and update global application state
  const handleSaveAll = (areasToSave = localAreas) => {
    saveStoredCornerAreas(areasToSave);
    setCornerAreas(areasToSave);
    if (onSaveCornerAreas) {
      onSaveCornerAreas(areasToSave);
    }
    showStatus('success', `💾 已成功儲存 8 大區與 ${areasToSave.reduce((acc, a) => acc + a.items.length, 0)} 項評估指標！`);
    try {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#4CAF50', '#81C784', '#FFB74D'],
      });
    } catch {}
  };

  // Reset to default 8 areas & 48 indicators
  const handleResetToDefault = () => {
    if (window.confirm('確定要一鍵恢復為預設的 8 大區與標準 48 項能力評估指標嗎？自訂的名稱將會重置。')) {
      const defs = resetStoredCornerAreas();
      setLocalAreas(defs);
      setCornerAreas(defs);
      if (onSaveCornerAreas) onSaveCornerAreas(defs);
      showStatus('success', '已成功恢復為系統預設 8 大區與 48 項能力評估指標！');
    }
  };

  // Synchronize 8 areas & indicators to Google Sheet
  const handleSyncToGoogleSheet = async () => {
    setIsSyncing(true);
    showStatus('info', '正在將 8 大區與 48 項評估指標寫入 Google Sheet 並同步表頭名稱...');

    const spreadsheetId = sheetConfig.spreadsheetId || DEFAULT_SPREADSHEET_ID;
    const token = getAccessToken();

    try {
      // First save locally to make sure it's up to date
      handleSaveAll(localAreas);

      // Always sync to the Google Apps Script Web App URL
      const targetUrl = customWebAppUrl || sheetConfig.learningWebAppUrl || sheetConfig.webAppUrl || DEFAULT_LEARNING_WEB_APP_URL;
      await syncCornerAreasToWebApp(targetUrl, localAreas);

      // If REST API OAuth token is available, also update directly to spreadsheet
      if (token) {
        try {
          await syncCornerAreasToSheet(token, spreadsheetId, localAreas);
        } catch (apiErr) {
          console.warn('REST API sync notice:', apiErr);
        }
      }

      showStatus('success', `✅ 已成功將 8 大區與 48 項指標寫入 Google Sheet「CornerIndicators」工作表，並保持「LearningRecords」表頭名稱完全同步！`, 6000);
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.5 },
          colors: ['#2E7D32', '#66BB6A', '#FFB74D', '#FF8A65', '#0288D1'],
        });
      } catch {}
    } catch (err: any) {
      showStatus('error', `❌ 同步失敗: ${err.message || '請檢查網路連線或授權權限'}`, 8000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Pull indicators from Google Sheet Web App
  const handlePullFromGoogleSheet = async () => {
    const targetUrl = customWebAppUrl || sheetConfig.learningWebAppUrl || sheetConfig.webAppUrl || DEFAULT_LEARNING_WEB_APP_URL;
    setIsSyncing(true);
    showStatus('info', '正在從 Google Sheet Web App 讀取指標設定...');

    try {
      const fetchedAreas = await fetchCornerAreasFromWebApp(targetUrl);
      if (fetchedAreas && fetchedAreas.length > 0) {
        setLocalAreas(fetchedAreas);
        handleSaveAll(fetchedAreas);
        showStatus('success', `✅ 已成功從 Google Sheet 載入 ${fetchedAreas.length} 大區指標設定！`);
      } else {
        showStatus('info', 'Google Sheet 尚未建立 CornerIndicators 工作表，可點擊「同步至 Google Sheet」立即自動建立！');
      }
    } catch (err: any) {
      showStatus('error', `讀取失敗: ${err.message || '無法連線至 Web App'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Copy Apps Script code
  const handleCopyCode = () => {
    try {
      navigator.clipboard.writeText(CORNER_INDICATORS_APPS_SCRIPT_CODE);
      setCopiedCode(true);
      showStatus('success', '📋 已將完整 Google Apps Script 程式碼複製到剪貼簿！');
      setTimeout(() => setCopiedCode(false), 3000);
    } catch {
      showStatus('error', '無法自動複製，請手動反白全選程式碼框進行複製。');
    }
  };

  // Item management within selected area
  const handleStartEditItem = (idx: number, text: string) => {
    setEditingIndex(idx);
    setEditingText(text);
  };

  const handleSaveEditItem = (idx: number) => {
    const trimmed = editingText.trim();
    if (!trimmed) {
      alert('評估指標內容不能為空！');
      return;
    }
    if (!selectedArea) return;

    if (selectedArea.items.some((item, i) => i !== idx && item === trimmed)) {
      alert(`此區已存在相同名稱的指標項目：「${trimmed}」！`);
      return;
    }

    const updated = localAreas.map((area) => {
      if (area.id !== selectedArea.id) return area;
      const newItems = [...area.items];
      newItems[idx] = trimmed;
      return { ...area, items: newItems };
    });

    setLocalAreas(updated);
    setEditingIndex(null);
    setEditingText('');
    showStatus('success', `已更新指標項目為「${trimmed}」`);
  };

  const handleDeleteItem = (idx: number) => {
    if (!selectedArea) return;
    const itemName = selectedArea.items[idx];
    if (selectedArea.items.length <= 1) {
      alert('每個學習區至少需保留 1 項評估指標！');
      return;
    }
    if (window.confirm(`確定要刪除「${selectedArea.name}」的指標項目「${itemName}」嗎？`)) {
      const updated = localAreas.map((area) => {
        if (area.id !== selectedArea.id) return area;
        return {
          ...area,
          items: area.items.filter((_, i) => i !== idx),
        };
      });
      setLocalAreas(updated);
      showStatus('info', `已刪除指標「${itemName}」`);
    }
  };

  const handleAddItem = () => {
    const trimmed = newItemText.trim();
    if (!trimmed) return;
    if (!selectedArea) return;

    if (selectedArea.items.includes(trimmed)) {
      alert(`此區已存在相同指標項目：「${trimmed}」！`);
      return;
    }

    const updated = localAreas.map((area) => {
      if (area.id !== selectedArea.id) return area;
      return {
        ...area,
        items: [...area.items, trimmed],
      };
    });

    setLocalAreas(updated);
    setNewItemText('');
    showStatus('success', `已新增指標「${trimmed}」至 ${selectedArea.name}！`);
  };

  const handleMoveItem = (fromIdx: number, toIdx: number) => {
    if (!selectedArea) return;
    if (toIdx < 0 || toIdx >= selectedArea.items.length) return;

    const newItems = [...selectedArea.items];
    const [moved] = newItems.splice(fromIdx, 1);
    newItems.splice(toIdx, 0, moved);

    const updated = localAreas.map((area) => {
      if (area.id !== selectedArea.id) return area;
      return { ...area, items: newItems };
    });

    setLocalAreas(updated);
  };

  // Area Rename handlers
  const handleStartRenameArea = () => {
    if (!selectedArea) return;
    setEditingAreaName(selectedArea.name);
    setIsEditingAreaName(true);
  };

  const handleSaveRenameArea = () => {
    const trimmed = editingAreaName.trim();
    if (!trimmed) {
      alert('學習區域名稱不能為空！');
      return;
    }
    if (!selectedArea) return;

    const updated = localAreas.map((area) => {
      if (area.id !== selectedArea.id) return area;
      return { ...area, name: trimmed };
    });

    setLocalAreas(updated);
    setIsEditingAreaName(false);
    showStatus('success', `已將區域名稱修改為「${trimmed}」！`);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 space-y-4">
      {/* Top Banner & Header Card */}
      <div className="bg-white rounded-3xl border-4 border-[#5D4037] shadow-[6px_6px_0px_#5D4037] p-4 sm:p-6 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Title & Description */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#81C784] border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] flex items-center justify-center text-[#1B5E20]">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-[#5D4037] flex items-center gap-2">
                  <span>八大角落學習區與 48 項能力指標管理中心</span>
                </h1>
                <p className="text-xs sm:text-sm text-[#8D6E63] font-bold">
                  自由自訂 8 大區名稱、能力指標項目，即時儲存、同步 Google Sheet 並提供專用 Apps Script 雙向服務。
                </p>
              </div>
            </div>

            {/* Badges / Stats */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E8F5E9] text-[#1B5E20] border-2 border-[#5D4037] text-xs font-black shadow-[2px_2px_0px_#5D4037]">
                <Sparkles className="w-3.5 h-3.5 text-[#2E7D32]" />
                {localAreas.length} 大角落學習區
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FFF9C4] text-[#E65100] border-2 border-[#5D4037] text-xs font-black shadow-[2px_2px_0px_#5D4037]">
                <Target className="w-3.5 h-3.5 text-[#E65100]" />
                目前共 {currentTotalItems} 項能力指標
              </span>
              <a
                href={DEFAULT_SPREADSHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                title="在新分頁開啟已綁定之 Google 試算表"
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#E3F2FD] hover:bg-[#BBDEFB] text-[#0D47A1] border-2 border-[#5D4037] text-xs font-black shadow-[2px_2px_0px_#5D4037] transition-all cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#1565C0]" />
                <span>Google 試算表 ID: {sheetConfig.spreadsheetId ? sheetConfig.spreadsheetId.slice(0, 8) + '...' : DEFAULT_SPREADSHEET_ID.slice(0, 8) + '...'}</span>
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="save-indicators-all-btn"
              type="button"
              onClick={() => handleSaveAll()}
              className="px-4 py-2 bg-[#4CAF50] hover:bg-[#43A047] text-white rounded-2xl border-2 border-[#5D4037] font-black text-xs sm:text-sm shadow-[3px_3px_0px_#5D4037] active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
              title="儲存所有對 8 大區與指標的修改"
            >
              <Save className="w-4 h-4" />
              <span>💾 儲存修改</span>
            </button>

            <button
              id="sync-indicators-to-sheet-btn"
              type="button"
              onClick={handleSyncToGoogleSheet}
              disabled={isSyncing}
              className="px-4 py-2 bg-[#0288D1] hover:bg-[#0277BD] text-white rounded-2xl border-2 border-[#5D4037] font-black text-xs sm:text-sm shadow-[3px_3px_0px_#5D4037] active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="將 8 大區 48 項指標寫入 Google Sheet"
            >
              <Cloud className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? '同步中...' : '☁️ 同步至 Google Sheet'}</span>
            </button>

            <button
              id="export-indicators-csv-page-btn"
              type="button"
              onClick={() => {
                exportCornerAreasIndicatorsCsv(localAreas);
                showStatus('success', `已成功匯出 8 大區 ${currentTotalItems} 項指標 CSV！`);
              }}
              className="px-3.5 py-2 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#1B5E20] rounded-2xl border-2 border-[#5D4037] font-black text-xs sm:text-sm shadow-[3px_3px_0px_#5D4037] active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
              title="匯出 8 大區 48 項指標 CSV 試算表"
            >
              <Download className="w-4 h-4 text-[#2E7D32]" />
              <span className="hidden sm:inline">匯出 CSV</span>
              <span className="sm:hidden">CSV</span>
            </button>

            <button
              id="reset-indicators-default-btn"
              type="button"
              onClick={handleResetToDefault}
              className="px-3.5 py-2 bg-[#FFF3E0] hover:bg-[#FFE0B2] text-[#E65100] rounded-2xl border-2 border-[#5D4037] font-black text-xs sm:text-sm shadow-[3px_3px_0px_#5D4037] active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
              title="一鍵重置為標準 48 項指標"
            >
              <RotateCcw className="w-4 h-4 text-[#E65100]" />
              <span className="hidden sm:inline">恢復預設</span>
            </button>
          </div>
        </div>

        {/* Sync Status Toast Alert */}
        {syncStatus && (
          <div
            className={`mt-4 p-3 rounded-2xl border-2 border-[#5D4037] flex items-center justify-between gap-2 shadow-[2px_2px_0px_#5D4037] animate-in fade-in duration-200 ${
              syncStatus.type === 'success'
                ? 'bg-[#E8F5E9] text-[#1B5E20]'
                : syncStatus.type === 'error'
                ? 'bg-[#FFEBEE] text-[#C62828]'
                : 'bg-[#E1F5FE] text-[#0277BD]'
            }`}
          >
            <div className="flex items-center gap-2 text-xs sm:text-sm font-black">
              {syncStatus.type === 'success' && <CheckCircle2 className="w-4 h-4 text-[#2E7D32] shrink-0" />}
              {syncStatus.type === 'error' && <AlertCircle className="w-4 h-4 text-[#C62828] shrink-0" />}
              {syncStatus.type === 'info' && <RefreshCw className="w-4 h-4 text-[#0277BD] shrink-0 animate-spin" />}
              <span>{syncStatus.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setSyncStatus(null)}
              className="text-[#5D4037] hover:opacity-70 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dedicated Web App Target & 1-Click Sync Banner */}
        <div className="mt-4 p-3.5 sm:p-4 rounded-2xl border-2 border-[#1565C0] bg-[#E3F2FD] shadow-[2px_2px_0px_#1565C0] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#1565C0] text-white text-[11px] font-black tracking-wider">
                ⚡ 預設 Web App 端點已綁定
              </span>
              <span className="text-xs font-mono font-bold text-[#0D47A1] break-all">
                {customWebAppUrl}
              </span>
            </div>
            <p className="text-xs font-bold text-[#0D47A1]">
              將 8 大區與 48 項指標寫入 Google Sheet，並保持表頭名稱完全同步
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="quick-sync-indicators-btn"
              type="button"
              onClick={handleSyncToGoogleSheet}
              disabled={isSyncing}
              className="w-full sm:w-auto px-4 py-2 bg-[#1565C0] hover:bg-[#0D47A1] text-white rounded-xl border-2 border-[#5D4037] font-black text-xs sm:text-sm shadow-[2px_2px_0px_#5D4037] active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              title="將 8 大區 48 項指標寫入 Google Sheet 並同步表頭"
            >
              <Cloud className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? '正在寫入 Google Sheet...' : '一鍵寫入 Google Sheet (同步表頭)'}</span>
            </button>
          </div>
        </div>

        {/* Page Nav Sub-Tabs */}
        <div className="flex items-center gap-2 mt-5 border-t-2 border-[#5D4037]/20 pt-4 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setPageTab('editor')}
            className={`px-4 py-2 rounded-2xl font-black text-xs sm:text-sm transition-all border-2 border-[#5D4037] flex items-center gap-2 cursor-pointer ${
              pageTab === 'editor'
                ? 'bg-[#81C784] text-[#1B5E20] shadow-[3px_3px_0px_#5D4037] -translate-y-0.5'
                : 'bg-[#FFF9C4] text-[#5D4037] hover:bg-[#FFF59D] shadow-[2px_2px_0px_#5D4037]'
            }`}
          >
            <Edit2 className="w-4 h-4" />
            <span>🎨 8 大區與 48 項指標編輯器</span>
          </button>

          <button
            type="button"
            onClick={() => setPageTab('sync-script')}
            className={`px-4 py-2 rounded-2xl font-black text-xs sm:text-sm transition-all border-2 border-[#5D4037] flex items-center gap-2 cursor-pointer ${
              pageTab === 'sync-script'
                ? 'bg-[#81C784] text-[#1B5E20] shadow-[3px_3px_0px_#5D4037] -translate-y-0.5'
                : 'bg-[#FFF9C4] text-[#5D4037] hover:bg-[#FFF59D] shadow-[2px_2px_0px_#5D4037]'
            }`}
          >
            <Code2 className="w-4 h-4 text-[#1565C0]" />
            <span>⚡ Google Sheet 同步與 Apps Script 程式碼</span>
          </button>

          <button
            type="button"
            onClick={() => setPageTab('matrix')}
            className={`px-4 py-2 rounded-2xl font-black text-xs sm:text-sm transition-all border-2 border-[#5D4037] flex items-center gap-2 cursor-pointer ${
              pageTab === 'matrix'
                ? 'bg-[#81C784] text-[#1B5E20] shadow-[3px_3px_0px_#5D4037] -translate-y-0.5'
                : 'bg-[#FFF9C4] text-[#5D4037] hover:bg-[#FFF59D] shadow-[2px_2px_0px_#5D4037]'
            }`}
          >
            <Layers className="w-4 h-4 text-[#E65100]" />
            <span>📋 48 項指標全景矩陣總覽</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: 8 大區與 48 項指標編輯器 (Visual Editor) */}
      {/* ========================================================= */}
      {pageTab === 'editor' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Left Column: 8 Major Areas Selector */}
          <div className="md:col-span-4 space-y-2">
            <div className="bg-white rounded-3xl border-4 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] p-3 sm:p-4">
              <div className="flex items-center justify-between pb-2 border-b-2 border-[#5D4037]/10 mb-3">
                <span className="text-xs font-black text-[#5D4037] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#FF8A65]" />
                  選擇欲修改的角落學習區
                </span>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-[#FFF9C4] text-[#5D4037] border border-[#5D4037]">
                  共 {localAreas.length} 區
                </span>
              </div>

              <div className="space-y-2">
                {localAreas.map((area, idx) => {
                  const isSelected = area.id === selectedAreaId;
                  const icon = ICON_MAP[area.iconName] || <Sparkles className="w-5 h-5" />;
                  return (
                    <button
                      key={area.id}
                      type="button"
                      onClick={() => {
                        setSelectedAreaId(area.id);
                        setEditingIndex(null);
                        setIsEditingAreaName(false);
                      }}
                      className={`w-full p-3 rounded-2xl border-2 border-[#5D4037] font-black text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#FFE082] text-[#5D4037] shadow-[3px_3px_0px_#5D4037] -translate-y-0.5'
                          : 'bg-white hover:bg-[#FFF9C4]/40 text-[#5D4037] shadow-[1px_1px_0px_#5D4037]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-[#5D4037] text-white text-xs flex items-center justify-center font-black shrink-0">
                          {idx + 1}
                        </span>
                        <div className="p-1 rounded-lg bg-white/70 border border-[#5D4037]/30">
                          {icon}
                        </div>
                        <div>
                          <div className="text-sm font-black">{area.name}</div>
                          <div className="text-[10px] text-[#8D6E63] font-bold tracking-tight">
                            代碼: {area.id}
                          </div>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded-full bg-white text-[#5D4037] border border-[#5D4037] text-xs font-black shadow-xs">
                        {area.items.length} 項
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Selected Area Indicators Items */}
          <div className="md:col-span-8 space-y-4">
            {selectedArea && (
              <div className="bg-white rounded-3xl border-4 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] p-4 sm:p-6 space-y-5">
                {/* Area Header & Rename */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border-2 border-[#5D4037] bg-[#FFF9C4]/50 shadow-[2px_2px_0px_#5D4037]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] flex items-center justify-center text-[#5D4037]">
                      {ICON_MAP[selectedArea.iconName] || <Sparkles className="w-6 h-6" />}
                    </div>

                    <div>
                      {isEditingAreaName ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingAreaName}
                            onChange={(e) => setEditingAreaName(e.target.value)}
                            className="px-3 py-1 bg-white border-2 border-[#5D4037] rounded-xl font-black text-sm text-[#5D4037] outline-none shadow-[2px_2px_0px_#5D4037]"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleSaveRenameArea}
                            className="p-1.5 bg-[#4CAF50] text-white rounded-xl border border-[#5D4037] shadow-xs hover:bg-[#43A047]"
                            title="確認區域名稱"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsEditingAreaName(false)}
                            className="p-1.5 bg-gray-200 text-gray-700 rounded-xl border border-[#5D4037] shadow-xs hover:bg-gray-300"
                            title="取消"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg sm:text-xl font-black text-[#5D4037]">
                            {selectedArea.name}
                          </h2>
                          <button
                            type="button"
                            onClick={handleStartRenameArea}
                            className="p-1 rounded-lg bg-white border border-[#5D4037] text-[#5D4037] hover:bg-[#FFE082] transition-all shadow-xs cursor-pointer"
                            title="修改學習區域名稱"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-[#8D6E63] font-bold">
                        英文代碼: <span className="font-mono">{selectedArea.id}</span> ｜ 包含 {selectedArea.items.length} 項能力評估指標
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-[#E8F5E9] text-[#1B5E20] border-2 border-[#5D4037] text-xs font-black shadow-[2px_2px_0px_#5D4037] self-start sm:self-auto">
                    {selectedArea.items.length} 項能力指標
                  </span>
                </div>

                {/* Items List */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-black text-[#5D4037] px-1">
                    <span>指標項目清單（可即時修改、調整順序或刪除）</span>
                    <span className="text-[#8D6E63]">點擊筆圖示即可在線編輯</span>
                  </div>

                  {selectedArea.items.map((item, idx) => {
                    const isEditing = editingIndex === idx;
                    return (
                      <div
                        key={`${selectedArea.id}-${idx}`}
                        className={`p-3 rounded-2xl border-2 border-[#5D4037] flex items-center justify-between gap-2 transition-all shadow-[2px_2px_0px_#5D4037] ${
                          isEditing ? 'bg-[#FFF9C4]' : 'bg-[#FAFAFA] hover:bg-white'
                        }`}
                      >
                        {/* Index Badge */}
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-[#FFE082] border border-[#5D4037] text-[#5D4037] text-xs font-black flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>

                          {isEditing ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                className="w-full px-3 py-1.5 bg-white border-2 border-[#5D4037] rounded-xl font-bold text-sm text-[#5D4037] outline-none shadow-xs"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEditItem(idx);
                                  if (e.key === 'Escape') setEditingIndex(null);
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveEditItem(idx)}
                                className="px-2.5 py-1.5 bg-[#4CAF50] text-white rounded-xl border border-[#5D4037] font-bold text-xs shadow-xs hover:bg-[#43A047] flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" /> 儲存
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingIndex(null)}
                                className="px-2 py-1.5 bg-gray-200 text-gray-700 rounded-xl border border-[#5D4037] font-bold text-xs shadow-xs hover:bg-gray-300 cursor-pointer"
                              >
                                取消
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col min-w-0">
                              <span className="font-black text-sm text-[#5D4037] truncate">
                                {item}
                              </span>
                              <span className="text-[10px] text-[#8D6E63] font-bold">
                                標籤: [{selectedArea.name}] {idx + 1}. {item}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Item Actions */}
                        {!isEditing && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveItem(idx, idx - 1)}
                              disabled={idx === 0}
                              className="p-1 rounded-lg border border-[#5D4037] bg-white hover:bg-[#FFF9C4] text-[#5D4037] disabled:opacity-30 cursor-pointer"
                              title="向上移動"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveItem(idx, idx + 1)}
                              disabled={idx === selectedArea.items.length - 1}
                              className="p-1 rounded-lg border border-[#5D4037] bg-white hover:bg-[#FFF9C4] text-[#5D4037] disabled:opacity-30 cursor-pointer"
                              title="向下移動"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStartEditItem(idx, item)}
                              className="p-1 rounded-lg border border-[#5D4037] bg-white hover:bg-[#FFE082] text-[#5D4037] cursor-pointer"
                              title="修改指標名稱"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(idx)}
                              className="p-1 rounded-lg border border-[#5D4037] bg-white hover:bg-[#FFCDD2] text-[#C62828] cursor-pointer"
                              title="刪除指標項目"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add New Item Box */}
                <div className="p-4 rounded-2xl border-2 border-dashed border-[#5D4037] bg-[#FFFDE7]/60 space-y-2">
                  <label className="block text-xs font-black text-[#5D4037]">
                    ＋ 新增評估指標項目至「{selectedArea.name}」
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`輸入「${selectedArea.name}」新評估能力項目（例如：色彩觀察與調配創作）`}
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddItem();
                      }}
                      className="flex-1 px-3.5 py-2 rounded-xl border-2 border-[#5D4037] bg-white text-xs sm:text-sm font-bold text-[#5D4037] outline-none shadow-[2px_2px_0px_#5D4037]"
                    />
                    <button
                      type="button"
                      onClick={handleAddItem}
                      disabled={!newItemText.trim()}
                      className="px-4 py-2 bg-[#4CAF50] hover:bg-[#43A047] disabled:opacity-40 text-white rounded-xl border-2 border-[#5D4037] font-black text-xs sm:text-sm shadow-[2px_2px_0px_#5D4037] flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>新增指標</span>
                    </button>
                  </div>
                </div>

                {/* Save Reminder Footer */}
                <div className="flex items-center justify-between pt-3 border-t-2 border-[#5D4037]/10 text-xs">
                  <span className="text-[#8D6E63] font-bold">
                    💡 修改完成後，請點擊頂部「💾 儲存修改」按鈕儲存至本機或點選「☁️ 同步至 Google Sheet」。
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSaveAll()}
                    className="px-3.5 py-1.5 rounded-xl bg-[#4CAF50] hover:bg-[#43A047] text-white font-black border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] cursor-pointer"
                  >
                    即刻儲存
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: Google Sheet 同步與 Apps Script 程式碼 (Code & Sync) */}
      {/* ========================================================= */}
      {pageTab === 'sync-script' && (
        <div className="space-y-4">
          {/* Cloud Sync Status & Endpoints Card */}
          <div className="bg-white rounded-3xl border-4 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-[#5D4037]/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#E3F2FD] border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] flex items-center justify-center text-[#1565C0]">
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-[#5D4037]">
                    Google Sheet 雙向同步設定與連線
                  </h2>
                  <p className="text-xs text-[#8D6E63] font-bold">
                    將 8 大區與 48 項指標寫入 Google Sheet，並保持表頭名稱完全同步
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={DEFAULT_SPREADSHEET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-[#E3F2FD] hover:bg-[#BBDEFB] text-[#0D47A1] rounded-2xl border-2 border-[#5D4037] font-black text-xs shadow-[2px_2px_0px_#5D4037] flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#1565C0]" />
                  <span>開啟 Google 試算表</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Web App URL Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-8 space-y-1">
                <label className="block text-xs font-black text-[#5D4037]">
                  Google Apps Script 網頁應用程式網址 (Web App URL)
                </label>
                <input
                  type="text"
                  value={customWebAppUrl}
                  onChange={(e) => {
                    setCustomWebAppUrl(e.target.value);
                    setSheetConfig((prev) => ({
                      ...prev,
                      learningWebAppUrl: e.target.value,
                    }));
                  }}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full px-3.5 py-2 bg-[#FAFAFA] focus:bg-white rounded-xl border-2 border-[#5D4037] font-mono text-xs text-[#5D4037] outline-none shadow-[2px_2px_0px_#5D4037]"
                />
              </div>

              <div className="md:col-span-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSyncToGoogleSheet}
                  disabled={isSyncing}
                  className="flex-1 px-3.5 py-2 bg-[#0288D1] hover:bg-[#0277BD] text-white rounded-xl border-2 border-[#5D4037] font-black text-xs shadow-[2px_2px_0px_#5D4037] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Cloud className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>立即同步指標</span>
                </button>
                <button
                  type="button"
                  onClick={handlePullFromGoogleSheet}
                  disabled={isSyncing}
                  className="px-3.5 py-2 bg-[#FFF9C4] hover:bg-[#FFF59D] text-[#5D4037] rounded-xl border-2 border-[#5D4037] font-black text-xs shadow-[2px_2px_0px_#5D4037] flex items-center justify-center gap-1.5 cursor-pointer"
                  title="從 Google Sheet 讀取指標"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>從 Sheet 讀取</span>
                </button>
              </div>
            </div>
          </div>

          {/* Apps Script Code Display & One-Click Copy */}
          <div className="bg-white rounded-3xl border-4 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-[#5D4037]/10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#FFE082] border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] flex items-center justify-center text-[#5D4037]">
                  <Code2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-[#5D4037]">
                    專用 Google Apps Script 程式碼（八大區指標建表與雙向同步）
                  </h2>
                  <p className="text-xs text-[#8D6E63] font-bold">
                    複製此腳本貼入 Google 試算表 Apps Script，即可自動建立 CornerIndicators 表格並支援雙向同步
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyCode}
                className={`px-4 py-2 rounded-2xl border-2 border-[#5D4037] font-black text-xs sm:text-sm shadow-[3px_3px_0px_#5D4037] active:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer ${
                  copiedCode
                    ? 'bg-[#4CAF50] text-white'
                    : 'bg-[#FFD54F] hover:bg-[#FFCA28] text-[#5D4037]'
                }`}
              >
                {copiedCode ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? '已成功複製程式碼！' : '📋 複製完整 Apps Script 程式碼'}</span>
              </button>
            </div>

            {/* Quick Setup Instructions (3 Steps) */}
            <div className="p-4 rounded-2xl border-2 border-[#5D4037] bg-[#FFF8E1] space-y-2">
              <h3 className="text-xs font-black text-[#5D4037] uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-[#FF8A65]" />
                Apps Script 3 分鐘快速部署指南：
              </h3>
              <ol className="text-xs font-bold text-[#5D4037] space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>
                  開啟您的 Google 試算表（例如：
                  <a
                    href={DEFAULT_SPREADSHEET_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1565C0] underline font-mono ml-1"
                  >
                    開啟愛愛幼兒園試算表
                  </a>
                  ），點擊頂部選單「<strong>擴充功能</strong>」➔「<strong>Apps Script</strong>」。
                </li>
                <li>
                  清空編輯器現有內容，點擊上方「<strong>📋 複製完整 Apps Script 程式碼</strong>」並貼入 <code className="bg-white px-1.5 py-0.5 rounded border border-[#5D4037] font-mono">程式碼.gs</code>。
                </li>
                <li>
                  點選右上角「<strong>部署</strong>」➔「<strong>新增部署</strong>」➔ 齒輪圖示選「<strong>網頁應用程式 (Web App)</strong>」。
                </li>
                <li>
                  執行身分選擇「<strong>我 (Me)</strong>」，存取權限設為「<strong>所有人 (Anyone)</strong>」（務必選 Anyone，系統才能在免登入下進行背景同步）。
                </li>
                <li>
                  點擊「<strong>部署</strong>」並授權，將產生的「<strong>網頁應用程式網址 (URL)</strong>」貼回本頁上方輸入框即完成設定！
                </li>
              </ol>
            </div>

            {/* Code Block Container */}
            <div className="rounded-2xl border-2 border-[#5D4037] bg-[#2E1A11] text-[#E0E0E0] overflow-hidden shadow-[3px_3px_0px_#5D4037]">
              {/* Fake Mac Titlebar */}
              <div className="px-4 py-2 bg-[#1B0F0A] border-b border-[#5D4037]/50 flex items-center justify-between text-xs text-stone-400 font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#EF5350] inline-block" />
                  <span className="w-3 h-3 rounded-full bg-[#FFCA28] inline-block" />
                  <span className="w-3 h-3 rounded-full bg-[#66BB6A] inline-block" />
                  <span className="ml-2 text-stone-300 font-bold">CornerIndicatorsSync.gs (Google Apps Script)</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="text-stone-300 hover:text-white flex items-center gap-1 font-bold text-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCode ? '已複製' : '複製代碼'}</span>
                </button>
              </div>

              {/* Code Pre Block */}
              <pre className="p-4 text-xs font-mono overflow-x-auto max-h-[480px] leading-relaxed select-all">
                <code>{CORNER_INDICATORS_APPS_SCRIPT_CODE}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: 48 項指標全景矩陣總覽 (Matrix Overview) */}
      {/* ========================================================= */}
      {pageTab === 'matrix' && (
        <div className="bg-white rounded-3xl border-4 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-[#5D4037]/10">
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#5D4037] flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#FF8A65]" />
                <span>八大角落學習區與 48 項能力評估指標全景對照矩陣</span>
              </h2>
              <p className="text-xs text-[#8D6E63] font-bold">
                一覽全園八大角落學習區能力規劃，支援點擊任一區快速切換至編輯器調整
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                exportCornerAreasIndicatorsCsv(localAreas);
                showStatus('success', `已成功匯出 8 大區 ${currentTotalItems} 項指標 CSV！`);
              }}
              className="px-3.5 py-2 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#1B5E20] rounded-2xl border-2 border-[#5D4037] font-black text-xs shadow-[2px_2px_0px_#5D4037] flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4 text-[#2E7D32]" />
              <span>匯出 48 項指標 (CSV)</span>
            </button>
          </div>

          {/* 8 Areas Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {localAreas.map((area, areaIdx) => {
              const icon = ICON_MAP[area.iconName] || <Sparkles className="w-5 h-5" />;
              return (
                <div
                  key={area.id}
                  className="rounded-2xl border-2 border-[#5D4037] bg-[#FFFDE7]/40 p-3.5 space-y-2.5 shadow-[2px_2px_0px_#5D4037] flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-[#5D4037]/10">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#5D4037] text-white text-[10px] flex items-center justify-center font-black">
                          {areaIdx + 1}
                        </span>
                        <div className="text-[#5D4037]">{icon}</div>
                        <span className="font-black text-sm text-[#5D4037]">
                          {area.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#FFE082] text-[#5D4037] border border-[#5D4037]">
                        {area.items.length} 項
                      </span>
                    </div>

                    <ol className="space-y-1.5 text-xs text-[#5D4037] list-inside font-bold">
                      {area.items.map((item, itIdx) => (
                        <li key={itIdx} className="truncate flex items-start gap-1.5">
                          <span className="text-[#8D6E63] font-mono text-[10px] mt-0.5 shrink-0">
                            {itIdx + 1}.
                          </span>
                          <span className="truncate" title={item}>{item}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAreaId(area.id);
                      setPageTab('editor');
                    }}
                    className="w-full py-1.5 text-center text-xs font-black text-[#5D4037] bg-white hover:bg-[#FFE082] rounded-xl border border-[#5D4037] shadow-xs cursor-pointer transition-all"
                  >
                    ✏️ 編輯此區指標
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
