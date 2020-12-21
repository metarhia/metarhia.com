import { Metacom } from './metacom.js';

const protocol = location.protocol === 'http:' ? 'ws' : 'wss';
const metacom = Metacom.create(`${protocol}://${location.host}/api`);
const { api } = metacom;
window.metacom = metacom;
window.api = api;

const ALPHA_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ALPHA_LOWER = 'abcdefghijklmnopqrstuvwxyz';
const ALPHA = ALPHA_UPPER + ALPHA_LOWER;
const DIGIT = '0123456789';
const CHARS = ALPHA + DIGIT;
const TIME_CHAR = 5;

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

const pad = (padChar, length) => new Array(length + 1).join(padChar);

const { userAgent } = navigator;

const isMobile = () => (
  userAgent.match(/Android/i) ||
  userAgent.match(/webOS/i) ||
  userAgent.match(/iPhone/i) ||
  userAgent.match(/iPad/i) ||
  userAgent.match(/iPod/i) ||
  userAgent.match(/BlackBerry/i) ||
  userAgent.match(/Windows Phone/i)
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

const inputSetValue = value => {
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
  for (let i = elements.length - 2; i > 1; i--) {
    const element = elements[i];
    controlBrowse.removeChild(element);
  }
};

const sleep = (msec) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, msec);
  });

const followLink = async (event) => {
  const name = event.target.getAttribute('data-link').slice(0, -3);
  const { text } = await api.console.content({ name });
  print(text);
};

const print = async (text = '') => {
  const element = document.createElement('div');
  controlBrowse.insertBefore(element, controlInput);
  let i = 0;
  while (i < text.length) {
    const char = text.charAt(i);
    i++;
    if (char === '\n') {
      element.innerHTML += '<br/>';
    } else if (char === '#' && i === 1) {
      const titleEnd = text.indexOf('\n');
      document.title = text.substring(i, titleEnd);
      i = titleEnd + 1;
    } else if (char === '[') {
      const labelEnd = text.indexOf(']', i);
      const linkEnd = text.indexOf(')', i);
      const label = text.substring(i, labelEnd);
      const link = text.substring(labelEnd + 2, linkEnd);
      element.innerHTML += `<a data-link="${link}">${label}</a>`;
      i = linkEnd + 1;
    } else {
      element.innerHTML += char;
    }
    await sleep(TIME_CHAR);
    controlBrowse.scrollTop = controlBrowse.scrollHeight;
    scrollBottom();
  }
  const links = element.querySelectorAll('a');
  for (const link of links) {
    link.onclick = followLink;
  }
};

const inputKeyboardEvents = {
  ESC() {
    clear();
    inputSetValue('');
  },
  BACKSPACE() {
    inputSetValue(controlInput.inputValue.slice(0, -1));
  },
  ENTER() {
    let value = controlInput.inputValue;
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
    inputSetValue(controlInput.inputValue + char);
  }
};

const keyboardClick = e => {
  let char = e.target.inputChar;
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
  for (let i = 0; i < KEYBOARD_LAYOUT.length; i++) {
    const keyboardLine = KEYBOARD_LAYOUT[i];
    const elementLine = document.createElement('div');
    controlKeyboard.appendChild(elementLine);
    for (let j = 0; j < keyboardLine.length; j++) {
      let char = keyboardLine[j];
      if (char === ' ') char = '&nbsp;';
      const elementKey = document.createElement('div');
      elementKey.innerHTML = char;
      elementKey.inputChar = char;
      elementKey.className = 'key';
      elementKey.style.opacity = ((i + j) % 2) ? 0.8 : 1;
      elementKey.addEventListener('click', keyboardClick);
      elementLine.appendChild(elementKey);
    }
  }
  controlBrowse.style.bottom = controlKeyboard.offsetHeight + 'px';
};

document.onkeydown = event => {
  if (controlInput.inputActive) {
    const keyName = KEY_NAME[event.keyCode];
    const fn = inputKeyboardEvents[keyName];
    if (fn) {
      fn();
      return false;
    }
  }
};

document.onkeypress = event => {
  if (controlInput.inputActive) {
    const fn = inputKeyboardEvents['KEY'];
    const char = String.fromCharCode(event.keyCode);
    if (CHARS.includes(char) && fn) {
      fn(char);
      return false;
    }
  }
};

const blobToBase64 = blob => {
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  return new Promise(resolve => {
    reader.onloadend = () => {
      resolve(reader.result);
    };
  });
};

const uploadFile = (file, done) => {
  blobToBase64(file)
    .then(url => {
      const data = url.substring(url.indexOf(',') + 1);
      api.example.uploadFile({ name: file.name, data }).then(done);
    });
};

const saveFile = (fileName, blob) => {
  const a = document.createElement('a');
  a.style.display = 'none';
  document.body.appendChild(a);
  const url = window.URL.createObjectURL(blob);
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
};

const upload = () => {
  const element = document.createElement('form');
  element.style.visibility = 'hidden';
  element.innerHTML = '<input id="fileSelect" type="file" multiple />';
  document.body.appendChild(element);
  const fileSelect = document.getElementById('fileSelect');
  fileSelect.click();
  fileSelect.onchange = () => {
    const files = Array.from(fileSelect.files);
    print('Uploading ' + files.length + ' file(s)');
    files.sort((a, b) => a.size - b.size);
    let i = 0;
    const uploadNext = () => {
      const file = files[i];
      uploadFile(file, () => {
        print(`name: ${file.name}, size: ${file.size} done`);
        i++;
        if (i < files.length) {
          return uploadNext();
        }
        document.body.removeChild(element);
        commandLoop();
      });
    };
    uploadNext();
  };
};

const exec = async line => {
  const args = line.split(' ');
  if (args[0] === 'upload') {
    upload();
  } else if (args[0] === 'download') {
    const packet = await api.example.downloadFile();
  } else if (args[0] === 'counter') {
    const packet = await api.example.counter();
    print(`counter: ${packet.result}`);
  } else {
    const data = await api.cms.content(args);
    print(data);
  }
  commandLoop();
};

function commandLoop() {
  input('command', '.', (err, line) => {
    exec(line);
    commandLoop();
  });
}

window.addEventListener('load', async () => {
  panelScroll = document.getElementById('panelScroll');
  controlInput = document.getElementById('controlInput');
  controlKeyboard = document.getElementById('controlKeyboard');
  controlBrowse = document.getElementById('controlBrowse');
  controlScroll = document.getElementById('controlScroll');
  initKeyboard();
  initScroll();
  await metacom.load('console');
  const { text } = await api.console.content({ name: 'home' });
  print(text);
  commandLoop();
});
