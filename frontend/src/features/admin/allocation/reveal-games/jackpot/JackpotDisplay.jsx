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
                <img src={`${API_URL}${config.winnerPhoto}`} alt="Preload" className="hidden" />
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
                        className="absolute inset-0 z-20 flex flex-col items-center justify-center w-full h-full p-8"
                    >
                        {/* Make sure the persistent title still shows up top if desired, or we just render the REVEALED state */}
                        <div className="absolute top-0 inset-x-0 pt-16 pb-8 text-center flex-shrink-0 flex flex-col items-center justify-center pointer-events-none">
                            <motion.h1 
                                initial={{ y: -50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="text-5xl md:text-6xl font-black text-yellow-400 uppercase tracking-wider"
                                style={{ textShadow: '0 0 30px rgba(250,204,21,0.8), 0 0 60px rgba(250,204,21,0.4)' }}
                            >
                                {config?.title || "CANDIDATE OF SESSION DAY 1"}
                            </motion.h1>
                        </div>

                        {config?.winnerPhoto && (
                            <motion.div
                                initial={{ y: -800, rotate: -25, scale: 0.3 }}
                                animate={{ y: 0, rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                                className="w-80 h-80 md:w-[35rem] md:h-[35rem] rounded-full overflow-hidden border-[16px] border-yellow-400 shadow-[0_0_150px_rgba(250,204,21,0.8),inset_0_0_50px_rgba(0,0,0,0.8)] mb-8 relative bg-slate-900 mt-20"
                            >
                                <img src={`${API_URL}${config.winnerPhoto}`} alt="Winner" className="w-full h-full object-cover relative z-0" />
                            </motion.div>
                        )}
                        
                        <motion.div 
                            initial={{ y: 100, opacity: 0, filter: 'blur(10px)' }}
                            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                            transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                            className="text-center w-full max-w-6xl mt-4"
                        >
                            <h2 className="text-[5rem] md:text-[8rem] font-black text-yellow-100 uppercase tracking-tighter drop-shadow-[0_0_60px_rgba(250,204,21,1)] leading-[0.95] text-center w-full px-4 flex flex-col items-center justify-center">
                                {config?.winnerName ? (
                                    config.winnerName.split(' ').map((word, i) => (
                                        <span key={i} className="block">{word}</span>
                                    ))
                                ) : "UNKNOWN"}
                            </h2>
                        </motion.div>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
}
