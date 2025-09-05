// Fake login check using localStorage
    document.getElementById("loginForm").addEventListener("submit", function(e) {
      e.preventDefault();

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      const storedEmail = localStorage.getItem("email");
      const storedPassword = localStorage.getItem("password");

      if (email === storedEmail && password === storedPassword) {
        alert("Login Successful ✅");
        window.location.href = "index.html";
      } else {
        alert("No account found ❌ Please sign up first.");
        window.location.href = "signup.html";
      }
    });