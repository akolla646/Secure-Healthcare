import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Dashboard from '../pages/Dashboard';
import { useAuth } from '../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import api from '../api/client';

// Mock sub-dashboards
vi.mock('../pages/dashboards/AdminDashboard', () => ({ default: () => <div>Admin Dashboard Content</div> }));
vi.mock('../pages/dashboards/PatientDashboard', () => ({ default: () => <div>Patient Dashboard Content</div> }));
vi.mock('../pages/dashboards/NurseDashboard', () => ({ default: () => <div>Nurse Dashboard Content</div> }));
vi.mock('../pages/dashboards/LabTechDashboard', () => ({ default: () => <div>LabTech Dashboard Content</div> }));

// Mock API
vi.mock('../api/client');

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    User: () => <span>UserIcon</span>,
    Activity: () => <span>ActivityIcon</span>,
    Calendar: () => <span>CalendarIcon</span>,
    ChevronRight: () => <span>ChevronRightIcon</span>,
    AlertTriangle: () => <span>AlertTriangleIcon</span>,
    Beaker: () => <span>BeakerIcon</span>,
    FileCheck: () => <span>FileCheckIcon</span>,
    CheckCircle: () => <span>CheckCircleIcon</span>,
    Loader2: () => <span>LoaderIcon</span>,
    Clock: () => <span>ClockIcon</span>,
    MessageSquare: () => <span>MessageIcon</span>,
    X: () => <span>XIcon</span>,
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock Auth Context Hook
vi.mock('../context/AuthContext', () => ({
    useAuth: vi.fn(),
}));

describe('Dashboard Component', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderDashboard = (role) => {
        useAuth.mockReturnValue({
            user: { role: role, name: 'Test User' }
        });

        return render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );
    };

    it('renders Patient Dashboard for PATIENT role', () => {
        renderDashboard('PATIENT');
        expect(screen.getByText('Patient Dashboard Content')).toBeInTheDocument();
    });

    it('renders Admin Dashboard for ADMIN role', () => {
        renderDashboard('ADMIN');
        expect(screen.getByText('Admin Dashboard Content')).toBeInTheDocument();
    });

    it('renders Nurse Dashboard for NURSE role', () => {
        renderDashboard('NURSE');
        expect(screen.getByText('Nurse Dashboard Content')).toBeInTheDocument();
    });

    it('renders LabTech Dashboard for LAB_TECH role', () => {
        renderDashboard('LAB_TECH');
        expect(screen.getByText('LabTech Dashboard Content')).toBeInTheDocument();
    });

    it('renders Doctor Dashboard content for DOCTOR role', async () => {
        api.get.mockImplementation((url) => {
            if (url === '/appointments/doctor') return Promise.resolve({ data: [] });
            if (url === '/labs/doctor-reports') return Promise.resolve({ data: [] });
            return Promise.reject(new Error('not found'));
        });

        renderDashboard('DOCTOR');

        // Wait for fetching to potentially happen or direct render info
        await waitFor(() => {
            expect(screen.getByText('Doctor Dashboard')).toBeInTheDocument();
            expect(screen.getByText(/manage availability/i)).toBeInTheDocument();
        });
    });

    it('fetches and displays patients for DOCTOR role', async () => {
        const mockPatients = [
            { patient_id: '1', patient_name: 'John Doe', date_of_birth: '1980-01-01', scheduled_start: '2023-10-27T09:00:00', status: 'Scheduled' }
        ];

        api.get.mockImplementation((url) => {
            if (url === '/appointments/doctor') return Promise.resolve({ data: mockPatients });
            if (url === '/labs/doctor-reports') return Promise.resolve({ data: [] });
            return Promise.resolve({ data: [] });
        });

        renderDashboard('DOCTOR');

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
        });
    });
});
