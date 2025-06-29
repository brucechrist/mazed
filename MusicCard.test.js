import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MusicCard from './src/MusicCard.jsx';

describe('MusicCard', () => {
  const track = {
    title: 'Test Song',
    preview: 'preview.mp3',
    artist: { name: 'Test Artist' },
    album: { cover_small: 'cover.jpg' },
  };

  test('displays track info', () => {
    render(<MusicCard track={track} />);
    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
    const audio = screen.getByTestId('audio-preview');
    expect(audio).toHaveAttribute('src', 'preview.mp3');
  });
});
