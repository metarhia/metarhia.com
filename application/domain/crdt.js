({
  async applyDelta(state, delta) {
    const { strategy, entity, record } = delta;
    if (entity === 'message' && strategy === 'lww') {
      state.set(record.id, record);
    }
    if (entity === 'reaction' && strategy === 'counter') {
      const { messageId, reaction } = record;
      const message = state.get(messageId);
      if (!message) return;
      if (!message.reactions) message.reactions = {};
      const count = message.reactions[reaction] || 0;
      message.reactions[reaction] = count + 1;
    }
  },
});
