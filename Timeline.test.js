import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Timeline from './src/Timeline.jsx';

test('shows timeline placeholder', () => {
  render(<Timeline onBack={() => {}} />);
  expect(screen.getByText(/timeline coming soon/i)).toBeInTheDocument();
});
