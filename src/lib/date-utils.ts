import { toDate, formatInTimeZone } from 'date-fns-tz';
import { startOfDay, endOfDay } from 'date-fns';

const TIMEZONE = 'America/Merida';

/**
 * Returns the UTC range (start/end) for a specific date in America/Merida.
 * This ensures that "Today" is always relative to Sabancuy time, not server time.
 */
export function getMeridaDayRange(dateInput?: string | Date) {
  const baseDate = dateInput 
    ? (typeof dateInput === 'string' ? new Date(`${dateInput}T12:00:00`) : dateInput)
    : new Date();
    
  // Get the normalized date string in Merida (YYYY-MM-DD)
  const dateStr = formatInTimeZone(baseDate, TIMEZONE, 'yyyy-MM-dd');
  
  // Construct the absolute start and end of that day in Merida
  // Merida is usually UTC-6. So 00:00:00 in Merida is 06:00:00 in UTC.
  const start = toDate(`${dateStr} 00:00:00`, { timeZone: TIMEZONE });
  const end = toDate(`${dateStr} 23:59:59.999`, { timeZone: TIMEZONE });
  
  return { start, end, dateStr };
}

/**
 * Returns the current date string in America/Merida (YYYY-MM-DD)
 */
export function getMeridaTodayStr() {
  return formatInTimeZone(new Date(), TIMEZONE, 'yyyy-MM-dd');
}
