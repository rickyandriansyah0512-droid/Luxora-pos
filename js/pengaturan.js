let currentUser = null;
let currentLogo = "assets/luxora-logo.png";
let currentSettingsId = null;

const root = document.documentElement;

const themeToggle = document.getElementById("themeToggle");
const settingsForm = document.getElementById("settingsForm");
const saveSettingsTopBtn = document.getElementById("saveSettingsTopBtn");
const resetSettingsBtn = document.getElementById("resetSettingsBtn");
const toast = document.getElementById("toast");

const storeLogoInput = document.getElementById("storeLogoInput");
const storeLogoPreview = document.getElementById("storeLogoPreview");

const storeName = document.getElementById("storeName");
const ownerName = document.getElementById("ownerName");
const storeEmail = document.getElementById("storeEmail");
const storeWhatsapp = document.getElementById("storeWhatsapp");
const storeWebsite = document.getElementById("storeWebsite");
const storeNpwp = document.getElementById("storeNpwp");
const storeAddress = document.getElementById("storeAddress");

const receiptSize = document.getElementById("receiptSize");
const defaultCashier = document.getElementById("defaultCashier");
const showLogo = document.getElementById("showLogo");
const showCashier = document.getElementById("showCashier");
const showCustomer = document.getElementById("showCustomer");
const showFooter = document.getElementById("showFooter");
const receiptFooter = document.getElementById("receiptFooter");

const taxEnabled = document.getElementById("taxEnabled");
const defaultTax = document.getElementById("defaultTax");
const discountEnabled = document.getElementById("discountEnabled");
const defaultDiscount = document.getElementById("defaultDiscount");

const defaultTheme = document.getElementById("defaultTheme");
const appLanguage = document.getElementById("appLanguage");
const currency = document.getElementById("currency");
const timezone = document.getElementById("timezone");

const exportDataBtn = document.getElementById("exportDataBtn");
const importDataInput = document.getElementById("importDataInput");
const resetDataBtn = document.getElementById("resetDataBtn");

const adminPin = document.getElementById("adminPin");
const autoLogout = document.getElementById("autoLogout");

const previewLogo = document.getElementById("previewLogo");
const previewStoreName = document.getElementById("previewStoreName");
const previewAddress = document.getElementById("previewAddress");
const previewCashier = document.getElementById("previewCashier");
const previewFooter = document.getElementById("previewFooter");

function refreshIcons() {
  if (window.lucide) lucide.createIcons();
}

function showToast(message = "Pengaturan berhasil disimpan.") {
  if (!toast) return;

  const text = toast.querySelector("span");
  if (text) text.textContent = message;

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
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
  root.setAttribute("data-theme", theme);

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

  if (defaultTheme) {
    defaultTheme.value = theme;
  }

  refreshIcons();
}

themeToggle?.addEventListener(
  "click",
  () => {
    const current =
      root.getAttribute(
        "data-theme"
      ) || "dark";

    setTheme(
      current === "dark"
        ? "light"
        : "dark"
    );
  }
);

/* =========================
   DEFAULT SETTINGS
========================= */

function getDefaultSettings() {
  return {
    logo: "assets/luxora-logo.png",

    storeName: "Luxora Store",
    ownerName: "",
    email: currentUser?.email || "",
    whatsapp: "085179972565",
    website: "",
    npwp: "",
    address: "Alamat toko belum diatur",

    receiptSize: "80mm",
    defaultCashier: "Kasir",
    showLogo: true,
    showCashier: true,
    showCustomer: true,
    showFooter: true,
    footer: "Terima kasih sudah berbelanja",

    taxEnabled: false,
    tax: 0,
    discountEnabled: false,
    discount: 0,

    theme:
      localStorage.getItem(
        "luxora_theme"
      ) || "dark",

    language:
      localStorage.getItem(
        "luxora_language"
      ) || "id",

    currency: "IDR",
    timezone: "Asia/Jakarta",

    adminPin: "",
    autoLogout: "off",
  };
}
/* =========================
   LOAD SETTINGS FROM SUPABASE
========================= */

