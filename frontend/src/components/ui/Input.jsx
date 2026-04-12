import React from 'react';

export const Input = React.forwardRef(({ label, error, className = "", ...props }, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {label}
                </label>
            )}
            <input
                ref={ref}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors
          ${error
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-slate-300 dark:border-slate-600 focus:ring-primary focus:border-primary'
                    }
          bg-white dark:bg-slate-800 dark:text-white dark:placeholder-slate-400
          ${className}
        `}
                {...props}
            />
            {error && (
                <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';
