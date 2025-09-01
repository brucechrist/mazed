import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('./Calendar.jsx', () => {
  return jest.fn(({ onBack, backLabel, backDisabled }) => (
    <div data-testid="calendar-mock">
      <button onClick={onBack} disabled={backDisabled}>
        {backLabel}
      </button>
    </div>
  ));
});
import mockCalendar from './Calendar.jsx';
import DayPlanner from './DayPlanner.jsx';

describe('DayPlanner', () => {
  beforeEach(() => {
    localStorage.setItem(
      'todoBigGoals',
      JSON.stringify({
        transcendent: 'Ascend',
        jackpot: 'Win big',
        rainbow: 'Find colors',
        mirror: 'Self reflect',
      })
    );
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('shows stored goals and calendar back button label', async () => {
    const onComplete = jest.fn();
    render(<DayPlanner onComplete={onComplete} backLabel="Return" />);

    expect(await screen.findByText('Ascend')).toBeInTheDocument();
    expect(screen.getByText('Win big')).toBeInTheDocument();
    expect(screen.getByText('Find colors')).toBeInTheDocument();
    expect(screen.getByText('Self reflect')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Return' })
    ).toBeInTheDocument();

    expect(mockCalendar).toHaveBeenCalled();
    expect(mockCalendar.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        onBack: expect.any(Function),
        backLabel: 'Return',
        defaultView: 'day',
        backDisabled: false,
      })
    );
  });

  test('shows planner activities and disables start until scheduled', () => {
    localStorage.setItem(
      'activities',
      JSON.stringify([
        {
          title: 'Neck Training',
          icon: '🦒',
          base: 10,
          description: '',
          dimension: 'Form',
          aspect: 'II',
          timesPerDay: 2,
          planner: true,
        },
      ])
    );
    const onComplete = jest.fn();
    render(<DayPlanner onComplete={onComplete} backLabel="Start" />);
    expect(screen.getByText('Activities')).toBeInTheDocument();
    expect(screen.getByText('Neck Training')).toBeInTheDocument();
    const startBtn = screen.getByRole('button', { name: 'Start' });
    expect(startBtn).toBeDisabled();
  });

  test('ignores past planned events when counting repetitions', () => {
    localStorage.setItem(
      'activities',
      JSON.stringify([
        {
          title: 'Neck Training',
          icon: '🦒',
          base: 10,
          description: '',
          dimension: 'Form',
          aspect: 'II',
          timesPerDay: 2,
          planner: true,
        },
      ])
    );
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    localStorage.setItem(
      'calendarEvents',
      JSON.stringify([
        {
          title: 'Neck Training',
          start: yesterday.toISOString(),
          end: yesterday.toISOString(),
          kind: 'planned',
        },
      ])
    );
    render(<DayPlanner onComplete={() => {}} backLabel="Start" />);
    expect(screen.getByText('0/2')).toBeInTheDocument();
  });
});
