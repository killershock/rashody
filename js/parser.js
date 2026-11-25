// js/parser.js — разбор русской фразы о трате.
// Чистый модуль без DOM: его же проверяют тесты в tests/parser.test.mjs.

export const CATEGORIES = [
  {
    id: 'food', name: 'Продукты', emoji: '🛒',
    keywords: ['продукт', 'магазин', 'пятерочк', 'пятерок', 'магнит', 'лента', 'ашан', 'перекресток', 'дикси', 'вкусвилл', 'светофор', 'хлеб', 'молок', 'сыр', 'мясо', 'куриц', 'овощ', 'фрукт', 'яйц', 'рыб', 'колбас', 'йогурт', 'банан', 'яблок', 'картош', 'сахар', 'масло', 'сок', 'кефир', 'творог', 'макарон', 'крупа', 'соль'],
  },
  {
    id: 'cafe', name: 'Кафе', emoji: '☕',
    keywords: ['кафе', 'кофе', 'латте', 'капучино', 'чай', 'обед', 'ужин', 'завтрак', 'пицц', 'шаурм', 'бургер', 'ресторан', 'макдональдс', 'вкусно и точк', 'kfc', 'суши', 'ролл', 'бариста', 'булочк', 'круассан', 'десерт', 'торт', 'мороженое', 'блин', 'столовая', 'бар', 'кофейн'],
  },
  {
    id: 'transport', name: 'Транспорт', emoji: '🚌',
    keywords: ['такси', 'метро', 'автобус', 'троллейбус', 'трамвай', 'маршрутк', 'каршеринг', 'билет', 'поезд', 'электричк', 'самокат', 'проезд', 'таксист', 'аэроэкспресс'],
  },
  {
    id: 'car', name: 'Машина', emoji: '🚗',
    keywords: ['бензин', 'заправк', 'азс', 'мойк', 'шин', 'парковк', 'страховк', 'техосмотр', 'антифриз', 'омывайк', 'автосервис', 'автомойк'],
  },
  {
    id: 'home', name: 'Дом', emoji: '🏠',
    keywords: ['квартплат', 'квартир', 'аренд', 'коммуналк', 'электричеств', 'интернет', 'жкх', 'ремонт', 'мебел', 'посуд', 'чистящ', 'порошок', 'стирк', 'лампочк', 'обои', 'плитк', 'кран', 'смесител'],
  },
  {
    id: 'health', name: 'Здоровье', emoji: '💊',
    keywords: ['аптек', 'лекарств', 'врач', 'стоматолог', 'анализ', 'клиник', 'витамин', 'таблетк', 'полис', 'массаж', 'окулист', 'терапевт', 'укол'],
  },
  {
    id: 'clothes', name: 'Одежда', emoji: '👕',
    keywords: ['одежд', 'кроссовк', 'куртк', 'футболк', 'джинс', 'обув', 'брюк', 'рубашк', 'плать', 'шапк', 'носк', 'бель', 'ботинк', 'сапог', 'сумк'],
  },
  {
    id: 'fun', name: 'Развлечения', emoji: '🎬',
    keywords: ['кино', 'концерт', 'игр', 'подписк', 'ютуб', 'youtube', 'яндекс плюс', 'steam', 'стим', 'боулинг', 'квест', 'театр', 'музей', 'нетфликс', 'netflix', 'spotify', 'спотифай', 'аттракцион', 'зоопарк'],
  },
  {
    id: 'comm', name: 'Связь', emoji: '📱',
    keywords: ['связь', 'мобилк', 'симк', 'тариф', 'мтс', 'билайн', 'мегафон', 'теле2', 'пополнить телефон', 'пополнил телефон'],
  },
  {
    id: 'gifts', name: 'Подарки', emoji: '🎁',
    keywords: ['подарок', 'подарк', 'цвет', 'букет', 'розы', 'цветы'],
  },
  {
    id: 'beauty', name: 'Красота', emoji: '💅',
    keywords: ['стрижк', 'барбер', 'маникюр', 'косметик', 'шампун', 'крем', 'парфюм', 'духи', 'парикмахер', 'педикюр', 'брови'],
  },
  {
    id: 'debt', name: 'Долги', emoji: '🤝',
    keywords: ['долг', 'занял', 'заняла', 'одолжил', 'одолжила', 'должен', 'должна', 'в долг', 'отдал долг'],
  },
  { id: 'other', name: 'Другое', emoji: '📦', keywords: [] },
];

