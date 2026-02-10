import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminDashboard from '../pages/dashboards/AdminDashboard';
import NurseDashboard from '../pages/dashboards/NurseDashboard';
import PatientDashboard from '../pages/dashboards/PatientDashboard';
import LabTechDashboard from '../pages/dashboards/LabTechDashboard';

import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

// Mock axios
vi.mock('axios', () => {
    const mockAxios = {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        interceptors: {
            request: { use: vi.fn(), eject: vi.fn() },
            response: { use: vi.fn(), eject: vi.fn() }
        },
        create: vi.fn(() => ({
            get: vi.fn(),
            post: vi.fn(),
            put: vi.fn(),
            delete: vi.fn(),
            interceptors: {
                request: { use: vi.fn(), eject: vi.fn() },
                response: { use: vi.fn(), eject: vi.fn() }
            },
            defaults: { headers: { common: {} } }
        })),
        defaults: { headers: { common: {} } }
    };
    return {
        default: mockAxios
    };
});

// Mock api client
vi.mock('../api/client', () => {
    return {
        default: {
            get: vi.fn(),
            post: vi.fn(),
            put: vi.fn(),
            delete: vi.fn(),
            interceptors: {
                request: { use: vi.fn(), eject: vi.fn() },
                response: { use: vi.fn(), eject: vi.fn() }
            }
        }
    };
});

vi.mock('../context/AuthContext');

// Mock child components
vi.mock('../components/cdss/CDSSPanel', () => ({ default: () => <div>CDSSPanel</div> }));
vi.mock('../components/Modal', () => ({ default: ({ isOpen, children }) => isOpen ? <div>{children}</div> : null }));

describe('Dashboards', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default mock implementation to avoid hanging promises
        axios.get.mockResolvedValue({ data: [] });
        api.get.mockResolvedValue({ data: [] });

        useAuth.mockReturnValue({ user: { name: 'Test User', sub: '123' } });
    });

    describe('AdminDashboard', () => {
        it('renders admin stats and user list', async () => {
            // AdminDashboard uses axios directly
            axios.get.mockImplementation((url) => {
                if (url.includes('/admin/users')) return Promise.resolve({ data: [{ user_id: 1, username: 'User 1', role_name: 'DOCTOR', is_active: true, created_at: new Date().toISOString() }] });
                if (url.includes('/admin/audit-logs/summary')) return Promise.resolve({ data: { total_events: 100 } });
                if (url.includes('/admin/audit-logs')) return Promise.resolve({ data: { logs: [] } });
                return Promise.resolve({ data: {} });
            });

            render(
                <BrowserRouter>
                    <AdminDashboard />
                </BrowserRouter>
            );

            await waitFor(() => {
                // Check for something that appears AFTER loading
                expect(screen.queryByText(/loading dashboard/i)).not.toBeInTheDocument();
            });

            await waitFor(() => {
                expect(screen.getByText(/total users/i)).toBeInTheDocument();
                expect(screen.getByText('User 1')).toBeInTheDocument();
            });
        });
    });

    describe('NurseDashboard', () => {
        it('renders nurse dashboard content', () => {
            // NurseDashboard is static, no async
            render(
                <BrowserRouter>
                    <NurseDashboard />
                </BrowserRouter>
            );

            expect(screen.getByText(/assigned patients/i)).toBeInTheDocument();
            expect(screen.getByText(/critical alerts/i)).toBeInTheDocument();
        });
    });

    describe('PatientDashboard', () => {
        it('renders patient health summary', async () => {
            // Mock specific API calls
            api.get.mockImplementation((url) => {
                return Promise.resolve({ data: [] });
            });

            render(
                <BrowserRouter>
                    <PatientDashboard />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
                expect(screen.getByText(/view my care plan/i)).toBeInTheDocument();
            });
        });
    });

    describe('LabTechDashboard', () => {
        it('renders pending orders and allows upload', async () => {
            api.get.mockImplementation((url) => {
                if (url === '/labs/pending-orders') {
                    return Promise.resolve({
                        data: [
                            { order_id: 'o1', test_name: 'Lipid Profile', status: 'Pending', ordered_at: new Date().toISOString(), patient_id: 'p1' }
                        ]
                    });
                }
                return Promise.resolve({ data: [] });
            });

            api.post.mockResolvedValue({ success: true });

            render(
                <BrowserRouter>
                    <LabTechDashboard />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Lipid Profile')).toBeInTheDocument();
            });

            // Open upload modal
            // Find button by text "Upload Results"
            const uploadBtns = screen.getAllByText('Upload Results');
            uploadBtns[0].click();

            await waitFor(() => {
                expect(screen.getByText('Upload Lab Results')).toBeInTheDocument();
            });
        });
    });
});
