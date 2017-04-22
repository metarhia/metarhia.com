(client, callback) => {
  const connection = client.websocket.accept();
  if (connection) {
    let id, room, me, pal, data;
    application.rooms = application.rooms || {};
    connection.on('message', (message) => {
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
      }
    });
  }
  callback();
}
