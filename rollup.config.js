'use strict';

const PeerDepsExternal = require('rollup-plugin-peer-deps-external');
const Resolve = require('rollup-plugin-node-resolve');
const Commonjs = require('rollup-plugin-cjs-es');
const Babel = require('rollup-plugin-babel');
const { terser: Terser } = require('rollup-plugin-terser');
const Filesize = require('rollup-plugin-filesize');

module.exports = [
    {
        input: 'lib/index.js',
        output: [
            {
                file: 'dist/strange-router.js',
                format: 'cjs',
                exports: 'named',
                sourcemap: true
            },
            {
                file: 'dist/strange-router.module.js',
                format: 'esm',
                exports: 'named',
                sourcemap: true
            }
        ],
        plugins: [
            PeerDepsExternal(),
            Resolve(),
            Babel({ exclude: ['node_modules/**'] }),
            Commonjs(),
            Filesize()
        ]
    },
    {
        input: 'lib/index.js',
        output: {
            file: 'dist/strange-router.umd.min.js',
            format: 'umd',
            name: 'StrangeRouter',
            esModule: false,
            exports: 'named',
            sourcemap: true,
            globals: {
                'react': 'React',
                'prop-types': 'PropTypes',
                'react-router': 'ReactRouter'
            }
        },
        plugins: [
            PeerDepsExternal(),
            Resolve(),
            Babel({ exclude: ['node_modules/**'] }),
            Commonjs(),
            Terser(),
            Filesize()
        ]
    }
];
