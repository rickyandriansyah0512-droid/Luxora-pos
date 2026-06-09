let employees = [];
let currentUser = null;
let employeePhotoData = "";

const root = document.documentElement;

const themeToggle = document.getElementById("themeToggle");

const employeeModal = document.getElementById("employeeModal");
const modalBackdrop = document.getElementById("modalBackdrop");

const openEmployeeModalBtn = document.getElementById("openEmployeeModalBtn");
const heroAddEmployeeBtn = document.getElementById("heroAddEmployeeBtn");
const emptyAddEmployeeBtn = document.getElementById("emptyAddEmployeeBtn");

const closeEmployeeModalBtn = document.getElementById("closeEmployeeModalBtn");
const cancelEmployeeBtn = document.getElementById("cancelEmployeeBtn");

const employeeForm = document.getElementById("employeeForm");

const employeeId = document.getElementById("employeeId");
const employeeName = document.getElementById("employeeName");
const employeeEmail = document.getElementById("employeeEmail");
const employeePhone = document.getElementById("employeePhone");
const employeePin = document.getElementById("employeePin");
const employeeRole = document.getElementById("employeeRole");
const employeeStatus = document.getElementById("employeeStatus");
const employeeNote = document.getElementById("employeeNote");

const employeePhotoInput = document.getElementById("employeePhotoInput");
const employeePhotoPreview = document.getElementById("employeePhotoPreview");

const deleteEmployeeBtn = document.getElementById("deleteEmployeeBtn");
const modalTitle = document.getElementById("modalTitle");

const employeeSearch = document.getElementById("employeeSearch");
const roleFilter = document.getElementById("roleFilter");
const statusFilter = document.getElementById("statusFilter");

const employeeList = document.getElementById("employeeList");
const employeeCountText = document.getElementById("employeeCountText");

const totalEmployees = document.getElementById("totalEmployees");
const activeEmployees = document.getElementById("activeEmployees");
const adminCount = document.getElementById("adminCount");
const inactiveEmployees = document.getElementById("inactiveEmployees");

function refreshIcons() {
  if (window.lucide) {
    lucide.createIcons();
  }
}

function getInitial(name) {
  return (name || "K")
    .trim()
    .charAt(0)
    .toUpperCase();
}

function getRoleLabel(role) {
  const labels = {
    owner: "Owner",
    admin: "Admin",
    cashier: "Kasir",
  };

  return labels[role] || "Kasir";
}

function getStatusLabel(status) {
  return status === "active"
    ? "Aktif"
    : "Nonaktif";
}
/* =========================
   AUTH
========================= */

async function checkAuth() {
  const { data, error } =
    await supabaseClient.auth.getUser();

  if (error || !data.user) {
    alert("Silakan login terlebih dahulu");
    window.location.href = "login.html";
    return null;
  }

  currentUser = data.user;
  return data.user;
}

/* =========================
   THEME
========================= */

function setTheme(theme) {
  root.setAttribute(
    "data-theme",
    theme
  );

  localStorage.setItem(
    "luxora_theme",
    theme
  );

  const icon =
    themeToggle?.querySelector("i");

  if (icon) {
    icon.setAttribute(
      "data-lucide",
      theme === "light"
        ? "sun"
        : "moon"
    );
  }

  refreshIcons();
}

themeToggle?.addEventListener(
  "click",
  () => {
    const currentTheme =
      root.getAttribute(
        "data-theme"
      ) || "dark";

    setTheme(
      currentTheme === "dark"
        ? "light"
        : "dark"
    );
  }
);

/* =========================
   LOAD EMPLOYEES
========================= */

async function loadEmployees() {
  if (!currentUser) return;

  const { data, error } =
    await supabaseClient
      .from("cashiers")
      .select("*")
      .eq(
        "user_id",
        currentUser.id
      )
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    console.error(error);
    alert(
      "Gagal mengambil data karyawan"
    );
    return;
  }

  employees = data || [];

  renderEmployees();
  updateStats();
}

/* =========================
   MODAL
========================= */

function openModal() {
  employeeModal?.classList.add(
    "show"
  );

  refreshIcons();
}

function closeModal() {
  employeeModal?.classList.remove(
    "show"
  );
}

function newEmployee() {
  modalTitle.textContent =
    "Tambah Karyawan";

  employeeForm.reset();

  employeeId.value = "";

  employeeRole.value =
    "cashier";

  employeeStatus.value =
    "active";

  employeePhotoData = "";

  employeePhotoPreview.src =
    "assets/default-avatar.png";

  deleteEmployeeBtn.style.display =
    "none";

  openModal();
}

