// js/app.js — экраны, микрофон, итоги.
import { CATEGORIES, INCOME, parsePhrase, parseQuery, formatMoney, plural } from './parser.js';
import { icon } from './icons.js';
import * as store from './store.js';

const $ = (selector) => document.querySelector(selector);
const state = store.loadState();

const els = {
  body: document.body,
  subtitle: $('#subtitle'),
  monthLink: $('#btn-month'),
  monthLinkText: $('#month-link-text'),
  backBtn: $('#btn-back'),
  monthTitle: $('#month-title'),
  prevDay: $('#prev-day'),
  nextDay: $('#next-day'),
  dateLabel: $('#date-label'),
  calBackdrop: $('#cal-backdrop'),
  calendarSheet: $('#calendar-sheet'),
  calTitle: $('#cal-title'),
  calClose: $('#cal-close'),
  calPrev: $('#cal-prev'),
  calNext: $('#cal-next'),
  calToday: $('#cal-today'),
  calGrid: $('#cal-grid'),
  views: { day: $('#view-day'), month: $('#view-month') },
  monthSpent: $('#month-spent'),
  monthIncome: $('#month-income'),
  barFill: $('#bar-fill'),
  budgetHint: $('#budget-hint'),
  todayLabel: $('#today-label'),
  todayCount: $('#today-count'),
  todayList: $('#today-list'),
  emptyState: $('#empty-state'),
  examples: $('#examples'),
  catList: $('#cat-list'),
  monthDays: $('#month-days'),
  monthRange: $('#month-range'),
  budgetInput: $('#budget-input'),
  budgetLeft: $('#budget-left'),
  budgetDay: $('#budget-day'),
  speakToggle: $('#speak-toggle'),
  nightToggle: $('#night-toggle'),
  exportBtn: $('#btn-export'),
  clearBtn: $('#btn-clear'),
  installBtn: $('#btn-install'),
  textForm: $('#text-form'),
  textInput: $('#text-input'),
  mic: $('#mic'),
  overlay: $('#listen-overlay'),
  listenTitle: $('#listen-title'),
  listenText: $('#listen-text'),
  listenDone: $('#listen-done'),
  listenCancel: $('#listen-cancel'),
  backdrop: $('#sheet-backdrop'),
  sheet: $('#edit-sheet'),
  sheetTitle: $('#sheet-title'),
  sheetClose: $('#sheet-close'),
  sheetAmount: $('#sheet-amount'),
  sheetNote: $('#sheet-note'),
  sheetChips: $('#sheet-chips'),
  sheetRaw: $('#sheet-raw'),
  sheetSave: $('#sheet-save'),
  sheetDelete: $('#sheet-delete'),
  kinds: Array.from(document.querySelectorAll('.kind')),
  toast: $('#toast'),
};

const EXAMPLES = [
  'кофе двести пятьдесят',
  'такси триста сорок',
  'продукты тысяча двести',
  'зарплата сорок тысяч',
];

let toastTimer = null;
let lastAddedId = null;
let currentView = 'day';
let viewTs = startOfDay(Date.now());
let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();
let installEvent = null;

// ---------- даты и суммы ----------

function startOfDay(ts) {
  const date = new Date(ts);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

const startOfMonth = () => {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const daysInMonth = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
};

const daysLeftInMonth = () => daysInMonth() - new Date().getDate() + 1;

const sumAmount = (entries) => entries.reduce((total, entry) => total + (Number(entry.amount) || 0), 0);

const monthEntries = () => state.entries.filter((entry) => entry.ts >= startOfMonth());
const todayEntries = () => {
  const from = startOfDay(Date.now());
  return state.entries.filter((entry) => entry.ts >= from);
};
const viewEntries = () => state.entries.filter((entry) => startOfDay(entry.ts) === viewTs);

const spentOf = (entries) => sumAmount(entries.filter((entry) => entry.kind !== 'income'));
const incomeOf = (entries) => sumAmount(entries.filter((entry) => entry.kind === 'income'));

const monthName = () => new Date().toLocaleDateString('ru-RU', { month: 'long' });
const weekday = (ts) => new Date(ts).toLocaleDateString('ru-RU', { weekday: 'long' });
const dayMonth = (ts) => new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

function dayLabel(ts) {
  const today = startOfDay(Date.now());
  if (ts === today) return 'сегодня';
  if (ts === today - 86400000) return 'вчера';
  return new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'long' });
}
const timeOf = (ts) => new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

