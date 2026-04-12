import React, { useState, useEffect } from 'react';
import { api } from '@/api';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Terminal, Search, Calendar as CalendarIcon, Server, ShieldAlert } from 'lucide-react';

export default function AuditLogViewer() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);

    useEffect(() => {
        fetchLogs();
    }, [currentPage]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            let url = `/api/admin/logs?page=${currentPage}&limit=20&`;
            if (searchTerm) url += `search=${searchTerm}&`;
            if (startDate) url += `startDate=${startDate}&`;
            if (endDate) url += `endDate=${endDate}&`;

            const res = await api.get(url);
            setLogs(res.data.data || []);
            setTotalPages(res.data.totalPages || 1);
            setTotalLogs(res.data.totalLogs || 0);
        } catch (err) {
            console.error('Failed to fetch audit logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        if (currentPage === 1) {
            fetchLogs();
        } else {
            setCurrentPage(1);
        }
    };

    const handleClear = () => {
        setSearchTerm('');
        setStartDate('');
        setEndDate('');
        setLogs([]); // Optional visual reset
        setCurrentPage(1);
        setTimeout(fetchLogs, 50); // Small delay to ensure state clears before fetch
    };

    const formatDate = (dateString) => {
        const d = new Date(dateString);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour12: false });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Terminal className="text-emerald-500" />
                        System Logs
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Immutable audit trail of administrator and member actions.</p>
                </div>
            </div>

            <Card className="p-4 bg-slate-900 border-emerald-900/30">
                <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-xs font-mono text-emerald-500 mb-1 block">SEARCH_QUERY</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                            <Input 
                                placeholder="Filter by User or Action..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 bg-slate-950 border-slate-800 text-emerald-400 placeholder:text-slate-600 focus:border-emerald-500 font-mono"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-xs font-mono text-emerald-500 mb-1 block">START_DATE</label>
                        <Input 
                            type="date" 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-slate-950 border-slate-800 text-emerald-400 focus:border-emerald-500 font-mono"
                        />
                    </div>
                    
                    <div>
                        <label className="text-xs font-mono text-emerald-500 mb-1 block">END_DATE</label>
                        <Input 
                            type="date" 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-slate-950 border-slate-800 text-emerald-400 focus:border-emerald-500 font-mono"
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono rounded-lg">EXECUTE</Button>
                        <Button type="button" variant="outline" onClick={handleClear} className="border-slate-700 text-slate-400 hover:text-white font-mono bg-slate-800">CLEAR</Button>
                    </div>
                </form>
            </Card>

            <div className="bg-[#0a0f12] rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
                <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center gap-3">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                    </div>
                    <span className="text-xs font-mono text-slate-500">root@bodhantra-os:~ /var/log/audit</span>
                </div>
                
                <div className="p-4 overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center gap-3 text-emerald-500/70 font-mono p-4">
                            <span className="animate-pulse">_</span>
                            Loading remote vectors...
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex items-center gap-3 text-slate-500 font-mono p-4">
                            <Server className="h-4 w-4" />
                            No log entries match the provided parameters.
                        </div>
                    ) : (
                        <table className="w-full text-left font-mono text-[13px] whitespace-nowrap">
                            <thead>
                                <tr className="text-slate-500 border-b border-slate-800/50">
                                    <th className="font-normal py-2 px-4">[TIMESTAMP]</th>
                                    <th className="font-normal py-2 px-4">USER</th>
                                    <th className="font-normal py-2 px-4">ROLE</th>
                                    <th className="font-normal py-2 px-4">ACTION_VECTOR</th>
                                    <th className="font-normal py-2 px-4">TARGET_NODE</th>
                                    <th className="font-normal py-2 px-4 text-right">IP_ORIGIN</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/30">
                                {logs.map((log) => (
                                    <tr key={log.id} className="text-slate-300 hover:bg-slate-800/30 transition-colors group">
                                        <td className="py-2.5 px-4 text-slate-500 group-hover:text-amber-500/80 transition-colors">
                                            {formatDate(log.createdAt)}
                                        </td>
                                        <td className="py-2.5 px-4 text-emerald-400 font-bold">
                                            {log.userName}
                                        </td>
                                        <td className="py-2.5 px-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                                                log.userRole === 'admin' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-blue-500/20 text-blue-400'
                                            }`}>
                                                {log.userRole}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-4 text-white">
                                            {log.action}
                                        </td>
                                        <td className="py-2.5 px-4 text-cyan-400/80">
                                            {log.target}
                                        </td>
                                        <td className="py-2.5 px-4 text-right text-slate-600">
                                            {log.ipAddress || '::1'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                    <p className="text-sm text-slate-500 font-mono">
                        Showing page <span className="text-emerald-500 font-bold">{currentPage}</span> of <span className="text-emerald-500 font-bold">{totalPages}</span> (Total Logs: {totalLogs})
                    </p>
                    <div className="flex gap-2">
                        <Button 
                            type="button"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="bg-slate-900 border border-slate-800 text-emerald-500 hover:bg-slate-800 hover:border-emerald-500/50 font-mono disabled:opacity-50 disabled:cursor-not-allowed rounded"
                        >
                            PREV
                        </Button>
                        <Button 
                            type="button"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="bg-slate-900 border border-slate-800 text-emerald-500 hover:bg-slate-800 hover:border-emerald-500/50 font-mono disabled:opacity-50 disabled:cursor-not-allowed rounded"
                        >
                            NEXT
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
