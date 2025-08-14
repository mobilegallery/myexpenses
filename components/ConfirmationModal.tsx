
import React from 'react';

interface ConfirmationModalProps {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    confirmColorClass?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
    title, 
    message, 
    onConfirm, 
    onCancel, 
    confirmText = 'Yes', 
    cancelText = 'No', 
    confirmColorClass = 'bg-red-600 hover:bg-red-700' 
}) => {
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-light-card dark:bg-dark-card rounded-xl shadow-2xl p-6 w-full max-w-sm text-center">
                <h3 className="text-xl font-bold mb-4">{title}</h3>
                <p className="mb-6">{message}</p>
                <div className="flex justify-around gap-4">
                    <button
                        onClick={onCancel}
                        className="btn flex-1 py-3 px-6 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 font-bold"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`btn flex-1 py-3 px-6 rounded-lg text-white font-bold ${confirmColorClass}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;