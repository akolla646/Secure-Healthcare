import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        // Use jsdom for browser-like environment
        environment: 'jsdom',

        // Setup files to run before tests
        setupFiles: ['./src/test/setup.js'],

        // Global test utilities
        globals: true,

        // Include test files
        include: ['src/**/*.{test,spec}.{js,jsx}'],

        // Coverage configuration
        coverage: {
            reporter: ['text', 'html'],
            exclude: ['node_modules/', 'src/test/']
        }
    }
});