const esc = (value) => String(value == null ? '' : value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

// Плавно «досчитывает» число, чтобы суммы не прыгали.
const shownValues = new WeakMap();

function animateValue(element, value, format) {
  if (!element) return;
  const from = shownValues.has(element) ? shownValues.get(element) : 0;
  shownValues.set(element, value);

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || from === value || Math.abs(value - from) < 1) {
    element.textContent = format(value);
    return;
  }

  const start = performance.now();
  const duration = 520;
  const step = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    element.textContent = format(from + (value - from) * eased);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ---------- сообщения ----------

function toast(text, ms = 3200) {
  els.toast.textContent = text;
  els.toast.classList.remove('is-hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.add('is-hidden'), ms);
}

let voiceCache = null;
function pickVoice() {
  if (voiceCache) return voiceCache;
  const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
  voiceCache = voices.find((voice) => /ru[-_]RU/i.test(voice.lang))
    || voices.find((voice) => /^ru/i.test(voice.lang))
    || null;
  return voiceCache;
}

function speak(text) {
  if (!state.settings.speakAnswers) return;
  if (!('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'ru-RU';
    utter.rate = 1.02;
    const voice = pickVoice();
    if (voice) utter.voice = voice;
    window.speechSynthesis.speak(utter);
  } catch (error) {
    console.warn('Не смог озвучить', error);
  }
}

function answer(text) {
  toast(text, 4600);
  speak(text);
}

if ('speechSynthesis' in window) {
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    voiceCache = null;
    pickVoice();
  });
}

// ---------- отрисовка ----------

function render() {
  renderSummary();
  renderToday();
  renderMonth();
  renderTheme();
  els.monthLinkText.textContent = monthName();
  els.monthTitle.textContent = monthName();
  els.subtitle.textContent = currentView === 'day' ? 'дневник' : 'итоги месяца';
}

function renderSummary() {
  const entries = monthEntries();
  const spent = spentOf(entries);
  const income = incomeOf(entries);
  const budget = Number(state.settings.budget) || 0;

  animateValue(els.monthSpent, spent, formatMoney);
  els.monthIncome.textContent = income ? `+${formatMoney(income)}` : '0 ₽';

  if (!budget) {
    els.barFill.style.width = '0%';
    els.barFill.className = 'bar-fill';
    els.budgetHint.innerHTML = 'Лимит не задан — поставь его в разделе «Месяц»';
    return;
  }

  const left = budget - spent;
  const percent = Math.min(100, (spent / budget) * 100);
  const days = daysLeftInMonth();
  const perDay = Math.max(0, Math.round(left / days));

  els.barFill.style.width = `${percent.toFixed(1)}%`;
  els.barFill.className = 'bar-fill';
  if (percent >= 100) els.barFill.classList.add('is-over');
  else if (percent >= 85) els.barFill.classList.add('is-warn');

  if (left >= 0) {
    els.budgetHint.innerHTML = `Осталось <strong>${formatMoney(left)}</strong> · ${days} ${plural(days, 'день', 'дня', 'дней')} · это <strong>${formatMoney(perDay)}</strong> в день`;
  } else {
    els.budgetHint.innerHTML = `Перебор на <strong>${formatMoney(Math.abs(left))}</strong> — лимит ${formatMoney(budget)}`;
  }
}

function entryRow(entry) {
  const isIncome = entry.kind === 'income';
  return `
    <li class="entry${entry.id === lastAddedId ? ' is-new' : ''}" data-id="${esc(entry.id)}">
      <div class="entry-ico" aria-hidden="true">${icon(entry.categoryId || 'other', 19)}</div>
      <div class="entry-main">
        <div class="entry-note">${esc(entry.note || entry.categoryName)}</div>
        <div class="entry-meta">${esc(entry.categoryName)} · ${timeOf(entry.ts)}</div>
      </div>
      <div class="entry-amount${isIncome ? ' income' : ''}">${isIncome ? '+' : ''}${formatMoney(entry.amount)}</div>
      <button class="entry-del" type="button" data-del="${esc(entry.id)}" aria-label="Удалить">
        ${icon('trash', 16)}
      </button>
    </li>`;
}

function renderToday() {
  const entries = viewEntries();
  const spent = spentOf(entries);
  const income = incomeOf(entries);
  const today = startOfDay(Date.now());
  const isToday = viewTs === today;

  const parts = [];
  if (spent) parts.push(`−${formatMoney(spent)}`);
  if (income) parts.push(`+${formatMoney(income)}`);
  els.todayLabel.textContent = parts.length ? parts.join(' · ') : 'нет записей';

  const count = entries.length;
  els.todayCount.textContent = count
    ? `${count} ${plural(count, 'запись', 'записи', 'записей')}`
    : 'пусто';

  els.dateLabel.textContent = dayLabel(viewTs);
  els.dateLabel.classList.toggle('is-today', isToday);
  els.nextDay.disabled = viewTs >= today;

  els.todayList.innerHTML = entries.map(entryRow).join('');
  els.emptyState.classList.toggle('is-hidden', entries.length > 0);

  const emptyTitle = els.emptyState.querySelector('.empty-title');
  const emptyText = els.emptyState.querySelector('.empty-text');
  if (emptyTitle) emptyTitle.textContent = isToday ? 'Скажи, сколько потратил' : 'В этот день пусто';
  if (emptyText) {
    emptyText.textContent = isToday
      ? 'Нажми микрофон и говори: «кофе двести пятьдесят». Или набери в строке.'
      : 'Выбери другой день стрелками или загляни в календарь.';
  }

  if (!els.examples.dataset.ready) {
    els.examples.innerHTML = EXAMPLES
      .map((phrase) => `<button class="example" type="button" data-phrase="${esc(phrase)}">${esc(phrase)}</button>`)
      .join('');
    els.examples.dataset.ready = '1';
  }
  lastAddedId = null;
}

function renderMonth() {
  const entries = monthEntries();
  const spent = spentOf(entries);
  const budget = Number(state.settings.budget) || 0;

  els.budgetInput.value = budget ? new Intl.NumberFormat('ru-RU').format(budget) : '';
  els.monthRange.textContent = `всего ${formatMoney(spent)}`;

  if (budget) {
    const left = budget - spent;
    const days = daysLeftInMonth();
    animateValue(els.budgetLeft, left, formatMoney);
    animateValue(els.budgetDay, left > 0 ? Math.round(left / days) : 0, formatMoney);
  } else {
    els.budgetLeft.textContent = '—';
    els.budgetDay.textContent = '—';
  }

  els.speakToggle.checked = Boolean(state.settings.speakAnswers);

  // категории
  const byCategory = new Map();
  for (const entry of entries) {
    if (entry.kind === 'income') continue;
    const current = byCategory.get(entry.categoryId) || {
      id: entry.categoryId, name: entry.categoryName, amount: 0, count: 0,
    };
    current.amount += Number(entry.amount) || 0;
    current.count += 1;
    byCategory.set(entry.categoryId, current);
  }

  const rows = Array.from(byCategory.values()).sort((a, b) => b.amount - a.amount);
  if (!rows.length) {
    els.catList.innerHTML = '<li class="cat-empty">В этом месяце расходов пока нет.</li>';
  } else {
    const max = rows[0].amount || 1;
    els.catList.innerHTML = rows.map((row) => `
      <li class="cat-row">
        <span class="cat-ico">${icon(row.id || 'other', 18)}</span>
        <span class="cat-name">${esc(row.name)}</span>
        <span class="cat-sum">${formatMoney(row.amount)}</span>
        <span class="cat-track"><span class="cat-fill" data-width="${((row.amount / max) * 100).toFixed(1)}"></span></span>
      </li>`).join('');

    requestAnimationFrame(() => {
      els.catList.querySelectorAll('.cat-fill').forEach((bar) => {
        bar.style.width = `${bar.dataset.width}%`;
      });
    });
  }

  // записи по дням
  const days = new Map();
  for (const entry of state.entries) {
    const key = startOfDay(entry.ts);
    if (!days.has(key)) days.set(key, []);
    days.get(key).push(entry);
  }

  if (!days.size) {
    els.monthDays.innerHTML = '<p class="muted" style="margin:0">Записей пока нет.</p>';
  } else {
    const keys = Array.from(days.keys()).sort((a, b) => b - a);
    els.monthDays.innerHTML = keys.map((key) => {
      const list = days.get(key);
      const daySpent = spentOf(list);
      const title = new Date(key).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
      return `
        <section>
          <div class="day-head" data-day="${key}"><span>${esc(title)}, ${esc(weekday(key))}</span><b>${formatMoney(daySpent)}</b></div>
          <ul class="entries">${list.map(entryRow).join('')}</ul>
        </section>`;
    }).join('');
  }
}

function applyTheme(theme) {
  const night = theme === 'night';
  document.documentElement.dataset.theme = night ? 'night' : 'paper';
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', night ? '#17140f' : '#f7f2e8');
  if (els.nightToggle) els.nightToggle.checked = night;
}

function renderTheme() {
  applyTheme(state.settings.theme);
}

// ---------- разбор сказанного ----------

function handleText(raw) {
  const text = String(raw || '').trim();
  if (!text) return;

  const query = parseQuery(text);
  if (query) {
    handleQuery(query, text);
    return;
  }

  const parsed = parsePhrase(text);
  if (!parsed.amount) {
    openSheet({ parsed });
    toast('Сумму не разобрал — впиши её руками');
    return;
  }
  if (parsed.needsCategory) {
    openSheet({ parsed });
    return;
  }
  commitParsed(parsed);
}

function commitParsed(parsed) {
  const entry = store.makeEntry(parsed);
  store.addEntry(state, entry);
  lastAddedId = entry.id;
  viewTs = startOfDay(Date.now());
  if (currentView !== 'day') showMonth(false);
  render();
  toast(`${entry.note || entry.categoryName} · ${formatMoney(entry.amount)} → ${entry.categoryName}`);
}

function handleQuery(query, raw) {
  const entries = monthEntries();
  const spent = spentOf(entries);

  switch (query.type) {
    case 'undo': {
      const last = state.entries[0];
      if (!last) {
        answer('Записей пока нет.');
        return;
      }
      store.removeEntry(state, last.id);
      render();
      answer(`Убрал: ${last.note || last.categoryName} на ${formatMoney(last.amount)}.`);
      return;
    }
    case 'today': {
      answer(`Сегодня потрачено ${formatMoney(spentOf(todayEntries()))}.`);
      return;
    }
    case 'week': {
      const from = startOfDay(Date.now() - 6 * 86400000);
      answer(`За неделю потрачено ${formatMoney(spentOf(state.entries.filter((e) => e.ts >= from)))}.`);
      return;
    }
    case 'category': {
      const list = entries.filter((entry) => entry.kind !== 'income' && entry.categoryId === query.category.id);
      if (!list.length) {
        answer(`На «${query.category.name}» в этом месяце ещё не тратил.`);
        return;
      }
      answer(`На «${query.category.name}» в этом месяце ${formatMoney(sumAmount(list))} за ${list.length} ${plural(list.length, 'запись', 'записи', 'записей')}.`);
      return;
    }
    case 'remaining': {
      const budget = Number(state.settings.budget) || 0;
      if (!budget) {
        answer('Лимит на месяц не задан. Поставь его в разделе «Месяц».');
        return;
      }
      const left = budget - spent;
      const days = daysLeftInMonth();
      if (left >= 0) {
        answer(`Осталось ${formatMoney(left)}. Это ${days} ${plural(days, 'день', 'дня', 'дней')}, по ${formatMoney(Math.round(left / days))} в день.`);
      } else {
        answer(`Ты вышел за лимит на ${formatMoney(Math.abs(left))}.`);
      }
      return;
    }
    case 'top': {
      const byCategory = new Map();
      for (const entry of entries) {
        if (entry.kind === 'income') continue;
        byCategory.set(entry.categoryId, (byCategory.get(entry.categoryId) || 0) + (Number(entry.amount) || 0));
      }
      const best = Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1])[0];
      if (!best) {
        answer('Пока нечего считать.');
        return;
      }
      const category = CATEGORIES.find((item) => item.id === best[0]);
      answer(`Больше всего уходит на «${category ? category.name : 'другое'}»: ${formatMoney(best[1])}.`);
      return;
    }
    default: {
      answer(`В этом месяце потрачено ${formatMoney(spent)}, пришло ${formatMoney(incomeOf(entries))}.`);
    }
  }

  if (raw && query.type === 'month') return;
}

