import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api, API_URL } from '@/api';
import { Trophy, Terminal, Gem, Joystick, Image as ImageIcon, Play, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const THEMES = [
    {
        id: 'jackpot',
        name: 'Stage Reveal',
        subtitle: 'Jackpot / Cinematic',
        description: 'A dramatic stage-lit reveal with spring-physics photo drop, confetti, and cinematic suspense audio.',
        icon: Trophy,
        gradient: 'from-yellow-500 to-amber-600',
        glow: 'rgba(250, 204, 21, 0.3)',
        borderColor: 'border-yellow-500/30',
        route: '/admin/display/jackpot',
        storageKey: 'jackpot_config',
    },
    {
        id: 'technical',
        name: 'Technical Day',
        subtitle: 'Hacker OS Theme',
        description: 'A full-screen retro terminal with CRT scanlines, a password-cracker text scrambler, and a glitch-in photo reveal.',
        icon: Terminal,
        gradient: 'from-green-500 to-emerald-600',
        glow: 'rgba(0, 255, 0, 0.3)',
        borderColor: 'border-green-500/30',
        route: '/admin/display/technical',
        storageKey: 'technical_config',
    },
    {
        id: 'vault',
        name: 'Treasure Hunt',
        subtitle: 'Cinematic Vault Theme',
        description: 'A cinematic vault-cracking video with a golden reveal — the winner drops in as the ultimate treasure loot.',
        icon: Gem,
        gradient: 'from-amber-500 to-yellow-600',
        glow: 'rgba(250, 180, 0, 0.3)',
        borderColor: 'border-amber-500/30',
        route: '/admin/display/vault',
        storageKey: 'vault_config',
    },
    {
        id: 'slotmachine',
        name: 'Open to All',
        subtitle: 'Realistic Jackpot',
        description: 'A spectacular physical slot machine with a spinning reel of candidate names, lever pull, and golden confetti.',
        icon: Joystick,
        gradient: 'from-red-600 to-red-800',
        glow: 'rgba(239, 68, 68, 0.3)',
        borderColor: 'border-red-500/30',
        route: '/admin/display/slotmachine',
        storageKey: 'slotmachine_config',
    },
];

export default function WinnerThemeHub() {
    const navigate = useNavigate();
    const [config, setConfig] = useState({
        title: 'Best Performer',
        winnerName: '',
        winnerPhoto: '',
        suspenseDuration: 4,
        candidateNames: '',
    });
    const [uploading, setUploading] = useState(false);
    const [saved, setSaved] = useState(false);

    // Load persisted config
    useEffect(() => {
        const persisted = localStorage.getItem('winner_hub_config');
        if (persisted) {
            try { setConfig(JSON.parse(persisted)); } catch (e) { /* noop */ }
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
        setSaved(false);
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('photo', file);
        setUploading(true);
        try {
            const res = await api.post('/api/admin/upload-photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setConfig(prev => ({ ...prev, winnerPhoto: res.data.url }));
        } catch (error) {
            console.error('Upload failed', error);
            alert('Failed to upload photo');
        } finally {
            setUploading(false);
        }
    };

    const persistAndLaunch = (theme) => {
        // Apply mock-data fallback
        const finalConfig = {
            ...config,
            winnerName: config.winnerName || 'Aakash (Team Mavericks)',
        };

        // Save to the unified hub key + theme-specific key for backwards compat
        localStorage.setItem('winner_hub_config', JSON.stringify(finalConfig));
        localStorage.setItem(theme.storageKey, JSON.stringify(finalConfig));

        // Also save as jackpot_config for the old Jackpot display compatibility
        if (theme.id === 'jackpot') {
            localStorage.setItem('jackpot_config', JSON.stringify({
                ...finalConfig,
                spinDuration: 12,
            }));
        }

        try {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(console.error);
            }
        } catch (err) { /* noop */ }

        navigate(theme.route);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                    Select Reveal Theme
                </h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                    Configure winner data below, then choose a cinematic reveal experience to launch on the big screen.
                </p>
            </div>

            {/* Configurator Card */}
            <Card className="max-w-3xl mx-auto shadow-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
                            <Trophy className="text-white" size={22} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white">Winner Data</h3>
                            <p className="text-xs text-slate-500">Shared across all reveal themes.</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Winner's Name</label>
                            <Input
                                name="winnerName"
                                value={config.winnerName}
                                onChange={handleChange}
                                placeholder="Aakash (Team Mavericks)"
                                className="bg-white dark:bg-slate-800"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Winner's Title / Award</label>
                            <Input
                                name="title"
                                value={config.title}
                                onChange={handleChange}
                                placeholder="e.g. Best Performer 2026"
                                className="bg-white dark:bg-slate-800"
                            />
                        </div>
                    </div>

                    {/* Photo Upload */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Winner's Photo</label>
                        <div className="flex items-center gap-4">
                            <div className="relative group overflow-hidden rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary transition-colors h-28 w-28 flex-shrink-0 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center">
                                {config.winnerPhoto ? (
                                    <img src={`${config.winnerPhoto?.startsWith('http') ? config.winnerPhoto : `${API_URL}${config.winnerPhoto}`}`} alt="Winner" className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon className="text-slate-400" size={28} />
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    disabled={uploading}
                                />
                            </div>
                            <p className="text-sm text-slate-500">{uploading ? 'Uploading...' : 'Click or drop a photo. Square recommended.'}</p>
                        </div>
                    </div>

                    {/* Suspense Duration */}
                    <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="space-y-1.5 max-w-xs">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Suspense Duration (Seconds)</label>
                            <Input
                                type="number"
                                name="suspenseDuration"
                                value={config.suspenseDuration}
                                onChange={handleChange}
                                min="2" max="60"
                                className="bg-white dark:bg-slate-800"
                            />
                            <p className="text-xs text-slate-500 mt-1">Time the scrambler / suspense plays before the grand reveal.</p>
                        </div>
                    </div>

                    {/* Candidate Names (for Slot Machine) */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Candidate Names <span className="text-slate-400 font-normal">(for Slot Machine reel)</span></label>
                        <textarea
                            name="candidateNames"
                            value={config.candidateNames}
                            onChange={handleChange}
                            placeholder="e.g. John, Jane, Alice, Bob, Charlie, Dave"
                            rows={3}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-none"
                        />
                        <p className="text-xs text-slate-500">Comma-separated decoy names for the spinning reel. Leave blank for defaults.</p>
                    </div>
                </CardContent>
            </Card>

            {/* Theme Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {THEMES.map((theme) => (
                    <button
                        key={theme.id}
                        onClick={() => persistAndLaunch(theme)}
                        className={`group relative overflow-hidden rounded-2xl border ${theme.borderColor} bg-white dark:bg-slate-900/60 p-6 text-left transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl cursor-pointer`}
                        style={{ boxShadow: `0 0 0px ${theme.glow}` }}
                        onMouseEnter={(e) => e.currentTarget.style.boxShadow = `0 4px 40px ${theme.glow}`}
                        onMouseLeave={(e) => e.currentTarget.style.boxShadow = `0 0 0px ${theme.glow}`}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${theme.gradient} shadow-lg flex-shrink-0`}>
                                <theme.icon className="text-white" size={24} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-black text-slate-800 dark:text-white">{theme.name}</h3>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{theme.subtitle}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{theme.description}</p>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center justify-end gap-1 text-sm font-bold text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition-colors">
                            Launch <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
