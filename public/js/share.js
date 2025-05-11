import { postsApi } from '/src/services/api.js';
import { setupProfilePic } from '/src/services/profile.js';

setupProfilePic();

// 假資料
const demoPosts = [
    {
        user: '小明',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        time: '1 分鐘前',
        text: '今日天氣好正，去咗海邊玩！',
        media: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
        mediaType: 'image'
    },
    {
        user: '阿花',
        avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
        time: '5 分鐘前',
        text: '第一次試下拍片分享，大家多多支持！',
        media: 'https://www.w3schools.com/html/mov_bbb.mp4',
        mediaType: 'video'
    },
    {
        user: 'fresh官方',
        avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
        time: '10 分鐘前',
        text: '歡迎大家嚟 fresh 分享生活點滴！',
        media: '',
        mediaType: ''
    }
];

async function loadPosts() {
    try {
        const json = await postsApi.getPosts();
        console.log('loadPosts result:', json);
        const posts = json.posts;
        for (const post of posts) {
            let date = new Date(post.time);
            // adjust for +8 hours
            date.setHours(date.getHours() + 8);
            post.time = date.toLocaleString();
        }
        renderFeed(posts);
    } catch (error) {
        alert(error.message);
    }
}

loadPosts();



// 動態牆渲染
function renderFeed(posts) {
    const feed = document.getElementById('feed');
    feed.innerHTML = '';
    posts.forEach(post => {
        const div = document.createElement('div');
        div.className = 'post';
        div.innerHTML = `
  <div class="post-header">
    <img class="post-avatar" src="${post.avatar}" alt="${post.user}">
    <span class="post-user">${post.user}</span>
    <span class="post-time">${post.time}</span>
  </div>
  <div class="post-content">${post.text ? post.text.replace(/\n/g, '<br>') : ''}</div>
  <div class="post-media">
    ${post.mediaType === 'image' ? `<img src="${post.media}" alt="貼文圖片">` : ''}
    ${post.mediaType === 'video' ? `<video src="${post.media}" controls></video>` : ''}
  </div>
`;
        feed.appendChild(div);
    });
}
// 發佈區預覽
document.getElementById('media').addEventListener('change', function (e) {
    const preview = document.getElementById('mediaPreview');
    preview.innerHTML = '';
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (file.type.startsWith('image/')) {
        preview.innerHTML = `<img src="${url}" alt="預覽">`;
    } else if (file.type.startsWith('video/')) {
        preview.innerHTML = `<video src="${url}" controls></video>`;
    }
});
// 處理發佈（前端示範）
document.getElementById('shareForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const formData = new FormData(this);

    const response = await fetch(

        '/api/posts',
        // '/api/upload',
        {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            method: 'POST',
            body: formData
        });

    if (response.ok) {
        alert('已成功發佈到伺服器！');
        loadPosts();
        shareForm.reset()
        const preview = document.getElementById('mediaPreview');
        preview.innerHTML = '';
    } else {
        alert('發佈失敗');
    }
});
// 載入 localStorage 頭像
window.addEventListener('DOMContentLoaded', function () {
    const avatar = localStorage.getItem('profileAvatar');
    if (avatar) {
        var img = document.getElementById('home-avatar');
        if (img) img.src = avatar;
    }
});