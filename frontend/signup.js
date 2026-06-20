document.addEventListener("DOMContentLoaded", function () {
  const signupForm = document.getElementById("signupForm");

  // Safely add the event listener to the form
  signupForm?.addEventListener("submit", async function (e) {
    e.preventDefault(); // Prevent the page from reloading
    
    // Get user input
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      // Send the signup request to the server
      const res = await fetch("https://resumate-ewtu.onrender.com/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();

      // Check if the server responded successfully
      if (res.ok) {
        alert("Signup successful! You will now be redirected to the login page.");
        window.location.href = "login.html"; // Redirect to login
      } else {
        // Show an error message from the server
        alert(data.message || "Signup failed! Please try again.");
      }
    } catch (err) {
      // Handle network or other errors
      console.error("Signup Error:", err);
      alert("Signup failed due to a network error. Please check your connection.");
    }
  });
});