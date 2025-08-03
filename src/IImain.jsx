import React from 'react';
import QuadrantPage from './App.jsx';

export default function IImain({ menuBg, onChangeMenuBg }) {
  return (
    <QuadrantPage
      initialTab="Training"
      menuBg={menuBg}
      onChangeMenuBg={onChangeMenuBg}
    />
  );
}
