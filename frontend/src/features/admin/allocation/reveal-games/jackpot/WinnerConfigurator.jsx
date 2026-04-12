import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api, API_URL } from '@/api';
import { Trophy, Image as ImageIcon, ExternalLink, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function WinnerConfigurator() {
    const navigate = useNavigate();
    const [config, setConfig] = useState({
        title: 'Best Performer',
        winnerName: '',
        winnerPhoto: '',
        spinDuration: 12
    });
    const [isSaving, setIsSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('jackpot_config');
        if (saved) {
            try {
                setConfig(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse jackpot_config', e);
            }
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('photo', file);

        setUploading(true);
        try {
            const res = await api.post('/api/admin/upload-photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const url = res.data.url;
            setConfig(prev => ({ ...prev, winnerPhoto: url }));
        } catch (error) {
            console.error('Upload failed', error);
            alert('Failed to upload photo');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = () => {
        setIsSaving(true);
        localStorage.setItem('jackpot_config', JSON.stringify(config));
        setTimeout(() => setIsSaving(false), 500);
    };

    const handleLaunch = () => {
        handleSave();
        try {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => console.log(err));
            }
        } catch (err) {
            console.error(err);
        }
        // Use client-side routing to prevent hard reload and preserve fullscreen state
        navigate('/admin/display/jackpot');
    };

    return (
        <Card className="max-w-3xl mx-auto shadow-xl border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-200 dark:border-slate-800 pb-6 mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-xl shadow-lg">
                        <Trophy className="text-white" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white">Winner Game Setup</h2>
                        <p className="text-sm text-slate-500">Configure the slot machine data for the big screen reveal.</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Dynamic Title</label>
                        <Input 
                            name="title" 
                            value={config.title} 
                            onChange={handleChange} 
                            placeholder="e.g. Best Performer 2026" 
                            className="bg-white dark:bg-slate-800"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Winner's Name</label>
                        <Input 
                            name="winnerName" 
                            value={config.winnerName} 
                            onChange={handleChange} 
                            placeholder="e.g. John Doe" 
                            className="bg-white dark:bg-slate-800 border-yellow-400 focus:border-yellow-500 focus:ring-yellow-500/20"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Winner's Photo</label>
                    <div className="flex items-center gap-4">
                        <div className="relative group overflow-hidden rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary transition-colors h-32 w-32 flex-shrink-0 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center">
                            {config.winnerPhoto ? (
                                <img src={`${API_URL}${config.winnerPhoto}`} alt="Winner" className="w-full h-full object-cover" />
                            ) : (
                                <ImageIcon className="text-slate-400" size={32} />
                            )}
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handlePhotoUpload} 
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                disabled={uploading}
                            />
                        </div>
                        <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                {uploading ? 'Uploading...' : 'Click or drop a photo here'}
                            </p>
                            <p className="text-xs text-slate-500">Square images recommended. Jpeg, Png.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="space-y-2 max-w-sm">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Suspense Duration (Seconds)</label>
                        <Input 
                            type="number"
                            name="spinDuration" 
                            value={config.spinDuration} 
                            onChange={handleChange} 
                            min="2" max="60"
                            className="bg-white dark:bg-slate-800"
                        />
                        <p className="text-xs text-slate-500 mt-1">Time to play suspense music before the grand reveal.</p>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
                    <Button 
                        variant="outline" 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="min-w-[120px]"
                    >
                        {isSaving ? 'Saving...' : 'Save Configuration'}
                    </Button>
                    <Button 
                        onClick={handleLaunch} 
                        className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/20 gap-2 font-bold"
                    >
                        <Play fill="currentColor" size={16} /> Launch Big Screen
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
