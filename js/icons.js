// js/icons.js — все иконки нарисованы вручную: контуры 24×24, штрих 1.6.
// Никаких эмодзи и сторонних наборов.

const PATHS = {
  // категории
  food: '<path d="M4 9h16l-1.5 9.1a2 2 0 0 1-2 1.7H7.5a2 2 0 0 1-2-1.7L4 9Z"/><path d="M8.6 9 10 4.6M15.4 9 14 4.6"/><path d="M9.6 12.6v3.8M14.4 12.6v3.8"/>',
  cafe: '<path d="M4.8 9.2h10.4v5.4a4.6 4.6 0 0 1-4.6 4.6H9.4a4.6 4.6 0 0 1-4.6-4.6V9.2Z"/><path d="M15.2 10.3h1.5a2.4 2.4 0 0 1 0 4.8h-1.5"/><path d="M4.2 21h13.6"/><path d="M8.6 6.4c.6-.7.6-1.5 0-2.3M11.8 6.4c.6-.7.6-1.5 0-2.3"/>',
  transport: '<rect x="4.2" y="4" width="15.6" height="12.4" rx="2.4"/><path d="M4.2 11.4h15.6"/><path d="M7.6 19.6v-3.2M16.4 19.6v-3.2"/><path d="M8.2 15.6h.01M15.8 15.6h.01"/>',
  car: '<path d="M5 15.4h14v2a1.2 1.2 0 0 1-1.2 1.2h-1.1a1.2 1.2 0 0 1-1.2-1.2v-.5H8.5v.5a1.2 1.2 0 0 1-1.2 1.2H6.2A1.2 1.2 0 0 1 5 17.4v-2Z"/><path d="M6.2 15.4 8 9.3a2.3 2.3 0 0 1 2.2-1.6h3.6A2.3 2.3 0 0 1 16 9.3l1.8 6.1"/><path d="M8 12.6h8"/>',
  home: '<path d="M4.6 10.4 12 4l7.4 6.4V19a1.2 1.2 0 0 1-1.2 1.2H5.8A1.2 1.2 0 0 1 4.6 19v-8.6Z"/><path d="M9.6 20.2v-5.4h4.8v5.4"/>',
  health: '<path d="M9.3 4.6a3.9 3.9 0 0 1 5.5 5.5l-4.7 4.7a3.9 3.9 0 0 1-5.5-5.5l4.7-4.7Z"/><path d="M7.2 12.4l4.2 4.2"/><path d="M17.6 15.2v5M15.1 17.7h5"/>',
  clothes: '<path d="M8.6 4.2 5 6.3l1.6 3.1 1.9-.9V20h7V8.5l1.9.9L19 6.3l-3.6-2.1a3.5 3.5 0 0 1-6.8 0Z"/>',
  fun: '<path d="M4 7.6h16v3a2 2 0 0 0 0 2.8v3H4v-3a2 2 0 0 0 0-2.8v-3Z"/><path d="M13.4 8.3v7.4" stroke-dasharray="1.4 2.6"/>',
  comm: '<rect x="7.2" y="3.2" width="9.6" height="17.6" rx="2.2"/><path d="M10.8 18.1h2.4"/>',
  gifts: '<rect x="4.2" y="10" width="15.6" height="9.8" rx="1.4"/><path d="M4.2 10h15.6M12 10v9.8"/><path d="M12 10C10.5 6.8 6.4 6.5 6.4 8.7c0 1.5 3 1.3 5.6 1.3Zm0 0c1.5-3.2 5.6-3.5 5.6-1.3 0 1.5-3 1.3-5.6 1.3Z"/>',
  beauty: '<circle cx="6.9" cy="17.4" r="2.4"/><circle cx="17.1" cy="17.4" r="2.4"/><path d="M8.6 15.6 17.4 4.4M15.4 15.6 6.6 4.4"/>',
  debt: '<path d="M5 8.8h12.4l-2.6-2.6"/><path d="M19 15.2H6.6l2.6 2.6"/>',
  other: '<path d="M12 3.4 20.4 7.7v8.6L12 20.6 3.6 16.3V7.7L12 3.4Z"/><path d="M3.6 7.7 12 12l8.4-4.3M12 12v8.6"/>',
  income: '<circle cx="12" cy="12" r="8.4"/><path d="M12 7.8v8.4M8.8 13 12 16.2l3.2-3.2"/>',

  // интерфейс
  mic: '<rect x="9" y="2.6" width="6" height="11" rx="3"/><path d="M5.6 11a6.4 6.4 0 0 0 12.8 0"/><path d="M12 17.4v3.2"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  trash: '<path d="M4.8 6.6h14.4M9.6 6.6V4.8h4.8v1.8"/><path d="M6.8 6.6l.9 12.2a1.6 1.6 0 0 0 1.6 1.5h5.4a1.6 1.6 0 0 0 1.6-1.5l.9-12.2"/><path d="M10.4 10.6v6M13.6 10.6v6"/>',
  back: '<path d="M14.6 5.4 8 12l6.6 6.6"/>',
  forward: '<path d="M9.4 5.4 16 12l-6.6 6.6"/>',
  download: '<path d="M12 4v11M8.2 11.4 12 15.2l3.8-3.8M5 19.6h14"/>',
  install: '<rect x="7" y="2.8" width="10" height="18.4" rx="2.4"/><path d="M12 16.4v-8M9.4 11 12 8.4l2.6 2.6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.6v2M12 19.4v2M2.6 12h2M19.4 12h2M5.4 5.4l1.4 1.4M17.2 17.2l1.4 1.4M18.6 5.4l-1.4 1.4M6.8 17.2l-1.4 1.4"/>',
  moon: '<path d="M19 14.4A7.6 7.6 0 0 1 9.6 5a7.8 7.8 0 1 0 9.4 9.4Z"/>',
  calendar: '<rect x="3.8" y="5.4" width="16.4" height="14.8" rx="2"/><path d="M3.8 10.2h16.4M8.2 3.4v3.2M15.8 3.4v3.2"/>',
  check: '<path d="M5 12.5l4.6 4.6L19 7.6"/>',
};

export function icon(name, size = 20, extraClass = '') {
  const body = PATHS[name] || PATHS.other;
  const className = extraClass ? ` class="ico ${extraClass}"` : ' class="ico"';
  return `<svg${className} width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}

export const CATEGORY_ICON = {
  food: 'food', cafe: 'cafe', transport: 'transport', car: 'car', home: 'home',
  health: 'health', clothes: 'clothes', fun: 'fun', comm: 'comm', gifts: 'gifts',
  beauty: 'beauty', debt: 'debt', other: 'other', income: 'income',
};
