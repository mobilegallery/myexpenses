
import React from 'react';

interface SyncDataPopupProps {
    onClose: () => void;
    onLink: () => void;
}

const DatabaseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
);

const SyncDataPopup: React.FC<SyncDataPopupProps> = ({ onClose, onLink }) => {
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-light-card dark:bg-dark-card rounded-xl shadow-2xl p-6 w-full max-w-sm text-center">
                <DatabaseIcon />
                <h3 className="text-2xl font-bold mb-2">Sync Your Data</h3>
                <p className="mb-6 text-gray-600 dark:text-gray-300">
                    Link your Google Drive to automatically save, sync, and restore your data across all your devices. Never lose your data again!
                </p>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={onLink}
                        className="btn w-full py-3 px-6 rounded-lg bg-blue-500 text-white hover:bg-blue-600 font-bold"
                    >
                        Link to Google Drive
                    </button>
                    <button
                        onClick={onClose}
                        className="btn w-full py-2 px-6 rounded-lg bg-transparent text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                        Later
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SyncDataPopup;
