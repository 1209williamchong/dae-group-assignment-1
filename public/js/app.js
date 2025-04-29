import { authService } from '../src/services/auth.js';
import { postsApi, bookmarksApi } from '../src/services/api.js';

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

// 錯誤處理函數
function handleApiError(error) {
    console.error('API 錯誤:', error);
    let errorMessage = '發生錯誤，請稍後再試';
    
    if (error.status === 400) {
        errorMessage = '請求無效，請檢查輸入的資料';
    } else if (error.status === 401) {
        errorMessage = '請先登入';
        window.location.href = '/login.html';
    } else if (error.status === 403) {
        errorMessage = '沒有權限執行此操作';
    } else if (error.status === 404) {
        errorMessage = '找不到請求的資源';
    } else if (error.status === 500) {
        errorMessage = '伺服器發生錯誤，請稍後再試';
    }
    
    // 顯示錯誤訊息
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = errorMessage;
    document.body.appendChild(errorDiv);
    
    // 3秒後自動移除錯誤訊息
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

// API 函數
async function fetchPosts() {
    try {
        const response = await fetch(`${API_BASE_URL}/posts`);
        if (!response.ok) {
            throw { status: response.status, message: response.statusText };
        }
        return await response.json();
    } catch (error) {
        handleApiError(error);
        return [];
    }
}

async function createPost(content, image) {
    try {
        const formData = new FormData();
        formData.append('content', content);
        if (image) {
            formData.append('image', image);
        }

        const response = await fetch(`${API_BASE_URL}/posts`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw { status: response.status, message: response.statusText };
        }
        
        return await response.json();
    } catch (error) {
        handleApiError(error);
        throw error;
    }
}

async function toggleLike(postId) {
    try {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
            throw { status: 401, message: '請先登入' };
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
        
        if (!response.ok) {
            throw { status: response.status, message: response.statusText };
        }
        
        return await response.json();
    } catch (error) {
        handleApiError(error);
        throw error;
    }
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
            const posts = await postsApi.getPosts();
            postsContainer.innerHTML = '';
            
            for (const post of posts) {
                const postElement = createPostElement(post);
                postsContainer.appendChild(postElement);
            }
        } catch (error) {
            handleApiError(error);
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
                    <span class="like-count">${post.likes}</span>
                </button>
                <button class="comment-button">💬 留言</button>
                <button class="share-button">↗️ 分享</button>
                <button class="bookmark-button">
                    <span class="bookmark-icon">🔖</span>
                </button>
            </div>
            <div class="comments-section"></div>
        `;

        // 添加書籤事件監聽器
        const bookmarkButton = postElement.querySelector('.bookmark-button');
        bookmarkButton.addEventListener('click', async () => {
            try {
                if (bookmarkButton.classList.contains('active')) {
                    await bookmarksApi.removeBookmark(post.id);
                    bookmarkButton.classList.remove('active');
                } else {
                    await bookmarksApi.addBookmark(post.id);
                    bookmarkButton.classList.add('active');
                }
            } catch (error) {
                handleApiError(error);
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
            await postsApi.createPost(content, image);
            await loadPosts();
            postForm.reset();
        } catch (error) {
            handleApiError(error);
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