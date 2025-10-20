({
  access: 'public',
  async method({ roomName, messageId }) {
    const user = context.session.user;
    if (!user) return new Error('User is not logged in');
    const room = domain.chat.getRoom(roomName);
    domain.chat.deleteMessage(room, user, messageId);
    return { success: true };
  },
});
