({
  access: 'public',
  async method({ roomName }) {
    const user = context.session.user;
    if (!user) return new Error('User is not logged in');
    application.domain.chat.leaveRoom(user, roomName);
    return { success: true };
  },
});
