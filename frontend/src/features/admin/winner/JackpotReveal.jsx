import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { API_URL } from '@/api';

// ─── Synthetic Audio Engine ──────────────────────────────────────────────────
function createSlotAudioEngine() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    const playLeverChunk = () => {
        if (ctx.state === 'suspended') ctx.resume();
        // Heavy metallic ka-chunk
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(200, ctx.currentTime + 0.02);
        osc2.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
        gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.02);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc2.start(ctx.currentTime + 0.02);
        osc2.stop(ctx.currentTime + 0.12);
    };

    let tickInterval = null;
    let tickSpeed = 40;
    let tickSlowdown = null;

    const playTick = () => {
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200 + Math.random() * 400, ctx.currentTime);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.03);
    };

    const startTicking = (durationMs) => {
        tickSpeed = 40;
        tickInterval = setInterval(playTick, tickSpeed);

        // Gradually slow down ticking over the duration
        const slowdownStart = durationMs * 0.5;
        tickSlowdown = setTimeout(() => {
            clearInterval(tickInterval);
            tickSpeed = 80;
            tickInterval = setInterval(playTick, tickSpeed);

            setTimeout(() => {
                clearInterval(tickInterval);
                tickSpeed = 150;
                tickInterval = setInterval(playTick, tickSpeed);

                setTimeout(() => {
                    clearInterval(tickInterval);
                    tickSpeed = 300;
                    tickInterval = setInterval(playTick, tickSpeed);
                }, durationMs * 0.15);
            }, durationMs * 0.15);
        }, slowdownStart);
    };

    const stopTicking = () => {
        clearInterval(tickInterval);
        clearTimeout(tickSlowdown);
        tickInterval = null;
    };

    const playWinBells = () => {
        if (ctx.state === 'suspended') ctx.resume();
        // Triple bell chime
        [0, 0.15, 0.3, 0.5, 0.65, 0.8].forEach((delay) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1800 + Math.random() * 600, ctx.currentTime + delay);
            gain.gain.setValueAtTime(0.12, ctx.currentTime + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.4);
            osc.start(ctx.currentTime + delay);
            osc.stop(ctx.currentTime + delay + 0.4);
        });
    };

    return {
        playLeverChunk,
        startTicking,
        stopTicking,
        playWinBells,
        close: () => {
            stopTicking();
            ctx.close().catch(() => {});
        },
    };
}

// ─── Reel Item heights ───────────────────────────────────────────────────────
const ITEM_HEIGHT = 160; // px per name row

