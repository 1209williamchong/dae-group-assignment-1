document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('edit-profile-form');
    const avatarInput = document.getElementById('avatar-input');
    const avatarPreview = document.getElementById('avatar-preview');
    const removeAvatarBtn = document.getElementById('remove-avatar-btn');
    const backBtn = document.getElementById('back-btn');

    // 載入用戶資料
    loadUserProfile();

    // 返回按鈕事件
    backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'profile.html';
    });

    // 頭像上傳預覽
    avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                avatarPreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // 移除頭像
    removeAvatarBtn.addEventListener('click', () => {
        avatarPreview.src = 'https://via.placeholder.com/200';
        avatarInput.value = '';
    });

    // 表單提交
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = {
            username: formData.get('username'),
            email: formData.get('email'),
            bio: formData.get('bio'),
            postVisibility: formData.get('post-visibility'),
            profileVisibility: formData.get('profile-visibility'),
            notifications: {
                newFollowers: document.getElementById('new-followers').checked,
                comments: document.getElementById('comments').checked,
                likes: document.getElementById('likes').checked
            }
        };

        try {
            const response = await fetch(`${API_BASE_URL}/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                // 如果有上傳新頭像
                if (avatarInput.files[0]) {
                    const avatarFormData = new FormData();
                    avatarFormData.append('avatar', avatarInput.files[0]);

                    const avatarResponse = await fetch(`${API_BASE_URL}/users/avatar`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: avatarFormData
                    });

                    if (!avatarResponse.ok) {
                        throw new Error('頭像上傳失敗');
                    }
                }

                alert('個人檔案更新成功！');
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
        const response = await fetch(`${API_BASE_URL}/users/profile`, {
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
            document.getElementById('post-visibility').value = user.postVisibility || 'public';
            document.getElementById('profile-visibility').value = user.profileVisibility || 'public';
            
            // 設置通知選項
            if (user.notifications) {
                document.getElementById('new-followers').checked = user.notifications.newFollowers;
                document.getElementById('comments').checked = user.notifications.comments;
                document.getElementById('likes').checked = user.notifications.likes;
            }

            // 設置頭像
            if (user.avatar) {
                document.getElementById('avatar-preview').src = user.avatar;
            }
        } else {
            throw new Error('載入個人檔案失敗');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('載入個人檔案失敗，請稍後再試');
    }
} 