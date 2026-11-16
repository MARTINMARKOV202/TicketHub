'use strict';

const STORAGE_KEY = 'tickethub-tickets-v1';
const RESPONSE_HOURS = { low: 48, medium: 24, high: 4 };
const PRIORITY_LABELS = { low: 'Нисък', medium: 'Среден', high: 'Висок' };
const STATUS_LABELS = { open: 'Отворена', progress: 'В процес', closed: 'Затворена' };

function loadTickets() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

let tickets = loadTickets();
const form = document.querySelector('#ticket-form');
const list = document.querySelector('#tickets');
const filter = document.querySelector('#filter');

function saveTickets() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('bg-BG');
}

function makeElement(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}

function renderTickets() {
  list.replaceChildren();
  const visible = tickets.filter(ticket => filter.value === 'all' || ticket.status === filter.value);
  if (!visible.length) {
    list.append(makeElement('p', 'Няма заявки за показване.', 'meta'));
    return;
  }

  for (const ticket of visible) {
    const item = makeElement('article', undefined, 'ticket');
    item.append(makeElement('h4', ticket.title));
    item.append(makeElement('p', ticket.description));
    item.append(makeElement('p', `Приоритет: ${PRIORITY_LABELS[ticket.priority]} | Статус: ${STATUS_LABELS[ticket.status]}`, 'meta'));
    item.append(makeElement('p', `Създадена: ${formatDate(ticket.createdAt)}`, 'meta'));
    const overdue = ticket.status !== 'closed' && Date.now() > new Date(ticket.deadline).getTime();
    item.append(makeElement('p', `Срок за реакция: ${formatDate(ticket.deadline)}${overdue ? ' (Просрочена)' : ''}`, overdue ? 'meta overdue' : 'meta'));

    const actions = makeElement('div', undefined, 'ticket-actions');
    if (ticket.status === 'open') {
      const start = makeElement('button', 'Започни работа');
      start.addEventListener('click', () => updateStatus(ticket.id, 'progress'));
      actions.append(start);
    }
    if (ticket.status !== 'closed') {
      const close = makeElement('button', 'Затвори', 'secondary');
      close.addEventListener('click', () => updateStatus(ticket.id, 'closed'));
      actions.append(close);
    }
    item.append(actions);
    list.append(item);
  }
}

function updateStatus(id, status) {
  tickets = tickets.map(ticket => ticket.id === id ? { ...ticket, status } : ticket);
  saveTickets();
  renderTickets();
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(form);
  const title = String(data.get('title')).trim();
  const description = String(data.get('description')).trim();
  const priority = String(data.get('priority'));
  if (!title || !description || !Object.hasOwn(RESPONSE_HOURS, priority)) return;
  const now = Date.now();
  tickets.unshift({
    id: crypto.randomUUID(), title, description, priority, status: 'open',
    createdAt: new Date(now).toISOString(),
    deadline: new Date(now + RESPONSE_HOURS[priority] * 60 * 60 * 1000).toISOString()
  });
  saveTickets();
  form.reset();
  renderTickets();
});

filter.addEventListener('change', renderTickets);
renderTickets();
