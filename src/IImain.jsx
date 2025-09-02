import React from 'react';
import QuadrantPage from './App.jsx';

export default function IImain({ menuBg, onChangeMenuBg, onOpenDock }) {
  return (
    <QuadrantPage
      initialTab="Tools"
      menuBg={menuBg}
      onChangeMenuBg={onChangeMenuBg}
      onOpenDock={onOpenDock}
    />
  );
}
