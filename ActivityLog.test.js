import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('./src/ToolsBlog.jsx', () => {
  const sanitizeActivityName = jest.fn((value) =>
    typeof value === 'string' ? value.trim() : ''
  );

  return {
    ensureActivityBlogPost: jest.fn(),
    loadRegisteredActivityNames: jest.fn(() => []),
    recordActivitySessionInBlog: jest.fn(),
    sanitizeActivityName,
  };
});

const {
  loadRegisteredActivityNames,
  sanitizeActivityName,
} = require('./src/ToolsBlog.jsx');

import ActivityLog from './src/ActivityLog.jsx';

describe('ActivityLog', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    localStorage.clear();
    jest.clearAllMocks();
    sanitizeActivityName.mockImplementation((value) =>
      typeof value === 'string' ? value.trim() : ''
    );
    loadRegisteredActivityNames.mockImplementation(() => []);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders even when registered activities fail to load', () => {
    loadRegisteredActivityNames.mockImplementation(() => {
      throw new Error('boom');
    });

    render(<ActivityLog onBack={() => {}} />);

    expect(screen.getByText(/activity tracker/i)).toBeInTheDocument();
    expect(screen.getByText(/add a new activity/i)).toBeInTheDocument();
  });

  it('deduplicates activity options ignoring case', async () => {
    loadRegisteredActivityNames.mockImplementation(() => [
      ' Writing ',
      'Singing',
      'writing',
    ]);

    render(<ActivityLog onBack={() => {}} />);

    await waitFor(() => {
      const options = screen.getAllByRole('option');
      const labels = options.map((option) => option.textContent);
      expect(labels).toEqual([
        'Select a tracked activity',
        'Mazed',
        'Meditation - Ramana',
        'Meditation - Vipassana',
        'Reading',
        'Singing',
        'Workout',
        'Writing',
        'Yoga',
      ]);
    });
  });
});
