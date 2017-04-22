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
      }
    });
  }
  callback();
}
