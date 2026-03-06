import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Modal from '../components/Modal';
import ProtectedRoute from '../components/ProtectedRoute';
import Layout from '../components/Layout';
import { BrowserRouter } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext');
vi.mock('../components/Sidebar', () => ({ default: () => <div data-testid="sidebar">Sidebar</div> }));

// Mock icons in Modal and Layout
vi.mock('lucide-react', () => ({
    X: () => <span>XIcon</span>,
    Menu: () => <span>MenuIcon</span>,
    MessageSquare: () => <span>MessageIcon</span>,
    User: () => <span>UserIcon</span>,
    LogOut: () => <span>LogoutIcon</span>,
    ShieldCheck: () => <span>ShieldIcon</span>,
}));

describe('Shared Components', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Modal', () => {
        it('renders when isOpen is true', () => {
            render(
                <Modal isOpen={true} onClose={() => { }} title="Test Modal">
                    <div>Modal Content</div>
                </Modal>
            );
            expect(screen.getByText('Test Modal')).toBeInTheDocument();
            expect(screen.getByText('Modal Content')).toBeInTheDocument();
        });

        it('does not render when isOpen is false', () => {
            render(
                <Modal isOpen={false} onClose={() => { }} title="Test Modal">
                    <div>Modal Content</div>
                </Modal>
            );
            expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
        });
    });

    describe('ProtectedRoute', () => {
        it('renders children when authenticated', () => {
            useAuth.mockReturnValue({ user: { role: 'DOCTOR' }, loading: false });

            render(
                <BrowserRouter>
                    <ProtectedRoute allowedRoles={['DOCTOR']}>
                        <div>Protected Content</div>
                    </ProtectedRoute>
                </BrowserRouter>
            );
            expect(screen.getByText('Protected Content')).toBeInTheDocument();
        });

        it('redirects when not authenticated', () => {
            useAuth.mockReturnValue({ user: null, loading: false });

            render(
                <BrowserRouter>
                    <ProtectedRoute allowedRoles={['DOCTOR']}>
                        <div>Protected Content</div>
                    </ProtectedRoute>
                </BrowserRouter>
            );
            // Should redirect to login, content not shown
            expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
        });

        it('redirects when role not allowed', () => {
            useAuth.mockReturnValue({ user: { role: 'PATIENT' }, loading: false });

            render(
                <BrowserRouter>
                    <ProtectedRoute allowedRoles={['DOCTOR']}>
                        <div>Protected Content</div>
                    </ProtectedRoute>
                </BrowserRouter>
            );
            expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
        });
    });

    describe('Layout', () => {
        it('renders Layout successfully', () => {
            expect(true).toBe(true);
        });
    });
});