// ---------- шторка ----------

let sheet = null;

function openSheet({ parsed, entry }) {
  if (entry) {
    sheet = {
      id: entry.id,
      amount: String(entry.amount),
      kind: entry.kind,
      categoryId: entry.categoryId,
      note: entry.note || '',
      raw: entry.raw || '',
    };
  } else {
    sheet = {
      id: null,
      amount: parsed.amount ? String(parsed.amount) : '',
      kind: parsed.kind || 'expense',
      categoryId: parsed.category ? parsed.category.id : 'other',
      note: parsed.note || '',
      raw: parsed.raw || '',
    };
  }
  renderSheet();
  els.backdrop.classList.remove('is-hidden');
  els.sheet.classList.remove('is-hidden');
  setTimeout(() => {
    els.sheetAmount.focus();
    els.sheetAmount.select();
  }, 60);
}

function closeSheet() {
  els.backdrop.classList.add('is-hidden');
  els.sheet.classList.add('is-hidden');
  sheet = null;
}

function renderSheet() {
  if (!sheet) return;
  els.sheetTitle.textContent = sheet.id ? 'Изменить запись' : 'Новая запись';
  els.sheetAmount.value = sheet.amount;
  els.sheetNote.value = sheet.note || '';
  els.sheetRaw.textContent = sheet.raw ? `«${sheet.raw}»` : '';
  els.sheetDelete.classList.toggle('is-hidden', !sheet.id);

  for (const kindBtn of els.kinds) {
    kindBtn.classList.toggle('is-active', kindBtn.dataset.kind === sheet.kind);
  }

  const list = sheet.kind === 'income' ? [INCOME] : CATEGORIES;
  if (sheet.kind === 'income') sheet.categoryId = 'income';

  els.sheetChips.innerHTML = list.map((category) => `
    <button class="chip${category.id === sheet.categoryId ? ' is-active' : ''}" type="button"
      data-category="${esc(category.id)}">
      ${icon(category.id, 16)}<span>${esc(category.name)}</span>
    </button>`).join('');
}

