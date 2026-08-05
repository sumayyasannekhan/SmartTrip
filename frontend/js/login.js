const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
        const response = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("token", data.token);
localStorage.setItem("user", JSON.stringify(data.user));
localStorage.setItem("userId", data.user.id);

            alert("✅ Login Successful!");

            window.location.href = "planner.html";
        } else {
            alert(data.message);
        }

    } catch (err) {
        console.error(err);
        alert("❌ Unable to connect to server.");
    }
});