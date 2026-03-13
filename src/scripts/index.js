const pickerBtn = document.querySelector("#picker-btn");
const clearBtn = document.querySelector("#clear-btn");
const colorList = document.querySelector(".all-colors");
const exportBtn = document.querySelector("#export-btn");
const emptyState = document.querySelector("#empty-state");
const toastWrapper = document.querySelector("#toast-wrapper");

const DATA_KEY = "kpicker-data";
const COPY_FORMAT_KEY = "kpicker-copy-format";
const CURRENT_FOLDER_KEY = "kpicker-current-folder";
const DEFAULT_FOLDER_ID = "default";

const generateId = () => crypto.randomUUID().slice(0, 8);

const migrateFromLegacy = () => {
  const legacy = localStorage.getItem("colors-list");
  if (!legacy) return null;
  try {
    const hexList = JSON.parse(legacy);
    if (!Array.isArray(hexList) || hexList.length === 0) return null;
    const colors = hexList.map((hex, i) => ({
      id: generateId(),
      hex,
      name: "",
      locked: false,
      globalOrder: i,
    }));
    const folderColors = colors.map((c, i) => ({
      folderId: DEFAULT_FOLDER_ID,
      colorId: c.id,
      order: i,
    }));
    const data = {
      folders: [
        {
          id: DEFAULT_FOLDER_ID,
          name: "すべて",
          order: 0,
          isDefault: true,
          locked: false,
        },
      ],
      colors,
      folderColors,
    };
    localStorage.removeItem("colors-list");
    return data;
  } catch {
    return null;
  }
};

const migrateToFolderColors = (data) => {
  if (data.folderColors) return data;
  const folderColors = [];
  data.colors.forEach((c) => {
    const folderId = c.folderId ?? DEFAULT_FOLDER_ID;
    const order = c.order ?? 999;
    folderColors.push({ folderId, colorId: c.id, order });
    delete c.folderId;
    delete c.order;
  });
  data.folderColors = folderColors;
  saveData(data);
  return data;
};

const ensureGlobalOrder = (data) => {
  let needsSave = false;
  data.colors.forEach((c, i) => {
    if (c.globalOrder == null) {
      c.globalOrder = c.order ?? i;
      needsSave = true;
    }
  });
  if (needsSave) saveData(data);
  return data;
};

const loadData = () => {
  const migrated = migrateFromLegacy();
  if (migrated) {
    saveData(migrated);
    return migrated;
  }
  const raw = localStorage.getItem(DATA_KEY);
  if (!raw) {
    return {
      folders: [
        {
          id: DEFAULT_FOLDER_ID,
          name: "すべて",
          order: 0,
          isDefault: true,
          locked: false,
        },
      ],
      colors: [],
      folderColors: [],
    };
  }
  try {
    let data = JSON.parse(raw);
    data = migrateToFolderColors(data);
    return ensureGlobalOrder(data);
  } catch {
    return {
      folders: [
        {
          id: DEFAULT_FOLDER_ID,
          name: "すべて",
          order: 0,
          isDefault: true,
          locked: false,
        },
      ],
      colors: [],
      folderColors: [],
    };
  }
};

const saveData = (data) => {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
};

let appData = loadData();
const loadCurrentFolderId = () => {
  const saved = localStorage.getItem(CURRENT_FOLDER_KEY);
  const exists = appData.folders.some((f) => f.id === saved);
  return exists ? saved : (appData.folders[0]?.id ?? DEFAULT_FOLDER_ID);
};
let currentFolderId = loadCurrentFolderId();
let selectedColorFamily = "すべて";
let toastTimer = null;

const COPY_ICON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="9" y="9" width="13" height="13" rx="2" stroke="white" stroke-width="1.8" fill="none"/>
  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="white" stroke-width="1.8" stroke-linecap="round" fill="none"/>
</svg>`;

const CHECK_ICON = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 6L9 17L4 12" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const GRIP_ICON = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="9" cy="6" r="1.5" fill="currentColor"/>
  <circle cx="15" cy="6" r="1.5" fill="currentColor"/>
  <circle cx="9" cy="12" r="1.5" fill="currentColor"/>
  <circle cx="15" cy="12" r="1.5" fill="currentColor"/>
  <circle cx="9" cy="18" r="1.5" fill="currentColor"/>
  <circle cx="15" cy="18" r="1.5" fill="currentColor"/>
</svg>`;

const LOCK_ICON = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
  <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
</svg>`;

const UNLOCK_ICON = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
  <path d="M7 11V7a5 5 0 0110 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
</svg>`;

const DETAIL_ICON = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
  <path d="M12 16v-4M12 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>`;

const EDIT_ICON = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/>
  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;

const TRASH_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <polyline points="3 6 5 6 21 6" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/>
  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/>
  <line x1="10" y1="11" x2="10" y2="17" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/>
  <line x1="14" y1="11" x2="14" y2="17" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/>
</svg>`;

const LOCK_ICON_LG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="11" width="18" height="11" rx="2" stroke="#6b7280" stroke-width="2" fill="none"/>
  <path d="M7 11V7a5 5 0 0110 0v4" stroke="#6b7280" stroke-width="2" stroke-linecap="round" fill="none"/>
</svg>`;

const UNLOCK_ICON_LG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="11" width="18" height="11" rx="2" stroke="#6b7280" stroke-width="2" fill="none"/>
  <path d="M7 11V7a5 5 0 0110 0" stroke="#6b7280" stroke-width="2" stroke-linecap="round" fill="none"/>
