import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  BookOpen,
  Palette,
  Scissors,
  Grid,
  Search,
  Brain,
  Puzzle,
  Box,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { CornerAreaDef } from '../types';
import { getStoredCornerAreas, saveStoredCornerAreas, resetStoredCornerAreas } from '../lib/cornerStorage';

interface CornerAreasManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cornerAreas?: CornerAreaDef[];
  setCornerAreas?: React.Dispatch<React.SetStateAction<CornerAreaDef[]>>;
  onSave?: (newAreas: CornerAreaDef[]) => void;
  initialAreaId?: string;
  onItemRenamed?: (areaId: string, oldName: string, newName: string) => void;
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

export const CornerAreasManagerModal: React.FC<CornerAreasManagerModalProps> = ({
  isOpen,
  onClose,
  cornerAreas,
  setCornerAreas,
  onSave,
  initialAreaId,
  onItemRenamed,
}) => {
  const activeAreas = (cornerAreas && cornerAreas.length > 0) ? cornerAreas : getStoredCornerAreas();

  const [selectedAreaId, setSelectedAreaId] = useState<string>(
    initialAreaId || activeAreas[0]?.id || 'language'
  );

  // Sync initialAreaId when opened
  React.useEffect(() => {
    if (initialAreaId && activeAreas.some((a) => a.id === initialAreaId)) {
      setSelectedAreaId(initialAreaId);
    } else if (!activeAreas.some((a) => a.id === selectedAreaId)) {
      setSelectedAreaId(activeAreas[0]?.id || 'language');
    }
  }, [initialAreaId, activeAreas, selectedAreaId]);

  // Editing item state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  // Adding item state
  const [newItemText, setNewItemText] = useState<string>('');

  // Editing Area name state
  const [isEditingAreaName, setIsEditingAreaName] = useState<boolean>(false);
  const [editingAreaName, setEditingAreaName] = useState<string>('');

  // Notification / Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Helper to persist and update areas in state and storage
  const updateAreas = (updater: (prev: CornerAreaDef[]) => CornerAreaDef[]) => {
    const nextAreas = updater(activeAreas);
    if (setCornerAreas) {
      setCornerAreas(nextAreas);
    }
    if (onSave) {
      onSave(nextAreas);
    }
    saveStoredCornerAreas(nextAreas);
  };

  if (!isOpen) return null;

  const currentArea = activeAreas.find((a) => a.id === selectedAreaId) || activeAreas[0];

  // Start editing an existing item
  const handleStartEditItem = (index: number, currentText: string) => {
    setEditingIndex(index);
    setEditingText(currentText);
  };

  // Save edited item
  const handleSaveEditItem = (index: number) => {
    const trimmed = editingText.trim();
    if (!trimmed) {
      alert('評估指標內容不能為空！');
      return;
    }

    if (!currentArea) return;

    const oldName = currentArea.items[index];
    if (oldName === trimmed) {
      setEditingIndex(null);
      return;
    }

    // Check duplicate in same area
    if (currentArea.items.some((item, i) => i !== index && item === trimmed)) {
      alert(`此區已存在相同名稱的指標項目：「${trimmed}」！`);
      return;
    }

    updateAreas((prev) =>
      prev.map((area) => {
        if (area.id !== currentArea.id) return area;
        const newItems = [...area.items];
        newItems[index] = trimmed;
        return { ...area, items: newItems };
      })
    );

    if (onItemRenamed) {
      onItemRenamed(currentArea.id, oldName, trimmed);
    }

    setEditingIndex(null);
    showToast(`已成功修改指標為：「${trimmed}」`);
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingText('');
  };

  // Add new item
  const handleAddNewItem = () => {
    const trimmed = newItemText.trim();
    if (!trimmed) {
      alert('請輸入新的指標項目名稱！');
      return;
    }

    if (!currentArea) return;

    if (currentArea.items.includes(trimmed)) {
      alert(`此區已包含「${trimmed}」指標！`);
      return;
    }

    updateAreas((prev) =>
      prev.map((area) => {
        if (area.id !== currentArea.id) return area;
        return { ...area, items: [...area.items, trimmed] };
      })
    );

    setNewItemText('');
    showToast(`已成功於【${currentArea.name}】新增：「${trimmed}」`);
  };

  // Delete item
  const handleDeleteItem = (index: number) => {
    if (!currentArea) return;
    const itemToDelete = currentArea.items[index];
    if (!window.confirm(`確定要刪除【${currentArea.name}】中的「${itemToDelete}」指標嗎？`)) {
      return;
    }

    updateAreas((prev) =>
      prev.map((area) => {
        if (area.id !== currentArea.id) return area;
        const newItems = area.items.filter((_, i) => i !== index);
        return { ...area, items: newItems };
      })
    );

    if (editingIndex === index) {
      setEditingIndex(null);
    }

    showToast(`已刪除指標：「${itemToDelete}」`);
  };

  // Move item up
  const handleMoveUp = (index: number) => {
    if (!currentArea || index === 0) return;
    updateAreas((prev) =>
      prev.map((area) => {
        if (area.id !== currentArea.id) return area;
        const newItems = [...area.items];
        const temp = newItems[index - 1];
        newItems[index - 1] = newItems[index];
        newItems[index] = temp;
        return { ...area, items: newItems };
      })
    );
  };

  // Move item down
  const handleMoveDown = (index: number) => {
    if (!currentArea || index === currentArea.items.length - 1) return;
    updateAreas((prev) =>
      prev.map((area) => {
        if (area.id !== currentArea.id) return area;
        const newItems = [...area.items];
        const temp = newItems[index + 1];
        newItems[index + 1] = newItems[index];
        newItems[index] = temp;
        return { ...area, items: newItems };
      })
    );
  };

  // Save edited area name
  const handleSaveAreaName = () => {
    const trimmed = editingAreaName.trim();
    if (!trimmed) {
      alert('角落名稱不能為空！');
      return;
    }
    updateAreas((prev) =>
      prev.map((area) => (area.id === currentArea.id ? { ...area, name: trimmed } : area))
    );
    setIsEditingAreaName(false);
    showToast(`角落名稱已更新為：「${trimmed}」`);
  };

  // Reset to default 8 areas & 48 items
  const handleResetToDefault = () => {
    if (
      window.confirm(
        '⚠️ 確定要將 8 大角落及所有學習指標恢復為系統預設值嗎？\n（您自行新增或修改的指標將被重設）'
      )
    ) {
      const defaultAreas = resetStoredCornerAreas();
      if (setCornerAreas) {
        setCornerAreas(defaultAreas);
      }
      if (onSave) {
        onSave(defaultAreas);
      }
      showToast('已恢復為系統預設 8 大區指標！');
    }
  };

  const totalItemsCount = activeAreas.reduce((sum, a) => sum + a.items.length, 0);

  return (
    <div
      id="corner-areas-manager-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="corner-areas-manager-modal"
        className="bg-[#FFFDF6] border-4 border-[#5D4037] rounded-3xl shadow-[8px_8px_0px_#5D4037] w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Modal Top Header */}
        <div className="bg-[#FFE082] px-4 sm:px-6 py-3.5 border-b-4 border-[#5D4037] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF8E1] border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] flex items-center justify-center text-[#5D4037]">
              <Edit2 className="w-5 h-5 text-[#E65100]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#5D4037] flex items-center gap-2">
                角落學習紀錄 8 大區評估指標管理
                <span className="text-xs bg-[#5D4037] text-white px-2.5 py-0.5 rounded-full font-bold">
                  共 {cornerAreas.length} 區 / {totalItemsCount} 項指標
                </span>
              </h2>
              <p className="text-xs text-[#5D4037]/80 font-bold hidden sm:block">
                動態新增、編輯修改、刪除與重新排序各區的學習指標，設定即時同步至表單與報表
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="reset-corner-areas-btn"
              onClick={handleResetToDefault}
              title="一鍵恢復為預設 8 大區指標"
              className="px-3 py-1.5 rounded-xl border-2 border-[#5D4037] bg-white hover:bg-rose-50 text-[#C62828] text-xs font-black shadow-[2px_2px_0px_#5D4037] active:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">恢復預設</span>
            </button>
            <button
              id="close-corner-areas-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded-xl border-2 border-[#5D4037] bg-white hover:bg-rose-100 text-[#5D4037] shadow-[2px_2px_0px_#5D4037] active:translate-y-0.5 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-[#E8F5E9] border-b-2 border-[#2E7D32] px-4 py-2 text-xs font-black text-[#2E7D32] flex items-center justify-between gap-2 shrink-0 animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-[#2E7D32] hover:opacity-75"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Main Content: Split View on Tablets+ */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Column: Corner Areas List / Tabs */}
          <div className="w-full md:w-64 bg-[#FFF9E6] border-b-4 md:border-b-0 md:border-r-4 border-[#5D4037] p-3 overflow-y-auto shrink-0 space-y-1.5">
            <div className="text-[11px] font-black text-[#5D4037]/75 uppercase px-2 mb-1 tracking-wider">
              選擇要管理的角落區域
            </div>
            {activeAreas.map((area) => {
              const isSelected = area.id === selectedAreaId;
              return (
                <button
                  key={area.id}
                  id={`select-area-${area.id}-btn`}
                  onClick={() => {
                    setSelectedAreaId(area.id);
                    setEditingIndex(null);
                    setIsEditingAreaName(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-2xl border-2 transition-all flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-[#FFE082] border-[#5D4037] shadow-[3px_3px_0px_#5D4037] translate-x-0.5'
                      : 'bg-white border-[#5D4037]/40 hover:border-[#5D4037] hover:bg-[#FFFDE7]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`p-1.5 rounded-xl border border-[#5D4037] shrink-0 ${
                        isSelected ? 'bg-white text-[#5D4037]' : 'bg-[#FFF8E1] text-[#5D4037]'
                      }`}
                    >
                      {ICON_MAP[area.iconName] || <LayersIconFallback />}
                    </div>
                    <div className="truncate">
                      <span className="font-black text-xs text-[#5D4037] block truncate">
                        {area.name}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-black px-2 py-0.5 rounded-full border shrink-0 ${
                      isSelected
                        ? 'bg-[#5D4037] text-white border-[#5D4037]'
                        : 'bg-[#FFF3E0] text-[#E65100] border-[#E65100]/40'
                    }`}
                  >
                    {area.items.length} 項
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Column: Items of Selected Corner Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white flex flex-col">
            {currentArea ? (
              <div className="space-y-5">
                {/* Area Title Card */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FFF8E1] border-3 border-[#5D4037] shadow-[3px_3px_0px_#5D4037] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-[#FFE082] border-2 border-[#5D4037] text-[#5D4037]">
                      {ICON_MAP[currentArea.iconName] || <LayersIconFallback />}
                    </div>
                    <div>
                      {isEditingAreaName ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingAreaName}
                            onChange={(e) => setEditingAreaName(e.target.value)}
                            className="bg-white border-2 border-[#5D4037] rounded-xl px-2.5 py-1 text-sm font-black text-[#5D4037] focus:outline-none"
                            placeholder="角落區域名稱"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveAreaName();
                              if (e.key === 'Escape') setIsEditingAreaName(false);
                            }}
                          />
                          <button
                            onClick={handleSaveAreaName}
                            className="p-1.5 bg-[#4CAF50] text-white rounded-xl border-2 border-[#5D4037] shadow-[1px_1px_0px_#5D4037] hover:bg-[#43A047]"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setIsEditingAreaName(false)}
                            className="p-1.5 bg-gray-200 text-[#5D4037] rounded-xl border-2 border-[#5D4037] shadow-[1px_1px_0px_#5D4037] hover:bg-gray-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-black text-[#5D4037]">
                            {currentArea.name}
                          </h3>
                          <button
                            onClick={() => {
                              setEditingAreaName(currentArea.name);
                              setIsEditingAreaName(true);
                            }}
                            title="修改區域名稱"
                            className="p-1 rounded-lg border border-[#5D4037]/30 hover:border-[#5D4037] hover:bg-white text-[#5D4037]/70 hover:text-[#5D4037] transition-all cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <p className="text-xs text-[#5D4037]/75 font-bold mt-0.5">
                        目前已設定 <strong className="text-[#E65100] font-black">{currentArea.items.length}</strong> 個學習觀察評估指標
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-[#5D4037]/70 font-bold bg-white px-3 py-1.5 rounded-xl border-2 border-[#5D4037]/30 self-start sm:self-auto">
                    區域代碼：<code className="font-mono font-black text-[#5D4037]">{currentArea.id}</code>
                  </div>
                </div>

                {/* Add New Item Box */}
                <div className="p-3.5 rounded-2xl bg-[#F1F8E9] border-2 border-[#33691E] shadow-[2px_2px_0px_#33691E]">
                  <label className="block text-xs font-black text-[#2E7D32] mb-1.5 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-[#2E7D32]" />
                    為【{currentArea.name}】新增評估指標：
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="new-corner-item-input"
                      type="text"
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      placeholder="輸入新指標名稱（例如：主動嘗試新挑戰、能與同伴協商合作...）"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddNewItem();
                        }
                      }}
                      className="flex-1 bg-white border-2 border-[#5D4037] rounded-xl px-3 py-2 text-xs font-bold text-[#5D4037] focus:outline-none shadow-[2px_2px_0px_#5D4037] placeholder:text-[#5D4037]/40"
                    />
                    <button
                      id="submit-new-corner-item-btn"
                      onClick={handleAddNewItem}
                      className="px-4 py-2 bg-[#4CAF50] hover:bg-[#43A047] text-white text-xs font-black rounded-xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] active:scale-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      新增指標
                    </button>
                  </div>
                </div>

                {/* Items List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-[#5D4037] flex items-center gap-1.5">
                      評估指標清單（可點擊鉛筆修改文字、上下箭頭排序、垃圾桶刪除）：
                    </span>
                    <span className="text-[11px] text-[#5D4037]/60 font-bold">
                      共 {currentArea.items.length} 項
                    </span>
                  </div>

                  {currentArea.items.length === 0 ? (
                    <div className="p-8 text-center bg-[#FFFBF0] border-2 border-dashed border-[#5D4037]/40 rounded-2xl">
                      <AlertCircle className="w-8 h-8 text-[#FFA000] mx-auto mb-2" />
                      <p className="text-xs font-black text-[#5D4037]">
                        目前本區尚未有任何指標項目！
                      </p>
                      <p className="text-[11px] text-[#5D4037]/70 font-bold mt-1">
                        請使用上方輸入框新增第一個評估指標。
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {currentArea.items.map((item, index) => {
                        const isEditingThis = editingIndex === index;
                        return (
                          <div
                            key={`${currentArea.id}-${index}`}
                            className={`p-2.5 rounded-2xl border-2 transition-all flex items-center justify-between gap-2.5 ${
                              isEditingThis
                                ? 'bg-[#FFF9C4] border-[#F57F17] shadow-[3px_3px_0px_#F57F17]'
                                : 'bg-[#FFFDF6] border-[#5D4037] shadow-[2px_2px_0px_#5D4037] hover:bg-[#FFFBF0]'
                            }`}
                          >
                            {/* Left: Index badge + Name / Input */}
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <span className="w-6 h-6 rounded-full bg-[#FFE082] border border-[#5D4037] text-[11px] font-black text-[#5D4037] flex items-center justify-center shrink-0">
                                {index + 1}
                              </span>

                              {isEditingThis ? (
                                <div className="flex-1 flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={editingText}
                                    onChange={(e) => setEditingText(e.target.value)}
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveEditItem(index);
                                      if (e.key === 'Escape') handleCancelEdit();
                                    }}
                                    className="w-full bg-white border-2 border-[#5D4037] rounded-xl px-2.5 py-1 text-xs font-bold text-[#5D4037] focus:outline-none"
                                    placeholder="輸入指標內容..."
                                  />
                                </div>
                              ) : (
                                <span className="font-bold text-xs text-[#5D4037] leading-tight break-words flex-1">
                                  {item}
                                </span>
                              )}
                            </div>

                            {/* Right: Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                              {isEditingThis ? (
                                <>
                                  <button
                                    onClick={() => handleSaveEditItem(index)}
                                    title="儲存修改"
                                    className="p-1.5 bg-[#4CAF50] hover:bg-[#43A047] text-white rounded-xl border border-[#5D4037] shadow-[1px_1px_0px_#5D4037] cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    title="取消"
                                    className="p-1.5 bg-gray-200 hover:bg-gray-300 text-[#5D4037] rounded-xl border border-[#5D4037] shadow-[1px_1px_0px_#5D4037] cursor-pointer"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  {/* Move Up */}
                                  <button
                                    disabled={index === 0}
                                    onClick={() => handleMoveUp(index)}
                                    title="上移"
                                    className={`p-1.5 rounded-lg border border-[#5D4037]/30 transition-all ${
                                      index === 0
                                        ? 'opacity-30 cursor-not-allowed bg-gray-100 text-gray-400'
                                        : 'bg-white hover:bg-[#FFE082] text-[#5D4037] cursor-pointer hover:border-[#5D4037]'
                                    }`}
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>

                                  {/* Move Down */}
                                  <button
                                    disabled={index === currentArea.items.length - 1}
                                    onClick={() => handleMoveDown(index)}
                                    title="下移"
                                    className={`p-1.5 rounded-lg border border-[#5D4037]/30 transition-all ${
                                      index === currentArea.items.length - 1
                                        ? 'opacity-30 cursor-not-allowed bg-gray-100 text-gray-400'
                                        : 'bg-white hover:bg-[#FFE082] text-[#5D4037] cursor-pointer hover:border-[#5D4037]'
                                    }`}
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>

                                  {/* Edit Button */}
                                  <button
                                    onClick={() => handleStartEditItem(index, item)}
                                    title="編輯此指標"
                                    className="p-1.5 rounded-xl border border-[#5D4037] bg-white hover:bg-[#E1F5FE] text-[#0288D1] shadow-[1px_1px_0px_#5D4037] active:translate-y-0.5 transition-all cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Delete Button */}
                                  <button
                                    onClick={() => handleDeleteItem(index)}
                                    title="刪除此指標"
                                    className="p-1.5 rounded-xl border border-[#5D4037] bg-white hover:bg-rose-100 text-[#C62828] shadow-[1px_1px_0px_#5D4037] active:translate-y-0.5 transition-all cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-10 text-center text-[#5D4037]/60 font-bold">
                請由左側選擇一個角落區域進行管理
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="bg-[#FFF8E1] px-4 sm:px-6 py-3 border-t-4 border-[#5D4037] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-[#5D4037]/80 font-bold">
            <HelpCircle className="w-4 h-4 text-[#FF8A65]" />
            <span>修改後會自動儲存並同步至角落觀察紀錄表單與學習報告圖表中。</span>
          </div>

          <button
            id="close-corner-areas-modal-footer-btn"
            onClick={onClose}
            className="px-6 py-2 rounded-full border-2 border-[#5D4037] bg-[#FF8A65] hover:bg-[#FF7043] text-white font-black text-xs shadow-[2px_2px_0px_#5D4037] active:translate-y-0.5 transition-all cursor-pointer ml-auto"
          >
            完成並關閉設定
          </button>
        </div>
      </div>
    </div>
  );
};

const LayersIconFallback: React.FC = () => (
  <div className="w-5 h-5 flex items-center justify-center font-black text-xs">
    ★
  </div>
);
