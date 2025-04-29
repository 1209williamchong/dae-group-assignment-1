<template>
  <div class="chat-container">
    <div class="chat-sidebar">
      <div class="search-box">
        <input v-model="searchQuery" placeholder="搜尋用戶..." />
      </div>
      <div class="chat-list">
        <div
          v-for="chat in filteredChats"
          :key="chat.id"
          class="chat-item"
          :class="{ active: chat.id === currentChat?.id }"
          @click="selectChat(chat)"
        >
          <img :src="chat.user.avatar" :alt="chat.user.username" class="user-avatar" />
          <div class="chat-info">
            <span class="username">{{ chat.user.username }}</span>
            <span class="last-message">{{ chat.lastMessage }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="chat-main">
      <div v-if="currentChat" class="chat-messages">
        <div
          v-for="message in currentChat.messages"
          :key="message.id"
          class="message"
          :class="{ 'message-sent': message.isSent }"
        >
          <img v-if="!message.isSent" :src="currentChat.user.avatar" :alt="currentChat.user.username" class="message-avatar" />
          <div class="message-content">
            <p>{{ message.content }}</p>
            <span class="message-time">{{ formatTime(message.timestamp) }}</span>
          </div>
        </div>
      </div>

      <div v-if="currentChat" class="message-input">
        <input v-model="newMessage" placeholder="輸入訊息..." @keyup.enter="sendMessage" />
        <button @click="sendMessage">發送</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';

interface Chat {
  id: string;
  user: {
    id: string;
    username: string;
    avatar: string;
  };
  lastMessage: string;
  messages: Message[];
}

interface Message {
  id: string;
  content: string;
  timestamp: string;
  isSent: boolean;
}

export default defineComponent({
  name: 'Chat',
  setup() {
    const searchQuery = ref('');
    const chats = ref<Chat[]>([]);
    const currentChat = ref<Chat | null>(null);
    const newMessage = ref('');

    const filteredChats = computed(() => {
      if (!searchQuery.value) return chats.value;
      return chats.value.filter(chat =>
        chat.user.username.toLowerCase().includes(searchQuery.value.toLowerCase())
      );
    });

    const selectChat = (chat: Chat) => {
      currentChat.value = chat;
    };

    const sendMessage = async () => {
      if (!newMessage.value.trim() || !currentChat.value) return;

      try {
        const response = await fetch(`/api/chats/${currentChat.value.id}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: newMessage.value,
          }),
        });

        if (response.ok) {
          const message = await response.json();
          currentChat.value.messages.push(message);
          newMessage.value = '';
        }
      } catch (error) {
        console.error('發送訊息錯誤:', error);
      }
    };

    const formatTime = (timestamp: string) => {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return {
      searchQuery,
      chats,
      currentChat,
      newMessage,
      filteredChats,
      selectChat,
      sendMessage,
      formatTime,
    };
  },
});
</script>

<style scoped>
.chat-container {
  display: flex;
  height: 100vh;
}

.chat-sidebar {
  width: 300px;
  border-right: 1px solid #ddd;
  display: flex;
  flex-direction: column;
}

.search-box {
  padding: 10px;
  border-bottom: 1px solid #ddd;
}

.search-box input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.chat-list {
  flex: 1;
  overflow-y: auto;
}

.chat-item {
  display: flex;
  align-items: center;
  padding: 10px;
  cursor: pointer;
  border-bottom: 1px solid #eee;
}

.chat-item:hover {
  background-color: #f5f5f5;
}

.chat-item.active {
  background-color: #e3f2fd;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
}

.chat-info {
  flex: 1;
}

.username {
  font-weight: bold;
  display: block;
}

.last-message {
  color: #666;
  font-size: 0.8em;
  display: block;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.message {
  display: flex;
  margin-bottom: 15px;
  align-items: flex-start;
}

.message-sent {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  margin: 0 10px;
}

.message-content {
  max-width: 70%;
  background-color: #f0f0f0;
  padding: 10px;
  border-radius: 10px;
}

.message-sent .message-content {
  background-color: #42b983;
  color: white;
}

.message-time {
  font-size: 0.8em;
  color: #666;
  display: block;
  margin-top: 5px;
}

.message-input {
  padding: 10px;
  border-top: 1px solid #ddd;
  display: flex;
  gap: 10px;
}

.message-input input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  padding: 8px 15px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #3aa876;
}
</style> 