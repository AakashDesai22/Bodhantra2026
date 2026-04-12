import React, { useState, useEffect } from 'react';

const toastStyles = {
    container: {
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'none',
    },
};

let toastId = 0;
let addToastFn = null;

/**
 * Global toast function — call from anywhere:
 *   showToast('Member invited!', 'success')
 *   showToast('Something went wrong', 'error')
 */
export function showToast(message, variant = 'info', duration = 4000) {
    if (addToastFn) {
        addToastFn({ id: ++toastId, message, variant, duration });
    }
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        addToastFn = (toast) => {
            setToasts((prev) => [...prev, toast]);
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== toast.id));
            }, toast.duration);
        };
        return () => { addToastFn = null; };
    }, []);

    const variantClasses = {
        success: 'bg-emerald-600 border-emerald-400 text-white',
        error: 'bg-red-600 border-red-400 text-white',
        warning: 'bg-amber-500 border-amber-400 text-white',
        info: 'bg-sky-600 border-sky-400 text-white',
    };

    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ',
    };

    return (
        <>
            {children}
            <div style={toastStyles.container}>
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-2xl backdrop-blur-md animate-in slide-in-from-right-5 fade-in duration-300 ${variantClasses[toast.variant] || variantClasses.info}`}
                        style={{ minWidth: '280px', maxWidth: '420px' }}
                    >
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20 text-sm font-bold shrink-0">
                            {icons[toast.variant] || icons.info}
                        </span>
                        <span className="text-sm font-medium leading-snug">{toast.message}</span>
                    </div>
                ))}
            </div>
        </>
    );
}
