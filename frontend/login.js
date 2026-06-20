document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");

  // This event listener safely handles the form submission
  // It will not cause an error if the form is not on the page.
  loginForm?.addEventListener("submit", async function (e) {
    // Prevent the default form action (page reload)
    e.preventDefault();
    
    // Get the values from the form inputs
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const loginSpinner = document.getElementById("loadingSpinner");
    const loadingMessage = document.getElementById("loadingMessage");
  
    console.log("🟡 Logging in with:", email);
  
    // Show the loading spinner and message
    loginSpinner.style.display = "block";
    loadingMessage.style.display = "block";
  
    try {
      // Send the login request to the server
      const res = await fetch("https://resumate-ewtu.onrender.com/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
  
      const data = await res.json();
  
      console.log("🟢 Server response:", data);
  
      // Hide the spinner and message
      loginSpinner.style.display = "none";
      loadingMessage.style.display = "none";
  
      // Check if the request was successful
      if (res.ok) {
        // Ensure the response contains the necessary data
        if (!data.token || !data.user) {
          alert("🛑 Login response missing critical data. Please try again.");
          return;
        }
  
        // Store user data and token in localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.user._id);

        // Redirect to the dashboard on successful login
        window.location.href = "dashboard.html";
      } else {
        // Show an error message from the server if login fails
        alert(data.message || "Login failed! Please check your credentials.");
      }
  
    } catch (err) {
      // Handle network or other unexpected errors
      loginSpinner.style.display = "none";
      loadingMessage.style.display = "none";
      console.error("❌ Network/login error:", err);
      alert("An error occurred during login. Please check your connection and try again.");
    }
  });
});