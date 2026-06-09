let transactions = [];
let selectedTransaction = null;
let currentUser = null;

const root = document.documentElement;

const themeToggle = document.getElementById("themeToggle");

const totalTransactions = document.getElementById("totalTransactions");
const todayRevenue = document.getElementById("todayRevenue");
const totalItemsSold = document.getElementById("totalItemsSold");
const topPaymentMethod = document.getElementById("topPaymentMethod");

const transactionSearch = document.getElementById("transactionSearch");
const dateFilter = document.getElementById("dateFilter");
const methodFilter = document.getElementById("methodFilter");
const resetFilterBtn = document.getElementById("resetFilterBtn");

const transactionList = document.getElementById("transactionList");
const transactionCountText = document.getElementById("transactionCountText");

const detailModal = document.getElementById("detailModal");
const modalBackdrop = document.getElementById("modalBackdrop");
const closeDetailBtn = document.getElementById("closeDetailBtn");

const detailCode = document.getElementById("detailCode");
const detailDate = document.getElementById("detailDate");
const detailCashier = document.getElementById("detailCashier");
const detailCustomer = document.getElementById("detailCustomer");
const detailMethod = document.getElementById("detailMethod");
const detailItems = document.getElementById("detailItems");

const detailSubtotal = document.getElementById("detailSubtotal");
const detailDiscount = document.getElementById("detailDiscount");
const detailTax = document.getElementById("detailTax");
const detailGrandTotal = document.getElementById("detailGrandTotal");
const detailPaid = document.getElementById("detailPaid");
const detailChange = document.getElementById("detailChange");

const deleteTransactionBtn = document.getElementById("deleteTransactionBtn");
const printTransactionBtn = document.getElementById("printTransactionBtn");

const printArea = document.getElementById("printArea");
const toast = document.getElementById("toast");

const rupiah = (value) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
};

const angka = (value) => {
  return new Intl.NumberFormat("id-ID").format(Number(value) || 0);
};

function refreshIcons() {
  if (window.lucide) lucide.createIcons();
}

function showToast(message = "Berhasil.") {
  if (!toast) return;

  const text = toast.querySelector("span");

  if (text) {
    text.textContent = message;
  }

  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2400);
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
  };
}
/* =========================
   LOAD TRANSACTIONS
========================= */

