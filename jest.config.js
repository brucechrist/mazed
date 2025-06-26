module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  moduleNameMapper: {
    '\\.(css|less|scss)$': 'identity-obj-proxy',
    '\\.(mp4|jpe?g|png|gif)$': '<rootDir>/src/__mocks__/fileMock.js'
  }
};
