import React from 'react';
import QuadrantPage from './App.jsx';

export default function EEmain({ menuBg, onChangeMenuBg, onOpenDock }) {
  return (
    <QuadrantPage
      initialTab="Friends"
      menuBg={menuBg}
      onChangeMenuBg={onChangeMenuBg}
      onOpenDock={onOpenDock}
    />
  );
}
