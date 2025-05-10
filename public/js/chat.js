// 全局變量
let currentUser = null;
let currentRoom = null;
let messagePollingInterval = null;

// DOM 元素
const roomList = document.getElementById('roomList');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const createRoomBtn = document.getElementById('createRoomBtn');
const createRoomModal = document.getElementById('createRoomModal');
const createRoomForm = document.getElementById('createRoomForm');
const membersModal = document.getElementById('membersModal');
const showMembersBtn = document.getElementById('showMembersBtn');
const membersList = document.getElementById('membersList');
const currentRoomName = document.getElementById('currentRoomName');
const memberCount = document.getElementById('memberCount');

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    // 檢查登入狀態
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    try {
        // 獲取當前用戶信息
        const response = await fetch('/api/users/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('獲取用戶信息失敗');
        }

        currentUser = await response.json();
        document.getElementById('username').textContent = currentUser.username;

        // 加載聊天室列表
        loadRooms();
        
        // 設置事件監聽器
        setupEventListeners();
    } catch (error) {
        console.error('初始化失敗:', error);
        alert('初始化失敗，請重新登入');
        window.location.href = '/login.html';
    }
});

// 設置事件監聽器
function setupEventListeners() {
    // 發送訊息
    sendMessageBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // 新建聊天室
    createRoomBtn.addEventListener('click', () => {
        createRoomModal.classList.add('active');
        loadUserList();
    });

    // 關閉模態框
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            createRoomModal.classList.remove('active');
            membersModal.classList.remove('active');
        });
    });

    // 點擊模態框外部關閉
    [createRoomModal, membersModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // 創建聊天室表單提交
    createRoomForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(createRoomForm);
        const selectedMembers = Array.from(document.querySelectorAll('.member-item.selected'))
            .map(item => item.dataset.userId);

        try {
            const response = await fetch('/api/chat/rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    name: formData.get('roomName'),
                    type: formData.get('roomType'),
                    members: selectedMembers
                })
            });

            if (!response.ok) {
                throw new Error('創建聊天室失敗');
            }

            createRoomModal.classList.remove('active');
            createRoomForm.reset();
            loadRooms();
        } catch (error) {
            console.error('創建聊天室失敗:', error);
            alert('創建聊天室失敗');
        }
    });

    // 顯示成員列表
    showMembersBtn.addEventListener('click', () => {
        if (currentRoom) {
            loadRoomMembers();
            membersModal.classList.add('active');
        }
    });
}

// 加載聊天室列表
async function loadRooms() {
    try {
        const response = await fetch('/api/chat/rooms', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('獲取聊天室列表失敗');
        }

        const rooms = await response.json();
        renderRoomList(rooms);
    } catch (error) {
        console.error('加載聊天室列表失敗:', error);
    }
}

// 渲染聊天室列表
function renderRoomList(rooms) {
    roomList.innerHTML = rooms.map(room => `
        <div class="room-item" data-room-id="${room.id}">
            <div class="room-item-header">
                <span class="room-name">${room.name}</span>
                <span class="room-time">${formatTime(room.last_message_time)}</span>
            </div>
            <div class="room-last-message">${room.last_message || '尚無訊息'}</div>
        </div>
    `).join('');

    // 添加點擊事件
    document.querySelectorAll('.room-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.room-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            loadRoom(item.dataset.roomId);
        });
    });
}

