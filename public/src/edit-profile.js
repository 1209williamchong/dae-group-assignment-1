document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('profileForm');

    // 載入用戶資料
    loadUserProfile();

    // 表單提交
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = {
            username: formData.get('username'),
            email: formData.get('email'),
            bio: formData.get('bio')
        };

        try {
            const response = await fetch('http://localhost:3000/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                alert('個人資料更新成功！');
                window.location.href = 'profile.html';
            } else {
                throw new Error('更新失敗');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('更新失敗，請稍後再試');
        }
    });
});

async function loadUserProfile() {
    try {
        const response = await fetch('http://localhost:3000/api/users/profile', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const user = await response.json();
            
            // 填充表單
            document.getElementById('username').value = user.username;
            document.getElementById('email').value = user.email;
            document.getElementById('bio').value = user.bio || '';
        } else {
            throw new Error('載入個人資料失敗');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('載入個人資料失敗，請稍後再試');
    }
} 