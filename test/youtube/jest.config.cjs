module.exports = {
  rootDir: '../..',
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/test/youtube/**/*.spec.tsx'],
  setupFiles: ['<rootDir>/test/youtube/setup.cjs'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'ES2023',
          module: 'commonjs',
          moduleResolution: 'node',
          esModuleInterop: true,
          strict: true,
          skipLibCheck: true,
          isolatedModules: true,
          jsx: 'react-jsx',
          resolvePackageJsonExports: false,
        },
      },
    ],
  },
};
