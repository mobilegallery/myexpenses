
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Expense } from '../types';

const KeyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H5v-2H3v-2H1v-4a6 6 0 017.743-5.743z" /></svg>;
const GoogleDriveIcon = () => <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-gray-500"><title>Google Drive</title><path d="M19.14 7.2l-5.68-1.74L8.86 0 3.03 5.46l-3.03 8.37 5.83 5.34 5.68 1.74 4.6-5.46 3.03-8.25zM8.88 2.31l3.52 3.2L7.02 7.2 8.88 2.31zM4.58 6.45L7.9 3.23l3.63 10.43-6.95-1.76zm1.39 9.38l-4.23-3.88 6.95 1.77L5.97 15.83zm5.41.92l-3.52-3.2 8.38-2.14 1.86 5.1-6.72.24z"/></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const SyncIcon = ({ className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5m-5 0a9 9 0 0014.95 3.95M20 20v-5h-5m5 0a9 9 0 00-14.95-3.95" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const ListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;

interface SettingsViewProps {
    isPinSet: boolean;
    onShowPinModal: () => void;
    onDeletePin: () => void;
    onSync: () => Promise<void>;
    isSyncing: boolean;
    isSaving: boolean;
    expenses: Expense[];
    onManageCategories: () => void;
    onManageRentLocations: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
    isPinSet, 
    onShowPinModal, 
    onDeletePin, 
    onSync, 
    isSyncing, 
    isSaving, 
    expenses,
    onManageCategories,
    onManageRentLocations
}) => {
    const { user, isLoggedIn, loginWithGoogle, logout } = useAuth();
    
    const handleExportCSV = () => {
        if (expenses.length === 0) {
            alert("No expenses to export.");
            return;
        }

        const headers = ["ID", "Date (BS)", "Date (AD)", "Amount", "Category", "SubCategory", "Payer", "Notes", "Rent", "Electricity Unit", "Electricity Cost"];

        const escapeCSV = (field: any) => {
            const stringField = String(field || '');
            if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
                return `"${stringField.replace(/"/g, '""')}"`;
            }
            return stringField;
        };

        const csvRows = expenses.map(exp => {
            // Calculate electricity cost just for export if needed, or if stored
            let elecCost = '';
            if (exp.category === 'Rent' && exp.rentAmount && exp.amount) {
                elecCost = (exp.amount - exp.rentAmount).toFixed(2);
            }

            return [
                exp.id,
                exp.date,
                exp.dateAD,
                exp.amount,
                exp.category,
                exp.subCategory || '',
                exp.payer,
                escapeCSV(exp.notes),
                exp.rentAmount || '',
                exp.electricityReading || '',
                elecCost
            ].join(',');
        });

        const csvContent = [headers.join(','), ...csvRows].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            const today = new Date().toISOString().split('T')[0];
            link.setAttribute("href", url);
            link.setAttribute("download", `expense_tracker_export_${today}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="p-4 sm:p-6 pb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">Settings</h2>
            
            <div className="space-y-6 max-w-2xl mx-auto">
                {/* Configuration Section */}
                <div className="bg-light-card dark:bg-dark-card rounded-lg p-5 shadow-sm">
                    <div className="flex items-center mb-4">
                        <ListIcon />
                        <h3 className="text-lg font-semibold">Category & Configuration</h3>
                    </div>
                    <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <p className="text-gray-600 dark:text-gray-400">Manage expense categories.</p>
                            <button onClick={onManageCategories} className="btn bg-light-card-alt dark:bg-dark-bg hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg py-2 px-4 text-sm font-bold shadow transition-transform hover:scale-105">
                                Manage Categories
                            </button>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-gray-600 dark:text-gray-400">Manage rent locations (e.g., Store, House).</p>
                            <button onClick={onManageRentLocations} className="btn bg-light-card-alt dark:bg-dark-bg hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg py-2 px-4 text-sm font-bold shadow transition-transform hover:scale-105">
                                Manage Locations
                            </button>
                        </div>
                    </div>
                </div>

                {/* App Lock Section */}
                <div className="bg-light-card dark:bg-dark-card rounded-lg p-5 shadow-sm">
                    <div className="flex items-center mb-4">
                        <KeyIcon />
                        <h3 className="text-lg font-semibold">App Lock</h3>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="text-gray-600 dark:text-gray-400">{isPinSet ? "PIN is enabled." : "Secure the app with a PIN."}</p>
                        {isPinSet ? (
                            <div className="flex gap-2">
                                <button onClick={onShowPinModal} className="btn text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">Change</button>
                                <button onClick={onDeletePin} className="btn text-sm font-semibold text-red-600 dark:text-red-400 hover:underline">Delete</button>
                            </div>
                        ) : (
                            <button onClick={onShowPinModal} className="btn bg-blue-500 text-white hover:bg-blue-600 rounded-lg py-2 px-4 text-sm font-bold shadow transition-transform hover:scale-105">
                                Create PIN
                            </button>
                        )}
                    </div>
                </div>

                 {/* Account & Sync Section */}
                <div className="bg-light-card dark:bg-dark-card rounded-lg p-5 shadow-sm">
                    <div className="flex items-center mb-4">
                        <GoogleDriveIcon />
                        <h3 className="text-lg font-semibold">Account & Sync</h3>
                    </div>
                    {isLoggedIn && user ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 bg-light-card-alt dark:bg-dark-bg p-3 rounded-lg">
                                <img src={user.picture} alt="User" className="w-12 h-12 rounded-full" />
                                <div className="flex-1">
                                    <p className="font-semibold text-light-text dark:text-dark-text">{user.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Your data is being synced with your Google Drive. All devices logged into this account will see updates in near real-time.</p>
                             <div className="flex flex-col sm:flex-row gap-3">
                                <button onClick={onSync} disabled={isSyncing || isSaving} className="btn flex-1 flex items-center justify-center bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800/60 rounded-lg py-2 px-4 text-sm font-bold shadow disabled:opacity-50 disabled:cursor-not-allowed">
                                    <SyncIcon className={isSyncing ? 'animate-spin' : ''} />
                                    {isSyncing ? 'Syncing...' : 'Force Sync / Restore'}
                                 </button>
                                 <button onClick={logout} className="btn flex-1 flex items-center justify-center bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800/60 rounded-lg py-2 px-4 text-sm font-bold shadow">
                                     <LogoutIcon /> Disconnect Account
                                 </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p className="text-gray-600 dark:text-gray-400 mb-3">You are currently using the app as a guest. Your data is stored only on this device.</p>
                            <div className="flex justify-between items-center bg-blue-500/10 dark:bg-blue-900/40 p-3 rounded-lg">
                                <p className="text-sm text-blue-800 dark:text-blue-200 mr-2">Link your Google account to enable cloud sync & backup.</p>
                                <button onClick={loginWithGoogle} className="btn bg-blue-500 text-white hover:bg-blue-600 rounded-lg py-2 px-4 text-sm font-bold shadow flex-shrink-0">
                                    Link Account
                                </button>
                            </div>
                            <div className="border-t border-light-border dark:border-dark-border my-4"></div>
                             <div className="flex justify-between items-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400">This will clear all local data.</p>
                                <button onClick={logout} className="btn flex items-center bg-gray-500/10 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400 hover:bg-gray-500/20 dark:hover:bg-gray-500/30 rounded-lg py-2 px-4 text-sm font-bold">
                                    <LogoutIcon /> Logout Guest
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Data Management Section */}
                <div className="bg-light-card dark:bg-dark-card rounded-lg p-5 shadow-sm">
                    <div className="flex items-center mb-4">
                        <DownloadIcon />
                        <h3 className="text-lg font-semibold">Data Management</h3>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="text-gray-600 dark:text-gray-400">Export all your data to a CSV file.</p>
                        <button
                            onClick={handleExportCSV}
                            className="btn bg-green-500 text-white hover:bg-green-600 rounded-lg py-2 px-4 text-sm font-bold shadow transition-transform hover:scale-105 flex-shrink-0"
                        >
                            Export to CSV
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SettingsView;
