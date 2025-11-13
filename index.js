// Constants
const HOST = "https://color-catch-backend.onrender.com";


// DOM Elements
const paletteContainer = document.getElementById("color-palette");
const palettePlaceholder = document.getElementById("palette-placeholder");
const colorInput = document.getElementById("color-input"); // Still needed for sidebar
const visualizeBtn = document.getElementById("visualize-btn"); // Still needed for sidebar
const manualErrorMessage = document.getElementById("manual-error-message"); // Still needed for sidebar

const imageUpload = document.getElementById("image-upload");
const imagePreviewContainer = document.getElementById("image-preview-container");
const imagePreview = document.getElementById("image-preview");
const imageErrorMessage = document.getElementById("image-error-message");
const loadingSpinner = document.getElementById("loading-spinner");

const darkModeToggle = document.getElementById('dark-mode-toggle');
const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

// Sidebar elements
const openSidebarBtn = document.getElementById('open-sidebar-btn');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
const manualColorSidebar = document.getElementById('manual-color-sidebar');


// --- Dark Mode Logic ---

const applyTheme = (isDark) => {
    if (isDark) {
        document.documentElement.classList.add('dark');
        themeToggleLightIcon.classList.remove('hidden');
        themeToggleDarkIcon.classList.add('hidden');
        localStorage.setItem('color-theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        themeToggleDarkIcon.classList.remove('hidden');
        themeToggleLightIcon.classList.add('hidden');
        localStorage.setItem('color-theme', 'light');
    }
};

const initializeTheme = () => {
    const isDarkModePreferred = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('color-theme');
    const isDark = savedTheme === 'dark' || (!savedTheme && isDarkModePreferred);

    applyTheme(isDark);
};

darkModeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark');
    applyTheme(!isDark);
});

// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
// Starting the render backend instance as it automatically sleeps after inactivity.

fetch(HOST).then((response) => {
    if (response.ok) {
        return response.json()
    } else {
        console.error("Backend responded with an error:", response.status);
    }
}).then(({ message }) => {
    console.log("Backend Server started:", message);
}).catch((err) => {
    console.error("Error fetching the backend:", err);
});


    initializeTheme();
    palettePlaceholder.textContent = 'Upload an image to see the palette.'; // Updated placeholder text
});

// --- Sidebar Logic ---
if (openSidebarBtn && closeSidebarBtn && manualColorSidebar) {
    openSidebarBtn.addEventListener('click', () => {
        manualColorSidebar.classList.remove('translate-x-full');
    });

    closeSidebarBtn.addEventListener('click', () => {
        manualColorSidebar.classList.add('translate-x-full');
    });
} else {
    console.error("Sidebar buttons or sidebar element not found!");
}

// --- Helper Functions ---

function displayColors(colors, errorElement) {
    paletteContainer.innerHTML = "";
    palettePlaceholder.classList.add('hidden');
    if (errorElement) errorElement.textContent = "";

    if (!Array.isArray(colors) || colors.length === 0) {
        const actionTaken = errorElement === manualErrorMessage || errorElement === imageErrorMessage;
        if (actionTaken) {
            palettePlaceholder.textContent = 'No valid colors found or extracted.';
            palettePlaceholder.classList.remove('hidden');
        } else {
            palettePlaceholder.textContent = 'Upload an image to see the palette.';
            palettePlaceholder.classList.remove('hidden');
        }
        return;
    }

    let validColorsDisplayed = false;
    colors.forEach((color) => {
        if (!/^#[0-9A-F]{6}$/i.test(color)) {
            console.warn(`Invalid hex code format skipped: ${color}`);
            if (errorElement)
                errorElement.textContent = `Skipped invalid format: ${color}. Use #RRGGBB.`;
        } else {
            validColorsDisplayed = true;
            const colorDiv = document.createElement("div");
            colorDiv.classList.add(
                "w-24", "h-24", "rounded-md", "shadow-md", "flex", "flex-col",
                "items-center", "justify-center", "text-xs", "font-mono",
                "break-all", "p-1", "cursor-pointer", "transition-all",
                "duration-150", "hover:shadow-lg", "hover:scale-105"
            );
            colorDiv.style.backgroundColor = color;

            const rgb = parseInt(color.substring(1), 16);
            const r = (rgb >> 16) & 0xff;
            const g = (rgb >> 8) & 0xff;
            const b = (rgb >> 0) & 0xff;
            const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            colorDiv.classList.add(luma < 128 ? "text-gray-100" : "text-gray-900");
            colorDiv.textContent = color;

            colorDiv.addEventListener("click", () => {
                navigator.clipboard
                    .writeText(color)
                    .then(() => {
                        const originalText = colorDiv.textContent;
                        colorDiv.textContent = "Copied!";
                        colorDiv.classList.add("opacity-75");
                        setTimeout(() => {
                            colorDiv.textContent = originalText;
                            colorDiv.classList.remove("opacity-75");
                        }, 1000);
                    })
                    .catch((err) => {
                        console.error("Failed to copy color: ", err);
                        if (errorElement) errorElement.textContent = "Failed to copy.";
                    });
            });
            paletteContainer.appendChild(colorDiv);
        }
    });

    if (!validColorsDisplayed) {
        palettePlaceholder.textContent = 'No valid colors found or extracted.';
        palettePlaceholder.classList.remove('hidden');
    }
}

