const AISystem = require('../src/ai');
const db = require('../src/db/init');

async function testAISystem() {
    console.log('🧪 開始測試 AI 推薦系統...\n');

    const aiSystem = new AISystem();

    try {
        // 1. 初始化 AI 系統
        console.log('1️⃣ 初始化 AI 系統...');
        await aiSystem.initialize();
        console.log('✅ AI 系統初始化完成\n');

        // 2. 測試內容分析
        console.log('2️⃣ 測試內容分析...');
        const testContent = '今天去了一家很棒的咖啡廳，咖啡香濃，環境優雅，推薦給大家！#咖啡 #美食 #推薦';
        const analysis = await aiSystem.contentAnalysis.analyzePostContent(999, testContent);
        console.log('內容分析結果:', analysis);
        console.log('✅ 內容分析測試完成\n');

        // 3. 測試用戶行為記錄
        console.log('3️⃣ 測試用戶行為記錄...');
        const behaviorResult = await aiSystem.processUserBehavior(1, 1, 'like');
        console.log('行為記錄結果:', behaviorResult);
        console.log('✅ 用戶行為記錄測試完成\n');

        // 4. 測試推薦生成
        console.log('4️⃣ 測試推薦生成...');
        const recommendations = await aiSystem.getUserRecommendations(1, 5);
        console.log('推薦結果數量:', recommendations.length);
        console.log('✅ 推薦生成測試完成\n');

        // 5. 測試搜尋功能
        console.log('5️⃣ 測試搜尋功能...');
        const searchResults = await aiSystem.searchRelatedContent('咖啡', 1, 5);
        console.log('搜尋結果數量:', searchResults.length);
        console.log('✅ 搜尋功能測試完成\n');

        // 6. 測試熱門內容
        console.log('6️⃣ 測試熱門內容...');
        const trending = await aiSystem.getTrendingContent(5);
        console.log('熱門內容數量:', trending.length);
        console.log('✅ 熱門內容測試完成\n');

        // 7. 測試 AI 統計
        console.log('7️⃣ 測試 AI 統計...');
        const analytics = await aiSystem.getAIAnalytics();
        console.log('AI 統計結果:', analytics);
        console.log('✅ AI 統計測試完成\n');

        console.log('🎉 所有測試完成！AI 推薦系統運行正常。');

    } catch (error) {
        console.error('❌ 測試失敗:', error);
    } finally {
        // 關閉資料庫連接
        db.close();
    }
}

// 運行測試
if (require.main === module) {
    testAISystem();
}

module.exports = { testAISystem }; 