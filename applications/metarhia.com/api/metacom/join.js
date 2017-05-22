(room, callback) => {
  if (typeof room !== 'string' || room === '') {
    return callback(api.jstp.ERR_INVALID_SIGNATURE);
  }

  if (connection.chatRoom) {
    api.metacom.leaveChat(connection);
  }

  if (!api.metacom.chats.has(room)) {
    api.metacom.chats.set(room, new Map());
  }
  const chat = api.metacom.chats.get(room);

  if (chat.size === 2) {
    return callback(api.metacom.errors.ERR_ROOM_TAKEN);
  }

  chat.forEach((connection) => {
    connection.emitRemoteEvent('metacom', 'chatJoin', []);
  });

  connection.once('close', () => {
    if (connection.chatRoom === room) {
      api.metacom.leaveChat(connection);
    }
  });

  connection.chatRoom = room;

  chat.set(connection.sessionId, connection);

  callback();
}
