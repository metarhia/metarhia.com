'use strict';

let controlKeyboard, controlCommand;
let controlInput, controlBrowse, controlScroll;
let ajax, ws, pairingCode, panelScroll, chat;

const METARHIA_VERSION = '0.1.53';
const ALPHA_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const ALPHA_LOWER = 'abcdefghijklmnopqrstuvwxyz';
const ALPHA = ALPHA_UPPER + ALPHA_LOWER;
const DIGIT = '0123456789';
const SYMBOL = '!#$%&()*+,-./:;<=>?@[]^_{|}~';
const ALPHA_DIGIT = ALPHA + DIGIT;
const SPACE = ' ';
const CHARS = ALPHA_DIGIT + SYMBOL + SPACE;

// 4 bytes reserved for offset
const FILE_CHUNK_SIZE = 64 * 1024 - 4;

api.dom.on('load', () => {
  //screenConsole = document.getElementById('screenConsole');
  //panelConsole = document.getElementById('panelConsole');
  panelScroll = document.getElementById('panelScroll');
  controlInput = document.getElementById('controlInput');
  controlKeyboard = document.getElementById('controlKeyboard');
  controlCommand = document.getElementById('controlCommand');
  controlBrowse = document.getElementById('controlBrowse');
  //controlBrowseSpacer = document.getElementById('controlBrowseSpacer');
  controlScroll = document.getElementById('controlScroll');
  initKeyboard();
  initCommand();
  initScroll();
  print('Metarhia console v' + METARHIA_VERSION);
  ajax = api.ajax({
    signin: { post: '/api/metarhia/signin.json' },
    pair: { post: '/api/metarhia/pair.json' }
  });
  initStorage();
  initConnection();
});

