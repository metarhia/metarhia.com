interface User {
  nick: string;
  uuid: string;
  rooms: Set<Room>;
  emit(event: string, data: any): void;
}

interface Room {
  name: string;
  users: Set<User>;
  messages: Message[];
}

interface Message {
  nick: string;
  content: string;
  timestamp: number;
  reactions: Record<string, number>;
  votes: Map<string, Set<string>>;
}

interface RoomData {
  name: string;
  messages: Message[];
}

interface UserData {
  nick: string;
  uuid: string;
  rooms: string[];
}

interface ChatDomain {
  users: Map<string, User>;
  rooms: Map<string, Room>;
  getRoom(roomName: string): Room;
  dropRoom(roomName: string): void;
  getUser(nick: string, uuid?: string): User;
  joinRoom(user: User, roomName: string): Room | null;
  leaveRoom(user: User, roomName: string): void;
  sendMessage(room: Room, user: User, content: string): void;
  deleteMessage(room: Room, user: User, messageId: number): void;
  toggleReaction(room: Room, user: User, messageId: number, reaction: string): void;
  loadData(): Promise<void>;
  saveData(): Promise<void>;
  start(): Promise<void>;
}

declare const chat: ChatDomain;
export = chat;