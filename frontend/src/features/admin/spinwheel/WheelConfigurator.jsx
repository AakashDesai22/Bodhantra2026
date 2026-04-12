import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Trash2, Palette, RotateCcw } from 'lucide-react';

const PRESET_COLORS = [
    '#FF003C', '#00F0FF', '#A855F7', '#22C55E', '#F59E0B',
    '#EC4899', '#3B82F6', '#EF4444', '#14B8A6', '#F97316',
    '#8B5CF6', '#06B6D4', '#10B981', '#E11D48', '#6366F1',
];

const PRESET_EMOJIS = ['🤖', '🔥', '⚡', '🚀', '💎', '🎯', '👾', '🦾', '🌀', '☠️', '🎲', '🏆'];

const DEFAULT_SLICES = [
    { id: 1, name: 'Team Cyber', emoji: '🤖', color: '#FF003C' },
    { id: 2, name: 'Team Neon', emoji: '⚡', color: '#00F0FF' },
    { id: 3, name: 'Team Phantom', emoji: '👾', color: '#A855F7' },
    { id: 4, name: 'Team Blaze', emoji: '🔥', color: '#F59E0B' },
];

const STORAGE_KEY = 'spinwheel_config';

function loadConfig() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_SLICES;
}

function saveConfig(slices) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slices));
}

export default function WheelConfigurator({ slices, setSlices }) {
    const [newName, setNewName] = useState('');
    const [newEmoji, setNewEmoji] = useState('🎯');
    const [newColor, setNewColor] = useState('#3B82F6');
    const [editingId, setEditingId] = useState(null);

    const handleAdd = () => {
        if (!newName.trim()) return;
        const newSlice = {
            id: Date.now(),
            name: newName.trim(),
            emoji: newEmoji,
            color: newColor,
        };
        const updated = [...slices, newSlice];
        setSlices(updated);
        saveConfig(updated);
        setNewName('');
    };

    const handleDelete = (id) => {
        if (slices.length <= 2) return; // Minimum 2 slices
        const updated = slices.filter(s => s.id !== id);
        setSlices(updated);
        saveConfig(updated);
    };

    const handleUpdate = (id, field, value) => {
        const updated = slices.map(s =>
            s.id === id ? { ...s, [field]: value } : s
        );
        setSlices(updated);
        saveConfig(updated);
    };

    const handleReset = () => {
        setSlices(DEFAULT_SLICES);
        saveConfig(DEFAULT_SLICES);
    };

    return (
        <Card className="overflow-hidden border-slate-700/50 bg-slate-900/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 border-b border-slate-700/50">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold flex items-center gap-2 text-white">
                        <Palette size={18} className="text-cyan-400" /> Wheel Configurator
                    </h3>
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-slate-700/50"
                    >
                        <RotateCcw size={12} /> Reset
                    </button>
                </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
                {/* Existing Slices */}
                <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                    {slices.map((slice, idx) => (
                        <div
                            key={slice.id}
                            className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-700/50 bg-slate-800/50 hover:bg-slate-800 transition-all group"
                        >
                            {/* Color swatch */}
                            <div className="relative">
                                <input
                                    type="color"
                                    value={slice.color}
                                    onChange={e => handleUpdate(slice.id, 'color', e.target.value)}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-8 h-8"
                                />
                                <div
                                    className="w-8 h-8 rounded-lg border-2 border-slate-600 cursor-pointer shadow-inner"
                                    style={{ backgroundColor: slice.color }}
                                />
                            </div>

                            {/* Emoji picker */}
                            <div className="relative">
                                <select
                                    value={slice.emoji}
                                    onChange={e => handleUpdate(slice.id, 'emoji', e.target.value)}
                                    className="appearance-none bg-slate-700 border-none rounded-lg w-10 h-8 text-center text-lg cursor-pointer focus:ring-1 focus:ring-cyan-500"
                                >
                                    {PRESET_EMOJIS.map(em => (
                                        <option key={em} value={em}>{em}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Name */}
                            <input
                                type="text"
                                value={slice.name}
                                onChange={e => handleUpdate(slice.id, 'name', e.target.value)}
                                className="flex-1 bg-transparent border-none text-white text-sm font-medium focus:outline-none focus:ring-0 placeholder-slate-500 min-w-0"
                                placeholder="Group name..."
                            />

                            {/* Index badge */}
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded">
                                #{idx + 1}
                            </span>

                            {/* Delete */}
                            <button
                                onClick={() => handleDelete(slice.id)}
                                disabled={slices.length <= 2}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Add New Slice */}
                <div className="border-t border-slate-700/50 pt-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Add New Slice</p>
                    <div className="flex gap-2">
                        {/* Color */}
                        <div className="relative">
                            <input
                                type="color"
                                value={newColor}
                                onChange={e => setNewColor(e.target.value)}
                                className="absolute inset-0 opacity-0 cursor-pointer w-10 h-10"
                            />
                            <div
                                className="w-10 h-10 rounded-lg border-2 border-slate-600 cursor-pointer"
                                style={{ backgroundColor: newColor }}
                            />
                        </div>

                        {/* Emoji */}
                        <select
                            value={newEmoji}
                            onChange={e => setNewEmoji(e.target.value)}
                            className="appearance-none bg-slate-700/80 border border-slate-600 rounded-lg w-12 h-10 text-center text-lg cursor-pointer focus:ring-1 focus:ring-cyan-500"
                        >
                            {PRESET_EMOJIS.map(em => (
                                <option key={em} value={em}>{em}</option>
                            ))}
                        </select>

                        {/* Name */}
                        <input
                            type="text"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                            placeholder="Team name..."
                            className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-cyan-500 focus:border-transparent min-w-0"
                        />

                        {/* Add btn */}
                        <button
                            onClick={handleAdd}
                            disabled={!newName.trim()}
                            className="flex items-center gap-1 px-4 h-10 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-bold rounded-lg transition-all"
                        >
                            <Plus size={16} /> Add
                        </button>
                    </div>
                </div>

                {/* Quick Color Palette */}
                <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Quick Colors</p>
                    <div className="flex flex-wrap gap-1.5">
                        {PRESET_COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => setNewColor(c)}
                                className={`w-6 h-6 rounded-md border-2 transition-all hover:scale-125 ${
                                    newColor === c ? 'border-white scale-110' : 'border-transparent'
                                }`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export { loadConfig, saveConfig, DEFAULT_SLICES, STORAGE_KEY };
