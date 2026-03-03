import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OrderLab from '../pages/OrderLab';
import { BrowserRouter } from 'react-router-dom';
import api from '../api/client';

vi.mock('../api/client');
vi.mock('lucide-react', () => ({
    ArrowLeft: () => <span>ArrowLeft</span>,
    Beaker: () => <span>Beaker</span>,
    Search: () => <span>Search</span>,
    CheckCircle: () => <span>CheckCircle</span>,
    AlertCircle: () => <span>AlertCircle</span>,
    Loader2: () => <span>Loader2</span>,
    Info: () => <span>Info</span>,
}));

describe('OrderLab Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderOrderLab = () => {
        return render(
            <BrowserRouter>
                <OrderLab />
            </BrowserRouter>
        );
    };

    it('renders test catalog', async () => {
        api.get.mockResolvedValue({
            data: [
                { test_id: 't1', test_name: 'CBC', description: 'Blood Count', category: 'Hematology' }
            ]
        });

        renderOrderLab();

        await waitFor(() => {
            expect(screen.getByText('CBC')).toBeInTheDocument();
            expect(screen.getByText('Hematology')).toBeInTheDocument();
        });
    });

    it('searches for tests', async () => {
        api.get.mockResolvedValue({
            data: [
                { test_id: 't1', test_name: 'CBC', description: 'Blood Count', category: 'Hematology' },
                { test_id: 't2', test_name: 'Lipid', description: 'Cholesterol', category: 'Cardiology' }
            ]
        });

        renderOrderLab();
        await waitFor(() => screen.getByText('CBC'));

        const searchInput = screen.getByPlaceholderText(/search tests/i);
        fireEvent.change(searchInput, { target: { value: 'Lipid' } });

        expect(screen.getByText('Lipid')).toBeInTheDocument();
        expect(screen.queryByText('CBC')).not.toBeInTheDocument();
    });

    it('submits an order', async () => {
        api.get.mockResolvedValue({
            data: [
                { test_id: 't1', test_name: 'CBC', description: 'Blood Count', category: 'Hematology' }
            ]
        });
        api.post.mockResolvedValue({ success: true });

        renderOrderLab();
        await waitFor(() => screen.getByText('CBC'));

        // Select test (click on list item)
        fireEvent.click(screen.getByText('CBC'));

        // Confirm order
        const confirmBtn = screen.getByRole('button', { name: /confirm order/i });
        fireEvent.click(confirmBtn);

        await waitFor(() => {
            expect(api.post).toHaveBeenCalled();
            expect(screen.getByText(/successfully ordered cbc/i)).toBeInTheDocument();
        });
    });
});
