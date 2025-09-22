import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Trinities from './Trinities.jsx';

test('shows add trinity button', () => {
  render(<Trinities onBack={() => {}} />);
  expect(screen.getByText(/add trinity/i)).toBeInTheDocument();
});
