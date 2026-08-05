export type RoleMode = 'teacher' | 'parent';

export type ClassName = '大班 (櫻桃班)' | '中班 (草莓班)' | '小班 (蘋果班)';

export interface Student {
  id: string;
  name: string;
  seatNumber: string;
  className: ClassName;
  gender: 'boy' | 'girl';
  avatarUrl: string;
  parentName: string;
  parentContact: string;
  notes?: string;
}

export type CornerAreaId = 
  | 'language' 
  | 'watercolor' 
  | 'art' 
  | 'beads' 
  | 'science' 
  | 'brain' 
  | 'puzzle' 
  | 'blocks';

export interface CornerAreaDef {
  id: CornerAreaId;
  name: string;
  jpName: string;
  iconName: string;
  color: string; // Tailwind background color / border color accent
  badgeColor: string;
  items: string[];
}

export interface LearningRecord {
  id: string;
  dateStart: string; // e.g. 2026-07-20
  dateEnd: string;   // e.g. 2026-07-25
  studentId: string;
  studentName: string;
  className: ClassName;
  seatNumber: string;
  // Key: corner ID, Value: selected items
  checkedItems: Record<CornerAreaId, string[]>;
  // Custom text for each corner area
  customNotes: Record<CornerAreaId, string>;
  drawingImage?: string; // Data URL or URL
  photoImages: string[];  // Array of image Data URLs or URLs
  videoUrls?: string[];   // Array of video URLs (YouTube, Drive, MP4)
  teacherComment: string;
  stamp: string; // e.g., 'たいへんよくできました', '好棒章', '特別優秀', '創意無限'
  createdAt: string;
}

export interface ContactBook {
  id: string;
  date: string;
  studentId: string;
  studentName: string;
  className: ClassName;
  seatNumber: string;
  breakfast: '全部吃完' | '吃了一半' | '食慾較弱' | '未食用';
  lunch: '全部吃完' | '吃了一半' | '食慾較弱' | '未食用';
  snack: '全部吃完' | '吃了一半' | '食慾較弱' | '未食用';
  napMinutes: number; // e.g., 90
  mood: '開心熱情 🌸' | '平靜穩定 ✨' | '稍微疲倦 💤' | '情緒敏感 💧' | '活潑好動 🌟';
  temperature: string; // e.g., "36.5°C"
  healthNotes: string;
  teacherMessage: string;
  parentReply?: string;
  photoUrls?: string[]; // Array of image URLs
  videoUrls?: string[]; // Array of video URLs
  isReadByParent: boolean;
  createdAt: string;
}

export interface SheetConfig {
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  spreadsheetName: string;
  webAppUrl?: string;
  studentSheetUrl?: string; // Google Sheet URL for 學生名冊 (Default: https://docs.google.com/spreadsheets/d/1x2DkkIuh3kp3k5YLjz2S065gDKdMFSb5O4CnJrHCn84/edit?usp=sharing)
  isConnected: boolean;
  lastSyncedAt: string | null;
  refreshIntervalMinutes?: number; // 0 (Manual), 1, 5, 15, 30, 60
  autoRefreshEnabled?: boolean;
}
