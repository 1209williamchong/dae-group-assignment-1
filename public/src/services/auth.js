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

// 登出
export function logout() {
    removeToken();
    window.location.href = '/login.html';
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