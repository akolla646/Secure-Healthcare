import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PatientCareView from '../pages/PatientCareView';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext');
vi.mock('../components/CarePlanDisplay', () => ({ default: () => <div>CarePlanDisplay</div> }));
vi.mock('../components/cdss/CDSSPanel', () => ({ default: () => <div>CDSSPanel</div> }));
vi.mock('lucide-react', () => ({
    Printer: () => <span>Printer</span>,
    ArrowLeft: () => <span>ArrowLeft</span>,
    Loader2: () => <span>Loader2</span>,
}));
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useLocation: vi.fn(),
        useNavigate: () => vi.fn(),
    };
});

describe('PatientCareView Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useAuth.mockReturnValue({ user: { name: 'Test User' } });
    });

    it('renders CDSS Panel when no plan in state', () => {
        useLocation.mockReturnValue({ state: null });

        render(
            <BrowserRouter>
                <PatientCareView />
            </BrowserRouter>
        );

        expect(screen.getByText('CDSSPanel')).toBeInTheDocument();
        expect(screen.getByText(/my care plan/i)).toBeInTheDocument();
    });

    it('renders Care Plan Display when plan exists', () => {
        const mockPlan = {
            conditionCode: 'T2DM',
            medications: []
        };
        useLocation.mockReturnValue({ state: { plan: mockPlan } });

        render(
            <BrowserRouter>
                <PatientCareView />
            </BrowserRouter>
        );

        expect(screen.getByText('CarePlanDisplay')).toBeInTheDocument();
    });
});
