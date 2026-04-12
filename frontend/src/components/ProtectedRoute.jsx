import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * ProtectedRoute — guards routes by authentication and role.
 * 
 * @param {string|string[]} requiredRole - single role string or array of allowed roles
 *   e.g. requiredRole="admin" or requiredRole={['admin', 'member']}
 */
export default function ProtectedRoute({ children, requiredRole }) {
    const { user, isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Role check — supports string or array
    if (requiredRole) {
        const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        
        if (!allowedRoles.includes(user.role)) {
            return (
                <div className="min-h-[50vh] flex flex-col items-center justify-center text-slate-600">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                    <p className="text-slate-500 mb-4">You don't have permission to access this page.</p>
                    <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
                </div>
            );
        }
    }

    return children;
}
