module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  clearMocks: true,
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
    },
  },
  transform: {
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
    '@sequelize/(.*)': '<rootDir>/sequelize/$1',
    '@root/(.*)': '<rootDir>/$1',
  },
};
