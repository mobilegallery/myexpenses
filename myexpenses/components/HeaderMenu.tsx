
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

// SVG Icons
const SunIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const MoonIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const KebabIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>;
const SyncIcon = ({ className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-3 text-gray-400 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5m-5 0a9 9 0 0014.95 3.95M20 20v-5h-5m5 0a9 9 0 00-14.95-3.95" /></svg>;


interface HeaderMenuProps {
    theme: 'light' | 'dark';
    onSetTheme: (theme: 'light' | 'dark') => void;
    onSync: () => Promise<void>;
    isSyncing: boolean;
    isSaving: boolean;
    onNavigateToSettings: () => void;
}

const HeaderMenu: React.FC<HeaderMenuProps> = ({ theme, onSetTheme, onSync, isSyncing, isSaving, onNavigateToSettings }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const { user, accessToken } = useAuth();
    const isGoogleUser = !!accessToken;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleThemeChange = (newTheme: 'light' | 'dark') => {
        onSetTheme(newTheme);
        setIsOpen(false);
    };
    
    const handleSync = () => {
        onSync();
        setIsOpen(false);
    }

    const handleNavigateSettings = () => {
        onNavigateToSettings();
        setIsOpen(false);
    }

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="p-1 rounded-full hover:bg-light-card-alt dark:hover:bg-dark-card transition-colors">
                 {user?.picture ? (
                    <img src={user.picture} alt="User" className="w-8 h-8 rounded-full" />
                ) : (
                    <KebabIcon />
                )}
            </button>
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-60 bg-light-card dark:bg-dark-card rounded-lg shadow-2xl border border-light-border dark:border-dark-border z-50 p-2">
                    {user && (
                         <div className="px-3 py-2 border-b border-light-border dark:border-dark-border mb-2">
                            <p className="font-semibold truncate text-light-text dark:text-dark-text">{user.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email || "Local Account"}</p>
                        </div>
                    )}
                    
                    <div className="p-1 bg-light-card-alt dark:bg-gray-700 rounded-md flex">
                        <button
                            onClick={() => handleThemeChange('light')}
                            className={`flex-1 flex items-center justify-center p-2 text-sm rounded ${theme === 'light' ? 'bg-blue-500 text-white' : 'text-light-text dark:text-gray-300'}`}
                        >
                            <SunIcon /> Light
                        </button>
                        <button
                            onClick={() => handleThemeChange('dark')}
                            className={`flex-1 flex items-center justify-center p-2 text-sm rounded ${theme === 'dark' ? 'bg-blue-500 text-white' : 'text-light-text dark:text-gray-300'}`}
                        >
                            <MoonIcon /> Dark
                        </button>
                    </div>

                    <div className="border-t border-light-border dark:border-dark-border my-2"></div>

                    {isGoogleUser && (
                        <button onClick={handleSync} disabled={isSyncing || isSaving} className="w-full flex items-center px-3 py-2 text-left text-sm text-light-text dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed">
                            <SyncIcon className={isSyncing ? 'animate-spin' : ''}/> Sync Now
                        </button>
                    )}
                     <button onClick={handleNavigateSettings} className="w-full flex items-center px-3 py-2 text-left text-sm text-light-text dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                        <SettingsIcon /> Settings
                    </button>
                </div>
            )}
        </div>
    );
};

export default HeaderMenu;
