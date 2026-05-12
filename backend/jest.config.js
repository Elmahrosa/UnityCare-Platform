module.exports = {
    testEnvironment: 'node',
    testMatch:       ['**/tests/backend/**/*.test.js'],
    testTimeout:     30000,
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/server.js',  // entry point — covered by integration tests
    ],
};