openEmployeeModalBtn?.addEventListener(
  "click",
  newEmployee
);

heroAddEmployeeBtn?.addEventListener(
  "click",
  newEmployee
);

emptyAddEmployeeBtn?.addEventListener(
  "click",
  newEmployee
);

closeEmployeeModalBtn?.addEventListener(
  "click",
  closeModal
);

cancelEmployeeBtn?.addEventListener(
  "click",
  closeModal
);

modalBackdrop?.addEventListener(
  "click",
  closeModal
);
/* =========================
   PHOTO
========================= */

employeePhotoInput?.addEventListener(
  "change",
  () => {
    const file =
      employeePhotoInput.files[0];

    if (!file) return;

    const reader =
      new FileReader();

    reader.onload = () => {
      employeePhotoData =
        reader.result;

      employeePhotoPreview.src =
        employeePhotoData;
    };

    reader.readAsDataURL(file);
  }
);

/* =========================
   SAVE EMPLOYEE
========================= */

employeeForm?.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    if (!currentUser) {
      alert("User belum login");
      return;
    }

    const id =
      employeeId.value;

    const payload = {
      user_id:
        currentUser.id,

      name:
        employeeName.value.trim(),

      email:
        employeeEmail.value.trim(),

      phone:
        employeePhone.value.trim(),

      pin:
        employeePin.value.trim(),

      role:
        employeeRole.value ||
        "cashier",

      status:
        employeeStatus.value ||
        "active",

      photo:
        employeePhotoData ||
        employeePhotoPreview.src ||
        "assets/default-avatar.png",

      note:
        employeeNote.value.trim(),

      updated_at:
        new Date().toISOString(),
    };

    let result;

    if (id) {
      result =
        await supabaseClient
          .from("cashiers")
          .update(payload)
          .eq("id", id)
          .eq(
            "user_id",
            currentUser.id
          );
    } else {
      result =
        await supabaseClient
          .from("cashiers")
          .insert(payload);
    }

    if (result.error) {
      console.error(result.error);
      alert(result.error.message);
      return;
    }

    closeModal();

    await loadEmployees();
  }
);
/* =========================
   EDIT EMPLOYEE
========================= */

window.editEmployee = function (id) {
  const employee =
    employees.find(
      (item) => item.id === id
    );

  if (!employee) return;

  modalTitle.textContent =
    "Edit Karyawan";

  employeeId.value =
    employee.id || "";

  employeeName.value =
    employee.name || "";

  employeeEmail.value =
    employee.email || "";

  employeePhone.value =
    employee.phone || "";

  employeePin.value =
    employee.pin || "";

  employeeRole.value =
    employee.role || "cashier";

  employeeStatus.value =
    employee.status || "active";

  employeeNote.value =
    employee.note || "";

  employeePhotoData =
    employee.photo || "";

  employeePhotoPreview.src =
    employee.photo ||
    "assets/default-avatar.png";

  deleteEmployeeBtn.style.display =
    "flex";

  openModal();
};

/* =========================
   DELETE EMPLOYEE
========================= */

deleteEmployeeBtn?.addEventListener(
  "click",
  async () => {
    const id =
      employeeId.value;

    if (!id) return;

    if (!currentUser) return;

    if (
      !confirm(
        "Yakin ingin menghapus karyawan ini?"
      )
    ) {
      return;
    }

    const { error } =
      await supabaseClient
        .from("cashiers")
        .delete()
        .eq("id", id)
        .eq(
          "user_id",
          currentUser.id
        );

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    closeModal();

    await loadEmployees();
  }
);

/* =========================
   FILTER EMPLOYEES
========================= */

function getFilteredEmployees() {
  let result = [...employees];

  const keyword =
    (
      employeeSearch?.value || ""
    )
      .toLowerCase()
      .trim();

  const role =
    roleFilter?.value || "all";

  const status =
    statusFilter?.value || "all";

  if (keyword) {
    result =
      result.filter((item) => {
        return (
          item.name
            ?.toLowerCase()
            .includes(keyword) ||

          item.email
            ?.toLowerCase()
            .includes(keyword) ||

          item.phone
            ?.toLowerCase()
            .includes(keyword)
        );
      });
  }

  if (role !== "all") {
    result =
      result.filter(
        (item) =>
          item.role === role
      );
  }

  if (status !== "all") {
    result =
      result.filter(
        (item) =>
          item.status === status
      );
  }

  return result;
}
/* =========================
   RENDER EMPLOYEES
========================= */

