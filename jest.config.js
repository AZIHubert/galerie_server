module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  clearMocks: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '<rootDir>/node_modules/(?!@foo)',
  ],
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.json',
      diagnostics: {
        warnOnly: true,
      },
    },
  },
  moduleFileExtensions: [
    'js',
    'ts',
    'tsx',
  ],
  moduleNameMapper: {
    '@src/(.*)': '<rootDir>/src/$1',
  },
  testRegex: '(/tests/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
  transformIgnorePatterns: [
    '<rootDir>/node_modules/(?!@foo)',
  ],
  testMatch: null,
};
