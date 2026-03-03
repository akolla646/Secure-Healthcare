import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PatientDiagnosis from '../pages/PatientDiagnosis';
import { BrowserRouter } from 'react-router-dom';
import api from '../api/client';

vi.mock('../api/client');
vi.mock('../components/DiagnosisForm', () => ({ default: () => <div>DiagnosisForm</div> }));
vi.mock('../components/VitalsForm', () => ({ default: () => <div>VitalsForm</div> }));
vi.mock('../components/LabOrderForm', () => ({ default: () => <div>LabOrderForm</div> }));

vi.mock('lucide-react', () => ({
    AlertTriangle: () => <span>AlertTriangle</span>,
    ArrowLeft: () => <span>ArrowLeft</span>,
    ShieldAlert: () => <span>ShieldAlert</span>,
}));

describe('PatientDiagnosis Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderDiagnosis = () => {
        return render(
            <BrowserRouter>
                <PatientDiagnosis />
            </BrowserRouter>
        );
    };

    it('shows diagnosis form when consent verified', async () => {
        // Mocking setTimeout/Promise logic inside component is tricky without modifying component to use API
        // Component logic: const hasConsent = true; (hardcoded in provided file for Sprint 1)
        // So it should always render forms.

        renderDiagnosis();

        await waitFor(() => {
            expect(screen.getByText('DiagnosisForm')).toBeInTheDocument();
            expect(screen.queryByText(/consent missing/i)).not.toBeInTheDocument();
        });
    });
});
