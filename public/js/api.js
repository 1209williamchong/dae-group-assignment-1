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

    // 認證相關 API
    async signup(username, password) {
        const response = await this.request('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        this.token = response.token;
        localStorage.setItem('token', response.token);
        return response;
    }

    async login(username, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
        this.token = response.token;
        localStorage.setItem('token', response.token);
        return response;
    }

    async checkAuth() {
        return this.request('/auth/check');
    }

    // 通用列表 API
    async getList(resource, params = {}) {
        const queryParams = new URLSearchParams();
        
        // 添加可選參數
        if (params.page) queryParams.append('page', params.page);
        if (params.limit) queryParams.append('limit', params.limit);
        if (params.search) queryParams.append('search', params.search);
        if (params.category) queryParams.append('category', params.category);
        if (params.sort) queryParams.append('sort', params.sort);
        if (params.order) queryParams.append('order', params.order);

        const queryString = queryParams.toString();
        const url = `/${resource}${queryString ? `?${queryString}` : ''}`;
        
        return this.request(url);
    }

    // 貼文相關 API
    async getPosts(params = {}) {
        return this.getList('posts', params);
    }

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
    async getComments(postId, params = {}) {
        return this.getList(`posts/${postId}/comments`, params);
    }

    async addComment(postId, content) {
        return this.request(`/posts/${postId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });
    }

    // 用戶相關 API
    async getProfile() {
        return this.request('/users/profile');
    }

    async updateProfile(profileData) {
        return this.request('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
    }

    // 追蹤相關 API
    async getFollowers(params = {}) {
        return this.getList('users/followers', params);
    }

    async getFollowing(params = {}) {
        return this.getList('users/following', params);
    }

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

    // 收藏相關 API
    async addBookmark(itemId) {
        return this.request(`/bookmarks/${itemId}`, {
            method: 'POST'
        });
    }

    async removeBookmark(itemId) {
        return this.request(`/bookmarks/${itemId}`, {
            method: 'DELETE'
        });
    }

    async getBookmarks() {
        return this.request('/bookmarks');
    }
}

// 創建全局 API 實例
const api = new ApiService(); 