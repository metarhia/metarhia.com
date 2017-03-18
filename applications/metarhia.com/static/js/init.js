'use strict';

api.dom.on('load', () => {

  api.dom.addClass(document.body, 'js');
  api.dom.fixCookie('SID');

  const panelCenter = api.dom.id('panel-center');

  const auth = api.ajax({
    regValidation: { post: '/api/auth/regvalidation.json' },
    register:      { post: '/api/auth/register.json' },
    signOut:       { post: '/api/auth/signOut.json' }
  });

  // Auth Module

  api.dom.on('click', '#hmenu-Signin', () => {
    const closePopup = api.dom.popup('#formLogin');
    closePopup.closeElement = api.dom.element('#formLoginCancel');
    return false;
  });

  api.dom.on('click', '#hmenu-Signout', () => {
    auth.signOut({}, (/*err, data*/) => {
      if (localStorage) localStorage.clear();
      window.location.reload(true);
    });
    return false;
  });

  api.dom.on('click', '#hmenu-Register', () => {
    const closePopup = api.dom.popup('#formReg');
    closePopup.closeElement = api.dom.element('#formRegCancel');
    return false;
  });

  api.dom.on('click', '#formRegDo', (/*event*/) => {
    let inputEmail = api.dom.id('formRegEmail'),
        inputPassword = api.dom.id('formRegPassword'),
        regValidation = null,
        data = { email: inputEmail.value };
    auth.regValidation(data, (err, json) => {
      regValidation = json;
      if (regValidation !== null) {
        data.Password = inputPassword.value;
        if (regValidation.email) {
          api.dom.removeClass(inputEmail, 'invalid');
          auth.register(data, (err, data) => {
            if (data.result === 'ok') window.location.reload(true);
          });
        } else {
          api.dom.addClass(inputEmail, 'invalid');
          inputEmail.focus();
        }
      }
    });
    return false;
  });

  api.dom.on('click', '#formLoginSignIn', () => {
    const btn = api.dom.id('formLoginSubmit');
    api.dom.fireEvent(btn, 'click');
  });

  // Left menu

  api.dom.on('click', '#menuAJAX', () => {
    const parameterName = 'paramaterValue';
    api.dom.load('/examples/simple/ajaxTest.ajax?parameterName=' + parameterName, panelCenter);
  });

  api.dom.on('click', '#menuGetJSON', () => {
    const parameterName = 'paramaterValue';
    panelCenter.innerHTML = '<div class="progress"></div>';
    api.ajax.get('/examples/simple/jsonGet.json', { parameterName }, (err, res) => {
      panelCenter.innerHTML = '<pre>' + JSON.stringify(res, null, 2) + '</pre>';
    });
  });

  api.dom.on('click', '#menuPostJSON', () => {
    const parameterName = 'paramaterValue';
    panelCenter.innerHTML = '<div class="progress"></div>';
    api.ajax.post('/examples/simple/jsonPost.json', { parameterName }, (err, res) => {
      panelCenter.innerHTML = '<pre>' + JSON.stringify(res, null, 2) + '</pre>';
    });
  });

  api.dom.on('click', '#menuForkWorker', () => {
    api.ajax.get('/examples/tools/forkWorker.json', () => {
      panelCenter.innerHTML = 'Worker process forked, see console for output.';
    });
  });

  api.dom.on('click', '#menuLongWorker', () => {
    api.ajax.get('/examples/tools/longWorker.json', () => {
      panelCenter.innerHTML = 'Worker process forked and will terminate in 30 seconds, see console for output.';
    });
  });

  api.dom.on('click', '#menuTemplate', () => {
    window.location = '/examples/override';
  });

  api.dom.on('click', '#menuFileUpload', () => {
    api.dom.load('/examples/simple/upload.ajax', panelCenter);
  });

  api.dom.on('click', '#menuDownload', () => {
    panelCenter.innerHTML = '<iframe src="/examples/simple/download.ajax" style="display:none"></iframe>';
  });

  api.dom.on('click', '#menuGeoIP', () => {
    panelCenter.innerHTML = '<div class="progress"></div>';
    api.ajax.get('/examples/tools/geoip.json', (err, res) => {
      panelCenter.innerHTML = '<pre>' + JSON.stringify(res, null, 2) + '</pre>';
    });
  });

  let ws;
  api.dom.on('click', '#menuWS', () => {
    ws = api.ws('/examples/events/connect.ws');

    panelCenter.innerHTML = (
      '<a class="button silver" id="btnWsClose"><span class="icon delete"></span>Close WebSocket connection</a> ' +
      '<a class="button silver" id="btnWsSend"><span class="icon handshake"></span>Send "Hello" to WebSocket</a>' +
      '<hr>Connecting...<hr>'
    );
    const btnWsSend = api.dom.id('btnWsSend');

    ws.on('open', () => {
      panelCenter.insertAdjacentHTML('beforeend', 'Connection opened<hr>');
    });

    ws.on('close', () => {
      panelCenter.insertAdjacentHTML('beforeend', 'Connection closed<hr>');
    });

    ws.on('message', (event) => {
      panelCenter.insertAdjacentHTML('beforeend', 'Message from server: ' + event.data + '<hr>');
    });

    api.dom.on('click', '#btnWsClose', () => {
      ws.close();
      btnWsSend.style.display = 'none';
    });

    api.dom.on('click', '#btnWsSend', () => {
      panelCenter.insertAdjacentHTML('beforeend', 'Sending to server: Hello<hr>');
      ws.send('Hello');
    });
  });

  api.dom.on('click', '#menuSSE', () => {
    panelCenter.innerHTML = (
      '<a class="button silver" id="btnSseClose"><span class="icon delete"></span>Close connection</a> ' +
      '<a class="button silver" id="btnSseSend"><span class="icon handshake"></span>Send event to server</a>' +
      '<hr>Connecting...<hr>'
    );
    sseConnect();
  });

  function sseConnect() {
    const sse = api.sse('/examples/events/connect.sse');
    const btnSseClose = api.dom.id('btnSseClose');

    sse.on('test', (event) => {
      panelCenter.insertAdjacentHTML('beforeend', 'Event: ' + event.type + '; Data: ' + event.data + '<hr>');
    });

    sse.on('open', () => {
      panelCenter.insertAdjacentHTML('beforeend', 'Connection opened<hr>');
    });

    sse.on('error', (event) => {
      if (event.readyState === EventSource.CLOSED) {
        panelCenter.insertAdjacentHTML('beforeend', 'Connection closed by server<hr>');
      } else {
        panelCenter.insertAdjacentHTML('beforeend', 'SSE Error: readyState=' + sse.readyState + '<hr>');
      }
    });

    api.dom.on('click', '#btnSseClose', () => {
      sse.close();
      panelCenter.insertAdjacentHTML('beforeend', 'Connection closed by user<hr>');
      btnSseClose.style.display = 'none';
    });

    api.dom.on('click', '#btnSseSend', () => {
      panelCenter.insertAdjacentHTML('beforeend', 'Sending event to server, it should return back.<hr>');
      api.ajax.get('/examples/events/sendEvent.json');
    });
  }

  api.dom.on('click', '#menuChat', () => {
    panelCenter.innerHTML = (
      '<div id="chatPanel" style="position:relative; height:100%;">' +
        '<div id="chatMessages" style="position:absolute; top:0; bottom:50px; left:0; right:0; overflow-y: scroll; overflow-x: hidden;"></div>' +
        '<div style="position:absolute; bottom:0; left:0; right:0">' +
          '<div style="float:left; width:100px"><input type="text" value="Anonymous" name="chatUserName" class="edit" id="chatUserName" style="width:80px" /></div>' +
          '<div style="float:right; width:130px"><a class="button silver" id="btnChatSend"><span class="icon handshake"></span>Send message</a></div>' +
          '<div style="position:absolute; left:100px; right:150px"><input type="text" value="" name="chatMessage" class="edit" id="chatMessage" style="width:100%" /></div>' +
        '</div>' +
      '</div>'
    );
    chatConnect();
  });

  function chatConnect() {
    let chat = api.sse('/examples/chat/connect.sse'),
        chatMessages = api.dom.id('chatMessages'),
        chatMessage = api.dom.id('chatMessage'),
        chatUserName = api.dom.id('chatUserName');

    chatMessage.focus();

    function msg(s) {
      chatMessages.insertAdjacentHTML('beforeend', '<div>' + s + '<hr></div>');
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    chat.addEventListener('chat', (event) => {
      const data = JSON.parse(event.data);
      msg(data.name + '(' + data.ip + '): ' + data.message);
    });

    chat.addEventListener('open', () => {
      msg('Connected to chat server');
    });

    chat.addEventListener('error', (event) => {
      if (event.readyState === EventSource.CLOSED) msg('Connection closed by server');
      else msg('Error: readyState=' + chat.readyState);
    });

    api.dom.on('click', '#btnChatSend', () => {
      api.ajax.post(
        '/examples/chat/sendMessage.json',
        { name: chatUserName.value, message: chatMessage.value },
        (/*err, res*/) => { }
      );
    });
  }

  api.dom.on('click', '#menuAuth', () => {
    window.location = '/examples/auth';
  });

});
