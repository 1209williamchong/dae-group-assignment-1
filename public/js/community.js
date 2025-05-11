import { communityApi } from '../src/services/api.js';

document.addEventListener('DOMContentLoaded', async function () {
    console.log('initializing community management page');

    const friendList = document.getElementById('friend-list');
    const inviteForm = document.getElementById('invite-form');
    const friendEmailInput = document.getElementById('friend-email');
    const suggestedUsers = document.getElementById('suggested-users');
    const friendRequests = document.getElementById('friend-requests');

    // 獲取好友列表
    async function loadFriends() {
        const friends = await api.getFollowers();
        friendList.innerHTML = '';
        friends.forEach(friend => {
            const li = document.createElement('li');
            li.textContent = friend.name;
            friendList.appendChild(li);
        });
    }

    // 獲取建議用戶
    async function loadSuggestions() {
        const suggestions = await communityApi.getSuggestions();
        console.log({suggestions})
        // const suggestions = await api.getSuggestions();
        suggestedUsers.innerHTML = '';
        suggestions.forEach(user => {
            const li = document.createElement('li');
            li.innerHTML = `${user.name} <button class="btn-primary follow-btn" data-id="${user.id}">關注</button>`;
            suggestedUsers.appendChild(li);
        });
    }

    // 獲取好友請求
    async function loadFriendRequests() {
        const requests = await api.getFriendRequests();
        friendRequests.innerHTML = '';
        requests.forEach(request => {
            const li = document.createElement('li');
            li.innerHTML = `${request.name} 
                        <button class="btn-primary accept-btn" data-id="${request.id}">接受</button> 
                        <button class="btn-secondary reject-btn" data-id="${request.id}">拒絕</button>`;
            friendRequests.appendChild(li);
        });
    }

    // 邀請好友
    inviteForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const email = friendEmailInput.value;
        await api.request('/invite', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
        alert(`已邀請 ${email} 加入社群！`);
        friendEmailInput.value = '';
    });

    // 處理關注按鈕點擊
    document.addEventListener('click', async function (e) {
        if (e.target.classList.contains('follow-btn')) {
            const userId = e.target.dataset.id;
            await api.followUser(userId);
            alert('已關注');
            e.target.textContent = '已關注';
            e.target.disabled = true;
        }
    });

    // 處理好友請求按鈕點擊
    document.addEventListener('click', async function (e) {
        const userId = e.target.dataset.id;
        if (e.target.classList.contains('accept-btn')) {
            await api.acceptFriendRequest(userId);
            alert('已接受好友請求');
            e.target.parentElement.remove();
        } else if (e.target.classList.contains('reject-btn')) {
            await api.rejectFriendRequest(userId);
            alert('已拒絕好友請求');
            e.target.parentElement.remove();
        }
    });

    // 初始化
    //  loadFriends();
     loadSuggestions();
    //  loadFriendRequests();
});

document.addEventListener('DOMContentLoaded', function () {
    const collapsibles = document.querySelectorAll('.collapsible');

    collapsibles.forEach(button => {
        button.addEventListener('click', function () {
            this.classList.toggle('active');
            const content = this.nextElementSibling;
            if (content.style.display === 'block') {
                content.style.display = 'none';
            } else {
                content.style.display = 'block';
            }
        });
    });
});