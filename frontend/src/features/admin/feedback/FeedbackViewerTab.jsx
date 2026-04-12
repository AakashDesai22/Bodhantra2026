import React, { useState, useEffect } from 'react';
import { api } from '@/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Download, Eye, EyeOff, Trash, AlertTriangle, History, CheckCircle } from 'lucide-react';

export default function FeedbackViewerTab({ events }) {
    const [selectedEventId, setSelectedEventId] = useState('');
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sessionFilter, setSessionFilter] = useState('All');
    const [activeModal, setActiveModal] = useState(null);
    const [viewMode, setViewMode] = useState('active');
    
    // Moderation Modal States
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [resetModalOpen, setResetModalOpen] = useState(false);
    const [resetConfirmWord, setResetConfirmWord] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const activeEvent = events.find(e => e.id === parseInt(selectedEventId));
    // Determine dynamic questions
    const dynamicQuestions = activeEvent?.feedbackQuestions || [];

    useEffect(() => {
        if (selectedEventId) {
            fetchFeedback(selectedEventId);
        } else {
            setResponses([]);
        }
    }, [selectedEventId]);

    const fetchFeedback = async (id) => {
        setLoading(true);
        try {
            const res = await api.get(`/api/admin/events/${id}/feedback`);
            setResponses(res.data);
            setSessionFilter('All');
        } catch (err) {
            console.error('Failed to fetch feedback:', err);
        } finally {
            setLoading(false);
        }
    };

    const getAvailableSessions = () => {
        const set = new Set(responses.map(r => r.sessionName));
        return ['All', ...Array.from(set)];
    };

    const toggleVisibility = async (id) => {
        try {
            await api.patch(`/api/admin/feedback/${id}/toggle-visibility`);
            setResponses(responses.map(r => {
                if (r.id === id) return { ...r, isHidden: !r.isHidden };
                return r;
            }));
        } catch (err) {
            console.error('Failed to toggle visibility:', err);
            alert('Failed to update visibility');
        }
    };

    const confirmDeleteFeedback = async () => {
        if (!deleteConfirmId) return;
        try {
            setIsDeleting(true);
            await api.delete(`/api/admin/feedback/${deleteConfirmId}`);
            setResponses(responses.filter(r => r.id !== deleteConfirmId));
            setDeleteConfirmId(null);
        } catch (err) {
            console.error('Failed to delete feedback:', err);
            alert('Failed to delete feedback');
        } finally {
            setIsDeleting(false);
        }
    };

    const confirmResetFeedback = async () => {
        if (resetConfirmWord !== 'RESET' || !selectedEventId) return;
        try {
            setIsDeleting(true);
            let url = `/api/admin/events/${selectedEventId}/feedback/reset`;
            if (sessionFilter && sessionFilter !== 'All') {
                url += `?sessionName=${encodeURIComponent(sessionFilter)}`;
            }
            await api.delete(url);
            
            // Re-fetch after reset
            await fetchFeedback(selectedEventId);
            setResetModalOpen(false);
            setResetConfirmWord('');
        } catch (err) {
            console.error('Failed to reset feedback:', err);
            alert('Failed to reset feedback');
        } finally {
            setIsDeleting(false);
        }
    };

    // Calculate Data Subsets
    const sessionResponses = sessionFilter === 'All' 
        ? responses 
        : responses.filter(r => r.sessionName === sessionFilter);

    const filteredResponses = viewMode === 'archive'
        ? sessionResponses.filter(r => r.isHidden)
        : sessionResponses.filter(r => !r.isHidden);

    const renderStars = (rating) => {
        return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
    };

    const handleExportCSV = () => {
        if (filteredResponses.length === 0) return;

        // Base Headers
        const headers = ['Participant Name', 'Unique ID', 'Session', 'Rating'];
        
        // Add Dynamic Question Headers
        dynamicQuestions.forEach(q => headers.push(q.question));

        // Rows
        const rows = filteredResponses.map(r => {
            const row = [
                r.User?.name || 'Unknown',
                r.User?.unique_id || 'N/A',
                r.sessionName,
                r.rating
            ];

            // Resolve Dynamic Maps
            dynamicQuestions.forEach(q => {
                let answer = r.answers?.[q.id] || '';
                // If checkbox array, join with comma
                if (Array.isArray(answer)) {
                    answer = answer.join('; ');
                }
                // Escape quotes for CSV
                row.push(`"${String(answer).replace(/"/g, '""')}"`);
            });

            return row.join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `feedback_export_${activeEvent?.name}_${sessionFilter}_${viewMode}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="flex-1 w-full max-w-sm">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Event</label>
                    <select
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none text-slate-800 dark:text-slate-200 shadow-sm"
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                    >
                        <option value="">-- Choose Event --</option>
                        {events.map(ev => (
                            <option key={ev.id} value={ev.id}>{ev.name}</option>
                        ))}
                    </select>
                </div>
                
                {selectedEventId && (
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center shadow-inner h-12">
                            <button
                                onClick={() => setViewMode('active')}
                                className={`px-4 h-full rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${viewMode === 'active' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <CheckCircle size={16} /> Active
                            </button>
                            <button
                                onClick={() => setViewMode('archive')}
                                className={`px-4 h-full rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${viewMode === 'archive' ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <History size={16} /> Archive
                            </button>
                        </div>
                        <div>
                            <select
                                className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none text-slate-800 dark:text-slate-200 shadow-sm h-12"
                                value={sessionFilter}
                                onChange={(e) => setSessionFilter(e.target.value)}
                            >
                                {getAvailableSessions().map(s => (
                                    <option key={s} value={s}>{s === 'All' ? 'All Sessions' : s}</option>
                                ))}
                            </select>
                        </div>
                        <Button 
                            onClick={handleExportCSV} 
                            disabled={filteredResponses.length === 0}
                            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 h-12 shadow-lg shadow-green-600/20"
                        >
                            <Download size={18} /> Export CSV
                        </Button>
                    </div>
                )}
            </div>

            {loading ? (
                 <div className="py-20 text-center animate-pulse duration-700">
                    <span className="text-xl">Loading responses...</span>
                 </div>
            ) : selectedEventId && filteredResponses.length === 0 ? (
                <Card className="border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <CardContent className="py-16 text-center text-slate-500">
                        <span className="text-4xl block mb-2">{viewMode === 'archive' ? '🗄️' : '📭'}</span>
                        No {viewMode} feedback responses found for this filter.
                    </CardContent>
                </Card>
            ) : selectedEventId ? (
                <Card className="border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm">
                                    <th className="p-4 font-semibold uppercase tracking-wider">Participant Name</th>
                                    <th className="p-4 font-semibold uppercase tracking-wider">ID</th>
                                    <th className="p-4 font-semibold uppercase tracking-wider">Session</th>
                                    <th className="p-4 font-semibold uppercase tracking-wider">Rating</th>
                                    <th className="p-4 font-semibold uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {filteredResponses.map(resp => (
                                    <tr key={resp.id} className={`transition-colors ${resp.isHidden ? 'bg-amber-50/30 dark:bg-amber-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}>
                                        <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{resp.User?.name}</td>
                                        <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-sm">{resp.User?.unique_id}</td>
                                        <td className="p-4">
                                            <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold">
                                                {resp.sessionName}
                                            </span>
                                        </td>
                                        <td className="p-4 tracking-widest text-[#FFB800]">{renderStars(resp.rating)}</td>
                                        <td className="p-4 text-right flex justify-end gap-2">
                                            <Button size="sm" variant="outline" onClick={() => setActiveModal(resp)}>Read</Button>
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                className={resp.isHidden ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-700'}
                                                onClick={() => toggleVisibility(resp.id)}
                                                title={resp.isHidden ? "Unhide Response" : "Hide Response"}
                                            >
                                                {resp.isHidden ? <Eye size={18} /> : <EyeOff size={18} />}
                                            </Button>
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                onClick={() => setDeleteConfirmId(resp.id)}
                                                title="Delete Permanently"
                                            >
                                                <Trash size={18} />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            ) : null}

            {/* DANGER ZONE */}
            {selectedEventId && (
                <div className="mt-12 rounded-xl border-2 border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10 p-6">
                    <div className="flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
                        <div>
                            <h4 className="flex items-center gap-2 font-bold text-red-600 dark:text-red-400 text-lg mb-1">
                                <AlertTriangle size={20} /> Danger Zone
                            </h4>
                            <p className="text-sm text-red-500/80 dark:text-red-400/80">
                                Irreversibly delete all feedback data for the selected event {sessionFilter !== 'All' ? `and session: ${sessionFilter}` : 'across all sessions'}.
                            </p>
                        </div>
                        <Button 
                            variant="destructive"
                            onClick={() => setResetModalOpen(true)}
                            className="bg-red-600 hover:bg-red-700 text-white min-w-max shadow-lg shadow-red-600/20"
                        >
                            Reset Feedback Data
                        </Button>
                    </div>
                </div>
            )}

            {/* Response Detail Modal */}
            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveModal(null)}></div>
                    <div className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl max-w-xl w-full max-h-[80vh] overflow-y-auto w-full animate-in zoom-in-95">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800 dark:text-white capitalize leading-tight flex items-center gap-3">
                                    {activeModal.User?.name}'s Feedback
                                    {activeModal.isHidden && <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">Hidden</span>}
                                </h3>
                                <p className="text-slate-500 text-sm mt-1">{activeModal.sessionName} • {new Date(activeModal.createdAt).toLocaleString()}</p>
                            </div>
                            <div className="text-3xl text-amber-400">{renderStars(activeModal.rating)}</div>
                        </div>

                        <div className="space-y-5">
                            {dynamicQuestions.length === 0 ? (
                                <p className="text-slate-500 italic">No custom questions were asked.</p>
                            ) : (
                                dynamicQuestions.map(q => {
                                    let raw = activeModal.answers?.[q.id];
                                    if (Array.isArray(raw)) raw = raw.join(', ');
                                    const isEmpty = !raw || String(raw).trim() === '';
                                    return (
                                        <div key={q.id} className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                            <label className="block text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">{q.question}</label>
                                            <p className={`text-base ${isEmpty ? 'text-slate-400 italic' : 'text-slate-800 dark:text-slate-200'}`}>
                                                {isEmpty ? 'No response provided.' : raw}
                                            </p>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="mt-8 flex justify-end">
                            <Button onClick={() => setActiveModal(null)} className="w-full sm:w-auto">Close panel</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Single Delete Confirm Modal */}
            {deleteConfirmId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isDeleting && setDeleteConfirmId(null)}></div>
                    <div className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl max-w-md w-full animate-in zoom-in-95 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Delete Permanently?</h3>
                        <p className="text-slate-500 mb-8">This action cannot be undone. The feedback entry will be permanently removed.</p>
                        <div className="flex gap-4">
                            <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirmId(null)} disabled={isDeleting}>Cancel</Button>
                            <Button variant="destructive" className="flex-1" onClick={confirmDeleteFeedback} disabled={isDeleting}>
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset All Confirm Modal */}
            {resetModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isDeleting && setResetModalOpen(false)}></div>
                    <div className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl max-w-md w-full animate-in zoom-in-95">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center shrink-0">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Perform Global Reset</h3>
                                <p className="text-sm text-red-500 font-medium mt-1">This action is irreversible.</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-6 text-sm text-slate-600 dark:text-slate-300">
                            You are about to permanently delete <strong>ALL</strong> feedback associated with <strong className="text-slate-800 dark:text-white">{activeEvent?.name}</strong> {sessionFilter !== 'All' ? `in the session "${sessionFilter}"` : 'across all sessions'}.
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                Type <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-red-500">RESET</span> to confirm
                            </label>
                            <input 
                                type="text"
                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500 outline-none uppercase font-mono tracking-widest text-center"
                                placeholder="RESET"
                                value={resetConfirmWord}
                                onChange={(e) => setResetConfirmWord(e.target.value.toUpperCase())}
                                disabled={isDeleting}
                            />
                        </div>

                        <div className="flex gap-4">
                            <Button variant="outline" className="flex-1" onClick={() => setResetModalOpen(false)} disabled={isDeleting}>Cancel</Button>
                            <Button 
                                variant="destructive" 
                                className="flex-1" 
                                onClick={confirmResetFeedback} 
                                disabled={isDeleting || resetConfirmWord !== 'RESET'}
                            >
                                {isDeleting ? 'Resetting...' : 'Confirm Reset'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
