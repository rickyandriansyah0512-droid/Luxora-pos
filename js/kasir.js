let products = [];
let cashiers = [];
let cart = [];
let currentUser = null;
let selectedCategory = "all";
let paymentMethod = "Tunai";

const root = document.documentElement;

const themeToggle = document.getElementById("themeToggle");
const shiftTime = document.getElementById("shiftTime");

const searchProduct = document.getElementById("searchProduct");
const barcodeInput = document.getElementById("barcodeInput");
const productGrid = document.getElementById("productGrid");
const productCounter = document.getElementById("productCounter");

const openCartBtn = document.getElementById("openCartBtn");
const openPaymentBtn = document.getElementById("openPaymentBtn");
const cartDrawer = document.getElementById("cartDrawer");
const drawerOverlay = document.getElementById("drawerOverlay");
const closeCartBtn = document.getElementById("closeCartBtn");
const drawerPaymentBtn = document.getElementById("drawerPaymentBtn");

const paymentModal = document.getElementById("paymentModal");
const paymentBackdrop = document.getElementById("paymentBackdrop");
const closePaymentBtn = document.getElementById("closePaymentBtn");

const customerName = document.getElementById("customerName");
const noteNumber = document.getElementById("noteNumber");
const cashierSelect = document.getElementById("cashierSelect");
const cartItems = document.getElementById("cartItems");
const clearCartBtn = document.getElementById("clearCartBtn");

const cartBadge = document.getElementById("cartBadge");
const bottomTotal = document.getElementById("bottomTotal");
const bottomItems = document.getElementById("bottomItems");

const totalItemsText = document.getElementById("totalItemsText");
const subtotalText = document.getElementById("subtotalText");
const manualDiscount = document.getElementById("manualDiscount");
const taxPercent = document.getElementById("taxPercent");
const discountText = document.getElementById("discountText");
const taxText = document.getElementById("taxText");
const grandTotalText = document.getElementById("grandTotalText");
const paidAmount = document.getElementById("paidAmount");
const changeText = document.getElementById("changeText");
const payBtn = document.getElementById("payBtn");

const receiptModal = document.getElementById("receiptModal");
const receiptPreview = document.getElementById("receiptPreview");
const printArea = document.getElementById("printArea");
const closeReceiptBtn = document.getElementById("closeReceiptBtn");
const backToCartBtn = document.getElementById("backToCartBtn");
const printReceiptBtn = document.getElementById("printReceiptBtn");

const rupiah = (number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(number) || 0);
};

const angka = (number) => {
  return new Intl.NumberFormat("id-ID").format(Number(number) || 0);
};

function refreshIcons() {
  if (window.lucide) lucide.createIcons();
}

function generateCode() {
  return `LX-${Date.now().toString().slice(-8)}`;
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
  localStorage.setItem("luxora_theme", theme);

  const icon =
    themeToggle?.querySelector("i");

  if (icon) {
    icon.setAttribute(
      "data-lucide",
      theme === "light" ? "sun" : "moon"
    );
  }

  refreshIcons();
}

themeToggle?.addEventListener("click", () => {
  const current =
    root.getAttribute("data-theme") || "dark";

  setTheme(
    current === "dark" ? "light" : "dark"
  );
});

/* =========================
   SETTINGS
========================= */

async function getStoreSettings() {
  if (!currentUser) {
    return {
      logo: "assets/luxora-logo.png",
      storeName: "Luxora Store",
      address: "Alamat toko belum diatur",
      footer: "Terima kasih sudah berbelanja",
      tax: 0,
    };
  }

  const { data, error } =
    await supabaseClient
      .from("store_settings")
      .select("*")
      .eq("user_id", currentUser.id)
      .maybeSingle();

  if (error || !data) {
    return {
      logo: "assets/luxora-logo.png",
      storeName: "Luxora Store",
      address: "Alamat toko belum diatur",
      footer: "Terima kasih sudah berbelanja",
      tax: 0,
    };
  }

  return {
    logo:
      data.store_logo ||
      "assets/luxora-logo.png",

    storeName:
      data.store_name ||
      "Luxora Store",

    address:
      data.store_address ||
      "Alamat toko belum diatur",

    footer:
      data.receipt_footer ||
      "Terima kasih sudah berbelanja",

    tax:
      Number(data.default_tax || 0),
  };
}

