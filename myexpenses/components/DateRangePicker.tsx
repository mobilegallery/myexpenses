import React, { useState, useMemo } from 'react';
import { BS_MONTH_DAYS, formatBSDate, validateBSDate } from '../services/dateConverter';
import { BS_MONTHS } from '../constants';

interface DateRangePickerProps {
    initialStartDate?: string;
    initialEndDate?: string;
    onApply: (startDate: string, endDate: string) => void;
    onClose: () => void;
}

const Calendar: React.FC<{
    visibleDate: { year: number; month: number };
    selection: { start?: string; end?: string };
    onDayClick: (date: string) => void;
    onMonthChange: (date: { year: number; month: number }) => void;
}> = ({ visibleDate, selection, onDayClick, onMonthChange }) => {
    
    const { year, month } = visibleDate;
    
    const daysInMonth = useMemo(() => {
        const monthKey = String(month).padStart(2, '0');
        return BS_MONTH_DAYS[year]?.[monthKey] ?? 30;
    }, [year, month]);

    const navigateMonth = (amount: number) => {
        let newMonth = month + amount;
        let newYear = year;
        if (newMonth > 12) {
            newMonth = 1;
            newYear++;
        }
        if (newMonth < 1) {
            newMonth = 12;
            newYear--;
        }
        if (BS_MONTH_DAYS[newYear]) {
            onMonthChange({ year: newYear, month: newMonth });
        }
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onMonthChange({ year: parseInt(e.target.value), month });
    };

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onMonthChange({ year, month: parseInt(e.target.value) });
    };

    return (
        <div className="p-4 bg-light-card-alt dark:bg-dark-card rounded-lg w-full sm:w-80">
            <div className="flex items-center justify-between mb-4">
                <button onClick={() => navigateMonth(-1)} className="p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600">&lt;</button>
                <div className="flex gap-2">
                     <select value={year} onChange={handleYearChange} className="p-2 rounded border bg-light-card dark:bg-dark-bg border-light-border dark:border-dark-border">
                        {Object.keys(BS_MONTH_DAYS).map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                     <select value={month} onChange={handleMonthChange} className="p-2 rounded border bg-light-card dark:bg-dark-bg border-light-border dark:border-dark-border">
                        {Object.entries(BS_MONTHS).map(([num, name]) => <option key={num} value={parseInt(num)}>{name}</option>)}
                    </select>
                </div>
                <button onClick={() => navigateMonth(1)} className="p-2 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600">&gt;</button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                    const dayStr = formatBSDate(year, month, day);
                    const isSelectedStart = dayStr === selection.start;
                    const isSelectedEnd = dayStr === selection.end;
                    const isInRange = selection.start && selection.end && dayStr > selection.start && dayStr < selection.end;

                    return (
                        <button
                            key={day}
                            onClick={() => onDayClick(dayStr)}
                            className={`p-2 rounded-full text-sm w-9 h-9 mx-auto 
                                ${isSelectedStart || isSelectedEnd ? 'bg-blue-500 text-white font-bold' : ''}
                                ${isInRange ? 'bg-blue-200 dark:bg-blue-800/50' : ''}
                                ${!isSelectedStart && !isSelectedEnd && !isInRange ? 'hover:bg-gray-200 dark:hover:bg-gray-700' : ''}
                            `}
                        >
                            {day}
                        </button>
                    )
                })}
            </div>
        </div>
    );
};


const DateRangePicker: React.FC<DateRangePickerProps> = ({ initialStartDate, initialEndDate, onApply, onClose }) => {
    const parseDate = (dateStr?: string) => {
        if (!dateStr || !validateBSDate(...dateStr.split('-').map(Number) as [number, number, number])) {
            return { year: 2081, month: 1 };
        }
        const [year, month] = dateStr.split('-').map(Number);
        return { year, month };
    };

    const [startDate, setStartDate] = useState<string | undefined>(initialStartDate);
    const [endDate, setEndDate] = useState<string | undefined>(initialEndDate);
    const [visibleMonth1, setVisibleMonth1] = useState(parseDate(initialStartDate));
    const [visibleMonth2, setVisibleMonth2] = useState(parseDate(initialEndDate || initialStartDate));
    
    const handleDayClick = (date: string) => {
        if (!startDate || (startDate && endDate)) {
            setStartDate(date);
            setEndDate(undefined);
        } else if (startDate && !endDate) {
            if (date < startDate) {
                setEndDate(startDate);
                setStartDate(date);
            } else {
                setEndDate(date);
            }
        }
    };

    const handleApply = () => {
        if(startDate && endDate) {
            onApply(startDate, endDate);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-light-card dark:bg-dark-card rounded-xl shadow-2xl p-4 sm:p-6 space-y-4 w-full max-w-4xl">
                <h3 className="text-xl font-bold text-center">Select Date Range</h3>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Calendar
                        visibleDate={visibleMonth1}
                        selection={{ start: startDate, end: endDate }}
                        onDayClick={handleDayClick}
                        onMonthChange={setVisibleMonth1}
                    />
                     <Calendar
                        visibleDate={visibleMonth2}
                        selection={{ start: startDate, end: endDate }}
                        onDayClick={handleDayClick}
                        onMonthChange={setVisibleMonth2}
                    />
                </div>
                <div className="flex justify-between items-center pt-2">
                    <div className="text-sm font-semibold">
                        <p>Start: <span className="text-blue-600 dark:text-blue-400">{startDate || '...'}</span></p>
                        <p>End: <span className="text-blue-600 dark:text-blue-400">{endDate || '...'}</span></p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="btn py-2 px-6 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                        <button onClick={handleApply} disabled={!startDate || !endDate} className="btn py-2 px-6 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed">Apply</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DateRangePicker;
