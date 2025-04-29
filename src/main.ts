// 定義介面
interface Post {
    id: string;
    content: string;
    author: string;
    timestamp: Date;
    likes: number;
    comments: Comment[];
}

interface Comment {
    id: string;
    content: string;
    author: string;
    timestamp: Date;
}

// DOM 元素
const postBtn: HTMLButtonElement | null = document.querySelector('.post-btn');
const feedContainer: HTMLElement | null = document.querySelector('.feed-container');
const navLinks: NodeListOf<HTMLAnchorElement> = document.querySelectorAll('.nav-links a');
const userProfile: HTMLImageElement | null = document.querySelector('.user-profile img');
const body: HTMLElement = document.body;

// 創建新貼文
function createNewPost(content: string): void {
    const post: HTMLElement = document.createElement('article');
    post.className = 'post';
    
    const currentTime: Date = new Date();
    
    post.innerHTML = `
        <div class="post-header">
            <img src="images/default-avatar.png" alt="用戶頭像" class="post-avatar">
            <div class="post-info">
                <h3>當前用戶</h3>
                <span class="post-time" data-time="${currentTime.toISOString()}">剛剛</span>
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
    
    if (feedContainer) {
        feedContainer.insertBefore(post, feedContainer.firstChild);
        addPostEventListeners(post as HTMLElement);
    }
}

// 為貼文添加事件監聽器
function addPostEventListeners(post: HTMLElement): void {
    const likeBtn: HTMLElement | null = post.querySelector('.like-btn');
    const commentBtn: HTMLElement | null = post.querySelector('.comment-btn');
    const shareBtn: HTMLElement | null = post.querySelector('.share-btn');
    
    if (likeBtn) {
        likeBtn.addEventListener('click', function(this: HTMLElement, e: Event) {
            e.stopPropagation();
            this.classList.toggle('liked');
            
            if (this.classList.contains('liked')) {
                this.textContent = '❤️ 已讚';
                this.style.color = '#ff0000';
            } else {
                this.textContent = '❤️ 讚';
                this.style.color = '';
            }
        });
    }
    
    if (shareBtn) {
        shareBtn.addEventListener('click', function(e: Event) {
            e.stopPropagation();
            const shareMenu: HTMLElement = document.createElement('div');
            shareMenu.className = 'share-menu';
            shareMenu.innerHTML = `
                <button class="share-option">複製連結</button>
                <button class="share-option">分享到 Facebook</button>
                <button class="share-option">分享到 Twitter</button>
            `;
            
            post.appendChild(shareMenu);
            
            shareMenu.querySelectorAll('.share-option').forEach(option => {
                option.addEventListener('click', function(this: HTMLElement) {
                    alert(`已分享到 ${this.textContent}`);
                    shareMenu.remove();
                });
            });
            
            document.addEventListener('click', function removeShareMenu(e: Event) {
                if (!shareMenu.contains(e.target as Node) && e.target !== shareBtn) {
                    shareMenu.remove();
                    document.removeEventListener('click', removeShareMenu);
                }
            });
        });
    }
}

// 創建留言區域
function createCommentSection(post: HTMLElement): HTMLElement {
    const commentSection: HTMLElement = document.createElement('div');
    commentSection.className = 'comments';
    const postContent: HTMLElement | null = post.querySelector('.post-content');
    if (postContent) {
        postContent.appendChild(commentSection);
    }
    return commentSection;
}

// 添加留言
function addComment(commentSection: HTMLElement, comment: string): void {
    const commentElement: HTMLElement = document.createElement('div');
    commentElement.className = 'comment';
    
    const userName: HTMLElement = document.createElement('strong');
    userName.textContent = '當前用戶';
    
    const commentText: HTMLElement = document.createElement('p');
    commentText.textContent = comment;
    
    const commentContent: HTMLElement = document.createElement('div');
    commentContent.className = 'comment-content';
    commentContent.appendChild(userName);
    commentContent.appendChild(commentText);
    
    const avatar: HTMLImageElement = document.createElement('img');
    avatar.src = 'images/default-avatar.png';
    avatar.alt = '用戶頭像';
    avatar.className = 'comment-avatar';
    
    commentElement.appendChild(avatar);
    commentElement.appendChild(commentContent);
    commentSection.appendChild(commentElement);
}

// 修改元素內容與屬性
function updateUserProfile(): void {
    if (userProfile) {
        userProfile.setAttribute('src', 'images/new-avatar.png');
        userProfile.setAttribute('alt', '新頭像');
        userProfile.style.border = '2px solid #1a73e8';
        userProfile.style.boxShadow = '0 0 5px rgba(0,0,0,0.2)';
    }
}

// 使用 classList 操作類別
function toggleActiveNav(): void {
    navLinks.forEach((link: HTMLAnchorElement) => {
        link.addEventListener('click', function(e: Event) {
            e.preventDefault();
            navLinks.forEach((l: HTMLAnchorElement) => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// 滑鼠事件處理
function handleMouseEvents(): void {
    if (userProfile) {
        userProfile.addEventListener('mouseover', function(this: HTMLImageElement) {
            this.style.transform = 'scale(1.2)';
            this.style.transition = 'transform 0.3s ease';
        });

        userProfile.addEventListener('mouseout', function(this: HTMLImageElement) {
            this.style.transform = 'scale(1)';
        });
    }

    body.addEventListener('mousemove', function(e: MouseEvent) {
        const x: number = e.clientX / window.innerWidth;
        const y: number = e.clientY / window.innerHeight;
        document.documentElement.style.setProperty('--mouse-x', x.toString());
        document.documentElement.style.setProperty('--mouse-y', y.toString());
    });
}

// 鍵盤事件處理
function handleKeyboardEvents(): void {
    document.addEventListener('keydown', function(e: KeyboardEvent) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.share-menu').forEach(menu => menu.remove());
        }
    });

    if (postBtn && feedContainer) {
        const postInput: HTMLTextAreaElement = document.createElement('textarea');
        postInput.className = 'post-input';
        postInput.placeholder = '輸入貼文內容...';
        
        postBtn.addEventListener('click', function() {
            if (!document.querySelector('.post-input')) {
                feedContainer.insertBefore(postInput, feedContainer.firstChild);
                postInput.focus();
            }
        });

        postInput.addEventListener('keydown', function(e: KeyboardEvent) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const content: string = this.value.trim();
                if (content) {
                    createNewPost(content);
                    this.remove();
                }
            }
        });
    }
}

// 表單事件處理
function handleFormEvents(): void {
    function createCommentInput(post: HTMLElement): HTMLElement {
        const commentInput: HTMLElement = document.createElement('div');
        commentInput.className = 'comment-input';
        commentInput.innerHTML = `
            <textarea placeholder="輸入留言..."></textarea>
            <button class="submit-comment">發布</button>
        `;

        const textarea: HTMLTextAreaElement = commentInput.querySelector('textarea')!;
        const submitBtn: HTMLButtonElement = commentInput.querySelector('button')!;

        textarea.addEventListener('input', function() {
            submitBtn.disabled = !this.value.trim();
        });

        submitBtn.addEventListener('click', function() {
            const comment: string = textarea.value.trim();
            if (comment) {
                const commentSection: HTMLElement = post.querySelector('.comments') || createCommentSection(post);
                addComment(commentSection, comment);
                commentInput.remove();
            }
        });

        return commentInput;
    }

    document.querySelectorAll('.comment-btn').forEach(btn => {
        btn.addEventListener('click', function(this: HTMLElement) {
            const post: HTMLElement | null = this.closest('.post');
            if (post) {
                const commentInput: HTMLElement = createCommentInput(post);
                post.querySelector('.post-content')?.appendChild(commentInput);
                commentInput.querySelector('textarea')?.focus();
            }
        });
    });
}

// 窗口事件處理
function handleWindowEvents(): void {
    let lastScrollTop: number = 0;
    window.addEventListener('scroll', function() {
        const header: HTMLElement | null = document.querySelector('header');
        const currentScroll: number = window.pageYOffset || document.documentElement.scrollTop;
        
        if (header) {
            header.style.transform = currentScroll > lastScrollTop ? 'translateY(-100%)' : 'translateY(0)';
        }
        lastScrollTop = currentScroll;
    });

    window.addEventListener('resize', function() {
        const shareMenus: NodeListOf<HTMLElement> = document.querySelectorAll('.share-menu');
        shareMenus.forEach(menu => {
            if (window.innerWidth <= 768) {
                menu.style.position = 'fixed';
                menu.style.bottom = '0';
                menu.style.left = '0';
                menu.style.right = '0';
            } else {
                menu.style.position = 'absolute';
                menu.style.bottom = 'auto';
            }
        });
    });
}

// 時間事件處理
function handleTimeEvents(): void {
    function updatePostTime(): void {
        document.querySelectorAll('.post-time').forEach(timeElement => {
            const postTime: Date = new Date(timeElement.getAttribute('data-time') || '');
            const now: Date = new Date();
            const diff: number = now.getTime() - postTime.getTime();
            
            let timeString: string = '';
            if (diff < 60000) {
                timeString = '剛剛';
            } else if (diff < 3600000) {
                timeString = `${Math.floor(diff / 60000)}分鐘前`;
            } else if (diff < 86400000) {
                timeString = `${Math.floor(diff / 3600000)}小時前`;
            } else {
                timeString = postTime.toLocaleDateString();
            }
            
            timeElement.textContent = timeString;
        });
    }

    setInterval(updatePostTime, 1000);
}

// 事件冒泡與停止傳播示例
function handleEventBubbling(): void {
    document.querySelectorAll('.post').forEach(post => {
        post.addEventListener('click', function() {
            console.log('貼文被點擊了');
        });

        const likeBtn: HTMLElement | null = post.querySelector('.like-btn');
        if (likeBtn) {
            likeBtn.addEventListener('click', function(e: Event) {
                e.stopPropagation();
                this.classList.toggle('liked');
                
                if (this.classList.contains('liked')) {
                    this.textContent = '❤️ 已讚';
                    this.style.color = '#ff0000';
                } else {
                    this.textContent = '❤️ 讚';
                    this.style.color = '';
                }
            });
        }
    });
}

// 初始化
function init(): void {
    handleMouseEvents();
    handleKeyboardEvents();
    handleFormEvents();
    handleWindowEvents();
    handleTimeEvents();
    handleEventBubbling();
    
    document.querySelectorAll('.post').forEach(post => {
        addPostEventListeners(post as HTMLElement);
    });
    
    toggleActiveNav();
    updateUserProfile();
}

// 當 DOM 加載完成時執行初始化
document.addEventListener('DOMContentLoaded', init); 