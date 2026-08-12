import React, { useState, useEffect } from 'react';
import { Student, LearningRecord, ContactBook, CornerAreaId, SheetConfig, ClassFilterOption } from '../types';
import { CORNER_AREAS, JAPANESE_STAMPS } from '../data/initialData';
import { syncAllToSheet, syncToWebApp, uploadPhotoToGoogleDrive, DEFAULT_WEB_APP_URL, DEFAULT_MEDIA_FOLDER_URL } from '../lib/googleSheets';
import { uploadReportToGoogleDrive } from '../lib/reportExport';
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
  User,
  Image as ImageIcon,
  Video,
  CheckCircle2,
  AlertCircle,
  Filter,
  FolderOpen,
  ExternalLink
} from 'lucide-react';

interface CornerLearningFormProps {
  students: Student[];
  learningRecords: LearningRecord[];
  setLearningRecords: React.Dispatch<React.SetStateAction<LearningRecord[]>>;
  contactBooks?: ContactBook[];
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

export const CornerLearningForm: React.FC<CornerLearningFormProps> = ({
  students,
  learningRecords,
  setLearningRecords,
  contactBooks = [],
  sheetConfig,
  onSavedRecord,
}) => {
  const [formClassFilter, setFormClassFilter] = useState<ClassFilterOption>('全部班級');
  const filteredStudents = students.filter(
    (s) => formClassFilter === '全部班級' || s.className === formClassFilter
  );

  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || 'stu-01');

  // When class filter changes, ensure selectedStudentId points to a valid student in that class
  useEffect(() => {
    if (filteredStudents.length > 0) {
      const exists = filteredStudents.some((s) => s.id === selectedStudentId);
      if (!exists) {
        setSelectedStudentId(filteredStudents[0].id);
      }
    }
  }, [formClassFilter, students]);
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

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || students[0] || {
    id: 'stu-01',
    name: '學生',
    className: '大班',
    seatNumber: 1,
    gender: 'boy',
    parentName: '',
    parentContact: '',
    notes: '',
  };

  const [photoImages, setPhotoImages] = useState<string[]>([
    '/kindergarten_campus.svg',
  ]);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [teacherComment, setTeacherComment] = useState<string>(
    '孩子在本週角落學習時間表現積極主動，在美勞創作與積木建造中展示出色的專注力與合作精神！'
  );
  const [stamp, setStamp] = useState<string>('たいへんよくできました');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

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

    (Array.from(files) as File[]).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (!result) return;

        const img = new Image();
        img.onload = async () => {
          let compressedData = result;
          try {
            const canvas = document.createElement('canvas');
            const maxWidth = 800;
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              compressedData = canvas.toDataURL('image/jpeg', 0.8);
            }
          } catch (err) {
            console.warn('Photo compression error, using original:', err);
          }

          // Set image locally for immediate display
          setPhotoImages((prev) => [...prev, compressedData]);

          // Upload to Google Drive Cloud Folder asynchronously
          const targetFolder = sheetConfig.mediaFolderUrl || DEFAULT_MEDIA_FOLDER_URL;
          const targetWebApp = sheetConfig.webAppUrl || DEFAULT_WEB_APP_URL;

