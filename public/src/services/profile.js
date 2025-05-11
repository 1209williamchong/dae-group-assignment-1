import { authApi } from '/src/services/api.js';

export async function setupProfilePic() {
    try {
        const json = await authApi.getProfile();
        // console.log({json });
        const avatar = json.profile.avatar;
        let img = document.getElementById('home-avatar');
        if (img) {
            img.src = avatar;
        }
    } catch (error) {
        alert(error.message);
    }
}