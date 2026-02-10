import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DoctorAvailability from '../pages/DoctorAvailability';
import api from '../api/client';

// Mock API
vi.mock('../api/client');

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    Save: () => <span>SaveIcon</span>,
    Clock: () => <span>ClockIcon</span>,
    Calendar: () => <span>CalendarIcon</span>,
    CheckCircle: () => <span>CheckCircleIcon</span>,
    AlertCircle: () => <span>AlertCircleIcon</span>,
}));

describe('DoctorAvailability Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders availability schedule', async () => {
        // Mock minimal schedule
        api.get.mockResolvedValue({ data: [] });

        render(<DoctorAvailability />);

        await waitFor(() => {
            expect(screen.getByText('Monday')).toBeInTheDocument();
            expect(screen.getByText('Sunday')).toBeInTheDocument();
            expect(screen.getByText(/manage availability/i)).toBeInTheDocument();
        });
    });

    it('toggles day availability', async () => {
        api.get.mockResolvedValue({ data: [] });
        render(<DoctorAvailability />);

        await waitFor(() => screen.getByText('Monday'));

        // Find checkbox for Monday (first one in list usually, but let's be safe)
        // The component maps DAYS which starts with Monday.
        const checkboxes = screen.getAllByRole('checkbox');
        const mondayCheckbox = checkboxes[0]; // Monday

        // It starts as unchecked/unavailable if data is empty?
        // Let's check logic: inactive by default if not in fetched data.

        fireEvent.click(mondayCheckbox);

        expect(mondayCheckbox).toBeChecked();
    });

    it('saves availability', async () => {
        api.get.mockResolvedValue({ data: [] });
        api.post.mockResolvedValue({ success: true });

        render(<DoctorAvailability />);

        await waitFor(() => screen.getByText('Monday'));

        fireEvent.click(screen.getByText(/save changes/i));

        await waitFor(() => {
            expect(api.post).toHaveBeenCalled();
            expect(screen.getByText(/availability updated successfully/i)).toBeInTheDocument();
        });
    });
});
