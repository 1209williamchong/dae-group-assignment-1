const API_BASE_URL = 'https://dae-mobile-assignment.hkit.cc/api';

class ApiService {
    constructor() {
        this.token = localStorage.getItem('token');
    }

    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
            ...options.headers
        };

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // 用戶相關 API
    async login(username, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async getProfile() {
        return this.request('/users/profile');
    }

    async updateProfile(profileData) {
        return this.request('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    // 貼文相關 API
    async createPost(content, image = null) {
        const formData = new FormData();
        formData.append('content', content);
        if (image) {
            formData.append('image', image);
        }

        return this.request('/posts', {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });
    }

    async getPosts() {
        return this.request('/posts');
    }

    async getPostById(id) {
        return this.request(`/posts/${id}`);
    }

    async likePost(id) {
        return this.request(`/posts/${id}/like`, {
            method: 'POST'
        });
    }

    async unlikePost(id) {
        return this.request(`/posts/${id}/unlike`, {
            method: 'POST'
        });
    }

    // 評論相關 API
    async addComment(postId, content) {
        return this.request(`/posts/${postId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });
    }

    async getComments(postId) {
        return this.request(`/posts/${postId}/comments`);
    }

    // 追蹤相關 API
    async followUser(userId) {
        return this.request(`/users/${userId}/follow`, {
            method: 'POST'
        });
    }

    async unfollowUser(userId) {
        return this.request(`/users/${userId}/unfollow`, {
            method: 'POST'
        });
    }

    async getFollowers() {
        return this.request('/users/followers');
    }

    async getFollowing() {
        return this.request('/users/following');
    }
}

// 創建全局 API 實例
const api = new ApiService(); 