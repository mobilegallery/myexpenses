
import React, { useState, useMemo, useEffect } from 'react';
import { Expense, Payer, Category } from '../types';
import { BS_MONTHS } from '../constants';
import { getTodayBS } from '../services/dateConverter';
import HeaderMenu from './HeaderMenu';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);


const EditIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" />
    </svg>
);

const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

interface DashboardViewProps {
    expenses: Expense[];
    onShowCategoryDetails: (category: Category) => void;
    onShowPayerDetails: (payer: Payer) => void;
    theme: 'light' | 'dark';
    onSetTheme: (theme: 'light' | 'dark') => void;
    onStartEdit: (expense: Expense) => void;
    onShowPhoto: (src: string) => void;
    onSync: () => Promise<void>;
    isSyncing: boolean;
    isSaving: boolean;
    onNavigateToSettings: () => void;
    availableCategories: Category[];
}

const DashboardView: React.FC<DashboardViewProps> = ({ 
    expenses, 
    onShowCategoryDetails, 
    onShowPayerDetails, 
    theme, 
    onSetTheme, 
    onStartEdit, 
    onShowPhoto, 
    onSync, 
    isSyncing, 
    isSaving, 
    onNavigateToSettings,
    availableCategories
}) => {
    const [activeTab, setActiveTab] = useState<'view-all' | 'summary' | null>(null);
    const [currentBsDate, setCurrentBsDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const updateDate = () => {
            const todayBS = getTodayBS();
            if(todayBS && todayBS !== "Date out of range") {
                const [year, monthNum, day] = todayBS.split('-');
                const monthName = BS_MONTHS[monthNum];
                setCurrentBsDate(`${monthName} ${day}, ${year} BS`);
            }
        };
        updateDate();
        const intervalId = setInterval(updateDate, 60000); // Update every minute
        return () => clearInterval(intervalId);
    }, []);

    const totals = useMemo(() => {
        let husbandTotal = 0;
        let wifeTotal = 0;
        // Initialize with default 0s
        const categoriesTotal: { [key: string]: number } = {};
        availableCategories.forEach(c => categoriesTotal[c] = 0);

        expenses.forEach(exp => {
            if (exp.payer === 'Husband') husbandTotal += exp.amount;
            else if (exp.payer === 'Wife') wifeTotal += exp.amount;
            
            // Handle dynamic categories safely
            if (!categoriesTotal[exp.category]) categoriesTotal[exp.category] = 0;
            categoriesTotal[exp.category] += exp.amount;
        });

        const grandTotal = husbandTotal + wifeTotal;

        return { husbandTotal, wifeTotal, categoriesTotal, grandTotal };
    }, [expenses, availableCategories]);

    const sortedExpenses = useMemo(() => {
        return [...expenses].sort((a, b) => b.date.localeCompare(a.date));
    }, [expenses]);
    
    const filteredExpenses = useMemo(() => {
        let data = sortedExpenses;
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            data = data.filter(exp => 
                exp.category.toLowerCase().includes(lower) ||
                (exp.notes && exp.notes.toLowerCase().includes(lower)) ||
                exp.amount.toString().includes(lower) ||
                (exp.subCategory && exp.subCategory.toLowerCase().includes(lower))
            );
        }
        return data;
    }, [sortedExpenses, searchTerm]);

    const handleTabClick = (tab: 'view-all' | 'summary') => {
        setActiveTab(prev => (prev === tab ? null : tab));
        setSearchTerm(''); // Clear search when switching tabs/closing
    };

    const chartOptions = {
        plugins: {
            legend: {
                labels: {
                    color: theme === 'dark' ? '#E0E0E0' : '#1F2937',
                    font: {
                        family: "'Poppins', sans-serif"
                    }
                }
            }
        },
        maintainAspectRatio: false
    };
    
    const activeCategories = availableCategories.filter(cat => totals.categoriesTotal[cat] > 0);
    const doughnutData = {
        labels: activeCategories,
        datasets: [{
            data: activeCategories.map(cat => totals.categoriesTotal[cat]),
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#E7E9ED', '#7CB342', '#F06292'],
            hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#E7E9ED', '#7CB342', '#F06292']
        }]
    };

    const barData = {
        labels: ['Spending'],
        datasets: [
            {
                label: 'Husband',
                data: [totals.husbandTotal],
                backgroundColor: theme === 'dark' ? '#2D65B2' : '#DBEAFE'
            },
            {
                label: 'Wife',
                data: [totals.wifeTotal],
                backgroundColor: theme === 'dark' ? '#B12D55' : '#FEE2E2'
            }
        ]
    };

    const barOptions = {
        ...chartOptions,
        scales: {
            x: {
                ticks: { color: chartOptions.plugins.legend.labels.color },
                grid: { color: theme === 'dark' ? '#4A4A4A' : '#D1D5DB' }
            },
            y: {
                ticks: { color: chartOptions.plugins.legend.labels.color },
                grid: { color: theme === 'dark' ? '#4A4A4A' : '#D1D5DB' }
            }
        }
    };

    return (
        <div className="p-4 sm:p-6 relative">
            <div className="relative flex items-center justify-between mb-4">
                <div className="flex-1"></div>
                <h2 className="text-4xl sm:text-5xl font-bold text-center py-2 flex-1">Expenses Tracker</h2>
                <div className="flex-1 flex justify-end">
                    <HeaderMenu theme={theme} onSetTheme={onSetTheme} onSync={onSync} isSyncing={isSyncing} isSaving={isSaving} onNavigateToSettings={onNavigateToSettings} />
                </div>
            </div>
            <p className="text-sm text-center mb-6">{currentBsDate}</p>

            <div className="flex flex-row gap-4 mb-8 justify-center">
                <button onClick={() => onShowPayerDetails('Husband')} className="transition-transform duration-200 hover:scale-105 btn bg-husband-light text-husband-light-text dark:bg-husband-dark dark:text-white dark:hover:bg-husband-dark-hover hover:bg-husband-light-hover rounded-xl p-5 flex-1 max-w-[48%] shadow-md">
                    <p className="text-lg font-semibold">Husband</p>
                    <p className="text-3xl font-bold">Rs.{totals.husbandTotal.toFixed(2)}</p>
                </button>
                <button onClick={() => onShowPayerDetails('Wife')} className="transition-transform duration-200 hover:scale-105 btn bg-wife-light text-wife-light-text dark:bg-wife-dark dark:text-white dark:hover:bg-wife-dark-hover hover:bg-wife-light-hover rounded-xl p-5 flex-1 max-w-[48%] shadow-md">
                    <p className="text-lg font-semibold">Wife</p>
                    <p className="text-3xl font-bold">Rs.{totals.wifeTotal.toFixed(2)}</p>
                </button>
            </div>
            
            <h3 className="text-xl font-semibold mb-4 text-center">Categories</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 text-center">
                {activeCategories.map(cat => (
                    <button key={cat} onClick={() => onShowCategoryDetails(cat)} className="transition-transform duration-200 hover:scale-105 btn bg-light-card-alt dark:bg-dark-card text-light-text dark:text-dark-text hover:bg-gray-300 dark:hover:bg-gray-600 rounded-xl p-4 shadow-sm text-base">
                        <span>{cat}<br/><span className="font-bold">Rs.{totals.categoriesTotal[cat].toFixed(2)}</span></span>
                    </button>
                ))}
                {activeCategories.length === 0 && <p className="col-span-3 text-gray-500">No expenses yet.</p>}
            </div>

            <div className="flex gap-3 mb-4 justify-end">
                <button onClick={() => handleTabClick('view-all')} className={`btn rounded-lg px-5 py-2.5 font-semibold ${activeTab === 'view-all' ? 'bg-blue-500 text-white' : 'bg-light-card-alt dark:bg-dark-card text-light-text dark:text-dark-text'}`}>View All</button>
                <button onClick={() => handleTabClick('summary')} className={`btn rounded-lg px-5 py-2.5 font-semibold ${activeTab === 'summary' ? 'bg-blue-500 text-white' : 'bg-light-card-alt dark:bg-dark-card text-light-text dark:text-dark-text'}`}>Summary</button>
            </div>

            <div>
                {activeTab === 'view-all' && (
                    <div className="space-y-3">
                        {/* Search Bar */}
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by note, category or amount..."
                                className="w-full p-3 pl-10 rounded-lg border bg-light-card dark:bg-dark-card border-light-border dark:border-dark-border focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        </div>

                        <div className="overflow-x-auto bg-light-card dark:bg-dark-card p-2 rounded-lg shadow-inner">
                            <table className="w-full border-collapse text-base">
                                <thead className="bg-light-card-alt dark:bg-gray-700">
                                    <tr>
                                        <th className="p-4 text-left">Date (BS)</th>
                                        <th className="p-4 text-right">Amount</th>
                                        <th className="p-4 text-left hidden sm:table-cell">Category</th>
                                        <th className="p-4 text-left sm:hidden">Notes</th>
                                        <th className="p-4 text-left hidden sm:table-cell">Notes</th>
                                        <th className="p-4 text-center">Photo</th>
                                        <th className="p-4 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredExpenses.length > 0 ? (
                                        filteredExpenses.map(exp => (
                                            <tr key={exp.id} className={`border-b border-light-border dark:border-dark-border ${exp.payer === 'Husband' ? 'bg-husband-light/50 dark:bg-husband-dark/50' : 'bg-wife-light/50 dark:bg-wife-dark/50'}`}>
                                                <td className="p-4 text-left" title={`AD: ${exp.dateAD}`}>{exp.date}</td>
                                                <td className="p-4 text-right">Rs.{exp.amount.toFixed(2)}</td>
                                                <td className="p-4 text-left hidden sm:table-cell">
                                                    {exp.category}
                                                    {exp.subCategory && <span className="block text-xs text-gray-500">({exp.subCategory})</span>}
                                                </td>
                                                <td className="p-4 text-left truncate max-w-[100px] sm:hidden">{exp.notes || '-'}</td>
                                                <td className="p-4 text-left truncate max-w-xs hidden sm:table-cell">{exp.notes || '-'}</td>
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
                                        ))
                                    ) : (
                                        <>
                                            <tr className="sm:hidden">
                                                <td colSpan={5} className="p-4 text-left text-gray-500 dark:text-gray-400">
                                                    {searchTerm ? 'No matching expenses.' : 'No expenses recorded yet.'}
                                                </td>
                                            </tr>
                                            <tr className="hidden sm:table-row">
                                                <td colSpan={6} className="p-4 text-left text-gray-500 dark:text-gray-400">
                                                     {searchTerm ? 'No matching expenses.' : 'No expenses recorded yet.'}
                                                </td>
                                            </tr>
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
                {activeTab === 'summary' && (
                     <div className="space-y-6 bg-light-card dark:bg-dark-card p-4 rounded-lg shadow-inner">
                        <div>
                           <h4 className="font-semibold text-center mb-2">Category Breakdown</h4>
                           <div className="h-64 md:h-80">
                               {doughnutData.datasets[0].data.length > 0 ? <Doughnut data={doughnutData} options={chartOptions} /> : <p className="text-center p-4">No data for chart.</p>}
                           </div>
                        </div>
                         <div>
                           <h4 className="font-semibold text-center mb-2">Payer Comparison</h4>
                            <div className="h-64 md:h-80">
                              <Bar data={barData} options={barOptions} />
                           </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardView;
