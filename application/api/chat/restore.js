({
  access: 'public',
  async method({ token }) {
    const restored = context.client.restoreSession(token);
    if (!restored) return new Error('Invalid token');
    return { success: true, token };
  },
});
