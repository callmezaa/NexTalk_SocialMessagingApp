import { create } from 'zustand';
import { useAuthStore } from './authStore';
import axios from 'axios';
import { Config } from '../constants/Config';

// ─── Premium Dummy Data ───

const DUMMY_CHATS: Chat[] = [
  { id: 9991, name: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop', lastMessage: 'Sure, I will send the design files via email later! ✨', time: '10:24 AM', unread: 2, isGroup: false, status: 'online', online: true },
  { id: 9992, name: 'NexTalk Dev Team 🚀', avatar: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=200&auto=format&fit=crop', lastMessage: 'Alex: Just pushed to the repo, please review it guys 🙏', time: '9:15 AM', unread: 5, isGroup: true, status: 'typing', online: true },
  { id: 9993, name: 'Zane Vance', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop', lastMessage: "Don't forget our meeting at 10 AM tomorrow.", time: 'Yesterday', unread: 0, isGroup: false, status: 'offline', online: false },
  { id: 9994, name: 'Chloe Devlin', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop', lastMessage: 'Thanks a lot for your help yesterday! 🙌', time: 'Yesterday', unread: 1, isGroup: false, status: 'online', online: true },
  { id: 9995, name: 'Casual Hangout ☕️', avatar: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=200&auto=format&fit=crop', lastMessage: 'Bob: So are we going to the mountains this weekend?', time: 'Monday', unread: 0, isGroup: true, status: 'active', online: false },
];

const DUMMY_STORIES: Story[] = [
  { id: 101, userId: 9991, mediaUrl: 'https://images.unsplash.com/photo-1483058712412-4245e9b90334?q=80&w=600&auto=format&fit=crop', type: 'image', expiresAt: '', createdAt: new Date().toISOString(), user: { id: 9991, username: 'Sarah', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop' } },
  { id: 102, userId: 9993, mediaUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=600&auto=format&fit=crop', type: 'image', expiresAt: '', createdAt: new Date().toISOString(), user: { id: 9993, username: 'Zane', avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop' } },
  { id: 103, userId: 9994, mediaUrl: 'https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=600&auto=format&fit=crop', type: 'image', expiresAt: '', createdAt: new Date().toISOString(), user: { id: 9994, username: 'Chloe', avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop' } },
];

const DUMMY_MESSAGES: Record<string, ChatMessage[]> = {
  '9991': [
    { id: 'm1', chatId: '9991', senderId: 9991, content: 'Hey kenzama, have you had a chance to look at the new brand identity mockups I sent?', type: 'text', status: 'read', createdAt: new Date(Date.now() - 3600000 * 3).toISOString() },
    { id: 'm2', chatId: '9991', senderId: 0, content: 'Hey Sarah! Yes, I just went through them. The color palette is much more sophisticated now. I really love the indigo accents.', type: 'text', status: 'read', createdAt: new Date(Date.now() - 3600000 * 2.5).toISOString() },
    { id: 'm3', chatId: '9991', senderId: 9991, content: 'Glad you like it! I was worried the indigo might be too bold, but it really pops against the glassmorphism elements.', type: 'text', status: 'read', createdAt: new Date(Date.now() - 3600000 * 2).toISOString() },
    { id: 'm4', chatId: '9991', senderId: 9991, content: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=600&auto=format&fit=crop', type: 'image', status: 'read', createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString() },
    { id: 'm5', chatId: '9991', senderId: 0, content: 'This looks incredible. Let\'s go with this direction for the v2.0 update.', type: 'text', status: 'read', createdAt: new Date(Date.now() - 3600000 * 1).toISOString() },
    { id: 'm6', chatId: '9991', senderId: 9991, content: 'Perfect! I\'ll finalize the rest of the assets. Sure, I will send the design files via email later! ✨', type: 'text', status: 'unread', createdAt: new Date(Date.now() - 300000).toISOString() },
  ],
  '9992': [
    { id: 'g1', chatId: '9992', senderId: 9991, content: 'Team, I just updated the design system tokens in Figma. Please take a look before you start coding the new components.', type: 'text', status: 'read', createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: 'g2', chatId: '9992', senderId: 9994, content: 'On it! I\'m checking the animation curves now. kenzama, are we using Reanimated for the message bubbles?', type: 'text', status: 'read', createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 'g3', chatId: '9992', senderId: 0, content: 'Yes Chloe, the bubbles and the header transitions should definitely use Reanimated. It\'s much smoother for layout animations.', type: 'text', status: 'read', createdAt: new Date(Date.now() - 1800000).toISOString() },
    { id: 'g4', chatId: '9992', senderId: 9993, content: 'Got it. I\'ll handle the WebSocket store integration then. Alex: Just pushed to the repo, please review it guys 🙏', type: 'text', status: 'read', createdAt: new Date(Date.now() - 300000).toISOString() },
    { id: 'g5', chatId: '9992', senderId: 9991, content: 'Alex is typing...', type: 'text', status: 'read', createdAt: new Date(Date.now() - 100000).toISOString() },
  ],
  '9993': [
    { id: 'v1', chatId: '9993', senderId: 9993, content: 'Yo kenzama, you up for a quick call to discuss the backend architecture? I want to optimize the message delivery latency.', type: 'text', status: 'read', createdAt: new Date(Date.now() - 86400000 * 1.2).toISOString() },
    { id: 'v2', chatId: '9993', senderId: 0, content: 'Hey Zane! Definitely. I\'ve been thinking about using Redis Pub/Sub for the real-time events. How does that sound?', type: 'text', status: 'read', createdAt: new Date(Date.now() - 86400000 * 1.1).toISOString() },
    { id: 'v3', chatId: '9993', senderId: 9993, content: 'Sounds like exactly what we need. I\'ll draft a small POC. Don\'t forget our meeting at 10 AM tomorrow.', type: 'text', status: 'unread', createdAt: new Date(Date.now() - 3600000).toISOString() },
  ],
  '9994': [
    { id: 'c1', chatId: '9994', senderId: 9994, content: 'kenzama, thank you so much for helping me debug that weird layout shift on the Profile screen! You saved my day.', type: 'text', status: 'read', createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 'c2', chatId: '9994', senderId: 0, content: 'No problem at all, Chloe! Happy to help. It was just a sticky margin issue in the FlatList header.', type: 'text', status: 'read', createdAt: new Date(Date.now() - 86400000 + 3600000).toISOString() },
    { id: 'c3', chatId: '9994', senderId: 9994, content: 'Anyway, thanks a lot for your help yesterday! 🙌', type: 'text', status: 'unread', createdAt: new Date(Date.now() - 1800000).toISOString() },
  ]
};

export interface Call {
  id: number;
  name: string;
  avatar: string;
  type: 'incoming' | 'outgoing' | 'missed';
  isVideo: boolean;
  time: string;
  duration?: string;
}

const DUMMY_CALLS: Call[] = [
  { id: 1, name: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop', type: 'incoming', isVideo: true, time: new Date().toISOString(), duration: '12:05' },
  { id: 2, name: 'Zane Vance', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop', type: 'missed', isVideo: false, time: new Date(Date.now() - 3600000 * 2).toISOString(), duration: '0:00' },
  { id: 3, name: 'Chloe Devlin', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop', type: 'outgoing', isVideo: false, time: new Date(Date.now() - 86400000).toISOString(), duration: '05:22' },
  { id: 4, name: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop', type: 'missed', isVideo: true, time: new Date(Date.now() - 86400000 * 2).toISOString(), duration: '0:00' },
  { id: 5, name: 'Alex Reeves', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop', type: 'incoming', isVideo: false, time: new Date(Date.now() - 86400000 * 3).toISOString(), duration: '1:45:10' },
];

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: number;
  content: string;
  type: string;
  status: string;
  createdAt: string;
  reactions?: { emoji: string, userId: number }[];
}

export interface Chat {
  id: number;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  isGroup: boolean;
  status: string;
  online: boolean;
}

export interface Story {
  id: number;
  userId: number;
  mediaUrl: string;
  type: string;
  expiresAt: string;
  createdAt: string;
  user: {
    id: number;
    username: string;
    avatar_url: string;
  };
}

interface ChatState {
  ws: WebSocket | null;
  chats: Chat[];
  messages: Record<string, ChatMessage[]>;
  typingUsers: Record<string, number[]>; // chatId -> list of userIds typing
  isConnected: boolean;
  isLoading: boolean;
  connect: (token: string) => void;
  disconnect: () => void;
  fetchChats: () => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, content: string) => void;
  addReaction: (chatId: string, messageId: string, emoji: string) => void;
  sendTypingStatus: (chatId: string, isTyping: boolean) => void;
  markMessagesAsRead: (chatId: string) => void;
  receiveMessage: (msg: ChatMessage) => void;
  
  // Call Actions
  calls: Call[];
  fetchCalls: () => void;
  
  // Story Actions
  stories: Story[];
  fetchStories: () => Promise<void>;
  createStory: (mediaUrl: string) => Promise<void>;
  createGroup: (name: string, participantIds: number[], description?: string, avatarUrl?: string) => Promise<any>;
  
  // Group Info
  currentChatInfo: any | null;
  fetchChatInfo: (chatId: string) => Promise<void>;
  leaveGroup: (chatId: string) => Promise<void>;
  addMembersToGroup: (chatId: string, memberIds: number[]) => Promise<any>;
  removeMember: (chatId: string, userId: number) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  ws: null,
  chats: DUMMY_CHATS,
  messages: DUMMY_MESSAGES,
  typingUsers: {},
  isConnected: false,
  isLoading: false,
  stories: DUMMY_STORIES,
  calls: DUMMY_CALLS,
  currentChatInfo: null,

  fetchCalls: () => {
    set({ calls: DUMMY_CALLS });
  },

  fetchChats: async () => {
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ chats: DUMMY_CHATS });
      return;
    }
    set({ isLoading: true });
    try {
      // For documentation purposes: we fetch but still use DUMMY_CHATS to keep it clean,
      // or you can just set DUMMY_CHATS directly.
      const resp = await axios.get(`${Config.API_URL}/chats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // If you want to ONLY show dummy data for documentation, use this:
      set({ chats: DUMMY_CHATS, isLoading: false });
      
      // If you wanted to show real data, it would be:
      // const data = (resp.data && resp.data.length > 0) ? resp.data : DUMMY_CHATS;
      // set({ chats: data, isLoading: false });
    } catch (err) {
      console.error("Fetch Chats Error, falling back to dummy:", err);
      set({ chats: DUMMY_CHATS, isLoading: false });
    }
  },

  fetchMessages: async (chatId) => {
    const token = useAuthStore.getState().token;
    if (!token) {
      const msgs = DUMMY_MESSAGES[chatId] || [];
      set((state) => ({ 
        messages: { ...state.messages, [chatId]: msgs },
        isLoading: false 
      }));
      return;
    }
    set({ isLoading: true });
    try {
      const resp = await axios.get(`${Config.API_URL}/messages/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let msgs: ChatMessage[] = [];
      // If dummy exists for this ID, use it for documentation/clean look
      if (DUMMY_MESSAGES[chatId]) {
        msgs = DUMMY_MESSAGES[chatId];
      } else if (resp.data && resp.data.length > 0) {
        msgs = resp.data.map((m: any) => ({
          id: String(m.id),
          chatId: String(m.chat_id),
          senderId: Number(m.sender_id),
          content: m.content,
          type: m.type,
          status: m.status,
          createdAt: m.created_at,
          reactions: m.reactions?.map((r: any) => ({ emoji: r.emoji, userId: Number(r.user_id) }))
        }));
      }

      set((state) => ({ 
        messages: { ...state.messages, [chatId]: msgs },
        isLoading: false 
      }));
    } catch (err) {
      console.error("Fetch Messages Error, falling back to dummy:", err);
      const msgs = DUMMY_MESSAGES[chatId] || [];
      set((state) => ({ 
        messages: { ...state.messages, [chatId]: msgs },
        isLoading: false 
      }));
    }
  },

  connect: (token) => {
    // Prevent duplicate connections
    const existing = get().ws;
    if (existing && existing.readyState === WebSocket.OPEN) {
      return; // Already connected
    }
    if (existing) {
      existing.close();
    }

    // Derive WS URL from API URL (replace http with ws, remove /api suffix)
    const wsBase = Config.API_URL
      .replace('http://', 'ws://')
      .replace('https://', 'wss://')
      .replace('/api', '');
    const wsUrl = `${wsBase}/ws?token=${token}`;
    
    console.log('[WS] Connecting to:', wsUrl);
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('[WS] Connected successfully');
      set({ isConnected: true, ws });
    };
    ws.onclose = (e) => {
      console.log('[WS] Disconnected, code:', e.code);
      set({ isConnected: false, ws: null });
    };
    ws.onerror = (e) => {
      console.log('[WS] Error:', e);
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_message') {
        const p = data.payload;
        // Map snake_case backend fields to camelCase frontend fields
        const mapped: ChatMessage = {
          id: String(p.id || p.ID || Date.now()),
          chatId: String(p.chat_id || p.chatId || ''),
          senderId: Number(p.sender_id || p.senderId || 0),
          content: p.content || '',
          type: p.type || 'text',
          status: p.status || 'sent',
          createdAt: p.createdAt || p.created_at || new Date().toISOString(),
          reactions: p.reactions || [],
        };
        get().receiveMessage(mapped);
      } else if (data.type === 'typing') {
        const { chat_id, user_id, is_typing } = data.payload;
        const cid = String(chat_id);
        const uid = Number(user_id);
        const isTyping = Boolean(is_typing);
        
        set((state) => {
          const current = state.typingUsers[cid] || [];
          let updated;
          if (isTyping) {
            updated = current.includes(uid) ? current : [...current, uid];
          } else {
            updated = current.filter((id: number) => id !== uid);
          }
          return { typingUsers: { ...state.typingUsers, [cid]: updated } };
        });
      } else if (data.type === 'read_messages') {
        const { chat_id, user_id } = data.payload;
        const cid = String(chat_id);
        const uid = Number(user_id);
        set((state) => {
          const chatMsgs = state.messages[cid] || [];
          const updatedMsgs = chatMsgs.map(m => {
            if (m.senderId !== uid) {
              return { ...m, status: 'read' };
            }
            return m;
          });
          return { messages: { ...state.messages, [cid]: updatedMsgs } };
        });
      } else if (data.type === 'reaction') {
        const { chat_id, messageId, user_id, emoji } = data.payload;
        const cid = String(chat_id);
        const mid = String(messageId);
        const uid = Number(user_id);
        set((state) => {
          const chatMsgs = state.messages[cid] || [];
          const updatedMsgs = chatMsgs.map(m => {
            if (m.id === mid) {
              const reactions = m.reactions || [];
              return { ...m, reactions: [...reactions, { emoji, userId: uid }] };
            }
            return m;
          });
          return { messages: { ...state.messages, [cid]: updatedMsgs } };
        });
      }
    };
  },
  disconnect: () => {
    const { ws } = get();
    if (ws) {
      ws.close();
      set({ ws: null, isConnected: false });
    }
  },
  sendMessage: (chatId, content) => {
    const { ws } = get();
    const authUser = useAuthStore.getState().user;
    
    if (ws && ws.readyState === WebSocket.OPEN && authUser) {
      const payload = {
        type: 'send_message',
        payload: { chat_id: parseInt(chatId, 10), content, type: 'text' }
      };
      ws.send(JSON.stringify(payload));
      
      // Add optimistic message with special prefix so we can replace it later
      const newMsg: ChatMessage = {
        id: `optimistic-${Date.now()}`,
        chatId,
        senderId: authUser.id,
        content,
        type: 'text',
        status: 'sending',
        createdAt: new Date().toISOString()
      };
      get().receiveMessage(newMsg);
    }
  },
  sendTypingStatus: (chatId, isTyping) => {
    const { ws } = get();
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'typing',
        payload: { chat_id: parseInt(chatId, 10), is_typing: isTyping }
      }));
    }
  },
  markMessagesAsRead: (chatId) => {
    const { ws } = get();
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'read_messages',
        payload: { chat_id: parseInt(chatId, 10) }
      }));
    }
  },
  addReaction: (chatId, messageId, emoji) => {
    const { ws } = get();
    if (ws && ws.readyState === WebSocket.OPEN) {
      const payload = {
        type: 'reaction',
        payload: { chat_id: parseInt(chatId, 10), messageId, emoji }
      };
      ws.send(JSON.stringify(payload));
    }
  },
  receiveMessage: (msg) => {
    set((state) => {
      const chatMsgs = state.messages[msg.chatId] || [];
      
      // If this is a real message (from WS broadcast), replace the optimistic version
      if (!msg.id.startsWith('optimistic-')) {
        // Remove any optimistic message with same content from same sender
        const filtered = chatMsgs.filter(m => {
          if (m.id.startsWith('optimistic-') && m.senderId === msg.senderId && m.content === msg.content) {
            return false; // Remove the optimistic duplicate
          }
          return true;
        });
        // Check if real message already exists (true dedup)
        if (filtered.find(m => m.id === msg.id)) return state;
        return { messages: { ...state.messages, [msg.chatId]: [msg, ...filtered] } };
      }
      
      // For optimistic messages, just add them
      if (chatMsgs.find(m => m.id === msg.id)) return state;
      return { messages: { ...state.messages, [msg.chatId]: [msg, ...chatMsgs] } };
    });
  },

  fetchStories: async () => {
    const token = useAuthStore.getState().token;
    if (!token) {
      set({ stories: DUMMY_STORIES });
      return;
    }
    try {
      const resp = await axios.get(`${Config.API_URL}/stories`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let mappedStories: Story[] = [];
      if (resp.data && resp.data.length > 0) {
        mappedStories = resp.data.map((s: any) => ({
          id: s.id,
          userId: s.user_id,
          mediaUrl: s.media_url,
          type: s.type,
          expiresAt: s.expires_at,
          createdAt: s.created_at,
          user: {
            id: s.user.id,
            username: s.user.username,
            avatar_url: s.user.avatar_url
          }
        }));
      } else {
        mappedStories = DUMMY_STORIES;
      }

      set({ stories: mappedStories });
    } catch (err) {
      console.error("Fetch Stories Error, falling back to dummy:", err);
      set({ stories: DUMMY_STORIES });
    }
  },

  createStory: async (mediaUrl) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    try {
      await axios.post(`${Config.API_URL}/stories`, 
        { media_url: mediaUrl, type: 'image' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Re-fetch stories after successful creation
      get().fetchStories();
    } catch (err) {
      console.error("Create Story Error:", err);
      throw err;
    }
  },

  createGroup: async (name, participantIds, description, avatarUrl) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    try {
      const resp = await axios.post(`${Config.API_URL}/groups`, 
        { name, participant_ids: participantIds, description, avatar_url: avatarUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Re-fetch chats after successful creation
      get().fetchChats();
      return resp.data;
    } catch (err) {
      console.error("Create Group Error:", err);
      throw err;
    }
  },

  fetchChatInfo: async (chatId) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    set({ isLoading: true });
    try {
      const resp = await axios.get(`${Config.API_URL}/chats/${chatId}/info`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ currentChatInfo: resp.data, isLoading: false });
    } catch (err) {
      console.error("Fetch Chat Info Error:", err);
      set({ isLoading: false });
    }
  },

  leaveGroup: async (chatId) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    try {
      await axios.post(`${Config.API_URL}/chats/${chatId}/leave`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      get().fetchChats();
    } catch (err) {
      console.error("Leave Group Error:", err);
      throw err;
    }
  },

  addMembersToGroup: async (chatId, memberIds) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    try {
      const resp = await axios.post(`${Config.API_URL}/chats/${chatId}/members`,
        { member_ids: memberIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Re-fetch chat info to update member list
      get().fetchChatInfo(chatId);
      return resp.data;
    } catch (err) {
      console.error("Add Members Error:", err);
      throw err;
    }
  },

  removeMember: async (chatId, userId) => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    try {
      await axios.delete(`${Config.API_URL}/chats/${chatId}/members/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Re-fetch chat info to update member list
      get().fetchChatInfo(chatId);
    } catch (err) {
      console.error("Remove Member Error:", err);
      throw err;
    }
  }
}));
