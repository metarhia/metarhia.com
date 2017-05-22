(callback) => {
  if (!connection.chatRoom) {
    return callback(api.metacom.errors.ERR_NOT_IN_CHAT);
  }
  api.metacom.leaveChat(connection);
  callback();
}
