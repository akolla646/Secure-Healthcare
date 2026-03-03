/**
 * Jest Configuration for Backend Testing
 * 
 * This configuration sets up Jest for testing the Express backend.
 */
module.exports = {
    // Use Node.js test environment
    testEnvironment: 'node',

    // Look for test files in __tests__ folder
    testMatch: [
        '**/__tests__/**/*.test.js'
    ],

    // Ignore node_modules and migration files
    testPathIgnorePatterns: [
        '/node_modules/',
        '/migrations/'
    ],

    // Coverage output directory
    coverageDirectory: 'coverage',

    // Show verbose output
    verbose: true,

    // Force exit after tests complete
    forceExit: true,

    // Clear mocks between tests
    clearMocks: true,

    // Timeout for each test (longer for database tests)
    testTimeout: 30000
};
