/**
 * Sample React Component Test
 * 
 * This is a sample unit test that demonstrates how to test React components
 * using React Testing Library and Vitest.
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

describe('Sample Test Suite', () => {

    /**
     * Test: Basic assertion test
     * This is a simple test to verify the testing setup works
     */
    it('should pass a basic assertion', () => {
        expect(1 + 1).toBe(2);
    });

    /**
     * Test: String matching
     */
    it('should match strings correctly', () => {
        const projectName = 'Secure Healthcare';
        expect(projectName).toContain('Healthcare');
    });

    /**
     * Test: Array contains value
     */
    it('should verify array contains value', () => {
        const roles = ['admin', 'doctor', 'patient', 'lab_technician'];
        expect(roles).toContain('doctor');
        expect(roles).toHaveLength(4);
    });

    /**
     * Test: Object properties
     */
    it('should verify object properties', () => {
        const user = {
            id: 1,
            name: 'Dr. Smith',
            role: 'doctor',
            isActive: true
        };

        expect(user).toHaveProperty('role', 'doctor');
        expect(user.isActive).toBe(true);
    });

});
