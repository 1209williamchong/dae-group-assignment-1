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
async function init() {
    try {
        console.log('開始初始化聊天功能...');
        
        // 檢查登入狀態
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('未找到登入令牌，重定向到登入頁面');
            window.location.href = '/login.html';
            return;
        }

        // 獲取當前用戶信息
        const response = await fetch('/api/users/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '獲取用戶信息失敗');
        }

        currentUser = await response.json();
        console.log('成功獲取用戶信息:', currentUser);

        // 設置事件監聽器
        document.getElementById('sendMessageBtn').addEventListener('click', sendMessage);
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        document.getElementById('createRoomBtn').addEventListener('click', () => {
            document.getElementById('createRoomModal').style.display = 'block';
            loadUsers();
        });

        document.getElementById('createRoomForm').addEventListener('submit', createRoom);

        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('createRoomModal').style.display = 'none';
                document.getElementById('membersModal').style.display = 'none';
            });
        });

        document.getElementById('showMembersBtn').addEventListener('click', () => {
            document.getElementById('membersModal').style.display = 'block';
            loadRoomMembers();
        });

        // 加載聊天室列表
        await loadRooms();
        
        // 自動選擇第一個聊天室
        const firstRoom = document.querySelector('.room-item');
        if (firstRoom) {
            firstRoom.click();
        }
        
        console.log('聊天功能初始化完成');
    } catch (error) {
        console.error('初始化失敗:', error);
        alert('初始化失敗，請重新登入');
        window.location.href = '/login.html';
    }
}

// 加載聊天室列表
async function loadRooms() {
    try {
        console.log('開始加載聊天室列表...');
        const response = await fetch('/api/chat/rooms', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '獲取聊天室列表失敗');
        }

        const rooms = await response.json();
        console.log('成功獲取聊天室列表:', rooms);
        
        if (rooms.length === 0) {
            roomList.innerHTML = '<div class="no-rooms">尚無聊天室，點擊「新建聊天室」開始聊天</div>';
            return;
        }

        renderRoomList(rooms);
    } catch (error) {
        console.error('加載聊天室列表失敗:', error);
        roomList.innerHTML = '<div class="error-message">加載聊天室失敗，請稍後再試</div>';
    }
}

// 渲染聊天室列表
function renderRoomList(rooms) {
    roomList.innerHTML = rooms.map(room => `
        <div class="room-item" data-room-id="${room.id}">
            <div class="room-item-header">
                <span class="room-name">${room.name || '未命名聊天室'}</span>
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

// 加載聊天室訊息
async function loadRoom(roomId) {
    try {
        console.log('開始加載聊天室訊息:', roomId);
        currentRoom = roomId;
        
        // 更新聊天室標題
        const roomName = document.querySelector(`.room-item[data-room-id="${roomId}"] .room-name`).textContent;
        document.querySelector('.chat-header h2').textContent = roomName;
        
        // 獲取訊息
        const response = await fetch(`/api/chat/rooms/${roomId}/messages`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '獲取聊天室訊息失敗');
        }

        const messages = await response.json();
        console.log('成功獲取聊天室訊息:', messages);
        
        // 渲染訊息
        renderMessages(messages);
        
        // 開始輪詢新訊息
        startMessagePolling();
    } catch (error) {
        console.error('加載聊天室訊息失敗:', error);
        messagesContainer.innerHTML = '<div class="error-message">加載訊息失敗，請稍後再試</div>';
    }
}

// 渲染訊息列表
function renderMessages(messages) {
    if (messages.length === 0) {
        messagesContainer.innerHTML = '<div class="no-messages">尚無訊息，開始聊天吧！</div>';
        return;
    }

    messagesContainer.innerHTML = messages.map(message => `
        <div class="message ${message.user_id === currentUser.id ? 'sent' : 'received'}">
            <div class="message-header">
                <span class="message-sender">${message.username}</span>
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
    const content = messageInput.value.trim();
    if (!content || !currentRoom) return;

    try {
        console.log('開始發送訊息:', { roomId: currentRoom, content });
        const response = await fetch(`/api/chat/rooms/${currentRoom}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ content })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '發送訊息失敗');
        }

        const message = await response.json();
        console.log('訊息發送成功:', message);
        
        // 清空輸入框
        messageInput.value = '';
        
        // 重新加載訊息
        await loadRoom(currentRoom);
    } catch (error) {
        console.error('發送訊息失敗:', error);
        alert('發送訊息失敗，請稍後再試');
    }
}

// 開始輪詢新訊息
function startMessagePolling() {
    if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
    }
    messagePollingInterval = setInterval(() => pollNewMessages(), 3000);
}

// 輪詢新訊息
async function pollNewMessages() {
    if (!currentRoom) return;

    try {
        const response = await fetch(`/api/chat/rooms/${currentRoom}/messages`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '獲取新訊息失敗');
        }

        const messages = await response.json();
        renderMessages(messages);
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
        console.log('開始加載聊天室成員:', currentRoom);
        const response = await fetch(`/api/chat/rooms/${currentRoom}/members`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '獲取聊天室成員失敗');
        }

        const members = await response.json();
        console.log('成功獲取聊天室成員:', members);
        
        const membersList = document.getElementById('membersList');
        membersList.innerHTML = members.map(member => `
            <div class="member-item">
                <span class="member-name">${member.username}</span>
                <span class="member-role">${member.role}</span>
                <span class="member-join-time">加入時間：${formatTime(member.joined_at)}</span>
            </div>
        `).join('');
    } catch (error) {
        console.error('加載聊天室成員失敗:', error);
        alert('加載聊天室成員失敗，請稍後再試');
    }
}

// 格式化時間
function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 登出
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = '/login.html';
});

// 創建聊天室
async function createRoom(event) {
    event.preventDefault();
    
    const name = document.getElementById('roomName').value.trim();
    const type = document.getElementById('roomType').value;
    const members = Array.from(document.getElementById('roomMembers').selectedOptions).map(option => option.value);
    
    if (!name) {
        alert('請輸入聊天室名稱');
        return;
    }
    
    if (members.length === 0) {
        alert('請選擇至少一位成員');
        return;
    }

    try {
        console.log('開始創建聊天室:', { name, type, members });
        const response = await fetch('/api/chat/rooms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ name, type, members })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '創建聊天室失敗');
        }

        const room = await response.json();
        console.log('聊天室創建成功:', room);
        
        // 關閉模態框
        document.getElementById('createRoomModal').style.display = 'none';
        
        // 清空表單
        document.getElementById('createRoomForm').reset();
        
        // 重新加載聊天室列表
        await loadRooms();
        
        // 自動選擇新創建的聊天室
        const newRoomItem = document.querySelector(`.room-item[data-room-id="${room.id}"]`);
        if (newRoomItem) {
            newRoomItem.click();
        }
    } catch (error) {
        console.error('創建聊天室失敗:', error);
        alert('創建聊天室失敗，請稍後再試');
    }
}

// 加載用戶列表
async function loadUsers() {
    try {
        console.log('開始加載用戶列表...');
        const response = await fetch('/api/users', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '獲取用戶列表失敗');
        }

        const users = await response.json();
        console.log('成功獲取用戶列表:', users);
        
        const memberSelect = document.getElementById('roomMembers');
        memberSelect.innerHTML = users
            .filter(user => user.id !== currentUser.id)
            .map(user => `<option value="${user.id}">${user.username}</option>`)
            .join('');
    } catch (error) {
        console.error('加載用戶列表失敗:', error);
        alert('加載用戶列表失敗，請稍後再試');
    }
}

// 啟動應用
init(); 