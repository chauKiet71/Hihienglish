module.exports = {
  ...require('../youtube/jest.config.cjs'),
  cacheDirectory: '<rootDir>/node_modules/.cache/jest-video-import',
  testMatch: ['<rootDir>/test/video-import/**/*.spec.tsx'],
};
