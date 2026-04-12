import React, { useState, useEffect } from 'react';
import { api } from '@/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AlertTriangle, Mail, Check, X, QrCode, Trash2, Search, Download, UserPlus } from 'lucide-react';
import ParticipantDetailModal from './ParticipantDetailModal';

export default function ParticipantList({ events, readOnly = false }) {
    const [registrations, setRegistrations] = useState([]);
    const [filterEventId, setFilterEventId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEmails, setSelectedEmails] = useState([]);
    const [selectedRegId, setSelectedRegId] = useState(null);
    const [actionModal, setActionModal] = useState({ isOpen: false, type: null, payload: null });
    const [templateSelection, setTemplateSelection] = useState({ templateId: 'paymentApproved', customBody: '', subject: '' });
    const [editParticipant, setEditParticipant] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', phone: '', prn: '', college: '', year: '' });
    const [showManualAdd, setShowManualAdd] = useState(false);
    const [manualForm, setManualForm] = useState({ name: '', email: '', phone: '', prn: '', college: '', year: '', event_id: '' });
    const [manualLoading, setManualLoading] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, userId: null, confirmText: '' });

    useEffect(() => {
        fetchRegistrations();
    }, [filterEventId, searchQuery]);

    const fetchRegistrations = async () => {
        try {
            const params = new URLSearchParams();
            if (filterEventId) params.append('event_id', filterEventId);
            if (searchQuery) params.append('search', searchQuery);
            const res = await api.get(`/api/admin/registrations?${params.toString()}`);
            setRegistrations(res.data);
        } catch (err) { console.error(err); }
    };

    const updateRegStatus = async (id, status) => {
        try {
            await api.patch(`/api/admin/registrations/${id}/status`, { status });
            fetchRegistrations();
        } catch (err) { console.error(err); }
    };

    const resendQR = async (id) => {
        try {
            await api.patch(`/api/admin/registrations/${id}/resend-qr`);
            alert('QR Code resent successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to resend QR');
        }
    };

    const handleActionClick = (type, payload) => {
        const templates = {
            approve: 'paymentApproved',
            attendance: 'checkInSuccess',
            bulk: 'generalAnnouncement',
            resendQR: 'resendQR',
            reject: 'paymentRejected'
        };
        setTemplateSelection({ templateId: templates[type] || 'customMessage', customBody: '', subject: '' });
        setActionModal({ isOpen: true, type, payload });
    };

    const confirmAction = async () => {
        const { type, payload } = actionModal;
        const { templateId, customBody, subject } = templateSelection;
        const submitData = { templateId, customBody, subject };

        try {
            if (type === 'approve') {
                await api.patch(`/api/admin/registrations/${payload.id}/status`, { status: 'approved', ...submitData });
                fetchRegistrations();
            } else if (type === 'reject') {
                await api.patch(`/api/admin/registrations/${payload.id}/status`, { status: 'rejected', ...submitData });
                fetchRegistrations();
            } else if (type === 'attendance') {
                await api.patch(`/api/admin/registrations/${payload.id}/attendance`, submitData);
                fetchRegistrations();
            } else if (type === 'bulk') {
                await api.post('/api/email/send-bulk', { emails: selectedEmails, ...submitData });
                setSelectedEmails([]);
                alert("Bulk emails initiated.");
            }
            setActionModal({ isOpen: false, type: null, payload: null });
        } catch(err) { console.error(err); }
    };

    const handleManualAdd = async (e) => {
        e.preventDefault();
        setManualLoading(true);
        try {
            await api.post('/api/admin/manual-add-participant', manualForm);
            setShowManualAdd(false);
            setManualForm({ name: '', email: '', phone: '', prn: '', college: '', year: '', event_id: '' });
            fetchRegistrations();
            alert('Participant added successfully!');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add participant');
        } finally {
            setManualLoading(false);
        }
    };

    const handleDeleteParticipant = async () => {
        if (deleteModal.confirmText !== 'DELETE') return;
        try {
            await api.delete(`/api/admin/participant/${deleteModal.userId}`, { data: { confirm: 'DELETE' } });
            setDeleteModal({ isOpen: false, userId: null, confirmText: '' });
            fetchRegistrations();
        } catch (err) {
            alert(err.response?.data?.message || 'Delete failed');
        }
    };

    const exportToCSV = () => {
        if (registrations.length === 0) return;
        const headers = ['ID', 'Event', 'Name', 'Email', 'Phone', 'College', 'Payment', 'Status'];
        const csv = [headers.join(','), ...registrations.map(r => [r.id, r.Event?.name, r.User?.name, r.User?.email, r.User?.phone, r.User?.college, r.payment_method, r.status].join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'participants.csv';
        a.click();
    };

    const toggleEmailSelect = (email) => {
        setSelectedEmails(prev => prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]);
    };

    const toggleAllEmails = () => {
        const eligible = registrations.map(r => r.User?.email).filter(Boolean);
        setSelectedEmails(selectedEmails.length === eligible.length ? [] : eligible);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex flex-wrap gap-3 items-center">
                    <select
                        value={filterEventId}
                        onChange={(e) => setFilterEventId(e.target.value)}
                        className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="">All Events</option>
                        {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                    {!readOnly && (
                        <Button variant="outline" onClick={() => setShowManualAdd(true)} className="gap-2">
                            <UserPlus size={16} /> Manual Add
                        </Button>
                    )}
                    <Button variant="outline" onClick={exportToCSV} className="gap-2">
                        <Download size={16} /> Export
                    </Button>
                </div>
                
                <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-grow sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search participants..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>
            </div>

            {!readOnly && selectedEmails.length > 0 && (
                <div className="flex items-center justify-between bg-primary/5 border border-primary/10 p-4 rounded-xl">
                    <p className="text-sm font-medium text-primary">{selectedEmails.length} participants selected</p>
                    <Button onClick={() => handleActionClick('bulk')} size="sm" className="gap-2">
                        <Mail size={16} /> Send Email
                    </Button>
                </div>
            )}

            <Card className="overflow-hidden border-slate-100 dark:border-slate-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                            <tr>
                                <th className="p-4">{!readOnly && <input type="checkbox" onChange={toggleAllEmails} checked={registrations.length > 0 && selectedEmails.length === registrations.filter(r => r.User?.email).length} className="rounded border-slate-300" />}</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Participant</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Event</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {registrations.length === 0 ? (
                                <tr><td colSpan="5" className="p-10 text-center text-slate-400">No participants found.</td></tr>
                            ) : (
                                registrations.map(reg => (
                                    <tr key={reg.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                                        <td className="p-4">{!readOnly && <input type="checkbox" checked={selectedEmails.includes(reg.User?.email)} onChange={() => toggleEmailSelect(reg.User?.email)} className="rounded border-slate-300" />}</td>
                                        <td className="p-4">
                                            <button 
                                                onClick={() => setSelectedRegId(reg.id)}
                                                className="text-left group"
                                            >
                                                <div className="font-semibold text-slate-800 dark:text-white group-hover:text-primary transition-colors">{reg.User?.name}</div>
                                                <div className="text-xs text-slate-500 group-hover:text-slate-400">{reg.User?.email}</div>
                                            </button>
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{reg.Event?.name}</td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                reg.status === 'approved' ? 'bg-green-100 text-green-700' : 
                                                reg.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {reg.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {!readOnly ? (
                                                <div className="flex gap-2 justify-end">
                                                    {reg.status === 'pending' && (
                                                        <>
                                                            <button onClick={() => handleActionClick('approve', { id: reg.id })} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Approve"><Check size={18} /></button>
                                                            <button onClick={() => handleActionClick('reject', { id: reg.id })} className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors" title="Reject"><X size={18} /></button>
                                                        </>
                                                    )}
                                                    {reg.status === 'approved' && (
                                                        <button onClick={() => resendQR(reg.id)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors" title="Resend QR Code Pass"><Mail size={18} /></button>
                                                    )}
                                                    <button onClick={() => handleActionClick('attendance', { id: reg.id })} className={`p-2 rounded-lg transition-colors ${reg.attendance ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:bg-slate-100'}`} title="Mark Attendance"><QrCode size={18} /></button>
                                                    <button onClick={() => setDeleteModal({ isOpen: true, userId: reg.User?.id, confirmText: '' })} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 size={18} /></button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">View Only</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modals - Simplified for the break-out */}
            {actionModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setActionModal({ isOpen: false, type: null, payload: null })}></div>
                    <div className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl max-w-lg w-full">
                        <h3 className="text-2xl font-bold mb-4">
                            {actionModal.type === 'bulk' ? 'Send Bulk Email' : 
                             actionModal.type === 'reject' ? 'Reject Participant' : 'Confirm Action'}
                        </h3>
                        <div className="space-y-4">
                            <select 
                                value={templateSelection.templateId} 
                                onChange={e => setTemplateSelection({...templateSelection, templateId: e.target.value})}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                            >
                                <option value="paymentApproved">Payment Confirmation (Pass Included)</option>
                                <option value="paymentRejected">Payment Rejected (Requires Reason)</option>
                                <option value="generalAnnouncement">General Announcement / Bulk</option>
                                <option value="eventFeedback">Event Feedback (Post-Event)</option>
                                <option value="checkInSuccess">Check-in Success Welcome</option>
                                <option value="customMessage">Custom/Blank Message</option>
                            </select>

                            {/* Show Subject if Announcement or Custom */}
                            {(templateSelection.templateId === 'generalAnnouncement' || templateSelection.templateId === 'customMessage') && (
                                <Input 
                                    label="Email Subject" 
                                    placeholder="Enter subject line..." 
                                    value={templateSelection.subject}
                                    onChange={e => setTemplateSelection({...templateSelection, subject: e.target.value})}
                                />
                            )}

                            {/* Show Textarea for Body or Reason */}
                            {(templateSelection.templateId === 'customMessage' || templateSelection.templateId === 'generalAnnouncement' || templateSelection.templateId === 'paymentRejected' || templateSelection.templateId === 'eventFeedback') && (
                                <div className="w-full">
                                    <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                                        {templateSelection.templateId === 'paymentRejected' ? 'Rejection Reason (Sent to Participant) *' : 
                                         templateSelection.templateId === 'eventFeedback' ? 'Feedback Form URL (Google Forms etc)' : 'Message Body'}
                                    </label>
                                    <textarea 
                                        placeholder={templateSelection.templateId === 'paymentRejected' ? "e.g., Transaction ID mismatch, please re-upload." : "Type out the markdown/HTML contents..."} 
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none h-32 text-sm"
                                        value={templateSelection.customBody}
                                        onChange={e => setTemplateSelection({...templateSelection, customBody: e.target.value})}
                                        required={templateSelection.templateId === 'paymentRejected'}
                                    />
                                </div>
                            )}
                            <div className="flex gap-4 pt-4">
                                <Button variant="outline" onClick={() => setActionModal({ isOpen: false, type: null, payload: null })} className="flex-1">Cancel</Button>
                                <Button onClick={confirmAction} className="flex-1">Send Email</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showManualAdd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowManualAdd(false)}></div>
                    <div className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl max-w-xl w-full">
                        <h3 className="text-2xl font-bold mb-6">Manual Add Participant</h3>
                        <form onSubmit={handleManualAdd} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Name" required value={manualForm.name} onChange={e => setManualForm({...manualForm, name: e.target.value})} />
                                <Input label="Email" required type="email" value={manualForm.email} onChange={e => setManualForm({...manualForm, email: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Phone" required value={manualForm.phone} onChange={e => setManualForm({...manualForm, phone: e.target.value})} />
                                <select 
                                    required 
                                    value={manualForm.event_id} 
                                    onChange={e => setManualForm({...manualForm, event_id: e.target.value})}
                                    className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                                >
                                    <option value="">Select Event</option>
                                    {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                </select>
                            </div>
                            <Button type="submit" fullWidth disabled={manualLoading} className="mt-4">
                                {manualLoading ? 'Processing...' : 'Add Participant'}
                            </Button>
                        </form>
                    </div>
                </div>
            )}

            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteModal({ isOpen: false, userId: null, confirmText: '' })}></div>
                    <div className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl max-w-md w-full text-center">
                        <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
                        <h3 className="text-2xl font-bold mb-2">Delete Participant?</h3>
                        <p className="text-slate-500 mb-6">Type <span className="font-bold text-red-600">DELETE</span> to confirm.</p>
                        <Input value={deleteModal.confirmText} onChange={e => setDeleteModal({...deleteModal, confirmText: e.target.value})} placeholder="DELETE" className="text-center mb-6" />
                        <div className="flex gap-4">
                            <Button variant="outline" onClick={() => setDeleteModal({ isOpen: false, userId: null, confirmText: '' })} className="flex-1">Nevermind</Button>
                            <Button variant="danger" disabled={deleteModal.confirmText !== 'DELETE'} onClick={handleDeleteParticipant} className="flex-1">Yes, Delete</Button>
                        </div>
                    </div>
                </div>
            )}

            {selectedRegId && (
                <ParticipantDetailModal 
                    registrationId={selectedRegId} 
                    onClose={() => setSelectedRegId(null)} 
                    onActionComplete={fetchRegistrations}
                />
            )}
        </div>
    );
}

