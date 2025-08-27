import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Timeline from './Timeline.jsx';

test('renders timeline nodes', () => {
  render(<Timeline onBack={() => {}} />);
  // should contain stage and track labels
  expect(screen.getAllByText('S1')[0]).toBeInTheDocument();
  expect(screen.getAllByText('D')[0]).toBeInTheDocument();
  expect(screen.getAllByText('B')[0]).toBeInTheDocument();
});
