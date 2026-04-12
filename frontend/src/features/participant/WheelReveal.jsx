import React, { useState, useRef, useEffect } from 'react';
import { api } from '@/api';

const GLITCH_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export default function WheelReveal({ eventId, eventName, dayNumber = 1 }) {
    const [phase, setPhase] = useState('idle'); // idle | loading | scrambling | revealed | error
    const [assignment, setAssignment] = useState(null);
    const [scrambleFields, setScrambleFields] = useState([]);
    const [errorMsg, setErrorMsg] = useState('');
    const animRef = useRef(null);
    const scrambleStateRef = useRef([]);

    const handleDecrypt = async () => {
        setPhase('loading');
        setErrorMsg('');

        try {
            const res = await api.get(`/api/allocation/${eventId}/reveal?day=${dayNumber}`);
            const data = res.data;
            setAssignment(data);

            // Build fields to decrypt
            const fields = [
                { label: 'TEAM', value: data.group_name },
                { label: 'ROLE', value: data.role || 'N/A' },
                { label: 'SEAT', value: data.seat_row ? `ROW ${data.seat_row} · COL ${data.seat_col}` : 'DYNAMIC' },
            ];

            // Initialize scramble state
            const initState = fields.map(f => ({
                label: f.label,
                target: f.value,
                current: Array.from({ length: f.value.length }, () =>
                    GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
                ).join(''),
            }));

            scrambleStateRef.current = initState;
            setScrambleFields([...initState]);
            setPhase('scrambling');

            // Run decrypt animation
            const startTime = Date.now();
            const DURATION = 3000;

            const tick = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / DURATION, 1);

                const updated = scrambleStateRef.current.map(field => {
                    const targetLen = field.target.length;
                    const shouldLock = Math.floor(progress * targetLen);

                    let chars = '';
                    for (let i = 0; i < targetLen; i++) {
                        if (i < shouldLock) {
                            chars += field.target[i];
                        } else {
                            chars += GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
                        }
                    }
                    return { ...field, current: chars };
                });

                scrambleStateRef.current = updated;
                setScrambleFields([...updated]);

                if (progress < 1) {
                    animRef.current = requestAnimationFrame(tick);
                } else {
                    setPhase('revealed');
                }
            };

            animRef.current = requestAnimationFrame(tick);
        } catch (err) {
            setPhase('error');
            setErrorMsg(err.response?.data?.message || 'Failed to load assignment');
        }
    };

    useEffect(() => {
        return () => {
            if (animRef.current) cancelAnimationFrame(animRef.current);
        };
    }, []);

    // ─── IDLE STATE ───
    if (phase === 'idle') {
        return (
            <div className="relative overflow-hidden rounded-2xl border-2 border-cyan-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
                {/* Animated background grid */}
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: `linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: '30px 30px',
                }} />

                <div className="relative p-8 md:p-12 text-center">
                    <div className="text-cyan-500 text-[10px] font-bold tracking-[0.4em] mb-4 uppercase">
                        {eventName || 'Event'} · Day {dayNumber}
                    </div>

                    <h3 className="text-2xl md:text-3xl font-black text-white mb-2" style={{ fontFamily: "'Courier New', monospace" }}>
                        ASSIGNMENT<br />
                        <span className="text-cyan-400">ENCRYPTED</span>
                    </h3>

                    <p className="text-slate-500 text-sm mb-8 max-w-md mx-auto">
                        Your team, seat, and role have been pre-calculated by the allocation engine. Decrypt to reveal.
                    </p>

                    <button
                        onClick={handleDecrypt}
                        className="group relative inline-flex items-center gap-3 px-10 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-lg rounded-xl transition-all duration-300 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 active:scale-95"
                    >
                        <span className="relative z-10" style={{ fontFamily: "'Courier New', monospace" }}>
                            ▶ DECRYPT
                        </span>
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>

                    <div className="mt-6 flex items-center justify-center gap-2 text-slate-600">
                        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
                        <span className="text-[10px] tracking-[0.2em] uppercase">Ready for decryption</span>
                    </div>
                </div>
            </div>
        );
    }

    // ─── LOADING STATE ───
    if (phase === 'loading') {
        return (
            <div className="rounded-2xl border-2 border-cyan-500/20 bg-slate-950 p-12 text-center">
                <div className="text-cyan-400 text-xs font-bold tracking-[0.4em] animate-pulse">
                    ◆ CONNECTING TO ALLOCATION ENGINE ◆
                </div>
                <div className="mt-6 flex items-center justify-center gap-2">
                    {[0, 1, 2].map(i => (
                        <div key={i} className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                </div>
            </div>
        );
    }

    // ─── SCRAMBLING STATE ───
    if (phase === 'scrambling') {
        return (
            <div className="rounded-2xl border-2 border-cyan-500/30 bg-slate-950 p-8 md:p-12 text-center overflow-hidden" style={{ fontFamily: "'Courier New', monospace" }}>
                <div className="text-cyan-400 text-xs font-bold tracking-[0.3em] mb-8 animate-pulse">
                    ◆ DECRYPTING ASSIGNMENT ◆
                </div>

                <div className="space-y-6">
                    {scrambleFields.map((field, i) => (
                        <div key={i} className="flex items-center justify-center gap-4">
                            <span className="text-cyan-700 text-xs font-bold w-14 text-right">{field.label}</span>
                            <span className="text-green-400 text-2xl md:text-4xl font-bold tracking-[0.2em] min-w-[200px]">
                                {field.current}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex items-center justify-center gap-2 text-cyan-800">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-ping" />
                    <span className="text-[10px] tracking-widest uppercase">Decrypting</span>
                </div>
            </div>
        );
    }

    // ─── REVEALED STATE ───
    if (phase === 'revealed' && assignment) {
        const fields = [
            { label: 'TEAM', value: assignment.group_name, colorClass: 'text-cyan-400' },
            { label: 'ROLE', value: assignment.role || 'N/A', colorClass: 'text-purple-400' },
            { label: 'SEAT', value: assignment.seat_row ? `ROW ${assignment.seat_row} · COL ${assignment.seat_col}` : 'DYNAMIC', colorClass: 'text-green-400' },
        ];

        return (
            <div className="rounded-2xl border-2 border-green-500/30 bg-slate-950 overflow-hidden" style={{ fontFamily: "'Courier New', monospace" }}>
                {/* Success header */}
                <div className="bg-gradient-to-r from-green-900/30 to-cyan-900/30 px-6 py-3 border-b border-green-500/20 flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-400 text-xs font-bold tracking-[0.3em]">ASSIGNMENT DECRYPTED</span>
                </div>

                <div className="p-8 md:p-12 text-center">
                    <div className="space-y-6">
                        {fields.map((field, i) => (
                            <div key={i} className="space-y-1">
                                <div className="text-slate-600 text-[10px] font-bold tracking-[0.3em]">{field.label}</div>
                                <div className={`text-3xl md:text-5xl font-black tracking-wide ${field.colorClass}`}>
                                    {field.value}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-800">
                        <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-400 px-5 py-2.5 rounded-full text-xs font-bold tracking-wider">
                            <div className="w-2 h-2 bg-green-400 rounded-full" />
                            DAY {assignment.day_number} · LOCKED IN
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ─── ERROR STATE ───
    if (phase === 'error') {
        return (
            <div className="rounded-2xl border-2 border-red-500/20 bg-slate-950 p-8 text-center">
                <div className="text-red-400 text-xs font-bold tracking-[0.3em] mb-4">◆ DECRYPTION FAILED ◆</div>
                <p className="text-slate-400 text-sm mb-6">{errorMsg}</p>
                <button
                    onClick={() => setPhase('idle')}
                    className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-all"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return null;
}
