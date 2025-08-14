
import React, { useState, useMemo } from 'react';
import { Expense, Payer, Category } from '../types';
import { CATEGORIES } from '../constants';
import { getTodayBS, adToBs } from '../services/dateConverter';
import DateRangePicker from './DateRangePicker';

const EditIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" />
    </svg>
);

interface DetailsViewProps {
    mode: 'category' | 'payer';
    item: Category | Payer;
    expenses: Expense[];
    onShowPhoto: (src: string) => void;
    onStartEdit: (expense: Expense) => void;
}

type DateFilter = 'all' | '7days' | 'month' | 'year' | 'custom';

const DetailsView: React.FC<DetailsViewProps> = ({ mode, item, expenses, onShowPhoto, onStartEdit }) => {
    const [dateFilter, setDateFilter] = useState<DateFilter>('all');
    const [secondaryFilter, setSecondaryFilter] = useState<string>('all');
    const today = getTodayBS();
    const [customStartDate, setCustomStartDate] = useState(today);
    const [customEndDate, setCustomEndDate] = useState(today);
    const [isDatePickerOpen, setDatePickerOpen] = useState(false);


    const { filteredExpenses, totalAmount } = useMemo(() => {
        let dateRange = { startDate: '2080-01-01', endDate: '2090-12-30' };
        if (dateFilter !== 'all') {
            const todayBS = getTodayBS();
            const [year, month] = todayBS.split('-').map(Number);
            switch (dateFilter) {
                case '7days':
                    const sevenDaysAgoAD = new Date();
                    sevenDaysAgoAD.setDate(sevenDaysAgoAD.getDate() - 6);
                    dateRange = { startDate: adToBs(sevenDaysAgoAD.toISOString().split('T')[0]), endDate: todayBS };
                    break;
                case 'month':
                    dateRange = { startDate: `${year}-${String(month).padStart(2, '0')}-01`, endDate: todayBS };
                    break;
                case 'year':
                    dateRange = { startDate: `${year}-01-01`, endDate: todayBS };
                    break;
                case 'custom':
                    if (customStartDate && customEndDate && customStartDate <= customEndDate) {
                         dateRange = { startDate: customStartDate, endDate: customEndDate };
                    }
                    break;
            }
        }

        const filtered = expenses.filter(exp => {
            const primaryCondition = mode === 'category' ? exp.category === item : exp.payer === item;
            const secondaryCondition = secondaryFilter === 'all' ? true : (mode === 'category' ? exp.payer === secondaryFilter : exp.category === secondaryFilter);
            const dateCondition = exp.date >= dateRange.startDate && exp.date <= dateRange.endDate;
            return primaryCondition && secondaryCondition && dateCondition;
        }).sort((a, b) => b.date.localeCompare(a.date));
        
        const total = filtered.reduce((sum, exp) => sum + exp.amount, 0);

        return { filteredExpenses: filtered, totalAmount: total };
    }, [expenses, item, mode, dateFilter, secondaryFilter, customStartDate, customEndDate]);

    const title = `${item} Expenses`;
    const secondaryFilterLabel = mode === 'category' ? 'Filter by Payer' : 'Filter by Category';
    const secondaryFilterOptions = mode === 'category' ? ['All', 'Husband', 'Wife'] : ['All', ...CATEGORIES];

    const handleCustomFilterClick = () => {
        setDateFilter('custom');
        setDatePickerOpen(true);
    }
    
    return (
        <div className="p-4 sm:p-6 pb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6">{title}</h2>
            <div className="space-y-4 mb-4">
                <select value={secondaryFilter} onChange={e => setSecondaryFilter(e.target.value)} className="w-full p-3 rounded-lg border bg-light-card dark:bg-dark-card border-light-border dark:border-dark-border">
                    <option value="all">{secondaryFilterLabel}</option>
                    {secondaryFilterOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <div className="flex flex-wrap gap-2 justify-center">
                    {(['all', '7days', 'month', 'year'] as const).map(filter => (
                        <button key={filter} onClick={() => setDateFilter(filter)} className={`btn rounded-lg px-4 py-2 font-semibold capitalize ${dateFilter === filter ? 'bg-blue-500 text-white' : 'bg-light-card-alt dark:bg-dark-card text-light-text dark:text-dark-text'}`}>
                            {filter === '7days' ? '7 Days' : filter}
                        </button>
                    ))}
                     <button onClick={handleCustomFilterClick} className={`btn rounded-lg px-4 py-2 font-semibold capitalize ${dateFilter === 'custom' ? 'bg-blue-500 text-white' : 'bg-light-card-alt dark:bg-dark-card text-light-text dark:text-dark-text'}`}>
                        Custom
                    </button>
                </div>
                {isDatePickerOpen && (
                    <DateRangePicker
                        initialStartDate={customStartDate}
                        initialEndDate={customEndDate}
                        onApply={(start, end) => {
                            setCustomStartDate(start);
                            setCustomEndDate(end);
                            setDatePickerOpen(false);
                            setDateFilter('custom');
                        }}
                        onClose={() => setDatePickerOpen(false)}
                    />
                )}
            </div>
            <div className="overflow-x-auto bg-light-card dark:bg-dark-card p-2 rounded-lg shadow-inner">
                <table className="w-full border-collapse text-base">
                    <thead className="bg-light-card-alt dark:bg-gray-700">
                        <tr>
                            <th className="p-4 text-left">Date (BS)</th>
                            <th className="p-4 text-right">Amount</th>
                            <th className={`p-4 text-left ${mode === 'category' ? 'hidden sm:table-cell' : ''}`}>{mode === 'category' ? 'Payer' : 'Category'}</th>
                            <th className="p-4 text-left">Notes</th>
                            <th className="p-4 text-center">Photo</th>
                            <th className="p-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredExpenses.map(exp => (
                            <tr key={exp.id} className={`border-b border-light-border dark:border-dark-border ${exp.payer === 'Husband' ? 'bg-husband-light/50 dark:bg-husband-dark/50' : 'bg-wife-light/50 dark:bg-wife-dark/50'}`}>
                                <td className="p-4 text-left" title={`AD: ${exp.dateAD}`}>{exp.date}</td>
                                <td className="p-4 text-right">Rs.{exp.amount.toFixed(2)}</td>
                                <td className={`p-4 text-left ${mode === 'category' ? 'hidden sm:table-cell' : ''}`}>{mode === 'category' ? exp.payer : exp.category}</td>
                                <td className="p-4 text-left truncate max-w-[80px] sm:max-w-xs">{exp.notes || '-'}</td>
                                <td className="p-4 text-center">
                                    {exp.photo ? <img src={exp.photo} alt="expense" className="w-10 h-10 object-cover rounded cursor-pointer mx-auto" onClick={() => onShowPhoto(exp.photo)} /> : '-'}
                                </td>
                                <td className="p-4 text-center">
                                     <div className="flex items-center justify-center gap-2">
                                        <button onClick={() => onStartEdit(exp)} title="Edit Expense" className="p-1 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full">
                                            <EditIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {filteredExpenses.length === 0 && <p className="text-center p-4">No matching expenses found.</p>}
            </div>
            <div className="mt-4 text-center text-lg font-semibold">Total: Rs.{totalAmount.toFixed(2)}</div>
        </div>
    );
};

export default DetailsView;
