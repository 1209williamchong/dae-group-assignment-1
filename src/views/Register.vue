<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>註冊新帳號</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-content>
          <ion-list>
            <ion-item>
              <ion-label position="stacked">用戶名稱</ion-label>
              <ion-input
                v-model="formData.username"
                type="text"
                placeholder="請輸入用戶名稱"
                :class="{ 'ion-invalid': errors.username }"
              ></ion-input>
              <ion-note slot="error" v-if="errors.username">{{ errors.username }}</ion-note>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">電子郵件</ion-label>
              <ion-input
                v-model="formData.email"
                type="email"
                placeholder="請輸入電子郵件"
                :class="{ 'ion-invalid': errors.email }"
              ></ion-input>
              <ion-note slot="error" v-if="errors.email">{{ errors.email }}</ion-note>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">密碼</ion-label>
              <ion-input
                v-model="formData.password"
                type="password"
                placeholder="請輸入密碼"
                :class="{ 'ion-invalid': errors.password }"
              ></ion-input>
              <ion-note slot="error" v-if="errors.password">{{ errors.password }}</ion-note>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">確認密碼</ion-label>
              <ion-input
                v-model="formData.confirmPassword"
                type="password"
                placeholder="請再次輸入密碼"
                :class="{ 'ion-invalid': errors.confirmPassword }"
              ></ion-input>
              <ion-note slot="error" v-if="errors.confirmPassword">{{ errors.confirmPassword }}</ion-note>
            </ion-item>

            <ion-item>
              <ion-label position="stacked">頭像</ion-label>
              <ion-button @click="takePicture" expand="block">
                選擇照片
              </ion-button>
              <img v-if="avatar" :src="avatar" class="avatar-preview" />
            </ion-item>
          </ion-list>

          <ion-button 
            expand="block" 
            class="ion-margin-top"
            @click="handleSubmit"
            :disabled="isLoading"
          >
            <ion-spinner v-if="isLoading" name="dots"></ion-spinner>
            <span v-else>註冊</span>
          </ion-button>

          <ion-text class="ion-text-center ion-margin-top">
            <p>
              <ion-router-link href="/login">已有帳號？登入</ion-router-link>
            </p>
          </ion-text>
        </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, ref, reactive } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonRouterLink,
  IonNote,
  IonSpinner
} from '@ionic/vue';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Storage } from '@capacitor/storage';

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

export default defineComponent({
  name: 'Register',
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonText,
    IonRouterLink,
    IonNote,
    IonSpinner
  },
  setup() {
    const isLoading = ref(false);
    const formData = reactive<FormData>({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    const errors = reactive<FormErrors>({});
    const avatar = ref(null);
    const location = ref(null);

    const validateForm = (): boolean => {
      let isValid = true;
      errors.username = '';
      errors.email = '';
      errors.password = '';
      errors.confirmPassword = '';

      // 驗證用戶名稱
      if (!formData.username) {
        errors.username = '請輸入用戶名稱';
        isValid = false;
      } else if (formData.username.length < 3) {
        errors.username = '用戶名稱至少需要3個字符';
        isValid = false;
      }

      // 驗證電子郵件
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email) {
        errors.email = '請輸入電子郵件';
        isValid = false;
      } else if (!emailRegex.test(formData.email)) {
        errors.email = '請輸入有效的電子郵件地址';
        isValid = false;
      }

      // 驗證密碼
      if (!formData.password) {
        errors.password = '請輸入密碼';
        isValid = false;
      } else if (formData.password.length < 6) {
        errors.password = '密碼至少需要6個字符';
        isValid = false;
      }

      // 驗證確認密碼
      if (!formData.confirmPassword) {
        errors.confirmPassword = '請確認密碼';
        isValid = false;
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = '密碼不匹配';
        isValid = false;
      }

      return isValid;
    };

    const handleSubmit = async () => {
      if (!validateForm()) {
        return;
      }

      isLoading.value = true;

      try {
        // 獲取當前位置
        const position = await Geolocation.getCurrentPosition();
        location.value = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };

        // 保存用戶信息到本地存儲
        await Storage.set({
          key: 'userInfo',
          value: JSON.stringify({
            username: formData.username,
            email: formData.email,
            avatar: avatar.value,
            location: location.value
          })
        });

        // 發送註冊請求
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            password: formData.password,
            avatar: avatar.value,
            location: location.value
          }),
        });
        
        const data: ApiResponse = await response.json();

        if (response.ok) {
          // 註冊成功，跳轉到登入頁面
          window.location.href = '/login';
        } else {
          // 處理不同的錯誤情況
          if (data.error === 'EMAIL_EXISTS') {
            errors.email = '此電子郵件已被註冊';
          } else if (data.error === 'USERNAME_EXISTS') {
            errors.username = '此用戶名稱已被使用';
          } else {
            alert(data.message || '註冊失敗，請稍後再試');
          }
        }
      } catch (error) {
        console.error('註冊錯誤:', error);
        alert('註冊過程中發生錯誤，請稍後再試');
      } finally {
        isLoading.value = false;
      }
    };

    const takePicture = async () => {
      try {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: true,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Photos
        });
        
        avatar.value = image.dataUrl;
      } catch (error) {
        console.error('拍照錯誤:', error);
        alert('無法獲取照片');
      }
    };

    return {
      formData,
      errors,
      isLoading,
      handleSubmit,
      takePicture,
      avatar,
      location
    };
  }
});
</script>

<style scoped>
ion-card {
  border-radius: 15px;
}

ion-item {
  --border-radius: 8px;
  margin-bottom: 16px;
}

ion-button {
  --border-radius: 8px;
  height: 48px;
  font-weight: bold;
}

ion-router-link {
  color: var(--ion-color-primary);
  text-decoration: none;
}

.avatar-preview {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin-top: 10px;
  object-fit: cover;
}

.ion-invalid {
  --highlight-background: var(--ion-color-danger);
}
</style> 