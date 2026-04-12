import React, { useState } from 'react';
import SpinWheel from './SpinWheel';
import WheelConfigurator, { loadConfig, saveConfig } from './WheelConfigurator';

export default function SpinWheelPage() {
    const [slices, setSlices] = useState(() => loadConfig());

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="text-center mb-8">
                <h2
                    className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 tracking-tight"
                    style={{ fontFamily: "'Courier New', monospace" }}
                >
                    ⟐ SPIN THE WHEEL ⟐
                </h2>
                <p className="text-slate-500 text-sm mt-2">Configure groups, then let participants spin to reveal their destiny</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                {/* Wheel — takes 3/5 */}
                <div className="lg:col-span-3 flex justify-center">
                    <SpinWheel slices={slices} />
                </div>

                {/* Configurator — takes 2/5 */}
                <div className="lg:col-span-2">
                    <WheelConfigurator slices={slices} setSlices={setSlices} />
                </div>
            </div>
        </div>
    );
}
