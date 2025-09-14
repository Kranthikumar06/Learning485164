function goBack() {
  window.location.href = "/";
}

function editProfile() {
  // Existing edit profile logic (if any)
}

function logoutUser() {
  // Send POST request to /users/logout and redirect to home
  fetch('/users/logout', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }).then(() => {
    window.location.href = "/";
  });
}
