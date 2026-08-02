/**
 * Tex AI - Smart Fabric Scanner Engine
 * Full Integrated Script with Universal Theme Toggle & API Handlers
 */

const OPENROUTER_API_KEY = "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"; 
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Global DOM Registry & App State
let elements = {};
let cropperInstance = null;
let finalCroppedDataUrl = null;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Register DOM Elements after DOM is fully loaded
    elements = {
        themeToggle: document.getElementById('themeToggle'),
        btnCamera: document.getElementById('btnCamera'),
        btnGallery: document.getElementById('btnGallery'),
        fileInputCamera: document.getElementById('fileInputCamera'),
        fileInputGallery: document.getElementById('fileInputGallery'),
        cropContainer: document.getElementById('cropContainer'),
        cropperImage: document.getElementById('cropperImage'),
        btnApplyCrop: document.getElementById('btnApplyCrop'),
        warningBanner: document.getElementById('warningBanner'),
        warningMessage: document.getElementById('warningMessage'),
        btnScan: document.getElementById('btnScan'),
        loadingState: document.getElementById('loadingState'),
        loadingStep: document.getElementById('loadingStep'),
        errorBanner: document.getElementById('errorBanner'),
        errorMessage: document.getElementById('errorMessage'),
        resultsSection: document.getElementById('resultsSection'),
        
        // Result Outputs
        resFabricType: document.getElementById('resFabricType'),
        confFabricType: document.getElementById('confFabricType'),
        resMaterial: document.getElementById('resMaterial'),
        confMaterial: document.getElementById('confMaterial'),
        resPossibleBlend: document.getElementById('resPossibleBlend'),
        confPossibleBlend: document.getElementById('confPossibleBlend'),
        resComfortLevel: document.getElementById('resComfortLevel'),
        confComfortLevel: document.getElementById('confComfortLevel'),
        resDurability: document.getElementById('resDurability'),
        confDurability: document.getElementById('confDurability'),
        resBreathability: document.getElementById('resBreathability'),
        confBreathability: document.getElementById('confBreathability'),
        resBestWeather: document.getElementById('resBestWeather'),
        confBestWeather: document.getElementById('confBestWeather'),
        resRecommendedUsage: document.getElementById('resRecommendedUsage'),
        confRecommendedUsage: document.getElementById('confRecommendedUsage'),
        resCareInstructions: document.getElementById('resCareInstructions'),
        resExplanation: document.getElementById('resExplanation')
    };

    // 2. Initialize Theme and Event Listeners
    initTheme();
    setupEventListeners();
});

/* ==========================================================================
   THEME TOGGLE ENGINE (Handles <html>, <body>, classes, and data-theme)
   ========================================================================== */

function applyTheme(theme) {
    const themeClasses = ['light-theme', 'dark-theme', 'light', 'dark'];
    
    // Clear existing theme classes across target elements
    document.documentElement.classList.remove(...themeClasses);
    document.body.classList.remove(...themeClasses);

    // Apply class names and data attributes for maximum CSS compatibility
    document.documentElement.classList.add(`${theme}-theme`, theme);
    document.body.classList.add(`${theme}-theme`, theme);
    document.documentElement.setAttribute('data-theme', theme);

    // Persist user selection
    localStorage.setItem('texelsense_theme', theme);
}

function initTheme() {
    const savedTheme = localStorage.getItem('texelsense_theme') || 'dark';
    applyTheme(savedTheme);
}

function toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark') || 
                   document.documentElement.classList.contains('dark-theme') || 
                   document.body.classList.contains('dark-theme') ||
                   document.body.classList.contains('dark');
                   
    const newTheme = isDark ? 'light' : 'dark';
    applyTheme(newTheme);
}

/* ==========================================================================
   EVENT LISTENERS & WORKFLOW LOGIC
   ========================================================================== */

function setupEventListeners() {
    // Theme Toggle Listener
    if (elements.themeToggle) {
        elements.themeToggle.addEventListener('click', toggleTheme);
    } else {
        console.warn("Theme toggle button (#themeToggle) not found in DOM.");
    }

    if (elements.btnCamera) elements.btnCamera.addEventListener('click', () => elements.fileInputCamera.click());
    if (elements.btnGallery) elements.btnGallery.addEventListener('click', () => elements.fileInputGallery.click());

    if (elements.fileInputCamera) elements.fileInputCamera.addEventListener('change', (e) => handleFileSelect(e.target.files[0]));
    if (elements.fileInputGallery) elements.fileInputGallery.addEventListener('change', (e) => handleFileSelect(e.target.files[0]));

    if (elements.btnApplyCrop) elements.btnApplyCrop.addEventListener('click', applyCropSelection);
    if (elements.btnScan) elements.btnScan.addEventListener('click', performFabricScan);
}

