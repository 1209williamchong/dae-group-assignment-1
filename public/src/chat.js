import { ajax } from './services/ajax.js';
import { isLoggedIn, logout } from './services/auth.js';

// 背景相關的常量和變量
const WALLPAPER_KEY = 'chat_wallpaper';
const DEFAULT_WALLPAPER = '/images/wallpapers/default.jpg';
const WALLPAPER_OPTIONS = {
    default: '/images/wallpapers/default.jpg',
    nature: '/images/wallpapers/nature.jpg',
    gradient: '/images/wallpapers/gradient.jpg'
};

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
const chatContainer = document.querySelector('.chat-container');
const changeWallpaperBtn = document.getElementById('change-wallpaper-btn');
const wallpaperModal = document.getElementById('wallpaper-modal');
const closeModalBtn = document.querySelector('.close-modal');
const wallpaperOptions = document.querySelectorAll('.wallpaper-option');
const customWallpaperUpload = document.querySelector('.custom-wallpaper-upload');
const customWallpaperInput = document.getElementById('custom-wallpaper');
const uploadWallpaperBtn = document.getElementById('upload-wallpaper');

// 狀態變量
let currentChatId = null;
let currentUserId = null;
let socket = null;

// 聊天室功能
const CHAT = {
    // 初始化聊天室
    init() {
        this.currentChat = null;
        this.socket = null;
        this.setupEventListeners();
        this.connectToServer();
    },

    // 設置事件監聽器
    setupEventListeners() {
        // 搜索聊天室
        document.getElementById('chat-search').addEventListener('input', (e) => {
            this.searchChats(e.target.value);
        });

        // 發送訊息
        document.getElementById('send-message').addEventListener('click', () => {
            this.sendMessage();
        });

        // 按 Enter 發送訊息
        document.getElementById('message-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // 上傳檔案
        document.getElementById('upload-file').addEventListener('click', () => {
            this.uploadFile();
        });
    },

    // 連接到 WebSocket 伺服器
    connectToServer() {
        this.socket = new WebSocket('ws://localhost:3000/chat');

        this.socket.onopen = () => {
            console.log('已連接到聊天伺服器');
        };

        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
        };

        this.socket.onclose = () => {
            console.log('與聊天伺服器的連接已關閉');
            // 嘗試重新連接
            setTimeout(() => this.connectToServer(), 5000);
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket 錯誤:', error);
        };
    },

    // 搜尋聊天室
    searchChats(query) {
        const chatList = document.getElementById('chat-list');
        const chats = chatList.getElementsByClassName('chat-item');

        Array.from(chats).forEach(chat => {
            const name = chat.querySelector('.chat-item-name').textContent.toLowerCase();
            if (name.includes(query.toLowerCase())) {
                chat.style.display = 'flex';
            } else {
                chat.style.display = 'none';
            }
        });
    },

    // 選擇聊天室
    selectChat(chatId) {
        this.currentChat = chatId;
        this.loadChatHistory(chatId);
        this.updateActiveChat(chatId);
    },

    // 更新當前選中的聊天室
    updateActiveChat(chatId) {
        const chats = document.getElementsByClassName('chat-item');
        Array.from(chats).forEach(chat => {
            if (chat.dataset.chatId === chatId) {
                chat.classList.add('active');
            } else {
                chat.classList.remove('active');
            }
        });
    },

    // 載入聊天歷史
    async loadChatHistory(chatId) {
        try {
            const response = await fetch(`/api/chats/${chatId}/messages`);
            const messages = await response.json();
            this.displayMessages(messages);
        } catch (error) {
            console.error('載入聊天歷史失敗:', error);
        }
    },

    // 顯示訊息
    displayMessages(messages) {
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.innerHTML = '';

        messages.forEach(message => {
            const messageElement = this.createMessageElement(message);
            messagesContainer.appendChild(messageElement);
        });

        // 滾動到底部
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },

    // 創建訊息元素
    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.sender === USER.id ? 'sent' : 'received'}`;
        
        const content = document.createElement('div');
        content.className = 'message-content';
        content.textContent = message.content;
        
        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = new Date(message.timestamp).toLocaleTimeString();
        
        messageDiv.appendChild(content);
        messageDiv.appendChild(time);
        
        return messageDiv;
    },

    // 發送訊息
    sendMessage() {
        if (!this.currentChat) return;

        const input = document.getElementById('message-input');
        const content = input.value.trim();
        
        if (!content) return;

        const message = {
            type: 'message',
            chatId: this.currentChat,
            content: content,
            timestamp: new Date().toISOString()
        };

        this.socket.send(JSON.stringify(message));
        input.value = '';
    },

    // 處理接收到的訊息
    handleMessage(message) {
        if (message.type === 'message' && message.chatId === this.currentChat) {
            const messagesContainer = document.getElementById('chat-messages');
            const messageElement = this.createMessageElement(message);
            messagesContainer.appendChild(messageElement);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    },

    // 上傳檔案
    async uploadFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,video/*,audio/*';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const formData = new FormData();
            formData.append('file', file);
            formData.append('chatId', this.currentChat);

            try {
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    const result = await response.json();
                    this.sendMessage({
                        type: 'file',
                        chatId: this.currentChat,
                        fileUrl: result.url,
                        fileName: file.name
                    });
                }
            } catch (error) {
                console.error('上傳檔案失敗:', error);
            }
        };

        input.click();
    }
};

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

    // 初始化背景
    initWallpaper();

    // 事件監聽器
    sendMessageBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    newChatBtn.addEventListener('click', createNewChat);
    chatSearch.addEventListener('input', searchChats);
    changeWallpaperBtn.addEventListener('click', showWallpaperModal);
    closeModalBtn.addEventListener('click', hideWallpaperModal);

    wallpaperOptions.forEach(option => {
        option.addEventListener('click', () => {
            const wallpaper = option.dataset.wallpaper;
            handleWallpaperSelection(wallpaper);
        });
    });

    customWallpaperInput.addEventListener('change', handleCustomWallpaperUpload);

    // 點擊彈窗外部關閉
    window.addEventListener('click', (event) => {
        if (event.target === wallpaperModal) {
            hideWallpaperModal();
        }
    });
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

// 初始化背景
function initWallpaper() {
    const savedWallpaper = localStorage.getItem(WALLPAPER_KEY) || DEFAULT_WALLPAPER;
    setWallpaper(savedWallpaper);
}

// 設置背景
function setWallpaper(url) {
    chatContainer.style.backgroundImage = `url(${url})`;
    localStorage.setItem(WALLPAPER_KEY, url);
}

// 顯示背景選擇彈窗
function showWallpaperModal() {
    wallpaperModal.style.display = 'block';
}

// 隱藏背景選擇彈窗
function hideWallpaperModal() {
    wallpaperModal.style.display = 'none';
    customWallpaperUpload.style.display = 'none';
}

// 處理背景選擇
function handleWallpaperSelection(wallpaper) {
    if (wallpaper === 'custom') {
        customWallpaperUpload.style.display = 'flex';
    } else {
        const wallpaperUrl = WALLPAPER_OPTIONS[wallpaper];
        setWallpaper(wallpaperUrl);
        hideWallpaperModal();
    }
}

// 處理自定義背景上傳
function handleCustomWallpaperUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            setWallpaper(e.target.result);
            hideWallpaperModal();
        };
        reader.readAsDataURL(file);
    }
}

// 初始化應用
init();

// 初始化聊天室
document.addEventListener('DOMContentLoaded', () => {
    CHAT.init();
}); 