
// Global Configuration
const OPENROUTER_API_KEY = "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"; 
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// DOM Element Registry
const elements = {
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    themeIcon: document.getElementById('themeIcon'),
    uploadZone: document.getElementById('uploadZone'),
    uploadPlaceholder: document.getElementById('uploadPlaceholder'),
    fileInput: document.getElementById('fileInput'),
    previewWrapper: document.getElementById('previewWrapper'),
    imagePreview: document.getElementById('imagePreview'),
    btnRemove: document.getElementById('btnRemove'),
    btnScan: document.getElementById('btnScan'),
    loadingState: document.getElementById('loadingState'),
    loadingStep: document.getElementById('loadingStep'),
    errorBanner: document.getElementById('errorBanner'),
    errorMessage: document.getElementById('errorMessage'),
    resultsSection: document.getElementById('resultsSection'),
    
    // Result Outputs
    resFabricType: document.getElementById('resFabricType'),
    resMaterial: document.getElementById('resMaterial'),
    resPossibleBlend: document.getElementById('resPossibleBlend'),
    resComfortLevel: document.getElementById('resComfortLevel'),
    resDurability: document.getElementById('resDurability'),
    resBreathability: document.getElementById('resBreathability'),
    resBestWeather: document.getElementById('resBestWeather'),
    resRecommendedUsage: document.getElementById('resRecommendedUsage'),
    resCareInstructions: document.getElementById('resCareInstructions'),
    resExplanation: document.getElementById('resExplanation')
};

// Application State
let currentDataUrl = null;

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    initTheme();
});

function initTheme() {
    const savedTheme = localStorage.getItem('texelsense_theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        if (elements.themeIcon) elements.themeIcon.className = 'fa-solid fa-moon';
    } else {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        if (elements.themeIcon) elements.themeIcon.className = 'fa-solid fa-sun';
    }
}

function toggleTheme(e) {
    if (e) e.stopPropagation();
    const isDark = document.body.classList.contains('dark-theme');
    
    if (isDark) {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
        localStorage.setItem('texelsense_theme', 'light');
        if (elements.themeIcon) elements.themeIcon.className = 'fa-solid fa-moon';
    } else {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
        localStorage.setItem('texelsense_theme', 'dark');
        if (elements.themeIcon) elements.themeIcon.className = 'fa-solid fa-sun';
    }
}

function setupEventListeners() {
    if (elements.themeToggleBtn) {
        elements.themeToggleBtn.addEventListener('click', toggleTheme);
    }

    elements.uploadZone.addEventListener('click', (e) => {
        if (e.target.closest('#btnRemove') || e.target.closest('#previewWrapper')) return;
        elements.fileInput.click();
    });

    elements.fileInput.addEventListener('change', handleFileSelect);

    elements.uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.uploadZone.classList.add('dragover');
    });

    elements.uploadZone.addEventListener('dragleave', () => {
        elements.uploadZone.classList.remove('dragover');
    });

    elements.uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.uploadZone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    });

    elements.btnRemove.addEventListener('click', resetImageUpload);
    elements.btnScan.addEventListener('click', performFabricScan);
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        processFile(file);
    }
}

function processFile(file) {
    if (!file.type.startsWith('image/')) {
        showError('Please upload a valid image file (PNG, JPG, WEBP).');
        return;
    }

    hideError();

    const reader = new FileReader();
    reader.onload = (e) => {
        currentDataUrl = e.target.result;

        elements.imagePreview.src = currentDataUrl;
        elements.uploadPlaceholder.classList.add('hidden');
        elements.previewWrapper.classList.remove('hidden');
        elements.btnScan.disabled = false;
        elements.resultsSection.classList.add('hidden');
    };
    reader.readAsDataURL(file);
}

function resetImageUpload(e) {
    if (e) e.stopPropagation();
    currentDataUrl = null;
    elements.fileInput.value = '';
    elements.imagePreview.src = '';
    elements.previewWrapper.classList.add('hidden');
    elements.uploadPlaceholder.classList.remove('hidden');
    elements.btnScan.disabled = true;
    elements.resultsSection.classList.add('hidden');
    hideError();
}

