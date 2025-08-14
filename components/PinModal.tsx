
import React, { useState } from 'react';

interface PinModalProps {
    onClose: () => void;
    onSetPin: (pin: string) => void;
    isPinSet: boolean;
}

const PinModal: React.FC<PinModalProps> = ({ onClose, onSetPin, isPinSet }) => {
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');

    const handleSave = () => {
        setError('');
        if (!/^\d{4}$/.test(newPin)) {
            setError('PIN must be 4 digits.');
            return;
        }
        if (newPin !== confirmPin) {
            setError('PINs do not match.');
            return;
        }
        onSetPin(newPin);
        onClose();
    };

    const handlePinChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        if (val.length <= 4) {
            setter(val);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-light-card dark:bg-dark-card rounded-xl shadow-2xl p-6 w-full max-w-sm">
                <h3 className="text-xl font-bold mb-6 text-center">{isPinSet ? 'Change PIN' : 'Create PIN'}</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-gray-600 dark:text-gray-300 block mb-2" htmlFor="new-pin">New PIN</label>
                        <input
                            id="new-pin"
                            type="password"
                            inputMode="numeric"
                            value={newPin}
                            onChange={handlePinChange(setNewPin)}
                            placeholder="••••"
                            className="w-full p-3 text-center tracking-[0.5em] text-2xl rounded-lg border bg-light-card-alt dark:bg-dark-bg border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoComplete="new-password"
                        />
                    </div>
                     <div>
                        <label className="text-sm font-semibold text-gray-600 dark:text-gray-300 block mb-2" htmlFor="confirm-pin">Confirm PIN</label>
                        <input
                            id="confirm-pin"
                            type="password"
                            inputMode="numeric"
                            value={confirmPin}
                            onChange={handlePinChange(setConfirmPin)}
                            placeholder="••••"
                            className="w-full p-3 text-center tracking-[0.5em] text-2xl rounded-lg border bg-light-card-alt dark:bg-dark-bg border-light-border dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoComplete="new-password"
                        />
                    </div>
                </div>
                {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
                <div className="flex justify-around gap-4 mt-8">
                    <button onClick={onClose} className="btn flex-1 py-3 px-6 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 font-bold">Cancel</button>
                    <button onClick={handleSave} className="btn flex-1 py-3 px-6 rounded-lg bg-blue-500 text-white hover:bg-blue-600 font-bold">Save</button>
                </div>
            </div>
        </div>
    );
};

export default PinModal;
