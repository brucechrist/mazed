import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import CharacterEvolve from './src/CharacterEvolve.jsx';

test('allows manual percentage entry', async () => {
  render(<CharacterEvolve onBack={() => {}} />);
  window.prompt = jest.fn().mockReturnValue('42');
  await userEvent.click(screen.getByLabelText('add Form'));
  expect(window.prompt).toHaveBeenCalled();
  expect(screen.getByText('42%')).toBeInTheDocument();
});
