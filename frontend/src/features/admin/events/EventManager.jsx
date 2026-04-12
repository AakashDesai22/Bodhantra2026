import React, { useState } from 'react';
import { api, API_URL } from '@/api';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import FeedbackConfigModal from './FeedbackConfigModal';

// --- Fields Builder Component ---
function FieldsBuilder({ fields, onChange }) {
    const fieldTypes = [
        { value: 'text', label: 'Text Input' },
        { value: 'textarea', label: 'Text Area' },
        { value: 'number', label: 'Number' },
        { value: 'select', label: 'Dropdown' },
        { value: 'checkbox', label: 'Checkbox' },
    ];

    const addField = () => {
        onChange([...fields, { name: '', label: '', type: 'text', required: false, options: [] }]);
    };

    const removeField = (index) => {
        onChange(fields.filter((_, i) => i !== index));
    };

    const updateField = (index, key, value) => {
        const updated = [...fields];
        updated[index] = { ...updated[index], [key]: value };
        if (key === 'label') {
            updated[index].name = value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '');
        }
        onChange(updated);
    };

    const updateOptions = (index, optionsStr) => {
        const updated = [...fields];
        updated[index] = { ...updated[index], options: optionsStr.split(',').map(o => o.trim()).filter(Boolean) };
        onChange(updated);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-slate-700 dark:text-slate-200">Custom Registration Fields</h4>
                <Button type="button" variant="outline" className="text-xs px-3 py-1.5" onClick={addField}>
                    + Add Field
                </Button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Define additional questions/inputs that participants will fill during registration.
                Name, Email & Phone are always included by default.
            </p>
            {fields.length === 0 && (
                <div className="text-center py-6 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 text-slate-400 dark:text-slate-500 text-sm">
                    No custom fields yet. Click "Add Field" to start building your form.
                </div>
            )}
            {fields.map((field, i) => (
                <div key={i} className="p-4 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50/50 dark:bg-slate-700/30 space-y-3 relative group">
                    <button
                        type="button"
                        onClick={() => removeField(i)}
                        className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 hover:bg-red-200 dark:hover:bg-red-900/50 opacity-0 group-hover:opacity-100 transition-opacity text-sm font-bold"
                    >
                        ×
                    </button>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Input
                            label="Field Label"
                            placeholder="e.g. College Name"
                            value={field.label}
                            onChange={(e) => updateField(i, 'label', e.target.value)}
                        />
                        <div className="w-full">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                            <select
                                value={field.type}
                                onChange={(e) => updateField(i, 'type', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-slate-800 dark:text-white text-sm"
                            >
                                {fieldTypes.map(ft => (
                                    <option key={ft.value} value={ft.value}>{ft.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-full flex items-end gap-3 pb-1">
                            <label className="flex items-center gap-2 cursor-pointer text-sm dark:text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={field.required}
                                    onChange={(e) => updateField(i, 'required', e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary"
                                />
                                Required
                            </label>
                        </div>
                    </div>
                    {field.type === 'select' && (
                        <Input
                            label="Options (comma separated)"
                            placeholder="e.g. FY, SY, TY, Final Year"
                            value={(field.options || []).join(', ')}
                            onChange={(e) => updateOptions(i, e.target.value)}
                        />
                    )}
                    {field.name && (
                        <p className="text-xs text-slate-400 dark:text-slate-500">Field ID: <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">{field.name}</code></p>
                    )}
                </div>
            ))}
        </div>
    );
}

// --- Session Builder Component (Attendance Structure) ---
function SessionBuilder({ sessions, onChange, eventDuration }) {
    const days = parseInt(eventDuration) || 1;

    const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    };

    const addSession = (day) => {
        onChange([...sessions, { id: generateUUID(), day, sessionName: '' }]);
    };

    const removeSession = (id) => {
        onChange(sessions.filter(s => s.id !== id));
    };

    const updateSessionName = (id, name) => {
        onChange(sessions.map(s => s.id === id ? { ...s, sessionName: name } : s));
    };

    return (
        <div className="space-y-5">
            <div>
                <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">Attendance Structure</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    Define attendance sessions for each day. Each session gets a unique immutable ID for tracking.
                    Leave empty if you want legacy day-based attendance.
                </p>
            </div>

            {Array.from({ length: days }, (_, i) => i + 1).map(day => {
                const daySessions = sessions.filter(s => s.day === day);
                return (
                    <div key={day} className="p-4 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50/50 dark:bg-slate-700/30">
                        <div className="flex items-center justify-between mb-3">
                            <h5 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-extrabold">{day}</span>
                                Day {day}
                            </h5>
                            <button
                                type="button"
                                onClick={() => addSession(day)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-semibold transition-colors"
                            >
                                + Add Session
                            </button>
                        </div>

                        {daySessions.length === 0 ? (
                            <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-3 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
                                No sessions for Day {day}. Click "+ Add Session" to add one.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {daySessions.map((session) => (
                                    <div key={session.id} className="flex items-center gap-3 group">
                                        <div className="flex-1">
                                            <input
                                                type="text"
                                                value={session.sessionName}
                                                onChange={(e) => updateSessionName(session.id, e.target.value)}
                                                placeholder="e.g. Morning Check-in, Afternoon Workshop..."
                                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-slate-800 dark:text-white text-sm"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeSession(session.id)}
                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 hover:bg-red-200 dark:hover:bg-red-900/50 opacity-0 group-hover:opacity-100 transition-opacity text-sm font-bold shrink-0"
                                        >
                                            ×
                                        </button>
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono hidden sm:block shrink-0 w-20 truncate" title={session.id}>
                                            {session.id.slice(0, 8)}…
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}

            {sessions.length > 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-700 dark:text-blue-300">
                    <strong>{sessions.length}</strong> session{sessions.length !== 1 ? 's' : ''} configured across {days} day{days !== 1 ? 's' : ''}. 
                    Each session has a permanent UUID for attendance tracking.
                </div>
            )}
        </div>
    );
}

// --- Offline Contact Builder ---
function OfflineContactBuilder({ contacts, onChange }) {
    const addContact = () => onChange([...contacts, { name: '', phone: '' }]);
    const removeContact = (id) => onChange(contacts.filter((_, i) => i !== id));
    const updateContact = (id, field, value) => {
        onChange(contacts.map((c, i) => i === id ? { ...c, [field]: value } : c));
    };

    return (
        <div className="space-y-3 p-4 border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10 rounded-xl animate-in fade-in slide-in-from-top-2">
            <div>
                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200">Offline Collection Managers</h4>
                <p className="text-xs text-slate-500 mb-4">Add names and mobile numbers of people authorized to collect cash. Students will see this list when they choose offline payment.</p>
            </div>
            
            <div className="space-y-2">
                {contacts.map((c, i) => (
                    <div key={i} className="flex gap-2 items-center group">
                        <input type="text" placeholder="Name" value={c.name} onChange={(e) => updateContact(i, 'name', e.target.value)} className="flex-1 px-3 py-2 text-sm rounded border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-green-500 outline-none" required />
                        <input type="text" placeholder="Mobile Number" value={c.phone} onChange={(e) => updateContact(i, 'phone', e.target.value)} className="flex-1 px-3 py-2 text-sm rounded border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-green-500 outline-none" required />
                        <button type="button" onClick={() => removeContact(i)} className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-500 hover:bg-red-200 opacity-0 group-hover:opacity-100 transition text-lg font-bold">×</button>
                    </div>
                ))}
            </div>

            <button type="button" onClick={addContact} className="text-xs px-3 py-1.5 rounded-lg bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-100 hover:bg-green-300 font-semibold transition mt-2">
                + Add Manager
            </button>
        </div>
    );
}

// --- Create / Edit Event Modal ---
function EventModal({ event, onClose, onSaved }) {
    const isEdit = !!event;
    const [form, setForm] = useState({
        name: event?.name || '',
        description: event?.description || '',
        date: event?.date ? new Date(event.date).toISOString().split('T')[0] : '',
        time: event?.time || '',
        venue: event?.venue || '',
        payment_details: event?.payment_details || '',
        payment_amount: event?.payment_amount || '',
        require_online_payment: event?.require_online_payment || false,
        require_offline_payment: event?.require_offline_payment || false,
        offline_payment: event?.offline_payment || false, // Legacy
        status: event?.status || 'active',
        participant_limit: event?.participant_limit || '',
        event_duration: event?.event_duration || 1,
        registration_open: event?.registration_open !== undefined ? event.registration_open : true,
        whatsapp_link: event?.whatsapp_link || '',
        isCountdownEnabled: event?.isCountdownEnabled || false,
        countdownTargetDate: event?.countdownTargetDate ? new Date(event.countdownTargetDate).toISOString().slice(0, 16) : '',
    });
    const [customFields, setCustomFields] = useState(event?.custom_fields || []);
    const [attendanceSessions, setAttendanceSessions] = useState(event?.attendance_sessions || []);
    const [offlineContacts, setOfflineContacts] = useState(event?.offline_payment_contacts || []);
    const [photo, setPhoto] = useState(null);
    const [poster, setPoster] = useState(null);
    const [qrCode, setQrCode] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = new FormData();
            Object.keys(form).forEach(key => data.append(key, form[key]));
            data.append('custom_fields', JSON.stringify(customFields));
            data.append('attendance_sessions', JSON.stringify(attendanceSessions));
            data.append('offline_payment_contacts', JSON.stringify(offlineContacts));

            if (photo) data.append('photo', photo);
            if (poster) data.append('poster', poster);
            if (qrCode) data.append('qr_code', qrCode);

            if (isEdit) {
                await api.patch(`/api/events/admin/${event.id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await api.post('/api/events/admin/create', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            onSaved();
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 px-6 py-4 flex items-center justify-between z-10">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                        {isEdit ? 'Edit Event' : 'Create New Event'}
                    </h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors text-lg">
                        ×
                    </button>
                </div>

                <div className="px-6 pt-4">
                    <div className="flex items-center gap-2 mb-6">
                        {[
                            { num: 1, label: 'Details' },
                            { num: 2, label: 'Fields' },
                            { num: 3, label: 'Payment' },
                            { num: 4, label: 'Attendance' },
                        ].map((s) => (
                            <button
                                key={s.num}
                                type="button"
                                onClick={() => setStep(s.num)}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${step === s.num
                                    ? 'bg-primary text-white shadow-md'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                            >
                                {s.num}. {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="px-6 pb-6">
                    {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm mb-4">{error}</div>}

                    {step === 1 && (
                        <div className="space-y-4">
                            <Input label="Event Name *" name="name" required value={form.name} onChange={handleChange} placeholder="e.g. Hackathon 2026" />
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                                <textarea name="description" rows={3} value={form.description} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-slate-800 dark:text-white text-sm resize-none" placeholder="Describe the event..." />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input label="Date *" type="date" name="date" required value={form.date} onChange={handleChange} />
                                <Input label="Time" name="time" value={form.time} onChange={handleChange} placeholder="e.g. 10:00 AM - 4:00 PM" />
                            </div>
                            <Input label="Venue" name="venue" value={form.venue} onChange={handleChange} placeholder="e.g. Main Auditorium, Block C" />
                            <Input label="WhatsApp Group Link" type="url" name="whatsapp_link" value={form.whatsapp_link} onChange={handleChange} placeholder="https://chat.whatsapp.com/... (optional)" />
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Input label="Participant Limit" type="number" name="participant_limit" value={form.participant_limit} onChange={handleChange} />
                                <Input label="Duration (Days)" type="number" name="event_duration" value={form.event_duration} onChange={handleChange} min="1" />
                                <div className="w-full flex items-end pb-1">
                                    <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer w-full">
                                        <input type="checkbox" name="registration_open" checked={form.registration_open} onChange={handleChange} className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-primary" />
                                        <span className="font-medium text-slate-700 dark:text-slate-200 text-sm">Open</span>
                                    </label>
                                </div>
                            </div>

                            <div className="p-4 border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl space-y-4">
                                <div>
                                    <h4 className="font-bold text-sm text-indigo-800 dark:text-indigo-300">Landing Page Countdown</h4>
                                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">Add a dynamic countdown timer to the landing page hero section to build hype.</p>
                                </div>
                                <label className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-indigo-100 dark:border-indigo-800 cursor-pointer">
                                    <input type="checkbox" name="isCountdownEnabled" checked={form.isCountdownEnabled} onChange={handleChange} className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                                    <span className="font-medium text-slate-700 dark:text-slate-200 text-sm">Enable Countdown Timer</span>
                                </label>
                                {form.isCountdownEnabled && (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <Input
                                            label="Target Date & Time *"
                                            type="datetime-local"
                                            name="countdownTargetDate"
                                            value={form.countdownTargetDate}
                                            onChange={handleChange}
                                            required={form.isCountdownEnabled}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Event Banner UI Image</label>
                                    <input type="file" onChange={(e) => setPhoto(e.target.files[0])} accept="image/*" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Event Poster (Optional)</label>
                                    <input type="file" onChange={(e) => setPoster(e.target.files[0])} accept="image/*" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button type="button" onClick={() => setStep(2)}>Next →</Button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <FieldsBuilder fields={customFields} onChange={setCustomFields} />
                            <div className="flex justify-between pt-2">
                                <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
                                <Button type="button" onClick={() => setStep(3)}>Next →</Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <Input label="Event Fee / Payment Amount (₹)" type="number" name="payment_amount" value={form.payment_amount} onChange={handleChange} placeholder="e.g. 500 (Leave 0 for Free Events)" min="0" />

                            <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 cursor-pointer">
                                <input type="checkbox" name="require_online_payment" checked={form.require_online_payment} onChange={handleChange} className="w-5 h-5 rounded text-primary border-slate-300 dark:border-slate-600" />
                                <div>
                                    <span className="font-bold text-slate-700 dark:text-slate-200 text-base block">Enable Online Payment (UPI / QR)</span>
                                    <span className="text-xs font-normal text-slate-500">Allow students to pay online and upload screenshot.</span>
                                </div>
                            </label>

                            {form.require_online_payment && (
                                <div className="space-y-4 p-5 border border-primary/20 bg-primary/5 rounded-xl animate-in fade-in slide-in-from-top-2">
                                    <Input 
                                        label="UPI ID or Payment Instructions *" 
                                        name="payment_details" 
                                        value={form.payment_details} 
                                        onChange={handleChange} 
                                        placeholder="e.g. valid-upi@id or Account details" 
                                    />
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Upload UPI QR Code (Optional)</label>
                                        <input type="file" onChange={(e) => setQrCode(e.target.files[0])} accept="image/*" className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer transition-colors" />
                                    </div>
                                </div>
                            )}

                            <label className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600 cursor-pointer">
                                <input type="checkbox" name="require_offline_payment" checked={form.require_offline_payment} onChange={handleChange} className="w-5 h-5 rounded text-green-600 border-slate-300 dark:border-slate-600" />
                                <div>
                                    <span className="font-bold text-slate-700 dark:text-slate-200 text-base block">Enable Offline Payment (Cash)</span>
                                    <span className="text-xs font-normal text-slate-500">Allow students to select cash and see assigned collectors. No screenshot required.</span>
                                </div>
                            </label>

                            {form.require_offline_payment && (
                                <OfflineContactBuilder contacts={offlineContacts} onChange={setOfflineContacts} />
                            )}

                            <div className="flex justify-between pt-4">
                                <Button type="button" variant="outline" onClick={() => setStep(2)}>Back</Button>
                                <Button type="button" onClick={() => setStep(4)}>Next →</Button>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-4">
                            <SessionBuilder
                                sessions={attendanceSessions}
                                onChange={setAttendanceSessions}
                                eventDuration={form.event_duration}
                            />
                            <div className="flex justify-between pt-4">
                                <Button type="button" variant="outline" onClick={() => setStep(3)}>Back</Button>
                                <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Event'}</Button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

export default function EventManager({ events, onRefresh, readOnly = false }) {
    const [showModal, setShowModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [feedbackEvent, setFeedbackEvent] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    const handleDelete = async (id) => {
        try {
            await api.delete(`/api/events/admin/${id}`);
            setDeleteId(null);
            onRefresh();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-4">
            {!readOnly && (
                <div className="flex justify-end">
                    <Button onClick={() => { setEditingEvent(null); setShowModal(true); }}>+ Create Event</Button>
                </div>
            )}

            {events.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-600">
                    <p className="text-slate-500">No events found. Start by creating one!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {events.map(evt => (
                        <Card key={evt.id} className="hover:shadow-xl transition-shadow flex flex-col">
                            {evt.poster_url && (
                                <div className="overflow-hidden bg-slate-100 dark:bg-slate-700 rounded-t-2xl">
                                    <img src={`${API_URL}${evt.poster_url}`} alt={evt.name} className="w-full max-h-48 object-contain" />
                                </div>
                            )}
                            <CardContent className="p-5 flex-grow flex flex-col">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{evt.name}</h3>
                                <div className="text-sm text-slate-500 mb-4 space-y-1">
                                    <p>📅 {new Date(evt.date).toLocaleDateString()}</p>
                                    {evt.venue && <p>📍 {evt.venue}</p>}
                                    {evt.attendance_sessions && evt.attendance_sessions.length > 0 && (
                                        <p className="text-xs text-primary font-medium">🎯 {evt.attendance_sessions.length} attendance session{evt.attendance_sessions.length !== 1 ? 's' : ''}</p>
                                    )}
                                </div>
                                {!readOnly && (
                                    <div className="mt-auto flex flex-col gap-2">
                                        <div className="flex gap-2">
                                            <Button variant="outline" className="flex-1" onClick={() => { setEditingEvent(evt); setShowModal(true); }}>Edit</Button>
                                            <Button variant="outline" className="flex-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/30" onClick={() => { setFeedbackEvent(evt); setShowFeedbackModal(true); }}>Feedback</Button>
                                        </div>
                                        <Button variant="danger" className="w-full" onClick={() => setDeleteId(evt.id)}>Delete</Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {showModal && <EventModal event={editingEvent} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); onRefresh(); }} />}
            {showFeedbackModal && <FeedbackConfigModal event={feedbackEvent} onClose={() => setShowFeedbackModal(false)} onSaved={() => { setShowFeedbackModal(false); onRefresh(); }} />}

            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteId(null)}></div>
                    <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl max-w-sm w-full text-center">
                        <h3 className="text-xl font-bold mb-4">Delete Event?</h3>
                        <p className="text-slate-500 mb-6 font-medium">This is permanent and will affect all related registrations.</p>
                        <div className="flex gap-3 justify-center">
                            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                            <Button variant="danger" onClick={() => handleDelete(deleteId)}>Delete</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
