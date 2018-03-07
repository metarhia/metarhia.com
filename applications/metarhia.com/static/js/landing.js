'use strict';

const ALPHA_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ALPHA_LOWER = 'abcdefghijklmnopqrstuvwxyz';
const ALPHA = ALPHA_UPPER + ALPHA_LOWER;
const DIGIT = '0123456789';
const CHARS = ALPHA + DIGIT;
const TIME_LINE = 300;
const TIME_CHAR = 20;

const KEY_CODE = {
  BACKSPACE: 8, TAB: 9, ENTER: 13, PAUSE: 19, ESC: 27, SPACE: 32,
  PGUP: 33, PGDN: 34, END: 35, HOME: 36,
  LT: 37, UP: 38, RT: 39, DN: 40, INS: 45, DEL: 46,
  F1: 112, F2: 113, F3: 114, F4: 115, F5: 116, F6: 117,
  F7: 118, F8: 119, F9: 120, F10: 121, F11: 122, F12: 123,
  ACCENT: 192,
};

const KEY_NAME = {};
for (const keyName in KEY_CODE) KEY_NAME[KEY_CODE[keyName]] = keyName;

let controlKeyboard, panelScroll;
let controlInput, controlBrowse, controlScroll;

const ajax = api.ajax({
  command: { post: '/api/landing/command.json' }
});

const random = (min, max) => {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  return min + Math.floor(Math.random() * (max - min + 1));
};

const generateKey = (length, possible) => {
  let key = '';
  for (let i = 0; i < length; i++) {
    key += possible.charAt(random(0, possible.length - 1));
  }
  return key;
};

const generateUnique = () => generateKey(32, CHARS);

const pad = (padChar, length) => new Array(length + 1).join(padChar);

const isMobile = () => (
  navigator.userAgent.match(/Android/i) ||
  navigator.userAgent.match(/webOS/i) ||
  navigator.userAgent.match(/iPhone/i) ||
  navigator.userAgent.match(/iPad/i) ||
  navigator.userAgent.match(/iPod/i) ||
  navigator.userAgent.match(/BlackBerry/i) ||
  navigator.userAgent.match(/Windows Phone/i)
);

let viewportHeight, viewableRatio;
let contentHeight, scrollHeight;
let thumbHeight, thumbPosition;

const refreshScroll = () => {
  viewportHeight = controlBrowse.offsetHeight;
  contentHeight = controlBrowse.scrollHeight;
  viewableRatio = viewportHeight / contentHeight;
  scrollHeight = panelScroll.offsetHeight;
  thumbHeight = scrollHeight * viewableRatio;
  thumbPosition = controlBrowse.scrollTop * thumbHeight / viewportHeight;
  controlScroll.style.top = thumbPosition + 'px';
  controlScroll.style.height = thumbHeight + 'px';
};

const scrollBottom = () => {
  refreshScroll();
  controlBrowse.scrollTop = controlBrowse.scrollHeight;
};

const initScroll = () => {
  controlBrowse.scrollTop = controlBrowse.scrollHeight;
  controlBrowse.addEventListener('scroll', refreshScroll);
  window.addEventListener('orientationchange', () => {
    setTimeout(scrollBottom, 0);
  });
};

const showKeyboard = () => {
  if (!isMobile()) return;
  controlKeyboard.style.display = 'block';
  controlBrowse.style.bottom = controlKeyboard.offsetHeight + 'px';
};

const inputSetValue = (value) => {
  controlInput.inputValue = value;
  if (controlInput.inputType === 'masked') {
    value = pad('*', value.length);
  }
  value = value.replace(/ /g, '&nbsp;');
  controlInput.innerHTML = (
    controlInput.inputPrompt + value + '<span>&block;</span>'
  );
};

const input = (type, prompt, callback) => {
  showKeyboard();
  controlInput.style.display = 'none';
  controlBrowse.removeChild(controlInput);
  controlInput.inputActive = true;
  controlInput.inputPrompt = prompt;
  inputSetValue('');
  controlInput.inputType = type;
  controlInput.inputCallback = callback;
  controlBrowse.appendChild(controlInput);
  controlInput.style.display = 'block';
  setTimeout(scrollBottom, 0);
};

const clear = () => {
  const elements = controlBrowse.children;
  let i, element;
  for (i = elements.length - 2; i > 1; i--) {
    element = elements[i];
    controlBrowse.removeChild(element);
  }
};

const print = (s) => {
  const list = Array.isArray(s);
  let line = list ? s.shift() : s;
  if (!line) line = '';
  const element = document.createElement('div');
  if (!line) line = '\xa0';
  if (line.charAt(0) === '<') {
    element.innerHTML += line;
  } else {
    const timer = setInterval(() => {
      const char = line.charAt(0);
      element.innerHTML += char;
      line = line.substr(1);
      if (!line) clearInterval(timer);
      controlBrowse.scrollTop = controlBrowse.scrollHeight;
      scrollBottom();
    }, TIME_CHAR);
  }
  if (list && s.length) setTimeout(print, TIME_LINE, s);
  controlBrowse.insertBefore(element, controlInput);
  controlBrowse.scrollTop = controlBrowse.scrollHeight;
  scrollBottom();
};

