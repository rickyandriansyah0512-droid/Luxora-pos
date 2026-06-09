const registerForm = document.getElementById("registerForm");

const ownerNameInput = document.getElementById("ownerName");
const businessNameInput = document.getElementById("businessName");
const businessTypeInput = document.getElementById("businessType");
const emailInput = document.getElementById("email");
const whatsappInput = document.getElementById("whatsapp");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const agreeInput = document.getElementById("agree");

function showMessage(message) {
  alert(message);
}

document.querySelectorAll(".toggle-password").forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = button.dataset.target;
    const input = document.getElementById(targetId);

    if (!input) return;

    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    button.textContent = isPassword ? "Sembunyi" : "Lihat";
  });
});

registerForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const ownerName = ownerNameInput.value.trim();
  const businessName = businessNameInput.value.trim();
  const businessType = businessTypeInput.value;
  const email = emailInput.value.trim();
  const whatsapp = whatsappInput.value.trim();
  const password = passwordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();

  if (
    !ownerName ||
    !businessName ||
    !businessType ||
    !email ||
    !whatsapp ||
    !password ||
    !confirmPassword
  ) {
    showMessage("Semua data wajib diisi.");
    return;
  }

  if (!agreeInput.checked) {
    showMessage("Kamu harus menyetujui syarat penggunaan.");
    return;
  }

  if (password.length < 6) {
    showMessage("Password minimal 6 karakter.");
    return;
  }

  if (password !== confirmPassword) {
    showMessage("Konfirmasi password tidak sama.");
    return;
  }

  const submitBtn = registerForm.querySelector("button[type='submit']");
  const oldText = submitBtn?.textContent;

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Mendaftarkan...";
  }

  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          owner_name: ownerName,
          business_name: businessName,
          business_type: businessType,
          whatsapp,
        },
      },
    });

    if (error) {
      showMessage(error.message);
      return;
    }

    const user = data.user;

    if (user) {
      await supabaseClient.from("store_settings").insert({
        user_id: user.id,
        store_name: businessName,
        owner_name: ownerName,
        store_email: email,
        store_whatsapp: whatsapp,
        store_address: "",
        receipt_size: "80mm",
        receipt_footer: "Terima kasih sudah berbelanja",
        settings: {
          business_type: businessType,
        },
      });
    }

    localStorage.setItem("luxora_user_name", ownerName);
    localStorage.setItem("luxora_store_name", businessName);
    localStorage.setItem("luxora_user_email", email);

    showMessage("Akun berhasil dibuat. Silakan login.");

    window.location.href = "login.html";
  } catch (err) {
    showMessage("Terjadi kesalahan saat daftar.");
    console.error(err);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = oldText || "Daftar Sekarang";
    }
  }
});