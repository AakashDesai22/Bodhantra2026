import React, { useState, useEffect } from 'react';
import { api } from '@/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function FeedbackConfigModal({ event, onClose, onSaved }) {
    const [isFeedbackEnabled, setIsFeedbackEnabled] = useState(false);
    const [feedbackTitle, setFeedbackTitle] = useState('Event Feedback');
    const [feedbackSessions, setFeedbackSessions] = useState(['General']);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sendingBlast, setSendingBlast] = useState(false);

    useEffect(() => {
        if (event) {
            setIsFeedbackEnabled(event.isFeedbackEnabled || false);
            setFeedbackTitle(event.feedbackTitle || 'Event Feedback');
            setFeedbackSessions(event.feedbackSessions && event.feedbackSessions.length > 0 ? event.feedbackSessions : ['General']);
            
            // Handle legacy format (flat strings) by migrating to JSON spec locally 
            let parsedQuestions = Array.isArray(event.feedbackQuestions) ? event.feedbackQuestions : [];
            parsedQuestions = parsedQuestions.map(q => {
                if (typeof q === 'string') return { id: generateId(), question: q, type: 'textarea', required: true };
                // If it was already an object but missing an ID or required field
                return { 
                    id: q.id || generateId(), 
                    question: q.text || q.question || '', 
                    type: q.type || 'textarea', 
                    required: q.required !== false,
                    options: q.options || [] 
                };
            });
            setQuestions(parsedQuestions);
        }
    }, [event]);

    const handleAddQuestion = () => {
        setQuestions([...questions, { id: generateId(), question: '', type: 'text', required: true, options: [] }]);
    };

    const handleUpdateQuestion = (index, field, value) => {
        const updated = [...questions];
        updated[index][field] = value;
        setQuestions(updated);
    };

    const handleAddOption = (questionIndex) => {
        const updated = [...questions];
        if (!updated[questionIndex].options) updated[questionIndex].options = [];
        updated[questionIndex].options.push(`Option ${updated[questionIndex].options.length + 1}`);
        setQuestions(updated);
    };

    const handleUpdateOption = (questionIndex, optionIndex, value) => {
        const updated = [...questions];
        updated[questionIndex].options[optionIndex] = value;
        setQuestions(updated);
    };

    const handleRemoveOption = (questionIndex, optionIndex) => {
        const updated = [...questions];
        updated[questionIndex].options.splice(optionIndex, 1);
        setQuestions(updated);
    };

    const handleRemoveQuestion = (index) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            await api.put(`/api/admin/events/${event.id}/feedback-config`, {
                isFeedbackEnabled,
                feedbackTitle,
                feedbackSessions,
                feedbackQuestions: questions
            });
            alert('Feedback configuration saved');
            onSaved();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to save configuration');
        } finally {
            setLoading(false);
        }
    };

    const handleEmailBlast = async () => {
        if (!confirm('Are you sure you want to email all approved participants about feedback?')) return;
        
        try {
            setSendingBlast(true);
            const response = await api.post(`/api/admin/events/${event.id}/send-feedback-email`);
            alert(response.data.message || 'Email blast triggered successfully');
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to trigger email blast');
        } finally {
            setSendingBlast(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 px-6 py-4 flex items-center justify-between z-10 flex-shrink-0 rounded-t-2xl">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                        Feedback Form Builder
                    </h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors text-lg">
                        ×
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-grow space-y-6">
                    {/* General Settings */}
                    <div className="space-y-4 bg-slate-50 dark:bg-slate-700/30 p-5 border border-slate-200 dark:border-slate-600 rounded-xl">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={isFeedbackEnabled} 
                                onChange={(e) => setIsFeedbackEnabled(e.target.checked)} 
                                className="w-5 h-5 rounded text-primary border-slate-300 dark:border-slate-600" 
                            />
                            <div>
                                <span className="font-bold text-slate-800 dark:text-slate-200 text-base block">Enable Participant Feedback</span>
                                <span className="text-xs font-normal text-slate-500 cursor-pointer">Allow participants to see the feedback CTA on their dashboard.</span>
                            </div>
                        </label>
                        <div className="mt-4">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Feedback Title</label>
                            <Input 
                                value={feedbackTitle} 
                                onChange={(e) => setFeedbackTitle(e.target.value)} 
                                placeholder="e.g. Rate your Bodhantra experience!" 
                            />
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Feedback Sessions (Tags)</label>
                            <p className="text-xs text-slate-500 mb-2">Define which sessions users can review (e.g. "Day 1", "Day 2"). Keep "General" if single session.</p>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {feedbackSessions.map((session, idx) => (
                                    <div key={idx} className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                                        {session}
                                        {feedbackSessions.length > 1 && (
                                            <button 
                                                type="button"
                                                onClick={() => setFeedbackSessions(feedbackSessions.filter((_, i) => i !== idx))}
                                                className="w-4 h-4 ml-1 flex items-center justify-center rounded-full hover:bg-primary/20 transition-colors bg-transparent border-none p-0 cursor-pointer text-xs"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input 
                                    id="newSessionInput"
                                    placeholder="Add new session (e.g. Workshop A)"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            const val = e.target.value.trim();
                                            if (val && !feedbackSessions.includes(val)) {
                                                setFeedbackSessions([...feedbackSessions, val]);
                                                e.target.value = '';
                                            }
                                        }
                                    }}
                                />
                                <Button 
                                    type="button" 
                                    variant="outline"
                                    onClick={() => {
                                        const input = document.getElementById('newSessionInput');
                                        const val = input.value.trim();
                                        if (val && !feedbackSessions.includes(val)) {
                                            setFeedbackSessions([...feedbackSessions, val]);
                                            input.value = '';
                                        }
                                    }}
                                >
                                    Add
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Question Builder */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Dynamic Questions</h3>
                            <Button variant="outline" size="sm" onClick={handleAddQuestion}>+ Add Question</Button>
                        </div>
                        
                        {questions.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800">
                                No specific questions added. (The 1-5 star rating applies automatically at the end).
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {questions.map((q, qIndex) => (
                                    <div key={q.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 shadow-sm relative group">
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveQuestion(qIndex)} 
                                            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 transition-colors"
                                        >
                                            ×
                                        </button>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 pr-10">
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-semibold text-slate-500 mb-1">Question Text</label>
                                                <Input 
                                                    value={q.question} 
                                                    onChange={(e) => handleUpdateQuestion(qIndex, 'question', e.target.value)} 
                                                    placeholder="Enter your question" 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 mb-1">Type</label>
                                                <select 
                                                    value={q.type}
                                                    onChange={(e) => handleUpdateQuestion(qIndex, 'type', e.target.value)}
                                                    className="w-full h-10 px-3 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                                                >
                                                    <option value="text">Short Text</option>
                                                    <option value="textarea">Paragraph</option>
                                                    <option value="dropdown">Dropdown</option>
                                                    <option value="radio">Multiple Choice (Radio)</option>
                                                    <option value="checkbox">Checkboxes</option>
                                                </select>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 mb-3">
                                            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={q.required} 
                                                    onChange={(e) => handleUpdateQuestion(qIndex, 'required', e.target.checked)} 
                                                    className="rounded border-slate-300 dark:border-slate-600 text-primary"
                                                /> 
                                                Required Question
                                            </label>
                                        </div>

                                        {/* Options Builder for choices */}
                                        {['dropdown', 'radio', 'checkbox'].includes(q.type) && (
                                            <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-lg">
                                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2 uppercase">Options</label>
                                                <div className="space-y-2 mb-3">
                                                    {(q.options || []).map((opt, optIndex) => (
                                                        <div key={optIndex} className="flex gap-2">
                                                            <div className="flex-1">
                                                                <Input 
                                                                    value={opt} 
                                                                    onChange={(e) => handleUpdateOption(qIndex, optIndex, e.target.value)} 
                                                                    placeholder={`Option ${optIndex + 1}`} 
                                                                />
                                                            </div>
                                                            <Button variant="outline" type="button" onClick={() => handleRemoveOption(qIndex, optIndex)} className="px-3 border-red-200 text-red-500 hover:bg-red-50">×</Button>
                                                        </div>
                                                    ))}
                                                </div>
                                                <Button size="sm" variant="outline" type="button" onClick={() => handleAddOption(qIndex)} className="text-xs">
                                                    + Add Option
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Email Blast Segment */}
                    <div className="mt-8 border-t border-slate-200 dark:border-slate-700 pt-6">
                        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-5 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                            <h3 className="font-bold text-indigo-900 dark:text-indigo-200 mb-2">Engage Participants</h3>
                            <p className="text-sm text-indigo-700 dark:text-indigo-300 mb-4 flex-1">
                                Trigger an automated email blast to all approved participants requesting them to share their experience.
                            </p>
                            <Button 
                                onClick={handleEmailBlast} 
                                disabled={sendingBlast || !isFeedbackEnabled}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
                            >
                                {sendingBlast ? 'Sending Emails...' : 'Send Feedback Email Blast 🚀'}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 flex-shrink-0 bg-slate-50 dark:bg-slate-800 rounded-b-2xl">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save Configuration'}</Button>
                </div>
            </div>
        </div>
    );
}
