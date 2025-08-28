import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import QuadrantCombinaisons from './QuadrantCombinaisons.jsx';

test('shows add combinaison button', () => {
  render(<QuadrantCombinaisons onBack={() => {}} />);
  expect(screen.getByText(/add combinaison/i)).toBeInTheDocument();
});
