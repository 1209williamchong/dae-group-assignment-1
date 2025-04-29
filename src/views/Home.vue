<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="home-container">
        <ion-grid>
          <ion-row class="ion-justify-content-center">
            <ion-col size="12" size-md="10" size-lg="8">
              <div class="welcome-section">
                <ion-text color="primary">
                  <h1>歡迎來到 Fresh</h1>
                </ion-text>
                <ion-text color="medium">
                  <p class="subtitle">分享你的生活點滴，與朋友保持聯繫</p>
                </ion-text>
              </div>

              <ion-grid class="features-section">
                <ion-row>
                  <ion-col size="12" size-md="4">
                    <ion-card class="feature-card">
                      <ion-card-header>
                        <ion-card-title>📱 即時通訊</ion-card-title>
                      </ion-card-header>
                      <ion-card-content>
                        <p>與朋友即時聊天，分享照片和影片</p>
                      </ion-card-content>
                    </ion-card>
                  </ion-col>
                  <ion-col size="12" size-md="4">
                    <ion-card class="feature-card">
                      <ion-card-header>
                        <ion-card-title>📸 分享生活</ion-card-title>
                      </ion-card-header>
                      <ion-card-content>
                        <p>發布照片和影片，記錄精彩瞬間</p>
                      </ion-card-content>
                    </ion-card>
                  </ion-col>
                  <ion-col size="12" size-md="4">
                    <ion-card class="feature-card">
                      <ion-card-header>
                        <ion-card-title>👥 社交網絡</ion-card-title>
                      </ion-card-header>
                      <ion-card-content>
                        <p>關注朋友，發現更多精彩內容</p>
                      </ion-card-content>
                    </ion-card>
                  </ion-col>
                </ion-row>
              </ion-grid>

              <ion-card class="cta-section">
                <ion-card-content>
                  <ion-text color="primary">
                    <h2>立即加入 Fresh</h2>
                  </ion-text>
                  <ion-text color="medium">
                    <p>開始你的社交之旅</p>
                  </ion-text>
                  <ion-button expand="block" router-link="/register" class="cta-button">
                    註冊
                  </ion-button>
                  <ion-text color="medium">
                    <p class="login-link">
                      已有帳號？
                      <ion-button fill="clear" router-link="/login">登入</ion-button>
                    </p>
                  </ion-text>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import {
  IonPage,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonText
} from '@ionic/vue';

export default defineComponent({
  name: 'Home',
  components: {
    IonPage,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonText
  }
});
</script>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.welcome-section {
  margin-bottom: 60px;
}

.welcome-section h1 {
  font-size: 2.5em;
  margin-bottom: 20px;
}

.subtitle {
  font-size: 1.2em;
}

.features-section {
  margin-bottom: 60px;
}

.feature-card {
  height: 100%;
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.cta-section {
  background: var(--ion-color-light);
  padding: 40px;
  border-radius: 10px;
}

.cta-section h2 {
  margin-bottom: 15px;
}

.cta-section p {
  margin-bottom: 20px;
}

.cta-button {
  margin: 20px 0;
}

.login-link {
  margin-top: 20px;
}

@media (max-width: 768px) {
  .welcome-section h1 {
    font-size: 2em;
  }
}
</style> 