import React from 'react';
import styled, { keyframes } from 'styled-components';

export default function QuadrantMenu({ onSelect, selected }) {
  return (
    <StyledWrapper>
      <div className="main">
        <div className="up">
          <button
            className={`card1 ${selected === 0 ? 'selected' : ''}`}
            onClick={() => onSelect('IE')}
          >
            <span className="label">IE</span>
          </button>
          <button
            className={`card2 ${selected === 1 ? 'selected' : ''}`}
            onClick={() => onSelect('EE')}
          >
            <span className="label">EE</span>
          </button>
        </div>
        <div className="down">
          <button
            className={`card3 ${selected === 2 ? 'selected' : ''}`}
            onClick={() => onSelect('II')}
          >
            <span className="label">II</span>
          </button>
          <button
            className={`card4 ${selected === 3 ? 'selected' : ''}`}
            onClick={() => onSelect('EI')}
          >
            <span className="label">EI</span>
          </button>
        </div>
      </div>
    </StyledWrapper>
  );
}

const pulse = keyframes`
  from {
    box-shadow: 0 8px 25px rgba(255, 255, 255, 0.35), 0 0 20px rgba(255, 255, 255, 0.25);
  }
  to {
    box-shadow: 0 15px 35px rgba(255, 255, 255, 0.55), 0 0 45px rgba(255, 255, 255, 0.35);
  }
`;

const floaty = keyframes`
  0% {
    transform: translateY(0px) rotateX(0deg) rotateY(0deg);
  }
  50% {
    transform: translateY(-6px) rotateX(2deg) rotateY(-2deg);
  }
  100% {
    transform: translateY(0px) rotateX(0deg) rotateY(0deg);
  }
`;

const shine = keyframes`
  0% {
    transform: translateX(-150%) skewX(-15deg);
    opacity: 0;
  }
  40% {
    opacity: 0.7;
  }
  100% {
    transform: translateX(200%) skewX(-15deg);
    opacity: 0;
  }
`;

const gradientShift = keyframes`
  0% {
    background-position: 0% 0%;
  }
  50% {
    background-position: 100% 100%;
  }
  100% {
    background-position: 0% 0%;
  }
`;

const StyledWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  perspective: 1000px;

  .main {
    display: flex;
    flex-direction: column;
    gap: 0.75em;
  }

  .up,
  .down {
    display: flex;
    flex-direction: row;
    gap: 0.75em;
  }

  .card1,
  .card2,
  .card3,
  .card4 {
    width: 110px;
    height: 110px;
    outline: none;
    border: none;
    border-radius: 32px;
    position: relative;
    overflow: hidden;
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.35);
    transition: transform 0.3s ease, box-shadow 0.3s ease, filter 0.3s ease;
    cursor: pointer;
    background-size: 250% 250%;
    animation: ${gradientShift} 12s ease infinite, ${floaty} 8s ease-in-out infinite;
    filter: saturate(1.05);
  }

  .card1::before,
  .card2::before,
  .card3::before,
  .card4::before {
    content: '';
    position: absolute;
    inset: -35%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.45), transparent 60%);
    opacity: 0;
    transition: opacity 0.35s ease;
    filter: blur(12px);
  }

  .card1::after,
  .card2::after,
  .card3::after,
  .card4::after {
    content: '';
    position: absolute;
    top: 0;
    left: -150%;
    width: 60%;
    height: 100%;
    background: linear-gradient(120deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.6) 50%, rgba(255, 255, 255, 0) 100%);
    opacity: 0;
  }

  .card1 {
    border-radius: 90px 24px 24px 24px;
    background-image: linear-gradient(135deg, #1e88e5, #8e24aa, #42a5f5);
  }

  .card2 {
    border-radius: 24px 90px 24px 24px;
    background-image: linear-gradient(135deg, #ff7043, #e53935, #ff8a65);
  }

  .card3 {
    border-radius: 24px 24px 24px 90px;
    background-image: linear-gradient(135deg, #00c853, #43a047, #1de9b6);
  }

  .card4 {
    border-radius: 24px 24px 90px 24px;
    background-image: linear-gradient(135deg, #ffca28, #ff8f00, #ffd740);
  }

  .label {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    font-weight: 700;
    font-size: 1.6rem;
    letter-spacing: 0.15em;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4), 0 0 12px rgba(255, 255, 255, 0.75);
    mix-blend-mode: screen;
  }

  .card1:hover,
  .card2:hover,
  .card3:hover,
  .card4:hover {
    transform: translateY(-6px) scale(1.08) rotateX(4deg) rotateY(-2deg);
    box-shadow: 0 20px 45px rgba(0, 0, 0, 0.5), 0 0 45px rgba(255, 255, 255, 0.35);
    filter: saturate(1.25);
  }

  .card1:hover::before,
  .card2:hover::before,
  .card3:hover::before,
  .card4:hover::before {
    opacity: 0.7;
  }

  .card1:hover::after,
  .card2:hover::after,
  .card3:hover::after,
  .card4:hover::after {
    opacity: 1;
    animation: ${shine} 1.2s forwards;
  }

  .card1:focus-visible,
  .card2:focus-visible,
  .card3:focus-visible,
  .card4:focus-visible {
    outline: 2px solid rgba(255, 255, 255, 0.8);
    outline-offset: 4px;
  }

  .selected {
    animation: ${gradientShift} 12s ease infinite, ${floaty} 8s ease-in-out infinite, ${pulse} 1.1s ease-in-out infinite alternate;
    transform: scale(1.05);
  }

  @media (prefers-reduced-motion: reduce) {
    .card1,
    .card2,
    .card3,
    .card4,
    .selected {
      animation: none;
      transform: none;
    }
  }
`;