function initConnection() {
  if (ws) ws.close();
  ws = api.ws('/api/console/connect.ws');
  ws.on('close', initConnection);
  ws.on('message', (event) => {
    let data = event.data;
    if (typeof(data) === 'string') {
      data = JSON.parse(data);
    }
    const once = ws.once;
    if (once) {
      ws.once = null;
      return once(data);
    }
    if (ws.receive) ws.receive(data);
  });
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
    if (controlInput.inputType === 'masked') value = pad('*', value.length);
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

function makeKeyboardClick(char) {
  return (e) => {
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
}

function initKeyboard() {
  if (!isMobile()) return;
  controlCommand.style.display = 'none';
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
}

function showKeyboard() {
  if (!isMobile()) return;
  controlCommand.style.display = 'none';
  controlKeyboard.style.display = 'block';
  controlBrowse.style.bottom = controlKeyboard.offsetHeight + 'px';
}

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

document.onkeydown = function(/*e*/) {
  //console.log(
  //  'onkeydown keyCode: ' + e.keyCode +
  //  ' char: ' + String.fromCharCode(e.keyCode) +
  //  ' which: ' + e.which + ' charCode: ' + e.charCode
  //);
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

document.onkeypress = function(e) {
  if (controlInput.inputActive) {
    const fn = inputKeyboardEvents['KEY'];
    const char = String.fromCharCode(e.keyCode);
    if (CHARS.includes(char) && fn) {
      fn(char);
      return false;
    }
  }
};

let viewportHeight, viewableRatio;
let contentHeight, scrollHeight;
let thumbHeight, thumbPosition;

function initScroll() {
  //controlBrowseSpacer.style.height = controlBrowse.offsetHeight + 'px';
  controlBrowse.scrollTop = controlBrowse.scrollHeight;
  controlBrowse.addEventListener('scroll', refreshScroll);
  window.addEventListener('orientationchange', () => {
    setTimeout(scrollBottom, 0);
  });
}

function refreshScroll(/*e*/) {
  viewportHeight = controlBrowse.offsetHeight;
  contentHeight = controlBrowse.scrollHeight;
  viewableRatio = viewportHeight / contentHeight;
  scrollHeight = panelScroll.offsetHeight;
  thumbHeight = scrollHeight * viewableRatio;
  thumbPosition = controlBrowse.scrollTop * thumbHeight / viewportHeight;
  controlScroll.style.top = thumbPosition + 'px';
  controlScroll.style.height = thumbHeight + 'px';
}

function scrollBottom() {
  refreshScroll();
  controlBrowse.scrollTop = controlBrowse.scrollHeight;
}

function isMobile() {
  return (
    navigator.userAgent.match(/Android/i) ||
    navigator.userAgent.match(/webOS/i) ||
    navigator.userAgent.match(/iPhone/i) ||
    navigator.userAgent.match(/iPad/i) ||
    navigator.userAgent.match(/iPod/i) ||
    navigator.userAgent.match(/BlackBerry/i) ||
    navigator.userAgent.match(/Windows Phone/i)
  );
}

const commandList = {
  clear() {
    clear();
    //controlBrowse.scrollTop = controlBrowse.scrollHeight;
    scrollBottom();
  },
  upload() {
    exec('upload');
  },
  download() {
    input('command', 'download ', (err, key) => {
      exec('download ' + key);
    });
  },
  who() {
    exec('who');
  },
  chat() {
    input('room', 'chat ', (err, key) => {
      exec('chat ' + key);
    });
  }
};

function initCommand() {
  controlKeyboard.style.display = 'none';
  controlCommand.style.display = 'block';
  const buttons = Object.keys(commandList);
  let i, button, elementButton;
  for (i = 0; i < buttons.length; i++) {
    button = buttons[i];
    elementButton = document.createElement('div');
    controlCommand.appendChild(elementButton);
    elementButton.innerHTML = button;
    elementButton.buttonName = button;
    elementButton.className = 'button';
    elementButton.style.backgroundColor = (i % 2) ? '#262626' : '#161616';
    elementButton.addEventListener('click', (e) => {
      const button = e.target.buttonName;
      const fn = commandList[button];
      if (fn) fn();
      e.stopPropagation();
      return false;
    });
  }
  controlBrowse.style.bottom = controlCommand.offsetHeight + 'px';
}

function showCommand() {
  controlKeyboard.style.display = 'none';
  controlCommand.style.display = 'block';
  controlBrowse.style.bottom = controlCommand.offsetHeight + 'px';
}

function initStorage() {
  if (!window.localStorage) {
    print('Local storage is not available.<br>Unsupported device.');
  } else {
    if (localStorage['meta.ver']) {
      localStorage['meta.ver'] = METARHIA_VERSION;
      const lastActivity = new Date(parseInt(localStorage['meta.last'], 10));
      print(
        'Local storage found<br>Last activity: ' + lastActivity.toUTCString()
      );
      if (localStorage['meta.id']) {
        //print('System ready');
      } else {
        localStorage['meta.id'] = generateUnique();
        print('New id generated');
      }
    } else {
      print('Local storage initialization...');
      localStorage['meta.ver'] = METARHIA_VERSION;
      localStorage['meta.id'] = generateUnique();
      print('New id generated');
      enterKey();
    }
    localStorage['meta.last'] = (new Date()).getTime();
  }
}

function enterKey() {
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
}

function clear() {
  const elements = controlBrowse.children;
  let i, element;
  for (i = elements.length - 1; i > 1 ; i--) {
    element = elements[i];
    //if (element.id === '') {
    controlBrowse.removeChild(element);
    //}
  }
}

function print(s) {
  const element = document.createElement('div');
  element.innerHTML = s;
  controlBrowse.insertBefore(element, controlInput);
  controlBrowse.scrollTop = controlBrowse.scrollHeight;
  scrollBottom();
}

function input(type, prompt, callback) {
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
}

function inputSetValue(value) {
  controlInput.inputValue = value;
  if (controlInput.inputType === 'masked') {
    value = pad('*', value.length);
  }
  value = value.replace(/ /g, '&nbsp;');
  controlInput.innerHTML = (
    controlInput.inputPrompt + value + '<span>&block;</span>'
  );
}

/*
let objGeoLocation = 'not detected';
navigator.geolocation.getCurrentPosition((position) => {
  objGeoLocation = JSON.stringify(position.coords);
  const crd = position.coords;
  //console.log('Your current position is:');
  //console.log('Latitude : ' + crd.latitude);
  //console.log('Longitude: ' + crd.longitude);
  //console.log('More or less ' + crd.accuracy + ' meters.');
}, (err) => {
  //console.warn('ERROR(' + err.code + '): ' + err.message);
}, {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0
});

let battery;

function batterySuccess(batteryManager) {
  battery = batteryManager;
  battery.addEventListener('chargingchange', updatedBatteryStats);
  battery.addEventListener('chargingtimechange', updatedBatteryStats);
  battery.addEventListener('dischargingtimechange', updatedBatteryStats);
  battery.addEventListener('levelchange', updatedBatteryStats);
  updatedBatteryStats();
}

function batteryFailure() {
  console.log('Battery status error');
}

function updatedBatteryStats() {
  // Example data in window.battery:
  //   BatteryManager
  //     charging: false
  //     chargingTime: Infinity
  //     dischargingTime: 12600
  //     level: 0.56
  //     onchargingchange: null
  //     onchargingtimechange: null
  //     ondischargingtimechange: null
  //     onlevelchange: null
}

if ('getBattery' in navigator) {
  navigator.getBattery().then(batterySuccess, batteryFailure);
} else {
  // API is not supported, fail gracefully.
}
*/

function format(obj) {
  let key, val, res = '<table><tr><th>Parameter</th><th>Value</th></tr>';
  for (key in obj) {
    val = obj[key];
    res += '<tr><td>' + key + '</td><td>' + val + '</td></tr>';
  }
  return res + '</table>';
}

const commands = {
  who() {
    print('id: ' + localStorage['meta.id']);
    commandLoop();
  },
  info() {
    print(format({
      agent: navigator.userAgent,
      appName: navigator.appName,
      appVersion: navigator.appVersion,
      appCodeName: navigator.appCodeName,
      cookieEnabled: navigator.cookieEnabled,
      platform: navigator.platform,
      systemLanguage: navigator.systemLanguage,
      vendorSub: navigator.vendorSub,
      productSub: navigator.productSub,
      vendor: navigator.vendor,
      maxTouchPoints: navigator.maxTouchPoints,
      hardwareConcurrency: navigator.hardwareConcurrency,
      product: navigator.product,
      languages: navigator.languages,
      onLine: navigator.onLine,
      geolocation: objGeoLocation,
      charging: battery.charging,
      chargingTime: battery.chargingTime,
      dischargingTime: battery.dischargingTime,
      level: battery.level
    }));
    commandLoop();
  },
  upload() {
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
      function uploadNext() {
        const file = files[i];
        print(file.name + ' ' + file.size);
        uploadFile(file, () => {
          print(file.name + ' - upload complete');
          i++;
          if (i < files.length) {
            return uploadNext();
          }
          document.body.removeChild(element);
          commandLoop();
        });
      }
      uploadNext();
    };
  },
  download(command) {
    print('Downloading');
    const file = command[1];
    downloadFile(file, commandLoop);
  },
  info() {
    print(
      '<table>' +
      '<tr><th>Category</th><th>Items</th><th>Size</th><th>Owner</th></tr>' +
      '<tr><td>Food</td><td>107</td><td>1Mb</td><td>44sdfIQi</td></tr>' +
      '<tr><td>Health</td><td>75</td><td>3Mb</td><td>f3PeAj01</td></tr>' +
      '<tr><td>Energy</td><td>4</td><td>2Mb</td><td>44sdfIQi</td></tr>' +
      '<tr><td>Learning</td><td>352</td><td>1Mb</td><td>f3PeAj01</td></tr>' +
      '<tr><td>Services</td><td>101</td><td>1Mb</td><td>44sdfIQi</td></tr>' +
      '<tr><td>Goods</td><td>219</td><td>5Mb</td><td>f3PeAj01</td></tr>' +
      '</table>'
    );
    commandLoop();
  },
  set(command) {
    ajax.set({ key: command[1], value: command[2] }, (/*err, data*/) => {
      commandLoop();
    });
  },
  get(command) {
    ajax.get({ key: command[1] }, (/*err, data*/) => {
      print('id: ' + localStorage['meta.id']);
      commandLoop();
    });
  },
  pair() {
    pairingCode = generateKey(4, DIGIT);
    print('Pairing code: ' + pairingCode);
    input('command', 'Other device pairing code:', (err, pcode) => {
      const pairData = {
        local: pairingCode,
        remote: pcode,
        id: localStorage['meta.id']
      };
      ajax.pair(pairData, (err, data) => {
        if (data.result === 'wait') {
          print('Waiting...');
          setTimeout(() => {
            const pairData = {
              local: pairingCode,
              remote: pcode,
              id: localStorage['meta.id']
            };
            ajax.pair(pairData, (err, data) => {
              if (data.result === 'wait') {
                print('Incorrect pairing code');
                commandLoop();
              } else if (data.result === 'correct') {
                localStorage['meta.id'] = data.id;
                print('Devices paired');
                commandLoop();
              }
            });
          }, 30000);
        } else if (data.result === 'correct') {
          localStorage['meta.id'] = data.id;
          print('Devices paired');
          commandLoop();
        }
      });
    });
  },
  chat(command) {
    chat = { room: command[1] || generateKey(4, DIGIT) };
    print('Chat room: ' + chat.room);
    ws.send(JSON.stringify(chat));
    ws.receive = (res) => print(res.chat);
    chatLoop();
  }
};

function chatLoop() {
  input('message', '>', (err, line) => {
    ws.send(JSON.stringify({ chat: line }));
    if (line === 'bye') print('Room closed');
    else chatLoop();
  });
}

function commandLoop() {
  /*input('command', '.', (err, line) => {
    exec(line);
    commandLoop();
  });*/
}

function exec(line) {
  //print(line);
  const command = line.split(' ');
  const cmd = command[0];
  const fn = commands[cmd];
  if (fn) fn(command);
  else print('command not found');
  return !!fn;
}

function generateUnique() {
  return generateKey(32, CHARS);
}

function generateKey(length, possible) {
  let key = '';
  for (let i = 0; i < length; i++) {
    key += possible.charAt(random(0, possible.length - 1));
  }
  return key;
}

function random(min, max) {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  return min + Math.floor(Math.random() * (max - min + 1));
}

function pad(padChar, length) {
  return new Array(length + 1).join(padChar);
}

function isUploadSupported() {
  return typeof(new XMLHttpRequest().upload) !== 'undefined';
}

function uploadFile(file, done) {
  ws.once = (res) => {
    print('Code: ' + res.code);
    done();
  }
  const req = { upload: file.size };
  ws.send(JSON.stringify(req));
  let chunkOffset = 0;
  const chunkOffsetBinary = new ArrayBuffer(4);
  const chunkOffsetDataView = new DataView(chunkOffsetBinary);
  const fileSend = setInterval(() => {
    if (ws.socket.bufferedAmount === 0) {
      if (file.size === 0) {
        clearInterval(fileSend);
        ws.send(JSON.stringify({ uploadEnd: true }));
        return;
      }
      const fileChunk = file.slice(0, FILE_CHUNK_SIZE);
      chunkOffsetDataView.setUint32(0, chunkOffset);
      const toSend = new Blob([chunkOffsetBinary, fileChunk]);
      ws.send(toSend);
      chunkOffset += fileChunk.size;
      file = file.slice(FILE_CHUNK_SIZE);
    }
  }, 50);
};

function downloadFile(file, done) {
  const req = { download: file };
  ws.once = (res) => {
    if (res.file === 'error') {
      print('File not found');
      done();
    } else {
      ws.once = (res) => {
        const blob = new Blob(
          [res], { type: 'application/octet-binary' }
        );
        const a = document.createElement('a');
        a.style = 'display: none';
        document.body.appendChild(a);
        const href = window.URL.createObjectURL(blob);
        a.href = href;
        a.download = file;
        a.click();
        window.URL.revokeObjectURL(href);
        print('Download complete');
        done();
      };
    }
  };
  ws.send(JSON.stringify(req));
};
