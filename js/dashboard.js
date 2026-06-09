let currentUser = null;

let products = [];
let transactions = [];
let cashiers = [];

const root = document.documentElement;

const themeToggle =
  document.getElementById(
    "themeToggle"
  );

const notificationBtn =
  document.getElementById(
    "notificationBtn"
  );

const notificationDropdown =
  document.getElementById(
    "notificationDropdown"
  );

const userMenuBtn =
  document.getElementById(
    "userMenuBtn"
  );

const userDropdown =
  document.getElementById(
    "userDropdown"
  );

const languageBtn =
  document.getElementById(
    "languageBtn"
  );

const languageOptions =
  document.getElementById(
    "languageOptions"
  );

const userPhoto =
  document.getElementById(
    "userPhoto"
  );

const dropdownPhoto =
  document.getElementById(
    "dropdownPhoto"
  );

const userName =
  document.getElementById(
    "userName"
  );

const dropdownName =
  document.getElementById(
    "dropdownName"
  );

const userEmail =
  document.getElementById(
    "userEmail"
  );

const dropdownEmail =
  document.getElementById(
    "dropdownEmail"
  );

const logoutBtn =
  document.getElementById(
    "logoutBtn"
  );

/* =========================
   DASHBOARD STATS
========================= */

const todayRevenue =
  document.getElementById(
    "todayRevenue"
  );

const todayTransactions =
  document.getElementById(
    "todayTransactions"
  );

const totalProducts =
  document.getElementById(
    "totalProducts"
  );

const lowStockProducts =
  document.getElementById(
    "lowStockProducts"
  );

const activityList =
  document.getElementById(
    "activityList"
  );

const rupiah = (number) => {
  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }
  ).format(Number(number) || 0);
};

const angka = (number) => {
  return new Intl.NumberFormat(
    "id-ID"
  ).format(Number(number) || 0);
};