</svg>`;

const CHECK_ICON_GRAY = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="#6b7280" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const COPY_ICON_GRAY = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="#6b7280" stroke-width="1.8" fill="none"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="#6b7280" stroke-width="1.8" stroke-linecap="round" fill="none"/></svg>`;
const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

const showToast = () => {
  if (toastTimer) clearTimeout(toastTimer);
  toastWrapper.style.animation = "none";
  void toastWrapper.offsetHeight;
  toastWrapper.style.animation = `toastBounceIn 0.5s ${SPRING} forwards`;
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

const hexToRgb = (hex) => {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgb(${r}, ${g}, ${b})`;
};

const hexToOklch = (hex) => {
  const bigint = parseInt(hex.slice(1), 16);
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
  const bigint = parseInt(hex.slice(1), 16);
  let r = (bigint >> 16) & 255;
  let g = (bigint >> 8) & 255;
  let b = bigint & 255;
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  h = Math.round(h * 360);
  s = Math.round(s * 100);
  l = Math.round(l * 100);
  return `hsl(${h}, ${s}%, ${l}%)`;
};

/** hex から HSL の数値 { h, s, l } を返す（h: 0-360, s/l: 0-100） */
const hexToHslValues = (hex) => {
  const bigint = parseInt(hex.slice(1), 16);
  let r = ((bigint >> 16) & 255) / 255;
  let g = ((bigint >> 8) & 255) / 255;
  let b = (bigint & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  const l = (max + min) / 2;
  const s =
    max === min ? 0 : l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
  if (max !== min) {
    switch (max) {
      case r:
        h = ((g - b) / (max - min) + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / (max - min) + 2) / 6;
        break;
      default:
        h = ((r - g) / (max - min) + 4) / 6;
        break;
    }
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

/** 色系統（白・黒・グレーは明度・彩度で先に判定し、他は色相で判定。水色→青、ピンク→赤） */
const COLOR_FAMILIES = [
  { id: "白", swatch: "#ffffff", spec: "light" },
  { id: "黒", swatch: "#212121", spec: "dark" },
  { id: "グレー", swatch: "#9e9e9e", spec: "gray" },
  { id: "赤", swatch: "#e53935", ranges: [[0, 25], [300, 360]] },
  { id: "橙", swatch: "#ff9800", ranges: [[20, 42]] },
  { id: "黄", swatch: "#fdd835", ranges: [[42, 75]] },
  { id: "黄緑", swatch: "#8bc34a", ranges: [[70, 95]] },
  { id: "緑", swatch: "#4caf50", ranges: [[95, 170]] },
  { id: "青", swatch: "#2196f3", ranges: [[170, 260]] },
  { id: "紫", swatch: "#9c27b0", ranges: [[260, 310]] },
  { id: "茶", swatch: "#795548", ranges: [[20, 45]] },
];

const isColorInHueRanges = (h, ranges) =>
  ranges.some(([minH, maxH]) => h >= minH && h <= maxH);

const isAchromatic = (hsl) =>
  hsl.l <= 20 ||
  (hsl.l >= 90 && hsl.s < 25) ||
  (hsl.s < 15 && hsl.l > 20 && hsl.l < 90);

const colorBelongsToFamily = (color, family) => {
  const hsl = hexToHslValues(color.hex);
  if (family.spec === "light") return hsl.l >= 90 && hsl.s < 25;
  if (family.spec === "dark") return hsl.l <= 20;
  if (family.spec === "gray") return hsl.s < 15 && hsl.l > 20 && hsl.l < 90;
  return isColorInHueRanges(hsl.h, family.ranges) && !isAchromatic(hsl);
};

const getExistingColorFamilies = (colors) => {
  const found = new Set();
  colors.forEach((c) => {
    for (const f of COLOR_FAMILIES) {
      if (colorBelongsToFamily(c, f)) {
        found.add(f.id);
        break;
      }
    }
  });
  return COLOR_FAMILIES.filter((f) => found.has(f.id));
};

const getCopyFormat = () => localStorage.getItem(COPY_FORMAT_KEY) || "hex";

const formatColorForCopy = (hex) => {
  const fmt = getCopyFormat();
  if (fmt === "rgb") return hexToRgb(hex);
  if (fmt === "hsl") return hexToHsl(hex);
  if (fmt === "oklch") return hexToOklch(hex);
  return hex;
};

const getColorsInFolder = (folderId) => {
  const fc = appData.folderColors || [];
  const isAll = folderId === DEFAULT_FOLDER_ID;
  if (isAll) {
    return [...appData.colors].sort(
      (a, b) => (a.globalOrder ?? 999) - (b.globalOrder ?? 999),
    );
  }
  const colorIds = fc
    .filter((fc) => fc.folderId === folderId)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
    .map((fc) => fc.colorId);
  return colorIds
    .map((id) => appData.colors.find((c) => c.id === id))
    .filter(Boolean);
};

const getSortedFolders = () =>
  [...appData.folders].sort((a, b) => a.order - b.order);

const deleteColor = (colorId) => {
  const color = appData.colors.find((c) => c.id === colorId);
  if (!color || color.locked) return;
  appData.colors = appData.colors.filter((c) => c.id !== colorId);
  appData.folderColors = (appData.folderColors || []).filter(
    (fc) => fc.colorId !== colorId,
  );
  saveData(appData);
  render();
};

const moveColorInFolder = (colorId, fromIndex, toIndex) => {
  const folderColorList = getColorsInFolder(currentFolderId);
  if (fromIndex === toIndex) return;
  const color = folderColorList[fromIndex];
  if (!color) return;
  const ids = folderColorList.map((c) => c.id);
  const [removed] = ids.splice(fromIndex, 1);
  ids.splice(toIndex, 0, removed);
  const orderMap = {};
  ids.forEach((id, i) => (orderMap[id] = i));
  const isAll = currentFolderId === DEFAULT_FOLDER_ID;
  if (isAll) {
    appData.colors = appData.colors.map((c) => ({
      ...c,
      globalOrder: orderMap[c.id] ?? c.globalOrder ?? 999,
    }));
  } else {
    const fc = appData.folderColors || [];
    ids.forEach((id, i) => {
      const entry = fc.find(
        (f) => f.folderId === currentFolderId && f.colorId === id,
      );
      if (entry) entry.order = i;
    });
  }
  saveData(appData);
  render();
};

const addColorToFolder = (colorId, targetFolderId) => {
  const fc = appData.folderColors || [];
  if (fc.some((f) => f.folderId === targetFolderId && f.colorId === colorId))
    return;
  const maxOrder =
    Math.max(
      -1,
      ...fc
        .filter((f) => f.folderId === targetFolderId)
        .map((f) => f.order ?? 0),
    ) + 1;
  fc.push({ folderId: targetFolderId, colorId, order: maxOrder });
  appData.folderColors = fc;
  saveData(appData);
  render();
};

const moveColorToFolder = (colorId, targetFolderId) => {
  addColorToFolder(colorId, targetFolderId);
};

const toggleColorLock = (colorId) => {
  const color = appData.colors.find((c) => c.id === colorId);
  if (!color) return;
  color.locked = !color.locked;
  saveData(appData);
  render();
};

const toggleFolderLock = (folderId) => {
  const folder = appData.folders.find((f) => f.id === folderId);
  if (!folder || folder.isDefault) return;
  folder.locked = !folder.locked;
  saveData(appData);
  render();
};

const addFolder = (name) => {
  const id = generateId();
  const maxOrder = Math.max(0, ...appData.folders.map((f) => f.order));
  appData.folders.push({
    id,
    name: name || "新規フォルダ",
    order: maxOrder + 1,
    isDefault: false,
    locked: false,
  });
  saveData(appData);
  render();
};

const addFolderFromColor = (colorId) => {
  const color = appData.colors.find((c) => c.id === colorId);
  if (!color) return;
  const folderName =
    (color.name && String(color.name).trim()) || color.hex;
  const id = generateId();
  const maxOrder = Math.max(0, ...appData.folders.map((f) => f.order));
  appData.folders.push({
    id,
    name: folderName,
    order: maxOrder + 1,
    isDefault: false,
    locked: false,
  });
  addColorToFolder(colorId, id);
  currentFolderId = id;
  saveData(appData);
  render();
};

const deleteFolder = (folderId) => {
  const folder = appData.folders.find((f) => f.id === folderId);
  if (!folder || folder.isDefault || folder.locked) return;
  appData.folderColors = (appData.folderColors || []).filter(
    (fc) => fc.folderId !== folderId,
  );
  appData.folders = appData.folders.filter((f) => f.id !== folderId);
  if (currentFolderId === folderId) {
    currentFolderId = DEFAULT_FOLDER_ID;
    localStorage.setItem(CURRENT_FOLDER_KEY, currentFolderId);
  }
  saveData(appData);
  render();
};

const renameFolder = (folderId, newName) => {
  const folder = appData.folders.find((f) => f.id === folderId);
  if (!folder) return;
  folder.name = newName || folder.name;
  saveData(appData);
  render();
};

const updateColorName = (colorId, name) => {
  const color = appData.colors.find((c) => c.id === colorId);
  if (!color) return;
  color.name = name ?? "";
  saveData(appData);
  render();
};

const clearAllColors = () => {
  const folderColorList = getColorsInFolder(currentFolderId);
  const toRemove = folderColorList.filter((c) => !c.locked);
  if (toRemove.length === 0) return;
  const folder = appData.folders.find((f) => f.id === currentFolderId);
  const folderName = folder?.name ?? "このフォルダ";
  const msg =
    toRemove.length === folderColorList.length
      ? `${folderName}の${toRemove.length}色を削除しますか？`
      : `${folderName}のロックされていない${toRemove.length}色を削除しますか？`;
  showConfirmModal(msg, () => {
    const fc = appData.folderColors || [];
    toRemove.forEach((c) => {
      const idx = fc.findIndex(
        (f) => f.folderId === currentFolderId && f.colorId === c.id,
      );
      if (idx >= 0) fc.splice(idx, 1);
    });
    appData.folderColors = fc;
    saveData(appData);
    render();
  });
};

const toggleLockAllInFolder = () => {
  const folderColorList = getColorsInFolder(currentFolderId);
  if (folderColorList.length === 0) return;
  const allLocked = folderColorList.every((c) => c.locked);
  folderColorList.forEach((c) => {
    c.locked = !allLocked;
  });
  saveData(appData);
  render();
};

const animateIcon = (iconEl, svg) => {
  iconEl.style.animation = "none";
  void iconEl.offsetHeight;
  iconEl.innerHTML = svg;
  iconEl.style.animation = `iconBounceIn 0.45s ${SPRING} forwards`;
};

const sanitizeFilename = (name) =>
  String(name)
    .replace(/[/\\:*?"<>|]/g, "_")
    .replace(/[^\x00-\x7F]/g, "_")
    .trim() || "colors";

const exportColors = () => {
  const folderColors = getColorsInFolder(currentFolderId);
  if (folderColors.length === 0) return;
  const folder = appData.folders.find((f) => f.id === currentFolderId);
  const folderName = sanitizeFilename(folder?.name ?? "colors");
  const colorText = folderColors.map((c) => c.hex).join("\n");
  const filename = `colors_${folderName}_${getFormattedDateTime()}.txt`;

  const blob = new Blob([colorText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const filterByText = (colors, q) => {
  if (!q.trim()) return colors;
  const lower = q.trim().toLowerCase();
  return colors.filter(
    (c) =>
      c.hex.toLowerCase().includes(lower) ||
      (c.name && c.name.toLowerCase().includes(lower))
  );
};

const filterByFamilies = (colors, selectedId) => {
  if (!selectedId || selectedId === "すべて") return colors;
  const family = COLOR_FAMILIES.find((f) => f.id === selectedId);
  if (!family) return colors;
  return colors.filter((c) => colorBelongsToFamily(c, family));
};

const render = () => {
  const formatSelect = document.querySelector("#copy-format-select");
  if (formatSelect) formatSelect.value = getCopyFormat();

  const folderColors = getColorsInFolder(currentFolderId);
  const existingFamilies = getExistingColorFamilies(folderColors);
  const familyDropdown = document.querySelector("#color-family-dropdown");
  const familyLabel = document.querySelector("#color-family-label");
  if (familyDropdown) {
    const allOpt = { id: "すべて", swatch: "#94a3b8" };
    const opts = [allOpt, ...existingFamilies];
    familyDropdown.innerHTML = opts
      .map(
        (f) => `
        <div class="color-family-option flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-xs text-gray-700 ${selectedColorFamily === f.id ? "bg-orange-50" : ""}"
             data-family-id="${f.id}">
          <span class="w-4 h-4 rounded shrink-0 ${f.swatch === "#ffffff" ? "border border-gray-300" : "border border-gray-200"}" style="background:${f.swatch}"></span>
          <span>${f.id}</span>
        </div>
      `
      )
      .join("");
  }
  if (familyLabel) familyLabel.textContent = selectedColorFamily;
  const lockAllBtn = document.querySelector("#lock-all-btn");
  const lockAllIcon = document.querySelector("#lock-all-icon");
  const lockAllLabel = document.querySelector("#lock-all-label");
  if (lockAllIcon && lockAllBtn) {
    const allLocked =
      folderColors.length > 0 && folderColors.every((c) => c.locked);
    lockAllIcon.innerHTML = allLocked ? UNLOCK_ICON_LG : LOCK_ICON_LG;
    if (lockAllLabel) lockAllLabel.textContent = allLocked ? "ロック解除" : "ロックする";
    lockAllBtn.disabled = folderColors.length === 0;
  }
  const clearBtnIcon = document.querySelector("#clear-btn-icon");
  if (clearBtnIcon) clearBtnIcon.innerHTML = TRASH_ICON;
  const searchQuery = document.querySelector("#search-input")?.value ?? "";
  const afterText = filterByText(folderColors, searchQuery);
  const filteredColors = filterByFamilies(afterText, selectedColorFamily);
  const hasFilteredColors = filteredColors.length > 0;
  const folders = getSortedFolders();

  const hasAnyColors = appData.colors.length > 0;
  document
    .querySelector(".colors-list")
    ?.classList.toggle("hidden", !hasAnyColors);
  emptyState?.classList.toggle("hidden", hasFilteredColors);
  document
    .querySelector("#colors-grid-section")
    ?.classList.toggle("hidden", !hasFilteredColors);
  exportBtn.disabled = !hasFilteredColors;

  const folderTabsEl = document.querySelector("#folder-tabs");
  if (folderTabsEl) {
    folderTabsEl.innerHTML = `
      ${folders
        .map(
          (f) => `
        <div class="folder-tab ${f.id === currentFolderId ? "active" : ""}"
             data-folder-id="${f.id}"
             data-folder-name="${f.name.replace(/"/g, "&quot;")}"
             draggable="${!f.isDefault}">
          ${
            !f.isDefault
              ? `
            <button class="folder-lock-btn ${f.locked ? "locked" : ""}" data-folder-id="${f.id}" title="${f.locked ? "ロック解除" : "ロック"}">
              ${f.locked ? LOCK_ICON : UNLOCK_ICON}
            </button>
          `
              : ""
          }
          <span class="folder-tab-name">${f.name}</span>
          ${!f.isDefault && !f.locked ? `<button class="folder-delete-btn" data-folder-id="${f.id}" title="フォルダを削除">×</button>` : ""}
        </div>
      `,
        )
        .join("")}
      <button id="add-folder-btn" class="folder-tab add-btn" title="フォルダを追加">+</button>
    `;
  }

  if (!hasFilteredColors) {
    colorList.innerHTML = "";
  } else {
    colorList.innerHTML = filteredColors
      .map(
        (color, index) => `
      <li class="color-card group relative rounded-xl overflow-hidden cursor-pointer border border-gray-200/70"
          style="aspect-ratio: 1;"
          data-color-id="${color.id}"
          data-color="${color.hex}"
          data-index="${index}">
        <div class="w-full h-full" style="background: ${color.hex};"></div>
        <div class="copy-overlay absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <span class="overlay-icon" style="display:flex;align-items:center;justify-content:center;">${COPY_ICON}</span>
        </div>
        <div class="drag-handle absolute top-1 left-1 w-5 h-5 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center cursor-grab active:cursor-grabbing text-white opacity-0 group-hover:opacity-100 transition-all duration-150 touch-none"
             draggable="true"
             data-index="${index}"
             data-color-id="${color.id}"
             title="並び替え">
          ${GRIP_ICON}
        </div>
        ${
          color.locked
            ? `
        <button class="lock-toggle-btn absolute top-1 right-1 w-5 h-5 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-150 cursor-pointer"
                data-color-id="${color.id}"
                title="ロック解除">
          ${UNLOCK_ICON}
        </button>
        `
            : `
        <button class="delete-btn absolute top-1 right-1 w-5 h-5 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-150 cursor-pointer"
                data-color-id="${color.id}"
                title="削除">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6l12 12" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
          </svg>
        </button>
        `
        }
        <div class="absolute bottom-0 left-0 right-0 px-1.5 py-1 bg-black/30">
          <span class="hex-label block text-white text-[11px] font-mono leading-tight truncate uppercase">${color.name || color.hex}</span>
        </div>
      </li>
    `,
      )
      .join("");
  }

  bindColorCardEvents();
  bindFolderTabEvents();
  bindColorFamilyOptions();

};

const bindColorCardEvents = () => {
  colorList.querySelectorAll(".color-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (
        e.target.closest(".delete-btn") ||
        e.target.closest(".drag-handle") ||
        e.target.closest(".lock-toggle-btn")
      )
        return;

      const copyOverlay = card.querySelector(".copy-overlay");
      const overlayIcon = card.querySelector(".overlay-icon");

      if (card._revertTimer) clearTimeout(card._revertTimer);

      copyOverlay.style.opacity = "1";
      animateIcon(overlayIcon, CHECK_ICON);

      copyToClipboard(formatColorForCopy(card.dataset.color));

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
      deleteColor(btn.dataset.colorId);
    });
  });

  colorList.querySelectorAll(".lock-toggle-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleColorLock(btn.dataset.colorId);
    });
  });

  let draggedIndex = null;
  let draggedColorId = null;
  colorList.querySelectorAll(".drag-handle").forEach((handle) => {
    handle.addEventListener("mousedown", (e) => e.stopPropagation());
    handle.addEventListener("click", (e) => e.stopPropagation());
    handle.addEventListener("dragstart", (e) => {
      draggedIndex = parseInt(e.currentTarget.dataset.index, 10);
      draggedColorId = e.currentTarget.dataset.colorId;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(draggedIndex));
      e.dataTransfer.setData("color-id", draggedColorId);
      e.currentTarget.closest(".color-card").classList.add("opacity-50");
    });
    handle.addEventListener("dragend", (e) => {
      e.currentTarget.closest(".color-card")?.classList.remove("opacity-50");
      draggedIndex = null;
      draggedColorId = null;
    });
  });

  colorList.querySelectorAll(".color-card").forEach((card) => {
    card.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (draggedIndex !== null) {
        const toIndex = parseInt(card.dataset.index, 10);
        if (draggedIndex !== toIndex) {
          card.classList.add("ring-2", "ring-[#ff5c00]");
        }
      }
    });
    card.addEventListener("dragleave", (e) => {
      card.classList.remove("ring-2", "ring-[#ff5c00]");
    });
    card.addEventListener("drop", (e) => {
      e.preventDefault();
      card.classList.remove("ring-2", "ring-[#ff5c00]");
      if (draggedIndex !== null) {
        const toIndex = parseInt(card.dataset.index, 10);
        const colorId = e.dataTransfer.getData("color-id");
        if (colorId && draggedIndex !== toIndex) {
          moveColorInFolder(colorId, draggedIndex, toIndex);
        }
      }
    });
  });

  colorList.querySelectorAll(".color-card").forEach((card) => {
    card.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      showColorContextMenu(e, card.dataset.colorId);
    });
  });
};

const showConfirmModal = (message, onConfirm) => {
  const modal = document.getElementById("confirm-modal");
  const messageEl = document.getElementById("confirm-modal-message");
  const okBtn = document.getElementById("confirm-modal-ok");
  const cancelBtn = document.getElementById("confirm-modal-cancel");
  const overlay = modal.querySelector(".confirm-modal-overlay");

  messageEl.textContent = message;
  modal.classList.add("confirm-modal-visible");

  const close = (confirmed) => {
    modal.classList.remove("confirm-modal-visible");
    okBtn.removeEventListener("click", onOk);
    cancelBtn.removeEventListener("click", onCancel);
    overlay.removeEventListener("click", onCancel);
    document.removeEventListener("keydown", onKeydown);
    if (confirmed) onConfirm();
  };

  const onOk = () => close(true);
  const onCancel = () => close(false);
  const onKeydown = (e) => {
    if (e.key === "Enter" && !e.isComposing) onOk();
    if (e.key === "Escape" && !e.isComposing) onCancel();
  };

  okBtn.addEventListener("click", onOk);
  cancelBtn.addEventListener("click", onCancel);
  overlay.addEventListener("click", onCancel);
  document.addEventListener("keydown", onKeydown);
};

const showInputModal = (opts, onConfirm) => {
  const { title = "入力", placeholder = "入力...", initialValue = "" } = opts;
  const modal = document.getElementById("input-modal");
  const input = document.getElementById("input-modal-input");
  const titleEl = document.getElementById("input-modal-title");
  const okBtn = document.getElementById("input-modal-ok");
  const cancelBtn = document.getElementById("input-modal-cancel");
  const overlay = modal.querySelector(".input-modal-overlay");

  titleEl.textContent = title;
  input.placeholder = placeholder;
  input.value = initialValue;
  modal.classList.add("input-modal-visible");
  input.focus();

  const close = (submit) => {
    modal.classList.remove("input-modal-visible");
    okBtn.removeEventListener("click", onOk);
    cancelBtn.removeEventListener("click", onCancel);
    overlay.removeEventListener("click", onCancel);
    input.removeEventListener("keydown", onKeydown);
    if (submit) onConfirm(input.value.trim());
  };

  const onOk = () => close(true);
  const onCancel = () => close(false);
  const onKeydown = (e) => {
    if (e.key === "Enter" && !e.isComposing) onOk();
    if (e.key === "Escape" && !e.isComposing) onCancel();
  };

  okBtn.addEventListener("click", onOk);
  cancelBtn.addEventListener("click", onCancel);
  overlay.addEventListener("click", onCancel);
  input.addEventListener("keydown", onKeydown);
};

const updateDetailActionButtons = (colorId) => {
  const color = appData.colors.find((c) => c.id === colorId);
  const lockIcon = document.getElementById("detail-lock-icon");
  const lockLabel = document.getElementById("detail-lock-label");
  const deleteBtn = document.getElementById("detail-delete-btn");
  if (!color) return;
  const isLocked = color.locked ?? false;
  if (lockIcon) lockIcon.innerHTML = isLocked ? UNLOCK_ICON_LG : LOCK_ICON_LG;
  if (lockLabel) lockLabel.textContent = isLocked ? "ロック解除" : "ロック";
  if (deleteBtn) deleteBtn.style.display = isLocked ? "none" : "";
};

const showColorDetailView = (colorId) => {
  const color = appData.colors.find((c) => c.id === colorId);
  if (!color) return;

  const mainView = document.getElementById("main-view");
  const detailView = document.getElementById("detail-view");
  const swatch = document.getElementById("color-detail-swatch");
  const nameDisplay = document.getElementById("color-detail-name-display");
  const nameInput = document.getElementById("color-detail-name");
  const nameActionBtn = document.getElementById("detail-name-action-btn");
  const nameActionIcon = document.getElementById("detail-name-action-icon");
  const hexEl = document.getElementById("color-detail-hex");
  const rgbEl = document.getElementById("color-detail-rgb");
  const hslEl = document.getElementById("color-detail-hsl");
  const oklchEl = document.getElementById("color-detail-oklch");

  const hexVal = (color.hex.startsWith("#") ? color.hex : "#" + color.hex).toUpperCase();

  swatch.style.background = color.hex;
  const EDIT_ICON_14 = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
  const CHECK_ICON_14 = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17L4 12"/></svg>`;

  const showNameDisplay = () => {
    nameDisplay.textContent = color.name || color.hex || "";
    nameDisplay.classList.remove("hidden");
    nameInput.classList.add("hidden");
    nameActionBtn.classList.remove("is-confirm");
    nameActionBtn.title = "名前を編集";
    nameActionIcon.innerHTML = EDIT_ICON_14;
    nameActionBtn.onclick = showNameInput;
  };
  const showNameInput = () => {
    nameInput.value = color.name || color.hex || "";
    nameDisplay.classList.add("hidden");
    nameInput.classList.remove("hidden");
    nameActionBtn.classList.add("is-confirm");
    nameActionBtn.title = "保存";
    nameActionIcon.innerHTML = CHECK_ICON_14;
    nameActionBtn.onclick = saveNameAndShowDisplay;
    nameInput.focus();
  };
  const saveNameAndShowDisplay = () => {
    const id = detailView.dataset.colorId;
    if (id) updateColorName(id, nameInput.value.trim());
    const c = appData.colors.find((x) => x.id === id);
    nameDisplay.textContent = (c?.name || c?.hex || "").trim() || c?.hex || "";
    setTimeout(showNameDisplay, 0);
  };

  showNameDisplay();
  nameInput.onblur = saveNameAndShowDisplay;
  nameInput.onkeydown = (e) => {
    if (e.key === "Enter" && !e.isComposing) saveNameAndShowDisplay();
    if (e.key === "Escape" && !e.isComposing) {
      nameInput.value = color.name || color.hex || "";
      showNameDisplay();
    }
  };
  hexEl.value = hexVal;
  rgbEl.value = hexToRgb(color.hex);
  hslEl.value = hexToHsl(color.hex);
  oklchEl.value = hexToOklch(color.hex);

  detailView.dataset.colorId = colorId;
  updateDetailActionButtons(colorId);

  mainView.classList.add("hidden");
  detailView.classList.remove("hidden");

  const onContentClick = (e) => {
    const copyBtn = e.target.closest(".color-detail-copy");
    if (copyBtn) {
      const fmt = copyBtn.dataset.format;
      const text =
        fmt === "hex" ? hexVal : fmt === "rgb" ? hexToRgb(color.hex) : fmt === "hsl" ? hexToHsl(color.hex) : hexToOklch(color.hex);
      copyToClipboard(text);
      const iconEl = copyBtn.querySelector(".color-detail-copy-icon");
      if (iconEl) {
        if (copyBtn._revertTimer) clearTimeout(copyBtn._revertTimer);
        animateIcon(iconEl, CHECK_ICON_GRAY);
        copyBtn._revertTimer = setTimeout(() => {
          animateIcon(iconEl, COPY_ICON_GRAY);
          copyBtn._revertTimer = null;
        }, 1600);
      }
      return;
    }
    const lockBtn = e.target.closest("#detail-lock-btn");
    if (lockBtn) {
      toggleColorLock(colorId);
      updateDetailActionButtons(colorId);
      return;
    }
    const deleteBtn = e.target.closest("#detail-delete-btn");
    if (deleteBtn) {
      deleteColor(colorId);
      hideColorDetailView();
    }
  };

  detailView._detailClickHandler = onContentClick;
  detailView.addEventListener("click", onContentClick);
};

const hideColorDetailView = () => {
  const mainView = document.getElementById("main-view");
  const detailView = document.getElementById("detail-view");
  if (detailView._detailClickHandler) {
    detailView.removeEventListener("click", detailView._detailClickHandler);
    detailView._detailClickHandler = null;
  }
  detailView.classList.add("hidden");
  mainView.classList.remove("hidden");
};

const showColorContextMenu = (e, colorId) => {
  const existing = document.querySelector("#color-context-menu");
  if (existing) existing.remove();

  const color = appData.colors.find((c) => c.id === colorId);
  const isLocked = color?.locked ?? false;

  const menu = document.createElement("div");
  menu.id = "color-context-menu";
  menu.className = "context-menu";
  menu.innerHTML = `
    <button class="context-menu-item" data-action="detail">
      <span class="context-menu-icon">${DETAIL_ICON}</span>
      詳細ページ
    </button>
    <button class="context-menu-item" data-action="rename">
      <span class="context-menu-icon">${EDIT_ICON}</span>
      名前を編集
    </button>
    <button class="context-menu-item" data-action="lock">
      <span class="context-menu-icon">${isLocked ? UNLOCK_ICON : LOCK_ICON}</span>
      ${isLocked ? "ロック解除" : "ロック"}
    </button>
  `;

  document.body.appendChild(menu);
  const rect = menu.getBoundingClientRect();
  menu.style.left = `${Math.min(e.clientX, window.innerWidth - rect.width - 8)}px`;
  menu.style.top = `${Math.min(e.clientY, window.innerHeight - rect.height - 8)}px`;

  const close = () => {
    menu.remove();
    document.removeEventListener("click", close);
  };

  setTimeout(() => document.addEventListener("click", close), 0);

  menu.querySelector("[data-action=detail]").addEventListener("click", (ev) => {
    ev.stopPropagation();
    close();
    showColorDetailView(colorId);
  });

  menu.querySelector("[data-action=rename]").addEventListener("click", (ev) => {
    ev.stopPropagation();
    close();
    const color = appData.colors.find((c) => c.id === colorId);
    showInputModal(
      { title: "色の名前を入力", placeholder: "名前を入力...", initialValue: color?.name ?? "" },
      (name) => updateColorName(colorId, name)
    );
  });

  menu.querySelector("[data-action=lock]").addEventListener("click", (ev) => {
    ev.stopPropagation();
    close();
    toggleColorLock(colorId);
  });
};

const showFolderContextMenu = (e, folderId) => {
  const existing = document.querySelector("#folder-context-menu");
  if (existing) existing.remove();

  const folder = appData.folders.find((f) => f.id === folderId);
  if (!folder || folder.isDefault) return;

  const menu = document.createElement("div");
  menu.id = "folder-context-menu";
  menu.className = "context-menu";
  menu.innerHTML = `
    <button class="context-menu-item" data-action="rename">
      <span class="context-menu-icon">${EDIT_ICON}</span>
      名前を変更
    </button>
  `;

  document.body.appendChild(menu);
  const rect = menu.getBoundingClientRect();
  menu.style.left = `${Math.min(e.clientX, window.innerWidth - rect.width - 8)}px`;
  menu.style.top = `${Math.min(e.clientY, window.innerHeight - rect.height - 8)}px`;

  const close = () => {
    menu.remove();
    document.removeEventListener("click", close);
  };

  setTimeout(() => document.addEventListener("click", close), 0);

  menu.querySelector("[data-action=rename]").addEventListener("click", (ev) => {
    ev.stopPropagation();
    close();
    showInputModal(
      {
        title: "フォルダ名を変更",
        placeholder: "フォルダ名を入力...",
        initialValue: folder?.name ?? "",
      },
      (name) => renameFolder(folderId, name)
    );
  });
};

const bindFolderTabEvents = () => {
  document.querySelectorAll(".folder-tab:not(.add-btn)").forEach((tab) => {
    tab.addEventListener("click", (e) => {
      if (
        e.target.closest(".folder-lock-btn") ||
        e.target.closest(".folder-delete-btn")
      )
        return;
      currentFolderId = tab.dataset.folderId;
      localStorage.setItem(CURRENT_FOLDER_KEY, currentFolderId);
      render();
    });
  });

  document.querySelectorAll(".folder-lock-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFolderLock(btn.dataset.folderId);
    });
  });

  document.querySelectorAll(".folder-delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteFolder(btn.dataset.folderId);
    });
  });

  document.querySelectorAll(".folder-tab:not(.add-btn)").forEach((tab) => {
    const folderId = tab.dataset.folderId;
    const folder = folderId && appData.folders.find((f) => f.id === folderId);
    if (!folder?.isDefault) {
      tab.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        showFolderContextMenu(e, folderId);
      });
    }
  });

  const addFolderBtn = document.querySelector("#add-folder-btn");
  addFolderBtn?.addEventListener("click", () => {
    showInputModal(
      { title: "フォルダ名を入力", placeholder: "フォルダ名を入力..." },
      (name) => {
        if (name) addFolder(name);
      }
    );
  });

  addFolderBtn?.addEventListener("dragover", (e) => {
    if (e.dataTransfer.types.includes("color-id")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      addFolderBtn.classList.add("folder-tab-drop-target");
    }
  });
  addFolderBtn?.addEventListener("dragleave", () => {
    addFolderBtn.classList.remove("folder-tab-drop-target");
  });
  addFolderBtn?.addEventListener("drop", (e) => {
    e.preventDefault();
    addFolderBtn.classList.remove("folder-tab-drop-target");
    const colorId = e.dataTransfer.getData("color-id");
    if (colorId) addFolderFromColor(colorId);
  });

  let draggedFolderId = null;
  document.querySelectorAll(".folder-tab:not(.add-btn)").forEach((tab) => {
    if (
      tab.dataset.folderId &&
      appData.folders.find((f) => f.id === tab.dataset.folderId)?.isDefault
    )
      return;
    tab.addEventListener("dragstart", (e) => {
      draggedFolderId = tab.dataset.folderId;
      e.dataTransfer.setData("text/plain", tab.dataset.folderId);
    });
    tab.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (
        e.dataTransfer.types.includes("color-id") ||
        e.dataTransfer.getData("color-id")
      ) {
        tab.classList.add("folder-tab-drop-target");
      } else if (draggedFolderId && draggedFolderId !== tab.dataset.folderId) {
        tab.classList.add("folder-tab-drop-target");
      }
    });
    tab.addEventListener("dragleave", (e) => {
      tab.classList.remove("folder-tab-drop-target");
    });
    tab.addEventListener("drop", (e) => {
      e.preventDefault();
      tab.classList.remove("folder-tab-drop-target");
      const colorId = e.dataTransfer.getData("color-id");
      const targetFolderId = tab.dataset.folderId;
      if (colorId && targetFolderId) {
        moveColorToFolder(colorId, targetFolderId);
      }
      if (
        draggedFolderId &&
        targetFolderId &&
        draggedFolderId !== targetFolderId
      ) {
        const sorted = getSortedFolders().filter((f) => !f.isDefault);
        const fromIdx = sorted.findIndex((f) => f.id === draggedFolderId);
        const toIdx = sorted.findIndex((f) => f.id === targetFolderId);
        if (fromIdx >= 0 && toIdx >= 0 && fromIdx !== toIdx) {
          const [moved] = sorted.splice(fromIdx, 1);
          sorted.splice(toIdx, 0, moved);
          appData.folders.find((f) => f.id === DEFAULT_FOLDER_ID).order = 0;
          sorted.forEach((f, i) => (f.order = i + 1));
          saveData(appData);
          render();
        }
      }
      draggedFolderId = null;
    });
  });

};