export const INCOME = { id: 'income', name: 'Доход', emoji: '💰' };

// ---------- словари чисел ----------

const ONES = {
  ноль: 0, нуль: 0, один: 1, одна: 1, одно: 1, два: 2, две: 2, три: 3,
  четыре: 4, пять: 5, шесть: 6, семь: 7, восемь: 8, девять: 9,
};
const TEENS = {
  десять: 10, одиннадцать: 11, двенадцать: 12, тринадцать: 13, четырнадцать: 14,
  пятнадцать: 15, шестнадцать: 16, семнадцать: 17, восемнадцать: 18, девятнадцать: 19,
};
const TENS = {
  двадцать: 20, тридцать: 30, сорок: 40, пятьдесят: 50,
  шестьдесят: 60, семьдесят: 70, восемьдесят: 80, девяносто: 90,
};
const HUNDREDS = {
  сто: 100, двести: 200, триста: 300, четыреста: 400, пятьсот: 500,
  шестьсот: 600, семьсот: 700, восемьсот: 800, девятьсот: 900,
};

const PARTS = new Map([
  ...Object.entries(ONES),
  ...Object.entries(TEENS),
  ...Object.entries(TENS),
  ...Object.entries(HUNDREDS),
]);

const SCALES = new Map([
  ['тысяча', 1e3], ['тысячи', 1e3], ['тысяч', 1e3], ['тысячу', 1e3], ['тысячей', 1e3],
  ['тыща', 1e3], ['тыщи', 1e3], ['тыщ', 1e3], ['тыще', 1e3],
  ['миллион', 1e6], ['миллиона', 1e6], ['миллионов', 1e6], ['миллиону', 1e6],
  ['миллиард', 1e9], ['миллиарда', 1e9], ['миллиардов', 1e9],
]);

// Разговорные деньги: "пять косарей" = 5000, "полтос" = 50.
const SLANG = new Map([
  ['косарь', 1e3], ['косаря', 1e3], ['косарей', 1e3], ['косар', 1e3], ['косоря', 1e3],
  ['штука', 1e3], ['штуки', 1e3], ['штук', 1e3], ['штуку', 1e3],
  ['лимон', 1e6], ['лимона', 1e6], ['лимонов', 1e6],
  ['сотка', 100], ['сотки', 100], ['сотню', 100], ['сотен', 100],
  ['полтос', 50], ['полтоса', 50], ['полтинник', 50],
  ['чирик', 10], ['чирика', 10], ['червонец', 10],
]);

const HALVES = new Set(['полтора', 'полторы', 'полтораста']);

const CURRENCY = new Set([
  'руб', 'рубль', 'рубля', 'рублей', 'рубли', 'рублю', 'р', '₽',
  'рублик', 'рубликов', 'рэ', 'рубчик', 'копеек', 'копейки', 'тысяч', 'тысячи',
]);

// Числа-«счётчики», это не деньги: "два раза", "три дня".
const COUNTERS = new Set([
  'раз', 'раза', 'дней', 'дня', 'день', 'часов', 'часа', 'минут', 'минуты',
  'человек', 'процентов', 'процента', 'км', 'шагов', 'литров', 'литра',
  'кг', 'грамм', 'месяцев', 'недели', 'недель', 'пачек', 'бутылок', 'порций',
]);

