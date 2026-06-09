const root = document.documentElement;
const themeToggle = document.getElementById("themeToggle");

function refreshIcons() {
  if (window.lucide) {
    lucide.createIcons();
  }
}

/* =========================
   THEME
========================= */

function setTheme(theme) {
  root.setAttribute("data-theme", theme);
  localStorage.setItem("luxora_theme", theme);

  const icon = themeToggle?.querySelector("i");

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

themeToggle?.addEventListener("click", () => {

  const currentTheme =
    root.getAttribute("data-theme") ||
    "dark";

  const nextTheme =
    currentTheme === "dark"
      ? "light"
      : "dark";

  setTheme(nextTheme);
});

/* =========================
   COUNTER ANIMATION
========================= */

function animatePrice() {

  const priceElement =
    document.querySelector(".price-card h3");

  if (!priceElement) return;

  const target = 299000;
  let current = 0;

  const step = target / 60;

  const interval = setInterval(() => {

    current += step;

    if (current >= target) {
      current = target;
      clearInterval(interval);
    }

    priceElement.innerHTML = `
      Rp${Math.floor(current).toLocaleString("id-ID")}
      <span>/ bulan</span>
    `;

  }, 15);
}

/* =========================
   REVEAL ANIMATION
========================= */

function setupReveal() {

  const elements =
    document.querySelectorAll(
      ".hero-content, .price-card, .feature-card, .comparison, .cta"
    );

  elements.forEach((item) => {
    item.classList.add("reveal-item");
  });

  const observer =
    new IntersectionObserver(
      (entries) => {

        entries.forEach((entry) => {

          if (!entry.isIntersecting)
            return;

          entry.target.classList.add(
            "show"
          );

          observer.unobserve(
            entry.target
          );
        });

      },
      {
        threshold: 0.15,
      }
    );

  elements.forEach((item) =>
    observer.observe(item)
  );
}

/* =========================
   INTRO ANIMATION
========================= */

function runIntroAnimation() {

  const elements =
    document.querySelectorAll(
      ".premium-topbar, .hero-content, .price-card"
    );

  elements.forEach(
    (element, index) => {

      element.style.opacity = "0";
      element.style.transform =
        "translateY(20px)";
      element.style.filter =
        "blur(8px)";

      setTimeout(() => {

        element.style.transition =
          "all .7s cubic-bezier(.2,.8,.2,1)";

        element.style.opacity =
          "1";

        element.style.transform =
          "translateY(0)";

        element.style.filter =
          "blur(0)";

      }, index * 120);

    }
  );
}

/* =========================
   CSS ANIMATION
========================= */

function injectAnimationCSS() {

  const style =
    document.createElement("style");

  style.textContent = `
  
  .reveal-item{
    opacity:0;
    transform:
      translateY(30px)
      scale(.98);

    filter:blur(10px);

    transition:
      opacity .8s ease,
      transform .8s cubic-bezier(.2,.8,.2,1),
      filter .8s ease;
  }

  .reveal-item.show{
    opacity:1;
    transform:
      translateY(0)
      scale(1);

    filter:blur(0);
  }

  .feature-card{
    position:relative;
    overflow:hidden;
  }

  .feature-card::after{
    content:"";
    position:absolute;

    width:120px;
    height:120px;

    right:-60px;
    top:-60px;

    border-radius:50%;

    background:
      rgba(216,167,66,.08);

    transition:.3s;
  }

  .feature-card:hover{
    transform:
      translateY(-5px);
  }

  .feature-card:hover::after{
    transform:
      scale(1.4);
  }

  .hero-content{
    position:relative;
    overflow:hidden;
  }

  .hero-content::before{
    content:"";

    position:absolute;

    top:-100%;
    left:-30%;

    width:40%;
    height:300%;

    background:
      linear-gradient(
        90deg,
        transparent,
        rgba(255,255,255,.12),
        transparent
      );

    transform:
      rotate(25deg);

    animation:
      premiumShine 5s linear infinite;
  }

  @keyframes premiumShine{

    0%{
      left:-40%;
    }

    100%{
      left:130%;
    }
  }

  .primary-btn,
  .secondary-btn,
  .price-card a,
  .cta a{
    transition:
      transform .25s ease,
      box-shadow .25s ease;
  }

  .primary-btn:hover,
  .secondary-btn:hover,
  .price-card a:hover,
  .cta a:hover{

    transform:
      translateY(-3px);

    box-shadow:
      0 20px 40px
      rgba(216,167,66,.20);
  }

  .primary-btn:active,
  .secondary-btn:active,
  .price-card a:active,
  .cta a:active{

    transform:
      scale(.97);
  }

  .price-card{
    position:relative;
  }

  .price-card::before{
    content:"";

    position:absolute;
    inset:-1px;

    border-radius:inherit;

    padding:1px;

    background:
      linear-gradient(
        135deg,
        rgba(216,167,66,.6),
        transparent,
        rgba(216,167,66,.4)
      );

    -webkit-mask:
      linear-gradient(#fff 0 0)
      content-box,
      linear-gradient(#fff 0 0);

    -webkit-mask-composite:xor;

    pointer-events:none;
  }

  `;
  document.head.appendChild(style);
}

/* =========================
   ACTIVE PLAN EFFECT
========================= */

function pulsePriceCard() {

  const card =
    document.querySelector(
      ".price-card"
    );

  if (!card) return;

  setInterval(() => {

    card.animate(
      [
        {
          transform:
            "translateY(0)"
        },
        {
          transform:
            "translateY(-4px)"
        },
        {
          transform:
            "translateY(0)"
        }
      ],
      {
        duration: 2200,
        easing: "ease-in-out"
      }
    );

  }, 2500);
}

/* =========================
   FAQ AUTO GENERATOR
========================= */

function createPremiumBadge() {

  const hero =
    document.querySelector(
      ".hero-content"
    );

  if (!hero) return;

  const badge =
    document.createElement("div");

  badge.className =
    "premium-live-badge";

  badge.innerHTML = `
    <i data-lucide="shield-check"></i>
    Premium Ready
  `;

  badge.style.cssText = `
    display:inline-flex;
    align-items:center;
    gap:8px;

    height:40px;

    padding:0 14px;

    border-radius:999px;

    margin-top:18px;

    background:
      rgba(34,197,94,.12);

    color:#6ee7b7;

    font-size:13px;
    font-weight:800;
  `;

  hero.appendChild(badge);

  refreshIcons();
}

/* =========================
   INIT
========================= */

window.addEventListener(
  "load",
  () => {

    const savedTheme =
      localStorage.getItem(
        "luxora_theme"
      ) || "dark";

    setTheme(savedTheme);

    injectAnimationCSS();

    setupReveal();

    runIntroAnimation();

    animatePrice();

    pulsePriceCard();

    createPremiumBadge();

    refreshIcons();
  }
);