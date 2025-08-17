import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import CharacterEvolve from './src/CharacterEvolve.jsx';

test('allows manual percentage entry', async () => {
  const user = userEvent.setup();
  render(<CharacterEvolve onBack={() => {}} />);
  await user.click(screen.getByLabelText('add Form'));
  const input = screen.getByRole('spinbutton');
  await user.clear(input);
  await user.type(input, '42{enter}');
  expect(screen.getByText('42%')).toBeInTheDocument();
});
