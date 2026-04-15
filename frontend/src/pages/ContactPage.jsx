import React from 'react';
import { Mail, Phone, MapPin, Send, Instagram, Linkedin, Twitter, MessageSquare, Facebook } from 'lucide-react';

const ContactInfo = ({ icon: Icon, title, content, subContent }) => (
    <div className="flex items-start gap-4 p-6 rounded-2xl bg-white border border-slate-100 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group">
        <div className="p-3 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
            <Icon size={24} />
        </div>
        <div>
            <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
            <p className="text-slate-600 font-medium">{content}</p>
            {subContent && <p className="text-sm text-slate-400 mt-1">{subContent}</p>}
        </div>
    </div>
);

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* Header */}
            <div className="bg-white border-b border-slate-100 pt-20 pb-16">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight uppercase">Get in Touch</h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
                        We, Team Mavericks symbolize a team having unorthodox views and innovative ideas. "Maverick" means an independent person.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-7xl mx-auto">
                    
                    {/* Contact Details */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="mb-10">
                            <h2 className="text-3xl font-bold text-slate-900 mb-6 tracking-tight">Contact Information</h2>
                            <p className="text-slate-600 leading-relaxed text-lg mb-8 font-medium">
                                Have questions about our upcoming events or want to join the team? Reach out to us through any of these channels.
                            </p>
                        </div>

                        <div className="grid gap-6">
                            <ContactInfo 
                                icon={Phone} 
                                title="Phone Number" 
                                content="+91 9767994567"
                                subContent="Mon-Sat, 10am to 6pm"
                            />
                            <ContactInfo 
                                icon={Mail} 
                                title="Email Address" 
                                content="mavericksbodhantra@gmail.com" 
                                subContent="We usually reply within 24 hours"
                            />
                            <ContactInfo 
                                icon={MapPin} 
                                title="Our Location" 
                                content="KIT's College of Engineering" 
                                subContent="Kolhapur, Maharashtra, India"
                            />
                        </div>

                        {/* Social Links */}
                        <div className="pt-8">
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Follow our Journey</h3>
                            <div className="flex gap-4">
                                {[
                                    { icon: Instagram, color: 'hover:bg-pink-500', url: 'https://www.instagram.com/teammavericks.kit' },
                                    { icon: Linkedin, color: 'hover:bg-blue-600', url: 'https://www.linkedin.com/company/teammavericks/' },
                                ].map((social, i) => (
                                    <a 
                                        key={i} 
                                        href={social.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className={`w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 ${social.color} hover:text-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
                                    >
                                        <social.icon size={20} />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-7">
                        <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm border border-slate-100 relative group">
                            <div className="absolute top-0 right-0 p-8 scale-150 opacity-[0.03] rotate-12 pointer-events-none">
                                <Send size={100} className="text-primary" />
                            </div>
                            
                            <h2 className="text-3xl font-bold text-slate-900 mb-8 tracking-tight">Send us a Message</h2>
                            
                            <form className="space-y-6 relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                                        <input type="text" placeholder="John Doe" className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all duration-200" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
                                        <input type="email" placeholder="john@example.com" className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all duration-200" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Subject</label>
                                    <input type="text" placeholder="What is this about?" className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all duration-200" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 ml-1">Message</label>
                                    <textarea rows={5} placeholder="Tell us more..." className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all duration-200 resize-none"></textarea>
                                </div>
                                <button type="button" className="w-full py-5 bg-primary hover:bg-primary-dark text-white font-bold rounded-2xl shadow-xl shadow-primary/20 transition-all duration-300 transform active:scale-[0.98] flex items-center justify-center gap-3">
                                    Send Message <Send size={20} />
                                </button>
                            </form>
                        </div>
                    </div>

                </div>
            </div>

            {/* Quote Block */}
            <div className="container mx-auto px-4 pb-20">
                <div className="max-w-4xl mx-auto text-center p-12 bg-slate-900 rounded-[50px] relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
                    <div className="relative z-10">
                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">"Maverick"</h3>
                        <p className="text-lg text-slate-400 font-medium italic">
                            Similar to a bird that loves to live a free and prosperous life.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
