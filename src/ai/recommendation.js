const {db,database_init_promise} = require('../db/init');

class AIRecommendationSystem {
    constructor() {
        this.behaviorWeights = {
            'view': 1,
            'like': 3,
            'comment': 5,
            'share': 4,
            'save': 6
        };
    }

    // 記錄用戶行為
    async recordUserBehavior(userId, postId, behaviorType, duration = 0) {
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO user_behaviors (user_id, post_id, behavior_type, duration) VALUES (?, ?, ?, ?)',
                [userId, postId, behaviorType, duration],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(this.lastID);
                    }
                }
            );
        });
    }

    // 計算用戶興趣分數
    async calculateUserInterests(userId) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    ct.tag_name,
                    SUM(ub.behavior_type = 'view') * 1 +
                    SUM(ub.behavior_type = 'like') * 3 +
                    SUM(ub.behavior_type = 'comment') * 5 +
                    SUM(ub.behavior_type = 'share') * 4 +
                    SUM(ub.behavior_type = 'save') * 6 as total_score
                FROM user_behaviors ub
                JOIN content_tags ct ON ub.post_id = ct.post_id
                WHERE ub.user_id = ?
                GROUP BY ct.tag_name
                ORDER BY total_score DESC
            `;
            
            db.all(query, [userId], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    }

    // 更新用戶興趣標籤
    async updateUserInterests(userId) {
        try {
            const interests = await this.calculateUserInterests(userId);
            
            // 清除舊的興趣標籤
            await new Promise((resolve, reject) => {
                db.run('DELETE FROM user_interests WHERE user_id = ?', [userId], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            // 插入新的興趣標籤
            for (const interest of interests) {
                const normalizedScore = Math.min(interest.total_score / 100, 1.0); // 正規化到 0-1
                await new Promise((resolve, reject) => {
                    db.run(
                        'INSERT INTO user_interests (user_id, tag_name, interest_score) VALUES (?, ?, ?)',
                        [userId, interest.tag_name, normalizedScore],
                        (err) => {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });
            }
        } catch (error) {
            console.error('更新用戶興趣失敗:', error);
        }
    }

    // 協同過濾推薦
    async collaborativeFiltering(userId, limit = 10) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    p.id as post_id,
                    p.content,
                    p.image_url,
                    p.created_at,
                    u.username,
                    u.avatar,
                    AVG(us.similarity_score) as avg_similarity,
                    COUNT(DISTINCT ub2.user_id) as similar_user_likes
                FROM posts p
                JOIN users u ON p.user_id = u.id
                JOIN user_behaviors ub2 ON p.id = ub2.post_id
                JOIN user_similarities us ON (
                    (us.user_id_1 = ? AND us.user_id_2 = ub2.user_id) OR
                    (us.user_id_2 = ? AND us.user_id_1 = ub2.user_id)
                )
                WHERE ub2.behavior_type = 'like'
                AND p.user_id != ?
                AND p.id NOT IN (
                    SELECT post_id FROM user_behaviors WHERE user_id = ?
                )
                GROUP BY p.id
                ORDER BY avg_similarity DESC, similar_user_likes DESC
                LIMIT ?
            `;
            
            db.all(query, [userId, userId, userId, userId, limit], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    }

    // 內容基礎推薦
    async contentBasedRecommendation(userId, limit = 10) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    p.id as post_id,
                    p.content,
                    p.image_url,
                    p.created_at,
                    u.username,
                    u.avatar,
                    SUM(ui.interest_score * ct.confidence_score) as content_score
                FROM posts p
                JOIN users u ON p.user_id = u.id
                JOIN content_tags ct ON p.id = ct.post_id
                JOIN user_interests ui ON ct.tag_name = ui.tag_name
                WHERE ui.user_id = ?
                AND p.user_id != ?
                AND p.id NOT IN (
                    SELECT post_id FROM user_behaviors WHERE user_id = ?
                )
                GROUP BY p.id
                ORDER BY content_score DESC
                LIMIT ?
            `;
            
            db.all(query, [userId, userId, userId, limit], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    }

    // 混合推薦
    async hybridRecommendation(userId, limit = 10) {
        try {
            const [collaborativeResults, contentResults] = await Promise.all([
                this.collaborativeFiltering(userId, limit),
                this.contentBasedRecommendation(userId, limit)
            ]);

            // 合併結果並計算混合分數
            const postScores = new Map();

            // 處理協同過濾結果
            collaborativeResults.forEach((post, index) => {
                const score = (limit - index) / limit * 0.6; // 協同過濾權重 60%
                postScores.set(post.post_id, {
                    ...post,
                    hybrid_score: score
                });
            });

            // 處理內容基礎結果
            contentResults.forEach((post, index) => {
                const score = (limit - index) / limit * 0.4; // 內容基礎權重 40%
                if (postScores.has(post.post_id)) {
                    postScores.get(post.post_id).hybrid_score += score;
                } else {
                    postScores.set(post.post_id, {
                        ...post,
                        hybrid_score: score
                    });
                }
            });

            // 排序並返回結果
            return Array.from(postScores.values())
                .sort((a, b) => b.hybrid_score - a.hybrid_score)
                .slice(0, limit);

        } catch (error) {
            console.error('混合推薦失敗:', error);
            return [];
        }
    }

    // 計算用戶相似度
    async calculateUserSimilarity(userId1, userId2) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    ub1.post_id,
                    ub1.behavior_type as behavior1,
                    ub2.behavior_type as behavior2
                FROM user_behaviors ub1
                JOIN user_behaviors ub2 ON ub1.post_id = ub2.post_id
                WHERE ub1.user_id = ? AND ub2.user_id = ?
            `;
            
            db.all(query, [userId1, userId2], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    let similarity = 0;
                    let totalInteractions = 0;

                    results.forEach(row => {
                        const weight1 = this.behaviorWeights[row.behavior1] || 0;
                        const weight2 = this.behaviorWeights[row.behavior2] || 0;
                        similarity += Math.min(weight1, weight2);
                        totalInteractions++;
                    });

                    const finalSimilarity = totalInteractions > 0 ? similarity / (totalInteractions * 6) : 0;
                    resolve(finalSimilarity);
                }
            });
        });
    }

    // 更新所有用戶相似度
    async updateAllUserSimilarities() {
        try {
            const users = await new Promise((resolve, reject) => {
                db.all('SELECT id FROM users', (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });

            // 清除舊的相似度數據
            await new Promise((resolve, reject) => {
                db.run('DELETE FROM user_similarities', (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            // 計算所有用戶對的相似度
            for (let i = 0; i < users.length; i++) {
                for (let j = i + 1; j < users.length; j++) {
                    const similarity = await this.calculateUserSimilarity(users[i].id, users[j].id);
                    
                    if (similarity > 0.1) { // 只保存相似度大於 0.1 的
                        await new Promise((resolve, reject) => {
                            db.run(
                                'INSERT INTO user_similarities (user_id_1, user_id_2, similarity_score) VALUES (?, ?, ?)',
                                [users[i].id, users[j].id, similarity],
                                (err) => {
                                    if (err) reject(err);
                                    else resolve();
                                }
                            );
                        });
                    }
                }
            }
        } catch (error) {
            console.error('更新用戶相似度失敗:', error);
        }
    }

    // 生成推薦並存儲到資料庫
    async generateAndStoreRecommendations(userId) {
        try {
            // 更新用戶興趣
            await this.updateUserInterests(userId);
            
            // 獲取混合推薦
            const recommendations = await this.hybridRecommendation(userId, 20);
            
            // 清除舊的推薦
            await new Promise((resolve, reject) => {
                db.run('DELETE FROM recommendations WHERE user_id = ?', [userId], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            // 存儲新的推薦
            for (const rec of recommendations) {
                await new Promise((resolve, reject) => {
                    db.run(
                        'INSERT INTO recommendations (user_id, post_id, recommendation_score, algorithm_type, reason) VALUES (?, ?, ?, ?, ?)',
                        [userId, rec.post_id, rec.hybrid_score, 'hybrid', '基於您的興趣和相似用戶的偏好'],
                        (err) => {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });
            }

            return recommendations;
        } catch (error) {
            console.error('生成推薦失敗:', error);
            return [];
        }
    }

    // 獲取存儲的推薦
    async getStoredRecommendations(userId, limit = 10) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT 
                    r.recommendation_score,
                    r.algorithm_type,
                    r.reason,
                    p.id as post_id,
                    p.content,
                    p.image_url,
                    p.created_at,
                    u.username,
                    u.avatar
                FROM recommendations r
                JOIN posts p ON r.post_id = p.id
                JOIN users u ON p.user_id = u.id
                WHERE r.user_id = ?
                ORDER BY r.recommendation_score DESC
                LIMIT ?
            `;
            
            db.all(query, [userId, limit], (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            });
        });
    }
}

module.exports = AIRecommendationSystem; 