const loginForm = document.getElementById("loginForm");
const toggleButtons = document.querySelectorAll(".toggle-password");

const OWNER_EMAIL = "luxorapos@gmail.com";

toggleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.target);
    if (!input) return;

    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    button.textContent = isPassword ? "Sembunyi" : "Lihat";
  });
});

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value;
  const remember = document.getElementById("remember")?.checked;

  if (!email || !password) {
    alert("Email dan password wajib diisi.");
    return;
  }

  if (password.length < 6) {
    alert("Password minimal 6 karakter.");
    return;
  }

  const submitBtn = loginForm.querySelector("button[type='submit']");
  const oldText = submitBtn?.textContent;

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Masuk...";
  }

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    const user = data.user;

    const sessionData = {
      user_id: user.id,
      email: user.email,
      role: email === OWNER_EMAIL ? "owner" : "merchant",
      login_at: new Date().toISOString(),
      remember: Boolean(remember),
    };

    localStorage.setItem("luxora_session", JSON.stringify(sessionData));
    localStorage.setItem("luxora_user_email", user.email);

    if (email === OWNER_EMAIL) {
      alert("Login Owner berhasil.");
      window.location.href = "owner-dashboard.html";
    } else {
      alert("Login berhasil.");
      window.location.href = "dashboard.html";
    }
  } catch (err) {
    console.error(err);
    alert("Terjadi kesalahan saat login.");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = oldText || "Masuk";
    }
  }
});