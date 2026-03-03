import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendOtpEmail, initEmailJS } from '../services/emailService';
import emailjs from '@emailjs/browser';

// Mock emailjs
vi.mock('@emailjs/browser', () => ({
    default: {
        init: vi.fn(),
        send: vi.fn(),
    }
}));

describe('emailService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('initEmailJS', () => {
        it('initializes emailjs with public key', () => {
            initEmailJS();
            // The key is hardcoded in the file, we just want to ensure init is called
            expect(emailjs.init).toHaveBeenCalledWith(expect.any(String));
        });
    });

    describe('sendOtpEmail', () => {
        const mockEmail = 'test@example.com';
        const mockOtp = '123456';
        const mockName = 'Test User';

        it('sends email successfully', async () => {
            // Mock successful response
            emailjs.send.mockResolvedValue({ status: 200, text: 'OK' });

            const result = await sendOtpEmail(mockEmail, mockOtp, mockName);

            expect(emailjs.send).toHaveBeenCalledWith(
                expect.any(String), // service_id
                expect.any(String), // template_id
                expect.objectContaining({
                    to_email: mockEmail,
                    to_name: mockName,
                    passcode: mockOtp,
                }),
                expect.any(String) // public_key
            );
            expect(result).toEqual({ success: true });
        });

        it('handles send failure', async () => {
            // Mock failure
            const mockError = { text: 'Network Error' };
            emailjs.send.mockRejectedValue(mockError);

            // Spy on console.error to keep output clean or verify logging
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

            const result = await sendOtpEmail(mockEmail, mockOtp);

            expect(result).toEqual({ success: false, error: mockError });
            expect(consoleSpy).toHaveBeenCalled();
        });
    });
});
