import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DiagnosisForm from '../components/DiagnosisForm';
import LabOrderForm from '../components/LabOrderForm';
import VitalsForm from '../components/VitalsForm';
import { BrowserRouter } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { generateCarePlan } from '../api/mockCarePlan';

// Mock interactors
vi.mock('../api/client', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    }
}));
vi.mock('../context/AuthContext');
vi.mock('../api/mockCarePlan');

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    Save: () => <span data-testid="icon-save">Save</span>,
    CheckCircle: () => <span data-testid="icon-check">Check</span>,
    AlertCircle: () => <span data-testid="icon-alert">Alert</span>,
    Loader2: () => <span data-testid="icon-loader">Loading</span>,
    BrainCircuit: () => <span data-testid="icon-brain">Brain</span>,
    Beaker: () => <span data-testid="icon-beaker">Beaker</span>,
    Search: () => <span data-testid="icon-search">Search</span>,
    PlusCircle: () => <span data-testid="icon-plus">Plus</span>,
    Activity: () => <span data-testid="icon-activity">Activity</span>,
    Thermometer: () => <span data-testid="icon-thermometer">Thermometer</span>,
    Heart: () => <span data-testid="icon-heart">Heart</span>,
    Wind: () => <span data-testid="icon-wind">Wind</span>,
    Droplet: () => <span data-testid="icon-droplet">Droplet</span>,
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

describe('Clinical Forms', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        api.get.mockResolvedValue({ data: [] });
        api.post.mockResolvedValue({ success: true });
        useAuth.mockReturnValue({ user: { name: 'Dr. Test' } });
    });

    describe('DiagnosisForm', () => {
        it('submits valid diagnosis and navigates', async () => {
            const user = userEvent.setup();
            generateCarePlan.mockResolvedValue({ some: 'plan' });

            render(
                <BrowserRouter>
                    <DiagnosisForm patientId="p1" />
                </BrowserRouter>
            );

            await user.type(screen.getByLabelText(/primary diagnosis/i), 'Flu');
            await user.type(screen.getByLabelText(/clinical notes/i), 'Mild symptoms');

            // Interaction
            fireEvent.click(screen.getByRole('button', { name: /analyze & plan/i }));

            // Wait for 1s delay in component + execution time
            await waitFor(() => {
                expect(generateCarePlan).toHaveBeenCalledWith('Flu', 'p1');
                expect(mockNavigate).toHaveBeenCalledWith('/patient/p1/review-plan', expect.objectContaining({ state: { plan: { some: 'plan' } } }));
            }, { timeout: 3000 });
        });
    });

    describe('LabOrderForm', () => {
        it('submits lab order', async () => {
            const user = userEvent.setup();
            api.get.mockResolvedValue({
                data: [{ test_id: 't1', test_name: 'CBC' }]
            });
            api.post.mockResolvedValue({ success: true });
            const onSuccess = vi.fn();

            render(<LabOrderForm patientId="p1" onSuccess={onSuccess} />);

            await waitFor(() => screen.getByText('CBC'));

            const select = screen.getByLabelText(/select lab test/i);
            await user.selectOptions(select, 't1');

            await user.click(screen.getByRole('button', { name: /order test/i }));

            await waitFor(() => {
                expect(api.post).toHaveBeenCalled();
                expect(onSuccess).toHaveBeenCalled();
            });
        });
    });

    describe('VitalsForm', () => {
        it('validates and submits vitals', async () => {
            const user = userEvent.setup();
            api.post.mockResolvedValue({ success: true });
            const onSuccess = vi.fn();

            render(<VitalsForm patientId="p1" onSuccess={onSuccess} />);

            await user.type(screen.getByLabelText(/heart rate/i), '80');
            await user.type(screen.getByLabelText(/bp systolic/i), '120');
            await user.type(screen.getByLabelText(/bp diastolic/i), '80');
            await user.type(screen.getByLabelText(/temperature/i), '36.5');
            await user.type(screen.getByLabelText(/respiratory rate/i), '16');
            await user.type(screen.getByLabelText(/o2 saturation/i), '98');

            fireEvent.click(screen.getByRole('button', { name: /save vitals/i }));
            // OR finding form and submitting:
            // const form = screen.getByRole('button', { name: /save vitals/i }).closest('form');
            // fireEvent.submit(form);
            // Let's rely on click first, but if it times out, it means click didn't propagate.
            // Retrying with submit directly if click fails is standard debugging.
            // I will replace the click line with submit line.

            const submitBtn = screen.getByRole('button', { name: /save vitals/i });
            fireEvent.submit(submitBtn.closest('form'));

            await waitFor(() => {
                expect(api.post).toHaveBeenCalledTimes(1);
            });

            const callArgs = api.post.mock.calls[0];
            expect(callArgs[0]).toBe('/vitals');
            expect(callArgs[1]).toEqual(expect.objectContaining({
                patient_id: 'p1',
                heart_rate: 80,
                bp_systolic: 120,
                oxygen_saturation: 98
            }));
            expect(onSuccess).toHaveBeenCalled();
        });
    });
});