const STOPWORDS = new Set([
  'я', 'мне', 'на', 'за', 'в', 'во', 'по', 'и', 'а', 'ещё', 'еще', 'это', 'то',
  'потратил', 'потратила', 'потратили', 'потрачено', 'купил', 'купила', 'купили',
  'заплатил', 'заплатила', 'заплатили', 'отдал', 'отдала', 'оплатил', 'оплатила',
  'получил', 'получила', 'получили', 'пришло', 'пришли', 'зачислили', 'начислили',
  'сегодня', 'вчера', 'примерно', 'около', 'где-то', 'итого', 'всего', 'было',
  'на', 'мне', 'руб', 'рубль', 'рубля', 'рублей', 'рубли', 'р', '₽', 'рубчик',
  'пожалуйста', 'ну', 'вот', 'надо', 'нужно', 'что', 'что-то', 'нибудь',
  'какой', 'какая', 'там', 'разное', 'всякое', 'типа', 'короче',
]);

const INCOME_WORDS = [
  'зарплата', 'зарплату', 'получил', 'получила', 'пришло', 'пришли', 'зачислили',
  'начислили', 'кэшбэк', 'кешбэк', 'премия', 'премию', 'аванс', 'доход', 'подработка',
  'продал', 'продала', 'вернули', 'возврат', 'стипендия', 'пенсия', 'гонорар', 'дивиденды',
];

// ---------- нормализация ----------

export function normalize(raw) {
  let text = String(raw || '').toLowerCase().replace(/ё/g, 'е');
  // "1 200", "1,200", "1.200" -> "1200"
  text = text.replace(/(\d)[\s\u00a0.,](\d{3})(?!\d)/g, '$1$2');
  // десятичные: "1,5" -> "1.5"
  text = text.replace(/(\d)[.,](\d{1,2})(?!\d)/g, '$1.$2');
  return text.trim();
}

function tokenize(text) {
  return text.split(/[^a-zа-я0-9.]+/).filter(Boolean);
}

// ---------- числа ----------

function scanNumberGroups(tokens) {
  const groups = [];
  let i = 0;

  while (i < tokens.length) {
    const start = i;
    let total = 0;
    let current = 0;
    let seen = false;

    while (i < tokens.length) {
      const token = tokens[i];

      if (/^\d+(\.\d+)?$/.test(token)) {
        current += Number(token);
        seen = true;
        i += 1;
        continue;
      }

      if (PARTS.has(token)) {
        current += PARTS.get(token);
        seen = true;
        i += 1;
        continue;
      }

      if (SCALES.has(token)) {
        total += (current || 1) * SCALES.get(token);
        current = 0;
        seen = true;
        i += 1;
        continue;
      }

      if (SLANG.has(token)) {
        const value = SLANG.get(token);
        if (current > 0) total += current * value;
        else total += value;
        current = 0;
        seen = true;
        i += 1;
        continue;
      }

      if (HALVES.has(token)) {
        const next = tokens[i + 1];
        if (next && SCALES.has(next)) {
          total += 1.5 * SCALES.get(next);
          i += 2;
        } else {
          total += 1.5;
          i += 1;
        }
        seen = true;
        continue;
      }

      break;
    }

    if (seen) {
      const value = total + current;
      if (value > 0) groups.push({ value, start, end: i });
    } else {
      i += 1;
    }
  }

  return groups;
}

function pickAmount(groups, tokens) {
  let last = null;

  for (const group of groups) {
    const next = tokens[group.end];
    if (next && CURRENCY.has(next)) return group;
    if (next && COUNTERS.has(next)) continue;
    last = group;
  }

  return last;
}

// ---------- категории ----------

