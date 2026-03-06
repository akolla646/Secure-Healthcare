/**
 * Test Setup File
 * 
 * This file runs before all tests to set up the testing environment.
 * It imports jest-dom for additional DOM matchers.
 */
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// 1. Mock Environment Variables for tests (Replaces the need for a full .env load per suite)
vi.stubEnv('VITE_STRIPE_PUBLIC_KEY', 'pk_test_mock_stripe_key');
vi.stubEnv('VITE_GEMINI_API_KEY', 'mock_gemini_api_key');
vi.stubEnv('VITE_API_URL', 'http://localhost:5000/api');

import React from 'react';

// 2. Mock Stripe library globally to prevent missing Context errors or Network calls
vi.mock('@stripe/react-stripe-js', async () => {
    return {
        Elements: ({ children }) => React.createElement('div', { 'data-testid': 'mock-stripe-elements' }, children),
        useStripe: () => ({
            createPaymentMethod: vi.fn().mockResolvedValue({ paymentMethod: { id: 'pm_mock' } }),
            confirmCardPayment: vi.fn().mockResolvedValue({ paymentIntent: { status: 'succeeded' } }),
        }),
        useElements: () => ({
            getElement: vi.fn(() => ({})),
        }),
        CardElement: () => React.createElement('div', { 'data-testid': 'mock-card-element' }),
        PaymentElement: () => React.createElement('div', { 'data-testid': 'mock-payment-element' })
    };
});

// Mock @stripe/stripe-js load function
vi.mock('@stripe/stripe-js', () => {
    return {
        loadStripe: vi.fn().mockResolvedValue({}),
    };
});

// 3. Mock Global window methods often used by UI/Chart libraries (Recharts)
if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(), // deprecated
            removeListener: vi.fn(), // deprecated
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });

    // Mock ResizeObserver for Recharts
    global.ResizeObserver = class ResizeObserver {
        observe() { }
        unobserve() { }
        disconnect() { }
    };
}
