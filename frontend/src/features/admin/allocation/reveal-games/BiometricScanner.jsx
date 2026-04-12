import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Fingerprint } from 'lucide-react';

export default function BiometricScanner({ participant, onGenerate, onComplete }) {
    const [progress, setProgress] = useState(0); // 0 to 100
    const [isScanning, setIsScanning] = useState(false);
    const [hasScanned, setHasScanned] = useState(false);
    const [showIDCard, setShowIDCard] = useState(false);
    const [finalData, setFinalData] = useState(null);
    
    const requestRef = useRef();
    const startTimeRef = useRef(null);

    const DURATIONMs = 3000; // 3 seconds to full scan

    // The animation loop for perfectly smooth circular progress
    const animateScan = useCallback((time) => {
        if (!startTimeRef.current) startTimeRef.current = time;
        const elapsed = time - startTimeRef.current;
        
        // Calculate percentage (0 to 100)
        const currentProgress = Math.min((elapsed / DURATIONMs) * 100, 100);
        setProgress(currentProgress);

        if (currentProgress < 100) {
            requestRef.current = requestAnimationFrame(animateScan);
        } else {
            // Reached 100%
            setIsScanning(false);
            setHasScanned(true);
        }
    }, []);

    // Handle scan start
    const handleStartScan = (e) => {
        // Prevent default to avoid text selection or weird mobile context menus
        e.preventDefault(); 
        
        if (!participant || hasScanned) return;
        
        setIsScanning(true);
        startTimeRef.current = null; // Reset for `animateScan` calculate
        requestRef.current = requestAnimationFrame(animateScan);
    };

    // Handle scan release
    const handleStopScan = () => {
        if (hasScanned) return; // Ignore if already completed
        
        setIsScanning(false);
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        setProgress(0); // Reset progress instantly
    };

    // Cleanup RAF if unmounted
    useEffect(() => {
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    // Reset state if a new participant is passed
    useEffect(() => {
        setProgress(0);
        setIsScanning(false);
        setHasScanned(false);
        setShowIDCard(false);
        setFinalData(null);
    }, [participant]);

    // Async generation trigger
    useEffect(() => {
        let active = true;
        if (hasScanned && !showIDCard && !finalData) {
            const runGeneration = async () => {
                try {
                    let result = participant;
                    if (onGenerate) {
                        result = await onGenerate(participant.user_id);
                    }
                    if (!active) return;
                    setFinalData(result);
                    
                    // Trigger flashy transition to ID Card
                    setTimeout(() => {
                        if (!active) return;
                        setShowIDCard(true);
                        if (onComplete) onComplete();
                    }, 500); 
                } catch (err) {
                    console.error('Biometric generation failed', err);
                    if (!active) return;
                    // Reset if network failed
                    setProgress(0);
                    setHasScanned(false);
                }
            };
            runGeneration();
        }
        return () => { active = false; };
    }, [hasScanned, showIDCard, finalData, participant, onGenerate, onComplete]);

    // Calculate SVG circle offset based on progress
    const circleRadius = 120;
    const circleCircumference = 2 * Math.PI * circleRadius;
    const strokeDashoffset = circleCircumference - (progress / 100) * circleCircumference;

    if (!participant) {
        return <div className="text-center p-12 text-slate-500 font-mono">AWAITING BIOMETRIC TARGET...</div>;
    }

    const activeData = finalData || participant;

    if (showIDCard) {
        return (
            <div className="w-full max-w-2xl mx-auto flex justify-center animate-in zoom-in duration-500">
                {/* ID Card Wrapper */}
                <div 
                    className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl bg-slate-900 border border-slate-700 p-8"
                    style={{
                        boxShadow: '0 0 50px rgba(0, 240, 255, 0.2), inset 0 0 30px rgba(0, 240, 255, 0.1)',
                    }}
                >
                    {/* Security Hologram Background effect */}
                    <div className="absolute inset-0 opacity-10" style={{
                        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,240,255,0.5) 10px, rgba(0,240,255,0.5) 20px)`,
                        backgroundSize: '200% 200%',
                        animation: 'hologramScroll 20s linear infinite'
                    }} />

                    <div className="relative z-10">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-8 pb-4 border-b border-cyan-500/30">
                            <div>
                                <h4 className="text-cyan-400 text-xs font-bold tracking-[0.3em] uppercase mb-1">TEAM MAVERICKS</h4>
                                <h2 className="text-white text-3xl font-black">{activeData.name.toUpperCase()}</h2>
                            </div>
                            <Fingerprint className="text-cyan-500 opacity-50" size={40} />
                        </div>

                        {/* Details Grid */}
                        <div className="space-y-6">
                            <div>
                                <div className="text-slate-500 text-[10px] font-bold tracking-widest uppercase mb-1">ASSIGNED SQUAD</div>
                                <div className="text-cyan-400 text-4xl py-2 px-4 bg-cyan-950/50 rounded-lg border border-cyan-900/50 font-black" style={{ fontFamily: "'Courier New', monospace" }}>
                                    {activeData.group_name.toUpperCase()}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-slate-500 text-[10px] font-bold tracking-widest uppercase mb-1">SECURITY ROLE</div>
                                    <div className="text-white text-lg font-bold tracking-wide">
                                        {activeData.role ? activeData.role.toUpperCase() : 'OPERATIVE'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-slate-500 text-[10px] font-bold tracking-widest uppercase mb-1">GRID COORDINATES</div>
                                    <div className="text-white text-lg font-mono font-bold tracking-wide">
                                        R{activeData.seat_row || 'X'} / C{activeData.seat_col || 'X'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Barcode Footer */}
                        <div className="mt-8 pt-4 border-t border-slate-800 flex justify-between items-center">
                            <div className="w-full h-8 flex gap-1 opacity-50">
                                {Array.from({length: 20}).map((_, i) => (
                                    <div key={i} className={`h-full bg-slate-500`} style={{ width: `${Math.random() * 8 + 2}px` }} />
                                ))}
                            </div>
                            <div className="text-xs font-mono text-slate-500 ml-4">
                                ACK-{(Date.now() % 1000000).toString().padStart(6, '0')}
                            </div>
                        </div>
                    </div>

                    <style dangerouslySetInnerHTML={{__html: `
                        @keyframes hologramScroll {
                            0% { background-position: 0% 0%; }
                            100% { background-position: 100% 100%; }
                        }
                    `}} />
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col items-center justify-center p-8 gap-12">
            
            {/* Header Text */}
            <div className="text-center space-y-2">
                <h3 className="text-cyan-400 text-xl md:text-2xl font-black tracking-[0.3em] uppercase">
                    BIOMETRIC SCAN REQUIRED
                </h3>
                <p className="text-slate-500 font-mono text-sm max-w-sm">
                    Hold fingerprint to authenticate identity and access secure assignment.
                </p>
            </div>

            {/* Hold to Scan UI */}
            <div 
                className="relative flex items-center justify-center cursor-pointer user-select-none"
                style={{ width: '300px', height: '300px' }}
                onMouseDown={handleStartScan}
                onMouseUp={handleStopScan}
                onMouseLeave={handleStopScan}
                onTouchStart={handleStartScan}
                onTouchEnd={handleStopScan}
            >
                {/* SVG Progress Ring */}
                <svg className="-rotate-90 absolute w-full h-full" viewBox="0 0 300 300">
                    {/* Background Ring */}
                    <circle
                        cx="150"
                        cy="150"
                        r={circleRadius}
                        fill="transparent"
                        stroke="rgba(15, 23, 42, 0.8)" // slate-900ish
                        strokeWidth="12"
                    />
                    
                    {/* Animated Progress Ring */}
                    <circle
                        cx="150"
                        cy="150"
                        r={circleRadius}
                        fill="transparent"
                        stroke={hasScanned ? '#22C55E' : '#00F0FF'} // Green when done, Cyan while scanning
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={circleCircumference}
                        strokeDashoffset={strokeDashoffset}
                        style={{
                            transition: isScanning ? 'none' : 'stroke-dashoffset 0.3s ease-out',
                            filter: 'drop-shadow(0 0 8px rgba(0, 240, 255, 0.5))'
                        }}
                    />
                </svg>

                {/* Fingerprint Icon Container */}
                <div className={`
                    relative z-10 w-40 h-40 rounded-full flex items-center justify-center transition-all duration-300
                    ${isScanning ? 'bg-cyan-900/40 shadow-[0_0_50px_rgba(0,240,255,0.4)] scale-105' : 'bg-slate-900 hover:bg-slate-800'}
                    ${hasScanned ? 'bg-green-900/40 shadow-[0_0_50px_rgba(34,197,94,0.4)]' : ''}
                `}>
                    <Fingerprint 
                        size={80} 
                        className={`transition-all duration-300 ${isScanning ? 'text-cyan-400 animate-pulse' : hasScanned ? 'text-green-400' : 'text-slate-600'}`} 
                        strokeWidth={1.5}
                    />

                    {/* Scanning radar sweep overlay */}
                    {isScanning && !hasScanned && (
                        <div 
                            className="absolute inset-0 rounded-full border-t-2 border-cyan-400 opacity-50 animate-spin"
                            style={{ animationDuration: '2s' }}
                        />
                    )}
                </div>

                {/* Status Text under fingerprint inside the ring */}
                <div className="absolute top-[80%] text-center w-full">
                    {hasScanned ? (
                        <span className="text-green-400 font-bold text-sm tracking-widest animate-pulse">
                            {finalData ? 'ACCESS GRANTED' : 'GENERATING...'}
                        </span>
                    ) : isScanning ? (
                        <span className="text-cyan-400 font-bold text-sm tracking-widest">({Math.floor(progress)}%)</span>
                    ) : (
                        <span className="text-slate-500 font-bold text-sm tracking-widest uppercase">Hold to Scan</span>
                    )}
                </div>
            </div>

            {/* Flash Effect on Completion */}
            {hasScanned && finalData && !showIDCard && (
                <div className="fixed inset-0 bg-white z-50 animate-in fade-in duration-300" style={{ animationTimingFunction: 'ease-out', animationDirection: 'alternate-reverse' }} />
            )}
        </div>
    );
}
