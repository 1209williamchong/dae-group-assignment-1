import { ajax, postsApi } from './services/ajax.js';
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

// 相機和位置相關的變量
let stream = null;
let currentCamera = 'user'; // 'user' 或 'environment'
let currentLocation = null;

// DOM 元素
const cameraBtn = document.getElementById('camera-btn');
const galleryBtn = document.getElementById('gallery-btn');
const cameraModal = document.getElementById('camera-modal');
const cameraView = document.getElementById('camera-view');
const photoCanvas = document.getElementById('photo-canvas');
const captureBtn = document.getElementById('capture-btn');
const switchCameraBtn = document.getElementById('switch-camera-btn');
const mediaPreview = document.getElementById('media-preview');
const locationInfo = document.getElementById('location-info');
const locationText = document.getElementById('location-text');
const removeLocationBtn = document.getElementById('remove-location');

// 混合式存儲方案
const STORAGE = {
    // Web Storage 操作
    webStorage: {
        // 設置 localStorage 項目
        setLocal(key, value) {
            try {
                const serializedValue = JSON.stringify(value);
                localStorage.setItem(key, serializedValue);
                return true;
            } catch (error) {
                console.error('localStorage 設置失敗:', error);
                return false;
            }
        },

        // 獲取 localStorage 項目
        getLocal(key) {
            try {
                const value = localStorage.getItem(key);
                return value ? JSON.parse(value) : null;
            } catch (error) {
                console.error('localStorage 獲取失敗:', error);
                return null;
            }
        },

        // 移除 localStorage 項目
        removeLocal(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('localStorage 移除失敗:', error);
                return false;
            }
        },

        // 設置 sessionStorage 項目
        setSession(key, value) {
            try {
                const serializedValue = JSON.stringify(value);
                sessionStorage.setItem(key, serializedValue);
                return true;
            } catch (error) {
                console.error('sessionStorage 設置失敗:', error);
                return false;
            }
        },

        // 獲取 sessionStorage 項目
        getSession(key) {
            try {
                const value = sessionStorage.getItem(key);
                return value ? JSON.parse(value) : null;
            } catch (error) {
                console.error('sessionStorage 獲取失敗:', error);
                return null;
            }
        },

        // 移除 sessionStorage 項目
        removeSession(key) {
            try {
                sessionStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('sessionStorage 移除失敗:', error);
                return false;
            }
        }
    },

    // IndexedDB 操作
    indexedDB: {
        db: null,
        dbName: 'FreshDB',
        dbVersion: 1,

        // 初始化資料庫
        async init() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, this.dbVersion);

                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    this.db = request.result;
                    resolve(this.db);
                };

                request.onupgradeneeded = (event) => {
                    const db = event.target.result;

                    // 創建用戶資料表
                    if (!db.objectStoreNames.contains('users')) {
                        const store = db.createObjectStore('users', { keyPath: 'id' });
                        store.createIndex('username', 'username', { unique: true });
                    }

                    // 創建貼文資料表
                    if (!db.objectStoreNames.contains('posts')) {
                        const store = db.createObjectStore('posts', { keyPath: 'id' });
                        store.createIndex('userId', 'userId', { unique: false });
                        store.createIndex('timestamp', 'timestamp', { unique: false });
                    }

                    // 創建媒體資料表
                    if (!db.objectStoreNames.contains('media')) {
                        const store = db.createObjectStore('media', { keyPath: 'id' });
                        store.createIndex('postId', 'postId', { unique: false });
                    }
                };
            });
        },

        // 添加資料
        async add(storeName, data) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.add(data);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        },

        // 獲取資料
        async get(storeName, key) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.get(key);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        },

        // 更新資料
        async update(storeName, data) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.put(data);

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        },

        // 刪除資料
        async delete(storeName, key) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(storeName, 'readwrite');
                const store = transaction.objectStore(storeName);
                const request = store.delete(key);

                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            });
        },

        // 獲取所有資料
        async getAll(storeName) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(storeName, 'readonly');
                const store = transaction.objectStore(storeName);
                const request = store.getAll();

                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        }
    },

    // Capacitor Storage 操作
    capacitor: {
        // 初始化 Capacitor Storage
        async init() {
            try {
                const { Storage } = await import('@capacitor/storage');
                this.Storage = Storage;
                return true;
            } catch (error) {
                console.error('Capacitor Storage 初始化失敗:', error);
                return false;
            }
        },

        // 設置資料
        async set(key, value) {
            try {
                await this.Storage.set({
                    key: key,
                    value: JSON.stringify(value)
                });
                return true;
            } catch (error) {
                console.error('Capacitor Storage 設置失敗:', error);
                return false;
            }
        },

        // 獲取資料
        async get(key) {
            try {
                const { value } = await this.Storage.get({ key: key });
                return value ? JSON.parse(value) : null;
            } catch (error) {
                console.error('Capacitor Storage 獲取失敗:', error);
                return null;
            }
        },

        // 移除資料
        async remove(key) {
            try {
                await this.Storage.remove({ key: key });
                return true;
            } catch (error) {
                console.error('Capacitor Storage 移除失敗:', error);
                return false;
            }
        }
    },

    // SQLite 操作
    sqlite: {
        db: null,

        // 初始化 SQLite
        async init() {
            try {
                const { CapacitorSQLite, SQLiteConnection } = await import('@capacitor-community/sqlite');
                this.SQLite = CapacitorSQLite;
                this.connection = new SQLiteConnection(CapacitorSQLite);
                
                this.db = await this.connection.createConnection(
                    'fresh_db',
                    false,
                    'no-encryption',
                    1,
                    false
                );

                await this.db.open();
                await this.createTables();
                return true;
            } catch (error) {
                console.error('SQLite 初始化失敗:', error);
                return false;
            }
        },

        // 創建資料表
        async createTables() {
            const createUsersTable = `
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    username TEXT UNIQUE,
                    email TEXT UNIQUE,
                    created_at INTEGER
                )
            `;

            const createPostsTable = `
                CREATE TABLE IF NOT EXISTS posts (
                    id TEXT PRIMARY KEY,
                    user_id TEXT,
                    content TEXT,
                    created_at INTEGER,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            `;

            await this.db.execute(createUsersTable);
            await this.db.execute(createPostsTable);
        },

        // 執行 SQL 查詢
        async query(sql, params = []) {
            try {
                const result = await this.db.query(sql, params);
                return result.values || [];
            } catch (error) {
                console.error('SQLite 查詢失敗:', error);
                throw error;
            }
        },

        // 執行 SQL 命令
        async execute(sql, params = []) {
            try {
                await this.db.execute(sql, params);
                return true;
            } catch (error) {
                console.error('SQLite 執行失敗:', error);
                throw error;
            }
        }
    },

    // 檔案系統操作
    filesystem: {
        // 初始化檔案系統
        async init() {
            try {
                const { Filesystem } = await import('@capacitor/filesystem');
                this.Filesystem = Filesystem;
                return true;
            } catch (error) {
                console.error('檔案系統初始化失敗:', error);
                return false;
            }
        },

        // 寫入檔案
        async writeFile(path, data, encoding = 'utf8') {
            try {
                await this.Filesystem.writeFile({
                    path: path,
                    data: data,
                    encoding: encoding
                });
                return true;
            } catch (error) {
                console.error('檔案寫入失敗:', error);
                return false;
            }
        },

        // 讀取檔案
        async readFile(path, encoding = 'utf8') {
            try {
                const { data } = await this.Filesystem.readFile({
                    path: path,
                    encoding: encoding
                });
                return data;
            } catch (error) {
                console.error('檔案讀取失敗:', error);
                return null;
            }
        },

        // 刪除檔案
        async deleteFile(path) {
            try {
                await this.Filesystem.deleteFile({
                    path: path
                });
                return true;
            } catch (error) {
                console.error('檔案刪除失敗:', error);
                return false;
            }
        }
    },

    // 初始化所有存儲方式
    async init() {
        // 初始化 IndexedDB
        await this.indexedDB.init();

        // 初始化 Capacitor Storage
        await this.capacitor.init();

        // 初始化 SQLite
        await this.sqlite.init();

        // 初始化檔案系統
        await this.filesystem.init();

        console.log('所有存儲方式初始化完成');
    }
};

