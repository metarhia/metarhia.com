({
  dataFile: './database/data.json',
  users: new Map(),
  rooms: new Map(),
  state: new Map(),
  deltas: [],

  async getRoom(roomName) {
    let room = this.rooms.get(roomName);
    if (room) return room;
    room = new Set();
    this.rooms.set(roomName, room);
    return room;
  },

  async dropRoom(roomName) {
    this.rooms.delete(roomName);
  },

  async send(roomName, message) {
    const room = this.rooms.get(roomName);
    if (!room) throw new Error(`Room ${roomMame} is not found`);
    for (const client of room) {
      client.emit('chat/message', { room: roomName, message });
    }
  },

  async loadData() {
    const data = await node.fs.promises.readFile(this.dataFile, 'utf8');
    const parsed = JSON.parse(data);
    this.state.clear();
    const messages = parsed.messages || {};
    for (const [key, value] of Object.entries(messages)) {
      this.state.set(key, value);
    }
    this.deltas = parsed.deltas || [];
  },

  async saveData() {
    const state = {};
    for (const [key, value] of this.state.entries()) {
      state[key] = value;
    }
    const data = JSON.stringify({ messages: state, deltas: this.deltas });
    await node.fs.promises.writeFile(this.dataFile, data);
  },

  async start() {
    await this.loadData().catch(() => this.saveData());
  },
});
