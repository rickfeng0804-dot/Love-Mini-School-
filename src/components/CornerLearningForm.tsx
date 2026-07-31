import React, { useState } from 'react';
import { Student, LearningRecord, CornerAreaId, SheetConfig } from '../types';
import { CORNER_AREAS, JAPANESE_STAMPS } from '../data/initialData';
import { DrawingCanvas } from './DrawingCanvas';
import { syncAllToSheet, syncToWebApp, DEFAULT_WEB_APP_URL } from '../lib/googleSheets';
import { getAccessToken } from '../lib/firebase';
import confetti from 'canvas-confetti';
import { 
  BookOpen, 
  Palette, 
  Scissors, 
  Grid, 
  Search, 
  Brain, 
  Puzzle, 
  Box, 
  Sparkles, 
  Save, 
  Camera, 
  Check, 
  Award, 
  Calendar, 
  UserCheck,
  Video,
  Plus
} from 'lucide-react';

interface CornerLearningFormProps {
  students: Student[];
  learningRecords: LearningRecord[];
  setLearningRecords: React.Dispatch<React.SetStateAction<LearningRecord[]>>;
  sheetConfig: SheetConfig;
  onSavedRecord: (recordId: string) => void;
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

const SAMPLE_ACTIVITY_PHOTOS = [
  'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1587691592099-24045742c181?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560785496-3c9d22f773cd?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600&auto=format&fit=crop&q=80',
];

export const CornerLearningForm: React.FC<CornerLearningFormProps> = ({
  students,
  learningRecords,
  setLearningRecords,
  sheetConfig,
  onSavedRecord,
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || 'stu-01');
  const [dateStart, setDateStart] = useState<string>('2026-07-27');
  const [dateEnd, setDateEnd] = useState<string>('2026-07-31');

  // Selected Checkboxes per corner area
  const [checkedItems, setCheckedItems] = useState<Record<CornerAreaId, string[]>>({
    language: ['聽覺專注與理解能力', '口語表達與溝通能力'],
    watercolor: ['手眼協調', '美感與藝術創造'],
    art: ['精細動作與手眼協調', '創造力與想像力'],
    beads: ['精細動作與手眼協調', '持續性專注力'],
    science: ['感官觀察與感知能力', '探究與實驗操作能力'],
    brain: ['認知與邏輯思維能力'],
    puzzle: ['手眼協調能力', '視覺辨識能力'],
    blocks: ['團隊合作', '想像力與創造力'],
  });

  // Custom Notes per corner area
  const [customNotes, setCustomNotes] = useState<Record<CornerAreaId, string>>({
    language: '',
    watercolor: '',
    art: '',
    beads: '',
    science: '',
    brain: '',
    puzzle: '',
    blocks: '',
  });

  const [drawingImage, setDrawingImage] = useState<string>('');
  const [photoImages, setPhotoImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=600&auto=format&fit=crop&q=80',
  ]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [videoInput, setVideoInput] = useState<string>('');
  const [teacherComment, setTeacherComment] = useState<string>(
    '孩子在本週角落學習時間表現積極主動，在美勞創作與積木建造中展示出色的專注力與合作精神！'
  );
  const [stamp, setStamp] = useState<string>('たいへんよくできました');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0];

  const handleToggleCheck = (areaId: CornerAreaId, item: string) => {
    setCheckedItems((prev) => {
      const currentList = prev[areaId] || [];
      const isExist = currentList.includes(item);
      const updated = isExist
        ? currentList.filter((i) => i !== item)
        : [...currentList, item];
      return { ...prev, [areaId]: updated };
    });
  };

  const handleCustomNoteChange = (areaId: CornerAreaId, text: string) => {
    setCustomNotes((prev) => ({ ...prev, [areaId]: text }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPhotoImages((prev) => [...prev, event.target!.result as string]);
      }
    };
    reader.readAsDataURL(files[0]);
  };

  const handleSubmitRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setIsSaving(true);

    const newRecord: LearningRecord = {
      id: `rec-${Date.now()}`,
      dateStart,
      dateEnd,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      className: selectedStudent.className,
      seatNumber: selectedStudent.seatNumber,
      checkedItems,
      customNotes,
      drawingImage,
      photoImages,
      videoUrls,
      teacherComment,
      stamp,
      createdAt: new Date().toISOString(),
    };

