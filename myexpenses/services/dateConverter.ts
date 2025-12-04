
export const BS_MONTH_DAYS: { [key: number]: { [key: string]: number } } = {
    2080: { '01': 31, '02': 32, '03': 31, '04': 32, '05': 31, '06': 30, '07': 29, '08': 30, '09': 29, '10': 30, '11': 30, '12': 30 },
    2081: { '01': 31, '02': 32, '03': 31, '04': 32, '05': 31, '06': 30, '07': 29, '08': 30, '09': 29, '10': 30, '11': 30, '12': 30 },
    2082: { '01': 31, '02': 31, '03': 32, '04': 31, '05': 31, '06': 31, '07': 29, '08': 29, '09': 30, '10': 29, '11': 30, '12': 30 },
    2083: { '01': 31, '02': 31, '03': 32, '04': 32, '05': 31, '06': 30, '07': 29, '08': 29, '09': 30, '10': 29, '11': 30, '12': 30 },
    2084: { '01': 31, '02': 32, '03': 31, '04': 32, '05': 31, '06': 30, '07': 29, '08': 30, '09': 29, '10': 29, '11': 30, '12': 30 },
    2085: { '01': 30, '02': 32, '03': 31, '04': 32, '05': 31, '06': 30, '07': 29, '08': 30, '09': 29, '10': 30, '11': 30, '12': 30 },
    2086: { '01': 31, '02': 31, '03': 32, '04': 31, '05': 31, '06': 31, '07': 29, '08': 29, '09': 30, '10': 29, '11': 30, '12': 30 },
    2087: { '01': 31, '02': 31, '03': 32, '04': 32, '05': 31, '06': 30, '07': 29, '08': 29, '09': 30, '10': 29, '11': 30, '12': 30 },
    2088: { '01': 31, '02': 32, '03': 31, '04': 32, '05': 31, '06': 30, '07': 29, '08': 30, '09': 29, '10': 29, '11': 30, '12': 30 },
    2089: { '01': 30, '02': 32, '03': 31, '04': 32, '05': 31, '06': 30, '07': 29, '08': 30, '09': 29, '10': 30, '11': 30, '12': 30 },
    2090: { '01': 31, '02': 31, '03': 32, '04': 31, '05': 31, '06': 31, '07': 29, '08': 29, '09': 30, '10': 29, '11': 30, '12': 30 }
};

const REFERENCE_AD = new Date('2025-06-25T00:00:00Z');
const REFERENCE_BS_YEAR = 2082;
const REFERENCE_BS_MONTH = 3;
const REFERENCE_BS_DAY = 11;

export function validateBSDate(year: number, month: number, day: number): boolean {
    if (!BS_MONTH_DAYS[year] || !BS_MONTH_DAYS[year][String(month).padStart(2, '0')]) return false;
    return day > 0 && day <= BS_MONTH_DAYS[year][String(month).padStart(2, '0')];
}

export function formatBSDate(year: number, month: number, day: number): string {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function adToBs(adDateStr: string): string {
    try {
        const targetAD = new Date(adDateStr + 'T00:00:00Z');
        if (isNaN(targetAD.getTime())) return "";
        
        // This calculation using getTime can be sensitive to DST.
        // A more robust method would be to count days without relying on millisecond division.
        // However, for this context, let's stick to the existing method and ensure input is correct.
        const dayDiff = Math.round((targetAD.getTime() - REFERENCE_AD.getTime()) / (1000 * 60 * 60 * 24));

        let bsYear = REFERENCE_BS_YEAR;
        let bsMonth = REFERENCE_BS_MONTH;
        let bsDay = REFERENCE_BS_DAY + dayDiff;

        if (dayDiff >= 0) {
            while (bsDay > (BS_MONTH_DAYS[bsYear]?.[String(bsMonth).padStart(2, '0')] ?? 0)) {
                if (!BS_MONTH_DAYS[bsYear] || !BS_MONTH_DAYS[bsYear][String(bsMonth).padStart(2, '0')]) return "Date out of range";
                bsDay -= BS_MONTH_DAYS[bsYear][String(bsMonth).padStart(2, '0')];
                bsMonth++;
                if (bsMonth > 12) {
                    bsMonth = 1;
                    bsYear++;
                }
            }
        } else {
            while (bsDay <= 0) {
                bsMonth--;
                if (bsMonth < 1) {
                    bsMonth = 12;
                    bsYear--;
                }
                if (!BS_MONTH_DAYS[bsYear]) return "Date out of range";
                bsDay += BS_MONTH_DAYS[bsYear][String(bsMonth).padStart(2, '0')];
            }
        }
        if (!validateBSDate(bsYear, bsMonth, bsDay)) return "Date out of range";
        return formatBSDate(bsYear, bsMonth, bsDay);
    } catch (e) {
        console.error("adToBs Error:", e);
        return "";
    }
}

export function bsToAd(bsDateStr: string): string {
    try {
        if (!bsDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return "";
        const [year, month, day] = bsDateStr.split('-').map(Number);
        if (!validateBSDate(year, month, day)) return "";

        let dayDiff = 0;
        
        const countDaysInYear = (y: number) => Object.values(BS_MONTH_DAYS[y]).reduce((a, b) => a + b, 0);

        if (year > REFERENCE_BS_YEAR) {
            for (let y = REFERENCE_BS_YEAR; y < year; y++) dayDiff += countDaysInYear(y);
        } else if (year < REFERENCE_BS_YEAR) {
            for (let y = year; y < REFERENCE_BS_YEAR; y++) dayDiff -= countDaysInYear(y);
        }

        for (let m = 1; m < month; m++) dayDiff += BS_MONTH_DAYS[year][String(m).padStart(2, '0')];
        dayDiff += day;
        
        for (let m = 1; m < REFERENCE_BS_MONTH; m++) dayDiff -= BS_MONTH_DAYS[REFERENCE_BS_YEAR][String(m).padStart(2, '0')];
        dayDiff -= REFERENCE_BS_DAY;

        const targetAD = new Date(REFERENCE_AD);
        targetAD.setUTCDate(targetAD.getUTCDate() + dayDiff);

        return `${targetAD.getUTCFullYear()}-${String(targetAD.getUTCMonth() + 1).padStart(2, '0')}-${String(targetAD.getUTCDate()).padStart(2, '0')}`;
    } catch (e) {
        console.error("bsToAd Error:", e);
        return "";
    }
}

export const getTodayBS = () => {
    try {
        // Use Intl.DateTimeFormat to get the current date in Nepal's timezone.
        // The 'en-CA' locale is used as it formats the date to YYYY-MM-DD.
        const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Kathmandu',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
        
        const adDateStr = formatter.format(new Date());
        return adToBs(adDateStr);
    } catch (e) {
        console.error("Error getting Nepal date, falling back to UTC.", e);
        // Fallback for older browsers that might not support Intl with timeZone
        return adToBs(new Date().toISOString().split('T')[0]);
    }
};
