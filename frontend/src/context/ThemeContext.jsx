import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    // Force theme to be always light as per user request
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        const root = document.documentElement;
        // Always remove dark class
        root.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }, []);

    const toggleTheme = () => {
        // Disabled theme toggling
        console.log('Theme toggling is disabled. Forced to Light mode.');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

export default ThemeContext;
