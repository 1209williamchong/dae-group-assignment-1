import { getToken } from './auth.js';

const API_BASE_URL = 'http://localhost:3000/api';

// 處理 AJAX 請求
function ajaxRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const fullUrl = `${API_BASE_URL}${url}`;

        // 設置請求頭
        const headers = {
            'Content-Type': 'application/json'
        };

        // 添加認證標頭
        const token = getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // 合併自定義標頭
        Object.assign(headers, options.headers || {});

        xhr.open(options.method || 'GET', fullUrl, true);

        // 設置請求頭
        Object.entries(headers).forEach(([key, value]) => {
            xhr.setRequestHeader(key, value);
        });

        // 設置超時
        xhr.timeout = 10000; // 10 秒超時

        // 處理響應
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response);
                } catch (error) {
                    reject({
                        status: xhr.status,
                        message: '解析響應失敗'
                    });
                }
            } else {
                try {
                    const error = JSON.parse(xhr.responseText);
                    reject({
                        status: xhr.status,
                        message: error.error || xhr.statusText
                    });
                } catch (error) {
                    reject({
                        status: xhr.status,
                        message: xhr.statusText
                    });
                }
            }
        };

        // 處理錯誤
        xhr.onerror = function() {
            reject({
                status: 0,
                message: '網絡錯誤'
            });
        };

        // 處理超時
        xhr.ontimeout = function() {
            reject({
                status: 0,
                message: '請求超時'
            });
        };

        // 發送請求
        if (options.body) {
            xhr.send(JSON.stringify(options.body));
        } else {
            xhr.send();
        }
    });
}

// 書籤相關 API
export const bookmarksApi = {
    // 獲取書籤列表
    getBookmarks() {
        return ajaxRequest('/bookmarks', {
            method: 'GET'
        });
    },
    
    // 添加書籤
    addBookmark(postId) {
        return ajaxRequest('/bookmarks', {
            method: 'POST',
            body: { post_id: postId }
        });
    },
    
    // 移除書籤
    removeBookmark(postId) {
        return ajaxRequest(`/bookmarks/${postId}`, {
            method: 'DELETE'
        });
    }
};

// 貼文相關 API
export const postsApi = {
    // 獲取貼文列表
    getPosts() {
        return ajaxRequest('/posts', {
            method: 'GET'
        });
    },

    searchPosts(){},
    
    // 創建新貼文
    createPost(content, image) {
        const formData = new FormData();
        formData.append('content', content);
        if (image) {
            formData.append('image', image);
        }

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${API_BASE_URL}/posts`, true);

            // 添加認證標頭
            const token = getToken();
            if (token) {
                xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }

            xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve(response);
                    } catch (error) {
                        reject({
                            status: xhr.status,
                            message: '解析響應失敗'
                        });
                    }
                } else {
                    try {
                        const error = JSON.parse(xhr.responseText);
                        reject({
                            status: xhr.status,
                            message: error.error || xhr.statusText
                        });
                    } catch (error) {
                        reject({
                            status: xhr.status,
                            message: xhr.statusText
                        });
                    }
                }
            };

            xhr.onerror = function() {
                reject({
                    status: 0,
                    message: '網絡錯誤'
                });
            };

            xhr.send(formData);
        });
    }
};

// 用戶相關 API
export const usersApi = {
    // 獲取用戶資料
    getUserProfile(userId) {
        return ajaxRequest(`/users/${userId}`, {
            method: 'GET'
        });
    },
    
    // 更新用戶資料
    updateUserProfile(data) {
        return ajaxRequest('/users/profile', {
            method: 'PUT',
            body: data
        });
    }
}; 