// 카탈로그 분야 필터·검색, 메일 주소 복사, 스크롤 시 헤더 배경.
(() => {
  const header = document.querySelector('.site-header');
  const onScroll = () => header.classList.toggle('scrolled', scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const grid = document.querySelector('[data-grid]');
  if (grid) {
    const cards = [...grid.children];
    const chips = [...document.querySelectorAll('[data-filter]')];
    const input = document.querySelector('[data-search-input]');
    const count = document.querySelector('[data-result-count]');
    const empty = document.querySelector('[data-empty]');
    let category = new URLSearchParams(location.search).get('category') || 'all';
    if (!chips.some((c) => c.dataset.filter === category)) category = 'all';

    const apply = () => {
      const q = input.value.trim().toLowerCase();
      let shown = 0;
      for (const card of cards) {
        const ok = (category === 'all' || card.dataset.category === category) && (!q || card.dataset.search.includes(q));
        card.hidden = !ok;
        if (ok) shown++;
      }
      chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.filter === category)));
      count.textContent = `${shown}개 프로그램`;
      empty.hidden = shown > 0;
    };

    chips.forEach((chip) => chip.addEventListener('click', () => {
      category = chip.dataset.filter;
      const url = new URL(location.href);
      if (category === 'all') url.searchParams.delete('category');
      else url.searchParams.set('category', category);
      history.replaceState(null, '', url);
      apply();
    }));
    input.addEventListener('input', apply);
    apply();
  }

  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const target = btn.querySelector('span') ?? btn;
      const label = target.textContent;
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        target.textContent = '복사했습니다';
      } catch {
        target.textContent = btn.dataset.copy;
      }
      btn.dataset.copied = '';
      setTimeout(() => { target.textContent = label; delete btn.dataset.copied; }, 2000);
    });
  });
})();
