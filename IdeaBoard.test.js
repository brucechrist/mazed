import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import IdeaBoard from './src/IdeaBoard.jsx';

jest.mock('react-konva', () => {
  const React = require('react');
  return {
    Stage: ({ children }) => <div>{children}</div>,
    Layer: ({ children }) => <div>{children}</div>,
    Group: ({ children }) => <div>{children}</div>,
    Rect: () => <div />,
    Text: () => <div />,
    Transformer: ({ children }) => <div>{children}</div>,
  };
});

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

test('shows add idea button', () => {
  render(<IdeaBoard onBack={() => {}} />);
  expect(screen.getByText(/add idea/i)).toBeInTheDocument();
});

test('shows board theme toggle', () => {
  render(<IdeaBoard onBack={() => {}} />);
  expect(
    screen.getByLabelText(/toggle board theme/i)
  ).toBeInTheDocument();
});
