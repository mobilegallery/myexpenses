

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Expense, View, Payer, Category } from './types';
import DashboardView from './components/DashboardView';
import DetailsView from './components/DetailsView';
import AddExpenseView from './components/AddExpenseView';
import PhotoModal from './components/PhotoModal';
import FloatingButtons from './components/FloatingButtons';
import { useAuth } from './contexts/AuthContext';
import Spinner from './components/common/Spinner';
import * as driveService from './services/driveService';
import * as expenseService from './services/expenseService';
import SyncDataPopup from './components/WelcomePopup';
import { useLocalStorage } from './hooks/useLocalStorage';
import PinLockScreen from './components/PinLockScreen';
import SettingsView from './components/SettingsView';
import PinModal from './components/PinModal';
import ConfirmationModal from './components/ConfirmationModal';

const App: React.FC = () => {
    const { user, isLoggedIn, isLoading: isAuthLoading, accessToken, logout } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'dark');
    const [view, setView] = useState<View>('dashboard');
    const [modalPhoto, setModalPhoto] = useState<string | null>(null);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    
    // Feature-specific state
    const [showSyncPopup, setShowSyncPopup] = useState(false);
    const [pin, setPin] = useLocalStorage('app-pin', '');
    const [isLocked, setIsLocked] = useState(!!pin);
    const [showPinModal, setShowPinModal] = useState(false);
    const [showDeletePinConfirm, setShowDeletePinConfirm] = useState(false);

    const [detailsItem, setDetailsItem] = useState<{ type: 'category' | 'payer'; value: Category | Payer } | null>(null);

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        root.style.fontFamily = "'Poppins', sans-serif";
        document.body.className = `transition-colors duration-300 ${theme === 'dark' ? 'bg-dark-bg' : 'bg-light-bg'} ${theme === 'dark' ? 'text-dark-text' : 'text-light-text'}`;
        localStorage.setItem('theme', theme);
        
        if (!pin) {
            setIsLocked(false);
        }
    }, [theme, pin]);

    useEffect(() => {
        const loadInitialData = async () => {
            if (isLoggedIn && user) {
                setIsDataLoading(true);
                try {
                    if (accessToken) { // Google Drive User
                        await driveService.init(accessToken);
                        const userExpenses = await driveService.getExpenses(accessToken);
                        setExpenses(userExpenses);
                    } else { // Guest User (no accessToken)
                        expenseService.migrateLocalExpenses(user.id);
                        const userExpenses = expenseService.getExpenses(user.id);
                        setExpenses(userExpenses);

                        const hasSeenSyncPopup = localStorage.getItem('syncPopupShown');
                        if (!hasSeenSyncPopup && user.id === 'guest_user') {
                            setShowSyncPopup(true);
                        }
                    }
                } catch (error) {
                    console.error("Failed to load expenses", error);
                } finally {
                    setIsDataLoading(false);
                }
            } else if (!isAuthLoading) {
                // Not logged in, clear expenses.
                setExpenses([]);
                setIsDataLoading(false);
            }
        };
        loadInitialData();
    }, [isLoggedIn, accessToken, isAuthLoading, user]);
    
    const updateAndSaveExpenses = useCallback(async (newExpenses: Expense[]) => {
        if (!user) return;
        setIsSaving(true);
        setExpenses(newExpenses);
        try {
            if (accessToken) { // Google Drive User
                await driveService.saveExpenses(accessToken, newExpenses);
            } else { // Guest User
                 expenseService.saveExpenses(user.id, newExpenses);
            }
        } catch (error) {
            console.error("Failed to save expenses", error);
             alert("Error: Could not save data. Please check your connection and try again.");
        } finally {
            setIsSaving(false);
        }
    }, [accessToken, user]);
    
    const syncData = useCallback(async () => {
        if (!accessToken || isSaving || isSyncing) return;
        setIsSyncing(true);
        try {
            const userExpenses = await driveService.getExpenses(accessToken);
            setExpenses(currentExpenses => {
                if (JSON.stringify(userExpenses) !== JSON.stringify(currentExpenses)) {
                    return userExpenses;
                }
                return currentExpenses;
            });
        } catch (error) {
            console.error("Failed to sync expenses from Drive", error);
        } finally {
            setIsSyncing(false);
        }
    }, [accessToken, isSaving, isSyncing]);

    useEffect(() => {
        if (isLoggedIn && accessToken) {
            const intervalId = setInterval(() => {
                syncData();
            }, 15000); // Poll every 15 seconds for more "real-time" feel
            return () => clearInterval(intervalId);
        }
    }, [isLoggedIn, accessToken, syncData]);

    const handleSaveExpense = useCallback((expenseData: Omit<Expense, 'id'> | Expense) => {
        let newExpenses: Expense[];
        if ('id' in expenseData && expenseData.id) { // It's an update
            newExpenses = expenses.map(exp => exp.id === expenseData.id ? expenseData : exp);
        } else { // It's a new expense
            newExpenses = [{ ...expenseData, id: Date.now() }, ...expenses];
        }
        updateAndSaveExpenses(newExpenses);
        setView('dashboard');
        setEditingExpense(null);
    }, [expenses, updateAndSaveExpenses]);

    const handleDeleteExpense = useCallback((id: number) => {
        const newExpenses = expenses.filter(exp => exp.id !== id);
        updateAndSaveExpenses(newExpenses);
        setView('dashboard');
        setEditingExpense(null);
    }, [expenses, updateAndSaveExpenses]);

    const handleStartEdit = useCallback((expense: Expense) => {
        setEditingExpense(expense);
        setView('add');
    }, []);

    const handleShowCategoryDetails = useCallback((category: Category) => {
        setDetailsItem({ type: 'category', value: category });
        setView('details');
    }, []);

    const handleShowPayerDetails = useCallback((payer: Payer) => {
        setDetailsItem({ type: 'payer', value: payer });
        setView('details');
    }, []);

    const navigateHome = useCallback(() => {
        setView('dashboard');
        setDetailsItem(null);
        setEditingExpense(null);
    }, []);
    
    const navigateToSettings = useCallback(() => {
        setView('settings');
    }, []);

    // PIN Handlers
    const handlePinSubmit = useCallback(async (enteredPin: string): Promise<boolean> => {
        if (enteredPin === pin) {
            setIsLocked(false);
            return true;
        }
        return false;
    }, [pin]);

    const handleSetPin = useCallback((newPin: string) => {
        setPin(newPin);
        setShowPinModal(false);
    }, [setPin]);

    const handleDeletePin = useCallback(() => {
        setPin('');
        setShowDeletePinConfirm(false);
    }, [setPin]);

    // Popup Handlers
    const handleCloseSyncPopup = useCallback(() => {
        setShowSyncPopup(false);
        localStorage.setItem('syncPopupShown', 'true');
    }, []);
    
    const handleLinkFromPopup = useCallback(() => {
        handleCloseSyncPopup();
        setView('settings');
    }, [handleCloseSyncPopup]);

    if (isAuthLoading) {
        return <div className="h-screen w-screen flex items-center justify-center"><Spinner className="text-blue-500 !h-10 !w-10" /></div>;
    }

    if (isDataLoading && !isLocked) {
        return <div className="h-screen w-screen flex items-center justify-center"><Spinner className="text-blue-500 !h-10 !w-10" /></div>;
    }
    
    if (isLocked) {
        return <PinLockScreen onPinSubmit={handlePinSubmit} />;
    }

    const renderView = () => {
        switch (view) {
            case 'add':
                return <AddExpenseView onSaveExpense={handleSaveExpense} onBack={navigateHome} expenseToEdit={editingExpense} onDeleteExpense={handleDeleteExpense} />;
            case 'details':
                if (detailsItem) {
                    return (
                        <DetailsView
                            mode={detailsItem.type}
                            item={detailsItem.value}
                            expenses={expenses}
                            onShowPhoto={setModalPhoto}
                            onStartEdit={handleStartEdit}
                        />
                    );
                }
                return null;
            case 'settings':
                return (
                    <SettingsView 
                        isPinSet={!!pin} 
                        onShowPinModal={() => setShowPinModal(true)} 
                        onDeletePin={() => setShowDeletePinConfirm(true)}
                        onSync={syncData}
                        isSyncing={isSyncing}
                        isSaving={isSaving}
                        expenses={expenses}
                    />
                );
            case 'dashboard':
            default:
                return (
                    <DashboardView
                        expenses={expenses}
                        onShowCategoryDetails={handleShowCategoryDetails}
                        onShowPayerDetails={handleShowPayerDetails}
                        theme={theme}
                        onSetTheme={setTheme}
                        onStartEdit={handleStartEdit}
                        onShowPhoto={setModalPhoto}
                        onSync={syncData}
                        isSyncing={isSyncing}
                        isSaving={isSaving}
                        onNavigateToSettings={navigateToSettings}
                    />
                );
        }
    };

    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden">
            <main className="flex-1 overflow-y-auto pb-32">
                 <div className="container mx-auto max-w-4xl pt-[env(safe-area-inset-top)]">
                    {renderView()}
                 </div>
            </main>
            {isSaving && (
                 <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg z-50">
                    <Spinner className="!h-4 !w-4"/>
                    <span>Saving...</span>
                 </div>
            )}
            <FloatingButtons
                currentView={view}
                onNavigateHome={navigateHome}
                onShowAddExpense={() => setView('add')}
            />
            <PhotoModal src={modalPhoto} onClose={() => setModalPhoto(null)} />
            
            {showSyncPopup && (
                <SyncDataPopup onClose={handleCloseSyncPopup} onLink={handleLinkFromPopup} />
            )}
            {showPinModal && (
                <PinModal 
                    onClose={() => setShowPinModal(false)} 
                    onSetPin={handleSetPin}
                    isPinSet={!!pin}
                />
            )}
            {showDeletePinConfirm && (
                 <ConfirmationModal
                    title="Delete PIN"
                    message="Are you sure you want to delete your PIN? The app will no longer be locked."
                    onConfirm={handleDeletePin}
                    onCancel={() => setShowDeletePinConfirm(false)}
                    confirmText="Delete"
                    confirmColorClass="bg-red-600 hover:bg-red-700"
                />
            )}
        </div>
    );
};

export default App;