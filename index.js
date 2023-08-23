const pickerBtn = document.querySelector("#picker-btn");
const clearBtn = document.querySelector("#clear-btn");
const colorList = document.querySelector(".all-colors");
const exportBtn = document.querySelector("#export-btn");

// Retrieving picked colors from localstorage or initializing an empty array
let pickedColors = JSON.parse(localStorage.getItem("colors-list")) || [];

// Variable to keep track of the current color popup
let currentPopup = null;

// Function to copy text to the clipboard
const copyToClipboard = async (text, element) => {
  try {
    await navigator.clipboard.writeText(text);
    element.innerHTML = `
			<svg width="14px" height="14px" stroke-width="2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000">
				<path d="M7 12.5l3 3 7-7" stroke="#38b057" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" class="circle-animation"></path>
				<path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="#38b057" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"></path>
			</svg> Copied!
		`;
    // Resetting element text after 1 second
    setTimeout(() => {
      element.innerText = text;
    }, 1000);
  } catch (error) {
    alert("Failed to copy text!");
  }
};

// Function to get the current date and time in the required format
const getFormattedDateTime = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const minute = String(now.getMinutes()).padStart(2, "0");
  const second = String(now.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hour}${minute}${second}`;
};

// Function to export colors as a text file with the modified filename
const exportColors = () => {
  const colorData = {
    Colors: pickedColors.map((color) => {
      return {
        hex: color,
        rgb: hexToRgb(color),
      };
    }),
  };
  const fileName = `colors_${getFormattedDateTime()}.json`;
  const blob = new Blob([JSON.stringify(colorData)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Function to create the color popup
const createColorPopup = (color) => {
  const popup = document.createElement("div");
  popup.classList.add("color-popup");
  popup.innerHTML = `
    <div class="popup-container">
      <div class="color-popup-content">
			<span class="close-popup close"><svg width="20px" height="20px" stroke-width="1.7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M6.758 17.243L12.001 12m5.243-5.243L12 12m0 0L6.758 6.757M12.001 12l5.243 5.243" stroke="#000000" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"></path></svg></span>
        <div class="popup-inner">
	        <div class="color-info">
	          <div class="color-preview" style="background: ${color.hex}; border: 0.1px solid #cccccc"></div>
	          <div class="color-details">
	            <div class="color-value">
	              <span class="label">Hex</span>
	              <span class="value hex" data-color="${color.hex}">${color.hex}</span>
	            </div>
	            <div class="color-value">
	              <span class="label">RGB</span>
	              <span class="value rgb" data-color="${color.hex}">${color.rgb}</span>
	            </div>
	          </div>
	        </div>
        </div>
      </div>
    </div>
    <div class="overlay close-bg"></div>
  `;

  // Close button inside the popup
  const closePopup = popup.querySelector(".close");
  closePopup.addEventListener("click", () => {
    document.body.removeChild(popup);
    currentPopup = null;
  });

  const closePopup02 = popup.querySelector(".close-bg");
  closePopup02.addEventListener("click", () => {
    document.body.removeChild(popup);
    currentPopup = null;
  });

  // Event listeners to copy color values to clipboard
  const colorValues = popup.querySelectorAll(".value");
  colorValues.forEach((value) => {
    value.addEventListener("click", (e) => {
      const text = e.currentTarget.innerText;
      copyToClipboard(text, e.currentTarget);
    });
  });

  return popup;
};

// Function to display the picked colors
const showColors = () => {
  colorList.innerHTML = pickedColors
    .map(
      (color) =>
        `
      <li class="color">
        <div class="rect" style="background: ${color}; border: 0.1px solid #cccccc"></div>
        <div class="value hex" data-color="${color}">${color}</div>
      </li>
    `
    )
    .join("");

  const colorElements = document.querySelectorAll(".color");
  colorElements.forEach((li) => {
    const colorHex = li.querySelector(".value.hex");
    colorHex.addEventListener("click", (e) => {
      const color = e.currentTarget.dataset.color;
      if (currentPopup) {
        document.body.removeChild(currentPopup);
      }
      const popup = createColorPopup({ hex: color, rgb: hexToRgb(color) });
      document.body.appendChild(popup);
      currentPopup = popup;
    });
  });

  const pickedColorsContainer = document.querySelector(".colors-list");
  pickedColorsContainer.classList.toggle("hide", pickedColors.length === 0);
};

// Function to convert a hex color code to rgb format
const hexToRgb = (hex) => {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgb(${r},${g},${b})`;
};

// Function to activate the eye dropper color picker
const activateEyeDropper = async () => {
  document.body.style.display = "none";
  try {
    // Opening the eye dropper and retrieving the selected color
    const { sRGBHex } = await new EyeDropper().open();

    if (!pickedColors.includes(sRGBHex)) {
      pickedColors.push(sRGBHex);
      localStorage.setItem("colors-list", JSON.stringify(pickedColors));
    }

    showColors();
  } catch (error) {
    alert("Filed to copy the color code!");
  } finally {
    document.body.style.display = "block";
  }
};

// Function to clear all picked colors
const clearAllColors = () => {
  pickedColors = [];
  localStorage.removeItem("colors-list");
  showColors();
};

// Event listeners for buttons
clearBtn.addEventListener("click", clearAllColors);
pickerBtn.addEventListener("click", activateEyeDropper);
exportBtn.addEventListener("click", exportColors);

// Displaying picked colors on document load
showColors();
