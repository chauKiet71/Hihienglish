module.exports = {
  ...require('../youtube/jest.config.cjs'),
  cacheDirectory: '<rootDir>/node_modules/.cache/jest-prefetch',
  testMatch: [
    '<rootDir>/test/prefetch/**/*.spec.ts',
    '<rootDir>/test/prefetch/**/*.spec.tsx',
  ],
  transform: { '^.+\\.tsx?$': '<rootDir>/test/prefetch/transform.cjs' },
  moduleNameMapper: { '\\.css$': '<rootDir>/test/prefetch/style-mock.cjs' },
};
