<template>
  <div class="post-container">
    <div class="post-form">
      <textarea v-model="postContent" placeholder="分享你的想法..." rows="3"></textarea>
      <div class="post-actions">
        <button @click="addImage">添加圖片</button>
        <button @click="createPost" :disabled="!postContent.trim()">發布</button>
      </div>
    </div>

    <div class="posts-list">
      <div v-for="post in posts" :key="post.id" class="post-item">
        <div class="post-header">
          <img :src="post.user.avatar" :alt="post.user.username" class="user-avatar" />
          <div class="post-info">
            <span class="username">{{ post.user.username }}</span>
            <span class="timestamp">{{ formatDate(post.createdAt) }}</span>
          </div>
        </div>
        <p class="post-content">{{ post.content }}</p>
        <div v-if="post.image" class="post-image">
          <img :src="post.image" alt="貼文圖片" />
        </div>
        <div class="post-actions">
          <button @click="toggleLike(post)">
            {{ post.isLiked ? '取消喜歡' : '喜歡' }} ({{ post.likes }})
          </button>
          <button @click="toggleComments(post)">評論 ({{ post.comments.length }})</button>
        </div>
        <div v-if="post.showComments" class="comments-section">
          <div v-for="comment in post.comments" :key="comment.id" class="comment">
            <span class="comment-user">{{ comment.user.username }}</span>
            <span class="comment-content">{{ comment.content }}</span>
          </div>
          <div class="add-comment">
            <input v-model="post.newComment" placeholder="寫下評論..." />
            <button @click="addComment(post)">發送</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

interface Post {
  id: string;
  content: string;
  image?: string;
  user: {
    id: string;
    username: string;
    avatar: string;
  };
  createdAt: string;
  likes: number;
  isLiked: boolean;
  comments: Comment[];
  showComments: boolean;
  newComment: string;
}

interface Comment {
  id: string;
  content: string;
  user: {
    id: string;
    username: string;
  };
}

export default defineComponent({
  name: 'Post',
  setup() {
    const postContent = ref('');
    const posts = ref<Post[]>([]);

    const createPost = async () => {
      try {
        const response = await fetch('/api/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: postContent.value,
          }),
        });

        if (response.ok) {
          const newPost = await response.json();
          posts.value.unshift(newPost);
          postContent.value = '';
        }
      } catch (error) {
        console.error('發布貼文錯誤:', error);
      }
    };

    const addImage = async () => {
      try {
        const { Camera } = await import('@capacitor/camera');
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: true,
          resultType: Camera.ResultType.Uri,
        });
        // 處理圖片上傳邏輯
      } catch (error) {
        console.error('添加圖片錯誤:', error);
      }
    };

    const toggleLike = async (post: Post) => {
      try {
        const response = await fetch(`/api/posts/${post.id}/like`, {
          method: post.isLiked ? 'DELETE' : 'POST',
        });

        if (response.ok) {
          post.isLiked = !post.isLiked;
          post.likes += post.isLiked ? 1 : -1;
        }
      } catch (error) {
        console.error('喜歡貼文錯誤:', error);
      }
    };

    const toggleComments = (post: Post) => {
      post.showComments = !post.showComments;
    };

    const addComment = async (post: Post) => {
      if (!post.newComment.trim()) return;

      try {
        const response = await fetch(`/api/posts/${post.id}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: post.newComment,
          }),
        });

        if (response.ok) {
          const newComment = await response.json();
          post.comments.push(newComment);
          post.newComment = '';
        }
      } catch (error) {
        console.error('添加評論錯誤:', error);
      }
    };

    const formatDate = (date: string) => {
      return new Date(date).toLocaleString();
    };

    return {
      postContent,
      posts,
      createPost,
      addImage,
      toggleLike,
      toggleComments,
      addComment,
      formatDate,
    };
  },
});
</script>

<style scoped>
.post-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.post-form {
  margin-bottom: 20px;
}

textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
}

.post-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.post-item {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
}

.post-info {
  display: flex;
  flex-direction: column;
}

.username {
  font-weight: bold;
}

.timestamp {
  color: #666;
  font-size: 0.8em;
}

.post-content {
  margin: 10px 0;
}

.post-image img {
  max-width: 100%;
  border-radius: 4px;
}

.comments-section {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.comment {
  margin-bottom: 5px;
}

.comment-user {
  font-weight: bold;
  margin-right: 5px;
}

.add-comment {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.add-comment input {
  flex: 1;
}

button {
  padding: 8px 15px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #3aa876;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style> 