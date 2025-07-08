import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import IdeaBoard from './src/IdeaBoard.jsx';

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

test('shows add idea button', () => {
  render(<IdeaBoard onBack={() => {}} />);
  expect(screen.getByText(/add idea/i)).toBeInTheDocument();
});