    const updatedRecords = [newRecord, ...learningRecords];
    setLearningRecords(updatedRecords);

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFB7C5', '#FFD23F', '#3B9EFF', '#4EAE63', '#9B51E0'],
      });
    } catch {}

    // Auto-sync to Web App URL
    const webAppTarget = sheetConfig.webAppUrl || DEFAULT_WEB_APP_URL;
    if (webAppTarget) {
      try {
        await syncToWebApp(webAppTarget, students, updatedRecords, []);
      } catch (err) {
        console.error('Corner record Web App sync failed:', err);
      }
    }

    // Auto-sync to Google Sheet if connected via OAuth API
    if (sheetConfig.isConnected && sheetConfig.spreadsheetId) {
      try {
        const token = getAccessToken();
        if (token) {
          await syncAllToSheet(token, sheetConfig.spreadsheetId, students, updatedRecords, []);
        }
      } catch (err) {
        console.error('Auto sync to sheet failed:', err);
      }
    }

    setIsSaving(false);
    onSavedRecord(newRecord.id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Form Title Banner */}
      <div className="bg-[#FFFDE7] border-4 border-[#5D4037] rounded-[2rem] p-6 shadow-[8px_8px_0px_#FFD54F] mb-6 relative overflow-hidden">
        <div className="absolute top-2 right-4 text-6xl opacity-15 pointer-events-none select-none">
          🌸🧸⭐
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-[#5D4037] text-white font-black text-xs px-3 py-1 rounded-full shadow-xs">
                桃園市私立 愛愛幼兒園
              </span>
              <span className="bg-[#FF8A65] text-white border-2 border-[#5D4037] font-black text-xs px-3 py-1 rounded-full shadow-[2px_2px_0px_#5D4037]">
                大班角落學習區記錄表
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-[#5D4037] flex items-center gap-2 italic">
              觀察紀錄填寫表單
              <Sparkles className="w-6 h-6 text-[#FFB74D] animate-spin" />
            </h2>
            <p className="text-xs text-[#5D4037]/80 font-bold mt-1">
              勾選幼兒在 8 大角落區的學習表現，系統將自動匯出可愛日式繪本風學習歷程報告。
            </p>
          </div>

          {/* Student & Date Picker Selector Card */}
          <div className="bg-white p-4 rounded-2xl border-2 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] w-full md:w-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-black text-[#5D4037]">
              <div>
                <label className="block text-[#5D4037] mb-1 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-[#FF8A65]" /> 選擇學生:
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full bg-[#FFFBF0] border-2 border-[#5D4037] rounded-xl px-3 py-1.5 font-bold text-[#5D4037] focus:outline-none shadow-[2px_2px_0px_#5D4037]"
                >
                  {students.map((stu) => (
                    <option key={stu.id} value={stu.id}>
                      {stu.className} - {stu.seatNumber}號 {stu.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#5D4037] mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#FF8A65]" /> 紀錄週次區間:
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={dateStart}
                    onChange={(e) => setDateStart(e.target.value)}
                    className="bg-[#FFFBF0] border-2 border-[#5D4037] rounded-xl px-2 py-1 text-xs w-full shadow-[2px_2px_0px_#5D4037]"
                  />
                  <span>-</span>
                  <input
                    type="date"
                    value={dateEnd}
                    onChange={(e) => setDateEnd(e.target.value)}
                    className="bg-[#FFFBF0] border-2 border-[#5D4037] rounded-xl px-2 py-1 text-xs w-full shadow-[2px_2px_0px_#5D4037]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmitRecord} className="space-y-6">
        {/* 8 Corner Learning Areas Grid (2 Columns on Medium Screens) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {CORNER_AREAS.map((area) => {
            const selectedList = checkedItems[area.id] || [];
            return (
              <div
                key={area.id}
                className="border-2 border-[#5D4037] rounded-3xl p-4 transition-all bg-white shadow-[4px_4px_0px_#5D4037] hover:shadow-[6px_6px_0px_#5D4037] flex flex-col justify-between"
              >
                <div>
                  {/* Card Title */}
                  <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-dashed border-[#5D4037]/30">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-2xl bg-[#FFE082] border border-[#5D4037] text-[#5D4037]">
                        {ICON_MAP[area.iconName]}
                      </div>
                      <div>
                        <h3 className="font-black text-base text-[#5D4037]">{area.name}</h3>
                        <span className="text-[10px] font-bold text-[#5D4037]/70 block -mt-0.5">{area.jpName}</span>
                      </div>
                    </div>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-[#FFF9C4] border border-[#5D4037] text-[#5D4037]">
                      {selectedList.length} 項
                    </span>
                  </div>

                  {/* Checklist Options */}
                  <div className="space-y-2 mb-3">
                    {area.items.map((item) => {
                      const isChecked = selectedList.includes(item);
                      return (
                        <label
                          key={item}
                          className={`flex items-start gap-2 text-xs font-bold p-2 rounded-xl cursor-pointer transition-all border border-transparent ${
                            isChecked
                              ? 'bg-[#E1F5FE] border-[#5D4037] text-[#5D4037] shadow-[2px_2px_0px_#5D4037]'
                              : 'text-[#5D4037]/80 hover:bg-[#FFFBF0]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleCheck(area.id, item)}
                            className="mt-0.5 w-4 h-4 rounded-md text-[#FF8A65] focus:ring-[#FF8A65] border-2 border-[#5D4037]"
                          />
                          <span className="leading-tight">{item}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Line Field ______ */}
                <div className="mt-2 pt-2 border-t-2 border-dashed border-[#5D4037]/30">
                  <label className="block text-[11px] font-black text-[#5D4037] mb-1">
                    □ 自訂觀察補充 (______):
                  </label>
                  <input
                    type="text"
                    placeholder="如: 在此區域表現出色..."
                    value={customNotes[area.id] || ''}
                    onChange={(e) => handleCustomNoteChange(area.id, e.target.value)}
                    className="w-full bg-[#FFFBF0] border-2 border-[#5D4037] rounded-xl px-2.5 py-1 text-xs text-[#5D4037] font-bold focus:outline-none shadow-[2px_2px_0px_#5D4037]"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Drawing & Photo Record Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ✋ 繪圖紀錄 Canvas */}
          <DrawingCanvas
            initialImage={drawingImage}
            onSave={(imgData) => setDrawingImage(imgData)}
          />

          {/* 📷 影像紀錄 Photo Box */}
          <div className="bg-[#E1F5FE] border-4 border-[#5D4037] rounded-[2rem] p-5 shadow-[6px_6px_0px_#81D4FA] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📷</span>
                  <h4 className="font-black text-[#5D4037] text-sm md:text-base italic">
                    影像紀錄 (作品/活動照片)
                  </h4>
                </div>
                <label className="cursor-pointer bg-[#FF8A65] hover:bg-[#FF7043] text-white font-black text-xs px-3.5 py-1.5 rounded-full border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] flex items-center gap-1 transition-all">
                  <Camera className="w-3.5 h-3.5" /> 上傳照片
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </div>

              {/* Photo Gallery Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                {photoImages.map((imgUrl, idx) => (
                  <div key={idx} className="relative group aspect-4/3 rounded-2xl overflow-hidden border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037] bg-white">
                    <img src={imgUrl} alt="活動照片" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotoImages(photoImages.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 bg-[#FF5252] border border-[#5D4037] text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-black"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Preset Sample Photos Picker */}
              <div className="bg-white p-3 rounded-2xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037]">
                <p className="text-[11px] font-black text-[#5D4037] mb-1.5">或快速選用活動情境照片樣板：</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {SAMPLE_ACTIVITY_PHOTOS.map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        if (!photoImages.includes(url)) {
                          setPhotoImages([...photoImages, url]);
                        }
                      }}
                      className="w-14 h-10 rounded-xl overflow-hidden border-2 border-[#5D4037] shrink-0 hover:scale-105 transition-transform shadow-[1px_1px_0px_#5D4037]"
                    >
                      <img src={url} alt="樣板" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Video URL Link Input Section */}
              <div className="bg-white p-3 rounded-2xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] mt-2.5">
                <label className="block text-[11px] font-black text-[#5D4037] mb-1 flex items-center gap-1">
                  <Video className="w-3.5 h-3.5 text-[#0288D1]" /> 🎥 新增活動影片 URL (YouTube / Google Drive 連結):
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://..."
                    value={videoInput}
                    onChange={(e) => setVideoInput(e.target.value)}
                    className="flex-1 bg-[#FFFBF0] border border-[#5D4037] rounded-xl px-2.5 py-1 text-xs text-[#5D4037] font-bold focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (videoInput.trim()) {
                        setVideoUrls([...videoUrls, videoInput.trim()]);
                        setVideoInput('');
                      }
                    }}
                    className="bg-[#81D4FA] hover:bg-[#4FC3F7] text-[#01579B] font-black text-xs px-3 py-1 rounded-xl border border-[#5D4037] flex items-center gap-1 shadow-[1px_1px_0px_#5D4037]"
                  >
                    <Plus className="w-3 h-3" /> 新增
                  </button>
                </div>
                {videoUrls.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {videoUrls.map((vUrl, vIdx) => (
                      <div key={vIdx} className="flex items-center justify-between bg-[#E1F5FE] p-1.5 rounded-lg border border-[#5D4037] text-[10px] font-bold text-[#01579B]">
                        <span className="truncate max-w-[200px]">🎬 {vUrl}</span>
                        <button
                          type="button"
                          onClick={() => setVideoUrls(videoUrls.filter((_, i) => i !== vIdx))}
                          className="text-[#FF5252] font-black hover:underline px-1"
                        >
                          刪除
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <p className="text-[11px] text-[#5D4037] font-bold mt-2">
              💡 影像與影片紀錄將會自動儲存 URL 網址，未來可一鍵匯出 CSV 至 Google Sheet！
            </p>
          </div>
        </div>

        {/* Teacher Comment & Japanese Stamp */}
        <div className="bg-[#FFF3E0] border-4 border-[#5D4037] rounded-[2rem] p-5 shadow-[6px_6px_0px_#FFCCBC] space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Comment Area */}
            <div className="md:col-span-2">
              <label className="block font-black text-[#5D4037] text-sm mb-2 flex items-center gap-1.5 italic">
                <Sparkles className="w-4 h-4 text-[#FF8A65]" /> 老師總結評語與學習建議:
              </label>
              <textarea
                rows={3}
                value={teacherComment}
                onChange={(e) => setTeacherComment(e.target.value)}
                placeholder="寫下對孩子本週角落學習的鼓舞與觀察..."
                className="w-full bg-white border-2 border-[#5D4037] rounded-2xl p-3 text-xs text-[#5D4037] font-bold focus:outline-none shadow-[3px_3px_0px_#5D4037] font-sans"
              />
            </div>

            {/* Praise Stamp Selector */}
            <div>
              <label className="block font-black text-[#5D4037] text-sm mb-2 flex items-center gap-1.5 italic">
                <Award className="w-4 h-4 text-[#FF8A65]" /> 選擇日式可愛賞識印章:
              </label>
              <div className="space-y-1.5">
                {JAPANESE_STAMPS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStamp(s.title)}
                    className={`w-full p-2 rounded-2xl text-xs font-black border-2 border-[#5D4037] transition-all flex items-center justify-between ${
                      stamp === s.title
                        ? 'bg-[#FFD54F] text-[#5D4037] shadow-[3px_3px_0px_#5D4037] scale-102'
                        : 'bg-white text-[#5D4037] hover:bg-[#FFF8E1] shadow-[1px_1px_0px_#5D4037]'
                    }`}
                  >
                    <span>{s.title}</span>
                    <span className="text-[11px] opacity-80">{s.subtitle}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-[#FF8A65] hover:bg-[#FF7043] text-white font-black text-base py-3.5 px-8 rounded-full border-4 border-[#5D4037] shadow-[6px_6px_0px_#5D4037] hover:shadow-[3px_3px_0px_#5D4037] transition-all transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-5 h-5" />
            {isSaving ? '正在儲存並同步中...' : '儲存紀錄並產生學習歷程報告 🚀'}
          </button>
        </div>
      </form>
    </div>
  );
};
