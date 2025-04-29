const express = require('express');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const db = require('./src/db/init');

const app = express();
const port = 3000;
const JWT_SECRET = 'your-secret-key'; // 在生產環境中應該使用環境變數

// 啟用 CORS
app.use(cors());

// 解析 JSON 請求體
app.use(express.json());

// 設置靜態文件目錄
app.use(express.static(path.join(__dirname, 'public')));

// 驗證 JWT 中間件
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: '未授權' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: '無效的 token' });
        }
        req.user = user;
        next();
    });
}

// API 路由
app.get('/api/posts', (req, res) => {
    db.all(`
        SELECT p.*, u.username, u.avatar,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY p.created_at DESC
    `, (err, posts) => {
        if (err) {
            return res.status(500).json({ error: '獲取貼文失敗' });
        }
        res.json(posts);
    });
});

app.post('/api/posts', authenticateToken, (req, res) => {
    const { content, image_url } = req.body;
    if (!content) {
        return res.status(400).json({ error: '貼文內容不能為空' });
    }

    db.run(
        'INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)',
        [req.user.id, content, image_url],
        function(err) {
            if (err) {
                return res.status(500).json({ error: '發布貼文失敗' });
            }
            res.json({
                id: this.lastID,
                user_id: req.user.id,
                content,
                image_url,
                created_at: new Date().toISOString()
            });
        }
    );
});

app.post('/api/likes', authenticateToken, (req, res) => {
    const { postId } = req.body;
    if (!postId) {
        return res.status(400).json({ error: '缺少必要參數' });
    }

    // 檢查是否已經按讚
    db.get(
        'SELECT id FROM likes WHERE user_id = ? AND post_id = ?',
        [req.user.id, postId],
        (err, row) => {
            if (err) {
                return res.status(500).json({ error: '檢查按讚狀態失敗' });
            }

            if (row) {
                // 取消按讚
                db.run(
                    'DELETE FROM likes WHERE user_id = ? AND post_id = ?',
                    [req.user.id, postId],
                    (err) => {
                        if (err) {
                            return res.status(500).json({ error: '取消按讚失敗' });
                        }
                        res.json({ liked: false });
                    }
                );
            } else {
                // 新增按讚
                db.run(
                    'INSERT INTO likes (user_id, post_id) VALUES (?, ?)',
                    [req.user.id, postId],
                    (err) => {
                        if (err) {
                            return res.status(500).json({ error: '按讚失敗' });
                        }
                        res.json({ liked: true });
                    }
                );
            }
        }
    );
});

app.post('/api/follows', authenticateToken, (req, res) => {
    const { followedId } = req.body;
    if (!followedId) {
        return res.status(400).json({ error: '缺少必要參數' });
    }

    // 檢查是否已經關注
    db.get(
        'SELECT id FROM follows WHERE follower_id = ? AND followed_id = ?',
        [req.user.id, followedId],
        (err, row) => {
            if (err) {
                return res.status(500).json({ error: '檢查關注狀態失敗' });
            }

            if (row) {
                // 取消關注
                db.run(
                    'DELETE FROM follows WHERE follower_id = ? AND followed_id = ?',
                    [req.user.id, followedId],
                    (err) => {
                        if (err) {
                            return res.status(500).json({ error: '取消關注失敗' });
                        }
                        res.json({ following: false });
                    }
                );
            } else {
                // 新增關注
                db.run(
                    'INSERT INTO follows (follower_id, followed_id) VALUES (?, ?)',
                    [req.user.id, followedId],
                    (err) => {
                        if (err) {
                            return res.status(500).json({ error: '關注失敗' });
                        }
                        res.json({ following: true });
                    }
                );
            }
        }
    );
});

// 錯誤處理中間件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: '伺服器內部錯誤' });
});

// 404 處理
app.use((req, res) => {
    res.status(404).json({ error: '找不到請求的資源' });
});

// 啟動伺服器
app.listen(port, () => {
    console.log(`伺服器運行在 http://localhost:${port}`);
}); 