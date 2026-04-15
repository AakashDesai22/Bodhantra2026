import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { Phone, Mail, Instagram, Linkedin, Twitter, Facebook } from 'lucide-react';

const Footer = () => (
    <footer className="bg-white border-t border-slate-100 pt-16 pb-8">
        <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center space-y-8">
                {/* Logo & Brand */}
                <div className="flex flex-col items-center">
                    <img src="/logo.png" alt="Team Mavericks" className="w-16 h-16 mb-2" />
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Team Mavericks</h2>
                </div>

                {/* Tagline */}
                <p className="text-slate-500 text-sm leading-relaxed max-w-2xl mx-auto italic">
                    We, Team Mavericks symbolize a team having unorthodox views and innovative ideas. 
                    "Maverick" means an independent person or a team who is similar to a bird that loves to live a free and prosperous life.
                </p>

                {/* Contact Quick Links */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm font-medium">
                    <a href="tel:9767994567" className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors">
                        <Phone size={16} className="text-primary" /> 9767994567
                    </a>
                    <a href="mailto:mavericksbodhantra@gmail.com" className="flex items-center gap-2 text-slate-600 hover:text-primary transition-colors">
                        <Mail size={16} className="text-primary" /> mavericksbodhantra@gmail.com
                    </a>
                </div>

                {/* Social Icons */}
                <div className="flex items-center justify-center gap-4 pt-4">
                    <a href="https://www.instagram.com/teammavericks.kit" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full bg-slate-50 text-slate-400 hover:bg-pink-50 hover:text-pink-600 transition-all duration-300">
                        <Instagram size={20} />
                    </a>
                    <a href="https://www.linkedin.com/company/teammavericks/" target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-full bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all duration-300">
                        <Linkedin size={20} />
                    </a>
                    {/* <a href="#" className="p-2.5 rounded-full bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-400 transition-all duration-300">
                        <Twitter size={20} />
                    </a>
                    <a href="#" className="p-2.5 rounded-full bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-800 transition-all duration-300">
                        <Facebook size={20} />
                    </a> */}
                </div>

                {/* Copyright */}
                <div className="pt-12 border-t border-slate-50">
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">
                        &copy; {new Date().getFullYear()} Team Mavericks. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    </footer>
);

export default function MainLayout() {
    return (
        <div className="min-h-screen flex flex-col font-sans">
            <Navbar />
            {/* pt-16 accounts for the fixed navbar height */}
            <main className="flex-grow bg-slate-50 dark:bg-slate-900 pt-16">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
