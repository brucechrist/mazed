import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CharacterEvolve from './src/CharacterEvolve.jsx';

test('shows evolve bars', () => {
  render(<CharacterEvolve onBack={() => {}} />);
  expect(screen.getByText(/II Love/i)).toBeInTheDocument();
  expect(screen.getByLabelText('add II')).toBeInTheDocument();
});
