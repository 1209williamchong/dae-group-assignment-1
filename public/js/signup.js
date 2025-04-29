import { authService } from '../src/services/auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    signupForm.parentNode.insertBefore(errorMessage, signupForm);

    // 處理註冊表單提交
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // 驗證表單
        if (password !== confirmPassword) {
            showError('密碼不匹配');
            return;
        }

        if (password.length < 6) {
            showError('密碼長度至少需要 6 個字符');
            return;
        }

        if (!email.includes('@')) {
            showError('請輸入有效的電子郵件地址');
            return;
        }

        try {
            await authService.register(username, password);
            showError('註冊成功！正在跳轉到登入頁面...', 'success');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
        } catch (error) {
            showError(error.message);
        }
    });

    function showError(message, type = 'error') {
        errorMessage.textContent = message;
        errorMessage.className = `error-message ${type}`;
    }
}); 