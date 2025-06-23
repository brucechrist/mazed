import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Auth from './src/Auth.jsx';

jest.mock('./src/supabaseClient');
import { signInWithPassword } from './src/supabaseClient';

describe('Auth - username not found', () => {
  test('shows username not found message without retrying', async () => {
    render(<Auth />);
    fireEvent.change(screen.getByPlaceholderText(/username or email/i), { target: { value: 'missinguser' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'secret' } });
    fireEvent.click(screen.getByText(/sign in/i));

    await waitFor(() => {
      expect(screen.getByText(/username not found/i)).toBeInTheDocument();
    });

    expect(signInWithPassword).toHaveBeenCalledTimes(1);
  });
});
