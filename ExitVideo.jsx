import React, { useEffect } from 'react';

export default function ExitVideo({ onEnded }) {
  useEffect(() => {
    if (onEnded) onEnded();
  }, [onEnded]);
  return null;
}
