import React from 'react';
import QuadrantPage from './App.jsx';

export default function EImain({ menuBg, onChangeMenuBg }) {
  return (
    <QuadrantPage
      initialTab="World"
      menuBg={menuBg}
      onChangeMenuBg={onChangeMenuBg}
    />
  );
}
