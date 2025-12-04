

export type Payer = 'Husband' | 'Wife';
// Changed to string to support dynamic categories
export type Category = string; 
export type View = 'dashboard' | 'add' | 'details' | 'settings';

export interface Expense {
    id: number;
    date: string; // BS Date YYYY-MM-DD
    dateAD: string; // AD Date YYYY-MM-DD
    amount: number;
    category: Category;
    subCategory?: string; // For Rent: 'House', 'Store', etc.
    payer: Payer;
    notes: string;
    photo?: string; // base64 string
    
    // Rent & Electricity specific fields
    rentAmount?: number;
    electricityReading?: number;
    electricityPrevReading?: number;
    electricityRate?: number;
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

export interface DriveData {
    expenses: Expense[];
    categories?: string[];
    rentLocations?: string[];
    lastUpdated?: number;
}
