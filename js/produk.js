let products = [];
let currentUser = null;
let imageData = "";

const root = document.documentElement;

const themeToggle = document.getElementById("themeToggle");

const productModal = document.getElementById("productModal");
const modalBackdrop = document.getElementById("modalBackdrop");

const openProductModalBtn = document.getElementById("openProductModalBtn");
const heroAddProductBtn = document.getElementById("heroAddProductBtn");
const emptyAddProductBtn = document.getElementById("emptyAddProductBtn");

const closeProductModalBtn = document.getElementById("closeProductModalBtn");
const cancelProductBtn = document.getElementById("cancelProductBtn");

const productForm = document.getElementById("productForm");

const productId = document.getElementById("productId");
const productName = document.getElementById("productName");
const productCategory = document.getElementById("productCategory");
const productCode = document.getElementById("productCode");
const productType = document.getElementById("productType");
const productCost = document.getElementById("productCost");
const productPrice = document.getElementById("productPrice");
const productStock = document.getElementById("productStock");
const productMinStock = document.getElementById("productMinStock");
const productDescription = document.getElementById("productDescription");
const productStatus = document.getElementById("productStatus");

const generateCodeBtn = document.getElementById("generateCodeBtn");

const productImageInput = document.getElementById("productImageInput");
const productImagePreview = document.getElementById("productImagePreview");

const productList = document.getElementById("productList");

const searchProductInput = document.getElementById("searchProductInput");
const categoryFilter = document.getElementById("categoryFilter");
const statusFilter = document.getElementById("statusFilter");

const totalProducts = document.getElementById("totalProducts");
const activeProducts = document.getElementById("activeProducts");
const lowStockProducts = document.getElementById("lowStockProducts");
const stockValue = document.getElementById("stockValue");

const productCountText = document.getElementById("productCountText");

const deleteProductBtn = document.getElementById("deleteProductBtn");

const modalTitle = document.getElementById("modalTitle");

const toast = document.getElementById("toast");

const rupiah = (value) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
};

function refreshIcons() {
  if (window.lucide) lucide.createIcons();
}

function showToast(text = "Berhasil") {
  if (!toast) return;

  const span = toast.querySelector("span");

  if (span) {
    span.textContent = text;
  }

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
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
   BARCODE
========================= */

function generateBarcode() {
  return (
    "LX" +
    Date.now()
      .toString()
      .slice(-10)
  );
}

generateCodeBtn?.addEventListener(
  "click",
  () => {
    productCode.value =
      generateBarcode();
  }
);

/* =========================
   MODAL
========================= */

function openModal() {
  productModal?.classList.add(
    "show"
  );

  refreshIcons();
}

function closeModal() {
  productModal?.classList.remove(
    "show"
  );
}

function newProduct() {
  modalTitle.textContent =
    "Tambah Produk";

  productForm.reset();

  productId.value = "";

  productCode.value =
    generateBarcode();

  productCost.value = 0;
  productPrice.value = 0;
  productStock.value = 0;
  productMinStock.value = 3;

  productStatus.value =
    "active";

  imageData = "";

  if (productImagePreview) {
    productImagePreview.src =
      "assets/luxora-logo.png";
  }

  if (deleteProductBtn) {
    deleteProductBtn.style.display =
      "none";
  }

  openModal();
}

openProductModalBtn?.addEventListener(
  "click",
  newProduct
);

heroAddProductBtn?.addEventListener(
  "click",
  newProduct
);

emptyAddProductBtn?.addEventListener(
  "click",
  newProduct
);

closeProductModalBtn?.addEventListener(
  "click",
  closeModal
);

cancelProductBtn?.addEventListener(
  "click",
  closeModal
);

modalBackdrop?.addEventListener(
  "click",
  closeModal
);

/* =========================
   IMAGE
========================= */

productImageInput?.addEventListener(
  "change",
  (event) => {
    const file =
      event.target.files[0];

    if (!file) return;

    const reader =
      new FileReader();

    reader.onload = () => {
      imageData =
        reader.result;

      productImagePreview.src =
        imageData;
    };

    reader.readAsDataURL(
      file
    );
  }
);
/* =========================
   LOAD PRODUCTS
========================= */

async function loadProducts() {
  if (!currentUser) return;

  const { data, error } =
    await supabaseClient
      .from("products")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    console.error(error);
    alert("Gagal mengambil data produk");
    return;
  }

  products = data || [];

  renderProducts();
  updateStats();
}

