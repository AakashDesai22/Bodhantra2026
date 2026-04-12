import React, { useState, useEffect } from 'react';
import { api } from '@/api';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Sun, Moon, AlertTriangle, LayoutDashboard, Calendar, Users, Scan, MessageSquare, Dices, CircleDot, Trophy, UserCog, TrendingUp, Terminal, Settings, Award } from 'lucide-react';

// Feature Components
import EventManager from '@/features/admin/events/EventManager';
import ParticipantList from '@/features/admin/registrations/ParticipantList';
import AllocationManager from '@/features/admin/allocation/AllocationManager';
import WinnerThemeHub from '@/features/admin/winner/WinnerThemeHub';
import UserManagement from '@/features/admin/users/UserManagement';
import AnalyticsDashboard from '@/features/admin/analytics/AnalyticsDashboard';
import AuditLogViewer from '@/features/admin/system/AuditLogViewer';
import SystemSettings from '@/features/admin/system/SystemSettings';
import AttendanceManager from '@/features/admin/scanner/AttendanceManager';
import FeedbackViewerTab from '@/features/admin/feedback/FeedbackViewerTab';
import CertificateMapper from '@/features/certificates/CertificateMapper';
import CertificateIssuer from '@/features/certificates/CertificateIssuer';

export default function AdminDashboard() {
    const { theme, toggleTheme } = useTheme();
    const { user, isAdmin, isMember } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [analytics, setAnalytics] = useState(null);
    const [events, setEvents] = useState([]);
    const [queries, setQueries] = useState([]);
    const [loading, setLoading] = useState(true);

    // Queries state
    const [replyText, setReplyText] = useState({});

    // Reset state
    const [resetModal, setResetModal] = useState({ isOpen: false, confirmText: '' });
    const [resetLoading, setResetLoading] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [analyticsRes, eventsRes, queriesRes] = await Promise.all([
                api.get('/api/admin/analytics'),
                api.get('/api/events/admin/all'),
                api.get('/api/admin/queries'),
            ]);
            setAnalytics(analyticsRes.data);
            setEvents(eventsRes.data);
            setQueries(queriesRes.data);
        } catch (err) {
            console.error('Failed to fetch admin data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPlatform = async () => {
        if (resetModal.confirmText !== 'BODHANTRA-RESET-2026') return;
        setResetLoading(true);
        try {
            await api.post('/api/admin/danger/reset-platform');
            alert('Platform reset successfully!');
            setResetModal({ isOpen: false, confirmText: '' });
            fetchInitialData();
        } catch (err) {
            alert('Reset failed.');
        } finally {
            setResetLoading(false);
        }
    };

    const submitQueryResponse = async (id) => {
        try {
            await api.patch(`/api/admin/queries/${id}/respond`, { response: replyText[id] });
            setReplyText({ ...replyText, [id]: '' });
            fetchInitialData();
        } catch (err) { console.error(err); }
    };

    // ── Role-aware tab definitions ──
    // Members get read-only tabs; Admins get everything + User Management
    const allTabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard, roles: ['admin', 'member'] },
        { id: 'events', label: 'Events', icon: Calendar, roles: ['admin', 'member'] },
        { id: 'registrations', label: 'Participants', icon: Users, roles: ['admin', 'member'] },
        { id: 'allocation', label: 'Allocation', icon: Dices, roles: ['admin', 'member'] },
        { id: 'winner', label: 'Winner Display', icon: Trophy, roles: ['admin', 'member'] },
        { id: 'attendance', label: 'Attendance', icon: Scan, roles: ['admin', 'member'] },
        { id: 'feedback', label: 'Feedback', icon: MessageSquare, roles: ['admin', 'member'] },
        { id: 'queries', label: 'Queries', icon: MessageSquare, roles: ['admin', 'member'] },
        { id: 'certificates', label: 'Certificates', icon: Award, roles: ['admin'] },
        { id: 'users', label: 'User Mgmt', icon: UserCog, roles: ['admin'] },
        { id: 'systemLogs', label: 'System Logs', icon: Terminal, roles: ['admin'] },
    ];

    const tabs = allTabs.filter((tab) => tab.roles.includes(user?.role));

    if (loading && !analytics) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                <p className="mt-4 text-slate-500 font-medium">Powering up dashboard...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {isAdmin ? 'Admin Console' : 'Dashboard'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {isAdmin ? 'Unified event management architecture' : 'Read-only dashboard access'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {isMember && (
                        <span className="px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            Member View
                        </span>
                    )}
                    {isAdmin && (
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`p-3 rounded-2xl transition-all border ${activeTab === 'settings' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'}`}
                            title="Platform Settings"
                        >
                            <Settings size={20} />
                        </button>
                    )}
                    <button
                        onClick={toggleTheme}
                        className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700"
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </div>
            </div>

            {/* Navigation Grid */}
            <div className="flex flex-wrap gap-2 mb-8 bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                            activeTab === tab.id
                                ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                    >
                        <tab.icon size={18} />
                        <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="min-h-[50vh]">
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <AnalyticsDashboard analytics={analytics} />
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="p-8 text-center hover:scale-[1.02] transition-transform cursor-pointer border-none bg-blue-50/50 dark:bg-blue-900/10" onClick={() => setActiveTab('events')}>
                                <Calendar className="mx-auto mb-4 text-blue-600" size={32} />
                                <h3 className="font-bold text-slate-800 dark:text-white">Events</h3>
                                <p className="text-sm text-slate-500 mt-1">{isMember ? 'View event details' : 'Configure and release new events'}</p>
                            </Card>
                            <Card className="p-8 text-center hover:scale-[1.02] transition-transform cursor-pointer border-none bg-indigo-50/50 dark:bg-indigo-900/10" onClick={() => setActiveTab('registrations')}>
                                <Users className="mx-auto mb-4 text-indigo-600" size={32} />
                                <h3 className="font-bold text-slate-800 dark:text-white">Participants</h3>
                                <p className="text-sm text-slate-500 mt-1">{isMember ? 'View participant data' : 'Review and approve registrations'}</p>
                            </Card>
                            <Card className="p-8 text-center hover:scale-[1.02] transition-transform cursor-pointer border-none bg-slate-50/50 dark:bg-slate-800/50" onClick={() => setActiveTab('queries')}>
                                <MessageSquare className="mx-auto mb-4 text-slate-600" size={32} />
                                <h3 className="font-bold text-slate-800 dark:text-white">Queries</h3>
                                <p className="text-sm text-slate-500 mt-1">{isMember ? 'View participant inquiries' : 'Support participant inquiries'}</p>
                            </Card>
                        </div>

                        {/* Danger Zone — Admin only */}
                        {isAdmin && (
                            <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
                                <h3 className="text-red-600 font-bold mb-4 flex items-center gap-2">Danger Zone</h3>
                                <Card className="border-red-100 dark:border-red-900/20 bg-red-50/20">
                                    <CardContent className="flex flex-col md:flex-row items-center justify-between py-6 gap-4">
                                        <div>
                                            <h4 className="font-bold text-slate-800 dark:text-white">System Reset</h4>
                                            <p className="text-sm text-slate-500">Permanently wipe all platform data for a fresh start.</p>
                                        </div>
                                        <Button variant="danger" onClick={() => setResetModal({ isOpen: true, confirmText: '' })}>Execute Reset</Button>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'systemLogs' && isAdmin && (
                    <div className="py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <AuditLogViewer />
                    </div>
                )}

                {activeTab === 'settings' && isAdmin && (
                    <div className="py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <SystemSettings />
                    </div>
                )}

                {activeTab === 'events' && <EventManager events={events} onRefresh={fetchInitialData} readOnly={isMember} />}
                
                {activeTab === 'registrations' && <ParticipantList events={events} readOnly={isMember} />}

                {activeTab === 'allocation' && <AllocationManager events={events} />}

                {activeTab === 'winner' && (
                    <div className="py-6">
                        <WinnerThemeHub />
                    </div>
                )}

                {activeTab === 'attendance' && (
                    <div className="py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <AttendanceManager events={events} />
                    </div>
                )}

                {activeTab === 'feedback' && (
                    <div className="py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <FeedbackViewerTab events={events} />
                    </div>
                )}

                {activeTab === 'queries' && (
                    <div className="space-y-4">
                        {queries.map((q) => (
                            <Card key={q.id} className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-bold">{q.User?.name}</h4>
                                        <p className="text-xs text-slate-500">{q.User?.email}</p>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${q.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{q.status}</span>
                                </div>
                                <p className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl text-sm mb-4">{q.message}</p>
                                {q.status !== 'resolved' && isAdmin ? (
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Write a response..."
                                            value={replyText[q.id] || ''}
                                            onChange={(e) => setReplyText({ ...replyText, [q.id]: e.target.value })}
                                        />
                                        <Button onClick={() => submitQueryResponse(q.id)}>Reply</Button>
                                    </div>
                                ) : q.status === 'resolved' ? (
                                    <p className="text-sm text-green-600 font-medium">Replied: {q.response}</p>
                                ) : (
                                    <p className="text-sm text-slate-400 italic">Awaiting admin response</p>
                                )}
                            </Card>
                        ))}
                    </div>
                )}

                {activeTab === 'certificates' && isAdmin && (
                    <CertificatesTab events={events} />
                )}

                {activeTab === 'users' && isAdmin && <UserManagement />}
            </div>

            {/* Reset Modal */}
            {resetModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setResetModal({ isOpen: false, confirmText: '' })}></div>
                    <div className="relative bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl max-w-lg w-full border-t-8 border-red-600">
                        <div className="flex items-center gap-4 text-red-600 mb-6 font-bold text-2xl"><AlertTriangle size={32} /> CRITICAL RESET</div>
                        <p className="text-sm text-slate-500 mb-6">Type <span className="font-bold text-red-600">BODHANTRA-RESET-2026</span> to confirm.</p>
                        <Input value={resetModal.confirmText} onChange={e => setResetModal({...resetModal, confirmText: e.target.value})} className="mb-6" />
                        <div className="flex gap-4">
                            <Button variant="outline" onClick={() => setResetModal({ isOpen: false, confirmText: '' })} className="flex-1">Cancel</Button>
                            <Button variant="danger" disabled={resetModal.confirmText !== 'BODHANTRA-RESET-2026' || resetLoading} onClick={handleResetPlatform} className="flex-1">{resetLoading ? 'Wiping...' : 'YES, WIPE EVERYTHING'}</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Certificates Sub-Tab ──────────────────────────────────────
function CertificatesTab({ events }) {
    const [selectedEventId, setSelectedEventId] = React.useState('');
    const [activeSection, setActiveSection] = React.useState('mapper');
    const [refreshKey, setRefreshKey] = React.useState(0);

    const selectedEvent = events.find(e => e.id === parseInt(selectedEventId));

    return (
        <div className="py-6 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            {/* Event Selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1 w-full sm:max-w-sm">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Select Event</label>
                    <select
                        value={selectedEventId}
                        onChange={(e) => { setSelectedEventId(e.target.value); setRefreshKey(k => k + 1); }}
                        className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                        <option value="">Choose an event...</option>
                        {events.map(ev => (
                            <option key={ev.id} value={ev.id}>{ev.name}</option>
                        ))}
                    </select>
                </div>

                {selectedEventId && (
                    <div className="flex gap-2 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
                        <button
                            onClick={() => setActiveSection('mapper')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                activeSection === 'mapper'
                                    ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                        >
                            🎨 Template Editor
                        </button>
                        <button
                            onClick={() => setActiveSection('issuer')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                activeSection === 'issuer'
                                    ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                        >
                            📤 Issue Certificates
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            {!selectedEventId ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-3xl">
                        🏆
                    </div>
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">Certificate Engine</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                        Select an event to design your certificate template and issue certificates to participants.
                    </p>
                </div>
            ) : selectedEvent && activeSection === 'mapper' ? (
                <CertificateMapper
                    key={`mapper-${refreshKey}`}
                    event={selectedEvent}
                    onSaved={() => setRefreshKey(k => k + 1)}
                />
            ) : selectedEvent && activeSection === 'issuer' ? (
                <CertificateIssuer
                    key={`issuer-${refreshKey}`}
                    event={selectedEvent}
                    onIssued={() => setRefreshKey(k => k + 1)}
                />
            ) : null}
        </div>
    );
}
