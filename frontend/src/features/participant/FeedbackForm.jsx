import React, { useState, useEffect } from 'react';
import { api } from '@/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Star, CheckCircle } from 'lucide-react';

const emojiMap = {
    0: '💭', // Default / Unselected
    1: '😭', // Terrible
    2: '😞', // Needs Work
    3: '😐', // Okay
    4: '😊', // Great
    5: '🤩🚀', // Mind-Blowing!
};

export default function FeedbackForm({ event, submittedSessions = [], onClose, onSubmitted }) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(false);
    const [selectedSession, setSelectedSession] = useState('');
    const [sparkingStars, setSparkingStars] = useState([]);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const availableSessions = (event.feedbackSessions || ['General'])
        .filter(s => !submittedSessions.includes(s));

    useEffect(() => {
        if (availableSessions.length > 0) {
            setSelectedSession(availableSessions[0]);
        }
    }, [event.feedbackSessions]);

    useEffect(() => {
        if (isSubmitted) {
            const timer = setTimeout(() => {
                onSubmitted();
            }, 4500);
            return () => clearTimeout(timer);
        }
    }, [isSubmitted, onSubmitted]);

    const handleRatingClick = (star) => {
        setRating(star);
        setSparkingStars(prev => [...prev, star]);
        setTimeout(() => {
            setSparkingStars(prev => prev.filter(s => s !== star));
        }, 500);
    };

    // Parse questions gracefully (handles legacy string arrays and new object arrays)
    const [questions, setQuestions] = useState([]);
    
    useEffect(() => {
        let qs = event.feedbackQuestions || [];
        // Map to new schema if they are legacy flat strings
        qs = qs.map((q, idx) => {
            if (typeof q === 'string') return { id: `legacy-${idx}`, question: q, type: 'textarea', required: true };
            return q;
        });
        setQuestions(qs);
        
        // Init answers object
        const initAns = {};
        qs.forEach(q => {
            if (q.type === 'checkbox') initAns[q.id] = [];
            else initAns[q.id] = '';
        });
        setAnswers(initAns);
    }, [event]);

    const handleAnswerChange = (id, value, type) => {
        if (type === 'checkbox') {
            const currentObj = answers[id] || [];
            if (currentObj.includes(value)) {
                setAnswers({ ...answers, [id]: currentObj.filter(v => v !== value) });
            } else {
                setAnswers({ ...answers, [id]: [...currentObj, value] });
            }
        } else {
            setAnswers({ ...answers, [id]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Basic required check
        for (const q of questions) {
            if (q.required) {
                const ans = answers[q.id];
                if (q.type === 'checkbox' && (!ans || ans.length === 0)) {
                    alert(`Please answer the required question: "${q.question}"`);
                    return;
                } else if (q.type !== 'checkbox' && !ans) {
                    alert(`Please answer the required question: "${q.question}"`);
                    return;
                }
            }
        }

        if (rating === 0) {
            alert('Please select a star rating at the bottom!');
            return;
        }

        setLoading(true);
        try {
            await api.post('/api/feedback/submit', {
                eventId: event.id,
                sessionName: selectedSession,
                rating,
                answers
            });
            setIsSubmitted(true);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to submit feedback');
        } finally {
            setLoading(false);
        }
    };

    const currentRating = hoverRating || rating;
    const title = event.feedbackTitle || 'How was your experience?';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ perspective: '1000px' }}>
            <style>{`
                @keyframes spark-burst {
                    0% { transform: scale(1); filter: brightness(1) drop-shadow(0 0 0px rgba(251, 191, 36, 0.7)); }
                    50% { transform: scale(1.4); filter: brightness(1.5) drop-shadow(0 0 15px rgba(251, 191, 36, 0.8)); }
                    100% { transform: scale(1); filter: brightness(1) drop-shadow(0 0 0px rgba(251, 191, 36, 0)); }
                }
                .spark-animate { animation: spark-burst 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
            `}</style>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {isSubmitted ? (
                    <div className="p-12 flex flex-col items-center justify-center min-h-[400px] animate-in fade-in zoom-in duration-500 text-center">
                        <CheckCircle className="text-green-500 mb-6 animate-bounce" size={80} />
                        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-2">Feedback Received!</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-lg">Thank you for helping us ignite the future.</p>
                    </div>
                ) : (
                <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden w-full">
                    
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 text-center shrink-0">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 leading-tight">
                            {title}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            Share your thoughts on <strong>{event.name}</strong>
                        </p>
                    </div>

                    <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">

                        {/* Session Selector */}
                        {availableSessions.length > 1 && (
                            <div className="w-full">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Which session are you reviewing?</label>
                            <select
                                value={selectedSession}
                                onChange={(e) => setSelectedSession(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none text-slate-800 dark:text-slate-200"
                                required
                            >
                                <option value="" disabled>Select a session</option>
                                {availableSessions.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {questions.length > 0 && (
                        <div className="w-full space-y-6 text-left">
                            {questions.map((q) => (
                                <div key={q.id} className="flex flex-col gap-2 p-5 rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                                    <label className="text-[15px] font-bold text-slate-800 dark:text-slate-200 leading-snug">
                                        {q.question} {q.required && <span className="text-red-500">*</span>}
                                    </label>
                                    
                                    <div className="mt-2">
                                        {q.type === 'text' && (
                                            <Input
                                                required={q.required}
                                                value={answers[q.id] || ''}
                                                onChange={(e) => handleAnswerChange(q.id, e.target.value, q.type)}
                                                placeholder="Your answer"
                                                className="bg-white dark:bg-slate-900"
                                            />
                                        )}

                                        {q.type === 'textarea' && (
                                            <textarea
                                                required={q.required}
                                                value={answers[q.id] || ''}
                                                onChange={(e) => handleAnswerChange(q.id, e.target.value, q.type)}
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all dark:text-white resize-none"
                                                rows={3}
                                                placeholder="Type your answer here..."
                                            />
                                        )}

                                        {q.type === 'dropdown' && (
                                            <select
                                                required={q.required}
                                                value={answers[q.id] || ''}
                                                onChange={(e) => handleAnswerChange(q.id, e.target.value, q.type)}
                                                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all dark:text-white"
                                            >
                                                <option value="" disabled>Select an option</option>
                                                {(q.options || []).map((opt, i) => (
                                                    <option key={i} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        )}

                                        {q.type === 'radio' && (
                                            <div className="space-y-2">
                                                {(q.options || []).map((opt, i) => (
                                                    <label key={i} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                                                        <input
                                                            type="radio"
                                                            required={q.required && !answers[q.id]}
                                                            name={q.id}
                                                            value={opt}
                                                            checked={answers[q.id] === opt}
                                                            onChange={(e) => handleAnswerChange(q.id, e.target.value, q.type)}
                                                            className="w-4 h-4 text-primary border-slate-300 dark:border-slate-600 focus:ring-primary"
                                                        />
                                                        <span className="text-slate-700 dark:text-slate-300">{opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}

                                        {q.type === 'checkbox' && (
                                            <div className="space-y-2">
                                                {(q.options || []).map((opt, i) => (
                                                    <label key={i} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            value={opt}
                                                            checked={(answers[q.id] || []).includes(opt)}
                                                            onChange={(e) => handleAnswerChange(q.id, e.target.value, q.type)}
                                                            className="w-4 h-4 text-primary border-slate-300 dark:border-slate-600 rounded focus:ring-primary"
                                                        />
                                                        <span className="text-slate-700 dark:text-slate-300">{opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                        {/* The 5-Star Rating System */}
                        <div className="w-full flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700 gap-2 mt-2">
                            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Overall Rating</span>
                            
                            <div className="h-20 flex items-center justify-center mt-2">
                                <div 
                                    key={currentRating}
                                    className="text-6xl transition-transform duration-300 transform scale-125 animate-in slide-in-from-bottom-2 fade-in"
                                    style={{ animationTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                                >
                                    {emojiMap[currentRating]}
                                </div>
                            </div>

                            <div className="flex gap-2 mt-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => handleRatingClick(star)}
                                        onMouseEnter={() => setHoverRating(star)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        className={`focus:outline-none transition-transform hover:scale-110 active:scale-95 ${sparkingStars.includes(star) ? 'spark-animate' : ''}`}
                                    >
                                        <Star 
                                            className={`w-10 h-10 transition-colors duration-200 ${
                                                star <= currentRating 
                                                ? 'fill-amber-400 text-amber-400' 
                                                : 'fill-slate-200 text-slate-200 dark:fill-slate-700 dark:text-slate-700'
                                            }`} 
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Submit Buttons */}
                        <div className="w-full flex gap-3 mt-6">
                            <Button type="button" variant="outline" className="flex-1 py-6 rounded-xl text-lg font-medium" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading} className="flex-1 py-6 rounded-xl text-lg font-bold shadow-xl shadow-primary/20">
                                {loading ? 'Submitting...' : 'Submit Feedback'}
                            </Button>
                        </div>
                    </div> {/* End scrollable body */}
                </form>
                )}
            </div>
        </div>
    );
}
