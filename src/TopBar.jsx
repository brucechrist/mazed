import { useEffect } from 'react';

export default function TopBar() {
  useEffect(() => {
    const scriptId = 'riotbar-script';
    const fontId = 'riotbar-fonts';
    let script;

    // Ensure Riot fonts are loaded so the header matches the official style
    if (!document.getElementById(fontId)) {
      const link = document.createElement('link');
      link.id = fontId;
      link.rel = 'stylesheet';
      link.href =
        'https://lolstatic-a.akamaihd.net/webfonts/live/css/riot/fonts.css';
      document.head.appendChild(link);
    }

    const enhanceMenu = () => {
      const start = Date.now();
      const attempt = setInterval(() => {
        // Locate the "Actualités" dropdown created by the Riot Bar script
        const newsLink = Array.from(
          document.querySelectorAll('#riotbar-header a')
        ).find((a) => /Actualit\u00e9s/i.test(a.textContent));

        const menu = newsLink?.closest('li')?.querySelector('ul');
        if (menu) {
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
        } else if (Date.now() - start > 10000) {
          // Give up after 10 seconds
          clearInterval(attempt);
        }
      }, 100);
    };

    if (!document.getElementById(scriptId)) {
      script = document.createElement('script');
      script.id = scriptId;
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

  return (
    <>
      <div id="riotbar-header" />
      <div id="riotbar-footer" />
    </>
  );
}
