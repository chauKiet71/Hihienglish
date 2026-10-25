module.exports = {
  ...require('../youtube/jest.config.cjs'),
  cacheDirectory: '<rootDir>/node_modules/.cache/jest-podcast',
  testMatch: ['<rootDir>/test/podcast/**/*.spec.tsx'],
};
