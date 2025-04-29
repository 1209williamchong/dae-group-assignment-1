<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="auth-container">
        <ion-card v-if="!isAuthenticated" class="auth-form">
          <ion-card-header>
            <ion-card-title>登入</ion-card-title>
          </ion-card-header>
          
          <ion-card-content>
            <ion-list>
              <ion-item>
                <ion-label position="stacked">電子郵件</ion-label>
                <ion-input
                  v-model="email"
                  type="email"
                  placeholder="請輸入電子郵件"
                ></ion-input>
              </ion-item>

              <ion-item>
                <ion-label position="stacked">密碼</ion-label>
                <ion-input
                  v-model="password"
                  type="password"
                  placeholder="請輸入密碼"
                ></ion-input>
              </ion-item>
            </ion-list>

            <ion-button expand="block" @click="handleAuth" class="ion-margin-top">
              登入
            </ion-button>
          </ion-card-content>
        </ion-card>

        <ion-card v-else class="user-profile">
          <ion-card-header>
            <ion-card-title>歡迎回來</ion-card-title>
            <ion-card-subtitle>{{ currentUser?.username }}</ion-card-subtitle>
          </ion-card-header>
          
          <ion-card-content>
            <ion-button expand="block" color="danger" @click="logout">
              登出
            </ion-button>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import {
  IonPage,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText
} from '@ionic/vue';

export default defineComponent({
  name: 'Auth',
  components: {
    IonPage,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonText
  },
  setup() {
    const isAuthenticated = ref(false);
    const email = ref('');
    const password = ref('');
    const currentUser = ref<any>(null);

    const handleAuth = async () => {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.value,
            password: password.value,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          currentUser.value = data.user;
          isAuthenticated.value = true;
        }
      } catch (error) {
        console.error('登入錯誤:', error);
      }
    };

    const logout = () => {
      isAuthenticated.value = false;
      currentUser.value = null;
      email.value = '';
      password.value = '';
    };

    return {
      isAuthenticated,
      email,
      password,
      currentUser,
      handleAuth,
      logout,
    };
  },
});
</script>

<style scoped>
.auth-container {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
}

.auth-form {
  border-radius: 15px;
}

.user-profile {
  text-align: center;
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
</style> 