import { ajax } from './services/ajax.js';
import { isLoggedIn, logout } from './services/auth.js';

// DOM 元素
const chatList = document.getElementById('chat-list');
const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const sendMessageBtn = document.getElementById('send-message-btn');
const newChatBtn = document.getElementById('new-chat-btn');
const chatSearch = document.getElementById('chat-search');
const chatAvatar = document.getElementById('chat-avatar');
const chatName = document.getElementById('chat-name');
const chatStatus = document.getElementById('chat-status');

// 狀態變量
let currentChatId = null;
let currentUserId = null;
let socket = null;

// 初始化
async function init() {
    if (!isLoggedIn()) {
        window.location.href = '/login.html';
        return;
    }

    // 獲取當前用戶 ID
    try {
        const user = await ajax.users.getCurrentUser();
        currentUserId = user.id;
    } catch (error) {
        console.error('獲取用戶信息失敗:', error);
        return;
    }

    // 載入聊天列表
    loadChats();

    // 初始化 WebSocket
    initWebSocket();

    // 事件監聽器
    sendMessageBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    newChatBtn.addEventListener('click', createNewChat);
    chatSearch.addEventListener('input', searchChats);
}

// 初始化 WebSocket
function initWebSocket() {
    socket = new WebSocket(`ws://localhost:3000/chat?token=${localStorage.getItem('token')}`);

    socket.onopen = () => {
        console.log('WebSocket 連接已建立');
    };

    socket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleIncomingMessage(message);
    };

    socket.onclose = () => {
        console.log('WebSocket 連接已關閉');
        // 嘗試重新連接
        setTimeout(initWebSocket, 5000);
    };

    socket.onerror = (error) => {
        console.error('WebSocket 錯誤:', error);
    };
}

// 載入聊天列表
async function loadChats() {
    try {
        const chats = await ajax.chats.getAll();
        renderChatList(chats);
    } catch (error) {
        console.error('載入聊天列表失敗:', error);
    }
}

// 渲染聊天列表
function renderChatList(chats) {
    chatList.innerHTML = '';
    chats.forEach(chat => {
        const chatElement = createChatElement(chat);
        chatList.appendChild(chatElement);
    });
}

// 創建聊天元素
function createChatElement(chat) {
    const div = document.createElement('div');
    div.className = 'chat-item';
    div.dataset.chatId = chat.id;
    
    div.innerHTML = `
        <img src="${chat.participant.avatar}" alt="${chat.participant.username}">
        <div class="chat-item-info">
            <h3>${chat.participant.username}</h3>
            <p>${chat.lastMessage || '沒有訊息'}</p>
        </div>
    `;

    div.addEventListener('click', () => selectChat(chat));
    return div;
}

// 選擇聊天
async function selectChat(chat) {
    currentChatId = chat.id;
    
    // 更新聊天信息
    chatAvatar.src = chat.participant.avatar;
    chatName.textContent = chat.participant.username;
    chatStatus.textContent = chat.participant.isOnline ? '在線' : '離線';
    
    // 載入聊天記錄
    try {
        const messages = await ajax.chats.getMessages(chat.id);
        renderMessages(messages);
    } catch (error) {
        console.error('載入聊天記錄失敗:', error);
    }
}

// 渲染訊息
function renderMessages(messages) {
    messagesContainer.innerHTML = '';
    messages.forEach(message => {
        const messageElement = createMessageElement(message);
        messagesContainer.appendChild(messageElement);
    });
    scrollToBottom();
}

// 創建訊息元素
function createMessageElement(message) {
    const div = document.createElement('div');
    div.className = `message ${message.senderId === currentUserId ? 'sent' : 'received'}`;
    
    div.innerHTML = `
        <div class="message-content">${message.content}</div>
        <div class="message-time">${formatTime(message.createdAt)}</div>
    `;
    
    return div;
}

// 發送訊息
async function sendMessage() {
    if (!currentChatId || !messageInput.value.trim()) return;

    const content = messageInput.value.trim();
    try {
        await ajax.chats.sendMessage(currentChatId, content);
        messageInput.value = '';
    } catch (error) {
        console.error('發送訊息失敗:', error);
    }
}

// 處理接收到的訊息
function handleIncomingMessage(message) {
    if (message.chatId === currentChatId) {
        const messageElement = createMessageElement(message);
        messagesContainer.appendChild(messageElement);
        scrollToBottom();
    }
    // 更新聊天列表中的最後一條訊息
    updateChatList(message);
}

// 更新聊天列表
function updateChatList(message) {
    const chatItem = document.querySelector(`.chat-item[data-chat-id="${message.chatId}"]`);
    if (chatItem) {
        const lastMessage = chatItem.querySelector('.chat-item-info p');
        lastMessage.textContent = message.content;
    }
}

// 創建新聊天
async function createNewChat() {
    // 這裡可以實現選擇用戶開始新聊天的功能
    // 例如：彈出用戶選擇對話框
}

// 搜尋聊天
function searchChats() {
    const query = chatSearch.value.trim().toLowerCase();
    const chatItems = document.querySelectorAll('.chat-item');
    
    chatItems.forEach(item => {
        const username = item.querySelector('h3').textContent.toLowerCase();
        item.style.display = username.includes(query) ? 'flex' : 'none';
    });
}

// 滾動到底部
function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 格式化時間
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
}

// 初始化應用
init(); 