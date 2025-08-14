
import React from 'react';

interface PhotoModalProps {
    src: string | null;
    onClose: () => void;
}

const PhotoModal: React.FC<PhotoModalProps> = ({ src, onClose }) => {
    if (!src) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
            <div className="relative max-w-[90%] max-h-[90%]" onClick={e => e.stopPropagation()}>
                <button
                    className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold hover:bg-red-700 transition-colors z-10"
                    onClick={onClose}
                >
                    &times;
                </button>
                <img className="max-w-full max-h-[85vh] rounded-lg shadow-2xl" src={src} alt="Expense detail" />
            </div>
        </div>
    );
};

export default PhotoModal;
