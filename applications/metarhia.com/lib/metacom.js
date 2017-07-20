api.metacom = {};

api.metacom.errors = Object.assign(Object.create(null), {
  ERR_ROOM_TAKEN: 30,
  ERR_NOT_IN_CHAT: 31,
  ERR_NO_INTERLOCUTOR: 32,
  ERR_NO_SUCH_FILE: 33,
  ERR_UPLOAD_NOT_STARTED: 34,
  ERR_PREVIOUS_UPLOAD_NOT_FINISHED: 35
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

api.metacom.generateFileCode = () => {
  const result = new Array(3);
  const ALPHA_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const ALPHA_LOWER = 'abcdefghijklmnopqrstuvwxyz';
  const ALPHA = ALPHA_UPPER + ALPHA_LOWER;
  const DIGIT = '0123456789';
  const ALPHA_DIGIT = ALPHA + DIGIT;
  result[0] = api.common.generateKey(2, DIGIT);
  result[1] = api.common.generateKey(2, DIGIT);
  result[2] = api.common.generateKey(8, ALPHA_DIGIT);
  return result;
};
