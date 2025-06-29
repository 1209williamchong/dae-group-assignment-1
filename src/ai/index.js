const AIRecommendationSystem = require('./recommendation');
const ContentAnalysis = require('./content-analysis');

class AISystem {
    constructor() {
        this.recommendationSystem = new AIRecommendationSystem();
        this.contentAnalysis = new ContentAnalysis();
    }

    // 初始化 AI 系統
    async initialize() {
        try {
            console.log('正在初始化 AI 系統...');
            
            // 分析所有現有貼文
            await this.contentAnalysis.analyzeAllPosts();
            
            // 更新所有用戶相似度
            await this.recommendationSystem.updateAllUserSimilarities();
            
            console.log('AI 系統初始化完成');
        } catch (error) {
            console.error('AI 系統初始化失敗:', error);
        }
    }

    // 處理新貼文
    async processNewPost(postId, content) {
        try {
            // 分析內容
            const analysis = await this.contentAnalysis.analyzePostContent(postId, content);
            
            // 觸發推薦系統更新
            await this.updateRecommendationsForNewPost(postId);
            
            return analysis;
        } catch (error) {
            console.error('處理新貼文失敗:', error);
            return null;
        }
    }

    // 處理用戶行為
    async processUserBehavior(userId, postId, behaviorType, duration = 0) {
        try {
            // 記錄行為
            await this.recommendationSystem.recordUserBehavior(userId, postId, behaviorType, duration);
            
            // 更新用戶興趣
            await this.recommendationSystem.updateUserInterests(userId);
            
            // 重新生成推薦
            await this.recommendationSystem.generateAndStoreRecommendations(userId);
            
            return true;
        } catch (error) {
            console.error('處理用戶行為失敗:', error);
            return false;
        }
    }

    // 獲取用戶推薦
    async getUserRecommendations(userId, limit = 10) {
        try {
            // 先嘗試獲取存儲的推薦
            let recommendations = await this.recommendationSystem.getStoredRecommendations(userId, limit);
            
            // 如果沒有存儲的推薦，生成新的
            if (recommendations.length === 0) {
                recommendations = await this.recommendationSystem.generateAndStoreRecommendations(userId);
            }
            
            return recommendations.slice(0, limit);
        } catch (error) {
            console.error('獲取用戶推薦失敗:', error);
            return [];
        }
    }

    // 搜尋相關內容
    async searchRelatedContent(query, userId = null, limit = 20) {
        try {
            // 提取查詢中的標籤
            const tags = this.contentAnalysis.extractTags(query);
            
            if (tags.length === 0) {
                return [];
            }
            
            // 搜尋相關貼文
            const posts = await this.contentAnalysis.searchPostsByTags(tags, limit);
            
            // 如果提供了用戶 ID，計算個性化分數
            if (userId) {
                const userInterests = await this.recommendationSystem.calculateUserInterests(userId);
                const interestMap = new Map(userInterests.map(i => [i.tag_name, i.total_score]));
                
                posts.forEach(post => {
                    const postTags = post.tags ? post.tags.split(',') : [];
                    let personalizationScore = 0;
                    
                    postTags.forEach(tag => {
                        if (interestMap.has(tag)) {
                            personalizationScore += interestMap.get(tag);
                        }
                    });
                    
                    post.personalization_score = personalizationScore;
                });
                
                // 按個性化分數排序
                posts.sort((a, b) => b.personalization_score - a.personalization_score);
            }
            
            return posts;
        } catch (error) {
            console.error('搜尋相關內容失敗:', error);
            return [];
        }
    }

    // 獲取熱門內容
    async getTrendingContent(limit = 20) {
        try {
            return new Promise((resolve, reject) => {
                const query = `
                    SELECT 
                        p.id,
                        p.content,
                        p.image_url,
                        p.created_at,
                        p.ai_category,
                        p.ai_engagement_score,
                        u.username,
                        u.avatar,
                        COUNT(ub.id) as interaction_count,
                        COUNT(DISTINCT ub.user_id) as unique_users
                    FROM posts p
                    JOIN users u ON p.user_id = u.id
                    LEFT JOIN user_behaviors ub ON p.id = ub.post_id
                    WHERE p.created_at >= datetime('now', '-7 days')
                    GROUP BY p.id
                    ORDER BY interaction_count DESC, p.ai_engagement_score DESC
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
        } catch (error) {
            console.error('獲取熱門內容失敗:', error);
            return [];
        }
    }

    // 更新新貼文的推薦
    async updateRecommendationsForNewPost(postId) {
        try {
            // 獲取所有用戶
            const users = await new Promise((resolve, reject) => {
                db.all('SELECT id FROM users', (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });
            
            // 為每個用戶更新推薦
            for (const user of users) {
                await this.recommendationSystem.generateAndStoreRecommendations(user.id);
            }
        } catch (error) {
            console.error('更新新貼文推薦失敗:', error);
        }
    }

    // 獲取 AI 分析統計
    async getAIAnalytics() {
        try {
            const stats = await new Promise((resolve, reject) => {
                const query = `
                    SELECT 
                        COUNT(*) as total_posts,
                        COUNT(CASE WHEN ai_category IS NOT NULL THEN 1 END) as analyzed_posts,
                        AVG(ai_sentiment) as avg_sentiment,
                        AVG(ai_engagement_score) as avg_engagement,
                        COUNT(DISTINCT ai_category) as category_count
                    FROM posts
                `;
                
                db.get(query, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
            
            // 獲取熱門類別
            const popularCategories = await new Promise((resolve, reject) => {
                const query = `
                    SELECT 
                        ai_category,
                        COUNT(*) as post_count
                    FROM posts
                    WHERE ai_category IS NOT NULL
                    GROUP BY ai_category
                    ORDER BY post_count DESC
                    LIMIT 10
                `;
                
                db.all(query, (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });
            
            // 獲取熱門標籤
            const popularTags = await this.contentAnalysis.getPopularTags(10);
            
            return {
                stats,
                popularCategories,
                popularTags
            };
        } catch (error) {
            console.error('獲取 AI 分析統計失敗:', error);
            return null;
        }
    }
}

module.exports = AISystem; 