// ─── Component ───────────────────────────────────────────────────────────────
export default function JackpotReveal() {
    const [stage, setStage] = useState('idle'); // idle | leverPull | spinning | revealed
    const [leverState, setLeverState] = useState('idle'); // idle | pull
    const audioRef = useRef(null);
    const impactAudioRef = useRef(null);

    // Config from localStorage
    const config = useMemo(() => {
        try {
            const raw = localStorage.getItem('slotmachine_config');
            if (raw) return JSON.parse(raw);
        } catch { /* noop */ }
        return {};
    }, []);

    const winnerName = config.winnerName || 'Aakash (Team Mavericks)';
    const winnerTitle = config.title || 'Best Performer';
    const winnerPhotoUrl = config.winnerPhoto || '';
    const spinDurationS = config.suspenseDuration ? parseFloat(config.suspenseDuration) : 5;

    // Build reel from candidate list
    const candidateList = useMemo(() => {
        const raw = config.candidateNames || '';
        const parsed = raw.split(',').map(s => s.trim()).filter(Boolean);
        return parsed.length > 0 ? parsed : ['Player Alpha', 'Shadow X', 'Nova Strike', 'Blaze Runner', 'Cyber Hawk', 'Phoenix', 'Ghost Rider', 'Vortex'];
    }, [config.candidateNames]);

    // Create a long reel: candidates repeated many times + winner at end
    const reelItems = useMemo(() => {
        const repeats = [];
        for (let i = 0; i < 25; i++) {
            repeats.push(...candidateList.sort(() => Math.random() - 0.5));
        }
        repeats.push(winnerName);
        return repeats;
    }, [candidateList, winnerName]);

    const totalReelHeight = reelItems.length * ITEM_HEIGHT;
    // Final position: winner name (last item) centered in the window
    const finalY = -(totalReelHeight - ITEM_HEIGHT);

    // Audio setup
    useEffect(() => {
        audioRef.current = createSlotAudioEngine();
        impactAudioRef.current = new Audio('/jackpot-win.mp3');
        impactAudioRef.current.volume = 1.0;

        return () => {
            audioRef.current?.close();
            if (impactAudioRef.current) {
                impactAudioRef.current.pause();
                impactAudioRef.current.currentTime = 0;
            }
        };
    }, []);

    // Keyboard
    useEffect(() => {
        const handleKey = (e) => {
            if (e.code === 'Space' && stage === 'idle') {
                e.preventDefault();
                startSpin();
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [stage]);

    const startSpin = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            }
        } catch { /* noop */ }

        // Lever chunk sound + pull animation
        audioRef.current?.playLeverChunk();
        setLeverState('pull');
        setStage('leverPull');
    };

    // Called when the lever arm animation finishes at full extension
    const onLeverPullComplete = () => {
        setLeverState('idle');
        setStage('spinning');

        // Start tick sounds after a brief beat
        setTimeout(() => {
            audioRef.current?.startTicking(spinDurationS * 1000);
        }, 100);
    };

    const onSpinComplete = () => {
        audioRef.current?.stopTicking();
        setStage('revealed');

        // Win sounds
        audioRef.current?.playWinBells();
        if (impactAudioRef.current) {
            impactAudioRef.current.currentTime = 0;
            impactAudioRef.current.play().catch(console.error);
        }

        // Firecrackers from both sides
        const duration = 5000;
        const animationEnd = Date.now() + duration;
        const colors = ['#fbbf24', '#f59e0b', '#d4d4d8', '#e5e7eb', '#fcd34d', '#ffffff', '#ef4444'];
        
        const frame = () => {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 0.8 },
                colors: colors,
                zIndex: 200,
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1, y: 0.8 },
                colors: colors,
                zIndex: 200,
            });

            if (Date.now() < animationEnd) {
                requestAnimationFrame(frame);
            }
        };
        frame();
    };

    return (
        <div className={`h-screen w-screen overflow-hidden flex flex-col items-center select-none cursor-default transition-all duration-1000 ${stage === 'revealed' ? 'justify-end pb-8 md:pb-12' : 'justify-center'}`}
            style={{
                background: 'radial-gradient(ellipse at center, #450a0a 0%, #000000 60%, #000000 100%)',
            }}
        >
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none" style={{
                background: 'radial-gradient(circle at 50% 30%, rgba(250,204,21,0.06) 0%, transparent 60%)',
            }} />

            {/* ── The Cabinet ── */}
            <motion.div
                layout
                transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                className="relative flex items-stretch z-10"
            >

                {/* Main Machine Body */}
                <div className="relative flex flex-col items-center"
                    style={{
                        width: '900px',
                        background: 'linear-gradient(180deg, #4b5563 0%, #374151 20%, #1f2937 80%, #111827 100%)',
                        borderRadius: '24px',
                        border: '3px solid #6b7280',
                        borderTop: '8px solid #9ca3af',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.8), inset 0 2px 0 rgba(255,255,255,0.1), 0 0 120px rgba(250,204,21,0.08)',
                    }}
                >
                    {/* Top trim / marquee */}
                    <div className="w-full px-6 pt-5 pb-3">
                        <div className="text-center py-3 rounded-xl"
                            style={{
                                background: 'linear-gradient(180deg, #b91c1c 0%, #991b1b 50%, #7f1d1d 100%)',
                                boxShadow: '0 4px 15px rgba(185,28,28,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
                            }}
                        >
                            <h1 className="text-yellow-300 font-black text-3xl tracking-[0.2em] uppercase"
                                style={{ textShadow: '0 0 20px rgba(250,204,21,0.6), 0 2px 0 rgba(0,0,0,0.3)' }}
                            >
                                ★ BODHANTRA 2026 ★
                            </h1>
                        </div>
                    </div>

                    {/* ── Glass Screen Window ── */}
                    <div className="relative mx-6 mb-4 overflow-hidden"
                        style={{
                            width: '820px',
                            height: `${ITEM_HEIGHT}px`,
                            background: '#000',
                            borderRadius: '12px',
                            border: '4px solid #374151',
                            boxShadow: 'inset 0 30px 60px rgba(0,0,0,0.9), inset 0 -20px 40px rgba(0,0,0,0.7), 0 0 30px rgba(0,0,0,0.5)',
                        }}
                    >
                        {/* Glass glare */}
                        <div className="absolute inset-0 z-30 pointer-events-none rounded-lg"
                            style={{
                                background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 40%, transparent 80%, rgba(0,0,0,0.3) 100%)',
                            }}
                        />

                        {/* Center line indicator (REMOVED: User requested no red line) */}

                        <AnimatePresence mode="wait">
                            {stage === 'idle' && (
                                <motion.div
                                    key="idle-text"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 flex items-center justify-center z-10"
                                >
                                    <motion.p
                                        animate={{
                                            textShadow: [
                                                '0 0 10px rgba(250,204,21,0.3)',
                                                '0 0 30px rgba(250,204,21,0.6)',
                                                '0 0 10px rgba(250,204,21,0.3)',
                                            ],
                                        }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="text-yellow-400 text-3xl font-black tracking-[0.2em] uppercase"
                                    >
                                        [ PRESS SPACEBAR TO PULL LEVER ]
                                    </motion.p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* The Reel */}
                        {(stage === 'spinning' || stage === 'revealed') && (
                            <motion.div
                                className="absolute left-0 right-0 z-10"
                                initial={{ y: 0 }}
                                animate={{ y: finalY }}
                                transition={{
                                    duration: spinDurationS,
                                    ease: [0.15, 0.85, 0.15, 1],
                                }}
                                onAnimationComplete={onSpinComplete}
                            >
                                {reelItems.map((name, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-center font-black text-5xl md:text-6xl uppercase tracking-widest whitespace-nowrap px-8"
                                        style={{
                                            height: `${ITEM_HEIGHT}px`,
                                            color: i === reelItems.length - 1 ? '#fbbf24' : '#e2e8f0',
                                            textShadow: i === reelItems.length - 1
                                                ? '0 0 30px rgba(250,204,21,0.8), 0 0 60px rgba(250,204,21,0.4)'
                                                : '0 0 5px rgba(255,255,255,0.2)',
                                        }}
                                    >
                                        {name}
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </div>


                    {/* Bottom trim */}
                    <div className="w-full px-6 pb-5">
                        <div className="h-6 rounded-b-xl"
                            style={{
                                background: 'linear-gradient(180deg, #374151 0%, #1f2937 100%)',
                                borderTop: '2px solid #4b5563',
                            }}
                        />
                    </div>
                </div>

                {/* ── The Lever ── */}
                <div className="absolute right-[-50px] top-[20px]" style={{ width: '24px', height: '300px' }}>
                    {/* Pivot bracket (bottom hinge) */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full z-10"
                        style={{
                            background: 'linear-gradient(180deg, #6b7280 0%, #374151 100%)',
                            border: '3px solid #4b5563',
                            boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.25), 0 4px 12px rgba(0,0,0,0.6)',
                        }}
                    />

                    {/* The Arm (rotates from bottom-center hinge) */}
                    <motion.div
                        className="absolute inset-0"
                        style={{ transformOrigin: 'bottom center' }}
                        animate={
                            leverState === 'pull'
                                ? { rotateX: [0, 90, 85, 90, 0] }
                                : { rotateX: 0 }
                        }
                        transition={
                            leverState === 'pull'
                                ? {
                                    duration: 0.6,
                                    times: [0, 0.2, 0.3, 0.4, 1],
                                    ease: ['easeIn', 'easeOut', 'easeInOut', 'easeOut', 'circOut'],
                                }
                                : { duration: 0.2 }
                        }
                        onAnimationComplete={() => {
                            if (leverState === 'pull') onLeverPullComplete();
                        }}
                    >
                        {/* Rod */}
                        <div className="h-full w-full rounded-t-full"
                            style={{
                                background: 'linear-gradient(90deg, #6b7280 0%, #d1d5db 35%, #e5e7eb 50%, #9ca3af 65%, #6b7280 100%)',
                                boxShadow: '3px 0 6px rgba(0,0,0,0.3), -2px 0 4px rgba(255,255,255,0.1)',
                            }}
                        />

                        {/* Red Knob (top of arm) */}
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full"
                            style={{
                                background: 'radial-gradient(circle at 35% 35%, #f87171, #ef4444 30%, #b91c1c 60%, #7f1d1d 100%)',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.6), inset 0 -4px 8px rgba(0,0,0,0.3), 0 0 25px rgba(239,68,68,0.35)',
                            }}
                        />
                    </motion.div>
                </div>
            </motion.div>

            {/* ── Grand Title & Massive Photo (Top Half) ── */}
            <AnimatePresence>
                {stage === 'revealed' && (
                    <motion.div
                        className="absolute top-12 left-0 right-0 flex flex-col items-center gap-8 z-50 pointer-events-none"
                        initial={{ opacity: 0, y: -50, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 1.0, type: 'spring', stiffness: 150, damping: 12 }}
                    >
                        <h2 className="text-yellow-400 text-6xl md:text-8xl font-black tracking-[0.3em] uppercase text-center"
                            style={{
                                textShadow: '0 0 30px rgba(250,204,21,0.8), 0 0 60px rgba(250,204,21,0.5), 0 4px 10px rgba(0,0,0,0.8)',
                            }}
                        >
                            {winnerTitle}
                        </h2>

                        {winnerPhotoUrl && (
                            <motion.div
                                initial={{ scale: 0, rotate: -10, y: 50 }}
                                animate={{ scale: 1, rotate: 0, y: 0 }}
                                transition={{ delay: 1.2, type: 'spring', stiffness: 200, damping: 20 }}
                            >
                                <img
                                    src={`${API_URL}${winnerPhotoUrl}`}
                                    alt="Winner"
                                    className="w-80 h-80 md:w-[420px] md:h-[420px] rounded-full object-cover border-[8px] border-yellow-400 shadow-2xl"
                                    style={{
                                        boxShadow: '0 0 60px rgba(250,204,21,0.6), 0 0 150px rgba(250,204,21,0.3)',
                                    }}
                                />
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Preload photo ── */}
            {winnerPhotoUrl && stage === 'idle' && (
                <img src={`${API_URL}${winnerPhotoUrl}`} alt="" className="hidden" />
            )}
        </div>
    );
}
