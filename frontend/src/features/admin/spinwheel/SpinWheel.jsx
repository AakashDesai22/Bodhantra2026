import React, { useState, useRef, useCallback, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { X } from 'lucide-react';

export default function SpinWheel({ slices }) {
    const [spinDeg, setSpinDeg] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);
    const [winner, setWinner] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const wheelRef = useRef(null);
    const totalSpinsRef = useRef(0);

    const n = slices.length;
    const sliceAngle = 360 / n;

    // ── Build conic-gradient ──
    const conicStops = slices.map((s, i) => {
        const start = (i / n) * 100;
        const end = ((i + 1) / n) * 100;
        return `${s.color} ${start}% ${end}%`;
    }).join(', ');

    // ── Spin Logic ──
    const handleSpin = useCallback(() => {
        if (isSpinning || n < 2) return;
        setIsSpinning(true);
        setWinner(null);
        setShowModal(false);

        // Pick random winner
        const winnerIdx = Math.floor(Math.random() * n);
        const chosenSlice = slices[winnerIdx];

        // Calculate target degrees:
        // The pointer is at the TOP (12 o'clock). The wheel rotates clockwise.
        // Slice 0 starts at the top going clockwise.
        // To land on slice `winnerIdx`, we need the CENTER of that slice at the top.
        // Center of slice i = i * sliceAngle + sliceAngle/2
        // Since wheel rotates clockwise-positive, we rotate so that center is at 0deg (top).
        // targetInSlice = 360 - (winnerIdx * sliceAngle + sliceAngle / 2) positions the center at top
        const sliceCenter = winnerIdx * sliceAngle + sliceAngle / 2;
        const targetOffset = 360 - sliceCenter;

        // Add 5-8 full rotations for dramatic effect
        const extraRotations = (5 + Math.floor(Math.random() * 4)) * 360;

        // Accumulate total, never go backwards
        const newDeg = totalSpinsRef.current + extraRotations + targetOffset +
            (Math.random() * sliceAngle * 0.6 - sliceAngle * 0.3); // slight jitter within slice

        totalSpinsRef.current = newDeg;
        setSpinDeg(newDeg);

        // Winner will be announced via onTransitionEnd
        // Store the winner for the callback
        wheelRef.current._pendingWinner = chosenSlice;
    }, [isSpinning, n, slices, sliceAngle]);

    // ── Transition End — Trigger confetti + result ──
    const handleTransitionEnd = useCallback(() => {
        const chosenSlice = wheelRef.current?._pendingWinner;
        if (!chosenSlice) return;

        setWinner(chosenSlice);
        setIsSpinning(false);
        setShowModal(true);

        // 🎉 Confetti explosion
        const duration = 3000;
        const end = Date.now() + duration;

        const colors = [chosenSlice.color, '#00F0FF', '#A855F7', '#FFD700', '#FF003C'];

        (function frame() {
            confetti({
                particleCount: 4,
                angle: 60,
                spread: 80,
                origin: { x: 0, y: 0.7 },
                colors,
            });
            confetti({
                particleCount: 4,
                angle: 120,
                spread: 80,
                origin: { x: 1, y: 0.7 },
                colors,
            });
            if (Date.now() < end) requestAnimationFrame(frame);
        })();

        // Big center burst
        confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.6 },
            colors,
        });
    }, []);

    const closeModal = () => {
        setShowModal(false);
        setWinner(null);
    };

    // ── Render Slice Labels (SVG overlay) ──
    const renderSliceLabels = () => {
        const radius = 180;
        const labelRadius = radius * 0.62;

        return slices.map((slice, i) => {
            const midAngle = (i * sliceAngle + sliceAngle / 2) * (Math.PI / 180);
            // SVG coordinate system: 0deg is 3 o'clock, goes clockwise
            // But our gradient starts from top (12 o'clock) going clockwise
            // So adjust by -90deg
            const adjustedAngle = midAngle - Math.PI / 2;
            const x = 200 + labelRadius * Math.cos(adjustedAngle);
            const y = 200 + labelRadius * Math.sin(adjustedAngle);
            const rotDeg = i * sliceAngle + sliceAngle / 2;

            return (
                <g key={slice.id} transform={`rotate(${rotDeg}, ${x}, ${y})`}>
                    <text
                        x={x}
                        y={y - 8}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize={n <= 6 ? "22" : n <= 10 ? "18" : "14"}
                        fontWeight="bold"
                        style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)', userSelect: 'none' }}
                    >
                        {slice.emoji}
                    </text>
                    <text
                        x={x}
                        y={y + 14}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize={n <= 6 ? "11" : n <= 10 ? "9" : "7"}
                        fontWeight="bold"
                        letterSpacing="0.5"
                        style={{ textShadow: '0 1px 4px rgba(0,0,0,0.9)', userSelect: 'none' }}
                    >
                        {slice.name.length > 12 ? slice.name.slice(0, 11) + '…' : slice.name}
                    </text>
                </g>
            );
        });
    };

    return (
        <div className="flex flex-col items-center gap-6">
            {/* Wheel Container */}
            <div className="relative" style={{ width: 400, height: 400 }}>
                {/* Pointer (top center) */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20"
                    style={{ filter: 'drop-shadow(0 0 10px rgba(0,240,255,0.8))' }}>
                    <svg width="36" height="40" viewBox="0 0 36 40" fill="none">
                        <path d="M18 40L2 8L18 16L34 8L18 40Z" fill="#00F0FF" stroke="#0a0a0a" strokeWidth="2" />
                        <path d="M18 40L10 20L18 24L26 20L18 40Z" fill="#00d4e0" />
                    </svg>
                </div>

                {/* Outer Glow Ring */}
                <div
                    className="absolute inset-0 rounded-full"
                    style={{
                        background: 'conic-gradient(from 0deg, #00F0FF, #A855F7, #FF003C, #F59E0B, #22C55E, #00F0FF)',
                        padding: 4,
                        filter: `blur(0px) ${isSpinning ? 'drop-shadow(0 0 30px rgba(0,240,255,0.5))' : 'drop-shadow(0 0 15px rgba(0,240,255,0.3))'}`,
                        transition: 'filter 0.5s ease',
                    }}
                >
                    <div className="w-full h-full rounded-full bg-slate-950" />
                </div>

                {/* Neon border ring */}
                <div
                    className="absolute rounded-full border-[3px] border-cyan-400/40"
                    style={{ inset: 2 }}
                />

                {/* The Wheel */}
                <div
                    ref={wheelRef}
                    className="absolute rounded-full overflow-hidden"
                    style={{
                        inset: 8,
                        background: `conic-gradient(from 0deg, ${conicStops})`,
                        transform: `rotate(${spinDeg}deg)`,
                        transition: isSpinning
                            ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
                            : 'none',
                        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)',
                    }}
                    onTransitionEnd={handleTransitionEnd}
                >
                    {/* SVG labels overlay */}
                    <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 400 400"
                        className="absolute inset-0"
                        style={{ pointerEvents: 'none' }}
                    >
                        {/* Slice divider lines */}
                        {slices.map((_, i) => {
                            const angle = (i * sliceAngle - 90) * (Math.PI / 180);
                            const x2 = 200 + 195 * Math.cos(angle);
                            const y2 = 200 + 195 * Math.sin(angle);
                            return (
                                <line
                                    key={i}
                                    x1="200" y1="200"
                                    x2={x2} y2={y2}
                                    stroke="rgba(0,0,0,0.4)"
                                    strokeWidth="2"
                                />
                            );
                        })}
                        {renderSliceLabels()}
                    </svg>
                </div>

                {/* Center hub */}
                <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 rounded-full flex items-center justify-center"
                    style={{
                        width: 72,
                        height: 72,
                        background: 'radial-gradient(circle, #1a1a2e 0%, #0a0a14 100%)',
                        border: '3px solid rgba(0,240,255,0.5)',
                        boxShadow: '0 0 20px rgba(0,240,255,0.3), inset 0 0 15px rgba(0,240,255,0.1)',
                    }}
                >
                    <span className="text-cyan-400 text-xl font-black" style={{ fontFamily: "'Courier New', monospace" }}>
                        {isSpinning ? '◉' : '▶'}
                    </span>
                </div>
            </div>

            {/* SPIN Button */}
            <button
                onClick={handleSpin}
                disabled={isSpinning || n < 2}
                className={`relative group px-14 py-5 rounded-2xl font-black text-2xl tracking-wider transition-all duration-300 ${
                    isSpinning
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white hover:scale-105 active:scale-95 shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50'
                }`}
                style={{ fontFamily: "'Courier New', monospace" }}
            >
                {isSpinning ? (
                    <span className="animate-pulse">SPINNING...</span>
                ) : (
                    <>
                        <span className="relative z-10">⟐ SPIN! ⟐</span>
                        {/* Pulse glow */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-50 blur-lg group-hover:opacity-75 transition-opacity animate-pulse" />
                    </>
                )}
            </button>

            {n < 2 && (
                <p className="text-red-400 text-xs font-medium">Add at least 2 slices to spin!</p>
            )}

            {/* ── Winner Modal ── */}
            {showModal && winner && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={closeModal}>
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                    <div
                        className="relative max-w-lg w-full rounded-3xl overflow-hidden"
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'linear-gradient(135deg, #0a0a14 0%, #1a1a2e 50%, #0a0a14 100%)',
                            border: `3px solid ${winner.color}`,
                            boxShadow: `0 0 60px ${winner.color}40, 0 0 120px ${winner.color}20`,
                        }}
                    >
                        {/* Close button */}
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        {/* Content */}
                        <div className="relative p-10 md:p-14 text-center">
                            {/* Glowing background orb */}
                            <div
                                className="absolute inset-0 opacity-20"
                                style={{
                                    background: `radial-gradient(circle at 50% 40%, ${winner.color}, transparent 70%)`,
                                }}
                            />

                            <div className="relative z-10">
                                <div className="text-cyan-500 text-[10px] font-bold tracking-[0.4em] uppercase mb-4">
                                    ◆ Assignment Confirmed ◆
                                </div>

                                <div
                                    className="text-8xl md:text-9xl mb-4"
                                    style={{
                                        filter: `drop-shadow(0 0 30px ${winner.color})`,
                                        animation: 'bounce 1s ease-in-out infinite',
                                    }}
                                >
                                    {winner.emoji}
                                </div>

                                <h2
                                    className="text-3xl md:text-5xl font-black tracking-wide mb-3"
                                    style={{
                                        color: winner.color,
                                        textShadow: `0 0 30px ${winner.color}80, 0 0 60px ${winner.color}40`,
                                        fontFamily: "'Courier New', monospace",
                                    }}
                                >
                                    {winner.name}
                                </h2>

                                <p className="text-slate-400 text-sm font-medium" style={{ fontFamily: "'Courier New', monospace" }}>
                                    WELCOME TO YOUR TEAM
                                </p>

                                <div className="mt-8">
                                    <button
                                        onClick={closeModal}
                                        className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-600 transition-all hover:scale-105"
                                        style={{ fontFamily: "'Courier New', monospace" }}
                                    >
                                        CONTINUE →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
