
import React, { useState, useEffect, useCallback } from 'react';
import { Expense, Payer, Category } from '../types';
import { CATEGORIES } from '../constants';
import { adToBs, bsToAd, validateBSDate, getTodayBS } from '../services/dateConverter';
import ConfirmationModal from './ConfirmationModal';
import { GoogleGenAI, Type } from "@google/genai";

interface AddExpenseViewProps {
    onSaveExpense: (expense: Omit<Expense, 'id'> | Expense) => void;
    onBack: () => void;
    expenseToEdit?: Expense | null;
    onDeleteExpense?: (id: number) => void;
}

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
);

const AddExpenseView: React.FC<AddExpenseViewProps> = ({ onSaveExpense, onBack, expenseToEdit, onDeleteExpense }) => {
    const isEditing = !!expenseToEdit;

    const todayAD = new Date().toISOString().split('T')[0];
    const todayBS = getTodayBS();

    const [dateAD, setDateAD] = useState(todayAD);
    const [dateBS, setDateBS] = useState(todayBS);
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState<Category>('Food');
    const [payer, setPayer] = useState<Payer>('Husband');
    const [notes, setNotes] = useState('');
    const [photo, setPhoto] = useState<string>('');
    const [dateBSError, setDateBSError] = useState('');
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);


    useEffect(() => {
        if (expenseToEdit) {
            setDateAD(expenseToEdit.dateAD);
            setDateBS(expenseToEdit.date);
            setAmount(String(expenseToEdit.amount));
            setCategory(expenseToEdit.category);
            setPayer(expenseToEdit.payer);
            setNotes(expenseToEdit.notes);
            setPhoto(expenseToEdit.photo || '');
        } else {
            // Reset form for new entry
            setDateAD(todayAD);
            setDateBS(todayBS);
            setAmount('');
            setCategory('Food');
            setPayer('Husband');
            setNotes('');
            setPhoto('');
        }
    }, [expenseToEdit, todayAD, todayBS]);

    useEffect(() => {
        if (dateAD) {
            const newBsDate = adToBs(dateAD);
            setDateBS(newBsDate);
            setDateBSError('');
        }
    }, [dateAD]);

    const handleBsDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newBsDate = e.target.value;
        setDateBS(newBsDate);
        if (newBsDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [y, m, d] = newBsDate.split('-').map(Number);
            if (validateBSDate(y, m, d)) {
                const newAdDate = bsToAd(newBsDate);
                setDateAD(newAdDate);
                setDateBSError('');
            } else {
                setDateBSError('Invalid BS Date.');
            }
        } else if (newBsDate) {
            setDateBSError('Format: YYYY-MM-DD');
        }
    }, []);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setPhoto(event.target?.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSuggestCategory = async () => {
        if (!notes.trim()) {
            alert("Please enter some notes to suggest a category.");
            return;
        }
        setIsSuggesting(true);
        try {
            if (!process.env.API_KEY) {
                throw new Error("API_KEY environment variable not set.");
            }
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Based on the following expense note, suggest the most appropriate category. Expense Note: "${notes}"`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            category: {
                                type: Type.STRING,
                                enum: CATEGORIES,
                                description: "The single most likely expense category."
                            }
                        },
                        propertyOrdering: ["category"],
                    },
                },
            });

            const jsonText = response.text.trim();
            const result = JSON.parse(jsonText);
            
            if (result.category && CATEGORIES.includes(result.category)) {
                setCategory(result.category);
            } else {
                 alert("AI could not suggest a valid category. Please select one manually.");
            }

        } catch (error) {
            console.error("Error suggesting category:", error);
            alert("Could not get AI suggestion. Please check your API key and network connection.");
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!dateBS || !dateAD) {
             alert('Please enter a valid date.');
             return;
        }
        const dateParts = dateBS.split('-').map(Number);
        if(dateParts.length !== 3 || !validateBSDate(dateParts[0], dateParts[1], dateParts[2])) {
             alert('Please enter a valid BS date.');
             setDateBSError('Invalid BS Date.');
             return;
        }
        if (!amount || parseFloat(amount) <= 0) {
            alert('Please enter a valid amount.');
            return;
        }

        const expenseData = {
            date: dateBS,
            dateAD: dateAD,
            amount: parseFloat(amount),
            category,
            payer,
            notes,
            photo,
        };

        if (isEditing && expenseToEdit) {
            onSaveExpense({ ...expenseData, id: expenseToEdit.id });
        } else {
            onSaveExpense(expenseData);
        }
    };
    
    const confirmDelete = () => {
        if (expenseToEdit && onDeleteExpense) {
            onDeleteExpense(expenseToEdit.id);
        }
        setShowConfirmModal(false);
    };


    return (
        <div className="p-4 sm:p-6 pb-8">
            <h2 className="text-2xl font-bold text-center mb-6">{isEditing ? 'Edit Expense' : 'Add Expense'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-semibold mb-1">Date (AD)</label>
                        <input type="date" value={dateAD} onChange={e => setDateAD(e.target.value)} className="w-full p-3 rounded-lg border bg-light-card dark:bg-dark-card border-light-border dark:border-dark-border" />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-semibold mb-1">Date (BS)</label>
                        <input type="text" value={dateBS} onChange={handleBsDateChange} placeholder="YYYY-MM-DD" className={`w-full p-3 rounded-lg border bg-light-card dark:bg-dark-card border-light-border dark:border-dark-border ${dateBSError ? 'border-red-500' : ''}`} />
                        {dateBSError && <p className="text-red-500 text-xs mt-1">{dateBSError}</p>}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-semibold mb-1">Amount</label>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Rs.0.00" className="w-full p-3 rounded-lg border bg-light-card dark:bg-dark-card border-light-border dark:border-dark-border" />
                </div>
                <div>
                    <label className="block text-sm font-semibold mb-1">Category</label>
                    <select value={category} onChange={e => setCategory(e.target.value as Category)} className="w-full p-3 rounded-lg border bg-light-card dark:bg-dark-card border-light-border dark:border-dark-border">
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-semibold mb-2">Payer</label>
                    <div className="flex gap-4 justify-center">
                        <button type="button" onClick={() => setPayer('Husband')} className={`btn p-4 flex-1 max-w-[45%] rounded-lg bg-husband-light text-husband-light-text dark:bg-husband-dark dark:text-white ${payer === 'Husband' ? 'ring-2 ring-blue-500' : ''}`}>Husband</button>
                        <button type="button" onClick={() => setPayer('Wife')} className={`btn p-4 flex-1 max-w-[45%] rounded-lg bg-wife-light text-wife-light-text dark:bg-wife-dark dark:text-white ${payer === 'Wife' ? 'ring-2 ring-pink-500' : ''}`}>Wife</button>
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-semibold mb-1">Photo (Optional)</label>
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="w-full p-2 text-sm rounded-lg border bg-light-card dark:bg-dark-card border-light-border dark:border-dark-border file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/50 dark:file:text-blue-300" />
                </div>
                <div>
                    <label className="block text-sm font-semibold mb-1">Notes</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full p-3 rounded-lg border bg-light-card dark:bg-dark-card border-light-border dark:border-dark-border"></textarea>
                    <div className="flex justify-end mt-2">
                         <button type="button" onClick={handleSuggestCategory} disabled={!notes.trim() || isSuggesting} className="btn flex items-center justify-center px-3 py-2 text-xs font-semibold rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800/60 disabled:opacity-50 disabled:cursor-not-allowed">
                             {isSuggesting ? (
                                <>
                                 <SparklesIcon className="w-4 h-4 mr-1 animate-ping" />
                                 Suggesting...
                                </>
                             ) : (
                                <>
                                 <SparklesIcon className="w-4 h-4 mr-1" />
                                 Suggest Category
                                </>
                             )}
                         </button>
                    </div>
                </div>
                <div className="flex w-full justify-between items-center pt-4">
                    <div>
                        {isEditing && onDeleteExpense && (
                            <button
                                type="button"
                                onClick={() => setShowConfirmModal(true)}
                                className="btn bg-red-600 text-white hover:bg-red-700 rounded-lg py-3 px-6 text-lg font-bold shadow-lg transform hover:scale-105 transition-transform"
                            >
                                Delete
                            </button>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="btn bg-green-500 text-white hover:bg-green-600 rounded-lg py-3 px-6 text-lg font-bold shadow-lg transform hover:scale-105 transition-transform"
                    >
                        {isEditing ? 'Update Expense' : 'Save Expense'}
                    </button>
                </div>
            </form>
            {showConfirmModal && (
                <ConfirmationModal
                    title="Confirm Deletion"
                    message="Are you sure you want to delete this expense? This action is permanent."
                    onConfirm={confirmDelete}
                    onCancel={() => setShowConfirmModal(false)}
                    confirmText="Delete"
                />
            )}
        </div>
    );
};

export default AddExpenseView;
