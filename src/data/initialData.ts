import { CornerAreaDef, Student, LearningRecord, ContactBook } from '../types';

export const CORNER_AREAS: CornerAreaDef[] = [
  {
    id: 'language',
    name: '語文區',
    jpName: '',
    iconName: 'BookOpen',
    color: 'bg-rose-50 border-rose-200 text-rose-700',
    badgeColor: 'bg-rose-400 text-white',
    items: [
      '聽覺專注與理解能力',
      '口語表達與溝通能力',
      '想像力與創造力',
      '專注力',
    ],
  },
  {
    id: 'watercolor',
    name: '水彩區',
    jpName: '',
    iconName: 'Palette',
    color: 'bg-sky-50 border-sky-200 text-sky-700',
    badgeColor: 'bg-sky-400 text-white',
    items: [
      '手眼協調',
      '精細動作控制',
      '感官探索與認知能力',
      '圖像符號表達',
      '美感與藝術創造',
      '生活自理與常規建立',
      '專注力與抗挫力',
    ],
  },
  {
    id: 'art',
    name: '美勞區',
    jpName: '',
    iconName: 'Scissors',
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    badgeColor: 'bg-amber-400 text-white',
    items: [
      '精細動作與手眼協調',
      '色彩認知',
      '空間與構圖',
      '創造力與想像力',
      '認知與問題解決能力',
    ],
  },
  {
    id: 'beads',
    name: '拼豆區',
    jpName: '',
    iconName: 'Grid',
    color: 'bg-purple-50 border-purple-200 text-purple-700',
    badgeColor: 'bg-purple-400 text-white',
    items: [
      '精細動作與手眼協調',
      '視覺認知與空間概念',
      '持續性專注力',
      '挫折容忍度',
      '藝術創作與美感規劃',
      '小肌肉安全操作',
      '工作習慣與收拾能力',
    ],
  },
  {
    id: 'science',
    name: '科學區',
    jpName: '',
    iconName: 'Search',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    badgeColor: 'bg-emerald-400 text-white',
    items: [
      '感官觀察與感知能力',
      '探究與實驗操作能力',
      '解決問題能力',
      '分類、序列與邏輯思考能力',
      '測量與數量概念能力',
      '紀錄與表達交流能力',
    ],
  },
  {
    id: 'brain',
    name: '益智區',
    jpName: '',
    iconName: 'Brain',
    color: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    badgeColor: 'bg-indigo-400 text-white',
    items: [
      '認知與邏輯思維能力',
      '持續專注力',
      '挫折容忍力',
      '視知覺協調',
      '空間知覺與視覺辨識',
      '社會交往能力（輪流與分享）',
    ],
  },
  {
    id: 'puzzle',
    name: '拼圖區',
    jpName: '',
    iconName: 'Puzzle',
    color: 'bg-orange-50 border-orange-200 text-orange-700',
    badgeColor: 'bg-orange-400 text-white',
    items: [
      '手眼協調能力',
      '視覺辨識能力',
      '空間概念認知',
      '邏輯推理與分類',
      '專注力與持續力',
    ],
  },
  {
    id: 'blocks',
    name: '積木區',
    jpName: '',
    iconName: 'Box',
    color: 'bg-lime-50 border-lime-200 text-lime-700',
    badgeColor: 'bg-lime-500 text-white',
    items: [
      '認知與數理邏輯能力',
      '問題解決能力',
      '精細動作發展',
      '粗大動作協調',
      '團隊合作',
      '衝突解決',
      '語言表達與敘事能力',
      '想像力與創造力',
    ],
  },
];

export const JAPANESE_STAMPS = [
  { id: 'stamp-1', title: '特別優秀', subtitle: '表現優異 💮', color: 'text-rose-600 border-rose-500 bg-rose-50' },
  { id: 'stamp-2', title: '創意無限', subtitle: '靈感豐富 ⭐', color: 'text-amber-600 border-amber-500 bg-amber-50' },
  { id: 'stamp-3', title: '進步神速', subtitle: '努力不懈 🌸', color: 'text-emerald-600 border-emerald-500 bg-emerald-50' },
  { id: 'stamp-4', title: '好棒滿分', subtitle: '表現亮眼 💯', color: 'text-sky-600 border-sky-500 bg-sky-50' },
  { id: 'stamp-5', title: '挑戰大師', subtitle: '勇於嘗試 👑', color: 'text-purple-600 border-purple-500 bg-purple-50' },
];

export const INITIAL_STUDENTS: Student[] = [];

export const INITIAL_LEARNING_RECORDS: LearningRecord[] = [];

export const INITIAL_CONTACT_BOOKS: ContactBook[] = [];