function refreshIcons() {
  if (window.lucide) {
    lucide.createIcons();
  }
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
   LOAD DATA SUPABASE
========================= */

async function loadDashboardData() {
  if (!currentUser) return;

  const productsResult =
    await supabaseClient
      .from("products")
      .select("*")
      .eq("user_id", currentUser.id);

  const transactionsResult =
    await supabaseClient
      .from("transactions")
      .select(`
        *,
        transaction_items (*)
      `)
      .eq("user_id", currentUser.id)
      .order("created_at", {
        ascending: false,
      });

  const cashiersResult =
    await supabaseClient
      .from("cashiers")
      .select("*")
      .eq("user_id", currentUser.id);

  if (productsResult.error) {
    console.error(productsResult.error);
  }

  if (transactionsResult.error) {
    console.error(transactionsResult.error);
  }

  if (cashiersResult.error) {
    console.error(cashiersResult.error);
  }

  products =
    productsResult.data || [];

  cashiers =
    cashiersResult.data || [];

  transactions =
    (transactionsResult.data || []).map((trx) => {
      return {
        id: trx.id,
        code: trx.code,
        cashier: trx.cashier_name || "Kasir",
        customer: trx.customer || "Umum",
        paymentMethod: trx.payment_method || "Tunai",

        subtotal: Number(trx.subtotal || 0),
        discount: Number(trx.discount || 0),
        tax: Number(trx.tax || 0),
        grandTotal: Number(trx.grand_total || 0),
        paid: Number(trx.paid || 0),
        change: Number(trx.change || 0),

        createdAt: trx.created_at,

        items: (trx.transaction_items || []).map((item) => {
          return {
            id: item.product_id,
            code: item.product_code,
            name: item.product_name,
            qty: Number(item.qty || 0),
            price: Number(item.price || 0),
            total: Number(item.total || 0),
          };
        }),
      };
    });
}
/* =========================
   THEME DARK / LIGHT
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

    const nextTheme =
      currentTheme === "dark"
        ? "light"
        : "dark";

    setTheme(nextTheme);
  }
);

/* =========================
   USER PROFILE
========================= */

function getCurrentUser() {
  const meta =
    currentUser?.user_metadata || {};

  const session =
    JSON.parse(
      localStorage.getItem(
        "luxora_session"
      ) || "{}"
    );

  return {
    name:
      meta.owner_name ||
      meta.full_name ||
      meta.name ||
      session.name ||
      session.fullName ||
      "Luxora User",

    email:
      currentUser?.email ||
      session.email ||
      "user@email.com",

    photo:
      meta.avatar_url ||
      meta.picture ||
      session.photo ||
      "",
  };
}

function getInitial(user) {
  const source =
    user.email ||
    user.name ||
    "U";

  return source
    .trim()
    .charAt(0)
    .toUpperCase();
}

function setAvatar(element, user) {
  if (!element) return;

  if (user.photo) {
    element.innerHTML = `
      <img
        src="${user.photo}"
        alt="${user.name}"
      >
    `;
  } else {
    element.textContent =
      getInitial(user);
  }
}

function renderUserProfile() {
  const user =
    getCurrentUser();

  if (userName) {
    userName.textContent =
      user.name;
  }

  if (dropdownName) {
    dropdownName.textContent =
      user.name;
  }

  if (userEmail) {
    userEmail.textContent =
      user.email;
  }

  if (dropdownEmail) {
    dropdownEmail.textContent =
      user.email;
  }

  setAvatar(userPhoto, user);
  setAvatar(dropdownPhoto, user);
}
/* =========================
   TRANSLATION SYSTEM
========================= */

const translations = {
  id: {
    brand_subtitle: "Smart Cashier System",

    menu_dashboard: "Dashboard",
    menu_cashier: "Kasir",
    menu_products: "Produk",
    menu_transactions: "Transaksi",
    menu_reports: "Laporan",
    menu_employees: "Karyawan",
    menu_settings: "Pengaturan",

    premium_card_title: "Luxora Premium",
    premium_card_desc: "Buka fitur laporan lengkap, multi kasir, export data, dan struk custom.",
    upgrade_premium: "Upgrade Premium",

    dashboard_label: "Dashboard",
    welcome_back: "Selamat datang kembali 👋",

    notif_title: "Notifikasi",
    notif_new: "3 baru",
    notif_premium_title: "Promo Premium",
    notif_premium_desc: "Dapatkan fitur laporan lengkap dan multi kasir.",
    notif_stock_title: "Stok Menipis",
    notif_stock_desc: "Cek produk yang perlu segera di-restock.",
    notif_help_title: "Bantuan Live Chat",
    notif_help_desc: "Hubungi RANEX Service jika butuh bantuan.",

    change_language: "Ubah Bahasa",
    logout: "Keluar",

    hero_eyebrow: "RINGKASAN TOKO",
    hero_title: "Kelola penjualan lebih mudah dengan Luxora POS",
    hero_desc: "Mulai transaksi, pantau produk, cek stok, dan tingkatkan fitur bisnis lewat paket premium.",
    open_cashier: "Buka Kasir",
    see_premium: "Lihat Premium",
    free_plan: "Free Plan",
    free_plan_desc: "Upgrade untuk fitur lengkap",

    stat_revenue: "Omzet Hari Ini",
    stat_revenue_desc: "Update dari transaksi kasir",
    stat_transactions: "Transaksi",
    stat_transactions_desc: "Total transaksi hari ini",
    stat_products: "Produk",
    stat_products_desc: "Produk tersimpan",
    stat_low_stock: "Stok Menipis",
    stat_low_stock_desc: "Perlu restock",

    shortcut_title: "Shortcut Cepat",
    shortcut_desc: "Akses fitur utama Luxora POS.",
    shortcut_cashier_title: "Mulai Kasir",
    shortcut_cashier_desc: "Buat transaksi baru",
    shortcut_product_title: "Tambah Produk",
    shortcut_product_desc: "Kelola produk toko",
    shortcut_premium_title: "Upgrade Premium",
    shortcut_premium_desc: "Buka fitur lengkap",
    shortcut_help_title: "Bantuan",
    shortcut_help_desc: "Live chat RANEX Service",

    activity_title: "Aktivitas Terbaru",
    activity_desc: "Ringkasan aktivitas sistem.",
    activity_empty: "Belum ada aktivitas terbaru.",

    welcome_modal_eyebrow: "SELAMAT DATANG",
    welcome_modal_title: "Selamat datang di Luxora POS",
    welcome_modal_desc: "Nikmati pengalaman kasir modern untuk mengelola transaksi, produk, stok, dan laporan toko.",
    premium_preview_title: "Promo Paket Premium",
    premium_feature_1: "Multi kasir dan manajemen karyawan",
    premium_feature_2: "Laporan penjualan lengkap",
    premium_feature_3: "Export data transaksi",
    premium_feature_4: "Custom logo dan struk toko",
    see_more: "Lihat Selengkapnya",
    later: "Nanti Saja",
  },

  en: {
    brand_subtitle: "Smart Cashier System",
    menu_dashboard: "Dashboard",
    menu_cashier: "Cashier",
    menu_products: "Products",
    menu_transactions: "Transactions",
    menu_reports: "Reports",
    menu_employees: "Employees",
    menu_settings: "Settings",
    premium_card_title: "Luxora Premium",
    premium_card_desc: "Unlock complete reports, multi-cashier access, data export, and custom receipts.",
    upgrade_premium: "Upgrade Premium",
    dashboard_label: "Dashboard",
    welcome_back: "Welcome back 👋",
    notif_title: "Notifications",
    notif_new: "3 new",
    notif_premium_title: "Premium Promo",
    notif_premium_desc: "Get full reports and multi-cashier features.",
    notif_stock_title: "Low Stock",
    notif_stock_desc: "Check products that need restocking.",
    notif_help_title: "Live Chat Support",
    notif_help_desc: "Contact RANEX Service if you need help.",
    change_language: "Change Language",
    logout: "Logout",
    hero_eyebrow: "STORE SUMMARY",
    hero_title: "Manage sales easier with Luxora POS",
    hero_desc: "Start transactions, monitor products, check stock, and unlock business features with Premium.",
    open_cashier: "Open Cashier",
    see_premium: "See Premium",
    free_plan: "Free Plan",
    free_plan_desc: "Upgrade for complete features",
    stat_revenue: "Today Revenue",
    stat_revenue_desc: "Updated from cashier transactions",
    stat_transactions: "Transactions",
    stat_transactions_desc: "Total transactions today",
    stat_products: "Products",
    stat_products_desc: "Saved products",
    stat_low_stock: "Low Stock",
    stat_low_stock_desc: "Needs restock",
    shortcut_title: "Quick Shortcuts",
    shortcut_desc: "Access Luxora POS main features.",
    shortcut_cashier_title: "Start Cashier",
    shortcut_cashier_desc: "Create a new transaction",
    shortcut_product_title: "Add Product",
    shortcut_product_desc: "Manage store products",
    shortcut_premium_title: "Upgrade Premium",
    shortcut_premium_desc: "Unlock complete features",
    shortcut_help_title: "Support",
    shortcut_help_desc: "RANEX Service live chat",
    activity_title: "Recent Activity",
    activity_desc: "System activity summary.",
    activity_empty: "No recent activity yet.",
    welcome_modal_eyebrow: "WELCOME",
    welcome_modal_title: "Welcome to Luxora POS",
    welcome_modal_desc: "Enjoy a modern cashier experience to manage transactions, products, stock, and reports.",
    premium_preview_title: "Premium Package Promo",
    premium_feature_1: "Multi-cashier and staff management",
    premium_feature_2: "Complete sales reports",
    premium_feature_3: "Transaction data export",
    premium_feature_4: "Custom store logo and receipt",
    see_more: "See More",
    later: "Maybe Later",
  },
};
/* =========================
   APPLY LANGUAGE
========================= */

function applyLanguage(lang) {
  const dictionary =
    translations[lang] ||
    translations.id;

  document
    .querySelectorAll("[data-i18n]")
    .forEach((element) => {
      const key =
        element.dataset.i18n;

      if (!dictionary[key]) return;

      element.textContent =
        dictionary[key];
    });
}

/* =========================
   LANGUAGE SELECTOR
========================= */

languageBtn?.addEventListener(
  "click",
  (event) => {
    event.stopPropagation();

    languageOptions?.classList.toggle(
      "show"
    );
  }
);

document
  .querySelectorAll("[data-lang]")
  .forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        const lang =
          button.dataset.lang;

        localStorage.setItem(
          "luxora_language",
          lang
        );

        applyLanguage(lang);

        languageOptions?.classList.remove(
          "show"
        );
      }
    );
  });

