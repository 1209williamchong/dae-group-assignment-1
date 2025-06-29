const express = require('express');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const {db,database_init_promise} = require('./src/db/init');
const AISystem = require('./src/ai');


// 嘗試引入 image-dataset，如果失敗則使用模擬版本
// let ImageDataset;
// try {
//     ImageDataset = require('image-dataset');
//     console.log('✅ image-dataset 載入成功');
// } catch (error) {
//     console.log('⚠️ image-dataset 載入失敗，使用模擬版本');
//     // 模擬 ImageDataset 類別
//     ImageDataset = {
//         Classifier: {
//             loadOrCreate: async (modelPath) => {
//                 return {
//                     predict: async (imagePath) => {
//                         // 模擬分類結果
//                         const categories = ['pet', 'food', 'travel', 'selfie'];
//                         const randomScores = categories.map(cat => ({
//                             category: cat,
//                             confidence: Math.random()
//                         }));
//                         return randomScores.sort((a, b) => b.confidence - a.confidence);
//                     }
//                 };
//             }
//         }
//     };
// }

const app = express();
const port = 3000;
const JWT_SECRET = 'your-secret-key'; // 在生產環境中應該使用環境變數

// 初始化 AI 系統
const aiSystem = new AISystem();

// 配置 multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.fieldname + path.extname(file.originalname) );
    }
});

const upload = multer({ storage: storage });

// 啟用 CORS
app.use(cors());

// 解析 JSON 和 URL-encoded 請求體
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// 發布新貼文
app.post('/api/posts', authenticateToken, upload.single('media'), async (req, res) => {
    const { content, media, youtube_url } = req.body;
    let image_url = req.file ? `/uploads/${req.file.filename}` : null;

    if (!content) {
        return res.status(400).json({ error: '貼文內容不能為空' });
    }

    let food = 0.5

    db.run(
        'INSERT INTO posts (user_id, content, image_url, food) VALUES (?, ?, ?, ?)',
        [req.user.id, content, image_url, food],
        async function(err) {
            if (err) {
                return res.status(500).json({ error: '發布貼文失敗' });
            }
            
            const postId = this.lastID;
            
            // AI 分析新貼文內容
            try {
                const analysis = await aiSystem.processNewPost(postId, content);
                console.log('AI 分析結果:', analysis);
            } catch (error) {
                console.error('AI 分析失敗:', error);
            }
            
            res.json({
                id: postId,
                user_id: req.user.id,
                content,
                media,
                youtube_url,
                created_at: new Date().toISOString()
            });
        }
    );
});

