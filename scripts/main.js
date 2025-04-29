// DOM 元素
const postBtn = document.querySelector('.post-btn');
const feedContainer = document.querySelector('.feed-container');
const navLinks = document.querySelectorAll('.nav-links a');
const userProfile = document.querySelector('.user-profile img');
const body = document.body;

// 修改元素內容與屬性
function updateUserProfile() {
    // 使用 setAttribute 修改圖片
    userProfile.setAttribute('src', 'images/new-avatar.png');
    userProfile.setAttribute('alt', '新頭像');
    
    // 使用 style 修改樣式
    userProfile.style.border = '2px solid #1a73e8';
    userProfile.style.boxShadow = '0 0 5px rgba(0,0,0,0.2)';
}

// 使用 classList 操作類別
function toggleActiveNav() {
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            // 移除所有 active 類別
            navLinks.forEach(l => l.classList.remove('active'));
            // 為當前點擊的連結添加 active 類別
            this.classList.add('active');
        });
    });
}

// 滑鼠事件處理
function handleMouseEvents() {
    // 滑鼠移入效果
    userProfile.addEventListener('mouseover', function(e) {
        this.style.transform = 'scale(1.2)';
        this.style.transition = 'transform 0.3s ease';
    });

    // 滑鼠移出效果
    userProfile.addEventListener('mouseout', function(e) {
        this.style.transform = 'scale(1)';
    });

    // 滑鼠移動效果
    body.addEventListener('mousemove', function(e) {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        document.documentElement.style.setProperty('--mouse-x', x);
        document.documentElement.style.setProperty('--mouse-y', y);
    });
}

// 鍵盤事件處理
function handleKeyboardEvents() {
    // 全局鍵盤事件
    document.addEventListener('keydown', function(e) {
        // 按下 ESC 鍵關閉所有彈出視窗
        if (e.key === 'Escape') {
            document.querySelectorAll('.share-menu').forEach(menu => menu.remove());
        }
    });

    // 表單輸入事件
    const postInput = document.createElement('textarea');
    postInput.className = 'post-input';
    postInput.placeholder = '輸入貼文內容...';
    
    postBtn.addEventListener('click', function() {
        if (!document.querySelector('.post-input')) {
            feedContainer.insertBefore(postInput, feedContainer.firstChild);
            postInput.focus();
        }
    });

    postInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const content = this.value.trim();
            if (content) {
                createNewPost(content);
                this.remove();
            }
        }
    });
}

// 表單事件處理
function handleFormEvents() {
    // 創建評論輸入框
    function createCommentInput(post) {
        const commentInput = document.createElement('div');
        commentInput.className = 'comment-input';
        commentInput.innerHTML = `
            <textarea placeholder="輸入留言..."></textarea>
            <button class="submit-comment">發布</button>
        `;

        const textarea = commentInput.querySelector('textarea');
        const submitBtn = commentInput.querySelector('button');

        // 輸入事件
        textarea.addEventListener('input', function() {
            submitBtn.disabled = !this.value.trim();
        });

        // 提交事件
        submitBtn.addEventListener('click', function() {
            const comment = textarea.value.trim();
            if (comment) {
                const commentSection = post.querySelector('.comments') || createCommentSection(post);
                addComment(commentSection, comment);
                commentInput.remove();
            }
        });

        return commentInput;
    }

    // 更新留言按鈕事件
    document.querySelectorAll('.comment-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const post = this.closest('.post');
            const commentInput = createCommentInput(post);
            post.querySelector('.post-content').appendChild(commentInput);
            commentInput.querySelector('textarea').focus();
        });
    });
}

// 窗口事件處理
function handleWindowEvents() {
    // 滾動事件
    let lastScrollTop = 0;
    window.addEventListener('scroll', function() {
        const header = document.querySelector('header');
        const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
        
        if (currentScroll > lastScrollTop) {
            // 向下滾動
            header.style.transform = 'translateY(-100%)';
        } else {
            // 向上滾動
            header.style.transform = 'translateY(0)';
        }
        lastScrollTop = currentScroll;
    });

    // 調整窗口大小
    window.addEventListener('resize', function() {
        const shareMenus = document.querySelectorAll('.share-menu');
        if (window.innerWidth <= 768) {
            shareMenus.forEach(menu => {
                menu.style.position = 'fixed';
                menu.style.bottom = '0';
                menu.style.left = '0';
                menu.style.right = '0';
            });
        } else {
            shareMenus.forEach(menu => {
                menu.style.position = 'absolute';
                menu.style.bottom = 'auto';
            });
        }
    });
}

// 時間事件處理
function handleTimeEvents() {
    // 更新貼文時間
    function updatePostTime() {
        document.querySelectorAll('.post-time').forEach(timeElement => {
            const postTime = new Date(timeElement.dataset.time);
            const now = new Date();
            const diff = now - postTime;
            
            let timeString = '';
            if (diff < 60000) { // 少於1分鐘
                timeString = '剛剛';
            } else if (diff < 3600000) { // 少於1小時
                timeString = `${Math.floor(diff / 60000)}分鐘前`;
            } else if (diff < 86400000) { // 少於1天
                timeString = `${Math.floor(diff / 3600000)}小時前`;
            } else {
                timeString = postTime.toLocaleDateString();
            }
            
            timeElement.textContent = timeString;
        });
    }

    // 每秒更新一次時間
    setInterval(updatePostTime, 1000);
}

