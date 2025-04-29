import { api } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    const settingsForm = document.querySelector('.settings-form');
    const usernameInput = document.getElementById('username');
    const displayNameInput = document.getElementById('displayName');
    const bioInput = document.getElementById('bio');

    // 載入當前設定
    async function loadSettings() {
        try {
            const profile = await api.getProfile();
            usernameInput.value = profile.username;
            displayNameInput.value = profile.displayName;
            bioInput.value = profile.bio || '';
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    // 儲存設定
    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const profileData = {
            username: usernameInput.value,
            displayName: displayNameInput.value,
            bio: bioInput.value
        };

        try {
            await api.updateProfile(profileData);
            alert('設定已更新');
        } catch (error) {
            console.error('Failed to update profile:', error);
            alert('更新設定失敗');
        }
    });

    // 處理開關按鈕
    document.querySelectorAll('.switch input').forEach(switchInput => {
        switchInput.addEventListener('change', async (e) => {
            const settingName = e.target.parentElement.nextElementSibling.textContent;
            try {
                // 這裡可以根據實際的 API 端點來更新設定
                // await api.updateSetting(settingName, e.target.checked);
                console.log(`${settingName} 設定已更新為: ${e.target.checked}`);
            } catch (error) {
                console.error('Failed to update setting:', error);
                e.target.checked = !e.target.checked; // 恢復原來的狀態
            }
        });
    });

    // 初始載入
    loadSettings();
}); 