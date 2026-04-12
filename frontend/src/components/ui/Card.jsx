import React from 'react';

export const Card = ({ children, className = "" }) => (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden ${className}`}>
        {children}
    </div>
);

export const CardHeader = ({ title, subtitle, className = "" }) => (
    <div className={`px-6 py-5 border-b border-slate-100 dark:border-slate-700 ${className}`}>
        <h3 className="text-xl font-semibold text-slate-800 dark:text-white">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
    </div>
);

export const CardContent = ({ children, className = "" }) => (
    <div className={`p-6 ${className}`}>
        {children}
    </div>
);

export const CardFooter = ({ children, className = "" }) => (
    <div className={`px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex items-center ${className}`}>
        {children}
    </div>
);
