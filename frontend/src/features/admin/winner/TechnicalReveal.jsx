import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '@/api';

// ─── Constants ───────────────────────────────────────────────────────────────
const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$#@!%&*?><{}[]=/\\|~^';
const SCRAMBLE_INTERVAL_MS = 50;
const DECRYPT_DURATION_MS = 4000;

const SIDEBAR_MODULES = [
    { label: 'SYS_KERNEL', status: 'LOADED' },
    { label: 'NET_INTERFACE', status: 'ACTIVE' },
    { label: 'AUTH_MODULE', status: 'LOCKED' },
    { label: 'DB_CONNECTOR', status: 'STANDBY' },
    { label: 'GPU_RENDERER', status: 'ONLINE' },
    { label: 'CRYPTO_ENGINE', status: 'ARMED' },
    { label: 'DISPLAY_OUT', status: 'LIVE' },
];

const TOP_BAR_ITEMS = [
    'BODHANTRA_OS v3.7.1',
    'SYSTEM: STABLE',
    'ENCRYPTION: AES-256',
    'NODE: ALPHA-7',
];

// ─── Synthetic Audio Engine ──────────────────────────────────────────────────
function createTypingAudioContext() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    let intervalId = null;

    const playClick = () => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'square';
        osc.frequency.setValueAtTime(800 + Math.random() * 1200, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.05);
    };

    return {
        start: () => {
            if (ctx.state === 'suspended') ctx.resume();
            intervalId = setInterval(playClick, 30 + Math.random() * 40);
        },
        stop: () => {
            clearInterval(intervalId);
            intervalId = null;
        },
        close: () => {
            clearInterval(intervalId);
            ctx.close().catch(() => {});
        },
    };
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function TechnicalReveal() {
    const [stage, setStage] = useState('idle'); // idle | decrypting | revealed
    const [scrambledText, setScrambledText] = useState('');

    // Config from localStorage
    const config = useMemo(() => {
        try {
            const raw = localStorage.getItem('technical_config');
            if (raw) return JSON.parse(raw);
        } catch { /* noop */ }
        return {};
    }, []);

    const winnerName = config.winnerName || 'Aakash (Team Mavericks)';
    const winnerTitle = config.title || 'Best Performer';
    const winnerPhotoUrl = config.winnerPhoto || '';
    const suspenseDurationMs = (config.suspenseDuration ? parseFloat(config.suspenseDuration) : 4) * 1000;

    // Refs
    const typingAudioRef = useRef(null);
    const impactAudioRef = useRef(null);
    const scrambleIntervalRef = useRef(null);
    const decryptTimerRef = useRef(null);

    // ── Scrambler helper ──
    const generateScramble = useCallback((length) => {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }
        return result;
    }, []);

    // ── Audio setup ──
    useEffect(() => {
        typingAudioRef.current = createTypingAudioContext();
        impactAudioRef.current = new Audio('/jackpot-win.mp3');
        impactAudioRef.current.volume = 1.0;

        return () => {
            typingAudioRef.current?.close();
            if (impactAudioRef.current) {
                impactAudioRef.current.pause();
                impactAudioRef.current.currentTime = 0;
            }
            clearInterval(scrambleIntervalRef.current);
            clearTimeout(decryptTimerRef.current);
        };
    }, []);

    // ── Keyboard listener ──
    useEffect(() => {
        const handleKey = (e) => {
            if (e.code === 'Space' && stage === 'idle') {
                e.preventDefault();
                startDecryption();
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [stage]);

    // ── State transitions ──
    const startDecryption = async () => {
        // Try fullscreen
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            }
        } catch { /* noop */ }

        setStage('decrypting');

        // Start typing audio
        typingAudioRef.current?.start();

        // Start scrambler
        const nameLength = Math.max(winnerName.length, 16);
        scrambleIntervalRef.current = setInterval(() => {
            setScrambledText(generateScramble(nameLength));
        }, SCRAMBLE_INTERVAL_MS);

        // Auto-transition after configured suspense duration
        decryptTimerRef.current = setTimeout(() => {
            clearInterval(scrambleIntervalRef.current);
            typingAudioRef.current?.stop();
            setStage('revealed');

            // Play impact sound
            if (impactAudioRef.current) {
                impactAudioRef.current.currentTime = 0;
                impactAudioRef.current.play().catch(console.error);
            }
        }, suspenseDurationMs);
    };

    // ── Timestamp for top bar ──
    const [clock, setClock] = useState('');
    useEffect(() => {
        const tick = () => {
            const now = new Date();
            setClock(now.toLocaleTimeString('en-US', { hour12: false }));
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    // ── Fade class for sidebar/topbar in revealed state ──
    const chromeOpacity = stage === 'revealed' ? 'opacity-20' : 'opacity-100';

    return (
        <div className="h-screen w-screen bg-black overflow-hidden relative font-mono select-none cursor-default">

            {/* ── CRT Scanline Overlay ── */}
            <div
                className="fixed inset-0 pointer-events-none z-50"
                style={{
                    background: 'repeating-linear-gradient(0deg, rgba(0,255,0,0.03) 0px, rgba(0,255,0,0.03) 1px, transparent 1px, transparent 2px)',
                }}
            />

            {/* ── Subtle vignette ── */}
            <div
                className="fixed inset-0 pointer-events-none z-40"
                style={{
                    background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.7) 100%)',
                }}
            />

            {/* ── Top Bar ── */}
            <div className={`absolute top-0 inset-x-0 h-10 bg-[#0a0a0a] border-b border-green-900/50 flex items-center justify-between px-6 z-30 transition-opacity duration-1000 ${chromeOpacity}`}>
                <div className="flex items-center gap-6">
                    {TOP_BAR_ITEMS.map((item, i) => (
                        <span key={i} className="text-[#00ff00] text-xs tracking-widest">{item}</span>
                    ))}
                </div>
                <span className="text-[#00ff00] text-xs tracking-widest">{clock}</span>
            </div>

            {/* ── Sidebar ── */}
            <div className={`absolute top-10 left-0 bottom-0 w-56 bg-[#0a0a0a]/90 border-r border-green-900/40 p-4 z-30 transition-opacity duration-1000 ${chromeOpacity}`}>
                <div className="text-[#00ff00] text-xs font-bold tracking-[0.3em] mb-6 border-b border-green-900/40 pb-3">
                    MODULES
                </div>
                <ul className="space-y-3">
                    {SIDEBAR_MODULES.map((mod, i) => (
                        <li key={i} className="flex items-center justify-between text-xs">
                            <span className="text-green-400/70">{mod.label}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                mod.status === 'LOCKED' ? 'bg-red-900/30 text-red-400' :
                                mod.status === 'ARMED' ? 'bg-yellow-900/30 text-yellow-400' :
                                'bg-green-900/30 text-green-500'
                            }`}>
                                {mod.status}
                            </span>
                        </li>
                    ))}
                </ul>
                <div className="mt-8 border-t border-green-900/40 pt-4">
                    <div className="text-green-700/60 text-[10px] space-y-1.5">
                        <p>MEM: 16384 MB</p>
                        <p>CPU: 12 CORES</p>
                        <p>UPTIME: 72:14:09</p>
                        <p>PID: 31337</p>
                    </div>
                </div>
            </div>

            {/* ── Main Content Area ── */}
            <div className="absolute top-10 left-56 right-0 bottom-0 flex items-center justify-center z-20 p-8">

                {/* Center Modal */}
                <div
                    className="w-4/5 max-w-7xl min-h-[60vh] bg-black/80 backdrop-blur-md rounded-lg border border-green-500/40 flex flex-col items-center justify-center relative p-12"
                    style={{
                        boxShadow: '0 0 40px rgba(0,255,0,0.15), 0 0 80px rgba(0,255,0,0.05), inset 0 0 40px rgba(0,255,0,0.03)',
                    }}
                >
                    {/* Terminal header bar */}
                    <div className="absolute top-0 inset-x-0 h-8 bg-green-900/20 border-b border-green-500/20 flex items-center px-4 rounded-t-lg">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/80" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                            <div className="w-3 h-3 rounded-full bg-green-500/80" />
                        </div>
                        <span className="text-green-600/80 text-[10px] tracking-[0.3em] ml-4">
                            OVERRIDE_TERMINAL — /usr/bin/decrypt
                        </span>
                    </div>

                    <AnimatePresence mode="wait">

                        {/* ── IDLE ── */}
                        {stage === 'idle' && (
                            <motion.div
                                key="idle"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.4 }}
                                className="flex flex-col items-center gap-8"
                            >
                                {/* Decorative text above button */}
                                <div className="text-green-700/50 text-xs tracking-[0.4em] text-center space-y-1">
                                    <p>{'>'} AWAITING ADMIN AUTHORIZATION...</p>
                                    <p>{'>'} TARGET PAYLOAD READY</p>
                                </div>

                                {/* The big button */}
                                <motion.button
                                    onClick={startDecryption}
                                    className="border-2 border-[#00ff00] text-[#00ff00] bg-transparent px-16 py-6 text-3xl md:text-4xl font-black tracking-widest cursor-pointer transition-all hover:bg-[#00ff00]/10 hover:shadow-[0_0_40px_rgba(0,255,0,0.3)] active:scale-95"
                                    animate={{
                                        boxShadow: [
                                            '0 0 10px rgba(0,255,0,0.2)',
                                            '0 0 30px rgba(0,255,0,0.4)',
                                            '0 0 10px rgba(0,255,0,0.2)',
                                        ],
                                    }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                >
                                    [ EXECUTE_OVERRIDE.sh ]
                                </motion.button>

                                <p className="text-green-600/60 text-sm tracking-[0.3em]">
                                    PRESS SPACEBAR TO INITIATE
                                </p>
                            </motion.div>
                        )}

                        {/* ── DECRYPTING ── */}
                        {stage === 'decrypting' && (
                            <motion.div
                                key="decrypting"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="flex flex-col items-center gap-6 w-full"
                            >
                                {/* Status header */}
                                <div className="text-yellow-400 text-sm tracking-[0.3em] animate-pulse">
                                    ⚠ DECRYPTING CLASSIFIED PAYLOAD...
                                </div>

                                {/* Progress bar */}
                                <div className="w-full max-w-2xl h-1 bg-green-900/30 rounded overflow-hidden">
                                    <motion.div
                                        className="h-full bg-[#00ff00]"
                                        initial={{ width: '0%' }}
                                        animate={{ width: '100%' }}
                                        transition={{ duration: suspenseDurationMs / 1000, ease: 'linear' }}
                                    />
                                </div>

                                {/* The scrambled text */}
                                <motion.div
                                    className="text-[#00ff00] text-5xl md:text-7xl lg:text-8xl font-black tracking-wider text-center break-all leading-tight px-4"
                                    style={{
                                        textShadow: '0 0 20px rgba(0,255,0,0.6), 0 0 40px rgba(0,255,0,0.3)',
                                    }}
                                >
                                    {scrambledText || generateScramble(winnerName.length)}
                                </motion.div>

                                {/* Fake log lines */}
                                <div className="text-green-700/50 text-xs tracking-wider text-center space-y-0.5 mt-4">
                                    <p>{'>'} brute_force --algorithm=SHA-512 --threads=12</p>
                                    <p>{'>'} rainbow_table_lookup: scanning 2.4B hashes...</p>
                                    <p>{'>'} entropy_level: CRITICAL</p>
                                </div>
                            </motion.div>
                        )}

                        {/* ── REVEALED ── */}
                        {stage === 'revealed' && (
                            <motion.div
                                key="revealed"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5 }}
                                className="flex flex-col items-center gap-6 w-full"
                            >
                                {/* ACCESS GRANTED badge */}
                                <motion.div
                                    initial={{ scale: 3, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.4, ease: 'easeOut' }}
                                    className="text-[#00ff00] text-sm tracking-[0.5em] border border-green-500/40 px-6 py-2 bg-green-900/20"
                                >
                                    ✓ ACCESS GRANTED — DECRYPTION COMPLETE
                                </motion.div>

                                {/* Photo with glitch effect */}
                                {winnerPhotoUrl && (
                                    <motion.div
                                        className="relative"
                                        initial={{ y: -200, opacity: 0, scale: 0.5 }}
                                        animate={{
                                            y: 0,
                                            opacity: 1,
                                            scale: 1,
                                            x: [0, -5, 5, -5, 5, -3, 3, 0],
                                        }}
                                        transition={{
                                            y: { type: 'spring', stiffness: 200, damping: 15 },
                                            opacity: { duration: 0.3 },
                                            scale: { type: 'spring', stiffness: 200, damping: 15 },
                                            x: { duration: 0.3, delay: 0.3, ease: 'linear' },
                                        }}
                                    >
                                        <motion.img
                                            src={`${winnerPhotoUrl?.startsWith('http') ? winnerPhotoUrl : `${API_URL}${winnerPhotoUrl}`}`}
                                            alt="Winner"
                                            className="w-48 h-48 md:w-64 md:h-64 rounded-lg object-cover border-2 border-[#00ff00]"
                                            style={{
                                                boxShadow: '0 0 30px rgba(0,255,0,0.4), 0 0 60px rgba(0,255,0,0.2)',
                                            }}
                                            initial={{ opacity: 0.5 }}
                                            animate={{ opacity: [0.5, 1, 0.6, 1, 0.7, 1] }}
                                            transition={{ duration: 0.3, delay: 0.3 }}
                                        />
                                    </motion.div>
                                )}

                                {/* Winner Name */}
                                <motion.h1
                                    initial={{ y: 40, opacity: 0, filter: 'blur(10px)' }}
                                    animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                                    transition={{ delay: 0.5, duration: 0.6, ease: 'easeOut' }}
                                    className="text-[#00ff00] text-6xl md:text-8xl font-black text-center tracking-tight uppercase"
                                    style={{
                                        textShadow: '0 0 30px rgba(0,255,0,0.6), 0 0 60px rgba(0,255,0,0.3), 0 0 100px rgba(0,255,0,0.15)',
                                    }}
                                >
                                    {winnerName}
                                </motion.h1>

                                {/* Winner Title */}
                                <motion.p
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.9, duration: 0.5 }}
                                    className="text-[#00ff00] text-2xl md:text-4xl font-bold tracking-widest uppercase"
                                    style={{
                                        textShadow: '0 0 15px rgba(0,255,0,0.5)',
                                    }}
                                >
                                    {winnerTitle}
                                </motion.p>

                                {/* Decorative bottom line */}
                                <motion.div
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{ delay: 1.2, duration: 0.6 }}
                                    className="w-full max-w-lg h-px bg-gradient-to-r from-transparent via-green-500 to-transparent mt-4"
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* ── Preload photo ── */}
            {winnerPhotoUrl && stage === 'idle' && (
                <img src={`${winnerPhotoUrl?.startsWith('http') ? winnerPhotoUrl : `${API_URL}${winnerPhotoUrl}`}`} alt="" className="hidden" />
            )}
        </div>
    );
}