// 獲取所有貼文
app.get('/api/posts', (req, res) => {
    db.all(/* sql */`
      select
        users.username as user
      , users.avatar
      , posts.created_at as time
      , posts.content as text
      , posts.image_url as media
      , 'image' as mediaType
      from posts
      inner join users on posts.user_id = users.id
      order by posts.created_at desc
    `, (err, posts) => {
        if (err) {
            return res.status(500).json({ error: '獲取貼文失敗' });
        }
        res.json({posts});
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

// 點讚貼文
app.post('/api/posts/:postId/like', authenticateToken, async (req, res) => {
    const { postId } = req.params;
    
    db.run(
        'INSERT OR REPLACE INTO likes (user_id, post_id) VALUES (?, ?)',
        [req.user.id, postId],
        async function(err) {
            if (err) {
                return res.status(500).json({ error: '點讚失敗' });
            }
            
            // AI 處理用戶行為
            try {
                await aiSystem.processUserBehavior(req.user.id, postId, 'like');
            } catch (error) {
                console.error('AI 行為處理失敗:', error);
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

// 註冊新用戶
app.post('/api/auth/register', upload.single('avatar'), async (req, res) => {
    console.log('收到註冊請求:', req.body); // 添加日誌
    const { username, email, password, bio } = req.body;
    const avatar = req.file ? `/uploads/${req.file.filename}` : null;

    // 驗證輸入
    if (!username || !email || !password) {
        console.log('缺少必填欄位:', { username, email, password }); // 添加日誌
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
                'INSERT INTO users (username, email, password, avatar, bio) VALUES (?, ?, ?, ?, ?)',
                [username, email, hashedPassword, avatar, bio],
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
                            email,
                            avatar,
                            bio
                        }
                    });
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

app.get('/api/auth/profile', authenticateToken, (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: '未授權' });
    }
    let user_id = req.user.id;
    // 從資料庫中獲取用戶資料
    db.get('SELECT username, email, avatar, bio FROM users WHERE id = ?', [user_id], (err, profile) => {
        if (err) {
            return res.status(500).json({ error: '資料庫錯誤' });
        }
        res.json({ profile });
    });
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

// 編輯貼文
app.put('/api/posts/:postId', authenticateToken, (req, res) => {
    const { postId } = req.params;
    const { content, media, youtube_url, visibility } = req.body;

    // 檢查貼文是否存在且屬於當前用戶
    db.get('SELECT * FROM posts WHERE id = ? AND user_id = ?', [postId, req.user.id], (err, post) => {
        if (err) {
            return res.status(500).json({ error: '資料庫錯誤' });
        }
        if (!post) {
            return res.status(404).json({ error: '貼文不存在或無權限編輯' });
        }

        // 更新貼文
        db.run(
            'UPDATE posts SET content = ?, media = ?, youtube_url = ?, visibility = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [content, media, youtube_url, visibility, postId],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: '更新貼文失敗' });
                }
                res.json({
                    id: postId,
                    content,
                    media,
                    youtube_url,
                    visibility,
                    updated_at: new Date().toISOString()
                });
            }
        );
    });
});

// 刪除貼文
app.delete('/api/posts/:postId', authenticateToken, (req, res) => {
    const { postId } = req.params;

    // 檢查貼文是否存在且屬於當前用戶
    db.get('SELECT * FROM posts WHERE id = ? AND user_id = ?', [postId, req.user.id], (err, post) => {
        if (err) {
            return res.status(500).json({ error: '資料庫錯誤' });
        }
        if (!post) {
            return res.status(404).json({ error: '貼文不存在或無權限刪除' });
        }

        // 刪除貼文相關的數據（點讚、評論等）
        db.serialize(() => {
            db.run('BEGIN TRANSACTION');
            
            // 刪除點讚
            db.run('DELETE FROM likes WHERE post_id = ?', [postId]);
            
            // 刪除評論
            db.run('DELETE FROM comments WHERE post_id = ?', [postId]);
            
            // 刪除書籤
            db.run('DELETE FROM bookmarks WHERE post_id = ?', [postId]);
            
            // 刪除貼文
            db.run('DELETE FROM posts WHERE id = ?', [postId], function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: '刪除貼文失敗' });
                }
                
                db.run('COMMIT');
                res.json({ success: true });
            });
        });
    });
});

// 更新貼文權限
app.patch('/api/posts/:postId/visibility', authenticateToken, (req, res) => {
    const { postId } = req.params;
    const { visibility } = req.body;

    // 檢查貼文是否存在且屬於當前用戶
    db.get('SELECT * FROM posts WHERE id = ? AND user_id = ?', [postId, req.user.id], (err, post) => {
        if (err) {
            return res.status(500).json({ error: '資料庫錯誤' });
        }
        if (!post) {
            return res.status(404).json({ error: '貼文不存在或無權限修改' });
        }

        // 更新貼文權限
        db.run(
            'UPDATE posts SET visibility = ? WHERE id = ?',
            [visibility, postId],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: '更新貼文權限失敗' });
                }
                res.json({
                    id: postId,
                    visibility,
                    updated_at: new Date().toISOString()
                });
            }
        );
    });
});

// 獲取貼文的點讚用戶列表
app.get('/api/posts/:postId/likes', (req, res) => {
    const { postId } = req.params;
    
    db.all(`
        SELECT u.id, u.username, u.avatar
        FROM likes l
        JOIN users u ON l.user_id = u.id
        WHERE l.post_id = ?
        ORDER BY l.created_at DESC
    `, [postId], (err, likes) => {
        if (err) {
            return res.status(500).json({ error: '獲取點讚用戶失敗' });
        }
        res.json(likes);
    });
});

