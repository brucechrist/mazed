import { useEffect } from 'react';

export default function TopBar() {
  useEffect(() => {
    const id = 'riotbar-script';
    if (!document.getElementById(id)) {
      const script = document.createElement('script');
      script.id = id;
      script.src =
        'https://cdn.rgpub.io/public/live/riotbar/latest/lol.fr-fr.js';
      document.body.appendChild(script);
    }
  }, []);

  return <div id="riotbar-header" />;
}
