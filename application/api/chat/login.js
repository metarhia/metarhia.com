({
  access: 'public',
  async method({ nick, uuid }) {
    if (uuid && uuid.length !== 36) return new Error('Invalid nick or uuid');
    const token = await context.client.startSession();
    const user = await domain.chat.getUser(nick, uuid);
    user.context = context;
    if (!user) return new Error('Invalid nick or uuid');
    context.session.user = user;
    return { success: true, token };
  },
});
