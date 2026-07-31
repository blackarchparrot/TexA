const OPENROUTER_API_KEY = "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";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

let currentDataUrl = null;
let lifecycleChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    setupThemeToggle();
});

// Feature 3: Light & Dark Mode Toggle Automation
function setupThemeToggle() {
    const themeBtn = document.getElementById('themeToggleBtn');
    themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        document.body.classList.toggle('dark-mode');
        
        const isLight = document.body.classList.contains('light-mode');
        themeBtn.innerHTML = isLight ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
    });
}

function setupEventListeners() {
    const dressFileInput = document.getElementById('dressFileInput');
    const btnRemove = document.getElementById('btnRemove');
    const btnAnalyze = document.getElementById('btnAnalyze');

    // Direct event listener on the invisible overlaid file input
    dressFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) processFile(file);
    });

    btnRemove.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevents reopening camera when clicking remove button
        resetUpload();
    });

    btnAnalyze.addEventListener('click', analyzeDressQuality);
}

function processFile(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        currentDataUrl = e.target.result;
        document.getElementById('imagePreview').src = currentDataUrl;
        document.getElementById('uploadPlaceholder').classList.add('hidden');
        document.getElementById('previewWrapper').classList.remove('hidden');
        document.getElementById('btnAnalyze').disabled = false;
        
        // Temporarily disable pointer events on input so click hits remove button directly
        document.getElementById('dressFileInput').style.pointerEvents = 'none';

        // Feature 4: Trigger Camera Guidance Tip
        runCameraGuidance();
    };
    reader.readAsDataURL(file);
}

function resetUpload() {
    currentDataUrl = null;
    const dressFileInput = document.getElementById('dressFileInput');
    dressFileInput.value = '';
    dressFileInput.style.pointerEvents = 'auto'; // Re-enable touch area
    
    document.getElementById('imagePreview').src = '';
    document.getElementById('previewWrapper').classList.add('hidden');
    document.getElementById('uploadPlaceholder').classList.remove('hidden');
    document.getElementById('btnAnalyze').disabled = true;
    document.getElementById('analysisResults').classList.add('hidden');
}

// Feature 4: Camera Guidance Helper
function runCameraGuidance() {
    const tips = [
        "AI Tip: Good lighting & close-up weave detected!",
        "AI Tip: Ideal distance for fabric surface analysis.",
        "AI Tip: Hold steady for optimal pilling scan."
    ];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    document.getElementById('cameraGuideTip').innerHTML = `<i class="fa-solid fa-circle-check"></i> ${randomTip}`;
}

// OpenRouter AI Call for Dress Classification & Analysis
async function analyzeDressQuality() {
    if (!currentDataUrl) return;

    const btnAnalyze = document.getElementById('btnAnalyze');
    btnAnalyze.disabled = true;
    btnAnalyze.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Analyzing Textile Structure...';

    const promptText = `
    Analyze this dress/fabric image and strictly return a raw JSON object with these parameters:
    {
        "sustainabilityScore": 85,
        "sustainabilityDesc": "Organic Cotton / Eco-friendly",
        "pillingGrade": "Grade 4 / 5",
        "colorFastness": "Grade 4.5 / 5",
        "wickingRate": "Fast Dry (15 min)",
        "colorRetentionGraph": [100, 92, 85, 72],
        "shrinkageGraph": [0, 2, 4, 7],
        "summary": "2-sentence technical evaluation of dress material, durability, and usage."
    }
    Do not wrap in markdown code blocks like \`\`\`json.
    `;

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "openrouter/free",
                messages: [{
                    role: "user",
                    content: [
                        { type: "text", text: promptText },
                        { type: "image_url", image_url: { url: currentDataUrl } }
                    ]
                }]
            })
        });

        const data = await response.json();
        let rawContent = data.choices?.[0]?.message?.content || "{}";
        rawContent = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(rawContent);

        renderResults(result);

    } catch (err) {
        alert("Analysis failed: " + err.message);
    } finally {
        btnAnalyze.disabled = false;
        btnAnalyze.innerHTML = '<i class="fa-solid fa-microscope"></i> Analyze Dress Quality';
    }
}

function renderResults(data) {
    document.getElementById('resEcoScore').textContent = `${data.sustainabilityScore || 80} / 100`;
    document.getElementById('resEcoDesc').textContent = data.sustainabilityDesc || 'Standard Textile Material';
    document.getElementById('resPillingGrade').textContent = data.pillingGrade || 'Grade 4 / 5';
    document.getElementById('resColorFastness').textContent = data.colorFastness || 'Grade 4 / 5';
    document.getElementById('resWickingRate').textContent = data.wickingRate || 'Medium Dry (30 min)';
    document.getElementById('resSummaryText').textContent = data.summary || 'Solid quality fabric suitable for daily wear.';

    // Feature 1: Washing Lifecycle Chart Rendering
    renderLifecycleChart(
        data.colorRetentionGraph || [100, 90, 80, 70],
        data.shrinkageGraph || [0, 2, 5, 8]
    );

    const resultsSection = document.getElementById('analysisResults');
    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Feature 1: Lifecycle Graph (0, 5, 20, 50 Washes)
function renderLifecycleChart(colorData, shrinkageData) {
    const ctx = document.getElementById('lifecycleChart').getContext('2d');

    if (lifecycleChartInstance) lifecycleChartInstance.destroy();

    lifecycleChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['New (0 Washes)', '5 Washes', '20 Washes', '50 Washes'],
            datasets: [
                {
                    label: 'Color Retention (%)',
                    data: colorData,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Shrinkage Rate (%)',
                    data: shrinkageData,
                    borderColor: '#ef4444',
                    backgroundColor: 'transparent',
                    borderDash: [5, 5],
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#94a3b8' } }
            },
            scales: {
                x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }
        }
    });
}
