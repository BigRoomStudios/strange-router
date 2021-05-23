'use strict';

module.exports = {
    rootDir: __dirname,
    roots: [
        '<rootDir>/lib'
    ],
    collectCoverageFrom: [
        'lib/**/*.js'
    ],
    testMatch: [
        '<rootDir>/lib/**/__tests__/**/*.js',
        '<rootDir>/lib/**/*.{spec,test}.js'
    ],
    testEnvironment: 'jest-environment-jsdom-fifteen',
    transform: {
        '^.+\\.(js)$': 'babel-jest',
        '^(?!.*\\.(js|json)$)': '<rootDir>/jest.file-transform.js'
    },
    transformIgnorePatterns: [
        '[/\\\\]node_modules[/\\\\].+\\.(js)$'
    ]
};
