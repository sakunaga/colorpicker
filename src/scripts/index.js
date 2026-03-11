const pickerBtn = document.querySelector("#picker-btn");
const clearBtn = document.querySelector("#clear-btn");
const colorList = document.querySelector(".all-colors");
const exportBtn = document.querySelector("#export-btn");
const emptyState = document.querySelector("#empty-state");
const toastWrapper = document.querySelector("#toast-wrapper");

let pickedColors = JSON.parse(localStorage.getItem("colors-list")) || [];
let toastTimer = null;

const COPY_ICON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="9" y="9" width="13" height="13" rx="2" stroke="white" stroke-width="1.8" fill="none"/>
  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="white" stroke-width="1.8" stroke-linecap="round" fill="none"/>
</svg>`;

const CHECK_ICON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 6L9 17L4 12" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const SPRING = "ease";

const showToast = () => {
  if (toastTimer) clearTimeout(toastTimer);
  toastWrapper.style.animation = "none";
  void toastWrapper.offsetHeight;
  toastWrapper.style.animation = `toastBounceIn 0.25s ${SPRING} forwards`;
  toastTimer = setTimeout(() => {
    toastWrapper.style.animation = "toastFadeOut 0.25s ease forwards";
  }, 1800);
};

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // コピー失敗時も同じフィードバックを返す
  }
  showToast();
};

const getFormattedDateTime = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
};

const exportColors = () => {
  const colorText = pickedColors.join("\n");
  const blob = new Blob([colorText], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `colors_${getFormattedDateTime()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const hexToRgb = (hex) => {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgb(${r}, ${g}, ${b})`;
};

const deleteColor = (hex) => {
  pickedColors = pickedColors.filter((c) => c !== hex);
  localStorage.setItem("colors-list", JSON.stringify(pickedColors));
  showColors();
};

const animateIcon = (iconEl, svg) => {
  iconEl.style.animation = "none";
  void iconEl.offsetHeight;
  iconEl.innerHTML = svg;
  iconEl.style.animation = `iconBounceIn 0.2s ${SPRING} forwards`;
};

const showColors = () => {
  const colorsListEl = document.querySelector(".colors-list");
  const hasColors = pickedColors.length > 0;

  colorsListEl.classList.toggle("hidden", !hasColors);
  emptyState.classList.toggle("hidden", hasColors);

  colorList.innerHTML = pickedColors
    .map(
      (color) => `
      <li class="color-card group relative rounded-xl overflow-hidden cursor-pointer border border-gray-200/70"
          style="aspect-ratio: 1;"
          data-color="${color}">
        <div class="w-full h-full" style="background: ${color};"></div>
        <div class="copy-overlay absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <span class="overlay-icon" style="display:flex;align-items:center;justify-content:center;">${COPY_ICON}</span>
        </div>
        <button class="delete-btn absolute top-1 right-1 w-5 h-5 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-150"
                data-color="${color}"
                title="削除">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6l12 12" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </button>
        <div class="absolute bottom-0 left-0 right-0 px-1.5 py-1 bg-black/30">
          <span class="hex-label block text-white text-[9px] font-mono leading-tight truncate uppercase">${color}</span>
        </div>
      </li>
    `
    )
    .join("");

  colorList.querySelectorAll(".color-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".delete-btn")) return;

      const copyOverlay = card.querySelector(".copy-overlay");
      const overlayIcon = card.querySelector(".overlay-icon");

      if (card._revertTimer) clearTimeout(card._revertTimer);

      // オーバーレイを強制表示してチェックアイコンに切り替え
      copyOverlay.style.opacity = "1";
      animateIcon(overlayIcon, CHECK_ICON);

      copyToClipboard(card.dataset.color);

      // 1.6秒後にコピーアイコンへ戻す
      card._revertTimer = setTimeout(() => {
        animateIcon(overlayIcon, COPY_ICON);
        copyOverlay.style.opacity = "";
        card._revertTimer = null;
      }, 1600);
    });
  });

  colorList.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteColor(btn.dataset.color);
    });
  });
};

const activateEyeDropper = async () => {
  document.body.style.display = "none";
  try {
    const { sRGBHex } = await new EyeDropper().open();
    if (!pickedColors.includes(sRGBHex)) {
      pickedColors.push(sRGBHex);
      localStorage.setItem("colors-list", JSON.stringify(pickedColors));
    }
    showColors();
  } catch {
    // ユーザーがキャンセルした場合は何もしない
  } finally {
    document.body.style.display = "block";
  }
};

const clearAllColors = () => {
  pickedColors = [];
  localStorage.removeItem("colors-list");
  showColors();
};

clearBtn.addEventListener("click", clearAllColors);
pickerBtn.addEventListener("click", activateEyeDropper);
exportBtn.addEventListener("click", exportColors);

showColors();
