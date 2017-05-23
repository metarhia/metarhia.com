api.timers.setInterval(() => {
  api.metacom.chats.forEach((chat, room, chatMap) => {
    if (chat.size === 0) {
      chatMap.delete(room);
    }
  });
}, application.config.metacom.ROOM_PURGE_INTERVAL);
