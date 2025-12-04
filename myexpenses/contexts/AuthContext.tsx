
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../types';
import * as driveService from '../services/driveService';


declare global {
    interface Window {
        google: any;
        gapi: any;
    }
}

// =========================================================================
// PASTE YOUR GOOGLE CLIENT ID HERE
// =========================================================================
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '266385479412-09k1otuud0o70kjo8n55lc0qempuuv0r.apps.googleusercontent.com';

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

interface AuthContextType {
    user: User | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    loginWithGoogle: () => void;
    logout: () => void;
    accessToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GUEST_USER: User = {
    id: 'guest_user',
    email: 'Guest',
    name: 'Guest',
    picture: '',
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGsiLoaded, setIsGsiLoaded] = useState(false);

    const logout = useCallback(() => {
        if (accessToken) {
            try {
                window.google?.accounts.oauth2.revoke(accessToken, () => {});
            } catch (e) { console.warn("Revoke failed", e); }
        }
        localStorage.removeItem('user');
        driveService.reset();
        setAccessToken(null);
        setUser(GUEST_USER);
    }, [accessToken]);

    const handleCredentialResponse = useCallback(async (tokenResponse: any) => {
        setIsLoading(true);
        if (tokenResponse && tokenResponse.access_token) {
            setAccessToken(tokenResponse.access_token);
            try {
                const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { 'Authorization': `Bearer ${tokenResponse.access_token}` }
                });
                if (!response.ok) throw new Error('Failed to fetch user info');
                const profile = await response.json();
                const currentUser: User = {
                    id: profile.sub,
                    email: profile.email,
                    name: profile.name,
                    picture: profile.picture,
                };
                localStorage.setItem('user', JSON.stringify(currentUser));
                setUser(currentUser);
            } catch (error) {
                console.error("Error fetching user profile:", error);
                alert("Failed to retrieve user profile. Please try again.");
                // We do NOT logout here automatically to allow retry, 
                // but if it's an initial login attempt, the user stays as they were.
            }
        }
        setIsLoading(false);
    }, []);

    const loginWithGoogle = useCallback(() => {
        if (!isGsiLoaded) {
            console.warn("loginWithGoogle called, but Google Sign-In script is not ready.");
            alert("Google Sign-In is still loading. Please wait a moment and try again.");
            return;
        }

        const client = window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: DRIVE_SCOPE,
            callback: handleCredentialResponse,
            error_callback: (error: any) => {
                console.error("GSI Error:", error);
                setIsLoading(false);
                if (error.type === 'popup_closed') {
                    // User closed popup, do nothing
                } else {
                    alert("Google Sign-In failed. Please check your network or browser settings (popups must be allowed).");
                }
            },
        });
        setIsLoading(true);
        // Force the popup to prompt usage
        client.requestAccessToken({prompt: 'consent'});
    }, [isGsiLoaded, handleCredentialResponse]);

    useEffect(() => {
        const interval = setInterval(() => { if (window.google) { setIsGsiLoaded(true); clearInterval(interval); } }, 100);
        return () => clearInterval(interval);
    }, []);

    // Session persistence logic
    useEffect(() => {
        if (!isGsiLoaded) return;

        const checkExistingSession = () => {
            const storedUserJson = localStorage.getItem('user');
            
            if (storedUserJson) {
                try {
                    const storedUser = JSON.parse(storedUserJson);
                    // OPTIMISTIC UPDATE: Set user immediately
                    setUser(storedUser); 
                    
                    // Attempt to get a token silently to confirm validity.
                    const client = window.google.accounts.oauth2.initTokenClient({
                        client_id: GOOGLE_CLIENT_ID,
                        scope: DRIVE_SCOPE,
                        callback: (tokenResponse: any) => {
                            if (tokenResponse.access_token) {
                                setAccessToken(tokenResponse.access_token);
                            } 
                            setIsLoading(false);
                        },
                        error_callback: (err: any) => {
                             // CRITICAL FIX: Do NOT logout if silent auth fails.
                             // Just means we need to re-auth for Drive access later.
                             console.warn("Silent auth failed (likely expired session). User stays logged in locally.", err);
                             setAccessToken(null); 
                             setIsLoading(false);
                        },
                    });
                    // prompt: 'none' attempts silent auth
                    client.requestAccessToken({ prompt: 'none' });
                    
                } catch (error) {
                     console.error("Corrupt user data in storage, logging out.", error);
                     logout();
                     setIsLoading(false);
                }
            } else {
                // No stored user, initialize as guest.
                setUser(GUEST_USER);
                setIsLoading(false);
            }
        };

        checkExistingSession();
    }, [isGsiLoaded, logout]);
    

    return (
        <AuthContext.Provider value={{ 
            user, 
            isLoggedIn: !!user && user.id !== 'guest_user',
            isLoading, 
            loginWithGoogle,
            logout,
            accessToken,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
