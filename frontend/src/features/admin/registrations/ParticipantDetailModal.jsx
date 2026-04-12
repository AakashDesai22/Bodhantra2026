import React, { useState, useEffect } from 'react';
import { api, API_URL } from '@/api';
import { Button } from '@/components/ui/Button';
import { X, User, Mail, Phone, Hash, School, Calendar, Info, Check, AlertCircle, QrCode, ExternalLink } from 'lucide-react';

export default function ParticipantDetailModal({ registrationId, onClose, onActionComplete }) {
    const [registration, setRegistration] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (registrationId) {
            fetchDetails();
        }
    }, [registrationId]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/admin/registrations/${registrationId}`);
            setRegistration(res.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load participant details');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (status) => {
        try {
            await api.patch(`/api/admin/registrations/${registrationId}/status`, { status });
            fetchDetails();
            if (onActionComplete) onActionComplete();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    if (!registrationId) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="relative bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <User size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Participant Profile</h2>
                            <p className="text-sm text-slate-500">Review detailed information and registration status</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {loading ? (
                    <div className="flex-grow flex flex-col items-center justify-center p-20">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-slate-500 font-medium">Fetching details...</p>
                    </div>
                ) : error ? (
                    <div className="flex-grow flex flex-col items-center justify-center p-20 text-center">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Error Occurred</h3>
                        <p className="text-slate-500 mb-6">{error}</p>
                        <Button onClick={fetchDetails}>Try Again</Button>
                    </div>
                ) : (
                    <div className="flex-grow overflow-y-auto p-8 custom-scrollbar">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left Column: Personal Info */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700">
                                    <h3 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-sm">Personal Information</h3>
                                </div>
                                <div className="grid gap-4">
                                    <InfoItem icon={User} label="Full Name" value={registration.User?.name} />
                                    <InfoItem icon={Mail} label="Email Address" value={registration.User?.email} />
                                    <InfoItem icon={Phone} label="Phone Number" value={registration.User?.phone} />
                                    <InfoItem icon={Hash} label="PRN" value={registration.User?.prn || 'N/A'} />
                                    <InfoItem icon={School} label="College" value={registration.User?.college || 'N/A'} />
                                    <InfoItem icon={Calendar} label="Year / Branch" value={`${registration.User?.year || ''} ${registration.User?.branch || ''}`} />
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                        <div className="flex items-center gap-3 text-slate-400 mb-1">
                                            <QrCode size={16} />
                                            <span className="text-xs font-bold uppercase tracking-widest">Unique System ID</span>
                                        </div>
                                        <div className="text-lg font-mono font-bold text-primary">{registration.User?.unique_id || 'PENDING'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Event Info */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700">
                                    <h3 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-sm">Registration & Event</h3>
                                </div>
                                <div className="grid gap-4">
                                    <InfoItem icon={Info} label="Event Name" value={registration.Event?.name} />
                                    <InfoItem icon={Calendar} label="Registration Date" value={new Date(registration.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })} />
                                    
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Current Status</span>
                                            <StatusBadge status={registration.status} />
                                        </div>
                                        {registration.qr_code_data ? (
                                            <div className="flex flex-col items-center">
                                                <img src={registration.qr_code_data} alt="QR Code" className="w-32 h-32 mb-2 bg-white p-2 rounded-xl" />
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Verified QR Ticket</span>
                                            </div>
                                        ) : (
                                            <div className="text-center py-4 text-xs text-slate-400 italic">QR Ticket not yet generated</div>
                                        )}
                                    </div>

                                    {/* Attendance Record */}
                                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Attendance History</h4>
                                        <div className="space-y-2">
                                            {Array.from({ length: registration.Event?.event_duration || 1 }).map((_, i) => {
                                                const day = i + 1;
                                                const record = (registration.Attendances || registration.Attendance || []).find(a => a.day_number === day);
                                                return (
                                                    <div key={day} className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                                                        <span className="text-sm font-medium">Day {day}</span>
                                                        {record ? (
                                                            <div className="flex items-center gap-2 text-green-600">
                                                                <span className="text-[10px] font-bold">{new Date(record.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                <Check size={16} />
                                                            </div>
                                                        ) : (
                                                            <X size={16} className="text-slate-300" />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Screenshot Section */}
                        {registration.payment_ss_url && (
                            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700">
                                <h3 className="font-bold text-slate-800 dark:text-white uppercase tracking-wider text-sm mb-4">Payment Verification</h3>
                                <div className="relative group cursor-pointer overflow-hidden rounded-3xl border-4 border-slate-100 dark:border-slate-700 max-w-md mx-auto aspect-video flex items-center justify-center bg-slate-100" onClick={() => window.open(`${API_URL}${registration.payment_ss_url}`, '_blank')}>
                                    <img 
                                        src={`${API_URL}${registration.payment_ss_url}`} 
                                        alt="Payment Proof" 
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="bg-white/20 backdrop-blur-md p-4 rounded-full text-white">
                                            <ExternalLink size={32} />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-4 left-4 right-4 text-center">
                                        <span className="text-xs font-bold text-white uppercase tracking-widest bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">Click to view full size</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer: Quick Actions */}
                {!loading && registration && (
                    <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                        <div className="hidden sm:block">
                            <p className="text-xs text-slate-500 italic">ID: {registrationId}</p>
                        </div>
                        <div className="flex gap-3 w-full sm:w-auto">
                            {registration.status !== 'approved' && (
                                <Button className="flex-1 sm:flex-none gap-2 bg-green-600 hover:bg-green-700" onClick={() => handleStatusUpdate('approved')}>
                                    <Check size={18} /> Approve
                                </Button>
                            )}
                            {registration.status !== 'rejected' && (
                                <Button variant="danger" className="flex-1 sm:flex-none gap-2" onClick={() => handleStatusUpdate('rejected')}>
                                    <X size={18} /> Reject
                                </Button>
                            )}
                            <Button variant="outline" className="flex-1 sm:flex-none" onClick={onClose}>Close</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function InfoItem({ icon: Icon, label, value }) {
    return (
        <div className="flex items-start gap-4">
            <div className="mt-1 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-400">
                <Icon size={18} />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-slate-800 dark:text-slate-200 font-medium">{value || 'N/A'}</p>
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    const configs = {
        approved: { color: 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800', label: 'Approved' },
        pending: { color: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800', label: 'Pending' },
        rejected: { color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800', label: 'Rejected' }
    };
    const config = configs[status] || configs.pending;

    return (
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${config.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full bg-current`}></span>
            {config.label}
        </div>
    );
}