async function loadSettings() {
  if (!currentUser) return getDefaultSettings();

  const { data, error } =
    await supabaseClient
      .from("store_settings")
      .select("*")
      .eq("user_id", currentUser.id)
      .maybeSingle();

  if (error) {
    console.error(error);
    return getDefaultSettings();
  }

  if (!data) {
    return getDefaultSettings();
  }

  currentSettingsId = data.id;

  const extra =
    data.settings || {};

  return {
    ...getDefaultSettings(),

    logo:
      data.store_logo ||
      extra.logo ||
      "assets/luxora-logo.png",

    storeName:
      data.store_name ||
      "Luxora Store",

    ownerName:
      data.owner_name ||
      "",

    email:
      data.store_email ||
      currentUser.email ||
      "",

    whatsapp:
      data.store_whatsapp ||
      "085179972565",

    website:
      extra.website || "",

    npwp:
      extra.npwp || "",

    address:
      data.store_address ||
      "Alamat toko belum diatur",

    receiptSize:
      data.receipt_size ||
      "80mm",

    defaultCashier:
      extra.defaultCashier ||
      "Kasir",

    showLogo:
      extra.showLogo ?? true,

    showCashier:
      extra.showCashier ?? true,

    showCustomer:
      extra.showCustomer ?? true,

    showFooter:
      extra.showFooter ?? true,

    footer:
      data.receipt_footer ||
      "Terima kasih sudah berbelanja",

    taxEnabled:
      Number(data.default_tax || 0) > 0,

    tax:
      Number(data.default_tax || 0),

    discountEnabled:
      Number(data.default_discount || 0) > 0,

    discount:
      Number(data.default_discount || 0),

    theme:
      extra.theme ||
      localStorage.getItem("luxora_theme") ||
      "dark",

    language:
      extra.language ||
      localStorage.getItem("luxora_language") ||
      "id",

    currency:
      extra.currency ||
      "IDR",

    timezone:
      extra.timezone ||
      "Asia/Jakarta",

    adminPin:
      extra.adminPin || "",

    autoLogout:
      extra.autoLogout || "off",
  };
}
/* =========================
   FILL FORM
========================= */

async function fillForm() {
  const data =
    await loadSettings();

  currentLogo =
    data.logo ||
    "assets/luxora-logo.png";

  if (storeLogoPreview) {
    storeLogoPreview.src =
      currentLogo;
  }

  if (previewLogo) {
    previewLogo.src =
      currentLogo;
  }

  storeName.value =
    data.storeName || "";

  ownerName.value =
    data.ownerName || "";

  storeEmail.value =
    data.email || "";

  storeWhatsapp.value =
    data.whatsapp || "";

  storeWebsite.value =
    data.website || "";

  storeNpwp.value =
    data.npwp || "";

  storeAddress.value =
    data.address || "";

  receiptSize.value =
    data.receiptSize || "80mm";

  defaultCashier.value =
    data.defaultCashier || "Kasir";

  showLogo.checked =
    !!data.showLogo;

  showCashier.checked =
    !!data.showCashier;

  showCustomer.checked =
    !!data.showCustomer;

  showFooter.checked =
    !!data.showFooter;

  receiptFooter.value =
    data.footer || "";

  taxEnabled.checked =
    !!data.taxEnabled;

  defaultTax.value =
    data.tax || 0;

  discountEnabled.checked =
    !!data.discountEnabled;

  defaultDiscount.value =
    data.discount || 0;

  defaultTheme.value =
    data.theme || "dark";

  appLanguage.value =
    data.language || "id";

  currency.value =
    data.currency || "IDR";

  timezone.value =
    data.timezone ||
    "Asia/Jakarta";

  adminPin.value =
    data.adminPin || "";

  autoLogout.value =
    data.autoLogout || "off";

  updatePreview();
}

/* =========================
   PREVIEW
========================= */

function updatePreview() {
  const name =
    storeName.value.trim() ||
    "Luxora Store";

  const address =
    storeAddress.value.trim() ||
    "Alamat toko belum diatur";

  const cashier =
    defaultCashier.value.trim() ||
    "Kasir";

  const footer =
    receiptFooter.value.trim() ||
    "Terima kasih sudah berbelanja";

  previewLogo.src =
    currentLogo;

  previewLogo.style.display =
    showLogo.checked
      ? "inline-block"
      : "none";

  previewStoreName.textContent =
    name;

  previewAddress.textContent =
    address;

  previewCashier.textContent =
    showCashier.checked
      ? cashier
      : "-";

  previewFooter.textContent =
    footer;

  previewFooter.style.display =
    showFooter.checked
      ? "block"
      : "none";

  if (storeLogoPreview) {
    storeLogoPreview.src =
      currentLogo;
  }
}

[
  storeName,
  storeAddress,
  defaultCashier,
  receiptFooter,
  showLogo,
  showCashier,
  showCustomer,
  showFooter,
].forEach((el) => {
  el?.addEventListener(
    "input",
    updatePreview
  );

  el?.addEventListener(
    "change",
    updatePreview
  );
});

/* =========================
   LOGO UPLOAD
========================= */

