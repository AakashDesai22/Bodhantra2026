import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

// Dummy arrays for slot animation blurring effects
const GROUPS = ['TEAM PHOENIX', 'SQUAD NEON', 'CLUSTER VORTEX', 'NEURAL NET', 'CYBER SYNDICATE', 'DATA GHOSTS', 'SYNTH WAVE', 'VOID RUNNERS'];
const ROLES = ['LEADER', 'SCRIBE', 'PRESENTER', 'ANALYST', 'STRATEGIST', 'OBSERVER', 'HACKER', 'ENGINEER'];
const ZONES = ['ZONE ALPHA', 'ZONE BETA', 'ZONE GAMMA', 'HOT ZONE', 'CHILL ZONE', 'ACTIVE ZONE', 'GRID 1', 'GRID 2'];

// Slot Reel Component
const SlotReel = ({ targetValue, items, delay, startSpin }) => {
    const controls = useAnimation();
    const itemHeight = 80; // Fixed height per item for math
    
    // We generate a massive array of items so it looks infinite while spinning
    const spinItems = [...items, ...items, ...items, ...items, targetValue];
    
    useEffect(() => {
        if (startSpin) {
            // Calculate final Y position (we want the targetValue to land exactly in the center)
            // It's the very last element in our array
            const finalY = -((spinItems.length - 1) * itemHeight);
            
            // Animation sequence
            const sequence = async () => {
                // Reset to top instantly
                await controls.set({ y: 0, filter: 'blur(0px)' });
                
                // Spin fast with blur
                controls.start({
                    y: finalY,
                    filter: ['blur(0px)', 'blur(8px)', 'blur(10px)', 'blur(5px)', 'blur(0px)'],
                    transition: {
                        duration: delay,     // Stagger the stopping delays
                        ease: [0.15, 0.85, 0.35, 1], // easeOutCubic-ish for realistic slowdown
                    }
                });
            };
            sequence();
        }
    }, [startSpin, targetValue, delay, controls, spinItems.length]);

    return (
        <div className="relative h-[240px] w-full overflow-hidden bg-slate-950/80 rounded-xl border-2 border-cyan-500/30 shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]">
            
            {/* Center target highlighter (glassmorphism overlay) */}
            <div className="absolute top-1/2 left-0 right-0 h-[80px] -translate-y-1/2 bg-cyan-500/10 border-y border-cyan-400/50 shadow-[0_0_15px_rgba(0,240,255,0.2)] z-10 pointer-events-none backdrop-blur-[2px]" />
            
            {/* Fading gradients top and bottom */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-slate-950 to-transparent z-20 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-950 to-transparent z-20 pointer-events-none" />

            {/* The spinning list */}
            <motion.div 
                className="w-full flex flex-col items-center"
                // Start offset so item 0 is vertically centered
                style={{ paddingTop: 80 }} 
                animate={controls}
            >
                {spinItems.map((val, i) => (
                    <div 
                        key={i} 
                        className="h-[80px] w-full flex items-center justify-center text-xl md:text-2xl font-black tracking-widest text-cyan-50"
                        style={{ fontFamily: "'Courier New', monospace", textShadow: '0 0 10px rgba(0,240,255,0.5)' }}
                    >
                        {val}
                    </div>
                ))}
            </motion.div>
        </div>
    );
};

export default function NeonSlotMachine({ participant, onGenerate, onComplete }) {
    const [status, setStatus] = useState('idle'); // idle | fetching | spinning | complete
    const [finalData, setFinalData] = useState(null);

    // Reset when a new participant is passed
    useEffect(() => {
        setStatus('idle');
        setFinalData(null);
    }, [participant]);

    const handleSpin = async () => {
        if (!participant || status !== 'idle') return;
        setStatus('fetching');

        try {
            let result = participant;
            if (onGenerate) {
                result = await onGenerate(participant.user_id);
            }
            setFinalData(result);
            setStatus('spinning');

            // Longest reel takes 4 seconds
            setTimeout(() => {
                setStatus('complete');
                if (onComplete) onComplete();
            }, 4000);
        } catch (err) {
            console.error('Spin failed', err);
            setStatus('idle');
        }
    };

    if (!participant) {
        return <div className="text-center p-12 text-slate-500 font-mono">WAITING FOR NEXT PARTICIPANT...</div>;
    }

    const activeData = finalData || participant;
    const targetGroup = activeData.group_name === 'PENDING' ? '???' : activeData.group_name.toUpperCase();
    const targetRole = activeData.role === 'PENDING' ? '???' : (activeData.role ? activeData.role.toUpperCase() : 'MEMBER');
    const targetZone = (activeData.seat_row && activeData.seat_col) ? `R${activeData.seat_row} - C${activeData.seat_col}` : '???.???';

    const isSpinning = status === 'spinning';
    const hasSpun = status === 'complete';

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-10">
            
            <div className="w-full p-8 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl relative">
                {/* Neon title */}
                <h3 className="text-center text-cyan-400 font-bold mb-8 tracking-[0.3em] text-sm uppercase">
                    ◆ Allocation Generator ◆
                </h3>

                {/* The 3 Slots */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <div className="text-center text-xs font-bold text-slate-500 mb-2 tracking-widest uppercase">TEAM</div>
                        <SlotReel 
                            targetValue={targetGroup} 
                            items={GROUPS} 
                            delay={2.0} // stops first
                            startSpin={isSpinning} 
                        />
                    </div>
                    <div>
                        <div className="text-center text-xs font-bold text-slate-500 mb-2 tracking-widest uppercase">ROLE</div>
                        <SlotReel 
                            targetValue={targetRole} 
                            items={ROLES} 
                            delay={3.0} // stops second
                            startSpin={isSpinning} 
                        />
                    </div>
                    <div>
                        <div className="text-center text-xs font-bold text-slate-500 mb-2 tracking-widest uppercase">SEATING</div>
                        <SlotReel 
                            targetValue={targetZone} 
                            items={ZONES} 
                            delay={4.0} // stops third
                            startSpin={isSpinning} 
                        />
                    </div>
                </div>

                {/* Celebration overlay border effect */}
                <div className={`absolute inset-0 rounded-3xl border-2 transition-all duration-500 pointer-events-none ${hasSpun ? 'border-cyan-400 shadow-[0_0_30px_rgba(0,240,255,0.3)]' : 'border-transparent'}`} />
            </div>

            {/* Action Frame */}
            <div className="flex flex-col items-center gap-4">
                <button
                    onClick={handleSpin}
                    disabled={status !== 'idle'}
                    className={`
                        relative group px-16 py-5 rounded-full font-black text-2xl tracking-widest transition-all duration-300 overflow-hidden
                        ${(status !== 'idle')
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed scale-95'
                            : 'bg-slate-900 text-cyan-400 hover:text-white border-2 border-cyan-500 hover:shadow-[0_0_40px_rgba(0,240,255,0.6)] hover:scale-105 active:scale-95'
                        }
                    `}
                    style={{ fontFamily: "'Courier New', monospace" }}
                >
                    {/* Glowing background transition */}
                    {status === 'idle' && (
                        <div className="absolute inset-0 bg-cyan-600 top-full group-hover:top-0 transition-all duration-300 -z-10" />
                    )}
                    
                    <span className="relative z-10">
                        {status === 'fetching' ? 'CONNECTING...' : (isSpinning ? 'GENERATING...' : hasSpun ? 'LOCKED IN' : 'ROLL ASSIGNMENT')}
                    </span>
                </button>
                
                {hasSpun && (
                    <div className="text-cyan-500 text-sm font-bold tracking-widest animate-pulse">
                        PARTICIPANT ASSIGNMENT CONFIRMED
                    </div>
                )}
            </div>
        </div>
    );
}