const initStaticListeners = () => {
  document
    .querySelector("#copy-format-select")
    ?.addEventListener("change", (e) => {
      localStorage.setItem(COPY_FORMAT_KEY, e.target.value);
    });
  document
    .querySelector("#search-input")
    ?.addEventListener("input", () => render());

  const familyTrigger = document.querySelector("#color-family-trigger");
  const familyDropdown = document.querySelector("#color-family-dropdown");
  familyTrigger?.addEventListener("click", (e) => {
    e.stopPropagation();
    familyDropdown?.classList.toggle("hidden");
  });
  familyDropdown?.addEventListener("click", (e) => e.stopPropagation());
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#color-family-wrapper")) familyDropdown?.classList.add("hidden");
  });

  document.getElementById("detail-back-btn")?.addEventListener("click", hideColorDetailView);
};

const bindColorFamilyOptions = () => {
  document.querySelectorAll(".color-family-option").forEach((el) => {
    el.addEventListener("click", () => {
      selectedColorFamily = el.dataset.familyId;
      document.querySelector("#color-family-dropdown")?.classList.add("hidden");
      render();
    });
  });
};

const activateEyeDropper = async () => {
  const html = document.documentElement;
  const body = document.body;
  html.style.minHeight = "0";
  html.style.height = "0";
  html.style.overflow = "hidden";
  body.style.minHeight = "0";
  body.style.height = "0";
  body.style.overflow = "hidden";
  body.style.display = "none";
  try {
    const { sRGBHex } = await new EyeDropper().open();
    const existing = appData.colors.find((c) => c.hex === sRGBHex);
    if (existing) {
      addColorToFolder(existing.id, currentFolderId);
    } else {
      const maxGlobal =
        appData.colors.length > 0
          ? Math.max(...appData.colors.map((c) => c.globalOrder ?? 0))
          : -1;
      const colorId = generateId();
      appData.colors.push({
        id: colorId,
        hex: sRGBHex,
        name: "",
        locked: false,
        globalOrder: maxGlobal + 1,
      });
      const fc = appData.folderColors || [];
      const maxOrder =
        Math.max(
          -1,
          ...fc
            .filter((f) => f.folderId === currentFolderId)
            .map((f) => f.order ?? 0),
        ) + 1;
      fc.push({ folderId: currentFolderId, colorId, order: maxOrder });
      appData.folderColors = fc;
      saveData(appData);
    }
    render();
  } catch {
    // ユーザーがキャンセルした場合は何もしない
  } finally {
    html.style.minHeight = "";
    html.style.height = "";
    html.style.overflow = "";
    body.style.minHeight = "";
    body.style.height = "";
    body.style.overflow = "";
    body.style.display = "";
  }
};

const lockAllBtn = document.querySelector("#lock-all-btn");
clearBtn.addEventListener("click", clearAllColors);
lockAllBtn?.addEventListener("click", toggleLockAllInFolder);
pickerBtn.addEventListener("click", activateEyeDropper);
exportBtn.addEventListener("click", exportColors);

render();
initStaticListeners();