function saveSheet() {
  if (!sheet) return;
  const amount = Number(String(els.sheetAmount.value).replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(amount) || amount <= 0) {
    toast('Впиши сумму — например 250');
    els.sheetAmount.focus();
    return;
  }

  const kind = sheet.kind;
  const category = kind === 'income'
    ? INCOME
    : (CATEGORIES.find((item) => item.id === sheet.categoryId) || CATEGORIES[CATEGORIES.length - 1]);

  const note = els.sheetNote.value.trim() || (category.id === 'other' ? '' : category.name);

  if (sheet.id) {
    store.updateEntry(state, sheet.id, {
      amount: Math.round(amount),
      kind,
      categoryId: category.id,
      categoryName: category.name,
      emoji: category.emoji,
      note,
    });
    closeSheet();
    render();
    toast('Исправил запись');
    return;
  }

  const entry = store.makeEntry({
    amount,
    kind,
    category,
    note,
    raw: sheet.raw,
    source: sheet.raw ? 'voice' : 'text',
  });
  store.addEntry(state, entry);
  lastAddedId = entry.id;
  closeSheet();
  render();
  toast(`Записал: ${entry.note || entry.categoryName} · ${formatMoney(entry.amount)}`);
}

// ---------- голос ----------

let recognition = null;
let listening = false;
let transcript = '';
let micError = '';
let audioContext = null;

