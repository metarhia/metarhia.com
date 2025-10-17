({
  // nick -> { nick:string, uuid:string, rooms:Set<room> }
  users: new Map(),

  // name -> { name, users:Set<User>, messages:Array<Message> }
  rooms: new Map(),

  getRoom(roomName) {
    let room = this.rooms.get(roomName);
    if (room) return room;
    const users = new Set();
    const messages = [];
    room = { name: roomName, users, messages };
    this.rooms.set(roomName, room);
    return room;
  },

  dropRoom(roomName) {
    const room = this.rooms.get(roomName);
    if (!room) return;
    for (const [, user] of this.users) {
      if (user.rooms.has(room)) user.rooms.delete(room);
    }
    this.rooms.delete(roomName);
  },

  getUser(nick, uuid) {
    let user = this.users.get(nick);
    if (user) return user.uuid === uuid ? user : null;
    user = { nick, uuid, rooms: new Set(), client: null };
    this.users.set(nick, user);
    return user;
  },

  joinRoom(user, roomName) {
    const room = this.getRoom(roomName);
    if (!room) return null;
    room.users.add(user);
    user.rooms.add(room);
    return room;
  },

  leaveRoom(user, roomName) {
    const room = this.rooms.get(roomName);
    if (!room) return;
    room.users.delete(user);
    user.rooms.delete(room);
  },

  sendMessage(room, user, content) {
    const nick = user.nick;
    const timestamp = Date.now();
    const reactions = {};
    const votes = new Map();
    const message = { nick, content, timestamp, reactions, votes };
    room.messages.push(message);
    const event = { room: room.name, message };
    for (const user of room.users) {
      if (user.client) user.client.emit('chat/message', event);
    }
  },

  deleteMessage(room, user, messageId) {
    const message = room.messages[messageId];
    if (!message) return;
    if (message.nick !== user.nick) return;
    room.messages[messageId] = { ...message, content: '[deleted]' };
    const event = { room: room.name, messageId };
    for (const user of room.users) {
      if (user.client) user.client.emit('chat/messageDeleted', event);
    }
  },

  toggleReaction(room, user, messageId, reaction) {
    const message = room.messages[messageId];
    if (!message) return;
    let vote = message.votes.get(reaction);
    if (!vote) {
      vote = new Set();
      message.votes.set(reaction, vote);
    }
    if (vote.has(user.uuid)) vote.delete(user.uuid);
    else vote.add(user.uuid);
    const count = vote.size;
    message.reactions[reaction] = count;
    const event = { room: room.name, messageId, reaction, count };
    for (const user of room.users) {
      if (user.client) user.client.emit('chat/reaction', event);
    }
  },

  async loadData() {
    const roomsFile = node.path.resolve('./database/rooms.json');
    const roomsData = await node.fs.promises.readFile(roomsFile, 'utf8');
    const rooms = JSON.parse(roomsData);
    for (const [name, data] of Object.entries(rooms)) {
      const count = data.messages.length;
      const messages = new Array(count);
      for (let id = 0; id < count; id++) {
        const votes = new Map();
        const reactions = {};
        const message = data.messages[id];
        for (const [reaction, userIds] of Object.entries(message.votes)) {
          votes.set(reaction, new Set(userIds));
          reactions[reaction] = userIds.length;
        }
        messages[id] = { ...message, votes, reactions };
      }
      const room = { name, users: new Set(), messages };
      this.rooms.set(name, room);
    }

    const usersFile = node.path.resolve('./database/users.json');
    const usersData = await node.fs.promises.readFile(usersFile, 'utf8');
    const users = JSON.parse(usersData);
    for (const [nick, user] of Object.entries(users)) {
      const rooms = new Set();
      const record = { nick, uuid: user.uuid, rooms };
      for (const roomName of user.rooms) {
        const room = this.getRoom(roomName);
        rooms.add(room);
        room.users.add(record);
      }
      this.users.set(nick, record);
    }
  },

  async saveData() {
    const rooms = {};
    for (const [name, room] of this.rooms.entries()) {
      const messages = [];
      for (const message of room.messages) {
        const { nick, content, timestamp } = message;
        const votes = {};
        for (const [reaction, ids] of message.votes.entries()) {
          votes[reaction] = Array.from(ids);
        }
        messages.push({ nick, content, timestamp, votes });
      }
      rooms[name] = { name, messages };
    }
    const roomsFile = node.path.resolve('./database/rooms.json');
    await node.fs.promises.writeFile(roomsFile, JSON.stringify(rooms));

    const users = {};
    for (const [nick, user] of this.users.entries()) {
      const rooms = [];
      for (const room of user.rooms) {
        rooms.push(room.name);
      }
      users[nick] = { nick, uuid: user.uuid, rooms };
    }
    const usersFile = node.path.resolve('./database/users.json');
    await node.fs.promises.writeFile(usersFile, JSON.stringify(users));
  },

  async start() {
    await this.loadData().catch(() => this.saveData());
  },
});
