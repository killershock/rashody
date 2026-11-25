// Тесты разбора фраз: node tests/parser.test.mjs
import { parsePhrase, parseQuery, formatMoney } from '../js/parser.js';

let passed = 0;
const failures = [];

function check(name, actual, expected) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    passed += 1;
  } else {
    failures.push(`${name}\n   получилось: ${JSON.stringify(actual)}\n   ожидалось:  ${JSON.stringify(expected)}`);
  }
}

const phrases = [
  // фраза, сумма, категория
  ['кофе двести пятьдесят', 250, 'cafe'],
  ['капучино 320', 320, 'cafe'],
  ['такси триста сорок', 340, 'transport'],
  ['продукты тысяча двести', 1200, 'food'],
  ['аптека шестьсот пятьдесят', 650, 'health'],
  ['бензин две тысячи', 2000, 'car'],
  ['полторы тысячи на подарок маме', 1500, 'gifts'],
  ['обед 350 рублей', 350, 'cafe'],
  ['1 200 на продукты', 1200, 'food'],
  ['стрижка 800', 800, 'beauty'],
  ['кино на 600', 600, 'fun'],
  ['пять косарей за ремонт', 5000, 'home'],
  ['сто двадцать три рубля', 123, 'other'],
  ['двадцать пять тысяч за квартиру', 25000, 'home'],
  ['тысяча двести пятьсот рублей', 1700, 'other'],
  ['молоко и хлеб 430', 430, 'food'],
  ['подписка яндекс плюс 399', 399, 'fun'],
  ['шаурма 250', 250, 'cafe'],
  ['мотыль 2 500', 2500, 'other'],
  ['такси 1,5 тысячи', 1500, 'transport'],
];

for (const [phrase, amount, category] of phrases) {
  const result = parsePhrase(phrase);
  check(`сумма в «${phrase}»`, result.amount, amount);
  check(`категория в «${phrase}»`, result.category.id, category);
}

check('доход: зарплата', parsePhrase('зарплата сорок тысяч').kind, 'income');
check('доход: вернули', parsePhrase('вернули долг пятьсот').kind, 'income');
check('расход: купил', parsePhrase('купил кроссовки 4500').kind, 'expense');
check('сумма не найдена', parsePhrase('кофе').amount, null);
check('категория не ясна', parsePhrase('что-то за 300').category.id, 'other');
check('нужна категория', parsePhrase('что-то за 300').needsCategory, true);
check('заметка сохранилась', parsePhrase('кофе с собой 250').note, 'Кофе с собой');

check('вопрос: кофе', parseQuery('сколько на кофе').type, 'category');
check('вопрос: кофе категория', parseQuery('сколько на кофе').category.id, 'cafe');
check('вопрос: осталось', parseQuery('сколько осталось').type, 'remaining');
check('вопрос: сегодня', parseQuery('сколько я потратил сегодня').type, 'today');
check('вопрос: отмена', parseQuery('отмени последнее').type, 'undo');
check('обычная фраза — не вопрос', parseQuery('кофе 250'), null);
check('вопрос: месяц', parseQuery('сколько всего в этом месяце').type, 'month');

check('деньги формат', formatMoney(18300).replace(/\u00a0/g, ' '), '18 300 ₽');

const custom = [{ id: 'custom-1', name: 'Спорт', icon: 'fun' }];
check('своя категория', parsePhrase('спорт 2000', custom).category.id, 'custom-1');
check('своя категория: заметка', parsePhrase('спорт 2000', custom).note, 'Спорт');
check('без своих категорий — другое', parsePhrase('спорт 2000').category.id, 'other');

console.log(`\nПроверок пройдено: ${passed}`);
if (failures.length) {
  console.log(`Провалено: ${failures.length}\n`);
  for (const failure of failures) console.log(`✗ ${failure}\n`);
  process.exit(1);
}
console.log('Все проверки разбора прошли.');
