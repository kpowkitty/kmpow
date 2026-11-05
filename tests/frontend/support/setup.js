import '@testing-library/jest-dom';

afterEach(() => {
  jest.restoreAllMocks();
  delete global.fetch;
});
