import './sentence-engine.css';
import './mobile.css';
import './final-polish.css';

const TASKS = {
  1: [
    { sentence: 'She is happy.', parts: ['She', 'is', 'happy'], extras: ['He'], label: 'Счастливая девочка' },
    { sentence: 'The cat is small.', parts: ['The cat', 'is', 'small'], extras: ['big'], label: 'Маленький кот' },
    { sentence: 'This is my book.', parts: ['This', 'is', 'my', 'book'], extras: ['ball'], label: 'Моя книга' },
    { sentence: 'The dog is big.', parts: ['The dog', 'is', 'big'], extras: ['small'], label: 'Большая собака' },
    { sentence: 'He is sad.', parts: ['He', 'is', 'sad'], extras: ['She'], label: 'Грустный мальчик' },
    { sentence: 'This is a ball.', parts: ['This', 'is', 'a', 'ball'], extras: ['book'], label: 'Красный мяч' }
  ],
  2: [
    { sentence: 'I have got a red ball.', parts: ['I', 'have got', 'a', 'red', 'ball'], extras: ['blue', 'dog'], label: 'Красный мяч' },
    { sentence: 'He has got a blue bike.', parts: ['He', 'has got', 'a', 'blue', 'bike'], extras: ['She'], label: 'Синий велосипед' },
    { sentence: 'She has got a small dog.', parts: ['She', 'has got', 'a', 'small', 'dog'], extras: ['big', 'cat'], label: 'Маленькая собака' },
    { sentence: 'I have got a blue train.', parts: ['I', 'have got', 'a', 'blue', 'train'], extras: ['red', 'ball'], label: 'Синий поезд' },
    { sentence: 'He has got a red train.', parts: ['He', 'has got', 'a', 'red', 'train'], extras: ['bike'], label: 'Красный поезд' },
    { sentence: 'She has got a green book.', parts: ['She', 'has got', 'a', 'green', 'book'], extras: ['ball', 'blue'], label: 'Зелёная книга' }
  ],
  3: [
    { sentence: 'I have got a blue bike.', parts: ['I', 'have got', 'a', 'blue', 'bike'], extras: ['red', 'train'], label: 'Собери услышанное предложение' },
    { sentence: 'She has got a red ball.', parts: ['She', 'has got', 'a', 'red', 'ball'], extras: ['He', 'blue'], label: 'Собери услышанное предложение' },
    { sentence: 'He has got a small dog.', parts: ['He', 'has got', 'a', 'small', 'dog'], extras: ['She', 'big'], label: 'Собери услышанное предложение' },
    { sentence: 'This is my green book.', parts: ['This', 'is', 'my', 'green', 'book'], extras: ['blue', 'ball'], label: 'Собери услышанное предложение' },
    { sentence: 'I have got a toy train.', parts: ['I', 'have got', 'a', 'toy', 'train'], extras: ['bike', 'red'], label: 'Собери услышанное предложение' },
    { sentence: 'He has got a brown horse.', parts: ['He', 'has got', 'a', 'brown', 'horse'], extras: ['dog', 'green'], label: 'Собери услышанное предложение' }
  ]
};

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const screens = Object.fromEntries($$('[data-screen]').map(screen => [screen.dataset.screen, screen]));
const shuffle = items => [...items].sort(() => Math.random() - .5);
const state = { level: 1, task: 0, energy: 10, score: 0, errors: 0, selected: [], tileOrder: [], locked: false, muted: false };

