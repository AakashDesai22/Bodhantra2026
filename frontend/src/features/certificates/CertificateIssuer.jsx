import React, { useState, useEffect } from 'react';
import { api } from '@/api';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Send, CheckCircle, AlertCircle, Users, Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';

export default function CertificateIssuer({ event, onIssued }) {
    const [registrations, setRegistrations] = useState([]);
    const [selected, setSelected] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [issuing, setIssuing] = useState(false);
    const [result, setResult] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (event?.id) fetchParticipants();
    }, [event?.id]);

    const fetchParticipants = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/admin/registrations?event_id=${event.id}`);
            // Show only approved participants
            const approved = res.data.filter(r => r.status === 'approved');
            setRegistrations(approved);
        } catch (err) {
            console.error('Failed to fetch participants:', err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = registrations.filter(r => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            r.User?.name?.toLowerCase().includes(q) ||
            r.User?.email?.toLowerCase().includes(q) ||
            r.User?.unique_id?.toLowerCase().includes(q)
        );
    });

    const toggleSelect = (id) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selected.size === filtered.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(filtered.map(r => r.id)));
        }
    };

    const handleIssue = async () => {
        if (selected.size === 0) return;
        setIssuing(true);
        setResult(null);
        try {
            const res = await api.post(`/api/admin/events/${event.id}/issue-certificates`, {
                registrationIds: Array.from(selected),
            });
            setResult({ type: 'success', message: res.data.message });
            setSelected(new Set());
            fetchParticipants();
            if (onIssued) onIssued();
        } catch (err) {
            setResult({ type: 'error', message: err.response?.data?.message || 'Failed to issue certificates' });
        } finally {
            setIssuing(false);
        }
    };

    const issuedCount = registrations.filter(r => r.isCertificateIssued).length;
    const pendingCount = registrations.length - issuedCount;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-3 border-primary border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 text-center">
                    <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{registrations.length}</p>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Approved</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 text-center">
                    <p className="text-2xl font-extrabold text-green-600">{issuedCount}</p>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Issued</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 text-center">
                    <p className="text-2xl font-extrabold text-amber-500">{pendingCount}</p>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1">Pending</p>
                </div>
            </div>

            {/* Result Toast */}
            {result && (
                <div className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-medium ${
                    result.type === 'success'
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                        : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                }`}>
                    {result.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    {result.message}
                </div>
            )}

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="relative flex-1 w-full sm:max-w-xs">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search participants..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                </div>
                <Button
                    onClick={handleIssue}
                    disabled={selected.size === 0 || issuing}
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:shadow-none"
                >
                    {issuing ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Issuing...
                        </>
                    ) : (
                        <>
                            <Send size={16} />
                            Issue Certificates ({selected.size})
                        </>
                    )}
                </Button>
            </div>

            {/* Participant Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                <th className="px-4 py-3 text-left">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={filtered.length > 0 && selected.size === filtered.length}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 accent-primary rounded"
                                        />
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">All</span>
                                    </label>
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Participant</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden sm:table-cell">Email</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">ID</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {filtered.map(reg => (
                                <tr
                                    key={reg.id}
                                    onClick={() => toggleSelect(reg.id)}
                                    className={`cursor-pointer transition-colors ${
                                        selected.has(reg.id)
                                            ? 'bg-blue-50/50 dark:bg-blue-900/10'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                                    }`}
                                >
                                    <td className="px-4 py-3.5">
                                        <input
                                            type="checkbox"
                                            checked={selected.has(reg.id)}
                                            onChange={() => toggleSelect(reg.id)}
                                            className="w-4 h-4 accent-primary rounded"
                                        />
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{reg.User?.name}</p>
                                    </td>
                                    <td className="px-4 py-3.5 hidden sm:table-cell">
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{reg.User?.email}</p>
                                    </td>
                                    <td className="px-4 py-3.5 hidden md:table-cell">
                                        <span className="text-xs font-mono font-bold text-primary">{reg.User?.unique_id || '—'}</span>
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        {reg.isCertificateIssued ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                                                <CheckCircle size={12} /> Issued
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                                Pending
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-400 dark:text-slate-500">
                                        {registrations.length === 0 ? 'No approved participants yet.' : 'No results found.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
