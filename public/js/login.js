import { api } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const authTabs = document.querySelectorAll('.auth-tab');

    // 切換登入/註冊表單
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            // 更新標籤狀態
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // 切換表單顯示
            if (tabName === 'login') {
                loginForm.style.display = 'flex';
                signupForm.style.display = 'none';
            } else {
                loginForm.style.display = 'none';
                signupForm.style.display = 'flex';
            }
        });
    });

    // 處理登入
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await api.login(username, password);
            // 登入成功，跳轉到首頁
            window.location.href = '/';
        } catch (error) {
            console.error('登入失敗:', error);
            alert('登入失敗，請檢查用戶名稱和密碼');
        }
    });

    // 處理註冊
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('signupUsername').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // 驗證密碼
        if (password !== confirmPassword) {
            alert('密碼不一致');
            return;
        }

        try {
            const response = await api.signup(username, password);
            // 註冊成功，跳轉到首頁
            window.location.href = '/';
        } catch (error) {
            console.error('註冊失敗:', error);
            alert('註冊失敗，請稍後再試');
        }
    });

    // 檢查是否已登入
    async function checkAuth() {
        try {
            const response = await api.checkAuth();
            if (response.user_id) {
                // 已登入，跳轉到首頁
                window.location.href = '/';
            }
        } catch (error) {
            console.error('檢查認證狀態失敗:', error);
        }
    }

    // 初始檢查
    checkAuth();
}); 