function show(name) {
  Object.values(screens).forEach(screen => screen.classList.remove('active'));
  screens[name].classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function tone(type) {
  if (state.muted) return;
  const Context = window.AudioContext || window.webkitAudioContext;
  if (!Context) return;
  const context = tone.context ||= new Context();
  const notes = { click: [440, .05], tile: [520, .08], good: [720, .22], bad: [190, .18], gear: [280, .16], launch: [180, 1.3] };
  const [frequency, duration] = notes[type];
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type === 'launch' ? 'sawtooth' : 'triangle';
  oscillator.frequency.setValueAtTime(frequency, context.currentTime);
  if (type === 'launch') oscillator.frequency.exponentialRampToValueAtTime(520, context.currentTime + duration);
  gain.gain.setValueAtTime(type === 'launch' ? .07 : .09, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(); oscillator.stop(context.currentTime + duration);
}

function speak() {
  if (state.muted || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(TASKS[state.level][state.task].sentence);
  utterance.lang = 'en-GB'; utterance.rate = .76; utterance.pitch = 1.03;
  const voice = speechSynthesis.getVoices().find(item => item.lang.toLowerCase().startsWith('en-gb'));
  if (voice) utterance.voice = voice;
  speechSynthesis.speak(utterance);
}

function startGame() {
  Object.assign(state, { task: 0, energy: 10, score: 0, errors: 0, selected: [], locked: false });
  $$('.repair-nodes i').forEach(node => node.className = '');
  $('.machine-stage').classList.remove('running', 'pulse');
  show('play'); renderTask();
}

function renderTask() {
  const task = TASKS[state.level][state.task];
  state.selected = []; state.locked = false;
  state.tileOrder = shuffle([...task.parts, ...task.extras].map((text, index) => ({ text, id: `${state.task}-${index}-${text}` })));
  $('.step').textContent = state.task + 1;
  $('.hud-level').textContent = `Level ${state.level}`;
  $('.task-label').textContent = state.level === 3 ? 'Listen & Build' : 'Собери предложение';
  $('.listening-note').hidden = state.level !== 3;
  $('.listen-button').hidden = state.level !== 3;
  const art = $('.situation-art');
  art.style.backgroundImage = `url('${import.meta.env.BASE_URL}images/sentence-scenes-level${state.level}.png')`;
  art.style.backgroundPosition = `${(state.task % 3) * 50}% ${state.task < 3 ? 0 : 100}%`;
  art.setAttribute('aria-label', task.label);
  $('.feedback').textContent = state.level === 3 ? 'Нажми «Послушать» и собери фразу.' : 'Нажимай на слова по порядку.';
  $('.feedback').className = 'feedback';
  renderBuilder(); updateHud();
}

function renderBuilder() {
  const task = TASKS[state.level][state.task];
  const slots = $('.sentence-slots');
  slots.replaceChildren();
  task.parts.forEach((_, index) => {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'sentence-slot';
    button.textContent = state.selected[index]?.text || `${index + 1}`;
    button.disabled = !state.selected[index] || state.locked;
    button.setAttribute('aria-label', state.selected[index] ? `Убрать слово ${state.selected[index].text}` : `Пустое место ${index + 1}`);
    button.onclick = () => { state.selected.splice(index, 1); tone('tile'); renderBuilder(); };
    slots.append(button);
  });
  const bank = $('.word-bank'); bank.replaceChildren();
  state.tileOrder.forEach(tile => {
    const used = state.selected.some(item => item.id === tile.id);
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'word-tile'; button.textContent = tile.text;
    button.disabled = used || state.locked || state.selected.length >= task.parts.length;
    button.onclick = () => { state.selected.push(tile); tone('tile'); renderBuilder(); };
    bank.append(button);
  });
  $('.check-answer').disabled = state.locked || state.selected.length !== task.parts.length;
  $('.reset-answer').disabled = state.locked || !state.selected.length;
}

function checkAnswer() {
  if (state.locked) return;
  const task = TASKS[state.level][state.task];
  const correct = state.selected.every((tile, index) => tile.text === task.parts[index]);
  if (!correct) {
    state.errors++; state.energy = Math.max(0, state.energy - 5);
    $('.sentence-workbench').classList.remove('answer-shake'); void $('.sentence-workbench').offsetWidth;
    $('.sentence-workbench').classList.add('answer-shake');
    $('.feedback').textContent = 'Почти! Проверь порядок и попробуй ещё раз.';
    $('.feedback').className = 'feedback bad'; tone('bad'); updateHud(); return;
  }
  state.locked = true; state.score += Math.max(50, 100 - state.errors * 5); state.energy = Math.min(100, state.energy + 15);
  $$('.repair-nodes i')[state.task].classList.add('fixed');
  $('.machine-stage').classList.add('pulse');
  $('.feedback').textContent = `Верно: ${task.sentence}`;
  $('.feedback').className = 'feedback good'; tone('good'); updateHud(); renderBuilder();
  setTimeout(() => {
    $('.machine-stage').classList.remove('pulse'); state.task++;
    if (state.task === 6) showLaunch(); else renderTask();
  }, 1250);
}

function updateHud() {
  $('.points').textContent = state.score;
  $('.energy-meter i').style.width = `${state.energy}%`;
  $('.energy-meter').setAttribute('aria-valuenow', state.energy);
  $('.energy-value').textContent = `${state.energy}%`;
}

function showLaunch() { speechSynthesis?.cancel?.(); show('launch'); }

function launchMachine() {
  const box = $('.launch-box');
  if (box.classList.contains('starting')) return;
  box.classList.add('starting'); tone('launch');
  setTimeout(() => {
    box.classList.remove('starting');
    $('.result-label').textContent = `Level ${state.level}`;
    $('.result-correct').textContent = '6'; $('.result-errors').textContent = state.errors; $('.result-score').textContent = state.score;
    const stars = state.errors <= 1 ? 3 : state.errors <= 4 ? 2 : 1;
    $$('.result-stars i').forEach((star, index) => star.classList.toggle('dim', index >= stars));
    show('result'); tone('good');
  }, 1900);
}

$$('[data-go]').forEach(button => button.onclick = () => show(button.dataset.go));
$$('[data-level]').forEach(button => button.onclick = () => { state.level = Number(button.dataset.level); startGame(); });
$('.check-answer').onclick = checkAnswer;
$('.reset-answer').onclick = () => { state.selected = []; tone('click'); renderBuilder(); };
$('.listen-button').onclick = speak;
$('.start-lever').onclick = launchMachine;
$('.repeat').onclick = startGame;
$('.another-level').onclick = () => show('levels');
$('.help-open').onclick = () => $('dialog').showModal();
$$('.dialog-close,.dialog-ok').forEach(button => button.onclick = () => $('dialog').close());
$('.sound-button').onclick = () => { state.muted = !state.muted; speechSynthesis?.cancel?.(); $('.sound-button').classList.toggle('muted', state.muted); };
document.addEventListener('click', event => { if (event.target.closest('button') && !event.target.closest('.word-tile,.sentence-slot,.sound-button,.listen-button,.check-answer,.start-lever')) tone('click'); });
