/**
 * Nepali (Bikram Sambat) calendar utilities.
 *
 * Conversion uses a lookup table of days-per-month for each BS year.
 * Reference anchor: BS 2070/01/01 = AD 2013/04/14
 */

// ── Lookup table ─────────────────────────────────────────────────────────────
// Each entry: days in [Baisakh, Jestha, Ashadh, Shrawan, Bhadra, Ashwin,
//                       Kartik, Mangsir, Poush, Magh, Falgun, Chaitra]

const BS_DATA = {
  2070: [31,31,32,32,31,30,30,29,30,29,30,30],
  2071: [31,31,32,31,31,31,30,29,30,29,30,30],
  2072: [31,32,31,32,31,30,30,30,29,29,30,31],
  2073: [30,32,31,32,31,30,30,30,29,30,29,31],
  2074: [31,31,32,31,31,31,30,29,30,29,30,30],
  2075: [31,31,32,32,31,30,30,29,30,29,30,30],
  2076: [31,32,31,32,31,30,30,30,29,29,30,31],
  2077: [30,32,31,32,31,30,30,30,29,30,29,31],
  2078: [31,31,32,31,31,31,30,29,30,29,30,30],
  2079: [31,31,32,31,31,30,30,29,30,29,30,30],
  2080: [31,32,31,32,31,30,30,30,29,29,30,31],
  2081: [31,31,32,32,31,30,30,29,30,29,30,30],
  2082: [31,32,31,32,31,30,30,29,30,29,30,30],
  2083: [31,31,32,31,32,30,30,30,29,29,30,30],
  2084: [31,31,32,32,31,30,30,29,30,29,30,30],
  2085: [31,32,31,32,31,30,30,30,29,29,30,31],
  2086: [30,32,31,32,31,30,30,30,29,30,29,31],
  2087: [31,31,32,31,31,31,30,29,30,29,30,30],
  2088: [31,31,32,31,31,31,30,29,30,29,30,30],
  2089: [31,32,31,32,31,30,30,30,29,29,30,31],
  2090: [30,32,31,32,31,30,30,30,29,30,29,31],
};

// Anchor: BS 2070/01/01 = AD 2013/04/14
const ANCHOR_BS  = { year: 2070, month: 1, day: 1 };
const ANCHOR_AD  = new Date(2013, 3, 14); // month is 0-indexed

const BS_MONTHS = [
  'Baisakh','Jestha','Ashadh','Shrawan','Bhadra','Ashwin',
  'Kartik','Mangsir','Poush','Magh','Falgun','Chaitra',
];

const BS_MONTHS_SHORT = [
  'Bai','Jes','Ash','Shr','Bha','Asw',
  'Kar','Man','Pou','Mag','Fal','Cha',
];

const WEEKDAYS      = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const WEEKDAYS_NP   = ['आइतबार','सोमबार','मंगलबार','बुधबार','बिहीबार','शुक्रबार','शनिबार'];
const WEEKDAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ── Core conversion ───────────────────────────────────────────────────────────

function daysBetween(a, b) {
  const ms = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
           - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  return Math.floor(ms / 86400000);
}

/**
 * Convert an AD Date (or date string / timestamp) to a BS date object.
 * Returns { year, month, day, monthName, monthNameShort, weekday, weekdayShort, weekdayNP }
 * Returns null if the date is outside the supported range (2070–2090 BS).
 */
export function adToBS(input) {
  if (!input) return null;
  const adDate = input instanceof Date ? input : new Date(input);
  if (isNaN(adDate)) return null;

  let totalDays = daysBetween(ANCHOR_AD, adDate);
  if (totalDays < 0) return null; // before our table

  let bsYear  = ANCHOR_BS.year;
  let bsMonth = ANCHOR_BS.month;
  let bsDay   = ANCHOR_BS.day;

  // Advance by totalDays through the BS calendar
  while (totalDays > 0) {
    const monthDays = BS_DATA[bsYear];
    if (!monthDays) return null; // beyond our table

    const daysLeft = monthDays[bsMonth - 1] - bsDay + 1;

    if (totalDays < daysLeft) {
      bsDay += totalDays;
      totalDays = 0;
    } else {
      totalDays -= daysLeft;
      bsDay = 1;
      bsMonth++;
      if (bsMonth > 12) {
        bsMonth = 1;
        bsYear++;
      }
    }
  }

  const wd = adDate.getDay();
  return {
    year:           bsYear,
    month:          bsMonth,
    day:            bsDay,
    monthName:      BS_MONTHS[bsMonth - 1],
    monthNameShort: BS_MONTHS_SHORT[bsMonth - 1],
    weekday:        WEEKDAYS[wd],
    weekdayShort:   WEEKDAYS_SHORT[wd],
    weekdayNP:      WEEKDAYS_NP[wd],
  };
}

// ── Formatting ────────────────────────────────────────────────────────────────

/**
 * Format an AD date as a BS date string.
 *
 * format options:
 *   'short'   → "15 Baisakh 2083"          (default)
 *   'medium'  → "15 Bai, 2083"
 *   'compact' → "2083/01/15"
 *   'full'    → "Wednesday, 15 Baisakh 2083"
 *   'day'     → "15"
 *   'month'   → "Baisakh 2083"
 *
 * Returns '—' for invalid/null input.
 */
export function formatBS(input, format = 'short') {
  if (!input) return '—';
  const bs = adToBS(input);
  if (!bs) return new Date(input).toLocaleDateString(); // fallback

  const d  = String(bs.day).padStart(2, '0');
  const m0 = String(bs.month).padStart(2, '0');

  switch (format) {
    case 'compact': return `${bs.year}/${m0}/${d}`;
    case 'medium':  return `${bs.day} ${bs.monthNameShort}, ${bs.year}`;
    case 'full':    return `${bs.weekday}, ${bs.day} ${bs.monthName} ${bs.year}`;
    case 'day':     return String(bs.day);
    case 'month':   return `${bs.monthName} ${bs.year}`;
    case 'short':
    default:        return `${bs.day} ${bs.monthName} ${bs.year}`;
  }
}

/**
 * "3 days ago" / "15 Baisakh 2083" — relative for recent, absolute for older.
 */
export function formatBSRelative(input) {
  if (!input) return '—';
  const diff = Math.floor((Date.now() - new Date(input)) / 1000);
  if (diff < 60)     return 'Just now';
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatBS(input);
}

// ── Academic year helpers ─────────────────────────────────────────────────────

export function adToBSYear(date = new Date()) {
  const bs = adToBS(date);
  if (bs) return bs.year;
  // fallback formula
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return (m > 4 || (m === 4 && d >= 14)) ? date.getFullYear() + 57 : date.getFullYear() + 56;
}

export function currentBSYear()      { return adToBSYear(new Date()); }
export function currentAcademicYear(){ return String(currentBSYear()); }

export function academicYearOptions(past = 2, future = 2) {
  const base = currentBSYear();
  return Array.from({ length: past + future + 1 }, (_, i) => String(base - past + i));
}

export function formatAcademicYear(year) { return `B.S. ${year}`; }
export function nextAcademicYear(year)   { return String(Number(year) + 1); }

// ── BS month list (for calendars/pickers) ─────────────────────────────────────
export { BS_MONTHS, BS_MONTHS_SHORT, WEEKDAYS, WEEKDAYS_NP, WEEKDAYS_SHORT };
