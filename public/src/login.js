document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    // 表單提交
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value;
        const password = passwordInput.value;

        // 驗證表單
        if (!email || !password) {
            alert('請填寫所有必填欄位');
            return;
        }

        if (!email.includes('@')) {
            alert('請輸入有效的電子郵件地址');
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // 保存 token 和用戶信息
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                alert('登入成功！正在跳轉到首頁...');
                window.location.href = 'home.html';
            } else {
                alert(data.error || '登入失敗');
            }
        } catch (error) {
            console.error('登入錯誤:', error);
            alert('登入過程中發生錯誤');
        }
    });
}); 