/* =========================
   TIME
========================= */

function updateTime() {
  if (!shiftTime) return;

  const now = new Date();

  shiftTime.textContent =
    now.toLocaleString("id-ID", {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
}

function setNoteNumber() {
  if (noteNumber) {
    noteNumber.value = generateCode();
  }
}
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
    alert("Gagal mengambil produk");
    return;
  }

  products = data || [];
  renderProducts();
}

/* =========================
   LOAD CASHIERS
========================= */

async function loadCashiers() {
  if (!currentUser) return;
  if (!cashierSelect) return;

  const { data, error } =
    await supabaseClient
      .from("cashiers")
      .select("*")
      .eq("user_id", currentUser.id)
      .eq("status", "active")
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    console.error(error);

    cashierSelect.innerHTML = `
      <option value="Kasir">
        Kasir Umum
      </option>
    `;

    return;
  }

  cashiers = data || [];

  if (!cashiers.length) {
    cashierSelect.innerHTML = `
      <option value="Kasir">
        Kasir Umum
      </option>
    `;
    return;
  }

  cashierSelect.innerHTML =
    cashiers
      .map((cashier) => {
        return `
          <option value="${cashier.name}">
            ${cashier.name} - ${cashier.role}
          </option>
        `;
      })
      .join("");
}

/* =========================
   DRAWER & MODAL
========================= */

function openCartDrawer() {
  cartDrawer?.classList.add("show");
  refreshIcons();
}

function closeCartDrawer() {
  cartDrawer?.classList.remove("show");
}

function openPaymentModal() {
  if (!cart.length) {
    alert("Keranjang masih kosong.");
    return;
  }

  paymentModal?.classList.add("show");
  updateSummary();
  refreshIcons();
}

function closePaymentModal() {
  paymentModal?.classList.remove("show");
}

openCartBtn?.addEventListener(
  "click",
  openCartDrawer
);

closeCartBtn?.addEventListener(
  "click",
  closeCartDrawer
);

drawerOverlay?.addEventListener(
  "click",
  closeCartDrawer
);

openPaymentBtn?.addEventListener(
  "click",
  openPaymentModal
);

drawerPaymentBtn?.addEventListener(
  "click",
  () => {
    closeCartDrawer();
    openPaymentModal();
  }
);

closePaymentBtn?.addEventListener(
  "click",
  closePaymentModal
);

paymentBackdrop?.addEventListener(
  "click",
  closePaymentModal
);
/* =========================
   PRODUCT HELPERS
========================= */

function getProductPrice(product) {
  return Number(
    product.price ||
    product.sellPrice ||
    product.harga ||
    0
  );
}

function getProductImage(product) {
  return (
    product.image ||
    product.photo ||
    "assets/luxora-logo.png"
  );
}

function getProductStockText(product) {
  if (product.type === "jasa") {
    return "Jasa";
  }

  return `Stok ${Number(product.stock || 0)}`;
}

function getActiveProducts() {
  return products.filter((product) => {
    return product.status !== "inactive";
  });
}

/* =========================
   RENDER PRODUCTS
========================= */

