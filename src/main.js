import './home-mobile.css';
import './final-polish.css';
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  nav.classList.toggle('open', !open);
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
}));

const content = {
  delivery: {
    title: 'Forest Delivery', accent: '#167d6a',
    steps: ['Выбери тему.', 'Прочитай или послушай слово.', 'Помоги Пип доставить посылки до заката.']
  },
  machine: {
    title: 'Fix the Machine', accent: '#c47724',
    steps: ['Посмотри на картинку или послушай фразу.', 'Собери предложение из слов.', 'Почини машину и запусти её.']
  },
  toys: {
    title: 'Where’s My Toy?', accent: '#d95547',
    steps: ['Послушай подсказку.', 'Ищи игрушки фонариком.', 'Найди их до того, как села батарея.']
  }
};
const dialog = document.querySelector('.game-dialog');
let dialogTrigger;
document.querySelectorAll('.how-button').forEach(button => button.addEventListener('click', () => {
  dialogTrigger = button;
  const game = content[button.dataset.game];
  dialog.style.setProperty('--dialog-accent', game.accent);
  dialog.querySelector('h2').textContent = game.title;
  dialog.querySelector('.dialog-steps').replaceChildren(...game.steps.map(step => {
    const item = document.createElement('li');
    item.textContent = step;
    return item;
  }));
  dialog.showModal();
}));
dialog.querySelectorAll('.dialog-close,.dialog-ok').forEach(button => button.addEventListener('click', () => dialog.close()));
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener('close', () => dialogTrigger?.focus());

const toast = document.querySelector('.toast');
let toastTimer;
document.querySelectorAll('[data-coming]').forEach(button => button.addEventListener('click', () => {
  toast.querySelector('b').textContent = button.dataset.coming;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 4000);
}));

const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (entry.isIntersecting) entry.target.classList.add('visible');
}), { threshold: .12 });
document.querySelectorAll('.game-card,.promise article').forEach(element => observer.observe(element));
