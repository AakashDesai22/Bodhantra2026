import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  BarChart, Bar, 
  PieChart, Pie, Cell, 
  LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Download, Users, Target, TrendingUp, Presentation, Clock } from 'lucide-react';

export default function AnalyticsDashboard({ analytics }) {
    if (!analytics) return null;

    const { totals, trends, eventPopularity, demographics, pendingCount } = analytics;

    // Colors for charts
    const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4'];

    const downloadCSV = () => {
        // Simple CSV generation for totals and demographics
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Metric,Value\n";
        csvContent += `Total Participants,${totals?.totalParticipants || 0}\n`;
        csvContent += `Total Registrations,${totals?.totalRegistrations || 0}\n`;
        csvContent += `Active Events,${totals?.activeEvents || 0}\n\n`;

        csvContent += "Category/College,Count\n";
        demographics?.forEach(row => {
            csvContent += `"${row.name}",${row.value}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "bodhantra_analytics_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <TrendingUp className="text-primary" />
                        Engagement Analytics
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Real-time metrics on platform usage and event propagation.</p>
                </div>
                <Button onClick={downloadCSV} className="gap-2 shrink-0 shadow-md hover:shadow-lg transition-all border border-transparent hover:border-white/10">
                    <Download size={16} /> Export Report
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500 text-white rounded-xl shadow-inner shadow-white/20">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">Participants</p>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
                                {totals?.totalParticipants || 0}
                            </h3>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-transparent border-purple-500/20 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500 text-white rounded-xl shadow-inner shadow-white/20">
                            <Target size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">Total Registrations</p>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
                                {totals?.totalRegistrations || 0}
                            </h3>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500 text-white rounded-xl shadow-inner shadow-white/20">
                            <Presentation size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">Active Events</p>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
                                {totals?.activeEvents || 0}
                            </h3>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-500 text-white rounded-xl shadow-inner shadow-white/20">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">Pending Participants</p>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
                                {pendingCount ?? totals?.pendingRegistrations ?? 0}
                            </h3>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                {/* Registrations Per Event */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden group">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <BarChart className="text-blue-500" size={18} />
                            Registrations per Event
                        </h3>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="w-full h-80">
                            <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={eventPopularity} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
                                <XAxis dataKey="name" tick={{fill: '#64748b'}} tickLine={false} axisLine={{stroke: '#e2e8f0'}} />
                                <YAxis tick={{fill: '#64748b'}} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }}
                                    cursor={{fill: '#f1f5f9', opacity: 0.1}}
                                />
                                <Bar dataKey="count" fill="url(#colorUv)" radius={[6, 6, 0, 0]} maxBarSize={60}>
                                    {eventPopularity?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* College / Department Demographics */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <PieChart className="text-purple-500" size={18} />
                            Demographics Distribution
                        </h3>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="w-full h-80">
                            <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={demographics}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {demographics?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 gap-8 mt-8">
                {/* Registration Velocity */}
                <Card className="border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    <CardHeader className="border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <TrendingUp className="text-emerald-500" size={18} />
                            Registration Growth (30 Days)
                        </h3>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="w-full h-80">
                            <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trends} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                                <XAxis dataKey="date" tick={{fill: '#64748b'}} tickLine={false} axisLine={{stroke: '#e2e8f0'}} />
                                <YAxis tick={{fill: '#64748b'}} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }} />
                                <Line 
                                    type="monotone" 
                                    dataKey="count" 
                                    stroke="#10b981" 
                                    strokeWidth={4} 
                                    dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#fff' }} 
                                    activeDot={{ r: 8 }} 
                                />
                            </LineChart>
                        </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