function renderProducts() {
  if (!productGrid) return;

  const keyword =
    (searchProduct?.value || "")
      .toLowerCase()
      .trim();

  const barcode =
    (barcodeInput?.value || "")
      .toLowerCase()
      .trim();

  let filtered = getActiveProducts();

  if (selectedCategory !== "all") {
    filtered = filtered.filter((product) => {
      return product.category === selectedCategory;
    });
  }

  if (keyword) {
    filtered = filtered.filter((product) => {
      return (
        product.name?.toLowerCase().includes(keyword) ||
        product.code?.toLowerCase().includes(keyword) ||
        product.category?.toLowerCase().includes(keyword)
      );
    });
  }

  if (barcode) {
    filtered = filtered.filter((product) => {
      return product.code?.toLowerCase().includes(barcode);
    });
  }

  if (productCounter) {
    productCounter.textContent =
      `${angka(filtered.length)} Produk`;
  }

  if (!filtered.length) {
    productGrid.innerHTML = `
      <div class="empty-product">
        <i data-lucide="package-open"></i>
        <h3>Produk tidak ditemukan</h3>
        <p>Tambahkan produk atau ubah kata pencarian.</p>
        <a href="produk.html">Tambah Produk</a>
      </div>
    `;

    refreshIcons();
    return;
  }

  productGrid.innerHTML =
    filtered
      .map((product) => {
        const price =
          getProductPrice(product);

        const image =
          getProductImage(product);

        const stock =
          getProductStockText(product);

        return `
          <article
            class="product-card"
            onclick="addToCart('${product.id}')"
          >
            <div class="product-img">
              <img
                src="${image}"
                alt="${product.name || "Produk"}"
              >
            </div>

            <h4>${product.name || "Produk"}</h4>
            <p>${product.category || "Umum"} • ${stock}</p>

            <div class="product-card-bottom">
              <strong>${rupiah(price)}</strong>

              <button
                class="add-btn"
                type="button"
                onclick="event.stopPropagation(); addToCart('${product.id}')"
              >
                +
              </button>
            </div>
          </article>
        `;
      })
      .join("");

  refreshIcons();
}

/* =========================
   PRODUCT EVENTS
========================= */

searchProduct?.addEventListener(
  "input",
  renderProducts
);

barcodeInput?.addEventListener(
  "input",
  renderProducts
);

document
  .querySelectorAll(".category-btn")
  .forEach((button) => {
    button.addEventListener("click", () => {
      document
        .querySelectorAll(".category-btn")
        .forEach((btn) => {
          btn.classList.remove("active");
        });

      button.classList.add("active");

      selectedCategory =
        button.dataset.category || "all";

      renderProducts();
    });
  });
  /* =========================
   CART
========================= */

window.addToCart = (id) => {
  const product = products.find((item) => {
    return String(item.id) === String(id);
  });

  if (!product) return;

  if (
    product.type !== "jasa" &&
    Number(product.stock || 0) <= 0
  ) {
    alert("Stok produk ini habis.");
    return;
  }

  const existing = cart.find((item) => {
    return String(item.id) === String(id);
  });

  if (existing) {
    const productStock =
      Number(product.stock || 0);

    if (
      product.type !== "jasa" &&
      existing.qty + 1 > productStock
    ) {
      alert("Qty melebihi stok produk.");
      return;
    }

    existing.qty += 1;
  } else {
    cart.push({
      id: product.id,
      code: product.code || "-",
      name: product.name || "Produk",
      price: getProductPrice(product),
      type: product.type || "fisik",
      qty: 1,
    });
  }

  renderCart();
};

window.increaseQty = (id) => {
  const item = cart.find((cartItem) => {
    return String(cartItem.id) === String(id);
  });

  if (!item) return;

  const product = products.find((productItem) => {
    return String(productItem.id) === String(id);
  });

  if (
    product &&
    product.type !== "jasa" &&
    item.qty + 1 > Number(product.stock || 0)
  ) {
    alert("Qty melebihi stok produk.");
    return;
  }

  item.qty += 1;
  renderCart();
};

window.decreaseQty = (id) => {
  const item = cart.find((cartItem) => {
    return String(cartItem.id) === String(id);
  });

  if (!item) return;

  item.qty -= 1;

  if (item.qty <= 0) {
    cart = cart.filter((cartItem) => {
      return String(cartItem.id) !== String(id);
    });
  }

  renderCart();
};

window.removeItem = (id) => {
  cart = cart.filter((item) => {
    return String(item.id) !== String(id);
  });

  renderCart();
};

