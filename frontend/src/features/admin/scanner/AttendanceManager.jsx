import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { showToast } from '@/components/ui/Toast';
import { Html5Qrcode } from 'html5-qrcode';
import { Scan, Upload, Users, UserCheck, UserX, Search, ChevronDown, Camera, Image, RefreshCw } from 'lucide-react';

export default function AttendanceManager({ events: propEvents }) {
    // ── State ──
    const [events, setEvents] = useState(propEvents || []);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [selectedSessionId, setSelectedSessionId] = useState('');
    const [roster, setRoster] = useState([]);
    const [analytics, setAnalytics] = useState({ totalRegistered: 0, totalPresent: 0, totalAbsent: 0 });
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [scannerActive, setScannerActive] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [lastScanResult, setLastScanResult] = useState(null);

    const scannerRef = useRef(null);
    const scannerContainerRef = useRef(null);
    const fileInputRef = useRef(null);
    const cooldownRef = useRef(false);

    // ── Derived State  ──
    const selectedEvent = events.find(e => e.id === parseInt(selectedEventId));
    const sessions = selectedEvent?.attendance_sessions || [];
    const isLegacyEvent = sessions.length === 0;
    const isSessionSelected = isLegacyEvent ? !!selectedEventId : !!selectedSessionId;

    // ── Fetch events if not passed as props ──
    useEffect(() => {
        if (!propEvents || propEvents.length === 0) {
            api.get('/api/events/admin/all').then(res => setEvents(res.data)).catch(console.error);
        } else {
            setEvents(propEvents);
        }
    }, [propEvents]);

    // Reset session when event changes
    useEffect(() => {
        setSelectedSessionId('');
        setRoster([]);
        setAnalytics({ totalRegistered: 0, totalPresent: 0, totalAbsent: 0 });
        setLastScanResult(null);
    }, [selectedEventId]);

    // ── Fetch Roster ──
    const fetchRoster = useCallback(async () => {
        if (!selectedEventId) return;

        const sessionParam = isLegacyEvent ? 'legacy' : selectedSessionId;
        if (!sessionParam) return;

        setLoading(true);
        try {
            const res = await api.get(`/api/admin/attendance/roster/${selectedEventId}/${sessionParam}`);
            setRoster(res.data.roster);
            setAnalytics({
                totalRegistered: res.data.totalRegistered,
                totalPresent: res.data.totalPresent,
                totalAbsent: res.data.totalAbsent,
            });
        } catch (err) {
            console.error('Failed to fetch roster:', err);
            showToast('Failed to load attendance roster', 'error');
        } finally {
            setLoading(false);
        }
    }, [selectedEventId, selectedSessionId, isLegacyEvent]);

    useEffect(() => {
        if (isSessionSelected) {
            fetchRoster();
        }
    }, [isSessionSelected, fetchRoster]);

    // ── Handle Check-In (QR Scan) ──
    const handleCheckIn = useCallback(async (qrData) => {
        if (cooldownRef.current) return;
        cooldownRef.current = true;
        setTimeout(() => { cooldownRef.current = false; }, 2000);

        try {
            const payload = { qr_data: qrData };
            if (!isLegacyEvent && selectedSessionId) {
                payload.sessionId = selectedSessionId;
            }

            const res = await api.post('/api/admin/attendance/mark', payload);
            const data = res.data;

            setLastScanResult(data);

            if (data.alreadyMarked) {
                showToast(data.message, 'warning', 5000);
            } else if (data.success) {
                showToast(data.message, 'success', 5000);
            }

            // Refresh roster
            fetchRoster();
        } catch (err) {
            const msg = err.response?.data?.message || 'Scan failed — unknown error';
            setLastScanResult({ message: msg, success: false });
            showToast(msg, 'error', 5000);
        }
    }, [selectedSessionId, isLegacyEvent, fetchRoster]);

    // ── QR Scanner (Camera) ──
    const startScanner = useCallback(async () => {
        if (scannerRef.current) return;

        // Ensure browser supports camera API (will fail on HTTP unless localhost)
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showToast('Camera access requires secure connection (HTTPS or localhost).', 'error', 6000);
            return;
        }

        try {
            const html5Qr = new Html5Qrcode('attendance-qr-reader');
            scannerRef.current = html5Qr;

            const config = {
                fps: 10,
                // Ensure qrbox never calculates to 0, which crashes WASM.
                qrbox: (viewfinderWidth, viewfinderHeight) => {
                    const minEdgeRequirement = Math.min(viewfinderWidth, viewfinderHeight);
                    const size = Math.max(200, Math.floor(minEdgeRequirement * 0.7)); 
                    return { width: size, height: size };
                }
            };

            try {
                // Try environment (back) camera first
                await html5Qr.start(
                    { facingMode: 'environment' },
                    config,
                    (decodedText) => { handleCheckIn(decodedText); },
                    () => { /* Ignore frame scan failures */ }
                );
            } catch (err) {
                console.warn('Environment camera not found (likely on a laptop), attempting fallback to user camera...');
                // Fallback explicitly to user-facing camera (webcam)
                await html5Qr.start(
                    { facingMode: 'user' },
                    config,
                    (decodedText) => { handleCheckIn(decodedText); },
                    () => { }
                );
            }

            setScannerActive(true);
        } catch (err) {
            console.error('Total scanner failure:', err);
            showToast('Failed to start camera. Please check permissions.', 'error');
            scannerRef.current = null;
        }
    }, [handleCheckIn]);

    const stopScanner = useCallback(async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (e) { /* ignore */ }
            scannerRef.current = null;
            setScannerActive(false);
        }
    }, []);

    // Clean up scanner on unmount or context change
    useEffect(() => {
        return () => { stopScanner(); };
    }, [stopScanner]);

    useEffect(() => {
        stopScanner();
    }, [selectedEventId, selectedSessionId, stopScanner]);

    // ── QR Image Upload ──
    const handleImageUpload = useCallback(async (file) => {
        if (!file) return;

        try {
            const html5Qr = new Html5Qrcode('attendance-qr-upload-temp');
            const result = await html5Qr.scanFile(file, true);
            html5Qr.clear();
            handleCheckIn(result);
        } catch (err) {
            console.error('QR image scan error:', err);
            showToast('Could not read QR code from image. Try a clearer photo.', 'error');
        }
    }, [handleCheckIn]);

    const handleFileDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer?.files?.[0];
        if (file && file.type.startsWith('image/')) {
            handleImageUpload(file);
        }
    }, [handleImageUpload]);

    const handleFileSelect = useCallback((e) => {
        const file = e.target.files?.[0];
        if (file) handleImageUpload(file);
        e.target.value = '';
    }, [handleImageUpload]);

    // ── Manual Toggle ──
    const handleToggle = async (registrationId, currentlyPresent) => {
        try {
            const payload = {
                registrationId,
                sessionId: isLegacyEvent ? null : selectedSessionId,
                markPresent: !currentlyPresent,
            };

            const res = await api.post('/api/admin/attendance/toggle', payload);

            if (res.data.success) {
                showToast(res.data.message, !currentlyPresent ? 'success' : 'info');
                // Optimistic update
                setRoster(prev => prev.map(r =>
                    r.registrationId === registrationId
                        ? { ...r, isPresent: !currentlyPresent, scannedAt: !currentlyPresent ? new Date().toISOString() : null }
                        : r
                ));
                setAnalytics(prev => ({
                    ...prev,
                    totalPresent: prev.totalPresent + (!currentlyPresent ? 1 : -1),
                    totalAbsent: prev.totalAbsent + (!currentlyPresent ? -1 : 1),
                }));
            }
        } catch (err) {
            showToast('Failed to toggle attendance', 'error');
        }
    };

    // ── Filtered Roster ──
    const filteredRoster = roster.filter(r => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            r.name?.toLowerCase().includes(term) ||
            r.email?.toLowerCase().includes(term) ||
            r.uniqueId?.toLowerCase().includes(term)
        );
    });

    const progressPercent = analytics.totalRegistered > 0
        ? Math.round((analytics.totalPresent / analytics.totalRegistered) * 100)
        : 0;

    // ── Current session label ──
    const currentSessionLabel = isLegacyEvent
        ? 'Day-based Attendance'
        : sessions.find(s => s.id === selectedSessionId)?.sessionName || '';

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ═══ ROW 0: Context Bar ═══ */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4">
                    {/* Event Dropdown */}
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Select Event</label>
                        <div className="relative">
                            <select
                                id="attendance-event-select"
                                value={selectedEventId}
                                onChange={(e) => setSelectedEventId(e.target.value)}
                                className="w-full appearance-none px-4 py-3 pr-10 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-slate-700 dark:text-white text-sm font-medium cursor-pointer"
                            >
                                <option value="">— Choose an event —</option>
                                {events.map(evt => (
                                    <option key={evt.id} value={evt.id}>{evt.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Session Dropdown */}
                    <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Select Session</label>
                        <div className="relative">
                            {isLegacyEvent && selectedEventId ? (
                                <div className="w-full px-4 py-3 border border-amber-300 dark:border-amber-600 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-sm font-medium">
                                    ⚡ Legacy Mode — Day-based attendance (no sessions configured)
                                </div>
                            ) : (
                                <>
                                    <select
                                        id="attendance-session-select"
                                        value={selectedSessionId}
                                        onChange={(e) => setSelectedSessionId(e.target.value)}
                                        disabled={!selectedEventId || isLegacyEvent}
                                        className="w-full appearance-none px-4 py-3 pr-10 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-slate-700 dark:text-white text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <option value="">— Choose a session —</option>
                                        {sessions.map(s => (
                                            <option key={s.id} value={s.id}>Day {s.day}: {s.sessionName}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {isSessionSelected && currentSessionLabel && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Active: <span className="font-bold text-slate-700 dark:text-slate-200">{selectedEvent?.name}</span> → <span className="font-bold text-primary">{currentSessionLabel}</span>
                    </div>
                )}
            </div>

            {/* Guard: Nothing below renders until session selected */}
            {!isSessionSelected ? (
                <div className="text-center py-20 bg-white/50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600">
                    <Scan className="mx-auto mb-4 text-slate-300 dark:text-slate-600" size={48} />
                    <p className="text-slate-400 dark:text-slate-500 font-medium text-lg">Select an event{!isLegacyEvent && selectedEventId ? ' and session' : ''} to begin</p>
                    <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Scanning, analytics, and roster will appear here</p>
                </div>
            ) : (
                <>
                    {/* ═══ ROW 1: Live Analytics Panel ═══ */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Total Registered */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                            <Users className="mb-3 opacity-80" size={28} />
                            <p className="text-blue-100 text-xs font-bold uppercase tracking-wider">Total Registered</p>
                            <p className="text-4xl font-extrabold mt-1">{analytics.totalRegistered}</p>
                        </div>

                        {/* Present */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/20">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                            <UserCheck className="mb-3 opacity-80" size={28} />
                            <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider">Checked In (Present)</p>
                            <p className="text-4xl font-extrabold mt-1">{analytics.totalPresent}</p>
                        </div>

                        {/* Absent */}
                        <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg shadow-rose-500/20">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                            <UserX className="mb-3 opacity-80" size={28} />
                            <p className="text-rose-100 text-xs font-bold uppercase tracking-wider">Pending (Absent)</p>
                            <p className="text-4xl font-extrabold mt-1">{analytics.totalAbsent}</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Check-in Progress</span>
                            <span className="text-sm font-extrabold text-primary">{progressPercent}%</span>
                        </div>
                        <div className="w-full h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <p className="text-xs text-slate-400 mt-2">{analytics.totalPresent} of {analytics.totalRegistered} participants checked in</p>
                    </div>

                    {/* ═══ ROW 2: Scanner Section ═══ */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left: Live Camera Scanner */}
                        <Card className="overflow-hidden">
                            <CardContent className="p-6">
                                <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                    <Camera size={20} className="text-primary" />
                                    Live QR Scanner
                                </h3>

                                {/* Wrapper for the scanner to prevent React DOM reconciliation crashes */}
                                <div className="relative w-full min-h-[280px] rounded-xl overflow-hidden border-2 border-slate-100 dark:border-slate-700 bg-slate-900">
                                    
                                    {/* This div is EXCLUSIVELY for Html5Qrcode. React MUST NOT touch its inner contents! */}
                                    <div id="attendance-qr-reader" ref={scannerContainerRef} className="w-full h-full" />

                                    {/* Safe React overlay when scanner is completely off */}
                                    {!scannerActive && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10">
                                            <Camera className="mb-3 text-slate-500" size={40} />
                                            <p className="text-slate-400 text-sm">Camera is off</p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 mt-4">
                                    {!scannerActive ? (
                                        <Button onClick={startScanner} className="flex-1">
                                            <Camera size={16} className="mr-2" /> Start Camera
                                        </Button>
                                    ) : (
                                        <Button variant="outline" onClick={stopScanner} className="flex-1">
                                            Stop Camera
                                        </Button>
                                    )}
                                </div>

                                {/* Last Scan Result */}
                                {lastScanResult && (
                                    <div className={`mt-4 p-4 rounded-xl border-2 transition-all ${
                                        lastScanResult.success
                                            ? lastScanResult.alreadyMarked
                                                ? 'border-amber-400/30 bg-amber-50 dark:bg-amber-900/10'
                                                : 'border-emerald-400/30 bg-emerald-50 dark:bg-emerald-900/10'
                                            : 'border-red-400/30 bg-red-50 dark:bg-red-900/10'
                                    }`}>
                                        <p className={`text-sm font-bold ${
                                            lastScanResult.success
                                                ? lastScanResult.alreadyMarked
                                                    ? 'text-amber-600 dark:text-amber-400'
                                                    : 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-red-600 dark:text-red-400'
                                        }`}>
                                            {lastScanResult.message}
                                        </p>
                                        {lastScanResult.participant && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                {lastScanResult.uniqueId} • {lastScanResult.sessionName || `Day ${lastScanResult.dayNumber}`}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Right: Image Upload Dropzone */}
                        <Card className="overflow-hidden">
                            <CardContent className="p-6">
                                <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                    <Image size={20} className="text-primary" />
                                    Upload QR Image
                                </h3>

                                <div
                                    id="attendance-qr-upload-temp"
                                    style={{ display: 'none' }}
                                />

                                <div
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleFileDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`w-full min-h-[280px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                                        dragOver
                                            ? 'border-primary bg-primary/5 scale-[1.02]'
                                            : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/30 hover:border-primary/50 hover:bg-primary/5'
                                    }`}
                                >
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
                                        dragOver ? 'bg-primary/20 text-primary' : 'bg-slate-200 dark:bg-slate-600 text-slate-400'
                                    }`}>
                                        <Upload size={28} />
                                    </div>
                                    <p className="font-semibold text-slate-600 dark:text-slate-300 text-sm">
                                        {dragOver ? 'Drop it here!' : 'Drag & drop QR image'}
                                    </p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                        or click to browse • PNG, JPG, WebP
                                    </p>
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />

                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-4 text-center">
                                    💡 Use this as a fallback if the camera isn't working. Take a photo of the participant's QR code and upload it here.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* ═══ ROW 3: Manual Roster Table ═══ */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        <Users size={20} className="text-primary" />
                                        Manual Attendance Roster
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        Toggle any participant's status manually
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <div className="relative flex-1 sm:w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            id="attendance-roster-search"
                                            type="text"
                                            placeholder="Search name, email, or ID..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-slate-700 dark:text-white text-sm"
                                        />
                                    </div>
                                    <button
                                        onClick={fetchRoster}
                                        className="p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                        title="Refresh roster"
                                    >
                                        <RefreshCw size={16} className={`text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                            </div>

                            {loading && roster.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent mx-auto" />
                                    <p className="mt-3 text-sm text-slate-400">Loading roster...</p>
                                </div>
                            ) : filteredRoster.length === 0 ? (
                                <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                                    <Users size={32} className="mx-auto mb-3 opacity-50" />
                                    <p className="font-medium">{searchTerm ? 'No matches found' : 'No registrations yet'}</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto -mx-6">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-200 dark:border-slate-700">
                                                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Participant</th>
                                                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">Email</th>
                                                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">Unique ID</th>
                                                <th className="text-center px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                                <th className="text-center px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                            {filteredRoster.map((person) => (
                                                <tr
                                                    key={person.registrationId}
                                                    className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                                                                person.isPresent
                                                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                                                            }`}>
                                                                {person.name?.charAt(0)?.toUpperCase() || '?'}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-slate-800 dark:text-white">{person.name}</p>
                                                                <p className="text-xs text-slate-400 md:hidden">{person.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 hidden md:table-cell">{person.email}</td>
                                                    <td className="px-6 py-4 hidden lg:table-cell">
                                                        <code className="text-xs font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-500">{person.uniqueId}</code>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                                            person.isPresent
                                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                                : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                                        }`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${person.isPresent ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                            {person.isPresent ? 'Present' : 'Absent'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            onClick={() => handleToggle(person.registrationId, person.isPresent)}
                                                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
                                                                person.isPresent ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                                                            }`}
                                                            title={person.isPresent ? 'Mark as Absent' : 'Mark as Present'}
                                                        >
                                                            <span
                                                                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                                                                    person.isPresent ? 'translate-x-6' : 'translate-x-1'
                                                                }`}
                                                            />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
