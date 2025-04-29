// 定義 Post 類別
class Post {
    constructor(content, image = null) {
        this.id = Date.now();
        this.content = content;
        this.image = image;
        this.likes = 0;
        this.comments = [];
        this.timestamp = new Date();
    }
}

// 初始化應用程式
document.addEventListener('DOMContentLoaded', () => {
    const postForm = document.getElementById('postForm');
    const postsContainer = document.getElementById('posts');
    let posts = JSON.parse(localStorage.getItem('posts')) || [];

    // 渲染所有貼文
    function renderPosts() {
        postsContainer.innerHTML = '';
        posts.forEach(post => {
            const postElement = createPostElement(post);
            postsContainer.appendChild(postElement);
        });
    }

    // 創建貼文元素
    function createPostElement(post) {
        const postElement = document.createElement('div');
        postElement.className = 'post';
        postElement.innerHTML = `
            <p>${post.content}</p>
            ${post.image ? `<img src="${post.image}" alt="貼文圖片">` : ''}
            <div class="post-actions">
                <button onclick="likePost(${post.id})">❤️ ${post.likes}</button>
                <button onclick="commentPost(${post.id})">💬 留言</button>
            </div>
            <div class="comments" id="comments-${post.id}">
                ${post.comments.map(comment => `
                    <div class="comment">
                        <p>${comment}</p>
                    </div>
                `).join('')}
            </div>
        `;
        return postElement;
    }

    // 處理表單提交
    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const content = postForm.querySelector('textarea').value;
        const imageInput = document.getElementById('imageInput');
        let image = null;

        if (imageInput.files[0]) {
            image = await readFileAsDataURL(imageInput.files[0]);
        }

        const post = new Post(content, image);
        posts.unshift(post);
        localStorage.setItem('posts', JSON.stringify(posts));
        renderPosts();

        // 重置表單
        postForm.reset();
    });

    // 讀取檔案為 Data URL
    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // 初始化渲染
    renderPosts();
});

// 全局函數
window.likePost = function(postId) {
    const posts = JSON.parse(localStorage.getItem('posts')) || [];
    const post = posts.find(p => p.id === postId);
    if (post) {
        post.likes++;
        localStorage.setItem('posts', JSON.stringify(posts));
        document.querySelector(`#posts .post:nth-child(${posts.indexOf(post) + 1}) .post-actions button:first-child`)
            .textContent = `❤️ ${post.likes}`;
    }
};

window.commentPost = function(postId) {
    const comment = prompt('輸入你的留言：');
    if (comment) {
        const posts = JSON.parse(localStorage.getItem('posts')) || [];
        const post = posts.find(p => p.id === postId);
        if (post) {
            post.comments.push(comment);
            localStorage.setItem('posts', JSON.stringify(posts));
            const commentsContainer = document.getElementById(`comments-${postId}`);
            const commentElement = document.createElement('div');
            commentElement.className = 'comment';
            commentElement.innerHTML = `<p>${comment}</p>`;
            commentsContainer.appendChild(commentElement);
        }
    }
}; 