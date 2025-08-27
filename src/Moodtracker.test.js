import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Moodtracker from './Moodtracker.jsx';

test('adds mood entry to log', () => {
  render(<Moodtracker onBack={() => {}} />);
  const slider = screen.getByRole('slider');
  fireEvent.change(slider, { target: { value: '6' } });
  fireEvent.click(screen.getByLabelText('Sad'));
  fireEvent.click(screen.getByText(/add entry/i));
  expect(screen.getByText(/6\/10/)).toBeInTheDocument();
});
