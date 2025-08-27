import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Anima from './Anima.jsx';

test('shows note buttons', () => {
  render(<Anima onBack={() => {}} />);
  expect(screen.getByText(/new note/i)).toBeInTheDocument();
  expect(screen.getByText(/view notes/i)).toBeInTheDocument();
});