/* =========================
   DROPDOWN
========================= */

function closeDropdowns() {
  notificationDropdown?.classList.remove(
    "show"
  );

  userDropdown?.classList.remove(
    "show"
  );

  languageOptions?.classList.remove(
    "show"
  );
}

notificationBtn?.addEventListener(
  "click",
  (event) => {
    event.stopPropagation();

    userDropdown?.classList.remove(
      "show"
    );

    notificationDropdown?.classList.toggle(
      "show"
    );
  }
);

userMenuBtn?.addEventListener(
  "click",
  (event) => {
    event.stopPropagation();

    notificationDropdown?.classList.remove(
      "show"
    );

    userDropdown?.classList.toggle(
      "show"
    );
  }
);

document.addEventListener(
  "click",
  () => {
    closeDropdowns();
  }
);

/* =========================
   LOGOUT
========================= */

logoutBtn?.addEventListener(
  "click",
  async () => {
    await supabaseClient.auth.signOut();

    localStorage.removeItem(
      "luxora_session"
    );

    localStorage.removeItem(
      "luxora_user"
    );

    window.location.href =
      "login.html";
  }
);
/* =========================
   DASHBOARD STATS
========================= */

function getTransactionDate(transaction) {
  const date =
    transaction.createdAt ||
    transaction.date;

  if (!date) return "";

  return new Date(date)
    .toLocaleDateString("id-ID");
}

