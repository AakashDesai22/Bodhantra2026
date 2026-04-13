import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '@/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Copy, Check } from 'lucide-react';

const API = API_URL;

export default function RegistrationPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);

    // Core fields (always required)
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', payment_method: 'online', prn: '', college: '', branch: '', year: ''
    });
    const [isOtherCollege, setIsOtherCollege] = useState(false);
    const [otherCollegeName, setOtherCollegeName] = useState('');
    // Custom field responses
    const [customData, setCustomData] = useState({});
    const [file, setFile] = useState(null);
    const [isUploadingId, setIsUploadingId] = useState(false);
    const [idPreview, setIdPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [credentials, setCredentials] = useState(null);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [copiedField, setCopiedField] = useState(null);

    const handleCopy = (text, field) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await axios.get(`${API}/api/events/${slug}`);
                setEvent(res.data);

                // Initialize custom data with defaults
                const defaults = {};
                (res.data.custom_fields || []).forEach(f => {
                    defaults[f.name] = f.type === 'checkbox' ? false : '';
                });
                setCustomData(defaults);

                // Set default payment method if online is disabled
                if (!res.data.require_online_payment && res.data.require_offline_payment) {
                    setFormData(prev => ({ ...prev, payment_method: 'offline' }));
                }
            } catch (err) {
                setError('Event not found');
            }
        };
        fetchEvent();
    }, [slug]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'college') {
            setIsOtherCollege(value === 'Other');
        }
        
        if (name === 'phone') {
            const numericValue = value.replace(/\D/g, '').slice(0, 10);
            setFormData(prev => ({ ...prev, [name]: numericValue }));
            return;
        }
        
        setFormData({ ...formData, [name]: value });
    };

    const handleCustomChange = (name, value) => {
        setCustomData({ ...customData, [name]: value });
    };

    const handleFileChange = async (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setIsUploadingId(true);
            const objectUrl = URL.createObjectURL(selectedFile);
            setIdPreview(objectUrl);
            
            try {
                const uploadData = new FormData();
                uploadData.append('image', selectedFile);
                const res = await axios.post(`${API}/api/upload`, uploadData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                
                // Keep the Cloudinary URL in state rather than the local file object
                setFile(res.data.url);
                console.log("Instant upload finished:", res.data.url);
            } catch (err) {
                console.error("Upload error", err);
                setError("Failed to upload image securely.");
                setFile(null);
                setIdPreview(null);
            } finally {
                setIsUploadingId(false);
            }
        } else {
            setFile(null);
            setIdPreview(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address.');
            setLoading(false);
            return;
        }

        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(formData.phone)) {
            setError('Please enter a valid 10-digit mobile number.');
            setLoading(false);
            return;
        }

        let finalCollege = formData.college;
        if (isOtherCollege) {
            finalCollege = otherCollegeName;
            if (!finalCollege || finalCollege.trim() === '') {
                setError('Please enter your college name');
                setLoading(false);
                return;
            }
        }

        if (!formData.prn || !formData.branch || !formData.year || !finalCollege || formData.college === '') {
            setError('Please fill in all standard academic fields (PRN, College, Branch, Year)');
            setLoading(false);
            return;
        }

        if (formData.prn.length < 8) {
            setError('PRN must be at least 8 characters long');
            setLoading(false);
            return;
        }

        // Validate required custom fields
        const customFields = event.custom_fields || [];
        for (const field of customFields) {
            if (field.required) {
                const val = customData[field.name];
                if (field.type === 'checkbox' && !val) {
                    setError(`Please check "${field.label}"`);
                    setLoading(false);
                    return;
                }
                if (field.type !== 'checkbox' && (!val || String(val).trim() === '')) {
                    setError(`"${field.label}" is required`);
                    setLoading(false);
                    return;
                }
            }
        }

        if (formData.payment_method === 'online' && !file) {
            setError('Please upload a payment screenshot');
            setLoading(false);
            return;
        }

        try {
            console.log('>>> FRONTEND: Attempting to send OTP to:', formData.email);
            console.log('>>> FRONTEND: API URL being used:', `${API}/api/email/send-otp`);
            
            // Send OTP request with 15s timeout
            const otpRes = await axios.post(`${API}/api/email/send-otp`, 
                { email: formData.email, name: formData.name },
                { timeout: 35000 } // Fail after 35 seconds to allow for Render cold starts
            );
            
            console.log('>>> FRONTEND: OTP Response received:', otpRes.data);
            setShowOtpModal(true);
        } catch (err) {
            console.error('>>> FRONTEND ERROR: Failed to send OTP:', err);
            console.error('>>> FRONTEND ERROR DETAILS:', err.response?.data);
            setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        if (!otp) {
            return setError('Please enter the OTP');
        }
        
        setOtpLoading(true);
        setError('');

        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('email', formData.email);
            data.append('phone', formData.phone);
            data.append('payment_method', formData.payment_method);
            data.append('prn', formData.prn);
            data.append('college', isOtherCollege ? otherCollegeName : formData.college);
            data.append('branch', formData.branch);
            data.append('year', formData.year);
            data.append('custom_data', JSON.stringify(customData));
            data.append('otp', otp);

            if (formData.payment_method === 'online' && file) {
                data.append('payment_ss_url', file); // Sending the Cloudinary URL directly
            }

            const res = await axios.post(`${API}/api/registrations/event/${event.id}`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setCredentials(res.data.credentials);
            setShowOtpModal(false);
            setSuccess(true);

        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setOtpLoading(false);
        }
    };

    // Render a custom field based on its type
    const renderCustomField = (field) => {
        const key = field.name;
        switch (field.type) {
            case 'text':
                return (
                    <Input
                        label={field.label + (field.required ? ' *' : '')}
                        value={customData[key] || ''}
                        onChange={(e) => handleCustomChange(key, e.target.value)}
                        required={field.required}
                    />
                );
            case 'textarea':
                return (
                    <div className="w-full">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            {field.label}{field.required ? ' *' : ''}
                        </label>
                        <textarea
                            rows={3}
                            value={customData[key] || ''}
                            onChange={(e) => handleCustomChange(key, e.target.value)}
                            required={field.required}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-slate-800 dark:text-white text-sm resize-none"
                        />
                    </div>
                );
            case 'number':
                return (
                    <Input
                        label={field.label + (field.required ? ' *' : '')}
                        type="number"
                        value={customData[key] || ''}
                        onChange={(e) => handleCustomChange(key, e.target.value)}
                        required={field.required}
                    />
                );
            case 'select':
                return (
                    <div className="w-full">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            {field.label}{field.required ? ' *' : ''}
                        </label>
                        <select
                            value={customData[key] || ''}
                            onChange={(e) => handleCustomChange(key, e.target.value)}
                            required={field.required}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-slate-800 dark:text-white text-sm"
                        >
                            <option value="">Select...</option>
                            {(field.options || []).map((opt, i) => (
                                <option key={i} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                );
            case 'checkbox':
                return (
                    <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition w-full">
                        <input
                            type="checkbox"
                            checked={customData[key] || false}
                            onChange={(e) => handleCustomChange(key, e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{field.label}{field.required ? ' *' : ''}</span>
                    </label>
                );
            default:
                return null;
        }
    };

    if (error && !event) return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center text-slate-600 dark:text-slate-400">
            <h2 className="text-2xl font-bold mb-4">{error}</h2>
            <Link to="/"><Button>Go Home</Button></Link>
        </div>
    );

    if (!event) return (
        <div className="min-h-[50vh] flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
    );

    const customFields = event.custom_fields || [];
    const showOnlinePayment = formData.payment_method === 'online';

    return (
        <div className="min-h-screen py-10 px-4 flex justify-center items-start bg-slate-50 dark:bg-slate-900">
            <div className="w-full max-w-2xl">
                {/* Event Info Banner */}
                <div className="bg-gradient-to-r from-primary to-blue-800 text-white rounded-t-2xl p-6 shadow-lg">
                    <h1 className="text-2xl font-bold mb-2">{event.name}</h1>
                    <div className="flex flex-wrap gap-4 text-sm text-blue-100">
                        {event.date && (
                            <span className="flex items-center gap-1">
                                📅 {new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                        )}
                        {event.time && <span className="flex items-center gap-1">🕐 {event.time}</span>}
                        {event.venue && <span className="flex items-center gap-1">📍 {event.venue}</span>}
                        {event.event_duration > 1 && <span className="flex items-center gap-1">📆 {event.event_duration} Days</span>}
                    </div>
                </div>

                <Card className="rounded-t-none border-t-0">
                    <CardContent>
                        {/* Check if registration is closed or sold out */}
                        {(!event.registration_open || event.is_sold_out) ? (
                            <div className="text-center py-12 px-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 my-8">
                                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-3">
                                    {!event.registration_open ? 'Registrations Closed' : 'Transmission Full'}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
                                    {!event.registration_open
                                        ? 'Registrations are currently on hold for this event. Stay tuned for further updates on our channels.'
                                        : 'We have hit maximum grid capacity for this event. No new immediate connections can be established.'}
                                </p>
                                
                                {event.is_sold_out && (
                                    <div className="mb-6 p-6 bg-blue-50 dark:bg-blue-900/10 border-l-4 border-blue-500 rounded-r-xl max-w-sm mx-auto text-left">
                                        <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2">Waitlist Available</h4>
                                        <p className="text-sm text-blue-800 dark:text-blue-400 mb-4">Grab a standby slot. If someone drops, you might get in.</p>
                                        <a href="https://forms.gle/placeholder" target="_blank" rel="noopener noreferrer">
                                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md">Join Waitlist</Button>
                                        </a>
                                    </div>
                                )}
                                
                                <Link to="/"><Button variant="outline" className="mt-2 text-slate-600">Return to Main Grid</Button></Link>
                            </div>
                        ) : success ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                
                                {formData.payment_method === 'online' ? (
                                    <>
                                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Registration Submitted! 🎉</h3>
                                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                                            Your payment receipt is under review. Please check your email for updates.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 text-yellow-600 dark:text-yellow-500">Registration Initialized! ⏳</h3>
                                        <p className="text-slate-600 dark:text-slate-400 mb-2 font-medium">
                                            To secure your spot and receive your Event Pass, you must complete your offline payment.
                                        </p>
                                    </>
                                )}

                                {credentials && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 text-left max-w-sm mx-auto mb-6 mt-4 shadow-sm">
                                        <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-4 text-center">Your Login Credentials</h4>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-lg border border-blue-100 dark:border-blue-700/50 shadow-sm">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Login ID</span>
                                                    <code className="text-sm font-semibold text-slate-800 dark:text-slate-200">{credentials.loginId}</code>
                                                </div>
                                                <button 
                                                    onClick={() => handleCopy(credentials.loginId, 'loginId')} 
                                                    className="p-2 rounded-md bg-blue-50 hover:bg-blue-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-slate-600 transition-colors" 
                                                    title="Copy Login ID"
                                                >
                                                    {copiedField === 'loginId' ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                                                </button>
                                            </div>
                                            
                                            <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-lg border border-blue-100 dark:border-blue-700/50 shadow-sm">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Password</span>
                                                    <code className="text-sm font-semibold text-slate-800 dark:text-slate-200">{credentials.password}</code>
                                                </div>
                                                <button 
                                                    onClick={() => handleCopy(credentials.password, 'password')} 
                                                    className="p-2 rounded-md bg-blue-50 hover:bg-blue-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-slate-600 transition-colors" 
                                                    title="Copy Password"
                                                >
                                                    {copiedField === 'password' ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-xs text-blue-600 mt-4 text-center font-medium">Save these credentials to access your dashboard</p>
                                    </div>
                                )}

                                {formData.payment_method === 'online' && event?.whatsapp_link && (
                                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center max-w-sm mx-auto mb-6">
                                        <h4 className="font-bold text-green-900 dark:text-green-300 mb-3">Step 2: Join the Official WhatsApp Group</h4>
                                        <p className="text-sm text-green-800 dark:text-green-400 mb-4">
                                            All event updates, schedules, and announcements will be shared here.
                                        </p>
                                        <a href={event.whatsapp_link} target="_blank" rel="noopener noreferrer">
                                            <Button className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2">
                                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.012.477 1.185.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 3.825.001 6.938 3.113 6.939 6.937-.001 3.824-3.114 6.936-6.939 6.943z"/>
                                                </svg>
                                                Join WhatsApp Group
                                            </Button>
                                        </a>
                                    </div>
                                )}

                                {formData.payment_method === 'offline' && event?.offline_payment_contacts && event.offline_payment_contacts.length > 0 && (
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 text-left max-w-sm mx-auto mb-6">
                                        <h4 className="font-bold text-yellow-900 dark:text-yellow-300 mb-4 text-center">Contact Offline Managers</h4>
                                        <div className="space-y-3">
                                            {event.offline_payment_contacts.map((contact, i) => (
                                                <div key={i} className="flex justify-between items-center bg-white/60 dark:bg-slate-800 p-3 rounded-lg border border-yellow-100 dark:border-yellow-700 shadow-sm">
                                                    <span className="font-bold text-slate-700 dark:text-slate-200">{contact.name}</span>
                                                    <a href={`tel:${contact.phone}`} className="text-sm font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-700 border border-blue-100 dark:border-blue-900 px-3 py-1.5 rounded-full shadow-sm hover:bg-blue-50 dark:hover:bg-slate-600 transition-colors">📞 {contact.phone}</a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 justify-center">
                                    <Link to="/login">
                                        <Button>Go to Login</Button>
                                    </Link>
                                    <Link to="/">
                                        <Button variant="outline">Back to Home</Button>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5 pt-2">
                                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Registration Details</h2>

                                {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">{error}</div>}

                                {/* Core Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label="Full Name *" name="name" required value={formData.name} onChange={handleChange} />
                                    <Input label="Email Address *" type="email" name="email" required value={formData.email} onChange={handleChange} />
                                    <Input label="Phone Number *" name="phone" required value={formData.phone} onChange={handleChange} maxLength={10} placeholder="e.g. 9876543210" />
                                    <Input label="PRN *" name="prn" required value={formData.prn} onChange={handleChange} placeholder="e.g. 21X00000" />
                                </div>
                                <p className="text-xs text-slate-400 mt-2 mb-6">
                                    📌 Your email will be your Login ID and phone number will be your password
                                </p>

                                {/* Academic Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200 dark:border-slate-700 pt-5 mt-5">
                                    <div className="w-full">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">College *</label>
                                        <select name="college" required value={formData.college} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-slate-800 dark:text-white text-sm">
                                            <option value="">Select College...</option>
                                            <option value="KIT's College of Engineering">KIT's College of Engineering</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    {isOtherCollege && (
                                        <Input label="Enter College Name *" value={otherCollegeName} onChange={(e) => setOtherCollegeName(e.target.value)} required />
                                    )}
                                    <div className="w-full">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Branch *</label>
                                        <select name="branch" required value={formData.branch} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-slate-800 dark:text-white text-sm">
                                            <option value="">Select Branch...</option>
                                            <option value="CSE">CSE</option>
                                            <option value="MECH">MECH</option>
                                            <option value="CIVIL">CIVIL</option>
                                            <option value="ENTC">ENTC</option>
                                            <option value="AIML">AIML</option>
                                            <option value="CSBS">CSBS</option>
                                            <option value="CIVIL Env.">CIVIL Env.</option>
                                            <option value="ELEC">ELEC</option>
                                            <option value="BIOTECH">BIOTECH</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div className="w-full">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Year of Study *</label>
                                        <select name="year" required value={formData.year} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-slate-800 dark:text-white text-sm">
                                            <option value="">Select Year...</option>
                                            <option value="FY">First Year (FY)</option>
                                            <option value="DSY">DSY</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Custom Fields */}
                                {customFields.length > 0 && (
                                    <div className="border-t border-slate-200 pt-5 mt-5">
                                    <h3 className="text-md font-semibold text-slate-700 dark:text-slate-200 mb-3">Additional Information</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {customFields.map((field, i) => (
                                                <div key={i}>{renderCustomField(field)}</div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Payment */}
                                {(event.payment_amount > 0 || event.require_online_payment || event.require_offline_payment) && (
                                    <div className="border-t border-slate-200 pt-5 mt-5">
                                        <h3 className="text-md font-semibold text-slate-700 dark:text-slate-200 mb-3">
                                            College ID Proof* {event.payment_amount > 0 ? <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">(₹{event.payment_amount})</span> : ''}
                                        </h3>

                                        {event.require_online_payment && event.require_offline_payment ? (
                                            <div className="w-full mb-5">
                                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Select Payment Mode</label>
                                                <div className="flex gap-4">
                                                    <label className={`flex-1 flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${formData.payment_method === 'online' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 dark:border-slate-700'}`}>
                                                        <input type="radio" name="payment_method" value="online" checked={formData.payment_method === 'online'} onChange={handleChange} className="hidden" />
                                                        <span className="text-xl">💳</span>
                                                        <span className="font-semibold text-sm">Online (UPI / QR)</span>
                                                    </label>
                                                    <label className={`flex-1 flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${formData.payment_method === 'offline' ? 'border-green-500 bg-green-50/50 text-green-700' : 'border-slate-200 dark:border-slate-700'}`}>
                                                        <input type="radio" name="payment_method" value="offline" checked={formData.payment_method === 'offline'} onChange={handleChange} className="hidden" />
                                                        <span className="text-xl">💵</span>
                                                        <span className="font-semibold text-sm">Offline (Cash)</span>
                                                    </label>
                                                </div>
                                            </div>
                                        ) : null}

                                        {formData.payment_method === 'online' && event.require_online_payment && (
                                            <div className="bg-blue-50 p-5 rounded-xl border border-blue-100 space-y-4">
                                                {event.qr_code_url && (
                                                    <div className="text-center">
                                                        <p className="text-sm font-medium text-blue-900 mb-3">Scan QR Code to Pay</p>
                                                        <img
                                                            src={`${event.qr_code_url?.startsWith('http') ? event.qr_code_url : `${API}${event.qr_code_url}`}`}
                                                            alt="Payment QR Code"
                                                            className="w-48 h-48 object-contain mx-auto rounded-lg border-2 border-white shadow-md bg-white"
                                                        />
                                                    </div>
                                                )}
                                                {event.payment_details && (
                                                    <p className="text-sm text-blue-800 whitespace-pre-wrap bg-blue-100/50 p-3 rounded-lg">
                                                        {event.payment_details}
                                                    </p>
                                                )}
                                                <div>
                                                    <label className="block text-sm font-medium text-blue-900 mb-1">Upload College ID Card*</label>
                                                    {idPreview && (
                                                        <div className="mb-4 relative rounded-lg border border-blue-200 overflow-hidden bg-white max-w-xs shadow-sm">
                                                            {isUploadingId ? (
                                                                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                                                                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                                                                    <span className="text-sm font-semibold text-blue-700">Uploading...</span>
                                                                </div>
                                                            ) : (
                                                                <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1 shadow-md z-10 flex items-center gap-1 px-2">
                                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                    <span className="text-xs font-bold">Uploaded</span>
                                                                </div>
                                                            )}
                                                            <img src={idPreview} alt="ID Preview" className="w-full h-auto object-cover max-h-48 mx-auto" />
                                                        </div>
                                                    )}
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleFileChange}
                                                        disabled={isUploadingId}
                                                        className="block w-full text-sm text-slate-500
                                                            file:mr-4 file:py-2 file:px-4
                                                            file:rounded-md file:border-0
                                                            file:text-sm file:font-semibold
                                                            file:bg-blue-600 file:text-white
                                                            hover:file:bg-blue-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {formData.payment_method === 'offline' && event.require_offline_payment && (
                                            <div className="bg-green-50 p-5 rounded-xl border border-green-200 animate-in fade-in slide-in-from-top-2">
                                                <div className="mb-4">
                                                    <h4 className="font-bold text-green-900 mb-1 flex items-center gap-2">💵 Offline Cash Payment</h4>
                                                    <p className="text-sm text-green-800">
                                                        Please hand over {event.payment_amount > 0 ? `₹${event.payment_amount}` : 'the entry fee'} in cash to any of the authorized managers below. Your registration will be confirmed once they receive it.
                                                    </p>
                                                </div>
                                                <div className="space-y-2">
                                                    {event.offline_payment_contacts && event.offline_payment_contacts.length > 0 ? (
                                                        event.offline_payment_contacts.map((contact, i) => (
                                                            <div key={i} className="flex justify-between items-center bg-white/60 p-3 rounded-lg border border-green-100 shadow-sm">
                                                                <span className="font-bold text-slate-700">{contact.name}</span>
                                                                <a href={`tel:${contact.phone}`} className="text-sm font-bold text-blue-600 bg-white border border-blue-100 px-3 py-1.5 rounded-full shadow-sm hover:bg-blue-50 transition-colors">📞 {contact.phone}</a>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="text-xs text-green-700 italic border border-dashed border-green-300 p-3 rounded text-center">Please pay the event coordinator at the venue desk.</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <Button type="submit" className="w-full py-3 text-lg mt-4" disabled={loading || isUploadingId}>
                                    {loading ? 'Processing...' : isUploadingId ? 'Uploading ID...' : 'Complete Registration'}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>

                {/* OTP Modal */}
                {showOtpModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowOtpModal(false)}></div>
                        <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
                            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                                📩
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Verify Your Email</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                                We've sent a 6-digit OTP to <strong className="break-all">{formData.email}</strong>. Please enter it below to complete your registration.
                            </p>
                            <form onSubmit={handleOtpSubmit}>
                                <div className="mb-4">
                                    <Input
                                        type="text"
                                        placeholder="Enter 6-digit OTP"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        maxLength={6}
                                        required
                                    />
                                </div>
                                {error && <div className="text-red-500 text-sm mb-4 bg-red-50 dark:bg-red-900/20 p-2 rounded">{error}</div>}
                                <Button type="submit" className="w-full mb-3" disabled={otpLoading}>
                                    {otpLoading ? 'Verifying...' : 'Verify & Register'}
                                </Button>
                                <button
                                    type="button"
                                    onClick={() => setShowOtpModal(false)}
                                    className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                >
                                    Cancel
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
