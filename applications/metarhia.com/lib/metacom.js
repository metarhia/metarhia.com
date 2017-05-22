api.metacom = {};

api.metacom.errors = Object.assign(Object.create(null), {
  ERR_ROOM_TAKEN: 30,
  ERR_NOT_IN_CHAT: 31,
  ERR_NO_INTERLOCUTOR: 32,
  ERR_NO_SUCH_FILE: 34
});

api.metacom.chats = new Map();

api.metacom.leaveChat = (connection) => {
  const room = connection.chatRoom;
  const chat = api.metacom.chats.get(room);
  chat.delete(connection.sessionId);
  chat.forEach((connection) => {
    connection.emitRemoteEvent('metacom', 'chatLeave', []);
  });
  connection.chatRoom = null;
};
