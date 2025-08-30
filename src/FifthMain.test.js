import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('./DayPlanner.jsx', () => () => <div data-testid="planner">Planner</div>);
jest.mock('./QuadrantMenu.jsx', () => () => <div />);
jest.mock('./NoteModal.jsx', () => () => <div />);
jest.mock('./NotesListModal.jsx', () => () => <div />);

import FifthMain from './FifthMain.jsx';

describe('FifthMain DayPlanner integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('shows planner when stored date is old', () => {
    localStorage.setItem('plannerDate', '2000-01-01');
    render(<FifthMain onSelectQuadrant={() => {}} />);
    expect(screen.getByTestId('planner')).toBeInTheDocument();
  });

  test('opens planner in response to message', () => {
    const today = new Date().toLocaleDateString('en-CA');
    localStorage.setItem('plannerDate', today);
    render(<FifthMain onSelectQuadrant={() => {}} />);
    expect(screen.queryByTestId('planner')).not.toBeInTheDocument();
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', { data: { type: 'OPEN_DAY_PLANNER' } })
      );
    });
    expect(screen.getByTestId('planner')).toBeInTheDocument();
  });
});
