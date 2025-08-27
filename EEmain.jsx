import React from 'react';
import QuadrantPage from './App.jsx';

export default function EEmain({ menuBg, onChangeMenuBg }) {
  return (
    <QuadrantPage
      initialTab="Friends"
      menuBg={menuBg}
      onChangeMenuBg={onChangeMenuBg}
    />
  );
}