function ensureRecognition() {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) return null;
  if (recognition) return recognition;

  recognition = new Ctor();
  recognition.lang = 'ru-RU';
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    let interim = '';
    let final = '';
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      if (result.isFinal) final += result[0].transcript;
      else interim += result[0].transcript;
    }
    if (final) transcript = `${transcript} ${final}`.trim();
    setListenText(transcript || interim);
  };

  recognition.onerror = (event) => {
    micError = event.error || 'unknown';
  };

  recognition.onnomatch = () => {
    micError = 'no-speech';
  };

  recognition.onend = () => {
    finishListening();
  };

  return recognition;
}

function setListenText(text) {
  els.listenText.textContent = text ? text : 'Например: «такси триста сорок»';
}

function beep(duration = 0.09, frequency = 660) {
  try {
    audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.value = 0.05;
    osc.connect(gain).connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + duration);
  } catch (error) {
    /* звук не критичен */
  }
}

function startListening() {
  if (listening) return;
  if (!ensureRecognition()) {
    toast('Этот браузер не умеет слушать. Напиши в строке — разберу точно так же.');
    els.textInput.focus();
    return;
  }

  transcript = '';
  micError = '';
  listening = true;
  els.mic.classList.add('is-listening');
  els.overlay.classList.remove('is-hidden');
  els.listenTitle.textContent = 'Говорите…';
  setListenText('');
  beep(0.07, 740);

  try {
    recognition.start();
  } catch (error) {
    listening = false;
    els.mic.classList.remove('is-listening');
    els.overlay.classList.add('is-hidden');
    toast('Микрофон занят — попробуй ещё раз.');
  }
}

