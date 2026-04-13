import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '@/api';

// ─── Constants ───────────────────────────────────────────────────────────────
const VAULT_OPEN_TIMESTAMP_S = 15; // seconds into the video when vault fully opens

// ─── Component ───────────────────────────────────────────────────────────────
export default function VaultVideoReveal() {
    const [stage, setStage] = useState('idle'); // idle | playing | revealed

    // Config from localStorage
    const config = useMemo(() => {
        try {
            const raw = localStorage.getItem('vault_config');
            if (raw) return JSON.parse(raw);
        } catch { /* noop */ }
        return {};
    }, []);

    const winnerName = config.winnerName || 'Aakash (Team Mavericks)';
    const winnerTitle = config.title || 'Best Performer';
    const winnerPhotoUrl = config.winnerPhoto || '';
    const suspenseDurationMs = (config.suspenseDuration ? parseFloat(config.suspenseDuration) : VAULT_OPEN_TIMESTAMP_S) * 1000;

    // Refs
    const videoRef = useRef(null);
    const revealAudioRef = useRef(null);

    // ── Audio setup ──
    useEffect(() => {
        revealAudioRef.current = new Audio('/jackpot-win.mp3');
        revealAudioRef.current.volume = 1.0;

        return () => {
            if (revealAudioRef.current) {
                revealAudioRef.current.pause();
                revealAudioRef.current.currentTime = 0;
            }
        };
    }, []);

    // ── Keyboard listener (Spacebar) ──
    useEffect(() => {
        const handleKey = (e) => {
            if (e.code === 'Space' && stage === 'idle') {
                e.preventDefault();
                startPlaying();
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [stage]);

    // ── State transitions ──
    const startPlaying = async () => {
        // Try fullscreen
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            }
        } catch { /* noop */ }

        setStage('playing');

        // Unmute and play the video
        if (videoRef.current) {
            videoRef.current.muted = false;
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(console.error);
        }

        // Transition to revealed after the configured suspense duration
        setTimeout(() => {
            triggerReveal();
        }, suspenseDurationMs);
    };

    const triggerReveal = () => {
        setStage('revealed');

        // Pause the video
        if (videoRef.current) {
            videoRef.current.pause();
        }

        // Play triumph audio
        if (revealAudioRef.current) {
            revealAudioRef.current.currentTime = 0;
            revealAudioRef.current.play().catch(console.error);
        }
    };

    return (
        <div className="h-screen w-screen bg-black overflow-hidden relative flex flex-col items-center justify-center select-none cursor-default">

            {/* ── Video Background ── */}
            <video
                ref={videoRef}
                className={`min-w-full min-h-full object-cover absolute top-0 left-0 transition-opacity duration-700 ${
                    stage === 'revealed' ? 'opacity-0' : 'opacity-100'
                }`}
                src="/vault.mp4"
                muted
                playsInline
                preload="auto"
            />

            {/* ── Dark overlay for readability ── */}
            <div className={`absolute inset-0 transition-all duration-700 ${
                stage === 'revealed'
                    ? 'bg-black'
                    : stage === 'playing'
                        ? 'bg-black/20'
                        : 'bg-black/40'
            }`} />

            {/* ── Golden radial glow background (revealed state) ── */}
            <AnimatePresence>
                {stage === 'revealed' && (
                    <motion.div
                        key="golden-glow"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0 z-0"
                        style={{
                            background: 'radial-gradient(ellipse at center, rgba(250,204,21,0.25) 0%, rgba(180,130,0,0.08) 40%, rgba(0,0,0,1) 80%)',
                        }}
                    />
                )}
            </AnimatePresence>

            {/* ── Vignette overlay ── */}
            <div
                className="absolute inset-0 pointer-events-none z-10"
                style={{
                    background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
                }}
            />

            {/* ── Content ── */}
            <div className="relative z-20 flex flex-col items-center justify-center w-full h-full">

                <AnimatePresence mode="wait">

                    {/* ── IDLE ── */}
                    {stage === 'idle' && (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            transition={{ duration: 0.5 }}
                            className="flex flex-col items-center gap-8"
                        >
                            {/* Spacebar prompt */}
                            <motion.div
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute bottom-16 left-0 right-0 text-center"
                            >
                                <div className="inline-flex items-center gap-3 bg-black/60 backdrop-blur-sm border border-yellow-500/30 rounded-xl px-8 py-4">
                                    <div className="w-16 h-10 bg-yellow-500/20 border border-yellow-500/50 rounded-lg flex items-center justify-center text-yellow-400 text-xs font-bold tracking-wider">
                                        SPACE
                                    </div>
                                    <span className="text-yellow-400/80 text-sm font-bold tracking-[0.3em] uppercase">
                                        Press to crack vault
                                    </span>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* ── PLAYING ── */}
                    {stage === 'playing' && (
                        <motion.div
                            key="playing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            transition={{ duration: 0.3 }}
                            className="flex flex-col items-center"
                        >
                            {/* Subtle indicator */}
                            <motion.div
                                animate={{ opacity: [0.3, 0.7, 0.3] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="absolute top-8 right-8 flex items-center gap-2 text-yellow-400/60 text-xs tracking-[0.3em]"
                            >
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                VAULT SEQUENCE ACTIVE
                            </motion.div>
                        </motion.div>
                    )}

                    {/* ── REVEALED ── */}
                    {stage === 'revealed' && (
                        <motion.div
                            key="revealed"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className="flex flex-col items-center gap-6 w-full px-4"
                        >
                            {/* Decorative top sparkle line */}
                            <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
                                className="w-full max-w-xl h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent"
                            />


                            {/* Winner Photo */}
                            {winnerPhotoUrl && (
                                <motion.div
                                    initial={{ y: -300, opacity: 0, scale: 0.3, rotate: -15 }}
                                    animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 180,
                                        damping: 14,
                                        delay: 0.6,
                                    }}
                                    className="relative"
                                >
                                    {/* Glow ring behind photo */}
                                    <div
                                        className="absolute -inset-4 rounded-full"
                                        style={{
                                            background: 'radial-gradient(circle, rgba(250,204,21,0.3) 0%, transparent 70%)',
                                        }}
                                    />
                                    <img
                                        src={`${winnerPhotoUrl?.startsWith('http') ? winnerPhotoUrl : `${API_URL}${winnerPhotoUrl}`}`}
                                        alt="Winner"
                                        className="w-56 h-56 md:w-72 md:h-72 rounded-full object-cover border-[6px] border-yellow-400 relative z-10"
                                        style={{
                                            boxShadow: '0 0 40px rgba(250,204,21,0.5), 0 0 80px rgba(250,204,21,0.25), inset 0 0 30px rgba(0,0,0,0.4)',
                                        }}
                                    />
                                </motion.div>
                            )}

                            {/* Winner Name */}
                            <motion.h1
                                initial={{ y: 50, opacity: 0, filter: 'blur(15px)' }}
                                animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                                transition={{ delay: 1.0, duration: 0.7, ease: 'easeOut' }}
                                className="text-yellow-400 text-6xl md:text-8xl lg:text-9xl font-black text-center tracking-tight uppercase leading-[0.95]"
                                style={{
                                    textShadow: '0 0 30px rgba(250,204,21,0.6), 0 0 60px rgba(250,204,21,0.3), 0 0 120px rgba(250,204,21,0.15)',
                                }}
                            >
                                {winnerName.split(' ').map((word, i) => (
                                    <span key={i} className="block">{word}</span>
                                ))}
                            </motion.h1>

                            {/* Winner Title */}
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.4, duration: 0.5 }}
                                className="text-white text-2xl md:text-4xl font-bold tracking-widest uppercase"
                                style={{
                                    textShadow: '0 0 10px rgba(255,255,255,0.3)',
                                }}
                            >
                                {winnerTitle}
                            </motion.p>

                            {/* Decorative bottom sparkle line */}
                            <motion.div
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ delay: 1.6, duration: 0.8, ease: 'easeOut' }}
                                className="w-full max-w-xl h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent mt-2"
                            />

                            {/* Floating particles decoration */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                {[...Array(20)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                                        initial={{
                                            x: `${Math.random() * 100}%`,
                                            y: '110%',
                                            opacity: 0,
                                        }}
                                        animate={{
                                            y: '-10%',
                                            opacity: [0, 0.8, 0],
                                        }}
                                        transition={{
                                            duration: 4 + Math.random() * 3,
                                            delay: 1 + Math.random() * 2,
                                            repeat: Infinity,
                                            ease: 'linear',
                                        }}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>

            {/* ── Preload photo ── */}
            {winnerPhotoUrl && stage === 'idle' && (
                <img src={`${winnerPhotoUrl?.startsWith('http') ? winnerPhotoUrl : `${API_URL}${winnerPhotoUrl}`}`} alt="" className="hidden" />
            )}
        </div>
    );
}
