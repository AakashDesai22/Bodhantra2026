import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, API_URL } from '@/api';
import { Button } from '@/components/ui/Button';
import CountdownTimer from '@/components/ui/CountdownTimer';
import { BellRing, Gamepad2, Users } from 'lucide-react';

const API = API_URL;

export default function LandingPage() {
    const { slug } = useParams();
    const [event, setEvent] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        setLoading(true);
        setError('');
        if (slug) {
            const fetchEvent = async () => {
                try {
                    const res = await api.get(`/api/events/${slug}`);
                    setEvent(res.data);
                } catch (err) {
                    setError(err.response?.data?.message || 'Event not found');
                } finally {
                    setLoading(false);
                }
            };
            fetchEvent();
        } else {
            const fetchEvents = async () => {
                try {
                    const res = await api.get('/api/events');
                    setEvents(Array.isArray(res.data) ? res.data : []);
                } catch (err) {
                    console.error('Failed to fetch events', err);
                    setEvents([]);
                } finally {
                    setLoading(false);
                }
            };
            fetchEvents();
        }
    }, [slug]);

    if (loading) return (
        <div className="min-h-[50vh] flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
    );

    // ── HOMEPAGE (no slug) ──
    if (!slug) {
        const highlightedEvent = (Array.isArray(events) ? events : []).find(e => e.isCountdownEnabled && e.countdownTargetDate && new Date(e.countdownTargetDate) > new Date());

        return (
            <div className="w-full">
                {/* Hero */}
                <section className="bg-primary text-white py-24 px-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-blue-900 opacity-90"></div>
                    <div className="max-w-4xl mx-auto text-center relative z-10 w-full">
                        <div className="inline-block px-4 py-1.5 bg-white/15 rounded-full text-sm font-medium mb-6 backdrop-blur-sm">
                            🚀 Event Hub
                        </div>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
                            <div className='flex justify-center items-center gap-7'>
                                <span>Team</span>
                                <span className="block text-secondary">Mavericks</span>
                            </div>
                        </h1>
                        <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
                            Discover, register and participate in amazing events organized by Team Mavericks.
                        </p>

                        {highlightedEvent && (
                            <div className="mt-8 mb-12">
                                <p className="text-sm font-semibold tracking-widest text-secondary uppercase mb-3">
                                    Next Up: {highlightedEvent.name}
                                </p>
                                <CountdownTimer targetDate={highlightedEvent.countdownTargetDate} />
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <a href="#events">
                                <Button variant="secondary" className="text-lg px-8 py-3">
                                    Browse Events
                                </Button>
                            </a>
                            <Link to="/login">
                                <Button variant="outline" className="text-lg px-8 py-3 border-white text-white hover:bg-white hover:text-primary hover:bg-blue-300">
                                    Login
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className="py-16 px-4 bg-white dark:bg-slate-800">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-white text-center mb-12">Why Team Mavericks?</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { icon: <BellRing className="w-8 h-8 text-blue-600" />, title: 'Stay Updated, Stay Ahead!', desc: 'Our powerful tagline that emphasizes the importance of staying informed and ahead of the competition.' },
                                { icon: <Gamepad2 className="w-8 h-8 text-indigo-600" />, title: 'Learning with Fun', desc: 'Learning with fun is a dynamic and engaging approach that fosters a positive and enjoyable learning experience.' },
                                { icon: <Users className="w-8 h-8 text-purple-600" />, title: 'For the Students, By the Students!', desc: 'This is a student-run organisation. It was founded by the students where all the activities are organised and conducted by the students.' },
                            ].map((f, i) => (
                                <div key={i} className="text-center p-8 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group">
                                    <div className="w-16 h-16 mx-auto mb-6 bg-slate-50 dark:bg-slate-700/50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-sm border border-slate-100 dark:border-slate-600">
                                        {f.icon}
                                    </div>
                                    <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mb-4 tracking-tight leading-snug">{f.title}</h3>
                                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm font-medium">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Events */}
                <section id="events" className="py-16 px-4 bg-slate-50 dark:bg-slate-900">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-white text-center mb-4">Upcoming Events</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-center mb-12 max-w-xl mx-auto">
                            Check out our latest events and secure your spot today.
                        </p>

                        {events.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="text-5xl mb-4">📅</div>
                                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">No Events Yet</h3>
                                <p className="text-slate-500 dark:text-slate-400">Check back soon — exciting events are being planned!</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {events.map(evt => (
                                    <div key={evt.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
                                        {/* Poster Image */}
                                        {evt.poster_url ? (
                                            <div className="overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                                <img
                                                    src={`${evt.poster_url?.startsWith('http') ? evt.poster_url : `${API}${evt.poster_url}`}`}
                                                    alt={evt.name}
                                                    className="w-full max-h-64 object-contain hover:scale-105 transition-transform duration-500"
                                                />
                                            </div>
                                        ) : (
                                            <div className="bg-gradient-to-br from-primary to-blue-800 p-6 text-white">
                                                <h3 className="text-xl font-bold mb-1">{evt.name}</h3>
                                            </div>
                                        )}
                                        <div className="p-6 flex-grow flex flex-col">
                                            {evt.poster_url && (
                                                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{evt.name}</h3>
                                            )}
                                            {/* Event meta info */}
                                            <div className="space-y-1.5 text-sm text-slate-500 dark:text-slate-400 mb-3">
                                                <p className="flex items-center gap-1.5">
                                                    📅 {new Date(evt.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                                </p>
                                                {evt.time && (
                                                    <p className="flex items-center gap-1.5">🕐 {evt.time}</p>
                                                )}
                                                {evt.venue && (
                                                    <p className="flex items-center gap-1.5">📍 {evt.venue}</p>
                                                )}
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 flex-grow line-clamp-2">
                                                {evt.description || 'An exciting event by Team Mavericks. Click to learn more!'}
                                            </p>
                                            <div className="flex items-center justify-between">
                                                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${evt.status === 'active'
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600'
                                                    }`}>
                                                    {(evt.status || 'upcoming').toUpperCase()}
                                                </span>
                                                <Link to={`/event/${evt.slug || evt.id}`}>
                                                    <Button className="text-sm px-4 py-1.5">View & Register</Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        );
    }

    // ── SINGLE EVENT PAGE (with slug) ──
    if (error) return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center text-slate-600 dark:text-slate-400">
            <h2 className="text-2xl font-bold mb-4">{error}</h2>
            <Link to="/">
                <Button>Go Home</Button>
            </Link>
        </div>
    );

    if (!event) return null;

    return (
        <div className="w-full">
            {/* Hero Section with poster */}
            <section className="relative text-white py-20 px-4 overflow-hidden">
                {event?.poster_url ? (
                    <>
                        <div className="absolute inset-0">
                            <img src={`${event.poster_url?.startsWith('http') ? event.poster_url : `${API}${event.poster_url}`}`} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/80 to-blue-900/70 backdrop-blur-[2px]"></div>
                        </div>
                    </>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-blue-900"></div>
                )}
                <div className="max-w-4xl mx-auto text-center relative z-10 w-full">
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
                        {event.name}
                    </h1>
                    <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-2xl mx-auto">
                        {event.description}
                    </p>

                    {event.isCountdownEnabled && event.countdownTargetDate && (
                        <div className="mb-10 w-full flex justify-center">
                            <CountdownTimer targetDate={event.countdownTargetDate} />
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to={`/event/${slug}/register`}>
                            <Button variant="secondary" className="text-lg px-8 py-3 shadow-lg shadow-black/20">Register Now</Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Info Section */}
            <section className="py-16 px-4 bg-slate-50 dark:bg-slate-900">
                <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">Event Details</h2>
                        <div className="space-y-4 text-lg text-slate-600 dark:text-slate-300">
                            <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            {event.time && <p><strong>Time:</strong> {event.time}</p>}
                            {event.venue && <p><strong>Venue:</strong> {event.venue}</p>}
                            <p>
                                <strong>Status:</strong>{' '}
                                <span className={event.status === 'active' ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-slate-400 font-semibold'}>
                                    {(event.status || 'upcoming').toUpperCase()}
                                </span>
                            </p>

                            {event.payment_details && (
                                <div className="mt-6 p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                                    <h3 className="font-semibold text-slate-800 dark:text-white mb-2">College ID Card</h3>
                                    <p className="whitespace-pre-wrap text-base">{event.payment_details}</p>
                                </div>
                            )}

                            {event.qr_code_url && (
                                <div className="mt-4 p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm text-center">
                                    <h3 className="font-semibold text-slate-800 dark:text-white mb-3">Payment QR Code</h3>
                                    <img
                                        src={`${event.qr_code_url?.startsWith('http') ? event.qr_code_url : `${API}${event.qr_code_url}`}`}
                                        alt="Payment QR Code"
                                        className="w-40 h-40 object-contain mx-auto rounded-lg"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        {event.photo_url && (
                            <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-100 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <img
                                    src={`${event.photo_url?.startsWith('http') ? event.photo_url : `${API}${event.photo_url}`}`}
                                    alt={event.name}
                                    className="w-full h-auto max-h-96 object-contain"
                                />
                            </div>
                        )}

                        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">Why Attend?</h3>
                            <ul className="space-y-3 text-slate-600 dark:text-slate-400 list-disc list-inside">
                                <li>Learn with fun!</li>
                                <li>Network connections with peers</li>
                                <li>Enhance technical and non-technical skills</li>
                                <li>Get participation certificates</li>
                                <li>Win exciting prizes</li>
                            </ul>
                        </div>

                        <div className="text-center">
                            <Link to={`/event/${slug}/register`}>
                                <Button className="text-lg px-10 py-3">Register Now →</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
