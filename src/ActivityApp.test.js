import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ActivityApp from './ActivityApp.jsx';

describe('ActivityApp planner toggle', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('allows toggling planner from activity modal', () => {
    render(<ActivityApp onBack={() => {}} />);
    fireEvent.click(screen.getByText('Meditation - Vipassana'));
    const checkbox = screen.getByLabelText('Add to Daily Planner');
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    const stored = JSON.parse(localStorage.getItem('activities'));
    const act = stored.find((a) => a.title === 'Meditation - Vipassana');
    expect(act.planner).toBe(true);
  });
});
