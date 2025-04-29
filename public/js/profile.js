import { api } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    const profileHeader = document.querySelector('.profile-header');
    const profileStats = document.querySelector('.profile-stats');
    const userPosts = document.getElementById('userPosts');
    const editProfileButton = document.querySelector('.edit-profile');

    // 載入個人資料
    async function loadProfile() {
        try {
            const profile = await api.getProfile();
            
            // 更新個人資料
            profileHeader.querySelector('h2').textContent = profile.displayName;
            profileHeader.querySelector('p').textContent = `@${profile.username}`;
            if (profile.avatar) {
                profileHeader.querySelector('img').src = profile.avatar;
            }

            // 更新統計數據
            profileStats.querySelector('.stat:nth-child(1) .number').textContent = profile.postsCount;
            profileStats.querySelector('.stat:nth-child(2) .number').textContent = profile.followersCount;
            profileStats.querySelector('.stat:nth-child(3) .number').textContent = profile.followingCount;

            // 載入用戶的貼文
            loadUserPosts(profile.id);
        } catch (error) {
            console.error('Failed to load profile:', error);
        }
    }

    // 載入用戶的貼文
    async function loadUserPosts(userId) {
        try {
            const posts = await api.getPosts();
            const userPosts = posts.filter(post => post.user.id === userId);
            
            userPosts.forEach(post => {
                const postElement = createPostElement(post);
                userPosts.appendChild(postElement);
            });
        } catch (error) {
            console.error('Failed to load user posts:', error);
        }
    }

    // 創建貼文元素
    function createPostElement(post) {
        const postElement = document.createElement('div');
        postElement.className = 'post';
        postElement.innerHTML = `
            <div class="post-content">${post.content}</div>
            ${post.image ? `<img src="${post.image}" alt="貼文圖片" class="post-image">` : ''}
            <div class="post-actions">
                <span class="likes">${post.likes} 讚</span>
                <span class="comments">${post.comments} 留言</span>
            </div>
        `;
        return postElement;
    }

    // 編輯個人資料按鈕點擊事件
    editProfileButton.addEventListener('click', () => {
        window.location.href = '/settings.html';
    });

    // 初始載入
    loadProfile();
}); 