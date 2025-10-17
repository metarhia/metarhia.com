'use strict';

const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const metavm = require('metavm');
const crypto = require('node:crypto');

let savedRooms = null;
let savedUsers = null;

const EXAMPLE_ROOMS = {
  general: {
    name: 'general',
    messages: [
      {
        nick: 'alice',
        content: 'Hello world',
        timestamp: 1700000000000,
        votes: {
          '👍': [
            '11111111-1111-1111-1111-111111111111',
            '22222222-2222-2222-2222-222222222222',
          ],
          '❤️': ['22222222-2222-2222-2222-222222222222'],
        },
      },
      {
        nick: 'bob',
        content: 'Welcome!',
        timestamp: 1700000001000,
        votes: {},
      },
    ],
  },
  random: {
    name: 'random',
    messages: [],
  },
};

const EXAMPLE_USERS = {
  alice: {
    uuid: '11111111-1111-1111-1111-111111111111',
    rooms: ['general'],
  },
  bob: {
    uuid: '22222222-2222-2222-2222-222222222222',
    rooms: ['general', 'random'],
  },
  carol: {
    uuid: '33333333-3333-3333-3333-333333333333',
    rooms: ['random'],
  },
};

const loadChatDomain = async () => {
  const node = {
    crypto,
    path,
    fs: {
      promises: {
        readFile: async (p, enc) => {
          const filename = path.basename(p);
          if (filename === 'rooms.json') {
            return JSON.stringify(EXAMPLE_ROOMS);
          }
          if (filename === 'users.json') {
            return JSON.stringify(EXAMPLE_USERS);
          }
          return fs.promises.readFile(p, enc);
        },
        writeFile: async (filePath, data) => {
          const filename = path.basename(filePath);
          if (filename === 'rooms.json') {
            savedRooms = JSON.parse(data);
          }
          if (filename === 'users.json') {
            savedUsers = JSON.parse(data);
          }
        },
      },
    },
  };
  const filename = path.resolve(__dirname, '../application/domain/chat.js');
  const src = fs.readFileSync(filename, 'utf8');
  const wrapped = `module.exports = ${src}`;
  const namespace = { console, node, module: { exports: {} } };
  const context = metavm.createContext(namespace);
  const script = metavm.createScript(filename, wrapped, { context });
  return script.exports;
};

let chat;

beforeEach(async () => {
  chat = await loadChatDomain();
});

test('getUser returns same user and assigns uuid', () => {
  const u1 = chat.getUser('alice');
  const u2 = chat.getUser('alice');
  assert.equal(u1, u2);
  assert.equal(u1.nick, 'alice');
  assert.equal(typeof u1.uuid, 'string');
});

test('getRoom creates and reuses room', () => {
  const r1 = chat.getRoom('general');
  const r2 = chat.getRoom('general');
  assert.equal(r1, r2);
  assert.equal(r1.name, 'general');
  assert.equal(typeof r1.users.add, 'function');
  assert.ok(Array.isArray(r1.messages));
});

test('joinRoom/leaveRoom manage memberships', () => {
  const user = chat.getUser('bob');
  const room = chat.joinRoom(user, 'general');
  assert.ok(room.users.has(user));
  assert.ok(user.rooms.has(room));

  chat.leaveRoom(user, 'general');
  assert.ok(!room.users.has(user));
  assert.ok(!user.rooms.has(room));
});

test('sendMessage pushes message and emits to members', () => {
  const alice = chat.getUser('alice');
  const general = chat.joinRoom(alice, 'general');

  let received = null;
  alice.emit = (event, data) => {
    received = { event, data };
  };

  chat.sendMessage(general, alice, 'Hello');
  assert.equal(general.messages.length, 1);
  const msg = general.messages[0];
  assert.equal(msg.nick, 'alice');
  assert.equal(msg.content, 'Hello');
  assert.equal(received?.event, 'chat/message');
  assert.deepEqual(received?.data?.room, 'general');
});

test('deleteMessage marks message content as deleted and emits', () => {
  const alice = chat.getUser('alice');
  const room = chat.joinRoom(alice, 'general');
  alice.emit = () => {};
  chat.sendMessage(room, alice, 'Hello');

  let payload = null;
  alice.emit = (event, data) => {
    if (event === 'chat/messageDeleted') payload = data;
  };
  chat.deleteMessage(room, alice, 0);
  assert.equal(room.messages[0].content, '[deleted]');
  assert.equal(payload.room, 'general');
  assert.equal(payload.messageId, 0);
});

test('toggleReaction toggles uuid in vote set and updates count', () => {
  const alice = chat.getUser('alice');
  const room = chat.joinRoom(alice, 'general');
  alice.emit = () => {};
  chat.sendMessage(room, alice, 'Hello');

  let last;
  alice.emit = (event, data) => {
    if (event === 'chat/reaction') last = data;
  };

  chat.toggleReaction(room, alice, 0, '👍');
  assert.equal(room.messages[0].reactions['👍'], 1);
  assert.equal(last.count, 1);

  chat.toggleReaction(room, alice, 0, '👍');
  assert.equal(room.messages[0].reactions['👍'], 0);
});

test('saveData writes current state to files', async () => {
  const alice = chat.getUser('alice');
  const room = chat.joinRoom(alice, 'general');
  alice.emit = () => {};
  chat.sendMessage(room, alice, 'Test message');

  await chat.saveData();

  assert.ok(savedRooms);
  assert.ok(savedRooms.general);
  assert.equal(savedRooms.general.name, 'general');
  assert.ok(Array.isArray(savedRooms.general.messages));
  assert.equal(savedRooms.general.messages.length, 1);
  assert.equal(savedRooms.general.messages[0].content, 'Test message');

  assert.ok(savedUsers);
  assert.ok(savedUsers.alice);
  assert.equal(savedUsers.alice.nick, 'alice');
  assert.equal(typeof savedUsers.alice.uuid, 'string');
  assert.ok(Array.isArray(savedUsers.alice.rooms));
  assert.equal(savedUsers.alice.rooms[0], 'general');
});
