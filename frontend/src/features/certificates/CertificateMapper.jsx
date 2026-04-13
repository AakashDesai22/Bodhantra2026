import React, { useState, useRef, useCallback, useEffect } from 'react';
import Draggable from 'react-draggable';
import { api, API_URL } from '@/api';
import { Button } from '@/components/ui/Button';
import { Save, Upload, Type, QrCode, GripVertical, RotateCcw, AlignLeft, AlignCenter, AlignRight, ArrowUpToLine, AlignVerticalJustifyCenter, ArrowDownToLine } from 'lucide-react';

const FONT_FAMILIES = [
    'Arial',
    'Times New Roman',
    'Courier New',
    'Georgia',
    'Verdana',
    'Trebuchet MS',
    'Palatino Linotype',
];

const DEFAULT_CONFIG = {
    name: { x: 50, y: 55, fontSize: 36, fontFamily: 'Georgia', color: '#1e293b', fontWeight: 'bold' },
    qr: { x: 82, y: 78, size: 100 },
};

export default function CertificateMapper({ event, onSaved }) {
    const nameRef = useRef(null);
    const qrRef = useRef(null);
    const containerRef = useRef(null);

    // Load existing config or use defaults
    const existingConfig = event?.certificateTemplates?.participation?.config || DEFAULT_CONFIG;
    const existingBg = event?.certificateTemplates?.participation?.backgroundUrl || '';

    const [backgroundUrl, setBackgroundUrl] = useState(existingBg);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Name config
    const [nameConfig, setNameConfig] = useState({
        fontSize: existingConfig.name?.fontSize || 36,
        fontFamily: existingConfig.name?.fontFamily || 'Georgia',
        color: existingConfig.name?.color || '#1e293b',
        fontWeight: existingConfig.name?.fontWeight || 'bold',
    });
    const [namePos, setNamePos] = useState({
        x: existingConfig.name?.x || 50,
        y: existingConfig.name?.y || 55,
    });

    // QR config
    const [qrSize, setQrSize] = useState(existingConfig.qr?.size || 100);
    const [qrPos, setQrPos] = useState({
        x: existingConfig.qr?.x || 82,
        y: existingConfig.qr?.y || 78,
    });

    // Container dimensions for percentage calculation
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    const updateContainerSize = useCallback(() => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setContainerSize({ width: rect.width, height: rect.height });
        }
    }, []);

    useEffect(() => {
        updateContainerSize();
        window.addEventListener('resize', updateContainerSize);
        return () => window.removeEventListener('resize', updateContainerSize);
    }, [updateContainerSize]);

    // Recalc after image loads
    const handleImageLoad = () => {
        updateContainerSize();
    };

    // Upload background image
    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('photo', file);
            const res = await api.post('/api/admin/upload-photo', formData);
            const url = res.data.url;
            setBackgroundUrl(url);
        } catch (err) {
            console.error('Upload failed:', err);
        } finally {
            setUploading(false);
        }
    };

    // Drag handlers — convert pixel offsets to percentages
    const handleNameDrag = (e, data) => {
        if (!containerSize.width || !containerSize.height) return;
        const xPercent = Math.max(0, Math.min(100, (data.x / containerSize.width) * 100));
        const yPercent = Math.max(0, Math.min(100, (data.y / containerSize.height) * 100));
        setNamePos({ x: parseFloat(xPercent.toFixed(2)), y: parseFloat(yPercent.toFixed(2)) });
    };

    const handleQrDrag = (e, data) => {
        if (!containerSize.width || !containerSize.height) return;
        const xPercent = Math.max(0, Math.min(100, (data.x / containerSize.width) * 100));
        const yPercent = Math.max(0, Math.min(100, (data.y / containerSize.height) * 100));
        setQrPos({ x: parseFloat(xPercent.toFixed(2)), y: parseFloat(yPercent.toFixed(2)) });
    };

    // Convert percentages to pixels for draggable position
    const namePx = {
        x: (namePos.x / 100) * containerSize.width,
        y: (namePos.y / 100) * containerSize.height,
    };
    const qrPx = {
        x: (qrPos.x / 100) * containerSize.width,
        y: (qrPos.y / 100) * containerSize.height,
    };

    // Scale font size for preview
    const scaledFontSize = Math.max(12, (nameConfig.fontSize / 1000) * containerSize.width);
    const scaledQrSize = Math.max(30, (qrSize / 1000) * containerSize.width);

    // Save config
    const handleSave = async () => {
        setSaving(true);
        setSaved(false);
        try {
            const payload = {
                certificateTemplates: {
                    participation: {
                        backgroundUrl,
                        config: {
                            name: {
                                x: namePos.x,
                                y: namePos.y,
                                fontSize: nameConfig.fontSize,
                                fontFamily: nameConfig.fontFamily,
                                color: nameConfig.color,
                                fontWeight: nameConfig.fontWeight,
                            },
                            qr: {
                                x: qrPos.x,
                                y: qrPos.y,
                                size: qrSize,
                            },
                        },
                    },
                },
            };
            await api.put(`/api/admin/events/${event.id}/certificate-config`, payload);
            setSaved(true);
            if (onSaved) onSaved();
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Save failed:', err);
        } finally {
            setSaving(false);
        }
    };

    const resetToDefaults = () => {
        setNameConfig({ fontSize: 36, fontFamily: 'Georgia', color: '#1e293b', fontWeight: 'bold' });
        setNamePos({ x: 50, y: 55 });
        setQrSize(100);
        setQrPos({ x: 82, y: 78 });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
            {/* ─── LEFT: Configuration Sidebar ─── */}
            <div className="space-y-5">
                {/* Upload Section */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Upload size={16} /> Template Background
                    </h3>
                    <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-all ${backgroundUrl ? 'border-green-400 dark:border-green-600 bg-green-50/50 dark:bg-green-900/10' : 'border-slate-300 dark:border-slate-600 hover:border-primary hover:bg-primary/5'}`}>
                        <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                        {uploading ? (
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                                Uploading...
                            </div>
                        ) : backgroundUrl ? (
                            <div className="text-center">
                                <p className="text-sm font-semibold text-green-600 dark:text-green-400">✓ Template Uploaded</p>
                                <p className="text-xs text-slate-400 mt-1">Click to replace</p>
                            </div>
                        ) : (
                            <div className="text-center">
                                <Upload size={24} className="mx-auto text-slate-400 mb-2" />
                                <p className="text-sm text-slate-500">Click to upload blank certificate</p>
                            </div>
                        )}
                    </label>
                </div>

                {/* Name Text Controls */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Type size={16} /> Name Element
                    </h3>

                    <div className="space-y-4">
                        {/* Font Size */}
                        <div>
                            <label className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                                <span>Font Size</span>
                                <span className="text-primary">{nameConfig.fontSize}px</span>
                            </label>
                            <input
                                type="range"
                                min={12}
                                max={72}
                                value={nameConfig.fontSize}
                                onChange={(e) => setNameConfig(p => ({ ...p, fontSize: parseInt(e.target.value) }))}
                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                        </div>

                        {/* Font Family */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Font Family</label>
                            <select
                                value={nameConfig.fontFamily}
                                onChange={(e) => setNameConfig(p => ({ ...p, fontFamily: e.target.value }))}
                                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                            >
                                {FONT_FAMILIES.map(f => (
                                    <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                                ))}
                            </select>
                        </div>

                        {/* Text Color */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Text Color</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={nameConfig.color}
                                    onChange={(e) => setNameConfig(p => ({ ...p, color: e.target.value }))}
                                    className="w-10 h-10 rounded-lg border-2 border-slate-200 dark:border-slate-600 cursor-pointer"
                                />
                                <span className="text-sm font-mono text-slate-500 dark:text-slate-400">{nameConfig.color}</span>
                            </div>
                        </div>

                        {/* Font Weight */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Font Weight</label>
                            <div className="flex gap-2">
                                {['normal', 'bold'].map(w => (
                                    <button
                                        key={w}
                                        onClick={() => setNameConfig(p => ({ ...p, fontWeight: w }))}
                                        className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all border ${
                                            nameConfig.fontWeight === w
                                                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25'
                                                : 'bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-primary/50'
                                        }`}
                                    >
                                        {w === 'bold' ? <span className="font-bold">Bold</span> : <span className="font-normal">Normal</span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Position readout */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 flex justify-between text-xs font-mono text-slate-400">
                            <span>X: {namePos.x.toFixed(1)}%</span>
                            <span>Y: {namePos.y.toFixed(1)}%</span>
                        </div>

                        {/* Quick Align Buttons */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Quick Align</label>
                            <div className="grid grid-cols-3 gap-1.5">
                                <button onClick={() => setNamePos(p => ({...p, x: 15}))} className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-[11px] font-bold text-slate-500 dark:text-slate-300 hover:border-blue-400 hover:text-blue-500 transition-all">
                                    <AlignLeft size={12} /> Left
                                </button>
                                <button onClick={() => setNamePos(p => ({...p, x: 50}))} className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-all">
                                    <AlignCenter size={12} /> Center
                                </button>
                                <button onClick={() => setNamePos(p => ({...p, x: 85}))} className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-[11px] font-bold text-slate-500 dark:text-slate-300 hover:border-blue-400 hover:text-blue-500 transition-all">
                                    <AlignRight size={12} /> Right
                                </button>
                                <button onClick={() => setNamePos(p => ({...p, y: 15}))} className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-[11px] font-bold text-slate-500 dark:text-slate-300 hover:border-blue-400 hover:text-blue-500 transition-all">
                                    <ArrowUpToLine size={12} /> Top
                                </button>
                                <button onClick={() => setNamePos(p => ({...p, y: 50}))} className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition-all">
                                    <AlignVerticalJustifyCenter size={12} /> Mid
                                </button>
                                <button onClick={() => setNamePos(p => ({...p, y: 85}))} className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-[11px] font-bold text-slate-500 dark:text-slate-300 hover:border-blue-400 hover:text-blue-500 transition-all">
                                    <ArrowDownToLine size={12} /> Bottom
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* QR Code Controls */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                        <QrCode size={16} /> QR Code Element
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                                <span>QR Size</span>
                                <span className="text-primary">{qrSize}px</span>
                            </label>
                            <input
                                type="range"
                                min={50}
                                max={200}
                                value={qrSize}
                                onChange={(e) => setQrSize(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 flex justify-between text-xs font-mono text-slate-400">
                            <span>X: {qrPos.x.toFixed(1)}%</span>
                            <span>Y: {qrPos.y.toFixed(1)}%</span>
                        </div>

                        {/* Quick Align Buttons */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Quick Align</label>
                            <div className="grid grid-cols-3 gap-1.5">
                                <button onClick={() => setQrPos(p => ({...p, x: 10}))} className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-[11px] font-bold text-slate-500 dark:text-slate-300 hover:border-purple-400 hover:text-purple-500 transition-all">
                                    <AlignLeft size={12} /> Left
                                </button>
                                <button onClick={() => setQrPos(p => ({...p, x: 50}))} className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-100 transition-all">
                                    <AlignCenter size={12} /> Center
                                </button>
                                <button onClick={() => setQrPos(p => ({...p, x: 90}))} className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-[11px] font-bold text-slate-500 dark:text-slate-300 hover:border-purple-400 hover:text-purple-500 transition-all">
                                    <AlignRight size={12} /> Right
                                </button>
                                <button onClick={() => setQrPos(p => ({...p, y: 15}))} className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-[11px] font-bold text-slate-500 dark:text-slate-300 hover:border-purple-400 hover:text-purple-500 transition-all">
                                    <ArrowUpToLine size={12} /> Top
                                </button>
                                <button onClick={() => setQrPos(p => ({...p, y: 50}))} className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-100 transition-all">
                                    <AlignVerticalJustifyCenter size={12} /> Mid
                                </button>
                                <button onClick={() => setQrPos(p => ({...p, y: 90}))} className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-[11px] font-bold text-slate-500 dark:text-slate-300 hover:border-purple-400 hover:text-purple-500 transition-all">
                                    <ArrowDownToLine size={12} /> Bottom
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <Button
                        onClick={handleSave}
                        disabled={!backgroundUrl || saving}
                        className={`w-full flex items-center justify-center gap-2 py-3 font-bold transition-all ${
                            saved
                                ? 'bg-green-500 hover:bg-green-600 text-white'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30'
                        }`}
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                Saving...
                            </>
                        ) : saved ? (
                            <>✓ Blueprint Saved</>
                        ) : (
                            <><Save size={18} /> Save Template Blueprint</>
                        )}
                    </Button>
                    <button
                        onClick={resetToDefaults}
                        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    >
                        <RotateCcw size={14} /> Reset to Defaults
                    </button>
                </div>
            </div>

            {/* ─── RIGHT: Interactive Visual Canvas ─── */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                        Visual Canvas
                    </h3>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                        Drag to Position
                    </span>
                </div>

                {backgroundUrl ? (
                    <div
                        ref={containerRef}
                        className="relative w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900"
                        style={{ minHeight: 300 }}
                    >
                        <img
                            src={`${backgroundUrl?.startsWith('http') ? backgroundUrl : `${API_URL}${backgroundUrl}`}`}
                            alt="Certificate Template"
                            onLoad={handleImageLoad}
                            className="w-full h-auto block"
                            draggable={false}
                        />

                        {/* Draggable Name Element */}
                        {containerSize.width > 0 && (
                            <Draggable
                                position={namePx}
                                onDrag={handleNameDrag}
                                bounds="parent"
                                nodeRef={nameRef}
                            >
                                <div
                                    ref={nameRef}
                                    className="absolute top-0 left-0 cursor-grab active:cursor-grabbing group"
                                    style={{ zIndex: 10 }}
                                >
                                    <div className="relative" style={{ transform: 'translate(-50%, -50%)' }}>
                                        <div className="absolute -inset-2 border-2 border-dashed border-blue-400/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="absolute -top-6 left-0 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 whitespace-nowrap">
                                            <GripVertical size={10} /> Name
                                        </div>
                                        <span
                                            style={{
                                                fontSize: scaledFontSize,
                                                fontFamily: nameConfig.fontFamily,
                                                color: nameConfig.color,
                                                fontWeight: nameConfig.fontWeight,
                                                lineHeight: 1.2,
                                                textShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                                userSelect: 'none',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            Participant Name
                                        </span>
                                    </div>
                                </div>
                            </Draggable>
                        )}

                        {/* Draggable QR Element */}
                        {containerSize.width > 0 && (
                            <Draggable
                                position={qrPx}
                                onDrag={handleQrDrag}
                                bounds="parent"
                                nodeRef={qrRef}
                            >
                                <div
                                    ref={qrRef}
                                    className="absolute top-0 left-0 cursor-grab active:cursor-grabbing group"
                                    style={{ zIndex: 10 }}
                                >
                                    <div className="relative" style={{ transform: 'translate(-50%, -50%)' }}>
                                        <div className="absolute -inset-2 border-2 border-dashed border-purple-400/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="absolute -top-6 left-0 bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 whitespace-nowrap">
                                            <GripVertical size={10} /> QR Code
                                        </div>
                                        <div
                                            style={{
                                                width: scaledQrSize,
                                                height: scaledQrSize,
                                                border: '2px dashed rgba(147, 51, 234, 0.5)',
                                                borderRadius: 8,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: 'rgba(255,255,255,0.85)',
                                                backdropFilter: 'blur(4px)',
                                                userSelect: 'none',
                                            }}
                                        >
                                            <QrCode size={Math.max(16, scaledQrSize * 0.5)} className="text-purple-500/60" />
                                        </div>
                                    </div>
                                </div>
                            </Draggable>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-80 bg-slate-50 dark:bg-slate-900/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                            <Upload size={28} className="text-slate-400" />
                        </div>
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Upload a certificate template</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">to start positioning elements</p>
                    </div>
                )}
            </div>
        </div>
    );
}
