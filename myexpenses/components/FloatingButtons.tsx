
import React from 'react';
import { View } from '../types';

interface FloatingButtonsProps {
    currentView: View;
    onNavigateHome: () => void;
    onShowAddExpense: () => void;
}

const HomeIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
    </svg>
);

const PlusIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
    </svg>
);

const FloatingButtons: React.FC<FloatingButtonsProps> = ({ currentView, onNavigateHome, onShowAddExpense }) => {
    const showHomeButton = currentView !== 'dashboard';
    const showAddButton = currentView === 'dashboard';

    return (
        <div className="fixed right-4 flex flex-col gap-4 z-40" style={{ bottom: 'calc(2rem + env(safe-area-inset-bottom))' }}>
            {showHomeButton && (
                <button
                    onClick={onNavigateHome}
                    title="Home"
                    className="btn floating-btn bg-blue-500 text-white hover:bg-blue-600 rounded-full w-16 h-16 flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                >
                    <HomeIcon />
                </button>
            )}
            {showAddButton && (
                 <button
                    onClick={onShowAddExpense}
                    title="Add Expense"
                    className="btn floating-btn bg-red-500 text-white hover:bg-red-600 rounded-full w-16 h-16 flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                >
                    <PlusIcon />
                </button>
            )}
        </div>
    );
};

export default FloatingButtons;