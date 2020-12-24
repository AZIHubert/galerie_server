module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  clearMocks: true,
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.json',
      // diagnostics: {
      //   warnOnly: true,
      // },
    },
  },
  transform: {
    '\\.ts$': '<rootDir>/node_modules/ts-jest/preprocessor.js',
    // eslint-disable-next-line no-dupe-keys
    '\\.ts$': 'ts-jest',
  },
  moduleFileExtensions: [
    'js',
    'ts',
    'tsx',
  ],
  testMatch: null,
  testRegex: '(/tests/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$',
  moduleNameMapper: {
    '@src/(.*)': '<rootDir>/src/$1',
  },
  // transformIgnorePatterns: [
  //   '<rootDir>/node_modules/(?!@foo)',
  // ],
  // testMatch: null,
};
