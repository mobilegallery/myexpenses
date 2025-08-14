
export type Payer = 'Husband' | 'Wife';
export type Category = 'Food' | 'Rent' | 'Car' | 'Medical' | 'Personal' | 'Store' | 'Other';
export type View = 'dashboard' | 'add' | 'details' | 'settings';

export interface Expense {
    id: number;
    date: string; // BS Date YYYY-MM-DD
    dateAD: string; // AD Date YYYY-MM-DD
    amount: number;
    category: Category;
    payer: Payer;
    notes: string;
    photo?: string; // base64 string
}

export interface User {
    id: string; // Google User ID
    email: string;
    name: string;
    picture: string; // URL to profile picture
}

export interface GDriveFile {
    kind: string;
    id: string;
    name: string;
    mimeType: string;
}