import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { API_URL } from '@/api';

const STAGES = {
    IDLE: 'IDLE',
    SUSPENSE: 'SUSPENSE',
    DEAD_AIR: 'DEAD_AIR',
    REVEALED: 'REVEALED'
};

export default function JackpotDisplay() {
    const [config, setConfig] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [stage, setStage] = useState(STAGES.IDLE);
    
    // Audio References
    const spinAudioRef = useRef(null);
    const winAudioRef = useRef(null);

    // 1. Audio and Config Setup
    useEffect(() => {
        spinAudioRef.current = new Audio('/spin-music.mp3');
        spinAudioRef.current.loop = true;
        spinAudioRef.current.volume = 0.5;

        winAudioRef.current = new Audio('/jackpot-win.mp3');
        winAudioRef.current.volume = 1.0;

        const saved = localStorage.getItem('jackpot_config');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setConfig(parsed);
                setIsLoaded(true);
            } catch (e) {
                console.error('Failed to parse jackpot_config');
            }
        } else {
             // Fallback for immediate preview if nothing is saved
             setIsLoaded(true);
        }

        return () => {
            if (spinAudioRef.current) {
                spinAudioRef.current.pause();
                spinAudioRef.current.currentTime = 0;
            }
            if (winAudioRef.current) {
                winAudioRef.current.pause();
                winAudioRef.current.currentTime = 0;
            }
        };
    }, []);

    // 2. Keyboard Control (Spacebar REVEAL)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space' && stage === STAGES.IDLE && isLoaded) {
                e.preventDefault();
                triggerReveal();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });

    const triggerReveal = async () => {
        if (!isLoaded || stage !== STAGES.IDLE) return;
        
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            }
        } catch (err) {
            console.error('Cannot enter fullscreen:', err);
        }

        setStage(STAGES.SUSPENSE);

        if (spinAudioRef.current) {
            spinAudioRef.current.currentTime = 0;
            spinAudioRef.current.play().catch(console.error);
        }

        const durationSeconds = config?.spinDuration ? parseFloat(config.spinDuration) : 4.5;
        const suspenseMs = durationSeconds * 1000;

        setTimeout(() => {
            setStage(STAGES.DEAD_AIR);
            
            if (spinAudioRef.current) {
                spinAudioRef.current.pause();
                spinAudioRef.current.currentTime = 0;
            }

            setTimeout(() => {
                setStage(STAGES.REVEALED);
                triggerConfetti();
                
                if (winAudioRef.current) {
                    winAudioRef.current.currentTime = 0;
                    winAudioRef.current.play().catch(console.error);
                }
            }, 500);

        }, suspenseMs);
    };

    const triggerConfetti = () => {
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { 
            startVelocity: 60, 
            spread: 90, 
            ticks: 100, 
            zIndex: 100,
            colors: ['#22d3ee', '#d946ef', '#fcd34d']
        };

        const interval = setInterval(function() {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const particleCount = 50 * (timeLeft / duration);
            
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: 0, y: 1 }, angle: 60 }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: 1, y: 1 }, angle: 120 }));
        }, 250);
    };

    if (!isLoaded) {
        return <div className="h-screen w-screen bg-black flex items-center justify-center text-white text-2xl font-black">WAITING FOR SYSTEM...</div>;
    }

    return (
        <div className="h-screen w-screen overflow-hidden flex flex-col justify-center items-center relative bg-[url('/stage-bg.png')] bg-cover bg-center bg-no-repeat font-sans select-none cursor-none z-50">
            
            {/* The Stage Floor Glow */}
            <div className="absolute bottom-0 inset-x-0 h-[50vh] bg-gradient-to-t from-yellow-600/40 via-transparent to-transparent pointer-events-none z-0"></div>

            {/* Subtle Dark Overlay */}
            <div className="absolute inset-0 bg-black/20 z-0 pointer-events-none"></div>

            {/* Hidden Preloader for Wifi/Image latency */}
            {config?.winnerPhoto && stage === STAGES.IDLE && (
                <img src={`${config.winnerPhoto?.startsWith('http') ? config.winnerPhoto : `${API_URL}${config.winnerPhoto}`}`} alt="Preload" className="hidden" />
            )}

            <AnimatePresence>
                
                {/* IDLE STATE */}
                {stage === STAGES.IDLE && (
                    <motion.div 
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, filter: "blur(10px)" }}
                        transition={{ duration: 0.5 }}
                        className="relative z-10 flex flex-col items-center justify-center w-full"
                    >
                        {/* Glowing Header Typography */}
                        <h1 
                            className="font-black text-5xl md:text-6xl text-yellow-400 uppercase text-center mb-20 drop-shadow-xl"
                            style={{ textShadow: '0 0 30px rgba(250,204,21,0.8), 0 0 60px rgba(250,204,21,0.4)' }}
                        >
                            {config?.title || "CANDIDATE OF SESSION DAY 1"}
                        </h1>

                        {/* 3D REVEAL Button */}
                        <button 
                            onClick={triggerReveal}
                            className="rounded-full bg-gradient-to-b from-red-500 to-red-800 border-t-2 border-red-400 shadow-[0_10px_20px_rgba(0,0,0,0.5),0_0_50px_rgba(220,38,38,0.7)] px-24 py-8 hover:scale-105 active:scale-95 transition-all duration-200 outline-none cursor-pointer"
                        >
                            <span className="text-white font-black text-6xl tracking-widest text-center">
                                REVEAL
                            </span>
                        </button>
                        
                        {/* Helper Text */}
                        <p className="text-red-400/80 text-sm font-semibold tracking-[0.4em] uppercase mt-8 text-center text-shadow-sm">
                            PRESS SPACEBAR TO INITIATE
                        </p>
                    </motion.div>
                )}

                {/* SUSPENSE STATE */}
                {stage === STAGES.SUSPENSE && (
                    <motion.div 
                        key="suspense"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 2, filter: "blur(20px)" }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 z-10 flex items-center justify-center"
                    >
                        <motion.div
                            animate={{ 
                                scale: [1, 1.05, 1], 
                                textShadow: ["0px 0px 40px #facc15", "0px 0px 100px #facc15", "0px 0px 40px #facc15"] 
                            }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                            className="text-[20rem] md:text-[35rem] font-black text-yellow-200 leading-none drop-shadow-[0_20px_50px_rgba(0,0,0,1)]"
                        >
                            ?
                        </motion.div>
                    </motion.div>
                )}

                {/* DEAD AIR STATE */}
                {stage === STAGES.DEAD_AIR && (
                    <motion.div key="dead-air" className="absolute inset-0 bg-transparent z-50"></motion.div>
                )}

                {/* REVEALED STATE */}
                {stage === STAGES.REVEALED && (
                    <motion.div 
                        key="revealed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 z-20 flex flex-col items-center justify-between w-full h-full py-10 px-8"
                    >
                        {/* ── Title at the top ── */}
                        <motion.h1 
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.6 }}
                            className="text-5xl md:text-6xl font-black text-yellow-400 uppercase tracking-wider text-center flex-shrink-0"
                            style={{ textShadow: '0 0 30px rgba(250,204,21,0.8), 0 0 60px rgba(250,204,21,0.4)' }}
                        >
                            {config?.title || "CANDIDATE OF SESSION DAY 1"}
                        </motion.h1>

                        {/* ── Winner photo in the middle ── */}
                        {config?.winnerPhoto && (
                            <motion.div
                                initial={{ scale: 0.3, rotate: -25, opacity: 0 }}
                                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
                                className="w-64 h-64 md:w-[22rem] md:h-[22rem] rounded-full overflow-hidden border-[12px] border-yellow-400 shadow-[0_0_100px_rgba(250,204,21,0.8),inset_0_0_40px_rgba(0,0,0,0.8)] bg-slate-900 flex-shrink-0"
                            >
                                <img src={`${config.winnerPhoto?.startsWith('http') ? config.winnerPhoto : `${API_URL}${config.winnerPhoto}`}`} alt="Winner" className="w-full h-full object-cover" />
                            </motion.div>
                        )}
                        
                        {/* ── Winner name slot box at the bottom ── */}
                        <motion.div 
                            initial={{ y: 80, opacity: 0, filter: 'blur(10px)' }}
                            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                            transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                            className="text-center w-full max-w-5xl flex-shrink-0"
                        >
                            {/* Slot-machine style name box */}
                            <div
                                style={{
                                    background: 'linear-gradient(180deg, #1f2937 0%, #111827 100%)',
                                    border: '4px solid #374151',
                                    borderRadius: '16px',
                                    padding: '20px 40px',
                                    boxShadow: 'inset 0 10px 30px rgba(0,0,0,0.7), 0 0 40px rgba(250,204,21,0.15)',
                                }}
                            >
                                <h2 className="text-[3.5rem] md:text-[5.5rem] font-black text-yellow-100 uppercase tracking-widest drop-shadow-[0_0_40px_rgba(250,204,21,1)] leading-tight text-center">
                                    {config?.winnerName || "UNKNOWN"}
                                </h2>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
}
