(mimeType, callback) => {
  if (typeof mimeType !== 'string') {
    return callback(api.jstp.ERR_INVALID_SIGNATURE);
  }

  if (!connection.chatRoom) {
    return callback(api.metacom.errors.ERR_NOT_IN_CHAT);
  }

  const room = connection.chatRoom;
  const chat = api.metacom.chats.get(room);

  if (chat.size !== 2) {
    return callback(api.metacom.errors.ERR_NO_INTERLOCUTOR);
  }

  chat.forEach((conn, sessionId) => {
    if (sessionId !== connection.session.id) {
      conn.emitRemoteEvent('metacom', 'chatFileTransferStart', [mimeType]);
    }
  });

  callback();
}
