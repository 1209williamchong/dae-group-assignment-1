const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// 資料庫文件路徑
const dbPath = path.join(__dirname, '../../database.sqlite');

// 確保資料庫目錄存在
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// 創建資料庫連接
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('無法連接資料庫:', err);
        return;
    }
    console.log('成功連接 SQLite 資料庫');
    
    // 啟用外鍵約束
    db.run('PRAGMA foreign_keys = ON');
    
    // 初始化資料表
    initDatabase();
});

// 初始化資料表
function initDatabase() {
    // 用戶表
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        avatar TEXT,
        bio TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('創建用戶表失敗:', err);
            return;
        }
        console.log('用戶表創建成功');
        
        // 創建測試用戶
        createTestUser();
    });

    // 貼文表
    db.run(`CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`, (err) => {
        if (err) {
            console.error('創建貼文表失敗:', err);
            return;
        }
        console.log('貼文表創建成功');
    });

    // 按讚表
    db.run(`CREATE TABLE IF NOT EXISTS likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        post_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (post_id) REFERENCES posts(id),
        UNIQUE(user_id, post_id)
    )`, (err) => {
        if (err) {
            console.error('創建按讚表失敗:', err);
            return;
        }
        console.log('按讚表創建成功');
    });

    // 留言表
    db.run(`CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        post_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (post_id) REFERENCES posts(id)
    )`, (err) => {
        if (err) {
            console.error('創建留言表失敗:', err);
            return;
        }
        console.log('留言表創建成功');
    });

    // 書籤表
    db.run(`CREATE TABLE IF NOT EXISTS bookmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        post_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (post_id) REFERENCES posts(id),
        UNIQUE(user_id, post_id)
    )`, (err) => {
        if (err) {
            console.error('創建書籤表失敗:', err);
            return;
        }
        console.log('書籤表創建成功');
    });

    // 關注表
    db.run(`CREATE TABLE IF NOT EXISTS follows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        follower_id INTEGER NOT NULL,
        followed_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (follower_id) REFERENCES users(id),
        FOREIGN KEY (followed_id) REFERENCES users(id),
        UNIQUE(follower_id, followed_id)
    )`, (err) => {
        if (err) {
            console.error('創建關注表失敗:', err);
            return;
        }
        console.log('關注表創建成功');
    });
}

// 創建測試用戶
function createTestUser() {
    const testUser = {
        username: 'test',
        email: 'test@example.com',
        password: 'password123'
    };

    // 檢查測試用戶是否存在
    db.get('SELECT id FROM users WHERE username = ?', [testUser.username], (err, row) => {
        if (err) {
            console.error('檢查測試用戶失敗:', err);
            return;
        }

        if (!row) {
            // 加密密碼
            bcrypt.hash(testUser.password, 10, (err, hash) => {
                if (err) {
                    console.error('加密密碼失敗:', err);
                    return;
                }

                // 插入測試用戶
                db.run(
                    'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                    [testUser.username, testUser.email, hash],
                    (err) => {
                        if (err) {
                            console.error('創建測試用戶失敗:', err);
                            return;
                        }
                        console.log('測試用戶創建成功');
                    }
                );
            });
        } else {
            console.log('測試用戶已存在');
        }
    });
}

// 導出資料庫連接
module.exports = db; 