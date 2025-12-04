

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Expense, View, Payer, Category, DriveData } from './types';
import { DEFAULT_CATEGORIES, DEFAULT_RENT_SUB_CATEGORIES, INITIAL_CATEGORIES, INITIAL_RENT_LOCATIONS } from './constants';
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
import ListManagerModal from './components/ListManagerModal';

const App: React.FC = () => {
    const { user, isLoggedIn, isLoading: isAuthLoading, accessToken, logout, loginWithGoogle } = useAuth();
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

    // Dynamic Categories - Initialized with INITIAL_CATEGORIES
    const [customCategories, setCustomCategories] = useLocalStorage<string[]>('custom-categories-v3', INITIAL_CATEGORIES);
    
    // Rent Locations - Initialized with INITIAL_RENT_LOCATIONS
    const [customRentSubCategories, setCustomRentSubCategories] = useLocalStorage<string[]>('custom-rent-sub-categories-v2', INITIAL_RENT_LOCATIONS);
    
    // List Management Modals
    const [showCategoryManager, setShowCategoryManager] = useState(false);
    const [showRentManager, setShowRentManager] = useState(false);

    const allCategories = useMemo(() => [...DEFAULT_CATEGORIES, ...customCategories], [customCategories]);
    const allRentSubCategories = useMemo(() => [...DEFAULT_RENT_SUB_CATEGORIES, ...customRentSubCategories], [customRentSubCategories]);

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
            // We only stop loading if we are NOT waiting for auth
            if (isAuthLoading) return;

            setIsDataLoading(true);
            try {
                if (isLoggedIn && user && accessToken) { // Google Drive User
                    await driveService.init(accessToken);
                    const driveData: DriveData = await driveService.getDriveData(accessToken);
                    setExpenses(driveData.expenses || []);
                    
                    // Sync Configs from Drive if they exist and are not empty
                    if (driveData.categories && driveData.categories.length > 0) {
                        setCustomCategories(driveData.categories);
                    }
                    if (driveData.rentLocations && driveData.rentLocations.length > 0) {
                        setCustomRentSubCategories(driveData.rentLocations);
                    }

                } else if (user) { // Guest User or Local Fallback
                    if (user.id === 'guest_user') {
                        expenseService.migrateLocalExpenses(user.id);
                        const userExpenses = expenseService.getExpenses(user.id);
                        setExpenses(userExpenses);

                        const hasSeenSyncPopup = localStorage.getItem('syncPopupShown');
                        if (!hasSeenSyncPopup) {
                            setShowSyncPopup(true);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to load data", error);
            } finally {
                setIsDataLoading(false);
            }
        };
        loadInitialData();
    }, [isLoggedIn, accessToken, isAuthLoading, user, setCustomCategories, setCustomRentSubCategories]);
    
    // Combined Save Function for Expenses and Config
    const saveDataToDrive = useCallback(async (newExpenses: Expense[], newCategories: string[], newRentLocations: string[]) => {
        if (!user || !accessToken) return;
        setIsSaving(true);
        try {
            const dataToSave: DriveData = {
                expenses: newExpenses,
                categories: newCategories,
                rentLocations: newRentLocations,
                lastUpdated: Date.now()
            };
            await driveService.saveDriveData(accessToken, dataToSave);
        } catch (error) {
             console.error("Failed to save data to drive", error);
             alert("Cloud Save Failed. Please check your connection.");
        } finally {
            setIsSaving(false);
        }
    }, [accessToken, user]);

    // Wrapper to update everything
    const handleGlobalUpdate = useCallback((newExpenses: Expense[], newCategories?: string[], newRentLocations?: string[]) => {
        // Update Local State
        setExpenses(newExpenses);
        if (newCategories) setCustomCategories(newCategories);
        if (newRentLocations) setCustomRentSubCategories(newRentLocations);

        // Determine what to save
        const catsToSave = newCategories || customCategories;
        const rentsToSave = newRentLocations || customRentSubCategories;

        if (accessToken) {
             saveDataToDrive(newExpenses, catsToSave, rentsToSave);
        } else if (user && user.id === 'guest_user') {
             // Guest Save
             expenseService.saveExpenses(user.id, newExpenses);
             // Categories are already saved via useLocalStorage hook automatically
        }
    }, [accessToken, user, customCategories, customRentSubCategories, setCustomCategories, setCustomRentSubCategories, saveDataToDrive]);


    const syncData = useCallback(async () => {
        if (!isLoggedIn) return;
        
        if (!accessToken) {
            // Logged in but no token (expired session). 
            // We can't sync silently. 
            console.warn("Cannot sync: No access token available.");
            return;
        }

        if (isSaving || isSyncing) return;
        
        setIsSyncing(true);
        try {
            await driveService.init(accessToken);
            const driveData = await driveService.getDriveData(accessToken);
            
            // Basic conflict resolution: Server wins for now, or just replace local
            // Ideally we'd compare timestamps, but for this scope, pulling fresh data is safer
            if (driveData.expenses) {
                 setExpenses(driveData.expenses);
            }
            if (driveData.categories && driveData.categories.length > 0) {
                 setCustomCategories(driveData.categories);
            }
             if (driveData.rentLocations && driveData.rentLocations.length > 0) {
                 setCustomRentSubCategories(driveData.rentLocations);
            }
            console.log("Sync completed.");
        } catch (error) {
            console.error("Failed to sync from Drive", error);
        } finally {
            setIsSyncing(false);
        }
    }, [accessToken, isSaving, isSyncing, setCustomCategories, setCustomRentSubCategories, isLoggedIn]);

    // Polling for Real-Time Sync
    useEffect(() => {
        if (isLoggedIn && accessToken) {
            const intervalId = setInterval(() => {
                syncData();
            }, 15000); // Poll every 15 seconds
            
            const onFocus = () => syncData();
            window.addEventListener('focus', onFocus);

            return () => {
                clearInterval(intervalId);
                window.removeEventListener('focus', onFocus);
            };
        }
    }, [isLoggedIn, accessToken, syncData]);

    const handleSaveExpense = useCallback((expenseData: Omit<Expense, 'id'> | Expense) => {
        let newExpenses: Expense[];
        if ('id' in expenseData && expenseData.id) { 
            newExpenses = expenses.map(exp => exp.id === expenseData.id ? expenseData : exp);
        } else { 
            newExpenses = [{ ...expenseData, id: Date.now() }, ...expenses];
        }
        handleGlobalUpdate(newExpenses);
        setView('dashboard');
        setEditingExpense(null);
    }, [expenses, handleGlobalUpdate]);

    // Category Management
    const handleAddCategory = useCallback((newCategory: string) => {
        if (!allCategories.includes(newCategory)) {
            const newCats = [...customCategories, newCategory];
            handleGlobalUpdate(expenses, newCats);
        }
    }, [allCategories, customCategories, expenses, handleGlobalUpdate]);

    const handleEditCategory = useCallback((oldName: string, newName: string) => {
        const newCats = customCategories.map(c => c === oldName ? newName : c);
        const updatedExpenses = expenses.map(exp => 
            exp.category === oldName ? { ...exp, category: newName } : exp
        );
        handleGlobalUpdate(updatedExpenses, newCats);
    }, [expenses, customCategories, handleGlobalUpdate]);

    const handleDeleteCategory = useCallback((categoryName: string) => {
        const newCats = customCategories.filter(c => c !== categoryName);
        handleGlobalUpdate(expenses, newCats);
    }, [customCategories, expenses, handleGlobalUpdate]);

    // Rent Management
    const handleAddRentSubCategory = useCallback((newSubCategory: string) => {
        if (!allRentSubCategories.includes(newSubCategory)) {
             const newRents = [...customRentSubCategories, newSubCategory];
             handleGlobalUpdate(expenses, undefined, newRents);
        }
    }, [allRentSubCategories, customRentSubCategories, expenses, handleGlobalUpdate]);

    const handleEditRentSubCategory = useCallback((oldName: string, newName: string) => {
        const newRents = customRentSubCategories.map(c => c === oldName ? newName : c);
        const updatedExpenses = expenses.map(exp => 
            exp.subCategory === oldName ? { ...exp, subCategory: newName } : exp
        );
        handleGlobalUpdate(updatedExpenses, undefined, newRents);
    }, [expenses, customRentSubCategories, handleGlobalUpdate]);

    const handleDeleteRentSubCategory = useCallback((subCategoryName: string) => {
        const newRents = customRentSubCategories.filter(c => c !== subCategoryName);
        handleGlobalUpdate(expenses, undefined, newRents);
    }, [customRentSubCategories, expenses, handleGlobalUpdate]);


    const handleDeleteExpense = useCallback((id: number) => {
        const newExpenses = expenses.filter(exp => exp.id !== id);
        handleGlobalUpdate(newExpenses);
        setView('dashboard');
        setEditingExpense(null);
    }, [expenses, handleGlobalUpdate]);

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
    
    // Force Auth when sync is needed but token is gone
    const handleForceSync = useCallback(async () => {
        if (!accessToken && isLoggedIn) {
            // Need to re-auth
            loginWithGoogle();
        } else {
            syncData();
        }
    }, [accessToken, isLoggedIn, loginWithGoogle, syncData]);

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
                return (
                    <AddExpenseView 
                        onSaveExpense={handleSaveExpense} 
                        onBack={navigateHome} 
                        expenseToEdit={editingExpense} 
                        onDeleteExpense={handleDeleteExpense}
                        availableCategories={allCategories}
                        onAddCategory={handleAddCategory}
                        availableRentSubCategories={allRentSubCategories}
                        onAddRentSubCategory={handleAddRentSubCategory}
                        existingExpenses={expenses}
                    />
                );
            case 'details':
                if (detailsItem) {
                    return (
                        <DetailsView
                            mode={detailsItem.type}
                            item={detailsItem.value}
                            expenses={expenses}
                            onShowPhoto={setModalPhoto}
                            onStartEdit={handleStartEdit}
                            availableCategories={allCategories}
                            availableRentSubCategories={allRentSubCategories}
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
                        onSync={handleForceSync}
                        isSyncing={isSyncing}
                        isSaving={isSaving}
                        expenses={expenses}
                        onManageCategories={() => setShowCategoryManager(true)}
                        onManageRentLocations={() => setShowRentManager(true)}
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
                        onSync={handleForceSync}
                        isSyncing={isSyncing}
                        isSaving={isSaving}
                        onNavigateToSettings={navigateToSettings}
                        availableCategories={allCategories}
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
                    <span>Saving to Cloud...</span>
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
            
            {showCategoryManager && (
                <ListManagerModal
                    title="Manage Categories"
                    items={customCategories}
                    defaultItems={DEFAULT_CATEGORIES} 
                    onClose={() => setShowCategoryManager(false)}
                    onAdd={handleAddCategory}
                    onEdit={handleEditCategory}
                    onDelete={handleDeleteCategory}
                />
            )}
            {showRentManager && (
                <ListManagerModal
                    title="Manage Rent Locations"
                    items={customRentSubCategories}
                    defaultItems={DEFAULT_RENT_SUB_CATEGORIES} 
                    onClose={() => setShowRentManager(false)}
                    onAdd={handleAddRentSubCategory}
                    onEdit={handleEditRentSubCategory}
                    onDelete={handleDeleteRentSubCategory}
                />
            )}
        </div>
    );
};

export default App;
