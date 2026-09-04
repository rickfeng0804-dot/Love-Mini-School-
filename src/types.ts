export type StandardGrade = '大班' | '中班' | '小班' | '幼幼班';
export type Grade = StandardGrade | string;
export type GradeFilterOption = '全部年級' | StandardGrade | string;

export const GRADE_OPTIONS: string[] = ['幼幼班', '小班', '中班', '大班'];
export const GRADE_FILTER_OPTIONS: GradeFilterOption[] = ['全部年級', '幼幼班', '小班', '中班', '大班'];

export type StandardClassName = '大班 (櫻桃班)' | '中班 (草莓班)' | '小班 (蘋果班)' | '幼幼班 (葡萄班)';
export type ClassName = StandardClassName | string;

export const CLASS_OPTIONS: string[] = [
  '大班 (櫻桃班)',
  '中班 (草莓班)',
  '小班 (蘋果班)',
  '幼幼班 (葡萄班)',
  '青蘋果班',
  '蜜蘋果班',
];

export type ClassFilterOption = '全部班級' | string;

export const CLASS_FILTER_OPTIONS: ClassFilterOption[] = [
  '全部班級',
  '大班 (櫻桃班)',
  '中班 (草莓班)',
  '小班 (蘋果班)',
  '幼幼班 (葡萄班)',
  '青蘋果班',
  '蜜蘋果班',
];

export interface Student {
  id: string;
  name: string;
  grade?: Grade;
  seatNumber: string;
  className: ClassName;
  gender: 'boy' | 'girl';
  avatarUrl: string;
  parentName?: string;
  parentContact?: string;
  notes?: string;
}

/**
 * Helper to get a normalized grade name for a student
 */
export function getStudentGrade(s: Partial<Student>): string {
  if (s.grade && typeof s.grade === 'string' && s.grade.trim()) {
    return s.grade.trim();
  }
  const cls = s.className || '';
  if (cls.includes('幼幼')) return '幼幼班';
  if (cls.includes('小班')) return '小班';
  if (cls.includes('中班')) return '中班';
  if (cls.includes('大班')) return '大班';
  return '未分年級';
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
  jpName?: string;
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
  stamp: string; // e.g., '特別優秀', '創意無限', '進步神速', '好棒滿分', '挑戰大師'
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
  studentWebAppUrl?: string;
  learningWebAppUrl?: string;
  contactWebAppUrl?: string;
  mediaFolderUrl?: string;
  nasStorageUrl?: string;
  isConnected: boolean;
  lastSyncedAt: string | null;
  refreshIntervalMinutes?: number; // 0 (Manual), 1, 5, 15, 30, 60
  autoRefreshEnabled?: boolean;
}
