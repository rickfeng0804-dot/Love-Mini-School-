/**
 * 日期處理工具函式：支援幼兒園角落學習紀錄週次（週一至週五）
 */

/**
 * 格式化日期為 YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 取得指定參考日期的「當週週一至週五」日期區間
 * @param referenceDate 基準日期，預設為當天 (new Date())
 * @returns { dateStart: string, dateEnd: string } YYYY-MM-DD 格式
 */
export function getCurrentWeekRange(referenceDate: Date = new Date()): { dateStart: string; dateEnd: string } {
  const d = new Date(referenceDate);
  const day = d.getDay(); // 0 是週日, 1 是週一, ..., 6 是週六

  // 週一至週五為標準教學週：
  // 週一(1): 0 天偏移
  // 週二(2): -1 天偏移
  // 週三(3): -2 天偏移
  // 週四(4): -3 天偏移
  // 週五(5): -4 天偏移
  // 週六(6): -5 天偏移 (屬於剛過完的週教學週期)
  // 週日(0): -6 天偏移 (週末，同屬剛過完的週教學週期)
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMonday);
  const friday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 4);

  return {
    dateStart: formatDate(monday),
    dateEnd: formatDate(friday),
  };
}

/**
 * 根據現有的週一日期，往前往後位移 N 週
 * @param currentMondayStr 目前週一字串 (YYYY-MM-DD)
 * @param weekOffset 位移週數 (例如 -1 表示上一週, +1 表示下一週)
 */
export function getShiftedWeekRange(currentMondayStr: string, weekOffset: number): { dateStart: string; dateEnd: string } {
  let baseDate: Date;
  if (currentMondayStr && currentMondayStr.includes('-')) {
    const parts = currentMondayStr.split('-').map(Number);
    baseDate = new Date(parts[0], parts[1] - 1, parts[2]);
  } else {
    baseDate = new Date();
  }

  // 往前往後增加 weekOffset * 7 天
  const newMonday = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + weekOffset * 7);
  const newFriday = new Date(newMonday.getFullYear(), newMonday.getMonth(), newMonday.getDate() + 4);

  return {
    dateStart: formatDate(newMonday),
    dateEnd: formatDate(newFriday),
  };
}
