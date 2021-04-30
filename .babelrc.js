'use strict';

module.exports = {
    presets: [
        ['@babel/env', { modules: false }],
        ['@babel/react']
    ],
    plugins: ['@babel/plugin-transform-runtime'],
    sourceType: 'unambiguous'
};
