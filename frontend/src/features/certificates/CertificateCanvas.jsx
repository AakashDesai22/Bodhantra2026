import React, { useRef, useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import { X, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { API_URL } from '@/api';

const API_BASE = API_URL;

// Standard certificate canvas dimensions (high-res for download)
const CANVAS_WIDTH = 2000;
const CANVAS_HEIGHT = 1414; // ~A4 landscape ratio

export default function CertificateCanvas({ registration, onClose }) {
    const canvasRef = useRef(null);
    const [rendering, setRendering] = useState(true);
    const [error, setError] = useState(null);

    const event = registration?.Event;
    const user = registration?.User;
    const certConfig = event?.certificateTemplates?.participation;

    const renderCertificate = useCallback(async () => {
        if (!canvasRef.current || !certConfig?.config || !certConfig?.backgroundUrl) {
            setError('Certificate configuration not found.');
            setRendering(false);
            return;
        }

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const config = certConfig.config;

        try {
            // Load background image
            const bgImage = await loadImage(`${API_BASE}${certConfig.backgroundUrl}`);
            
            // Set canvas dimensions to match the image's natural ratio
            canvas.width = bgImage.naturalWidth || CANVAS_WIDTH;
            canvas.height = bgImage.naturalHeight || CANVAS_HEIGHT;

            // Draw background
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

            // ── Draw Participant Name ──
            if (config.name) {
                const nameX = (config.name.x / 100) * canvas.width;
                const nameY = (config.name.y / 100) * canvas.height;
                
                // Scale fontSize relative to canvas width (config was designed at ~1000px reference)
                const scaledFontSize = (config.name.fontSize / 1000) * canvas.width;

                ctx.font = `${config.name.fontWeight || 'bold'} ${scaledFontSize}px "${config.name.fontFamily || 'Georgia'}"`;
                ctx.fillStyle = config.name.color || '#1e293b';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(user?.name || 'Participant Name', nameX, nameY);
            }

            // ── Draw QR Code ──
            if (config.qr && user?.unique_id) {
                const qrX = (config.qr.x / 100) * canvas.width;
                const qrY = (config.qr.y / 100) * canvas.height;
                const scaledSize = (config.qr.size / 1000) * canvas.width;

                // Generate QR code as data URL
                const qrDataUrl = await QRCode.toDataURL(user.unique_id, {
                    width: Math.round(scaledSize),
                    margin: 1,
                    color: { dark: '#1e293b', light: '#ffffff' },
                });

                const qrImage = await loadImage(qrDataUrl);
                ctx.drawImage(
                    qrImage,
                    qrX - scaledSize / 2,
                    qrY - scaledSize / 2,
                    scaledSize,
                    scaledSize
                );
            }

            setRendering(false);
        } catch (err) {
            console.error('Certificate render error:', err);
            setError('Failed to render certificate. Please try again.');
            setRendering(false);
        }
    }, [certConfig, user]);

    useEffect(() => {
        renderCertificate();
    }, [renderCertificate]);

    // Download handler
    const handleDownload = () => {
        if (!canvasRef.current) return;
        const dataUrl = canvasRef.current.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `Certificate_${user?.name?.replace(/\s+/g, '_') || 'participant'}_${event?.name?.replace(/\s+/g, '_') || 'event'}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm">
                    <div>
                        <h2 className="text-lg font-extrabold text-slate-800 dark:text-white">Your Certificate</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{event?.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleDownload}
                            disabled={rendering || !!error}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-lg shadow-blue-500/25"
                        >
                            <Download size={16} />
                            Download as PNG
                        </Button>
                        <button
                            onClick={onClose}
                            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 overflow-auto p-6 bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                    {rendering && (
                        <div className="absolute inset-0 flex items-center justify-center z-20 bg-white/60 dark:bg-black/60 backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 size={32} className="animate-spin text-primary" />
                                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Rendering your certificate...</p>
                            </div>
                        </div>
                    )}

                    {error ? (
                        <div className="text-center py-16">
                            <p className="text-red-500 font-semibold">{error}</p>
                        </div>
                    ) : (
                        <canvas
                            ref={canvasRef}
                            className="max-w-full h-auto rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700"
                            style={{ maxHeight: '70vh' }}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 text-center">
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        Certificate ID: <span className="font-mono font-bold text-primary">{user?.unique_id}</span> · Generated for {user?.name}
                    </p>
                </div>
            </div>
        </div>
    );
}

// Helper: Load image as Promise
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
    });
}
