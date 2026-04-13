import React from 'react';
import { Users, History, Rocket, Heart } from 'lucide-react';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <div className="relative py-20 bg-slate-50 border-b border-slate-100 overflow-hidden">
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-6">
                        <Users className="w-3 h-3" /> About Us
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight">
                        We are <span className="text-primary font-black uppercase">Mavericks</span>
                    </h1>
                    <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-600 leading-relaxed font-medium">
                        Introducing Team Mavericks, a dynamic and passionate group of individuals hailing from KIT's College of Engineering in the vibrant city of Kolhapur.
                    </p>
                </div>
            </div>

            {/* Our History */}
            <div className="py-20 container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                                <History className="w-6 h-6" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900">Our History</h2>
                        </div>
                        <p className="text-slate-600 leading-relaxed text-lg mb-6">
                            Established on 13th August 2016, Team Mavericks was founded by the Senior students just to help encourage and enhance the students persona so that they can take a foot forward and emphasize on individual and social growth.
                        </p>
                        <p className="text-slate-600 leading-relaxed text-lg">
                            Then we made it a central committe of college totally dedicated for student development activities organizing events, awareness programs, and creative workshops. Idea behind setting the team's name Maverick is, we think a Maverick is the one who thinks and acts in a different way.
                        </p>
                    </div>
                    <div className="bg-slate-50 rounded-[40px] p-8 border border-slate-100 relative group">
                        <div className="absolute inset-0 bg-primary/5 rounded-[40px] transform rotate-1 group-hover:rotate-2 transition-transform"></div>
                        <div className="relative bg-white p-10 rounded-[30px] shadow-sm border border-slate-100">
                            <h3 className="text-xl font-bold text-slate-900 mb-4 tracking-tight">The "Maverick" Ideal</h3>
                            <p className="text-slate-500 italic text-lg leading-relaxed">
                                "A Maverick is one who plants the seed of unorthodox ideology everywhere, challenging the status quo to foster innovation."
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* What we do */}
            <div className="py-20 bg-slate-900 text-white overflow-hidden relative">
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Learning with Fun</h2>
                        <p className="text-slate-400 text-lg md:text-xl font-normal leading-relaxed">
                            At Team Mavericks, we firmly believe that learning should be an enjoyable and enriching experience, which is why we have made it our Motto 'learning with fun'.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-blue-400"></div> Technical Subjects
                            </h3>
                            <p className="text-slate-400 leading-relaxed">
                                Programming languages, software development, data analysis, artificial intelligence, and more. Through hands-on workshops, interactive discussions, and informative presentations, we empower our members with the latest tools.
                            </p>
                        </div>
                        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-400"></div> Soft Skills
                            </h3>
                            <p className="text-slate-400 leading-relaxed">
                                Communication, leadership, teamwork, creativity, and stress management. These sessions equip our team members with essential soft skills needed to thrive in today's interconnected world.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Vision Section */}
            <div className="py-24 container mx-auto px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-gradient-to-br from-primary/5 to-white border border-primary/10 rounded-[60px] p-12 md:p-20 text-center shadow-xl shadow-primary/5">
                        <div className="inline-block p-4 bg-white rounded-3xl shadow-md mb-8">
                            <Rocket className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-8 tracking-tighter uppercase">Our Vision</h2>
                        <div className="max-w-4xl mx-auto space-y-8 text-lg md:text-xl text-slate-600 leading-relaxed font-medium">
                            <p>
                                Just like The Mavericks means unorthodox and independent, we are a vibrant and dynamic group of passionate students dedicated to fostering a spirit of innovation, creativity, and collaboration within our institute.
                            </p>
                            <p>
                                Whether you are a budding engineer, an aspiring entrepreneur, a talented artist, or simply someone with a hunger for knowledge, we have something for everyone.
                            </p>
                        </div>
                        <div className="mt-12 flex flex-wrap justify-center gap-8 items-center pt-12 border-t border-slate-100">
                             <div className="flex flex-col items-center">
                                <span className="text-4xl font-bold text-primary">KITCOeK</span>
                                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Kolhapur</span>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
