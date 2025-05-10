// 添加 fresh 按鈕事件處理
document.getElementById('freshBtn').addEventListener('click', () => {
    // 清除本地存儲的 token
    localStorage.removeItem('token');
    // 重新導向到登入頁面
    window.location.href = '/login.html';
}); 