function renderCart() {
  if (!cartItems) return;

  if (!cart.length) {
    cartItems.innerHTML = `
      <div class="cart-empty">
        <i data-lucide="shopping-bag"></i>
        <strong>Keranjang kosong</strong>
        <span>Pilih produk untuk mulai transaksi.</span>
      </div>
    `;

    updateSummary();
    refreshIcons();
    return;
  }

  cartItems.innerHTML =
    cart
      .map((item) => {
        return `
          <div class="cart-item">
            <div class="cart-item-top">
              <div>
                <strong>${item.name}</strong>
                <small>${item.code} • ${rupiah(item.price)}</small>
              </div>

              <button
                class="remove-item"
                type="button"
                onclick="removeItem('${item.id}')"
              >
                ×
              </button>
            </div>

            <div class="qty-control">
              <div class="qty-btns">
                <button type="button" onclick="decreaseQty('${item.id}')">
                  −
                </button>

                <span>${item.qty}</span>

                <button type="button" onclick="increaseQty('${item.id}')">
                  +
                </button>
              </div>

              <div class="cart-price">
                ${rupiah(item.price * item.qty)}
              </div>
            </div>
          </div>
        `;
      })
      .join("");

  updateSummary();
  refreshIcons();
}

clearCartBtn?.addEventListener(
  "click",
  () => {
    if (!cart.length) return;

    if (!confirm("Kosongkan keranjang?")) {
      return;
    }

    cart = [];
    renderCart();
  }
);
/* =========================
   SUMMARY
========================= */

function getSummary() {
  const totalItems =
    cart.reduce((sum, item) => {
      return sum + item.qty;
    }, 0);

  const subtotal =
    cart.reduce((sum, item) => {
      return sum + item.price * item.qty;
    }, 0);

  const discount =
    Number(manualDiscount?.value || 0);

  const taxRate =
    Number(taxPercent?.value || 0);

  const taxable =
    Math.max(subtotal - discount, 0);

  const tax =
    (taxable * taxRate) / 100;

  const grandTotal =
    taxable + tax;

  const paid =
    Number(paidAmount?.value || 0);

  const change =
    Math.max(paid - grandTotal, 0);

  return {
    totalItems,
    subtotal,
    discount,
    taxRate,
    tax,
    grandTotal,
    paid,
    change,
  };
}

function updateSummary() {
  const summary = getSummary();

  if (totalItemsText) {
    totalItemsText.textContent =
      angka(summary.totalItems);
  }

  if (subtotalText) {
    subtotalText.textContent =
      rupiah(summary.subtotal);
  }

  if (discountText) {
    discountText.textContent =
      rupiah(summary.discount);
  }

  if (taxText) {
    taxText.textContent =
      rupiah(summary.tax);
  }

  if (grandTotalText) {
    grandTotalText.textContent =
      rupiah(summary.grandTotal);
  }

  if (changeText) {
    changeText.textContent =
      rupiah(summary.change);
  }

  if (bottomTotal) {
    bottomTotal.textContent =
      rupiah(summary.grandTotal);
  }

  if (bottomItems) {
    bottomItems.textContent =
      `${angka(summary.totalItems)} item di keranjang`;
  }

  if (cartBadge) {
    cartBadge.textContent =
      angka(summary.totalItems);
  }
}

manualDiscount?.addEventListener(
  "input",
  updateSummary
);

taxPercent?.addEventListener(
  "input",
  updateSummary
);

paidAmount?.addEventListener(
  "input",
  updateSummary
);

/* =========================
   PAYMENT METHOD
========================= */

document
  .querySelectorAll(".payment-method")
  .forEach((button) => {
    button.addEventListener("click", () => {
      document
        .querySelectorAll(".payment-method")
        .forEach((btn) => {
          btn.classList.remove("active");
        });

      button.classList.add("active");

      paymentMethod =
        button.dataset.method || "Tunai";
    });
  });
  /* =========================
   STOCK SUPABASE
========================= */

