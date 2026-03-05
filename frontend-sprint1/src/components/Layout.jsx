import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { LogOut, User, ShieldCheck, MessageSquare, Menu } from 'lucide-react';
import Sidebar from './Sidebar';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar Navigation */}
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col lg:ml-0">
                <nav className="bg-white shadow-sm border-b border-slate-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16">
                            <div className="flex items-center">
                                {/* Mobile menu button */}
                                <button
                                    className="lg:hidden p-2 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 mr-2"
                                    onClick={() => setSidebarOpen(true)}
                                >
                                    <Menu className="h-6 w-6" />
                                </button>
                            </div>
                            <div className="flex items-center space-x-4">
                                {['DOCTOR', 'NURSE', 'PATIENT'].includes(user?.role?.toUpperCase()) && (
                                    <Link
                                        to="/messages"
                                        className={`p-2 rounded-full transition-colors flex items-center justify-center ${location.pathname === '/messages' ? 'bg-primary-50 text-primary-600' : 'text-slate-500 hover:bg-slate-100'
                                            }`}
                                        title="Messages"
                                    >
                                        <MessageSquare className="h-5 w-5" />
                                    </Link>
                                )}
                                <div className="flex items-center text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                                    <User className="h-4 w-4 mr-2" />
                                    <span className="font-medium">{user?.role}</span>
                                    <span className="mx-2">|</span>
                                    <span>{user?.email || 'User'}</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 border-slate-300"
                                >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>
                <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 w-full">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;