// 加載聊天室
async function loadRoom(roomId) {
    currentRoom = roomId;
    messagesContainer.innerHTML = '';
    
    try {
        // 獲取聊天室信息
        const roomResponse = await fetch(`/api/chat/rooms/${roomId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!roomResponse.ok) {
            throw new Error('獲取聊天室信息失敗');
        }

        const room = await roomResponse.json();
        currentRoomName.textContent = room.name;
        memberCount.textContent = `${room.member_count} 位成員`;

        // 獲取訊息
        const messagesResponse = await fetch(`/api/chat/rooms/${roomId}/messages`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!messagesResponse.ok) {
            throw new Error('獲取訊息失敗');
        }

        const messages = await messagesResponse.json();
        renderMessages(messages);

        // 開始輪詢新訊息
        if (messagePollingInterval) {
            clearInterval(messagePollingInterval);
        }
        messagePollingInterval = setInterval(() => pollNewMessages(), 3000);
    } catch (error) {
        console.error('加載聊天室失敗:', error);
    }
}

// 渲染訊息
function renderMessages(messages) {
    messagesContainer.innerHTML = messages.map(message => `
        <div class="message ${message.user_id === currentUser.id ? 'sent' : 'received'}">
            <div class="message-header">
                <img src="${message.avatar || '/images/default-avatar.png'}" alt="${message.username}" class="message-avatar">
                <span class="message-username">${message.username}</span>
                <span class="message-time">${formatTime(message.created_at)}</span>
            </div>
            <div class="message-content">${message.content}</div>
        </div>
    `).join('');

    // 滾動到底部
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 發送訊息
async function sendMessage() {
    if (!currentRoom || !messageInput.value.trim()) return;

    try {
        const response = await fetch(`/api/chat/rooms/${currentRoom}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                content: messageInput.value.trim()
            })
        });

        if (!response.ok) {
            throw new Error('發送訊息失敗');
        }

        messageInput.value = '';
        const message = await response.json();
        appendMessage(message);
    } catch (error) {
        console.error('發送訊息失敗:', error);
        alert('發送訊息失敗');
    }
}

// 添加新訊息
function appendMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.user_id === currentUser.id ? 'sent' : 'received'}`;
    messageElement.innerHTML = `
        <div class="message-header">
            <img src="${message.avatar || '/images/default-avatar.png'}" alt="${message.username}" class="message-avatar">
            <span class="message-username">${message.username}</span>
            <span class="message-time">${formatTime(message.created_at)}</span>
        </div>
        <div class="message-content">${message.content}</div>
    `;
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 輪詢新訊息
async function pollNewMessages() {
    if (!currentRoom) return;

    try {
        const lastMessage = messagesContainer.lastElementChild;
        const before = lastMessage ? lastMessage.dataset.messageTime : null;

        const response = await fetch(`/api/chat/rooms/${currentRoom}/messages${before ? `?before=${before}` : ''}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('獲取新訊息失敗');
        }

        const messages = await response.json();
        messages.forEach(message => appendMessage(message));
    } catch (error) {
        console.error('輪詢新訊息失敗:', error);
    }
}

// 加載用戶列表
async function loadUserList() {
    try {
        const response = await fetch('/api/users', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('獲取用戶列表失敗');
        }

        const users = await response.json();
        const memberSelection = document.getElementById('memberSelection');
        memberSelection.innerHTML = users
            .filter(user => user.id !== currentUser.id)
            .map(user => `
                <div class="member-item" data-user-id="${user.id}">
                    <img src="${user.avatar || '/images/default-avatar.png'}" alt="${user.username}" class="member-avatar">
                    <span class="member-name">${user.username}</span>
                </div>
            `).join('');

        // 添加選擇事件
        document.querySelectorAll('.member-item').forEach(item => {
            item.addEventListener('click', () => {
                item.classList.toggle('selected');
            });
        });
    } catch (error) {
        console.error('加載用戶列表失敗:', error);
    }
}

// 加載聊天室成員
async function loadRoomMembers() {
    if (!currentRoom) return;

    try {
        const response = await fetch(`/api/chat/rooms/${currentRoom}/members`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('獲取成員列表失敗');
        }

        const members = await response.json();
        membersList.innerHTML = members.map(member => `
            <div class="member-card">
                <img src="${member.avatar || '/images/default-avatar.png'}" alt="${member.username}" class="member-avatar">
                <span class="member-name">${member.username}</span>
            </div>
        `).join('');
    } catch (error) {
        console.error('加載成員列表失敗:', error);
    }
}

// 格式化時間
function formatTime(timestamp) {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 24 * 60 * 60 * 1000) {
        return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    } else if (diff < 7 * 24 * 60 * 60 * 1000) {
        return date.toLocaleDateString('zh-TW', { weekday: 'short' });
    } else {
        return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
    }
}

// 登出
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
}); 