import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Stethoscope,
    ClipboardList,
    ShieldAlert,
    Users,
    Activity,
    FileText,
    Settings,
    LogOut,
    Menu,
    X,
    ScanLine,
    ShieldCheck
} from 'lucide-react';
import { useState } from 'react';

const Sidebar = ({ isOpen, setIsOpen }) => {
    const { user, logout } = useAuth();
    const location = useLocation();

    // Navigation Items Definition
    const navItems = {
        Doctor: [
            { name: 'Doctor Dashboard', path: '/dashboard', icon: LayoutDashboard },
            { name: 'Vitals Dashboard', path: '/vitals-dashboard', icon: Activity },
        ],
        Patient: [
            { name: 'My Health Summary', path: '/dashboard', icon: Activity },
            { name: 'My Care Plan', path: `/patient/${user?.sub}/care-plan`, icon: ClipboardList },
            { name: 'Rx Scanner (OCR)', path: '/prescription-ocr', icon: ScanLine },
            { name: '🤖 AI Care Advisor', path: '/ai-bot', icon: Activity },
        ],
        Admin: [
            { name: 'Admin Overview', path: '/dashboard', icon: ShieldAlert },
            { name: 'User Management', path: '/admin/users', icon: Users },
            { name: 'Audit Logs', path: '/admin/logs', icon: FileText },
        ],
        Nurse: [
            { name: 'Ward Dashboard', path: '/dashboard', icon: LayoutDashboard },
            { name: 'Vitals Dashboard', path: '/vitals-dashboard', icon: Activity },
            { name: 'Vitals Monitoring', path: '/nurse/vitals', icon: Activity },
        ],
        Staff: [
            { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
        ]
    };

    // Fallback if role not found — normalize to title case (JWT sends 'DOCTOR', keys are 'Doctor')
    const normalizedRole = user?.role
        ? user.role.trim().charAt(0).toUpperCase() + user.role.trim().slice(1).toLowerCase()
        : null;

    // Exact mapping for known roles to prevent case sensitivity issues
    const roleMap = {
        'doctor': 'Doctor',
        'patient': 'Patient',
        'admin': 'Admin',
        'nurse': 'Nurse',
        'staff': 'Staff'
    };
    const mappedRole = roleMap[user?.role?.toLowerCase()?.trim()] || normalizedRole;
    const currentNav = navItems[mappedRole] || navItems['Staff'];

    const isActive = (path) => location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-600 bg-opacity-75 transition-opacity lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Component */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 shadow-sm text-slate-900 transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0 lg:static lg:inset-0
            `}>
                <div className="flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200">
                    <div className="flex items-center">
                        <ShieldCheck className="h-8 w-8 text-teal-600" />
                        <span className="ml-3 text-xl font-bold tracking-wider text-slate-900">SECURE<span className="text-teal-600">HEALTH</span></span>
                    </div>
                    <button className="lg:hidden text-slate-500 hover:text-slate-900" onClick={() => setIsOpen(false)}>
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="px-6 py-4">
                    <div className="flex items-center p-3 bg-slate-50 border border-slate-200 rounded-lg mb-6">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center text-lg font-bold text-teal-700">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                            <p className="text-xs text-slate-500">{user?.role || 'Guest'}</p>
                        </div>
                    </div>

                    <nav className="space-y-1">
                        {currentNav.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    onClick={() => setIsOpen(false)} // Close on mobile navigation
                                    className={`
                                        group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors
                                        ${isActive(item.path)
                                            ? 'bg-teal-50 text-teal-700'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                                    `}
                                >
                                    <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive(item.path) ? 'text-teal-600' : 'text-slate-400 group-hover:text-teal-600'}`} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Bottom Settings/Logout */}
                <div className="absolute bottom-0 w-full bg-white p-4 border-t border-slate-200">
                    <button
                        onClick={logout}
                        className="flex w-full items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors"
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Sign Out
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
