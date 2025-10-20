import { Application } from './pwa.js';
import { Metacom } from './metacom.js';

class Logger {
  #output;

  constructor(outputId) {
    this.#output = document.getElementById(outputId);
  }

  log(...args) {
    const lines = args.map(Logger.#serialize);
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${lines.join(' ')}\n`;
    this.#output.textContent += logEntry;
    this.#output.scrollTop = this.#output.scrollHeight;
  }

  clear() {
    this.#output.textContent = '';
  }

  static #serialize(x) {
    return typeof x === 'object' ? JSON.stringify(x, null, 2) : x;
  }
}

const REACTIONS = { like: 0, dislike: 0, love: 0, smile: 0, poo: 0 };

class ChatApplication extends Application {
  constructor(config = {}) {
    super(config);
    this.username = '';
    this.uuid = crypto.randomUUID();
    this.roomName = 'general';
    this.messages = [];
    this.config = config;
    this.metacom = null;
    this.chatApi = null;
    this.connected = false;
    this.#initMetacom();
  }

  async #initMetacom() {
    try {
      this.metacom = Metacom.create('ws://localhost:8080/api');
      await this.metacom.load('chat');
      this.chatApi = this.metacom.api.chat;
      
      this.metacom.on('open', () => {
        this.connected = true;
        this.updateInterface();
        this.logger.log('Metacom connected');
        this.showNotification('Connected to chat server', 'success');
      });

      this.metacom.on('close', () => {
        this.connected = false;
        this.updateInterface();
        this.logger.log('Metacom disconnected');
        this.showNotification('Disconnected from chat server', 'warning');
      });

      this.metacom.on('error', (error) => {
        this.logger.log('Metacom error:', error);
        this.showNotification('Connection error', 'error');
      });

      this.chatApi.on('message', (data) => {
        this.handleNewMessage(data.message);
      });

      this.chatApi.on('messageDeleted', (data) => {
        this.handleMessageDeleted(data.messageId);
      });

      this.chatApi.on('reaction', (data) => {
        this.handleReaction(data.messageId, data.reaction, data.count);
      });

    } catch (error) {
      this.logger.log('Failed to initialize metacom:', error);
      this.showNotification('Failed to connect to chat server', 'error');
    }
  }

  getElements() {
    this.installBtn = document.getElementById('install-btn');
    this.updateCacheBtn = document.getElementById('update-cache-btn');
    this.clearBtn = document.getElementById('clear-btn');
    this.clearMessagesBtn = document.getElementById('clear-messages-btn');
    this.sendBtn = document.getElementById('send-btn');
    this.messageInput = document.getElementById('message-input');
    this.usernameInput = document.getElementById('username-input');
    this.roomInput = document.getElementById('room-input');
    this.connectionStatus = document.getElementById('connection-status');
    this.installStatus = document.getElementById('install-status');
    this.notification = document.getElementById('notification');
    this.chatMessages = document.getElementById('chat-messages');
    this.messageTemplate = document.getElementById('chat-message-template');
    this.reactionTemplate = document.getElementById('reaction-button-template');
  }

  setupEvents() {
    this.installBtn.onclick = () => this.install();
    this.updateCacheBtn.onclick = () => this.updateCache();
    this.clearBtn.onclick = () => this.logger.clear();
    this.clearMessagesBtn.onclick = () => this.clearDatabase();
    this.sendBtn.onclick = () => this.sendMessage();
    this.messageInput.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') this.sendMessage();
    });
    this.roomInput.addEventListener('blur', () => this.updateRoomName());
    this.roomInput.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') this.updateRoomName();
    });

    this.on('network', () => this.updateInterface());
    this.on('install', () => this.showInstallButton(true));
    this.on('installed', () => this.showInstallButton(false));
  }

  updateInterface() {
    const online = this.online ? 'online' : 'offline';
    const connected = this.connected ? 'connected' : 'disconnected';
    const status = `${online} / ${connected}`;
    this.connectionStatus.textContent = status.toUpperCase();
    this.connectionStatus.className = `status-indicator ${connected}`;
  }

  async login(username) {
    if (!this.chatApi) {
      this.showNotification('Not connected to server', 'error');
      return false;
    }
    
    try {
      const result = await this.chatApi.login({ nick: username, uuid: this.uuid });
      if (result.success) {
        this.username = username;
        this.logger.log('Logged in as:', username);
        this.showNotification(`Logged in as ${username}`, 'success');
        await this.joinRoom();
        return true;
      } else {
        this.showNotification('Login failed', 'error');
        return false;
      }
    } catch (error) {
      this.logger.log('Login error:', error);
      this.showNotification('Login error', 'error');
      return false;
    }
  }

  async joinRoom() {
    if (!this.chatApi || !this.username) return;
    
    try {
      const result = await this.chatApi.join({ roomName: this.roomName });
      if (result.success) {
        this.messages = result.messages || [];
        this.renderChatMessages();
        this.logger.log('Joined room:', this.roomName);
      }
    } catch (error) {
      this.logger.log('Join room error:', error);
    }
  }

  async updateRoomName() {
    const newRoomName = this.roomInput.value.trim() || 'general';
    if (newRoomName === this.roomName) return;
    
    if (this.username && this.roomName && this.chatApi) {
      try {
        await this.chatApi.leave({ roomName: this.roomName });
        this.logger.log('Left room:', this.roomName);
      } catch (error) {
        this.logger.log('Leave room error:', error);
      }
    }
    
    this.roomName = newRoomName;
    
    if (this.username) {
      await this.joinRoom();
    }
  }

  handleNewMessage(message) {
    const messageIndex = this.messages.length;
    this.messages.push({ ...message, id: messageIndex });
    this.renderChatMessages();
    this.logger.log('New message from:', message.nick);
  }

  handleMessageDeleted(messageId) {
    if (this.messages[messageId]) {
      this.messages[messageId].content = '[deleted]';
      this.renderChatMessages();
      this.logger.log('Message deleted:', messageId);
    }
  }

  handleReaction(messageId, reaction, count) {
    if (this.messages[messageId]) {
      if (!this.messages[messageId].reactions) {
        this.messages[messageId].reactions = {};
      }
      this.messages[messageId].reactions[reaction] = count;
      this.renderChatMessages();
      this.logger.log(`Reaction ${reaction} on message ${messageId}: ${count}`);
    }
  }

  async deleteMessage(messageId) {
    if (!this.chatApi || !this.connected) {
      this.showNotification('Not connected to server', 'error');
      return;
    }

    try {
      const result = await this.chatApi.unsend({
        roomName: this.roomName,
        messageId: messageId
      });
      
      if (result.success) {
        this.logger.log('Message deleted:', messageId);
      } else {
        this.showNotification('Failed to delete message', 'error');
      }
    } catch (error) {
      this.logger.log('Delete message error:', error);
      this.showNotification('Failed to delete message', 'error');
    }
  }


  async sendMessage() {
    const content = this.messageInput.value.trim();
    this.messageInput.value = '';
    if (!content) {
      this.showNotification('Please enter a message', 'warning');
      return;
    }
    
    if (!this.username) {
      this.showNotification('Please enter a username', 'warning');
      return;
    }

    if (!this.chatApi || !this.connected) {
      this.showNotification('Not connected to server', 'error');
      return;
    }

    try {
      const result = await this.chatApi.send({ 
        roomName: this.roomName, 
        content: content 
      });
      
      if (result.success) {
        this.logger.log('Sent message:', content);
        this.showNotification('Message sent!', 'success');
      } else {
        this.showNotification('Failed to send message', 'error');
      }
    } catch (error) {
      this.logger.log('Send message error:', error);
      this.showNotification('Failed to send message', 'error');
    }
  }

  renderChatMessages() {
    this.chatMessages.innerHTML = '';
    
    for (const message of sortedMessages) {
      const el = this.createMessageElement(message);
      this.addReactionHandlers(el);
      this.chatMessages.appendChild(el);
    }
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  createMessageElement(message) {
    const el = this.messageTemplate.content.cloneNode(true);
    const div = el.querySelector('.chat-message');
    div.querySelector('.username').textContent = message.nick;
    const timestamp = new Date(message.timestamp).toLocaleString();
    div.querySelector('.timestamp').textContent = timestamp;
    div.querySelector('.content').textContent = message.content;
    
    const deleteBtn = div.querySelector('.delete-btn');
    if (message.nick === this.username) {
      deleteBtn.classList.remove('hidden');
      deleteBtn.addEventListener('click', () => this.deleteMessage(message.id));
    }
    
    const reactions = div.querySelector('.reactions');
    this.addReactionButtons(reactions, message);
    return div;
  }

  addReactionButtons(container, message) {
    const reactions = [
      { type: 'like', emoji: '👍' },
      { type: 'dislike', emoji: '👎' },
      { type: 'love', emoji: '❤️' },
      { type: 'smile', emoji: '😊' },
      { type: 'poo', emoji: '💩' },
    ];
    for (const { type, emoji } of reactions) {
      const el = this.reactionTemplate.content.cloneNode(true);
      const button = el.querySelector('.reaction-btn');
      button.dataset.messageId = message.id;
      button.dataset.reaction = type;
      button.querySelector('.emoji').textContent = emoji;
      const count = message.reactions?.[type] || 0;
      button.querySelector('.count').textContent = count;
      container.appendChild(button);
    }
  }

  addReactionHandlers(el) {
    const reactionBtns = el.querySelectorAll('.reaction-btn');
    for (const btn of reactionBtns) {
      const { messageId, reaction } = btn.dataset;
      btn.addEventListener('click', async () => {
        if (!this.chatApi || !this.connected) {
          this.showNotification('Not connected to server', 'error');
          return;
        }

        try {
          const result = await this.chatApi.reaction({
            roomName: this.roomName,
            messageId: parseInt(messageId),
            reaction: reaction
          });
          
          if (result.success) {
            this.logger.log('Added reaction:', reaction, 'to message:', messageId);
          } else {
            this.showNotification('Failed to add reaction', 'error');
          }
        } catch (error) {
          this.logger.log('Reaction error:', error);
          this.showNotification('Failed to add reaction', 'error');
        }
      });
    }
  }

  updateCache() {
    this.logger.log('Requesting cache update...');
    this.updateCacheBtn.disabled = true;
    this.updateCacheBtn.textContent = 'Updating...';
    this.showNotification('Cache update requested', 'info');
    this.post({ type: 'updateCache' });
  }

  showInstallButton(visible = true) {
    if (visible) {
      this.installBtn.classList.remove('hidden');
      this.installStatus.classList.remove('hidden');
    } else {
      this.showNotification('App installed successfully!', 'success');
      this.installBtn.classList.add('hidden');
      this.installStatus.classList.add('hidden');
    }
  }

  showNotification(message, type = 'info') {
    if (!this.notification) return;
    this.notification.textContent = message;
    this.notification.className = `notification ${type}`;
    this.notification.classList.remove('hidden');
    setTimeout(() => {
      this.notification.classList.add('hidden');
    }, this.config.notificationTimeout);
  }

  clearDatabase() {
    this.logger.log('Clearing local messages...');
    this.messages = [];
    this.renderChatMessages();
    this.showNotification('Messages cleared', 'success');
  }
}

const logger = new Logger('output');
const app = new ChatApplication({ logger });

export { ChatApplication, app };
