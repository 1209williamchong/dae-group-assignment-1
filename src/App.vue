<template>
  <div class="app">
    <h1>我的 Capacitor 應用程式</h1>
    
    <!-- 相機功能 -->
    <div class="section">
      <h2>相機功能</h2>
      <button @click="takePicture">拍照</button>
      <img v-if="photo" :src="photo.webPath" alt="拍攝的照片" class="photo" />
    </div>

    <!-- 地理位置 -->
    <div class="section">
      <h2>地理位置</h2>
      <button @click="getCurrentPosition">獲取位置</button>
      <p v-if="position">緯度: {{ position.coords.latitude }}, 經度: {{ position.coords.longitude }}</p>
    </div>

    <!-- 通知 -->
    <div class="section">
      <h2>通知</h2>
      <button @click="scheduleNotification">發送通知</button>
    </div>

    <!-- 本地存儲 -->
    <div class="section">
      <h2>本地存儲</h2>
      <input v-model="storageKey" placeholder="鍵名" />
      <input v-model="storageValue" placeholder="值" />
      <button @click="setStorage">儲存</button>
      <button @click="getStorage">讀取</button>
      <p v-if="storedValue">儲存的值: {{ storedValue }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { Capacitor } from '@capacitor/core';

export default defineComponent({
  name: 'App',
  setup() {
    const photo = ref<any>(null);
    const position = ref<any>(null);
    const storageKey = ref('');
    const storageValue = ref('');
    const storedValue = ref('');

    const takePicture = async () => {
      try {
        const { Camera } = await import('@capacitor/camera');
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: true,
          resultType: Camera.ResultType.Uri
        });
        photo.value = image;
      } catch (error) {
        console.error('拍照錯誤:', error);
      }
    };

    const getCurrentPosition = async () => {
      try {
        const { Geolocation } = await import('@capacitor/geolocation');
        const coordinates = await Geolocation.getCurrentPosition();
        position.value = coordinates;
      } catch (error) {
        console.error('獲取位置錯誤:', error);
      }
    };

    const scheduleNotification = async () => {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        await LocalNotifications.schedule({
          notifications: [
            {
              title: '通知標題',
              body: '這是通知內容',
              id: 1
            }
          ]
        });
      } catch (error) {
        console.error('發送通知錯誤:', error);
      }
    };

    const setStorage = async () => {
      try {
        const { Storage } = await import('@capacitor/storage');
        await Storage.set({
          key: storageKey.value,
          value: storageValue.value
        });
        alert('儲存成功！');
      } catch (error) {
        console.error('儲存錯誤:', error);
      }
    };

    const getStorage = async () => {
      try {
        const { Storage } = await import('@capacitor/storage');
        const { value } = await Storage.get({ key: storageKey.value });
        storedValue.value = value || '';
      } catch (error) {
        console.error('讀取錯誤:', error);
      }
    };

    return {
      photo,
      position,
      storageKey,
      storageValue,
      storedValue,
      takePicture,
      getCurrentPosition,
      scheduleNotification,
      setStorage,
      getStorage
    };
  }
});
</script>

<style>
.app {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

button {
  margin: 10px 5px;
  padding: 10px 20px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #3aa876;
}

.photo {
  max-width: 100%;
  margin-top: 10px;
  border-radius: 8px;
}

input {
  padding: 8px;
  margin: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style> 