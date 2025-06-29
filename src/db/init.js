const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { initSampleData } = require('./sample')

const dbPath = path.join(__dirname, '../../database.sqlite');
console.log({dbPath})
const db = new sqlite3.Database(dbPath);

// 初始化資料庫表
db.serialize(() => {

    db.run(`
        create table if not exists db_version (
          version integer
        );
    `)

   

    let updates = []

    // 創建用戶表
    updates[0] = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            avatar TEXT,
            bio TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `

    // 創建貼文表
    updates[1] = `
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            image_url TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    `

    // 創建點讚表
    updates[2] = (`
        CREATE TABLE IF NOT EXISTS likes (
            user_id INTEGER NOT NULL,
            post_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, post_id),
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (post_id) REFERENCES posts (id)
        )
    `);

    // 創建評論表
    updates[3] = (`
        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            post_id INTEGER NOT NULL,
            parent_id INTEGER,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (post_id) REFERENCES posts (id),
            FOREIGN KEY (parent_id) REFERENCES comments (id)
        )
    `);

    // 創建關注表
    updates[4] = (`
        CREATE TABLE IF NOT EXISTS follows (
            follower_id INTEGER NOT NULL,
            followed_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (follower_id, followed_id),
            FOREIGN KEY (follower_id) REFERENCES users (id),
            FOREIGN KEY (followed_id) REFERENCES users (id)
        )
    `);

    // 創建社群表
    updates[5] = (`
        CREATE TABLE IF NOT EXISTS communities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            avatar TEXT,
            cover_image TEXT,
            created_by INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users (id)
        )
    `);

    // 創建社群成員表
    updates[6] = (`
        CREATE TABLE IF NOT EXISTS community_members (
            community_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            role TEXT NOT NULL DEFAULT 'member',
            joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (community_id, user_id),
            FOREIGN KEY (community_id) REFERENCES communities (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    `);

    // 創建社群貼文表
    updates[7] = (`
        CREATE TABLE IF NOT EXISTS community_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            community_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            media TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (community_id) REFERENCES communities (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    `);

    // 創建聊天室表
    updates[8] = (`
        CREATE TABLE IF NOT EXISTS chat_rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            type TEXT NOT NULL DEFAULT 'private',
            created_by INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users (id)
        )
    `);

    // 創建聊天室成員表
    updates[9] = (`
        CREATE TABLE IF NOT EXISTS chat_room_members (
            room_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (room_id, user_id),
            FOREIGN KEY (room_id) REFERENCES chat_rooms (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    `);

    // 創建聊天訊息表
    updates[10] = (`
        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (room_id) REFERENCES chat_rooms (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    `);

    // AI 推薦系統相關資料表
    
    // 用戶行為追蹤表
    updates[11] = (`
        CREATE TABLE IF NOT EXISTS user_behaviors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            post_id INTEGER NOT NULL,
            behavior_type TEXT NOT NULL, -- 'view', 'like', 'comment', 'share', 'save'
            duration INTEGER DEFAULT 0, -- 瀏覽時長（秒）
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (post_id) REFERENCES posts (id)
        )
    `);

    // 內容標籤表
    updates[12] = (`
        CREATE TABLE IF NOT EXISTS content_tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER NOT NULL,
            tag_name TEXT NOT NULL,
            confidence_score REAL DEFAULT 1.0, -- AI 標籤置信度
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (post_id) REFERENCES posts (id)
        )
    `);

    // 用戶興趣標籤表
    updates[13] = (`
        CREATE TABLE IF NOT EXISTS user_interests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            tag_name TEXT NOT NULL,
            interest_score REAL DEFAULT 0.0, -- 興趣分數 (0-1)
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    `);

    // 推薦結果表
    updates[14] = (`
        CREATE TABLE IF NOT EXISTS recommendations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            post_id INTEGER NOT NULL,
            recommendation_score REAL NOT NULL, -- 推薦分數
            algorithm_type TEXT NOT NULL, -- 'collaborative', 'content_based', 'hybrid'
            reason TEXT, -- 推薦原因
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (post_id) REFERENCES posts (id)
        )
    `);

    // 用戶相似度表
    updates[15] = (`
        CREATE TABLE IF NOT EXISTS user_similarities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id_1 INTEGER NOT NULL,
            user_id_2 INTEGER NOT NULL,
            similarity_score REAL NOT NULL, -- 相似度分數 (0-1)
            last_calculated DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id_1) REFERENCES users (id),
            FOREIGN KEY (user_id_2) REFERENCES users (id)
        )
    `);

    // 為現有貼文添加 AI 分析欄位
    updates[16] = (`
        ALTER TABLE posts ADD COLUMN ai_category TEXT DEFAULT NULL
    `);

    updates[17] = (`
        ALTER TABLE posts ADD COLUMN ai_sentiment REAL DEFAULT NULL
    `);

    updates[18] = (`
        ALTER TABLE posts ADD COLUMN ai_engagement_score REAL DEFAULT 0.0
    `);

    db.get('select * from db_version', (err, row)=>{
        let version
        if (!row){
            db.run('insert into db_version (version) values (0)')
            version = 0
        } else {
            version = row.version
        }
        function upgrade() {
            if (!(version in updates)) {
                console.log('[database] already upgraded to latest version')
                return
            }
            console.log('[database] upgrade from version:', version)
            let sql = updates[version]
            db.run(sql, err => {
                if (err){
                    console.log('failed to update database', {version, sql, err})
                } else {
                    version++
                    upgrade()
                }
            })
        }
        upgrade()
    })

    // 初始化範例資料
    initSampleData(db);
});

module.exports = db; 