// 初始化存儲
document.addEventListener('DOMContentLoaded', async () => {
    await STORAGE.init();
});

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

    // 初始化相機
    await initCamera();
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
            media: mediaPreview.querySelector('img, video')?.src || null,
            location: currentLocation,
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

// 初始化相機
async function initCamera() {
    try {
        const constraints = {
            video: {
                facingMode: currentCamera,
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        cameraView.srcObject = stream;
    } catch (error) {
        console.error('相機初始化失敗:', error);
        alert('無法訪問相機，請確保已授予相機權限。');
    }
}

// 拍照
function capturePhoto() {
    const context = photoCanvas.getContext('2d');
    photoCanvas.width = cameraView.videoWidth;
    photoCanvas.height = cameraView.videoHeight;
    context.drawImage(cameraView, 0, 0);
    
    // 將照片轉換為 Blob
    photoCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        showMediaPreview(url, 'photo');
    }, 'image/jpeg');
}

// 切換相機
async function switchCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    currentCamera = currentCamera === 'user' ? 'environment' : 'user';
    await initCamera();
}

// 從相簿選擇照片
function selectFromGallery() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            showMediaPreview(url, 'photo');
        }
    };
    input.click();
}

// 顯示媒體預覽
function showMediaPreview(url, type) {
    mediaPreview.innerHTML = '';
    const mediaElement = document.createElement(type === 'photo' ? 'img' : 'video');
    mediaElement.src = url;
    mediaElement.controls = type === 'video';
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-media-btn';
    removeBtn.innerHTML = '<ion-icon name="close-outline"></ion-icon>';
    removeBtn.onclick = () => {
        mediaPreview.innerHTML = '';
        if (type === 'photo' && stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };
    
    mediaPreview.appendChild(mediaElement);
    mediaPreview.appendChild(removeBtn);
    cameraModal.style.display = 'none';
}

// 獲取位置
async function getLocation() {
    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            });
        });
        
        currentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        };
        
        // 使用地理編碼 API 獲取地址
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${currentLocation.latitude}&lon=${currentLocation.longitude}`);
        const data = await response.json();
        
        locationText.textContent = data.display_name || '未知位置';
        locationInfo.style.display = 'flex';
    } catch (error) {
        console.error('獲取位置失敗:', error);
        alert('無法獲取位置信息，請確保已授予位置權限。');
    }
}

// 移除位置
function removeLocation() {
    currentLocation = null;
    locationInfo.style.display = 'none';
}

// 事件監聽器
cameraBtn.addEventListener('click', async () => {
    cameraModal.style.display = 'block';
    await initCamera();
});

galleryBtn.addEventListener('click', selectFromGallery);

captureBtn.addEventListener('click', capturePhoto);

switchCameraBtn.addEventListener('click', switchCamera);

document.querySelector('.close-modal').addEventListener('click', () => {
    cameraModal.style.display = 'none';
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
});

removeLocationBtn.addEventListener('click', removeLocation);

// 初始化應用
init();

// Capacitor Camera API 相關功能
const CAMERA = {
    // 初始化相機
    async init() {
        try {
            const { Camera } = await import('@capacitor/camera');
            this.Camera = Camera;
            return true;
        } catch (error) {
            console.error('無法載入 Capacitor Camera API:', error);
            return false;
        }
    },

    // 拍照
    async takePicture() {
        try {
            const image = await this.Camera.getPhoto({
                quality: 90,
                allowEditing: true,
                resultType: 'uri',
                source: 'CAMERA',
                saveToGallery: true
            });

            return {
                type: 'photo',
                uri: image.webPath,
                format: image.format
            };
        } catch (error) {
            console.error('拍照失敗:', error);
            throw error;
        }
    },

    // 從相簿選擇照片
    async pickFromGallery() {
        try {
            const image = await this.Camera.getPhoto({
                quality: 90,
                allowEditing: true,
                resultType: 'uri',
                source: 'PHOTOLIBRARY',
                saveToGallery: false
            });

            return {
                type: 'photo',
                uri: image.webPath,
                format: image.format
            };
        } catch (error) {
            console.error('選擇照片失敗:', error);
            throw error;
        }
    },

    // 進階圖片處理
    async processImage(imageUri) {
        try {
            // 使用 Canvas 進行圖片處理
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = imageUri;
            });

            // 設置畫布大小
            canvas.width = img.width;
            canvas.height = img.height;

            // 應用濾鏡效果
            ctx.filter = 'brightness(1.1) contrast(1.1) saturate(1.2)';
            ctx.drawImage(img, 0, 0);

            // 添加文字水印
            ctx.font = '20px Arial';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillText('Fresh', 10, 30);

            // 轉換為 Blob
            return new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    resolve(URL.createObjectURL(blob));
                }, 'image/jpeg', 0.9);
            });
        } catch (error) {
            console.error('圖片處理失敗:', error);
            throw error;
        }
    },

    // 檢查相機權限
    async checkPermissions() {
        try {
            const { Camera } = await import('@capacitor/camera');
            const permissions = await Camera.checkPermissions();
            return permissions;
        } catch (error) {
            console.error('檢查權限失敗:', error);
            throw error;
        }
    },

    // 請求相機權限
    async requestPermissions() {
        try {
            const { Camera } = await import('@capacitor/camera');
            const permissions = await Camera.requestPermissions();
            return permissions;
        } catch (error) {
            console.error('請求權限失敗:', error);
            throw error;
        }
    }
};

// 初始化相機功能
document.addEventListener('DOMContentLoaded', async () => {
    const cameraInitialized = await CAMERA.init();
    if (cameraInitialized) {
        console.log('相機功能已初始化');
    }
});

// 事件監聽器
cameraBtn.addEventListener('click', async () => {
    try {
        const permissions = await CAMERA.checkPermissions();
        if (permissions.camera !== 'granted') {
            await CAMERA.requestPermissions();
        }

        const image = await CAMERA.takePicture();
        const processedImage = await CAMERA.processImage(image.uri);
        showMediaPreview(processedImage, 'photo');
    } catch (error) {
        console.error('拍照失敗:', error);
        alert('無法使用相機，請檢查權限設置。');
    }
});

galleryBtn.addEventListener('click', async () => {
    try {
        const permissions = await CAMERA.checkPermissions();
        if (permissions.photos !== 'granted') {
            await CAMERA.requestPermissions();
        }

        const image = await CAMERA.pickFromGallery();
        const processedImage = await CAMERA.processImage(image.uri);
        showMediaPreview(processedImage, 'photo');
    } catch (error) {
        console.error('選擇照片失敗:', error);
        alert('無法訪問相簿，請檢查權限設置。');
    }
});

// Web Geolocation 相關功能
const GEOLOCATION = {
    // 獲取當前位置
    async getCurrentPosition() {
        return new Promise((resolve, reject) => {
            const options = {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        altitude: position.coords.altitude,
                        altitudeAccuracy: position.coords.altitudeAccuracy,
                        heading: position.coords.heading,
                        speed: position.coords.speed,
                        timestamp: position.timestamp
                    });
                },
                (error) => {
                    reject(this.handleGeolocationError(error));
                },
                options
            );
        });
    },

    // 即時追蹤位置
    startWatching(callback) {
        const options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                callback({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    altitude: position.coords.altitude,
                    altitudeAccuracy: position.coords.altitudeAccuracy,
                    heading: position.coords.heading,
                    speed: position.coords.speed,
                    timestamp: position.timestamp
                });
            },
            (error) => {
                console.error('位置追蹤錯誤:', this.handleGeolocationError(error));
            },
            options
        );
    },

    // 停止追蹤位置
    stopWatching() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    },

    // 處理地理位置錯誤
    handleGeolocationError(error) {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                return {
                    code: 'PERMISSION_DENIED',
                    message: '用戶拒絕了位置請求'
                };
            case error.POSITION_UNAVAILABLE:
                return {
                    code: 'POSITION_UNAVAILABLE',
                    message: '無法獲取位置信息'
                };
            case error.TIMEOUT:
                return {
                    code: 'TIMEOUT',
                    message: '獲取位置超時'
                };
            default:
                return {
                    code: 'UNKNOWN_ERROR',
                    message: '未知錯誤'
                };
        }
    },

    // 檢查地理位置權限
    async checkPermissions() {
        return new Promise((resolve) => {
            if (!navigator.permissions) {
                resolve('not_supported');
                return;
            }

            navigator.permissions.query({ name: 'geolocation' })
                .then((permissionStatus) => {
                    resolve(permissionStatus.state);
                })
                .catch(() => {
                    resolve('not_supported');
                });
        });
    },

    // 獲取地址信息
    async getAddress(latitude, longitude) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await response.json();
            return {
                displayName: data.display_name,
                address: {
                    road: data.address.road,
                    suburb: data.address.suburb,
                    city: data.address.city,
                    state: data.address.state,
                    country: data.address.country,
                    postcode: data.address.postcode
                }
            };
        } catch (error) {
            console.error('獲取地址失敗:', error);
            return null;
        }
    },

    // 計算兩點之間的距離（米）
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // 地球半徑（米）
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c;
    }
};

// 事件監聽器
document.addEventListener('DOMContentLoaded', async () => {
    // 檢查地理位置權限
    const permissionStatus = await GEOLOCATION.checkPermissions();
    if (permissionStatus === 'granted') {
        console.log('地理位置權限已授予');
    } else if (permissionStatus === 'prompt') {
        console.log('等待用戶授予地理位置權限');
    } else {
        console.log('地理位置權限被拒絕或不受支援');
    }
});

// 獲取位置按鈕點擊事件
getLocationBtn.addEventListener('click', async () => {
    try {
        const position = await GEOLOCATION.getCurrentPosition();
        const address = await GEOLOCATION.getAddress(position.latitude, position.longitude);

        currentLocation = {
            ...position,
            address: address
        };

        locationText.textContent = address?.displayName || '未知位置';
        locationInfo.style.display = 'flex';

        // 開始追蹤位置
        GEOLOCATION.startWatching((newPosition) => {
            console.log('位置更新:', newPosition);
            // 更新位置信息
            currentLocation = {
                ...newPosition,
                address: currentLocation.address
            };
        });
    } catch (error) {
        console.error('獲取位置失敗:', error);
        alert(error.message || '無法獲取位置信息');
    }
});

// 移除位置按鈕點擊事件
removeLocationBtn.addEventListener('click', () => {
    GEOLOCATION.stopWatching();
    currentLocation = null;
    locationInfo.style.display = 'none';
});

// 地圖整合相關功能
const MAP = {
    // 初始化地圖
    init(containerId) {
        this.map = L.map(containerId).setView([25.0330, 121.5654], 13); // 預設台北市中心
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);

        this.markers = [];
        this.route = null;
        return this.map;
    },

    // 添加位置標記
    addMarker(lat, lng, title, content) {
        const marker = L.marker([lat, lng])
            .addTo(this.map)
            .bindPopup(content || title);

        if (title) {
            marker.bindTooltip(title, {
                permanent: false,
                direction: 'top'
            });
        }

        this.markers.push(marker);
        return marker;
    },

    // 清除所有標記
    clearMarkers() {
        this.markers.forEach(marker => marker.remove());
        this.markers = [];
    },

    // 規劃路線
    async planRoute(start, end) {
        try {
            // 使用 OSRM API 規劃路線
            const response = await fetch(
                `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`
            );
            const data = await response.json();

            if (data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                
                // 清除現有路線
                if (this.route) {
                    this.map.removeLayer(this.route);
                }

                // 繪製新路線
                this.route = L.geoJSON(route.geometry, {
                    style: {
                        color: '#3388ff',
                        weight: 5,
                        opacity: 0.7
                    }
                }).addTo(this.map);

                // 添加起點和終點標記
                this.clearMarkers();
                this.addMarker(start.lat, start.lng, '起點', '起點位置');
                this.addMarker(end.lat, end.lng, '終點', '終點位置');

                // 調整地圖視圖以顯示完整路線
                this.map.fitBounds(this.route.getBounds());

                return {
                    distance: route.distance, // 米
                    duration: route.duration, // 秒
                    geometry: route.geometry
                };
            }
        } catch (error) {
            console.error('路線規劃失敗:', error);
            throw error;
        }
    },

    // 添加自定義圖標
    createCustomIcon(iconUrl, iconSize = [25, 41], iconAnchor = [12, 41]) {
        return L.icon({
            iconUrl: iconUrl,
            iconSize: iconSize,
            iconAnchor: iconAnchor,
            popupAnchor: [1, -34],
            shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
            shadowSize: [41, 41]
        });
    },

    // 添加圓形標記
    addCircleMarker(lat, lng, radius, options = {}) {
        const circle = L.circleMarker([lat, lng], {
            radius: radius,
            fillColor: options.fillColor || '#3388ff',
            color: options.color || '#3388ff',
            weight: options.weight || 1,
            opacity: options.opacity || 1,
            fillOpacity: options.fillOpacity || 0.2,
            ...options
        }).addTo(this.map);

        this.markers.push(circle);
        return circle;
    },

    // 添加多邊形
    addPolygon(latlngs, options = {}) {
        const polygon = L.polygon(latlngs, {
            color: options.color || '#3388ff',
            weight: options.weight || 1,
            opacity: options.opacity || 0.7,
            fillOpacity: options.fillOpacity || 0.2,
            ...options
        }).addTo(this.map);

        this.markers.push(polygon);
        return polygon;
    },

    // 添加圓形
    addCircle(lat, lng, radius, options = {}) {
        const circle = L.circle([lat, lng], {
            radius: radius,
            color: options.color || '#3388ff',
            weight: options.weight || 1,
            opacity: options.opacity || 0.7,
            fillOpacity: options.fillOpacity || 0.2,
            ...options
        }).addTo(this.map);

        this.markers.push(circle);
        return circle;
    },

    // 添加資訊視窗
    addInfoWindow(content, lat, lng) {
        const popup = L.popup()
            .setLatLng([lat, lng])
            .setContent(content)
            .openOn(this.map);

        return popup;
    },

    // 清除路線
    clearRoute() {
        if (this.route) {
            this.map.removeLayer(this.route);
            this.route = null;
        }
    }
};

// 初始化地圖
document.addEventListener('DOMContentLoaded', () => {
    const mapContainer = document.getElementById('route-map');
    if (mapContainer) {
        MAP.init('route-map');
    }
});

// 路線規劃按鈕點擊事件
routeBtn.addEventListener('click', async () => {
    try {
        const startLocation = document.getElementById('start-location').value;
        const endLocation = document.getElementById('end-location').value;

        if (!startLocation || !endLocation) {
            alert('請輸入起點和終點位置');
            return;
        }

        // 使用 Nominatim API 獲取座標
        const startResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(startLocation)}`);
        const endResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endLocation)}`);
        
        const [startData, endData] = await Promise.all([startResponse.json(), endResponse.json()]);

        if (startData.length === 0 || endData.length === 0) {
            alert('無法找到指定的位置');
            return;
        }

        const start = {
            lat: parseFloat(startData[0].lat),
            lng: parseFloat(startData[0].lon)
        };

        const end = {
            lat: parseFloat(endData[0].lat),
            lng: parseFloat(endData[0].lon)
        };

        const routeInfo = await MAP.planRoute(start, end);
        
        // 更新路線信息
        document.getElementById('route-distance').textContent = `距離: ${(routeInfo.distance / 1000).toFixed(1)} 公里`;
        document.getElementById('route-duration').textContent = `時間: ${Math.ceil(routeInfo.duration / 60)} 分鐘`;

        // 顯示路線信息區域
        document.getElementById('route-info').style.display = 'block';
    } catch (error) {
        console.error('路線規劃失敗:', error);
        alert('路線規劃失敗，請稍後再試');
    }
});

// 移除路線按鈕點擊事件
document.getElementById('remove-route').addEventListener('click', () => {
    MAP.clearRoute();
    MAP.clearMarkers();
    document.getElementById('route-info').style.display = 'none';
});

// 貼文管理
const POSTS = {
    currentTab: 'following',
    posts: [],
    followingPosts: [],

    init() {
        this.setupEventListeners();
        this.loadPosts();
    },

    setupEventListeners() {
        // 貼文切換按鈕
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTab = btn.dataset.tab;
                this.loadPosts();
            });
        });
    },

    async loadPosts() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login.html';
                return;
            }

            // 根據當前選項獲取貼文
            const endpoint = this.currentTab === 'following' ? '/api/posts/following' : '/api/posts';
            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('獲取貼文失敗');
            }

            const posts = await response.json();
            this.posts = posts;
            this.renderPosts();
        } catch (error) {
            console.error('載入貼文失敗:', error);
            alert('載入貼文失敗，請稍後再試');
        }
    },

    renderPosts() {
        const container = document.getElementById('posts-container');
        container.innerHTML = '';

        this.posts.forEach(post => {
            const postElement = this.createPostElement(post);
            container.appendChild(postElement);
        });
    },

    createPostElement(post) {
        const div = document.createElement('div');
        div.className = 'post';
        div.innerHTML = `
            <div class="post-header">
                <img src="${post.avatar || '/images/default-avatar.png'}" alt="${post.username}" class="post-avatar">
                <div class="post-info">
                    <span class="post-username">${post.username}</span>
                    <span class="post-time">${this.formatTime(post.created_at)}</span>
                </div>
            </div>
            <div class="post-content">${post.content}</div>
            ${post.media ? `<img src="${post.media}" alt="貼文圖片" class="post-media">` : ''}
            ${post.youtube_url ? this.createYoutubeEmbed(post.youtube_url) : ''}
            <div class="post-actions">
                <button class="post-action" data-action="like">
                    <ion-icon name="heart-outline"></ion-icon>
                    <span>${post.likes_count || 0}</span>
                </button>
                <button class="post-action" data-action="comment">
                    <ion-icon name="chatbubble-outline"></ion-icon>
                    <span>${post.comments_count || 0}</span>
                </button>
                <button class="post-action" data-action="share">
                    <ion-icon name="share-outline"></ion-icon>
                </button>
            </div>
        `;

        // 添加互動事件監聽器
        this.setupPostInteractions(div, post);
        return div;
    },

    setupPostInteractions(postElement, post) {
        const token = localStorage.getItem('token');
        if (!token) return;

        // 點讚功能
        const likeBtn = postElement.querySelector('[data-action="like"]');
        likeBtn.addEventListener('click', async () => {
            try {
                const response = await fetch(`/api/posts/${post.id}/like`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('點讚失敗');
                }

                const data = await response.json();
                likeBtn.querySelector('span').textContent = data.likes;
                likeBtn.classList.toggle('active');
            } catch (error) {
                console.error('點讚失敗:', error);
                alert('點讚失敗，請稍後再試');
            }
        });

        // 評論功能
        const commentBtn = postElement.querySelector('[data-action="comment"]');
        commentBtn.addEventListener('click', () => {
            // 實現評論功能
        });

        // 分享功能
        const shareBtn = postElement.querySelector('[data-action="share"]');
        shareBtn.addEventListener('click', () => {
            // 實現分享功能
        });
    },

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) { // 1分鐘內
            return '剛剛';
        } else if (diff < 3600000) { // 1小時內
            return `${Math.floor(diff / 60000)}分鐘前`;
        } else if (diff < 86400000) { // 1天內
            return `${Math.floor(diff / 3600000)}小時前`;
        } else {
            return date.toLocaleDateString();
        }
    },

    createYoutubeEmbed(url) {
        const videoId = this.extractYoutubeId(url);
        return `
            <div class="youtube-embed">
                <iframe 
                    src="https://www.youtube.com/embed/${videoId}"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen>
                </iframe>
            </div>
        `;
    },

    extractYoutubeId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }
};

// 初始化貼文功能
document.addEventListener('DOMContentLoaded', () => {
    POSTS.init();
}); 