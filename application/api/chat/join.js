({
  access: 'public',
  async method({ roomName }) {
    const user = context.session.user;
    if (!user) return new Error('User is not logged in');
    const room = application.domain.chat.joinRoom(user, roomName);
    return { success: true, messages: room.messages };
  },
});
