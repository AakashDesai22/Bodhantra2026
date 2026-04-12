import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/api';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Settings, Zap, Users, Grid3x3, Shuffle,
    ChevronDown, Play, Loader2, CircleDot
} from 'lucide-react';
import RevealSelector from './reveal-games/RevealSelector';
import SpinWheelPage from '@/features/admin/spinwheel/SpinWheelPage';

const MODES = [
    { value: 'group', label: 'Group', desc: 'Teams of N' },
    { value: 'pair', label: 'Pair', desc: 'Two by two' },
    { value: 'squad', label: 'Squad', desc: 'Large squads (6+)' },
];

export default function AllocationManager({ events }) {
    const [selectedEventId, setSelectedEventId] = useState('');
    const [grid, setGrid] = useState(null);
    const [rules, setRules] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeSection, setActiveSection] = useState('config'); // config | reveal
    const [dayNumber, setDayNumber] = useState(1);

    // Live Reveal state
    const [revealTarget, setRevealTarget] = useState(null);
    const [revealData, setRevealData] = useState(null);
    const [isRevealing, setIsRevealing] = useState(false);

    // Status messages
    const [statusMsg, setStatusMsg] = useState('');

    const fetchEventData = useCallback(async (eventId) => {
        if (!eventId) return;
        setLoading(true);
        try {
            const [gridRes, rulesRes] = await Promise.all([
                api.get(`/api/allocation/${eventId}/grid`),
                api.get(`/api/allocation/${eventId}/rules`),
            ]);
            setGrid(gridRes.data);
            setRules(rulesRes.data);

            // Try to load preview if assignments already exist
            // (Removed bulk preview loading)

            // Load participants list for live reveal
            try {
                const partRes = await api.get(`/api/allocation/${eventId}/participants?day=${dayNumber}`);
                setParticipants(partRes.data);
            } catch { /* No participants yet */ }

        } catch (err) {
            console.error('Failed to load allocation data:', err);
        } finally {
            setLoading(false);
        }
    }, [dayNumber]);

    useEffect(() => {
        if (selectedEventId) {
            fetchEventData(selectedEventId);
            setParticipants([]);
            setRevealTarget(null);
            setRevealData(null);
        }
    }, [selectedEventId, fetchEventData]);

    // ── Grid Config Handlers ──
    const handleGridUpdate = async () => {
        try {
            await api.put(`/api/allocation/${selectedEventId}/grid`, {
                rows: grid.rows,
                cols: grid.cols,
                blocked_cells: grid.blocked_cells,
                zone_map: grid.zone_map,
            });
            setStatusMsg('Grid updated!');
            setTimeout(() => setStatusMsg(''), 2000);
        } catch (err) {
            setStatusMsg('Failed to update grid');
        }
    };

    // ── Rules Handlers ──
    const handleRulesUpdate = async (updates) => {
        const newRules = { ...rules, ...updates };
        setRules(newRules);
        try {
            await api.put(`/api/allocation/${selectedEventId}/rules`, {
                mode: newRules.mode,
                group_size: newRules.group_size,
                mix_branches: newRules.mix_branches,
                no_repeat_pairs: newRules.no_repeat_pairs,
            });
        } catch (err) {
            console.error('Failed to update rules:', err);
        }
    };

    // Bulk generation and locking removed in favor of purely interactive single assignment

    const handleRevealParticipant = async (userId) => {
        setIsRevealing(true);
        setRevealTarget(userId);
        try {
            // First load the base data without assignment info so the games can hold it
            // We use the participants list data we already have instead of revealing logic
            const targetP = participants.find(p => p.user_id === userId);
            
            if (targetP) {
                const baseParticipantInfo = {
                    user_id: targetP.user_id,
                    name: targetP.name || 'Unknown Agent',
                    group_name: targetP.group_name || 'PENDING',
                    role: targetP.role || 'PENDING',
                    seat_row: targetP.seat_row || null,
                    seat_col: targetP.seat_col || null
                };
                
                setRevealData(baseParticipantInfo);
            }
        } catch (err) {
            setStatusMsg('Failed to load participant for assignment');
            setRevealData(null);
            setRevealTarget(null);
        } finally {
            setIsRevealing(false);
        }
    };

    const handleGenerateAssignment = async (userId) => {
        try {
            const res = await api.post(`/api/allocation/${selectedEventId}/assign-single/${userId}`, {
                day_number: dayNumber
            });
            const data = res.data;
            const finalParticipant = {
                user_id: data.user_id,
                name: data.user?.name || 'Unknown Agent',
                group_name: data.group_name,
                role: data.role,
                seat_row: data.seat_row,
                seat_col: data.seat_col
            };
            setRevealData(finalParticipant);
            return finalParticipant; // The games will await this!
        } catch (err) {
            setStatusMsg('Assignment Generation Failed');
            throw err;
        }
    };

    const handleGameComplete = () => {
        // Mark as revealed locally after animation completes
        if (revealTarget) {
            setParticipants(prev => prev.map(p =>
                p.user_id === revealTarget ? { ...p, is_revealed: true } : p
            ));
        }
    };

    if (!events || events.length === 0) {
        return (
            <Card className="p-12 text-center">
                <Shuffle className="mx-auto mb-4 text-slate-400" size={48} />
                <h3 className="text-xl font-bold text-slate-700 dark:text-white">No Events Available</h3>
                <p className="text-slate-500 mt-2">Create an event first to configure allocations.</p>
            </Card>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Event Selector + Day */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Select Event</label>
                    <div className="relative">
                        <select
                            value={selectedEventId}
                            onChange={e => setSelectedEventId(e.target.value)}
                            className="w-full appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pr-10 font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                            <option value="">Choose an event...</option>
                            {events.map(e => (
                                <option key={e.id} value={e.id}>{e.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    </div>
                </div>
                <div className="w-32">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Day #</label>
                    <Input
                        type="number"
                        min={1}
                        value={dayNumber}
                        onChange={e => setDayNumber(parseInt(e.target.value) || 1)}
                        className="text-center"
                    />
                </div>
            </div>

            {/* Status Banner */}
            {statusMsg && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-xl px-4 py-3 text-sm font-medium text-blue-700 dark:text-blue-300 animate-in fade-in duration-300">
                    {statusMsg}
                </div>
            )}

            {selectedEventId && !loading && (
                <>
                    {/* Section Tabs */}
                    <div className="flex gap-2 bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl w-fit">
                        {[
                            { id: 'config', label: 'Configure', icon: Settings },
                            { id: 'reveal', label: 'Interactive Allocator', icon: Zap },
                            { id: 'spinwheel', label: 'Random Wheel', icon: CircleDot },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveSection(tab.id)}
                                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                                    activeSection === tab.id
                                        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                            >
                                <tab.icon size={16} />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* ─── CONFIG SECTION ─── */}
                    {activeSection === 'config' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Grid Config */}
                            <Card className="overflow-hidden">
                                <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                                    <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                                        <Grid3x3 size={18} className="text-blue-500" /> Seating Grid
                                    </h3>
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rows</label>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={20}
                                                value={grid?.rows || 5}
                                                onChange={e => setGrid(prev => ({ ...prev, rows: parseInt(e.target.value) || 1 }))}
                                                disabled={grid?.is_locked}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Columns</label>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={20}
                                                value={grid?.cols || 6}
                                                onChange={e => setGrid(prev => ({ ...prev, cols: parseInt(e.target.value) || 1 }))}
                                                disabled={grid?.is_locked}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        Total seats: {(grid?.rows || 5) * (grid?.cols || 6) - (grid?.blocked_cells?.length || 0)} available
                                    </p>
                                    <Button onClick={handleGridUpdate} disabled={grid?.is_locked} className="w-full">
                                        Save Grid Layout
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Rules Config */}
                            <Card className="overflow-hidden">
                                <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                                    <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                                        <Settings size={18} className="text-indigo-500" /> Allocation Rules
                                    </h3>
                                </CardHeader>
                                <CardContent className="p-6 space-y-5">
                                    {/* Mode Selector */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Mode</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {MODES.map(m => (
                                                <button
                                                    key={m.value}
                                                    onClick={() => handleRulesUpdate({ mode: m.value })}
                                                    disabled={rules?.is_locked}
                                                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                                                        rules?.mode === m.value
                                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                                                    }`}
                                                >
                                                    <div className="font-bold text-sm">{m.label}</div>
                                                    <div className="text-[10px] mt-0.5 opacity-60">{m.desc}</div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Group Size */}
                                    {rules?.mode !== 'pair' && (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                                Group Size: <span className="text-blue-600">{rules?.group_size || 4}</span>
                                            </label>
                                            <input
                                                type="range"
                                                min={2}
                                                max={12}
                                                value={rules?.group_size || 4}
                                                onChange={e => handleRulesUpdate({ group_size: parseInt(e.target.value) })}
                                                disabled={rules?.is_locked}
                                                className="w-full accent-blue-500"
                                            />
                                            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                                <span>2</span><span>6</span><span>12</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Constraint Toggles */}
                                    <div className="space-y-3">
                                        <label className="block text-xs font-bold text-slate-500 uppercase">Constraints</label>
                                        {[
                                            { key: 'mix_branches', label: 'Mix Branches', desc: 'Maximize department diversity' },
                                            { key: 'no_repeat_pairs', label: 'No Repeat Pairs', desc: 'Avoid same groupmates across days' },
                                        ].map(c => (
                                            <label key={c.key} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all">
                                                <input
                                                    type="checkbox"
                                                    checked={rules?.[c.key] || false}
                                                    onChange={e => handleRulesUpdate({ [c.key]: e.target.checked })}
                                                    disabled={rules?.is_locked}
                                                    className="w-5 h-5 rounded-md accent-blue-500"
                                                />
                                                <div>
                                                    <div className="font-bold text-sm text-slate-700 dark:text-white">{c.label}</div>
                                                    <div className="text-[11px] text-slate-400">{c.desc}</div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Preview section removed */}
                        </div> // End config grid
                    )}

                    {activeSection === 'reveal' && (
                        <div className="space-y-6">
                            {/* Interactive Reveal Area */}
                            <RevealSelector
                                participant={revealData}
                                onGenerate={handleGenerateAssignment}
                                onComplete={handleGameComplete}
                            />

                            {/* Participant list for Live Reveal */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Note: Quick Actions removed */}

                                {/* Participant List */}
                                <Card className="p-6 max-h-[400px] overflow-y-auto">
                                    <h3 className="font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
                                        <Users size={18} className="text-indigo-500" /> Participants
                                    </h3>
                                    {participants.length === 0 ? (
                                        <p className="text-sm text-slate-400">Generate allocations first.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {participants.map(p => (
                                                <div
                                                    key={p.user_id}
                                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                                        p.is_revealed
                                                            ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800/30'
                                                            : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                    }`}
                                                >
                                                    <div>
                                                        <div className="font-bold text-sm text-slate-800 dark:text-white">{p.name}</div>
                                                        <div className="text-[10px] text-slate-400">{p.branch} · {p.year}</div>
                                                    </div>
                                                    {p.is_revealed ? (
                                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                                                            ASSIGNED: {p.group_name}
                                                        </span>
                                                    ) : (
                                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                                                                UNASSIGNED
                                                            </span>
                                                    )}
                                                    
                                                    <Button
                                                        onClick={() => handleRevealParticipant(p.user_id)}
                                                        disabled={isRevealing}
                                                        className="text-xs px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg ml-2"
                                                    >
                                                        <Play size={12} className="mr-1" /> Load
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </Card>
                            </div>
                        </div>
                    )}

                    {activeSection === 'spinwheel' && (
                        <div className="bg-slate-50 dark:bg-slate-800/20 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                            <SpinWheelPage />
                        </div>
                    )}
                </>
            )}

            {loading && (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="animate-spin text-blue-500" size={32} />
                    <span className="ml-3 text-slate-500 font-medium">Loading allocation data...</span>
                </div>
            )}
        </div>
    );
}
