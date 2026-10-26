module.exports = {
  ...require('../youtube/jest.config.cjs'),
  cacheDirectory: '<rootDir>/node_modules/.cache/jest-podcast-premium',
  testMatch: ['<rootDir>/test/podcast-premium/**/*.spec.tsx'],
};