// 創建社群
app.post('/api/communities', authenticateToken, upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'cover_image', maxCount: 1 }
]), (req, res) => {
    const { name, description } = req.body;
    const avatar = req.files.avatar ? `/uploads/${req.files.avatar[0].filename}` : null;
    const cover_image = req.files.cover_image ? `/uploads/${req.files.cover_image[0].filename}` : null;

    if (!name) {
        return res.status(400).json({ error: '社群名稱不能為空' });
    }

    db.run(
        'INSERT INTO communities (name, description, avatar, cover_image, created_by) VALUES (?, ?, ?, ?, ?)',
        [name, description, avatar, cover_image, req.user.id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: '創建社群失敗' });
            }

            // 將創建者設為管理員
            db.run(
                'INSERT INTO community_members (community_id, user_id, role) VALUES (?, ?, ?)',
                [this.lastID, req.user.id, 'admin'],
                (err) => {
                    if (err) {
                        return res.status(500).json({ error: '設置管理員失敗' });
                    }
                    res.json({
                        id: this.lastID,
                        name,
                        description,
                        avatar,
                        cover_image,
                        created_by: req.user.id
                    });
                }
            );
        }
    );
});

// 獲取社群列表
app.get('/api/communities', (req, res) => {
    db.all(`
        SELECT c.*, u.username as creator_name,
        (SELECT COUNT(*) FROM community_members WHERE community_id = c.id) as member_count
        FROM communities c
        JOIN users u ON c.created_by = u.id
        ORDER BY c.created_at DESC
    `, (err, communities) => {
        if (err) {
            return res.status(500).json({ error: '獲取社群列表失敗' });
        }
        res.json(communities);
    });
});

// 獲取社群詳情
app.get('/api/communities/:communityId', (req, res) => {
    const { communityId } = req.params;
    
    db.get(`
        SELECT c.*, u.username as creator_name,
        (SELECT COUNT(*) FROM community_members WHERE community_id = c.id) as member_count
        FROM communities c
        JOIN users u ON c.created_by = u.id
        WHERE c.id = ?
    `, [communityId], (err, community) => {
        if (err) {
            return res.status(500).json({ error: '獲取社群詳情失敗' });
        }
        if (!community) {
            return res.status(404).json({ error: '社群不存在' });
        }
        res.json(community);
    });
});

// 加入社群
app.post('/api/communities/:communityId/join', authenticateToken, (req, res) => {
    const { communityId } = req.params;
    
    db.run(
        'INSERT OR IGNORE INTO community_members (community_id, user_id) VALUES (?, ?)',
        [communityId, req.user.id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: '加入社群失敗' });
            }
            res.json({ success: true });
        }
    );
});

// 退出社群
app.delete('/api/communities/:communityId/leave', authenticateToken, (req, res) => {
    const { communityId } = req.params;
    
    db.run(
        'DELETE FROM community_members WHERE community_id = ? AND user_id = ?',
        [communityId, req.user.id],
        function(err) {
            if (err) {
                return res.status(500).json({ error: '退出社群失敗' });
            }
            res.json({ success: true });
        }
    );
});

// 獲取社群成員列表
app.get('/api/communities/:communityId/members', (req, res) => {
    const { communityId } = req.params;
    
    db.all(`
        SELECT u.id, u.username, u.avatar, cm.role, cm.joined_at
        FROM community_members cm
        JOIN users u ON cm.user_id = u.id
        WHERE cm.community_id = ?
        ORDER BY cm.role DESC, cm.joined_at ASC
    `, [communityId], (err, members) => {
        if (err) {
            return res.status(500).json({ error: '獲取成員列表失敗' });
        }
        res.json(members);
    });
});