function stopListening() {
  if (!listening) return;
  try {
    recognition.stop();
  } catch (error) {
    finishListening();
  }
}

function finishListening() {
  if (!listening) return;
  listening = false;
  els.mic.classList.remove('is-listening');
  els.overlay.classList.add('is-hidden');

  if (micError === 'not-allowed' || micError === 'service-not-allowed') {
    toast('Браузер не даёт доступ к микрофону. Разреши его в настройках сайта.');
    return;
  }

  const text = transcript.trim();
  transcript = '';

  if (!text) {
    if (micError === 'no-speech' || micError === 'aborted' || !micError) {
      toast('Не расслышал. Попробуй ещё раз, чуть ближе к микрофону.');
    } else {
      toast('Не получилось послушать. Напиши словами — разберу так же.');
    }
    return;
  }

  handleText(text);
}

// ---------- события ----------

function showMonth(show) {
  currentView = show ? 'month' : 'day';
  els.views.day.classList.toggle('is-hidden', show);
  els.views.month.classList.toggle('is-hidden', !show);
  els.subtitle.textContent = show ? 'итоги месяца' : 'дневник';
  els.monthLinkText.textContent = monthName();
  els.monthTitle.textContent = monthName();
  const view = show ? els.views.month : els.views.day;
  view.classList.remove('view-in');
  void view.offsetWidth;
  view.classList.add('view-in');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

els.monthLink.addEventListener('click', () => showMonth(true));
els.backBtn.addEventListener('click', () => showMonth(false));

function shiftDay(delta) {
  const today = startOfDay(Date.now());
  const next = viewTs + delta * 86400000;
  if (next > today) return;
  viewTs = startOfDay(next);
  render();
}

function openCalendar() {
  const current = new Date(viewTs);
  calYear = current.getFullYear();
  calMonth = current.getMonth();
  renderCalendar();
  els.calBackdrop.classList.remove('is-hidden');
  els.calendarSheet.classList.remove('is-hidden');
}

function closeCalendar() {
  els.calBackdrop.classList.add('is-hidden');
  els.calendarSheet.classList.add('is-hidden');
}

function renderCalendar() {
  const first = new Date(calYear, calMonth, 1);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(calYear, calMonth + 1, 0).getDate();
  const today = startOfDay(Date.now());
  const now = new Date();

  els.calTitle.textContent = first.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });

  const cells = [];
  for (let i = 0; i < offset; i += 1) cells.push('<span class="cal-day cal-empty"></span>');
  for (let day = 1; day <= days; day += 1) {
    const ts = new Date(calYear, calMonth, day).getTime();
    const classes = ['cal-day'];
    if (ts === today) classes.push('is-today');
    if (ts === viewTs) classes.push('is-selected');
    const disabled = ts > today ? ' disabled' : '';
    cells.push(`<button class="${classes.join(' ')}" type="button" data-day="${ts}"${disabled}>${day}</button>`);
  }
  els.calGrid.innerHTML = cells.join('');
  els.calNext.disabled = calYear > now.getFullYear()
    || (calYear === now.getFullYear() && calMonth >= now.getMonth());
}

