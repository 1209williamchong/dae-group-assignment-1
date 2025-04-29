import { ajax } from './services/ajax.js';
import { isLoggedIn, logout } from './services/auth.js';

// DOM 元素
const postForm = document.getElementById('post-form');
const postContent = document.getElementById('post-content');
const postsContainer = document.getElementById('posts-container');
const logoutBtn = document.getElementById('logout-btn');
const searchInput = document.getElementById('search-input');
const searchForm = document.getElementById('search-form');
const showBookmarksBtn = document.getElementById('show-bookmarks-btn');
const youtubeLinkInput = document.getElementById('youtube-link');

// 狀態變量
let currentPage = 1;
let isLoading = false;
let hasMorePosts = true;
let currentSearchQuery = '';
let showOnlyBookmarks = false;

// 初始化
async function init() {
    if (!isLoggedIn()) {
        window.location.href = '/login.html';
        return;
    }

    // 載入貼文
    loadPosts();

    // 事件監聽器
    postForm.addEventListener('submit', handlePostSubmit);
    logoutBtn.addEventListener('click', logout);
    searchForm.addEventListener('submit', handleSearch);
    searchInput.addEventListener('input', handleSearchInput);
    showBookmarksBtn.addEventListener('click', toggleBookmarksView);
    youtubeLinkInput.addEventListener('input', handleYoutubeLinkInput);
    
    // 添加滾動事件監聽器
    window.addEventListener('scroll', handleScroll);
}

// 切換收藏視圖
async function toggleBookmarksView() {
    showOnlyBookmarks = !showOnlyBookmarks;
    showBookmarksBtn.classList.toggle('active');
    currentPage = 1;
    hasMorePosts = true;
    loadPosts();
}

// 處理搜尋輸入
function handleSearchInput(e) {
    const query = e.target.value.trim();
    if (query === '') {
        // 如果搜尋框為空，重置為顯示所有貼文
        currentSearchQuery = '';
        currentPage = 1;
        loadPosts();
    }
}

// 處理搜尋提交
async function handleSearch(e) {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query === currentSearchQuery) return;
    
    currentSearchQuery = query;
    currentPage = 1;
    hasMorePosts = true;
    
    try {
        const posts = await ajax.posts.search(query, currentPage);
        hasMorePosts = posts.length > 0;
        renderPosts(posts);
    } catch (error) {
        console.error('搜尋貼文失敗:', error);
    }
}

// 處理滾動事件
function handleScroll() {
    if (isLoading || !hasMorePosts) return;
    
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop;
    const clientHeight = document.documentElement.clientHeight;
    
    // 當滾動到距離底部 200px 時載入更多貼文
    if (scrollHeight - scrollTop - clientHeight < 200) {
        loadMorePosts();
    }
}

// 載入更多貼文
async function loadMorePosts() {
    if (isLoading || !hasMorePosts) return;
    
    isLoading = true;
    currentPage++;
    
    try {
        let posts;
        if (showOnlyBookmarks) {
            posts = await ajax.bookmarks.getAll(currentPage);
        } else if (currentSearchQuery) {
            posts = await ajax.posts.search(currentSearchQuery, currentPage);
        } else {
            posts = await ajax.posts.getAll(currentPage);
        }
        
        if (posts.length === 0) {
            hasMorePosts = false;
            return;
        }
        renderPosts(posts, true);
    } catch (error) {
        console.error('載入更多貼文失敗:', error);
        currentPage--;
    } finally {
        isLoading = false;
    }
}

// 載入貼文
async function loadPosts() {
    try {
        let posts;
        if (showOnlyBookmarks) {
            posts = await ajax.bookmarks.getAll(currentPage);
        } else if (currentSearchQuery) {
            posts = await ajax.posts.search(currentSearchQuery, currentPage);
        } else {
            posts = await ajax.posts.getAll(currentPage);
        }
        hasMorePosts = posts.length > 0;
        renderPosts(posts);
    } catch (error) {
        console.error('載入貼文失敗:', error);
    }
}

// 渲染貼文
function renderPosts(posts, append = false) {
    if (!append) {
        postsContainer.innerHTML = '';
    }
    
    posts.forEach(post => {
        const postElement = createPostElement(post);
        postsContainer.appendChild(postElement);
    });
}

// 處理 YouTube 連結輸入
function handleYoutubeLinkInput(e) {
    const link = e.target.value.trim();
    if (isValidYoutubeUrl(link)) {
        const videoId = extractYoutubeId(link);
        if (videoId) {
            // 預覽 YouTube 影片
            previewYoutubeVideo(videoId);
        }
    }
}

// 檢查是否為有效的 YouTube URL
function isValidYoutubeUrl(url) {
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    return pattern.test(url);
}

// 提取 YouTube 影片 ID
function extractYoutubeId(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
}

// 預覽 YouTube 影片
function previewYoutubeVideo(videoId) {
    const previewContainer = document.getElementById('youtube-preview');
    if (!previewContainer) return;

    previewContainer.innerHTML = `
        <div class="youtube-preview">
            <iframe 
                width="100%" 
                height="315" 
                src="https://www.youtube.com/embed/${videoId}" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
            <button class="remove-preview-btn" onclick="removeYoutubePreview()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
}

// 移除 YouTube 預覽
function removeYoutubePreview() {
    const previewContainer = document.getElementById('youtube-preview');
    if (previewContainer) {
        previewContainer.innerHTML = '';
    }
    youtubeLinkInput.value = '';
}

// 處理貼文提交
async function handlePostSubmit(e) {
    e.preventDefault();
    const content = postContent.value.trim();
    const youtubeLink = youtubeLinkInput.value.trim();
    
    if (!content && !youtubeLink) return;

    try {
        const postData = {
            content,
            youtubeLink: youtubeLink || null
        };
        
        const newPost = await ajax.posts.create(postData);
        postContent.value = '';
        youtubeLinkInput.value = '';
        removeYoutubePreview();
        loadPosts(); // 重新載入貼文
    } catch (error) {
        console.error('發布貼文失敗:', error);
    }
}

// 創建貼文元素
function createPostElement(post) {
    const div = document.createElement('div');
    div.className = 'post';
    div.innerHTML = `
        <div class="post-header">
            <img src="${post.user.avatar}" alt="${post.user.username}" class="avatar">
            <div class="post-info">
                <h3>${post.user.username}</h3>
                <span class="time">${formatTime(post.createdAt)}</span>
            </div>
        </div>
        <div class="post-content">${post.content}</div>
        ${post.youtubeLink ? `
            <div class="youtube-embed">
                <iframe 
                    width="100%" 
                    height="315" 
                    src="https://www.youtube.com/embed/${extractYoutubeId(post.youtubeLink)}" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                </iframe>
            </div>
        ` : ''}
        <div class="post-actions">
            <button class="like-btn" data-post-id="${post.id}">
                <i class="fas fa-heart"></i> ${post.likes}
            </button>
            <button class="comment-btn" data-post-id="${post.id}">
                <i class="fas fa-comment"></i> ${post.comments}
            </button>
            <button class="bookmark-btn" data-post-id="${post.id}">
                <i class="fas fa-bookmark"></i>
            </button>
        </div>
    `;
    return div;
}

// 格式化時間
function formatTime(timestamp) {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diff = now - postTime;
    
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) {
        return `${minutes} 分鐘前`;
    }
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours} 小時前`;
    }
    
    const days = Math.floor(hours / 24);
    return `${days} 天前`;
}

// 初始化應用
init(); 