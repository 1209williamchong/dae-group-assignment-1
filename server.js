const express = require('express');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
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

// 獲取所有貼文
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

// 獲取關注的人的貼文
app.get('/api/posts/following', authenticateToken, (req, res) => {
    db.all(`
        SELECT p.*, u.username, u.avatar,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
        JOIN follows f ON p.user_id = f.followed_id
        WHERE f.follower_id = ?
        ORDER BY p.created_at DESC
    `, [req.user.id], (err, posts) => {
        if (err) {
            return res.status(500).json({ error: '獲取關注的人貼文失敗' });
        }
        res.json(posts);
    });
});

// 發布新貼文
app.post('/api/posts', authenticateToken, (req, res) => {
    const { content, media, youtube_url } = req.body;
    if (!content) {
        return res.status(400).json({ error: '貼文內容不能為空' });
    }

    db.run(
        'INSERT INTO posts (user_id, content, media, youtube_url) VALUES (?, ?, ?, ?)',
        [req.user.id, content, media, youtube_url],
        function(err) {
            if (err) {
                return res.status(500).json({ error: '發布貼文失敗' });
            }
            res.json({
                id: this.lastID,
                user_id: req.user.id,
                content,
                media,
                youtube_url,
                created_at: new Date().toISOString()
            });
        }
    );
});

// 點讚貼文
app.post('/api/posts/:postId/like', authenticateToken, (req, res) => {
    const { postId } = req.params;
    
    db.run(
        'INSERT OR REPLACE INTO likes (user_id, post_id) VALUES (?, ?)',
        [req.user.id, postId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: '點讚失敗' });
            }
            
            // 獲取更新後的點讚數
            db.get(
                'SELECT COUNT(*) as count FROM likes WHERE post_id = ?',
                [postId],
                (err, result) => {
                    if (err) {
                        return res.status(500).json({ error: '獲取點讚數失敗' });
                    }
                    res.json({ likes: result.count });
                }
            );
        }
    );
});

// 獲取關注的人
app.get('/api/following', authenticateToken, (req, res) => {
    db.all(`
        SELECT u.id, u.username, u.avatar
        FROM users u
        JOIN follows f ON u.id = f.followed_id
        WHERE f.follower_id = ?
    `, [req.user.id], (err, following) => {
        if (err) {
            return res.status(500).json({ error: '獲取關注的人失敗' });
        }
        res.json(following);
    });
});

// 關注用戶
app.post('/api/follow/:userId', authenticateToken, (req, res) => {
    const { userId } = req.params;
    
    if (userId === req.user.id) {
        return res.status(400).json({ error: '不能關注自己' });
    }

    db.run(
        'INSERT OR IGNORE INTO follows (follower_id, followed_id) VALUES (?, ?)',
        [req.user.id, userId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: '關注失敗' });
            }
            res.json({ success: true });
        }
    );
});

// 取消關注
app.delete('/api/follow/:userId', authenticateToken, (req, res) => {
    const { userId } = req.params;
    
    db.run(
        'DELETE FROM follows WHERE follower_id = ? AND followed_id = ?',
        [req.user.id, userId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: '取消關注失敗' });
            }
            res.json({ success: true });
        }
    );
});

// 註冊新用戶
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;

    // 驗證輸入
    if (!username || !email || !password) {
        return res.status(400).json({ error: '請填寫所有必填欄位' });
    }

    // 檢查用戶名是否已存在
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: '資料庫錯誤' });
        }
        if (user) {
            return res.status(400).json({ error: '用戶名已被使用' });
        }

        // 檢查電子郵件是否已存在
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                return res.status(500).json({ error: '資料庫錯誤' });
            }
            if (user) {
                return res.status(400).json({ error: '電子郵件已被使用' });
            }

            // 加密密碼
            const hashedPassword = await bcrypt.hash(password, 10);

            // 創建新用戶
            db.run(
                'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                [username, email, hashedPassword],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: '註冊失敗' });
                    }

                    // 生成 JWT token
                    const token = jwt.sign(
                        { id: this.lastID, username },
                        JWT_SECRET,
                        { expiresIn: '24h' }
                    );

                    res.json({
                        token,
                        user: {
                            id: this.lastID,
                            username,
                            email
                        }
                    });
                }
            );
        });
    });
});

// 獲取個人資料
app.get('/api/users/profile', authenticateToken, (req, res) => {
    db.get(`
        SELECT id, username, email, bio, avatar
        FROM users
        WHERE id = ?
    `, [req.user.id], (err, user) => {
        if (err) {
            return res.status(500).json({ error: '獲取個人資料失敗' });
        }
        if (!user) {
            return res.status(404).json({ error: '用戶不存在' });
        }
        res.json(user);
    });
});

// 更新個人資料
app.put('/api/users/profile', authenticateToken, (req, res) => {
    const { username, email, bio } = req.body;

    // 驗證輸入
    if (!username || !email) {
        return res.status(400).json({ error: '用戶名和電子郵件為必填項' });
    }

    // 檢查用戶名是否已被其他用戶使用
    db.get('SELECT * FROM users WHERE username = ? AND id != ?', [username, req.user.id], (err, existingUser) => {
        if (err) {
            return res.status(500).json({ error: '資料庫錯誤' });
        }
        if (existingUser) {
            return res.status(400).json({ error: '用戶名已被使用' });
        }

        // 檢查電子郵件是否已被其他用戶使用
        db.get('SELECT * FROM users WHERE email = ? AND id != ?', [email, req.user.id], (err, existingUser) => {
            if (err) {
                return res.status(500).json({ error: '資料庫錯誤' });
            }
            if (existingUser) {
                return res.status(400).json({ error: '電子郵件已被使用' });
            }

            // 更新用戶資料
            db.run(
                'UPDATE users SET username = ?, email = ?, bio = ? WHERE id = ?',
                [username, email, bio, req.user.id],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: '更新個人資料失敗' });
                    }
                    res.json({ success: true });
                }
            );
        });
    });
});

// 用戶登入
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    // 驗證輸入
    if (!email || !password) {
        return res.status(400).json({ error: '請填寫所有必填欄位' });
    }

    // 查找用戶
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
            return res.status(500).json({ error: '資料庫錯誤' });
        }
        if (!user) {
            return res.status(401).json({ error: '電子郵件或密碼錯誤' });
        }

        // 驗證密碼
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: '電子郵件或密碼錯誤' });
        }

        // 生成 JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 返回用戶資訊（不包含密碼）
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            token,
            user: userWithoutPassword
        });
    });
});

// 用戶登出
app.post('/api/auth/logout', authenticateToken, (req, res) => {
    // 在實際應用中，你可能會想要：
    // 1. 將 token 加入黑名單
    // 2. 清除用戶的會話
    // 3. 記錄登出時間
    // 但在這個簡單的實現中，我們只需要返回成功訊息
    res.json({ success: true });
});

// 主頁路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 登入後的首頁路由
app.get('/home.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// 註冊頁面路由
app.get('/signup.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// 存儲測試頁面路由
app.get('/storage-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'storage-test.html'));
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
    console.log(`存儲測試頁面: http://localhost:${port}/storage-test`);
}); 