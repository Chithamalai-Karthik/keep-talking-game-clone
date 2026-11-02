/* ============================================================
   main.js — Runs the Expert manual page
   A page of its own, so it never touches a live bomb: all the
   Expert learns about the bomb comes from the Defuser's voice.
   There is no search or page list on purpose: finding the right
   page under pressure is part of the game.
   ============================================================ */

import { SECTIONS } from './ManualContent.js';

const STYLE_KEY = 'ktane-manual-style';

const pages = document.getElementById('manual-pages');
const styleButtons = document.querySelectorAll('[data-style-choice]');

pages.innerHTML = SECTIONS.map(({ id, title, group, flowsOn, html }, index) => {
  const opensGroup = group !== SECTIONS[index - 1]?.group;
  return `${opensGroup ? `<p class="group-title">${group}</p>` : ''}<section id="${id}"${flowsOn ? ' class="flows-on"' : ''}><h2>${title}</h2>${html}</section>`;
}).join('');

function setStyle(style) {
  document.documentElement.dataset.style = style;
  styleButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.styleChoice === style));
  });
}

// Remembering the style is only a convenience, so it may fail quietly
function savedStyle() {
  try {
    return localStorage.getItem(STYLE_KEY) ?? 'field';
  } catch {
    return 'field';
  }
}

styleButtons.forEach((button) => {
  button.addEventListener('click', () => {
    setStyle(button.dataset.styleChoice);
    try {
      localStorage.setItem(STYLE_KEY, button.dataset.styleChoice);
    } catch {
      // The toggle still works for this visit
    }
  });
});

setStyle(savedStyle());
document.getElementById('manual-print').addEventListener('click', () => window.print());