// 發布社群貼文
app.post('/api/communities/:communityId/posts', authenticateToken, upload.single('media'), (req, res) => {
    const { communityId } = req.params;
    const { content } = req.body;
    const media = req.file ? `/uploads/${req.file.filename}` : null;

    if (!content) {
        return res.status(400).json({ error: '貼文內容不能為空' });
    }

    // 檢查是否為社群成員
    db.get(
        'SELECT * FROM community_members WHERE community_id = ? AND user_id = ?',
        [communityId, req.user.id],
        (err, member) => {
            if (err) {
                return res.status(500).json({ error: '資料庫錯誤' });
            }
            if (!member) {
                return res.status(403).json({ error: '只有社群成員才能發布貼文' });
            }

            db.run(
                'INSERT INTO community_posts (community_id, user_id, content, media) VALUES (?, ?, ?, ?)',
                [communityId, req.user.id, content, media],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: '發布貼文失敗' });
                    }
                    res.json({
                        id: this.lastID,
                        community_id: communityId,
                        user_id: req.user.id,
                        content,
                        media,
                        created_at: new Date().toISOString()
                    });
                }
            );
        }
    );
});

// 獲取社群貼文列表
app.get('/api/communities/:communityId/posts', (req, res) => {
    const { communityId } = req.params;
    
    db.all(`
        SELECT cp.*, u.username, u.avatar,
        (SELECT COUNT(*) FROM likes WHERE post_id = cp.id) as likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = cp.id) as comments_count
        FROM community_posts cp
        JOIN users u ON cp.user_id = u.id
        WHERE cp.community_id = ?
        ORDER BY cp.created_at DESC
    `, [communityId], (err, posts) => {
        if (err) {
            return res.status(500).json({ error: '獲取社群貼文失敗' });
        }
        res.json(posts);
    });
});

// 更新社群設定
app.put('/api/communities/:communityId', authenticateToken, upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'cover_image', maxCount: 1 }
]), (req, res) => {
    const { communityId } = req.params;
    const { name, description } = req.body;
    const avatar = req.files.avatar ? `/uploads/${req.files.avatar[0].filename}` : null;
    const cover_image = req.files.cover_image ? `/uploads/${req.files.cover_image[0].filename}` : null;

    // 檢查是否為社群管理員
    db.get(
        'SELECT * FROM community_members WHERE community_id = ? AND user_id = ? AND role = "admin"',
        [communityId, req.user.id],
        (err, admin) => {
            if (err) {
                return res.status(500).json({ error: '資料庫錯誤' });
            }
            if (!admin) {
                return res.status(403).json({ error: '只有管理員才能修改社群設定' });
            }

            const updates = [];
            const params = [];
            if (name) {
                updates.push('name = ?');
                params.push(name);
            }
            if (description) {
                updates.push('description = ?');
                params.push(description);
            }
            if (avatar) {
                updates.push('avatar = ?');
                params.push(avatar);
            }
            if (cover_image) {
                updates.push('cover_image = ?');
                params.push(cover_image);
            }

            if (updates.length === 0) {
                return res.status(400).json({ error: '沒有提供要更新的內容' });
            }

            params.push(communityId);
            db.run(
                `UPDATE communities SET ${updates.join(', ')} WHERE id = ?`,
                params,
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: '更新社群設定失敗' });
                    }
                    res.json({ success: true });
                }
            );
        }
    );
});

// 創建聊天室
app.post('/api/chat/rooms', authenticateToken, (req, res) => {
    const { name, type, members } = req.body;
    
    if (!members || !Array.isArray(members) || members.length === 0) {
        return res.status(400).json({ error: '必須指定聊天室成員' });
    }

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // 創建聊天室
        db.run(
            'INSERT INTO chat_rooms (name, type, created_by) VALUES (?, ?, ?)',
            [name, type || 'private', req.user.id],
            function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: '創建聊天室失敗' });
                }

                const roomId = this.lastID;
                const allMembers = [...new Set([...members, req.user.id])];

                // 添加成員
                const stmt = db.prepare('INSERT INTO chat_room_members (room_id, user_id) VALUES (?, ?)');
                allMembers.forEach(userId => {
                    stmt.run([roomId, userId]);
                });
                stmt.finalize();

                db.run('COMMIT');
                res.json({
                    id: roomId,
                    name,
                    type,
                    created_by: req.user.id,
                    members: allMembers
                });
            }
        );
    });
});

