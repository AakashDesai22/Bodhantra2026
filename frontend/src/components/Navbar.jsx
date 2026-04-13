import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { API_URL } from '@/api';
import {
    Menu,
    X,
    LogOut,
    LayoutDashboard,
    ShieldCheck,
    CalendarDays,
    Users,
    Mail,
    LogIn,
    Sun,
    Moon,
} from 'lucide-react';

export default function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // ── Scroll listener ──
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // ── Close mobile menu on route change ──
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const isActive = (path) => location.pathname === path;

    // ── Navigation links ──
    const publicLinks = [
        { to: '/#events', label: 'Events', icon: CalendarDays, isHash: true },
        { to: '/contact', label: 'Contact Us', icon: Mail },
        { to: '/team', label: 'Team Page', icon: Users },
    ];

    const authLinks = [];
    if (isAuthenticated) {
        if (user?.role === 'admin' || user?.role === 'member') {
            authLinks.push({ to: '/admin', label: 'Admin Panel', icon: ShieldCheck });
        }
        authLinks.push({ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard });
    }

    // ── Render a single nav link ──
    const NavLink = ({ item, mobile = false }) => {
        const active = isActive(item.to);
        const Icon = item.icon;
        const baseClasses = mobile
            ? `flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${active
                ? 'bg-white/15 text-white'
                : 'text-blue-100 hover:bg-white/10 hover:text-white'
            }`
            : `relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all duration-200 ${active ? 'text-white' : 'text-blue-200 hover:text-white'
            }`;

        // Hash links (like /#events) need special handling
        if (item.isHash) {
            const handleClick = (e) => {
                e.preventDefault();
                if (location.pathname !== '/') {
                    navigate('/');
                    setTimeout(() => {
                        document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' });
                    }, 300);
                } else {
                    document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' });
                }
                setMobileOpen(false);
            };
            return (
                <a href="/#events" onClick={handleClick} className={baseClasses}>
                    {Icon && <Icon size={mobile ? 20 : 16} />}
                    {item.label}
                    {!mobile && active && (
                        <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-secondary rounded-full" />
                    )}
                </a>
            );
        }

        return (
            <Link to={item.to} className={baseClasses}>
                {Icon && <Icon size={mobile ? 20 : 16} />}
                {item.label}
                {!mobile && active && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-secondary rounded-full" />
                )}
            </Link>
        );
    };

    return (
        <>
            <nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                        ? 'bg-primary/95 backdrop-blur-xl shadow-lg shadow-primary/20'
                        : 'bg-primary/80 backdrop-blur-md'
                    }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* ── Brand ── */}
                        <Link
                            to="/"
                            className="flex items-center gap-2 group"
                        >
                            <span className="text-xl font-extrabold tracking-wide text-white group-hover:text-secondary transition-colors duration-300">
                                Team Mavericks
                            </span>
                            <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-widest text-secondary bg-secondary/15 px-2 py-0.5 rounded-full">
                                Club
                            </span>
                        </Link>

                        {/* ── Desktop Links ── */}
                        <div className="hidden md:flex items-center gap-1">
                            {publicLinks.map((item) => (
                                <NavLink key={item.to} item={item} />
                            ))}
                            {authLinks.map((item) => (
                                <NavLink key={item.to} item={item} />
                            ))}

                            {/* Divider */}
                            <div className="w-px h-6 bg-white/20 mx-2" />

                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all duration-200"
                                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                            >
                                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                            </button>

                            {isAuthenticated ? (
                                <div className="flex items-center gap-2 ml-1">
                                    {/* User badge */}
                                    <Link to="/profile" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors rounded-full pl-3 pr-1 py-1 cursor-pointer">
                                        {user?.profile_picture ? (
                                            <img 
                                                src={`${user.profile_picture?.startsWith('http') ? user.profile_picture : `${API_URL}${user.profile_picture}`}`} 
                                                alt={user?.name} 
                                                className="w-7 h-7 rounded-full object-cover border border-white/20"
                                            />
                                        ) : (
                                            <div className="w-7 h-7 rounded-full bg-secondary/80 flex items-center justify-center text-xs font-bold text-slate-900">
                                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>
                                        )}
                                        <div className="text-xs text-right mr-1 hidden lg:block">
                                            <div className="text-white font-semibold leading-tight truncate max-w-[100px]">
                                                {user?.name}
                                            </div>
                                            <div className="text-blue-300 text-[10px] uppercase tracking-wider">
                                                {user?.role}
                                            </div>
                                        </div>
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                                        title="Logout"
                                    >
                                        <LogOut size={16} />
                                        <span className="hidden lg:inline">Logout</span>
                                    </button>
                                </div>
                            ) : (
                                <Link
                                    to="/login"
                                    className="flex items-center gap-1.5 bg-white/10 hover:bg-white hover:text-primary text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200 border border-white/20 hover:border-white ml-1"
                                >
                                    <LogIn size={16} />
                                    Login
                                </Link>
                            )}
                        </div>

                        {/* ── Mobile Hamburger ── */}
                        <div className="flex items-center gap-2 md:hidden">
                            <button
                                onClick={toggleTheme}
                                className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors duration-200"
                                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                            >
                                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                            </button>
                            <button
                                onClick={() => setMobileOpen(!mobileOpen)}
                                className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors duration-200"
                                aria-label="Toggle menu"
                            >
                                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* ── Mobile Menu Overlay ── */}
            <div
                className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${mobileOpen ? 'visible' : 'invisible'
                    }`}
            >
                {/* Backdrop */}
                <div
                    className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${mobileOpen ? 'opacity-100' : 'opacity-0'
                        }`}
                    onClick={() => setMobileOpen(false)}
                />

                {/* Slide-in panel */}
                <div
                    className={`absolute top-0 right-0 h-full w-72 bg-gradient-to-b from-primary via-primary-dark to-blue-950 shadow-2xl transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : 'translate-x-full'
                        }`}
                >
                    {/* Mobile Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                        <span className="text-lg font-bold text-white">Menu</span>
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* User info (if logged in) */}
                    {isAuthenticated && (
                        <div className="px-5 py-4 border-b border-white/10">
                            <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-3">
                                        {user?.profile_picture ? (
                                            <img 
                                                src={`${user.profile_picture?.startsWith('http') ? user.profile_picture : `${API_URL}${user.profile_picture}`}`} 
                                                alt={user?.name} 
                                                className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-secondary/80 flex items-center justify-center text-sm font-bold text-slate-900">
                                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>
                                        )}
                                        <div>
                                            <div className="text-white font-semibold text-sm hover:underline">{user?.name}</div>
                                            <div className="text-blue-300 text-xs uppercase tracking-wider">{user?.role}</div>
                                        </div>
                                    </Link>
                        </div>
                    )}


                    {/* Links */}
                    <div className="px-3 py-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
                        {publicLinks.map((item) => (
                            <NavLink key={item.to} item={item} mobile />
                        ))}
                        {authLinks.map((item) => (
                            <NavLink key={item.to} item={item} mobile />
                        ))}
                    </div>

                    {/* Bottom action */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
                        {isAuthenticated ? (
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-red-500/80 text-white font-semibold py-3 rounded-xl transition-all duration-200"
                            >
                                <LogOut size={18} />
                                Logout
                            </button>
                        ) : (
                            <Link
                                to="/login"
                                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-secondary text-primary font-semibold py-3 rounded-xl transition-all duration-200"
                            >
                                <LogIn size={18} />
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
