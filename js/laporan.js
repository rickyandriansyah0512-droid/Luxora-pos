let transactions = [];
let currentUser = null;

let currentPeriod = "today";
let customStart = "";
let customEnd = "";

const root = document.documentElement;

const themeToggle = document.getElementById("themeToggle");

const totalRevenue = document.getElementById("totalRevenue");
const totalTransactions = document.getElementById("totalTransactions");
const itemsSold = document.getElementById("itemsSold");
const averageTransaction = document.getElementById("averageTransaction");

const topProductsList = document.getElementById("topProductsList");
const topCashiersList = document.getElementById("topCashiersList");
const paymentMethodList = document.getElementById("paymentMethodList");

const reportTable = document.getElementById("reportTable");
const reportCountText = document.getElementById("reportCountText");

const startDate = document.getElementById("startDate");
const endDate = document.getElementById("endDate");
const applyDateBtn = document.getElementById("applyDateBtn");

const exportCsvBtn = document.getElementById("exportCsvBtn");
const printReportBtn = document.getElementById("printReportBtn");
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
    alert("Gagal mengambil data laporan");
    return;
  }

  transactions =
    (data || []).map((trx) => {
      return {
        id: trx.id,
        code: trx.code,
        cashier:
          trx.cashier_name || "Kasir",
        customer:
          trx.customer || "Umum",
        paymentMethod:
          trx.payment_method || "Tunai",

        subtotal:
          Number(trx.subtotal || 0),
        discount:
          Number(trx.discount || 0),
        tax:
          Number(trx.tax || 0),
        grandTotal:
          Number(trx.grand_total || 0),
        paid:
          Number(trx.paid || 0),
        change:
          Number(trx.change || 0),

        createdAt:
          trx.created_at,

        items:
          (trx.transaction_items || []).map((item) => {
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

  renderReport();
}
/* =========================
   HELPERS
========================= */

function getDateKey(dateValue) {
  return new Date(dateValue)
    .toISOString()
    .slice(0, 10);
}

function todayKey() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}

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

function formatDateLabel(dateKey) {
  return new Date(
    dateKey + "T00:00:00"
  ).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* =========================
   FILTER
========================= */

function getPeriodRange() {
  const now = new Date();
  const today = todayKey();

  if (customStart && customEnd) {
    return {
      start: customStart,
      end: customEnd,
    };
  }

  if (currentPeriod === "all") {
    return {
      start: "",
      end: "",
    };
  }

  if (currentPeriod === "today") {
    return {
      start: today,
      end: today,
    };
  }

  if (currentPeriod === "7days") {
    const start = new Date();

    start.setDate(
      now.getDate() - 6
    );

    return {
      start: getDateKey(start),
      end: today,
    };
  }

  if (currentPeriod === "month") {
    const start =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );

    return {
      start: getDateKey(start),
      end: today,
    };
  }

  return {
    start: today,
    end: today,
  };
}

function getFilteredTransactions() {
  const range =
    getPeriodRange();

  if (
    !range.start &&
    !range.end
  ) {
    return [...transactions];
  }

  return transactions.filter(
    (trx) => {
      if (!trx.createdAt) {
        return false;
      }

      const date =
        getDateKey(
          trx.createdAt
        );

      return (
        date >= range.start &&
        date <= range.end
      );
    }
  );
}

document
  .querySelectorAll(".period-btn")
  .forEach((button) => {
    button.addEventListener(
      "click",
      () => {
        document
          .querySelectorAll(".period-btn")
          .forEach((btn) => {
            btn.classList.remove(
              "active"
            );
          });

        button.classList.add(
          "active"
        );

        currentPeriod =
          button.dataset.period ||
          "today";

        customStart = "";
        customEnd = "";

        if (startDate) {
          startDate.value = "";
        }

        if (endDate) {
          endDate.value = "";
        }

        renderReport();
      }
    );
  });

applyDateBtn?.addEventListener(
  "click",
  () => {
    if (
      !startDate?.value ||
      !endDate?.value
    ) {
      alert(
        "Pilih tanggal awal dan akhir."
      );
      return;
    }

    if (
      startDate.value >
      endDate.value
    ) {
      alert(
        "Tanggal awal tidak boleh lebih besar dari tanggal akhir."
      );
      return;
    }

    customStart =
      startDate.value;

    customEnd =
      endDate.value;

    document
      .querySelectorAll(".period-btn")
      .forEach((btn) => {
        btn.classList.remove(
          "active"
        );
      });

    renderReport();
  });
  /* =========================
   CALCULATION
========================= */

function calculateSummary(data) {
  const revenue =
    data.reduce((sum, trx) => {
      return (
        sum +
        getTransactionTotal(trx)
      );
    }, 0);

  const trxCount =
    data.length;

  const itemCount =
    data.reduce((sum, trx) => {
      return (
        sum +
        getTransactionItems(trx)
          .reduce(
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

  const average =
    trxCount
      ? revenue / trxCount
      : 0;

  return {
    revenue,
    trxCount,
    itemCount,
    average,
  };
}

function getTopProducts(data) {
  const map = {};

  data.forEach((trx) => {
    getTransactionItems(trx)
      .forEach((item) => {
        const key =
          item.name || "Produk";

        if (!map[key]) {
          map[key] = {
            name: key,
            qty: 0,
            revenue: 0,
          };
        }

        map[key].qty +=
          Number(item.qty || 0);

        map[key].revenue +=
          Number(item.qty || 0) *
          Number(item.price || 0);
      });
  });

  return Object.values(map)
    .sort((a, b) => {
      return b.qty - a.qty;
    })
    .slice(0, 5);
}

function getTopCashiers(data) {
  const map = {};

  data.forEach((trx) => {
    const key =
      trx.cashier || "Kasir";

    if (!map[key]) {
      map[key] = {
        name: key,
        trx: 0,
        revenue: 0,
      };
    }

    map[key].trx += 1;

    map[key].revenue +=
      getTransactionTotal(trx);
  });

  return Object.values(map)
    .sort((a, b) => {
      return b.revenue - a.revenue;
    })
    .slice(0, 5);
}

function getPaymentMethods(data) {
  const map = {};

  data.forEach((trx) => {
    const key =
      trx.paymentMethod ||
      "Tunai";

    if (!map[key]) {
      map[key] = {
        name: key,
        trx: 0,
        revenue: 0,
      };
    }

    map[key].trx += 1;

    map[key].revenue +=
      getTransactionTotal(trx);
  });

  return Object.values(map)
    .sort((a, b) => {
      return b.trx - a.trx;
    });
}

function getDailyReport(data) {
  const map = {};

  data.forEach((trx) => {
    const date =
      getDateKey(trx.createdAt);

    if (!map[date]) {
      map[date] = {
        date,
        trx: 0,
        items: 0,
        revenue: 0,
      };
    }

    map[date].trx += 1;

    map[date].items +=
      getTransactionItems(trx)
        .reduce((sum, item) => {
          return (
            sum +
            Number(item.qty || 0)
          );
        }, 0);

    map[date].revenue +=
      getTransactionTotal(trx);
  });

  return Object.values(map)
    .sort((a, b) => {
      return (
        new Date(b.date) -
        new Date(a.date)
      );
    });
}
/* =========================
   RENDER INSIGHTS
========================= */

function renderRankList(
  container,
  data,
  type
) {
  if (!container) return;

  if (!data.length) {
    container.innerHTML = `
      <div class="empty-mini">
        Belum ada data.
      </div>
    `;
    return;
  }

  container.innerHTML =
    data
      .map((item, index) => {
        let subtitle = "";
        let value = "";

        if (type === "product") {
          subtitle =
            `${angka(item.qty)} item terjual`;

          value =
            rupiah(item.revenue);
        }

        if (type === "cashier") {
          subtitle =
            `${angka(item.trx)} transaksi`;

          value =
            rupiah(item.revenue);
        }

        if (type === "payment") {
          subtitle =
            `${angka(item.trx)} transaksi`;

          value =
            rupiah(item.revenue);
        }

        return `
          <div class="rank-item">
            <div class="rank-left">
              <div class="rank-number">
                ${index + 1}
              </div>

              <div class="rank-info">
                <h4>${item.name}</h4>
                <p>${subtitle}</p>
              </div>
            </div>

            <div class="rank-value">
              ${value}
            </div>
          </div>
        `;
      })
      .join("");
}

/* =========================
   RENDER TABLE
========================= */

function renderDailyTable(data) {
  if (!reportTable) return;

  if (!data.length) {
    reportTable.innerHTML = `
      <div class="empty-state">
        <i data-lucide="bar-chart-3"></i>
        <h3>Belum ada laporan</h3>
        <p>Data laporan akan muncul setelah ada transaksi dari halaman kasir.</p>
        <a href="kasir.html">Buka Kasir</a>
      </div>
    `;

    refreshIcons();
    return;
  }

  reportTable.innerHTML = `
    <div class="report-row head">
      <strong>Tanggal</strong>
      <strong>Transaksi</strong>
      <strong>Item</strong>
      <strong>Omzet</strong>
      <strong>Rata-rata</strong>
    </div>

    ${data
      .map((row) => {
        const average =
          row.trx
            ? row.revenue / row.trx
            : 0;

        return `
          <div class="report-row">
            <strong>
              ${formatDateLabel(row.date)}
            </strong>

            <span>
              ${angka(row.trx)} transaksi
            </span>

            <span>
              ${angka(row.items)} item
            </span>

            <div class="report-revenue">
              ${rupiah(row.revenue)}
            </div>

            <span>
              ${rupiah(average)}
            </span>
          </div>
        `;
      })
      .join("")}
  `;
}

/* =========================
   MAIN RENDER
========================= */

function renderReport() {
  const filtered =
    getFilteredTransactions();

  const summary =
    calculateSummary(filtered);

  const daily =
    getDailyReport(filtered);

  if (totalRevenue) {
    totalRevenue.textContent =
      rupiah(summary.revenue);
  }

  if (totalTransactions) {
    totalTransactions.textContent =
      angka(summary.trxCount);
  }

  if (itemsSold) {
    itemsSold.textContent =
      angka(summary.itemCount);
  }

  if (averageTransaction) {
    averageTransaction.textContent =
      rupiah(summary.average);
  }

  if (reportCountText) {
    reportCountText.textContent =
      `${angka(daily.length)} Hari`;
  }

  renderRankList(
    topProductsList,
    getTopProducts(filtered),
    "product"
  );

  renderRankList(
    topCashiersList,
    getTopCashiers(filtered),
    "cashier"
  );

  renderRankList(
    paymentMethodList,
    getPaymentMethods(filtered),
    "payment"
  );

  renderDailyTable(daily);

  refreshIcons();
}
/* =========================
   EXPORT CSV
========================= */

function exportCSV() {
  const filtered =
    getFilteredTransactions();

  const daily =
    getDailyReport(filtered);

  if (!daily.length) {
    alert(
      "Belum ada data untuk diexport."
    );
    return;
  }

  const rows = [
    [
      "Tanggal",
      "Transaksi",
      "Item Terjual",
      "Omzet",
      "Rata-rata Transaksi",
    ],

    ...daily.map((row) => {
      const average =
        row.trx
          ? row.revenue / row.trx
          : 0;

      return [
        row.date,
        row.trx,
        row.items,
        row.revenue,
        Math.round(average),
      ];
    }),
  ];

  const csv =
    rows
      .map((row) => row.join(","))
      .join("\n");

  const blob =
    new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;

  link.download =
    `laporan-luxora-${Date.now()}.csv`;

  link.click();

  URL.revokeObjectURL(url);

  showToast(
    "Laporan berhasil diexport."
  );
}

/* =========================
   PRINT REPORT
========================= */

function buildPrintReport() {
  const filtered =
    getFilteredTransactions();

  const summary =
    calculateSummary(filtered);

  const daily =
    getDailyReport(filtered);

  const range =
    getPeriodRange();

  const periodText =
    range.start && range.end
      ? `${range.start} sampai ${range.end}`
      : "Semua Periode";

  return `
    <div class="print-report">
      <h1>Laporan Penjualan Luxora POS</h1>
      <p>Periode: ${periodText}</p>

      <div class="print-summary">
        <div>
          <span>Total Omzet</span>
          <strong>${rupiah(summary.revenue)}</strong>
        </div>

        <div>
          <span>Total Transaksi</span>
          <strong>${angka(summary.trxCount)}</strong>
        </div>

        <div>
          <span>Item Terjual</span>
          <strong>${angka(summary.itemCount)}</strong>
        </div>

        <div>
          <span>Rata-rata</span>
          <strong>${rupiah(summary.average)}</strong>
        </div>
      </div>

      <table class="print-table">
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Transaksi</th>
            <th>Item</th>
            <th>Omzet</th>
            <th>Rata-rata</th>
          </tr>
        </thead>

        <tbody>
          ${daily
            .map((row) => {
              const average =
                row.trx
                  ? row.revenue / row.trx
                  : 0;

              return `
                <tr>
                  <td>${formatDateLabel(row.date)}</td>
                  <td>${angka(row.trx)}</td>
                  <td>${angka(row.items)}</td>
                  <td>${rupiah(row.revenue)}</td>
                  <td>${rupiah(average)}</td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}
/* =========================
   EVENTS
========================= */

exportCsvBtn?.addEventListener(
  "click",
  exportCSV
);

printReportBtn?.addEventListener(
  "click",
  () => {
    const filtered =
      getFilteredTransactions();

    if (!filtered.length) {
      alert(
        "Belum ada data laporan untuk dicetak."
      );
      return;
    }

    printArea.innerHTML =
      buildPrintReport();

    setTimeout(() => {
      window.print();
    }, 150);
  }
);

/* =========================
   ANIMATION
========================= */

function injectAnimationCSS() {
  const style =
    document.createElement("style");

  style.textContent = `
    .report-header,
    .hero-card,
    .filter-card,
    .stat-card,
    .insight-card,
    .report-panel{
      animation: fadeUp .6s cubic-bezier(.2,.8,.2,1) both;
    }

    .hero-card{animation-delay:.05s;}
    .filter-card{animation-delay:.10s;}
    .stat-card:nth-child(1){animation-delay:.14s;}
    .stat-card:nth-child(2){animation-delay:.18s;}
    .stat-card:nth-child(3){animation-delay:.22s;}
    .stat-card:nth-child(4){animation-delay:.26s;}
    .insight-card:nth-child(1){animation-delay:.30s;}
    .insight-card:nth-child(2){animation-delay:.34s;}
    .insight-card:nth-child(3){animation-delay:.38s;}
    .report-panel{animation-delay:.42s;}

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