/* =========================
   SAVE PRODUCT
========================= */

productForm?.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    if (!currentUser) {
      alert("User belum login");
      return;
    }

    const id = productId.value;

    const payload = {
      user_id: currentUser.id,

      name:
        productName.value.trim(),

      category:
        productCategory.value ||
        "Lainnya",

      code:
        productCode.value.trim() ||
        generateBarcode(),

      type:
        productType.value ||
        "fisik",

      cost:
        Number(
          productCost.value || 0
        ),

      price:
        Number(
          productPrice.value || 0
        ),

      stock:
        Number(
          productStock.value || 0
        ),

      min_stock:
        Number(
          productMinStock.value || 0
        ),

      description:
        productDescription.value.trim(),

      status:
        productStatus.value ||
        "active",

      image:
        imageData ||
        productImagePreview.src ||
        "assets/luxora-logo.png",

      updated_at:
        new Date().toISOString(),
    };

    let result;

    if (id) {
      result =
        await supabaseClient
          .from("products")
          .update(payload)
          .eq("id", id)
          .eq("user_id", currentUser.id);
    } else {
      result =
        await supabaseClient
          .from("products")
          .insert(payload);
    }

    if (result.error) {
      console.error(result.error);
      alert(result.error.message);
      return;
    }

    showToast(
      id
        ? "Produk berhasil diperbarui"
        : "Produk berhasil ditambahkan"
    );

    closeModal();

    await loadProducts();
  }
);
/* =========================
   EDIT PRODUCT
========================= */

window.editProduct = function (id) {
  const product =
    products.find(
      (item) => item.id === id
    );

  if (!product) return;

  modalTitle.textContent =
    "Edit Produk";

  productId.value =
    product.id || "";

  productName.value =
    product.name || "";

  productCategory.value =
    product.category ||
    "Lainnya";

  productCode.value =
    product.code || "";

  productType.value =
    product.type ||
    "fisik";

  productCost.value =
    product.cost || 0;

  productPrice.value =
    product.price || 0;

  productStock.value =
    product.stock || 0;

  productMinStock.value =
    product.min_stock || 0;

  productDescription.value =
    product.description || "";

  productStatus.value =
    product.status ||
    "active";

  imageData =
    product.image || "";

  productImagePreview.src =
    product.image ||
    "assets/luxora-logo.png";

  deleteProductBtn.style.display =
    "flex";

  openModal();
};

/* =========================
   DELETE PRODUCT
========================= */

deleteProductBtn?.addEventListener(
  "click",
  async () => {
    const id =
      productId.value;

    if (!id) return;

    if (!currentUser) return;

    const confirmDelete =
      confirm(
        "Yakin ingin menghapus produk ini?"
      );

    if (!confirmDelete) {
      return;
    }

    const { error } =
      await supabaseClient
        .from("products")
        .delete()
        .eq("id", id)
        .eq(
          "user_id",
          currentUser.id
        );

    if (error) {
      alert(error.message);
      console.error(error);
      return;
    }

    showToast(
      "Produk berhasil dihapus"
    );

    closeModal();

    await loadProducts();
  }
);

/* =========================
   FILTER PRODUCT
========================= */