// 獲取用戶的聊天室列表
app.get('/api/chat/rooms', authenticateToken, (req, res) => {
    db.all(`
        SELECT cr.*, 
        (SELECT COUNT(*) FROM chat_room_members WHERE room_id = cr.id) as member_count,
        (SELECT content FROM chat_messages WHERE room_id = cr.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM chat_messages WHERE room_id = cr.id ORDER BY created_at DESC LIMIT 1) as last_message_time
        FROM chat_rooms cr
        JOIN chat_room_members crm ON cr.id = crm.room_id
        WHERE crm.user_id = ?
        ORDER BY last_message_time DESC
    `, [req.user.id], (err, rooms) => {
        if (err) {
            return res.status(500).json({ error: '獲取聊天室列表失敗' });
        }
        res.json(rooms);
    });
});

// 獲取聊天室成員
app.get('/api/chat/rooms/:roomId/members', authenticateToken, (req, res) => {
    const { roomId } = req.params;
    
    db.all(`
        SELECT u.id, u.username, u.avatar
        FROM chat_room_members crm
        JOIN users u ON crm.user_id = u.id
        WHERE crm.room_id = ?
    `, [roomId], (err, members) => {
        if (err) {
            return res.status(500).json({ error: '獲取聊天室成員失敗' });
        }
        res.json(members);
    });
});

// 獲取聊天室訊息
app.get('/api/chat/rooms/:roomId/messages', authenticateToken, (req, res) => {
    const { roomId } = req.params;
    const { before } = req.query;
    
    let query = `
        SELECT cm.*, u.username, u.avatar
        FROM chat_messages cm
        JOIN users u ON cm.user_id = u.id
        WHERE cm.room_id = ?
    `;
    
    const params = [roomId];
    if (before) {
        query += ' AND cm.created_at < ?';
        params.push(before);
    }
    
    query += ' ORDER BY cm.created_at DESC LIMIT 50';
    
    db.all(query, params, (err, messages) => {
        if (err) {
            return res.status(500).json({ error: '獲取聊天訊息失敗' });
        }
        res.json(messages.reverse());
    });
});

// 發送聊天訊息
app.post('/api/chat/rooms/:roomId/messages', authenticateToken, (req, res) => {
    const { roomId } = req.params;
    const { content } = req.body;
    
    if (!content) {
        return res.status(400).json({ error: '訊息內容不能為空' });
    }

    // 檢查是否為聊天室成員
    db.get(
        'SELECT * FROM chat_room_members WHERE room_id = ? AND user_id = ?',
        [roomId, req.user.id],
        (err, member) => {
            if (err) {
                return res.status(500).json({ error: '資料庫錯誤' });
            }
            if (!member) {
                return res.status(403).json({ error: '您不是此聊天室的成員' });
            }

            db.run(
                'INSERT INTO chat_messages (room_id, user_id, content) VALUES (?, ?, ?)',
                [roomId, req.user.id, content],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: '發送訊息失敗' });
                    }

                    // 獲取新訊息的完整資訊
                    db.get(`
                        SELECT cm.*, u.username, u.avatar
                        FROM chat_messages cm
                        JOIN users u ON cm.user_id = u.id
                        WHERE cm.id = ?
                    `, [this.lastID], (err, message) => {
                        if (err) {
                            return res.status(500).json({ error: '獲取訊息詳情失敗' });
                        }
                        res.json(message);
                    });
                }
            );
        }
    );
});

