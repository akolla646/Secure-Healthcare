import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CDSSPanel from '../components/cdss/CDSSPanel';
import { BrowserRouter } from 'react-router-dom';

// Mock child components
vi.mock('../components/cdss/PatientContext', () => ({ default: () => <div data-testid="patient-context">PatientContext</div> }));
vi.mock('../components/CarePlanDisplay', () => ({ default: () => <div data-testid="care-plan-display">CarePlanDisplay</div> }));

describe('CDSSPanel Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    const renderCDSSPanel = () => {
        return render(
            <BrowserRouter>
                <CDSSPanel apiBase={import.meta.env.VITE_API_URL || 'http://localhost:5000/api'} />
            </BrowserRouter>
        );
    };

    it('renders upload interface initially', () => {
        renderCDSSPanel();
        expect(screen.getByText(/care plan generation/i)).toBeInTheDocument();
        expect(screen.getByText(/upload diagnosis file/i)).toBeInTheDocument();
    });

    it('handles lab report upload success', async () => {
        const mockResponse = {
            success: true,
            data: {
                patientId: 'p123',
                diagnosisCode: 'D123',
                diagnosisName: 'Diabetes'
            }
        };

        global.fetch.mockImplementationOnce(() => Promise.resolve({
            json: () => Promise.resolve(mockResponse)
        }));

        // Mock patient details fetch that triggers after upload
        global.fetch.mockImplementationOnce(() => Promise.resolve({
            json: () => Promise.resolve({ success: true, data: { name: 'John Doe' } })
        }));

        renderCDSSPanel();

        const file = new File(['dummy content'], 'report.txt', { type: 'text/plain' });
        const input = screen.getByLabelText(/click to upload/i);

        // We need to use fireEvent.change specifically on the input
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(screen.getByText('report.txt')).toBeInTheDocument();
            expect(screen.getByText('Diabetes')).toBeInTheDocument();
        });
    });

    it('handles care plan generation', async () => {
        // First state: File uploaded and verified
        // Since we can't easily set internal state, we simulate the flow
        const mockUploadResponse = {
            success: true,
            data: { patientId: 'p123', diagnosisCode: 'D123', diagnosisName: 'Diabetes' }
        };

        global.fetch.mockImplementationOnce(() => Promise.resolve({
            json: () => Promise.resolve(mockUploadResponse)
        }));

        global.fetch.mockImplementationOnce(() => Promise.resolve({
            json: () => Promise.resolve({ success: true, data: { name: 'John Doe' } })
        }));

        const mockPlanResponse = {
            success: true,
            data: { recommendations: 'Eat healthy' },
            reasoning: 'Because of diabetes'
        };

        global.fetch.mockImplementationOnce(() => Promise.resolve({
            json: () => Promise.resolve(mockPlanResponse)
        }));

        renderCDSSPanel();

        // Upload
        const file = new File(['dummy content'], 'report.txt', { type: 'text/plain' });
        const input = screen.getByLabelText(/click to upload/i);
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /generate diet & care plan/i })).not.toBeDisabled();
        });

        // Generate
        fireEvent.click(screen.getByRole('button', { name: /generate diet & care plan/i }));

        await waitFor(() => {
            expect(screen.getByTestId('care-plan-display')).toBeInTheDocument();
        });
    });

    it('displays error on upload failure', async () => {
        global.fetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));

        renderCDSSPanel();

        const file = new File(['dummy content'], 'report.txt', { type: 'text/plain' });
        const input = screen.getByLabelText(/click to upload/i);
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
            expect(screen.getByText(/failed to upload lab report/i)).toBeInTheDocument();
        });
    });
});
