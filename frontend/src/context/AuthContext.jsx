import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '@/api';

const AuthContext = createContext(null);

const AUTH_URL = `${API_URL}/api/auth`;

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // On mount, check localStorage for saved user data
    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                const parsed = JSON.parse(savedUser);
                setUser(parsed);
                axios.defaults.headers.common['Authorization'] = `Bearer ${parsed.token}`;
            } catch {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const res = await axios.post(`${AUTH_URL}/login`, { email, password });
        const userData = res.data;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', userData.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
        return userData;
    };

    const register = async (formData) => {
        const res = await axios.post(`${AUTH_URL}/register`, formData);
        const userData = res.data;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', userData.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
        return userData;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
    };

    const updateUserContext = (newDetails) => {
        const updatedUser = { ...user, ...newDetails };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    // ── Role helpers ──
    const isAdmin = user?.role === 'admin';
    const isMember = user?.role === 'member';
    const isStaff = isAdmin || isMember; // admin or member — can access dashboard
    const hasRole = (role) => {
        if (Array.isArray(role)) return role.includes(user?.role);
        return user?.role === role;
    };

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin,
        isMember,
        isStaff,
        hasRole,
        login,
        register,
        logout,
        updateUserContext,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
