const db = require('../db/init');

class ContentAnalysis {
    constructor() {
        // 預定義的內容類別和關鍵字
        this.categories = {
            'food': ['美食', '料理', '餐廳', '咖啡', '甜點', '飲料', '廚藝', '食譜'],
            'travel': ['旅遊', '旅行', '景點', '風景', '度假', '背包', '攝影', '文化'],
            'fashion': ['時尚', '穿搭', '服裝', '美妝', '造型', '風格', '設計', '品牌'],
            'art': ['藝術', '繪畫', '設計', '創作', '展覽', '畫作', '手工', '創意'],
            'technology': ['科技', '程式', '開發', '創新', '數位', '軟體', '硬體', 'AI'],
            'lifestyle': ['生活', '日常', '健康', '運動', '休閒', '興趣', '嗜好', '心情'],
            'business': ['商業', '工作', '職場', '創業', '投資', '經濟', '管理', '行銷']
        };

        // 情感分析關鍵字
        this.sentimentKeywords = {
            positive: ['開心', '快樂', '美好', '讚', '棒', '喜歡', '愛', '精彩', '完美', '感動'],
            negative: ['難過', '傷心', '失望', '討厭', '糟糕', '痛苦', '煩惱', '生氣', '無聊', '討厭'],
            neutral: ['一般', '普通', '還好', '正常', '平常', '標準', '基本', '簡單', '一般般']
        };
    }

    // 分析貼文內容並生成標籤
    async analyzePostContent(postId, content) {
        try {
            const tags = this.extractTags(content);
            const category = this.categorizeContent(content);
            const sentiment = this.analyzeSentiment(content);
            const engagementScore = this.calculateEngagementScore(content);

            // 存儲標籤
            await this.storeTags(postId, tags);
            
            // 更新貼文的 AI 分析結果
            await this.updatePostAnalysis(postId, category, sentiment, engagementScore);

            return {
                tags,
                category,
                sentiment,
                engagementScore
            };
        } catch (error) {
            console.error('內容分析失敗:', error);
            return null;
        }
    }

    // 提取標籤
    extractTags(content) {
        const tags = new Set();
        const words = content.toLowerCase().split(/[\s,，。！？；：""''（）【】]/);
        
        // 檢查每個類別的關鍵字
        for (const [category, keywords] of Object.entries(this.categories)) {
            for (const keyword of keywords) {
                if (content.includes(keyword)) {
                    tags.add(keyword);
                    tags.add(category);
                }
            }
        }

        // 提取 hashtag
        const hashtags = content.match(/#[\u4e00-\u9fa5a-zA-Z0-9]+/g) || [];
        hashtags.forEach(tag => tags.add(tag.slice(1)));

        return Array.from(tags);
    }

    // 分類內容
    categorizeContent(content) {
        const scores = {};
        
        for (const [category, keywords] of Object.entries(this.categories)) {
            scores[category] = 0;
            for (const keyword of keywords) {
                if (content.includes(keyword)) {
                    scores[category]++;
                }
            }
        }

        // 找到最高分的類別
        const maxScore = Math.max(...Object.values(scores));
        const categories = Object.keys(scores).filter(cat => scores[cat] === maxScore);
        
        return maxScore > 0 ? categories[0] : 'general';
    }

    // 情感分析
    analyzeSentiment(content) {
        let positiveScore = 0;
        let negativeScore = 0;
        let neutralScore = 0;

        // 計算各類情感關鍵字出現次數
        for (const word of this.sentimentKeywords.positive) {
            const matches = (content.match(new RegExp(word, 'g')) || []).length;
            positiveScore += matches;
        }

        for (const word of this.sentimentKeywords.negative) {
            const matches = (content.match(new RegExp(word, 'g')) || []).length;
            negativeScore += matches;
        }

        for (const word of this.sentimentKeywords.neutral) {
            const matches = (content.match(new RegExp(word, 'g')) || []).length;
            neutralScore += matches;
        }

        // 計算情感分數 (-1 到 1)
        const total = positiveScore + negativeScore + neutralScore;
        if (total === 0) return 0;

        return (positiveScore - negativeScore) / total;
    }

    // 計算參與度分數
    calculateEngagementScore(content) {
        let score = 0.5; // 基礎分數

        // 內容長度影響
        const length = content.length;
        if (length > 100) score += 0.2;
        if (length > 200) score += 0.1;

        // 包含表情符號
        const emojiCount = (content.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;
        score += Math.min(emojiCount * 0.05, 0.2);

        // 包含 hashtag
        const hashtagCount = (content.match(/#/g) || []).length;
        score += Math.min(hashtagCount * 0.03, 0.15);

        // 包含問句
        if (content.includes('?') || content.includes('？')) {
            score += 0.1;
        }

        return Math.min(score, 1.0);
    }

    // 存儲標籤到資料庫
    async storeTags(postId, tags) {
        // 清除舊標籤
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM content_tags WHERE post_id = ?', [postId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // 插入新標籤
        for (const tag of tags) {
            await new Promise((resolve, reject) => {
                db.run(
                    'INSERT INTO content_tags (post_id, tag_name, confidence_score) VALUES (?, ?, ?)',
                    [postId, tag, 0.8], // 基礎置信度
                    (err) => {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }
    }

    // 更新貼文的 AI 分析結果
    async updatePostAnalysis(postId, category, sentiment, engagementScore) {
        return new Promise((resolve, reject) => {
            db.run(
                'UPDATE posts SET ai_category = ?, ai_sentiment = ?, ai_engagement_score = ? WHERE id = ?',
                [category, sentiment, engagementScore, postId],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    // 批量分析所有貼文
    async analyzeAllPosts() {
        try {
            const posts = await new Promise((resolve, reject) => {
                db.all('SELECT id, content FROM posts WHERE ai_category IS NULL', (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });

            console.log(`開始分析 ${posts.length} 個貼文...`);

            for (const post of posts) {
                await this.analyzePostContent(post.id, post.content);
            }

            console.log('所有貼文分析完成');
        } catch (error) {
            console.error('批量分析失敗:', error);
        }
    }

    // 獲取熱門標籤
    async getPopularTags(limit = 20) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    ct.tag_name,
                    COUNT(*) as usage_count,
                    AVG(ct.confidence_score) as avg_confidence
                FROM content_tags ct
                GROUP BY ct.tag_name
                ORDER BY usage_count DESC, avg_confidence DESC
                LIMIT ?
            `;
            
            db.all(query, [limit], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    }

    // 根據標籤搜尋貼文
    async searchPostsByTags(tags, limit = 20) {
        const placeholders = tags.map(() => '?').join(',');
        
        return new Promise((resolve, reject) => {
            const query = `
                SELECT DISTINCT
                    p.id,
                    p.content,
                    p.image_url,
                    p.created_at,
                    p.ai_category,
                    p.ai_sentiment,
                    u.username,
                    u.avatar,
                    GROUP_CONCAT(ct.tag_name) as tags
                FROM posts p
                JOIN users u ON p.user_id = u.id
                JOIN content_tags ct ON p.id = ct.post_id
                WHERE ct.tag_name IN (${placeholders})
                GROUP BY p.id
                ORDER BY p.ai_engagement_score DESC, p.created_at DESC
                LIMIT ?
            `;
            
            db.all(query, [...tags, limit], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    }
}

module.exports = ContentAnalysis; 