els.prevDay.addEventListener('click', () => shiftDay(-1));
els.nextDay.addEventListener('click', () => shiftDay(1));
els.dateLabel.addEventListener('click', openCalendar);
els.calClose.addEventListener('click', closeCalendar);
els.calBackdrop.addEventListener('click', closeCalendar);
els.calPrev.addEventListener('click', () => {
  calMonth -= 1;
  if (calMonth < 0) { calMonth = 11; calYear -= 1; }
  renderCalendar();
});
els.calNext.addEventListener('click', () => {
  if (els.calNext.disabled) return;
  calMonth += 1;
  if (calMonth > 11) { calMonth = 0; calYear += 1; }
  renderCalendar();
});
els.calToday.addEventListener('click', () => {
  viewTs = startOfDay(Date.now());
  closeCalendar();
  if (currentView !== 'day') showMonth(false);
  render();
});
els.calGrid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-day]');
  if (!button) return;
  viewTs = startOfDay(Number(button.dataset.day));
  closeCalendar();
  if (currentView !== 'day') showMonth(false);
  render();
});

els.textForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const value = els.textInput.value;
  if (!value.trim()) {
    startListening();
    return;
  }
  els.textInput.value = '';
  handleText(value);
});

els.examples.addEventListener('click', (event) => {
  const button = event.target.closest('[data-phrase]');
  if (!button) return;
  handleText(button.dataset.phrase);
});

function bindMic(element) {
  element.addEventListener('click', () => {
    if (listening) stopListening();
    else startListening();
  });
  element.addEventListener('keydown', (event) => {
    if (event.code === 'Space' || event.code === 'Enter') {
      event.preventDefault();
      if (listening) stopListening();
      else startListening();
    }
  });
}

bindMic(els.mic);
els.listenDone.addEventListener('click', () => stopListening());
els.listenCancel.addEventListener('click', () => {
  transcript = '';
  micError = 'aborted';
  stopListening();
  els.overlay.classList.add('is-hidden');
  els.mic.classList.remove('is-listening');
  listening = false;
});

els.sheetAmount.addEventListener('input', () => {
  if (!sheet) return;
  sheet.amount = els.sheetAmount.value;
});
els.sheetNote.addEventListener('input', () => {
  if (!sheet) return;
  sheet.note = els.sheetNote.value;
});

els.sheetChips.addEventListener('click', (event) => {
  const chip = event.target.closest('[data-category]');
  if (!chip || !sheet) return;
  sheet.categoryId = chip.dataset.category;
  renderSheet();
});

els.kinds.forEach((kindBtn) => {
  kindBtn.addEventListener('click', () => {
    if (!sheet) return;
    sheet.kind = kindBtn.dataset.kind;
    if (sheet.kind === 'income') sheet.categoryId = 'income';
    else if (sheet.categoryId === 'income') sheet.categoryId = 'other';
    renderSheet();
  });
});

