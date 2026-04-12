import React, { useState, useEffect } from 'react';
import { api } from '@/api';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon, Star, Download } from 'lucide-react';
import WheelReveal from './WheelReveal';
import SupportCard from './SupportCard';
import FeedbackForm from './FeedbackForm';
import CertificateCanvas from '@/features/certificates/CertificateCanvas';

export default function ParticipantDashboard() {
    const { theme, toggleTheme } = useTheme();
    const [registrations, setRegistrations] = useState([]);
    const [queries, setQueries] = useState([]);
    const [newQuery, setNewQuery] = useState('');
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState([{ sender: 'bot', text: 'Hi! Ask me keywords like timing, venue, or certificate.' }]);
    const [feedbackEvent, setFeedbackEvent] = useState(null);
    const [certRegistration, setCertRegistration] = useState(null);

    const downloadQR = (dataUrl, eventName) => {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${eventName.replace(/\s+/g, '_')}_EventPass.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const regRes = await api.get('/api/registrations/my');
            setRegistrations(regRes.data);

            const queryRes = await api.get('/api/queries/my');
            setQueries(queryRes.data);
        } catch (err) {
            console.error("Dashboard fetch error", err);
        }
    };

    const submitQuery = async (e) => {
        e.preventDefault();
        if (!newQuery.trim()) return;
        try {
            await api.post('/api/queries', { message: newQuery });
            setNewQuery('');
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleChat = (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const lowerInput = chatInput.toLowerCase();
        setChatMessages(prev => [...prev, { sender: 'user', text: chatInput }]);

        let response = "I'm not sure. Please contact admin using the Query Portal.";
        if (lowerInput.includes('timing') || lowerInput.includes('time')) {
            response = "Check the event details on your registration cards for specific timing!";
        } else if (lowerInput.includes('venue') || lowerInput.includes('location')) {
            response = "The venue is shown on each event card. Check your registered events above!";
        } else if (lowerInput.includes('certificate')) {
            response = "Certificates will be distributed physically at the end of the event.";
        } else if (lowerInput.includes('payment')) {
            response = "Contact admin about payment confirmation via the Query Portal below.";
        }

        setChatMessages(prev => [...prev, { sender: 'bot', text: response }]);
        setChatInput('');
    };

    return (
        <div className="max-w-7xl mx-auto py-8">
            <div className="flex justify-between items-center px-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Participant Dashboard</h1>
                    {registrations.length > 0 && (
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                            ID: <span className="font-mono font-bold text-primary">{registrations[0].User?.unique_id || 'ID PENDING'}</span>
                        </p>
                    )}
                </div>
                <button
                    onClick={toggleTheme}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all duration-200 border border-slate-200 dark:border-slate-700"
                    title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
                {/* Main Column */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader title="My Registrations" />
                        <CardContent>
                            {registrations.length === 0 ? (
                                <p className="text-slate-500 dark:text-slate-400">You haven't registered for any events yet!</p>
                            ) : (
                                <div className="space-y-4">
                                    {registrations.map(reg => (
                                        <div key={reg.id} className="p-5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800/50 shadow-sm">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h4 className="font-semibold text-lg text-slate-800 dark:text-white">{reg.Event?.name}</h4>
                                                    <div className="space-y-1 mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                                                        {reg.Event?.date && (
                                                            <p>📅 {new Date(reg.Event.date).toLocaleDateString(undefined, {
                                                                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                                                            })}</p>
                                                        )}
                                                        {reg.Event?.time && <p>🕐 {reg.Event.time}</p>}
                                                        {reg.Event?.venue && <p>📍 {reg.Event.venue}</p>}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${reg.status === 'approved' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' : reg.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800'}`}>
                                                        {reg.status.toUpperCase()}
                                                    </span>
                                                    {reg.attendance && (
                                                        <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">✓ Attended</p>
                                                    )}
                                                </div>
                                            </div>
                                            {/* QR Code for approved registrations */}
                                            {reg.status === 'approved' && reg.qr_code_data && (
                                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 text-center border border-blue-200 dark:border-blue-800">
                                                        <h5 className="font-bold text-blue-900 dark:text-blue-300 mb-4">🎫 Your Event Pass</h5>
                                                        <div className="relative inline-block">
                                                            <img
                                                                src={reg.qr_code_data}
                                                                alt="Event Pass QR Code"
                                                                className="w-44 h-44 mx-auto rounded-lg border-2 border-white dark:border-slate-700 shadow-md bg-white"
                                                            />
                                                            <button
                                                                onClick={() => downloadQR(reg.qr_code_data, reg.Event?.name || 'Event')}
                                                                className="absolute -bottom-3 -right-3 bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-full shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                                                title="Download QR Code"
                                                            >
                                                                <Download size={18} />
                                                            </button>
                                                        </div>
                                                        <p className="text-xs text-blue-700 dark:text-blue-400 mt-5 font-medium">Show this QR code at the venue for check-in</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* WhatsApp Group Link */}
                                            {reg.Event?.whatsapp_link && (
                                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                                    <a href={reg.Event.whatsapp_link} target="_blank" rel="noopener noreferrer">
                                                        <Button className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2">
                                                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                                                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.012.477 1.185.564.289.13.332.202c.045.072.045.419-.1.824zm-3.423-14.416c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm.029 18.88c-1.161 0-2.305-.292-3.318-.844l-3.677.964.984-3.595c-.607-1.052-.927-2.246-.926-3.468.001-3.825 3.113-6.937 6.937-6.937 3.825.001 6.938 3.113 6.939 6.937-.001 3.824-3.114 6.936-6.939 6.943z"/>
                                                            </svg>
                                                            Join WhatsApp Group
                                                        </Button>
                                                    </a>
                                                </div>
                                            )}

                                            {/* Certificate Button */}
                                            {reg.isCertificateIssued && (
                                                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                                    <button
                                                        onClick={() => setCertRegistration(reg)}
                                                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/25 transform hover:-translate-y-0.5 transition-all"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                                                        View Certificate
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {feedbackEvent && (
                        <FeedbackForm 
                            event={feedbackEvent.Event} 
                            submittedSessions={feedbackEvent.submittedSessions || []}
                            onClose={() => setFeedbackEvent(null)} 
                            onSubmitted={() => {
                                setFeedbackEvent(null);
                                fetchData();
                            }} 
                        />
                    )}

                    <Card>
                        <CardHeader title="Query Portal" subtitle="Ask a direct question to the team" />
                        <CardContent>
                            <form onSubmit={submitQuery} className="mb-6 flex gap-2">
                                <Input
                                    value={newQuery}
                                    onChange={(e) => setNewQuery(e.target.value)}
                                    placeholder="Ask your question here..."
                                />
                                <Button type="submit">Send</Button>
                            </form>

                            <div className="space-y-3">
                                {queries.map(q => (
                                    <div key={q.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg">
                                        <p className="font-medium text-slate-800 dark:text-white">Q: {q.message}</p>
                                        {q.response ? (
                                            <p className="mt-2 text-sm text-green-700 dark:text-green-400 border-t border-slate-200 dark:border-slate-600 pt-2 font-medium">A: {q.response}</p>
                                        ) : (
                                            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500 italic">Waiting for admin response...</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Feedback Prompt Card */}
                    {(() => {
                        const pendingFeedbackReg = registrations.find(r => r.status === 'approved' && r.Event?.isFeedbackEnabled && !r.hasFeedback);
                        if (pendingFeedbackReg) {
                            return (
                                <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-orange-400/10 dark:bg-orange-500/10 rounded-full blur-2xl"></div>
                                    <CardContent className="p-6 text-center relative z-10">
                                        <div className="w-14 h-14 bg-white dark:bg-slate-800 shadow-sm border border-orange-100 dark:border-orange-700/50 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-500 dark:text-orange-400">
                                            <Star size={26} className="fill-current" />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 flex items-center text-center justify-center gap-2">
                                            {pendingFeedbackReg.Event.feedbackTitle || 'Event Feedback'}
                                            <span className="flex h-2 w-2">
                                              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-orange-400 opacity-75"></span>
                                              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                                            </span>
                                        </h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-5 leading-relaxed">
                                            We'd love to hear your thoughts on <strong className="text-orange-600 dark:text-orange-400">{pendingFeedbackReg.Event.name}</strong>!
                                        </p>
                                        <Button 
                                            onClick={() => setFeedbackEvent(pendingFeedbackReg)} 
                                            className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold shadow-lg shadow-orange-500/30 transform hover:-translate-y-0.5 transition-all"
                                        >
                                            Leave Feedback
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        }
                        return (
                            <Card>
                                <CardContent className="p-6 text-center">
                                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500 dark:text-green-400">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">You're all caught up!</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">No pending feedback requests.</p>
                                </CardContent>
                            </Card>
                        );
                    })()}

                    <SupportCard />

                    <Card>
                        <CardHeader title="Keyword Chatbot" subtitle="Instant static answers" />
                        <CardContent>
                            <div className="h-64 overflow-y-auto bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg p-4 mb-4 space-y-3 flex flex-col">
                                {chatMessages.map((msg, i) => (
                                    <div key={i} className={`p-3 rounded-lg max-w-[85%] text-sm shadow-sm ${msg.sender === 'bot' ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 self-start rounded-tl-none' : 'bg-primary text-white self-end rounded-tr-none'}`}>
                                        {msg.text}
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={handleChat} className="flex gap-2">
                                <Input
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Type 'timing', 'venue'..."
                                />
                                <Button type="submit">Ask</Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Certificate Modal */}
            {certRegistration && (
                <CertificateCanvas
                    registration={certRegistration}
                    onClose={() => setCertRegistration(null)}
                />
            )}
        </div>
    );
}
