import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('./Calendar.jsx', () => ({ onBack, backLabel }) => (
  <div data-testid="calendar-mock">
    <button onClick={onBack}>{backLabel}</button>
  </div>
));

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
    render(<DayPlanner onComplete={() => {}} backLabel="Return" />);

    expect(await screen.findByText('Ascend')).toBeInTheDocument();
    expect(screen.getByText('Win big')).toBeInTheDocument();
    expect(screen.getByText('Find colors')).toBeInTheDocument();
    expect(screen.getByText('Self reflect')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Return' })
    ).toBeInTheDocument();
  });
});
