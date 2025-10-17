({
  access: 'public',
  async method({ roomName, messageId }) {
    const user = context.session.user;
    if (!user) return new Error('User is not logged in');
    const room = application.domain.chat.getRoom(roomName);
    application.domain.chat.deleteMessage(room, user, messageId);
    return { success: true };
  },
});