storeLogoInput?.addEventListener(
  "change",
  () => {
    const file =
      storeLogoInput.files?.[0];

    if (!file) return;

    const reader =
      new FileReader();

    reader.onload = () => {
      currentLogo =
        reader.result;

      updatePreview();
    };

    reader.readAsDataURL(file);
  }
);
/* =========================
   COLLECT DATA
========================= */

function collectSettings() {
  return {
    logo:
      currentLogo,

    storeName:
      storeName.value.trim() ||
      "Luxora Store",

    ownerName:
      ownerName.value.trim(),

    email:
      storeEmail.value.trim(),

    whatsapp:
      storeWhatsapp.value.trim(),

    website:
      storeWebsite.value.trim(),

    npwp:
      storeNpwp.value.trim(),

    address:
      storeAddress.value.trim() ||
      "Alamat toko belum diatur",

    receiptSize:
      receiptSize.value ||
      "80mm",

    defaultCashier:
      defaultCashier.value.trim() ||
      "Kasir",

    showLogo:
      showLogo.checked,

    showCashier:
      showCashier.checked,

    showCustomer:
      showCustomer.checked,

    showFooter:
      showFooter.checked,

    footer:
      receiptFooter.value.trim() ||
      "Terima kasih sudah berbelanja",

    taxEnabled:
      taxEnabled.checked,

    tax:
      Number(defaultTax.value || 0),

    discountEnabled:
      discountEnabled.checked,

    discount:
      Number(defaultDiscount.value || 0),

    theme:
      defaultTheme.value ||
      "dark",

    language:
      appLanguage.value ||
      "id",

    currency:
      currency.value ||
      "IDR",

    timezone:
      timezone.value ||
      "Asia/Jakarta",

    adminPin:
      adminPin.value.trim(),

    autoLogout:
      autoLogout.value ||
      "off",
  };
}

/* =========================
   SAVE TO SUPABASE
========================= */

async function saveSettings(data) {
  if (!currentUser) return;

  const payload = {
    user_id:
      currentUser.id,

    store_name:
      data.storeName,

    owner_name:
      data.ownerName,

    store_email:
      data.email,

    store_whatsapp:
      data.whatsapp,

    store_address:
      data.address,

    store_logo:
      data.logo,

    receipt_size:
      data.receiptSize,

    receipt_footer:
      data.footer,

    default_tax:
      data.taxEnabled
        ? data.tax
        : 0,

    default_discount:
      data.discountEnabled
        ? data.discount
        : 0,

    settings: {
      website:
        data.website,

      npwp:
        data.npwp,

      defaultCashier:
        data.defaultCashier,

      showLogo:
        data.showLogo,

      showCashier:
        data.showCashier,

      showCustomer:
        data.showCustomer,

      showFooter:
        data.showFooter,

      theme:
        data.theme,

      language:
        data.language,

      currency:
        data.currency,

      timezone:
        data.timezone,

      adminPin:
        data.adminPin,

      autoLogout:
        data.autoLogout,
    },

    updated_at:
      new Date().toISOString(),
  };

  let result;

  if (currentSettingsId) {
    result =
      await supabaseClient
        .from("store_settings")
        .update(payload)
        .eq("id", currentSettingsId)
        .eq("user_id", currentUser.id);
  } else {
    result =
      await supabaseClient
        .from("store_settings")
        .insert(payload)
        .select()
        .single();
  }

  if (result.error) {
    console.error(result.error);
    alert(result.error.message);
    return false;
  }

  if (!currentSettingsId && result.data) {
    currentSettingsId =
      result.data.id;
  }

  localStorage.setItem(
    "luxora_theme",
    data.theme
  );

  localStorage.setItem(
    "luxora_language",
    data.language
  );

  return true;
}
/* =========================
   SAVE
========================= */

async function handleSaveSettings() {
  const data =
    collectSettings();

  const success =
    await saveSettings(data);

  if (!success) return;

  setTheme(data.theme);

  localStorage.setItem(
    "luxora_language",
    data.language
  );

  updatePreview();

  showToast(
    "Pengaturan berhasil disimpan."
  );
}

settingsForm?.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    await handleSaveSettings();
  }
);

saveSettingsTopBtn?.addEventListener(
  "click",
  async () => {
    await handleSaveSettings();
  }
);

defaultTheme?.addEventListener(
  "change",
  () => {
    setTheme(
      defaultTheme.value
    );
  }
);

/* =========================
   RESET SETTINGS
========================= */

