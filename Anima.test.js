import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Anima from './src/Anima.jsx';

test('shows anima placeholder', () => {
  render(<Anima onBack={() => {}} />);
  expect(screen.getByText(/anima coming soon/i)).toBeInTheDocument();
});
