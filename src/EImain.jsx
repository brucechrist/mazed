import React from 'react';
import QuadrantPage from './App.jsx';

export default function EImain({ menuBg, onChangeMenuBg, onOpenDock }) {
  return (
    <QuadrantPage
      initialTab="World"
      menuBg={menuBg}
      onChangeMenuBg={onChangeMenuBg}
      onOpenDock={onOpenDock}
    />
  );
}
