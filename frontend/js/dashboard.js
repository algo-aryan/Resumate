function handleCredentialResponse(response) {
      const id_token = response.credential;
      fetch('/auth/login/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id_token: id_token }),
      })
        .then(res => res.json())
        .then(data => {
          console.log("Login response:", data);
          if (data.status === 'success') {
            window.location.reload();
          } else {
            alert('Login failed: ' + (data.message || 'Unknown error.'));
          }
        })
        .catch(error => {
          console.error('Error:', error);
          alert('An error occurred during login.');
        });
    }