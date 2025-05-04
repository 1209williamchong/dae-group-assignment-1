document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('register-form');
    const avatarInput = document.getElementById('avatar');
    const avatarPreview = document.querySelector('.avatar-preview');
    const uploadBtn = document.querySelector('.upload-btn');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');

    // 頭像上傳預覽
    uploadBtn.addEventListener('click', () => {
        avatarInput.click();
    });

    avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                avatarPreview.innerHTML = `<img src="${e.target.result}" alt="Avatar">`;
            };
            reader.readAsDataURL(file);
        }
    });

    // 密碼確認驗證
    confirmPasswordInput.addEventListener('input', () => {
        if (passwordInput.value !== confirmPasswordInput.value) {
            confirmPasswordInput.setCustomValidity('密碼不匹配');
        } else {
            confirmPasswordInput.setCustomValidity('');
        }
    });

    // 表單提交
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const avatar = document.getElementById('avatar').files[0];
        const bio = document.getElementById('bio').value;

        // 驗證表單
        if (password !== confirmPassword) {
            alert('密碼不匹配');
            return;
        }

        if (password.length < 6) {
            alert('密碼長度至少需要 6 個字符');
            return;
        }

        if (!email.includes('@')) {
            alert('請輸入有效的電子郵件地址');
            return;
        }

        try {
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

            const response = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json'
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                // 保存 token 和用戶信息
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                alert('註冊成功！正在跳轉到首頁...');
                window.location.href = 'home.html';
            } else {
                alert(data.error || '註冊失敗');
            }
        } catch (error) {
            console.error('註冊錯誤:', error);
            alert('註冊過程中發生錯誤');
        }
    });
}); 