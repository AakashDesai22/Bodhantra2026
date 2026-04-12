import React, { useState, useEffect, useRef } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/~`';

export default function TerminalDecryptor({ participant, onGenerate, onComplete }) {
    const [phase, setPhase] = useState('idle'); // 'idle' | 'fetching' | 'decrypting' | 'revealed'
    const [scrambledText, setScrambledText] = useState('> SYSTEM READY...');
    const intervalRef = useRef(null);

    const handleDecrypt = async () => {
        if (!participant || phase !== 'idle') return;
        
        setPhase('fetching');
        setScrambledText('> TRANSMITTING SECURE OVERRIDE CODES...\n> ESTABLISHING UPLINK...');

        try {
            let finalParticipant = participant;
            if (onGenerate) {
                finalParticipant = await onGenerate(participant.user_id);
            }

            setPhase('decrypting');

            const startTime = Date.now();
            const duration = 3000;

            // Final target text
            const targetText = `> MATCH: ${finalParticipant.group_name.toUpperCase()}
> ROLE: ${finalParticipant.role ? finalParticipant.role.toUpperCase() : 'ASSIGNED'}
> SEAT: R${finalParticipant.seat_row || 'X'}-C${finalParticipant.seat_col || 'X'}`;

            intervalRef.current = setInterval(() => {
                const elapsed = Date.now() - startTime;
                
                if (elapsed >= duration) {
                    // Done
                    clearInterval(intervalRef.current);
                    setScrambledText(targetText);
                    setPhase('revealed');
                    if (onComplete) onComplete();
                    return;
                }

                // Scrambling: progress determines how many correct characters to show
                const progress = elapsed / duration;
                const targetLines = targetText.split('\n');
                
                const newLines = targetLines.map(line => {
                    const chars = line.split('');
                    return chars.map((char, i) => {
                        // Don't scramble newlines or spaces (to keep structure)
                        if (char === ' ' || char === '>' || char === ':') return char;
                        
                        // The further along the line, the later it locks in
                        const lockThreshold = (i / chars.length) * 0.8; 
                        if (progress > lockThreshold + Math.random() * 0.2) {
                            return char; // locked in
                        }
                        
                        // Scrambled character
                        return CHARS[Math.floor(Math.random() * CHARS.length)];
                    }).join('');
                });

                setScrambledText(newLines.join('\n'));
            }, 50); // Updates every 50ms for that fast terminal feel

        } catch (err) {
            console.error('Terminal decryption uplink failed', err);
            setPhase('idle');
            setScrambledText('> UPLINK FAILED. RETRY INITIATION.');
        }
    };

    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    // Reset when a new participant is passed
    useEffect(() => {
        setPhase('idle');
        setScrambledText('> AWAITING BIOMETRIC INITIATION...');
    }, [participant]);

    return (
        <div className="w-full max-w-3xl mx-auto flex flex-col items-center gap-8">
            {/* Terminal Window */}
            <div className="w-full bg-slate-950 rounded-xl border border-slate-800 shadow-2xl overflow-hidden relative" style={{ height: '350px' }}>
                
                {/* Terminal Header */}
                <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/80" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                        <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <div className="text-xs font-mono text-slate-500">root@mavericks:~/core_engine</div>
                    <div className="w-16" /> {/* Spacer */}
                </div>

                {/* Scanline Effect Overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-10" />

                {/* Terminal Content */}
                <div className="relative h-full p-8 overflow-hidden font-mono text-lg md:text-2xl leading-relaxed whitespace-pre-wrap flex flex-col justify-center">
                    
                    {/* The glowing sweeper line during decryption */}
                    {phase === 'decrypting' && (
                        <div className="absolute left-0 right-0 h-1 bg-green-500/50 shadow-[0_0_20px_5px_rgba(34,197,94,0.5)] animate-sweep z-20" />
                    )}

                    <div className={`
                        relative z-0 transition-all duration-300
                        ${phase === 'idle' ? 'text-green-500/50' : ''}
                        ${phase === 'fetching' ? 'text-green-500/80 animate-pulse' : ''}
                        ${phase === 'decrypting' ? 'text-green-400 saturate-150' : ''}
                        ${phase === 'revealed' ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] scale-105 transform origin-left' : ''}
                    `}>
                        {scrambledText}
                        <span className="inline-block w-3 h-6 bg-green-500 ml-2 animate-blink align-middle" />
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <button
                onClick={handleDecrypt}
                disabled={!participant || phase !== 'idle'}
                className={`
                    px-12 py-4 rounded-lg font-bold font-mono text-xl tracking-widest transition-all duration-300
                    border-2
                    ${(!participant || phase !== 'idle') 
                        ? 'border-slate-800 bg-slate-900 text-slate-600 cursor-not-allowed' 
                        : 'border-green-500 bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] cursor-pointer'
                    }
                `}
            >
                {phase === 'idle' ? 'INITIATE DECRYPT' : (phase === 'fetching' || phase === 'decrypting') ? 'PROCESSING...' : 'ACCESS GRANTED'}
            </button>
            
            {!participant && (
                <p className="text-red-400 text-sm font-mono mt-2">No participant selected.</p>
            )}

            <style dangerouslySetInnerHTML={{__html: `
                @keyframes sweep {
                    0% { top: 0%; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                .animate-sweep {
                    animation: sweep 2s ease-in-out infinite;
                }
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0; }
                }
                .animate-blink {
                    animation: blink 1s step-end infinite;
                }
            `}} />
        </div>
    );
}
