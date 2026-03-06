import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuditLogs from '../pages/AuditLogs';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';

// Mock axios
vi.mock('axios');

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    ChevronLeft: () => <span>ChevronLeft</span>,
    ChevronRight: () => <span>ChevronRight</span>,
    Search: () => <span>Search</span>,
    AlertTriangle: () => <span>AlertTriangle</span>,
    ArrowLeft: () => <span>ArrowLeft</span>,
}));

describe('AuditLogs Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderAuditLogs = () => {
        return render(
            <BrowserRouter>
                <AuditLogs />
            </BrowserRouter>
        );
    };

    it('renders loading state initially', () => {
        // Return a promise that doesn't resolve immediately to test loading state
        axios.get.mockReturnValue(new Promise(() => { }));
        renderAuditLogs();
        expect(screen.getByText(/loading logs/i)).toBeInTheDocument();
    });

    it('renders logs after fetching', async () => {
        const mockLogs = {
            data: {
                logs: [
                    {
                        audit_id: 1,
                        action: 'LOGIN_SUCCESS',
                        actor_user_id: 'user1',
                        entity_type: 'USER',
                        ip_address: '127.0.0.1',
                        created_at: '2023-01-01T10:00:00Z'
                    }
                ],
                count: 1
            }
        };
        axios.get.mockResolvedValue(mockLogs);

        renderAuditLogs();

        await waitFor(() => {
            expect(screen.getByText('LOGIN_SUCCESS')).toBeInTheDocument();
            expect(screen.getByText('user1')).toBeInTheDocument();
        });
    });

    it('handles error state', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        axios.get.mockRejectedValue(new Error('Network error'));
        renderAuditLogs();

        await waitFor(() => {
            expect(screen.getByText(/failed to load audit logs/i)).toBeInTheDocument();
        });
        consoleSpy.mockRestore();
    });

    it('handles pagination', async () => {
        const mockLogs = {
            data: {
                logs: [],
                count: 50
            }
        };
        axios.get.mockResolvedValue(mockLogs);

        renderAuditLogs();

        await waitFor(() => {
            expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
        });

        // Find pagination buttons
        // In this implementation they are Chevron icons inside buttons.
        // We can find by role button.
        const buttons = screen.getAllByRole('button');
        // Index 0 is back to dashboard, 1 is prev, 2 is next
        const nextButton = buttons[2];

        fireEvent.click(nextButton);

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledTimes(2);
            // Check offset in second call
            expect(axios.get.mock.calls[1][0]).toContain('offset=20');
        });
    });
});
