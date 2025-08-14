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
//
// Replace the placeholder string 'YOUR_GOOGLE_CLIENT_ID_HERE' below
// with the Client ID you obtained from the Google Cloud Console for your
// web application.
//
// Example:
// const GOOGLE_CLIENT_ID = '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com';
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
            window.google?.accounts.oauth2.revoke(accessToken, () => {});
        }
        localStorage.removeItem('user');
        driveService.reset();
        setAccessToken(null);
        setUser(GUEST_USER);
    }, [accessToken]);

    const handleCredentialResponse = useCallback(async (tokenResponse: any) => {
        setIsLoading(true);
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
            logout(); // Revert to guest on error
        } finally {
            setIsLoading(false);
        }
    }, [logout]);

    const loginWithGoogle = useCallback(() => {
        if (!isGsiLoaded) {
            console.warn("loginWithGoogle called, but Google Sign-In script is not ready.");
            return;
        }

        const client = window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: DRIVE_SCOPE,
            callback: handleCredentialResponse,
            error_callback: (error: any) => {
                if (error && error.type === 'popup_closed') {
                    console.log("GSI: Popup closed by user.");
                } else {
                    console.error("GSI Error:", error);
                }
            },
        });
        client.requestAccessToken({prompt: ''});
    }, [isGsiLoaded, handleCredentialResponse]);

    useEffect(() => {
        const interval = setInterval(() => { if (window.google) { setIsGsiLoaded(true); clearInterval(interval); } }, 100);
        return () => clearInterval(interval);
    }, []);

    // This effect runs ONCE on app load to check for an existing session.
    // It should not re-run on login/logout.
    useEffect(() => {
        if (!isGsiLoaded) return;

        const checkExistingSession = () => {
            setIsLoading(true);
            const storedUserJson = localStorage.getItem('user');
            
            if (storedUserJson) {
                try {
                    const storedUser = JSON.parse(storedUserJson);
                    
                    // Attempt to get a token silently.
                    const client = window.google.accounts.oauth2.initTokenClient({
                        client_id: GOOGLE_CLIENT_ID,
                        scope: DRIVE_SCOPE,
                        callback: (tokenResponse: any) => {
                            if (tokenResponse.access_token) {
                                setAccessToken(tokenResponse.access_token);
                                setUser(storedUser); // Only set user after getting a valid token
                            } else {
                                logout(); // Should be caught by error_callback, but as a fallback.
                            }
                            setIsLoading(false);
                        },
                        error_callback: () => {
                             // Silent auth failed. This is normal if session expired or it's the first time.
                             // Treat as logged out.
                             logout();
                             setIsLoading(false);
                        },
                    });
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
    // This dependency array ensures the effect runs only once when the Google script is ready.
    // It will not re-run on login/logout, preventing the bug.
    }, [isGsiLoaded]);
    

    return (
        <AuthContext.Provider value={{ 
            user, 
            isLoggedIn: !!user,
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