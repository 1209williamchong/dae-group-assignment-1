// 檢查用戶是否已登入
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }
    return token;
}

// 獲取用戶資訊
async function getUserInfo() {
    const token = checkAuth();
    try {
        const response = await fetch('/api/users/profile', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('獲取用戶資訊失敗');
        const user = await response.json();
        document.getElementById('username').textContent = user.username;
    } catch (error) {
        console.error('獲取用戶資訊失敗:', error);
    }
}

// 獲取社群列表
async function getCommunities() {
    const token = checkAuth();
    try {
        const response = await fetch('/api/communities', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('獲取社群列表失敗');
        const communities = await response.json();
        displayCommunities(communities);
    } catch (error) {
        console.error('獲取社群列表失敗:', error);
    }
}

// 顯示社群列表
function displayCommunities(communities) {
    const communitiesList = document.querySelector('.communities-list');
    communitiesList.innerHTML = communities.map(community => `
        <div class="community-card">
            ${community.cover_image ? `
                <img src="${community.cover_image}" alt="${community.name}" class="community-cover">
            ` : ''}
            <div class="community-info">
                <div class="community-header">
                    <img src="${community.avatar || '/images/default-community.png'}" alt="${community.name}" class="community-avatar">
                    <h3 class="community-name">${community.name}</h3>
                </div>
                <p class="community-description">${community.description || '這個社群還沒有描述'}</p>
                <div class="community-stats">
                    <div class="stat">
                        <span class="stat-value">${community.member_count}</span>
                        <span class="stat-label">成員</span>
                    </div>
                </div>
                <div class="community-actions">
                    <button class="join-btn" data-community-id="${community.id}">加入社群</button>
                </div>
            </div>
        </div>
    `).join('');

    // 為加入按鈕添加事件監聽器
    document.querySelectorAll('.join-btn').forEach(btn => {
        btn.addEventListener('click', handleJoinCommunity);
    });
}

// 處理加入社群
async function handleJoinCommunity(e) {
    const token = checkAuth();
    const communityId = e.target.dataset.communityId;
    const isJoined = e.target.classList.contains('joined');

    try {
        const response = await fetch(`/api/communities/${communityId}/${isJoined ? 'leave' : 'join'}`, {
            method: isJoined ? 'DELETE' : 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error(isJoined ? '退出社群失敗' : '加入社群失敗');

        e.target.classList.toggle('joined');
        e.target.textContent = isJoined ? '加入社群' : '已加入';
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

// 創建社群
async function createCommunity(formData) {
    const token = checkAuth();
    try {
        const response = await fetch('/api/communities', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) throw new Error('創建社群失敗');

        const community = await response.json();
        alert('社群創建成功！');
        document.getElementById('createCommunityModal').style.display = 'none';
        getCommunities(); // 重新載入社群列表
    } catch (error) {
        console.error('創建社群失敗:', error);
        alert(error.message);
    }
}

// 初始化
function init() {
    getUserInfo();
    getCommunities();

    // 創建社群按鈕事件
    const createBtn = document.getElementById('createCommunityBtn');
    const modal = document.getElementById('createCommunityModal');
    const closeBtn = modal.querySelector('.close-modal');
    const form = document.getElementById('createCommunityForm');

    createBtn.addEventListener('click', () => {
        modal.style.display = 'block';
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('name', document.getElementById('communityName').value);
        formData.append('description', document.getElementById('communityDescription').value);
        
        const avatarFile = document.getElementById('communityAvatar').files[0];
        if (avatarFile) formData.append('avatar', avatarFile);
        
        const coverFile = document.getElementById('communityCover').files[0];
        if (coverFile) formData.append('cover_image', coverFile);

        await createCommunity(formData);
    });

    // 登出按鈕事件
    document.getElementById('logoutButton').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    });
}

// 當 DOM 加載完成時執行初始化
document.addEventListener('DOMContentLoaded', init); 