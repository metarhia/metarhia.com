(client, callback) => {
  const connection = client.websocket.accept();
  if (connection) {
    let id, room, me, pal, data, buf, out, readyToRead, readEnded = false;
    let isUploading = false;
    application.rooms = application.rooms || {};
    connection.on('message', (message) => {
      if (message.type === 'utf8') {
        data = JSON.parse(message.utf8Data);
        if (data.room) {
          id = data.room;
          room = application.rooms[id] || { connections: [] };
          me = room.connections.length;
          if (me < 2) {
            room.connections.push(connection);
            application.rooms[id] = room;
          }
        } else if (room && data.chat) {
          if (room.connections.length === 2) {
            if (!pal) pal = room.connections[me > 0 ? 0 : 1];
            pal.send(JSON.stringify({ chat: data.chat}));
          }
        } else if (data.download) {
          const name = data.download;
          if (!name) connection.send({ error: 'file not found' });
          const prefix1 = name.slice(0, 2);
          const prefix2 = name.slice(2, 4);
          const fileName = name.slice(4);
          const filePath = (
            application.dir + '/files/' +
            prefix1 + '/' + prefix2 + '/' + fileName
          );
          api.fs.readFile(filePath, (err, data) => {
            if (err) {
              connection.send(JSON.stringify({ file: 'error' }));
            } else {
              connection.send(JSON.stringify({ file: data.file }));
              connection.send(data);
              api.fs.unlink(filePath, () => {});
            }
          });
        } else if (data.upload) {
          buf = null;
          out = new api.stream.Readable({
            read() {
              readyToRead = !buf;
              if (buf) {
                readEnded = this.push(buf);
                buf = null;
              }
            },
          });
          isUploading = true;
          api.files.uploadFile({ inp: out, timeout: 0 }, (_, downloadCode) => {
            connection.send(JSON.stringify({ code: downloadCode }));
          });
        } else if (data.uploadEnd) {
          if (!readEnded) {
            if (readyToRead) {
              out.push(null);
            } else {
              out._read = ((buf) => function() {
                this.push(buf);
                this.push(null);
              })(buf);
            }
          }
        }
      } else if (message.type === 'binary') {
        if (isUploading && !readEnded) {
          const newChunk = message.binaryData.slice(4);
          if (buf) {
            buf = Buffer.concat([buf, newChunk]);
          } else {
            if (readyToRead) {
              out.push(newChunk);
            } else {
              buf = newChunk;
            }
          }
        }
      }
    });
  }
  callback();
}
