module.exports = {
  rootDir: '../..',
  testEnvironment: 'node',
  moduleNameMapper: { '\\.css$': '<rootDir>/test/listening/styleMock.cjs' },
  testMatch: [
    '<rootDir>/test/listening/**/*.spec.ts',
    '<rootDir>/test/listening/**/*.spec.tsx',
  ],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          target: 'ES2023',
          module: 'commonjs',
          moduleResolution: 'node',
          resolvePackageJsonExports: false,
          esModuleInterop: true,
          strict: true,
          skipLibCheck: true,
          isolatedModules: true,
          jsx: 'react-jsx',
        },
      },
    ],
  },
};
