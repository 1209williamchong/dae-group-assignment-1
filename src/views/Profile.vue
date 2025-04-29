<template>
  <div class="profile-container">
    <div class="profile-header">
      <img :src="user.avatar" :alt="user.username" class="profile-avatar" />
      <h2>{{ user.username }}</h2>
      <p class="bio">{{ user.bio }}</p>
      <div class="profile-stats">
        <div class="stat">
          <span class="stat-value">{{ user.postsCount }}</span>
          <span class="stat-label">貼文</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ user.followersCount }}</span>
          <span class="stat-label">追蹤者</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ user.followingCount }}</span>
          <span class="stat-label">追蹤中</span>
        </div>
      </div>
      <button class="edit-profile" @click="editProfile">編輯個人資料</button>
    </div>

    <div class="profile-content">
      <div class="tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          :class="{ active: currentTab === tab.id }"
          @click="currentTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="tab-content">
        <div v-if="currentTab === 'posts'" class="posts-grid">
          <div v-for="post in userPosts" :key="post.id" class="post-thumbnail">
            <img :src="post.image" :alt="post.content" />
          </div>
        </div>

        <div v-if="currentTab === 'saved'" class="posts-grid">
          <div v-for="post in savedPosts" :key="post.id" class="post-thumbnail">
            <img :src="post.image" :alt="post.content" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'Profile',
  setup() {
    const user = ref({
      id: '1',
      username: '用戶名稱',
      avatar: '/default-avatar.png',
      bio: '這是我的個人簡介',
      postsCount: 0,
      followersCount: 0,
      followingCount: 0,
    });

    const currentTab = ref('posts');
    const tabs = [
      { id: 'posts', label: '貼文' },
      { id: 'saved', label: '已儲存' },
    ];

    const userPosts = ref([]);
    const savedPosts = ref([]);

    const editProfile = () => {
      // 實現編輯個人資料的邏輯
    };

    return {
      user,
      currentTab,
      tabs,
      userPosts,
      savedPosts,
      editProfile,
    };
  },
});
</script>

<style scoped>
.profile-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.profile-header {
  text-align: center;
  margin-bottom: 30px;
}

.profile-avatar {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  margin-bottom: 15px;
}

.bio {
  color: #666;
  margin-bottom: 20px;
}

.profile-stats {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 20px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-weight: bold;
  font-size: 1.2em;
}

.stat-label {
  color: #666;
  font-size: 0.9em;
}

.edit-profile {
  padding: 8px 20px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.edit-profile:hover {
  background-color: #3aa876;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #ddd;
  margin-bottom: 20px;
}

.tabs button {
  padding: 10px 20px;
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
}

.tabs button.active {
  color: #42b983;
  border-bottom: 2px solid #42b983;
}

.posts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.post-thumbnail {
  aspect-ratio: 1;
  overflow: hidden;
}

.post-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style> 