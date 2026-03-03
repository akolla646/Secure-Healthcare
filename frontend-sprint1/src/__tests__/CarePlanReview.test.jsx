import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CarePlanReview from '../pages/CarePlanReview';
import { BrowserRouter, useLocation } from 'react-router-dom';

vi.mock('lucide-react', () => ({
    ShieldCheck: () => <span>ShieldCheck</span>,
    Activity: () => <span>Activity</span>,
    Pill: () => <span>Pill</span>,
    Utensils: () => <span>Utensils</span>,
    FileText: () => <span>FileText</span>,
    CheckCircle: () => <span>CheckCircle</span>,
    XCircle: () => <span>XCircle</span>,
    BrainCircuit: () => <span>BrainCircuit</span>,
}));

// Mock react-router hooks
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useLocation: vi.fn(),
        useParams: () => ({ id: '123' }),
        useNavigate: () => vi.fn(),
    };
});

describe('CarePlanReview Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders plan details', () => {
        const mockPlan = {
            conditionCode: 'T2DM',
            diagnosisNormalized: 'Type 2 Diabetes',
            alerts: [{ message: 'Check interactions' }],
            medications: [{ name: 'Metformin', dosage: '500mg', reason: 'Sugar control' }],
            diet: [{ text: 'Low carb', reason: 'Sugar control' }],
            lifestyle: [{ text: 'Exercise', reason: 'Health' }],
            rulesApplied: ['Rule1']
        };
        useLocation.mockReturnValue({ state: { plan: mockPlan } });

        render(
            <BrowserRouter>
                <CarePlanReview />
            </BrowserRouter>
        );

        expect(screen.getByText('T2DM')).toBeInTheDocument();
        expect(screen.getByText(/metformin/i)).toBeInTheDocument();
        expect(screen.getByText(/low carb/i)).toBeInTheDocument();
    });

    it('simulates approval and encryption process', async () => {
        const mockPlan = {
            conditionCode: 'T2DM',
            diagnosisNormalized: 'Type 2 Diabetes',
            alerts: [],
            medications: [],
            diet: [],
            lifestyle: [],
            rulesApplied: []
        };
        useLocation.mockReturnValue({ state: { plan: mockPlan } });

        render(
            <BrowserRouter>
                <CarePlanReview />
            </BrowserRouter>
        );

        fireEvent.click(screen.getByRole('button', { name: /approve & encrypt/i }));

        await waitFor(() => {
            expect(screen.getByText(/encrypting & storing record/i)).toBeInTheDocument();
        });
    });
});
