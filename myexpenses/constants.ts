
import { Category } from './types';

// These are now empty because we want everything to be editable/deletable by the user
export const DEFAULT_CATEGORIES: Category[] = []; 
export const DEFAULT_RENT_SUB_CATEGORIES: string[] = []; 

// Used to populate the list for a brand new user
export const INITIAL_CATEGORIES: string[] = ['Food', 'Rent', 'Car', 'Medical', 'Personal', 'Store', 'Other'];
export const INITIAL_RENT_LOCATIONS: string[] = ['House', 'Store'];

export const BS_MONTHS: { [key: string]: string } = {
    '01': 'Baisakh', '02': 'Jestha', '03': 'Ashad', '04': 'Shrawan', '05': 'Bhadra',
    '06': 'Ashoj', '07': 'Kartik', '08': 'Mangsir', '09': 'Poush', '10': 'Magh',
    '11': 'Falgun', '12': 'Chaitra'
};
