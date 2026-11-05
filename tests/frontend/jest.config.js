// Frontend tests live outside src/, so they run on plain Jest with CRA's Babel preset.
const path = require('path');

process.env.BABEL_ENV = 'test';
process.env.NODE_ENV = 'test';

// ESM-only dependencies that Jest must transpile. Add a family here if Jest
// reports "Cannot use import statement outside a module" for a package.
const ESM_PACKAGES = [
  'react-markdown', 'remark-.*', 'rehype-.*', 'unified', 'bail', 'trough', 'devlop',
  'is-plain-obj', 'vfile.*', 'unist-.*', 'mdast-.*', 'hast-.*', 'micromark.*',
  'decode-named-character-reference', 'character-entities.*', 'character-reference-invalid',
  'is-alphabetical', 'is-alphanumerical', 'is-decimal', 'is-hexadecimal', 'property-information',
  'space-separated-tokens', 'comma-separated-tokens', 'html-url-attributes', 'estree-util-.*',
  'ccount', 'markdown-table', 'longest-streak', 'zwitch', 'trim-lines', 'stringify-entities',
  'html-void-elements', 'web-namespaces', 'escape-string-regexp',
];

module.exports = {
  rootDir: path.resolve(__dirname, '../..'),
  roots: ['<rootDir>/tests/frontend'],
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/frontend/support/setup.js'],
  transform: {
    '^.+\\.[jt]sx?$': [
      'babel-jest',
      { presets: [['babel-preset-react-app', { runtime: 'automatic' }]], babelrc: false, configFile: false },
    ],
  },
  transformIgnorePatterns: [`/node_modules/(?!(${ESM_PACKAGES.join('|')})/)`],
  moduleNameMapper: {
    '\\.css$': '<rootDir>/tests/frontend/support/stubs/style.js',
    '\\.(svg|png|jpe?g|gif)$': '<rootDir>/tests/frontend/support/stubs/file.js',
  },
  cacheDirectory: '/tmp/jest-cache',
};
