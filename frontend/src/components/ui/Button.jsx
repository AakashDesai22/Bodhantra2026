import React from 'react';

export const Button = ({ children, variant = "primary", className = "", ...props }) => {
    const baseStyle = "px-4 py-2 font-semibold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-primary text-white hover:bg-primary-dark focus:ring-primary",
        secondary: "bg-secondary text-slate-900 hover:bg-yellow-500 focus:ring-secondary",
        outline: "border-2 border-primary text-primary dark:border-blue-400 dark:text-blue-400 hover:bg-primary hover:text-white dark:hover:bg-blue-500 dark:hover:text-white focus:ring-primary",
        danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600",
    };

    return (
        <button
            className={`${baseStyle} ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
