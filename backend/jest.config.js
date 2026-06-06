module.exports = {
    testEnvironment: 'node',
    testMatch:       ['**/tests/**/*.test.*'],
    testTimeout:     30000,
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/server.js',
    ],
};