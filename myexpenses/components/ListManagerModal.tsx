
import React, { useState } from 'react';

interface ListManagerModalProps {
    title: string;
    items: string[]; // Custom items (editable)
    defaultItems: string[]; // Default items (locked/view-only)
    onClose: () => void;
    onAdd: (item: string) => void;
    onEdit: (oldName: string, newName: string) => void;
    onDelete: (item: string) => void;
}

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L14.732 3.732z" /></svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
);

const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
);

const ListManagerModal: React.FC<ListManagerModalProps> = ({ 
    title, 
    items, 
    defaultItems,
    onClose, 
    onAdd, 
    onEdit, 
    onDelete 
}) => {
    const [newItem, setNewItem] = useState('');
    const [editingItem, setEditingItem] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const handleAdd = () => {
        if (newItem.trim()) {
            // Prevent duplicates
            if (items.includes(newItem.trim()) || defaultItems.includes(newItem.trim())) {
                alert('Item already exists.');
                return;
            }
            onAdd(newItem.trim());
            setNewItem('');
        }
    };

    const startEdit = (item: string) => {
        setEditingItem(item);
        setEditValue(item);
    };

    const saveEdit = () => {
        if (editingItem && editValue.trim() && editValue !== editingItem) {
             if (items.includes(editValue.trim()) || defaultItems.includes(editValue.trim())) {
                alert('Item already exists.');
                return;
            }
            onEdit(editingItem, editValue.trim());
        }
        setEditingItem(null);
        setEditValue('');
    };

    const cancelEdit = () => {
        setEditingItem(null);
        setEditValue('');
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
            <div className="bg-light-card dark:bg-dark-card rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-light-border dark:border-dark-border flex justify-between items-center">
                    <h3 className="text-xl font-bold">{title}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"><XIcon /></button>
                </div>
                
                <div className="p-4 overflow-y-auto flex-1">
                    {/* Add New */}
                    <div className="flex gap-2 mb-6">
                        <input 
                            type="text" 
                            value={newItem}
                            onChange={(e) => setNewItem(e.target.value)}
                            placeholder="Add new..."
                            className="flex-1 p-2 rounded border bg-light-card-alt dark:bg-dark-bg border-light-border dark:border-dark-border"
                        />
                        <button onClick={handleAdd} disabled={!newItem.trim()} className="btn bg-blue-500 text-white px-4 rounded disabled:opacity-50">Add</button>
                    </div>

                    <div className="space-y-2">
                        {/* Custom Items */}
                        {items.map(item => (
                            <div key={item} className="flex items-center justify-between p-3 bg-light-card-alt dark:bg-dark-bg rounded border border-light-border dark:border-dark-border">
                                {editingItem === item ? (
                                    <div className="flex-1 flex gap-2 items-center">
                                        <input 
                                            type="text" 
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="flex-1 p-1 rounded border bg-white dark:bg-gray-800 border-blue-500"
                                            autoFocus
                                        />
                                        <button onClick={saveEdit} className="text-green-500 hover:text-green-600"><CheckIcon /></button>
                                        <button onClick={cancelEdit} className="text-red-500 hover:text-red-600"><XIcon /></button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="flex-1 truncate">{item}</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => startEdit(item)} className="text-blue-500 hover:text-blue-600 p-1"><EditIcon /></button>
                                            <button onClick={() => { if(window.confirm(`Delete "${item}"? Existing expenses will keep this category but it won't be selectable for new ones.`)) onDelete(item); }} className="text-red-500 hover:text-red-600 p-1"><TrashIcon /></button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}

                        {/* Default Items (Read Only) */}
                        {defaultItems.map(item => (
                            <div key={item} className="flex items-center justify-between p-3 opacity-60 bg-gray-100 dark:bg-gray-800 rounded border border-transparent">
                                <span className="flex-1 truncate">{item} <span className="text-xs italic ml-2">(Default)</span></span>
                                <div className="p-1 text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ListManagerModal;
