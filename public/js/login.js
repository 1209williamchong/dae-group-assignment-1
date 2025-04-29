import { authService } from '../src/services/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const authTabs = document.querySelectorAll('.auth-tab');
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    loginForm.parentNode.insertBefore(errorMessage, loginForm);

    // 切換登入/註冊表單
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            if (target === 'login') {
                loginForm.style.display = 'block';
                signupForm.style.display = 'none';
            } else {
                loginForm.style.display = 'none';
                signupForm.style.display = 'block';
            }
        });
    });

    // 處理登入
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            await authService.login(username, password);
            window.location.href = '/';
        } catch (error) {
            showError(error.message);
        }
    });

    // 處理註冊
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('signupUsername').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            showError('密碼不匹配');
            return;
        }

        try {
            await authService.register(username, password);
            showError('註冊成功！請登入', 'success');
            document.querySelector('[data-tab="login"]').click();
        } catch (error) {
            showError(error.message);
        }
    });

    function showError(message, type = 'error') {
        errorMessage.textContent = message;
        errorMessage.className = `error-message ${type}`;
    }

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