function handleFileSelect(file) {
    if (!file || !file.type.startsWith('image/')) {
        showError('অনুগ্রহ করে একটি বৈধ ইমেজ ফাইল সিলেক্ট করুন।');
        return;
    }

    hideError();
    hideWarning();

    const reader = new FileReader();
    reader.onload = (e) => {
        const rawImageDataUrl = e.target.result;
        
        analyzeImageQuality(rawImageDataUrl, (qualityReport) => {
            if (qualityReport.hasWarnings) {
                showWarning(qualityReport.warningText);
            }
            initCropper(rawImageDataUrl);
        });
    };
    reader.readAsDataURL(file);
}

function analyzeImageQuality(dataUrl, callback) {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const width = 200;
        const height = Math.floor((img.height / img.width) * width);
        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        let totalBrightness = 0;
        const grayPixels = [];

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const brightness = (r + g + b) / 3;
            totalBrightness += brightness;
            grayPixels.push(brightness);
        }

        const avgBrightness = totalBrightness / (grayPixels.length);

        let varianceSum = 0;
        for (let i = 1; i < grayPixels.length; i++) {
            const diff = grayPixels[i] - grayPixels[i - 1];
            varianceSum += diff * diff;
        }
        const sharpnessScore = varianceSum / grayPixels.length;

        const warnings = [];
        if (avgBrightness < 45) {
            warnings.push("আলো কম পাওয়া গেছে। স্পটলাইট বা পর্যাপ্ত আলো ব্যবহার করুন।");
        }
        if (sharpnessScore < 80) {
            warnings.push("ছবিটি ঝাপসা (Blur) মনে হচ্ছে। ক্যামেরা স্থির রেখে স্পষ্ট ছবি তুলুন।");
        }

        callback({
            hasWarnings: warnings.length > 0,
            warningText: warnings.join(" | ")
        });
    };
}

function initCropper(imageSrc) {
    if (cropperInstance) {
        cropperInstance.destroy();
    }

    elements.cropperImage.src = imageSrc;
    elements.cropContainer.classList.remove('hidden');
    elements.resultsSection.classList.add('hidden');
    elements.btnScan.disabled = true;

    cropperInstance = new Cropper(elements.cropperImage, {
        aspectRatio: NaN,
        viewMode: 1,
        autoCropArea: 0.8,
        responsive: true,
        background: false
    });
}

function applyCropSelection() {
    if (!cropperInstance) return;

    const canvas = cropperInstance.getCroppedCanvas({
        maxWidth: 1024,
        maxHeight: 1024
    });

    finalCroppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    elements.btnScan.disabled = false;
    showWarning("ক্রপ করা সম্পন্ন হয়েছে। এবার 'Scan Fabric' বাটনে ট্যাপ করুন।");
}

/* ==========================================================================
   API SCAN ENGINE
   ========================================================================== */

