({
  access: 'public',
  async method({ roomName, messageId, reaction }) {
    const user = context.session.user;
    if (!user) return new Error('User is not logged in');
    const room = application.domain.chat.getRoom(roomName);
    application.domain.chat.toggleReaction(room, user, messageId, reaction);
    return { success: true };
  },
});
