document.addEventListener('DOMContentLoaded', function() {
    const logoutForm = document.getElementById('logoutForm');
  
    logoutForm.addEventListener('submit', function(event) {
      event.preventDefault(); // Prevent the default form submission
  
      // Perform your logout logic here (e.g., clear cookies, local storage, etc.)
      // This is a placeholder; replace with your actual logout implementation.
      console.log('Logging out...');
  
      // Redirect to the login page (or wherever you want to redirect after logout)
      window.location.href = '/login.html';
    });
  });