async function performFabricScan() {
    if (!finalCroppedDataUrl) {
        showError("দয়া করে ছবি সিলেক্ট করে এলাকা ক্রপ করার পর 'Scan' চাপুন।");
        return;
    }

    if (!OPENROUTER_API_KEY) {
        showError("OpenRouter API Key অনুপস্থিত।");
        return;
    }

    setLoading(true);
    hideError();

    const promptText = `
    You are an expert Textile AI Analyzer. Inspect this cropped fabric image thoroughly.
    
    CRITICAL INSTRUCTIONS:
    1. First, check if this cropped image strictly shows a fabric/textile weave/pattern.
    2. If the image is blurred, unreadable, or NOT a fabric (e.g. background, skin, metal, paper), set "isFabric" to false and explain in "notFabricReason". DO NOT attempt analysis on non-fabrics.
    3. DO NOT give exact synthetic percentage estimates like "95% Cotton, 5% Polyester". Use approximate terms like "Cotton-Dominant Blend" or "Polyester Blend".
    4. Provide realistic confidence ratings ("High", "Medium", "Low") for each parameter. If unsure, explicitly set the value to "Unable to determine".
    5. Provide smart, actionable Care Instructions (Washing temp, Ironing, Dry cleaning).

    Respond strictly in pure JSON without markdown code blocks using this exact template:
    {
        "isFabric": true,
        "notFabricReason": "",
        "fabricType": "e.g. Plain Weave / Twill / Denim / Knitted / Unable to determine",
        "confFabricType": "High / Medium / Low",
        "material": "e.g. Cotton-dominant / Synthetic Blend / Unable to determine",
        "confMaterial": "High / Medium / Low",
        "possibleBlend": "e.g. Approx. Cotton/Poly Blend / Pure Cotton / Unable to determine",
        "confPossibleBlend": "High / Medium / Low",
        "comfortLevel": "e.g. High (Estimated) / Medium (Estimated) / Unable to determine",
        "confComfortLevel": "High / Medium / Low",
        "durability": "e.g. High Durability (Estimated) / Unable to determine",
        "confDurability": "High / Medium / Low",
        "breathability": "e.g. Moderate Breathability / Unable to determine",
        "confBreathability": "High / Medium / Low",
        "bestWeather": "e.g. Warm Weather / All Seasons / Unable to determine",
        "confBestWeather": "High / Medium / Low",
        "recommendedUsage": "e.g. Shirts, Casual Wear / Heavy Outerwear / Unable to determine",
        "confRecommendedUsage": "High / Medium / Low",
        "careInstructions": [
            "Wash instruction",
            "Ironing instruction",
            "Dry clean / Drying advice"
        ],
        "explanation": "A concise structural explanation of the visible weave geometry, density, and optical surface properties."
    }
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
                            url: finalCroppedDataUrl
                        }
                    }
                ]
            }
        ]
    };

    try {
        updateLoadingStep("Sending fabric region to OpenRouter Vision Engine...");

        const response = await fetch(OPENROUTER_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost",
                "X-Title": "Tex AI"
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error?.message || `HTTP Error ${response.status}`);
        }

        updateLoadingStep("Evaluating structural parameters...");
        const data = await response.json();
        const rawContent = data.choices?.[0]?.message?.content;

        if (!rawContent) {
            throw new Error("AI মডেল থেকে কোনো রেসপন্স পাওয়া যায়নি।");
        }

        const cleanedJson = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedResults = JSON.parse(cleanedJson);

        if (parsedResults.isFabric === false) {
            showError(parsedResults.notFabricReason || "ছবিতে পরিষ্কারভাবে কাপড় শনাক্ত করা যায়নি। অনুগ্রহ করে পরিষ্কার ও ফ্রেমের ভেতর কাপড়ের ছবি তুলুন।");
            elements.resultsSection.classList.add('hidden');
            return;
        }

        renderResults(parsedResults);
    } catch (err) {
        console.error("Scan Error:", err);
        showError(`অ্যানালাইসিস ব্যর্থ হয়েছে: ${err.message}`);
    } finally {
        setLoading(false);
    }
}

/* ==========================================================================
   UI RENDERING & HELPERS
   ========================================================================== */

function renderResults(data) {
    elements.resFabricType.textContent = data.fabricType || 'Unable to determine';
    elements.confFabricType.textContent = `Conf: ${data.confFabricType || 'Low'}`;

    elements.resMaterial.textContent = data.material || 'Unable to determine';
    elements.confMaterial.textContent = `Conf: ${data.confMaterial || 'Low'}`;

    elements.resPossibleBlend.textContent = data.possibleBlend || 'Unable to determine';
    elements.confPossibleBlend.textContent = `Conf: ${data.confPossibleBlend || 'Low'}`;

    elements.resComfortLevel.textContent = data.comfortLevel || 'Unable to determine';
    elements.confComfortLevel.textContent = `Conf: ${data.confComfortLevel || 'Low'}`;

    elements.resDurability.textContent = data.durability || 'Unable to determine';
    elements.confDurability.textContent = `Conf: ${data.confDurability || 'Low'}`;

    elements.resBreathability.textContent = data.breathability || 'Unable to determine';
    elements.confBreathability.textContent = `Conf: ${data.confBreathability || 'Low'}`;

    elements.resBestWeather.textContent = data.bestWeather || 'Unable to determine';
    elements.confBestWeather.textContent = `Conf: ${data.confBestWeather || 'Low'}`;

    elements.resRecommendedUsage.textContent = data.recommendedUsage || 'Unable to determine';
    elements.confRecommendedUsage.textContent = `Conf: ${data.confRecommendedUsage || 'Low'}`;

    elements.resExplanation.textContent = data.explanation || 'No summary available.';

    elements.resCareInstructions.innerHTML = '';
    if (Array.isArray(data.careInstructions) && data.careInstructions.length > 0) {
        data.careInstructions.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            elements.resCareInstructions.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.textContent = "সাধারণ নিয়ম: ঠান্ডা পানিতে ধুয়ে নিন এবং সরাসরি রোদ এড়িয়ে চলুন।";
        elements.resCareInstructions.appendChild(li);
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

function showWarning(message) {
    elements.warningMessage.textContent = message;
    elements.warningBanner.classList.remove('hidden');
}

function hideWarning() {
    elements.warningBanner.classList.add('hidden');
}

function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorBanner.classList.remove('hidden');
}

function hideError() {
    elements.errorBanner.classList.add('hidden');
}
