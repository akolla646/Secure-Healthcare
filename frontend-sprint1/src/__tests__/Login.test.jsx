import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Login from '../pages/Login';
import { useAuth } from '../context/AuthContext'; // Import hook
import { BrowserRouter } from 'react-router-dom';

// Mock the Lucide icons
vi.mock('lucide-react', () => ({
    Lock: () => <span>LockIcon</span>,
    Mail: () => <span>MailIcon</span>,
    AlertCircle: () => <span>AlertIcon</span>,
    Loader2: () => <span>LoaderIcon</span>,
    Activity: () => <span>ActivityIcon</span>,
    User: () => <span>UserIcon</span>,
    KeyRound: () => <span>KeyIcon</span>,
}));

// Mock useNavigate & useLocation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => ({ state: { from: { pathname: '/dashboard' } } }),
        Link: ({ children, to }) => <a href={to}>{children}</a>
    };
});

// Mock Auth Context Hook
vi.mock('../context/AuthContext', () => ({
    useAuth: vi.fn(),
}));

describe('Login Component', () => {
    const mockLogin = vi.fn();
    const mockVerifyLoginOtp = vi.fn();
    const mockResendOtp = vi.fn();
    const mockRegister = vi.fn(); // Needed if useForm uses it? No, hook-form is separate.

    beforeEach(() => {
        vi.clearAllMocks();
        // Default mock implementation
        useAuth.mockReturnValue({
            login: mockLogin,
            verifyLoginOtp: mockVerifyLoginOtp,
            resendOtp: mockResendOtp,
            user: null
        });
    });

    const renderLogin = () => {
        return render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );
    };

    it('renders login form correctly', () => {
        renderLogin();
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    });

    it('shows validation errors when submitting empty form', async () => {
        renderLogin();
        fireEvent.click(screen.getByRole('button', { name: /continue/i }));

        await waitFor(() => {
            expect(screen.getByText(/username is required/i)).toBeInTheDocument();
            expect(screen.getByText(/password is required/i)).toBeInTheDocument();
        });
    });

    it('calls login function with correct data', async () => {
        mockLogin.mockResolvedValue({ success: true, status: 'OTP_SENT' });
        renderLogin();

        fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: /continue/i }));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123');
        });
    });

    it('shows error message on login failure', async () => {
        mockLogin.mockResolvedValue({ success: false, message: 'Invalid credentials' });
        renderLogin();

        fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'wrong' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } });

        fireEvent.click(screen.getByRole('button', { name: /continue/i }));

        await waitFor(() => {
            expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
        });
    });

    it('transitions to OTP step on successful login', async () => {
        mockLogin.mockResolvedValue({ success: true, status: 'OTP_SENT' });
        renderLogin();

        fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
        fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: /continue/i }));

        await waitFor(() => {
            expect(screen.getByText(/one-time password/i)).toBeInTheDocument();
        });
    });
});