const enterKey = () => {
  input('masked', 'Key: ', (err, key) => {
    ajax.signin({ key }, (err, data) => {
      if (data.result === 'ok') {
        print('You are logged in');
      } else {
        print('Incorect key');
        enterKey();
      }
    });
  });
};

const format = (obj) => {
  let res = '<table><tr><th>Parameter</th><th>Value</th></tr>';
  let key, val;
  for (key in obj) {
    val = obj[key];
    res += '<tr><td>' + key + '</td><td>' + val + '</td></tr>';
  }
  return res + '</table>';
};

const inputKeyboardEvents = {
  ESC() {
    inputSetValue('');
  },
  BACKSPACE() {
    let value = controlInput.inputValue;
    value = value.slice(0, -1);
    inputSetValue(value);
  },
  ENTER() {
    const result = controlInput.inputValue;
    let value = result;
    if (controlInput.inputType === 'masked') {
      value = pad('*', value.length);
    }
    print(controlInput.inputPrompt + value);
    controlInput.style.display = 'none';
    controlInput.inputActive = false;
    controlInput.inputCallback(null, value);
  },
  CAPS() {
    if (controlKeyboard.className === 'caps') {
      controlKeyboard.className = '';
    } else {
      controlKeyboard.className = 'caps';
    }
  },
  KEY(char) { // Alpha or Digit
    if (controlKeyboard.className === 'caps') {
      char = char.toUpperCase();
    }
    let value = controlInput.inputValue;
    value += char;
    inputSetValue(value);
  }
};

const makeKeyboardClick = char => e => {
  char = e.target.inputChar;
  if (char === '_') char = ' ';
  let keyName = 'KEY';
  if (char === '<') keyName = 'BACKSPACE';
  if (char === '>') keyName = 'ENTER';
  if (char === '^') keyName = 'CAPS';
  const fn = inputKeyboardEvents[keyName];
  if (fn) fn(char);
  e.stopPropagation();
  return false;
};

const initKeyboard = () => {
  if (!isMobile()) return;
  controlKeyboard.style.display = 'block';
  const KEYBOARD_LAYOUT = [
    '1234567890',
    'qwertyuiop',
    'asdfghjkl<',
    '^zxcvbnm_>'
  ];
  let i, j, char, keyboardClick;
  let keyboardLine, elementKey, elementLine;
  for (i = 0; i < KEYBOARD_LAYOUT.length; i++) {
    keyboardLine = KEYBOARD_LAYOUT[i];
    elementLine = document.createElement('div');
    controlKeyboard.appendChild(elementLine);
    for (j = 0; j < keyboardLine.length; j++) {
      char = keyboardLine[j];
      if (char === ' ') char = '&nbsp;';
      elementKey = document.createElement('div');
      elementKey.innerHTML = char;
      elementKey.inputChar = char;
      elementKey.className = 'key';
      elementKey.style.opacity = ((i + j) % 2) ? 0.8 : 1;
      keyboardClick = makeKeyboardClick(char);
      elementKey.addEventListener('click', keyboardClick);
      elementLine.appendChild(elementKey);
    }
  }
  controlBrowse.style.bottom = controlKeyboard.offsetHeight + 'px';
};

document.onkeydown = (event) => {
  let keyName, fn;
  if (controlInput.inputActive) {
    keyName = KEY_NAME[event.keyCode];
    fn = inputKeyboardEvents[keyName];
    if (fn) {
      fn();
      return false;
    }
  }
};

document.onkeypress = (e) => {
  if (controlInput.inputActive) {
    const fn = inputKeyboardEvents['KEY'];
    const char = String.fromCharCode(e.keyCode);
    if (CHARS.includes(char) && fn) {
      fn(char);
      return false;
    }
  }
};

const commandLoop = () => {
  input('command', '.', (err, line) => {
    exec(line);
    commandLoop();
  });
};

const commands = {};

const help = [
  '', 'Commands: about, fields, team, links, stack, contacts'
];

function exec(line) {
  const args = line.split(' ');
  const cmd = args.shift();
  ajax.command({ cmd, args }, (err, data) => {
    print(data.response.concat(help));
    commandLoop();
  });
}

api.dom.on('load', () => {
  panelScroll = document.getElementById('panelScroll');
  controlInput = document.getElementById('controlInput');
  controlKeyboard = document.getElementById('controlKeyboard');
  controlBrowse = document.getElementById('controlBrowse');
  controlScroll = document.getElementById('controlScroll');
  initKeyboard();
  initScroll();
  print([
    'Metarhia/KPI is a Research & Development Center',
    'in Kiev Polytechnic Institute (ICT faculty)',
  ].concat(help));
  commandLoop();
});
