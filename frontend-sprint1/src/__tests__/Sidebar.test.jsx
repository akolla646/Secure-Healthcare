import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    LayoutDashboard: () => <span>DashboardIcon</span>,
    Stethoscope: () => <span>StethoscopeIcon</span>,
    ClipboardList: () => <span>ClipboardListIcon</span>,
    ShieldAlert: () => <span>ShieldAlertIcon</span>,
    Users: () => <span>UsersIcon</span>,
    Activity: () => <span>ActivityIcon</span>,
    FileText: () => <span>FileTextIcon</span>,
    Settings: () => <span>SettingsIcon</span>,
    LogOut: () => <span>LogOutIcon</span>,
    Menu: () => <span>MenuIcon</span>,
    X: () => <span>XIcon</span>,
}));

// Mock Auth Context Hook
vi.mock('../context/AuthContext', () => ({
    useAuth: vi.fn(),
}));

describe('Sidebar Component', () => {
    const mockLogout = vi.fn();
    const setIsOpen = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderSidebar = (role, isOpen = true) => {
        useAuth.mockReturnValue({
            user: { role: role, name: 'Test User', sub: '123' },
            logout: mockLogout
        });

        return render(
            <BrowserRouter>
                <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
            </BrowserRouter>
        );
    };

    it('renders sidebar with correct user info', () => {
        renderSidebar('Doctor');
        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByText('Doctor')).toBeInTheDocument();
    });

    it('shows Doctor specific links', () => {
        renderSidebar('Doctor');
        expect(screen.getByText('Doctor Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Vitals Dashboard')).toBeInTheDocument();
    });

    it('shows Patient specific links', () => {
        renderSidebar('Patient');
        expect(screen.getByText('My Health Summary')).toBeInTheDocument();
        expect(screen.getByText('My Care Plan')).toBeInTheDocument();
    });

    it('shows Admin specific links', () => {
        renderSidebar('Admin');
        expect(screen.getByText('Admin Overview')).toBeInTheDocument();
        expect(screen.getByText('User Management')).toBeInTheDocument();
    });

    it('calls logout function when sign out is clicked', () => {
        renderSidebar('Patient');
        fireEvent.click(screen.getByText('Sign Out'));
        expect(mockLogout).toHaveBeenCalled();
    });
});
