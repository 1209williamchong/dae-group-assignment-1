import { api } from './api.js';

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

// 初始化應用程式
document.addEventListener('DOMContentLoaded', async () => {
    // 檢查認證狀態
    try {
        const response = await api.checkAuth();
        if (!response.user_id) {
            // 未登入，跳轉到登入頁面
            window.location.href = '/login.html';
            return;
        }
    } catch (error) {
        console.error('檢查認證狀態失敗:', error);
        window.location.href = '/login.html';
        return;
    }

    const postForm = document.getElementById('postForm');
    const postsContainer = document.getElementById('posts');

    // 載入貼文
    async function loadPosts() {
        try {
            const posts = await api.getPosts();
            postsContainer.innerHTML = '';
            posts.forEach(post => {
                const postElement = createPostElement(post);
                postsContainer.appendChild(postElement);
            });
        } catch (error) {
            console.error('Failed to load posts:', error);
        }
    }

    // 創建貼文元素
    function createPostElement(post) {
        const postElement = document.createElement('div');
        postElement.className = 'post';
        postElement.innerHTML = `
            <div class="post-header">
                <img src="${post.user.avatar || 'https://via.placeholder.com/40'}" alt="用戶頭像" class="post-avatar">
                <div class="post-user-info">
                    <span class="post-username">${post.user.username}</span>
                    <span class="post-time">${formatTime(post.createdAt)}</span>
                </div>
            </div>
            <div class="post-content">${post.content}</div>
            ${post.image ? `<img src="${post.image}" alt="貼文圖片" class="post-image">` : ''}
            <div class="post-actions">
                <button class="like-button" data-post-id="${post.id}">
                    <span class="like-count">${post.likes}</span> 讚
                </button>
                <button class="comment-button" data-post-id="${post.id}">
                    <span class="comment-count">${post.comments}</span> 留言
                </button>
                <button class="share-button">分享</button>
            </div>
            <div class="comments-section" id="comments-${post.id}"></div>
        `;

        // 添加事件監聽器
        const likeButton = postElement.querySelector('.like-button');
        likeButton.addEventListener('click', async () => {
            try {
                await api.likePost(post.id);
                const likeCount = likeButton.querySelector('.like-count');
                likeCount.textContent = parseInt(likeCount.textContent) + 1;
            } catch (error) {
                console.error('Failed to like post:', error);
            }
        });

        const commentButton = postElement.querySelector('.comment-button');
        commentButton.addEventListener('click', () => {
            const commentsSection = postElement.querySelector(`#comments-${post.id}`);
            if (commentsSection.style.display === 'none') {
                loadComments(post.id);
                commentsSection.style.display = 'block';
            } else {
                commentsSection.style.display = 'none';
            }
        });

        return postElement;
    }

    // 載入評論
    async function loadComments(postId) {
        try {
            const comments = await api.getComments(postId);
            const commentsSection = document.getElementById(`comments-${postId}`);
            commentsSection.innerHTML = comments.map(comment => `
                <div class="comment">
                    <div class="comment-user">
                        <img src="${comment.user.avatar || 'https://via.placeholder.com/30'}" alt="用戶頭像" class="comment-avatar">
                        <span class="comment-username">${comment.user.username}</span>
                    </div>
                    <div class="comment-content">${comment.content}</div>
                    <div class="comment-time">${formatTime(comment.createdAt)}</div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Failed to load comments:', error);
        }
    }

    // 格式化時間
    function formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} 天前`;
        if (hours > 0) return `${hours} 小時前`;
        if (minutes > 0) return `${minutes} 分鐘前`;
        return '剛剛';
    }

    // 處理表單提交
    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const content = postForm.querySelector('textarea').value;
        const imageInput = postForm.querySelector('#imageInput');
        const image = imageInput.files[0];

        try {
            await api.createPost(content, image);
            postForm.reset();
            loadPosts();
        } catch (error) {
            console.error('Failed to create post:', error);
        }
    });

    // 初始載入貼文
    loadPosts();
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