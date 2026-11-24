// js/store.js — хранение записей в localStorage. Никаких серверов.

const KEY = 'rashody.v1';
const DEFAULT_BUDGET = 0;

function emptyState() {
  return {
    entries: [],
    settings: {
      budget: DEFAULT_BUDGET,
      speakAnswers: true,
      theme: 'paper',
    },
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    const base = emptyState();
    return {
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      settings: { ...base.settings, ...(parsed.settings || {}) },
    };
  } catch (error) {
    console.warn('Не смог прочитать сохранённые данные', error);
    return emptyState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Не смог сохранить', error);
  }
}

export function makeEntry(parsed) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ts: Date.now(),
    amount: Math.round(Number(parsed.amount) || 0),
    kind: parsed.kind === 'income' ? 'income' : 'expense',
    categoryId: parsed.category ? parsed.category.id : 'other',
    categoryName: parsed.category ? parsed.category.name : 'Другое',
    emoji: parsed.category ? parsed.category.emoji : '📦',
    note: parsed.note || '',
    source: parsed.source || 'voice',
  };
}

export function addEntry(state, entry) {
  state.entries.unshift(entry);
  saveState(state);
  return state;
}

export function removeEntry(state, id) {
  state.entries = state.entries.filter((entry) => entry.id !== id);
  saveState(state);
  return state;
}

export function updateEntry(state, id, patch) {
  state.entries = state.entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry));
  saveState(state);
  return state;
}

export function setSetting(state, key, value) {
  state.settings[key] = value;
  saveState(state);
  return state;
}

export function clearAll(state) {
  state.entries = [];
  saveState(state);
  return state;
}

export function exportCsv(entries) {
  const rows = [['дата', 'время', 'тип', 'категория', 'сумма', 'заметка', 'фраза']];
  for (const entry of entries) {
    const date = new Date(entry.ts);
    rows.push([
      date.toLocaleDateString('ru-RU'),
      date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      entry.kind === 'income' ? 'доход' : 'расход',
      entry.categoryName || '',
      String(entry.amount),
      entry.note || '',
      entry.raw || '',
    ]);
  }
  return rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    .join('\r\n');
}
