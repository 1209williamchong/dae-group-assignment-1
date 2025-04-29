// 獲取 token
export function getToken() {
    return localStorage.getItem('token');
}

// 設置 token
export function setToken(token) {
    localStorage.setItem('token', token);
}

// 移除 token
export function removeToken() {
    localStorage.removeItem('token');
}

// 檢查是否已登入
export function isLoggedIn() {
    return !!getToken();
}

// 獲取當前用戶
export function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// 設置當前用戶
export function setCurrentUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
}

// 移除當前用戶
export function removeCurrentUser() {
    localStorage.removeItem('user');
}

// 登出
export function logout() {
    removeToken();
    removeCurrentUser();
    window.location.href = '/register.html';
}

// 處理 API 錯誤
export function handleApiError(error) {
    if (error.status === 401) {
        // 未授權，需要重新登入
        logout();
    } else {
        // 顯示錯誤訊息
        alert(error.message || '發生錯誤');
    }
} 