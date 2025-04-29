import { authService } from '../src/services/auth.js';

const API_BASE_URL = 'http://localhost:3000/api';

// 定義 Post 類別
class Post {
    constructor(content, image = null) {
        this.id = Date.now();
        this.content = content;
        this.image = image;
        this.likes = 0;
        this.comments = [];
        this.timestamp = new Date();
    }
}

// API 函數
async function fetchPosts() {
    const response = await fetch(`${API_BASE_URL}/posts`);
    return await response.json();
}

async function createPost(content, image) {
    const formData = new FormData();
    formData.append('content', content);
    if (image) {
        formData.append('image', image);
    }

    const response = await fetch(`${API_BASE_URL}/posts`, {
        method: 'POST',
        body: formData
    });
    return await response.json();
}

async function toggleLike(postId) {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
        throw new Error('請先登入');
    }

    const response = await fetch(`${API_BASE_URL}/likes`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            postId,
            userId: currentUser.id
        })
    });
    return await response.json();
}

// 初始化應用程式
document.addEventListener('DOMContentLoaded', async () => {
    // 檢查登入狀態
    if (!authService.isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }

    const currentUser = authService.getCurrentUser();
    const header = document.querySelector('header');
    
    // 添加用戶資訊和登出按鈕
    const userInfo = document.createElement('div');
    userInfo.className = 'user-info';
    userInfo.innerHTML = `
        <span>歡迎，${currentUser?.username}</span>
        <button id="logoutButton">登出</button>
    `;
    header.appendChild(userInfo);

    // 登出功能
    document.getElementById('logoutButton').addEventListener('click', () => {
        authService.logout();
        window.location.href = '/login.html';
    });

    const postForm = document.getElementById('postForm');
    const postsContainer = document.getElementById('posts');

    // 載入貼文
    async function loadPosts() {
        try {
            const posts = await fetchPosts();
            postsContainer.innerHTML = '';
            
            for (const post of posts) {
                const postElement = createPostElement(post);
                postsContainer.appendChild(postElement);
                
                // 更新按讚狀態
                const likeCount = await authService.getPostLikes(post.id);
                const hasLiked = await authService.hasUserLiked(post.id);
                
                const likeButton = postElement.querySelector('.like-button');
                const likeCountSpan = postElement.querySelector('.like-count');
                
                likeCountSpan.textContent = likeCount.toString();
                likeButton.classList.toggle('liked', hasLiked);
            }
        } catch (error) {
            console.error('載入貼文失敗:', error);
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
                <button class="like-button">
                    <span class="like-icon">❤️</span>
                    <span class="like-count">0</span>
                </button>
                <button class="comment-button">💬 留言</button>
                <button class="share-button">↗️ 分享</button>
            </div>
            <div class="comments-section"></div>
        `;

        // 添加按讚事件監聽器
        const likeButton = postElement.querySelector('.like-button');
        likeButton.addEventListener('click', async () => {
            try {
                const result = await toggleLike(post.id);
                const likeCount = await authService.getPostLikes(post.id);
                
                likeButton.classList.toggle('liked', result.liked);
                likeButton.querySelector('.like-count').textContent = likeCount.toString();
            } catch (error) {
                console.error('按讚失敗:', error);
                alert(error.message);
            }
        });

        return postElement;
    }

    // 處理表單提交
    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const content = postForm.querySelector('textarea').value;
        const imageInput = postForm.querySelector('#imageInput');
        const image = imageInput.files[0];

        if (!content && !image) {
            alert('請輸入內容或上傳圖片');
            return;
        }

        try {
            await createPost(content, image);
            await loadPosts();
            postForm.reset();
        } catch (error) {
            console.error('發布貼文失敗:', error);
            alert('發布貼文失敗，請稍後再試');
        }
    });

    // 初始載入貼文
    await loadPosts();
});

// 全局函數
window.likePost = function(postId) {
    const posts = JSON.parse(localStorage.getItem('posts')) || [];
    const post = posts.find(p => p.id === postId);
    if (post) {
        post.likes++;
        localStorage.setItem('posts', JSON.stringify(posts));
        document.querySelector(`#posts .post:nth-child(${posts.indexOf(post) + 1}) .post-actions button:first-child`)
            .textContent = `❤️ ${post.likes}`;
    }
};

window.commentPost = function(postId) {
    const comment = prompt('輸入你的留言：');
    if (comment) {
        const posts = JSON.parse(localStorage.getItem('posts')) || [];
        const post = posts.find(p => p.id === postId);
        if (post) {
            post.comments.push(comment);
            localStorage.setItem('posts', JSON.stringify(posts));
            const commentsContainer = document.getElementById(`comments-${postId}`);
            const commentElement = document.createElement('div');
            commentElement.className = 'comment';
            commentElement.innerHTML = `<p>${comment}</p>`;
            commentsContainer.appendChild(commentElement);
        }
    }
}; 