'use strict';

const PeerDepsExternal = require('rollup-plugin-peer-deps-external');
const { nodeResolve: NodeResolve } = require('@rollup/plugin-node-resolve');
const Commonjs = require('rollup-plugin-cjs-es');
const { babel: Babel } = require('@rollup/plugin-babel');
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
        external: [/@babel\/runtime/],
        plugins: [
            PeerDepsExternal(),
            NodeResolve(),
            Babel({ exclude: ['node_modules/**'], babelHelpers: 'runtime' }),
            Commonjs({ nested: true }),
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
            NodeResolve(),
            Babel({ exclude: ['node_modules/**'], babelHelpers: 'runtime' }),
            Commonjs({ nested: true }),
            Terser(),
            Filesize()
        ]
    }
];
