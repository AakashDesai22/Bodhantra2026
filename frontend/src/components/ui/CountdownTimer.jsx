import React, { useState, useEffect } from 'react';

export default function CountdownTimer({ targetDate }) {
    const [timeLeft, setTimeLeft] = useState({
        days: '00',
        hours: '00',
        minutes: '00',
        seconds: '00',
        isExpired: false
    });

    useEffect(() => {
        if (!targetDate) return;

        const target = new Date(targetDate).getTime();

        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const difference = target - now;

            if (difference <= 0) {
                setTimeLeft(prev => ({ ...prev, isExpired: true }));
                return true; // Stop interval
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            setTimeLeft({
                days: days.toString().padStart(2, '0'),
                hours: hours.toString().padStart(2, '0'),
                minutes: minutes.toString().padStart(2, '0'),
                seconds: seconds.toString().padStart(2, '0'),
                isExpired: false
            });

            return false;
        };

        // Run once immediately
        if (calculateTimeLeft()) return;

        const interval = setInterval(() => {
            if (calculateTimeLeft()) clearInterval(interval);
        }, 1000);

        return () => clearInterval(interval);
    }, [targetDate]);

    if (!targetDate) return null;

    if (timeLeft.isExpired) {
        return (
            <div className="w-full flex items-center justify-center p-6 bg-white/10 dark:bg-black/30 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/10 animate-in fade-in zoom-in duration-500">
                <p className="text-2xl md:text-3xl font-extrabold text-white text-center">
                    The event has started! 🎉
                </p>
            </div>
        );
    }

    const timeBlocks = [
        { label: 'DAYS', value: timeLeft.days },
        { label: 'HOURS', value: timeLeft.hours },
        { label: 'MINUTES', value: timeLeft.minutes },
        { label: 'SECONDS', value: timeLeft.seconds },
    ];

    return (
        <div className="p-4 sm:p-6 md:p-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/10 shadow-2xl">
            <div className="grid grid-cols-4 gap-2 sm:gap-4 md:gap-6 w-full max-w-2xl mx-auto">
                {timeBlocks.map((block, i) => (
                    <div key={block.label} className="flex flex-col items-center justify-center">
                        <span className="text-2xl sm:text-4xl md:text-5xl font-bold text-white tabular-nums drop-shadow-md">
                            {block.value}
                        </span>
                        <span className="text-[9px] sm:text-xs md:text-sm uppercase tracking-wider text-slate-300 mt-1 sm:mt-2">
                            {block.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
