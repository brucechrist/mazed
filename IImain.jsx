import React from 'react';
import QuadrantPage from './App.jsx';

export default function IImain({ menuBg, onChangeMenuBg }) {
  return (
    <QuadrantPage
      initialTab="Tools"
      menuBg={menuBg}
      onChangeMenuBg={onChangeMenuBg}
    />
  );
}
