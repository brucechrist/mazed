import React from 'react';
import exitVideo from './assets/backgrounds/mazed_exit.mp4';
import './exit-video.css';

export default function ExitVideo({ onEnded }) {
  return (
    <div className="exit-video-container">
      <video
        className="exit-video"
        autoPlay
        playsInline
        onEnded={onEnded}
      >
        <source src={exitVideo} type="video/mp4" />
      </video>
    </div>
  );
}
