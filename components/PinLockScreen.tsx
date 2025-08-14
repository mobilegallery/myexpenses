
import React, { useState, useEffect, useCallback } from 'react';
import Spinner from './common/Spinner';

interface PinLockScreenProps {
    onPinSubmit: (pin: string) => Promise<boolean>;
}

const PinLockScreen: React.FC<PinLockScreenProps> = ({ onPinSubmit }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const handleSubmit = useCallback(async () => {
        if (pin.length !== 4 || isVerifying) return;
        setIsVerifying(true);
        setError('');
        const success = await onPinSubmit(pin);
        if (!success) {
            setError('Incorrect PIN');
            // Vibrate device on error for feedback
            if (navigator.vibrate) {
                navigator.vibrate(200);
            }
            // Clear pin after a short delay
            setTimeout(() => {
                setPin('');
                setError('');
            }, 800);
        }
        setIsVerifying(false);
    }, [pin, isVerifying, onPinSubmit]);
    
    useEffect(() => {
        if (pin.length === 4) {
            handleSubmit();
        }
    }, [pin, handleSubmit]);

    const handleKeyClick = (key: string) => {
        if (pin.length < 4) {
            setPin(pin + key);
        }
    };
    
    const handleDelete = () => {
        setPin(pin.slice(0, -1));
    };

    return (
        <div className="fixed inset-0 bg-light-bg dark:bg-dark-bg flex flex-col items-center justify-center z-[100] p-4 text-light-text dark:text-dark-text">
            <h1 className="text-2xl font-bold mb-2">Enter PIN</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Enter your 4-digit PIN to unlock.</p>
            <div className="flex gap-4 mb-4">
                {Array(4).fill(0).map((_, i) => (
                    <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${pin.length > i ? 'bg-blue-500 border-blue-500' : 'border-gray-400'}`}></div>
                ))}
            </div>
            
            <div className="h-6 mb-4 flex items-center justify-center">
                 {error && <p className="text-red-500 text-sm animate-shake">{error}</p>}
                 {isVerifying && <Spinner className="!text-blue-500 !h-5 !w-5" />}
            </div>
            
            <div className="grid grid-cols-3 gap-5 w-full max-w-[280px]">
                {'123456789'.split('').map(key => (
                    <button key={key} onClick={() => handleKeyClick(key)} className="btn text-3xl font-light p-4 rounded-full bg-light-card dark:bg-dark-card hover:bg-gray-200 dark:hover:bg-gray-700 aspect-square shadow-sm transition-transform active:scale-90">
                        {key}
                    </button>
                ))}
                <div className="w-full h-full"></div> {/* Placeholder */}
                <button onClick={() => handleKeyClick('0')} className="btn text-3xl font-light p-4 rounded-full bg-light-card dark:bg-dark-card hover:bg-gray-200 dark:hover:bg-gray-700 aspect-square shadow-sm transition-transform active:scale-90">0</button>
                <button onClick={handleDelete} className="btn p-4 rounded-full bg-light-card dark:bg-dark-card hover:bg-gray-200 dark:hover:bg-gray-700 aspect-square shadow-sm transition-transform active:scale-90 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 002.828 0L21 12M3 12l6.414-6.414a2 2 0 012.828 0L21 12" /></svg>
                </button>
            </div>
             <style>{`.animate-shake { animation: shake 0.5s; } @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } 40%, 60% { transform: translate3d(4px, 0, 0); } }`}</style>
        </div>
    );
};

export default PinLockScreen;
