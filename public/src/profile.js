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

// 事件監聽器
editProfileBtn.addEventListener('click', showEditProfileModal);
closeModalBtn.addEventListener('click', hideEditProfileModal);
cancelBtn.addEventListener('click', hideEditProfileModal);
editProfileForm.addEventListener('submit', updateProfile);
avatarInput.addEventListener('change', handleAvatarPreview);
uploadBtn.addEventListener('click', () => avatarInput.click());

// 點擊彈出視窗外部關閉
editProfileModal.addEventListener('click', (event) => {
    if (event.target === editProfileModal) {
        hideEditProfileModal();
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

// 初始化個人資料頁面
document.addEventListener('DOMContentLoaded', async () => {
    // 檢查登入狀態
    if (!authService.isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }

    const currentUser = authService.getCurrentUser();
    const profileContainer = document.querySelector('.profile-container');
    const userId = new URLSearchParams(window.location.search).get('id') || currentUser.id;

    // 載入用戶資料
    async function loadUserProfile() {
        try {
            const user = await fetchUserProfile(userId);
            const isFollowing = await authService.isFollowing(userId);
            
            // 更新個人資料區塊
            profileContainer.innerHTML = `
                <div class="profile-header">
                    <img src="${user.avatar || 'https://via.placeholder.com/150'}" alt="用戶頭像" class="profile-avatar">
                    <div class="profile-info">
                        <h2>${user.username}</h2>
                        <p>${user.bio || '這個用戶還沒有個人簡介'}</p>
                        <div class="profile-stats">
                            <div class="stat">
                                <span class="stat-value">${user.postsCount || 0}</span>
                                <span class="stat-label">貼文</span>
                            </div>
                            <div class="stat">
                                <span class="stat-value">${user.followersCount || 0}</span>
                                <span class="stat-label">追蹤者</span>
                            </div>
                            <div class="stat">
                                <span class="stat-value">${user.followingCount || 0}</span>
                                <span class="stat-label">追蹤中</span>
                            </div>
                        </div>
                        ${userId !== currentUser.id ? `
                            <button class="follow-button ${isFollowing ? 'following' : ''}">
                                ${isFollowing ? '取消追蹤' : '追蹤'}
                            </button>
                        ` : ''}
                    </div>
                </div>
                <div class="profile-posts">
                    <h3>貼文</h3>
                    <div class="posts-grid"></div>
                </div>
            `;

            // 如果是其他用戶的個人資料，添加追蹤按鈕事件監聽器
            if (userId !== currentUser.id) {
                const followButton = profileContainer.querySelector('.follow-button');
                followButton.addEventListener('click', async () => {
                    try {
                        const result = await toggleFollow(userId);
                        const user = await fetchUserProfile(userId);
                        
                        followButton.classList.toggle('following');
                        followButton.textContent = result.following ? '取消追蹤' : '追蹤';
                        
                        // 更新追蹤者數量
                        const followersCount = profileContainer.querySelector('.stat:nth-child(2) .stat-value');
                        followersCount.textContent = user.followersCount;
                    } catch (error) {
                        console.error('追蹤操作失敗:', error);
                        alert(error.message);
                    }
                });
            }

            // 載入用戶的貼文
            const postsGrid = profileContainer.querySelector('.posts-grid');
            const posts = await fetchPosts(userId);
            
            posts.forEach(post => {
                const postElement = document.createElement('div');
                postElement.className = 'post-grid-item';
                postElement.innerHTML = `
                    <img src="${post.image || 'https://via.placeholder.com/300'}" alt="貼文圖片">
                    <div class="post-overlay">
                        <span class="post-likes">❤️ ${post.likes}</span>
                        <span class="post-comments">💬 ${post.comments.length}</span>
                    </div>
                `;
                postsGrid.appendChild(postElement);
            });
        } catch (error) {
            console.error('載入個人資料失敗:', error);
            alert('載入個人資料失敗，請稍後再試');
        }
    }

    // 載入用戶資料
    await loadUserProfile();
}); 