import { authService } from '../src/services/auth.js';
import { api } from './api.js';

const API_BASE_URL = 'http://localhost:3000/api';

// DOM 元素
const editProfileBtn = document.querySelector('.edit-profile-btn');
const editProfileModal = document.getElementById('editProfileModal');
const closeModalBtn = document.querySelector('.close-modal');
const cancelBtn = document.querySelector('.cancel-btn');
const editProfileForm = document.getElementById('editProfileForm');
const avatarInput = document.getElementById('edit-avatar');
const avatarPreview = document.querySelector('.avatar-preview img');
const uploadBtn = document.querySelector('.upload-btn');
const logoutBtn = document.getElementById('logout-btn');

// 設置面板功能
const settingsBtn = document.querySelector('.settings-btn');
const settingsPanel = document.querySelector('.settings-panel');
const closeSettings = document.querySelector('.close-settings');
const themeOptions = document.querySelectorAll('.theme-option');
const deleteAccountBtn = document.querySelector('.delete-account-btn');

// 檢查登入狀態
function checkAuthStatus() {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
        window.location.href = '/register.html';
        return;
    }
    return currentUser;
}

// 顯示編輯個人檔案彈出視窗
function showEditProfileModal() {
    editProfileModal.classList.add('active');
    // 載入當前用戶資料
    loadCurrentProfile();
}

// 隱藏編輯個人檔案彈出視窗
function hideEditProfileModal() {
    editProfileModal.classList.remove('active');
}

// 載入當前用戶資料
async function loadCurrentProfile() {
    try {
        const profile = await api.getProfile();
        document.getElementById('edit-username').value = profile.username;
        document.getElementById('edit-bio').value = profile.bio || '';
        avatarPreview.src = profile.avatar || 'https://picsum.photos/seed/avatar/150/150';
    } catch (error) {
        console.error('載入個人資料失敗:', error);
        alert('載入個人資料失敗，請稍後再試');
    }
}

// 處理頭像上傳預覽
function handleAvatarPreview(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            avatarPreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// 更新個人資料
async function updateProfile(event) {
    event.preventDefault();
    
    const formData = new FormData();
    formData.append('username', document.getElementById('edit-username').value);
    formData.append('bio', document.getElementById('edit-bio').value);
    
    if (avatarInput.files[0]) {
        formData.append('avatar', avatarInput.files[0]);
    }

    try {
        await api.updateProfile(formData);
        alert('個人資料已更新');
        hideEditProfileModal();
        // 重新載入頁面以顯示更新後的資料
        window.location.reload();
    } catch (error) {
        console.error('更新個人資料失敗:', error);
        alert('更新個人資料失敗，請稍後再試');
    }
}

// 處理登出
function handleLogout() {
    authService.logout();
    window.location.href = '/register.html';
}

// 事件監聽器
document.addEventListener('DOMContentLoaded', () => {
    const currentUser = checkAuthStatus();
    if (!currentUser) return;

    editProfileBtn.addEventListener('click', showEditProfileModal);
    closeModalBtn.addEventListener('click', hideEditProfileModal);
    cancelBtn.addEventListener('click', hideEditProfileModal);
    editProfileForm.addEventListener('submit', updateProfile);
    avatarInput.addEventListener('change', handleAvatarPreview);
    uploadBtn.addEventListener('click', () => avatarInput.click());
    logoutBtn.addEventListener('click', handleLogout);

    // 點擊彈出視窗外部關閉
    editProfileModal.addEventListener('click', (event) => {
        if (event.target === editProfileModal) {
            hideEditProfileModal();
        }
    });

    // 載入用戶資料
    loadUserProfile();

    // 打開設置面板
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            console.log('Settings button clicked');
            settingsPanel.classList.add('active');
        });
    }

    // 關閉設置面板
    if (closeSettings) {
        closeSettings.addEventListener('click', () => {
            settingsPanel.classList.remove('active');
        });
    }

    // 點擊設置面板外部關閉
    document.addEventListener('click', (e) => {
        if (settingsPanel.classList.contains('active') && 
            !settingsPanel.contains(e.target) && 
            e.target !== settingsBtn) {
            settingsPanel.classList.remove('active');
        }
    });

    // 主題切換
    if (themeOptions) {
        themeOptions.forEach(option => {
            option.addEventListener('click', () => {
                themeOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                const theme = option.dataset.theme;
                document.body.className = theme;
                localStorage.setItem('theme', theme);
            });
        });
    }

    // 載入保存的主題
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.className = savedTheme;
        themeOptions.forEach(option => {
            if (option.dataset.theme === savedTheme) {
                option.classList.add('active');
            }
        });
    }

    // 刪除帳號確認
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', () => {
            if (confirm('確定要刪除帳號嗎？此操作無法復原。')) {
                // 這裡添加刪除帳號的 API 調用
                console.log('刪除帳號');
            }
        });
    }

    // 切換通知設置
    const notificationToggle = document.getElementById('notifications');
    if (notificationToggle) {
        notificationToggle.addEventListener('change', (e) => {
            // 這裡添加通知設置的 API 調用
            console.log('通知設置已更改:', e.target.checked);
        });
    }

    // 貼文可見性設置
    const postVisibility = document.querySelector('.settings-select');
    if (postVisibility) {
        postVisibility.addEventListener('change', (e) => {
            // 這裡添加貼文可見性設置的 API 調用
            console.log('貼文可見性已更改:', e.target.value);
        });
    }

    // 修改密碼
    const changePasswordBtn = document.querySelector('.settings-action-btn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            // 這裡添加修改密碼的邏輯
            console.log('修改密碼');
        });
    }

    // 修改電子郵件
    const changeEmailBtn = document.querySelectorAll('.settings-action-btn')[1];
    if (changeEmailBtn) {
        changeEmailBtn.addEventListener('click', () => {
            // 這裡添加修改電子郵件的邏輯
            console.log('修改電子郵件');
        });
    }
});