// 事件冒泡與停止傳播示例
function handleEventBubbling() {
    // 貼文點擊事件
    document.querySelectorAll('.post').forEach(post => {
        post.addEventListener('click', function(e) {
            console.log('貼文被點擊了');
        });

        // 點讚按鈕點擊事件
        const likeBtn = post.querySelector('.like-btn');
        likeBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // 阻止事件冒泡
            this.classList.toggle('liked');
            
            if (this.classList.contains('liked')) {
                this.textContent = '❤️ 已讚';
                this.style.color = '#ff0000';
            } else {
                this.textContent = '❤️ 讚';
                this.style.color = '';
            }
        });
    });
}

// 創建新貼文
function createNewPost(content) {
    const post = document.createElement('article');
    post.className = 'post';
    
    const currentTime = new Date().toLocaleTimeString();
    
    post.innerHTML = `
        <div class="post-header">
            <img src="images/default-avatar.png" alt="用戶頭像" class="post-avatar">
            <div class="post-info">
                <h3>當前用戶</h3>
                <span class="post-time">${currentTime}</span>
            </div>
        </div>
        <div class="post-content">
            <p>${content}</p>
        </div>
        <div class="post-actions">
            <button class="like-btn">❤️ 讚</button>
            <button class="comment-btn">💬 留言</button>
            <button class="share-btn">↪️ 分享</button>
        </div>
    `;
    
    // 將新貼文添加到最前面
    feedContainer.insertBefore(post, feedContainer.firstChild);
    
    // 為新貼文添加事件監聽器
    addPostEventListeners(post);
}

// 為貼文添加事件監聽器
function addPostEventListeners(post) {
    const likeBtn = post.querySelector('.like-btn');
    const commentBtn = post.querySelector('.comment-btn');
    const shareBtn = post.querySelector('.share-btn');
    
    // 點讚功能
    likeBtn.addEventListener('click', function() {
        // 使用 classList 切換類別
        this.classList.toggle('liked');
        
        if (this.classList.contains('liked')) {
            this.textContent = '❤️ 已讚';
            this.style.color = '#ff0000';
        } else {
            this.textContent = '❤️ 讚';
            this.style.color = '';
        }
    });
    
    // 分享功能
    shareBtn.addEventListener('click', () => {
        // 創建分享選單
        const shareMenu = document.createElement('div');
        shareMenu.className = 'share-menu';
        shareMenu.innerHTML = `
            <button class="share-option">複製連結</button>
            <button class="share-option">分享到 Facebook</button>
            <button class="share-option">分享到 Twitter</button>
        `;
        
        // 添加分享選單到貼文
        post.appendChild(shareMenu);
        
        // 為分享選項添加事件監聽器
        shareMenu.querySelectorAll('.share-option').forEach(option => {
            option.addEventListener('click', function() {
                alert(`已分享到 ${this.textContent}`);
                shareMenu.remove(); // 移除分享選單
            });
        });
        
        // 點擊其他地方時移除分享選單
        document.addEventListener('click', function removeShareMenu(e) {
            if (!shareMenu.contains(e.target) && e.target !== shareBtn) {
                shareMenu.remove();
                document.removeEventListener('click', removeShareMenu);
            }
        });
    });
}

// 創建留言區域
function createCommentSection(post) {
    const commentSection = document.createElement('div');
    commentSection.className = 'comments';
    post.querySelector('.post-content').appendChild(commentSection);
    return commentSection;
}

// 添加留言
function addComment(commentSection, comment) {
    const commentElement = document.createElement('div');
    commentElement.className = 'comment';
    
    // 使用 textContent 設置純文本內容
    const userName = document.createElement('strong');
    userName.textContent = '當前用戶';
    
    const commentText = document.createElement('p');
    commentText.textContent = comment;
    
    const commentContent = document.createElement('div');
    commentContent.className = 'comment-content';
    commentContent.appendChild(userName);
    commentContent.appendChild(commentText);
    
    const avatar = document.createElement('img');
    avatar.src = 'images/default-avatar.png';
    avatar.alt = '用戶頭像';
    avatar.className = 'comment-avatar';
    
    commentElement.appendChild(avatar);
    commentElement.appendChild(commentContent);
    commentSection.appendChild(commentElement);
}

// 初始化
function init() {
    handleMouseEvents();
    handleKeyboardEvents();
    handleFormEvents();
    handleWindowEvents();
    handleTimeEvents();
    handleEventBubbling();
    
    // 為現有貼文添加事件監聽器
    document.querySelectorAll('.post').forEach(post => {
        addPostEventListeners(post);
    });
    
    // 初始化導航欄
    toggleActiveNav();
    
    // 更新用戶資料
    updateUserProfile();
}

// 當 DOM 加載完成時執行初始化
document.addEventListener('DOMContentLoaded', init); 