          if (targetWebApp) {
            setIsUploadingPhoto(true);
            setSyncStatus({
              type: 'info',
              message: `☁️ 正在上傳照片「${file.name}」至 Google Drive 指定資料夾...`,
            });

            const studentTag = selectedStudent ? `${selectedStudent.className}_${selectedStudent.name}` : '校園紀錄';
            const fileName = `${studentTag}_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
            const uploadRes = await uploadPhotoToGoogleDrive(targetWebApp, compressedData, fileName, targetFolder);

            setIsUploadingPhoto(false);
            if (uploadRes.status === 'success') {
              setSyncStatus({
                type: 'success',
                message: `✅ 照片已成功備份至指定 Google Drive 雲端資料夾！`,
              });
              if (uploadRes.downloadUrl) {
                setPhotoImages((prev) => {
                  const copy = [...prev];
                  const idx = copy.indexOf(compressedData);
                  if (idx !== -1) {
                    copy[idx] = uploadRes.downloadUrl || compressedData;
                  }
                  return copy;
                });
              }
            } else {
              setSyncStatus({
                type: 'info',
                message: `📷 照片已儲存於本機記錄。`,
              });
            }
            setTimeout(() => setSyncStatus(null), 5000);
          }
        };
        img.onerror = () => {
          setPhotoImages((prev) => [...prev, result]);
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    (Array.from(files) as File[]).forEach((file) => {
      if (!file.type.startsWith('video/')) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        const result = event.target?.result as string;
        if (!result) return;

        const targetFolder = sheetConfig.mediaFolderUrl || DEFAULT_MEDIA_FOLDER_URL;
        const targetWebApp = sheetConfig.webAppUrl || DEFAULT_WEB_APP_URL;

        // Add local preview
        setVideoUrls((prev) => [...prev, result]);

        if (targetWebApp) {
          setIsUploadingPhoto(true);
          setSyncStatus({
            type: 'info',
            message: `☁️ 正在上傳影片「${file.name}」至 Google Drive 指定資料夾...`,
          });

          const studentTag = selectedStudent ? `${selectedStudent.className}_${selectedStudent.name}` : '校園紀錄';
          const fileName = `${studentTag}_${Date.now()}_video.mp4`;
          const uploadRes = await uploadPhotoToGoogleDrive(
            targetWebApp,
            result,
            fileName,
            targetFolder,
            file.type || 'video/mp4'
          );

          setIsUploadingPhoto(false);
          if (uploadRes.status === 'success') {
            setSyncStatus({
              type: 'success',
              message: `✅ 影片已成功備份至指定 Google Drive 雲端資料夾！`,
            });
            if (uploadRes.downloadUrl) {
              setVideoUrls((prev) => {
                const copy = [...prev];
                const idx = copy.indexOf(result);
                if (idx !== -1) {
                  copy[idx] = uploadRes.downloadUrl || result;
                }
                return copy;
              });
            }
          } else {
            setSyncStatus({
              type: 'info',
              message: `📹 影片已儲存於本機記錄。`,
            });
          }
          setTimeout(() => setSyncStatus(null), 5000);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleSubmitRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setIsSaving(true);
    setSyncStatus({ type: 'info', message: '正在儲存紀錄並上傳檔案至 Google Drive 雲端...' });

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
      drawingImage: '',
      photoImages,
      videoUrls,
      teacherComment,
      stamp,
      createdAt: new Date().toISOString(),
    };

    const updatedRecords = [newRecord, ...learningRecords];
    setLearningRecords(updatedRecords);

    try {
      localStorage.setItem('kindergarten_learning_records', JSON.stringify(updatedRecords));
    } catch (e) {}

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFB7C5', '#FFD23F', '#3B9EFF', '#4EAE63', '#9B51E0'],
      });
    } catch {}

    // Instant local save success
    setIsSaving(false);
    setSyncStatus({
      type: 'success',
      message: `🎉 已成功儲存 ${selectedStudent.name} 的紀錄！已立即產生學習歷程報告，背景同步上傳檔案至 Google Drive...`,
    });

    // Jump immediately to report view after short delay so user doesn't wait
    setTimeout(() => {
      onSavedRecord(newRecord.id);
    }, 200);

    // Asynchronous background upload of files to Google Drive & sync to Web App & Sheet
    (async () => {
      const webAppTarget = sheetConfig.webAppUrl || DEFAULT_WEB_APP_URL;
      const targetFolder = sheetConfig.mediaFolderUrl || DEFAULT_MEDIA_FOLDER_URL;

      let currentRecord = { ...newRecord };
      let recordChanged = false;

      // 1. Upload base64 photos to Google Drive
      if (webAppTarget && currentRecord.photoImages && currentRecord.photoImages.length > 0) {
        const updatedPhotos = [...currentRecord.photoImages];
        for (let i = 0; i < updatedPhotos.length; i++) {
          const imgUrl = updatedPhotos[i];
          if (imgUrl.startsWith('data:')) {
            try {
              const studentTag = `${selectedStudent.className}_${selectedStudent.name}`;
              const fileName = `${studentTag}_${Date.now()}_photo_${i + 1}.jpg`;
              const res = await uploadPhotoToGoogleDrive(webAppTarget, imgUrl, fileName, targetFolder, 'image/jpeg');
              if (res.status === 'success' && res.downloadUrl) {
                updatedPhotos[i] = res.downloadUrl;
                recordChanged = true;
              }
            } catch (err) {
              console.warn('Background photo upload error:', err);
            }
          }
        }
        currentRecord.photoImages = updatedPhotos;
      }

      // 2. Upload base64 videos to Google Drive
      if (webAppTarget && currentRecord.videoUrls && currentRecord.videoUrls.length > 0) {
        const updatedVideos = [...currentRecord.videoUrls];
        for (let i = 0; i < updatedVideos.length; i++) {
          const vidUrl = updatedVideos[i];
          if (vidUrl.startsWith('data:')) {
            try {
              const studentTag = `${selectedStudent.className}_${selectedStudent.name}`;
              const fileName = `${studentTag}_${Date.now()}_video_${i + 1}.mp4`;
              const res = await uploadPhotoToGoogleDrive(webAppTarget, vidUrl, fileName, targetFolder, 'video/mp4');
              if (res.status === 'success' && res.downloadUrl) {
                updatedVideos[i] = res.downloadUrl;
                recordChanged = true;
              }
            } catch (err) {
              console.warn('Background video upload error:', err);
            }
          }
        }
        currentRecord.videoUrls = updatedVideos;
      }

      // If files were uploaded to Drive, update local state & storage
      const finalRecords = recordChanged
        ? updatedRecords.map((r) => (r.id === currentRecord.id ? currentRecord : r))
        : updatedRecords;

      if (recordChanged) {
        setLearningRecords(finalRecords);
        try {
          localStorage.setItem('kindergarten_learning_records', JSON.stringify(finalRecords));
        } catch (e) {}
      }

      // 3. Upload generated Student Learning History Report PDF file to Google Drive
      if (webAppTarget) {
        try {
          await uploadReportToGoogleDrive(webAppTarget, currentRecord, selectedStudent, targetFolder);
        } catch (err) {
          console.warn('Background report file upload error:', err);
        }
      }

      // 4. Sync all data to Web App
      if (webAppTarget) {
        try {
          await syncToWebApp(webAppTarget, students, finalRecords, contactBooks);
        } catch (err) {
          console.warn('Corner record Web App background sync warning:', err);
        }
      }

      // 5. Sync to Google Sheets
      if (sheetConfig.isConnected && sheetConfig.spreadsheetId) {
        try {
          const token = getAccessToken();
          if (token) {
            await syncAllToSheet(token, sheetConfig.spreadsheetId, students, finalRecords, contactBooks);
          }
        } catch (err) {
          console.warn('Auto sync to sheet failed:', err);
        }
      }
    })();
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
                校園學習紀錄表
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
          <div className="bg-white p-4 rounded-2xl border-2 border-[#5D4037] shadow-[4px_4px_0px_#5D4037] w-full md:w-auto space-y-3">
            {/* Class Filter Bar */}
            <div className="flex items-center gap-2 pb-2 border-b border-[#5D4037]/20">
              <span className="flex items-center gap-1 text-xs font-black text-[#5D4037] shrink-0">
                <Filter className="w-3.5 h-3.5 text-[#FF8A65]" /> 班級篩選：
              </span>
              <select
                value={formClassFilter}
                onChange={(e) => setFormClassFilter(e.target.value as ClassFilterOption)}
                className="w-full bg-[#FFFBF0] border-2 border-[#5D4037] rounded-xl px-2.5 py-1 text-xs font-bold text-[#5D4037] focus:outline-none shadow-[2px_2px_0px_#5D4037] cursor-pointer"
              >
                <option value="全部班級">🏫 全部班級 (顯示所有人)</option>
                <option value="大班 (櫻桃班)">🌸 大班 (櫻桃班)</option>
                <option value="中班 (草莓班)">🍓 中班 (草莓班)</option>
                <option value="小班 (蘋果班)">🍎 小班 (蘋果班)</option>
                <option value="幼幼班 (葡萄班)">🍇 幼幼班 (葡萄班)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-black text-[#5D4037]">
              <div>
                <label className="block text-[#5D4037] mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-[#FF8A65]" /> 選擇觀察學生:
                  </span>
                  {selectedStudent && (
                    <span className="text-[10px] text-[#5D4037]/80 font-mono font-bold">
                      {selectedStudent.seatNumber}號 {selectedStudent.gender === 'boy' ? '👦' : '👧'}
                    </span>
                  )}
                </label>

                <div className="flex items-center gap-2">
                  {selectedStudent?.avatarUrl && (
                    <img
                      src={selectedStudent.avatarUrl}
                      alt={selectedStudent.name}
                      className="w-10 h-10 rounded-full border-2 border-[#5D4037] object-cover shrink-0 shadow-[2px_2px_0px_#5D4037]"
                    />
                  )}
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full bg-[#FFFBF0] border-2 border-[#5D4037] rounded-xl px-3 py-2 text-xs font-bold text-[#5D4037] focus:outline-none shadow-[2px_2px_0px_#5D4037] cursor-pointer"
                  >
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((stu) => (
                        <option key={stu.id} value={stu.id}>
                          {stu.className} - {stu.seatNumber}號 {stu.name}
                        </option>
                      ))
                    ) : (
                      <option value="">該班級尚無學生</option>
                    )}
                  </select>
                </div>
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
                    className="bg-[#FFFBF0] border-2 border-[#5D4037] rounded-xl px-2 py-1.5 text-xs w-full shadow-[2px_2px_0px_#5D4037]"
                  />
                  <span>-</span>
                  <input
                    type="date"
                    value={dateEnd}
                    onChange={(e) => setDateEnd(e.target.value)}
                    className="bg-[#FFFBF0] border-2 border-[#5D4037] rounded-xl px-2 py-1.5 text-xs w-full shadow-[2px_2px_0px_#5D4037]"
                  />
                </div>
              </div>
            </div>

            {/* Quick Student Photo Avatar Selection Bar */}
            <div className="pt-2 border-t border-dashed border-[#5D4037]/30">
              <div className="text-[10px] font-black text-[#5D4037] mb-1.5 flex items-center justify-between">
                <span>點擊幼兒照片點名快速選擇：</span>
                <span className="text-[9px] text-[#FF8A65]">共 {students.length} 位幼兒</span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {students.map((stu) => {
                  const isSelected = stu.id === selectedStudentId;
                  return (
                    <button
                      key={stu.id}
                      type="button"
                      onClick={() => setSelectedStudentId(stu.id)}
                      className={`shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-full border-2 border-[#5D4037] transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#FFD54F] text-[#5D4037] shadow-[2px_2px_0px_#5D4037] scale-105 font-black'
                          : 'bg-[#FFFBF0] text-[#5D4037]/80 hover:bg-white hover:scale-100 font-bold'
                      }`}
                    >
                      <img
                        src={stu.avatarUrl}
                        alt={stu.name}
                        className="w-6 h-6 rounded-full border border-[#5D4037] object-cover shrink-0"
                      />
                      <span className="text-[11px] whitespace-nowrap">{stu.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {syncStatus && (
          <div
            className={`mt-4 p-3 rounded-2xl border-2 border-[#5D4037] flex items-center gap-2.5 text-xs font-black shadow-[3px_3px_0px_#5D4037] animate-fade-in ${
              syncStatus.type === 'success'
                ? 'bg-[#E8F5E9] text-[#2E7D32]'
                : syncStatus.type === 'error'
                ? 'bg-[#FFEBEE] text-[#C62828]'
                : 'bg-[#E1F5FE] text-[#0277BD]'
            }`}
          >
            {syncStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2E7D32]" />
            ) : syncStatus.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-[#C62828]" />
            ) : (
              <Sparkles className="w-4 h-4 shrink-0 text-[#0277BD] animate-spin" />
            )}
            <span>{syncStatus.message}</span>
          </div>
        )}
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

        {/* Activity Photos & Videos Section */}
        <div className="bg-[#E1F5FE] border-4 border-[#5D4037] rounded-[2rem] p-5 shadow-[6px_6px_0px_#81D4FA] flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">📷</span>
                <div>
                  <h4 className="font-black text-[#5D4037] text-sm md:text-base italic">
                    影像與作品照片紀錄
                  </h4>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="cursor-pointer bg-[#FF8A65] hover:bg-[#FF7043] text-white font-black text-xs px-3 py-1.5 rounded-full border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] flex items-center gap-1 transition-all">
                  <Camera className="w-3.5 h-3.5" /> 上傳照片
                  <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                </label>
                <label className="cursor-pointer bg-[#7E57C2] hover:bg-[#673AB7] text-white font-black text-xs px-3 py-1.5 rounded-full border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] flex items-center gap-1 transition-all">
                  <Video className="w-3.5 h-3.5" /> 上傳影片
                  <input type="file" accept="video/*" multiple onChange={handleVideoUpload} className="hidden" />
                </label>
              </div>
            </div>

            {isUploadingPhoto && (
              <div className="bg-[#B3E5FC] text-[#01579B] p-2 rounded-xl border border-[#0288D1] text-xs font-black flex items-center gap-2 mb-3 animate-pulse">
                <Sparkles className="w-4 h-4 text-[#0288D1]" />
                <span>☁️ 正在連線同步上傳照片至指定 Google Drive 雲端資料夾...</span>
              </div>
            )}

            {/* Photo Gallery Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {photoImages.map((imgUrl, idx) => (
                <div key={idx} className="relative group aspect-4/3 rounded-2xl overflow-hidden border-2 border-[#5D4037] shadow-[3px_3px_0px_#5D4037] bg-white">
                  <img src={imgUrl} alt="活動照片" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotoImages(photoImages.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 bg-[#FF5252] border border-[#5D4037] text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-black cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Video Section */}
            <div className="bg-white p-3 rounded-2xl border-2 border-[#5D4037] shadow-[2px_2px_0px_#5D4037] mt-2.5">
              <label className="block text-[11px] font-black text-[#5D4037] mb-1 flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-[#0288D1]" /> 🎥 活動影片連結 (範例影片試用與線上連結):
              </label>

              {/* Sample Videos Quick Picker */}
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#5D4037] mb-2 flex-wrap">
                <span>或快速試用範例影片：</span>
                <button
                  type="button"
                  onClick={() => {
                    const demo = 'https://www.w3schools.com/html/mov_bbb.mp4';
                    if (!videoUrls.includes(demo)) setVideoUrls([...videoUrls, demo]);
                  }}
                  className="bg-[#FFFBF0] hover:bg-[#FFE082] px-2 py-0.5 rounded-lg border border-[#5D4037] cursor-pointer"
                >
                  + 範例影片 1 (建構創作)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const demo2 = 'https://assets.mixkit.co/videos/preview/mixkit-children-drawing-with-colored-pencils-41221-large.mp4';
                    if (!videoUrls.includes(demo2)) setVideoUrls([...videoUrls, demo2]);
                  }}
                  className="bg-[#FFFBF0] hover:bg-[#FFE082] px-2 py-0.5 rounded-lg border border-[#5D4037] cursor-pointer"
                >
                  + 範例影片 2 (美勞繪畫)
                </button>
              </div>

              {/* Video Preview List */}
              {videoUrls.length > 0 && (
                <div className="space-y-2 mt-2 border-t border-dashed border-[#5D4037]/30 pt-2">
                  <p className="text-[11px] font-black text-[#01579B]">已新增的影片 ({videoUrls.length} 部):</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {videoUrls.map((vUrl, vIdx) => {
                      const isLocalFileOrDirectMp4 =
                        vUrl.startsWith('data:video') ||
                        vUrl.includes('.mp4') ||
                        vUrl.includes('.mov') ||
                        vUrl.includes('.webm') ||
                        vUrl.includes('blob:');

                      return (
                        <div key={vIdx} className="bg-[#E1F5FE] p-2 rounded-xl border border-[#5D4037] flex flex-col justify-between relative group">
                          <button
                            type="button"
                            onClick={() => setVideoUrls(videoUrls.filter((_, i) => i !== vIdx))}
                            className="absolute top-1 right-1 bg-[#FF5252] text-white rounded-full w-5 h-5 flex items-center justify-center border border-[#5D4037] text-[10px] font-black z-10 cursor-pointer"
                            title="刪除影片"
                          >
                            ✕
                          </button>

                          {isLocalFileOrDirectMp4 ? (
                            <div>
                              <video
                                src={vUrl}
                                controls
                                className="w-full h-28 object-cover rounded-lg border border-[#5D4037] bg-black mb-1"
                              />
                              <span className="text-[10px] font-bold text-[#01579B] truncate block">
                                🎬 影片檔紀錄 #{vIdx + 1}
                              </span>
                            </div>
                          ) : (
                            <div className="p-1">
                              <span className="text-[11px] font-bold text-[#01579B] break-all block mb-1">
                                🔗 影片連結:
                              </span>
                              <a
                                href={vUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-[#0288D1] font-black underline truncate block max-w-[180px]"
                              >
                                {vUrl}
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          <p className="text-[11px] text-[#5D4037] font-bold mt-2">
            💡 影片紀錄可直接上傳檔案，未來可一鍵匯出 CSV 至 Google Sheet！
          </p>
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
            className="w-full sm:w-auto bg-[#FF8A65] hover:bg-[#FF7043] text-white font-black text-sm sm:text-base py-3.5 px-8 rounded-full border-4 border-[#5D4037] shadow-[6px_6px_0px_#5D4037] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-5 h-5" />
            {isSaving ? '正在儲存並同步中...' : '確認儲存觀察紀錄並產生報告 🚀'}
          </button>
        </div>
      </form>
    </div>
  );
};
