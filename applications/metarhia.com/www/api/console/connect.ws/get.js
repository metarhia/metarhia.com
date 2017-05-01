(client, callback) => {
  const connection = client.websocket.accept();
  if (connection) {
    let id, room, me, pal, data, buf;
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
          buf = Buffer.allocUnsafe(data.upload);
          isUploading = true;
        } else if (data.uploadEnd) {
          const ALPHA_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
          const ALPHA_LOWER = 'abcdefghijklmnopqrstuvwxyz';
          const ALPHA = ALPHA_UPPER + ALPHA_LOWER;
          const DIGIT = '0123456789';
          const ALPHA_DIGIT = ALPHA + DIGIT;
          const folder1 = api.common.generateKey(2, DIGIT);
          const folder2 = api.common.generateKey(2, DIGIT);
          const code = api.common.generateKey(8, ALPHA_DIGIT);
          const targetDir = application.dir + '/files/' + folder1 + '/' + folder2;
          const downloadCode = folder1 + folder2 + code;
          const fileName = targetDir + '/' + code;
          isUploading = false;
          api.mkdirp(targetDir, () => {
            api.fs.writeFile(fileName, buf, (err) => {
              connection.send(JSON.stringify({ code: downloadCode }));
            });
          });
        }
      } else if (message.type === 'binary') {
        if (isUploading) {
          const offset = message.binaryData.readUInt32BE(0);
          message.binaryData.copy(buf, offset, 4);
        }
      }
    });
  }
  callback();
}