function keywordsFor(category) {
  if (Array.isArray(category.keywords) && category.keywords.length) {
    return category.keywords;
  }
  return String(category.name || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .split(/[^a-zа-я0-9]+/)
    .filter((word) => word.length >= 3);
}

function matchCategory(text, categories = CATEGORIES) {
  let best = null;
  let bestScore = 0;

  for (const category of categories) {
    let score = 0;
    for (const keyword of keywordsFor(category)) {
      if (text.includes(keyword)) score += keyword.length;
    }
    if (score > bestScore) {
      bestScore = score;
      best = category;
    }
  }

  return best;
}

function isIncome(text) {
  return INCOME_WORDS.some((word) => text.includes(word));
}

// ---------- главная функция ----------

/**
 * Разбирает фразу в запись.
 * @returns {{amount:number|null, kind:'expense'|'income', category:object|null,
 *            note:string, raw:string, confidence:'high'|'low', needsCategory:boolean}}
 */
export function parsePhrase(raw, extraCategories = []) {
  const text = normalize(raw);
  const tokens = tokenize(text);
  const groups = scanNumberGroups(tokens);

  const categories = extraCategories.length
    ? [...CATEGORIES.slice(0, -1), ...extraCategories, CATEGORIES[CATEGORIES.length - 1]]
    : CATEGORIES;

  const amountGroup = pickAmount(groups, tokens);
  const amount = amountGroup ? Math.round(amountGroup.value) : null;
  const income = isIncome(text);

  let category = null;
  if (income) {
    category = INCOME;
  } else {
    category = matchCategory(text, categories) || CATEGORIES[CATEGORIES.length - 1];
  }

  // заметка = слова, не занятые числом и служебными словами
  const skip = new Set();
  if (amountGroup) {
    for (let i = amountGroup.start; i < amountGroup.end; i += 1) skip.add(i);
  }
  const noteWords = tokens.filter((token, index) => {
    if (skip.has(index)) return false;
    if (STOPWORDS.has(token)) return false;
    if (CURRENCY.has(token)) return false;
    return true;
  });

  let note = noteWords.join(' ').replace(/\s+/g, ' ').trim();
  if (!note) note = category && category.id !== 'other' ? category.name : '';
  if (note) note = note.charAt(0).toUpperCase() + note.slice(1);

  const needsCategory = !income && category.id === 'other';
  const confidence = amount && !needsCategory ? 'high' : 'low';

  return {
    amount,
    kind: income ? 'income' : 'expense',
    category,
    note,
    raw: String(raw || '').trim(),
    confidence,
    needsCategory,
  };
}

// ---------- вопросы голосом ----------

/**
 * Понимает вопрос про деньги. Возвращает null, если это не вопрос.
 * @returns {{type:string, category?:object, period?:string}|null}
 */
export function parseQuery(raw) {
  const text = normalize(raw);
  if (!text) return null;

  if (/(отмени|удали|убери)/.test(text) && /(последн|запись|это)/.test(text)) {
    return { type: 'undo' };
  }

  const asksHowMuch = /(сколько|скока|какая сумма|какой итог)/.test(text);

  if (asksHowMuch && /(осталось|остаток)/.test(text)) {
    return { type: 'remaining' };
  }

  if (asksHowMuch) {
    const category = matchCategory(text);
    if (category && category.id !== 'other') {
      return { type: 'category', category };
    }
    if (/(сегодня|за день|день)/.test(text)) return { type: 'today' };
    if (/(недел)/.test(text)) return { type: 'week' };
    if (/(месяц|месяце)/.test(text)) return { type: 'month' };
    return { type: 'month' };
  }

  if (/(на что|куда)/.test(text) && /(уходит|уход|больше|трачу)/.test(text)) {
    return { type: 'top' };
  }

  return null;
}

export function formatMoney(value) {
  const number = Number(value) || 0;
  return `${new Intl.NumberFormat('ru-RU').format(Math.round(number))} ₽`;
}

export function plural(n, one, few, many) {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return many;
  if (last > 1 && last < 5) return few;
  if (last === 1) return one;
  return many;
}