function todayKey() {
  return new Date()
    .toLocaleDateString("id-ID");
}

function getTransactionTotal(transaction) {
  return Number(
    transaction.grandTotal ||
    transaction.total ||
    transaction.amount ||
    0
  );
}

function renderStats() {
  const today =
    transactions.filter((trx) => {
      return (
        getTransactionDate(trx) ===
        todayKey()
      );
    });

  const revenue =
    today.reduce((sum, trx) => {
      return (
        sum +
        getTransactionTotal(trx)
      );
    }, 0);

  const lowStock =
    products.filter((product) => {
      if (product.type === "jasa") {
        return false;
      }

      return (
        Number(product.stock || 0) <=
        Number(product.min_stock || 0)
      );
    });

  if (todayRevenue) {
    todayRevenue.textContent =
      rupiah(revenue);
  }

  if (todayTransactions) {
    todayTransactions.textContent =
      angka(today.length);
  }

  if (totalProducts) {
    totalProducts.textContent =
      angka(products.length);
  }

  if (lowStockProducts) {
    lowStockProducts.textContent =
      angka(lowStock.length);
  }
}
/* =========================
   ACTIVITY
========================= */

function renderActivities() {
  if (!activityList) return;

  const latestTransactions =
    [...transactions]
      .slice(0, 3);

  const latestProducts =
    [...products]
      .slice(0, 2);

  const activities = [];

  latestTransactions.forEach((trx) => {
    activities.push({
      icon: "receipt-text",
      title:
        trx.code || "Transaksi baru",
      text:
        `${trx.customer || "Pelanggan"} - ${rupiah(getTransactionTotal(trx))}`,
    });
  });

  latestProducts.forEach((product) => {
    activities.push({
      icon: "package",
      title:
        product.name || "Produk baru",
      text:
        "Produk tersedia di katalog Luxora POS.",
    });
  });

  if (!activities.length) {
    const lang =
      localStorage.getItem(
        "luxora_language"
      ) || "id";

    activityList.innerHTML = `
      <div
        class="activity-empty"
        data-i18n="activity_empty"
      >
        ${translations[lang]?.activity_empty || "Belum ada aktivitas terbaru."}
      </div>
    `;

    return;
  }

  activityList.innerHTML =
    activities
      .map((item) => {
        return `
          <div class="activity-item reveal-item">
            <i data-lucide="${item.icon}"></i>

            <div>
              <strong>${item.title}</strong>
              <p>${item.text}</p>
            </div>
          </div>
        `;
      })
      .join("");

  refreshIcons();
}

/* =========================
   WELCOME MODAL
========================= */

const welcomeModal =
  document.getElementById(
    "welcomeModal"
  );

const closeWelcomeBtn =
  document.getElementById(
    "closeWelcomeBtn"
  );

const laterBtn =
  document.getElementById(
    "laterBtn"
  );

