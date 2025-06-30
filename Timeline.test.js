import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Timeline from './src/Timeline.jsx';

test('renders timeline nodes', () => {
  render(<Timeline onBack={() => {}} />);
  // should contain stage and track labels
  expect(screen.getByText('S1')).toBeInTheDocument();
  expect(screen.getByText('D')).toBeInTheDocument();
  expect(screen.getByText('B')).toBeInTheDocument();
});
