import { getToken } from './auth.js';

const API_BASE_URL = 'http://localhost:3000/api';

// 處理 API 回應
async function handleResponse(response) {
    if (!response.ok) {
        const error = await response.json();
        throw { status: response.status, message: error.error || response.statusText };
    }
    return response.json();
}

// 添加認證標頭
function getHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
}

// API 請求函數
export async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = getHeaders();
    
    const response = await fetch(url, {
        ...options,
        headers: {
            ...headers,
            ...options.headers
        }
    });
    
    return handleResponse(response);
}

// 認證相關 API
export const authApi = {
    // 註冊
    async register(username, email, password, avatar, bio) {
        const formData = new FormData();
        formData.append('username', username);
        formData.append('email', email);
        formData.append('password', password);
        if (avatar) {
            formData.append('avatar', avatar);
        }
        if (bio) {
            formData.append('bio', bio);
        }
        
        return apiRequest('/auth/register', {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': undefined
            }
        });
    },
    
    // 登入
    async login(email, password) {
        return apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },

    async getProfile() {
        return apiRequest('/auth/profile', {
            method: 'GET'
        });
    },
};

// 書籤相關 API
export const bookmarksApi = {
    // 獲取書籤列表
    async getBookmarks() {
        return apiRequest('/bookmarks', {
            method: 'GET'
        });
    },
    
    // 添加書籤
    async addBookmark(postId) {
        return apiRequest('/bookmarks', {
            method: 'POST',
            body: JSON.stringify({ post_id: postId })
        });
    },
    
    // 移除書籤
    async removeBookmark(postId) {
        return apiRequest(`/bookmarks/${postId}`, {
            method: 'DELETE'
        });
    }
};

// 貼文相關 API
export const postsApi = {
    // 獲取貼文列表
    async getPosts() {
        return apiRequest('/posts', {
            method: 'GET'
        });
    },
    
    // 創建新貼文
    async createPost(content, image) {
        const formData = new FormData();
        formData.append('content', content);
        if (image) {
            formData.append('image', image);
        }
        
        return apiRequest('/posts', {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': undefined
            }
        });
    }
};

// 用戶相關 API
export const usersApi = {
    // 獲取用戶資料
    async getUserProfile(userId) {
        return apiRequest(`/users/${userId}`, {
            method: 'GET'
        });
    },
    
    // 更新用戶資料
    async updateUserProfile(data) {
        return apiRequest('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    // 追蹤用戶
    async followUser(userId) {
        return apiRequest(`/users/${userId}/follow`, {
            method: 'POST'
        });
    },
    
    // 取消追蹤用戶
    async unfollowUser(userId) {
        return apiRequest(`/users/${userId}/unfollow`, {
            method: 'POST'
        });
    },
    
    // 檢查是否追蹤用戶
    async isFollowing(userId) {
        return apiRequest(`/users/${userId}/is-following`, {
            method: 'GET'
        });
    }
}; 

export const communityApi = {
    // 獲取好友列表
    async getFriends() {
        return apiRequest('/friends', {
            method: 'GET'
        });
    },
    
    // 獲取建議關注的用戶
    async getSuggestions() {
        return apiRequest('/community/suggestions', {
            method: 'GET'
        });
    },
    
    // 邀請好友
    async inviteFriend(email) {
        return apiRequest('/invite', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    },
    
    // 接受好友請求
    async acceptFriendRequest(requestId) {
        return apiRequest(`/friend-requests/${requestId}/accept`, {
            method: 'POST'
        });
    },
    
    // 拒絕好友請求
    async rejectFriendRequest(requestId) {
        return apiRequest(`/friend-requests/${requestId}/reject`, {
            method: 'POST'
        });
    }
}