function openWelcomeModal() {
  const alreadySeen =
    sessionStorage.getItem(
      "luxora_welcome_seen"
    );

  if (alreadySeen) return;

  setTimeout(() => {
    welcomeModal?.classList.add(
      "show"
    );

    sessionStorage.setItem(
      "luxora_welcome_seen",
      "true"
    );

    refreshIcons();
  }, 650);
}

function closeWelcomeModal() {
  welcomeModal?.classList.remove(
    "show"
  );
}

closeWelcomeBtn?.addEventListener(
  "click",
  closeWelcomeModal
);

laterBtn?.addEventListener(
  "click",
  closeWelcomeModal
);

welcomeModal?.addEventListener(
  "click",
  (event) => {
    if (event.target === welcomeModal) {
      closeWelcomeModal();
    }
  }
);
/* =========================
   ANIMATION
========================= */

function injectAnimationCSS() {
  const style =
    document.createElement("style");

  style.textContent = `
    .scroll-reveal{
      opacity:0;
      transform:translateY(28px) scale(.98);
      filter:blur(10px);
      transition:
        opacity .75s ease,
        transform .75s cubic-bezier(.2,.8,.2,1),
        filter .75s ease;
    }

    .scroll-reveal.show{
      opacity:1;
      transform:translateY(0) scale(1);
      filter:blur(0);
    }

    .hero-card{
      position:relative;
      overflow:hidden;
    }

    .hero-card::after{
      content:"";
      position:absolute;
      top:-120%;
      left:-40%;
      width:40%;
      height:300%;
      background:linear-gradient(
        90deg,
        transparent,
        rgba(255,255,255,.12),
        transparent
      );
      transform:rotate(24deg);
      animation:luxShine 5s ease-in-out infinite;
      pointer-events:none;
    }

    @keyframes luxShine{
      0%,55%{ left:-50%; }
      100%{ left:120%; }
    }

    .welcome-card{
      animation:modalPop .55s cubic-bezier(.2,.8,.2,1);
    }

    @keyframes modalPop{
      from{
        opacity:0;
        transform:translateY(30px) scale(.94);
        filter:blur(8px);
      }
      to{
        opacity:1;
        transform:translateY(0) scale(1);
        filter:blur(0);
      }
    }

    .dropdown.show{
      animation:dropdownIn .25s ease;
    }

    @keyframes dropdownIn{
      from{
        opacity:0;
        transform:translateY(-8px) scale(.98);
      }
      to{
        opacity:1;
        transform:translateY(0) scale(1);
      }
    }
  `;

  document.head.appendChild(style);
}

function runIntroAnimation() {
  const items =
    document.querySelectorAll(
      ".sidebar, .topbar, .hero-card, .stat-card, .panel, .premium-card"
    );

  items.forEach((item, index) => {
    item.style.opacity = "0";
    item.style.transform =
      "translateY(18px)";
    item.style.filter = "blur(8px)";

    setTimeout(() => {
      item.style.transition =
        "opacity .7s ease, transform .7s cubic-bezier(.2,.8,.2,1), filter .7s ease";

      item.style.opacity = "1";
      item.style.transform =
        "translateY(0)";
      item.style.filter = "blur(0)";
    }, index * 70);
  });
}

function setupScrollReveal() {
  const revealItems =
    document.querySelectorAll(
      ".hero-card, .stat-card, .panel, .shortcut-grid a, .activity-item"
    );

  revealItems.forEach((item) => {
    item.classList.add(
      "scroll-reveal"
    );
  });

  const observer =
    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add(
            "show"
          );

          observer.unobserve(
            entry.target
          );
        });
      },
      {
        threshold: 0.14,
      }
    );

  revealItems.forEach((item) =>
    observer.observe(item)
  );
}

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

    const savedLang =
      localStorage.getItem(
        "luxora_language"
      ) || "id";

    setTheme(savedTheme);

    const user =
      await checkAuth();

    if (!user) return;

    await loadDashboardData();

    renderUserProfile();
    applyLanguage(savedLang);

    renderStats();
    renderActivities();

    injectAnimationCSS();
    setupScrollReveal();
    runIntroAnimation();
    openWelcomeModal();

    refreshIcons();
  }
);