resetSettingsBtn?.addEventListener(
  "click",
  async () => {
    if (
      !confirm(
        "Reset pengaturan ke default?"
      )
    ) {
      return;
    }

    const data =
      getDefaultSettings();

    currentLogo =
      data.logo;

    storeName.value =
      data.storeName;

    ownerName.value =
      data.ownerName;

    storeEmail.value =
      data.email;

    storeWhatsapp.value =
      data.whatsapp;

    storeWebsite.value =
      data.website;

    storeNpwp.value =
      data.npwp;

    storeAddress.value =
      data.address;

    receiptSize.value =
      data.receiptSize;

    defaultCashier.value =
      data.defaultCashier;

    showLogo.checked =
      data.showLogo;

    showCashier.checked =
      data.showCashier;

    showCustomer.checked =
      data.showCustomer;

    showFooter.checked =
      data.showFooter;

    receiptFooter.value =
      data.footer;

    taxEnabled.checked =
      data.taxEnabled;

    defaultTax.value =
      data.tax;

    discountEnabled.checked =
      data.discountEnabled;

    defaultDiscount.value =
      data.discount;

    defaultTheme.value =
      data.theme;

    appLanguage.value =
      data.language;

    currency.value =
      data.currency;

    timezone.value =
      data.timezone;

    adminPin.value =
      data.adminPin;

    autoLogout.value =
      data.autoLogout;

    updatePreview();

    showToast(
      "Form berhasil direset."
    );
  }
);
/* =========================
   BACKUP EXPORT SUPABASE
========================= */

async function exportBackup() {
  if (!currentUser) return;

  const [
    settingsResult,
    productsResult,
    transactionsResult,
    itemsResult,
    cashiersResult,
  ] = await Promise.all([
    supabaseClient
      .from("store_settings")
      .select("*")
      .eq("user_id", currentUser.id),

    supabaseClient
      .from("products")
      .select("*")
      .eq("user_id", currentUser.id),

    supabaseClient
      .from("transactions")
      .select("*")
      .eq("user_id", currentUser.id),

    supabaseClient
      .from("transaction_items")
      .select("*")
      .eq("user_id", currentUser.id),

    supabaseClient
      .from("cashiers")
      .select("*")
      .eq("user_id", currentUser.id),
  ]);

  const backup = {
    app: "Luxora POS",
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    settings: settingsResult.data || [],
    products: productsResult.data || [],
    transactions: transactionsResult.data || [],
    transaction_items: itemsResult.data || [],
    cashiers: cashiersResult.data || [],
  };

  const blob = new Blob(
    [JSON.stringify(backup, null, 2)],
    {
      type: "application/json",
    }
  );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;

  link.download =
    `luxora-backup-${Date.now()}.json`;

  link.click();

  URL.revokeObjectURL(url);

  showToast(
    "Backup berhasil diexport."
  );
}

exportDataBtn?.addEventListener(
  "click",
  exportBackup
);

/* =========================
   IMPORT BACKUP
========================= */

importDataInput?.addEventListener(
  "change",
  () => {
    const file =
      importDataInput.files?.[0];

    if (!file) return;

    alert(
      "Import backup Supabase belum diaktifkan demi keamanan data. Gunakan Export dulu untuk cadangan."
    );

    importDataInput.value = "";
  }
);
/* =========================
   RESET ALL DATA SUPABASE
========================= */

resetDataBtn?.addEventListener(
  "click",
  async () => {
    if (!currentUser) return;

    const confirmText = prompt(
      "Ketik RESET untuk menghapus semua produk transaksi karyawan dan pengaturan."
    );

    if (confirmText !== "RESET") {
      return;
    }

    await supabaseClient
      .from("transaction_items")
      .delete()
      .eq("user_id", currentUser.id);

    await supabaseClient
      .from("transactions")
      .delete()
      .eq("user_id", currentUser.id);

    await supabaseClient
      .from("products")
      .delete()
      .eq("user_id", currentUser.id);

    await supabaseClient
      .from("cashiers")
      .delete()
      .eq("user_id", currentUser.id);

    await supabaseClient
      .from("store_settings")
      .delete()
      .eq("user_id", currentUser.id);

    currentSettingsId = null;
    currentLogo = "assets/luxora-logo.png";

    await fillForm();

    setTheme("dark");

    showToast(
      "Semua data berhasil direset."
    );
  }
);

/* =========================
   INIT
========================= */

window.addEventListener(
  "load",
  async () => {
    const user =
      await checkAuth();

    if (!user) return;

    await fillForm();

    const savedTheme =
      defaultTheme?.value ||
      localStorage.getItem(
        "luxora_theme"
      ) ||
      "dark";

    setTheme(savedTheme);

    refreshIcons();
  }
);