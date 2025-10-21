import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

  it('records completed sessions in the calendar', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2024-01-01T10:00:00.000Z'));

    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

    try {
      render(<ActivityLog onBack={() => {}} />);

      const select = await screen.findByRole('combobox');
      fireEvent.change(select, { target: { value: 'Mazed' } });

      const startButton = screen.getByRole('button', { name: /start activity/i });
      fireEvent.click(startButton);

      await act(async () => {
        jest.advanceTimersByTime(30 * 60 * 1000);
      });

      const stopButton = screen.getByRole('button', { name: /stop & save/i });
      fireEvent.click(stopButton);

      const calendarEvents = dispatchSpy.mock.calls
        .map(([event]) => event)
        .filter((event) => event?.type === 'calendar-add-event')
        .map((event) => event.detail);

      const doneEvents = calendarEvents.filter((detail) => detail.kind === 'done');
      expect(doneEvents).toHaveLength(1);
      expect(doneEvents[0]).toMatchObject({
        title: 'Mazed',
        kind: 'done',
      });
      expect(detail.start).toBe('2024-01-01T10:00:00.000Z');
      expect(detail.end).toBe('2024-01-01T10:30:00.000Z');

      const storedEvents = JSON.parse(localStorage.getItem('calendarEvents'));
      expect(storedEvents).toHaveLength(1);
      expect(storedEvents[0]).toMatchObject({
        title: 'Mazed',
        kind: 'done',
        start: '2024-01-01T10:00:00.000Z',
        end: '2024-01-01T10:30:00.000Z',
      });
    } finally {
      dispatchSpy.mockRestore();
      jest.useRealTimers();
    }
  });
});