function renderEmployees() {
  const filtered =
    getFilteredEmployees();

  if (employeeCountText) {
    employeeCountText.textContent =
      `${filtered.length} Karyawan`;
  }

  if (!employeeList) return;

  if (!filtered.length) {
    employeeList.innerHTML = `
      <div class="empty-state">
        <i data-lucide="users"></i>
        <h3>Belum ada karyawan</h3>
        <p>Tambahkan kasir pertama untuk mulai menggunakan sistem multi user.</p>
        <button onclick="newEmployee()">
          Tambah Karyawan
        </button>
      </div>
    `;

    refreshIcons();
    return;
  }

  employeeList.innerHTML =
    filtered
      .map((employee) => {
        const hasPhoto =
          employee.photo &&
          !employee.photo.includes(
            "default-avatar.png"
          );

        return `
          <article class="employee-row">
            <div class="employee-avatar">
              ${
                hasPhoto
                  ? `<img src="${employee.photo}" alt="${employee.name}">`
                  : `<span>${getInitial(employee.name)}</span>`
              }
            </div>

            <div class="employee-info">
              <h4>
                ${employee.name || "Tanpa Nama"}
              </h4>
              <p>
                ${employee.email || "Email belum diisi"}
              </p>
            </div>

            <div class="employee-phone">
              ${employee.phone || "-"}
            </div>

            <div class="role-badge ${employee.role || "cashier"}">
              ${getRoleLabel(employee.role)}
            </div>

            <div class="status-badge ${employee.status || "active"}">
              ${getStatusLabel(employee.status)}
            </div>

            <div class="employee-actions">
              <button
                class="edit"
                type="button"
                onclick="editEmployee('${employee.id}')"
              >
                <i data-lucide="pencil"></i>
              </button>
            </div>
          </article>
        `;
      })
      .join("");

  refreshIcons();
}

/* =========================
   UPDATE STATS
========================= */

function updateStats() {
  if (totalEmployees) {
    totalEmployees.textContent =
      employees.length;
  }

  if (activeEmployees) {
    activeEmployees.textContent =
      employees.filter((item) => {
        return item.status === "active";
      }).length;
  }

  if (adminCount) {
    adminCount.textContent =
      employees.filter((item) => {
        return item.role === "admin";
      }).length;
  }

  if (inactiveEmployees) {
    inactiveEmployees.textContent =
      employees.filter((item) => {
        return item.status === "inactive";
      }).length;
  }
}
/* =========================
   SEARCH EVENTS
========================= */

employeeSearch?.addEventListener(
  "input",
  renderEmployees
);

roleFilter?.addEventListener(
  "change",
  renderEmployees
);

statusFilter?.addEventListener(
  "change",
  renderEmployees
);

/* =========================
   ANIMATION
========================= */

function injectAnimationCSS() {
  const style =
    document.createElement("style");

  style.textContent = `
    .employee-header,
    .hero-card,
    .stat-card,
    .employee-tools,
    .employee-panel{
      animation: fadeUp .6s cubic-bezier(.2,.8,.2,1) both;
    }

    .hero-card{animation-delay:.05s;}
    .stat-card:nth-child(1){animation-delay:.08s;}
    .stat-card:nth-child(2){animation-delay:.12s;}
    .stat-card:nth-child(3){animation-delay:.16s;}
    .stat-card:nth-child(4){animation-delay:.20s;}
    .employee-tools{animation-delay:.24s;}
    .employee-panel{animation-delay:.28s;}

    @keyframes fadeUp{
      from{
        opacity:0;
        transform:translateY(16px);
        filter:blur(8px);
      }
      to{
        opacity:1;
        transform:translateY(0);
        filter:blur(0);
      }
    }
  `;

  document.head.appendChild(style);
}

/* =========================
   GLOBAL FUNCTION
========================= */

window.newEmployee = newEmployee;

/* =========================
   INIT
========================= */

window.addEventListener(
  "load",
  async () => {
    const savedTheme =
      localStorage.getItem(
        "luxora_theme"
      ) || "dark";

    setTheme(savedTheme);

    const user =
      await checkAuth();

    if (!user) return;

    await loadEmployees();

    injectAnimationCSS();
    refreshIcons();
  }
);