import React, { useState } from 'react';
import { Terminal, AlignJustify, ScanFace } from 'lucide-react';
import TerminalDecryptor from './TerminalDecryptor';
import NeonSlotMachine from './NeonSlotMachine';
import BiometricScanner from './BiometricScanner';

export default function RevealSelector({ participant, onGenerate, onComplete }) {
    const [activeGame, setActiveGame] = useState('decryptor'); // decryptor | slot | scanner

    return (
        <div className="w-full flex flex-col gap-6">
            
            {/* Game Selector Tabs */}
            <div className="flex justify-center">
                <div className="inline-flex bg-slate-900 border border-slate-700/50 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveGame('decryptor')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                            activeGame === 'decryptor' 
                                ? 'bg-green-500/20 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]' 
                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                        }`}
                    >
                        <Terminal size={16} /> Terminal
                    </button>
                    
                    <button
                        onClick={() => setActiveGame('slot')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                            activeGame === 'slot' 
                                ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.3)]' 
                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                        }`}
                    >
                        <AlignJustify size={16} /> Slot Machine
                    </button>
                    
                    <button
                        onClick={() => setActiveGame('scanner')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                            activeGame === 'scanner' 
                                ? 'bg-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                        }`}
                    >
                        <ScanFace size={16} /> Biometric
                    </button>
                </div>
            </div>

            {/* Active Game Container */}
            <div className="w-full min-h-[500px] flex items-center justify-center p-4">
                {activeGame === 'decryptor' && (
                    <TerminalDecryptor participant={participant} onGenerate={onGenerate} onComplete={onComplete} />
                )}
                {activeGame === 'slot' && (
                    <NeonSlotMachine participant={participant} onGenerate={onGenerate} onComplete={onComplete} />
                )}
                {activeGame === 'scanner' && (
                    <BiometricScanner participant={participant} onGenerate={onGenerate} onComplete={onComplete} />
                )}
            </div>

        </div>
    );
}