// API 函數
async function fetchUserProfile(userId) {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`);
    return await response.json();
}

async function toggleFollow(userId) {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
        throw new Error('請先登入');
    }

    const response = await fetch(`${API_BASE_URL}/follows`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            followerId: currentUser.id,
            followedId: userId
        })
    });
    return await response.json();
}

// 獲取用戶的貼文
async function fetchPosts(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/posts`);
        if (!response.ok) {
            throw new Error('獲取貼文失敗');
        }
        return await response.json();
    } catch (error) {
        console.error('獲取貼文失敗:', error);
        return [];
    }
}

// 載入用戶資料和貼文
async function loadUserProfile() {
    const currentUser = authService.getCurrentUser();
    const userId = new URLSearchParams(window.location.search).get('id') || currentUser.id;

    try {
        const user = await fetchUserProfile(userId);
        const isFollowing = await authService.isFollowing(userId);
        
        // 更新個人資料區塊
        document.querySelector('.profile-name h2').textContent = user.username;
        document.querySelector('.profile-bio p').textContent = user.bio || '這個用戶還沒有個人簡介';
        
        // 更新統計數字
        document.querySelector('.stat:nth-child(1) .stat-number').textContent = user.postsCount || 0;
        document.querySelector('.stat:nth-child(2) .stat-number').textContent = user.followersCount || 0;
        document.querySelector('.stat:nth-child(3) .stat-number').textContent = user.followingCount || 0;

        // 更新頭像
        document.querySelector('.profile-avatar img').src = user.avatar || 'https://picsum.photos/seed/avatar/150/150';

        // 載入貼文
        const posts = await fetchPosts(userId);
        const gridRow = document.querySelector('.grid-row');
        gridRow.innerHTML = '';

        posts.forEach(post => {
            const postElement = document.createElement('div');
            postElement.className = 'grid-item';
            postElement.innerHTML = `
                <img src="${post.image || 'https://picsum.photos/seed/1/600/600'}" alt="貼文">
                <div class="post-overlay">
                    <div class="post-stats">
                        <span><ion-icon name="heart-outline"></ion-icon> ${post.likes || 0}</span>
                        <span><ion-icon name="chatbubble-outline"></ion-icon> ${post.comments?.length || 0}</span>
                    </div>
                </div>
            `;
            gridRow.appendChild(postElement);
        });
    } catch (error) {
        console.error('載入個人資料失敗:', error);
        alert('載入個人資料失敗，請稍後再試');
    }
}

// 處理編輯個人檔案按鈕
function openEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    modal.style.display = 'flex';
}

// 處理設置按鈕
function openSettingsPanel() {
    const settingsPanel = document.querySelector('.settings-panel');
    settingsPanel.classList.add('active');
}

// 處理貼文點擊
function openPost(postId) {
    window.location.href = `/post.html?id=${postId}`;
}

// 處理更改密碼
function changePassword() {
    window.location.href = '/change-password.html';
}

// 處理更改電子郵件
function changeEmail() {
    window.location.href = '/change-email.html';
}

// 處理主題切換
function changeTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

// 處理刪除帳號
function deleteAccount() {
    if (confirm('確定要刪除帳號嗎？此操作無法復原。')) {
        // TODO: 實作刪除帳號的 API 呼叫
        console.log('刪除帳號');
    }
}

// 關閉按鈕的事件監聽器
document.addEventListener('DOMContentLoaded', () => {
    // 關閉編輯個人檔案彈出視窗
    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            const modal = document.getElementById('editProfileModal');
            modal.style.display = 'none';
        });
    }

    // 關閉設置面板
    const closeSettingsBtn = document.querySelector('.close-settings');
    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', () => {
            const settingsPanel = document.querySelector('.settings-panel');
            settingsPanel.classList.remove('active');
        });
    }

    // 載入儲存的主題
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.setAttribute('data-theme', savedTheme);
    }
}); 