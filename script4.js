let OPENROUTER_API_KEY = "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";

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const dressFileInput = document.getElementById('dressFileInput');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    const previewWrapper = document.getElementById('previewWrapper');
    const imagePreview = document.getElementById('imagePreview');
    const btnRemove = document.getElementById('btnRemove');
    const btnAnalyze = document.getElementById('btnAnalyze');
    
    // Result Elements
    const analysisResults = document.getElementById('analysisResults');
    const statusPill = document.getElementById('statusPill');
    const nonFabricWarning = document.getElementById('nonFabricWarning');
    const warningMessage = document.getElementById('warningMessage');
    const metricsGrid = document.getElementById('metricsGrid');
    const chartCard = document.getElementById('chartCard');
    
    const resEcoScore = document.getElementById('resEcoScore');
    const resPillingGrade = document.getElementById('resPillingGrade');
    const resColorFastness = document.getElementById('resColorFastness');
    const resWickingRate = document.getElementById('resWickingRate');
    const resSummaryText = document.getElementById('resSummaryText');

    let base64Image = null;
    let chartInstance = null;

    // --- 1. Theme Toggle Logic ---
    const savedTheme = localStorage.getItem('texa_theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }

    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        
        themeToggleBtn.innerHTML = isLight ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
        localStorage.setItem('texa_theme', isLight ? 'light' : 'dark');

        if (chartInstance) {
            updateChartTheme();
        }
    });

    // --- 2. Image Selection & Base64 Encoder ---
    dressFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                base64Image = event.target.result;
                imagePreview.src = base64Image;
                uploadPlaceholder.classList.add('hidden');
                previewWrapper.classList.remove('hidden');
                btnAnalyze.disabled = false;
            };
            reader.readAsDataURL(file);
        }
    });

    btnRemove.addEventListener('click', (e) => {
        e.stopPropagation();
        dressFileInput.value = '';
        imagePreview.src = '';
        base64Image = null;
        previewWrapper.classList.add('hidden');
        uploadPlaceholder.classList.remove('hidden');
        btnAnalyze.disabled = true;
        analysisResults.classList.add('hidden');
    });

    // --- 3. Vision AI Quality Analysis Call ---
    btnAnalyze.addEventListener('click', analyzeImageWithAI);

    async function analyzeImageWithAI() {
        if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY.includes("YOUR_OPENROUTER_API_KEY")) {
            const userKey = prompt("Please enter your OpenRouter API Key:");
            if (!userKey) return;
            OPENROUTER_API_KEY = userKey.trim();
        }

        const btnText = btnAnalyze.querySelector('.btn-text');
        btnAnalyze.disabled = true;
        btnText.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Analyzing Image with Vision AI...';

        const systemPrompt = `You are an expert textile scientist and apparel quality inspector.
Your job is to inspect the provided image.

FIRST: Check if the image contains clothing, garments, dress, fabric, yarn, or textiles.
If the image shows non-textile objects (e.g., keyboards, tiles, laptops, animals, furniture, cars, electronics):
Return strictly valid JSON:
{
  "isFabric": false,
  "detectedObject": "keyboard/tile/object name",
  "reason": "Clear explanation that this object is not a garment or textile material."
}

If the image IS a dress, clothing, or fabric:
Return strictly valid JSON:
{
  "isFabric": true,
  "sustainabilityScore": 85,
  "pillingGrade": "Grade 4 / 5",
  "colorFastnessGrade": "Grade 4.5 / 5",
  "moistureWicking": "Fast Dry (15 min)",
  "colorRetentionCurve": [100, 97, 91, 84],
  "shrinkageCurve": [0, 0.6, 1.4, 2.3],
  "summary": "Detailed technical analysis of the weave pattern, material composition, and care tips."
}`;

        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'TexA Dress Analyzer',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'openai/gpt-4o-mini',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        {
                            role: 'user',
                            content: [
                                { type: "text", text: "Analyze this image for dress quality and textile metrics." },
                                { type: "image_url", image_url: { url: base64Image } }
                            ]
                        }
                    ],
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error?.message || `API Error: ${response.status}`);
            }

            const data = await response.json();
            let rawContent = data.choices[0].message.content;
            rawContent = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
            const resultData = JSON.parse(rawContent);

            displayResults(resultData);

        } catch (error) {
            alert('Analysis Error: ' + error.message);
        } finally {
            btnAnalyze.disabled = false;
            btnText.innerHTML = '<i class="fa-solid fa-microscope"></i> Analyze Dress Quality';
        }
    }

    // --- 4. Render Analysis Dashboard ---
    function displayResults(data) {
        analysisResults.classList.remove('hidden');

        if (!data.isFabric) {
            // Rejection View for non-clothing items (Keyboards, Tiles, etc.)
            statusPill.className = "status-pill rejected";
            statusPill.innerHTML = `<span class="pulse-dot"></span> Invalid Image`;

            warningMessage.innerHTML = data.reason || `The uploaded image appears to be a <strong>${data.detectedObject || 'non-fabric object'}</strong> rather than a garment or fabric.`;
            nonFabricWarning.classList.remove('hidden');

            metricsGrid.classList.add('hidden');
            chartCard.classList.add('hidden');

            resSummaryText.textContent = "Unable to generate textile metrics for non-apparel items. Please upload a clear photo of a dress, garment, or fabric weave.";
        } else {
            // Valid Garment Analysis
            statusPill.className = "status-pill";
            statusPill.innerHTML = `<span class="pulse-dot"></span> AI Verified`;

            nonFabricWarning.classList.add('hidden');
            metricsGrid.classList.remove('hidden');
            chartCard.classList.remove('hidden');

            resEcoScore.textContent = `${data.sustainabilityScore || 85} / 100`;
            resPillingGrade.textContent = data.pillingGrade || "Grade 4 / 5";
            resColorFastness.textContent = data.colorFastnessGrade || "Grade 4.5 / 5";
            resWickingRate.textContent = data.moistureWicking || "Fast Dry (15 min)";
            resSummaryText.textContent = data.summary || "High quality textile weave detected.";

            const colorCurve = data.colorRetentionCurve || [100, 98, 92, 85];
            const shrinkageCurve = data.shrinkageCurve || [0, 0.5, 1.2, 2.1];

            renderLifecycleChart(colorCurve, shrinkageCurve);
        }

        analysisResults.scrollIntoView({ behavior: 'smooth' });
    }

    // --- 5. Chart.js Lifecycle Graph ---
    function renderLifecycleChart(colorData, shrinkageData) {
        const ctx = document.getElementById('lifecycleChart').getContext('2d');
        const isLight = document.body.classList.contains('light-theme');
        const textColor = isLight ? '#64748b' : '#94a3b8';
        const gridColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';

        if (chartInstance) {
            chartInstance.destroy();
        }

        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['New', '5 Washes', '20 Washes', '50 Washes'],
                datasets: [
                    {
                        label: 'Color Retention (%)',
                        data: colorData,
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99, 102, 241, 0.15)',
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Shrinkage Rate (%)',
                        data: shrinkageData,
                        borderColor: '#ec4899',
                        backgroundColor: 'rgba(236, 72, 153, 0.15)',
                        fill: true,
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: textColor, font: { family: 'Inter' } }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    },
                    y: {
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    }
                }
            }
        });
    }

    function updateChartTheme() {
        if (!chartInstance) return;
        const isLight = document.body.classList.contains('light-theme');
        const textColor = isLight ? '#64748b' : '#94a3b8';
        const gridColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';

        chartInstance.options.plugins.legend.labels.color = textColor;
        chartInstance.options.scales.x.ticks.color = textColor;
        chartInstance.options.scales.x.grid.color = gridColor;
        chartInstance.options.scales.y.ticks.color = textColor;
        chartInstance.options.scales.y.grid.color = gridColor;
        chartInstance.update();
    }
});
