import React from 'react';
import QuadrantPage from './App.jsx';

export default function IEmain({ menuBg, onChangeMenuBg, onOpenDock }) {
  return (
    <QuadrantPage
      initialTab="Character"
      menuBg={menuBg}
      onChangeMenuBg={onChangeMenuBg}
      onOpenDock={onOpenDock}
    />
  );
}
