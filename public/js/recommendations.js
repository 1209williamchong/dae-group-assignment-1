import { setupProfilePic } from '/src/services/profile.js';

// 設置個人資料圖片
await setupProfilePic();

// 推薦類型
const RECOMMENDATION_TYPES = {
    personalized: '/api/recommendations/personalized',
    food: '/api/recommendations/food',
    popular: '/api/recommendations/popular'
};

// 當前活動的標籤
let activeTab = 'personalized';

// DOM 元素
const tabButtons = document.querySelectorAll('.tab-button');
const recommendationSections = document.querySelectorAll('.recommendation-section');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    setupTabSwitching();
    loadRecommendations(activeTab);
});

// 設置標籤切換功能
function setupTabSwitching() {
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const type = button.dataset.type;
            switchTab(type);
        });
    });
}

// 切換標籤
function switchTab(type) {
    // 更新標籤按鈕狀態
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.type === type) {
            btn.classList.add('active');
        }
    });

    // 更新內容區域
    recommendationSections.forEach(section => {
        section.classList.remove('active');
        if (section.id === `${type}-section`) {
            section.classList.add('active');
        }
    });

    // 載入對應的推薦內容
    activeTab = type;
    loadRecommendations(type);
}

// 載入推薦內容
async function loadRecommendations(type) {
    const container = document.getElementById(`${type}-posts`);
    
    // 顯示載入狀態
    container.innerHTML = '<div class="loading">載入中...</div>';

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('未登入');
        }

        const response = await fetch(`${RECOMMENDATION_TYPES[type]}?limit=12`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('載入失敗');
        }

        const recommendations = await response.json();
        
        if (recommendations.length === 0) {
            showEmptyState(container, type);
        } else {
            renderPosts(container, recommendations);
        }

    } catch (error) {
        console.error('載入推薦失敗:', error);
        showError(container, error.message);
    }
}

// 渲染貼文
function renderPosts(container, posts) {
    container.innerHTML = posts.map(post => createPostCard(post)).join('');
    
    // 添加點讚功能
    addLikeFunctionality(container);
}

// 創建貼文卡片
function createPostCard(post) {
    const imageUrl = post.image_url || 'https://via.placeholder.com/400x200?text=No+Image';
    const avatarUrl = post.avatar || 'https://via.placeholder.com/100';
    const timeAgo = formatTimeAgo(new Date(post.created_at));
    const aiScore = Math.round(post.food * 100);
    
    return `
        <div class="post-card" data-post-id="${post.id}">
            <div class="post-image">
                <img src="${imageUrl}" alt="貼文圖片" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; color: #999; font-size: 0.9em;">
                    <ion-icon name="image-outline"></ion-icon>
                    <span style="margin-left: 8px;">無圖片</span>
                </div>
            </div>
            <div class="post-content">
                <div class="post-header">
                    <img src="${avatarUrl}" alt="用戶頭像" class="post-avatar" onerror="this.src='https://via.placeholder.com/100'">
                    <div class="post-user-info">
                        <div class="post-username">${escapeHtml(post.username)}</div>
                        <div class="post-time">${timeAgo}</div>
                    </div>
                    <div class="ai-score">
                        <ion-icon name="sparkles-outline"></ion-icon>
                        ${aiScore}%
                    </div>
                </div>
                <div class="post-text">${escapeHtml(post.content)}</div>
                <div class="post-stats">
                    <div class="post-actions">
                        <div class="post-action like-button" data-post-id="${post.id}">
                            <ion-icon name="heart-outline"></ion-icon>
                            <span class="likes-count">${post.likes_count || 0}</span>
                        </div>
                        <div class="post-action">
                            <ion-icon name="chatbubble-outline"></ion-icon>
                            <span>${post.comments_count || 0}</span>
                        </div>
                    </div>
                    <div class="post-action">
                        <ion-icon name="share-outline"></ion-icon>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 添加點讚功能
function addLikeFunctionality(container) {
    const likeButtons = container.querySelectorAll('.like-button');
    
    likeButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const postId = button.dataset.postId;
            const icon = button.querySelector('ion-icon');
            const countSpan = button.querySelector('.likes-count');
            
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`/api/posts/${postId}/like`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const result = await response.json();
                    countSpan.textContent = result.likes;
                    
                    // 切換圖標
                    if (icon.name === 'heart-outline') {
                        icon.name = 'heart';
                        icon.style.color = '#ff6b00';
                    } else {
                        icon.name = 'heart-outline';
                        icon.style.color = '#666';
                    }
                }
            } catch (error) {
                console.error('點讚失敗:', error);
            }
        });
    });
}

// 顯示空狀態
function showEmptyState(container, type) {
    const messages = {
        personalized: {
            icon: 'person-outline',
            title: '還沒有個性化推薦',
            message: '關注更多用戶或點讚更多貼文來獲得個性化推薦'
        },
        food: {
            icon: 'restaurant-outline',
            title: '還沒有美食推薦',
            message: 'AI 正在學習您的口味偏好，稍後再來看看吧'
        },
        popular: {
            icon: 'trending-up-outline',
            title: '還沒有熱門內容',
            message: '成為第一個發布貼文的用戶吧！'
        }
    };

    const message = messages[type];
    
    container.innerHTML = `
        <div class="empty-state">
            <ion-icon name="${message.icon}"></ion-icon>
            <h3>${message.title}</h3>
            <p>${message.message}</p>
        </div>
    `;
}

// 顯示錯誤狀態
function showError(container, message) {
    container.innerHTML = `
        <div class="empty-state">
            <ion-icon name="alert-circle-outline"></ion-icon>
            <h3>載入失敗</h3>
            <p>${message}</p>
        </div>
    `;
}

// 格式化時間
function formatTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return '剛剛';
    } else if (diffInSeconds < 3600) {
        return `${Math.floor(diffInSeconds / 60)}分鐘前`;
    } else if (diffInSeconds < 86400) {
        return `${Math.floor(diffInSeconds / 3600)}小時前`;
    } else if (diffInSeconds < 2592000) {
        return `${Math.floor(diffInSeconds / 86400)}天前`;
    } else {
        return date.toLocaleDateString('zh-TW');
    }
}

// 轉義 HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 添加導航連結到推薦頁面
document.addEventListener('DOMContentLoaded', () => {
    // 在導航欄添加推薦連結
    const navRight = document.querySelector('.nav-right .auth-buttons');
    if (navRight) {
        const recommendationsLink = document.createElement('a');
        recommendationsLink.href = 'recommendations.html';
        recommendationsLink.className = 'nav-link';
        recommendationsLink.innerHTML = `
            <ion-icon name="sparkles-outline"></ion-icon>
            <span>AI 推薦</span>
        `;
        
        // 插入到社群管理之前
        const communityLink = navRight.querySelector('a[href="community.html"]');
        if (communityLink) {
            navRight.insertBefore(recommendationsLink, communityLink);
        } else {
            navRight.appendChild(recommendationsLink);
        }
    }
}); 