/**
 * Parses color input string (comma-separated or list format) into an array.
 * @param {string} inputText - The input string from the textarea.
 * @returns {string[]} - Array of parsed color strings.
 */
function parseColorInput(inputText) {
    let colorsArray = [];
    inputText = inputText.trim();
    if (!inputText) return [];

    if (inputText.startsWith("[") && inputText.endsWith("]")) {
        try {
            colorsArray = JSON.parse(inputText.replace(/'/g, '"'));
            if (!Array.isArray(colorsArray)) throw new Error("Not an array");
        } catch (e) {
            const items = inputText.slice(1, -1).split(",");
            colorsArray = items
                .map((item) => item.trim().replace(/^['"]|['"]$/g, ""))
                .filter((c) => c);
        }
    } else {
        colorsArray = inputText
            .split(",")
            .map((c) => c.trim())
            .filter((c) => c);
    }
    return colorsArray;
}

// --- Event Listeners ---

// Visualize Button (Manual Input - now in sidebar)
if (visualizeBtn) {
    visualizeBtn.addEventListener("click", () => {
        const inputText = colorInput.value.trim();
        if (!inputText) {
            manualErrorMessage.textContent = "Please enter some color codes.";
            displayColors([], manualErrorMessage); // Clear palette if input is empty
            return;
        }
        manualErrorMessage.textContent = ""; // Clear previous errors
        const colors = parseColorInput(inputText);
        displayColors(colors, manualErrorMessage);
        // Optionally close sidebar after visualizing
        // if (manualColorSidebar) manualColorSidebar.classList.add('translate-x-full');
    });
} else {
    console.error("Visualize button not found!");
}

// Image Upload
if (imageUpload) {
    imageUpload.addEventListener("change", (event) => {
        event.preventDefault();
        event.stopPropagation();

        const file = event.target.files[0];
        if (!file) return;

        paletteContainer.innerHTML = '';
        palettePlaceholder.textContent = 'Processing image...';
        palettePlaceholder.classList.remove('hidden');
        imageErrorMessage.textContent = '';
        manualErrorMessage.textContent = '';
        colorInput.value = '';

        imagePreviewContainer.classList.remove('hidden');
        imagePreview.src = "";

        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
        };
        reader.onerror = (e) => {
            console.error("FileReader error:", e);
            imageErrorMessage.textContent = 'Error reading file for preview.';
            imagePreviewContainer.classList.add('hidden');
            palettePlaceholder.textContent = 'Error reading file.';
            palettePlaceholder.classList.remove('hidden');
        };
        reader.readAsDataURL(file);

        fetchColorsFromAPI(file);
    });
} else {
    console.error("Image upload input not found!");
}

/**
 * Fetches colors from API and displays them.
 * @param {File} file - The image file to send to the API.
 */
async function fetchColorsFromAPI(file) {
    if (!file) {
        console.error("No file provided for color extraction.");
        imageErrorMessage.textContent = "No file selected.";
        return;
    }

    loadingSpinner.style.display = "block";
    imageErrorMessage.textContent = "";

    try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${HOST}/extract-colors/`, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            let errorDetail = `API error ${response.status}`;
            try {
                const errData = await response.json();
                errorDetail = errData.detail || errorDetail;
            } catch (e) { }
            throw new Error(errorDetail);
        }

        const data = await response.json();

        if (data && Array.isArray(data.colors)) {
            displayColors(data.colors, imageErrorMessage);
        } else {
            console.warn("Invalid response format from API:", data);
            imageErrorMessage.textContent = "Invalid response format from API.";
            displayColors([], imageErrorMessage);
        }
    } catch (err) {
        console.error("Error caught in fetchColorsFromAPI:", err);
        imageErrorMessage.textContent = `Failed to extract colors: ${err.message}`;
        displayColors([], imageErrorMessage);
    } finally {
        loadingSpinner.style.display = "none";
    }
}