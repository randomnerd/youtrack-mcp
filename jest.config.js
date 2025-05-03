module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/', '<rootDir>/__tests__/'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.jest.json'
    }],
  },
  testRegex: '(/__tests__/.*\\.(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  coveragePathIgnorePatterns: ['/node_modules/', '/__tests__/'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  testPathIgnorePatterns: [
    '/__tests__/fixtures/',
    '/__tests__/helpers/',
    '/__tests__/mocks/',
    '/__tests__/setup.ts'
  ]
}; 