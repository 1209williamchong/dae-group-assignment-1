# AI 推薦系統說明

## 概述

本專案已整合了完整的 AI 推薦系統，包含以下核心功能：

- **內容分析**: 自動分析貼文內容並生成標籤
- **協同過濾**: 基於用戶相似度的推薦
- **內容基礎推薦**: 基於用戶興趣的推薦
- **混合推薦**: 結合多種算法的智能推薦
- **用戶行為追蹤**: 記錄和分析用戶互動行為

## 系統架構

### 資料庫表結構

#### 新增的 AI 相關資料表：

1. **user_behaviors** - 用戶行為追蹤
   - 記錄用戶的瀏覽、點讚、評論等行為
   - 包含行為類型和持續時間

2. **content_tags** - 內容標籤
   - 存儲 AI 分析生成的內容標籤
   - 包含置信度分數

3. **user_interests** - 用戶興趣
   - 基於用戶行為計算的興趣標籤
   - 動態更新的興趣分數

4. **recommendations** - 推薦結果
   - 存儲生成的推薦內容
   - 包含推薦分數和原因

5. **user_similarities** - 用戶相似度
   - 計算用戶間的相似度
   - 用於協同過濾推薦

### 核心模組

#### 1. AI 推薦系統 (`src/ai/recommendation.js`)
- 協同過濾算法
- 內容基礎推薦
- 混合推薦算法
- 用戶行為處理

#### 2. 內容分析 (`src/ai/content-analysis.js`)
- 文本分類
- 情感分析
- 標籤提取
- 參與度計算

#### 3. AI 系統主控 (`src/ai/index.js`)
- 統一介面
- 系統初始化
- 功能整合

## API 端點

### 推薦相關 API

#### 獲取個人化推薦
```
GET /api/ai/recommendations?limit=10
Authorization: Bearer <token>
```

#### 搜尋相關內容
```
GET /api/ai/search?query=咖啡&limit=20
Authorization: Bearer <token>
```

#### 獲取熱門內容
```
GET /api/ai/trending?limit=20
```

#### 記錄用戶行為
```
POST /api/ai/behavior
Authorization: Bearer <token>
Content-Type: application/json

{
  "postId": 123,
  "behaviorType": "view",
  "duration": 30
}
```

#### 獲取 AI 統計
```
GET /api/ai/analytics
Authorization: Bearer <token>
```

#### 獲取用戶興趣
```
GET /api/ai/interests
Authorization: Bearer <token>
```

#### 獲取熱門標籤
```
GET /api/ai/popular-tags?limit=20
```

#### 初始化 AI 系統
```
POST /api/ai/initialize
Authorization: Bearer <token>
```

## 使用方法

### 1. 啟動系統

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```

### 2. 測試 AI 系統

```bash
# 運行 AI 系統測試
npm run test-ai
```

### 3. 訪問 AI 推薦頁面

在瀏覽器中訪問：`http://localhost:3000/ai-recommendations.html`

### 4. 整合到現有功能

系統已自動整合到以下功能中：

- **發布貼文**: 自動分析內容並生成標籤
- **點讚功能**: 記錄用戶行為並更新推薦
- **瀏覽追蹤**: 可通過 API 記錄瀏覽行為

## 算法說明

### 1. 協同過濾 (Collaborative Filtering)

基於用戶相似度的推薦：
- 計算用戶間的相似度
- 推薦相似用戶喜歡的內容
- 權重：60%

### 2. 內容基礎推薦 (Content-Based)

基於用戶興趣的推薦：
- 分析用戶歷史行為
- 提取興趣標籤
- 推薦相關內容
- 權重：40%

### 3. 混合推薦 (Hybrid)

結合多種算法：
- 動態調整權重
- 提供更準確的推薦
- 考慮多個維度

## 內容分析功能

### 1. 自動分類

支援的內容類別：
- 美食 (food)
- 旅遊 (travel)
- 時尚 (fashion)
- 藝術 (art)
- 科技 (technology)
- 生活 (lifestyle)
- 商業 (business)

### 2. 情感分析

分析貼文情感傾向：
- 正面情感 (0.1 到 1.0)
- 負面情感 (-1.0 到 -0.1)
- 中性情感 (-0.1 到 0.1)

### 3. 標籤提取

自動提取關鍵字和標籤：
- 基於預定義關鍵字
- 支援 hashtag 識別
- 計算置信度分數

## 性能優化

### 1. 快取機制

- 推薦結果存儲在資料庫中
- 減少重複計算
- 提高響應速度

### 2. 批量處理

- 系統啟動時批量分析現有內容
- 定期更新用戶相似度
- 非同步處理用戶行為

### 3. 分頁支援

- 所有 API 支援分頁
- 限制返回結果數量
- 提高查詢效率

## 監控和分析

### 1. AI 統計面板

提供以下統計資訊：
- 已分析貼文數量
- 平均情感分數
- 熱門內容類別
- 活躍標籤數量

### 2. 推薦效果追蹤

- 推薦點擊率
- 用戶滿意度
- 推薦準確性

## 擴展建議

### 1. 機器學習整合

- 整合 TensorFlow.js
- 實現深度學習模型
- 提高推薦準確性

### 2. 即時推薦

- 使用 WebSocket
- 即時更新推薦
- 提升用戶體驗

### 3. 多媒體分析

- 圖片內容分析
- 影片內容理解
- 音頻情感分析

### 4. 個性化設定

- 用戶偏好設定
- 推薦頻率控制
- 內容過濾選項

## 故障排除

### 常見問題

1. **AI 系統初始化失敗**
   - 檢查資料庫連接
   - 確認資料表已創建
   - 查看錯誤日誌

2. **推薦結果為空**
   - 確認有足夠的用戶行為數據
   - 檢查內容分析是否正常
   - 重新初始化 AI 系統

3. **API 響應緩慢**
   - 檢查資料庫索引
   - 優化查詢語句
   - 考慮增加快取

### 日誌查看

AI 系統的運行日誌會輸出到控制台，包含：
- 初始化進度
- 錯誤信息
- 性能指標

## 授權

本 AI 推薦系統基於 MIT 授權條款發布。 