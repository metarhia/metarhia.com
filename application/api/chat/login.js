({
  access: 'public',
  async method({ nick, uuid }) {
    if (uuid && uuid.length !== 36) return new Error('Invalid nick or uuid');
    const user = await application.domain.chat.getUser(nick, uuid);
    user.context = context;
    if (!user) return new Error('Invalid nick or uuid');
    context.session.user = user;
    return { success: true };
  },
});
