
let OPENROUTER_API_KEY = "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";

document.addEventListener('DOMContentLoaded', () => {
    let selectedSkinTone = "Fair / Very Light";
    let mediaStream = null;

    const toneReferenceMap = [
        { tone: "Fair / Very Light", rgb: [246, 224, 211] },
        { tone: "Light Warm / Peach", rgb: [227, 186, 151] },
        { tone: "Medium Olive / Warm", rgb: [201, 147, 104] },
        { tone: "Tan / Deep Warm", rgb: [161, 110, 75] },
        { tone: "Dark / Deep Cool", rgb: [104, 70, 43] },
        { tone: "Deep Ebony", rgb: [61, 35, 20] }
    ];

    const paletteCircles = document.querySelectorAll('#skinPalette .color-circle');
    paletteCircles.forEach(circle => {
        circle.addEventListener('click', function() {
            selectToneElement(this);
        });
    });

    function selectToneElement(targetElement) {
        paletteCircles.forEach(c => c.classList.remove('selected'));
        targetElement.classList.add('selected');
        selectedSkinTone = targetElement.getAttribute('data-tone');
    }

    const openCameraBtn = document.getElementById('openCameraBtn');
    const closeCameraBtn = document.getElementById('closeCameraBtn');
    const cameraModal = document.getElementById('cameraModal');
    const cameraVideo = document.getElementById('cameraVideo');
    const captureBtn = document.getElementById('captureBtn');
    const scanCanvas = document.getElementById('scanCanvas');

    openCameraBtn.addEventListener('click', async () => {
        try {
            mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: "user" } },
                audio: false
            });
            cameraVideo.srcObject = mediaStream;
            cameraModal.classList.remove('hidden');
        } catch (err) {
            alert('Unable to access camera: ' + err.message);
        }
    });

    closeCameraBtn.addEventListener('click', stopCamera);

    function stopCamera() {
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }
        cameraModal.classList.add('hidden');
    }

    captureBtn.addEventListener('click', () => {
        if (!cameraVideo.videoWidth || cameraVideo.videoWidth === 0) return;

        const ctx = scanCanvas.getContext('2d');
        scanCanvas.width = cameraVideo.videoWidth;
        scanCanvas.height = cameraVideo.videoHeight;

        ctx.drawImage(cameraVideo, 0, 0, scanCanvas.width, scanCanvas.height);

        const centerX = Math.max(0, Math.floor(scanCanvas.width / 2) - 20);
        const centerY = Math.max(0, Math.floor(scanCanvas.height / 2) - 20);
        const imgData = ctx.getImageData(centerX, centerY, 40, 40).data;

        let totalR = 0, totalG = 0, totalB = 0, count = 0;

        for (let i = 0; i < imgData.length; i += 4) {
            totalR += imgData[i];
            totalG += imgData[i + 1];
            totalB += imgData[i + 2];
            count++;
        }

        if (count === 0) return;

        const avgR = Math.round(totalR / count);
        const avgG = Math.round(totalG / count);
        const avgB = Math.round(totalB / count);

        let bestTone = toneReferenceMap[0].tone;
        let minDistance = Infinity;

        toneReferenceMap.forEach(item => {
            const dist = Math.sqrt(
                Math.pow(avgR - item.rgb[0], 2) +
                Math.pow(avgG - item.rgb[1], 2) +
                Math.pow(avgB - item.rgb[2], 2)
            );
            if (dist < minDistance) {
                minDistance = dist;
                bestTone = item.tone;
            }
        });

        paletteCircles.forEach(circle => {
            if (circle.getAttribute('data-tone') === bestTone) {
                selectToneElement(circle);
            }
        });

        stopCamera();
    });

    const btnGenerate = document.getElementById('btnGenerate');
    btnGenerate.addEventListener('click', getStylistRecommendation);

    async function getStylistRecommendation() {
        if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY.includes("YOUR_OPENROUTER_API_KEY")) {
            const userKey = prompt("Please enter your OpenRouter API Key:");
            if (!userKey) return;
            OPENROUTER_API_KEY = userKey.trim();
        }

        const resultsSection = document.getElementById('resultsSection');
        const resultsList = document.getElementById('resultsList');
        const btnText = btnGenerate.querySelector('.btn-text');

        btnGenerate.disabled = true;
        btnText.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Analyzing & Styling...';
        resultsSection.classList.add('hidden');
        resultsList.innerHTML = '';

        const payloadData = {
            occasion: document.getElementById('occasion').value,
            gender: document.getElementById('gender').value,
            skinTone: selectedSkinTone,
            season: document.getElementById('season').value,
            weather: document.getElementById('weather').value,
            skinConditions: document.getElementById('medicalConditions').value.trim() || "None"
        };

        const systemPrompt = `You are a fashion stylist and skin-aware textile advisor.
Suggest 3 distinct outfit combinations tailored to inputs.
Output strictly valid JSON with this exact structure:
{
  "recommendations": [
    {
      "title": "Outfit Title",
      "matchPercentage": 95,
      "outfitDescription": "Detailed description",
      "colorPalette": [{"name": "Navy Blue", "hex": "#000080"}],
      "recommendedFabrics": ["Cotton"],
      "whyItWorks": "Explanation",
      "skinCareOrComfortTip": "Tip"
    }
  ]
}`;

        const userPrompt = `User Options:
- Gender: ${payloadData.gender}
- Occasion: ${payloadData.occasion}
- Skin Tone / Complexion: ${payloadData.skinTone}
- Season: ${payloadData.season}
- Weather: ${payloadData.weather}
- Skin Conditions / Medical Issues: ${payloadData.skinConditions}`;

        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Tex A Suggestor',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'openai/gpt-4o-mini',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    response_format: { type: "json_object" }
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || `API Error: ${response.status}`);
            }

            const data = await response.json();
            let rawContent = data.choices[0].message.content;
            
            // Cleanup any stray markdown formatting inside the text block
            rawContent = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
            const resultData = JSON.parse(rawContent);

            if (resultData && resultData.recommendations) {
                renderResults(resultData.recommendations);
            } else {
                throw new Error("Invalid response format received from model.");
            }
        } catch (error) {
            alert('Error generating recommendations: ' + error.message);
        } finally {
            btnGenerate.disabled = false;
            btnText.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Get AI Styling Recommendations';
        }
    }

    function renderResults(recommendations) {
        const resultsSection = document.getElementById('resultsSection');
        const resultsList = document.getElementById('resultsList');

        recommendations.forEach(item => {
            const card = document.createElement('div');
            card.className = 'result-card';

            const colorsHtml = (item.colorPalette || []).map(c => `
                <span class="tag">
                    <span class="swatch" style="background-color: ${c.hex || '#ffffff'};"></span>
                    ${c.name || c}
                </span>
            `).join('');

            const fabricsHtml = (item.recommendedFabrics || []).map(f => `
                <span class="tag">${f}</span>
            `).join('');

            card.innerHTML = `
                <div class="result-header-row">
                    <h3>${item.title || 'Recommended Outfit'}</h3>
                    <span class="match-badge">${item.matchPercentage || 90}% Match</span>
                </div>
                <p style="margin-bottom: 0.85rem; color: #e2e8f0; font-size:0.95rem;">${item.outfitDescription || ''}</p>
                
                <div style="margin-bottom: 0.5rem;">
                    <strong style="font-size:0.75rem; color:#94a3b8; text-transform:uppercase;">Colors:</strong> 
                    <div class="tag-list">${colorsHtml}</div>
                </div>
                
                <div style="margin-bottom: 0.5rem;">
                    <strong style="font-size:0.75rem; color:#94a3b8; text-transform:uppercase;">Recommended Fabrics:</strong> 
                    <div class="tag-list">${fabricsHtml}</div>
                </div>

                <p style="font-size:0.9rem; color:#cbd5e1; margin-top:0.75rem; line-height:1.4;">
                    <strong>Why it matches:</strong> ${item.whyItWorks || ''}
                </p>

                ${item.skinCareOrComfortTip ? `
                    <div class="medical-warning">
                        <i class="fa-solid fa-circle-info"></i> <strong>Care & Skin Tip:</strong> ${item.skinCareOrComfortTip}
                    </div>
                ` : ''}
            `;

            resultsList.appendChild(card);
        });

        resultsSection.classList.remove('hidden');
    }
});
