'use client';

import { useEffect } from 'react';

const EXTRA_LANGUAGES = [
  ['Filipino', 'Filipino'],
  ['Tagalog', 'Tagalog'],
];

export default function FilipinoTagalogOptions() {
  useEffect(() => {
    let scheduled = false;

    const ensureOptions = () => {
      scheduled = false;
      const list = document.getElementById('k710-language-options');
      if (!list) return;

      for (const [value, label] of EXTRA_LANGUAGES) {
        const exists = [...list.options].some((option) => option.value === value);
        if (exists) continue;

        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        option.dataset.k710ExtraLanguage = 'true';
        list.appendChild(option);
      }
    };

    const scheduleEnsure = () => {
      if (scheduled) return;
      scheduled = true;
      queueMicrotask(ensureOptions);
    };

    ensureOptions();
    const observer = new MutationObserver(scheduleEnsure);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