/**
 * Executes Fabric Analysis with Strict Non-Fabric Detection
 */
async function performFabricScan() {
    if (!currentDataUrl) return;

    if (!OPENROUTER_API_KEY) {
        showError("API Key missing. Please set your OpenRouter key.");
        return;
    }

    setLoading(true);
    hideError();

    const promptText = `
    Analyze this image carefully. First, determine if this image depicts a fabric, cloth, garment, or textile material.
    
    Respond strictly with a valid JSON object matching this exact structure:
    {
        "isFabric": true or false,
        "notFabricReason": "If isFabric is false, explain what the object actually is (e.g., 'This image appears to be a metal object, not a fabric.')",
        "fabricType": "e.g. Denim / Knit / Plain Weave",
        "material": "e.g. Cotton",
        "possibleBlend": "e.g. 98% Cotton, 2% Elastane",
        "comfortLevel": "e.g. High / Medium / Low",
        "durability": "e.g. Very High",
        "breathability": "e.g. High",
        "bestWeather": "e.g. All Seasons / Summer / Winter",
        "recommendedUsage": "e.g. Jeans, Casual Jackets",
        "careInstructions": [
            "Instruction 1",
            "Instruction 2",
            "Instruction 3"
        ],
        "explanation": "A concise 2-sentence structural analysis of the visible weave, density, and physical properties."
    }
    
    IMPORTANT: If isFabric is false, populate 'notFabricReason' and leave other fields empty or null.
    Do not wrap response in markdown code blocks. Return pure raw JSON text only.
    `;

    const requestBody = {
        model: "openrouter/free",
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: promptText },
                    {
                        type: "image_url",
                        image_url: {
                            url: currentDataUrl
                        }
                    }
                ]
            }
        ]
    };

    try {
        updateLoadingStep("Scanning fabric data and sending to TexA Main Core...");

        const response = await fetch(OPENROUTER_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost",
                "X-Title": "TexelSense AI"
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `HTTP Error ${response.status}`);
        }

        updateLoadingStep("Decoding fabric parameters...");
        const data = await response.json();
        const rawContent = data.choices?.[0]?.message?.content;

        if (!rawContent) {
            throw new Error("No response content generated by the vision engine.");
        }

        const cleanedJson = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedResults = JSON.parse(cleanedJson);

        if (parsedResults.isFabric === false) {
            showError(parsedResults.notFabricReason || "The uploaded image does not appear to be a fabric or textile material.");
            elements.resultsSection.classList.add('hidden');
            return;
        }

        renderResults(parsedResults);
    } catch (err) {
        console.error("Scan Error:", err);
        showError(`Analysis failed: ${err.message}`);
    } finally {
        setLoading(false);
    }
}

function renderResults(data) {
    elements.resFabricType.textContent = data.fabricType || 'N/A';
    elements.resMaterial.textContent = data.material || 'N/A';
    elements.resPossibleBlend.textContent = data.possibleBlend || 'N/A';
    elements.resComfortLevel.textContent = data.comfortLevel || 'N/A';
    elements.resDurability.textContent = data.durability || 'N/A';
    elements.resBreathability.textContent = data.breathability || 'N/A';
    elements.resBestWeather.textContent = data.bestWeather || 'N/A';
    elements.resRecommendedUsage.textContent = data.recommendedUsage || 'N/A';
    elements.resExplanation.textContent = data.explanation || 'No summary available.';

    elements.resCareInstructions.innerHTML = '';
    if (Array.isArray(data.careInstructions)) {
        data.careInstructions.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            elements.resCareInstructions.appendChild(li);
        });
    }

    elements.resultsSection.classList.remove('hidden');
    elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function setLoading(isLoading) {
    if (isLoading) {
        elements.loadingState.classList.remove('hidden');
        elements.btnScan.disabled = true;
    } else {
        elements.loadingState.classList.add('hidden');
        elements.btnScan.disabled = false;
    }
}

function updateLoadingStep(message) {
    elements.loadingStep.textContent = message;
}

function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorBanner.classList.remove('hidden');
}

function hideError() {
    elements.errorBanner.classList.add('hidden');
}
