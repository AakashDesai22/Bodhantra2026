import React, { useState, useEffect } from 'react';
import { api } from '@/api';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Phone, Mail, Link as LinkIcon, Save, Settings } from 'lucide-react';

export default function SystemSettings() {
    const [formData, setFormData] = useState({
        supportPhone1Name: '',
        supportPhone1Number: '',
        supportPhone2Name: '',
        supportPhone2Number: '',
        supportEmail: '',
        instagramUrl: '',
        linkedinUrl: ''
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await api.get('/api/config/support');
            setFormData(res.data);
        } catch (err) {
            console.error('Failed to load system config', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        try {
            const res = await api.put('/api/admin/config/support', formData);
            setMessage(res.data.message || 'Settings saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error('Save failed', err);
            setMessage('Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="animate-pulse space-y-4">
            <div className="h-10 bg-slate-200 dark:bg-slate-700/50 rounded w-1/4"></div>
            <div className="h-64 bg-slate-200 dark:bg-slate-700/50 rounded"></div>
        </div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Settings className="text-primary" /> Platform Settings
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Configure global details like standard contact info & social links.</p>
            </div>

            <Card className="border-t-4 border-t-primary">
                <CardHeader title="Connect with Mavericks (Support Details)" subtitle="These details will be displayed publicly on the Participant Dashboard." />
                <CardContent>
                    <form onSubmit={handleSave} className="space-y-6">
                        
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                                <Phone size={16} /> Direct Support (Phones)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500">Contact 1 Name</label>
                                    <Input name="supportPhone1Name" value={formData.supportPhone1Name || ''} onChange={handleChange} placeholder="e.g. Helpdesk" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500">Contact 1 Number</label>
                                    <Input name="supportPhone1Number" value={formData.supportPhone1Number || ''} onChange={handleChange} placeholder="e.g. +91 9876543210" />
                                </div>
                                <div className="space-y-2 mt-2 md:mt-0">
                                    <label className="text-xs font-semibold text-slate-500">Contact 2 Name</label>
                                    <Input name="supportPhone2Name" value={formData.supportPhone2Name || ''} onChange={handleChange} placeholder="e.g. Coordinator" />
                                </div>
                                <div className="space-y-2 mt-2 md:mt-0">
                                    <label className="text-xs font-semibold text-slate-500">Contact 2 Number</label>
                                    <Input name="supportPhone2Number" value={formData.supportPhone2Number || ''} onChange={handleChange} placeholder="e.g. 1234567890" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                                <Mail size={16} /> Official Email
                            </h3>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-500">Support Email Address</label>
                                <Input type="email" name="supportEmail" value={formData.supportEmail || ''} onChange={handleChange} placeholder="support@teammavericks.com" />
                                <p className="text-[10px] text-slate-400">Leave blank to default to `support@teammavericks.com`</p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                                <LinkIcon size={16} /> Social Media Links
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500">Instagram URL</label>
                                    <Input type="url" name="instagramUrl" value={formData.instagramUrl || ''} onChange={handleChange} placeholder="https://instagram.com/..." />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-500">LinkedIn URL</label>
                                    <Input type="url" name="linkedinUrl" value={formData.linkedinUrl || ''} onChange={handleChange} placeholder="https://linkedin.com/in/..." />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                            {message && <p className={`text-sm font-semibold animate-pulse ${message.includes('success') ? 'text-green-600' : 'text-red-500'}`}>{message}</p>}
                            <Button type="submit" disabled={saving} className="flex items-center gap-2">
                                <Save size={16} /> {saving ? 'Saving...' : 'Save Configuration'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