// 添加聊天室成員
app.post('/api/chat/rooms/:roomId/members', authenticateToken, (req, res) => {
    const { roomId } = req.params;
    const { userId } = req.body;

    // 檢查是否為聊天室管理員
    db.get(
        'SELECT * FROM chat_rooms WHERE id = ? AND created_by = ?',
        [roomId, req.user.id],
        (err, room) => {
            if (err) {
                return res.status(500).json({ error: '資料庫錯誤' });
            }
            if (!room) {
                return res.status(403).json({ error: '只有管理員才能添加成員' });
            }

            db.run(
                'INSERT OR IGNORE INTO chat_room_members (room_id, user_id) VALUES (?, ?)',
                [roomId, userId],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: '添加成員失敗' });
                    }
                    res.json({ success: true });
                }
            );
        }
    );
});

// 移除聊天室成員
app.delete('/api/chat/rooms/:roomId/members/:userId', authenticateToken, (req, res) => {
    const { roomId, userId } = req.params;

    // 檢查是否為聊天室管理員
    db.get(
        'SELECT * FROM chat_rooms WHERE id = ? AND created_by = ?',
        [roomId, req.user.id],
        (err, room) => {
            if (err) {
                return res.status(500).json({ error: '資料庫錯誤' });
            }
            if (!room) {
                return res.status(403).json({ error: '只有管理員才能移除成員' });
            }

            db.run(
                'DELETE FROM chat_room_members WHERE room_id = ? AND user_id = ?',
                [roomId, userId],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: '移除成員失敗' });
                    }
                    res.json({ success: true });
                }
            );
        }
    );
});

// 聊天室頁面路由
app.get('/chat.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// 推薦頁面路由
app.get('/recommendations.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'recommendations.html'));
});

// Community Routes
app.get('/api/community/suggestions', 
    // authenticateToken,
     (req, res) => {
        let user_id = req.user ? req.user.id : null;
        // user_id = 4
    db.all(`
        select
          id
        , username as name
        from users
    `, [], (err, suggestions) => {
        if (err) {
            console.error('獲取社群建議失敗:', err);
            return res.status(500).json({ error: '獲取社群建議失敗' });
        }
        if(user_id){
            suggestions = suggestions.filter(suggestion => suggestion.id !== user_id);
        }
        res.json(suggestions);
    });
    // res.json([{id:1,name:'Alice Wong'},{id:2,name:'Bob Lee'},{id:3,name:'Charlie Chen'}]);
});

// 獲取食物推薦貼文
app.get('/api/recommendations/food', authenticateToken, (req, res) => {
    const { limit = 10 } = req.query;
    
    // 基於用戶的歷史行為和AI分類結果推薦食物相關貼文
    db.all(`
        SELECT 
            p.id,
            p.content,
            p.image_url,
            p.food,
            p.created_at,
            u.username,
            u.avatar,
            (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
            (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.food > 0.7  -- 高食物相關性的貼文
        AND p.user_id != ?  -- 排除自己的貼文
        ORDER BY p.food DESC, p.created_at DESC
        LIMIT ?
    `, [req.user.id, parseInt(limit)], (err, recommendations) => {
        if (err) {
            console.error('獲取食物推薦失敗:', err);
            return res.status(500).json({ error: '獲取推薦失敗' });
        }
        res.json(recommendations);
    });
});

// 獲取個性化推薦貼文
app.get('/api/recommendations/personalized', authenticateToken, (req, res) => {
    const { limit = 10 } = req.query;
    
    // 基於用戶關注的人和點讚歷史進行推薦
    db.all(`
        SELECT 
            p.id,
            p.content,
            p.image_url,
            p.food,
            p.created_at,
            u.username,
            u.avatar,
            (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
            (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
            CASE 
                WHEN f.follower_id IS NOT NULL THEN 1 
                ELSE 0 
            END as is_following
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN follows f ON f.follower_id = ? AND f.followed_id = p.user_id
        WHERE p.user_id != ?
        ORDER BY 
            is_following DESC,
            p.food DESC,
            likes_count DESC,
            p.created_at DESC
        LIMIT ?
    `, [req.user.id, req.user.id, parseInt(limit)], (err, recommendations) => {
        if (err) {
            console.error('獲取個性化推薦失敗:', err);
            return res.status(500).json({ error: '獲取推薦失敗' });
        }
        res.json(recommendations);
    });
});

