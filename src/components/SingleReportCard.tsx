import React from 'react';
import { Student, LearningRecord, CornerAreaDef, getStudentGrade } from '../types';
import { CORNER_AREAS } from '../data/initialData';
import { Video, ExternalLink } from 'lucide-react';

export interface SingleReportCardProps {
  record: LearningRecord;
  students?: Student[];
  isBatch?: boolean;
  fontSize?: number;
  grayscale?: boolean;
  cornerAreas?: CornerAreaDef[];
}

export const SingleReportCard: React.FC<SingleReportCardProps> = ({ 
  record, 
  students, 
  isBatch = false,
  fontSize = 18,
  grayscale = false,
  cornerAreas,
}) => {
  if (!record) return null;
  const matchingStudent = students?.find((s) => s.id === record.studentId || s.name === record.studentName);
  const avatarToDisplay = matchingStudent?.avatarUrl;

  const areas = cornerAreas && cornerAreas.length > 0 ? cornerAreas : CORNER_AREAS;

  const headerTitleSize = Math.max(20, Math.round(fontSize * 1.35));
  const subTitleSize = Math.max(12, Math.round(fontSize * 0.8));
  const infoBarSize = Math.max(13, Math.round(fontSize * 0.95));
  const cornerHeaderSize = Math.max(13, Math.round(fontSize * 1.05));
  const cornerItemSize = Math.max(12, Math.round(fontSize * 0.95));
  const cornerNoteSize = Math.max(11, Math.round(fontSize * 0.85));
  const commentTitleSize = Math.max(13, Math.round(fontSize * 1.05));
  const commentTextSize = Math.max(13, Math.round(fontSize * 1.0));
  const footerSize = Math.max(11, Math.round(fontSize * 0.8));

  return (
    <div 
      style={{ fontSize: `${fontSize}px` }}
      className={`relative bg-[#FFFBF0] border-4 border-[#5D4037] p-6 md:p-8 rounded-[2rem] shadow-[10px_10px_0px_#5D4037] max-w-[1000px] mx-auto text-[#5D4037] font-sans print:shadow-none print:border-4 print:border-[#5D4037] print:p-6 print:bg-white transition-all ${
        grayscale ? 'grayscale contrast-125 bg-white text-black border-black shadow-[6px_6px_0px_#333]' : ''
      } ${isBatch ? 'a4-page-break' : ''}`}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between border-b-4 border-[#5D4037] pb-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 border-2 border-[#5D4037] bg-[#FFD54F] rounded-full flex items-center justify-center font-black text-xs p-1 text-center shadow-[2px_2px_0px_#5D4037] print:shadow-none">
            LOVE
          </div>
          <div>
            <span style={{ fontSize: `${subTitleSize}px` }} className="block font-black text-[#5D4037]">桃園市私立</span>
            <h2 style={{ fontSize: `${headerTitleSize}px` }} className="font-black tracking-wider text-[#5D4037]">
              愛愛幼兒園 <span style={{ fontSize: `${Math.round(headerTitleSize * 0.75)}px` }} className="font-black ml-2 text-[#FF8A65]">角落學習紀錄表</span>
            </h2>
          </div>
        </div>

        <div className="text-right flex items-center gap-3">
          {avatarToDisplay && (
            <img
              src={avatarToDisplay}
              alt={record.studentName}
              className="w-12 h-12 rounded-full border-2 border-[#5D4037] object-cover shadow-[2px_2px_0px_#5D4037] print:shadow-none shrink-0"
            />
          )}
          <div>
            <h1 style={{ fontSize: `${headerTitleSize}px` }} className="font-black tracking-widest text-[#5D4037] italic">
              我的學習紀錄
            </h1>
            <span style={{ fontSize: `${subTitleSize}px` }} className="text-[#5D4037]/75 font-mono font-bold block">幼兒成長觀察記錄</span>
          </div>
        </div>
      </div>

      {/* Student Info Bar */}
      <div style={{ fontSize: `${infoBarSize}px` }} className="flex flex-wrap items-center justify-between font-black border-b-2 border-[#5D4037] pb-2 mb-3">
        <div>
          日期：<u>{record.dateStart}</u> 至 <u>{record.dateEnd}</u>
        </div>
        {matchingStudent && (
          <div>
            年級：<u>{matchingStudent.grade || getStudentGrade(matchingStudent)}</u>
          </div>
        )}
        <div>
          班級：<u>{record.className}</u>
        </div>
        <div>
          座號：<u>{record.seatNumber}</u> 號
        </div>
        <div>
          姓名：<u>{record.studentName}</u>
        </div>
      </div>

      {/* Dynamic Corner Learning Grid */}
      <div className="border-2 border-[#5D4037] mb-3 bg-white rounded-xl overflow-hidden shadow-[3px_3px_0px_#5D4037] print:shadow-none">
        <div className="grid grid-cols-4">
          {areas.map((area, idx) => {
            const checkedList = record.checkedItems?.[area.id] || [];
            const note = record.customNotes?.[area.id] || '';
            const isLastCol = (idx + 1) % 4 === 0;
            const isLastRow = idx >= Math.floor((areas.length - 1) / 4) * 4;
            return (
              <div
                key={area.id}
                className={`p-2.5 flex flex-col justify-between ${
                  !isLastCol ? 'border-r-2 border-[#5D4037]' : ''
                } ${!isLastRow ? 'border-b-2 border-[#5D4037]' : ''}`}
              >
                <div>
                  <h4
                    style={{ fontSize: `${cornerHeaderSize}px` }}
                    className="font-black text-center border-b border-[#5D4037] pb-1 mb-1.5 bg-[#FFE082] rounded-md truncate px-1"
                  >
                    {area.name}
                  </h4>
                  <div className="space-y-1.5">
                    {area.items.map((item) => {
                      const isChecked = checkedList.includes(item);
                      return (
                        <div
                          key={item}
                          style={{ fontSize: `${cornerItemSize}px` }}
                          className="flex items-start gap-1 leading-snug"
                        >
                          <span className="font-black shrink-0">{isChecked ? '☑' : '□'}</span>
                          <span className={isChecked ? 'font-black text-[#5D4037]' : 'text-[#5D4037]/75'}>
                            {item}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {note && (
                  <div
                    style={{ fontSize: `${cornerNoteSize}px` }}
                    className="mt-1.5 pt-1.5 border-t border-dashed border-[#5D4037]/50 text-[#5D4037] font-bold"
                  >
                    □ {note}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Photo & Video Section */}
      <div className="border-2 border-[#5D4037] mb-3 bg-white rounded-xl overflow-hidden shadow-[3px_3px_0px_#5D4037] print:shadow-none p-2.5 min-h-[140px] flex flex-col">
        <h4 style={{ fontSize: `${infoBarSize}px` }} className="font-black mb-1.5 flex items-center justify-between border-b border-[#5D4037] pb-1 text-[#5D4037]">
          <span>📷 影像與 🎥 影片紀錄</span>
          {record.videoUrls && record.videoUrls.length > 0 && (
            <span style={{ fontSize: `${Math.max(11, Math.round(fontSize * 0.75))}px` }} className="bg-[#0288D1] text-white font-black px-2 py-0.5 rounded-full">
              {record.videoUrls.length} 支影片
            </span>
          )}
        </h4>
        <div className="flex-1 flex flex-col gap-2 p-2 bg-[#E1F5FE] border border-[#5D4037] rounded-xl overflow-hidden">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {record.photoImages && record.photoImages.length > 0 ? (
              record.photoImages.map((img, i) => (
                <div key={i} className="aspect-4/3 rounded-lg overflow-hidden border border-[#5D4037] bg-white">
                  <img src={img} alt="活動紀錄" className="w-full h-full object-cover" />
                </div>
              ))
            ) : (
              <div style={{ fontSize: `${cornerNoteSize}px` }} className="col-span-2 sm:col-span-4 text-[#5D4037]/60 flex items-center justify-center italic font-bold py-3">
                （尚無影像紀錄）
              </div>
            )}
          </div>

          {/* Video Links & Video Player */}
          {record.videoUrls && record.videoUrls.length > 0 && (
            <div className="pt-2 border-t border-dashed border-[#5D4037]/40 space-y-2">
              <p style={{ fontSize: `${cornerNoteSize}px` }} className="font-black text-[#01579B] flex items-center gap-1">
                <Video className="w-3.5 h-3.5 text-[#0288D1]" /> 活動影片紀錄：
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {record.videoUrls.map((vUrl, vI) => {
                  const isVideoFile =
                    vUrl.startsWith('data:video') ||
                    vUrl.includes('.mp4') ||
                    vUrl.includes('.mov') ||
                    vUrl.includes('.webm') ||
                    vUrl.includes('blob:');

                  if (isVideoFile) {
                    return (
                      <div key={vI} className="bg-white p-1.5 rounded-lg border border-[#5D4037]">
                        <video
                          src={vUrl}
                          controls
                          className="w-full h-32 object-cover rounded-md bg-black"
                        />
                        <span style={{ fontSize: `${cornerNoteSize}px` }} className="font-black text-[#01579B] block mt-1 truncate">
                          🎬 影片檔 #{vI + 1}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <a
                      key={vI}
                      href={vUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: `${cornerNoteSize}px` }}
                      className="flex items-center justify-between bg-white px-2 py-1.5 rounded-lg border border-[#5D4037] font-bold text-[#0288D1] hover:underline"
                    >
                      <span className="truncate max-w-[200px]">🎬 {vUrl}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 ml-1" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Teacher Review & Official Red Anime Stamp */}
      <div className="border-2 border-[#5D4037] p-3.5 rounded-2xl flex items-center justify-between gap-4 bg-[#FFF3E0] shadow-[3px_3px_0px_#5D4037] print:shadow-none">
        <div className="flex-1">
          <h4 style={{ fontSize: `${commentTitleSize}px` }} className="font-black text-[#5D4037] mb-1.5 flex items-center gap-1.5">
            📝 教師觀察總評：
          </h4>
          <p style={{ fontSize: `${commentTextSize}px` }} className="text-[#5D4037] leading-relaxed font-bold">
            {record.teacherComment || '學習態度非常良好，樂於探索與分享。'}
          </p>
        </div>

        {/* Red Ink Stamp */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 border-4 border-[#FF5252] rounded-full flex flex-col items-center justify-center p-1 text-[#FF5252] font-black transform rotate-6 shadow-[2px_2px_0px_#5D4037] print:shadow-none shrink-0 select-none bg-white/90">
          <span style={{ fontSize: `${Math.max(10, Math.round(fontSize * 0.65))}px` }} className="tracking-widest border-b-2 border-[#FF5252] pb-0.5">愛愛幼兒園</span>
          <span style={{ fontSize: `${Math.max(12, Math.round(fontSize * 0.85))}px` }} className="text-center font-black my-0.5 leading-tight">{record.stamp || '特別優秀'}</span>
          <span style={{ fontSize: `${Math.max(9, Math.round(fontSize * 0.6))}px` }} className="font-mono">{record.dateStart ? record.dateStart.substring(0, 7) : '2026.07'}</span>
        </div>
      </div>

      {/* Footer Sign-off */}
      <div style={{ fontSize: `${footerSize}px` }} className="flex justify-between items-center text-[#5D4037] mt-3.5 font-mono font-bold">
        <span>班級導師簽章：__________________</span>
        <span>園長：黃雅琦 Rachel (簽章：__________________)</span>
        <span>家長查閱簽章：__________________</span>
      </div>
    </div>
  );
};
