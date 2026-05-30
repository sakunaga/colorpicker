const DATA_KEY = "kpicker-data";

const hexToRgb = (hex) => {
  const h = hex.startsWith("#") ? hex.slice(1) : hex;
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgb(${r}, ${g}, ${b})`;
};

const hexToOklch = (hex) => {
  const h = hex.startsWith("#") ? hex.slice(1) : hex;
  const bigint = parseInt(h, 16);
  let r = ((bigint >> 16) & 255) / 255;
  let g = ((bigint >> 8) & 255) / 255;
  let b = (bigint & 255) / 255;
  r = r <= 0.04045 ? r / 12.92 : ((r + 0.055) / 1.055) ** 2.4;
  g = g <= 0.04045 ? g / 12.92 : ((g + 0.055) / 1.055) ** 2.4;
  b = b <= 0.04045 ? b / 12.92 : ((b + 0.055) / 1.055) ** 2.4;
  const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
  const y = r * 0.2126729 + g * 0.7151522 + b * 0.072175;
  const z = r * 0.0193339 + g * 0.119192 + b * 0.9503041;
  const l_ =
    Math.cbrt(x) * 0.819022437996703 +
    Math.cbrt(y) * 0.3619062600528904 +
    Math.cbrt(z) * -0.1288737815209879;
  const m_ =
    Math.cbrt(x) * 0.0329836539323885 +
    Math.cbrt(y) * 0.9292868615863434 +
    Math.cbrt(z) * 0.0361446663506424;
  const s_ =
    Math.cbrt(x) * 0.0481771893596242 +
    Math.cbrt(y) * 0.2642395317527308 +
    Math.cbrt(z) * 0.6335478284694309;
  const L =
    0.210454268309314 * l_ + 0.7936177747023054 * m_ - 0.0040720430116193 * s_;
  const a =
    1.9779985324311684 * l_ - 2.4285922420485799 * m_ + 0.450593709617411 * s_;
  const b_ =
    0.0259040424655478 * l_ + 0.7827717124575296 * m_ - 0.8086757549230774 * s_;
  const C = Math.sqrt(a * a + b_ * b_);
  let H = (Math.atan2(b_, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  const Lpct = Math.round(L * 100);
  const Cround = Math.round(C * 1000) / 1000;
  const Hround = Math.round(H * 10) / 10;
  return `oklch(${Lpct}% ${Cround} ${Hround})`;
};

const hexToHsl = (hex) => {
  const h = hex.startsWith("#") ? hex.slice(1) : hex;
  const bigint = parseInt(h, 16);
  let r = (bigint >> 16) & 255;
  let g = (bigint >> 8) & 255;
  let b = bigint & 255;
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h_, s, l = (max + min) / 2;
  if (max === min) {
    h_ = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h_ = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h_ = ((b - r) / d + 2) / 6;
        break;
      default:
        h_ = ((r - g) / d + 4) / 6;
        break;
    }
  }
  h_ = Math.round(h_ * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  return `hsl(${h_}, ${s}%, ${l}%)`;
};

const COPY_ICON_GRAY = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="#6b7280" stroke-width="1.8" fill="none"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="#6b7280" stroke-width="1.8" stroke-linecap="round" fill="none"/></svg>`;
const CHECK_ICON_GRAY = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="#6b7280" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

const animateIcon = (iconEl, svg) => {
  iconEl.style.animation = "none";
  void iconEl.offsetHeight;
  iconEl.innerHTML = svg;
  iconEl.style.animation = `iconBounceIn 0.45s ${SPRING} forwards`;
};

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {}
};

const params = new URLSearchParams(location.search);
const colorId = params.get("id");

const loadData = () => {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const init = () => {
  const backLink = document.getElementById("back-link");
  backLink.href = chrome?.runtime?.getURL?.("index.html") ?? "index.html";

  if (!colorId) {
    document.getElementById("color-detail-root").classList.add("hidden");
    document.getElementById("color-not-found").classList.remove("hidden");
    return;
  }

  const appData = loadData();
  const color = appData?.colors?.find((c) => c.id === colorId);

  if (!color) {
    document.getElementById("color-detail-root").classList.add("hidden");
    document.getElementById("color-not-found").classList.remove("hidden");
    return;
  }

  const swatch = document.getElementById("color-detail-swatch");
  const nameEl = document.getElementById("color-detail-name");
  const hexEl = document.getElementById("color-detail-hex");
  const rgbEl = document.getElementById("color-detail-rgb");
  const hslEl = document.getElementById("color-detail-hsl");
  const oklchEl = document.getElementById("color-detail-oklch");

  const hexVal = (color.hex.startsWith("#") ? color.hex : "#" + color.hex).toUpperCase();

  swatch.style.background = color.hex;
  swatch.style.borderColor = (color.hex === "#ffffff" || color.hex === "#fff") ? "#e5e7eb" : "transparent";
  nameEl.textContent = color.name || color.hex;
  hexEl.value = hexVal;
  rgbEl.value = hexToRgb(color.hex);
  hslEl.value = hexToHsl(color.hex);
  oklchEl.value = hexToOklch(color.hex);

  document.querySelectorAll(".color-detail-copy").forEach((btn) => {
    btn.addEventListener("click", () => {
      const fmt = btn.dataset.format;
      const text =
        fmt === "hex" ? hexVal : fmt === "rgb" ? hexToRgb(color.hex) : fmt === "hsl" ? hexToHsl(color.hex) : hexToOklch(color.hex);
      copyToClipboard(text);

      const iconEl = btn.querySelector(".color-detail-copy-icon");
      if (iconEl) {
        if (btn._revertTimer) clearTimeout(btn._revertTimer);
        animateIcon(iconEl, CHECK_ICON_GRAY);
        btn._revertTimer = setTimeout(() => {
          animateIcon(iconEl, COPY_ICON_GRAY);
          btn._revertTimer = null;
        }, 1600);
      }
    });
  });
};

init();
