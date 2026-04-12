import React, { useState, useEffect } from 'react';
import { api } from '@/api';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Phone, Mail, Instagram, Linkedin, Copy, CheckCircle2 } from 'lucide-react';

export default function SupportCard() {
    const [config, setConfig] = useState(null);
    const [copiedStates, setCopiedStates] = useState({});

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await api.get('/api/config/support');
            setConfig(res.data);
        } catch (err) {
            console.error("Failed to fetch support config", err);
            setConfig({});
        }
    };

    const handleCopy = (identifier, text) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedStates(prev => ({ ...prev, [identifier]: true }));
        setTimeout(() => {
            setCopiedStates(prev => ({ ...prev, [identifier]: false }));
        }, 2000);
    };

    if (!config) {
        return (
            <Card>
                <CardHeader title="Connect with Mavericks" subtitle="Official contacts & socials" />
                <CardContent>
                    <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const fallbackEmail = config.supportEmail || 'support@teammavericks.com';

    return (
        <Card>
            <CardHeader title="Connect with Mavericks" subtitle="Official contacts & socials" />
            <CardContent>
                <div className="space-y-4">
                    {/* Phones */}
                    {(config.supportPhone1Number || config.supportPhone2Number) && (
                        <div className="space-y-3">
                            <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">Direct Support</p>
                            
                            {config.supportPhone1Number && (
                                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                            <Phone size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{config.supportPhone1Name || 'Support 1'}</p>
                                            <p className="text-xs text-slate-500 font-mono mt-0.5">{config.supportPhone1Number}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleCopy('phone1', config.supportPhone1Number)}
                                        className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                        title="Copy Number"
                                    >
                                        {copiedStates['phone1'] ? <CheckCircle2 size={18} className="text-green-500" /> : <Copy size={18} />}
                                    </button>
                                </div>
                            )}

                            {config.supportPhone2Number && (
                                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                            <Phone size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{config.supportPhone2Name || 'Support 2'}</p>
                                            <p className="text-xs text-slate-500 font-mono mt-0.5">{config.supportPhone2Number}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleCopy('phone2', config.supportPhone2Number)}
                                        className="p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                        title="Copy Number"
                                    >
                                        {copiedStates['phone2'] ? <CheckCircle2 size={18} className="text-green-500" /> : <Copy size={18} />}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Digital / Email */}
                    <div className="space-y-3 pt-2">
                        <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">Write to Us</p>
                        <a href={`mailto:${fallbackEmail}?subject=Bodhantra%20Dashboard%20Support`} className="block group">
                            <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                                    <Mail size={16} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Official Email</p>
                                    <p className="text-xs text-slate-500 font-mono mt-0.5 truncate max-w-[200px]">{fallbackEmail}</p>
                                </div>
                                <div className="text-slate-400 group-hover:text-orange-500 transition-colors mr-1 font-medium text-xs">Open &rarr;</div>
                            </div>
                        </a>
                    </div>

                    {/* Social links */}
                    {(config.instagramUrl || config.linkedinUrl) && (
                        <div className="space-y-3 pt-2">
                            <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">Socials</p>
                            <div className="flex gap-3">
                                {config.instagramUrl && (
                                    <a href={config.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex justify-center items-center gap-2 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:border-pink-200 dark:hover:border-pink-800/30 hover:text-pink-600 dark:hover:text-pink-400 transition-colors group">
                                        <Instagram size={18} className="text-slate-400 group-hover:text-pink-500 transition-colors" />
                                        <span className="text-xs font-semibold text-slate-600 group-hover:text-pink-600 transition-colors">Instagram</span>
                                    </a>
                                )}
                                {config.linkedinUrl && (
                                    <a href={config.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex justify-center items-center gap-2 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group">
                                        <Linkedin size={18} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
                                        <span className="text-xs font-semibold text-slate-600 group-hover:text-blue-600 transition-colors">LinkedIn</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
