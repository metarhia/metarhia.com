({
  access: 'public',
  async method({ roomName, content }) {
    const user = context.session.user;
    if (!user) return new Error('User is not logged in');
    const room = application.domain.chat.getRoom(roomName);
    application.domain.chat.sendMessage(room, user, content);
    return { success: true };
  },
});