async function reduceProductStock() {
  if (!currentUser) return;

  for (const cartItem of cart) {
    const product =
      products.find((item) => {
        return (
          String(item.id) ===
          String(cartItem.id)
        );
      });

    if (!product) continue;

    if (product.type === "jasa") {
      continue;
    }

    const newStock =
      Math.max(
        Number(product.stock || 0) -
          Number(cartItem.qty || 0),
        0
      );

    const { error } =
      await supabaseClient
        .from("products")
        .update({
          stock: newStock,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", product.id)
        .eq(
          "user_id",
          currentUser.id
        );

    if (error) {
      console.error(error);
      alert(
        "Gagal mengurangi stok produk"
      );
      return false;
    }

    product.stock = newStock;
  }

  return true;
}

/* =========================
   SAVE TRANSACTION
========================= */

async function saveTransactionToSupabase(
  transaction
) {
  if (!currentUser) return null;

  const { data, error } =
    await supabaseClient
      .from("transactions")
      .insert({
        user_id: currentUser.id,
        code: transaction.code,
        cashier_name:
          transaction.cashier,
        customer:
          transaction.customer,
        payment_method:
          transaction.paymentMethod,
        subtotal:
          transaction.subtotal,
        discount:
          transaction.discount,
        tax:
          transaction.tax,
        grand_total:
          transaction.grandTotal,
        paid:
          transaction.paid,
        change:
          transaction.change,
      })
      .select()
      .single();

  if (error) {
    console.error(error);
    alert(
      "Gagal menyimpan transaksi"
    );
    return null;
  }

  const transactionId = data.id;

  const items =
    transaction.items.map((item) => {
      return {
        transaction_id:
          transactionId,
        product_id:
          item.id,
        user_id:
          currentUser.id,
        product_name:
          item.name,
        product_code:
          item.code,
        qty:
          item.qty,
        price:
          item.price,
        total:
          item.qty * item.price,
      };
    });

  const itemResult =
    await supabaseClient
      .from("transaction_items")
      .insert(items);

  if (itemResult.error) {
    console.error(
      itemResult.error
    );

    alert(
      "Transaksi tersimpan tapi item gagal disimpan"
    );
  }

  return data;
}
/* =========================
   RECEIPT
========================= */

async function buildReceiptHTML(transaction) {
  const settings =
    await getStoreSettings();

  return `
    <div class="thermal-receipt">
      <div style="text-align:center;margin-bottom:10px;">
        <img
          src="${settings.logo || "assets/luxora-logo.png"}"
          style="width:54px;height:54px;border-radius:50%;object-fit:cover;margin-bottom:6px;"
        >

        <h2 style="font-size:17px;margin:0;">
          ${settings.storeName || "Luxora Store"}
        </h2>

        <p style="font-size:11px;margin:4px 0 10px;">
          ${settings.address || "Alamat toko belum diatur"}
        </p>
      </div>

      <div style="border-top:1px dashed #111;border-bottom:1px dashed #111;padding:8px 0;font-size:11px;">
        <div style="display:flex;justify-content:space-between;">
          <span>No</span>
          <strong>${transaction.code}</strong>
        </div>

        <div style="display:flex;justify-content:space-between;">
          <span>Tanggal</span>
          <strong>${new Date(transaction.createdAt).toLocaleString("id-ID")}</strong>
        </div>

        <div style="display:flex;justify-content:space-between;">
          <span>Kasir</span>
          <strong>${transaction.cashier}</strong>
        </div>

        <div style="display:flex;justify-content:space-between;">
          <span>Pelanggan</span>
          <strong>${transaction.customer}</strong>
        </div>
      </div>

      <div style="padding:8px 0;">
        ${transaction.items.map((item) => `
          <div style="font-size:12px;margin-bottom:8px;">
            <strong>${item.name}</strong>

            <div style="display:flex;justify-content:space-between;">
              <span>${item.qty} x ${rupiah(item.price)}</span>
              <span>${rupiah(item.qty * item.price)}</span>
            </div>
          </div>
        `).join("")}
      </div>

      <div style="border-top:1px dashed #111;padding-top:8px;font-size:12px;">
        <div style="display:flex;justify-content:space-between;">
          <span>Subtotal</span>
          <strong>${rupiah(transaction.subtotal)}</strong>
        </div>

        <div style="display:flex;justify-content:space-between;">
          <span>Diskon</span>
          <strong>${rupiah(transaction.discount)}</strong>
        </div>

        <div style="display:flex;justify-content:space-between;">
          <span>Pajak</span>
          <strong>${rupiah(transaction.tax)}</strong>
        </div>

        <div style="display:flex;justify-content:space-between;font-size:15px;margin-top:8px;">
          <span>Total</span>
          <strong>${rupiah(transaction.grandTotal)}</strong>
        </div>

        <div style="display:flex;justify-content:space-between;">
          <span>Bayar</span>
          <strong>${rupiah(transaction.paid)}</strong>
        </div>

        <div style="display:flex;justify-content:space-between;">
          <span>Kembali</span>
          <strong>${rupiah(transaction.change)}</strong>
        </div>

        <div style="display:flex;justify-content:space-between;">
          <span>Metode</span>
          <strong>${transaction.paymentMethod}</strong>
        </div>
      </div>

      <div style="text-align:center;margin-top:14px;font-size:11px;">
        <p>${settings.footer || "Terima kasih sudah berbelanja"}</p>
        <strong>Powered by Luxora POS</strong>
      </div>
    </div>
  `;
}

async function openReceipt(transaction) {
  const html =
    await buildReceiptHTML(transaction);

  if (receiptPreview) {
    receiptPreview.innerHTML = html;
  }

  if (printArea) {
    printArea.innerHTML = html;
  }

  closePaymentModal();
  closeCartDrawer();

  receiptModal?.classList.add("show");

  refreshIcons();
}

function closeReceipt() {
  receiptModal?.classList.remove("show");
}

closeReceiptBtn?.addEventListener(
  "click",
  closeReceipt
);

backToCartBtn?.addEventListener(
  "click",
  closeReceipt
);
/* =========================
   PAY TRANSACTION
========================= */

payBtn?.addEventListener(
  "click",
  async () => {
    if (!cart.length) {
      alert(
        "Keranjang masih kosong."
      );
      return;
    }

    const summary =
      getSummary();

    if (
      paymentMethod === "Tunai" &&
      summary.paid <
        summary.grandTotal
    ) {
      alert("Uang bayar kurang.");
      return;
    }

    const transaction = {
      id: crypto.randomUUID(),

      code:
        noteNumber?.value ||
        generateCode(),

      customer:
        customerName?.value?.trim() ||
        "Umum",

      cashier:
        cashierSelect?.value ||
        "Kasir",

      paymentMethod,

      items: [...cart],

      subtotal:
        summary.subtotal,

      discount:
        summary.discount,

      tax:
        summary.tax,

      grandTotal:
        summary.grandTotal,

      paid:
        summary.paid,

      change:
        summary.change,

      createdAt:
        new Date().toISOString(),
    };

    const transactionSaved =
      await saveTransactionToSupabase(
        transaction
      );

    if (!transactionSaved) {
      return;
    }

    const stockUpdated =
      await reduceProductStock();

    if (!stockUpdated) {
      return;
    }

    await loadProducts();

    await openReceipt(
      transaction
    );
  }
);

/* =========================
   PRINT RECEIPT
========================= */

printReceiptBtn?.addEventListener(
  "click",
  () => {
    window.print();

    cart = [];

    if (customerName) {
      customerName.value = "";
    }

    if (manualDiscount) {
      manualDiscount.value = "0";
    }

    if (paidAmount) {
      paidAmount.value = "";
    }

    setNoteNumber();

    renderCart();
    renderProducts();

    closeReceipt();
  }
);
/* =========================
   ANIMATION
========================= */

function injectAnimationCSS() {
  const style =
    document.createElement("style");

  style.textContent = `
    .pos-header,
    .search-section,
    .category-section,
    .product-section,
    .bottom-cart{
      animation: posFade .55s cubic-bezier(.2,.8,.2,1) both;
    }

    .search-section{animation-delay:.05s;}
    .category-section{animation-delay:.10s;}
    .product-section{animation-delay:.15s;}
    .bottom-cart{animation-delay:.20s;}

    @keyframes posFade{
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

    setNoteNumber();

    const settings =
      await getStoreSettings();

    if (
      taxPercent &&
      Number(taxPercent.value || 0) === 0
    ) {
      taxPercent.value =
        settings.tax || 0;
    }

    await loadProducts();
    await loadCashiers();

    updateTime();
    setInterval(updateTime, 1000);

    renderCart();
    updateSummary();

    injectAnimationCSS();
    refreshIcons();
  }
);