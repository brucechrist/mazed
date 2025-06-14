import { useEffect } from 'react';

export default function TopBar() {
  useEffect(() => {
    const id = 'riotbar-script';
    let script;

    const enhanceMenu = () => {
      const attempt = setInterval(() => {
        // Locate the "Actualités" dropdown created by the Riot Bar script
        const newsLink = Array.from(
          document.querySelectorAll('#riotbar-header a')
        ).find((a) => /Actualit\u00e9s/i.test(a.textContent));

        const menu = newsLink?.closest('li')?.querySelector('ul');
        if (!menu) {
          return;
        }

        clearInterval(attempt);

        // Remove the "Médias" item if present
        for (const item of menu.querySelectorAll('li')) {
          const a = item.querySelector('a');
          if (a && /M\u00e9dias/i.test(a.textContent)) {
            item.remove();
          }
        }

        // Add "Mazed" pointing to the home page if it doesn't already exist
        const exists = Array.from(menu.querySelectorAll('a')).some((a) =>
          /mazed/i.test(a.textContent)
        );
        if (!exists) {
          const sample = menu.querySelector('li');
          if (sample) {
            const newItem = sample.cloneNode(true);
            const link = newItem.querySelector('a');
            if (link) {
              link.textContent = 'Mazed';
              link.href = '/';
            }
            menu.appendChild(newItem);
          }
        }
      }, 100);
    };

    if (!document.getElementById(id)) {
      script = document.createElement('script');
      script.id = id;
      script.src =
        'https://cdn.rgpub.io/public/live/riotbar/latest/lol.fr-fr.js';
      script.addEventListener('load', enhanceMenu);
      document.body.appendChild(script);
    } else {
      enhanceMenu();
    }

    return () => {
      if (script) script.removeEventListener('load', enhanceMenu);
    };
  }, []);

  return <div id="riotbar-header" />;
}
