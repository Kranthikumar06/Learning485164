  // Save signup details in localStorage
  document.getElementById("signupForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (password !== confirmPassword) {
      alert("❌ Passwords do not match!");
      return;
    }

    localStorage.setItem("email", email);
    localStorage.setItem("password", password);

    alert("✅ Sign Up Successful! Please login now.");
    window.location.href = "signin.html";
  });