const navbar = document.querySelector(".navbar");
const navLinks = document.querySelectorAll(".nav-menu a, .footer-links a, a[href^='#']");
const cards = document.querySelectorAll(
  ".feature-card, .contact-card, .project-card, .info-panel, .preview-card, .cta"
);
const heroTitle = document.querySelector("h1");
const heroVisual = document.querySelector(".hero-visual");
const chartBars = document.querySelectorAll(".chart i");
const logoCard = document.querySelector(".main-logo-card");

/* Navbar scroll effect */
window.addEventListener("scroll", () => {
  if (window.scrollY > 30) {
    navbar?.classList.add("scrolled");
  } else {
    navbar?.classList.remove("scrolled");
  }
});

/* Smooth scroll */
navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const href = link.getAttribute("href");

    if (!href || !href.startsWith("#") || href === "#") return;

    const target = document.querySelector(href);
    if (!target) return;

    event.preventDefault();

    target.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
});

/* Reveal animation on scroll */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.14,
  }
);

cards.forEach((card, index) => {
  card.classList.add("reveal");
  card.style.transitionDelay = `${Math.min(index * 60, 320)}ms`;
  revealObserver.observe(card);
});

/* Hero text animation */
if (heroTitle) {
  const originalText = heroTitle.textContent.trim();
  heroTitle.innerHTML = "";

  originalText.split(" ").forEach((word, index) => {
    const span = document.createElement("span");
    span.textContent = word + " ";
    span.style.animationDelay = `${index * 70}ms`;
    heroTitle.appendChild(span);
  });
}

/* Chart animation */
chartBars.forEach((bar, index) => {
  const targetHeight = bar.style.height || "60%";
  bar.style.height = "0%";

  setTimeout(() => {
    bar.style.height = targetHeight;
  }, 600 + index * 130);
});

/* Premium card tilt effect */
cards.forEach((card) => {
  card.addEventListener("mousemove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const rotateX = ((y / rect.height) - 0.5) * -6;
    const rotateY = ((x / rect.width) - 0.5) * 6;

    card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
  });

  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
  });
});

/* Logo glow follows mouse */
document.addEventListener("mousemove", (event) => {
  if (!logoCard) return;

  const rect = logoCard.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  logoCard.style.setProperty("--mx", `${x}px`);
  logoCard.style.setProperty("--my", `${y}px`);
});

/* Hero parallax */
document.addEventListener("mousemove", (event) => {
  if (!heroVisual) return;

  const x = (event.clientX / window.innerWidth - 0.5) * 18;
  const y = (event.clientY / window.innerHeight - 0.5) * 18;

  heroVisual.style.transform = `translate3d(${x}px, ${y}px, 0)`;
});

/* Counter animation */
const counters = document.querySelectorAll(".hero-stats strong, .mini-stat strong");

const animateCounter = (element) => {
  const text = element.textContent.trim();

  if (!/\d/.test(text)) return;

  const numberOnly = Number(text.replace(/[^\d]/g, ""));
  if (!numberOnly) return;

  let current = 0;
  const duration = 1200;
  const start = performance.now();

  const formatValue = (value) => {
    if (text.includes("Rp")) {
      return "Rp" + Math.floor(value).toLocaleString("id-ID");
    }

    return Math.floor(value).toLocaleString("id-ID");
  };

  const run = (time) => {
    const progress = Math.min((time - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);

    current = numberOnly * eased;
    element.textContent = formatValue(current);

    if (progress < 1) {
      requestAnimationFrame(run);
    } else {
      element.textContent = text;
    }
  };

  requestAnimationFrame(run);
};

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.7 }
);

counters.forEach((counter) => counterObserver.observe(counter));

/* WhatsApp click message */
const whatsappLink = document.querySelector("a[href*='wa.me']");
if (whatsappLink) {
  const message =
    "Halo Admin Luxora POS, saya ingin bertanya tentang aplikasi Luxora POS dan aktivasi premium.";

  whatsappLink.href =
    "https://wa.me/6285179972565?text=" + encodeURIComponent(message);
}

/* Email subject */
const emailLink = document.querySelector("a[href^='mailto:']");
if (emailLink) {
  emailLink.href =
    "mailto:luxorapos@gmail.com?subject=Informasi%20Luxora%20POS&body=Halo%20Admin%20Luxora%20POS,%20saya%20ingin%20bertanya%20tentang%20aplikasi%20Luxora%20POS.";
}

/* Loading entrance */
window.addEventListener("load", () => {
  document.body.classList.add("loaded");
});