async function loadTransactions() {
  if (!currentUser) return;

  const { data, error } =
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

  if (error) {
    console.error(error);
    alert("Gagal mengambil data transaksi");
    return;
  }

  transactions =
    (data || []).map((trx) => {
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

  updateStats();
  renderTransactions();
}

/* =========================
   HELPERS
========================= */

function getTransactionTotal(trx) {
  return Number(
    trx.grandTotal ||
    trx.total ||
    trx.amount ||
    0
  );
}

function getTransactionItems(trx) {
  return Array.isArray(trx.items)
    ? trx.items
    : [];
}

function getTransactionDateKey(trx) {
  if (!trx.createdAt) return "";

  return new Date(trx.createdAt)
    .toISOString()
    .slice(0, 10);
}

function todayKey() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}
/* =========================
   FILTER TRANSACTIONS
========================= */

function getFilteredTransactions() {
  let result = [...transactions];

  const keyword =
    (transactionSearch?.value || "")
      .toLowerCase()
      .trim();

  const date =
    dateFilter?.value || "";

  const method =
    methodFilter?.value || "all";

  if (keyword) {
    result = result.filter((trx) => {
      return (
        trx.code
          ?.toLowerCase()
          .includes(keyword) ||

        trx.customer
          ?.toLowerCase()
          .includes(keyword) ||

        trx.cashier
          ?.toLowerCase()
          .includes(keyword) ||

        trx.paymentMethod
          ?.toLowerCase()
          .includes(keyword)
      );
    });
  }

  if (date) {
    result = result.filter((trx) => {
      return getTransactionDateKey(trx) === date;
    });
  }

  if (method !== "all") {
    result = result.filter((trx) => {
      return trx.paymentMethod === method;
    });
  }

  return result.sort((a, b) => {
    return new Date(b.createdAt || 0) -
      new Date(a.createdAt || 0);
  });
}

/* =========================
   STATS
========================= */

function updateStats() {
  const todayTransactionsData =
    transactions.filter((trx) => {
      return (
        getTransactionDateKey(trx) ===
        todayKey()
      );
    });

  const todayTotal =
    todayTransactionsData.reduce(
      (sum, trx) => {
        return sum + getTransactionTotal(trx);
      },
      0
    );

  const itemsSold =
    transactions.reduce((sum, trx) => {
      return (
        sum +
        getTransactionItems(trx).reduce(
          (itemSum, item) => {
            return (
              itemSum +
              Number(item.qty || 0)
            );
          },
          0
        )
      );
    }, 0);

  const methodCount =
    transactions.reduce((obj, trx) => {
      const method =
        trx.paymentMethod || "Tunai";

      obj[method] =
        (obj[method] || 0) + 1;

      return obj;
    }, {});

  const topMethod =
    Object.entries(methodCount)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

  if (totalTransactions) {
    totalTransactions.textContent =
      angka(transactions.length);
  }

  if (todayRevenue) {
    todayRevenue.textContent =
      rupiah(todayTotal);
  }

  if (totalItemsSold) {
    totalItemsSold.textContent =
      angka(itemsSold);
  }

  if (topPaymentMethod) {
    topPaymentMethod.textContent =
      topMethod;
  }
}
/* =========================
   RENDER LIST
========================= */

function renderTransactions() {
  const filtered =
    getFilteredTransactions();

  if (transactionCountText) {
    transactionCountText.textContent =
      `${angka(filtered.length)} Transaksi`;
  }

  if (!transactionList) return;

  if (!filtered.length) {
    transactionList.innerHTML = `
      <div class="empty-state">
        <i data-lucide="receipt-text"></i>
        <h3>Belum ada transaksi</h3>
        <p>Transaksi dari halaman kasir akan otomatis muncul di sini.</p>
        <a href="kasir.html">Buka Kasir</a>
      </div>
    `;

    refreshIcons();
    return;
  }

  transactionList.innerHTML =
    filtered
      .map((trx) => {
        const items =
          getTransactionItems(trx);

        const totalQty =
          items.reduce((sum, item) => {
            return sum + Number(item.qty || 0);
          }, 0);

        return `
          <article class="transaction-row">
            <div class="trx-main">
              <h4>${trx.code || "-"}</h4>
              <p>${new Date(trx.createdAt).toLocaleString("id-ID")}</p>
            </div>

            <div class="trx-meta">
              ${trx.cashier || "Kasir"}
            </div>

            <div class="trx-meta">
              ${trx.customer || "Umum"}
            </div>

            <div class="trx-meta">
              ${angka(totalQty)} item
            </div>

            <div class="trx-total">
              ${rupiah(getTransactionTotal(trx))}
            </div>

            <div class="trx-actions">
              <button
                class="view"
                type="button"
                onclick="openDetail('${trx.id}')"
              >
                <i data-lucide="eye"></i>
              </button>

              <button
                class="print"
                type="button"
                onclick="printTransaction('${trx.id}')"
              >
                <i data-lucide="printer"></i>
              </button>
            </div>
          </article>
        `;
      })
      .join("");

  refreshIcons();
}
/* =========================
   DETAIL MODAL
========================= */

window.openDetail = (id) => {
  const trx =
    transactions.find((item) => {
      return item.id === id;
    });

  if (!trx) return;

  selectedTransaction = trx;

  detailCode.textContent =
    trx.code || "-";

  detailDate.textContent =
    trx.createdAt
      ? new Date(trx.createdAt)
          .toLocaleString("id-ID")
      : "-";

  detailCashier.textContent =
    trx.cashier || "Kasir";

  detailCustomer.textContent =
    trx.customer || "Umum";

  detailMethod.textContent =
    trx.paymentMethod || "Tunai";

  const items =
    getTransactionItems(trx);

  detailItems.innerHTML =
    items
      .map((item) => {
        return `
          <div class="detail-item">
            <strong>
              ${item.name || "Produk"}
            </strong>

            <div>
              <span>
                ${angka(item.qty || 0)}
                x
                ${rupiah(item.price || 0)}
              </span>

              <strong>
                ${rupiah(
                  Number(item.qty || 0) *
                  Number(item.price || 0)
                )}
              </strong>
            </div>
          </div>
        `;
      })
      .join("");

  detailSubtotal.textContent =
    rupiah(trx.subtotal || 0);

  detailDiscount.textContent =
    rupiah(trx.discount || 0);

  detailTax.textContent =
    rupiah(trx.tax || 0);

  detailGrandTotal.textContent =
    rupiah(getTransactionTotal(trx));

  detailPaid.textContent =
    rupiah(trx.paid || 0);

  detailChange.textContent =
    rupiah(trx.change || 0);

  detailModal.classList.add("show");

  refreshIcons();
};

function closeDetail() {
  detailModal.classList.remove("show");
  selectedTransaction = null;
}

closeDetailBtn?.addEventListener(
  "click",
  closeDetail
);

modalBackdrop?.addEventListener(
  "click",
  closeDetail
);
/* =========================
   DELETE TRANSACTION
========================= */

deleteTransactionBtn?.addEventListener(
  "click",
  async () => {
    if (!selectedTransaction) return;

    if (
      !confirm(
        "Yakin ingin menghapus transaksi ini?"
      )
    ) {
      return;
    }

    const { error } =
      await supabaseClient
        .from("transactions")
        .delete()
        .eq("id", selectedTransaction.id)
        .eq("user_id", currentUser.id);

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    closeDetail();

    await loadTransactions();

    showToast(
      "Transaksi berhasil dihapus."
    );
  }
);

/* =========================
   RECEIPT
========================= */

async function buildReceiptHTML(transaction) {
  const settings =
    await getStoreSettings();

  return `
    <div class="thermal-receipt">

      <div class="receipt-center">
        <img
          class="thermal-logo"
          src="${settings.logo || "assets/luxora-logo.png"}"
          alt="Logo"
        >

        <h2 class="receipt-title">
          ${settings.storeName || "Luxora Store"}
        </h2>

        <p class="receipt-small">
          ${settings.address || "Alamat toko belum diatur"}
        </p>
      </div>

      <div class="receipt-line"></div>

      <div class="receipt-row">
        <span>No</span>
        <strong>${transaction.code || "-"}</strong>
      </div>

      <div class="receipt-row">
        <span>Tanggal</span>
        <strong>
          ${
            transaction.createdAt
              ? new Date(transaction.createdAt).toLocaleString("id-ID")
              : "-"
          }
        </strong>
      </div>

      <div class="receipt-row">
        <span>Kasir</span>
        <strong>${transaction.cashier || "Kasir"}</strong>
      </div>

      <div class="receipt-row">
        <span>Pelanggan</span>
        <strong>${transaction.customer || "Umum"}</strong>
      </div>

      <div class="receipt-line"></div>

      ${getTransactionItems(transaction).map((item) => `
        <div class="receipt-item">
          <div class="receipt-item-name">
            ${item.name || "Produk"}
          </div>

          <div class="receipt-row">
            <span>
              ${angka(item.qty || 0)}
              x
              ${rupiah(item.price || 0)}
            </span>

            <strong>
              ${rupiah(
                Number(item.qty || 0) *
                Number(item.price || 0)
              )}
            </strong>
          </div>
        </div>
      `).join("")}

      <div class="receipt-line"></div>

      <div class="receipt-row">
        <span>Subtotal</span>
        <strong>${rupiah(transaction.subtotal || 0)}</strong>
      </div>

      <div class="receipt-row">
        <span>Diskon</span>
        <strong>${rupiah(transaction.discount || 0)}</strong>
      </div>

      <div class="receipt-row">
        <span>Pajak</span>
        <strong>${rupiah(transaction.tax || 0)}</strong>
      </div>

      <div class="receipt-line"></div>

      <div class="receipt-row receipt-total">
        <span>Total</span>
        <strong>${rupiah(getTransactionTotal(transaction))}</strong>
      </div>

      <div class="receipt-row">
        <span>Bayar</span>
        <strong>${rupiah(transaction.paid || 0)}</strong>
      </div>

      <div class="receipt-row">
        <span>Kembali</span>
        <strong>${rupiah(transaction.change || 0)}</strong>
      </div>

      <div class="receipt-row">
        <span>Metode</span>
        <strong>${transaction.paymentMethod || "Tunai"}</strong>
      </div>

      <div class="receipt-line"></div>

      <div class="receipt-footer">
        <p>${settings.footer || "Terima kasih sudah berbelanja"}</p>
        <strong>Powered by Luxora POS</strong>
      </div>

    </div>
  `;
}
/* =========================
   PRINT TRANSACTION
========================= */

window.printTransaction = async (id) => {
  const trx =
    transactions.find((item) => {
      return item.id === id;
    });

  if (!trx) return;

  printArea.innerHTML =
    await buildReceiptHTML(trx);

  setTimeout(() => {
    window.print();
  }, 150);
};

printTransactionBtn?.addEventListener(
  "click",
  async () => {
    if (!selectedTransaction) return;

    printArea.innerHTML =
      await buildReceiptHTML(
        selectedTransaction
      );

    setTimeout(() => {
      window.print();
    }, 150);
  }
);

/* =========================
   FILTER EVENTS
========================= */

transactionSearch?.addEventListener(
  "input",
  renderTransactions
);

dateFilter?.addEventListener(
  "change",
  renderTransactions
);

methodFilter?.addEventListener(
  "change",
  renderTransactions
);

resetFilterBtn?.addEventListener(
  "click",
  () => {
    if (transactionSearch) {
      transactionSearch.value = "";
    }

    if (dateFilter) {
      dateFilter.value = "";
    }

    if (methodFilter) {
      methodFilter.value = "all";
    }

    renderTransactions();
  }
);
/* =========================
   ANIMATION
========================= */

function injectAnimationCSS() {
  const style =
    document.createElement("style");

  style.textContent = `
    .transaction-header,
    .hero-card,
    .stat-card,
    .transaction-tools,
    .transaction-panel{
      animation: fadeUp .6s cubic-bezier(.2,.8,.2,1) both;
    }

    .hero-card{animation-delay:.05s;}
    .stat-card:nth-child(1){animation-delay:.08s;}
    .stat-card:nth-child(2){animation-delay:.12s;}
    .stat-card:nth-child(3){animation-delay:.16s;}
    .stat-card:nth-child(4){animation-delay:.20s;}
    .transaction-tools{animation-delay:.24s;}
    .transaction-panel{animation-delay:.28s;}

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

    await loadTransactions();

    injectAnimationCSS();
    refreshIcons();
  }
);