import React from 'react';

export default function StatsGrid({ analytics }) {
    if (!analytics) return null;

    const stats = [
        { value: analytics.totalRegistrations, label: 'Total Registrations', icon: '📋', gradient: 'from-blue-600 to-blue-800' },
        { value: analytics.approvedRegistrations, label: 'Approved', icon: '✅', gradient: 'from-blue-500 to-indigo-700' },
        { value: analytics.pendingRegistrations, label: 'Pending Review', icon: '⏳', gradient: 'from-indigo-500 to-indigo-800' },
        { value: analytics.activeEvents, label: 'Active Events', icon: '🎯', gradient: 'from-indigo-600 to-blue-900' },
        { value: analytics.totalParticipants, label: 'Total Participants', icon: '👥', gradient: 'from-blue-700 to-indigo-900' },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {stats.map((stat, i) => (
                <div
                    key={i}
                    className={`bg-gradient-to-br ${stat.gradient} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-default`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl">{stat.icon}</span>
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                            <span className="text-lg font-bold">{stat.value}</span>
                        </div>
                    </div>
                    <div className="text-3xl font-bold mb-1">{stat.value}</div>
                    <p className="text-blue-100 text-sm font-medium">{stat.label}</p>
                </div>
            ))}
        </div>
    );
}
