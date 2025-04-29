const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;

// 啟用 CORS
app.use(cors());

// 解析 JSON 請求體
app.use(express.json());

// 設置靜態文件目錄
app.use(express.static(path.join(__dirname, 'public')));

// 錯誤處理中間件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: '伺服器內部錯誤' });
});

// API 路由
app.get('/api/posts', (req, res) => {
    try {
        // 從 localStorage 獲取貼文
        const posts = JSON.parse(localStorage.getItem('posts') || '[]');
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: '獲取貼文失敗' });
    }
});

app.post('/api/posts', (req, res) => {
    try {
        if (!req.body.content) {
            return res.status(400).json({ error: '貼文內容不能為空' });
        }

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
    } catch (error) {
        res.status(500).json({ error: '發布貼文失敗' });
    }
});

app.post('/api/likes', (req, res) => {
    try {
        const { postId, userId } = req.body;
        if (!postId || !userId) {
            return res.status(400).json({ error: '缺少必要參數' });
        }

        // 處理按讚
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
    } catch (error) {
        res.status(500).json({ error: '處理按讚失敗' });
    }
});

app.post('/api/follows', (req, res) => {
    try {
        const { followerId, followedId } = req.body;
        if (!followerId || !followedId) {
            return res.status(400).json({ error: '缺少必要參數' });
        }

        // 處理關注
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
            localStorage.setItem('follows', JSON.stringify(newFollows));
            res.json({ following: true });
        }
    } catch (error) {
        res.status(500).json({ error: '處理關注失敗' });
    }
});

// 404 處理
app.use((req, res) => {
    res.status(404).json({ error: '找不到請求的資源' });
});

// 啟動伺服器
app.listen(port, () => {
    console.log(`伺服器運行在 http://localhost:${port}`);
}); 