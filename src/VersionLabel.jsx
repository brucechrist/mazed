import React from 'react';
import { APP_VERSION } from './version.js';
import './version-label.css';

export default function VersionLabel() {
  return <div className="version-label">v{APP_VERSION}</div>;
}