function getFilteredProducts() {
  let result = [...products];

  const keyword =
    (
      searchProductInput
        ?.value || ""
    )
      .toLowerCase()
      .trim();

  const category =
    categoryFilter?.value ||
    "all";

  const status =
    statusFilter?.value ||
    "all";

  if (keyword) {
    result =
      result.filter(
        (item) => {
          return (
            item.name
              ?.toLowerCase()
              .includes(
                keyword
              ) ||

            item.code
              ?.toLowerCase()
              .includes(
                keyword
              ) ||

            item.category
              ?.toLowerCase()
              .includes(
                keyword
              )
          );
        }
      );
  }

  if (category !== "all") {
    result =
      result.filter(
        (item) =>
          item.category ===
          category
      );
  }

  if (status !== "all") {
    result =
      result.filter(
        (item) =>
          item.status ===
          status
      );
  }

  return result;
}
/* =========================
   RENDER PRODUCTS
========================= */

function renderProducts() {
  const filtered =
    getFilteredProducts();

  if (productCountText) {
    productCountText.textContent =
      `${filtered.length} Produk`;
  }

  if (!productList) return;

  if (!filtered.length) {
    productList.innerHTML = `
      <div class="empty-state">
        <i data-lucide="package-open"></i>
        <h3>Belum ada produk</h3>
        <p>Tambahkan produk pertama agar halaman kasir bisa digunakan.</p>
        <button onclick="newProduct()">
          Tambah Produk
        </button>
      </div>
    `;

    refreshIcons();
    return;
  }

  productList.innerHTML =
    filtered
      .map((product) => {
        const low =
          Number(
            product.stock || 0
          ) <=
          Number(
            product.min_stock || 0
          );

        const image =
          product.image ||
          "assets/luxora-logo.png";

        const status =
          product.status ||
          "active";

        return `
          <article class="product-row">

            <div class="product-thumb">
              <img
                src="${image}"
                alt="${product.name || "Produk"}"
              >
            </div>

            <div class="product-info">
              <h4>
                ${product.name || "Tanpa Nama"}
              </h4>

              <p>
                ${product.category || "Lainnya"}
              </p>

              <div class="product-code">
                ${product.code || "-"}
              </div>
            </div>

            <div class="product-price">
              ${rupiah(product.price || 0)}
            </div>

            <div class="product-stock ${
              low ? "low" : ""
            }">
              ${product.stock || 0}
            </div>

            <div class="product-status ${status}">
              ${
                status === "active"
                  ? "Aktif"
                  : "Nonaktif"
              }
            </div>

            <div class="product-actions">
              <button
                class="edit"
                type="button"
                onclick="editProduct('${product.id}')"
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
  if (totalProducts) {
    totalProducts.textContent =
      products.length;
  }

  if (activeProducts) {
    activeProducts.textContent =
      products.filter((product) => {
        return (
          product.status ===
          "active"
        );
      }).length;
  }

  if (lowStockProducts) {
    lowStockProducts.textContent =
      products.filter((product) => {
        return (
          Number(product.stock || 0) <=
          Number(product.min_stock || 0)
        );
      }).length;
  }

  const value =
    products.reduce(
      (sum, product) => {
        return (
          sum +
          Number(product.cost || 0) *
          Number(product.stock || 0)
        );
      },
      0
    );

  if (stockValue) {
    stockValue.textContent =
      rupiah(value);
  }
}
/* =========================
   SEARCH EVENTS
========================= */

searchProductInput?.addEventListener(
  "input",
  renderProducts
);

categoryFilter?.addEventListener(
  "change",
  renderProducts
);

statusFilter?.addEventListener(
  "change",
  renderProducts
);

/* =========================
   GLOBAL FUNCTION
========================= */

window.newProduct = newProduct;

/* =========================
   INIT
========================= */

window.addEventListener(
  "load",
  async () => {
    const theme =
      localStorage.getItem(
        "luxora_theme"
      ) || "dark";

    setTheme(theme);

    const user =
      await checkAuth();

    if (!user) return;

    await loadProducts();

    refreshIcons();
  }
);