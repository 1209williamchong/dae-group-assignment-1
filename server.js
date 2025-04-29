const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;

// 啟用 CORS
app.use(cors());

// 設置靜態文件目錄
app.use(express.static(path.join(__dirname, 'public')));

// API 路由
app.get('/api/posts', (req, res) => {
    // 從 localStorage 獲取貼文
    const posts = JSON.parse(localStorage.getItem('posts') || '[]');
    res.json(posts);
});

app.post('/api/posts', express.json(), (req, res) => {
    // 保存新貼文到 localStorage
    const posts = JSON.parse(localStorage.getItem('posts') || '[]');
    const newPost = {
        id: Date.now(),
        ...req.body,
        timestamp: new Date().toISOString()
    };
    posts.unshift(newPost);
    localStorage.setItem('posts', JSON.stringify(posts));
    res.json(newPost);
});

app.post('/api/likes', express.json(), (req, res) => {
    // 處理按讚
    const { postId, userId } = req.body;
    const likes = JSON.parse(localStorage.getItem('likes') || '[]');
    const existingLike = likes.find(like => like.post_id === postId && like.user_id === userId);

    if (existingLike) {
        // 取消按讚
        const newLikes = likes.filter(like => like.like_id !== existingLike.like_id);
        localStorage.setItem('likes', JSON.stringify(newLikes));
        res.json({ liked: false });
    } else {
        // 新增按讚
        const newLike = {
            like_id: Date.now(),
            post_id: postId,
            user_id: userId
        };
        likes.push(newLike);
        localStorage.setItem('likes', JSON.stringify(likes));
        res.json({ liked: true });
    }
});

app.post('/api/follows', express.json(), (req, res) => {
    // 處理關注
    const { followerId, followedId } = req.body;
    const follows = JSON.parse(localStorage.getItem('follows') || '[]');
    const existingFollow = follows.find(
        follow => follow.follower_id === followerId && follow.followed_id === followedId
    );

    if (existingFollow) {
        // 取消關注
        const newFollows = follows.filter(follow => follow.follow_id !== existingFollow.follow_id);
        localStorage.setItem('follows', JSON.stringify(newFollows));
        res.json({ following: false });
    } else {
        // 新增關注
        const newFollow = {
            follow_id: Date.now(),
            follower_id: followerId,
            followed_id: followedId
        };
        follows.push(newFollow);
        localStorage.setItem('follows', JSON.stringify(follows));
        res.json({ following: true });
    }
});

// 啟動伺服器
app.listen(port, () => {
    console.log(`伺服器運行在 http://localhost:${port}`);
}); 