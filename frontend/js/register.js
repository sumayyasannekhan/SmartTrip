const registerForm = document.getElementById("registerForm");

registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
        const response = await fetch("https://smarttrip-wpja.onrender.com/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                email,
                password
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert("✅ Registration Successful!");
            window.location.href = "login.html";
        } else {
            alert(data.message);
        }

    } catch (err) {
        console.error(err);
        alert("❌ Unable to connect to server.");
    }
});