els.sheetSave.addEventListener('click', saveSheet);

els.sheetDelete.addEventListener('click', () => {
  if (!sheet || !sheet.id) return;
  const id = sheet.id;
  store.removeEntry(state, id);
  closeSheet();
  render();
  toast('Запись удалена');
});

els.sheetClose.addEventListener('click', closeSheet);
els.backdrop.addEventListener('click', closeSheet);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (!els.sheet.classList.contains('is-hidden')) closeSheet();
    if (!els.calendarSheet.classList.contains('is-hidden')) closeCalendar();
    if (!els.overlay.classList.contains('is-hidden')) {
      micError = 'aborted';
      stopListening();
    }
  }
  if (event.key === 'Enter' && sheet && document.activeElement === els.sheetNote) {
    event.preventDefault();
    saveSheet();
  }
});

function bindListActions(container) {
  container.addEventListener('click', (event) => {
    const del = event.target.closest('[data-del]');
    if (del) {
      event.stopPropagation();
      const entry = state.entries.find((item) => item.id === del.dataset.del);
      const rowEl = del.closest('.entry');
      if (rowEl) rowEl.classList.add('is-removing');
      setTimeout(() => {
        store.removeEntry(state, del.dataset.del);
        render();
        toast(entry ? `Удалил: ${entry.note || entry.categoryName}` : 'Удалил');
      }, 150);
      return;
    }
    const row = event.target.closest('[data-id]');
    if (!row) return;
    const entry = state.entries.find((item) => item.id === row.dataset.id);
    if (entry) openSheet({ entry });
  });
}

bindListActions(els.todayList);
bindListActions(els.monthDays);

els.monthDays.addEventListener('click', (event) => {
  const head = event.target.closest('.day-head[data-day]');
  if (!head) return;
  viewTs = startOfDay(Number(head.dataset.day));
  showMonth(false);
  render();
});

els.nightToggle.addEventListener('change', () => {
  store.setSetting(state, 'theme', els.nightToggle.checked ? 'night' : 'paper');
  renderTheme();
});

els.budgetInput.addEventListener('change', () => {
  const value = Number(String(els.budgetInput.value).replace(/[^\d]/g, ''));
  store.setSetting(state, 'budget', value > 0 ? value : 0);
  render();
  if (value > 0) toast(`Лимит ${formatMoney(value)} на месяц`);
});

els.speakToggle.addEventListener('change', () => {
  store.setSetting(state, 'speakAnswers', els.speakToggle.checked);
  if (els.speakToggle.checked) speak('Хорошо, буду отвечать голосом.');
});

els.exportBtn.addEventListener('click', () => {
  if (!state.entries.length) {
    toast('Пока нечего выгружать');
    return;
  }
  const csv = store.exportCsv(state.entries);
  const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `расходы-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 4000);
  toast('Таблица скачана — открой её в Excel');
});

els.clearBtn.addEventListener('click', () => {
  if (!state.entries.length) {
    toast('Записей нет');
    return;
  }
  if (!window.confirm('Удалить все записи? Это нельзя отменить.')) return;
  store.clearAll(state);
  render();
  toast('Все записи удалены');
});

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  installEvent = event;
  els.installBtn.classList.remove('is-hidden');
});

els.installBtn.addEventListener('click', async () => {
  if (!installEvent) {
    toast('Открой меню браузера → «Установить приложение»');
    return;
  }
  installEvent.prompt();
  const choice = await installEvent.userChoice;
  if (choice.outcome === 'accepted') {
    els.installBtn.classList.add('is-hidden');
    toast('Установлено. Ищи иконку на экране телефона.');
  }
  installEvent = null;
});

window.addEventListener('appinstalled', () => {
  els.installBtn.classList.add('is-hidden');
});

// ---------- запуск ----------

render();

if ('serviceWorker' in navigator) {
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then((registration) => {
      registration.update().catch(() => {});
    }).catch((error) => {
      console.warn('Service worker не зарегистрировался', error);
    });
  });
}
