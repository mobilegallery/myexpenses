

import { Expense, GDriveFile, DriveData } from '../types';

const DRIVE_DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const FILENAME = 'expenses_v2.json'; // Changed filename to avoid conflict with legacy array-only file if desired, or reuse.
// Reuse 'expenses.json' for simplicity but check structure.
const LEGACY_FILENAME = 'expenses.json';
const APP_DATA_FOLDER = 'appDataFolder';

// State for the service
let fileId: string | null = null;
let isGapiInitialized = false;

// Promisify gapi.load for async/await usage
const loadGapiClient = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (!window.gapi) {
            return reject(new Error("gapi not loaded"));
        }
        window.gapi.load('client', {
            callback: resolve,
            onerror: reject,
        });
    });
};

// Finds or creates the expenses file in the appDataFolder.
const findOrCreateFile = async (): Promise<string> => {
    // Search for the file in the appDataFolder
    let file: GDriveFile | undefined;
    try {
        const response = await window.gapi.client.drive.files.list({
            spaces: APP_DATA_FOLDER,
            fields: 'files(id, name)',
            q: `name='${LEGACY_FILENAME}' and trashed=false`,
        });
        file = response.result.files?.[0];
    } catch (err: any) {
        console.error("Google Drive API error during file search:", err.result?.error);
        throw new Error(`Error searching for data file: ${err.result?.error?.message}`);
    }

    if (file?.id) {
        return file.id;
    }

    // If not found, create the file
    try {
        const response = await window.gapi.client.drive.files.create({
            resource: {
                name: LEGACY_FILENAME,
                parents: [APP_DATA_FOLDER],
            },
            fields: 'id',
        });
        return response.result.id;
    } catch (err: any) {
        console.error("Google Drive API error during file creation:", err.result?.error);
        throw new Error(`Error creating data file: ${err.result?.error?.message}`);
    }
};

/**
 * Initializes the GAPI client and finds/creates the data file.
 * This must be called after login and before any other operation.
 */
export const init = async (token: string): Promise<void> => {
    if (!token) throw new Error("Initialization requires an access token.");
    if (fileId && isGapiInitialized) return; // Already initialized

    try {
        if (!isGapiInitialized) {
            await loadGapiClient();
            await window.gapi.client.init({
                discoveryDocs: [DRIVE_DISCOVERY_DOC],
            });
            isGapiInitialized = true;
        }
        
        // Set the token for the GAPI client for all subsequent requests
        window.gapi.client.setToken({ access_token: token });
        
        fileId = await findOrCreateFile();

    } catch (error) {
        console.error("Error initializing Drive service:", error);
        reset(); // Reset on failure
        throw error;
    }
};

/**
 * Retrieves data from the Google Drive file.
 * Handles both legacy (array) and new (object) formats.
 */
export const getDriveData = async (token: string): Promise<DriveData> => {
    if (!fileId) {
        await init(token);
    }
    if (!fileId) throw new Error("Drive service could not be initialized.");
    
    try {
        const response = await window.gapi.client.drive.files.get({
            fileId: fileId,
            alt: 'media',
        });
        
        if (typeof response.body === 'string' && response.body.length > 0) {
            const parsed = JSON.parse(response.body);
            // Check if it's legacy array format or new object format
            if (Array.isArray(parsed)) {
                return { expenses: parsed };
            } else {
                return parsed as DriveData;
            }
        }
        return { expenses: [] };
    } catch (err: any) {
        if (err.status === 404) {
             console.log("Expense file not found on drive, starting fresh.");
             return { expenses: [] };
        }
        console.error("Google Drive API error fetching file content:", err);
        throw new Error('Could not fetch expense data.');
    }
};

/**
 * Saves the provided data object to Google Drive.
 */
export const saveDriveData = async (token: string, data: DriveData): Promise<void> => {
     if (!fileId) {
        await init(token);
    }
    if (!fileId) throw new Error("Drive service could not be initialized for saving.");

    const content = JSON.stringify(data, null, 2);
    
    try {
        await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: content,
        });
    } catch (error) {
         console.error("Google Drive API error saving file:", error);
         throw new Error('Failed to save expenses.');
    }
};

/**
 * Legacy wrapper for backward compatibility if needed, though mostly unused now.
 */
export const getExpenses = async (token: string): Promise<Expense[]> => {
    const data = await getDriveData(token);
    return data.expenses;
}

export const saveExpenses = async (token: string, expenses: Expense[]): Promise<void> => {
    // This assumes we only want to save expenses and ignore categories. 
    // Prefer using saveDriveData in the app.
    await saveDriveData(token, { expenses });
}

export const reset = () => {
    fileId = null;
    isGapiInitialized = false;
    if (window.gapi && window.gapi.client) {
         window.gapi.client.setToken(null);
    }
};
