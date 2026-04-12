import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Footer = () => (
    <footer className="bg-slate-900 dark:bg-slate-950 text-slate-400 py-8 text-center mt-auto">
        <p>&copy; {new Date().getFullYear()} Team Mavericks. All rights reserved.</p>
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
