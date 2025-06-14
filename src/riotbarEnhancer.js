const enhanceMenu = () => {
  const attempt = setInterval(() => {
    const newsLink = Array.from(
      document.querySelectorAll('#riotbar-header a')
    ).find((a) => /Actualit\u00e9s/i.test(a.textContent));

    const menu = newsLink?.closest('li')?.querySelector('ul');
    if (!menu) return;

    clearInterval(attempt);

    for (const item of menu.querySelectorAll('li')) {
      const a = item.querySelector('a');
      if (a && /M\u00e9dias/i.test(a.textContent)) {
        item.remove();
      }
    }

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

const script = document.getElementById('riotbar-script');
if (script) {
  script.addEventListener('load', enhanceMenu);
} else {
  enhanceMenu();
}