// 獲取熱門推薦貼文
app.get('/api/recommendations/popular', (req, res) => {
    const { limit = 10 } = req.query;
    
    // 基於點讚數和評論數推薦熱門貼文
    db.all(`
        SELECT 
            p.id,
            p.content,
            p.image_url,
            p.food,
            p.created_at,
            u.username,
            u.avatar,
            (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
            (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
        FROM posts p
        JOIN users u ON p.user_id = u.id
        ORDER BY 
            likes_count DESC,
            comments_count DESC,
            p.created_at DESC
        LIMIT ?
    `, [parseInt(limit)], (err, recommendations) => {
        if (err) {
            console.error('獲取熱門推薦失敗:', err);
            return res.status(500).json({ error: '獲取推薦失敗' });
        }
        res.json(recommendations);
    });
});

// AI 圖片分類 API
app.post('/api/classify-image', authenticateToken, upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: '請上傳圖片' });
    }
    try {
        // 取得圖片路徑
        const imagePath = path.join(__dirname, 'public', 'uploads', req.file.filename);
        // 載入模型（假設已經訓練好模型，這裡用預設）
        // 你可以根據實際需求更改模型路徑
        const classifier = await ImageDataset.Classifier.loadOrCreate('saved_models/classifier_model');
        // 執行分類
        const result = await classifier.predict(imagePath);
        res.json({
            filename: req.file.filename,
            result
        });
    } catch (err) {
        console.error('圖片分類失敗:', err);
        res.status(500).json({ error: '圖片分類失敗' });
    }
});

// 獲取用戶貼文歷史（用於分析興趣）
app.get('/api/posts/user/:userId', authenticateToken, (req, res) => {
    const { userId } = req.params;
    const limit = req.query.limit || 25;
    
    db.all(
        'SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
        [userId, limit],
        (err, posts) => {
            if (err) {
                return res.status(500).json({ error: '獲取用戶貼文失敗' });
            }
            res.json(posts);
        }
    );
});

// 計算用戶興趣偏好
app.get('/api/users/:userId/preferences', authenticateToken, (req, res) => {
    const { userId } = req.params;
    
    db.get(
        'SELECT AVG(pet) as pet, AVG(food) as food, AVG(travel) as travel, AVG(selfie) as selfie FROM posts WHERE user_id = ?',
        [userId],
        (err, preferences) => {
            if (err) {
                return res.status(500).json({ error: '計算興趣偏好失敗' });
            }
            res.json(preferences);
        }
    );
});

// 獲取高食物相關度的其他用戶貼文
app.get('/api/posts/food-recommendations', authenticateToken, (req, res) => {
    db.all(
        'SELECT * FROM posts WHERE user_id != ? AND food > 0.5 ORDER BY food DESC LIMIT 10',
        [req.user.id],
        (err, posts) => {
            if (err) {
                return res.status(500).json({ error: '獲取食物推薦失敗' });
            }
            res.json(posts);
        }
    );
});

// 基於興趣偏好的推薦系統
app.get('/api/posts/recommendations', authenticateToken, (req, res) => {
    const { petWeight = 0.31, foodWeight = 0.32, travelWeight = 0.28, selfieWeight = 0.1 } = req.query;
    
    db.all(
        `SELECT 
            *,
            (pet * ? + food * ? + travel * ? + selfie * ?) as score
        FROM posts 
        WHERE user_id != ? 
        ORDER BY score DESC 
        LIMIT 10`,
        [petWeight, foodWeight, travelWeight, selfieWeight, req.user.id],
        (err, posts) => {
            if (err) {
                return res.status(500).json({ error: '獲取推薦失敗' });
            }
            res.json(posts);
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
app.listen(port, async () => {
    console.log(`伺服器運行在 http://localhost:${port}`);
    console.log(`存儲測試頁面: http://localhost:${port}/storage-test`);
    
    // 啟動時初始化 AI 系統
    try {
        await database_init_promise;
        await aiSystem.initialize();
        console.log('AI 系統初始化完成');
    } catch (error) {
        console.error('AI 系統初始化失敗:', error);
    }
}); 